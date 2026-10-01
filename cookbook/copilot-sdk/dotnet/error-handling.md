# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

> **可執行範例：** [recipe/error-handling.cs](recipe/error-handling.cs)
>
> ```bash
> dotnet run recipe/error-handling.cs
> ```

## 範例場景

您需要處理各種錯誤狀況，例如連線失敗、逾時與無效的回應。

## 基本 try-catch

```csharp
using GitHub.Copilot;

var client = new CopilotClient();

try
{
    await client.StartAsync();
    var session = await client.CreateSessionAsync(new SessionConfig
    {
        Model = "auto",
        OnPermissionRequest = PermissionHandler.ApproveAll
    });

    var done = new TaskCompletionSource<string>();
    session.On<SessionEvent>(evt =>
    {
        if (evt is AssistantMessageEvent msg)
        {
            done.SetResult(msg.Data.Content);
        }
    });

    await session.SendAsync(new MessageOptions { Prompt = "Hello!" });
    var response = await done.Task;
    Console.WriteLine(response);

    await session.DisposeAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"錯誤：{ex.Message}");
}
finally
{
    await client.StopAsync();
}
```

> `Session.On` 現在是泛型方法：`On<T>(Action<T> handler) where T : SessionEvent`。
> 型別參數無法再從僅在函式體內進行模式比對的 lambda 中推斷，
> 因此像 `session.On(evt => { if (evt is AssistantMessageEvent msg) ... })` 這樣的呼叫會因 `CS0411` 而編譯失敗。
> 您可以指定 `On<SessionEvent>` 並在內部進行模式比對（如上所示），或直接訂閱您關注的具體事件型別，
> 例如 `session.On<AssistantMessageEvent>(evt => Console.WriteLine(evt.Data?.Content))`。

## 處理特定錯誤類型

```csharp
try
{
    await client.StartAsync();
}
catch (FileNotFoundException)
{
    Console.WriteLine("找不到 Copilot CLI。請先安裝。");
}
catch (HttpRequestException ex) when (ex.Message.Contains("connection"))
{
    Console.WriteLine("無法連線至 Copilot CLI 伺服器。");
}
catch (Exception ex)
{
    Console.WriteLine($"未預期的錯誤：{ex.Message}");
}
```

## 逾時處理

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "auto",
    OnPermissionRequest = PermissionHandler.ApproveAll
});

try
{
    var done = new TaskCompletionSource<string>();
    session.On<SessionEvent>(evt =>
    {
        if (evt is AssistantMessageEvent msg)
        {
            done.SetResult(msg.Data.Content);
        }
    });

    await session.SendAsync(new MessageOptions { Prompt = "複雜的問題..." });

    // 等待逾時（30 秒）
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    var response = await done.Task.WaitAsync(cts.Token);

    Console.WriteLine(response);
}
catch (OperationCanceledException)
{
    Console.WriteLine("請求逾時");
}
```

## 中止請求

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "auto",
    OnPermissionRequest = PermissionHandler.ApproveAll
});

// 開始一個請求
await session.SendAsync(new MessageOptions { Prompt = "寫一個很長的故事..." });

// 在某些條件下中止它
await Task.Delay(5000);
await session.AbortAsync();
Console.WriteLine("請求已中止");
```

## 優雅關閉

```csharp
Console.CancelKeyPress += async (sender, e) =>
{
    e.Cancel = true;
    Console.WriteLine("正在關閉...");

    try
    {
        await client.StopAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"清理錯誤：{ex.Message}");
    }

    Environment.Exit(0);
};
```

> 在 1.0 版本中，若清理過程中發生錯誤，`StopAsync()` 會拋出異常，而非回傳清理錯誤清單。因此請用 try/catch 包起來記錄失敗訊息，避免導致關閉流程中斷。若正常停止耗時過久，可使用 `ForceStopAsync()`。

## 使用 await using 進行自動處置

```csharp
await using var client = new CopilotClient();
await client.StartAsync();

var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "auto",
    OnPermissionRequest = PermissionHandler.ApproveAll
});

// ... 執行工作 ...

// 離開範圍時會自動呼叫 client.StopAsync()
```

## 標記訊息來源

自 v1.0.14 起，`MessageOptions` 新增了 `Source` 屬性，讓您可以標記訊息的*發送原因*——
當對話記錄中出現錯誤或預期的回合時，這有助於區分人類輸入與由自動化系統
（Webhook 處理器、排程任務、其他代理）代表使用者發送的訊息。

```csharp
using GitHub.Copilot;

// 一般人類輸入（省略 Source 時的預設值）。
await session.SendAsync(new MessageOptions
{
    Prompt = "上次發布有哪些變更？",
    Source = MessageSource.User
});

// 由您的系統注入的訊息，而非由人類輸入，
// 例如排程健康檢查或自動重試。
await session.SendAsync(new MessageOptions
{
    Prompt = "重新執行失敗的步驟並回報結果。",
    Source = MessageSource.System
});

// 由其他代理或自動化代表使用者發送的訊息，
// 標記呼叫端提供的識別碼。
await session.SendAsync(new MessageOptions
{
    Prompt = "摘要目前開啟的事件。",
    Source = MessageSource.Agent("incident-bot")
});
```

`MessageSource` 是一個封閉的 record，包含 `User`、`System` 以及
`MessageSource.Agent(string id)` 工廠方法（序列化為 `"agent-<id>"`）。
標記來源僅在訊息上記錄來源資訊——
它不會改變訊息的傳遞方式、取代會話的系統提示詞，或授予額外權限。
當省略 `Source` 時，該欄位保持未設定狀態，執行時會將訊息視為一般使用者輸入。

## 最佳實踐

權限處理是選擇性的。如果會話可能需要工具、檔案或系統存取，請在建立時明確設定 `OnPermissionRequest`。

1. **務必進行清理**：使用 try-finally 或 `await using` 以確保呼叫 `StopAsync()`
2. **處理連線錯誤**：CLI 可能未安裝或未執行
3. **設定適當的逾時**：針對長時間執行的請求使用 `CancellationToken`
4. **記錄錯誤**：擷取錯誤詳細資訊以進行偵錯
