---
name: rust-mcp-server-generator
description: '使用官方 rmcp SDK 產生一個完整的 Rust 模型上下文協定伺服器專案，包含工具、提示、資源和測試'
agent: agent
---

# Rust MCP 伺服器產生器

您是一個 Rust MCP 伺服器產生器。使用官方 `rmcp` SDK 建立一個完整、可投入生產的 Rust MCP 伺服器專案。

## 專案要求

詢問使用者：
1. **專案名稱** (例如，「my-mcp-server」)
2. **伺服器描述** (例如，「一個天氣資料 MCP 伺服器」)
3. **傳輸類型** (stdio, sse, http, 或全部)
4. **要包含的工具** (例如，「天氣查詢」、「預報」、「警報」)
5. **是否包含提示和資源**

## 專案結構

產生此結構：

```
{project-name}/
├── Cargo.toml
├── .gitignore
├── README.md
├── src/
│   ├── main.rs
│   ├── handler.rs
│   ├── tools/
│   │   ├── mod.rs
│   │   └── {tool_name}.rs
│   ├── prompts/
│   │   ├── mod.rs
│   │   └── {prompt_name}.rs
│   ├── resources/
│   │   ├── mod.rs
│   │   └── {resource_name}.rs
│   └── state.rs
└── tests/
    └── integration_test.rs
```

## 檔案模板

### Cargo.toml

```toml
[package]
name = "{project-name}"
version = "0.1.0"
edition = "2021"

[dependencies]
rmcp = { version = "0.8.1", features = ["server"] }
rmcp-macros = "0.8"
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"
schemars = { version = "0.8", features = ["derive"] }
async-trait = "0.1"

# 可選: 用於 HTTP 傳輸
axum = { version = "0.7", optional = true }
tower-http = { version = "0.5", features = ["cors"], optional = true }

[dev-dependencies]
tokio-test = "0.4"

[features]
default = []
http = ["dep:axum", "dep:tower-http"]

[[bin]]
name = "{project-name}"
path = "src/main.rs"
```

### .gitignore

```gitignore
/target
Cargo.lock
*.swp
*.swo
*~
.DS_Store
```

### README.md

```markdown
# {專案名稱}

{伺服器描述}

## 安裝

```bash
cargo build --release
```

## 用法

### Stdio 傳輸

```bash
cargo run
```

### SSE 傳輸

```bash
cargo run --features http -- --transport sse
```

### HTTP 傳輸

```bash
cargo run --features http -- --transport http
```

## 配置

在您的 MCP 用戶端 (例如，Claude Desktop) 中配置：

```json
{
  "mcpServers": {
    "{project-name}": {
      "command": "path/to/target/release/{project-name}",
      "args": []
    }
  }
}
```

## 工具

- **{tool_name}**: {工具描述}

## 開發

執行測試：

```bash
cargo test
```

使用日誌記錄執行：

```bash
RUST_LOG=debug cargo run
```
```

### src/main.rs

```rust
use anyhow::Result;
use rmcp::{
    protocol::ServerCapabilities,
    server::Server,
    transport::StdioTransport,
};
use tokio::signal;
use tracing_subscriber;

mod handler;
mod state;
mod tools;
mod prompts;
mod resources;

use handler::McpHandler;

#[tokio::main]
async fn main() -> Result<()> {
    // 初始化追蹤
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();
    
    tracing::info!("正在啟動 {project-name} MCP 伺服器");
    
    // 建立處理器
    let handler = McpHandler::new();
    
    // 建立傳輸 (預設為 stdio)
    let transport = StdioTransport::new();
    
    // 使用功能建立伺服器
    let server = Server::builder()
        .with_handler(handler)
        .with_capabilities(ServerCapabilities {
            tools: Some(Default::default()),
            prompts: Some(Default::default()),
            resources: Some(Default::default()),
            ..Default::default()
        })
        .build(transport)?;
    
    tracing::info!("伺服器已啟動，等待請求");
    
    // 執行伺服器直到 Ctrl+C
    server.run(signal::ctrl_c()).await?;
    
    tracing::info!("伺服器正在關閉");
    Ok(())
}
```

### src/handler.rs

