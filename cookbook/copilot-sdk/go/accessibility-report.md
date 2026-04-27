# 產生協助工具報告

建構一個 CLI 工具，使用 Playwright MCP server 分析網頁協助工具，並產生詳細的 WCAG 相容報告，且可選擇產生測試。

> **可執行的範例：** [recipe/accessibility-report.go](recipe/accessibility-report.go)
>
> ```bash
> go run recipe/accessibility-report.go
> ```

## 範例情境

您想要稽核網站的協助工具合規性。此工具使用 Playwright 導覽至 URL，擷取協助工具快照，並產生一份結構化報告，涵蓋 WCAG 標準，例如地標 (landmarks)、標題階層、焦點管理和觸控目標。它還可以產生 Playwright 測試檔案，以自動執行未來的協助工具檢查。

## 先決條件

```bash
go get github.com/github/copilot-sdk/go
```

您還需要安裝 `npx` (已安裝 Node.js) 以供 Playwright MCP server 使用。

## 用法

```bash
go run accessibility-report.go
# 提示時輸入 URL
```

## 完整範例：accessibility-report.go

```go
package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	copilot "github.com/github/copilot-sdk/go"
)

func main() {
	ctx := context.Background()
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("=== 協助工具報告產生器 ===")
	fmt.Println()

	fmt.Print("輸入要分析的 URL: ")
	url, _ := reader.ReadString('\n')
	url = strings.TrimSpace(url)

	if url == "" {
		fmt.Println("未提供 URL。正在退出。")
		return
	}

	// 確保 URL 具有通訊協定
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	fmt.Printf("\n正在分析：%s\n", url)
	fmt.Println("請稍候...\n")

	// 建立帶有 Playwright MCP server 的 Copilot 用戶端
	client := copilot.NewClient(nil)

	if err := client.Start(ctx); err != nil {
		log.Fatal(err)
	}
	defer client.Stop()

	session, err := client.CreateSession(ctx, &copilot.SessionConfig{
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
		Model:     "claude-opus-4.6",
		Streaming: true,
		MCPServers: map[string]copilot.MCPServerConfig{
			"playwright": {
				"type":    "local",
				"command": "npx",
				"args":    []string{"@playwright/mcp@latest"},
				"tools":   []string{"*"},
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer session.Disconnect()

	// 設定串流事件處理
	done := make(chan struct{}, 1)

	session.On(func(event copilot.SessionEvent) {
		switch d := event.Data.(type) {
		case *copilot.AssistantMessageDeltaData:
			fmt.Print(d.DeltaContent)
		case *copilot.SessionIdleData:
			select {
			case done <- struct{}{}:
			default:
			}
		case *copilot.SessionErrorData:
			fmt.Printf("\n錯誤：%s\n", d.Message)
			select {
			case done <- struct{}{}:
			default:
			}
		}
	})

	prompt := fmt.Sprintf(`
    使用 Playwright MCP server 分析此網頁的協助工具：%s
    
    請：
    1. 使用 playwright-browser_navigate 導覽至該 URL
    2. 使用 playwright-browser_snapshot 擷取協助工具快照
    3. 分析快照並提供詳細的協助工具報告
    
    使用表情符號指示器格式化報告：
    - 📊 協助工具報告標題
    - ✅ 運作良好的部分 (包含類別、狀態、詳細資訊的表格)
    - ⚠️ 發現的問題 (包含嚴重性、問題、WCAG 標準、建議的表格)
    - 📋 統計摘要 (連結、標題、可聚焦元素、地標)
    - ⚙️ 優先建議

    使用 ✅ 表示通過，🔴 表示高嚴重性問題，🟡 表示中嚴重性問題，❌ 表示缺失項目。
    包含來自頁面分析的實際發現。
    `, url)

	if _, err := session.Send(ctx, copilot.MessageOptions{Prompt: prompt}); err != nil {
		log.Fatal(err)
	}
	<-done

	fmt.Println("\n\n=== 報告完成 ===\n")

	// 提示使用者產生測試
	fmt.Print("您是否要產生 Playwright 協助工具測試？(y/n): ")
	generateTests, _ := reader.ReadString('\n')
	generateTests = strings.TrimSpace(strings.ToLower(generateTests))

	if generateTests == "y" || generateTests == "yes" {
		detectLanguagePrompt := `
        分析目前的工作目錄以偵測主要的程式語言。
        僅回應偵測到的語言名稱和簡短說明。
        如果未偵測到專案，請建議 "TypeScript" 作為預設值。
        `

		fmt.Println("\n正在偵測專案語言...\n")
		select {
		case <-done:
		default:
		}
		if _, err := session.Send(ctx, copilot.MessageOptions{Prompt: detectLanguagePrompt}); err != nil {
			log.Fatal(err)
		}
		<-done

		fmt.Print("\n\n確認測試所用的語言 (或輸入其他語言)：")
		language, _ := reader.ReadString('\n')
		language = strings.TrimSpace(language)
		if language == "" {
			language = "TypeScript"
		}

		testGenerationPrompt := fmt.Sprintf(`
        根據您剛才為 %s 產生的協助工具報告，
        在 %s 中建立 Playwright 協助工具測試。
        
        包含以下測試：lang 屬性、標題、標題階層、替代文字、
        地標 (landmarks)、略過導覽、焦點指示器和觸控目標。
        使用 Playwright 的協助工具測試功能並加上實用的註解。
        輸出完整的測試檔案。
        `, url, language)

		fmt.Println("\n正在產生協助工具測試...\n")
		select {
		case <-done:
		default:
		}
		if _, err := session.Send(ctx, copilot.MessageOptions{Prompt: testGenerationPrompt}); err != nil {
			log.Fatal(err)
		}
		<-done

		fmt.Println("\n\n=== 測試已產生 ===")
	}
}
```

