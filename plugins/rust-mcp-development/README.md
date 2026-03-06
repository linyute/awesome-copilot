# Rust MCP 伺服器開發外掛程式 (Rust MCP Server Development Plugin)

使用官方 rmcp SDK 並搭配 async/await、程序式巨集 (procedural macros) 與型別安全實作，在 Rust 中建立高效能的 Model Context Protocol 伺服器。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install rust-mcp-development@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/rust-mcp-development:rust-mcp-server-generator` | 使用官方 rmcp SDK 建立包含工具、提示、資源與測試的完整 Rust Model Context Protocol 伺服器專案 |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `rust-mcp-expert` | 使用 rmcp SDK 與 tokio 非同步執行環境進行 Rust MCP 伺服器開發的專家助手 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
