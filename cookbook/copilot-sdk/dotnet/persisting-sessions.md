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
using GitHub.Copilot;

await using var client = new CopilotClient();
await client.StartAsync();

// 使用易記的 ID 建立工作階段
var session = await client.CreateSessionAsync(new SessionConfig
{
    SessionId = "user-123-conversation",
    Model = "gpt-5",
    OnPermissionRequest = PermissionHandler.ApproveAll
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
var session = await client.ResumeSessionAsync("user-123-conversation", new ResumeSessionConfig { OnPermissionRequest = PermissionHandler.ApproveAll });

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

取得會話的所有事件：

```csharp
using GitHub.Copilot; // UserMessageEvent、AssistantMessageEvent 等類型位於此命名空間

var events = await session.GetEventsAsync();
foreach (var evt in events)
{
    switch (evt)
    {
        case UserMessageEvent user:
            Console.WriteLine($"[user] {user.Data.Content}");
            break;
        case AssistantMessageEvent assistant:
            Console.WriteLine($"[assistant] {assistant.Data.Content}");
            break;
        default:
            // 工作階段也可能包含其他事件（工具呼叫、工具結果、系統事件）。
            Console.WriteLine($"[{evt.GetType().Name}]");
            break;
    }
}
```

> 工作階段的事件串流可能包含超出使用者與助理訊息的其他類型
>（例如工具呼叫、工具結果與系統事件）。請處理您關心的類型，並在預設情況下回退，以免有事件被靜默忽略。

## 最佳實踐

1. **使用具意義的工作階段 ID**：在工作階段 ID 中包含使用者 ID 或內容
2. **處理缺失的工作階段**：在恢復之前檢查工作階段是否存在
3. **清理舊的工作階段**：定期刪除不再需要的工作階段
