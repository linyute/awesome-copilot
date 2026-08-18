# 測試與本地偵錯

三種工作流程：使用 MCP Inspector 進行互動式測試、跨處理序內整合測試，以及 CI 友善的單元測試。

## MCP Inspector (互動式)

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) 是手動試用伺服器的首選工具。它會啟動你的伺服器，透過 STDIO 或 HTTP 連線，並提供 UI 讓你列出/呼叫工具、檢視資源、觸發 elicitation、檢視記錄以及檢查原始 JSON-RPC 框架。

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

正常啟動伺服器 (`dotnet run`)，然後在 Inspector 中選擇 "Streamable HTTP" 並輸入 URL（例如 `http://localhost:3001`）。

### 適用時機

- 驗證工具描述是否清晰（Inspector 會按照 LLM 取用它們的方式轉譯）。
- 在沒有真實 LLM 的情況下逐步執行 elicitation 流程。
- 在提交錯誤回報時擷取精確的 JSON-RPC 承載資料 (payloads)。

## 跨處理序內整合測試（推薦）

最簡潔的測試設定使用 `InMemoryTransport`（或較低階的 `StreamServerTransport` / `StreamClientTransport`）將真實的伺服器和真實的用戶端連接在同一個處理序中。沒有子處理序，沒有網路。

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

這種風格允許你對*公開的*行為（真實用戶端看到的內容）進行斷言，而非內部細節。

## 測試使用 sampling/elicitation/roots 的工具

（在 2.x 上已棄用 sampling 和 roots — 預期在練習使用它們的測試專案中會出現 `MCP9005` 警告；若刻意涵蓋舊版路徑，請在測試 csproj 中進行隱藏。）

插入 MCP 伺服器，但提供模擬用戶端功能。使用上述的記憶體內模式，在用戶端上註冊處理常式：

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

現在你的工具呼叫 `server.SampleAsync` / `server.ElicitAsync` 都會命中具決定性的模擬物件。

## DI 層級的單元測試

對於沒有 MCP 專屬行為的純邏輯，只需測試該類別：

```csharp
[Fact]
public void Echo_prepends_hello()
{
    Assert.Equal("hello world", EchoTool.Echo("world"));
}
```

`[McpServerTool]` 屬性不會影響 MCP 連接以外的執行階段行為 — 你的方法只是普通方法。

## 開發期間從 Claude Desktop / VS Code 執行

進行端對端「如同真實環境」的測試：

1. 執行 `dotnet publish -c Release`（或僅執行 `dotnet build` 並使用 `dotnet run`）。
2. 將 Claude Desktop / VS Code 指向二進位檔案或 `dotnet run --project ...`。組態程式碼片段請參閱 [`transport-stdio.md`](./transport-stdio.md)。
3. 重新啟動主機。
4. 從聊天中觸發工具。

迭代時，請設定 `dotnet watch run --project ...`，以便伺服器在編輯時重新啟動；主機通常會在下一次工具呼叫時重新連線。

## CI

典型的 CI 管道：

```yaml
- run: dotnet restore
- run: dotnet build --no-restore
- run: dotnet test --no-build --logger "trx;LogFileName=test-results.trx"
```

沒有任何 MCP 專屬內容。記憶體內傳輸測試可以在任何可執行 `dotnet test` 的地方執行 — 無需 Node，無需 Docker。

## 常見診斷技巧

- **「工具沒有顯示」：** 在快速測試中呼叫 `client.ListToolsAsync()` 並傾印名稱。如果你的工具不在其中，則是註冊有誤。
- **「LLM 一直誤用工具」：** 開啟 Inspector 並查看 LLM 看到的結構描述/描述。大多數「模型很笨」的問題實際上是缺少 `[Description]`。
- **「Sampling/elicitation 擲出 'method not supported'」：** 用戶端未宣傳該功能。要麼是你針對不支援的主機進行測試（Inspector 兩者皆支援），要麼是你的記憶體內用戶端缺少處理常式。
- **「HTTP 對 / 回傳 404」：** 檢查是否已呼叫 `app.MapMcp()` *並且*命中正確的路徑。`MapMcp("/mcp")` 代表 URL 為 `http://host/mcp`，而不是 `http://host/`。
