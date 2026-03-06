package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	copilot "github.com/github/copilot-sdk/go"
)

// Ralph loop：具有每次反覆運算全新內容的自主 AI 任務迴圈。
//
// 兩種模式：
//   - "plan"：讀取 PROMPT_plan.md，產生/更新 IMPLEMENTATION_PLAN.md
//   - "build"：讀取 PROMPT_build.md，實作任務、執行測試、提交
//
// 每次反覆運算都會建立一個新的工作階段，以便代理程式始終在其內容視窗的
// 「智慧區域」內運作。狀態透過磁碟上的檔案 (IMPLEMENTATION_PLAN.md、AGENTS.md、specs/*)
// 在反覆運算之間共享。
//
// 用法：
//   go run ralph-loop.go              # 建構模式，50 次反覆運算
//   go run ralph-loop.go plan         # 規劃模式
//   go run ralph-loop.go 20           # 建構模式，20 次反覆運算
//   go run ralph-loop.go plan 5       # 規劃模式，5 次反覆運算

func ralphLoop(ctx context.Context, mode string, maxIterations int) error {
	promptFile := "PROMPT_build.md"
	if mode == "plan" {
		promptFile = "PROMPT_plan.md"
	}

	client := copilot.NewClient(nil)
	if err := client.Start(ctx); err != nil {
		return fmt.Errorf("failed to start client: %w", err)
	}
	defer client.Stop()

	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get working directory: %w", err)
	}

	fmt.Println(strings.Repeat("━", 40))
	fmt.Printf("模式:   %s
", mode)
	fmt.Printf("提示字: %s
", promptFile)
	fmt.Printf("上限:    %d 次反覆運算\n", maxIterations)
	fmt.Println(strings.Repeat("━", 40))

	prompt, err := os.ReadFile(promptFile)
	if err != nil {
		return fmt.Errorf("failed to read %s: %w", promptFile, err)
	}

	for i := 1; i <= maxIterations; i++ {
		fmt.Printf("\n=== 反覆運算 %d/%d ===\n", i, maxIterations)

		session, err := client.CreateSession(ctx, &copilot.SessionConfig{
			Model:            "gpt-5.1-codex-mini",
			WorkingDirectory: cwd,
			OnPermissionRequest: func(_ copilot.PermissionRequest, _ map[string]string) copilot.PermissionRequestResult {
				return copilot.PermissionRequestResult{Kind: "approved"}
			},
		})
		if err != nil {
			return fmt.Errorf("failed to create session: %w", err)
		}

		// 記錄工具使用情況以提高可見性
		session.On(func(event copilot.Event) {
			if toolExecution, ok := event.(copilot.ToolExecutionStartEvent); ok {
				fmt.Printf("  ⚙ %s\n", toolExecution.Data.ToolName)
			}
		})

		_, err = session.SendAndWait(ctx, copilot.MessageOptions{
			Prompt: string(prompt),
		})
		if destroyErr := session.Destroy(); destroyErr != nil {
			log.Printf("failed to destroy session on iteration %d: %v", i, destroyErr)
		}
		if err != nil {
			return fmt.Errorf("send failed on iteration %d: %w", i, err)
		}

		fmt.Printf("\n反覆運算 %d 完成。\n", i)
	}

	fmt.Printf("\n已達到最大反覆運算次數：%d\n", maxIterations)
	return nil
}

func main() {
	mode := "build"
	maxIterations := 50

	for _, arg := range os.Args[1:] {
		if arg == "plan" {
			mode = "plan"
		} else if n, err := strconv.Atoi(arg); err == nil {
			maxIterations = n
		}
	}

	if err := ralphLoop(context.Background(), mode, maxIterations); err != nil {
		log.Fatal(err)
	}
}
