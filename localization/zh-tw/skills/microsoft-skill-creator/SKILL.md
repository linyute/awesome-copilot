---
name: microsoft-skill-creator
description: 使用 Learn MCP 工具為 Microsoft 技術建立代理程式技能。當使用者想要建立一個技能，用來教導代理程式關於任何 Microsoft 技術、函式庫、架構或服務 (Azure, .NET, M365, VS Code, Bicep 等) 時使用。深入調查主題，然後產生一個混合技能，將核心知識儲存在本機，同時實現動態的深度調查。
context: fork
compatibility: 需要 Microsoft Learn MCP 伺服器 (https://learn.microsoft.com/api/mcp)
---

# Microsoft 技能產生器

為 Microsoft 技術建立混合技能，將核心知識儲存在本機，同時實現動態的 Learn MCP 查閱以取得更深入的細節。

## 關於技能

技能是模組化的套件，透過專門的知識和工作流擴展代理程式的功能。技能將通用代理程式轉換為特定領域的專業代理程式。

### 技能結構

```
skill-name/
├── SKILL.md (必要)         # Frontmatter (名稱、描述) + 指令
├── references/             # 根據需要載入到內容中的文件
├── sample_codes/           # 可執行的程式碼範例
└── assets/                 # 輸出中使用的檔案 (範本等)
```

### 關鍵原則

- **Frontmatter 至關重要**：`name` 和 `description` 決定了技能何時觸發 —— 請確保清晰且全面
- **簡潔是關鍵**：僅包含代理程式尚未具備的資訊；內容視窗是共享的
- **不重複**：資訊應存在於 SKILL.md 或參考檔案中，而非同時存在於兩處

## Learn MCP 工具

| 工具 | 用途 | 何時使用 |
|------|---------|-------------|
| `microsoft_docs_search` | 搜尋官方文件 | 第一階段探索、尋找主題 |
| `microsoft_docs_fetch` | 取得完整頁面內容 | 深入研究重要頁面 |
| `microsoft_code_sample_search` | 尋找程式碼範例 | 取得實作模式 |

## 建立程序

### 步驟 1：調查主題

使用 Learn MCP 工具分三個階段建立深入的理解：

**第 1 階段 - 範圍探索：**
```
microsoft_docs_search(query="{technology} overview what is")
microsoft_docs_search(query="{technology} concepts architecture")
microsoft_docs_search(query="{technology} getting started tutorial")
```

**第 2 階段 - 核心內容：**
```
microsoft_docs_fetch(url="...")  # 取得第 1 階段中的頁面
microsoft_code_sample_search(query="{technology}", language="{lang}")
```

**第 3 階段 - 深度研究：**
```
microsoft_docs_search(query="{technology} best practices")
microsoft_docs_search(query="{technology} troubleshooting errors")
```

#### 調查檢查清單

調查後，請驗證：
- [ ] 能用一段話解釋該技術的功能
- [ ] 已識別 3-5 個關鍵概念
- [ ] 擁有基本用法的可執行程式碼
- [ ] 瞭解最常見的 API 模式
- [ ] 擁有用於深入研究主題的搜尋查詢

### 步驟 2：向使用者確認

展示調查結果並詢問：
1. 「我發現了這些關鍵領域：[清單]。哪些是最重要的？」
2. 「代理程式將主要使用此技能執行哪些任務？」
3. 「程式碼範例應優先使用哪種程式語言？」

### 步驟 3：產生技能

從 [skill-templates.md](references/skill-templates.md) 中選擇合適的範本：

| 技術型別 | 範本 |
|-----------------|----------|
| 用戶端函式庫、NuGet/npm 套件 | SDK/函式庫 |
| Azure 資源 | Azure 服務 |
| 應用程式開發架構 | 架構/平台 |
| REST API、協定 | API/協定 |

#### 產生的技能結構

```
{skill-name}/
├── SKILL.md                    # 核心知識 + Learn MCP 指引
├── references/                 # 詳細的本機文件 (如果需要)
└── sample_codes/               # 可執行的程式碼範例
    ├── getting-started/
    └── common-patterns/
```

### 步驟 4：平衡本機與動態內容

**在以下情況儲存在本機：**
- 基礎性的 (任何任務都需要)
- 頻繁存取的
- 穩定的 (不會改變)
- 難以透過搜尋找到的

**在以下情況保持動態：**
- 詳盡的參考資料 (體積太大)
- 版本特定的
- 情境化的 (僅限特定任務)
- 索引良好的 (易於搜尋)

#### 內容指南

| 內容類型 | 本機 | 動態 |
|--------------|-------|---------|
| 核心概念 (3-5) | ✅ 完整 | |
| Hello World 程式碼 | ✅ 完整 | |
| 常見模式 (3-5) | ✅ 完整 | |
| 熱門 API 方法 | 特徵定義 + 範例 | 透過 fetch 取得完整文件 |
| 最佳實務 | 前 5 個重點 | 搜尋以取得更多 |
| 疑難排解 | | 搜尋查詢 |
| 完整 API 參考 | | 文件連結 |

### 步驟 5：驗證

1. 審查：本機內容是否足以應對常見任務？
2. 測試：建議的搜尋查詢是否能傳回有用的結果？
3. 驗證：程式碼範例是否能無誤執行？

## 常見調查模式

### 對於 SDK/函式庫
```
"{name} overview" → 用途、架構
"{name} getting started quickstart" → 設定步驟
"{name} API reference" → 核心類別/方法
"{name} samples examples" → 程式碼模式
"{name} best practices performance" → 最佳化
```

### 對於 Azure 服務
```
"{service} overview features" → 功能
"{service} quickstart {language}" → 設定程式碼
"{service} REST API reference" → 端點
"{service} SDK {language}" → 用戶端函式庫
"{service} pricing limits quotas" → 限制
```

### 對於架構/平台
```
"{framework} architecture concepts" → 思維模型
"{framework} project structure" → 慣例
"{framework} tutorial walkthrough" → 端對端流程
"{framework} configuration options" → 自訂
```

## 範例：建立 "Semantic Kernel" 技能

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
description: 使用 Microsoft Semantic Kernel 建構 AI 代理程式。用於在 .NET 或 Python 中開發具備外掛程式、規劃器和記憶體的 LLM 驅動應用程式。
---

# Semantic Kernel

用於將 LLM 整合到具有外掛程式、規劃器和記憶體之應用程式中的協調 SDK。

## 關鍵概念

- **核心 (Kernel)**：管理 AI 服務和外掛程式的核心協調器
- **外掛程式 (Plugins)**：AI 可以呼叫的函式集合
- **規劃器 (Planner)**：安排外掛程式函式的順序以達成目標
- **記憶體 (Memory)**：整合向量儲存以用於 RAG 模式

## 快速入門

請參閱 [getting-started/hello-kernel.cs](sample_codes/getting-started/hello-kernel.cs)

## 深入瞭解

| 主題 | 如何尋找 |
|-------|-------------|
| 外掛程式開發 | `microsoft_docs_search(query="semantic kernel plugins custom functions")` |
| 規劃器 | `microsoft_docs_search(query="semantic kernel planner")` |
| 記憶體 | `microsoft_docs_fetch(url="https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-memory")` |
```
