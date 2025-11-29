---
description: '使用官方 github.com/modelcontextprotocol/go-sdk 套件在 Go 中建構模型上下文協定 (MCP) 伺服器的最佳實踐和模式。'
applyTo: "**/*.go, **/go.mod, **/go.sum"
---

# Go MCP 伺服器開發指南

在 Go 中建構 MCP 伺服器時，請遵循這些使用官方 Go SDK 的最佳實踐和模式。

## 伺服器設定

使用 `mcp.NewServer` 建立 MCP 伺服器：

```go
import "github.com/modelcontextprotocol/go-sdk/mcp"

server := mcp.NewServer(
    &mcp.Implementation{
        Name:    "my-server",
        Version: "v1.0.0",
    },
    nil, // or provide mcp.Options
)
```

## 添加工具

使用 `mcp.AddTool` 和基於結構的輸入和輸出以確保型別安全：

```go
type ToolInput struct {
    Query string `json:"query" jsonschema:"the search query"`
    Limit int    `json:"limit,omitempty" jsonschema:"maximum results to return"`
}

type ToolOutput struct {
    Results []string `json:"results" jsonschema:"list of search results"`
    Count   int      `json:"count" jsonschema:"number of results found"`
}

func SearchTool(ctx context.Context, req *mcp.CallToolRequest, input ToolInput) (
    *mcp.CallToolResult,
    ToolOutput,
    error,
) {
    // Implement tool logic
    results := performSearch(ctx, input.Query, input.Limit)
    
    return nil, ToolOutput{
        Results: results,
        Count:   len(results),
    }, nil
}

// Register the tool
mcp.AddTool(server, 
    &mcp.Tool{
        Name:        "search",
        Description: "Search for information",
    },
    SearchTool,
)
```

## 添加資源

使用 `mcp.AddResource` 提供可訪問的資料：

```go
func GetResource(ctx context.Context, req *mcp.ReadResourceRequest) (*mcp.ReadResourceResult, error) {
    content, err := loadResourceContent(ctx, req.URI)
    if err != nil {
        return nil, err
    }
    
    return &mcp.ReadResourceResult{
        Contents: []any{
            &mcp.TextResourceContents{
                ResourceContents: mcp.ResourceContents{
                    URI:      req.URI,
                    MIMEType: "text/plain",
                },
                Text: content,
            },
        },
    }, nil
}

mcp.AddResource(server,
    &mcp.Resource{
        URI:         "file:///data/example.txt",
        Name:        "Example Data",
        Description: "Example resource data",
        MIMEType:    "text/plain",
    },
    GetResource,
)
```

## 添加提示

使用 `mcp.AddPrompt` 實現可重用的提示範本：

```go
type PromptInput struct {
    Topic string `json:"topic" jsonschema:"the topic to analyze"`
}

func AnalyzePrompt(ctx context.Context, req *mcp.GetPromptRequest, input PromptInput) (
    *mcp.GetPromptResult,
    error,
) {
    return &mcp.GetPromptResult{
        Description: "Analyze the given topic",
        Messages: []mcp.PromptMessage{
            {
                Role: mcp.RoleUser,
                Content: mcp.TextContent{
                    Text: fmt.Sprintf("Analyze this topic: %s", input.Topic),
                },
            },
        },
    }, nil
}

mcp.AddPrompt(server,
    &mcp.Prompt{
        Name:        "analyze",
        Description: "Analyze a topic",
        Arguments: []mcp.PromptArgument{
            {
                Name:        "topic",
                Description: "The topic to analyze",
                Required:    true,
            },
        },
    },
    AnalyzePrompt,
)
```

## 傳輸組態

### 標準輸入/輸出傳輸

用於透過標準輸入/輸出進行通訊（桌面整合最常見）：

```go
if err := server.Run(ctx, &mcp.StdioTransport{}); err != nil {
    log.Fatal(err)
}
```

### HTTP 傳輸

用於基於 HTTP 的通訊：

