# NuGet 套件與目標架構

## 官方套件

所有套件都位於 [`ModelContextProtocol` NuGet 設定檔](https://www.nuget.org/profiles/ModelContextProtocol)下。官方 C# SDK 存放庫為 [`modelcontextprotocol/csharp-sdk`](https://github.com/modelcontextprotocol/csharp-sdk)，由 MCP 專案與 Microsoft 共同維護。

| 套件                                              | 何時使用                                                                 | 引入內容                                                                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ModelContextProtocol`**                        | STDIO 伺服器和大多數專案的預設套件                                       | `Core` + `Microsoft.Extensions.Hosting` 整合、屬性探索 (`AddMcpServer`、`WithToolsFromAssembly` 等)                                                                                            |
| **`ModelContextProtocol.AspNetCore`**             | 代管於 ASP.NET Core 的 HTTP (Streamable) 伺服器                          | 上述內容 + `WithHttpTransport` 和 `MapMcp`                                                                                                                                                     |
| **`ModelContextProtocol.Core`**                   | 純用戶端、自訂主機、不希望使用 `Microsoft.Extensions.*` 相依性的低階情境 | 僅通訊協定 + 傳輸 + 低階 `McpServer.Create` / `McpClient.CreateAsync`                                                                                                                          |
| **`ModelContextProtocol.Extensions.Tasks`** (2.x) | 長時間執行工作支援 (MCP Tasks 擴充功能)                                  | 取代實驗性 1.4.x Tasks API 的生產環境替代方案；透過 `WithTasks(...)` 註冊                                                                                                                      |
| **`ModelContextProtocol.Extensions.Apps`** (2.x)  | MCP Apps — 在主機中轉譯的互動式 UI                                       | 具型別的 `[McpAppUi]` 屬性 + `.WithMcpApps()` 註冊，取代 1.x 的手動 `_meta` 連接設定；你仍需將 UI 作為 `ui://` 資源提供，且 API 為實驗性 (`MCPEXP003`) — 請參閱 [`mcp-apps.md`](./mcp-apps.md) |

**經驗法則：**
- 新的 STDIO 伺服器 → `ModelContextProtocol` + `Microsoft.Extensions.Hosting`。
- 新的 HTTP 伺服器 → 僅需 `ModelContextProtocol.AspNetCore`（它會間接拉入所需的一切）。
- 純用戶端應用程式 → `ModelContextProtocol.Core`（若用戶端也需要代管/DI，則使用 `ModelContextProtocol`）。

## 版本

截至 2026 年年中，穩定系列為 **2.x**（撰寫本文時最新為 `2.2.0`），與 MCP 2026-07-28 規格保持一致。`0.x` 系列為預覽版且具有重大差異 — 若你發現參考 `0.4`/`0.6` 的文件或部落格文章，請將其視為過期。`1.x` 系列仍可編譯並進行互通，但早於 v2 變更（預設無狀態的 HTTP、優先探索交涉、roots/sampling/logging 棄用、Tasks/Apps 擴充套件）— 新專案建議使用 2.x。

**升級 1.x → 2.0（重點摘要，非完整清單）：** 穩定的 v1.x API 保持運作；已棄用的功能（roots、sampling、logging）現已標記為 `[Obsolete]` 並帶有 `MCP9005` 警告，實驗性 API 已遷移（1.4.x Tasks 介面 → `ModelContextProtocol.Extensions.Tasks`），且數個行為已反轉（`HttpServerTransportOptions.Stateless` 現預設為 `true`；非物件工具結果發出原始 `structuredContent` 值；還原序列化時 `Tool.inputSchema` 為必要項目）。OAuth 在執行階段也發生了變化 — `AuthorizationRedirectDelegate` → `ClientOAuthOptions.AuthorizationCallbackHandler`、RFC 9207 發行者驗證、中繼資料中強制使用 PKCE S256、動態註冊中的 `application_type` — 且 SSE 傳輸失敗現在會傳播底層的 `HttpRequestException`/`TimeoutException`。在升級前，請閱讀完整的 [v2.0.0 版本資訊](https://github.com/modelcontextprotocol/csharp-sdk/releases/tag/v2.0.0)。

若要檢查最新版本：

```bash
dotnet search ModelContextProtocol --prerelease
```

## 目標架構 (Target Frameworks)

此 SDK 以 **`.NET 8.0`** 和 **`netstandard2.0`** 為目標。這意味著它可以執行於：
- .NET 8 (LTS)
- .NET 9
- .NET 10 (目前的 LTS — 新專案推薦)
- 透過 netstandard2.0 支援 .NET Framework 4.6.2+（罕見；僅適用於舊版主機）

對於 HTTP 伺服器，你特別需要支援 ASP.NET Core 的 TFM（即 .NET 8/9/10）。

## 專案設定指令

### STDIO 伺服器

```bash
dotnet new console -n MyMcpServer -f net10.0
cd MyMcpServer
dotnet add package ModelContextProtocol --version 2.2.0
dotnet add package Microsoft.Extensions.Hosting --version 10.0.11
```

### HTTP (Streamable) 伺服器

```bash
dotnet new web -n MyMcpServer -f net10.0
cd MyMcpServer
dotnet add package ModelContextProtocol.AspNetCore --version 2.2.0
```

（`dotnet new web` 提供最小的 ASP.NET Core 專案 — 正是 `MapMcp` 所需的。）

### 用戶端

```bash
dotnet new console -n MyMcpClient -f net10.0
cd MyMcpClient
dotnet add package ModelContextProtocol.Core
```

## 選用但常見實用套件

| 套件                                   | 原因                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Microsoft.Extensions.AI`              | 提供 `IChatClient`、`ChatMessage`、`ChatRole`、`ChatOptions` — 由 `AsSamplingChatClient()` 和提示詞回傳型別使用的抽象。 |
| `Microsoft.Extensions.AI.Abstractions` | 間接拉入，但對於 `DataContent`、`TextContent` 等型別值得了解。                                                          |
| `OpenTelemetry.Extensions.Hosting`     | SDK 為工具呼叫發出 OTel 追蹤與計量 — 若使用者有可檢測性需求可進行連接。                                                 |

## 那麼 `dnx` 呢？

較新的 Microsoft 範例有時會顯示透過 `dnx PackageName --version 1.2.3` 啟動伺服器。這是一種有效的發佈模型：將你的伺服器發佈為 NuGet 套件，讓使用者無需複製即可執行。這與伺服器本身的建構方式無關 — 保持程式碼完全相同，僅更改啟動指令即可。
