---
description: '建立 GitHub Copilot 自訂 Agent 檔案的準則'
applyTo: '**/*.agent.md'
---

# 自訂 Agent 檔案準則

本文件提供建立有效且易於維護的自訂 Agent 檔案的指示，這些檔案可為 GitHub Copilot 中的特定開發工作提供專業知識。

## 專案背景

- 目標對象：為 GitHub Copilot 建立自訂 Agent 的開發者
- 檔案格式：包含 YAML Frontmatter 的 Markdown
- 檔案命名慣例：小寫並使用連字號（例如：`test-specialist.agent.md`）
- 位置：`.github/agents/` 目錄（儲存庫層級）或 `agents/` 目錄（組織/企業層級）
- 目的：定義具有針對特定工作的專業知識、工具和指示的專用 Agent
- 官方文件：https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents

## 必要的 Frontmatter

每個 Agent 檔案都必須包含具有以下欄位的 YAML Frontmatter：

```yaml
---
description: '簡要描述 Agent 的目的和能力'
name: 'Agent 顯示名稱'
tools: ['read', 'edit', 'search']
model: 'Claude Sonnet 4.5'
target: 'vscode'
infer: true
---
```

### 核心 Frontmatter 屬性

#### **description** (必要)
- 單引號字串，清晰說明 Agent 的目的和領域專業知識
- 應簡潔（50-150 個字元）且具備行動導向
- 範例：`'專注於測試涵蓋範圍、品質和測試最佳實務'`

#### **name** (選用)
- Agent 在 UI 中的顯示名稱
- 如果省略，預設為檔案名稱（不含 `.md` 或 `.agent.md`）
- 使用首字母大寫並具備描述性
- 範例：`'測試專家'`

#### **tools** (選用)
- Agent 可以使用的工具名稱或別名列表
- 支援逗號分隔字串或 YAML 陣列格式
- 如果省略，Agent 具備所有可用工具的存取權限
- 詳細資訊請參閱下方的「工具設定」章節

#### **model** (強烈建議)
- 指定 Agent 應使用的 AI 模型
- 在 VS Code、JetBrains IDE、Eclipse 和 Xcode 中受支援
- 範例：`'Claude Sonnet 4.5'`, `'gpt-4'`, `'gpt-4o'`
- 根據 Agent 的複雜性和所需能力進行選擇

#### **target** (選用)
- 指定目標環境：`'vscode'` 或 `'github-copilot'`
- 如果省略，Agent 在這兩個環境中皆可用
- 當 Agent 具有環境特定功能時使用

#### **infer** (選用)
- 布林值，控制 Copilot 是否可以根據上下文自動使用此 Agent
- 如果省略，預設為 `true`
- 設定為 `false` 則需要手動選擇 Agent

#### **metadata** (選用，僅限 GitHub.com)
- 包含名稱-值對的物件，用於 Agent 註釋
- 範例：`metadata: { category: 'testing', version: '1.0' }`
- VS Code 不支援

#### **mcp-servers** (選用，僅限組織/企業)
- 設定僅供此 Agent 使用的 MCP 伺服器
- 僅支援組織/企業層級的 Agent
- 參閱下方的「MCP 伺服器設定」章節

#### **handoffs** (選用，僅限 VS Code)
- 啟用引導式的循序工作流，在 Agent 之間切換並提供建議的後續步驟
- 交接設定列表，每個設定指定一個目標 Agent 和選用的提示字
- 聊天回應完成後，會出現交接按鈕，允許使用者移動到下一個 Agent
- 僅在 VS Code（版本 1.106+）中支援
- 詳細資訊請參閱下方的「交接設定」章節

## 交接設定 (Handoffs Configuration)

交接功能讓您可以建立引導式的循序工作流，在自訂 Agent 之間無縫切換。這對於編排多步驟開發工作流非常有用，使用者可以在進入下一步之前檢視並核准每個步驟。

### 常見交接模式

- **規劃 → 實作**：在規劃 Agent 中產生計畫，然後交接給實作 Agent 開始編寫程式碼
- **實作 → 評論**：完成實作，然後切換到程式碼評論 Agent 以檢查品質和安全性問題
- **撰寫失敗測試 → 撰寫通過測試**：產生失敗的測試，然後交接以實作使這些測試通過的程式碼
- **研究 → 文件**：研究一個主題，然後轉換到文件 Agent 以撰寫指南

### 交接 Frontmatter 結構

在 Agent 檔案的 YAML Frontmatter 中使用 `handoffs` 欄位定義交接：

```yaml
---
description: 'Agent 的簡要描述'
name: 'Agent 名稱'
tools: ['search', 'read']
handoffs:
  - label: 開始實作
    agent: implementation
    prompt: '現在實作上方概述的計畫。'
    send: false
  - label: 程式碼評論
    agent: code-review
    prompt: '請評論此實作的品質和安全性問題。'
    send: false
---
```

### 交接屬性

