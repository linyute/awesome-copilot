---
name: winapp-cli
description: 'Windows 應用程式開發 CLI (winapp)，用於建構、封裝和部署 Windows 應用程式。當被要求初始化 Windows 應用程式專案、建立 MSIX 封裝、產生 AppxManifest.xml、管理開發憑證、新增用於偵錯的封裝識別碼、簽署封裝或存取 Windows SDK 建構工具時使用。支援針對 Windows 的 .NET、C++、Electron、Rust、Tauri 和跨平台框架。'
---

# Windows 應用程式開發 CLI

Windows 應用程式開發 CLI (`winapp`) 是一個命令列介面，用於管理 Windows SDK、MSIX 封裝、產生應用程式識別碼、資訊清單 (Manifest)、憑證，以及在任何應用程式框架中使用建構工具。它彌補了跨平台開發與 Windows 原生能力之間的差距。

## 何時使用此技能

當您需要執行以下操作時，請使用此技能：

- 初始化具有 SDK 設定、資訊清單和憑證的 Windows 應用程式專案
- 從應用程式目錄建立 MSIX 封裝
- 產生或管理 AppxManifest.xml 檔案
- 建立並安裝用於簽署的開發憑證
- 新增封裝識別碼以偵錯 Windows API
- 簽署 MSIX 封裝或執行檔
- 從任何框架或建構系統存取 Windows SDK 建構工具
- 使用跨平台框架 (Electron, Rust, Tauri, Qt) 建構 Windows 應用程式
- 為 Windows 應用程式部署設定 CI/CD 管道
- 存取需要封裝識別碼的 Windows API (通知、Windows AI、Shell 整合)

## 先決條件

