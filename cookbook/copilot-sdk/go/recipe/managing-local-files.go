package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/github/copilot-sdk/go"
)

func main() {
	// 建立並啟動用戶端
	client := copilot.NewClient()
	if err := client.Start(); err != nil {
		log.Fatal(err)
	}
	defer client.Stop()

	// 建立工作階段
	session, err := client.CreateSession(copilot.SessionConfig{
		Model: "gpt-5",
	})
	if err != nil {
		log.Fatal(err)
	}
	defer session.Destroy()

	// 事件處理常式
	session.On(func(event copilot.Event) {
		switch e := event.(type) {
		case copilot.AssistantMessageEvent:
			fmt.Printf("\nCopilot: %s\n", e.Data.Content)
		case copilot.ToolExecutionStartEvent:
			fmt.Printf("  → 執行中: %s\n", e.Data.ToolName)
		case copilot.ToolExecutionCompleteEvent:
			fmt.Printf("  ✓ 已完成: %s\n", e.Data.ToolName)
		}
	})

	// 請求 Copilot 整理檔案
	// 將此更改為您的目標資料夾
	homeDir, _ := os.UserHomeDir()
	targetFolder := filepath.Join(homeDir, "Downloads")

	prompt := fmt.Sprintf(`
分析 "%s" 中的檔案並將其整理到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽依檔案副檔名進行分組
3. 建立適當的子資料夾（例如 "images", "documents", "videos"）
4. 將每個檔案移動到其適當的子資料夾中

移動任何檔案之前請先確認。
`, targetFolder)

	if err := session.Send(copilot.MessageOptions{Prompt: prompt}); err != nil {
		log.Fatal(err)
	}

	session.WaitForIdle()
}
