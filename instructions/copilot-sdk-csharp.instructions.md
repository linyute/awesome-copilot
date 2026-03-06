---
applyTo: '**.cs, **.csproj'
description: '本檔案提供使用 GitHub Copilot SDK 建構 C# 應用程式的指引。'
name: 'GitHub Copilot SDK C# 指引'
---

## 核心原則

- SDK 處於技術預覽階段，可能會發生重大變更
- 需要 .NET 10.0 或更高版本
- 需要安裝 GitHub Copilot CLI 並加入 PATH
- 全程使用 async/await 模式
- 實作 IAsyncDisposable 以進行資源清理

## 安裝

請務必透過 NuGet 安裝：
```bash
dotnet add package GitHub.Copilot.SDK
```

## 客戶端初始化 (Client Initialization)

### 基本客戶端設定

```csharp
await using var client = new CopilotClient();
await client.StartAsync();
```

### 客戶端設定選項 (Client Configuration Options)

建立 CopilotClient 時，請使用 `CopilotClientOptions`：

- `CliPath` - CLI 執行檔路徑 (預設值：從 PATH 中獲取 "copilot")
- `CliArgs` - 在 SDK 管理的旗標 (flag) 之前附加的額外引數
- `CliUrl` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。提供此選項時，客戶端不會啟動新處理程序 (process)
- `Port` - 伺服器連接埠 (預設值：0 表示隨機)
- `UseStdio` - 使用 stdio 傳輸而非 TCP (預設值：true)
- `LogLevel` - 記錄層級 (預設值："info")
- `AutoStart` - 自動啟動伺服器 (預設值：true)
- `AutoRestart` - 當機時自動重新啟動 (預設值：true)
- `Cwd` - CLI 處理程序的工作目錄
- `Environment` - CLI 處理程序的環境變數
- `Logger` - 用於 SDK 記錄的 ILogger 執行個體 (instance)

### 手動伺服器控制

如需明確控制：
```csharp
var client = new CopilotClient(new CopilotClientOptions { AutoStart = false });
await client.StartAsync();
// 使用客戶端...
await client.StopAsync();
```

當 `StopAsync()` 耗時過長時，請使用 `ForceStopAsync()`。

## 對話階段管理 (Session Management)

### 建立對話階段 (Creating Sessions)

使用 `SessionConfig` 進行設定：

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5",
    Streaming = true,
    Tools = [...],
    SystemMessage = new SystemMessageConfig { ... },
    AvailableTools = ["tool1", "tool2"],
    ExcludedTools = ["tool3"],
    Provider = new ProviderConfig { ... }
});
```

### 對話階段設定選項 (Session Config Options)

- `SessionId` - 自訂對話階段 ID
- `Model` - 模型名稱 ("gpt-5", "claude-sonnet-4.5" 等)
- `Tools` - 公開給 CLI 的自訂工具
- `SystemMessage` - 系統訊息自訂
- `AvailableTools` - 工具名稱白名單
- `ExcludedTools` - 工具名稱黑名單
- `Provider` - 自訂 API 提供者設定 (BYOK)
- `Streaming` - 啟用串流回應區塊 (預設值：false)

### 恢復對話階段 (Resuming Sessions)

```csharp
var session = await client.ResumeSessionAsync(sessionId, new ResumeSessionConfig { ... });
```

### 對話階段操作 (Session Operations)

- `session.SessionId` - 獲取對話階段識別碼
- `session.SendAsync(new MessageOptions { Prompt = "...", Attachments = [...] })` - 傳送訊息
- `session.AbortAsync()` - 中止目前處理
- `session.GetMessagesAsync()` - 獲取所有事件/訊息
- `await session.DisposeAsync()` - 清理資源

## 事件處理 (Event Handling)

### 事件訂閱模式 (Event Subscription Pattern)

請務必使用 TaskCompletionSource 來等待對話階段事件：

```csharp
var done = new TaskCompletionSource();

session.On(evt =>
{
    if (evt is AssistantMessageEvent msg)
    {
        Console.WriteLine(msg.Data.Content);
    }
    else if (evt is SessionIdleEvent)
    {
        done.SetResult();
    }
});

