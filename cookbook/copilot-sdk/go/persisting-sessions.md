# 工作階段持續性與恢復

儲存並在應用程式重新啟動後恢復對話工作階段。

## 範例情境

您希望使用者在關閉並重新開啟應用程式後仍能繼續對話。

> **可執行的範例：** [recipe/persisting-sessions.go](recipe/persisting-sessions.go)
>
> ```bash
> cd recipe
> go run persisting-sessions.go
> ```

### 使用自訂 ID 建立工作階段

```go
package main

import (
    "context"
    "fmt"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    ctx := context.Background()
    client := copilot.NewClient(nil)
    client.Start(ctx)
    defer client.Stop()

    // 建立具有易記 ID 的工作階段
    session, _ := client.CreateSession(ctx, &copilot.SessionConfig{
    	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
        SessionID: "user-123-conversation",
        Model:     "gpt-5.4",
    })

    session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "讓我們討論一下 TypeScript 泛型"})

    // 工作階段 ID 會被保留
    fmt.Println(session.SessionID)

    // 中斷工作階段連線，但將資料保留在磁碟上
    session.Disconnect()
}
```

### 恢復工作階段

```go
ctx := context.Background()
client := copilot.NewClient(nil)
client.Start(ctx)
defer client.Stop()

// 恢復之前的工作階段
session, _ := client.ResumeSession(ctx, "user-123-conversation", &copilot.ResumeSessionConfig{OnPermissionRequest: copilot.PermissionHandler.ApproveAll})

// 先前的內容已恢復
session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "我們剛才在討論什麼？"})

session.Disconnect()
```

### 列出可用的工作階段

```go
sessions, _ := client.ListSessions(ctx, nil)
for _, s := range sessions {
    fmt.Println("工作階段：", s.SessionID)
}
```

### 永久刪除工作階段

```go
// 從磁碟移除工作階段及其所有資料
client.DeleteSession(ctx, "user-123-conversation")
```

### 取得工作階段歷程紀錄

```go
messages, _ := session.GetMessages(ctx)
for _, msg := range messages {
    if d, ok := msg.Data.(*copilot.AssistantMessageData); ok {
        fmt.Printf("[assistant.message] %s\n", d.Content)
    }
}
```

## 最佳實務

1. **使用具意義的工作階段 ID**：在工作階段 ID 中包含使用者 ID 或內容
2. **處理遺失的工作階段**：在恢復前檢查工作階段是否存在
3. **清理舊的工作階段**：定期刪除不再需要的工作階段