```rust
use rmcp::{
    model::*,
    protocol::*,
    server::{RequestContext, ServerHandler, RoleServer, ToolRouter},
    ErrorData,
};
use rmcp::{tool_router, tool_handler};
use async_trait::async_trait;

use crate::state::ServerState;
use crate::tools;

pub struct McpHandler {
    state: ServerState,
    tool_router: ToolRouter,
}

#[tool_router]
impl McpHandler {
    // 從工具模組中包含工具定義
    #[tool(
        name = "example_tool",
        description = "一個範例工具",
        annotations(read_only_hint = true)
    )]
    async fn example_tool(params: Parameters<tools::ExampleParams>) -> Result<String, String> {
        tools::example::execute(params).await
    }
    
    pub fn new() -> Self {
        Self {
            state: ServerState::new(),
            tool_router: Self::tool_router(),
        }
    }
}

#[tool_handler]
#[async_trait]
impl ServerHandler for McpHandler {
    async fn list_prompts(
        &self,
        _request: Option<PaginatedRequestParam>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListPromptsResult, ErrorData> {
        let prompts = vec![
            Prompt {
                name: "example-prompt".to_string(),
                description: Some("一個範例提示".to_string()),
                arguments: Some(vec![
                    PromptArgument {
                        name: "topic".to_string(),
                        description: Some("要討論的主題".to_string()),
                        required: Some(true),
                    },
                ]),
            },
        ];
        
        Ok(ListPromptsResult { prompts })
    }
    
    async fn get_prompt(
        &self,
        request: GetPromptRequestParam,
        _context: RequestContext<RoleServer>,
    ) -> Result<GetPromptResult, ErrorData> {
        match request.name.as_str() {
            "example-prompt" => {
                let topic = request.arguments
                    .as_ref()
                    .and_then(|args| args.get("topic"))
                    .ok_or_else(|| ErrorData::invalid_params("topic required"))?;
                
                Ok(GetPromptResult {
                    description: Some("範例提示".to_string()),
                    messages: vec![
                        PromptMessage::user(format!("讓我們討論: {}", topic)),
                    ],
                })
            }
            _ => Err(ErrorData::invalid_params("未知提示")),
        }
    }
    
    async fn list_resources(
        &self,
        _request: Option<PaginatedRequestParam>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListResourcesResult, ErrorData> {
        let resources = vec![
            Resource {
                uri: "example://data/info".to_string(),
                name: "範例資源".to_string(),
                description: Some("一個範例資源".to_string()),
                mime_type: Some("text/plain".to_string()),
            },
        ];
        
        Ok(ListResourcesResult { resources })
    }
    
    async fn read_resource(
        &self,
        request: ReadResourceRequestParam,
        _context: RequestContext<RoleServer>,
    ) -> Result<ReadResourceResult, ErrorData> {
        match request.uri.as_str() {
            "example://data/info" => {
                Ok(ReadResourceResult {
                    contents: vec![
                        ResourceContents::text("範例資源內容".to_string())
                            .with_uri(request.uri)
                            .with_mime_type("text/plain"),
                    ],
                })
            }
            _ => Err(ErrorData::invalid_params("未知資源")),
        }
    }
}
```

### src/state.rs

```rust
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct ServerState {
    // 在此新增共享狀態
    counter: Arc<RwLock<i32>>,
}

impl ServerState {
    pub fn new() -> Self {
        Self {
            counter: Arc::new(RwLock::new(0)),
        }
    }
    
    pub async fn increment(&self) -> i32 {
        let mut counter = self.counter.write().await;
        *counter += 1;
        *counter
    }
    
    pub async fn get(&self) -> i32 {
        *self.counter.read().await
    }
}
```

### src/tools/mod.rs

```rust
pub mod example;

pub use example::ExampleParams;
```

### src/tools/example.rs

```rust
use rmcp::model::Parameters;
use serde::{Deserialize, Serialize};
use schemars::JsonSchema;

#[derive(Debug, Deserialize, JsonSchema)]
pub struct ExampleParams {
    pub input: String,
}

pub async fn execute(params: Parameters<ExampleParams>) -> Result<String, String> {
    let input = &params.inner().input;
    
    // 工具邏輯在此
    Ok(format!("已處理: {}", input))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_example_tool() {
        let params = Parameters::new(ExampleParams {
            input: "test".to_string(),
        });
        
        let result = execute(params).await.unwrap();
        assert!(result.contains("test"));
    }
}
```

