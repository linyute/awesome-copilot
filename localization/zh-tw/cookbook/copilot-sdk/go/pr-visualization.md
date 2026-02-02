# 產生 PR 時長圖表

使用 Copilot 的內建功能建立一個互動式 CLI 工具，視覺化 GitHub 儲存庫的拉取請求 (Pull Request, PR) 時長分佈。

> **可執行範例：** [recipe/pr-visualization.go](recipe/pr-visualization.go)
> 
> ```bash
> # 從目前的 git 儲存庫自動偵測
> go run recipe/pr-visualization.go
> 
> # 明確指定一個儲存庫
> go run recipe/pr-visualization.go -repo github/copilot-sdk
> ```

## 範例場景

您希望了解儲存庫中 PR 已開啟多長時間。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP 伺服器獲取 PR 資料並產生圖表影像。

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
    sshRe := regexp.MustCompile(`git@github.com:(.+/.+?)(?:.git)?$`) 
    if matches := sshRe.FindStringSubmatch(remoteURL); matches != nil {
        return matches[1]
    }

    // 處理 HTTPS: https://github.com/owner/repo.git
    httpsRe := regexp.MustCompile(`https://github.com/(.+/.+?)(?:.git)?$`) 
    if matches := httpsRe.FindStringSubmatch(remoteURL); matches != nil {
        return matches[1]
    }

    return ""
}

func promptForRepo() string {
    reader := bufio.NewReader(os.Stdin)
    fmt.Print("輸入 GitHub 儲存庫 (擁有者/儲存庫名稱)：")
    repo, _ := reader.ReadString('\n')
    return strings.TrimSpace(repo)
}

// ============================================================================ 
// 主應用程式
// ============================================================================ 

func main() {
    repoFlag := flag.String("repo", "", "GitHub 儲存庫 (擁有者/儲存庫名稱)")
    flag.Parse()

    fmt.Println("🔍 PR 時長圖表產生器\n")

    // 確定儲存庫
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
            fmt.Println("⚠️  找到 Git 儲存庫，但未偵測到 GitHub 遠端。")
            repo = promptForRepo()
        }
    } else {
        fmt.Println("📁 不在 Git 儲存庫中。")
        repo = promptForRepo()
    }

    if repo == "" || !strings.Contains(repo, "/") {
        log.Fatal("❌ 無效的儲存庫格式。預期格式：擁有者/儲存庫名稱")
    }

    parts := strings.SplitN(repo, "/", 2)
    owner, repoName := parts[0], parts[1]

    // 建立 Copilot 用戶端 - 不需要自定義工具！
    client := copilot.NewClient(copilot.ClientConfig{LogLevel: "error"})

    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    cwd, _ := os.Getwd()
    session, err := client.CreateSession(copilot.SessionConfig{
        Model: "gpt-5",
        SystemMessage: copilot.SystemMessage{
            Content: fmt.Sprintf(`
<context>
您正在分析 GitHub 儲存庫的拉取請求：%s/%s
目前的工作目錄為：%s
</context>

<instructions>
- 使用 GitHub MCP 伺服器工具獲取 PR 資料
- 使用您的檔案與程式碼執行工具產生圖表
- 將任何產生的影像儲存到目前工作目錄
- 回應請保持簡潔
</instructions>
`, owner, repoName, cwd),
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    defer session.Destroy()

    // 設定事件處理
    session.On(func(event copilot.Event) {
        switch e := event.(type) {
        case copilot.AssistantMessageEvent:
            fmt.Printf("\n🤖 %s\n\n", e.Data.Content)
        case copilot.ToolExecutionStartEvent:
            fmt.Printf("  ⚙️  %s\n", e.Data.ToolName)
        }
    })

    // 初始提示 - 讓 Copilot 找出詳細資訊
    fmt.Println("\n📊 開始分析...\n")

    prompt := fmt.Sprintf(`
      獲取 %s/%s 過去一週的開放拉取請求。
      計算每個 PR 的時長（以天為單位）。
      然後產生一個條形圖影像，顯示 PR 時長的分佈
      （將它們分組到合理的貯槽中，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄中的 "pr-age-chart.png"。
      最後，總結 PR 健康度 - 平均時長、最舊的 PR，以及有多少可能被視為停滯。
    `, owner, repoName)

    if err := session.Send(copilot.MessageOptions{Prompt: prompt}); err != nil {
        log.Fatal(err)
    }

    session.WaitForIdle()

    // 互動式迴圈
    fmt.Println("\n💡 提出後續問題或輸入 \"exit\" 退出。\n")
    fmt.Println("範例：")
    fmt.Println("  - \"擴展到過去一個月\"")
    fmt.Println("  - \"顯示前 5 個最舊的 PR\"")
    fmt.Println("  - \"改為產生圓餅圖\"")
    fmt.Println("  - \"按作者而非時長分組\"")
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

        if err := session.Send(copilot.MessageOptions{Prompt: input}); err != nil {
            log.Printf("錯誤：%v", err)
        }

        session.WaitForIdle()
    }
}

```

## 運作方式

1. **儲存庫偵測**：檢查 `-repo` 旗標 → git 遠端 → 提示使用者
2. **無需自定義工具**：完全依賴 Copilot CLI 的內建功能：
   - **GitHub MCP 伺服器** - 從 GitHub 獲取 PR 資料
   - **檔案工具** - 儲存產生的圖表影像
   - **程式碼執行** - 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式工作階段**：初始分析後，使用者可以要求調整

## 為何使用此方法？

| 考量層面         | 自定義工具        | 內建 Copilot                      |
| ----------------- | ----------------- | --------------------------------- |
| 程式碼複雜度     | 高                | **極小**                          |
| 維護             | 您自行維護        | **Copilot 維護**                  |
| 彈性             | 固定邏輯          | **AI 決定最佳方法**               |
| 圖表類型         | 您所編寫的內容    | **Copilot 能產生的任何類型**      |
| 資料分組         | 硬編碼的貯槽      | **智慧分組**                      |