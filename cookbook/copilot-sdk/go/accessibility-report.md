# 產生協助工具報告

建構一個 CLI 工具，使用 Playwright MCP 伺服器分析網頁協助工具（accessibility），並產生詳細的 WCAG 相容報告，且可選擇產生測試程式碼。

> **可執行範例：** [recipe/accessibility-report.go](recipe/accessibility-report.go)
>
> ```bash
> go run recipe/accessibility-report.go
> ```

## 範例情境

您想要稽核網站的協助工具合規性。此工具使用 Playwright 導覽至 URL，擷取協助工具快照，並產生一份結構化報告，內容涵蓋 WCAG 標準，如地標（landmarks）、標題階層、焦點管理與觸控目標。它還可以產生 Playwright 測試檔案，以自動執行未來的協助工具檢查。

## 先決條件

```bash
go get github.com/github/copilot-sdk/go
```

您還需要安裝 `npx`（已安裝 Node.js）以執行 Playwright MCP 伺服器。

## 使用方式

```bash
go run accessibility-report.go
# 根據提示輸入 URL
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

	fmt.Print("輸入要分析的 URL：")
	url, _ := reader.ReadString('\n')
	url = strings.TrimSpace(url)

	if url == "" {
		fmt.Println("未提供 URL。正在結束。")
		return
	}

	// 確保 URL 具有協定
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	fmt.Printf("\n正在分析：%s\n", url)
	fmt.Println("請稍候...\n")

	// 使用 Playwright MCP 伺服器建立 Copilot 用戶端
	client := copilot.NewClient(nil)

	if err := client.Start(ctx); err != nil {
		log.Fatal(err)
	}
	defer client.Stop()

	streaming := true
	session, err := client.CreateSession(ctx, &copilot.SessionConfig{
		Model:     "claude-opus-4.6",
		Streaming: &streaming,
		McpServers: map[string]interface{}{
			"playwright": map[string]interface{}{
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
	defer session.Destroy()

	// 設定串流事件處理
	done := make(chan struct{}, 1)

	session.On(func(event copilot.SessionEvent) {
		switch event.Type {
		case "assistant.message.delta":
			if event.Data.DeltaContent != nil {
				fmt.Print(*event.Data.DeltaContent)
			}
		case "session.idle":
			select {
			case done <- struct{}{}:
			default:
			}
		case "session.error":
			if event.Data.Message != nil {
				fmt.Printf("\n錯誤：%s\n", *event.Data.Message)
			}
			select {
			case done <- struct{}{}:
			default:
			}
		}
	})

	prompt := fmt.Sprintf(`
    使用 Playwright MCP 伺服器分析此網頁的協助工具：%s
    
    請執行以下操作：
    1. 使用 playwright-browser_navigate 導覽至該 URL
    2. 使用 playwright-browser_snapshot 擷取協助工具快照
    3. 分析快照並提供詳細的協助工具報告
    
    請使用表情符號指示格式化報告：
    - 📊 協助工具報告標題
    - ✅ 運作良好的部分（包含類別、狀態、詳細資訊的表格）
    - ⚠️ 發現的問題（包含嚴重程度、問題、WCAG 標準、建議的表格）
    - 📋 統計摘要（連結、標題、可聚焦元素、地標）
    - ⚙️ 優先建議

    使用 ✅ 表示通過，🔴 表示高嚴重性問題，🟡 表示中嚴重性問題，❌ 表示遺失項目。
    包含來自網頁分析的實際發現。
    `, url)

	if _, err := session.Send(ctx, copilot.MessageOptions{Prompt: prompt}); err != nil {
		log.Fatal(err)
	}
	<-done

	fmt.Println("\n\n=== 報告完成 ===\n")

	// 提示使用者產生測試
	fmt.Print("您是否要產生 Playwright 協助工具測試？(y/n)：")
	generateTests, _ := reader.ReadString('\n')
	generateTests = strings.TrimSpace(strings.ToLower(generateTests))

	if generateTests == "y" || generateTests == "yes" {
		detectLanguagePrompt := `
        分析目前工作目錄以偵測主要程式語言。
        僅回應偵測到的語言名稱與簡短說明。
        如果未偵測到專案，建議將 "TypeScript" 作為預設語言。
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

		fmt.Print("\n\n確認測試語言（或輸入其他語言）：")
		language, _ := reader.ReadString('\n')
		language = strings.TrimSpace(language)
		if language == "" {
			language = "TypeScript"
		}

		testGenerationPrompt := fmt.Sprintf(`
        根據您剛為 %s 產生的協助工具報告，
        以 %s 建立 Playwright 協助工具測試。
        
        包含以下測試：lang 屬性、標題、標題階層、替代文字、
        地標、跳過導覽、焦點指示器與觸控目標。
        使用 Playwright 的協助工具測試功能並包含實用註釋。
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

1. **Playwright MCP 伺服器**：設定一個執行 `@playwright/mcp` 的本機 MCP 伺服器，以提供瀏覽器自動化工具
2. **串流輸出**：使用 `Streaming: &streaming` 與 `assistant.message.delta` 事件進行即時的逐權杖輸出
3. **協助工具快照**：Playwright 的 `browser_snapshot` 工具可擷取網頁的完整協助工具樹
4. **結構化報告**：提示詞設計了一種與 WCAG 對齊且一致的報告格式，並帶有表情符號嚴重程度指示器
5. **測試產生**：可選擇性地偵測專案語言並產生 Playwright 協助工具測試

## 關鍵概念

### MCP 伺服器設定

此食譜設定了與工作階段一同執行的本機 MCP 伺服器：

```go
session, err := client.CreateSession(ctx, &copilot.SessionConfig{
    McpServers: map[string]interface{}{
        "playwright": map[string]interface{}{
            "type":    "local",
            "command": "npx",
            "args":    []string{"@playwright/mcp@latest"},
            "tools":   []string{"*"},
        },
    },
})
```

這使模型能夠存取 Playwright 瀏覽器工具，例如 `browser_navigate`、`browser_snapshot` 與 `browser_click`。

### 搭配事件進行串流

與 `SendAndWait` 不同，此食譜使用串流進行即時輸出：

```go
session.On(func(event copilot.SessionEvent) {
    switch event.Type {
    case "assistant.message.delta":
        if event.Data.DeltaContent != nil {
            fmt.Print(*event.Data.DeltaContent)
        }
    case "session.idle":
        done <- struct{}{}
    }
})
```

## 互動範例

```
=== 協助工具報告產生器 ===

輸入要分析的 URL：github.com

正在分析：https://github.com
請稍候...

📊 協助工具報告：GitHub (github.com)

✅ 運作良好的部分
| 類別 | 狀態 | 詳細資訊 |
|----------|--------|---------|
| 語言 | ✅ 通過 | lang="en" 設定正確 |
| 網頁標題 | ✅ 通過 | "GitHub" 可辨識 |
| 標題階層 | ✅ 通過 | 正確的 H1/H2 結構 |
| 圖片 | ✅ 通過 | 所有圖片皆有替代文字 |

⚠️ 發現的問題
| 嚴重程度 | 問題 | WCAG 標準 | 建議 |
|----------|-------|----------------|----------------|
| 🟡 中 | 某些連結缺少描述性文字 | 2.4.4 | 為僅含圖示的連結新增 aria-label |

📋 統計摘要
- 連結總數：47
- 標題總數：8 (1× H1，正確階層)
- 可聚焦元素：52
- 發現的地標：橫幅 ✅、導覽 ✅、主要 ✅、頁尾 ✅

=== 報告完成 ===

您是否要產生 Playwright 協助工具測試？(y/n)：y

正在偵測專案語言...
偵測到 TypeScript (發現 package.json)

確認測試語言（或輸入其他語言）：

正在產生協助工具測試...
[產生的測試檔案輸出...]

=== 測試已產生 ===
```