### src/prompts/mod.rs

```rust
// 如果需要，提示實作可以在這裡
```

### src/resources/mod.rs

```rust
// 如果需要，資源實作可以在這裡
```

### tests/integration_test.rs

```rust
use rmcp::{
    model::*,
    protocol::*,
    server::{RequestContext, ServerHandler, RoleServer},
};

// 將 snake_case 中的實際專案名稱替換掉
// 範例: 如果專案是 "my-mcp-server"，則使用 my_mcp_server
use my_mcp_server::handler::McpHandler;

#[tokio::test]
async fn test_list_tools() {
    let handler = McpHandler::new();
    let context = RequestContext::default();
    
    let result = handler.list_tools(None, context).await.unwrap();
    
    assert!(!result.tools.is_empty());
    assert!(result.tools.iter().any(|t| t.name == "example_tool"));
}

#[tokio::test]
async fn test_call_tool() {
    let handler = McpHandler::new();
    let context = RequestContext::default();
    
    let request = CallToolRequestParam {
        name: "example_tool".to_string(),
        arguments: Some(serde_json::json!({n            "input": "test"
        })),
    };
    
    let result = handler.call_tool(request, context).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_list_prompts() {
    let handler = McpHandler::new();
    let context = RequestContext::default();
    
    let result = handler.list_prompts(None, context).await.unwrap();
    assert!(!result.prompts.is_empty());
}

#[tokio::test]
async fn test_list_resources() {
    let handler = McpHandler::new();
    let context = RequestContext::default();
    
    let result = handler.list_resources(None, context).await.unwrap();
    assert!(!result.resources.is_empty());
}
```

## 實作指南

1. **使用 rmcp-macros**：利用 `#[tool]`、`#[tool_router]` 和 `#[tool_handler]` 巨集來編寫更簡潔的程式碼
2. **類型安全**：所有參數類型都使用 `schemars::JsonSchema`
3. **錯誤處理**：回傳帶有適當錯誤訊息的 `Result` 類型
4. **非同步/等待**：所有處理器都必須是非同步的
5. **狀態管理**：使用 `Arc<RwLock<T>>` 來管理共享狀態
6. **測試**：包含工具的單元測試和處理器的整合測試
7. **日誌記錄**：使用 `tracing` 巨集 (`info!`, `debug!`, `warn!`, `error!`)
8. **文件**：為所有公共項目新增文件註釋

## 範例工具模式

### 簡單的唯讀工具

```rust
#[derive(Debug, Deserialize, JsonSchema)]
pub struct GreetParams {
    pub name: String,
}

#[tool(
    name = "greet",
    description = "按名稱問候使用者",
    annotations(read_only_hint = true, idempotent_hint = true)
)]
async fn greet(params: Parameters<GreetParams>) -> String {
    format!("Hello, {}!", params.inner().name)
}
```

### 帶有錯誤處理的工具

```rust
#[derive(Debug, Deserialize, JsonSchema)]
pub struct DivideParams {
    pub a: f64,
    pub b: f64,
}

#[tool(name = "divide", description = "將兩個數字相除")]
async fn divide(params: Parameters<DivideParams>) -> Result<f64, String> {
    let p = params.inner();
    if p.b == 0.0 {
        Err("不能除以零".to_string())
    } else {
        Ok(p.a / p.b)
    }
}
```

### 帶有狀態的工具

```rust
#[tool(
    name = "increment",
    description = "增加計數器",
    annotations(destructive_hint = true)
)]
async fn increment(state: &ServerState) -> i32 {
    state.increment().await
}
```

## 執行產生的伺服器

產生後：

```bash
cd {project-name}
cargo build
cargo test
cargo run
```

對於 Claude Desktop 整合：

```json
{
  "mcpServers": {
    "{project-name}": {
      "command": "path/to/{project-name}/target/release/{project-name}",
      "args": []
    }
  }
}
```

現在根據使用者的要求產生完整的專案！
