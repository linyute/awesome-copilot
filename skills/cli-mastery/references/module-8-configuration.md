# 模組 8：設定 (Module 8: Configuration)

## 關鍵檔案 (Key files)

| 檔案 | 用途 |
|------|---------|
| `~/.copilot/config.json` | 主要設定 (模型、佈景主題、記錄、實驗性旗標) |
| `~/.copilot/mcp-config.json` | MCP 伺服器 |
| `~/.copilot/lsp-config.json` | 語言伺服器 (使用者層級) |
| `.github/lsp.json` | 語言伺服器 (存放庫層級) |
| `~/.copilot/copilot-instructions.md` | 全域自訂指令 |
| `.github/copilot-instructions.md` | 存放庫層級自訂指令 |

## 環境變數 (Environment variables)

| 變數 | 用途 |
|----------|---------|
| `EDITOR` | 用於 `Ctrl+G` 的文字編輯器 (在外部編輯器中編輯提示) |
| `COPILOT_LOG_LEVEL` | 記錄詳細程度 (error/warn/info/debug/trace) |
| `GH_TOKEN` / `GITHUB_TOKEN` | GitHub 驗證權杖 (按順序檢查) |
| `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` | 自訂指令的其他目錄 |

## 權限模型 (Permissions model)

- 預設：編輯、建立、Shell 指令需要確認
- `/allow-all` 或 `--yolo`：略過該工作階段的所有確認
- `/reset-allowed-tools`：重新啟用確認
- 目錄允許清單、工具核准門檻、MCP 伺服器信任

## 記錄層級 (Logging levels)

error, warn, info, debug, trace (`COPILOT_LOG_LEVEL=debug copilot`)

在以下情況使用 debug/trace：MCP 連線問題、工具失敗、非預期行為、錯誤報告
