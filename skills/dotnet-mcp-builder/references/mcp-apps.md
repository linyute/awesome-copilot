# MCP Apps (互動式 UI)

[MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) 是官方擴充功能，允許工具回傳在主機（Claude、Claude Desktop、VS Code Copilot、Goose、Postman、MCPJam）內的沙盒化 iframe 中轉譯的**互動式 UI**。典型使用案例：圖表、儀表板、多步驟表單、3D 檢視器、即時監視器、PDF/影片檢視器。

> **重要事項：** SDK 2.x 提供了一個專用擴充套件 **`ModelContextProtocol.Extensions.Apps`**，具備具型別的 MCP Apps 支援：使用 `.WithMcpApps()` 註冊，並以 `[McpAppUi(ResourceUri = "ui://...")]` 標註工具。它取代了手動 `_meta` 連接設定，但**沒有**取代 `ui://` 資源 — 你仍然需要註冊並提供 UI 資源。這些 API 被標記為實驗性（隱藏診斷代碼 `MCPEXP003`）；請查閱[套件頁面](https://www.nuget.org/packages/ModelContextProtocol.Extensions.Apps)和 [SDK API 參考](https://csharp.sdk.modelcontextprotocol.io/api/ModelContextProtocol.html)以獲取目前的介面，而不要在這些名稱之外隨意猜測。下方的自訂模式是在 **1.x** 上所需的做法（1.x 沒有具型別層，曾在 [csharp-sdk#1431](https://github.com/modelcontextprotocol/csharp-sdk/issues/1431) 中追蹤）：提供 `ui://` 資源並在工具上發出正確的 `_meta`。

## 運作方式（簡短版本）

1. 你在回傳 HTML 套件組合 (bundle) 的 `ui://` URI 註冊一個**資源 (resource)**。
2. 你註冊一個**工具 (tool)**，其定義包含指向該 URI 的 `_meta.ui.resourceUri`。
3. 當 LLM 呼叫該工具時，主機會擷取 UI 資源並在聊天中的沙盒化 iframe 內轉譯它。
4. HTML 透過 `postMessage` JSON-RPC 與主機通訊（從套件組合使用 `@modelcontextprotocol/ext-apps` 或手動實作）。
5. 應用程式可以回呼你的 MCP 伺服器（任何工具）、更新模型情境等。

完整通訊協定規格請參閱 [`@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps)。

## 步驟 1：提供 UI 資源

將 HTML/JS/CSS 打包成單一字串（或從 `wwwroot` 載入）。在 `ui://` URI 提供它。

```csharp
using System.ComponentModel;
using System.IO;
using System.Reflection;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

[McpServerResourceType]
public static class ChartUiResource
{
    [McpServerResource(
        UriTemplate = "ui://charts/interactive",
        Name = "Interactive chart",
        MimeType = "text/html;profile=mcp-app")]   // 請參閱下方的「MIME 類型」備註
    [Description("UI bundle for the interactive chart MCP App.")]
    public static TextResourceContents GetUi()
    {
        // 從內嵌資源或 wwwroot 載入組合後的 HTML/JS 檔案。
        var html = LoadEmbeddedString("MyMcpServer.AppUi.chart.html");

        return new TextResourceContents
        {
            Uri = "ui://charts/interactive",
            MimeType = "text/html;profile=mcp-app",
            Text = html
        };
    }

    private static string LoadEmbeddedString(string resourceName)
    {
        var asm = Assembly.GetExecutingAssembly();
        using var stream = asm.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Missing embedded resource {resourceName}");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
```

**MIME 類型備註：** 目前的 Apps 規格 (2026-01-26) 對於應用程式 HTML 使用 `text/html;profile=mcp-app`，以便主機區分 UI 套件組合與一般 `text/html` 預覽。早期的草案使用 `text/html+skybridge` — 請將其視為舊版；某些較舊的主機可能仍預期此值。

## 步驟 2：在工具上發出 `_meta`

C# SDK 的 `[McpServerTool]` 目前未在屬性中公開 `_meta`，因此請透過較低階的 `Tool` 定義進行設定。在啟動時執行一次：

```csharp
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;
using System.Text.Json;
using System.Text.Json.Nodes;

builder.Services.Configure<McpServerOptions>(options =>
{
    options.Capabilities ??= new();
    options.Capabilities.Tools ??= new();

    // 手動定義工具以便附加 _meta。
    var visualizeTool = new Tool
    {
        Name = "visualize_data",
        Description = "Visualize the user's data as an interactive chart.",
        InputSchema = JsonDocument.Parse("""
            {
              "type": "object",
              "properties": {
                "datasetId": { "type": "string", "description": "Dataset to visualize." }
              },
              "required": ["datasetId"]
            }
            """).RootElement,
        Meta = new JsonObject
        {
            ["ui"] = new JsonObject
            {
                ["resourceUri"] = "ui://charts/interactive"
                // 選用：
                // ["csp"] = new JsonObject { ["default-src"] = "'self' https://cdn.example.com" },
                // ["permissions"] = new JsonArray("clipboard-write")
            }
        }
    };

    // 實作呼叫處理常式以回傳 UI 將轉譯的資料。
    options.Capabilities.Tools.ToolCollection ??= new();
    options.Capabilities.Tools.ToolCollection.Add(McpServerTool.Create(
        async (CallToolRequestParams req, CancellationToken ct) =>
        {
            var args = req.Arguments ?? new();
            var datasetId = args["datasetId"]!.GetValue<string>();
            var data = await LoadDataset(datasetId, ct);
            return new CallToolResult
            {
                Content = [new TextContentBlock { Text = JsonSerializer.Serialize(data) }],
                StructuredContent = JsonSerializer.SerializeToNode(data)
            };
        },
        visualizeTool));
});
```

如果你不需要完整的結構化內容，工具可以在文字區塊中*僅*回傳 JSON — UI 在轉譯後透過 `app.callServerTool(...)` 進行擷取。

### 回溯相容性索引鍵

某些較舊的主機預期使用 `_meta["ui/resourceUri"]` 而非 `_meta.ui.resourceUri`。為保險起見兩者皆設定：

```csharp
Meta = new JsonObject
{
    ["ui"] = new JsonObject { ["resourceUri"] = "ui://charts/interactive" },
    ["ui/resourceUri"] = "ui://charts/interactive"   // 舊版
}
```

## 步驟 3：HTML 套件組合

最小可行套件組合：使用 `@modelcontextprotocol/ext-apps` 的原生 JS。最簡單的建構是單一獨立的 HTML 檔案。

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Chart</title>
    <style>body { font-family: system-ui; margin: 0; }</style>
  </head>
  <body>
    <div id="root">載入中…</div>
    <script type="module">
      import { App } from "https://esm.sh/@modelcontextprotocol/ext-apps@1";

      const app = new App();
      await app.connect();

      // 從伺服器擷取我們需要的資料。
      const resp = await app.callServerTool({
        name: "visualize_data",
        arguments: { datasetId: "default" }
      });

      const data = JSON.parse(resp.content[0].text);
      document.getElementById("root").textContent =
        `已載入 ${data.points.length} 個資料點。`;

      // 告訴模型剛剛發生的事情（成為其情境的一部分）。
      await app.updateModelContext({
        content: [{ type: "text", text: "使用者開啟了圖表 UI。" }]
      });
    </script>
  </body>
</html>
```

**提示：** 對於複雜的 UI，請使用 Vite 建構（React/Vue/Svelte/Solid — 任何[官方入門範本](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples)），並讓建構產出單一內嵌的 HTML，嵌入作為專案資源。

## 專案配置

.NET 中 MCP App 的實用配置：

```
MyMcpServer/
├── Program.cs
├── Tools/
│   └── VisualizeDataTool.cs       # （或如上透過 Configure 註冊）
├── Resources/
│   └── ChartUiResource.cs         # 提供 ui:// 資源
├── AppUi/
│   ├── chart.html                 # 組合後的 UI（內嵌資源）
│   └── package.json + src/...     # 若使用 Vite 建構，輸出至 chart.html
└── MyMcpServer.csproj
```

在 csproj 中：

```xml
<ItemGroup>
  <EmbeddedResource Include="AppUi\chart.html" />
</ItemGroup>
```

透過 `Assembly.GetManifestResourceStream("MyMcpServer.AppUi.chart.html")` 讀取。

## 本地測試

1. 執行你的 MCP 伺服器（STDIO 或 HTTP）。
2. 使用支援 MCP Apps 的主機 — Claude Desktop 或 VS Code Copilot Chat 最為容易。
3. 透過 LLM 觸發工具。UI 會以內嵌方式轉譯。

對於純 UI 迭代，[MCP Inspector](https://github.com/modelcontextprotocol/inspector) 會顯示資源內容但不會完全轉譯應用程式；針對該情境，請將 Claude Desktop 指向你的開發伺服器。

## 常見陷阱

- **錯誤的 MIME 類型。** 使用 `text/html;profile=mcp-app`（目前規格；`text/html+skybridge` 是舊版草案數值）。純 `text/html` 在寬容的主機上可能仍可運作，但非長久之計。
- **CSP 過嚴或過寬。** 如果你的 UI 從 CDN 載入，請在 `Tool` 定義的 `Meta["ui"]["csp"]` 中宣告（這會在網路上序列化為 `_meta.ui.csp`）。否則 iframe 沙盒會將其封鎖。
- **忘記工具上的 `Tool.Meta`。** 沒有包含 `ui.resourceUri` 項目的 `Meta` 屬性，主機會將你的工具視為一般的純文字回傳工具。UI 絕不會出現。
- **嘗試在沙盒外使用瀏覽器 API。** 沒有 Cookie，也沒有來自父系的 localStorage。使用 `app.updateModelContext` 和工具呼叫來維持狀態。

## 從自訂模式移轉

在 2.x 上，`ModelContextProtocol.Extensions.Apps` 取代了手動 `Configure` 區塊：在工具上使用 `.WithMcpApps()` 加上 `[McpAppUi(ResourceUri = "ui://...")]`，擴充套件會處理 Apps 功能交涉。你仍然提供 `ui://` 資源（使用目前的 `text/html;profile=mcp-app` MIME 類型）並保留你的 HTML 套件組合 — 將 UI HTML 保持為內嵌資源，使移轉成為機械式操作。這些 API 是實驗性的 (`MCPEXP003`)；除此表面之外的任何內容請查閱套件文件，切勿自行捏造。
