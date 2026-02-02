# 按 Metadata 將檔案分組

使用 Copilot 根據檔案的 Metadata 智慧地組織資料夾中的檔案。

> **可執行範例：** [recipe/managing-local-files.go](recipe/managing-local-files.go)
> 
> ```bash
> go run recipe/managing-local-files.go
> ```

## 範例場景

您有一個包含許多檔案的資料夾，並希望根據檔案類型、建立日期、大小或其他屬性等 Metadata 將它們組織到子資料夾中。Copilot 可以分析檔案並建議或執行分組策略。

## 範例程式碼

```go
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

    // 事件處理程式
    session.On(func(event copilot.Event) {
        switch e := event.(type) {
        case copilot.AssistantMessageEvent:
            fmt.Printf("\nCopilot: %s\n", e.Data.Content)
        case copilot.ToolExecutionStartEvent:
            fmt.Printf("  → 執行中：%s\n", e.Data.ToolName)
        case copilot.ToolExecutionCompleteEvent:
            fmt.Printf("  ✓ 已完成：%s\n", e.Data.ToolName)
        }
    })

    // 要求 Copilot 組織檔案
    homeDir, _ := os.UserHomeDir()
    targetFolder := filepath.Join(homeDir, "Downloads")

    prompt := fmt.Sprintf(`
分析 "%s" 中的檔案並將其組織到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽按副檔名進行的分組
3. 建立適當的子資料夾（例如 "images"、"documents"、"videos"）
4. 將每個檔案移動到其適當的子資料夾

在移動任何檔案之前請先確認。
`, targetFolder)

    if err := session.Send(copilot.MessageOptions{Prompt: prompt}); err != nil {
        log.Fatal(err)
    }

    session.WaitForIdle()
}
```

## 分組策略

### 按副檔名

```go
// 檔案分組如下：
// images/   -> .jpg, .png, .gif
// documents/ -> .pdf, .docx, .txt
// videos/   -> .mp4, .avi, .mov
```

### 按建立日期

```go
// 檔案分組如下：
// 2024-01/ -> 2024 年 1 月建立的檔案
// 2024-02/ -> 2024 年 2 月建立的檔案
```

### 按檔案大小

```go
// 檔案分組如下：
// tiny-under-1kb/
// small-under-1mb/
// medium-under-100mb/
// large-over-100mb/
```

## 試執行模式 (Dry-run mode)

為了安全起見，您可以要求 Copilot 僅預覽變更：

```go
prompt := fmt.Sprintf(`
分析 "%s" 中的檔案，並向我展示您將如何按檔案類型
組織它們。不要移動任何檔案 - 只需向我展示計畫。
`, targetFolder)

session.Send(copilot.MessageOptions{Prompt: prompt})
```

## 使用 AI 分析進行自定義分組

讓 Copilot 根據檔案內容決定最佳分組：

```go
prompt := fmt.Sprintf(`
查看 "%s" 中的檔案並建議一個邏輯組織方式。
考慮：
- 檔案名稱及其可能包含的內容
- 檔案類型及其典型用途
- 可能指示專案或事件的日期模式

提議具有描述性且實用的資料夾名稱。
`, targetFolder)

session.Send(copilot.MessageOptions{Prompt: prompt})
```

## 安全考量

1. **移動前確認**：要求 Copilot 在執行移動之前進行確認
2. **處理重複項**：考慮如果存在同名檔案會發生什麼情況
3. **保留原始檔案**：對於重要檔案，考慮使用複製而非移動
