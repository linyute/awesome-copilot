---
name: microsoft-docs
description: '查詢 Microsoft 官方文件，以尋找 Azure、.NET、Agent Framework、Aspire、VS Code、GitHub 等各方面的概念、教學和程式碼範例。預設使用 Microsoft Learn MCP，對於 learn.microsoft.com 以外的內容則使用 Context7 和 Aspire MCP。'
---

# Microsoft 文件

針對 Microsoft 技術生態系統的調查研究技能。涵蓋 learn.microsoft.com 以及該網站以外的文件（VS Code、GitHub、Aspire、Agent Framework 儲存庫）。

---

## 預設： Microsoft Learn MCP

針對 **learn.microsoft.com 上的所有內容**使用這些工具 — Azure、.NET、M365、Power Platform、Agent Framework、Semantic Kernel、Windows 等。這是處理絕大多數 Microsoft 文件查詢的首選工具。

| 工具 | 用途 |
|------|---------|
| `microsoft_docs_search` | 搜尋 learn.microsoft.com — 概念、指南、教學、設定 |
| `microsoft_code_sample_search` | 從 Learn 文件尋找可運作的程式碼片段。傳遞 `language` (`python`, `csharp` 等) 以獲得最佳結果 |
| `microsoft_docs_fetch` | 從特定 URL 取得完整的頁面內容（當搜尋摘要不足時使用） |

當搜尋摘要不足時，或需要完整教學、所有設定選項或摘要被截斷時，請在搜尋後使用 `microsoft_docs_fetch`。

---

## 例外情況：何時使用其他工具

下列類別位於 learn.microsoft.com **之外**。請改用指定的工具。

### .NET Aspire — 使用 Aspire MCP 伺服器 (偏好) 或 Context7

Aspire 文件位於 **aspire.dev**，而非 Learn。最佳工具取決於您的 Aspire CLI 版本：

**CLI 13.2+** (建議) — Aspire MCP 伺服器包含內建的文件搜尋工具：

| MCP 工具 | 描述 |
|----------|-------------|
| `list_docs` | 列出來自 aspire.dev 的所有可用文件 |
| `search_docs` | 在 aspire.dev 內容中進行加權詞彙搜尋 |
| `get_doc` | 透過代稱 (slug) 擷取特定文件 |

這些功能隨 Aspire CLI 13.2 一起發佈 ([PR #14028](https://github.com/dotnet/aspire/pull/14028))。若要更新： `aspire update --self --channel daily`。參考： https://davidpine.dev/posts/aspire-docs-mcp-tools/

**CLI 13.1** — MCP 伺服器提供整合查詢 (`list_integrations`, `get_integration_docs`) 但「不包含」文件搜尋。請改用 Context7：

| 函式庫 ID | 用於 |
|---|---|
| `/microsoft/aspire.dev` | 主要 — 指南、整合、CLI 參考、部署 |
| `/dotnet/aspire` | 執行階段原始碼 — API 內部、實作細節 |
| `/communitytoolkit/aspire` | 社群整合 — Go, Java, Node.js, Ollama |

### VS Code — 使用 Context7

VS Code 文件位於 **code.visualstudio.com**，而非 Learn。

| 函式庫 ID | 用於 |
|---|---|
| `/websites/code_visualstudio` | 使用者文件 — 設定、功能、偵錯、遠端開發 |
| `/websites/code_visualstudio_api` | 延伸模組 API — Webview、TreeView、指令、貢獻點 (contribution points) |

### GitHub — 使用 Context7

GitHub 文件位於 **docs.github.com** 和 **cli.github.com**。

| 函式庫 ID | 用於 |
|---|---|
| `/websites/github_en` | Actions, API, 儲存庫, 安全, 管理, Copilot |
| `/websites/cli_github` | GitHub CLI (`gh`) 指令與旗標 |

### Agent Framework — 使用 Learn MCP + Context7

Agent Framework 教學位於 learn.microsoft.com（使用 `microsoft_docs_search`），但 **GitHub 儲存庫**具備通常領先於已發佈文件的 API 等級詳情 — 特別是 DevUI REST API 參考、CLI 選項以及 .NET 整合。

| 函式庫 ID | 用於 |
|---|---|
| `/websites/learn_microsoft_en-us_agent-framework` | 教學 — DevUI 指南、追蹤、工作流程編排 |
| `/microsoft/agent-framework` | API 詳情 — DevUI REST 端點、CLI 旗標、驗證、.NET `AddDevUI`/`MapDevUI` |

**DevUI 提示：** 查詢 Learn 網站來源以取得操作指南，然後查詢儲存庫來源以取得 API 等級的細節（端點架構、代理設定、身分驗證權杖）。

---

## Context7 設定

對於任何 Context7 查詢，請先解析函式庫 ID（每個工作階段一次）：

1. 呼叫 `mcp_context7_resolve-library-id` 並帶入技術名稱
2. 使用傳回的函式庫 ID 和特定查詢呼叫 `mcp_context7_query-docs`

---

## 撰寫有效的查詢

請具體說明 — 包含版本、意圖和語言：

```
# ❌ 太過廣泛
"Azure Functions"
"agent framework"

# ✅ 具體說明
"Azure Functions Python v2 程式設計模型"
"Cosmos DB 分割區索引鍵設計最佳實作"
"GitHub Actions workflow_dispatch 輸入矩陣策略"
"Aspire AddUvicornApp Python FastAPI 整合"
"DevUI serve 代理追蹤 OpenTelemetry 目錄探索"
"Agent Framework 工作流程條件式邊緣分支轉交"
```

包含內容：
- 相關時請標註**版本**（`.NET 8`, `Aspire 13`, `VS Code 1.96`）
- **任務意圖**（`快速入門`, `教學`, `概觀`, `限制`, `API 參考`）
- 針對多語言文件的**語言**（`Python`, `TypeScript`, `C#`）
