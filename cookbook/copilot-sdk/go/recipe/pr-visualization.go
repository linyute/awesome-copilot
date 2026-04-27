package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"regexp"
	"strings"

	"github.com/github/copilot-sdk/go"
)

// ============================================================================
// Git 與 GitHub 偵測
// ============================================================================

func isGitRepo() bool {
	cmd := exec.Command("git", "rev-parse", "--git-dir")
	return cmd.Run() == nil
}

func getGitHubRemote() string {
	cmd := exec.Command("git", "remote", "get-url", "origin")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	remoteURL := strings.TrimSpace(string(output))

	// 處理 SSH: git@github.com:owner/repo.git
	sshRe := regexp.MustCompile(`git@github\.com:(.+/.+?)(?:\.git)?$`)
	if matches := sshRe.FindStringSubmatch(remoteURL); matches != nil {
		return matches[1]
	}

	// 處理 HTTPS: https://github.com/owner/repo.git
	httpsRe := regexp.MustCompile(`https://github\.com/(.+/.+?)(?:\.git)?$`)
	if matches := httpsRe.FindStringSubmatch(remoteURL); matches != nil {
		return matches[1]
	}

	return ""
}

func promptForRepo() string {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("輸入 GitHub 存放庫 (擁有者/存放庫): ")
	repo, _ := reader.ReadString('\n')
	return strings.TrimSpace(repo)
}

// ============================================================================
// 主要應用程式
// ============================================================================

func main() {
	repoFlag := flag.String("repo", "", "GitHub 存放庫 (擁有者/存放庫)")
	flag.Parse()

	fmt.Println("🔍 PR 建立時間圖表產生器\n")

	// 確定存放庫
	var repo string

	if *repoFlag != "" {
		repo = *repoFlag
		fmt.Printf("📦 使用指定的存放庫: %s\n", repo)
	} else if isGitRepo() {
		detected := getGitHubRemote()
		if detected != "" {
			repo = detected
			fmt.Printf("📦 偵測到 GitHub 存放庫: %s\n", repo)
		} else {
			fmt.Println("⚠️  找到 Git 存放庫 but 未偵測到 GitHub 遠端。" )
			repo = promptForRepo()
		}
	} else {
		fmt.Println("📁 不在 Git 存放庫中。" )
		repo = promptForRepo()
	}

	if repo == "" || !strings.Contains(repo, "/") {
		log.Fatal("❌ 存放庫格式無效。應為: 擁有者/存放庫")
	}

	parts := strings.SplitN(repo, "/", 2)
	owner, repoName := parts[0], parts[1]

	// 建立 Copilot 用戶端 - 不需要自訂工具！
	client := copilot.NewClient(copilot.ClientConfig{LogLevel: "error"})

	if err := client.Start(); err != nil {
		log.Fatal(err)
	}
	defer client.Stop()

	cwd, _ := os.Getwd()
	session, err := client.CreateSession(copilot.SessionConfig{
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
		Model:               "gpt-5.4",
		SystemMessage: copilot.SystemMessage{
			Content: fmt.Sprintf(`
<context>
您正在分析 GitHub 存放庫的提取要求 (Pull Request): %s/%s
目前工作目錄為: %s
</context>

<instructions>
- 使用 GitHub MCP Server 工具獲取 PR 資料
- 使用您的檔案和程式碼執行工具產生圖表
- 將產生的任何影像儲存到目前工作目錄
- 回應請保持簡潔
</instructions>
`, owner, repoName, cwd),
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer session.Disconnect()

	// 設定事件處理
	session.On(func(event copilot.SessionEvent) {
		switch d := event.Data.(type) {
		case *copilot.AssistantMessageData:
			fmt.Printf("\n🤖 %s\n\n", d.Content)
		case *copilot.ToolExecutionStartData:
			fmt.Printf("  ⚙️  %s\n", d.ToolName)
		}
	})

	// 初始提示 - 讓 Copilot 處理細節
	fmt.Println("\n📊 開始分析...\n")

	prompt := fmt.Sprintf(`
      獲取過去一週 %s/%s 的開放提取要求。
      計算每個 PR 的建立天數。
      然後產生一張長條圖影像，顯示 PR 建立時間的分佈
      （將它們分成合理的分組，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄下的 "pr-age-chart.png"。
      最後，摘要 PR 健康狀況 - 平均建立時間、最舊的 PR，以及有多少可能被視為停滯。
    `, owner, repoName)

	if err := session.Send(copilot.MessageOptions{Prompt: prompt}); err != nil {
		log.Fatal(err)
	}

	session.WaitForIdle()

	// 互動迴圈
	fmt.Println("\n💡 詢問後續問題或輸入 \"exit\" 結束。\n")
	fmt.Println("範例：")
	fmt.Println("  - \"擴展到上個月\"")
	fmt.Println("  - \"顯示最舊的 5 個 PR\"")
	fmt.Println("  - \"改為產生圓餅圖\"")
	fmt.Println("  - \"改依作者分組而非依建立時間\"")
	fmt.Println()

	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Print("您: ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		if input == "" {
			continue
		}
		if strings.ToLower(input) == "exit" || strings.ToLower(input) == "quit" {
			fmt.Println("👋 再見！")
			break
		}

		if err := session.Send(copilot.MessageOptions{Prompt: input}); err != nil {
			log.Printf("錯誤: %v", err)
		}

		session.WaitForIdle()
	}
}
