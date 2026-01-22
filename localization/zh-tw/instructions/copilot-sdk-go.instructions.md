---
applyTo: "**.go, go.mod"
description: '本檔案提供使用 GitHub Copilot SDK 建構 Go 應用程式的指引。'
name: 'GitHub Copilot SDK Go 指引'
---

## 核心原則

- SDK 處於技術預覽階段，可能會發生重大變更
- 需要 Go 1.21 或更高版本
- 需要安裝 GitHub Copilot CLI 並加入 PATH
- 使用 goroutines 和 channels 進行並行操作
- 除了標準函式庫之外，沒有外部相依性

## 安裝

請務必透過 Go 模組 (Go modules) 安裝：

```bash
go get github.com/github/copilot-sdk/go
```

## 客戶端初始化 (Client Initialization)

### 基本客戶端設定

```go
import "github.com/github/copilot-sdk/go"

client := copilot.NewClient(nil)
if err := client.Start(); err != nil {
    log.Fatal(err)
}
defer client.Stop()
```

### 客戶端設定選項 (Client Configuration Options)

建立 CopilotClient 時，請使用 `ClientOptions`：

- `CLIPath` - CLI 執行檔路徑 (預設值：從 PATH 中獲取 "copilot")
- `CLIUrl` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。提供此選項時，客戶端不會啟動新處理程序 (process)
- `Port` - 伺服器連接埠 (預設值：0 表示隨機)
- `UseStdio` - 使用 stdio 傳輸而非 TCP (預設值：true)
- `LogLevel` - 記錄層級 (預設值："info")
- `AutoStart` - 自動啟動伺服器 (預設值：true，請使用指標：`boolPtr(true)`)
- `AutoRestart` - 當機時自動重新啟動 (預設值：true，請使用指標：`boolPtr(true)`)
- `Cwd` - CLI 處理程序的工作目錄
- `Env` - CLI 處理程序的環境變數 ([]string)

### 手動伺服器控制

如需明確控制：

```go
autoStart := false
client := copilot.NewClient(&copilot.ClientOptions{AutoStart: &autoStart})
if err := client.Start(); err != nil {
    log.Fatal(err)
}
// 使用客戶端...
client.Stop()
```

當 `Stop()` 耗時過長時，請使用 `ForceStop()`。

## 對話階段管理 (Session Management)

### 建立對話階段 (Creating Sessions)

使用 `SessionConfig` 進行設定：

```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Model: "gpt-5",
    Streaming: true,
    Tools: []copilot.Tool{...},
    SystemMessage: &copilot.SystemMessageConfig{ ... },
    AvailableTools: []string{"tool1", "tool2"},
    ExcludedTools: []string{"tool3"},
    Provider: &copilot.ProviderConfig{ ... },
})
if err != nil {
    log.Fatal(err)
}
```

### 對話階段設定選項 (Session Config Options)

- `SessionID` - 自訂對話階段 ID
- `Model` - 模型名稱 ("gpt-5", "claude-sonnet-4.5" 等)
- `Tools` - 公開給 CLI 的自訂工具 ([]Tool)
- `SystemMessage` - 系統訊息自訂 (\*SystemMessageConfig)
- `AvailableTools` - 工具名稱白名單 ([]string)
- `ExcludedTools` - 工具名稱黑名單 ([]string)
- `Provider` - 自訂 API 提供者設定 (BYOK) (\*ProviderConfig)
- `Streaming` - 啟用串流回應區塊 (bool)
- `MCPServers` - MCP 伺服器設定
- `CustomAgents` - 自訂代理人 (custom agents) 設定
- `ConfigDir` - 設定目錄覆蓋
- `SkillDirectories` - 技能目錄 ([]string)
- `DisabledSkills` - 已停用的技能 ([]string)

### 恢復對話階段 (Resuming Sessions)

```go
session, err := client.ResumeSession("session-id")
// 或搭配選項：
session, err := client.ResumeSessionWithOptions("session-id", &copilot.ResumeSessionConfig{ ... })
```

### 對話階段操作 (Session Operations)

- `session.SessionID` - 獲取對話階段識別碼 (string)
- `session.Send(copilot.MessageOptions{Prompt: "...", Attachments: []copilot.Attachment{...}})` - 傳送訊息，回傳 (messageID string, error)
- `session.SendAndWait(options, timeout)` - 傳送並等待閒置，回傳 (\*SessionEvent, error)
- `session.Abort()` - 中止目前處理，回傳 error
- `session.GetMessages()` - 獲取所有事件/訊息，回傳 ([]SessionEvent, error)
- `session.Destroy()` - 清理對話階段，回傳 error

