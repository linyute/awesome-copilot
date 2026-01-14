---
description: '建立 GitHub Copilot 自訂 Agent 檔案的指南'
applyTo: '**/*.agent.md'
---

# 自訂 Agent 檔案指南

建立有效且易於維護的自訂 Agent 檔案的說明，這些檔案為 GitHub Copilot 中的特定開發工作提供專業知識。

## 專案內容

- 目標對象：建立 GitHub Copilot 自訂 Agent 的開發人員
- 檔案格式：帶有 YAML Frontmatter 的 Markdown
- 檔案命名慣例：小寫並使用連字號（例如：`test-specialist.agent.md`）
- 位置：`.github/agents/` 目錄（存放庫層級）或 `agents/` 目錄（組織/企業層級）
- 目的：定義具有針對特定工作的專業知識、工具和指令的專業 Agent
- 官方文件：https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents

## 必要 Frontmatter

每個 Agent 檔案都必須包含具有以下欄位的 YAML Frontmatter：

```yaml
---
description: 'Agent 目的和能力的簡短描述'
name: 'Agent 顯示名稱'
tools: ['read', 'edit', 'search']
model: 'Claude Sonnet 4.5'
target: 'vscode'
infer: true
---
```

### 核心 Frontmatter 屬性

#### **description** (必要)
- 單引號字串，清楚說明 Agent 的目的和領域專業知識
- 應簡潔（50-150 個字元）且具備行動引導性
- 範例：`'專注於測試涵蓋範圍、品質和測試最佳實務'`

#### **name** (選填)
- UI 中 Agent 的顯示名稱
- 如果省略，預設為檔案名稱（不含 `.md` 或 `.agent.md`）
- 使用標題格式 (Title Case) 並具備描述性
- 範例：`'Testing Specialist'`

#### **tools** (選填)
- Agent 可以使用的工具名稱或別名列表
- 支援逗號分隔字串或 YAML 陣列格式
- 如果省略，Agent 可以存取所有可用工具
- 詳細資訊請參閱下方的「工具組態」章節

#### **model** (強烈建議)
- 指定 Agent 應使用的 AI 模型
- 在 VS Code、JetBrains IDE、Eclipse 和 Xcode 中受支援
- 範例：`'Claude Sonnet 4.5'`, `'gpt-4'`, `'gpt-4o'`
- 根據 Agent 的複雜度和所需能力進行選擇

#### **target** (選填)
- 指定目標環境：`'vscode'` 或 `'github-copilot'`
- 如果省略，Agent 在這兩個環境中都可用
- 當 Agent 具有特定環境的功能時使用

#### **infer** (選填)
- 控制 Copilot 是否可以根據內容自動使用此 Agent 的布林值
- 如果省略，預設為 `true`
- 設定為 `false` 則需要手動選擇 Agent

#### **metadata** (選填，僅限 GitHub.com)
- 用於 Agent 註釋的名值對 (name-value pairs) 物件
- 範例：`metadata: { category: 'testing', version: '1.0' }`
- 在 VS Code 中不支援

#### **mcp-servers** (選填，僅限組織/企業)
- 設定僅供此 Agent 使用的 MCP 伺服器
- 僅支援組織/企業層級的 Agent
- 參閱下方的「MCP 伺服器組態」章節

#### **handoffs** (選填，僅限 VS Code)
- 啟用引導式的循序工作流程，在 Agent 之間切換並提供建議的後續步驟
- 銜接 (handoff) 組態列表，每個組態都指定一個目標 Agent 和選填的提示詞
- 在對話回應完成後，會出現銜接按鈕，允許使用者移動到下一個 Agent
- 僅在 VS Code (1.106+ 版本) 中受支援
- 詳細資訊請參閱下方的「銜接組態」章節

## 銜接組態 (Handoffs Configuration)

銜接可讓您建立引導式的循序工作流程，在自訂 Agent 之間無縫切換。這對於編排多步驟開發工作流程非常有用，使用者可以在進入下一步之前檢視並核准每個步驟。

### 常見銜接模式

