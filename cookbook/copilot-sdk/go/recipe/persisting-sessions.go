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

	// 建立具有易記識別碼的工作階段
	session, err := client.CreateSession(ctx, &copilot.SessionConfig{
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
		SessionID:           "user-123-conversation",
		Model:               "gpt-5.4",
	})
	if err != nil {
		log.Fatal(err)
	}

	_, err = session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "讓我們來討論 TypeScript 泛型 (Generics)"})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("工作階段已建立: %s\n", session.SessionID)

	// 銷毀工作階段但將資料保留在磁碟上
	session.Disconnect()
	fmt.Println("工作階段已銷毀（狀態已持久化）")

	// 恢復先前的工作階段
	resumed, err := client.ResumeSession(ctx, "user-123-conversation", &copilot.ResumeSessionConfig{OnPermissionRequest: copilot.PermissionHandler.ApproveAll})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("已恢復: %s\n", resumed.SessionID)

	_, err = resumed.SendAndWait(ctx, copilot.MessageOptions{Prompt: "What were we discussing?"})
	if err != nil {
		log.Fatal(err)
	}

	// 列出工作階段
	sessions, err := client.ListSessions(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}
	ids := make([]string, 0, len(sessions))
	for _, s := range sessions {
		ids = append(ids, s.SessionID)
	}
	fmt.Printf("工作階段: %v\n", ids)

	// 永久刪除工作階段
	if err := client.DeleteSession(ctx, "user-123-conversation"); err != nil {
		log.Fatal(err)
	}
	fmt.Println("工作階段已刪除")

	resumed.Disconnect()
}