列表中的每個交接必須包含以下屬性：

| 屬性 | 類型 | 必要 | 描述 |
|----------|------|----------|-------------|
| `label` | string | 是 | 顯示在聊天介面交接按鈕上的文字 |
| `agent` | string | 是 | 要切換到的目標 Agent 識別碼（名稱或不含 `.agent.md` 的檔案名稱） |
| `prompt` | string | 否 | 預填在目標 Agent 聊天輸入框中的提示文字 |
| `send` | boolean | 否 | 如果為 `true`，自動將提示提交給目標 Agent（預設：`false`） |

### 交接行為

- **按鈕顯示**：交接按鈕在聊天回應完成後作為互動式建議出現
- **上下文保留**：當使用者選擇交接按鈕時，他們會切換到目標 Agent 並保留對話上下文
- **預填提示**：如果指定了 `prompt`，它會預填在目標 Agent 的聊天輸入框中
- **手動 vs 自動**：當 `send: false` 時，使用者必須檢視並手動傳送預填的提示；當 `send: true` 時，提示會自動提交

### 交接設定準則

#### 何時使用交接

- **多步驟工作流**：將複雜工作拆解到多個專用 Agent
- **品質閘門**：確保實作階段之間有評論步驟
- **引導式流程**：引導使用者完成結構化的開發流程
- **技能轉換**：從規劃/設計專家移動到實作/測試專家

#### 最佳實務

- **清晰的標籤**：使用動作導向的標籤，清晰指示下一步
  - ✅ 優良："開始實作"、"進行安全性評論"、"撰寫測試"
  - ❌ 避免："下一步"、"前往 Agent"、"執行某事"

- **相關的提示**：提供參考已完成工作的上下文相關提示
  - ✅ 優良：`'現在實作上方概述的計畫。'`
  - ❌ 避免：沒有上下文的通用提示

- **選擇性使用**：不要對每個可能的 Agent 都建立交接；專注於邏輯上的工作流轉換
  - 每個 Agent 限制為 2-3 個最相關的後續步驟
  - 僅為在工作流中自然銜接的 Agent 增加交接

- **Agent 相依性**：在建立交接之前確保目標 Agent 存在
  - 指向不存在 Agent 的交接會被靜默忽略
  - 測試交接以驗證其運作符合預期

- **提示內容**：保持提示簡潔且具備行動導向
  - 引用目前 Agent 的工作，不要重複內容
  - 提供目標 Agent 可能需要的任何必要資訊

### 範例：完整工作流

以下是三個具有交接功能的 Agent 建立完整工作流的範例：

**規劃 Agent** (`planner.agent.md`):
```yaml
---
description: '為新功能或重構產生實作計畫'
name: '規劃員 (Planner)'
tools: ['search', 'read']
handoffs:
  - label: 實作計畫
    agent: implementer
    prompt: '實作上方概述的計畫。'
    send: false
---
# 規劃員 Agent
您是一位規劃專家。您的任務是：
1. 分析需求
2. 將工作拆解為邏輯步驟
3. 產生詳細的實作計畫
4. 識別測試需求

不要撰寫任何程式碼 - 僅專注於規劃。
```

**實作 Agent** (`implementer.agent.md`):
```yaml
---
description: '根據計畫或規格實作程式碼'
name: '實作者 (Implementer)'
tools: ['read', 'edit', 'search', 'execute']
handoffs:
  - label: 評論實作
    agent: reviewer
    prompt: '請針對程式碼品質、安全性和對最佳實務的遵循程度評論此實作。'
    send: false
---
# 實作者 Agent
您是一位實作專家。您的任務是：
1. 遵循提供的計畫或規格
2. 撰寫簡潔、易於維護的程式碼
3. 包含適當的註解和文件
4. 遵循專案編碼標準

完整且徹底地實作解決方案。
```

**評論 Agent** (`reviewer.agent.md`):
```yaml
---
description: '針對品質、安全性和最佳實務評論程式碼'
name: '評論員 (Reviewer)'
tools: ['read', 'search']
handoffs:
  - label: 回到規劃
    agent: planner
    prompt: '檢視上方的回饋並判斷是否需要新計畫。'
    send: false
---
# 程式碼評論 Agent
您是一位程式碼評論專家。您的任務是：
1. 檢查程式碼品質和可維護性
2. 識別安全性問題和漏洞
3. 驗證是否遵循專案標準
4. 建議改進措施

對實作提供具建設性的回饋。
```

此工作流允許開發者：
1. 從規劃員 (Planner) Agent 開始建立詳細計畫
2. 交接給實作者 (Implementer) Agent 根據計畫撰寫程式碼
3. 交接給評論員 (Reviewer) Agent 檢查實作
4. 如果發現重大問題，可選擇交接回到規劃階段

### 版本相容性

