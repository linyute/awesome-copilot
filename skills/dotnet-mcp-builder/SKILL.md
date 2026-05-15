---
name: dotnet-mcp-builder
description: '使用目前的 ModelContextProtocol 1.x NuGet 套件在 C#/.NET 中建構 Model Context Protocol (MCP) 伺服器。特別有助於處理模型在沒有指引的情況下常出錯的情況 — 過時的預覽版本（模型傾向於選擇 0.3 或 0.4 預覽版）、MCP 應用程式（在主機中呈現的互動式 UI）、elicitation URL 模式、每個工作階段的 HTTP 佈線、OAuth 和反向代理部署細節，以及偵錯具體的 MapMcp / STDIO / Streamable-HTTP 錯誤。同時也涵蓋了常規工作 — STDIO 和 Streamable HTTP 傳輸（SSE 已過時）、工具、提示、資源、取樣、根、自動補全、記錄 — 以及基本的 .NET MCP 用戶端。當使用者提到或暗示任何 .NET MCP 伺服器工作時觸發：ModelContextProtocol, McpServerTool, MapMcp, WithStdioServerTransport, "MCP server in C#", "MCP tool in dotnet", "expose this as MCP"，或在 .NET 上下文中命名一個基元（提示/資源/elicitation/MCP 應用程式）。對於其他語言的 MCP 工作請跳過。'
---

# 在 .NET 中建構 MCP 伺服器