```go
import "github.com/modelcontextprotocol/go-sdk/mcp"

transport := &mcp.HTTPTransport{
    Addr: ":8080",
    // Optional: configure TLS, timeouts, etc.
}

if err := server.Run(ctx, transport); err != nil {
    log.Fatal(err)
}
```

## 錯誤處理

始終返回正確的錯誤並使用上下文進行取消：

```go
func MyTool(ctx context.Context, req *mcp.CallToolRequest, input MyInput) (
    *mcp.CallToolResult,
    MyOutput,
    error,
) {
    // Check context cancellation
    if ctx.Err() != nil {
        return nil, MyOutput{}, ctx.Err()
    }
    
    // Return errors for invalid input
    if input.Query == "" {
        return nil, MyOutput{}, fmt.Errorf("query cannot be empty")
    }
    
    // Perform operation
    result, err := performOperation(ctx, input)
    if err != nil {
        return nil, MyOutput{}, fmt.Errorf("operation failed: %w", err)
    }
    
    return nil, result, nil
}
```

## JSON 結構描述標籤

使用 `jsonschema` 標籤來文件化你的結構，以實現更好的客戶端整合：

```go
type Input struct {
    Name     string   `json:"name" jsonschema:"required,description=User's name"`
    Age      int      `json:"age" jsonschema:"minimum=0,maximum=150"`
    Email    string   `json:"email,omitempty" jsonschema:"format=email"`
    Tags     []string `json:"tags,omitempty" jsonschema:"uniqueItems=true"`
    Active   bool     `json:"active" jsonschema:"default=true"`
}
```

## 上下文使用

始終遵守上下文取消和截止日期：

```go
func LongRunningTool(ctx context.Context, req *mcp.CallToolRequest, input Input) (
    *mcp.CallToolResult,
    Output,
    error,
) {
    select {
    case <-ctx.Done():
        return nil, Output{}, ctx.Err()
    case result := <-performWork(ctx, input):
        return nil, result, nil
    }
}
```

## 伺服器選項

使用選項配置伺服器行為：

```go
options := &mcp.Options{
    Capabilities: &mcp.ServerCapabilities{
        Tools:     &mcp.ToolsCapability{},
        Resources: &mcp.ResourcesCapability{
            Subscribe: true, // Enable resource subscriptions
        },
        Prompts: &mcp.PromptsCapability{},
    },
}

server := mcp.NewServer(
    &mcp.Implementation{Name: "my-server", Version: "v1.0.0"},
    options,
)
```

## 測試

使用標準 Go 測試模式測試你的 MCP 工具：

```go
func TestSearchTool(t *testing.T) {
    ctx := context.Background()
    input := ToolInput{Query: "test", Limit: 10}
    
    result, output, err := SearchTool(ctx, nil, input)
    if err != nil {
        t.Fatalf("SearchTool failed: %v", err)
    }
    
    if len(output.Results) == 0 {
        t.Error("Expected results, got none")
    }
}
```

## 模組設定

正確初始化你的 Go 模組：

```bash
go mod init github.com/yourusername/yourserver
go get github.com/modelcontextprotocol/go-sdk@latest
```

你的 `go.mod` 應該包含：

```go
module github.com/yourusername/yourserver

go 1.23

require github.com/modelcontextprotocol/go-sdk v1.0.0
```

## 常見模式

### 日誌記錄

使用結構化日誌記錄：

```go
import "log/slog"

logger := slog.Default()
logger.Info("tool called", "name", req.Params.Name, "args", req.Params.Arguments)
```

### 組態

使用環境變數或組態檔案：

```go
type Config struct {
    ServerName string
    Version    string
    Port       int
}

func LoadConfig() *Config {
    return &Config{
        ServerName: getEnv("SERVER_NAME", "my-server"),
        Version:    getEnv("VERSION", "v1.0.0"),
        Port:       getEnvInt("PORT", 8080),
    }
}
```

### 優雅關機

正確處理關機訊號：

```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel()

sigCh := make(chan os.Signal, 1)
signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

go func() {
    <-sigCh
    cancel()
}()

if err := server.Run(ctx, transport); err != nil {
    log.Fatal(err)
}
```
