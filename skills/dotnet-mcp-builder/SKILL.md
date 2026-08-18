---
name: 'dotnet-mcp-builder'
description: '使用目前的 ModelContextProtocol 2.x NuGet 套件在 C#/.NET 中建構模型情境通訊協定 (Model Context Protocol, MCP) 伺服器。協助處理模型在沒有指引時容易出錯的情況 — 過期版本 (0.x 預覽版或 1.x 時代的預設值)、v2 預設無狀態的 HTTP 轉變、2026-07-28 規格棄用功能 (roots/sampling/logging)、MCP Apps 和 Tasks 擴充套件、elicitation URL 模式、個別工作階段的 HTTP 連接設定、OAuth 和反向代理部署細節，以及對 MapMcp / STDIO / Streamable-HTTP 錯誤進行偵錯。同時涵蓋 STDIO 和 Streamable HTTP 傳輸 (SSE 已被棄用)、工具 (tools)、提示詞 (prompts)、資源 (resources)、自動完成 (completions)，以及基本 .NET MCP 用戶端。當使用者提及或暗示任何 .NET MCP 伺服器工作時觸發：ModelContextProtocol、McpServerTool、MapMcp、WithStdioServerTransport、「C# 中的 MCP 伺服器」、「dotnet 中的 MCP 工具」、「將此公開為 MCP」，或在 .NET 情境中提及原始型別 (prompt/resource/elicitation/MCP App)。其他語言的 MCP 工作請略過。'
---

# 在 .NET 中建構 MCP 伺服器

