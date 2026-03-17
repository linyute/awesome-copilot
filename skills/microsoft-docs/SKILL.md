---
name: microsoft-docs
description: '查詢 Microsoft 官方文件，以尋找 Azure、.NET、代理程式框架 (Agent Framework)、Aspire、VS Code、GitHub 等領域的概念、教學課程和程式碼範例。預設使用 Microsoft Learn MCP，對於 learn.microsoft.com 之外的內容則使用 Context7 和 Aspire MCP。'
---

# Microsoft 文件 (Microsoft Docs)

針對 Microsoft 技術生態系統的研究技能。涵蓋 learn.microsoft.com 以及在其之外的文件 (VS Code、GitHub、Aspire、代理程式框架儲存庫)。

---

## 預設：Microsoft Learn MCP

針對 **learn.microsoft.com 上的所有內容**使用這些工具 — Azure、.NET、M365、Power Platform、代理程式框架、Semantic Kernel、Windows 等。這是處理絕大多數 Microsoft 文件查詢的主要工具。

| 工具 | 目的 |
|------|---------|
| `microsoft_docs_search` | 搜尋 learn.microsoft.com — 概念、指南、教學課程、設定 |
| `microsoft_code_sample_search` | 從 Learn 文件中尋找可執行的程式碼片段。傳遞 `language` (`python`、`csharp` 等) 以獲得最佳結果 |
| `microsoft_docs_fetch` | 從特定 URL 獲取完整頁面內容 (當搜尋摘錄不足時) |

當您需要完整的教學課程、所有設定選項或搜尋摘錄被截斷時，請在搜尋後使用 `microsoft_docs_fetch`。

### CLI 替代方案

如果 Learn MCP 伺服器不可用，請改用終端機或 shell (例如 Bash、PowerShell 或 cmd) 中的 `mslearn` CLI：

```bash
# 直接執行 (無需安裝)
npx @microsoft/learn-cli search "BlobClient UploadAsync Azure.Storage.Blobs"

# 或全域安裝後執行
npm install -g @microsoft/learn-cli
mslearn search "BlobClient UploadAsync Azure.Storage.Blobs"
```

| MCP 工具 | CLI 命令 |
|----------|-------------|
| `microsoft_docs_search(query: "...")` | `mslearn search "..."` |
| `microsoft_code_sample_search(query: "...", language: "...")` | `mslearn code-search "..." --language ...` |
| `microsoft_docs_fetch(url: "...")` | `mslearn fetch "..."` |

對 `search` 或 `code-search` 傳遞 `--json` 以獲取原始 JSON 輸出供進一步處理。

---

## 例外情況：何時使用其他工具

以下類別位於 learn.microsoft.com **之外**。請改用指定的工具。

### .NET Aspire — 使用 Aspire MCP 伺服器 (偏好) 或 Context7

Aspire 文件位於 **aspire.dev**，而非 Learn。最佳工具取決於您的 Aspire CLI 版本：

**CLI 13.2+** (建議) — Aspire MCP 伺服器包含內建的文件搜尋工具：

| MCP 工具 | 說明 |
|----------|-------------|
| `list_docs` | 列出來自 aspire.dev 的所有可用文件 |
| `search_docs` | 對 aspire.dev 內容進行加權語彙搜尋 |
| `get_doc` | 透過代稱 (slug) 擷取特定文件 |

這些隨 Aspire CLI 13.2 一起發布 ([PR #14028](https://github.com/dotnet/aspire/pull/14028))。更新方式：`aspire update --self --channel daily`。參考：https://davidpine.dev/posts/aspire-docs-mcp-tools/

**CLI 13.1** — MCP 伺服器提供整合查詢 (`list_integrations`, `get_integration_docs`) 但**不提供**文件搜尋。請退而求其次使用 Context7：

| 函式庫 ID | 用途 |
|---|---|
| `/microsoft/aspire.dev` | 主要 — 指南、整合、CLI 參考、部署 |
| `/dotnet/aspire` | 執行階段原始碼 — API 內部細節、實作細節 |
| `/communitytoolkit/aspire` | 社群整合 — Go、Java、Node.js、Ollama |

### VS Code — 使用 Context7

VS Code 文件位於 **code.visualstudio.com**，而非 Learn。

| 函式庫 ID | 用途 |
|---|---|
| `/websites/code_visualstudio` | 使用者文件 — 設定、功能、除錯、遠端開發 |
| `/websites/code_visualstudio_api` | 延伸模組 API — webviews、TreeViews、命令、貢獻點 (contribution points) |

### GitHub — 使用 Context7

GitHub 文件位於 **docs.github.com** 和 **cli.github.com**。

| 函式庫 ID | 用途 |
|---|---|
| `/websites/github_en` | Actions、API、儲存庫、安全性、管理、Copilot |
| `/websites/cli_github` | GitHub CLI (`gh`) 命令和旗標 |

### 代理程式框架 — 使用 Learn MCP + Context7

代理程式框架教學課程位於 learn.microsoft.com (使用 `microsoft_docs_search`)，但 **GitHub 儲存庫** 擁有通常領先於已發布文件的 API 層級細節 — 尤其是 DevUI REST API 參考、CLI 選項和 .NET 整合。

| 函式庫 ID | 用途 |
|---|---|
| `/websites/learn_microsoft_en-us_agent-framework` | 教學課程 — DevUI 指南、追蹤、工作流編排 |
| `/microsoft/agent-framework` | API 細節 — DevUI REST 端點、CLI 旗標、驗證、.NET `AddDevUI`/`MapDevUI` |

**DevUI 小提示：** 查詢 Learn 網站原始碼以獲取操作指南，然後查詢儲存庫原始碼以獲取 API 層級的特定細節 (端點結構、代理伺服器設定、驗證權杖)。

---

## Context7 設定

對於任何 Context7 查詢，請先解析函式庫 ID (每個工作階段一次)：

1. 使用技術名稱呼叫 `mcp_context7_resolve-library-id`
2. 使用傳回的函式庫 ID 和特定查詢呼叫 `mcp_context7_query-docs`

---

## 編寫有效的查詢

務必具體 — 包含版本、意圖和語言：

```
# ❌ 太廣泛
"Azure Functions"
"代理程式框架"

# ✅ 具體
"Azure Functions Python v2 程式設計模型"
"Cosmos DB 資料分割索引鍵設計最佳實務"
"GitHub Actions workflow_dispatch 輸入矩陣策略"
"Aspire AddUvicornApp Python FastAPI 整合"
"DevUI serve 代理程式追蹤 OpenTelemetry 目錄探索"
"代理程式框架工作流條件邊緣分支交接"
```

包含上下文：
- 相關時包含**版本** (`.NET 8`、`Aspire 13`、`VS Code 1.96`)
- **任務意圖** (`快速入門`、`教學課程`、`概觀`、`限制`、`API 參考`)
- 多語言文件的**語言** (`Python`、`TypeScript`、`C#`)