- **規劃 → 實作**：在規劃 Agent 中產生計畫，然後銜接到實作 Agent 開始撰寫程式碼
- **實作 → 檢閱**：完成實作，然後切換到程式碼檢閱 Agent 以檢查品質和安全性問題
- **撰寫失敗測試 → 撰寫通過測試**：產生失敗的測試，然後銜接以實作使這些測試通過的程式碼
- **研究 → 文件**：研究一個主題，然後切換到文件 Agent 來撰寫指南

### 銜接 Frontmatter 結構

在 Agent 檔案的 YAML Frontmatter 中使用 `handoffs` 欄位定義銜接：

```yaml
---
description: 'Agent 的簡短描述'
name: 'Agent 名稱'
tools: ['search', 'read']
handoffs:
  - label: 開始實作
    agent: implementation
    prompt: '現在實作上方概述的計畫。'
    send: false
  - label: 程式碼檢閱
    agent: code-review
    prompt: '請檢閱實作的品質和安全性問題。'
    send: false
---
```

### 銜接屬性

清單中的每個銜接都必須包含以下屬性：

| 屬性 | 類型 | 必要 | 描述 |
|----------|------|----------|-------------|
| `label` | 字串 | 是 | 顯示在對話介面銜接按鈕上的文字 |
| `agent` | 字串 | 是 | 要切換到的目標 Agent 識別碼（名稱或不含 `.agent.md` 的檔案名稱） |
| `prompt` | 字串 | 否 | 預填在目標 Agent 對話輸入框中的提示詞文字 |
| `send` | 布林值 | 否 | 如果為 `true`，則自動將提示詞提交給目標 Agent（預設值：`false`） |

### 銜接行為

- **按鈕顯示**：銜接按鈕會在對話回應完成後作為互動式建議出現
- **內容保存**：當使用者選擇銜接按鈕時，他們會切換到目標 Agent，並保持對話內容
- **預填提示詞**：如果指定了 `prompt`，它會出現在目標 Agent 的對話輸入框中
- **手動 vs 自動**：當 `send: false` 時，使用者必須檢視並手動傳送預填的提示詞；當 `send: true` 時，提示詞會自動提交

### 銜接組態指引

#### 何時使用銜接

- **多步驟工作流程**：將複雜工作分解到專業的 Agent 中
- **品質閘門**：確保實作階段之間的檢閱步驟
- **引導式程序**：引導使用者完成結構化的開發程序
- **技能轉移**：從規劃/設計專家轉移到實作/測試專家

#### 最佳實務

- **清楚的標籤**：使用清楚指示下一步的行動導向標籤
  - ✅ 良好："開始實作"、"檢閱安全性"、"撰寫測試"
  - ❌ 避免："下一步"、"前往 Agent"、"做點什麼"

- **相關的提示詞**：提供引用已完成工作的內容感知提示詞
  - ✅ 良好：`'現在實作上方概述的計畫。'`
  - ❌ 避免：沒有背景資訊的通用提示詞

- **選擇性使用**：不要為每個可能的 Agent 都建立銜接；專注於邏輯上的工作流程轉換
  - 每個 Agent 限制在 2-3 個最相關的後續步驟
  - 僅為在工作流程中自然銜接的 Agent 增加銜接

- **Agent 相依性**：在建立銜接之前確保目標 Agent 存在
  - 指向不存在 Agent 的銜接將被靜默忽略
  - 測試銜接以驗證它們是否按預期運作

- **提示詞內容**：保持提示詞簡潔且具備行動引導性
  - 引用目前 Agent 的工作，不要重複內容
  - 提供目標 Agent 可能需要的任何必要背景資訊

### 範例：完整工作流程

以下是三個具有銜接功能並建立完整工作流程的 Agent 範例：

**規劃 Agent** (`planner.agent.md`)：
```yaml
---
description: '為新功能或重構產生實作計畫'
name: 'Planner'
tools: ['search', 'read']
handoffs:
  - label: 實作計畫
    agent: implementer
    prompt: '實作上方概述的計畫。'
    send: false
---
# 規劃 Agent
你是一位規劃專家。你的工作是：
1. 分析需求
2. 將工作分解為邏輯步驟
3. 產生詳細的實作計畫
4. 識別測試需求

不要撰寫任何程式碼 - 僅專注於規劃。
```

