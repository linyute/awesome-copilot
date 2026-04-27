---
applyTo: "**.go, go.mod"
description: "使用 GitHub Copilot SDK 建構 Go 應用程式指南"
name: "GitHub Copilot SDK Go 指令"
---

## 核心原則

- SDK 處於技術預覽階段，可能會發生重大變更
- 需要 Go 1.21 或更高版本
- 需要安裝 GitHub Copilot CLI 並加入 PATH
- 使用 Goroutine 與 Channel 進行並行作業
- 除標準函式庫外無外部相依性

## 安裝

請始終透過 Go modules 安裝：

```bash
go get github.com/github/copilot-sdk/go
```

## 客戶端初始化

### 基本客戶端設定

```go
import "github.com/github/copilot-sdk/go"

client := copilot.NewClient(nil)
if err := client.Start(); err != nil {
    log.Fatal(err)
}
defer client.Stop()
```

### 客戶端設定選項

建立 CopilotClient 時，請使用 `ClientOptions`：

- `CLIPath` - CLI 可執行檔路徑 (預設：PATH 中的 "copilot")
- `CLIUrl` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。若提供，客戶端將不會 spawn 處理序
- `Port` - 伺服器連接埠 (預設：0 為隨機)
- `UseStdio` - 使用 stdio 傳輸而非 TCP (預設：true)
- `LogLevel` - 日誌層級 (預設："info")
- `AutoStart` - 自動啟動伺服器 (預設：true，使用指標：`boolPtr(true)`)
- `AutoRestart` - 當損毀時自動重新啟動 (預設：true，使用指標：`boolPtr(true)`)
- `Cwd` - CLI 處理序的工作目錄
- `Env` - CLI 處理序的環境變數 ([]string)

### 手動伺服器控制

若需明確控制：

```go
autoStart := false
client := copilot.NewClient(&copilot.ClientOptions{AutoStart: &autoStart})
if err := client.Start(); err != nil {
    log.Fatal(err)
}
// 使用 client...
client.Stop()
```

當 `Stop()` 耗時過長時，請使用 `ForceStop()`。

## 會話管理 (Session Management)

### 建立會話

使用 `SessionConfig` 進行設定：

```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
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

### 會話設定選項

- `SessionID` - 自訂會話 ID
- `Model` - 模型名稱 ("gpt-5", "claude-sonnet-4.5" 等)
- `Tools` - 公開給 CLI 的自訂工具 ([]Tool)
- `SystemMessage` - 系統訊息自訂 (*SystemMessageConfig)
- `AvailableTools` - 工具名稱允許清單 ([]string)
- `ExcludedTools` - 工具名稱排除清單 ([]string)
- `Provider` - 自訂 API 提供者設定 (BYOK) (*ProviderConfig)
- `Streaming` - 啟用串流回應區塊 (bool)
- `MCPServers` - MCP 伺服器設定
- `CustomAgents` - 自訂代理設定
- `ConfigDir` - 設定目錄覆寫
- `SkillDirectories` - 技能目錄 ([]string)
- `DisabledSkills` - 已停用技能 ([]string)

### 恢復會話

```go
session, err := client.ResumeSession("session-id", &copilot.ResumeSessionConfig{OnPermissionRequest: copilot.PermissionHandler.ApproveAll})
// 或使用選項：
session, err := client.ResumeSessionWithOptions("session-id", &copilot.ResumeSessionConfig{ ... })
```

### 會話操作

- `session.SessionID` - 取得會話識別碼 (string)
- `session.Send(copilot.MessageOptions{Prompt: "...", Attachments: []copilot.Attachment{...}})` - 傳送訊息，回傳 (messageID string, error)
- `session.SendAndWait(options, timeout)` - 傳送並等待閒置，回傳 (*SessionEvent, error)
- `session.Abort()` - 中止目前處理，回傳 error
- `session.GetMessages()` - 取得所有事件/訊息，回傳 ([]SessionEvent, error)
- `session.Destroy()` - 清理會話，回傳 error

## 事件處理

### 事件訂閱模式

ALWAYS 使用 Channel 或 done 訊號來等待會話事件：

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

### 取消訂閱事件

`On()` 方法回傳一個取消訂閱的函式：

```go
unsubscribe := session.On(func(evt copilot.SessionEvent) {
    // 處理常式
})
// 稍後...
unsubscribe()
```

### 事件類型

使用型別切換處理事件：

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
        // 會話開始
    case copilot.SessionIdle:
        // 會話閒置 (處理完成)
    case copilot.SessionError:
        if evt.Data.Message != nil {
            fmt.Println("錯誤:", *evt.Data.Message)
        }
    }
})
```

