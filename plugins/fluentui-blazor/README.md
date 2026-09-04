# Fluent UI Blazor 外掛程式

建構使用 [Microsoft Fluent UI Blazor](https://www.fluentui-blazor.net) 元件函式庫的 Blazor 應用程式所需的一切，一次安裝即可獲得：提供正確使用模式的 `fluentui-blazor` skill，以及可即時且版本精確查閱元件、列舉、圖示和文件的官方 Fluent UI Blazor MCP 伺服器。

## 安裝

```bash
copilot plugin install fluentui-blazor@awesome-copilot
```

## 必要條件

- 必須安裝 [.NET 10 SDK](https://dotnet.microsoft.com/download) 或更新版本，且 `dnx` 可在您的 `PATH` 中使用。
- 該外掛程式透過執行 `dnx Microsoft.FluentUI.AspNetCore.McpServer` 來啟動其隨附的 MCP 伺服器。首次啟動時會從 nuget.org 下載套件。
- MCP 伺服器與元件函式庫是以相同的版本號碼發佈，且伺服器會記錄其建構時所針對的版本。如果您的專案參考不同的版本，請讓 Agent 執行 `check_project_version` — 版本不符會產生與您的程式碼不一致的文件。

## 包含內容

### Skills

| Skill | 描述 |
|-------|-------------|
| `fluentui-blazor` | 使用 `Microsoft.FluentUI.AspNetCore.Components` 套件的指南：必要提供者、服務註冊與存留期、強型別圖示、`Items`/`OptionText`/`OptionValue` 清單繫結模型、`IDialogService` 模式、快顯通知 (toasts)、設計語彙基元 (design tokens) 與佈景主題設定，以及表單元件。包含安裝設定、版面配置與導覽、資料格線 (data grid) 及佈景主題設定的參考檔案。 |

### MCP 伺服器

此外掛程式包含在 [`./mcp.json`](./mcp.json) 中設定的 `fluent-ui-blazor` MCP 伺服器，發佈於 NuGet 作為 [`Microsoft.FluentUI.AspNetCore.McpServer`](https://www.nuget.org/packages/Microsoft.FluentUI.AspNetCore.McpServer)。如果無法使用 .NET SDK，MCP 啟動將會失敗。

它為 Agent 提供具權威性且感知版本的答案，而非猜測：

| 功能 | 工具 |
|------------|-------|
| 元件 | `list_components`, `search_components`, `get_component_details`, `list_categories` |
| 列舉 | `list_enums`, `get_enum_values`, `get_component_enums` |
| 圖示 | `search_icons`, `list_all_icon_names`, `get_icon_details`, `get_icon_usage` |
| 文件 | `list_documentation`, `search_documentation`, `get_documentation_topic` |
| 版本 | `get_version_info`, `check_project_version` |
| v4 → v5 移轉 | `get_migration_overview`, `get_migration_guide`, `list_component_migrations`, `get_component_migration` |

### 為何同時包含 skill 與 MCP 伺服器

它們涵蓋不同的失敗模式，且各自單獨運作時效果較弱：

- **skill** 編碼了模型從定型資料中容易犯錯的模式 — 缺少時會無訊息失敗的提供者元件、`ServiceLifetime.Transient` 擲回例外狀況、`FluentSelect` 行為與 `InputSelect` 不同、設計語彙基元需要 `OnAfterRenderAsync`。這是判斷力，而非查閱。
- **MCP 伺服器** 提供容易過時的事實 — 精確的參數名稱、列舉值、142+ 個元件介面以及圖示目錄 — 這些是在套件建構時產生的文件中查閱，而不是從定型資料中回想。它提供其建構時所針對的函式庫版本，這也是為什麼版本一致性至關重要（請參閱必要條件）。

將它們作為單一外掛程式安裝，意味著只需一次 `copilot plugin install` 即可獲得正常運作的 Fluent UI Blazor 設定，而不是 Agent 還必須為其虛構參數的元件命名 skill。

## 範例提示詞

```text
Add a FluentDataGrid of orders with sorting and pagination to my Blazor app.
```

```text
Which Fluent icon should I use for a "save draft" button, and how do I reference it?
```

```text
Check what my project is on today, then walk me through migrating this page from Fluent UI Blazor v4 to v5.
```

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

隨附的 MCP 伺服器維護於 [microsoft/fluentui-blazor](https://github.com/microsoft/fluentui-blazor)。

## 授權條款

MIT
