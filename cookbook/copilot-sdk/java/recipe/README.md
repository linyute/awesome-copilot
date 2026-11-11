# 可執行的食譜範例 (Runnable Recipe Examples)

此資料夾包含每個 cookbook 食譜的獨立、可執行 Java 範例。每個檔案都可以直接使用 [JBang](https://www.jbang.dev/) 執行 — 不需要專案設定。

## 先決條件

- Java 17 或更新版本
- 在執行模型請求之前已設定 GitHub Copilot 驗證
- Microsoft Copilot SDK for Java 1.0.21（自動從 `//DEPS` 解析；原始碼保留在現有的 GitHub SDK 存放庫中）
- 已安裝 JBang：

```bash
# macOS (使用 Homebrew)
brew install jbangdev/tap/jbang

# Linux/macOS (使用 curl)
curl -Ls https://sh.jbang.dev | bash -s - app setup

# Windows (使用 Scoop)
scoop install jbang
```

其他安裝方法請參閱 [JBang 安裝指南](https://www.jbang.dev/download/)。

預設的子行程傳輸會從平台的 runtime-classifier
JAR 繁衍 `copilot-runtime`（在 Windows 上為 `copilot-runtime.exe`）
包裝函式。透過 JBang 的 `--deps` 選項新增
`com.github:copilot-sdk-java-runtime:1.0.21:<classifier>`（已發行的
分類器請參閱[行程內執行階段](../in-process-runtime.md#先決條件)）。此傳輸不需要 JNA。

或者，明確選擇外部 Copilot CLI 執行檔。
單獨在 `PATH` 上擁有 `copilot` 是不夠的。對於這些食譜，
請在啟動 Java 之前設定 `COPILOT_CLI_PATH`：

```bash
export COPILOT_CLI_PATH="$(command -v copilot)"
```

```powershell
Get-Command copilot -ErrorAction Stop | Out-Null
$env:COPILOT_CLI_PATH = "copilot"
```

在 Windows 上，請保留純命令名稱，以便 SDK 解析原生執行檔
或透過 `cmd /c` 啟動 npm CMD shim。請勿傳遞 PowerShell 的
`Get-Command` 所傳回的絕對路徑：它可能指向 `copilot.ps1`，
而 Java 的 `ProcessBuilder` 無法直接執行該檔案。

應用程式也可以改為使用 `CopilotClientOptions.setCliPath(...)`
（包括 `setCliPath("copilot")` 以選擇已安裝在 PATH 上的執行檔）。
對於子行程執行檔選擇，程式化路徑優先於
`COPILOT_CLI_PATH`，而後者又優先於分類器提供的包裝函式。
在子行程模式下，外部 CLI 取代了對 runtime-classifier JAR 的需求。
在提出模型請求之前，請設定支援的驗證來源；
不需要特定認證檔案，且 `COPILOT_HOME` 是選用的。

行程內食譜對同一個 runtime-classifier JAR 的使用方式有所不同：
它透過 JNA 載入 `runtime.node` 原生函式庫，而不是繁衍包裝函式。
JNA 必須明確宣告，且在此處使用 5.19.1 進行測試。此傳輸
既不需要外部 CLI，也不需要獨立的執行階段行程。包含
SDK、相符的 runtime-classifier JAR 與 JNA 的類別路徑可以支援任一傳輸；
僅新增這些相依性並不會選擇行程內模式。這些執行階段與
驗證規則也適用於 Maven/Gradle 應用程式。

## 執行範例

每個 `.java` 檔案都是一個完整、可執行的程式。只需使用：

```bash
jbang <FileName>.java
```

### 可用食譜

| 食譜                 | 命令                                 | 說明                                       |
| -------------------- | ------------------------------------ | ------------------------------------------ |
| 錯誤處理             | `jbang ErrorHandling.java`           | 示範錯誤處理模式                           |
| 多個工作階段         | `jbang MultipleSessions.java`        | 管理多個獨立對話                           |
| 管理本機檔案         | `jbang ManagingLocalFiles.java`      | 預覽檔案組織；請參閱安全注意事項           |
| PR 視覺化            | `jbang PRVisualization.java`         | 產生 PR 存在時間圖表；需要 GitHub 存取權限 |
| 保存工作階段         | `jbang PersistingSessions.java`      | 跨重新啟動儲存與恢復工作階段               |
| Ralph 迴圈           | `jbang RalphLoop.java`               | 自主 AI 任務迴圈；修改檔案並可能提交       |
| 無障礙存取報告       | `jbang AccessibilityReport.java`     | WCAG 報告；需要 Node.js 與 Playwright MCP  |
| 行程內執行階段       | `jbang --deps com.github:copilot-sdk-java-runtime:1.0.21:linux-x64 InProcessRuntime.java` | 原生執行階段；選擇您的平台分類器           |

### 帶有引數的範例

**指定存放庫的 PR 視覺化：**

```bash
jbang PRVisualization.java github/copilot-sdk
```

**指定資料夾的管理本機檔案：**

```bash
jbang ManagingLocalFiles.java /path/to/your/folder
```

**使用自訂提示詞檔案的 Ralph 迴圈：**

```bash
jbang RalphLoop.java PROMPT_build.md 20
```

## 安全性與先決條件

這些範例僅在隔離、受信任的示範中使用 `PermissionHandler.APPROVE_ALL`。
這會授予代理人不需詢問您即可使用工具的權限；
在處理不受信任的提示詞或工作區之前，請將其替換為限制性處理常式。

<details>
<summary><strong>管理本機檔案</strong> - 在拋棄式複本上測試</summary>

可執行的範例請求預覽，並明確告訴模型不要移動
檔案。該提示詞並非檔案系統安全邊界，尤其是在改編
食譜以執行移動作業時。請先使用該目錄的複本。
從此食譜目錄執行以下命令：

```bash
recipeDir=$(pwd)
tempDir=$(mktemp -d)
touch "$tempDir/document1.txt" "$tempDir/image1.png" "$tempDir/data.json"
jbang "$recipeDir/ManagingLocalFiles.java" "$tempDir"
# 在真實目錄上測試之前，請先檢查計劃與檔案。
```

```powershell
$recipeDir = (Get-Location).Path
$tempDir = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir | Out-Null
"document1.txt", "image1.png", "data.json" | ForEach-Object {
    New-Item -ItemType File -Path (Join-Path $tempDir $_) | Out-Null
}
jbang "$recipeDir/ManagingLocalFiles.java" "$tempDir"
# 在真實目錄上測試之前，請先檢查計劃與檔案。
```

命令列引數選擇目標目錄。如果沒有此引數，此範例
會使用系統暫存目錄內的 `example-files` 資料夾。
</details>

<details>
<summary><strong>Ralph 迴圈</strong> - 修改檔案並可能建立認可</summary>

在檢閱其行為之前，請僅在隔離的存放庫中執行該迴圈。
它預設讀取 `PROMPT.md` 並執行最多 50 次反覆運算；傳入提示詞
路徑與較小的反覆運算限制以進行測試。
從此食譜目錄執行以下命令：

```bash
recipeDir=$(pwd)
tempDir=$(mktemp -d)
cd "$tempDir"
git init
printf '# Task\nCreate a small README. Do not commit changes.\n' > PROMPT.md
jbang "$recipeDir/RalphLoop.java" PROMPT.md 1
git status --short
git diff
cd "$recipeDir"
```

```powershell
$recipeDir = (Get-Location).Path
$tempDir = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir | Out-Null
Push-Location $tempDir
try {
    git init
    "# Task`nCreate a small README. Do not commit changes." | Set-Content PROMPT.md
    jbang "$recipeDir/RalphLoop.java" PROMPT.md 1
    git status --short
    git diff
} finally {
    Pop-Location
}
```

在移除測試存放庫之前，請檢閱任何編輯或認可。全新的 SDK
工作階段隔離模型內容，而非檔案系統存取。
</details>

<details>
<summary><strong>無障礙存取報告</strong> - 需要 Playwright MCP</summary>

安裝 Node.js 以便 `npx` 可用。此食譜會根據需求啟動
`npx @playwright/mcp@latest`；不需要全域 MCP 安裝。
首次執行時請預留套件解析與瀏覽器設定的時間。

```bash
jbang AccessibilityReport.java
```

此食譜會提示輸入 URL，並可在報告產生後建立 Playwright 測試。
</details>

<details>
<summary><strong>PR 視覺化</strong> - 需要 GitHub API 存取權限</summary>

設定 Copilot CLI 的 GitHub MCP 伺服器，並針對您想要
分析的存放庫進行驗證。私有存放庫需要適當的存取權限。
GitHub API 請求受限於
[速率限制](https://docs.github.com/rest/overview/rate-limits-for-the-rest-api)。
代理人可以執行圖表產生程式碼並將影像寫入工作目錄。

```bash
jbang PRVisualization.java github/copilot-sdk
```

此 Java 食譜接受 `owner/repo` 作為位置引數，這與 .NET
食譜的 `--repo` 選項不同。如果沒有引數，它會嘗試目前的 Git 遠端，
然後提示輸入存放庫。已啟用工具搜尋，延遲閾值為
20 個工具。
</details>

<details>
<summary><strong>行程內執行階段</strong> - 需要原生相依性</summary>

為您的作業系統與架構選擇分類器。例如，
在 Apple Silicon 上，檢查原生啟動以及透過 FFI 的
行程內 Ping 來回行程，而無需驗證或提出模型請求：

```bash
jbang --deps com.github:copilot-sdk-java-runtime:1.0.21:darwin-arm64 InProcessRuntime.java --ping
```

然後食譜會練習正常的用戶端關閉路徑；這並不能證明
每個原生拆除階段都已成功。省略 `--ping` 以建立工作階段
並傳送問候語。有關相依性、實驗性 API
選擇加入、已發行的平台分類器、已測試的涵蓋範圍與全行程限制，請參閱
[行程內執行階段](../in-process-runtime.md)。
</details>

## 為什麼選擇 JBang？

JBang 讓您可以將 Java 檔案作為指令碼執行 — 不需要 `pom.xml`，不需要 `build.gradle`，不需要專案樣板。相依性透過 `//DEPS` 註解以內嵌方式宣告並自動解析。

## 學習資源

- [JBang 文件](https://www.jbang.dev/documentation/guide/latest/)
- [Microsoft Copilot SDK for Java 文件](https://github.com/github/copilot-sdk/tree/main/java)
- [GitHub Copilot CLI](https://github.com/features/copilot/cli)
- [上層 Cookbook](../README.md)
