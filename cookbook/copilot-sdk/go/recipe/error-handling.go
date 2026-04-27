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
		log.Fatalf("無法啟動用戶端: %v", err)
	}
	defer client.Stop()

	session, err := client.CreateSession(ctx, &copilot.SessionConfig{
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
		Model:               "gpt-5.4",
	})
	if err != nil {
		log.Fatalf("建立工作階段失敗: %v", err)
	}
	defer session.Disconnect()

	result, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "Hello!"})
	if err != nil {
		log.Printf("傳送訊息失敗: %v", err)
		return
	}

	if result != nil {
		if d, ok := result.Data.(*copilot.AssistantMessageData); ok {
			fmt.Println(d.Content)
		}
	}
}