**實作 Agent** (`implementer.agent.md`)：
```yaml
---
description: '根據計畫或規格實作程式碼'
name: 'Implementer'
tools: ['read', 'edit', 'search', 'execute']
handoffs:
  - label: 檢閱實作
    agent: reviewer
    prompt: '請檢閱此實作的程式碼品質、安全性以及對最佳實務的遵循程度。'
    send: false
---
# 實作 Agent
你是一位實作專家。你的工作是：
1. 遵循提供的計畫或規格
2. 撰寫乾淨、易於維護的程式碼
3. 包含適當的註釋和文件
4. 遵循專案編碼標準

完整且透徹地實作解決方案。
```

**檢閱 Agent** (`reviewer.agent.md`)：
```yaml
---
description: '檢閱程式碼品質、安全性以及最佳實務'
name: 'Reviewer'
tools: ['read', 'search']
handoffs:
  - label: 回到規劃
    agent: planner
    prompt: '檢閱上方的回饋，並決定是否需要新計畫。'
    send: false
---
# 程式碼檢閱 Agent
你是一位程式碼檢閱專家。你的工作是：
1. 檢查程式碼品質和可維護性
2. 識別安全性問題和漏洞
3. 驗證是否符合專案標準
4. 建議改進措施

對實作提供建設性的回饋。
```

此工作流程允許開發人員：
1. 從規劃 Agent 開始建立詳細計畫
2. 銜接到實作 Agent 根據計畫撰寫程式碼
3. 銜接到檢閱 Agent 檢查實作情況
4. 如果發現重大問題，可以選擇銜接回規劃階段

### 版本相容性

- **VS Code**：VS Code 1.106 及更高版本支援銜接
- **GitHub.com**：目前不支援；Agent 轉換工作流程使用不同的機制
- **其他 IDE**：支援有限或不支援；專注於 VS Code 實作以獲得最大相容性

## 工具組態 (Tool Configuration)

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

所有別名皆不區分大小寫：

| 別名 | 替代名稱 | 類別 | 描述 |
|-------|------------------|----------|-------------|
| `execute` | shell, Bash, powershell | Shell 執行 | 在適當的 shell 中執行指令 |
| `read` | Read, NotebookRead, view | 檔案讀取 | 讀取檔案內容 |
| `edit` | Edit, MultiEdit, Write, NotebookEdit | 檔案編輯 | 編輯和修改檔案 |
| `search` | Grep, Glob, search | 程式碼搜尋 | 搜尋檔案或檔案中的文字 |
| `agent` | custom-agent, Task | Agent 呼叫 | 呼叫其他自訂 Agent |
| `web` | WebSearch, WebFetch | 網路存取 | 擷取網路內容並進行搜尋 |
| `todo` | TodoWrite | 工作管理 | 建立和管理工作清單（僅限 VS Code） |

### 內建 MCP 伺服器工具

**GitHub MCP 伺服器**：
```yaml
tools: ['github/*']  # 所有 GitHub 工具
tools: ['github/get_file_contents', 'github/search_repositories']  # 特定工具
```
- 預設提供所有唯讀工具
- Token 範圍限定於來源存放庫

**Playwright MCP 伺服器**：
```yaml
tools: ['playwright/*']  # 所有 Playwright 工具
tools: ['playwright/navigate', 'playwright/screenshot']  # 特定工具
```
- 設定為僅存取 localhost
- 用於瀏覽器自動化和測試

### 工具選擇最佳實務

- **最小權限原則**：僅啟用 Agent 目的所需的工具
- **安全性**：除非明確需要，否則限制 `execute` 存取
- **專注**：更少的工具 = 更清晰的 Agent 目的和更好的效能
- **文件**：註釋說明為什麼複雜組態需要特定的工具

## 子 Agent 呼叫 (Agent 編排)

Agent 可以使用 `runSubagent` 呼叫其他 Agent 來編排多步驟工作流程。

### 運作方式

在工具清單中包含 `agent` 以啟用子 Agent 呼叫：

```yaml
tools: ['read', 'edit', 'search', 'agent']
```

然後使用 `runSubagent` 呼叫其他 Agent：

```javascript
const result = await runSubagent({
  description: '此步驟的作用',
  prompt: `你是一位 [Specialist] 專家。

背景資訊：
- 參數：${parameterValue}
- 輸入：${inputPath}
- 輸出：${outputPath}

