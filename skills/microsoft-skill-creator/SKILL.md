---
name: microsoft-skill-creator
description: 使用 Learn MCP 工具為 Microsoft 技術建立代理程式技能。當使用者想要建立一個技能來教導代理程式關於任何 Microsoft 技術、函式庫、框架或服務 (Azure, .NET, M365, VS Code, Bicep 等) 時，請使用此技能。深入調查主題，然後產生一個混合技能，在本地儲存核心知識，同時支援動態的深入調查。
context: fork
compatibility: 與 Microsoft Learn MCP 伺服器 (https://learn.microsoft.com/api/mcp) 搭配使用效果最佳。也可以使用 mslearn CLI 作為備案。
---

# Microsoft 技能建立者 (Microsoft Skill Creator)

為 Microsoft 技術建立混合技能 (hybrid skill)，在本地儲存核心知識，同時支援動態的 Learn MCP 查詢以獲取更深層的細節。

## 關於技能

技能是模組化套件，透過專業知識和工作流擴展代理程式的能力。技能將通用代理程式轉換為特定領域的專業代理程式。

### 技能結構

```
技能名稱/
├── SKILL.md (必要)         # Frontmatter (名稱、說明) + 指令
├── references/             # 視需要載入上下文的文件
├── sample_codes/           # 可執行的程式碼範例
└── assets/                 # 輸出中使用的檔案 (範本等)
```

### 關鍵原則

- **Frontmatter 至關重要**：`name` 和 `description` 決定技能何時觸發 — 務必清晰且全面
- **簡潔是關鍵**：僅包含代理程式尚未了解的內容；內容視窗是共享的
- **不重複**：資訊應儲存在 SKILL.md 或參考檔案中，而非兩者皆有

## Learn MCP 工具

| 工具 | 目的 | 何時使用 |
|------|---------|-------------|
| `microsoft_docs_search` | 搜尋官方文件 | 第一階段探索，尋找主題 |
| `microsoft_docs_fetch` | 獲取完整頁面內容 | 深入研究重要頁面 |
| `microsoft_code_sample_search` | 尋找程式碼範例 | 獲取實作模式 |

### CLI 替代方案

如果 Learn MCP 伺服器不可用，請改用終端機或 shell (例如 Bash、PowerShell 或 cmd) 中的 `mslearn` CLI：

```bash
# 直接執行 (無需安裝)
npx @microsoft/learn-cli search "semantic kernel overview"

# 或全域安裝後執行
npm install -g @microsoft/learn-cli
mslearn search "semantic kernel overview"
```

| MCP 工具 | CLI 命令 |
|----------|-------------|
| `microsoft_docs_search(query: "...")` | `mslearn search "..."` |
| `microsoft_code_sample_search(query: "...", language: "...")` | `mslearn code-search "..." --language ...` |
| `microsoft_docs_fetch(url: "...")` | `mslearn fetch "..."` |

產生的技能應包含此相同的 CLI 備案表，以便代理程式可以使用任一路徑。

## 建立流程

### 步驟 1：調查主題

使用 Learn MCP 工具分三個階段建立深入理解：

**第 1 階段 - 範圍探索：**
```
microsoft_docs_search(query="{技術} overview what is")
microsoft_docs_search(query="{技術} concepts architecture")
microsoft_docs_search(query="{技術} getting started tutorial")
```

**第 2 階段 - 核心內容：**
```
microsoft_docs_fetch(url="...")  # 獲取第 1 階段中的頁面
microsoft_code_sample_search(query="{技術}", language="{語言}")
```

**第 3 階段 - 深度：**
```
microsoft_docs_search(query="{技術} best practices")
microsoft_docs_search(query="{技術} troubleshooting errors")
```

#### 調查檢查表

調查後，驗證：
- [ ] 能用一個段落說明該技術的功能
- [ ] 識別了 3-5 個核心概念
- [ ] 擁有基礎用法的可執行程式碼
- [ ] 了解最常見的 API 模式
- [ ] 擁有用於更深層主題的搜尋查詢

### 步驟 2：與使用者確認

展示發現並詢問：
1. 「我發現了這些關鍵領域：[清單]。哪些最重要？」
2. 「代理程式主要將使用此技能執行哪些任務？」
3. 「程式碼範例應優先使用哪種程式設計語言？」

### 步驟 3：產生技能

從 [skill-templates.md](references/skill-templates.md) 中選擇合適的範本：

| 技術類型 | 範本 |
|-----------------|----------|
| 用戶端函式庫、NuGet/npm 套件 | SDK/函式庫 |
| Azure 資源 | Azure 服務 |
| 應用程式開發框架 | 框架/平台 |
| REST API、協定 | API/協定 |

#### 產生的技能結構

```
{技能名稱}/
├── SKILL.md                    # 核心知識 + Learn MCP 指南
├── references/                 # 詳細的本地文件 (如果需要)
└── sample_codes/               # 可執行的程式碼範例
    ├── getting-started/
    └── common-patterns/
```

### 步驟 4：平衡本地與動態內容

**在以下情況本地儲存：**
- 基礎性 (任何任務都需要)
- 頻繁存取
- 穩定 (不會變動)
- 難以透過搜尋找到

**在以下情況保持動態：**
- 詳盡的參考資料 (體積太大)
- 版本特定
- 情境性 (僅限特定任務)
- 索引良好 (易於搜尋)

#### 內容指南

| 內容類型 | 本地 | 動態 |
|--------------|-------|---------|
| 核心概念 (3-5) | ✅ 完整 | |
| Hello world 程式碼 | ✅ 完整 | |
| 常見模式 (3-5) | ✅ 完整 | |
| 熱門 API 方法 | 簽章 + 範例 | 透過 fetch 獲取完整文件 |
| 最佳實務 | 前 5 個重點 | 搜尋更多 |
| 疑難排解 | | 搜尋查詢 |
| 完整 API 參考 | | 文件連結 |

### 步驟 5：驗證

1. 檢閱：本地內容是否足以應對常見任務？
2. 測試：建議的搜尋查詢是否傳回有用的結果？
3. 驗證：程式碼範例是否能無誤執行？

## 常見調查模式

### 針對 SDK/函式庫
```
"{名稱} overview" → 目的、架構
"{名稱} getting started quickstart" → 設定步驟
"{名稱} API reference" → 核心類別/方法
"{名稱} samples examples" → 程式碼模式
"{名稱} best practices performance" → 最佳化
```

### 針對 Azure 服務
```
"{服務} overview features" → 功能
"{服務} quickstart {語言}" → 設定程式碼
"{服務} REST API reference" → 端點
"{服務} SDK {語言}" → 用戶端函式庫
"{服務} pricing limits quotas" → 限制
```

### 針對框架/平台
```
"{框架} architecture concepts" → 心智模型
"{框架} project structure" → 慣例
"{框架} tutorial walkthrough" → 端對端流程
"{框架} configuration options" → 自訂
```

## 範例：建立「Semantic Kernel」技能

### 調查

```
microsoft_docs_search(query="semantic kernel overview")
microsoft_docs_search(query="semantic kernel plugins functions")
microsoft_code_sample_search(query="semantic kernel", language="csharp")
microsoft_docs_fetch(url="https://learn.microsoft.com/semantic-kernel/overview/")
```

### 產生的技能

```
semantic-kernel/
├── SKILL.md
└── sample_codes/
    ├── getting-started/
    │   └── hello-kernel.cs
    └── common-patterns/
        ├── chat-completion.cs
        └── function-calling.cs
```

### 產生的 SKILL.md

```markdown
---
name: semantic-kernel
description: 使用 Microsoft Semantic Kernel 建構 AI 代理程式。用於在 .NET 或 Python 中具有外掛程式 (plugin)、規劃器 (planner) 和記憶體的 LLM 驅動應用程式。
---

# Semantic Kernel

用於將 LLM 與外掛程式、規劃器和記憶體整合到應用程式中的編排 SDK。

## 核心概念

- **核心 (Kernel)**：管理 AI 服務和外掛程式的中央編排器 (Orchestrator)
- **外掛程式 (Plugins)**：AI 可以呼叫的函式集合
- **規劃器 (Planner)**：編排外掛程式函式序列以達成目標
- **記憶體 (Memory)**：用於 RAG 模式的向量儲存整合

## 快速入門

請參閱 [getting-started/hello-kernel.cs](sample_codes/getting-started/hello-kernel.cs)

## 深入了解

| 主題 | 如何尋找 |
|-------|-------------|
| 外掛程式開發 | `microsoft_docs_search(query="semantic kernel plugins custom functions")` |
| 規劃器 | `microsoft_docs_search(query="semantic kernel planner")` |
| 記憶體 | `microsoft_docs_fetch(url="https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-memory")` |

## CLI 替代方案

如果 Learn MCP 伺服器不可用，請改用 `mslearn` CLI：

| MCP 工具 | CLI 命令 |
|----------|-------------|
| `microsoft_docs_search(query: "...")` | `mslearn search "..."` |
| `microsoft_code_sample_search(query: "...", language: "...")` | `mslearn code-search "..." --language ...` |
| `microsoft_docs_fetch(url: "...")` | `mslearn fetch "..."` |

直接使用 `npx @microsoft/learn-cli <command>` 執行，或使用 `npm install -g @microsoft/learn-cli` 全域安裝。
```
