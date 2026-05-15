# 其他伺服器功能 (自動完成、記錄、進度、篩選器)

核心基本元件之外較小的 MCP 伺服器功能快速參考。每個章節都很簡短 — 當遇到其中之一時，請載入此檔案。

## 引數自動完成

自動完成讓主機可以自動完成提示詞引數和資源範本參數。使用者開始輸入；用戶端詢問伺服器「哪些是有效的值？」。

透過低階處理常式實作 (目前尚不存在高階屬性)：

```csharp
builder.Services.Configure<McpServerOptions>(options =>
{
    options.Capabilities ??= new();
    options.Capabilities.Completions ??= new();

    options.Capabilities.Completions.CompleteHandler = async (ctx, ct) =>
    {
        // ctx.Params.Ref 告訴我們他們正在完成什麼 (提示詞或資源)。
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

適用於：專案識別碼、檔案名稱、取決於動態資料的列舉值。

## 記錄

伺服器可以發送主機在 UI 中呈現的記錄訊息 (LLM 有時也能看到)。使用透過 DI 插入的標準 `ILogger<T>` — SDK 會將其串接起來。

```csharp
public class WeatherTools
{
    private readonly ILogger<WeatherTools> _log;
    public WeatherTools(ILogger<WeatherTools> log) => _log = log;

    [McpServerTool, Description("…")]
    public string GetWeather(string city)
    {
        _log.LogInformation("正在尋找 {City} 的天氣", city);
        return "...";
    }
}
```

對於 STDIO 伺服器，請記住：主控台記錄**必須**傳送到 stderr (`LogToStandardErrorThreshold = LogLevel.Trace`) — 否則它會損壞 JSON-RPC 串流。請參閱 [`transport-stdio.md`](./transport-stdio.md)。

若要專門透過 MCP 通道傳送記錄 (以便*主機 UI* 看到它，而不僅僅是您的容器記錄)：

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

用戶端可能已設定 `setLevel` 篩選器 — 不要發送低於該層級的大量訊息。

## 進度通知

對於長時間執行的工具，請傳送進度更新，以便主機顯示帶有文字的旋轉圖示：

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
                    Message = $"正在處理第 {i + 1} 個項目，共 100 個"
                },
                ct);
        }
    }

    return "完成。";
}
```

僅當用戶端在請求 Metadata 中傳遞了 `progressToken` 時才傳送進度 — 否則主機不會進行監聽。

## 通知處理常式 (伺服器端)

伺服器可以對用戶端傳送的通知做出回應：

```csharp
options.Capabilities ??= new();
options.Capabilities.NotificationHandlers ??= [];

options.Capabilities.NotificationHandlers[NotificationMethods.RootsListChangedNotification] =
    async (notification, ct) =>
    {
        // 重新整理根快取等。
    };

options.Capabilities.NotificationHandlers[NotificationMethods.CancelledNotification] =
    async (notification, ct) =>
    {
        // 用戶端取消了請求；如果您有執行中的副作用，請中止它們。
    };
```

## 篩選器 / 中介軟體

SDK 支援包裝工具呼叫的篩選器 (想像一下 MCP 的 ASP.NET Core 中介軟體)。將它們用於橫切關注點：驗證檢查、遙測、速率限制、稽核記錄。

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
                .LogInformation("工具 {Tool} 耗時 {Ms} 毫秒",
                    ctx.Params.Name, sw.ElapsedMilliseconds);
        }
    });
```

資源、提示詞和其他功能也存在類似的 `With*Filter` 協助程式 — 請查看 SDK API 參考以獲取目前的集合。

## 伺服器指示 (類似系統提示詞)

您可以提供在初始化時傳送給用戶端的指示。主機可能會將其包含在 LLM 的系統提示詞中。

```csharp
builder.Services.AddMcpServer(options =>
{
    options.ServerInstructions =
        "使用預約工具排定會議。" +
        "在透過引導式對話進行預約之前，務必先與使用者確認。";
});
```

請保持簡短 — 這裡的每個權杖 (token) 都會增加使用者的成本。

## 功能廣告 (Advertising)

如果您不想公開宣傳您恰好擁有的程式碼功能，可以將其靜音：

```csharp
builder.Services.AddMcpServer(options =>
{
    options.Capabilities = new()
    {
        Tools = new(),       // 宣傳工具
        Prompts = new(),     // 宣傳提示詞
        Resources = null,    // 不宣傳資源，即使已註冊某些資源
        Logging = new()
    };
});
```

預設情況下，SDK 會宣傳您註冊的所有內容 — 這通常是正確的行為。