## 事件處理 (Event Handling)

### 事件訂閱模式 (Event Subscription Pattern)

請務必使用 channels 或完成訊號 (done signals) 來等待對話階段事件：

```go
done := make(chan struct{})

unsubscribe := session.On(func(evt copilot.SessionEvent) {
    switch evt.Type {
    case copilot.AssistantMessage:
        fmt.Println(*evt.Data.Content)
    case copilot.SessionIdle:
        close(done)
    }
})
defer unsubscribe()

session.Send(copilot.MessageOptions{Prompt: "..."})
<-done
```

### 取消訂閱事件 (Unsubscribing from Events)

`On()` 方法會回傳一個用於取消訂閱的函式：

```go
unsubscribe := session.On(func(evt copilot.SessionEvent) {
    // 處理常式
})
// 稍後...
unsubscribe()
```

### 事件型別 (Event Types)

使用型別切換 (type switches) 進行事件處理：

```go
session.On(func(evt copilot.SessionEvent) {
    switch evt.Type {
    case copilot.UserMessage:
        // 處理使用者訊息
    case copilot.AssistantMessage:
        if evt.Data.Content != nil {
            fmt.Println(*evt.Data.Content)
        }
    case copilot.ToolExecutionStart:
        // 工具執行開始
    case copilot.ToolExecutionComplete:
        // 工具執行完成
    case copilot.SessionStart:
        // 對話階段開始
    case copilot.SessionIdle:
        // 對話階段處於閒置狀態 (處理完成)
    case copilot.SessionError:
        if evt.Data.Message != nil {
            fmt.Println("錯誤：", *evt.Data.Message)
        }
    }
})
```

## 串流回應 (Streaming Responses)

### 啟用串流

在 SessionConfig 中設定 `Streaming: true`：

```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Model: "gpt-5",
    Streaming: true,
})
```

### 處理串流事件

同時處理增量 (delta) 事件和最終事件：

```go
done := make(chan struct{})

session.On(func(evt copilot.SessionEvent) {
    switch evt.Type {
    case copilot.AssistantMessageDelta:
        // 增量文字區塊
        if evt.Data.DeltaContent != nil {
            fmt.Print(*evt.Data.DeltaContent)
        }
    case copilot.AssistantReasoningDelta:
        // 增量推論區塊 (取決於模型)
        if evt.Data.DeltaContent != nil {
            fmt.Print(*evt.Data.DeltaContent)
        }
    case copilot.AssistantMessage:
        // 最終完整訊息
        fmt.Println("\n--- 最終結果 ---")
        if evt.Data.Content != nil {
            fmt.Println(*evt.Data.Content)
        }
    case copilot.AssistantReasoning:
        // 最終推論內容
        fmt.Println("--- 推論過程 ---")
        if evt.Data.Content != nil {
            fmt.Println(*evt.Data.Content)
        }
    case copilot.SessionIdle:
        close(done)
    }
})

session.Send(copilot.MessageOptions{Prompt: "講個故事給我聽"})
<-done
```

注意：無論串流設定為何，一律會傳送最終事件 (`AssistantMessage`, `AssistantReasoning`)。

## 自訂工具 (Custom Tools)

### 定義工具

```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Model: "gpt-5",
    Tools: []copilot.Tool{
        {
            Name:        "lookup_issue",
            Description: "從追蹤器獲取問題 (issue) 詳情",
            Parameters: map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{
                    "id": map[string]interface{}{
                        "type":        "string",
                        "description": "問題 (Issue) ID",
                    },
                },
                "required": []string{"id"},
            },
            Handler: func(inv copilot.ToolInvocation) (copilot.ToolResult, error) {
                args := inv.Arguments.(map[string]interface{})
                issueID := args["id"].(string)

                issue, err := fetchIssue(issueID)
                if err != nil {
                    return copilot.ToolResult{}, err
                }

                return copilot.ToolResult{
                    TextResultForLLM: fmt.Sprintf("問題： %v", issue),
                    ResultType:       "success",
                    ToolTelemetry:    map[string]interface{}{},
                }, nil
            },
        },
    },
})
```

### 工具回傳型別 (Tool Return Types)

