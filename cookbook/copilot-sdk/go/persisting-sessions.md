# 工作階段持續性與恢復

跨應用程式重新啟動儲存並還原對話工作階段。

## 範例場景

您希望使用者即使在關閉並重新開啟您的應用程式後，仍能繼續對話。

> **可執行範例：** [recipe/persisting-sessions.go](recipe/persisting-sessions.go)
> 
> ```bash
> cd recipe
> go run persisting-sessions.go
> ```

### 使用自定義 ID 建立工作階段

```go
package main

import (
    "fmt"
    "github.com/github/copilot-sdk/go"
)

func main() {
    client := copilot.NewClient()
    client.Start()
    defer client.Stop()

    // 使用易記的 ID 建立工作階段
    session, _ := client.CreateSession(copilot.SessionConfig{
        SessionID: "user-123-conversation",
        Model:     "gpt-5",
    })

    session.Send(copilot.MessageOptions{Prompt: "讓我們討論 TypeScript 泛型"})

    // 工作階段 ID 會被保留
    fmt.Println(session.SessionID)

    // 終止工作階段但將資料保留在磁碟上
    session.Destroy()
}
```

### 恢復工作階段

```go
client := copilot.NewClient()
client.Start()
defer client.Stop()

// 恢復先前的工作階段
session, _ := client.ResumeSession("user-123-conversation")

// 先前的內容已還原
session.Send(copilot.MessageOptions{Prompt: "我們剛才在討論什麼？"})

session.Destroy()
```

### 列出可用的工作階段

```go
sessions, _ := client.ListSessions()
for _, s := range sessions {
    fmt.Println("工作階段：", s.SessionID)
}
```

### 永久刪除工作階段

```go
// 從磁碟中移除工作階段及其所有資料
client.DeleteSession("user-123-conversation")
```

### 獲取工作階段歷程記錄

```go
messages, _ := session.GetMessages()
for _, msg := range messages {
    fmt.Printf("[%s] %v\n", msg.Type, msg.Data)
}
```

## 最佳實踐

1. **使用具意義的工作階段 ID**：在工作階段 ID 中包含使用者 ID 或內容
2. **處理缺失的工作階段**：在恢復之前檢查工作階段是否存在
3. **清理舊的工作階段**：定期刪除不再需要的工作階段

