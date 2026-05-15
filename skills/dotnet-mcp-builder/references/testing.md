# 測試與本機偵錯

三種工作流程：使用 MCP Inspector 進行互動式測試、程序內整合測試，以及 CI 友善的單元測試。

## MCP Inspector (互動式)

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) 是手動嘗試伺服器的首選工具。它會啟動您的伺服器，透過 STDIO 或 HTTP 連線，並提供一個介面來列出/呼叫工具、檢視資源、觸發啟發 (elicitations)、查看記錄，以及檢查原始的 JSON-RPC 框架。

### STDIO

```bash
npx @modelcontextprotocol/inspector dotnet run --project ./MyMcpServer
```

在 `--` 之後傳遞環境變數或引數：

```bash
npx @modelcontextprotocol/inspector \
  dotnet run --project ./MyMcpServer -- \
  --some-flag value
```

### HTTP

正常啟動伺服器 (`dotnet run`)，然後在 Inspector 中選擇 "Streamable HTTP" 並輸入 URL (例如 `http://localhost:3001`)。

### 用於

- 驗證工具描述是否清晰 (Inspector 會像 LLM 使用它們一樣來呈現)。
- 在沒有真實 LLM 的情況下逐步執行啟發流程。
- 在提交錯誤報告時擷取精確的 JSON-RPC 承載資料 (payloads)。

## 程序內整合測試 (建議使用)

最乾淨的測試設定是使用 `InMemoryTransport` (或較低階的 `StreamServerTransport` / `StreamClientTransport`) 將真實的伺服器與真實的用戶端連接在同一個程序中。不需子程序，不需網路。

```csharp
using System.IO.Pipelines;
using ModelContextProtocol;
using ModelContextProtocol.Client;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;
using Xunit;

public class WeatherToolsTests
{
    [Fact]
    public async Task GetWeather_returns_text()
    {
        var clientToServer = new Pipe();
        var serverToClient = new Pipe();

        await using var server = McpServer.Create(
            new StreamServerTransport(
                clientToServer.Reader.AsStream(),
                serverToClient.Writer.AsStream()),
            new McpServerOptions
            {
                ToolCollection =
                [
                    McpServerTool.Create(
                        (string city) => $"{city}: 18°C",
                        new() { Name = "GetWeather" })
                ]
            });

        var serverTask = server.RunAsync();

        await using var client = await McpClient.CreateAsync(
            new StreamClientTransport(
                clientToServer.Writer.AsStream(),
                serverToClient.Reader.AsStream()));

        var tools = await client.ListToolsAsync();
        var tool = tools.Single(t => t.Name == "GetWeather");

        var result = await tool.CallAsync(new Dictionary<string, object?>
        {
            ["city"] = "Brussels"
        });

        Assert.False(result.IsError);
        var text = result.Content.OfType<TextContentBlock>().Single().Text;
        Assert.Equal("Brussels: 18°C", text);
    }
}
```

這種風格讓您可以針對 *公開* 的行為 (真實用戶端所看到的內容) 進行判斷，而非內部細節。

## 測試使用取樣/啟發/根目錄的工具

插入 MCP 伺服器，但提供模擬的用戶端能力。配合上述的記憶體內模式，在用戶端註冊處理常式：

```csharp
await using var client = await McpClient.CreateAsync(clientTransport, new McpClientOptions
{
    Capabilities = new()
    {
        Sampling = new()
        {
            SamplingHandler = (req, progress, ct) =>
                Task.FromResult(new CreateMessageResult
                {
                    Content = [new TextContentBlock { Text = "MOCK SUMMARY" }]
                })
        },
        Elicitation = new()
        {
            ElicitationHandler = (req, ct) =>
                Task.FromResult(new ElicitResult
                {
                    Action = "accept",
                    Content = JsonSerializer.SerializeToNode(new { confirm = true })
                                .AsObject().ToDictionary(kv => kv.Key, kv => JsonDocument.Parse(kv.Value!.ToJsonString()).RootElement)
                })
        }
    }
});
```

現在您工具的 `server.SampleAsync` / `server.ElicitAsync` 呼叫將會觸發確定性的模擬。

## DI 層的單元測試

對於不包含 MCP 特定行為的純邏輯，只需測試該類別：

```csharp
[Fact]
public void Echo_prepends_hello()
{
    Assert.Equal("hello world", EchoTool.Echo("world"));
}
```

`[McpServerTool]` 屬性不會影響 MCP 佈線以外的執行階段行為 — 您的函式就只是函式。

## 開發期間從 Claude Desktop / VS Code 執行

對於端對端「感覺就像真的一樣」的測試：

1. 執行 `dotnet publish -c Release` (或僅執行 `dotnet build` 並使用 `dotnet run`)。
2. 將 Claude Desktop / VS Code 指向二進位檔或 `dotnet run --project ...`。請參閱 [`transport-stdio.md`](./transport-stdio.md) 以取得設定程式碼片段。
3. 重新啟動主機。
4. 從聊天中觸發工具。

反覆操作時，設定 `dotnet watch run --project ...` 以便伺服器在編輯時重新啟動；主機通常會在下一次工具呼叫時重新連線。

## CI

典型的 CI 管線：

```yaml
- run: dotnet restore
- run: dotnet build --no-restore
- run: dotnet test --no-build --logger "trx;LogFileName=test-results.trx"
```

不包含 MCP 特定內容。記憶體內傳輸測試可以在任何執行 `dotnet test` 的地方執行 — 不需 Node，不需 Docker。

## 常見診斷技巧

- **「工具沒有出現」：** 在快速測試中呼叫 `client.ListToolsAsync()` 並傾印名稱。如果您的工具不在那裡，則註冊錯誤。
- **「LLM 一直誤用工具」：** 開啟 Inspector 並查看 LLM 所看到的結構描述 (schema)/描述。大多數「模型很笨」的問題實際上是缺少 `[Description]`。
- **「取樣/啟發拋出 'method not supported'」：** 用戶端未宣告該能力。您可能是在不支援該能力的環境 (Inspector 兩者都支援) 中進行測試，或者是您的記憶體內用戶端缺少處理常式。
- **「HTTP 對 / 回傳 404」：** 檢查是否已呼叫 `app.MapMcp()` *且* 您存取的是正確路徑。`MapMcp("/mcp")` 意味著 URL 是 `http://host/mcp`，而不是 `http://host/`。
