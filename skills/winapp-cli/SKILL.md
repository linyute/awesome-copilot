---
name: winapp-cli
description: 'Windows 應用程式開發 CLI (winapp)，用於建構、打包與部署 Windows 應用程式。當需要初始化 Windows 應用程式專案、建立 MSIX 套件、產生 AppxManifest.xml、管理開發憑證、為除錯加入套件身分、簽署套件、發佈至 Microsoft Store、建立外部目錄或存取 Windows SDK 建構工具時使用。支援 .NET (csproj)、C++、Electron、Rust、Tauri 以及針對 Windows 的跨平台框架。'
---

# Windows 應用程式開發 CLI (Windows App Development CLI)

Windows 應用程式開發 CLI (`winapp`) 是一個命令列介面，用於管理 Windows SDK、MSIX 打包、產生應用程式身分、資訊清單、憑證，以及搭配任何應用程式框架使用建構工具。它彌補了跨平台開發與 Windows 原生能力之間的差距。

## 何時使用此技能 (When to Use This Skill)

在您需要執行下列操作時使用此技能：

- 使用 SDK 設定、資訊清單與憑證初始化 Windows 應用程式專案
- 從應用程式目錄建立 MSIX 套件
- 產生或管理 AppxManifest.xml 檔案
- 建立並安裝用於簽署的開發憑證
- 為除錯 Windows API 加入套件身分 (Package Identity)
- 簽署 MSIX 套件或執行檔
- 從任何框架存取 Windows SDK 建構工具
- 使用跨平台框架 (Electron, Rust, Tauri, Qt) 建構 Windows 應用程式
- 為 Windows 應用程式部署設定 CI/CD 管線 (pipelines)
- 存取需要套件身分的 Windows API (通知、Windows AI、Shell 整合)
- 透過 `winapp store` 將應用程式發佈至 Microsoft Store
- 為資產管理建立外部目錄
- 透過 NuGet 為 .NET (csproj) 專案設定 Windows App SDK

## 前置作業 (Prerequisites)

