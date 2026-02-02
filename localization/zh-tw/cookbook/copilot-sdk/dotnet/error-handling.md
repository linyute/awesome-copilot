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
using GitHub.Copilot.SDK;

var client = new CopilotClient();

try
{
    await client.StartAsync();
    var session = await client.CreateSessionAsync(new SessionConfig
    {
        Model = "gpt-5"
    });

    var done = new TaskCompletionSource<string>();
    session.On(evt =>
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
var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });

try
{
    var done = new TaskCompletionSource<string>();
    session.On(evt =>
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
var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });

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

    var errors = await client.StopAsync();
    if (errors.Count > 0)
    {
        Console.WriteLine($"清理錯誤：{string.Join(", ", errors)}");
    }

    Environment.Exit(0);
};
```

## 使用 await using 進行自動處置

```csharp
await using var client = new CopilotClient();
await client.StartAsync();

var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });

// ... 執行工作 ...

// 離開範圍時會自動呼叫 client.StopAsync()
```

## 最佳實踐

1. **務必進行清理**：使用 try-finally 或 `await using` 以確保呼叫 `StopAsync()`
2. **處理連線錯誤**：CLI 可能未安裝或未執行
3. **設定適當的逾時**：針對長時間執行的請求使用 `CancellationToken`
4. **記錄錯誤**：擷取錯誤詳細資訊以進行偵錯