- **VS Code**：交接功能在 VS Code 1.106 及更高版本中受支援
- **GitHub.com**：目前不支援；Agent 轉換工作流使用不同的機制
- **其他 IDE**：支援有限或不支援；專注於 VS Code 實作以獲得最大相容性

## 工具設定 (Tool Configuration)

### 工具指定策略

**啟用所有工具** (預設)：
```yaml
# 完全省略 tools 屬性，或使用：
tools: ['*']
```

**啟用特定工具**：
```yaml
tools: ['read', 'edit', 'search', 'execute']
```

**啟用 MCP 伺服器工具**：
```yaml
tools: ['read', 'edit', 'github/*', 'playwright/navigate']
```

**停用所有工具**：
```yaml
tools: []
```

### 標準工具別名

所有別名不區分大小寫：

| 別名 | 替代名稱 | 類別 | 描述 |
|-------|------------------|----------|-------------|
| `execute` | shell, Bash, powershell | Shell 執行 | 在適當的 shell 中執行指令 |
| `read` | Read, NotebookRead, view | 檔案讀取 | 讀取檔案內容 |
| `edit` | Edit, MultiEdit, Write, NotebookEdit | 檔案編輯 | 編輯和修改檔案 |
| `search` | Grep, Glob, search | 程式碼搜尋 | 搜尋檔案或檔案中的文字 |
| `agent` | custom-agent, Task | Agent 呼叫 | 呼叫其他自訂 Agent |
| `web` | WebSearch, WebFetch | 網路存取 | 獲取網頁內容和搜尋 |
| `todo` | TodoWrite | 任務管理 | 建立和管理任務列表（僅限 VS Code） |

### 內建 MCP 伺服器工具

**GitHub MCP 伺服器**：
```yaml
tools: ['github/*']  # 所有 GitHub 工具
tools: ['github/get_file_contents', 'github/search_repositories']  # 特定工具
```
- 所有唯讀工具預設可用
- Token 範圍限定於來源儲存庫

**Playwright MCP 伺服器**：
```yaml
tools: ['playwright/*']  # 所有 Playwright 工具
tools: ['playwright/navigate', 'playwright/screenshot']  # 特定工具
```
- 設定為僅存取 localhost
- 對於瀏覽器自動化和測試非常有用

### 工具選擇最佳實務

- **最小權限原則**：僅啟用 Agent 目的所需的工具
- **安全性**：除非明確要求，否則限制 `execute` 存取權限
- **專注**：工具越少 = Agent 目的越清晰且效能越好
- **文件**：針對複雜設定，註解說明為何需要特定工具

## 子 Agent 呼叫 (Agent 編排)

Agent 可以使用 **Agent 呼叫工具**（`agent` 工具）來呼叫其他 Agent，以編排多步驟工作流。

建議的方法是 **基於提示的編排 (prompt-based orchestration)**：
- 編排者使用自然語言定義步驟式工作流。
- 每個步驟委派給專用 Agent。
- 編排者僅傳遞必要的上下文（例如：基本路徑、識別碼），並要求每個子 Agent 讀取其自身的 `.agent.md` 規格以獲取工具/條件約束。

### 運作方式

1) 在編排者的工具列表中包含 `agent` 以啟用 Agent 呼叫：

```yaml
tools: ['read', 'edit', 'search', 'agent']
```

2) 對於每個步驟，藉由提供以下資訊來呼叫子 Agent：
- **Agent 名稱**（使用者選擇/呼叫的識別碼）
- **Agent 規格路徑**（要讀取並遵循的 `.agent.md` 檔案）
- **最小共享上下文**（例如：`basePath`、`projectName`、`logFile`）

### 提示模式 (建議)

為每個步驟使用一致的「包裝提示 (wrapper prompt)」，使子 Agent 的行為可預測：

```text
此階段必須以「<AGENT_SPEC_PATH>」中定義的 Agent「<AGENT_NAME>」身份執行。

重要：
- 讀取並套用完整的 .agent.md 規格（工具、條件約束、品質標準）。
- 在基本路徑「<BASE_PATH>」下處理「<WORK_UNIT_NAME>」。
- 在此基本路徑下執行必要的讀取/寫入。
- 傳回清晰的摘要（採取的行動 + 產生/修改的檔案 + 問題）。
```

選用：如果您需要輕量化、結構化的包裝以供追蹤，可以在提示中嵌入一個小型 JSON 區塊（仍具備人類可讀性且與工具無關）：

```text
{
  "step": "<STEP_ID>",
  "agent": "<AGENT_NAME>",
  "spec": "<AGENT_SPEC_PATH>",
  "basePath": "<BASE_PATH>"
}
```

### 編排者結構 (保持通用)

為了維持編排者的可維護性，請記錄以下結構元素：

- **動態參數**：從使用者處提取的數值（例如：`projectName`、`fileName`、`basePath`）。
- **子 Agent 註冊表**：將每個步驟對應到 `agentName` + `agentSpecPath` 的列表/表格。
- **步驟排序**：明確的順序（步驟 1 → 步驟 N）。
- **觸發條件**（選用但建議）：定義步驟何時執行 vs 跳過。
- **記錄策略**（選用但建議）：在每個步驟後更新單一記錄/報告檔案。