## 串流回應 (Streaming Responses)

### 啟用串流

在 SessionConfig 中設定 `Streaming: true`：

```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    Model: "gpt-5",
    Streaming: true,
})
```

### 處理串流事件

處理 delta 事件 (增量) 與最終事件：

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
        // 增量推理區塊 (視模型而定)
        if evt.Data.DeltaContent != nil {
            fmt.Print(*evt.Data.DeltaContent)
        }
    case copilot.AssistantMessage:
        // 最終完整訊息
        fmt.Println("\n--- 最終 ---")
        if evt.Data.Content != nil {
            fmt.Println(*evt.Data.Content)
        }
    case copilot.AssistantReasoning:
        // 最終推理內容
        fmt.Println("--- 推理 ---")
        if evt.Data.Content != nil {
            fmt.Println(*evt.Data.Content)
        }
    case copilot.SessionIdle:
        close(done)
    }
})

session.Send(copilot.MessageOptions{Prompt: "給我一個故事"})
<-done
```

注意：無論是否啟用串流，都會傳送最終事件 (`AssistantMessage`, `AssistantReasoning`)。

## 自訂工具

### 定義工具

```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    Model: "gpt-5",
    Tools: []copilot.Tool{
        {
            Name:        "lookup_issue",
            Description: "從追蹤器擷取問題詳細資料",
            Parameters: map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{
                    "id": map[string]interface{}{
                        "type":        "string",
                        "description": "問題 ID",
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
                    TextResultForLLM: fmt.Sprintf("問題: %v", issue),
                    ResultType:       "success",
                    ToolTelemetry:    map[string]interface{}{},
                }, nil
            },
        },
    },
})
```

### 工具回傳型別

- 回傳 `ToolResult` 結構，包含欄位：
  - `TextResultForLLM` (string) - 給 LLM 的結果文字
  - `ResultType` (string) - "success" 或 "failure"
  - `Error` (string, 選填) - 內部錯誤訊息 (不會顯示給 LLM)
  - `ToolTelemetry` (map[string]interface{}) - 遙測資料

### 工具執行流程

當 Copilot 呼叫工具時，客戶端會自動：

1. 執行你的處理常式函式
2. 回傳 ToolResult
3. 回應 CLI

## 系統訊息自訂 (System Message Customization)

### 追加模式 (Append Mode，預設 — 保留安全護欄)

```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    Model: "gpt-5",
    SystemMessage: &copilot.SystemMessageConfig{
        Mode: "append",
        Content: `
<workflow_rules>
- 務必檢查安全漏洞
- 若適用，請建議效能改進
</workflow_rules>
`,
    },
})
```

### 取代模式 (Replace Mode，完全控制 — 移除安全護欄)

```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    Model: "gpt-5",
    SystemMessage: &copilot.SystemMessageConfig{
        Mode:    "replace",
        Content: "你是一個有用的助理。",
    },
})
```

## 檔案附件

使用 `Attachment` 將檔案附加至訊息：

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

## 訊息傳送模式

在 `MessageOptions` 中使用 `Mode` 欄位：

- `"enqueue"` - 將訊息排入處理佇列
- `"immediate"` - 立即處理訊息

```go
session.Send(copilot.MessageOptions{
    Prompt: "...",
    Mode:   "enqueue",
})
```

## 多重會話

會話彼此獨立，可並行執行：

```go
session1, _ := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
	Model:               "gpt-5",
})
session2, _ := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
	Model:               "claude-sonnet-4.5",
})

