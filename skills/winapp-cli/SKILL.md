---
name: winapp-cli
description: 'Windows 應用程式開發 CLI (winapp)，用於建構、封裝、簽署、偵錯與 UI 自動化 Windows 應用程式。當被要求初始化 Windows 應用程式專案、建立 MSIX 套件、管理 AppxManifest.xml 或開發憑證、以封裝形式執行應用程式進行偵錯、透過 Microsoft UI Automation 自動化 Windows UI、發佈至 Microsoft Store 或存取 Windows SDK 建構工具時使用。涵蓋 init, pack, run, unregister, manifest, cert, sign, store, ui 與 tool 等指令。支援 .NET (csproj), C++, Electron, Rust, Tauri, Flutter 與其他 Windows 框架。'
---

# Windows 應用程式開發 CLI (Windows App Development CLI)

`winapp` 管理 Windows SDK、MSIX 封裝、應用程式識別 (identity)、資訊清單 (manifests)、憑證、簽署、Store 發佈以及 UI 自動化，適用於任何針對 Windows 的框架（.NET/csproj, C++, Electron, Rust, Tauri, Flutter 等）。公開預覽版 — 可能有所變動。

## 先決條件 (Prerequisites)

- Windows 10 或更高版本
- 透過以下其中一種方式安裝：
  - WinGet：`winget install Microsoft.WinAppCli --source winget`
  - npm (Electron/Node)：`npm install @microsoft/winappcli --save-dev`
  - CI：[`setup-WinAppCli`](https://github.com/microsoft/setup-WinAppCli) GitHub Action
  - 手動：[GitHub Releases](https://github.com/microsoft/WinAppCli/releases/latest)

## 指令 (Commands)

| 指令 | 用途 |
| ------- | ------- |
| `init` | 初始化專案：SDK（`stable`/`preview`/`experimental`/`none`）、資訊清單、`winapp.yaml`。**`.csproj` 專案會跳過 `winapp.yaml`** 並直接使用 NuGet。**不會自動產生憑證** (v0.2.0+)。 |
| `restore` / `update` | 還原或更新 SDK 套件版本（針對預覽版 SDK 使用 `--setup-sdks preview`）。 |
| `pack <dir>` | 建構 MSIX。旗標：`--generate-cert`, `--cert <pfx> --cert-password`, `--self-contained`（綑綁 WinAppSDK 執行階段）、`--output`。從 `.winmd` 自動探索第三方 WinRT 組件 (v0.2.1+)。 |
| `run <dir> [-- <app args>]` | 封裝為鬆散配置 (loose layout) 並作為封裝應用程式啟動 — 非常適合 IDE F5 偵錯，且無需產生 MSIX。支援透過 `--` 傳遞參數 (v0.3.1+)。 (v0.3.0+) |
| `create-debug-identity <exe>` | 為 exe 新增稀疏套件識別 (sparse package identity)，以便其在無需完整封裝的情況下即可呼叫受識別限制的 API（通知、Windows AI、Shell 整合）。 |
| `unregister` | 移除由 `run` / `create-debug-identity` 註冊的側載 (sideloaded) 開發套件。 |
| `manifest` | 產生 `AppxManifest.xml`；支援預留位置與限定名稱。`manifest update-assets <image>` 從單一來源（PNG **或 SVG**, v0.2.1+）產生所有必要的圖示大小。 |
| `cert generate` / `install` / `info` | 管理開發憑證。`cert info <pfx> --password <pwd>` 顯示主旨/發行者/有效性。`--export-cer` 匯出公鑰。`generate` 與 `info` 支援 `--json`。 (v0.2.1+) |
| `sign <target> --cert <pfx>` | 簽署 MSIX 或 exe；可選用時間戳記伺服器。 |
| `tool` | 執行已配置路徑的 Windows SDK 建構工具。 |
| `store` | 執行 Microsoft Store 開發者 CLI 以進行 Store 提交/驗證/發佈。 |
| `create-external-catalog` | 產生用於 TrustedLaunch 稀疏套件的 `CodeIntegrityExternal.cat`。 |
| `ui list-windows` / `inspect` / `click` / `search` / `wait-for` / `get-focused` | 透過 Microsoft UI Automation 進行 UI 自動化。皆支援 `--json`。**`inspect`、`get-focused`、`search` 與 `wait-for` 的 JSON 封套 (envelopes) 在 v0.3.1 中已變更** — 參見 [`references/ui-json-envelope.md`](./references/ui-json-envelope.md)（其他 `ui` 子指令保持 v0.3.1 之前的輸出格式）。 (v0.3.0+) |
| `node create-addon` / `add-electron-debug-identity` / `clear-electron-debug-identity` | Electron/Node 協助工具。所有指令也公開為來自 `@microsoft/winappcli` 的具型別 JS/TS 函式 (v0.2.1+)。 |

CI 提示：傳遞 `--no-prompt` 以跳過互動式提示。

## 工作流程 (Workflow)

標準的 init → package 流程：

1. **初始化專案** 於您的應用程式資料夾中。設定 SDK 引用、資訊清單與 `winapp.yaml`（`.csproj` 專案跳過 YAML 並直接配置 NuGet）。

   ```bash
   winapp init        # 在 CI 中加入 --no-prompt
   ```

2. **產生開發簽署憑證** — 側載 (sideloading) 所必需。`init` 不再為非 `.csproj` 專案建立憑證 (v0.2.0+)。請固定輸出路徑，以便後續步驟引用。

   ```bash
   winapp cert generate --publisher "CN=My Company" --output ./mycert.pfx --install
   ```

3. **建構您的應用程式**，使用框架自身的工具鏈（`dotnet build`, `npm run build`, `cargo build` 等）。
4. **封裝為 MSIX**，並使用步驟 2 的憑證進行簽署。

   ```bash
   winapp pack ./build-output --cert ./mycert.pfx --cert-password password --output MyApp.msix
   ```

5. **（選填）在分發前使用生產環境憑證重新簽署**。

   ```bash
   winapp sign MyApp.msix --cert ./prod.pfx --cert-password $env:CERT_PWD
   ```

6. **（選填）使用 `winapp store …` 提交至 Microsoft Store**（封裝了 Store 開發者 CLI）。

### 備選流程 (Alternate flows)

- **在無需封裝的情況下偵錯受識別限制的 API**（通知、Windows AI、Shell）：

  ```bash
  winapp create-debug-identity ./bin/MyApp.exe
  ./bin/MyApp.exe
  ```

- **針對 IDE F5 作為封裝應用程式執行**（鬆散配置；應用程式參數接在 `--` 後面）：

  ```bash
  winapp run ./bin/Debug/net10.0-windows10.0.26100.0/win-x64 \
    --manifest ./appxmanifest.xml -- --my-flag value
  ```

- **Electron**：

  ```bash
  npx winapp init
  npx winapp node add-electron-debug-identity
  npx winapp pack ./out --output MyElectronApp.msix
  ```

## 注意事項 (Gotchas)

- **`winapp ui --json` 封套在 v0.3.1 中已重塑** — `ui inspect`, `ui get-focused`, `ui search` 與 `ui wait-for` 使用新的形狀；移除了個別元素的 `id` / `parentSelector` / `windowHandle`（請改用 `selector`）。完整結構描述位於 [`references/ui-json-envelope.md`](./references/ui-json-envelope.md)。
- **`winapp init` 不再自動產生憑證** (v0.2.0+) — 請明確執行 `winapp cert generate`。舊的 `--no-cert` 旗標已移除。
- **`.csproj` 專案會跳過 `winapp.yaml`** — SDK 套件位於專案檔案中。混合式設定需要調整。
- **使用 NuGet 全域快取，而非 `%userprofile%/.winapp/packages`** (v0.2.0+) — 依賴舊資料夾的腳本將失效。
- **在任何資訊清單變更後，重新執行 `create-debug-identity`** — 識別是在註冊時綁定的。

## 疑難排解 (Troubleshooting)

| 問題 | 修復方式 |
| ----- | --- |
| 憑證不被信任 | 執行 `winapp cert install <pfx>` 以新增至本地端機器儲存區 |
| 受識別限制的 API 失敗 | 在資訊清單變更後重新執行 `create-debug-identity` |
| 找不到 SDK | 執行 `winapp restore` 或 `winapp update` |
| `run` / `create-debug-identity` 註冊錯誤 `0x800704EC` | 開發者模式已關閉 — 請在 **設定 → 隱私權與安全性 → 開發者專用** 中啟用（或執行 `Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' -Name AllowDevelopmentWithoutDevLicense -Value 1`），然後重試 |
| `run` / `create-debug-identity` 註冊錯誤 `0x80073CFB` | 套件已使用衝突的識別註冊 — 執行 `winapp unregister`（或若是從不同的專案樹註冊，則執行 `winapp unregister --force`），然後重試 |

## 參考資料 (References)

- [winapp CLI 存放庫](https://github.com/microsoft/WinAppCli) · [完整用法文件](https://github.com/microsoft/WinAppCli/blob/main/docs/usage.md) · [.NET 指南](https://github.com/microsoft/WinAppCli/blob/main/docs/guides/dotnet.md) · [範例](https://github.com/microsoft/WinAppCli/tree/main/samples)
- [Windows App SDK](https://learn.microsoft.com/windows/apps/windows-app-sdk/) · [MSIX 概觀](https://learn.microsoft.com/windows/msix/overview) · [套件識別概觀](https://learn.microsoft.com/windows/apps/desktop/modernize/package-identity-overview)