工作：
1. 執行特定工作
2. 將結果寫入輸出位置
3. 回傳完成摘要`
});
```

### 基本模式

使用以下結構建構每個子 Agent 呼叫：

1. **description**：子 Agent 呼叫用途的簡短單行描述
2. **prompt**：包含替代變數的詳細指令

提示詞應包含：
- 子 Agent 是誰（專家角色）
- 它需要什麼背景資訊（參數、路徑）
- 做什麼（具體工作）
- 在哪裡寫入輸出
- 回傳什麼（摘要）

### 範例：多步驟處理

```javascript
// 第 1 步：處理資料
const processing = await runSubagent({
  description: '轉換原始輸入資料',
  prompt: `你是一位資料處理 (Data Processor) 專家。

專案：${projectName}
輸入：${basePath}/raw/
輸出：${basePath}/processed/

工作：
1. 讀取輸入目錄中的所有檔案
2. 應用轉換
3. 將處理後的檔案寫入輸出
4. 建立摘要：${basePath}/processed/summary.md

回傳：處理的檔案數量和發現的任何問題`
});

// 第 2 步：分析（相依於第 1 步）
const analysis = await runSubagent({
  description: '分析處理後的資料',
  prompt: `你是一位資料分析 (Data Analyst) 專家。

專案：${projectName}
輸入：${basePath}/processed/
輸出：${basePath}/analysis/

工作：
1. 從輸入中讀取處理後的檔案
2. 產生分析報告
3. 寫入至：${basePath}/analysis/report.md

回傳：主要發現和識別出的模式`
});
```

### 關鍵點

- **在提示詞中傳遞變數**：對所有動態值使用 `${variableName}`
- **保持提示詞專注**：為每個子 Agent 提供清晰、特定的工作
- **回傳摘要**：每個子 Agent 都應報告其完成的工作
- **循序執行**：當步驟互相依賴時，使用 `await` 保持順序
- **錯誤處理**：在繼續執行相依步驟之前檢查結果

### ⚠️ 工具可用性要求

**關鍵**：如果子 Agent 需要特定的工具（例如 `edit`、`execute`、`search`），編排者必須在自己的 `tools` 清單中包含這些工具。子 Agent 無法存取其父編排者不可用的工具。

**範例**：
```yaml
# 如果你的子 Agent 需要編輯檔案、執行指令或搜尋程式碼
tools: ['read', 'edit', 'search', 'execute', 'agent']
```

編排者的工具權限充當所有被呼叫子 Agent 的上限。仔細規劃你的工具清單，以確保所有子 Agent 都有其所需的工具。

### ⚠️ 重要限制

**子 Agent 編排不適合大規模資料處理。** 在以下情況下請避免使用 `runSubagent`：
- 處理數百或數千個檔案
- 處理大型資料集
- 對大型程式碼庫進行批量轉換
- 編排超過 5-10 個循序步驟

每次子 Agent 呼叫都會增加延遲和上下文開銷。對於高流量處理，請直接在單個 Agent 中實作邏輯。僅對針對專注、可管理資料集的專業工作協調使用編排。

## Agent 提示詞結構

Frontmatter 下方的 Markdown 內容定義了 Agent 的行為、專業知識和指令。結構良好的提示詞通常包含：

1. **Agent 身份和角色**：Agent 是誰及其主要角色
2. **核心職責**：Agent 執行的具體工作
3. **方式和方法**：Agent 如何工作以完成任務
4. **指引和約束**：要做/避免什麼以及品質標準
5. **輸出預期**：預期的輸出格式和品質

### 提示詞撰寫最佳實務

- **具體且直接**：使用祈使語句（「分析」、「產生」）；避免模糊術語
- **定義邊界**：清楚說明範圍限制和約束
- **包含背景資訊**：解釋領域專業知識並引用相關框架
- **專注於行為**：描述 Agent 應該如何思考和工作
- **使用結構化格式**：標題、點列式項目和列表使提示詞易於掃描

## 變數定義與擷取

Agent 可以定義動態參數，從使用者輸入中擷取值，並在整個 Agent 行為和子 Agent 通訊中使用。這實現了靈活、具備內容感知能力的 Agent，能夠適應使用者提供的資料。

