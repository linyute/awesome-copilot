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

    // 建立具有易記識別碼的工作階段
    session, err := client.CreateSession(copilot.SessionConfig{
        SessionID: "user-123-conversation",
        Model:     "gpt-5",
    })
    if err != nil {
        log.Fatal(err)
    }

    if err := session.Send(copilot.MessageOptions{Prompt: "讓我們來討論 TypeScript 泛型 (Generics)"}); err != nil {
        log.Fatal(err)
    }
    fmt.Printf("工作階段已建立: %s\n", session.SessionID)

    // 銷毀工作階段但將資料保留在磁碟上
    if err := session.Destroy(); err != nil {
        log.Fatal(err)
    }
    fmt.Println("工作階段已銷毀（狀態已持久化）")

    // 恢復先前的工作階段
    resumed, err := client.ResumeSession("user-123-conversation")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("已恢復: %s\n", resumed.SessionID)

    if err := resumed.Send(copilot.MessageOptions{Prompt: "我們剛才在討論什麼？"}); err != nil {
        log.Fatal(err)
    }

    // 列出工作階段
    sessions, err := client.ListSessions()
    if err != nil {
        log.Fatal(err)
    }
    ids := make([]string, 0, len(sessions))
    for _, s := range sessions {
        ids = append(ids, s.SessionID)
    }
    fmt.Printf("工作階段: %v\n", ids)

    // 永久刪除工作階段
    if err := client.DeleteSession("user-123-conversation"); err != nil {
        log.Fatal(err)
    }
    fmt.Println("工作階段已刪除")

    if err := resumed.Destroy(); err != nil {
        log.Fatal(err)
    }
}