- Windows 10 或更新版本
- 透過下列其中一種方式安裝 winapp CLI：
  - **WinGet**：`winget install Microsoft.WinAppCli --source winget`
  - **NPM** (適用於 Electron)：`npm install @microsoft/winappcli --save-dev`
  - **GitHub Actions/Azure DevOps**：使用 [setup-WinAppCli](https://github.com/microsoft/setup-WinAppCli) 動作
  - **手動**：從 [GitHub Releases](https://github.com/microsoft/WinAppCli/releases/latest) 下載

## 核心能力 (Core Capabilities)

### 1. 專案初始化 (`winapp init`)

使用建構現代 Windows 應用程式所需的資產 (資訊清單、憑證、函式庫) 初始化目錄。支援 SDK 安裝模式：`stable` (穩定)、`preview` (預覽)、`experimental` (實驗性) 或 `none` (無)。

### 2. MSIX 打包 (`winapp pack`)

從準備好的目錄建立 MSIX 套件，並提供選用的簽署、憑證產生與自包含 (self-contained) 部署統合功能。

### 3. 用於除錯的套件身分 (`winapp create-debug-identity`)

為執行檔加入臨時套件身分，以便在無需完整打包的情況下除錯需要身分的 Windows API (通知、Windows AI、Shell 整合)。

### 4. 資訊清單管理 (`winapp manifest`)

產生 AppxManifest.xml 檔案，並從來源圖片更新圖片資產，自動建立所有需要的尺寸與長寬比。支援用於動態內容的資訊清單預留位置 (placeholders)，以及在 AppxManifest 中使用限定名稱 (qualified names) 以提供彈性的應用程式身分定義。

### 5. 憑證管理 (`winapp cert`)

產生開發憑證並將其安裝至本機電腦存放區，以便用於簽署套件。

### 6. 套件簽署 (`winapp sign`)

使用 PFX 憑證簽署 MSIX 套件與執行檔，具備選用的時間戳記伺服器 (timestamp server) 支援。

### 7. 存取 SDK 建構工具 (`winapp tool`)

在任何框架或建構系統中，以正確配置的路徑執行 Windows SDK 建構工具。

### 8. Microsoft Store 整合 (`winapp store`)

直接從 winapp 執行 Microsoft Store 開發者 CLI 指令，無需離開 CLI 即可執行商店提交、套件驗證與發佈工作流程。

### 9. 建立外部目錄 (`winapp create-external-catalog`)

建立外部目錄以簡化開發者的資產管理，將目錄資料與主套件分離。

## 使用範例 (Usage Examples)

### 範例 1：初始化並打包 Windows 應用程式

```bash
# 使用預設值初始化工作區
winapp init
# 註：init 不再自動產生憑證 (v0.2.0+)。請明確產生一個：
winapp cert generate

# 建構您的應用程式 (依框架而定)
# ...

# 建立已簽署的 MSIX 套件
winapp pack ./build-output --generate-cert --output MyApp.msix
```

### 範例 2：使用套件身分進行除錯

```bash
# 為執行檔加入除錯身分以測試 Windows API
winapp create-debug-identity ./bin/MyApp.exe

# 執行您的應用程式 - 它現在具備套件身分了
./bin/MyApp.exe
```

### 範例 3：CI/CD 管線設定

```yaml
# GitHub Actions 範例
- name: Setup winapp CLI
  uses: microsoft/setup-WinAppCli@v1

- name: Initialize and Package
  run: |
    winapp init --no-prompt
    winapp pack ./build-output --output MyApp.msix
```

### 範例 4：Electron 應用程式整合

```bash
# 透過 npm 安裝
npm install @microsoft/winappcli --save-dev

# 初始化並為 Electron 加入除錯身分
npx winapp init
npx winapp node add-electron-debug-identity

# 打包以供分發
npx winapp pack ./out --output MyElectronApp.msix
```

## 指引 (Guidelines)

1. **先執行 `winapp init`** — 務必在執行其他指令前先初始化您的專案，以確保 SDK 設定與資訊清單已設定完成。註：自 v0.2.0 起，`winapp init` 不再自動產生開發憑證。當您需要使用開發憑證簽署時，請明確執行 `winapp cert generate`。
2. **在變更資訊清單後重新執行 `create-debug-identity`** — 每當 AppxManifest.xml 修改後，都必須重新建立套件身分。
3. **為 CI/CD 使用 `--no-prompt`** — 透過使用預設值來防止自動化管線中的互動式提示。
4. **為共用專案使用 `winapp restore`** — 在不同機器上重建 `winapp.yaml` 中定義的確切環境狀態。
5. **從單一圖片產生資產** — 使用 `winapp manifest update-assets` 並提供一個標誌 (logo) 來產生所有需要的圖示尺寸。

## 常見模式 (Common Patterns)

### 模式：初始化新專案

```bash
cd my-project
winapp init
# 建立：AppxManifest.xml, SDK 設定, winapp.yaml
# 註：.NET (csproj) 專案會跳過 winapp.yaml，直接在 .csproj 中設定 NuGet 套件

# 明確產生開發簽署憑證 (不再由 init 自動執行)
winapp cert generate
```

### 模式：使用現有憑證打包

```bash
winapp pack ./build-output --cert ./mycert.pfx --cert-password secret --output MyApp.msix
```

### 模式：自包含部署 (Self-Contained Deployment)

```bash
# 將 Windows App SDK 執行階段與套件統合 (bundle)
winapp pack ./my-app --self-contained --generate-cert
```

### 模式：更新套件版本

```bash
# 更新至最新穩定版本 SDK
winapp update

# 或更新至預覽版本 SDK
winapp update --setup-sdks preview
```

## 限制 (Limitations)

- 需要 Windows 10 或更新版本 (僅限 Windows 的 CLI)
- 套件身分除錯需要在任何資訊清單變更後重新執行 `create-debug-identity`
- 自包含部署會因為統合 Windows App SDK 執行階段而增加套件大小
- 開發憑證僅供測試使用；正式環境需要受信任的憑證
- 部分 Windows API 需要在資訊清單中進行特定的能力宣告 (capability declarations)
- `winapp init` 不再自動產生憑證 (v0.2.0+)；請明確執行 `winapp cert generate`
- .NET (csproj) 專案會跳過 `winapp.yaml`；SDK 套件直接在專案檔案中設定
- winapp CLI 使用 NuGet 全域快取來儲存套件 (而非 `%userprofile%/.winapp/packages`)
- winapp CLI 目前處於公開預覽階段，且可能會有所變動

## 套件身分啟用的 Windows API (Windows APIs Enabled by Package Identity)

套件身分解鎖了強大 Windows API 的存取權限：

| API 類別 | 範例 |
| ------------ | -------- |
| **通知 (Notifications)** | 互動式原生通知、通知管理 |
| **Windows AI** | 裝置端大型語言模型 (LLM)、文字/圖片 AI API (Phi Silica, Windows ML) |
| **Shell 整合** | 檔案總管 (Explorer)、工作列 (Taskbar)、分享介面 (Share sheet) 整合 |
| **通訊協定處理常式 (Protocol Handlers)** | 自訂 URI 配置 (`yourapp://`) |
| **裝置存取** | 相機、麥克風、位置資訊 (需經同意) |
| **背景工作 (Background Tasks)** | 在應用程式關閉時執行 |
| **檔案關聯 (File Associations)** | 使用您的應用程式開啟特定檔案類型 |

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
| ----- | -------- |
| 憑證不受信任 | 執行 `winapp cert install <憑證路徑>` 以安裝至本機電腦存放區 |
| 套件身分無效 | 在任何資訊清單變更後執行 `winapp create-debug-identity` |
| 找不到 SDK | 執行 `winapp restore` 或 `winapp update` 以確保 SDK 已安裝 |
| 簽署失敗 | 驗證憑證密碼並確保憑證未過期 |

## 參考資料 (References)

- [GitHub 儲存庫](https://github.com/microsoft/WinAppCli)
- [完整 CLI 文件](https://github.com/microsoft/WinAppCli/blob/main/docs/usage.md)
- [.NET 專案指南](https://github.com/microsoft/WinAppCli/blob/main/docs/guides/dotnet.md)
- [範例應用程式](https://github.com/microsoft/WinAppCli/tree/main/samples)
- [Windows App SDK](https://learn.microsoft.com/windows/apps/windows-app-sdk/)
- [MSIX 打包概觀](https://learn.microsoft.com/windows/msix/overview)
- [套件身分概觀](https://learn.microsoft.com/windows/apps/desktop/modernize/package-identity-overview)
