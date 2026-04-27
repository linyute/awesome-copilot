# 使用多個工作階段

同時管理多個獨立的對話。

> **可執行的範例：** [recipe/multiple-sessions.go](recipe/multiple-sessions.go)
>
> ```bash
> go run recipe/multiple-sessions.go
> ```

## 範例情境

您需要並行執行多個對話，每個對話都有自己的上下文和歷程紀錄。

## Go

```go
package main

import (
    "context"
    "fmt"
    "log"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    ctx := context.Background()
    client := copilot.NewClient(nil)

    if err := client.Start(ctx); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    // 建立多個獨立的工作階段
    session1, err := client.CreateSession(ctx, &copilot.SessionConfig{
    	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    	Model:               "gpt-5.4",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer session1.Disconnect()

    session2, err := client.CreateSession(ctx, &copilot.SessionConfig{
    	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    	Model:               "gpt-5.4",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer session2.Disconnect()

    session3, err := client.CreateSession(ctx, &copilot.SessionConfig{
    	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    	Model:               "claude-sonnet-4.6",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer session3.Disconnect()

    // 每個工作階段都維護自己的對話歷程紀錄
    session1.Send(ctx, copilot.MessageOptions{Prompt: "您正在協助處理一個 Python 專案"})
    session2.Send(ctx, copilot.MessageOptions{Prompt: "您正在協助處理一個 TypeScript 專案"})
    session3.Send(ctx, copilot.MessageOptions{Prompt: "您正在協助處理一個 Go 專案"})

    // 追蹤訊息會保留在各自的上下文中
    session1.Send(ctx, copilot.MessageOptions{Prompt: "我該如何建立虛擬環境？"})
    session2.Send(ctx, copilot.MessageOptions{Prompt: "我該如何設定 tsconfig？"})
    session3.Send(ctx, copilot.MessageOptions{Prompt: "我該如何初始化模組？"})
}
```

## 自訂工作階段 ID

使用自訂 ID 以便於追蹤：

```go
session, err := client.CreateSession(ctx, &copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    SessionID: "user-123-chat",
    Model:     "gpt-5.4",
})
if err != nil {
    log.Fatal(err)
}

fmt.Println(session.SessionID) // "user-123-chat"
```

## 列出工作階段

```go
sessions, err := client.ListSessions(ctx, nil)
if err != nil {
    log.Fatal(err)
}

for _, sessionInfo := range sessions {
    fmt.Printf("工作階段：%s\n", sessionInfo.SessionID)
}
```

## 刪除工作階段

```go
// 刪除特定工作階段
if err := client.DeleteSession(ctx, "user-123-chat"); err != nil {
    log.Printf("刪除工作階段失敗：%v", err)
}
```

## 使用案例

- **多使用者應用程式**：每個使用者一個工作階段
- **多任務工作流程**：針對不同任務使用獨立的工作階段
- **A/B 測試**：比較來自不同模型的回答
