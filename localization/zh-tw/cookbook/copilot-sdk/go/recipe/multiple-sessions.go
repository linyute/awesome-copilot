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

	fmt.Println("已建立 3 個獨立的工作階段")

	// 每個工作階段都維護自己的對話歷程記錄
	session1.Send(copilot.MessageOptions{Prompt: "您正在協助一個 Python 專案"})
	session2.Send(copilot.MessageOptions{Prompt: "您正在協助一個 TypeScript 專案"})
	session3.Send(copilot.MessageOptions{Prompt: "您正在協助一個 Go 專案"})

	fmt.Println("已向所有工作階段傳送初始內容")

	// 後續訊息保留在各自的內容中
	session1.Send(copilot.MessageOptions{Prompt: "如何建立虛擬環境？"})
	session2.Send(copilot.MessageOptions{Prompt: "如何設定 tsconfig？"})
	session3.Send(copilot.MessageOptions{Prompt: "如何初始化模組？"})

	fmt.Println("已向每個工作階段傳送後續問題")
	fmt.Println("所有工作階段將在結束時銷毀")
}
