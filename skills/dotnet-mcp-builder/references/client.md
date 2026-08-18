# 在 .NET 中建構 MCP 用戶端

這是一份從 .NET **取用** MCP 伺服器的簡短參考文件 — 對於測試伺服器、建構 Agent 測試載具，或將 MCP 連接至 Semantic Kernel / Microsoft.Extensions.AI 管道非常有用。

如果僅是*執行*伺服器，請忽略此檔案。

## 套件

```bash
dotnet add package ModelContextProtocol.Core   # 最小化：僅包含用戶端 + 傳輸
# 或
dotnet add package ModelContextProtocol         # 新增 DI/代管協助程式
```

## 透過 STDIO 連線（啟動伺服器處理序）

```csharp
using ModelContextProtocol.Client;

var transport = new StdioClientTransport(new StdioClientTransportOptions
{
    Command = "dotnet",
    Arguments = ["run", "--project", "../MyMcpServer"],
    EnvironmentVariables = new() { ["MY_API_KEY"] = "..." },
    ShutdownTimeout = TimeSpan.FromSeconds(10),
    StandardErrorLines = line => Console.Error.WriteLine($"[server] {line}")
});

await using var client = await McpClient.CreateAsync(transport);
```

`StandardErrorLines` 是一個很好的偵錯輔助工具 — 你將在伺服器記錄產生時即時看見它們。

## 透過 HTTP (Streamable) 連線

```csharp
using ModelContextProtocol.Client;

var transport = new HttpClientTransport(new HttpClientTransportOptions
{
    Endpoint = new Uri("https://my-server.example.com/mcp"),
    TransportMode = HttpTransportMode.StreamableHttp,
    ConnectionTimeout = TimeSpan.FromSeconds(30),
    AdditionalHeaders = new Dictionary<string, string>
    {
        ["Authorization"] = "Bearer ..."
    }
});

await using var client = await McpClient.CreateAsync(transport);
```

`TransportMode = AutoDetect`（預設值）會先嘗試 Streamable HTTP，然後後備至 SSE — 對於較舊的伺服器很有用，但新程式碼請固定為 `StreamableHttp`，以便在失敗時明確報錯。

## 列出與呼叫工具

```csharp
IList<McpClientTool> tools = await client.ListToolsAsync();

foreach (var t in tools)
    Console.WriteLine($"- {t.Name}: {t.Description}");

var echo = tools.First(t => t.Name == "Echo");
CallToolResult result = await echo.CallAsync(new Dictionary<string, object?>
{
    ["message"] = "hello"
});

if (result.IsError == true)
{
    var msg = result.Content.OfType<TextContentBlock>().FirstOrDefault()?.Text;
    Console.Error.WriteLine($"Tool failed: {msg}");
    return;
}

foreach (var block in result.Content)
{
    switch (block)
    {
        case TextContentBlock text:
            Console.WriteLine(text.Text);
            break;
        case ImageContentBlock image:
            File.WriteAllBytes("out.png", image.DecodedData.ToArray());
            break;
    }
}
```

## 列出提示詞與資源

```csharp
IList<McpClientPrompt> prompts = await client.ListPromptsAsync();
GetPromptResult pr = await client.GetPromptAsync("code_review",
    new Dictionary<string, object?> { ["language"] = "csharp", ["code"] = "..." });

IList<McpClientResource> resources = await client.ListResourcesAsync();
ReadResourceResult rr = await client.ReadResourceAsync("config://app/settings");
```

## 訂閱伺服器通知

```csharp
client.RegisterNotificationHandler(
    NotificationMethods.ToolListChangedNotification,
    async (notification, ct) =>
    {
        var updated = await client.ListToolsAsync(cancellationToken: ct);
        Console.WriteLine($"Tool list changed; now {updated.Count} tools.");
    });
```

## 版本交涉 (2026-07-28)

自 2.x 起，`McpClient.CreateAsync` 會先以 `server/discover` 探測伺服器，並自動針對舊版伺服器後備至舊版 `initialize` 信號交換 — 你這端不需要任何設定。

## 處理伺服器至用戶端請求 (sampling, elicitation, roots)

如果你的伺服器使用這些功能，你的用戶端必須處理它們。請注意，在 2026-07-28 規格中已棄用 sampling 和 roots（在 2.x 上會出現 `MCP9005` 警告）— 你仍然需要處理常式來與使用它們的伺服器進行互通。在建立用戶端時設定處理常式：

```csharp
await using var client = await McpClient.CreateAsync(transport, new McpClientOptions
{
    Capabilities = new()
    {
        Sampling = new()
        {
            SamplingHandler = async (req, progress, ct) =>
            {
                // 將 req.Messages 路由至你的 IChatClient 並回傳 CreateMessageResult。
                var response = await myChatClient.GetResponseAsync(/* convert */, ct);
                return new CreateMessageResult { /* fill in */ };
            }
        },
        Elicitation = new()
        {
            ElicitationHandler = async (req, ct) =>
            {
                // 向使用者顯示 req.Message + req.RequestedSchema；收集輸入。
                return new ElicitResult { Action = "accept", Content = collectedValues };
            }
        },
        Roots = new()
        {
            RootsHandler = async (req, ct) =>
            {
                return new ListRootsResult
                {
                    Roots = new[] { new Root { Uri = "file:///workspace", Name = "Workspace" } }
                };
            }
        }
    }
});
```

如果你未提供處理常式且伺服器呼叫了該功能，該呼叫將失敗並顯示「方法不受支援」錯誤。

## 將 MCP 工具用作 `IChatClient` 函式工具

如果你要將 MCP 插入 `Microsoft.Extensions.AI` 管道中，請將工具公開為 `AIFunction`：

```csharp
using Microsoft.Extensions.AI;

IList<McpClientTool> mcpTools = await client.ListToolsAsync();

var chatOptions = new ChatOptions
{
    Tools = mcpTools.Cast<AITool>().ToList()
};

var chatClient = new MyChatClient(...);   // 任何 IChatClient
var response = await chatClient.GetResponseAsync(messages, chatOptions);
```

`McpClientTool` 實作了 `AIFunction` — 函式呼叫中介軟體將自動呼叫正確的工具並將結果饋回給 LLM。

## 繼續工作階段 (HTTP, 具狀態)

```csharp
var transport = new HttpClientTransport(new HttpClientTransportOptions
{
    Endpoint = new Uri("https://my-server.example.com/mcp"),
    KnownSessionId = previousSessionId
});

await using var client = await McpClient.ResumeSessionAsync(transport, new ResumeClientSessionOptions
{
    ServerCapabilities = previousServerCapabilities,
    ServerInfo = previousServerInfo
});
```

這對於在短暫網路中斷後留存的長生命週期 Agent 處理序很有用。
