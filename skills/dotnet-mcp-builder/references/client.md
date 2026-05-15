# 在 .NET 中建構 MCP 用戶端

從 .NET *取用* MCP 伺服器的簡短參考 — 對於測試您的伺服器、建構代理程式控管，或將 MCP 接入 Semantic Kernel / Microsoft.Extensions.AI 管線非常有用。

如果只是要*執行*伺服器，請忽略此檔案。

## 套件

```bash
dotnet add package ModelContextProtocol.Core   # 最小化：僅包含用戶端 + 傳輸
# 或
dotnet add package ModelContextProtocol         # 新增 DI/代管協助程式
```

## 透過 STDIO 連線 (啟動伺服器程序)

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

`StandardErrorLines` 是極佳的偵錯輔助工具 — 您將能即時看到伺服器的紀錄。

## 透過 HTTP 連線 (可串流)

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

`TransportMode = AutoDetect` (預設值) 會先嘗試可串流 HTTP 並在失敗時退回到 SSE — 這對較舊的伺服器很有用，但對於新程式碼建議固定使用 `StreamableHttp` 以便在失敗時能明確得知。

## 列出並呼叫工具

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
    Console.Error.WriteLine($"工具呼叫失敗：{msg}");
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
        Console.WriteLine($"工具列表已變更；現在有 {updated.Count} 個工具。");
    });
```

## 處理伺服器對用戶端的請求 (取樣、啟發、根目錄)

如果您的伺服器使用這些功能，您的用戶端必須處理它們。請在建立用戶端時設定處理常式：

```csharp
await using var client = await McpClient.CreateAsync(transport, new McpClientOptions
{
    Capabilities = new()
    {
        Sampling = new()
        {
            SamplingHandler = async (req, progress, ct) =>
            {
                // 將 req.Messages 路由到您的 IChatClient 並傳回 CreateMessageResult。
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

如果您未提供處理常式且伺服器呼叫該功能，則呼叫將失敗並顯示「方法不受支援」錯誤。

## 將 MCP 工具作為 `IChatClient` 函式工具使用

如果您正將 MCP 接入 `Microsoft.Extensions.AI` 管線，請將工具公開為 `AIFunction`：

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

`McpClientTool` 實作了 `AIFunction` — 函式呼叫中介軟體將自動呼叫正確的工具並將結果回傳給 LLM。

## 恢復工作階段 (HTTP，具狀態)

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

對於在短暫網路中斷後仍需存續的長期執行代理程式程序非常有用。
