# 可執行的食譜範例 (Runnable Recipe Examples)

此資料夾包含每個食譜的獨立且可執行的 C# 範例。這些是 [基於文件的應用程式 (file-based apps)](https://learn.microsoft.com/dotnet/core/sdk/file-based-apps)，可以直接使用 `dotnet run` 執行。

## 先決條件 (Prerequisites)

- .NET 10.0 或更高版本
- GitHub Copilot SDK 套件 (自動引用)

## 執行範例 (Running Examples)

每個 `.cs` 文件都是一個完整的、可執行的程式。只需使用：

```bash
dotnet run <filename>.cs
```

### 可用食譜 (Available Recipes)

| 食譜 | 命令 | 描述 |
| -------------------- | ------------------------------------ | ------------------------------------------ |
| 錯誤處理 (Error Handling) | `dotnet run error-handling.cs` | 演示錯誤處理模式 |
| 多會話 (Multiple Sessions) | `dotnet run multiple-sessions.cs` | 管理多個獨立的對話 |
| 管理本地文件 (Managing Local Files) ⚠️ | `dotnet run managing-local-files.cs` | 使用 AI 分組整理文件 |
| PR 可視化 (PR Visualization) ℹ️ | `dotnet run pr-visualization.cs` | 生成 PR 存續時間圖表 |
| 持久化會話 (Persisting Sessions) | `dotnet run persisting-sessions.cs` | 在重啟後保存並恢復會話 |
| 無障礙報告 (Accessibility Report) ℹ️ | `dotnet run accessibility-report.cs` | 分析網頁無障礙性 |
| Ralph 循環 (Ralph Loop) ⚠️ | `dotnet run ralph-loop.cs` | 自主開發循環 |

### 帶參數的範例 (Examples with Arguments)

**PR 可視化 (特定存儲庫):**

```bash
dotnet run pr-visualization.cs -- --repo github/copilot-sdk
```

**管理本地文件 (編輯文件以更改目標資料夾):**

```bash
# 首先編輯 managing-local-files.cs 中的 targetFolder 變量
dotnet run managing-local-files.cs
```

## 安全與先決條件 (Safety & Prerequisites)

某些食譜具有副作用或外部依賴項。展開各個部分以了解安全的測試模式和先決條件。

<details>
<summary><strong>⚠️ 管理本地文件 (Managing Local Files)</strong> — 修改您的文件系統</summary>

在實際目錄上執行之前，請先在副本上進行測試。
從此食譜目錄執行這些片段，以便在切換到臨時資料夾之前捕獲食譜路徑。

**PowerShell:**
```powershell
$recipeDir = (Get-Location).Path
$tempDir = New-Item -ItemType Directory -Path ([IO.Path]::Combine([IO.Path]::GetTempPath(), "copilot-test-files"))
@("document1.txt", "image1.png", "data.json") | ForEach-Object { 
    New-Item -Path "$tempDir/$_" -ItemType File
}
cd $tempDir
dotnet run "$recipeDir/managing-local-files.cs"
# 檢查結果，然後清理
Remove-Item $tempDir -Recurse
```

**Bash:**
```bash
recipeDir=$(pwd)
tempDir=$(mktemp -d)
touch "$tempDir"/{document1.txt,image1.png,data.json}
cd "$tempDir"
dotnet run "$recipeDir/managing-local-files.cs"
# 檢查結果，然後清理
rm -rf "$tempDir"
```

在執行之前，請編輯 `.cs` 文件中的 `targetFolder` 變量以指向您的測試目錄。
</details>

<details>
<summary><strong>⚠️ Ralph 循環 (Ralph Loop)</strong> — 創建 git 提交並修改文件</summary>

務必先在隔離的 git 存儲庫中執行以驗證行為。
從此食譜目錄執行這些片段，以便在切換到臨時存儲庫之前捕獲食譜路徑。

**PowerShell:**
```powershell
$recipeDir = (Get-Location).Path
$tempDir = New-Item -ItemType Directory -Path ([IO.Path]::Combine([IO.Path]::GetTempPath(), "copilot-test-repo"))
cd $tempDir
git init
git config user.email "test@example.com"
git config user.name "Test User"

# 創建一個供食譜使用的 PROMPT_task.md
"# Task`nCreate a simple README" | Out-File PROMPT_task.md
dotnet run "$recipeDir/ralph-loop.cs"

# 審查提交和更改
git log --oneline
git diff

# 清理
cd ..
Remove-Item $tempDir -Recurse
```

**Bash:**
```bash
recipeDir=$(pwd)
tempDir=$(mktemp -d)
cd "$tempDir"
git init
git config user.email "test@example.com"
git config user.name "Test User"

# 創建一個供食譜使用的 PROMPT_task.md
echo -e "# Task\nCreate a simple README" > PROMPT_task.md
dotnet run "$recipeDir/ralph-loop.cs"

# 審查提交和更改
git log --oneline
git diff

# 清理
cd ..
rm -rf "$tempDir"
```

該食譜需要一個至少包含一個 `PROMPT_*.md` 文件的 git 存儲庫，並且將無限循環執行直到手動停止。
</details>

<details>
<summary><strong>ℹ️ 無障礙報告 (Accessibility Report)</strong> — 需要 Playwright MCP</summary>

此食譜需要安裝並可用 Playwright MCP：

```bash
npm install -g @playwright/mcp
```

或讓 Node Package Manager 按需安裝。食譜將嘗試自動啟動 `npx @playwright/mcp`。正常執行食譜：

```bash
dotnet run accessibility-report.cs
```

食譜將提示您輸入要分析的 URL 並生成無障礙報告。
</details>

<details>
<summary><strong>ℹ️ PR 可視化 (PR Visualization)</strong> — 需要 GitHub API 訪問權限</summary>

此食譜需要：

- 訪問 GitHub 存儲庫 (公開或私有，具有適當的憑據)
- 已安裝並經過身份驗證的 `gh` CLI 工具：https://cli.github.com/

使用存儲庫參數執行：

```bash
dotnet run pr-visualization.cs -- --repo owner/repo-name
```

範例：

```bash
dotnet run pr-visualization.cs -- --repo github/copilot-sdk
```

**注意：** GitHub API 請求受速率限制。大型存儲庫或頻繁執行可能會達到速率限制。有關詳細信息，請參閱 [GitHub API 速率限制](https://docs.github.com/rest/overview/rate-limits-for-the-rest-api)。
</details>

## 基於文件的應用程式 (File-Based Apps)

這些範例使用 .NET 的基於文件的應用程式功能，該功能允許單個文件的 C# 程式：

- 在沒有項目文件的情況下執行
- 自動引用常用套件
- 支持最上層語句 (top-level statements)

## 學習資源 (Learning Resources)

- [.NET 基於文件的應用程式文件](https://learn.microsoft.com/en-us/dotnet/core/sdk/file-based-apps)
- [GitHub Copilot SDK 文件](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md)
- [父級食譜 (Parent Cookbook)](../README.md)