避免在編排者提示中嵌入編排「程式碼」（JavaScript、Python 等）；偏好確定性的、工具驅動的協調。

### 基本模式

使用以下內容結構化每個步驟呼叫：

1. **步驟描述**：清晰的一行目的（用於記錄和追蹤）
2. **Agent 身份**：`agentName` + `agentSpecPath`
3. **上下文**：一組小型、明確的變數（路徑、ID、環境名稱）
4. **預期輸出**：要建立/更新的檔案以及應寫入的位置
5. **傳回摘要**：要求子 Agent 傳回簡短、結構化的摘要

### 範例：多步驟處理

```text
步驟 1：轉換原始輸入資料
Agent: data-processor
規格: .github/agents/data-processor.agent.md
上下文: projectName=${projectName}, basePath=${basePath}
輸入: ${basePath}/raw/
輸出: ${basePath}/processed/
預期: 寫入 ${basePath}/processed/summary.md

步驟 2：分析處理後的資料（取決於步驟 1 的輸出）
Agent: data-analyst
規格: .github/agents/data-analyst.agent.md
上下文: projectName=${projectName}, basePath=${basePath}
輸入: ${basePath}/processed/
輸出: ${basePath}/analysis/
預期: 寫入 ${basePath}/analysis/report.md
```

### 關鍵點

- **在提示中傳遞變數**：對所有動態數值使用 `${variableName}`
- **保持提示專注**：為每個子 Agent 提供清晰、特定的任務
- **傳回摘要**：每個子 Agent 應報告其完成的工作
- **循序執行**：當輸出/輸入之間存在相依性時，按順序執行步驟
- **錯誤處理**：在繼續執行相依步驟之前檢查結果

### ⚠️ 工具可用性需求

**關鍵**：如果子 Agent 需要特定工具（例如：`edit`、`execute`、`search`），編排者必須在其自身的 `tools` 列表中包含這些工具。子 Agent 無法存取其父編排者不可用的工具。

**範例**：
```yaml
# 如果您的子 Agent 需要編輯檔案、執行指令或搜尋程式碼
tools: ['read', 'edit', 'search', 'execute', 'agent']
```

編排者的工具權限充當所有被呼叫子 Agent 的上限。請仔細規劃您的工具列表，確保所有子 Agent 具備所需的工具。

### ⚠️ 重要限制

**子 Agent 編排不適合大規模資料處理。** 在以下情況下請避免使用多步驟子 Agent 管線：
- 處理數百或數千個檔案
- 處理大型資料集
- 在大型程式碼庫上執行批次轉換
- 編排超過 5-10 個循序步驟

每次子 Agent 呼叫都會增加延遲和上下文開銷。對於高通量處理，請直接在單一 Agent 中實作邏輯。僅在針對專注、可控的資料集協調專業工作時才使用編排。

## Agent 提示字結構 (Agent Prompt Structure)

Frontmatter 下方的 Markdown 內容定義了 Agent 的行為、專業知識和指示。結構良好的提示字通常包含：

1. **Agent 身份與角色**：Agent 是誰及其主要角色
2. **核心職責**：Agent 執行的具體任務
3. **方法與準則**：Agent 如何運作以完成任務
4. **準則與限制**：應執行/避免的事項以及品質標準
5. **輸出預期**：預期的輸出格式和品質

### 提示字撰寫最佳實務

- **具體且直接**：使用祈使句（「分析」、「產生」）；避免模糊術語
- **定義界限**：明確說明範圍限制和約束條件
- **包含上下文**：解釋領域專業知識並參考相關框架
- **專注於行為**：描述 Agent 應如何思考和運作
- **使用結構化格式**：標題、點列式項目和列表使提示字易於瀏覽

## 變數定義與提取 (Variable Definition and Extraction)

Agent 可以定義動態參數以從使用者輸入中提取數值，並在整個 Agent 的行為和子 Agent 通訊中使用。這使得 Agent 能夠靈活地根據上下文運作，適應使用者提供的資料。

### 何時使用變數

**在以下情況使用變數**：
- Agent 行為取決於使用者輸入
- 需要將動態數值傳遞給子 Agent
- 希望使 Agent 在不同上下文中可重複使用
- 需要參數化的工作流
- 需要追蹤或參考使用者提供的上下文

**範例**：
- 從使用者提示中提取專案名稱
- 擷取用於管線處理的憑證名稱
- 識別檔案路徑或目錄
- 提取設定選項
- 解析功能名稱或模組識別碼

### 變數宣告模式

在 Agent 提示字早期定義變數章節，以記錄預期的參數：

```markdown
# Agent 名稱

## 動態參數

- **參數名稱**：描述與用法
- **另一個參數**：如何提取與使用

## 您的任務

處理 [參數名稱] 以完成 [任務]。
```

