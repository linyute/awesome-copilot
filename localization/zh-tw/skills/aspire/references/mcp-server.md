# MCP 伺服器 — 完整的參考資料

Aspire 公開了一個 **MCP (模型內容通訊協定) 伺服器**，讓 AI 程式碼撰寫助理能夠查詢並控制您執行中的分散式應用程式，並搜尋 Aspire 文件。這使 AI 工具能夠在 AI 助理的內容中檢查資源狀態、讀取記錄、檢視追蹤、重新啟動服務以及查閱文件。

參考資料：https://aspire.dev/get-started/configure-mcp/

---

## 設定：`aspire mcp init`

設定 MCP 伺服器最簡單的方法是使用 Aspire CLI：

```bash
# 在您的專案目錄中開啟終端機
aspire mcp init
```

此命令將引導您完成互動式設定：

1. **工作區根目錄** — 提示輸入工作區根目錄的路徑 (預設為目前目錄)
2. **環境偵測** — 偵測支援的 AI 環境 (VS Code、Copilot CLI、Claude Code、OpenCode) 並詢問要設定哪一個
3. **Playwright MCP** — 選擇性地提供與 Aspire 一起設定 Playwright MCP 伺服器
4. **組態建立** — 寫入適當的組態檔案 (例如 `.vscode/mcp.json`)
5. **AGENTS.md** — 如果尚不存在，則建立一個 `AGENTS.md`，其中包含針對 AI 代理程式的 Aspire 特定指令

> **注意：** `aspire mcp init` 使用互動式提示 (Spectre.Console)。它必須在真正的終端機中執行 — VS Code 整合式終端機可能無法正確處理提示。如果需要，請使用外部終端機。

---

## 瞭解組態

當您執行 `aspire mcp init` 時，CLI 會針對偵測到的環境建立適當的組態檔案。

### VS Code (GitHub Copilot)

建立或更新 `.vscode/mcp.json`：

```json
{
  "servers": {
    "aspire": {
      "type": "stdio",
      "command": "aspire",
      "args": ["mcp", "start"]
    }
  }
}
```

## MCP 工具

可用的工具取決於您的 Aspire CLI 版本。請使用 `aspire --version` 檢查。

### 13.1+ (穩定版) 中可用的工具

#### 資源管理工具

這些工具需要正在執行的 AppHost (`aspire run`)。

| 工具 | 說明 |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `list_resources` | 列出所有資源，包括狀態、健康狀況、來源、端點和命令 |
| `list_console_logs` | 列出資源的主控台記錄 |
| `list_structured_logs` | 列出結構化記錄，可選擇依資源名稱篩選 |
| `list_traces` | 列出分散式追蹤。可使用選用的資源名稱參數篩選追蹤 |
| `list_trace_structured_logs` | 列出特定追蹤的結構化記錄 |
| `execute_resource_command` | 執行資源命令 (接受資源名稱和命令名稱) |

#### AppHost 管理工具

| 工具 | 說明 |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `list_apphosts` | 列出所有偵測到的 AppHost 連線，顯示哪些在/不在工作目錄範圍內 |
| `select_apphost` | 當有多個 AppHost 正在執行時，選擇要使用的 AppHost |

#### 整合工具

這些工具不需要正在執行的 AppHost。

| 工具 | 說明 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `list_integrations` | 列出可用的 Aspire 裝載整合 (用於資料庫、訊息代理程式、雲端服務等的 NuGet 套件) |
| `get_integration_docs` | 取得特定 Aspire 裝載整合套件的文件 |

### 13.2+ 中新增的工具 (文件搜尋)