- 回傳 `ToolResult` 結構，包含以下欄位：
  - `TextResultForLLM` (string) - 顯示給 LLM 的結果文字
  - `ResultType` (string) - "success" 或 "failure"
  - `Error` (string，選填) - 內部錯誤訊息 (不顯示給 LLM)
  - `ToolTelemetry` (map[string]interface{}) - 遙測資料 (Telemetry data)

### 工具執行流程 (Tool Execution Flow)

當 Copilot 呼叫工具時，客戶端會自動：

1. 執行您的處理常式函式
2. 回傳 ToolResult
3. 回應給 CLI

## 系統訊息自訂 (System Message Customization)

### 附加模式 (Append Mode) (預設值 - 保留防護欄)

```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Model: "gpt-5",
    SystemMessage: &copilot.SystemMessageConfig{
        Mode: "append",
        Content: `
<workflow_rules>
- 務必檢查安全漏洞
- 在適用時提供效能改進建議
</workflow_rules>
`,
    },
})
```

### 取代模式 (Replace Mode) (完整控制 - 移除防護欄)

```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Model: "gpt-5",
    SystemMessage: &copilot.SystemMessageConfig{
        Mode:    "replace",
        Content: "你是一個很有幫助的助手。",
    },
})
```

## 檔案附件 (File Attachments)

使用 `Attachment` 在訊息中附加檔案：

```go
messageID, err := session.Send(copilot.MessageOptions{
    Prompt: "分析此檔案",
    Attachments: []copilot.Attachment{
        {
            Type:        "file",
            Path:        "/path/to/file.go",
            DisplayName: "我的檔案",
        },
    },
})
```

## 訊息傳遞模式 (Message Delivery Modes)

在 `MessageOptions` 中使用 `Mode` 欄位：

- `"enqueue"` - 將訊息排入佇列進行處理
- `"immediate"` - 立即處理訊息

```go
session.Send(copilot.MessageOptions{
    Prompt: "...",
    Mode:   "enqueue",
})
```

## 多個對話階段 (Multiple Sessions)

對話階段是獨立的，可以同時執行：

```go
session1, _ := client.CreateSession(&copilot.SessionConfig{Model: "gpt-5"})
session2, _ := client.CreateSession(&copilot.SessionConfig{Model: "claude-sonnet-4.5"})

session1.Send(copilot.MessageOptions{Prompt: "來自對話階段 1 的問候"})
session2.Send(copilot.MessageOptions{Prompt: "來自對話階段 2 的問候"})
```

## 自備金鑰 (Bring Your Own Key, BYOK)

透過 `ProviderConfig` 使用自訂 API 提供者：

```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Provider: &copilot.ProviderConfig{
        Type:    "openai",
        BaseURL: "https://api.openai.com/v1",
        APIKey:  "您的-api-key",
    },
})
```

## 對話階段生命週期管理 (Session Lifecycle Management)

### 檢查連線狀態 (Checking Connection State)

```go
state := client.GetState()
// 回傳值："disconnected", "connecting", "connected", 或 "error"
```

## 錯誤處理 (Error Handling)

### 標準例外處理 (Standard Exception Handling)

```go
session, err := client.CreateSession(&copilot.SessionConfig{})
if err != nil {
    log.Fatalf("建立對話階段失敗： %v", err)
}

_, err = session.Send(copilot.MessageOptions{Prompt: "您好"})
if err != nil {
    log.Printf("傳送失敗： %v", err)
}
```

### 對話階段錯誤事件 (Session Error Events)

監控 `SessionError` 型別以處理執行階段錯誤：

```go
session.On(func(evt copilot.SessionEvent) {
    if evt.Type == copilot.SessionError {
        if evt.Data.Message != nil {
            fmt.Fprintf(os.Stderr, "對話階段錯誤： %s\n", *evt.Data.Message)
        }
    }
})
```

## 連線測試 (Connectivity Testing)

使用 Ping 驗證伺服器連線性：

```go
resp, err := client.Ping("測試訊息")
if err != nil {
    log.Printf("無法連線至伺服器： %v", err)
} else {
    log.Printf("伺服器於 %d 回應", resp.Timestamp)
}
```

## 資源清理 (Resource Cleanup)

### 使用 Defer 清理

請務必使用 `defer` 進行清理：

```go
client := copilot.NewClient(nil)
if err := client.Start(); err != nil {
    log.Fatal(err)
}
defer client.Stop()

session, err := client.CreateSession(nil)
if err != nil {
    log.Fatal(err)
}
defer session.Destroy()
```

### 手動清理

若不使用 defer：

