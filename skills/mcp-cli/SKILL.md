---
name: mcp-cli
description: 透過命令列介面（CLI）與 MCP (Model Context Protocol) 伺服器互動。當你需要透過 MCP 伺服器與外部工具、API 或資料源進行互動，列出可用的 MCP 伺服器/工具，或從命令列呼叫 MCP 工具時使用。
---

# MCP-CLI

透過命令列存取 MCP 伺服器。MCP 可以與 GitHub、檔案系統、資料庫和 API 等外部系統進行互動。

## 命令

| 命令                               | 輸出                            |
| ---------------------------------- | ------------------------------- |
| `mcp-cli`                          | 列出所有伺服器和工具名稱        |
| `mcp-cli <server>`                 | 顯示帶有參數的工具              |
| `mcp-cli <server>/<tool>`          | 獲取工具的 JSON 結構圖 (schema) |
| `mcp-cli <server>/<tool> '<json>'` | 使用引數呼叫工具                |
| `mcp-cli grep "<glob>"`            | 按名稱搜尋工具                  |

**加入 `-d` 以包含描述**（例如：`mcp-cli filesystem -d`）

## 工作流

1. **發現 (Discover)**：`mcp-cli` → 查看可用的伺服器和工具
2. **探索 (Explore)**：`mcp-cli <server>` → 查看帶有參數的工具
3. **檢查 (Inspect)**：`mcp-cli <server>/<tool>` → 獲取完整的 JSON 輸入結構圖 (schema)
4. **執行 (Execute)**：`mcp-cli <server>/<tool> '<json>'` → 使用引數執行

## 範例

```bash
# 列出所有伺服器和工具名稱
mcp-cli

# 查看帶有參數的工具
mcp-cli filesystem

# 包含描述（更詳細）
mcp-cli filesystem -d

# 獲取特定工具的 JSON 結構圖 (schema)
mcp-cli filesystem/read_file

# 呼叫工具
mcp-cli filesystem/read_file '{"path": "./README.md"}'

# 搜尋工具
mcp-cli grep "*file*"

# 用於指令碼編寫的 JSON 輸出
mcp-cli filesystem/read_file '{"path": "./README.md"}' --json

# 帶有引號的複雜 JSON（使用 heredoc 或 stdin）
mcp-cli server/tool <<EOF
{"content": "Text with 'quotes' inside"}
EOF

# 或從檔案/命令透過管線傳送
cat args.json | mcp-cli server/tool

# 尋找所有 TypeScript 檔案並讀取第一個
mcp-cli filesystem/search_files '{"path": "src/", "pattern": "*.ts"}' --json | jq -r '.content[0].text' | head -1 | xargs -I {} sh -c 'mcp-cli filesystem/read_file "{ \"path\": \"{}\" }"'
```

## 選項

| 旗標         | 用途                        |
| ------------ | -------------------------- |
| `-j, --json` | 用於指令碼編寫的 JSON 輸出    |
| `-r, --raw`  | 原始文字內容                 |
| `-d`         | 包含描述                    |

## 結束代碼 (Exit Codes)

- `0`：成功
- `1`：用戶端錯誤（引數錯誤、缺少設定）
- `2`：伺服器錯誤（工具失敗）
- `3`：網路錯誤