await session.SendAsync(new MessageOptions { Prompt = "..." });
await done.Task;
```

### 取消訂閱事件 (Unsubscribing from Events)

`On()` 方法會回傳一個 IDisposable：

```csharp
var subscription = session.On(evt => { /* 處理常式 */ });
// 稍後...
subscription.Dispose();
```

### 事件型別 (Event Types)

使用模式比對 (pattern matching) 或 switch 運算式進行事件處理：

```csharp
session.On(evt =>
{
    switch (evt)
    {
        case UserMessageEvent userMsg:
            // 處理使用者訊息
            break;
        case AssistantMessageEvent assistantMsg:
            Console.WriteLine(assistantMsg.Data.Content);
            break;
        case ToolExecutionStartEvent toolStart:
            // 工具執行開始
            break;
        case ToolExecutionCompleteEvent toolComplete:
            // 工具執行完成
            break;
        case SessionStartEvent start:
            // 對話階段開始
            break;
        case SessionIdleEvent idle:
            // 對話階段處於閒置狀態 (處理完成)
            break;
        case SessionErrorEvent error:
            Console.WriteLine($"錯誤：{error.Data.Message}");
            break;
    }
});
```

## 串流回應 (Streaming Responses)

### 啟用串流

在 SessionConfig 中設定 `Streaming = true`：

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5",
    Streaming = true
});
```

### 處理串流事件

同時處理增量 (delta) 事件和最終事件：

```csharp
var done = new TaskCompletionSource();

session.On(evt =>
{
    switch (evt)
    {
        case AssistantMessageDeltaEvent delta:
            // 增量文字區塊
            Console.Write(delta.Data.DeltaContent);
            break;
        case AssistantReasoningDeltaEvent reasoningDelta:
            // 增量推論區塊 (取決於模型)
            Console.Write(reasoningDelta.Data.DeltaContent);
            break;
        case AssistantMessageEvent msg:
            // 最終完整訊息
            Console.WriteLine("\n--- 最終結果 ---");
            Console.WriteLine(msg.Data.Content);
            break;
        case AssistantReasoningEvent reasoning:
            // 最終推論內容
            Console.WriteLine("--- 推論過程 ---");
            Console.WriteLine(reasoning.Data.Content);
            break;
        case SessionIdleEvent:
            done.SetResult();
            break;
    }
});

await session.SendAsync(new MessageOptions { Prompt = "講個故事給我聽" });
await done.Task;
```

注意：無論串流設定為何，一律會傳送最終事件 (`AssistantMessageEvent`, `AssistantReasoningEvent`)。

## 自訂工具 (Custom Tools)

### 使用 AIFunctionFactory 定義工具

使用 `Microsoft.Extensions.AI.AIFunctionFactory.Create` 建立型別安全的工具：

```csharp
using Microsoft.Extensions.AI;
using System.ComponentModel;

var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5",
    Tools = [
        AIFunctionFactory.Create(
            async ([Description("問題 (Issue) ID")] string id) => {
                var issue = await FetchIssueAsync(id);
                return issue;
            },
            "lookup_issue",
            "從追蹤器獲取問題 (issue) 詳情"),
    ]
});
```

### 工具回傳型別 (Tool Return Types)

- 回傳任何可 JSON 序列化的值 (會自動包裝)
- 或回傳包裝了 `ToolResultObject` 的 `ToolResultAIContent` 以進行 Metadata 的完整控制

### 工具執行流程 (Tool Execution Flow)

當 Copilot 呼叫工具時，客戶端會自動：
1. 執行您的處理常式函式
2. 序列化回傳值
3. 回應給 CLI

## 系統訊息自訂 (System Message Customization)

### 附加模式 (Append Mode) (預設值 - 保留防護欄)

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5",
    SystemMessage = new SystemMessageConfig
    {
        Mode = SystemMessageMode.Append,
        Content = @"
<workflow_rules>
- 務必檢查安全漏洞
- 在適用時提供效能改進建議
</workflow_rules>
"
    }
});
```

### 取代模式 (Replace Mode) (完整控制 - 移除防護欄)

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5",
    SystemMessage = new SystemMessageConfig
    {
        Mode = SystemMessageMode.Replace,
        Content = "你是一個很有幫助的助手。"
    }
});
```

## 檔案附件 (File Attachments)

使用 `UserMessageDataAttachmentsItem` 在訊息中附加檔案：

```csharp
await session.SendAsync(new MessageOptions
{
    Prompt = "分析此檔案",
    Attachments = new List<UserMessageDataAttachmentsItem>
    {
        new UserMessageDataAttachmentsItem
        {
            Type = UserMessageDataAttachmentsItemType.File,
            Path = "/path/to/file.cs",
            DisplayName = "我的檔案"
        }
    }
});
```

## 訊息傳遞模式 (Message Delivery Modes)

在 `MessageOptions` 中使用 `Mode` 屬性：

- `"enqueue"` - 將訊息排入佇列進行處理
- `"immediate"` - 立即處理訊息

```csharp
await session.SendAsync(new MessageOptions
{
    Prompt = "...",
    Mode = "enqueue"
});
```

## 多個對話階段 (Multiple Sessions)

對話階段是獨立的，可以同時執行：

```csharp
var session1 = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });
var session2 = await client.CreateSessionAsync(new SessionConfig { Model = "claude-sonnet-4.5" });

await session1.SendAsync(new MessageOptions { Prompt = "來自對話階段 1 的問候" });
await session2.SendAsync(new MessageOptions { Prompt = "來自對話階段 2 的問候" });
```