### 變數提取方法

#### 1. **明確的使用者輸入**
如果在提示中未偵測到變數，要求使用者提供：

```markdown
## 您的任務

透過分析您的程式碼庫來處理專案。

### 步驟 1：識別專案
如果未提供專案名稱，請**詢問使用者**：
- 專案名稱或識別碼
- 基本路徑或目錄位置
- 設定類型（如果適用）

使用此資訊為所有後續任務提供上下文。
```

#### 2. **從提示中隱含提取**
自動從使用者的自然語言輸入中提取變數：

```javascript
// 範例：從使用者輸入中提取憑證名稱
const userInput = "處理我的憑證";

// 提取關鍵資訊
const certificationName = extractCertificationName(userInput);
// 結果："我的憑證"

const basePath = `certifications/${certificationName}`;
// 結果："certifications/我的憑證"
```

#### 3. **上下文變數解析**
使用檔案上下文或工作區資訊來衍生變數：

```markdown
## 變數解析策略

1. **從使用者提示**：首先，在使用者輸入中尋找明確提及
2. **從檔案上下文**：檢查目前的檔案名稱或路徑
3. **從工作區**：使用工作區資料夾或動態專案
4. **從設定**：參考設定檔案
5. **詢問使用者**：如果上述方法皆失敗，要求提供缺失資訊
```

### 在 Agent 提示字中使用變數

#### 指示中的變數替換

在 Agent 提示字中使用範本變數使其具備動態性：

```markdown
# Agent 名稱

## 動態參數
- **專案名稱**：${projectName}
- **基本路徑**：${basePath}
- **輸出目錄**：${outputDir}

## 您的任務

處理位於 `${basePath}` 的 **${projectName}** 專案。

## 處理步驟

1. 從 `${basePath}/input/` 讀取輸入
2. 根據專案設定處理檔案
3. 將結果寫入 `${outputDir}/`
4. 產生摘要報告

## 品質標準

- 維持 **${projectName}** 的專案特定編碼標準
- 遵循目錄結構：`${basePath}/[structure]`
```

#### 將變數傳遞給子 Agent

呼叫子 Agent 時，透過提示字中替換的變數傳遞所有上下文。建議傳遞**路徑和識別碼**，而非整個檔案內容。

範例（提示範本）：

```text
此階段必須以「.github/agents/documentation-writer.agent.md」中定義的 Agent「documentation-writer」身份執行。

重要：
- 讀取並套用完整的 .agent.md 規格。
- 專案：「${projectName}」
- 基本路徑：「projects/${projectName}」
- 輸入：「projects/${projectName}/src/」
- 輸出：「projects/${projectName}/docs/」

任務：
1. 讀取輸入路徑下的來源檔案。
2. 產生文件。
3. 在輸出路徑下寫入輸出。
4. 傳回簡潔的摘要（建立/更新的檔案、關鍵決策、問題）。
```

子 Agent 會接收嵌入在提示字中的所有必要上下文。變數在傳送提示字之前會被解析，因此子 Agent 會處理具體的路徑和數值，而非變數佔位符。

### 真實範例：程式碼評論編排者 (Code Review Orchestrator)

一個簡單編排者的範例，透過多個專用 Agent 驗證程式碼：

1) 確定共享上下文：
- `repositoryName`, `prNumber`
- `basePath`（例如：`projects/${repositoryName}/pr-${prNumber}`）

2) 循序呼叫專用 Agent（每個 Agent 讀取其自身的 `.agent.md` 規格）：

```text
步驟 1：安全性評論
Agent: security-reviewer
規格: .github/agents/security-reviewer.agent.md
上下文: repositoryName=${repositoryName}, prNumber=${prNumber}, basePath=projects/${repositoryName}/pr-${prNumber}
輸出: projects/${repositoryName}/pr-${prNumber}/security-review.md

步驟 2：測試涵蓋範圍
Agent: test-coverage
規格: .github/agents/test-coverage.agent.md
上下文: repositoryName=${repositoryName}, prNumber=${prNumber}, basePath=projects/${repositoryName}/pr-${prNumber}
輸出: projects/${repositoryName}/pr-${prNumber}/coverage-report.md

步驟 3：彙整
Agent: review-aggregator
規格: .github/agents/review-aggregator.agent.md
上下文: repositoryName=${repositoryName}, prNumber=${prNumber}, basePath=projects/${repositoryName}/pr-${prNumber}
輸出: projects/${repositoryName}/pr-${prNumber}/final-review.md
```

#### 範例：條件式步驟編排 (程式碼評論)

此範例展示了更完整的編排，包含**執行前檢查**、**條件式步驟**以及**必要 vs 選用**行為。

**動態參數（輸入）：**
- `repositoryName`, `prNumber`
- `basePath`（例如：`projects/${repositoryName}/pr-${prNumber}`）
- `logFile`（例如：`${basePath}/.review-log.md`）

