# 工作階段持續性與恢復

跨應用程式重新啟動儲存並還原對話工作階段。

## 範例場景

您希望使用者即使在關閉並重新開啟您的應用程式後，仍能繼續對話。

> **可執行範例：** [recipe/persisting-sessions.cs](recipe/persisting-sessions.cs)
>
> ```bash
> cd recipe
> dotnet run persisting-sessions.cs
> ```

### 使用自定義 ID 建立工作階段

```csharp
using GitHub.Copilot.SDK;

await using var client = new CopilotClient();
await client.StartAsync();

// 使用易記的 ID 建立工作階段
var session = await client.CreateSessionAsync(new SessionConfig
{
    SessionId = "user-123-conversation",
    Model = "gpt-5"
});

await session.SendAsync(new MessageOptions { Prompt = "讓我們討論 TypeScript 泛型" });

// 工作階段 ID 會被保留
Console.WriteLine(session.SessionId); // "user-123-conversation"

// 終止工作階段但將資料保留在磁碟上
await session.DisposeAsync();
await client.StopAsync();
```

### 恢復工作階段

```csharp
await using var client = new CopilotClient();
await client.StartAsync();

// 恢復先前的工作階段
var session = await client.ResumeSessionAsync("user-123-conversation");

// 先前的內容已還原
await session.SendAsync(new MessageOptions { Prompt = "我們剛才在討論什麼？" });

await session.DisposeAsync();
await client.StopAsync();
```

### 列出可用的工作階段

```csharp
var sessions = await client.ListSessionsAsync();
foreach (var s in sessions)
{
    Console.WriteLine($"工作階段：{s.SessionId}");
}
```

### 永久刪除工作階段

```csharp
// 從磁碟中移除工作階段及其所有資料
await client.DeleteSessionAsync("user-123-conversation");
```

### 獲取工作階段歷程記錄

擷取工作階段中的所有訊息：

```csharp
var messages = await session.GetMessagesAsync();
foreach (var msg in messages)
{
    Console.WriteLine($"[{msg.Type}] {msg.Data.Content}");
}
```

## 最佳實踐

1. **使用具意義的工作階段 ID**：在工作階段 ID 中包含使用者 ID 或內容
2. **處理缺失的工作階段**：在恢復之前檢查工作階段是否存在
3. **清理舊的工作階段**：定期刪除不再需要的工作階段