## 自備金鑰 (Bring Your Own Key, BYOK)

透過 `ProviderConfig` 使用自訂 API 提供者：

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    Provider = new ProviderConfig
    {
        Type = "openai",
        BaseUrl = "https://api.openai.com/v1",
        ApiKey = "您的-api-key"
    }
});
```

## 對話階段生命週期管理 (Session Lifecycle Management)

### 列出對話階段 (Listing Sessions)

```csharp
var sessions = await client.ListSessionsAsync();
foreach (var metadata in sessions)
{
    Console.WriteLine($"對話階段： {metadata.SessionId}");
}
```

### 刪除對話階段 (Deleting Sessions)

```csharp
await client.DeleteSessionAsync(sessionId);
```

### 檢查連線狀態 (Checking Connection State)

```csharp
var state = client.State;
```

## 錯誤處理 (Error Handling)

### 標準例外處理 (Standard Exception Handling)

```csharp
try
{
    var session = await client.CreateSessionAsync();
    await session.SendAsync(new MessageOptions { Prompt = "您好" });
}
catch (StreamJsonRpc.RemoteInvocationException ex)
{
    Console.Error.WriteLine($"JSON-RPC 錯誤： {ex.Message}");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"錯誤： {ex.Message}");
}
```

### 對話階段錯誤事件 (Session Error Events)

監控 `SessionErrorEvent` 以處理執行階段錯誤：

```csharp
session.On(evt =>
{
    if (evt is SessionErrorEvent error)
    {
        Console.Error.WriteLine($"對話階段錯誤： {error.Data.Message}");
    }
});
```

## 連線測試 (Connectivity Testing)

使用 PingAsync 驗證伺服器連線性：

```csharp
var response = await client.PingAsync("測試訊息");
```

## 資源清理 (Resource Cleanup)

### 使用 Using 自動清理

請務必使用 `await using` 來自動處置資源：

```csharp
await using var client = new CopilotClient();
await using var session = await client.CreateSessionAsync();
// 資源將自動清理
```

### 手動清理

若不使用 `await using`：

```csharp
var client = new CopilotClient();
try
{
    await client.StartAsync();
    // 使用客戶端...
}
finally
{
    await client.StopAsync();
}
```

## 最佳做法 (Best Practices)

1. **務必針對 CopilotClient 和 CopilotSession 使用 `await using`**
2. **使用 TaskCompletionSource** 來等待對話階段閒置 (SessionIdleEvent) 事件
3. **處理對話階段錯誤 (SessionErrorEvent)** 事件以建立穩健的錯誤處理機制
4. **使用模式比對 (pattern matching)** (switch 運算式) 進行事件處理
5. **啟用串流** 以在互動情境中提供更好的使用者體驗 (UX)
6. **使用 AIFunctionFactory** 進行型別安全的工具定義
7. **在不再需要時處置事件訂閱**
8. **使用 SystemMessageMode.Append** 以保留安全防護欄
9. **提供具描述性的工具名稱和說明**，以便模型更好地理解
10. **啟用串流時，同時處理增量 (delta) 和最終事件**

## 常見模式 (Common Patterns)

### 簡單的查詢-回應 (Simple Query-Response)

```csharp
await using var client = new CopilotClient();
await client.StartAsync();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5"
});

var done = new TaskCompletionSource();

session.On(evt =>
{
    if (evt is AssistantMessageEvent msg)
    {
        Console.WriteLine(msg.Data.Content);
    }
    else if (evt is SessionIdleEvent)
    {
        done.SetResult();
    }
});

await session.SendAsync(new MessageOptions { Prompt = "2+2 等於多少？" });
await done.Task;
```

### 多輪對話 (Multi-Turn Conversation)

```csharp
await using var session = await client.CreateSessionAsync();

async Task SendAndWait(string prompt)
{
    var done = new TaskCompletionSource();
    var subscription = session.On(evt =>
    {
        if (evt is AssistantMessageEvent msg)
        {
            Console.WriteLine(msg.Data.Content);
        }
        else if (evt is SessionIdleEvent)
        {
            done.SetResult();
        }
    });

    await session.SendAsync(new MessageOptions { Prompt = prompt });
    await done.Task;
    subscription.Dispose();
}

await SendAndWait("法國的首都是哪裡？");
await SendAndWait("它的人口是多少？");
```

### 具備複雜回傳型別的工具

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    Tools = [
        AIFunctionFactory.Create(
            ([Description("使用者 ID")] string userId) => {
                return new {
                    Id = userId,
                    Name = "John Doe",
                    Email = "john@example.com",
                    Role = "Developer"
                };
            },
            "get_user",
            "獲取使用者資訊")
    ]
});
```