```go
client := copilot.NewClient(nil)
err := client.Start()
if err != nil {
    log.Fatal(err)
}

session, err := client.CreateSession(nil)
if err != nil {
    client.Stop()
    log.Fatal(err)
}

// 使用對話階段...

session.Destroy()
errors := client.Stop()
for _, err := range errors {
    log.Printf("清理錯誤： %v", err)
}
```

## 最佳做法 (Best Practices)

1. **務必使用 `defer`** 來清理客戶端和對話階段
2. **使用 channels** 來等待對話階段閒置 (SessionIdle) 事件
3. **處理對話階段錯誤 (SessionError)** 事件以建立穩健的錯誤處理機制
4. **使用型別切換 (type switches)** 進行事件處理
5. **啟用串流** 以在互動情境中提供更好的使用者體驗 (UX)
6. **提供具描述性的工具名稱和說明**，以便模型更好地理解
7. **在不再需要時呼叫取消訂閱函式**
8. **使用模式為 "append" 的 SystemMessageConfig** 以保留安全防護欄
9. **啟用串流時，同時處理增量 (delta) 和最終事件**
10. **檢查事件資料中的空指標 (nil pointers)** (Content, Message 等均為指標)

## 常見模式 (Common Patterns)

### 簡單的查詢-回應 (Simple Query-Response)

```go
client := copilot.NewClient(nil)
if err := client.Start(); err != nil {
    log.Fatal(err)
}
defer client.Stop()

session, err := client.CreateSession(&copilot.SessionConfig{Model: "gpt-5"})
if err != nil {
    log.Fatal(err)
}
defer session.Destroy()

done := make(chan struct{})

session.On(func(evt copilot.SessionEvent) {
    if evt.Type == copilot.AssistantMessage && evt.Data.Content != nil {
        fmt.Println(*evt.Data.Content)
    } else if evt.Type == copilot.SessionIdle {
        close(done)
    }
})

session.Send(copilot.MessageOptions{Prompt: "2+2 等於多少？"})
<-done
```

### 多輪對話 (Multi-Turn Conversation)

```go
session, _ := client.CreateSession(nil)
defer session.Destroy()

sendAndWait := func(prompt string) error {
    done := make(chan struct{})
    var eventErr error

    unsubscribe := session.On(func(evt copilot.SessionEvent) {
        switch evt.Type {
        case copilot.AssistantMessage:
            if evt.Data.Content != nil {
                fmt.Println(*evt.Data.Content)
            }
        case copilot.SessionIdle:
            close(done)
        case copilot.SessionError:
            if evt.Data.Message != nil {
                eventErr = fmt.Errorf(*evt.Data.Message)
            }
        }
    })
    defer unsubscribe()

    if _, err := session.Send(copilot.MessageOptions{Prompt: prompt}); err != nil {
        return err
    }
    <-done
    return eventErr
}

sendAndWait("法國的首都是哪裡？")
sendAndWait("它的人口是多少？")
```

### SendAndWait 協助工具

```go
// 使用內建的 SendAndWait 進行更簡單的同步互動
response, err := session.SendAndWait(copilot.MessageOptions{
    Prompt: "2+2 等於多少？",
}, 0) // 0 表示使用預設的 60 秒逾時

if err != nil {
    log.Printf("錯誤： %v", err)
}
if response != nil && response.Data.Content != nil {
    fmt.Println(*response.Data.Content)
}
```

### 具備結構體 (Struct) 回傳型別的工具

```go
type UserInfo struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
    Role  string `json:"role"`
}

session, _ := client.CreateSession(&copilot.SessionConfig{
    Tools: []copilot.Tool{
        {
            Name:        "get_user",
            Description: "獲取使用者資訊",
            Parameters: map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{
                    "user_id": map[string]interface{}{
                        "type":        "string",
                        "description": "使用者 ID",
                    },
                },
                "required": []string{"user_id"},
            },
            Handler: func(inv copilot.ToolInvocation) (copilot.ToolResult, error) {
                args := inv.Arguments.(map[string]interface{})
                userID := args["user_id"].(string)

                user := UserInfo{
                    ID:    userID,
                    Name:  "John Doe",
                    Email: "john@example.com",
                    Role:  "Developer",
                }

                jsonBytes, _ := json.Marshal(user)
                return copilot.ToolResult{
                    TextResultForLLM: string(jsonBytes),
                    ResultType:       "success",
                    ToolTelemetry:    map[string]interface{}{},
                }, nil
            },
        },
    },
})
```
