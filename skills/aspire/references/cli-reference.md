# CLI 參考 — 完整的命令參考

Aspire CLI (`aspire`) 是建立、執行和發佈分散式應用程式的主要介面。它是跨平台的，並且是獨立安裝的 (不與 .NET CLI 耦合，儘管 `dotnet` 命令也同樣有效)。

**測試版本：** Aspire CLI 13.1.0

---

## 安裝

```bash
# Linux / macOS
curl -sSL https://aspire.dev/install.sh | bash

# Windows PowerShell
irm https://aspire.dev/install.ps1 | iex

# 驗證
aspire --version

# 更新 CLI 本身
aspire update --self
```

---

## 全域選項

所有命令都支援以下選項：

| 選項 | 說明 |
| --------------------- | ---------------------------------------------- |
| `-d, --debug` | 啟用對主控台的偵錯記錄 |
| `--non-interactive` | 停用所有互動式提示和載入指示器 (spinners) |
| `--wait-for-debugger` | 在執行前等待偵錯工具附加 |
| `-?, -h, --help` | 顯示說明和用法資訊 |
| `--version` | 顯示版本資訊 |

---

## 命令參考

### `aspire new`

從範本建立新專案。

```bash
aspire new [<template>] [options]

# 選項：
#   -n, --name <name>        專案名稱
#   -o, --output <dir>       輸出目錄
#   -s, --source <source>    範本的 NuGet 來源
#   -v, --version <version>  要使用的範本版本
#   --channel <channel>      通道 (stable, daily)

# 範例：
aspire new aspire-starter
aspire new aspire-starter -n MyApp -o ./my-app
aspire new aspire-ts-cs-starter
aspire new aspire-py-starter
aspire new aspire-apphost-singlefile
```

可用範本：

- `aspire-starter` — ASP.NET Core/Blazor 入門版 + AppHost + 測試
- `aspire-ts-cs-starter` — ASP.NET Core/React + AppHost
- `aspire-py-starter` — FastAPI/React + AppHost
- `aspire-apphost-singlefile` — 空的單一檔案 AppHost

### `aspire init`

在現有專案或解決方案中初始化 Aspire。

```bash
aspire init [options]

# 選項：
#   -s, --source <source>    範本的 NuGet 來源
#   -v, --version <version>  要使用的範本版本
#   --channel <channel>      通道 (stable, daily)

# 範例：
cd my-existing-solution
aspire init
```

將 AppHost 和 ServiceDefaults 專案新增至現有解決方案。互動式提示將引導您選擇要編排的專案。

### `aspire run`

使用 DCP (開發人員控制平面) 在本地啟動所有資源。

```bash
aspire run [options] [-- <additional arguments>]

# 選項：
#   --project <path>       AppHost 專案檔案的路徑

# 範例：
aspire run
aspire run --project ./src/MyApp.AppHost
```

行為：

1. 建構 AppHost 專案
2. 啟動 DCP 引擎
3. 按相依性順序 (DAG) 建立資源
4. 等待門控資源的健康檢查
5. 在預設瀏覽器中開啟儀表板
6. 將記錄串流傳輸到終端機

按 `Ctrl+C` 以正常停止所有資源。

### `aspire add`

將裝載 (hosting) 整合新增至 AppHost。

```bash
aspire add [<integration>] [options]

# 選項：
#   --project <path>         目標專案檔案
#   -v, --version <version>  要新增的整合版本
#   -s, --source <source>    整合的 NuGet 來源

# 範例：
aspire add redis
aspire add postgresql
aspire add mongodb
```

### `aspire publish` (預覽)

從 AppHost 資源模型產生部署資訊清單。

```bash
aspire publish [options] [-- <additional arguments>]

# 選項：
#   --project <path>                   AppHost 專案檔案的路徑
#   -o, --output-path <path>           輸出目錄 (預設：./aspire-output)
#   --log-level <level>                記錄層級 (trace, debug, information, warning, error, critical)
#   -e, --environment <env>            環境 (預設：Production)
#   --include-exception-details        在管線記錄中包含堆疊追蹤詳細資訊

# 範例：
aspire publish
aspire publish --output-path ./deploy
aspire publish -e Staging
```

### `aspire config`

管理 Aspire 組態設定。