**執行前檢查（建議）：**
- 驗證預期的資料夾/檔案是否存在（例如：`${basePath}/changes/`、`${basePath}/reports/`）。
- 偵測影響步驟觸發的高階特性（例如：儲存庫語言、`package.json`、`pom.xml`、`requirements.txt` 的存在、測試資料夾）。
- 在開始時記錄發現結果。

**步驟觸發條件：**

| 步驟 | 狀態 | 觸發條件 | 失敗時 |
|------|--------|-------------------|-----------|
| 1: 安全性評論 | **必要** | 律執行 | 停止管線 |
| 2: 相依性稽核 | 選用 | 如果存在相依性清單 (`package.json`, `pom.xml` 等) | 繼續 |
| 3: 測試涵蓋範圍檢查 | 選用 | 如果存在測試專案/檔案 | 繼續 |
| 4: 效能檢查 | 選用 | 如果安全性相關程式碼變動或存在效能設定 | 繼續 |
| 5: 彙整與判定 | **必要** | 步驟 1 完成後一律執行 | 停止管線 |

**執行流程（自然語言）：**
1. 初始化 `basePath` 並建立/更新 `logFile`。
2. 執行執行前檢查並記錄。
3. 循序執行步驟 1 → N。
4. 對於每個步驟：
  - 如果觸發條件為 false：標記為 **已跳過 (SKIPPED)** 並繼續。
  - 否則：使用包裝提示字呼叫子 Agent 並擷取其摘要。
  - 標記為 **成功 (SUCCESS)** 或 **失敗 (FAILED)**。
  - 如果該步驟為 **必要** 且失敗：停止管線並撰寫失敗摘要。
5. 以最終摘要章節結束（整體狀態、成品、後續行動）。

**子 Agent 呼叫提示字（範例）：**

```text
此階段必須以「.github/agents/security-reviewer.agent.md」中定義的 Agent「security-reviewer」身份執行。

重要：
- 讀取並套用完整的 .agent.md 規格。
- 處理儲存庫「${repositoryName}」的 PR「${prNumber}」。
- 基本路徑：「${basePath}」。

任務：
1. 評論「${basePath}/changes/」下的變動。
2. 將發現結果寫入「${basePath}/reports/security-review.md」。
3. 傳回包含以下內容的簡短摘要：嚴重發現結果、建議修復方式、建立/修改的檔案。
```

**記錄格式（範例）：**

```markdown
## 步驟 2：相依性稽核
**狀態：** ✅ 成功 (SUCCESS) / ⚠️ 已跳過 (SKIPPED) / ❌ 失敗 (FAILED)
**觸發：** package.json 存在
**開始時間：** 2026-01-16T10:30:15Z
**完成時間：** 2026-01-16T10:31:05Z
**持續時間：** 00:00:50
**成品：** reports/dependency-audit.md
**摘要：** [簡短 Agent 摘要]
```

此模式適用於任何編排案例：提取變數、使用清晰的上下文呼叫子 Agent、等待結果。


### 變數最佳實務

#### 1. **清晰的文件說明**
務必記錄預期的變數：

```markdown
## 必要變數
- **projectName**：專案名稱（字串，必要）
- **basePath**：專案檔案的根目錄（路徑，必要）

## 選用變數
- **mode**：處理模式 - 快速/標準/詳細（列舉，預設：標準）
- **outputFormat**：輸出格式 - markdown/json/html（列舉，預設：markdown）

## 衍生變數
- **outputDir**：自動設定為 ${basePath}/output
- **logFile**：自動設定為 ${basePath}/.log.md
```

#### 2. **一致的命名**
使用一致的變數命名慣例：

```javascript
// 優良：清晰且具描述性的命名
const variables = {
  projectName,          // 要處理的專案
  basePath,            // 專案檔案所在位置
  outputDirectory,     // 儲存結果的位置
  processingMode,      // 如何處理（詳細程度）
  configurationPath    // 設定檔案所在位置
};

// 避免：模糊或不一致
const bad_variables = {
  name,     // 太通用
  path,     // 不清楚是哪個路徑
  mode,     // 太短
  config    // 太模糊
};
```

#### 3. **驗證與條件約束**
記錄有效值與條件約束：

```markdown
## 變數條件約束

**projectName**:
- 類型：字串（允許字母數字、連字號、底線）
- 長度：1-100 個字元
- 必要：是
- 模式：`/^[a-zA-Z0-9_-]+$/`

**processingMode**:
- 類型：列舉
- 有效值："quick" (< 5 分鐘), "standard" (5-15 分鐘), "detailed" (15 分鐘以上)
- 預設："standard"
- 必要：否
```

## MCP 伺服器設定 (僅限組織/企業)

MCP 伺服器透過額外工具擴充 Agent 能力。僅組織和企業層級的 Agent 支援。

### 設定格式