session1.Send(copilot.MessageOptions{Prompt: "來自會話 1 的問候"})
session2.Send(copilot.MessageOptions{Prompt: "來自會話 2 的問候"})
```

## 自帶金鑰 (BYOK)

透過設定 `ProviderConfig` 使用自訂 API 提供者：

```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    Provider: &copilot.ProviderConfig{
        Type:    "openai",
        BaseURL: "https://api.openai.com/v1",
        APIKey:  "your-api-key",
    },
})
```

## 會話生命週期管理

### 檢查連線狀態

```go
state := client.GetState()
// 回傳: "disconnected", "connecting", "connected", 或 "error"
```

## 錯誤處理

### 標準異常處理

```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
})
if err != nil {
    log.Fatalf("無法建立會話: %v", err)
}

_, err = session.Send(copilot.MessageOptions{Prompt: "Hello"})
if err != nil {
    log.Printf("傳送失敗: %v", err)
}
```

### 會話錯誤事件

監控 `SessionError` 型別以處理執行階段錯誤：

```go
session.On(func(evt copilot.SessionEvent) {
    if evt.Type == copilot.SessionError {
        if evt.Data.Message != nil {
            fmt.Fprintf(os.Stderr, "會話錯誤: %s\n", *evt.Data.Message)
        }
    }
})
```

## 連線測試

使用 `Ping` 驗證伺服器連線能力：

```go
resp, err := client.Ping("測試訊息")
if err != nil {
    log.Printf("無法連線至伺服器: %v", err)
} else {
    log.Printf("伺服器回應於 %d", resp.Timestamp)
}
```

## 資源清理

### 使用 Defer 清理

ALWAYS 使用 `defer` 進行清理：

```go
client := copilot.NewClient(nil)
if err := client.Start(); err != nil {
    log.Fatal(err)
}
defer client.Stop()

session, err := client.CreateSession(&copilot.SessionConfig{OnPermissionRequest: copilot.PermissionHandler.ApproveAll})
if err != nil {
    log.Fatal(err)
}
defer session.Destroy()
```

### 手動清理

若未使用 defer：

```go
client := copilot.NewClient(nil)
err := client.Start()
if err != nil {
    log.Fatal(err)
}

session, err := client.CreateSession(&copilot.SessionConfig{OnPermissionRequest: copilot.PermissionHandler.ApproveAll})
if err != nil {
    client.Stop()
    log.Fatal(err)
}

// 使用 session...

session.Destroy()
errors := client.Stop()
for _, err := range errors {
    log.Printf("清理錯誤: %v", err)
}
```

## 最佳實務

1. **ALWAYS** 使用 `defer` 清理客戶端與會話
2. **使用 Channel** 等待 SessionIdle 事件
3. **處理 SessionError** 事件以進行穩健的錯誤處理
4. **使用型別切換** 進行事件處理
5. **啟用串流** 以在互動情境中提供更好的 UX
6. **提供描述性工具名稱與說明** 以利模型理解
7. **當不再需要時** 呼叫取消訂閱函式
8. **使用帶有 Mode: "append" 的 SystemMessageConfig** 以保留安全護欄
9. **當啟用串流時** 同時處理 delta 與最終事件
10. **檢查指標是否為 nil** (Content, Message 等皆為指標)

## 常見範例

### 簡單查詢-回應

```go
client := copilot.NewClient(nil)
if err := client.Start(); err != nil {
    log.Fatal(err)
}
defer client.Stop()

session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
	Model:               "gpt-5",
})
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

### 多回合對話

```go
session, _ := client.CreateSession(&copilot.SessionConfig{OnPermissionRequest: copilot.PermissionHandler.ApproveAll})
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

### SendAndWait 範例

```go
// 使用內建的 SendAndWait 以簡化同步互動
response, err := session.SendAndWait(copilot.MessageOptions{
    Prompt: "2+2 等於多少？",
}, 0) // 0 使用預設 60 秒逾時

if err != nil {
    log.Printf("Error: %v", err)
}
if response != nil && response.Data.Content != nil {
    fmt.Println(*response.Data.Content)
}
```

### 回傳結構體的工具

```go
type UserInfo struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
    Role  string `json:"role"`
}

session, _ := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    Tools: []copilot.Tool{
        {
            Name:        "get_user",
            Description: "擷取使用者資訊",
            Parameters: map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{
                    "user_id": map[string]interface{}{
                        "type":        "string",
                        "description": "User ID",
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
