---
applyTo: '**.cs, **.csproj'
description: 'GitHub Copilot SDK C# 建構應用程式指南'
name: 'GitHub Copilot SDK C# 指令'
---

## 核心原則

- SDK 處於技術預覽階段，可能會發生重大變更
- 需要 .NET 10.0 或更高版本
- 需要安裝 GitHub Copilot CLI 並加入 PATH
- 全程使用 async/await 模式
- 實作 IAsyncDisposable 以進行資源清理

## 安裝

請始終透過 NuGet 安裝：
```bash
dotnet add package GitHub.Copilot.SDK
```

## 客戶端初始化

### 基本客戶端設定

```csharp
await using var client = new CopilotClient();
await client.StartAsync();
```

### 客戶端設定選項

建立 CopilotClient 時，請使用 `CopilotClientOptions`：

- `CliPath` - CLI 可執行檔路徑 (預設：PATH 中的 "copilot")
- `CliArgs` - 在 SDK 管理的旗標之前加入的額外引數
- `CliUrl` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。若提供，客戶端將不會 spawn 處理序
- `Port` - 伺服器連接埠 (預設：0 為隨機)
- `UseStdio` - 使用 stdio 傳輸而非 TCP (預設：true)
- `LogLevel` - 日誌層級 (預設："info")
- `AutoStart` - 自動啟動伺服器 (預設：true)
- `AutoRestart` - 當損毀時自動重新啟動 (預設：true)
- `Cwd` - CLI 處理序的工作目錄
- `Environment` - CLI 處理序的環境變數
- `Logger` - 用於 SDK 日誌紀錄的 ILogger 執行個體

### 手動伺服器控制

若需明確控制：
```csharp
var client = new CopilotClient(new CopilotClientOptions { AutoStart = false });
await client.StartAsync();
// 使用 client...
await client.StopAsync();
```

當 `StopAsync()` 耗時過長時，請使用 `ForceStopAsync()`。

## 會話管理 (Session Management)

### 建立會話

使用 `SessionConfig` 進行設定：

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-5",
    Streaming = true,
    Tools = [...],
    SystemMessage = new SystemMessageConfig { ... },
    AvailableTools = ["tool1", "tool2"],
    ExcludedTools = ["tool3"],
    Provider = new ProviderConfig { ... }
});
```

### 會話設定選項

- `SessionId` - 自訂會話 ID
- `Model` - 模型名稱 ("gpt-5", "claude-sonnet-4.5" 等)
- `Tools` - 公開給 CLI 的自訂工具
- `SystemMessage` - 系統訊息自訂
- `AvailableTools` - 工具名稱允許清單
- `ExcludedTools` - 工具名稱排除清單
- `Provider` - 自訂 API 提供者設定 (BYOK)
- `Streaming` - 啟用串流回應區塊 (預設：false)

### 恢復會話

```csharp
var session = await client.ResumeSessionAsync(sessionId, new ResumeSessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    // ...
});
```

### 會話操作

- `session.SessionId` - 取得會話識別碼
- `session.SendAsync(new MessageOptions { Prompt = "...", Attachments = [...] })` - 傳送訊息
- `session.AbortAsync()` - 中止目前處理
- `session.GetMessagesAsync()` - 取得所有事件/訊息
- `await session.DisposeAsync()` - 清理資源

## 事件處理

### 事件訂閱模式

ALWAYS 使用 TaskCompletionSource 來等待會話事件：

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

### 取消訂閱事件

`On()` 方法回傳 IDisposable：

```csharp
var subscription = session.On(evt => { /* 處理常式 */ });
// 稍後...
subscription.Dispose();
```

### 事件類型

使用模式比對或 switch 表達式處理事件：

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
            // 會話開始
            break;
        case SessionIdleEvent idle:
            // 會話閒置 (處理完成)
            break;
        case SessionErrorEvent error:
            Console.WriteLine($"錯誤: {error.Data.Message}");
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
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-5",
    Streaming = true
});
```

### 處理串流事件

處理 delta 事件 (增量) 與最終事件：

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
            // 增量推理區塊 (視模型而定)
            Console.Write(reasoningDelta.Data.DeltaContent);
            break;
        case AssistantMessageEvent msg:
            // 最終完整訊息
            Console.WriteLine("\n--- 最終 ---");
            Console.WriteLine(msg.Data.Content);
            break;
        case AssistantReasoningEvent reasoning:
            // 最終推理內容
            Console.WriteLine("--- 推理 ---");
            Console.WriteLine(reasoning.Data.Content);
            break;
        case SessionIdleEvent:
            done.SetResult();
            break;
    }
});

await session.SendAsync(new MessageOptions { Prompt = "給我一個故事" });
await done.Task;
```

注意：無論是否啟用串流，都會傳送最終事件 (`AssistantMessageEvent`, `AssistantReasoningEvent`)。

## 自訂工具

### 使用 AIFunctionFactory 定義工具

使用 `Microsoft.Extensions.AI.AIFunctionFactory.Create` 進行型別安全工具定義：

```csharp
using Microsoft.Extensions.AI;
using System.ComponentModel;