此 skill 可協助你使用由 Microsoft 和 MCP 專案維護的**官方** [`ModelContextProtocol`](https://www.nuget.org/profiles/ModelContextProtocol) NuGet 套件，在 C#/.NET 中撰寫具備生產品質的 MCP 伺服器和基本用戶端。其以**穩定的 2.x** 系列和目前的規格 (2026-07-28) 為目標。

## 此 skill 何時發揮作用

.NET MCP SDK 在達到 `1.0` 之前經歷了多年的預覽套件 (`0.x-preview`)，且 v2 翻轉了多個預設值。在沒有協助的情況下，模型往往會：
- 固定使用過期的預覽版本，導致無法針對目前範例進行編譯。
- 套用 v2 已反轉的 1.x 時代預設值（HTTP 過去預設為具狀態；在 2.x 中 `Stateless` 預設為 `true`）。
- 建議 2026-07-28 規格已棄用的功能（roots、sampling、MCP 通道記錄 — 現已標記為 `[Obsolete]`，警告 `MCP9005`）。
- 遺漏最新的規格功能（多來回 `input_required`、優先探索交涉、MCP Apps/Tasks 擴充套件、elicitation URL 模式、結構化內容區塊）。
- 搞錯 HTTP 傳輸細節（具狀態/無狀態、代理緩衝、OAuth 連接）。
- 忘記 STDIO stdout/stderr 陷阱。

如果工作屬於上述之一，*請載入相符的參考文件*並遵循其指引。如果確實微不足道（例如「重新命名此工具方法」），則無需閱讀所有內容 — 下方的基本規則是最低要求。

## 30 秒心智模型

.NET MCP 伺服器是一個一般的 `Microsoft.Extensions.Hosting`（或 `WebApplication`）應用程式，透過 DI 連接 MCP 伺服器：

```csharp
builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()      // 或 .WithHttpTransport(...)
    .WithToolsFromAssembly()         // 探索 [McpServerToolType] 類別
    .WithPrompts<MyPrompts>()        // 選用
    .WithResources<MyResources>();   // 選用
```

原始型別 (Primitives) 是標記有屬性 (`[McpServerToolType]` + `[McpServerTool]`、`[McpServerPromptType]` + `[McpServerPrompt]`、`[McpServerResourceType]` + `[McpServerResource]`) 的類別上的普通 C# 方法。參數從 JSON-RPC 繫結；SDK 會從簽章加上 `[Description]` 屬性建構 JSON Schema。

伺服器至用戶端功能（elicitation、進度通知，以及現已棄用的 sampling/roots/記錄通知）是插入的 `IMcpServer` 上的方法。

## 決策樹 → 該載入哪些參考文件

如果你正在建立新專案或不確定目前的套件版本，請一律載入 `references/packages.md`。

| 工作 | 載入 |
|---|---|
| 新增 STDIO 伺服器 | `references/transport-stdio.md` |
| 新增 HTTP (Streamable) 伺服器 | `references/transport-http.md` |
| 新增/修改工具 | `references/tool-primitive.md` |
| 新增/修改提示詞 | `references/prompt-primitive.md` |
| 新增/修改資源 | `references/resource-primitive.md` |
| 在工具執行途中向使用者提問 | `references/elicitation.md` |
| 從工具呼叫用戶端的 LLM（在 2026-07-28 中已棄用） | `references/sampling.md` |
| 讀取使用者的專案根目錄 (roots)（在 2026-07-28 中已棄用） | `references/roots.md` |
| 回傳互動式 UI | `references/mcp-apps.md` |
| 引數自動完成、記錄/進度通知、篩選器、伺服器指示 | `references/server-features.md` |
| 撰寫**取用** MCP 伺服器的 .NET 程式 | `references/client.md` |
| MCP Inspector、記憶體內測試、模擬 (mocks)、CI | `references/testing.md` |

對於涉及多個原始型別的工作，可一次載入數個參考檔案。對於現有檔案中的微小編輯，通常不需要載入任何參考。

## 基本規則（一律適用；可防止最高頻率的損壞）

1. **固定使用目前的穩定套件，而非預覽版。** 使用最新的 **2.x** 版 `ModelContextProtocol` / `ModelContextProtocol.AspNetCore` / `ModelContextProtocol.Core`。如果你發現自己正在撰寫 `0.3-preview` 或 `0.4-preview`，請停下來並檢查 NuGet — 預覽版 API 存在破壞性差異。1.x 仍然可用，但早於 2026-07-28 規格。
2. **STDIO 伺服器絕不可寫入至 stdout。** Stdout 是 JSON-RPC 通道。在執行其他動作前先設定 `LogToStandardErrorThreshold = LogLevel.Trace`，且絕不要在工具中呼叫 `Console.WriteLine`。
3. **HTTP 在 2.x 中預設為無狀態**（v1.x 預設為具狀態 — 這是 v2 中影響最大的單一重大變更）。2026-07-28 修訂版完全沒有 HTTP 工作階段：將 `Stateless = false` 會使伺服器拒絕該修訂版，並透過舊版 `initialize` 後備機制服務用戶端。對於目前通訊協定 HTTP 上的「在工具執行途中詢問使用者問題」，請使用多來回 `InputRequiredException` 模式；將具狀態 HTTP（或 STDIO）保留給舊版 `ElicitAsync`/sampling/roots 路徑和推送通知。
4. **僅支援 SSE 已被棄用。** 請使用 Streamable HTTP。僅針對必須支援的舊版用戶端啟用舊版 SSE (`EnableLegacySse = true`)，並明確標註。
5. **不要圍繞已棄用的功能設計新伺服器。** 2026-07-28 規格棄用了 roots、sampling 和 MCP 通道記錄；SDK 將其標記為 `[Obsolete]`（警告 `MCP9005`）。它們仍然可以針對舊版用戶端運作，但對於新設計，建議使用多來回 `input_required` 模式和 `ILogger` 記錄。僅將隱藏 `MCP9005` 作為有記錄說明的過渡措施。
6. **一律為工具和參數加上 `[Description]`。** 這是 LLM 在選擇和形成呼叫時看到的內容。模糊的描述是工具未被使用的第一大原因。
7. **每次新增原始型別時顯示註冊行。** 新的 `[McpServerPromptType]` 類別若沒有 `.WithPrompts<...>()`（或 `.WithPromptsFromAssembly()`）是不可見的。
8. **不要捏造 API。** 如果不確定某個方法是否存在，請如實說明並查閱 [API 參考](https://csharp.sdk.modelcontextprotocol.io/api/ModelContextProtocol.html) — 錯誤的方法名稱會導致無訊息失敗。這對於新的 v2 擴充套件（`ModelContextProtocol.Extensions.Tasks`、`ModelContextProtocol.Extensions.Apps`）尤其適用 — 在針對它們撰寫程式碼之前請先查閱其文件。

## 工作風格

- **進行最小的、累加式的變更。** 向現有工具類別新增方法，而不是重構整個專案。
- **對於非一般的設定，請執行 `dotnet build`。** 在使用者看到之前捕獲遺漏的 using、屬性錯字和 TFM 不相符。
- **在建構框架前確認傳輸 + .NET 版本 + 原始型別**（如果情境中尚未明確）。新專案預設為 **.NET 10**。

## 當使用者遇到問題時

在猜測之前先瀏覽此檢查清單：
1. **STDIO：** 有東西正在寫入 stdout（記錄器接收器、`Console.WriteLine`、函式庫橫幅）。
2. **HTTP 404：** 路徑不相符 — `app.MapMcp()` 為根目錄，`app.MapMcp("/mcp")` 將其置於 `/mcp` 下。
3. **工具未出現：** 類別上缺少 `[McpServerToolType]`，或未註冊 `.WithToolsFromAssembly()` / `.WithTools<T>()`。
4. **引數未繫結：** 參數名稱必須與 JSON-RPC `arguments` 索引鍵相符；複雜型別透過 `System.Text.Json` 繫結。
5. **Sampling/elicitation/roots 失敗：** 這些舊版伺服器至用戶端呼叫無法在目前通訊協定的 HTTP 上執行 — 請移轉至多來回 `InputRequiredException` 模式，或（僅限舊版路徑）設定 `Stateless = false`（需注意這會將 HTTP 用戶端鎖定在舊版 `initialize` 修訂版）。同時檢查用戶端是否確實宣傳了該功能。
6. **升級至 2.x 後出現 `MCP9005` 建構警告：** 程式碼使用了已棄用的 roots/sampling/記錄 API。請規劃移轉；僅可暫時隱藏。

仍然卡住嗎？引導使用者參考 [`EverythingServer`](https://github.com/modelcontextprotocol/csharp-sdk/tree/main/samples/EverythingServer) 範例 — 它涵蓋了所有功能。
