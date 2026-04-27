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

	fmt.Println("已建立 3 個獨立的工作階段")

	// Each session maintains its own conversation history
	session1.Send(ctx, copilot.MessageOptions{Prompt: "您正在協助一個 Python 專案"})
	session2.Send(ctx, copilot.MessageOptions{Prompt: "您正在協助一個 TypeScript 專案"})
	session3.Send(ctx, copilot.MessageOptions{Prompt: "您正在協助一個 Go 專案"})

	fmt.Println("已向所有工作階段傳送初始內容")

	// Follow-up messages stay in their respective contexts
	session1.Send(ctx, copilot.MessageOptions{Prompt: "如何建立虛擬環境？"})
	session2.Send(ctx, copilot.MessageOptions{Prompt: "如何設定 tsconfig？"})
	session3.Send(ctx, copilot.MessageOptions{Prompt: "如何初始化模組？"})

	fmt.Println("已向每個工作階段傳送後續問題")
	fmt.Println("所有工作階段將在結束時銷毀")
}