```yaml
---
name: my-custom-agent
description: '具備 MCP 整合功能的 Agent'
tools: ['read', 'edit', 'custom-mcp/tool-1']
mcp-servers:
  custom-mcp:
    type: 'local'
    command: 'some-command'
    args: ['--arg1', '--arg2']
    tools: ["*"]
    env:
      ENV_VAR_NAME: ${{ secrets.API_KEY }}
---
```

### MCP 伺服器屬性

- **type**：伺服器類型（`'local'` 或 `'stdio'`）
- **command**：啟動 MCP 伺服器的指令
- **args**：指令引數陣列
- **tools**：要從此伺服器啟用的工具（`["*"]` 代表全部）
- **env**：環境變數（支援祕密資訊）

### 環境變數與祕密資訊 (Secrets)

祕密資訊必須在「Copilot」環境下的儲存庫設定中進行設定。

**支援的語法**：
```yaml
env:
  # 僅環境變數
  VAR_NAME: COPILOT_MCP_ENV_VAR_VALUE

  # 帶有標頭的變數
  VAR_NAME: $COPILOT_MCP_ENV_VAR_VALUE
  VAR_NAME: ${COPILOT_MCP_ENV_VAR_VALUE}

  # GitHub Actions 風格（僅限 YAML）
  VAR_NAME: ${{ secrets.COPILOT_MCP_ENV_VAR_VALUE }}
  VAR_NAME: ${{ var.COPILOT_MCP_ENV_VAR_VALUE }}
```

## 檔案組織與命名

### 儲存庫層級 Agent
- 位置：`.github/agents/`
- 範圍：僅在特定儲存庫中可用
- 存取：使用儲存庫設定的 MCP 伺服器

### 組織/企業層級 Agent
- 位置：`.github-private/agents/`（然後移動到 `agents/` 根目錄）
- 範圍：在組織/企業內的所有儲存庫中可用
- 存取：可以設定專用的 MCP 伺服器

### 命名慣例
- 使用小寫並配合連字號：`test-specialist.agent.md`
- 名稱應反映 Agent 的用途
- 檔案名稱成為預設的 Agent 名稱（如果未指定 `name`）
- 允許的字元：`.`, `-`, `_`, `a-z`, `A-Z`, `0-9`

## Agent 處理與行為

### 版本控制
- 基於 Agent 檔案的 Git 提交 SHA
- 為不同的 Agent 版本建立分支/標籤
- 使用儲存庫/分支的最新版本進行具體化
- PR 互動使用相同的 Agent 版本以維持一致性

### 名稱衝突
優先順序（由高至低）：
1. 儲存庫層級 Agent
2. 組織層級 Agent
3. 企業層級 Agent

較低層級的設定會覆蓋具有相同名稱的較高層級設定。

### 工具處理
- `tools` 列表會過濾可用工具（內建和 MCP）
- 未指定工具 = 啟用所有工具
- 空列表 (`[]`) = 停用所有工具
- 特定列表 = 僅啟用這些工具
- 無法辨識的工具名稱會被忽略（允許環境特定的工具）

### MCP 伺服器處理順序
1. 現成可用的 MCP 伺服器（例如：GitHub MCP）
2. 自訂 Agent MCP 設定（僅限組織/企業）
3. 儲存庫層級 MCP 設定

每個層級都可以覆蓋前一層級的設定。

## Agent 建立檢查清單

### Frontmatter
- [ ] `description` 欄位存在且具描述性（50-150 個字元）
- [ ] `description` 以單引號包圍
- [ ] 已指定 `name`（選用但建議）
- [ ] 已正確設定 `tools`（或有意省略）
- [ ] 已指定 `model` 以獲得最佳效能
- [ ] 如果是環境特定，已設定 `target`
- [ ] 如果需要手動選擇，已將 `infer` 設定為 `false`

### 提示字內容
- [ ] 已定義清晰的 Agent 身份與角色
- [ ] 已明確列出核心職責
- [ ] 已解釋方法與準則
- [ ] 已指定準則與限制
- [ ] 已記錄輸出預期
- [ ] 在有助於理解之處提供範例
- [ ] 指示具體且具備行動導向
- [ ] 已清晰定義範圍與界限
- [ ] 總內容在 30,000 個字元以內

### 檔案結構
- [ ] 檔案名稱遵循小寫加連字號的慣例
- [ ] 檔案放置在正確的目錄（`.github/agents/` 或 `agents/`）
- [ ] 檔案名稱僅使用允許的字元
- [ ] 副檔名為 `.agent.md`

### 品質保證
- [ ] Agent 目的具備唯一性且不重複
- [ ] 工具精簡且必要
- [ ] 指示清晰且無歧義
- [ ] 已使用代表性任務對 Agent 進行測試
- [ ] 文件參考為最新狀態
- [ ] 已解決安全性考量（如果適用）

## 常見 Agent 模式

