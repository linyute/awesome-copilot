# 使用多個工作階段

同時管理多個獨立的對話。

> **可執行範例：** [recipe/multiple-sessions.go](recipe/multiple-sessions.go)
> 
> ```bash
> go run recipe/multiple-sessions.go
> ```

## 範例場景

您需要同時執行多個對話，每個對話都有其自己的內容與歷程記錄。

## Go

```go
package main

import (
    "fmt"
    "log"
    "github.com/github/copilot-sdk/go"
)

func main() {
    client := copilot.NewClient()

    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    // 建立多個獨立的工作階段
    session1, err := client.CreateSession(copilot.SessionConfig{Model: "gpt-5"})
    if err != nil {
        log.Fatal(err)
    }
    defer session1.Destroy()

    session2, err := client.CreateSession(copilot.SessionConfig{Model: "gpt-5"})
    if err != nil {
        log.Fatal(err)
    }
    defer session2.Destroy()

    session3, err := client.CreateSession(copilot.SessionConfig{Model: "claude-sonnet-4.5"})
    if err != nil {
        log.Fatal(err)
    }
    defer session3.Destroy()

    // 每個工作階段都維護自己的對話歷程記錄
    session1.Send(copilot.MessageOptions{Prompt: "您正在協助處理一個 Python 專案"})
    session2.Send(copilot.MessageOptions{Prompt: "您正在協助處理一個 TypeScript 專案"})
    session3.Send(copilot.MessageOptions{Prompt: "您正在協助處理一個 Go 專案"})

    // 後續訊息會保留在各自的內容中
    session1.Send(copilot.MessageOptions{Prompt: "如何建立虛擬環境？"})
    session2.Send(copilot.MessageOptions{Prompt: "如何設定 tsconfig？"})
    session3.Send(copilot.MessageOptions{Prompt: "如何初始化模組？"})
}
```

## 自定義工作階段 ID

使用自定義 ID 以便於追蹤：

```go
session, err := client.CreateSession(copilot.SessionConfig{
    SessionID: "user-123-chat",
    Model:     "gpt-5",
})
if err != nil {
    log.Fatal(err)
}

fmt.Println(session.SessionID) // "user-123-chat"
```

## 列出工作階段

```go
sessions, err := client.ListSessions()
if err != nil {
    log.Fatal(err)
}

for _, sessionInfo := range sessions {
    fmt.Printf("工作階段：%s\n", sessionInfo.SessionID)
}
```

## 刪除工作階段

```go
// 刪除特定的工作階段
if err := client.DeleteSession("user-123-chat"); err != nil {
    log.Printf("刪除工作階段失敗：%v", err)
}
```

## 使用案例

- **多使用者應用程式**：每個使用者一個工作階段
- **多任務工作流**：針對不同任務使用獨立的工作階段
- **A/B 測試**：比較來自不同模型的回應