### 何時使用變數

**在以下情況下使用變數**：
- Agent 行為取決於使用者輸入
- 需要將動態值傳遞給子 Agent
- 希望使 Agent 可在不同背景下重複使用
- 需要參數化的工作流程
- 需要追蹤或引用使用者提供的內容

**範例**：
- 從使用者提示詞中擷取專案名稱
- 為管線處理擷取憑證名稱
- 識別檔案路徑或目錄
- 擷取組態選項
- 解析功能名稱或模組識別碼

### 變數宣告模式

在 Agent 提示詞早期定義變數章節，以記錄預期的參數：

```markdown
# Agent 名稱

## 動態參數

- **參數名稱**：描述與用法
- **另一個參數**：如何擷取和使用

## 你的任務

處理 [參數名稱] 以完成 [工作]。
```

### 變數擷取方法

#### 1. **明確的使用者輸入**
如果提示詞中未偵測到變數，請要求使用者提供：

```markdown
## 你的任務

透過分析你的程式碼庫來處理專案。

### 第 1 步：識別專案
如果未提供專案名稱，請**詢問使用者**：
- 專案名稱或識別碼
- 基本路徑或目錄位置
- 組態類型（如果適用）

使用此資訊來為所有後續工作提供背景資訊。
```

#### 2. **從提示詞隱含擷取**
從使用者的自然語言輸入中自動擷取變數：

```javascript
// 範例：從使用者輸入中擷取憑證名稱
const userInput = "處理我的憑證";

// 擷取關鍵資訊
const certificationName = extractCertificationName(userInput);
// 結果："我的憑證"

const basePath = `certifications/${certificationName}`;
// 結果："certifications/我的憑證"
```

#### 3. **內容感知的變數解析**
使用檔案內容或工作區資訊來衍生變數：

```markdown
## 變數解析策略

1. **來自使用者提示詞**：首先，在使用者輸入中尋找明確的提及
2. **來自檔案內容**：檢查目前的檔案名稱或路徑
3. **來自工作區**：使用工作區資料夾或動態專案
4. **來自設定**：參考組態檔案
5. **詢問使用者**：如果上述方法都失敗，要求提供缺失的資訊
```

### 在 Agent 提示詞中使用變數

#### 指令中的變數替換

在 Agent 提示詞中使用範本變數使其具備動態性：

```markdown
# Agent 名稱

## 動態參數
- **專案名稱**：${projectName}
- **基本路徑**：${basePath}
- **輸出目錄**：${outputDir}

## 你的任務

處理位於 `${basePath}` 的 **${projectName}** 專案。

## 處理步驟

1. 從 `${basePath}/input/` 讀取輸入
2. 根據專案組態處理檔案
3. 將結果寫入：`${outputDir}/`
4. 產生摘要報告

## 品質標準

- 維持 **${projectName}** 的專案特定編碼標準
- 遵循目錄結構：`${basePath}/[structure]`
```

#### 將變數傳遞給子 Agent

呼叫子 Agent 時，透過提示詞中的範本變數傳遞所有內容：

```javascript
// 擷取並準備變數
const basePath = `projects/${projectName}`;
const inputPath = `${basePath}/src/`;
const outputPath = `${basePath}/docs/`;

// 傳遞給已替換所有變數的子 Agent
const result = await runSubagent({
  description: '產生專案文件',
  prompt: `你是一位文件 (Documentation) 專家。

專案：${projectName}
輸入：${inputPath}
輸出：${outputPath}

工作：
1. 從 ${inputPath} 讀取原始檔案
2. 產生完整的文件
3. 寫入至 ${outputPath}/index.md
4. 包含程式碼範例和用法指南

回傳：產生的文件摘要（檔案數量、字數）`
});
```

子 Agent 會接收嵌入在提示詞中的所有必要背景資訊。變數在傳送提示詞之前已解析，因此子 Agent 使用具體的路徑和值工作，而不是變數佔位符。

### 實際範例：程式碼檢閱編排者

一個透過多個專業 Agent 驗證程式碼的簡單編排者範例：

```javascript
async function reviewCodePipeline(repositoryName, prNumber) {
  const basePath = `projects/${repositoryName}/pr-${prNumber}`;

  // 第 1 步：安全性檢閱
  const security = await runSubagent({
    description: '掃描安全性漏洞',
    prompt: `你是一位安全性檢閱 (Security Reviewer) 專家。