### 測試專家 (Testing Specialist)
**目的**：專注於測試涵蓋範圍和品質
**工具**：所有工具（用於全面的測試建立）
**方法**：分析、識別差距、撰寫測試，避免變動生產程式碼

### 實作規劃員 (Implementation Planner)
**目的**：建立詳細的技術計畫和規格
**工具**：限制為 `['read', 'search', 'edit']`
**方法**：分析需求、建立文件，避免實作

### 程式碼評論員 (Code Reviewer)
**目的**：評論程式碼品質並提供回饋
**工具**：僅限 `['read', 'search']`
**方法**：分析、建議改進，不直接修改

### 重構專家 (Refactoring Specialist)
**目的**：改進程式碼結構和可維護性
**工具**：`['read', 'search', 'edit']`
**方法**：分析模式、提出重構建議、安全地實作

### 安全性稽核員 (Security Auditor)
**目的**：識別安全性問題和漏洞
**工具**：`['read', 'search', 'web']`
**方法**：掃描程式碼、根據 OWASP 進行檢查、報告發現結果

## 應避免的常見錯誤

### Frontmatter 錯誤
- ❌ 缺失 `description` 欄位
- ❌ 描述未以引號包圍
- ❌ 未檢查文件便使用無效的工具名稱
- ❌ 錯誤的 YAML 語法（縮排、引號）

### 工具設定問題
- ❌ 無必要地授權過多的工具存取權限
- ❌ 缺失 Agent 目的所需的必要工具
- ❌ 未一致地使用工具別名
- ❌ 忘記 MCP 伺服器命名空間 (`server-name/tool`)

### 提示字內容問題
- ❌ 模糊、有歧義的指示
- ❌ 衝突或矛盾的準則
- ❌ 缺乏清晰的範圍定義
- ❌ 缺失輸出預期
- ❌ 過於冗長的指示（超過字元限制）
- ❌ 對於複雜任務缺乏範例或上下文

### 組織管理問題
- ❌ 檔案名稱未反映 Agent 用途
- ❌ 目錄錯誤（混淆了儲存庫層級與組織層級）
- ❌ 在檔案名稱中使用空格或特殊字元
- ❌ 重複的 Agent 名稱導致衝突

## 測試與驗證

### 手動測試
1. 建立具備正確 Frontmatter 的 Agent 檔案
2. 重新載入 VS Code 或重新整理 GitHub.com
3. 從 Copilot Chat 的下拉選單中選擇 Agent
4. 使用具代表性的使用者查詢進行測試
5. 驗證工具存取運作正常
6. 確認輸出符合預期

### 整合測試
- 在範圍內測試不同檔案類型的 Agent
- 驗證 MCP 伺服器連線（如果已設定）
- 檢查 Agent 在缺失上下文時的行為
- 測試錯誤處理和邊緣案例
- 驗證 Agent 切換和交接

### 品質檢查
- 逐一執行 Agent 建立檢查清單
- 根據常見錯誤列表進行檢視
- 與儲存庫中的範例 Agent 進行比較
- 對複雜的 Agent 進行同儕審查 (peer review)
- 記錄任何特殊的設定需求

## 其他資源

### 官方文件
- [建立自訂 Agent (Creating Custom Agents)](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [自訂 Agent 設定 (Custom Agents Configuration)](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [VS Code 中的自訂 Agent (Custom Agents in VS Code)](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [MCP 整合 (MCP Integration)](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)

### 社群資源
- [Awesome Copilot Agents 集合](https://github.com/github/awesome-copilot/tree/main/agents)
- [自訂程式庫範例 (Customization Library Examples)](https://docs.github.com/en/copilot/tutorials/customization-library/custom-agents)
- [您的第一個自訂 Agent 教學 (Your First Custom Agent Tutorial)](https://docs.github.com/en/copilot/tutorials/customization-library/custom-agents/your-first-custom-agent)

### 相關檔案
- [提示字檔案準則 (Prompt Files Guidelines)](./prompt.instructions.md) - 用於建立提示字檔案
- [指示檔案準則 (Instructions Guidelines)](./instructions.instructions.md) - 用於建立指示檔案

## 版本相容性備註

### GitHub.com (Coding Agent)
- ✅ 完整支援所有標準 Frontmatter 屬性
- ✅ 儲存庫和組織/企業層級 Agent
- ✅ MCP 伺服器設定（組織/企業）
- ❌ 不支援 `model`、`argument-hint`、`handoffs` 屬性

### VS Code / JetBrains / Eclipse / Xcode
- ✅ 支援用於 AI 模型選擇的 `model` 屬性
- ✅ 支援 `argument-hint` 和 `handoffs` 屬性
- ✅ 使用者設定檔和工作區層級 Agent
- ❌ 無法在儲存庫層級設定 MCP 伺服器
- ⚠️ 部分屬性的行為可能有所不同

為多個環境建立 Agent 時，請專注於通用屬性，並在所有目標環境中進行測試。必要時使用 `target` 屬性來建立環境特定的 Agent。