此技能可協助您針對由 Microsoft 和 MCP 專案維護的 **官方** [`ModelContextProtocol`](https://www.nuget.org/profiles/ModelContextProtocol) NuGet 套件，在 C#/.NET 中編寫生產品質的 MCP 伺服器和基本用戶端。它針對 **穩定 1.x** 系列和目前的規格 (2025-11-25)。

## 此技能展現價值的時機

.NET MCP SDK 在達到 `1.0` 之前經歷了多年的預覽版套件 (`0.x-preview`)。在沒有協助的情況下，模型往往會：
- 固定在過時的預覽版本，導致無法針對目前的範例進行編譯。
- 遺漏最近的規格功能（elicitation URL 模式、MCP 應用程式、結構化內容區塊）。
- 弄錯 HTTP 傳輸細節（具狀態/無狀態、代理緩衝、OAuth 佈線）。
- 忘記 STDIO stdout/stderr 的陷阱。

如果任務屬於上述情況，請 *載入相符的參考資料* 並遵循之。如果任務確實微不足道（例如「重新命名此工具方法」），則不需要閱讀所有內容 — 下方的基本原則是最低限度。

## 30 秒心智模型

.NET MCP 伺服器是一個普通的 `Microsoft.Extensions.Hosting`（或 `WebApplication`）應用程式，透過 DI 佈線 MCP 伺服器：

```csharp
builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()      // 或 .WithHttpTransport(...)
    .WithToolsFromAssembly()         // 探索 [McpServerToolType] 類別
    .WithPrompts<MyPrompts>()        // 選用
    .WithResources<MyResources>();   // 選用
```

基元是標記有屬性（`[McpServerToolType]` + `[McpServerTool]`、`[McpServerPromptType]` + `[McpServerPrompt]`、`[McpServerResourceType]` + `[McpServerResource]`）的類別上的普通 C# 函式。參數從 JSON-RPC 綁定；SDK 從簽章加上 `[Description]` 屬性建構 JSON 結構描述 (JSON Schema)。

伺服器對用戶端的功能（取樣、elicitation、根、記錄/進度通知）是插入的 `IMcpServer` 上的函式。

## 決策樹 → 要載入哪些參考資料

如果您要建立新專案或不確定目前的套件版本，請務必載入 `references/packages.md`。

| 任務 | 載入 |
|---|---|
| 新建 STDIO 伺服器 | `references/transport-stdio.md` |
| 新建 HTTP (Streamable) 伺服器 | `references/transport-http.md` |
| 新增/修改工具 | `references/tool-primitive.md` |
| 新增/修改提示 | `references/prompt-primitive.md` |
| 新增/修改資源 | `references/resource-primitive.md` |
| 在工具執行中途向使用者提問 | `references/elicitation.md` |
| 從工具呼叫用戶端的 LLM | `references/sampling.md` |
| 讀取使用者的專案根目錄 | `references/roots.md` |
| 回傳互動式 UI | `references/mcp-apps.md` |
| 引數自動補全、記錄/進度通知、篩選器、伺服器指示 | `references/server-features.md` |
| 編寫 **取用** MCP 伺服器的 .NET 程式 | `references/client.md` |
| MCP Inspector、記憶體內測試、模擬 (mocks)、CI | `references/testing.md` |

對於多基元任務，請一次載入多個參考資料。對於現有檔案中的微小編輯，通常不需要任何參考資料。

## 基本原則（務必遵守；可防止最常發生的損壞）

1. **固定目前的穩定套件，而非預覽版。** 使用最新的 **1.x** 版本 `ModelContextProtocol` / `ModelContextProtocol.AspNetCore` / `ModelContextProtocol.Core`。如果您發現自己在編寫 `0.3-preview` 或 `0.4-preview`，請停止並檢查 NuGet — 預覽版 API 存在破壞性差異。
2. **STDIO 伺服器絕對不能寫入 stdout。** Stdout 是 JSON-RPC 頻道。請在執行任何其他操作前設定 `LogToStandardErrorThreshold = LogLevel.Trace`處理，且絕對不要從工具執行 `Console.WriteLine`。
3. **HTTP 預設為具狀態 (stateful)。** 對於沒有伺服器啟動流量的水平擴充部署，請設定 `options.Stateless = true`。伺服器對用戶端的功能（取樣、elicitation、根、主動通知）需要具狀態 HTTP **或** STDIO — `Stateless = true` 會在執行階段導致這些功能損壞。
4. **僅限 SSE 已過時。** 請使用 Streamable HTTP。僅在必須支援舊有用戶端時才啟用舊版 SSE (`EnableLegacySse = true`)，並明確說明。
5. **務必為工具和參數加上 `[Description]`。** 這是 LLM 在選擇和建構呼叫時看到的內容。模糊的描述是工具未被使用的第一大原因。
6. **每次新增基元時，請顯示註冊行。** 若新增 `[McpServerPromptType]` 類別卻沒有加上 `.WithPrompts<...>()`（或 `.WithPromptsFromAssembly()`），該類別將無法被偵測。
7. **不要虛構 API。** 如果您不確定某個方法是否存在，請說明並檢查 [API 參考文件](https://csharp.sdk.modelcontextprotocol.io/api/ModelContextProtocol.html) — 錯誤的方法名稱會導致靜默失敗處理。

## 工作風格

- **進行最小化的增量變更。** 在現有的工具類別中新增方法，而不是重構整個專案。
- **對於非微小的設定，請執行 `dotnet build`。** 在使用者看到之前，捕捉遺漏的 using、屬性打錯字和 TFM 不符的問題。
- **在進行腳手架 (scaffolding) 之前，若上下文不明確，請確認傳輸方式 + .NET 版本 + 基元。** 新專案預設使用 **.NET 10**。

## 當使用者遇到瓶頸時

在猜測原因之前，請先檢查此清單：
1. **STDIO：** 某些內容正在寫入 stdout（記錄器接收端、`Console.WriteLine`、函式庫橫幅）。
2. **HTTP 404：** 路徑不符 — `app.MapMcp()` 是根目錄，`app.MapMcp("/mcp")` 則位於 `/mcp` 之下。
3. **工具未出現：** 類別遺漏了 `[McpServerToolType]`，或未註冊 `.WithToolsFromAssembly()` / `.WithTools<T>()` 註冊。
4. **引數未綁定：** 參數名稱必須與 JSON-RPC 的 `arguments` 鍵值相符；複雜類型透過 `System.Text.Json` 進行綁定。
5. **取樣/elicitation/根目錄失敗：** 傳輸方式為無狀態 HTTP，或用戶端未宣告該功能。

仍然遇到瓶頸？請向使用者指引 [`EverythingServer`](https://github.com/modelcontextprotocol/csharp-sdk/tree/main/samples/EverythingServer) 範例 — 它演示了所有功能。
