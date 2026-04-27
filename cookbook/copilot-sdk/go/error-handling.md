# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

> **可執行的範例：** [recipe/error-handling.go](recipe/error-handling.go)
>
> ```bash
> go run recipe/error-handling.go
> ```

## 範例情境

您需要處理各種錯誤狀況，例如連線失敗、逾時和無效的回應。

## 基礎錯誤處理

```go
package main

import (
    "context"
    "fmt"
    "log"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    ctx := context.Background()
    client := copilot.NewClient(nil)

    if err := client.Start(ctx); err != nil {
        log.Fatalf("啟動用戶端失敗：%v", err)
    }
    defer client.Stop()

    session, err := client.CreateSession(ctx, &copilot.SessionConfig{
    	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
        Model: "gpt-5.4",
    })
    if err != nil {
        log.Fatalf("建立工作階段失敗：%v", err)
    }
    defer session.Disconnect()

    result, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "哈囉！"})
    if err != nil {
        log.Printf("傳送訊息失敗：%v", err)
        return
    }

    if result != nil {
        if d, ok := result.Data.(*copilot.AssistantMessageData); ok {
            fmt.Println(d.Content)
        }
    }
}
```

## 處理特定錯誤類型

```go
import (
    "context"
    "errors"
    "fmt"
    "os/exec"
    copilot "github.com/github/copilot-sdk/go"
)

func startClient(ctx context.Context) error {
    client := copilot.NewClient(nil)

    if err := client.Start(ctx); err != nil {
        var execErr *exec.Error
        if errors.As(err, &execErr) {
            return fmt.Errorf("找不到 Copilot CLI。請先安裝它：%w", err)
        }
        if errors.Is(err, context.DeadlineExceeded) {
            return fmt.Errorf("無法連線到 Copilot CLI 伺服器：%w", err)
        }
        return fmt.Errorf("未預期的錯誤：%w", err)
    }

    return nil
}
```

## 逾時處理

```go
import (
    "context"
    "errors"
    "fmt"
    "time"
    copilot "github.com/github/copilot-sdk/go"
)

func sendWithTimeout(session *copilot.Session) error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    result, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "複雜的問題..."})
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            return fmt.Errorf("請求逾時")
        }
        return err
    }

    if result != nil && result.Data.Content != nil {
        fmt.Println(*result.Data.Content)
    }
    return nil
}
```

## 中止請求

```go
func abortAfterDelay(ctx context.Context, session *copilot.Session) {
    // 開始一個請求 (非阻塞傳送)
    session.Send(ctx, copilot.MessageOptions{Prompt: "寫一個很長的故事..."})

    // 在某些條件後中止它
    time.AfterFunc(5*time.Second, func() {
        if err := session.Abort(ctx); err != nil {
            log.Printf("中止失敗：%v", err)
        }
        fmt.Println("請求已中止")
    })
}
```

## 優雅關閉

```go
import (
    "context"
    "fmt"
    "log"
    "os"
    "os/signal"
    "syscall"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    ctx := context.Background()
    client := copilot.NewClient(nil)

    // 設定訊號處理
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

    go func() {
        <-sigChan
        fmt.Println("\n正在關閉...")
        client.Stop()
        os.Exit(0)
    }()

    if err := client.Start(ctx); err != nil {
        log.Fatal(err)
    }

    // ... 執行工作 ...
}
```

## 延遲清理模式

```go
func doWork() error {
    ctx := context.Background()
    client := copilot.NewClient(nil)

    if err := client.Start(ctx); err != nil {
        return fmt.Errorf("啟動失敗：%w", err)
    }
    defer client.Stop()

    session, err := client.CreateSession(ctx, &copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
	Model:               "gpt-5.4",
    })
    if err != nil {
        return fmt.Errorf("建立工作階段失敗：%w", err)
    }
    defer session.Disconnect()

    // ... 執行工作 ...

    return nil
}
```

## 最佳實務

1. **始終進行清理**：使用 defer 確保呼叫 `Stop()`
2. **處理連線錯誤**：CLI 可能未安裝或未執行
3. **設定適當的逾時**：對長期執行的請求使用 `context.WithTimeout`
4. **記錄錯誤**：擷取錯誤詳細資訊以供偵錯
5. **包裝錯誤**：使用 `fmt.Errorf` 搭配 `%w` 以保留錯誤鏈