> **版本門控：** 這些工具是在 [PR #14028](https://github.com/dotnet/aspire/pull/14028) 中新增的，並隨 Aspire CLI **13.2** 出貨。如果您使用的是 13.1，這些工具將不會出現。若要提早取得，請更新至每日通道：`aspire update --self --channel daily`。

| 工具 | 說明 |
| ------------- | ------------------------------------------------------------------------ |
| `list_docs` | 列出來自 aspire.dev 的所有可用文件 |
| `search_docs` | 在索引的 aspire.dev 文件中執行加權詞法搜尋 |
| `get_doc` | 透過別名 (slug) 擷取特定文件 |

這些工具使用 `llms.txt` 規格對 aspire.dev 內容進行索引，並提供加權詞彙搜尋 (標題 10 倍、摘要 8 倍、標題 6 倍、程式碼 5 倍、本文 1 倍)。這些工具不需要執行 AppHost 即可運作。

### 文件的備用方案 (13.1 使用者)

如果您使用的是 Aspire CLI 13.1 且沒有 `list_docs`/`search_docs`/`get_doc`，請使用 **Context7** 作為文件查詢的備用方案。詳細資訊請參閱 [SKILL.md 文件研究章節](../SKILL.md#1-搜尋-aspire-文件)。

---

## 從 MCP 中排除資源

可以透過加註 (annotating) 資源，將資源及其相關遙測從 MCP 結果中排除：

```csharp
var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.Api>("apiservice")
    .ExcludeFromMcp();  // 對 MCP 工具隱藏

builder.AddProject<Projects.Web>("webfrontend")
    .WithExternalHttpEndpoints()
    .WithReference(apiService);

builder.Build().Run();
```

---

## 支援的 AI 助理

`aspire mcp init` 命令支援：

- [VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) (GitHub Copilot)
- [Copilot CLI](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli#add-an-mcp-server)
- [Claude Code](https://docs.claude.com/en/docs/claude-code/mcp)
- [OpenCode](https://opencode.ai/docs/mcp-servers/)

MCP 伺服器使用 **STDIO 傳輸通訊協定**，並且可以與支援此通訊協定的其他具代理能力的程式碼撰寫環境搭配使用。

---

## 用法模式

### AI 輔助偵錯

一旦設定好 MCP，您的 AI 助理就可以：

1. **檢查執行狀態：**

   - 「列出我所有的 Aspire 資源及其狀態」
   - 「資料庫健康嗎？」
   - 「API 在哪個連接埠上執行？」

2. **讀取記錄：**

   - 「顯示來自 ML 服務的最新記錄」
   - 「工作者記錄中有任何錯誤嗎？」

3. **檢視追蹤：**

   - 「顯示最後一個失敗要求的追蹤」
   - 「API → 資料庫呼叫的延遲是多少？」

4. **控制資源：**

   - 「重新啟動 API 服務」
   - 「在我偵錯佇列時停止工作者」

5. **搜尋文件 (13.2+)：**
   - 「在 Aspire 文件中搜尋 Redis 快取」
   - 「我該如何設定服務探索？」
   - _(需要 CLI 13.2+。在 13.1 上，請針對特定整合文件使用 Context7 或 `list_integrations`/`get_integration_docs`。)_

---

## 安全性考量

- MCP 伺服器僅公開來自本地 AppHost 的資源
- 不需要驗證 (僅限本地開發)
- STDIO 傳輸僅適用於繁衍該程序的 AI 工具
- **不要在生產環境中將 MCP 端點公開給網路**

---

## 限制

- AI 模型在資料處理方面有限制。大型資料欄位 (例如堆疊追蹤) 可能會被截斷。
- 涉及大型遙測集合的要求可能會因省略較舊項目而縮短。

---

## 疑難排解

如果您遇到問題，請查看 [GitHub 上的開放 MCP 問題](https://github.com/dotnet/aspire/issues?q=is%3Aissue+is%3Aopen+label%3Aarea-mcp)。

## 另請參閱

- [aspire mcp 命令](https://aspire.dev/reference/cli/commands/aspire-mcp/)
- [aspire mcp init 命令](https://aspire.dev/reference/cli/commands/aspire-mcp-init/)
- [aspire mcp start 命令](https://aspire.dev/reference/cli/commands/aspire-mcp-start/)
- [儀表板中的 GitHub Copilot](https://aspire.dev/dashboard/copilot/)
- [我如何教會 AI 閱讀 Aspire 文件](https://davidpine.dev/posts/aspire-docs-mcp-tools/)
