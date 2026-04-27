# 依據 Metadata 進行檔案分組

使用 Copilot 根據檔案的 Metadata，智慧地組織資料夾中的檔案。

> **可執行的範例：** [recipe/managing-local-files.go](recipe/managing-local-files.go)
>
> ```bash
> go run recipe/managing-local-files.go
> ```

## 範例情境

您有一個包含許多檔案的資料夾，並希望根據檔案類型、建立日期、大小或其他屬性等 Metadata 將它們組織到子資料夾中。Copilot 可以分析這些檔案並建議或執行分組策略。

## 範例程式碼

```go
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
        Model: "gpt-5.4",
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

    // 要求 Copilot 組織檔案
    homeDir, _ := os.UserHomeDir()
    targetFolder := filepath.Join(homeDir, "Downloads")

    prompt := fmt.Sprintf(`
分析 "%s" 中的檔案，並將它們組織到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽依檔案副檔名進行分組
3. 建立適當的子資料夾 (例如 "images", "documents", "videos")
4. 將每個檔案移動到其適當的子資料夾中

在移動任何檔案之前，請先確認。
`, targetFolder)

    _, err = session.SendAndWait(ctx, copilot.MessageOptions{Prompt: prompt})
    if err != nil {
        log.Fatal(err)
    }
}
```

## 分組策略

### 依檔案副檔名

```go
// 分組檔案如下：
// images/   -> .jpg, .png, .gif
// documents/ -> .pdf, .docx, .txt
// videos/   -> .mp4, .avi, .mov
```

### 依建立日期

```go
// 分組檔案如下：
// 2024-01/ -> 建立於 2024 年 1 月的檔案
// 2024-02/ -> 建立於 2024 年 2 月的檔案
```

### 依檔案大小

```go
// 分組檔案如下：
// tiny-under-1kb/
// small-under-1mb/
// medium-under-100mb/
// large-over-100mb/
```

## 測試執行模式

為了安全起見，您可以要求 Copilot 僅預覽更改：

```go
prompt := fmt.Sprintf(`
分析 "%s" 中的檔案，並向我展示您將如何
依檔案類型組織它們。請勿移動任何檔案 — 僅向我展示計劃。
`, targetFolder)

session.SendAndWait(ctx, copilot.MessageOptions{Prompt: prompt})
```

## 使用 AI 分析進行自訂分組

讓 Copilot 根據檔案內容決定最佳分組：

```go
prompt := fmt.Sprintf(`
檢視 "%s" 中的檔案並建議一個邏輯組織方式。
考慮：
- 檔案名稱及其可能包含的內容
- 檔案類型及其典型用途
- 可能指示專案或事件的日期模式

提出具有描述性且實用的資料夾名稱。
`, targetFolder)

session.SendAndWait(ctx, copilot.MessageOptions{Prompt: prompt})
```

## 安全考量

1. **移動前確認**：要求 Copilot 在執行移動前進行確認
2. **處理重複檔案**：考慮如果存在同名檔案會發生什麼情況
3. **保留原始檔案**：對於重要檔案，考慮使用複製而非移動