存放庫：${repositoryName}
PR：${prNumber}
程式碼：${basePath}/changes/

工作：
1. 掃描程式碼中的 OWASP Top 10 漏洞
2. 檢查隱碼攻擊、驗證缺陷
3. 將發現寫入至 ${basePath}/security-review.md

回傳：發現的關鍵、高度和中度問題清單`
  });

  // 第 2 步：測試涵蓋範圍檢查
  const coverage = await runSubagent({
    description: '驗證變更的測試涵蓋範圍',
    prompt: `你是一位測試涵蓋範圍 (Test Coverage) 專家。

存放庫：${repositoryName}
PR：${prNumber}
變更：${basePath}/changes/

工作：
1. 分析受修改檔案的程式碼涵蓋範圍
2. 識別未經測試的關鍵路徑
3. 將報告寫入至 ${basePath}/coverage-report.md

回傳：目前的涵蓋範圍百分比和差距`
  });

  // 第 3 步：彙總結果
  const finalReport = await runSubagent({
    description: '編譯所有檢閱發現',
    prompt: `你是一位檢閱彙總 (Review Aggregator) 專家。

存放庫：${repositoryName}
報告：${basePath}/*.md

工作：
1. 從 ${basePath}/ 讀取所有檢閱報告
2. 將發現綜合成單一報告
3. 決定最終裁定 (APPROVE/NEEDS_FIXES/BLOCK)
4. 寫入至 ${basePath}/final-review.md

回傳：最終裁定和執行摘要`
  });

  return finalReport;
}
```

此模式適用於任何編排情境：擷取變數、以清晰的內容呼叫子 Agent、等待結果。


### 變數最佳實務

#### 1. **清晰的文件**
務必記錄預期的變數：

```markdown
## 必要變數
- **projectName**：專案名稱（字串，必要）
- **basePath**：專案檔案的根目錄（路徑，必要）

## 選填變數
- **mode**：處理模式 - 快速/標準/詳細 (enum，預設：標準)
- **outputFormat**：輸出格式 - markdown/json/html (enum，預設：markdown)

## 衍生變數
- **outputDir**：自動設定為 ${basePath}/output
- **logFile**：自動設定為 ${basePath}/.log.md
```

#### 2. **一致的命名**
使用一致的變數命名慣例：

```javascript
// 良好：清晰、具備描述性的命名
const variables = {
  projectName,          // 要處理哪個專案
  basePath,            // 專案檔案位置
  outputDirectory,     // 儲存結果的位置
  processingMode,      // 如何處理（詳細程度）
  configurationPath    // 組態檔案位置
};

// 避免：模糊或不一致
const bad_variables = {
  name,     // 太通用
  path,     // 不清楚是哪個路徑
  mode,     // 太短
  config    // 太模糊
};
```

#### 3. **驗證與約束**
記錄有效值和約束：

```markdown
## 變數約束

**projectName**：
- 類型：字串（允許英數字、連字號、底線）
- 長度：1-100 個字元
- 必要：是
- 模式：`/^[a-zA-Z0-9_-]+$/`

**processingMode**：
- 類型：enum
- 有效值："quick" (< 5min), "standard" (5-15min), "detailed" (15+ min)
- 預設："standard"
- 必要：否
```

## MCP 伺服器組態 (僅限組織/企業)

MCP 伺服器透過額外工具擴充 Agent 能力。僅組織和企業層級的 Agent 支援。

### 組態格式

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

- **type**：伺服器類型 (`'local'` 或 `'stdio'`)
- **command**：啟動 MCP 伺服器的指令
- **args**：指令引數陣列
- **tools**：要從此伺服器啟用的工具（`["*"]` 代表全部）
- **env**：環境變數（支援祕密資訊）

### 環境變數與祕密資訊

祕密資訊必須在存放庫設定的 "copilot" 環境下進行組態。

**支援的語法**：
```yaml
env:
  # 僅環境變數
  VAR_NAME: COPILOT_MCP_ENV_VAR_VALUE

  # 帶有前綴的變數
  VAR_NAME: $COPILOT_MCP_ENV_VAR_VALUE
  VAR_NAME: ${COPILOT_MCP_ENV_VAR_VALUE}

  # GitHub Actions 風格（僅限 YAML）
  VAR_NAME: ${{ secrets.COPILOT_MCP_ENV_VAR_VALUE }}
  VAR_NAME: ${{ var.COPILOT_MCP_ENV_VAR_VALUE }}
```

## 檔案組織與命名

### 存放庫層級 Agent
- 位置：`.github/agents/`
- 範圍：僅在特定存放庫中可用
- 存取：使用存放庫設定的 MCP 伺服器

### 組織/企業層級 Agent
- 位置：`.github-private/agents/`（然後移至 `agents/` 根目錄）
- 範圍：在組織/企業的所有存放庫中可用
- 存取：可以設定專用的 MCP 伺服器

### 命名慣例
- 使用小寫字母並配合連字號：`test-specialist.agent.md`
- 名稱應反映 Agent 目的
- 檔案名稱成為預設 Agent 名稱（如果未指定 `name`）
- 允許的字元：`.`, `-`, `_`, `a-z`, `A-Z`, `0-9`

## Agent 處理與行為

### 版本控制
- 根據 Agent 檔案的 Git commit SHA
- 為不同的 Agent 版本建立分支/標籤
- 使用存放庫/分支的最新版本進行實例化
- PR 互動使用相同的 Agent 版本以保持一致性

### 名稱衝突
優先順序（由高到低）：
1. 存放庫層級 Agent
2. 組織層級 Agent
3. 企業層級 Agent

較低層級的組態會覆寫同名的較高層級組態。

### 工具處理
- `tools` 清單過濾可用的工具（內建和 MCP）
- 未指定工具 = 啟用所有工具
- 空清單 (`[]`) = 停用所有工具
- 特定清單 = 僅啟用這些工具
- 無法識別的工具名稱將被忽略（允許特定環境的工具）

### MCP 伺服器處理順序
1. 開箱即用的 MCP 伺服器（例如 GitHub MCP）
2. 自訂 Agent MCP 組態（僅限組織/企業）
3. 存放庫層級 MCP 組態

每個層級都可以覆寫前一層級的設定。

## Agent 建立檢查清單

### Frontmatter
- [ ] `description` 欄位存在且具備描述性（50-150 字元）
- [ ] `description` 以單引號括起來
- [ ] 指定 `name`（選填但建議使用）
- [ ] 適當組態 `tools`（或有意省略）
- [ ] 指定 `model` 以獲得最佳效能
- [ ] 如果是特定環境，設定 `target`
- [ ] 如果需要手動選擇，將 `infer` 設定為 `false`

### 提示詞內容
- [ ] 定義清晰的 Agent 身份和角色
- [ ] 明確列出核心職責
- [ ] 解釋方式和方法
- [ ] 指定指引和約束
- [ ] 記錄輸出預期
- [ ] 在有幫助的地方提供範例
- [ ] 指令具體且具備行動引導性
- [ ] 清楚定義範圍和邊界
- [ ] 總內容在 30,000 字元以下

### 檔案結構
- [ ] 檔案名稱遵循小寫連字號慣例
- [ ] 檔案放置在正確的目錄中（`.github/agents/` 或 `agents/`）
- [ ] 檔案名稱僅使用允許的字元
- [ ] 副檔名為 `.agent.md`

### 品質保證
- [ ] Agent 目的唯一且不重複
- [ ] 工具精簡且必要
- [ ] 指令清晰且無歧義
- [ ] 已使用具代表性的任務對 Agent 進行測試
- [ ] 文件參考資料是最新的
- [ ] 已處理安全性考量（如果適用）

## 常見 Agent 模式

### 測試專家 (Testing Specialist)
**目的**：專注於測試涵蓋範圍和品質
**工具**：所有工具（用於全面的測試建立）
**方式**：分析、識別差距、撰寫測試，避免修改生產環境程式碼

### 實作規劃者 (Implementation Planner)
**目的**：建立詳細的技術計畫和規格
**工具**：限制為 `['read', 'search', 'edit']`
**方式**：分析需求、建立文件，避免實作

### 程式碼檢閱者 (Code Reviewer)
**目的**：檢閱程式碼品質並提供回饋
**工具**：僅限 `['read', 'search']`
**方式**：分析、建議改進，不直接進行修改

### 重構專家 (Refactoring Specialist)
**目的**：改進程式碼結構和可維護性
**工具**：`['read', 'search', 'edit']`
**方式**：分析模式、提議重構、安全地實作

### 安全性稽核者 (Security Auditor)
**目的**：識別安全性問題和漏洞
**工具**：`['read', 'search', 'web']`
**方式**：掃描程式碼、對照 OWASP 進行檢查、報告發現

## 應避免的常見錯誤

### Frontmatter 錯誤
- ❌ 缺失 `description` 欄位
- ❌ 描述未以引號括起來
- ❌ 未檢查文件即使用無效的工具名稱
- ❌ 錯誤的 YAML 語法（縮排、引號）

### 工具組態問題
- ❌ 不必要地授權過多工具存取權
- ❌ 遺漏 Agent 目的所需的必要工具
- ❌ 未一致地使用工具別名
- ❌ 忘記 MCP 伺服器命名空間 (`server-name/tool`)

### 提示詞內容問題
- ❌ 模糊、有歧義的指令
- ❌ 衝突或矛盾的指引
- ❌ 缺乏明確的範圍定義
- ❌ 缺失輸出預期
- ❌ 指令過於冗長（超過字元限制）
- ❌ 對於複雜任務沒有範例或背景資訊

### 組織問題
- ❌ 檔案名稱未反映 Agent 目的
- ❌ 目錄錯誤（混淆存放庫 vs 組織層級）
- ❌ 在檔案名稱中使用空格或特殊字元
- ❌ 重複的 Agent 名稱導致衝突

## 測試與驗證

### 手動測試
1. 建立具有正確 Frontmatter 的 Agent 檔案
2. 重新載入 VS Code 或重新整理 GitHub.com
3. 從 Copilot Chat 的下拉選單中選擇 Agent
4. 使用具代表性的使用者查詢進行測試
5. 驗證工具存取是否按預期運作
6. 確認輸出符合預期

### 整合測試
- 測試 Agent 處理範圍內的不同檔案類型
- 驗證 MCP 伺服器連線（如果已組態）
- 檢查 Agent 在缺少背景資訊時的行為
- 測試錯誤處理和邊緣案例
- 驗證 Agent 切換和銜接
  
### 品質檢查
- 逐一執行 Agent 建立檢查清單
- 對照常見錯誤清單進行審閱
- 與存放庫中的範例 Agent 進行比較
- 對複雜的 Agent 進行同儕審閱
- 記錄任何特殊的組態需求

## 其他資源

### 官方文件
- [建立自訂 Agent](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [自訂 Agent 組態](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [VS Code 中的自訂 Agent](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [MCP 整合](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)

### 社群資源
- [Awesome Copilot Agents 收藏](https://github.com/github/awesome-copilot/tree/main/agents)
- [自訂程式庫範例](https://docs.github.com/en/copilot/tutorials/customization-library/custom-agents)
- [你的第一個自訂 Agent 教學](https://docs.github.com/en/copilot/tutorials/customization-library/custom-agents/your-first-custom-agent)

### 相關檔案
- [提示詞檔案指引](./prompt.instructions.md) - 用於建立提示詞檔案
- [指令指引](./instructions.instructions.md) - 用於建立指令檔案

## 版本相容性說明

### GitHub.com (Coding Agent)
- ✅ 完整支援所有標準 Frontmatter 屬性
- ✅ 存放庫和組織/企業層級 Agent
- ✅ MCP 伺服器組態（組織/企業）
- ❌ 不支援 `model`, `argument-hint`, `handoffs` 屬性

### VS Code / JetBrains / Eclipse / Xcode
- ✅ 支援用於 AI 模型選擇的 `model` 屬性
- ✅ 支援 `argument-hint` 和 `handoffs` 屬性
- ✅ 使用者設定檔和工作區層級 Agent
- ❌ 無法在存放庫層級組態 MCP 伺服器
- ⚠️ 某些屬性的行為可能有所不同

為多個環境建立 Agent 時，請專注於通用屬性，並在所有目標環境中進行測試。必要時使用 `target` 屬性來建立特定環境的 Agent。