var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-5",
    Tools = [
        AIFunctionFactory.Create(
            async ([Description("問題 ID")] string id) => {
                var issue = await FetchIssueAsync(id);
                return issue;
            },
            "lookup_issue",
            "從追蹤器擷取問題詳細資料"),
    ]
});
```

### 工具回傳型別

- 回傳任何 JSON 可序列化值 (自動包裝)
- 或回傳包裝 `ToolResultObject` 的 `ToolResultAIContent`，以完全控制中繼資料

### 工具執行流程

當 Copilot 呼叫工具時，客戶端會自動：
1. 執行你的處理常式函式
2. 序列化回傳值
3. 回應 CLI

## 系統訊息自訂 (System Message Customization)

### 追加模式 (Append Mode，預設 — 保留安全護欄)

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-5",
    SystemMessage = new SystemMessageConfig
    {
        Mode = SystemMessageMode.Append,
        Content = @"
<workflow_rules>
- 務必檢查安全漏洞
- 若適用，請建議效能改進
</workflow_rules>
"
    }
});
```

### 取代模式 (Replace Mode，完全控制 — 移除安全護欄)

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-5",
    SystemMessage = new SystemMessageConfig
    {
        Mode = SystemMessageMode.Replace,
        Content = "你是一個有用的助理。"
    }
});
```

## 檔案附件

使用 `UserMessageDataAttachmentsItem` 將檔案附加至訊息：

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

## 訊息傳送模式

在 `MessageOptions` 中使用 `Mode` 屬性：

- `"enqueue"` - 將訊息排入處理佇列
- `"immediate"` - 立即處理訊息

```csharp
await session.SendAsync(new MessageOptions
{
    Prompt = "...",
    Mode = "enqueue"
});
```

## 多重會話

會話彼此獨立，可並行執行：

```csharp
var session1 = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-5",
});
var session2 = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "claude-sonnet-4.5",
});

await session1.SendAsync(new MessageOptions { Prompt = "來自會話 1 的問候" });
await session2.SendAsync(new MessageOptions { Prompt = "來自會話 2 的問候" });
```

## 自帶金鑰 (BYOK)

透過 `ProviderConfig` 使用自訂 API 提供者：

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Provider = new ProviderConfig
    {
        Type = "openai",
        BaseUrl = "https://api.openai.com/v1",
        ApiKey = "your-api-key"
    }
});
```

## 會話生命週期管理

### 列出會話

```csharp
var sessions = await client.ListSessionsAsync();
foreach (var metadata in sessions)
{
    Console.WriteLine($"會話: {metadata.SessionId}");
}
```

### 刪除會話

```csharp
await client.DeleteSessionAsync(sessionId);
```

### 檢查連線狀態

```csharp
var state = client.State;
```

## 錯誤處理

### 標準異常處理

```csharp
try
{
    var session = await client.CreateSessionAsync(new SessionConfig { OnPermissionRequest = PermissionHandler.ApproveAll });
    await session.SendAsync(new MessageOptions { Prompt = "Hello" });
}
catch (StreamJsonRpc.RemoteInvocationException ex)
{
    Console.Error.WriteLine($"JSON-RPC 錯誤: {ex.Message}");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"錯誤: {ex.Message}");
}
```

### 會話錯誤事件

監控 `SessionErrorEvent` 以處理執行階段錯誤：

```csharp
session.On(evt =>
{
    if (evt is SessionErrorEvent error)
    {
        Console.Error.WriteLine($"會話錯誤: {error.Data.Message}");
    }
});
```

## 連線測試

使用 PingAsync 驗證伺服器連線能力：

```csharp
var response = await client.PingAsync("測試訊息");
```

## 資源清理

### 使用 Using 自動清理

ALWAYS 使用 `await using` 進行自動處置：

```csharp
await using var client = new CopilotClient();
await using var session = await client.CreateSessionAsync(new SessionConfig { OnPermissionRequest = PermissionHandler.ApproveAll });
// 資源會自動清理
```

### 手動清理

若未使用 `await using`：

```csharp
var client = new CopilotClient();
try
{
    await client.StartAsync();
    // 使用 client...
}
finally
{
    await client.StopAsync();
}
```

## 最佳實務

1. **ALWAYS** 為 CopilotClient 與 CopilotSession 使用 `await using`
2. **使用 TaskCompletionSource** 等待 SessionIdleEvent
3. **處理 SessionErrorEvent** 以進行穩健的錯誤處理
4. **使用模式比對** (switch 表達式) 進行事件處理
5. **啟用串流** 以在互動情境中提供更好的 UX
6. **使用 AIFunctionFactory** 進行型別安全工具定義
7. **當不再需要時** 處置事件訂閱
8. **使用 SystemMessageMode.Append** 以保留安全護欄
9. **當啟用串流時** 同時處理 delta 與最終事件
10. **提供描述性工具名稱與說明** 以利模型理解

## 常見範例

### 簡單查詢-回應

```csharp
await using var client = new CopilotClient();
await client.StartAsync();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
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

### 多回合對話

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig { OnPermissionRequest = PermissionHandler.ApproveAll });

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

### 具有複雜回傳型別的工具

```csharp
var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
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
            "擷取使用者資訊")
    ]
});
```