## 運作方式

1. **Playwright MCP server**：設定執行 `@playwright/mcp` 的本地 MCP server，以提供瀏覽器自動化工具
2. **串流輸出**：使用 `Streaming: true` 和 `AssistantMessageDeltaData` 事件進行即時逐個權杖輸出
3. **協助工具快照**：Playwright 的 `browser_snapshot` 工具可擷取頁面的完整協助工具樹
4. **結構化報告**：提示詞設計了一致的符合 WCAG 的報告格式，並帶有表情符號嚴重性指示器
5. **測試產生**：可選擇偵測專案語言並產生 Playwright 協助工具測試

## 核心概念

### MCP server 設定

此食譜設定了一個與工作階段並行執行的本地 MCP server：

```go
session, err := client.CreateSession(ctx, &copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    MCPServers: map[string]copilot.MCPServerConfig{
        "playwright": {
            "type":    "local",
            "command": "npx",
            "args":    []string{"@playwright/mcp@latest"},
            "tools":   []string{"*"},
        },
    },
})
```

這讓模型可以存取 Playwright 瀏覽器工具，例如 `browser_navigate`、`browser_snapshot` 和 `browser_click`。

### 搭配事件進行串流

與 `SendAndWait` 不同，此食譜使用串流來取得即時輸出：

```go
session.On(func(event copilot.SessionEvent) {
    switch d := event.Data.(type) {
    case *copilot.AssistantMessageDeltaData:
        fmt.Print(d.DeltaContent)
    case *copilot.SessionIdleData:
        done <- struct{}{}
    }
})
```

## 範例互動

```
=== 協助工具報告產生器 ===

輸入要分析的 URL: github.com

正在分析：https://github.com
請稍候...

📊 協助工具報告：GitHub (github.com)

✅ 運作良好的部分
| 類別 | 狀態 | 詳細資訊 |
|----------|--------|---------|
| 語言 | ✅ 通過 | lang="en" 已正確設定 |
| 頁面標題 | ✅ 通過 | "GitHub" 可被辨識 |
| 標題階層 | ✅ 通過 | 正確的 H1/H2 結構 |
| 影像 | ✅ 通過 | 所有影像皆有替代文字 |

⚠️ 發現的問題
| 嚴重性 | 問題 | WCAG 標準 | 建議 |
|----------|-------|----------------|----------------|
| 🟡 中 | 某些連結缺少描述性文字 | 2.4.4 | 為僅限圖示的連結新增 aria-label |

📋 統計摘要
- 總連結數：47
- 總標題數：8 (1× H1，正確階層)
- 可聚焦元素：52
- 發現的地標：橫幅 ✅、導覽 ✅、主內容 ✅、頁尾 ✅

=== 報告完成 ===

您是否要產生 Playwright 協助工具測試？(y/n): y

正在偵測專案語言...
偵測到 TypeScript (找到 package.json)

確認測試所用的語言 (或輸入其他語言)：

正在產生協助工具測試...
[產生的測試檔案輸出...]

=== 測試已產生 ===
```
