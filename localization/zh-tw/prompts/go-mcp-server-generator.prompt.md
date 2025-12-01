---
agent: agent
description: '使用官方的 github.com/modelcontextprotocol/go-sdk 建立一個具有適當結構、依賴項和實作的完整 Go MCP 伺服器專案。'
---

# Go MCP 伺服器專案產生器

產生一個完整、可投入生產的 Go Model Context Protocol (MCP) 伺服器專案。

## 專案要求

您將建立一個 Go MCP 伺服器，其中包含：

1. **專案結構**: 適當的 Go 模組佈局
2. **依賴項**: 官方 MCP SDK 和必要的套件
3. **伺服器設定**: 配置了傳輸的 MCP 伺服器
4. **工具**: 至少 2-3 個具有類型輸入/輸出的實用工具
5. **錯誤處理**: 適當的錯誤處理和上下文使用
6. **文件**: 包含設定和使用說明的 README
7. **測試**: 基本測試結構

## 模板結構

```
myserver/
├── go.mod
├── go.sum
├── main.go
├── tools/
│   ├── tool1.go
│   └── tool2.go
├── resources/
│   └── resource1.go
├── config/
│   └── config.go
├── README.md
└── main_test.go
```

## go.mod 模板

```go
module github.com/yourusername/{{PROJECT_NAME}}

go 1.23

require (
    github.com/modelcontextprotocol/go-sdk v1.0.0
)
```

## main.go 模板

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"

    "github.com/modelcontextprotocol/go-sdk/mcp"
    "github.com/yourusername/{{PROJECT_NAME}}/config"
    "github.com/yourusername/{{PROJECT_NAME}}/tools"
)

func main() {
    cfg := config.Load()
    
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Handle graceful shutdown
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
    go func() {
        <-sigCh
        log.Println("Shutting down...")
        cancel()
    }()

    // 建立伺服器
    server := mcp.NewServer(
        &mcp.Implementation{
            Name:    cfg.ServerName,
            Version: cfg.Version,
        },
        &mcp.Options{
            Capabilities: &mcp.ServerCapabilities{
                Tools:     &mcp.ToolsCapability{},
                Resources: &mcp.ResourcesCapability{},
                Prompts:   &mcp.PromptsCapability{},
            },
        },
    )

    // 註冊工具
    tools.RegisterTools(server)

    // 執行伺服器
    transport := &mcp.StdioTransport{}
    if err := server.Run(ctx, transport); err != nil {
        log.Fatalf("Server error: %v", err)
    }
}
```

## tools/tool1.go 模板

```go
package tools

import (
    "context"
    "fmt"

    "github.com/modelcontextprotocol/go-sdk/mcp"
)

type Tool1Input struct {
    Param1 string `json:"param1" jsonschema:"required,description=First parameter"`
    Param2 int    `json:"param2,omitempty" jsonschema:"description=Optional second parameter"`
}

type Tool1Output struct {
    Result string `json:"result" jsonschema:"description=The result of the operation"`
    Status string `json:"status" jsonschema:"description=Operation status"`
}

func Tool1Handler(ctx context.Context, req *mcp.CallToolRequest, input Tool1Input) (
    *mcp.CallToolResult,
    Tool1Output,
    error,
) {
    // 驗證輸入
    if input.Param1 == "" {
        return nil, Tool1Output{}, fmt.Errorf("param1 is required")
    }

    // 檢查上下文
    if ctx.Err() != nil {
        return nil, Tool1Output{}, ctx.Err()
    }

    // 執行操作
    result := fmt.Sprintf("Processed: %s", input.Param1)

    return nil, Tool1Output{
        Result: result,
        Status: "success",
    }, nil
}

func RegisterTool1(server *mcp.Server) {
    mcp.AddTool(server,
        &mcp.Tool{
            Name:        "tool1",
            Description: "Description of what tool1 does",
        },
        Tool1Handler,
    )
}
```

## tools/registry.go 模板

```go
package tools

import "github.com/modelcontextprotocol/go-sdk/mcp"

func RegisterTools(server *mcp.Server) {
    RegisterTool1(server)
    RegisterTool2(server)
    // 在此註冊其他工具
}
```

## config/config.go 模板

```go
package config

import "os"

type Config struct {
    ServerName string
    Version    string
    LogLevel   string
}

func Load() *Config {
    return &Config{
        ServerName: getEnv("SERVER_NAME", "{{PROJECT_NAME}}"),
        Version:    getEnv("VERSION", "v1.0.0"),
        LogLevel:   getEnv("LOG_LEVEL", "info"),
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

## main_test.go 模板

```go
package main

import (
    "context"
    "testing"

    "github.com/yourusername/{{PROJECT_NAME}}/tools"
)

func TestTool1Handler(t *testing.T) {
    ctx := context.Background()
    input := tools.Tool1Input{
        Param1: "test",
        Param2: 42,
    }

    result, output, err := tools.Tool1Handler(ctx, nil, input)
    if err != nil {
        t.Fatalf("Tool1Handler failed: %v", err)
    }

    if output.Status != "success" {
        t.Errorf("Expected status 'success', got '%s'", output.Status)
    }

    if result != nil {
        t.Error("Expected result to be nil")
    }
}
```

## README.md 模板

```markdown
# {{PROJECT_NAME}}

一個使用 Go 建立的 Model Context Protocol (MCP) 伺服器。

## 描述

{{PROJECT_DESCRIPTION}}

## 安裝

```bash
go mod download
go build -o {{PROJECT_NAME}}
```

## 使用方式

使用 stdio 傳輸執行伺服器：

```bash
./{{PROJECT_NAME}}
```

## 配置

透過環境變數配置：

- `SERVER_NAME`: 伺服器名稱 (預設: "{{PROJECT_NAME}}")
- `VERSION`: 伺服器版本 (預設: "v1.0.0")
- `LOG_LEVEL`: 日誌級別 (預設: "info")

## 可用工具

### tool1
{{TOOL1_DESCRIPTION}}

**輸入:**
- `param1` (string, required): 第一個參數
- `param2` (int, optional): 第二個參數

**輸出:**
- `result` (string): 操作結果
- `status` (string): 操作狀態

## 開發

執行測試：

```bash
go test ./...
```

建構：

```bash
go build -o {{PROJECT_NAME}}
```

## 授權

MIT
```

## 產生說明

產生 Go MCP 伺服器時：

1. **初始化模組**: 建立具有適當模組路徑的 `go.mod`
2. **結構**: 遵循模板目錄結構
3. **類型安全**: 對所有輸入/輸出使用帶有 JSON 結構標籤的結構
4. **錯誤處理**: 驗證輸入、檢查上下文、包裝錯誤
5. **文件**: 添加清晰的描述和範例
6. **測試**: 每個工具至少包含一個測試
7. **配置**: 使用環境變數進行配置
8. **日誌記錄**: 使用結構化日誌記錄 (log/slog)
9. **優雅關機**: 適當處理訊號
10. **傳輸**: 預設為 stdio，文件說明替代方案

## 最佳實踐

- 保持工具專注且單一用途
- 對類型和函式使用描述性名稱
- 在結構標籤中包含 JSON 結構文件
- 始終尊重上下文取消
- 返回描述性錯誤
- 保持 main.go 最小化，邏輯放在套件中
- 為工具處理程式編寫測試
- 文件說明所有匯出的函式
