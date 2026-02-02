# 使用多個工作階段

同時管理多個獨立的對話。

> **可執行範例：** [recipe/multiple-sessions.cs](recipe/multiple-sessions.cs)
>
> ```bash
> dotnet run recipe/multiple-sessions.cs
> ```

## 範例場景

您需要同時執行多個對話，每個對話都有其自己的內容與歷程記錄。

## C#

```csharp
using GitHub.Copilot.SDK;

await using var client = new CopilotClient();
await client.StartAsync();

// 建立多個獨立的工作階段
var session1 = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });
var session2 = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });
var session3 = await client.CreateSessionAsync(new SessionConfig { Model = "claude-sonnet-4.5" });

// 每個工作階段都維護自己的對話歷程記錄
await session1.SendAsync(new MessageOptions { Prompt = "您正在協助處理一個 Python 專案" });
await session2.SendAsync(new MessageOptions { Prompt = "您正在協助處理一個 TypeScript 專案" });
await session3.SendAsync(new MessageOptions { Prompt = "您正在協助處理一個 Go 專案" });

// 後續訊息會保留在各自的內容中
await session1.SendAsync(new MessageOptions { Prompt = "如何建立虛擬環境？" });
await session2.SendAsync(new MessageOptions { Prompt = "如何設定 tsconfig？" });
await session3.SendAsync(new MessageOptions { Prompt = "如何初始化模組？" });

// 清理所有工作階段
await session1.DisposeAsync();
await session2.DisposeAsync();
await session3.DisposeAsync();
```

## 自定義工作階段 ID

使用自定義 ID 以便於追蹤：

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    SessionId = "user-123-chat",
    Model = "gpt-5"
});

Console.WriteLine(session.SessionId); // "user-123-chat"
```

## 列出工作階段

```csharp
var sessions = await client.ListSessionsAsync();
foreach (var sessionInfo in sessions)
{
    Console.WriteLine($"工作階段：{sessionInfo.SessionId}");
}
```

## 刪除工作階段

```csharp
// 刪除特定的工作階段
await client.DeleteSessionAsync("user-123-chat");
```

## 使用案例

- **多使用者應用程式**：每個使用者一個工作階段
- **多任務工作流**：針對不同任務使用獨立的工作階段
- **A/B 測試**：比較來自不同模型的回應
