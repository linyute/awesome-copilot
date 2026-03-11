# 模組 6：MCP 整合 (Module 6: MCP Integration)

## 什麼是 MCP？ (What is MCP?)

- 模型上下文協定 (Model Context Protocol) — 一種將 AI 連接至外部工具的標準
- 將其視為「AI 的 USB 連接埠」 — 插入任何相容的工具
- GitHub MCP 伺服器是**內建的**（搜尋存放庫、議題 (Issues)、PR、Actions）

## 關鍵指令 (Key commands)

| 指令 | 它的作用 |
|---------|-------------|
| `/mcp` | 列出已連線的 MCP 伺服器 |
| `/mcp add <name> <command>` | 加入新的 MCP 伺服器 |

## 熱門 MCP 伺服器 (Popular MCP servers)

- `@modelcontextprotocol/server-postgres` — 查詢 PostgreSQL 資料庫
- `@modelcontextprotocol/server-sqlite` — 查詢 SQLite 資料庫
- `@modelcontextprotocol/server-filesystem` — 具備權限地存取本地檔案
- `@modelcontextprotocol/server-memory` — 持久性知識圖譜
- `@modelcontextprotocol/server-puppeteer` — 瀏覽器自動化

## 設定 (Configuration)

| 層級 | 檔案 |
|-------|------|
| 使用者 | `~/.copilot/mcp-config.json` |
| 專案 | `.github/mcp-config.json` |

## 設定檔格式 (Config file format)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "{{env.DATABASE_URL}}"],
      "env": { "NODE_ENV": "development" }
    }
  }
}
```

## 安全性最佳實踐 (Security best practices)

- 絕不要將憑證直接放入設定檔中
- 使用環境變數參考：`{{env.SECRET}}`
- 在使用前檢閱 MCP 伺服器原始碼
- 僅連接您實際需要的伺服器