- Windows 10 或更高版本
- 透過以下其中一種方法安裝 winapp CLI：
  - **WinGet**：`winget install Microsoft.WinAppCli --source winget`
  - **NPM** (用於 Electron)：`npm install @microsoft/winappcli --save-dev`
  - **GitHub Actions/Azure DevOps**：使用 [setup-WinAppCli](https://github.com/microsoft/setup-WinAppCli) Action
  - **手動**：從 [GitHub Releases](https://github.com/microsoft/WinAppCli/releases/latest) 下載

## 核心能力

### 1. 專案初始化 (`winapp init`)

初始化目錄並包含所需的資產 (資訊清單、憑證、函式庫)，用於建構現代 Windows 應用程式。支援 SDK 安裝模式：`stable`、`preview`、`experimental` 或 `none`。

### 2. MSIX 封裝 (`winapp pack`)

從準備好的目錄建立 MSIX 封裝，並提供選用的簽署、憑證產生和獨立部署組合功能。

### 3. 用於偵錯的封裝識別碼 (`winapp create-debug-identity`)

為執行檔新增臨時封裝識別碼，以便在無需完整封裝的情況下偵錯需要識別碼的 Windows API (通知、Windows AI、Shell 整合)。

### 4. 資訊清單管理 (`winapp manifest`)

產生 AppxManifest.xml 檔案，並從來源圖片更新圖片資產，自動建立所有需要的尺寸和長寬比。

### 5. 憑證管理 (`winapp cert`)

產生開發憑證並將其安裝到本機電腦存放區，以便簽署封裝。

### 6. 封裝簽署 (`winapp sign`)

使用 PFX 憑證簽署 MSIX 封裝和執行檔，並提供選用的時間戳記伺服器支援。

### 7. SDK 建構工具存取 (`winapp tool`)

從任何框架或建構系統執行配置正確路徑的 Windows SDK 建構工具。

## 用法範例

### 範例 1：初始化並封裝 Windows 應用程式

```bash
# 使用預設值初始化工作區
winapp init

# 建構您的應用程式 (視框架而定)
# ...

# 建立已簽署的 MSIX 封裝
winapp pack ./build-output --generate-cert --output MyApp.msix
```

### 範例 2：使用封裝識別碼進行偵錯

```bash
# 為執行檔新增偵錯識別碼以測試 Windows API
winapp create-debug-identity ./bin/MyApp.exe

# 執行您的應用程式 - 它現在具有封裝識別碼
./bin/MyApp.exe
```

### 範例 3：CI/CD 管道設定

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

# 為 Electron 初始化並新增偵錯識別碼
npx winapp init
npx winapp node add-electron-debug-identity

# 封裝以進行發佈
npx winapp pack ./out --output MyElectronApp.msix
```

## 指導方針

1. **先執行 `winapp init`** — 在使用其他指令之前，務必先初始化您的專案，以確保 SDK 設定、資訊清單和憑證已配置。
2. **在資訊清單變更後重新執行 `create-debug-identity`** — 每當修改 AppxManifest.xml 時，都必須重新建立封裝識別碼。
3. **在 CI/CD 中使用 `--no-prompt`** — 透過使用預設值，防止在自動化管道中出現互動式提示。
4. **對共享專案使用 `winapp restore`** — 在不同機器上重建 `winapp.yaml` 中定義的確切環境狀態。
5. **從單張圖片產生資產** — 使用 `winapp manifest update-assets` 並搭配一個標誌 (logo) 來產生所有需要的圖示尺寸。

## 常見模式

### 模式：初始化新專案

```bash
cd my-project
winapp init
# 建立：AppxManifest.xml, 開發憑證, SDK 配置, winapp.yaml
```

### 模式：使用現有憑證封裝

```bash
winapp pack ./build-output --cert ./mycert.pfx --cert-password secret --output MyApp.msix
```

### 模式：獨立部署 (Self-Contained Deployment)

```bash
# 將 Windows App SDK 執行階段與封裝組合在一起
winapp pack ./my-app --self-contained --generate-cert
```

### 模式：更新封裝版本

```bash
# 更新至最新的穩定版 SDK
winapp update

# 或更新至預覽版 (preview) SDK
winapp update --setup-sdks preview
```

## 限制

- 需要 Windows 10 或更高版本 (僅限 Windows 的 CLI)
- 封裝識別碼偵錯需要在任何資訊清單變更後重新執行 `create-debug-identity`
- 獨立部署會因組合 Windows App SDK 執行階段而增加封裝大小
- 開發憑證僅供測試使用；正式環境需要受信任的憑證
- 某些 Windows API 需要在資訊清單中宣告特定的能力 (Capability)
- winapp CLI 目前處於公開預覽階段，且可能會有所變動

## 透過封裝識別碼啟用的 Windows API

封裝識別碼解鎖了強大 Windows API 的存取權限：

| API 類別 | 範例 |
| ------------ | -------- |
| **通知** | 互動式原生通知、通知管理 |
| **Windows AI** | 裝置端 LLM、文字/圖片 AI API (Phi Silica, Windows ML) |
| **Shell 整合** | 檔案總管 (Explorer)、工作列、分享選單 (Share sheet) 整合 |
| **協定處理常式** | 自定義 URI 配置 (`yourapp://`) |
| **裝置存取** | 相機、麥克風、位置 (需經同意) |
| **背景工作** | 在應用程式關閉時執行 |
| **檔案關聯** | 使用您的應用程式開啟特定檔案類型 |

## 疑難排解

| 問題 | 解決方案 |
| ----- | -------- |
| 憑證不受信任 | 執行 `winapp cert install <憑證路徑>` 以安裝到本機電腦存放區 |
| 封裝識別碼失效 | 在任何資訊清單變更後重新執行 `winapp create-debug-identity` |
| 找不到 SDK | 執行 `winapp restore` 或 `winapp update` 以確保已安裝 SDK |
| 簽署失敗 | 驗證憑證密碼並確保憑證未過期 |

## 參考資料

- [GitHub 套件庫](https://github.com/microsoft/WinAppCli)
- [完整 CLI 文件](https://github.com/microsoft/WinAppCli/blob/main/docs/usage.md)
- [範例應用程式](https://github.com/microsoft/WinAppCli/tree/main/samples)
- [Windows App SDK](https://learn.microsoft.com/windows/apps/windows-app-sdk/)
- [MSIX 封裝概覽](https://learn.microsoft.com/windows/msix/overview)
- [封裝識別碼概覽](https://learn.microsoft.com/windows/apps/desktop/modernize/package-identity-overview)
