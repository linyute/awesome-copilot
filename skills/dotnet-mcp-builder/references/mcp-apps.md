# MCP 應用程式 (互動式 UI)

[MCP 應用程式](https://modelcontextprotocol.io/extensions/apps/overview) 是官方擴充功能，讓工具能回傳在主機（Claude、Claude Desktop、VS Code Copilot、Goose、Postman、MCPJam）內的沙盒化 iframe 中呈現的**互動式 UI**。典型使用案例：圖表、儀表板、多步驟表單、3D 檢視器、即時監控器、PDF/影片檢視器。

> **重要：** 截至 2026 年初，C# SDK **尚未**提供用於 MCP 應用程式的具型別便利層（於 [csharp-sdk#1431](https://github.com/modelcontextprotocol/csharp-sdk/issues/1431) 追蹤中）。您需要手動實作規格：提供 `ui://` 資源並在工具上發送正確的 `_meta`。這並不難 — 只是沒有型別。此頁面將向您展示該模式。

## 運作方式 (簡短版)

1. 您在 `ui://` URI 註冊一個回傳 HTML 套件的**資源**。
2. 您註冊一個**工具**，其定義包含指向該 URI 的 `_meta.ui.resourceUri`。
3. 當 LLM 呼叫工具時，主機會抓取 UI 資源並將其呈現在對話中的沙盒化 iframe 中。
4. HTML 透過 `postMessage` JSON-RPC 與主機通訊（使用套件中的 `@modelcontextprotocol/ext-apps`，或手動實作）。
5. 應用程式可以回呼您的 MCP 伺服器（任何工具）、更新模型上下文（context）等。

完整的通訊協定規格位於 [`@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps)。

## 步驟 1：提供 UI 資源

將您的 HTML/JS/CSS 打包成單一字串（或從 `wwwroot` 載入）。在 `ui://` URI 提供。

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
        MimeType = "text/html+skybridge")]   // 參閱下方的「MIME 類型」附註
    [Description("UI bundle for the interactive chart MCP App.")]
    public static TextResourceContents GetUi()
    {
        // 從內嵌資源或 wwwroot 載入打包後的 HTML/JS 檔案。
        var html = LoadEmbeddedString("MyMcpServer.AppUi.chart.html");

        return new TextResourceContents
        {
            Uri = "ui://charts/interactive",
            MimeType = "text/html+skybridge",
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

**MIME 類型附註：** 規格中針對應用程式 HTML 使用 `text/html+skybridge`，以便主機區分 UI 套件與一般的 `text/html` 預覽。請使用該類型，即使目前某些寬鬆的主機可能支援一般的 `text/html`。

## 步驟 2：在工具上發送 `_meta`

目前 C# SDK 的 `[McpServerTool]` 未在屬性中公開 `_meta`，因此請透過較低階層的 `Tool` 定義來設定。在啟動時執行一次：

```csharp
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;
using System.Text.Json;
using System.Text.Json.Nodes;

builder.Services.Configure<McpServerOptions>(options =>
{
    options.Capabilities ??= new();
    options.Capabilities.Tools ??= new();

    // 手動定義工具，以便附加 _meta。
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
                // 選項：
                // ["csp"] = new JsonObject { ["default-src"] = "'self' https://cdn.example.com" },
                // ["permissions"] = new JsonArray("clipboard-write")
            }
        }
    };

    // 實作呼叫處理常式，回傳 UI 將呈現的資料。
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

如果您不需要完整的結構化內容，工具可以只在文字區塊中回傳 JSON — UI 在呈現後透過 `app.callServerTool(...)` 抓取它。

### 回溯相容性關鍵

某些較舊的主機預期 `_meta["ui/resourceUri"]` 而非 `_meta.ui.resourceUri`。為了安全起見，請同時設定兩者：

```csharp
Meta = new JsonObject
{
    ["ui"] = new JsonObject { ["resourceUri"] = "ui://charts/interactive" },
    ["ui/resourceUri"] = "ui://charts/interactive"   // 舊版 (legacy)
}
```

## 步驟 3：HTML 套件

最小可行性套件：使用 `@modelcontextprotocol/ext-apps` 的原生 JS。最簡單的建置是單一獨立的 HTML 檔案。

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

      // 從伺服器抓取我們需要的資料。
      const resp = await app.callServerTool({
        name: "visualize_data",
        arguments: { datasetId: "default" }
      });

      const data = JSON.parse(resp.content[0].text);
      document.getElementById("root").textContent =
        `已載入 ${data.points.length} 個資料點。`;

      // 告訴模型剛發生了什麼（這將成為其上下文的一部分）。
      await app.updateModelContext({
        content: [{ type: "text", text: "使用者開啟了圖表 UI。" }]
      });
    </script>
  </body>
</html>
```

**提示：** 對於複雜的 UI，請使用 Vite 建置（React/Vue/Svelte/Solid — 任何[官方入門範本](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples)），並讓建置輸出一個內嵌的單一 HTML，將其作為專案資源嵌入。

## 專案配置

.NET 中 MCP 應用程式的務實配置：

```
MyMcpServer/
├── Program.cs
├── Tools/
│   └── VisualizeDataTool.cs       # (或如上所述透過 Configure 註冊)
├── Resources/
│   └── ChartUiResource.cs         # 提供 ui:// 資源
├── AppUi/
│   ├── chart.html                 # 打包後的 UI (內嵌資源)
│   └── package.json + src/...     # 如果使用 Vite 建置，輸出至 chart.html
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

1. 執行您的 MCP 伺服器 (STDIO 或 HTTP)。
2. 使用支援 MCP 應用程式的主機 — Claude Desktop 或 VS Code Copilot Chat 是最簡單的選擇。
3. 透過 LLM 觸發工具。UI 會內嵌呈現。

對於純 UI 疊代，[MCP 檢測器 (Inspector)](https://github.com/modelcontextprotocol/inspector) 會顯示資源內容，但不會完整呈現應用程式；若要完整呈現，請將 Claude Desktop 指向您的開發伺服器。

## 常見陷阱

- **錯誤的 MIME 類型。** 請使用 `text/html+skybridge`。一般的 `text/html` 可能仍可運作，但並非長久之計。
- **CSP 太嚴格或太寬鬆。** 如果您的 UI 從 CDN 載入，請在 `Tool` 定義的 `Meta["ui"]["csp"]` 中宣告（這會序列化為連線上的 `_meta.ui.csp`）。否則 iframe 沙盒會封鎖它。
- **忘記在工具上設定 `Tool.Meta`。** 若沒有包含 `ui.resourceUri` 項目的 `Meta` 屬性，主機會將您的工具視為一般的回傳文字工具。UI 永遠不會出現。
- **嘗試在沙盒外使用瀏覽器 API。** 無法使用來自父系的 Cookie 或 localStorage。請使用 `app.updateModelContext` 和工具呼叫來管理狀態。

## 未來規劃

當 C# SDK 發佈其具型別的 MCP 應用程式協助程式時（問題 [#1431](https://github.com/modelcontextprotocol/csharp-sdk/issues/1431)），您可能能夠使用屬性或流暢建立器（fluent builder）來取代手動的 `Configure` 區塊。`ui://` 資源的提供方式不會改變。請將您的 UI HTML 保留為內嵌資源，以便日後進行機械式的遷移。
