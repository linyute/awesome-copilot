# 產生 PR 帳齡圖表

建構一個互動式 CLI 工具，使用 Copilot 的內建功能為 GitHub 儲存庫視覺化提取要求 (pull request) 的帳齡分佈。

> **可執行的範例：** [recipe/pr-visualization.go](recipe/pr-visualization.go)
>
> ```bash
> # 從目前的 git 儲存庫自動偵測
> go run recipe/pr-visualization.go
>
> # 明確指定一個儲存庫
> go run recipe/pr-visualization.go -repo github/copilot-sdk
> ```

## 範例情境

您想了解儲存庫中的 PR 已開啟了多長時間。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP Server 擷取 PR 資料並產生圖表影像。

## 先決條件

```bash
go get github.com/github/copilot-sdk/go
```

## 用法

```bash
# 從目前的 git 儲存庫自動偵測
go run pr-visualization.go

# 明確指定一個儲存庫
go run pr-visualization.go -repo github/copilot-sdk
```

## 完整範例：pr-visualization.go

```go
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
    copilot "github.com/github/copilot-sdk/go"
)

// ============================================================================
// Git & GitHub 偵測
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
    fmt.Print("輸入 GitHub 儲存庫 (owner/repo): ")
    repo, _ := reader.ReadString('\n')
    return strings.TrimSpace(repo)
}

// ============================================================================
// 主應用程式
// ============================================================================

func main() {
    ctx := context.Background()
    repoFlag := flag.String("repo", "", "GitHub 儲存庫 (owner/repo)")
    flag.Parse()

    fmt.Println("🔍 PR 帳齡圖表產生器\n")

    // 決定儲存庫
    var repo string

    if *repoFlag != "" {
        repo = *repoFlag
        fmt.Printf("📦 使用指定的儲存庫：%s\n", repo)
    } else if isGitRepo() {
        detected := getGitHubRemote()
        if detected != "" {
            repo = detected
            fmt.Printf("📦 偵測到 GitHub 儲存庫：%s\n", repo)
        } else {
            fmt.Println("⚠️  找到 Git 儲存庫但未偵測到 GitHub 遠端。")
            repo = promptForRepo()
        }
    } else {
        fmt.Println("📁 不在 Git 儲存庫中。")
        repo = promptForRepo()
    }

    if repo == "" || !strings.Contains(repo, "/") {
        log.Fatal("❌ 儲存庫格式無效。預期格式：owner/repo")
    }

    parts := strings.SplitN(repo, "/", 2)
    owner, repoName := parts[0], parts[1]

    // 建立 Copilot 用戶端
    client := copilot.NewClient(nil)

    if err := client.Start(ctx); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    cwd, _ := os.Getwd()
    session, err := client.CreateSession(ctx, &copilot.SessionConfig{
    	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
        Model: "gpt-5.4",
        SystemMessage: &copilot.SystemMessageConfig{
            Content: fmt.Sprintf(`
<context>
您正在分析以下 GitHub 儲存庫的提取要求 (pull request): %s/%s
目前的工作目錄是：%s
</context>

<instructions>
- 使用 GitHub MCP Server 工具來擷取 PR 資料
- 使用您的檔案和程式碼執行工具來產生圖表
- 將任何產生的影像儲存到目前的工作目錄
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

    // 初始提示 - 讓 Copilot 找出詳細資訊
    fmt.Println("\n📊 開始分析...\n")

    prompt := fmt.Sprintf(`
      擷取 %s/%s 過去一週的開啟狀態提取要求。
      計算每個 PR 的帳齡 (以天為單位)。
      然後產生一張長條圖影像，顯示 PR 帳齡的分佈情形
      (將它們分組到合理的貯槽，例如 <1 天、1-3 天等)。
      將圖表儲存為目前目錄中的 "pr-age-chart.png"。
      最後，總結 PR 健康狀況 — 平均帳齡、最舊的 PR，以及有多少可能被視為陳舊。
    `, owner, repoName)

    if _, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: prompt}); err != nil {
        log.Fatal(err)
    }

    // 互動式迴圈
    fmt.Println("\n💡 提問追蹤問題或輸入 \"exit\" 退出。\n")
    fmt.Println("範例：")
    fmt.Println("  - \"擴展到過去一個月\"")
    fmt.Println("  - \"顯示最舊的 5 個 PR\"")
    fmt.Println("  - \"改為產生圓餅圖\"")
    fmt.Println("  - \"依作者而非帳齡進行分組\"")
    fmt.Println()

    reader := bufio.NewReader(os.Stdin)
    for {
        fmt.Print("您：")
        input, _ := reader.ReadString('\n')
        input = strings.TrimSpace(input)

        if input == "" {
            continue
        }
        if strings.ToLower(input) == "exit" || strings.ToLower(input) == "quit" {
            fmt.Println("👋 再見！")
            break
        }

        if _, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: input}); err != nil {
            log.Printf("錯誤：%v", err)
        }
    }
}
```

## 運作方式

1. **儲存庫偵測**：檢查 `--repo` 旗標 → git 遠端 → 提示使用者
2. **無需自訂工具**：完全依賴 Copilot CLI 的內建功能：
   - **GitHub MCP Server** - 從 GitHub 擷取 PR 資料
   - **檔案工具** - 儲存產生的圖表影像
   - **程式碼執行** - 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式工作階段**：在初始分析之後，使用者可以要求進行調整

## 為什麼採用這種方法？

| 面項            | 自訂工具          | 內建 Copilot                      |
| --------------- | ----------------- | --------------------------------- |
| 程式碼複雜度   | 高                | **極小**                          |
| 維護             | 由您維護          | **由 Copilot 維護**               |
| 彈性             | 固定邏輯          | **AI 決定最佳方法**              |
| 圖表類型       | 您所撰寫的程式碼 | **Copilot 可以產生的任何類型**    |
| 資料分組       | 硬編碼的貯槽      | **智慧分組**                      |
