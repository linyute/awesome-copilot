# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

> **可執行範例：** [recipe/error-handling.go](recipe/error-handling.go)
> 
> ```bash
> go run recipe/error-handling.go
> ```

## 範例場景

您需要處理各種錯誤狀況，例如連線失敗、逾時與無效的回應。

## 基本錯誤處理

```go
package main

import (
    "fmt"
    "log"
    "github.com/github/copilot-sdk/go"
)

func main() {
    client := copilot.NewClient()

    if err := client.Start(); err != nil {
        log.Fatalf("無法啟動用戶端：%v", err)
    }
    defer func() {
        if err := client.Stop(); err != nil {
            log.Printf("停止用戶端時發生錯誤：%v", err)
        }
    }()

    session, err := client.CreateSession(copilot.SessionConfig{
        Model: "gpt-5",
    })
    if err != nil {
        log.Fatalf("無法建立工作階段：%v", err)
    }
    defer session.Destroy()

    responseChan := make(chan string, 1)
    session.On(func(event copilot.Event) {
        if msg, ok := event.(copilot.AssistantMessageEvent); ok {
            responseChan <- msg.Data.Content
        }
    })

    if err := session.Send(copilot.MessageOptions{Prompt: "Hello!"}); err != nil {
        log.Printf("發送訊息失敗：%v", err)
    }

    response := <-responseChan
    fmt.Println(response)
}
```

## 處理特定錯誤類型

```go
import (
    "errors"
    "os/exec"
)

func startClient() error {
    client := copilot.NewClient()

    if err := client.Start(); err != nil {
        var execErr *exec.Error
        if errors.As(err, &execErr) {
            return fmt.Errorf("找不到 Copilot CLI。請先安裝：%w", err)
        }
        if errors.Is(err, context.DeadlineExceeded) {
            return fmt.Errorf("無法連線至 Copilot CLI 伺服器：%w", err)
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
    "time"
)

func sendWithTimeout(session *copilot.Session) error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    responseChan := make(chan string, 1)
    errChan := make(chan error, 1)

    session.On(func(event copilot.Event) {
        if msg, ok := event.(copilot.AssistantMessageEvent); ok {
            responseChan <- msg.Data.Content
        }
    })

    if err := session.Send(copilot.MessageOptions{Prompt: "複雜的問題..."}); err != nil {
        return err
    }

    select {
    case response := <-responseChan:
        fmt.Println(response)
        return nil
    case err := <-errChan:
        return err
    case <-ctx.Done():
        return fmt.Errorf("請求逾時")
    }
}
```

## 中止請求

```go
func abortAfterDelay(session *copilot.Session) {
    // 開始一個請求
    session.Send(copilot.MessageOptions{Prompt: "寫一個很長的故事..."})

    // 在某些條件下中止它
    time.AfterFunc(5*time.Second, func() {
        if err := session.Abort(); err != nil {
            log.Printf("中止失敗：%v", err)
        }
        fmt.Println("請求已中止")
    })
}
```

## 優雅關閉

```go
import (
    "os"
    "os/signal"
    "syscall"
)

func main() {
    client := copilot.NewClient()

    // 設定訊號處理
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

    go func() {
        <-sigChan
        fmt.Println("\n正在關閉...")

        if err := client.Stop(); err != nil {
            log.Printf("清理錯誤：%v", err)
        }

        os.Exit(0)
    }()

    if err := client.Start(); err != nil {
        log.Fatal(err)
    }

    // ... 執行工作 ...
}
```

## 延遲清理模式

```go
func doWork() error {
    client := copilot.NewClient()

    if err := client.Start(); err != nil {
        return fmt.Errorf("啟動失敗：%w", err)
    }
    defer client.Stop()

    session, err := client.CreateSession(copilot.SessionConfig{Model: "gpt-5"})
    if err != nil {
        return fmt.Errorf("建立工作階段失敗：%w", err)
    }
    defer session.Destroy()

    // ... 執行工作 ...

    return nil
}
```

## 最佳實踐

1. **務必進行清理**：使用 defer 以確保呼叫 `Stop()`
2. **處理連線錯誤**：CLI 可能未安裝或未執行
3. **設定適當的逾時**：針對長時間執行的請求使用 `context.WithTimeout`
4. **記錄錯誤**：擷取錯誤詳細資訊以進行偵錯
5. **包裝錯誤**：使用 `fmt.Errorf` 搭配 `%w` 以保留錯誤鏈

```