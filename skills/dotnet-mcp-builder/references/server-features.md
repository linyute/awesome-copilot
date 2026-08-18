# 其他伺服器功能 (自動完成、記錄、進度、篩選器)

這是核心原始型別之外較小 MCP 伺服器功能的快速參考。每個章節都很簡短 — 當遇到其中一項功能時請載入此檔案。

## 引數自動完成 (Argument completions)

自動完成功能讓主機能自動完成提示詞引數和資源範本參數。使用者開始輸入；用戶端會向伺服器詢問「有效值有哪些？」。

透過低階處理常式實作（目前尚無高階屬性）：

```csharp
builder.Services.Configure<McpServerOptions>(options =>
{
    options.Capabilities ??= new();
    options.Capabilities.Completions ??= new();

    options.Capabilities.Completions.CompleteHandler = async (ctx, ct) =>
    {
        // ctx.Params.Ref 告訴我們他們正在完成什麼（提示詞或資源）。
        // ctx.Params.Argument 包含到目前為止輸入的部分值。
        var partial = ctx.Params.Argument.Value ?? "";
        var matches = MyDataSource
            .Where(x => x.StartsWith(partial, StringComparison.OrdinalIgnoreCase))
            .Take(100)
            .ToArray();

        return new CompleteResult
        {
            Completion = new()
            {
                Values = matches,
                HasMore = false,
                Total = matches.Length
            }
        };
    };
});
```

適用於：專案 ID、檔案名稱、依賴動態資料的列舉值。

## 記錄 (Logging)

伺服器可以發出主機在其 UI 中呈現的記錄訊息（LLM 有時也可以看到）。使用透過 DI 插入的標準 `ILogger<T>` — SDK 會進行傳遞。

```csharp
public class WeatherTools
{
    private readonly ILogger<WeatherTools> _log;
    public WeatherTools(ILogger<WeatherTools> log) => _log = log;

    [McpServerTool, Description("…")]
    public string GetWeather(string city)
    {
        _log.LogInformation("Looking up weather for {City}", city);
        return "...";
    }
}
```

對於 STDIO 伺服器，請記住：主控台記錄**必須**輸出至 stderr (`LogToStandardErrorThreshold = LogLevel.Trace`) — 否則會損壞 JSON-RPC 串流。請參閱 [`transport-stdio.md`](./transport-stdio.md)。

> **MCP 通道記錄在 2026-07-28 規格中已被棄用** — SDK 2.x 將其標記為 `[Obsolete]` (`MCP9005`)，連同 `logging` 功能和用戶端的 `setLevel` 方法（被請求上的 `_meta` 記錄層級取代）。上述基於 `ILogger` 的記錄不受影響，仍是正確的預設做法。僅在支援預期此功能的舊版用戶端時使用下方的 MCP 通道通知：

```csharp
await server.SendNotificationAsync(
    NotificationMethods.LoggingMessageNotification,
    new LoggingMessageNotificationParams
    {
        Level = LoggingLevel.Info,
        Logger = "weather",
        Data = JsonSerializer.SerializeToElement(new { city, latency_ms = 123 })
    },
    ct);
```

用戶端可能已設定 `setLevel` 篩選器 — 請勿發送低於該層級的垃圾訊息。

## 進度通知 (Progress notifications)

對於長時間執行的工具，傳送進度更新以便主機可以顯示帶有文字的微調指示器 (spinner)：

```csharp
[McpServerTool, Description("處理大型資料集。")]
public static async Task<string> Process(
    IMcpServer server,
    RequestContext<CallToolRequestParams> ctx,
    string datasetId,
    CancellationToken ct)
{
    var progressToken = ctx.Params.Meta?.ProgressToken;

    for (int i = 0; i < 100; i++)
    {
        await Task.Delay(50, ct);

        if (progressToken is not null)
        {
            await server.SendNotificationAsync(
                NotificationMethods.ProgressNotification,
                new ProgressNotificationParams
                {
                    ProgressToken = progressToken,
                    Progress = i + 1,
                    Total = 100,
                    Message = $"正在處理第 {i + 1} 個項目（共 100 個）"
                },
                ct);
        }
    }

    return "Done.";
}
```

僅在用戶端於請求 meta 中傳遞 `progressToken` 時傳送進度 — 否則主機不會進行接聽。

## 通知處理常式（伺服器端）

伺服器可以對用戶端傳送的通知做出反應：

```csharp
options.Capabilities ??= new();
options.Capabilities.NotificationHandlers ??= [];

options.Capabilities.NotificationHandlers[NotificationMethods.RootsListChangedNotification] =
    async (notification, ct) =>
    {
        // 重新整理 root 快取等。
    };

options.Capabilities.NotificationHandlers[NotificationMethods.CancelledNotification] =
    async (notification, ct) =>
    {
        // 用戶端取消了請求；如果進行中有副作用，請將其中止。
    };
```

## 篩選器 / 中介軟體 (Filters / middleware)

SDK 支援包裝工具呼叫的篩選器（可視為 MCP 的 ASP.NET Core 中介軟體）。使用它們處理跨領域關注點：驗證檢查、遙測、速率限制、稽核記錄。

```csharp
builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly()
    .WithCallToolFilter(async (ctx, next) =>
    {
        var sw = Stopwatch.StartNew();
        try
        {
            return await next(ctx);
        }
        finally
        {
            sw.Stop();
            ctx.Server.Services?
                .GetRequiredService<ILogger<Program>>()
                .LogInformation("Tool {Tool} took {Ms}ms",
                    ctx.Params.Name, sw.ElapsedMilliseconds);
        }
    });
```

資源、提示詞和其他功能也存在類似的 `With*Filter` 協助程式 — 請查閱 SDK API 參考以獲取目前集合。

## 伺服器指示 (Server instructions，類似系統提示詞)

你可以提供在初始化時傳送給用戶端的指示。主機可以將它們納入 LLM 的系統提示詞中。

```csharp
builder.Services.AddMcpServer(options =>
{
    options.ServerInstructions =
        "使用預訂工具排定會議。" +
        "在透過 elicitation 預訂之前，一律先向使用者確認。";
});
```

請保持簡短 — 這裡的每個 token 都會消耗使用者的成本。

## 功能宣傳 (Capabilities advertising)

如果你希望*不*宣傳剛好有程式碼的功能，可以將其靜音：

```csharp
builder.Services.AddMcpServer(options =>
{
    options.Capabilities = new()
    {
        Tools = new(),       // 宣傳工具
        Prompts = new(),     // 宣傳提示詞
        Resources = null,    // 不宣傳資源，即使已註冊某些資源
    };
});
```

預設情況下，SDK 會宣傳你註冊的所有內容 — 這通常是正確的行為。請注意，`Logging` 在 2.x 中已被標記為 `[Obsolete]` (`MCP9005`) — 請勿在新伺服器上宣傳它。Roots 和 sampling 是*用戶端*功能：伺服器絕不宣傳它們，僅在使用（同樣已棄用的）用戶端功能之前檢查 `server.ClientCapabilities?.Roots` / `.Sampling`。