```bash
aspire config <subcommand>

# 子命令：
#   get <key>              取得組態值
#   set <key> <value>      設定組態值
#   list                   列出所有組態值
#   delete <key>           刪除組態值

# 範例：
aspire config list
aspire config set telemetry.enabled false
aspire config get telemetry.enabled
aspire config delete telemetry.enabled
```

### `aspire cache`

管理 CLI 操作的磁碟快取。

```bash
aspire cache <subcommand>

# 子命令：
#   clear                  清除所有快取項目

# 範例：
aspire cache clear
```

### `aspire deploy` (預覽)

將 Aspire apphost 的內容部署到其定義的部署目標。

```bash
aspire deploy [options] [-- <additional arguments>]

# 選項：
#   --project <path>                   AppHost 專案檔案的路徑
#   -o, --output-path <path>           部署構件 (artifacts) 的輸出路徑
#   --log-level <level>                記錄層級 (trace, debug, information, warning, error, critical)
#   -e, --environment <env>            環境 (預設：Production)
#   --include-exception-details        在管線記錄中包含堆疊追蹤詳細資訊
#   --clear-cache                      清除目前環境的部署快取

# 範例：
aspire deploy --project ./src/MyApp.AppHost
```

### `aspire do` (預覽)

執行特定的管線步驟及其相依性。

```bash
aspire do <step> [options] [-- <additional arguments>]

# 選項：
#   --project <path>                   AppHost 專案檔案的路徑
#   -o, --output-path <path>           構件的輸出路徑
#   --log-level <level>                記錄層級 (trace, debug, information, warning, error, critical)
#   -e, --environment <env>            環境 (預設：Production)
#   --include-exception-details        在管線記錄中包含堆疊追蹤詳細資訊

# 範例：
aspire do build-images --project ./src/MyApp.AppHost
```

### `aspire update` (預覽)

更新 Aspire 專案中的整合，或更新 CLI 本身。

```bash
aspire update [options]

# 選項：
#   --project <path>       AppHost 專案檔案的路徑
#   --self                 將 Aspire CLI 本身更新至最新版本
#   --channel <channel>    要更新到的通道 (stable, daily)

# 範例：
aspire update                          # 更新專案整合
aspire update --self                   # 更新 CLI 本身
aspire update --self --channel daily   # 將 CLI 更新至每日建置版本
```

### `aspire mcp`

管理 MCP (模型內容通訊協定) 伺服器。

```bash
aspire mcp <subcommand>

# 子命令：
#   init    為偵測到的代理程式環境初始化 MCP 伺服器組態
#   start   啟動 MCP 伺服器
```

#### `aspire mcp init`

```bash
aspire mcp init

# 互動式 — 偵測您的 AI 環境並建立組態檔案。
# 支援的環境：
# - VS Code (GitHub Copilot)
# - Copilot CLI
# - Claude Code
# - OpenCode
```

為您偵測到的 AI 工具產生適當的組態檔案。
詳細資訊請參閱 [MCP 伺服器](mcp-server.md)。

#### `aspire mcp start`

```bash
aspire mcp start

# 使用 STDIO 傳輸啟動 MCP 伺服器。
# 這通常由您的 AI 工具叫用，而非手動執行。
```

---

## 不存在的命令

以下命令在 Aspire CLI 13.1 中**無效**。請使用替代方案：

| 無效命令 | 替代方案 |
| --------------- | -------------------------------------------------------------------- |
| `aspire build` | 使用 `dotnet build ./AppHost` |
| `aspire test` | 使用 `dotnet test ./Tests` |
| `aspire dev` | 使用 `aspire run` (包含檔案監控) |
| `aspire list` | 使用 `aspire new --help` 檢視範本，`aspire add` 檢視整合 |

---

## .NET CLI 對等命令

`dotnet` CLI 可以執行某些 Aspire 工作：

| Aspire CLI | .NET CLI 對等命令 |
| --------------------------- | -------------------------------- |
| `aspire new aspire-starter` | `dotnet new aspire-starter` |
| `aspire run` | `dotnet run --project ./AppHost` |
| N/A | `dotnet build ./AppHost` |
| N/A | `dotnet test ./Tests` |

Aspire CLI 透過 `publish`、`deploy`、`add`、`mcp`、`config`、`cache`、`do` 和 `update` 增添價值 — 這些命令沒有直接對等的 `dotnet` 命令。
