package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	copilot "github.com/github/copilot-sdk/go"
)

func main() {
	ctx := context.Background()

	// 建立並啟動用戶端
	client := copilot.NewClient(nil)
	if err := client.Start(ctx); err != nil {
		log.Fatal(err)
	}
	defer client.Stop()

	// 建立工作階段
	session, err := client.CreateSession(ctx, &copilot.SessionConfig{
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
		Model:               "gpt-5.4",
	})
	if err != nil {
		log.Fatal(err)
	}
	defer session.Disconnect()

	// 事件處理常式
	session.On(func(event copilot.SessionEvent) {
		switch d := event.Data.(type) {
		case *copilot.AssistantMessageData:
			fmt.Printf("\nCopilot: %s\n", d.Content)
		case *copilot.ToolExecutionStartData:
			fmt.Printf("  → 執行中: %s\n", d.ToolName)
		case *copilot.ToolExecutionCompleteData:
			fmt.Printf("  ✓ 已完成 (成功=%v)\n", d.Success)
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

	_, err = session.SendAndWait(ctx, copilot.MessageOptions{Prompt: prompt})
	if err != nil {
		log.Fatal(err)
	}
}
