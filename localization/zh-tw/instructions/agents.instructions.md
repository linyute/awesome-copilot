---
description: '為 GitHub Copilot 建立自訂 Agent 檔案的指南'
applyTo: '**/*.agent.md'
---

# 自訂 Agent 檔案指南

為 GitHub Copilot 中的特定開發任務提供專業知識，建立有效且易於維護的自訂 Agent 檔案之說明。

## 專案上下文

- 目標受眾：為 GitHub Copilot 建立自訂 Agent 的開發者
- 檔案格式：帶有 YAML frontmatter 的 Markdown
- 檔案命名規範：小寫並使用連字號（例如：`test-specialist.agent.md`）
- 位置：`.github/agents/` 目錄（儲存庫層級）或 `agents/` 目錄（組織/企業層級）
- 目的：定義具有針對特定任務的自訂專業知識、工具和指令的專業 Agent
- 官方文件：https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents

## 必要的前言 (Frontmatter)

每個 Agent 檔案都必須包含具有以下欄位的 YAML frontmatter：

```yaml
---
description: 'Agent 目的和功能的簡短描述'
name: 'Agent 顯示名稱'
tools: ['read', 'edit', 'search']
model: 'Claude Sonnet 4.5'
target: 'vscode'
infer: true
---
```

### 核心前言屬性

#### **description** (必要)
- 單引號字串，清楚說明 Agent 的目的和領域專業知識
- 應簡潔（50-150 個字元）且具備可操作性
- 範例：`'專注於測試涵蓋範圍、品質以及測試最佳實踐'`

#### **name** (選填)
- Agent 在 UI 中的顯示名稱
- 如果省略，預設為檔案名稱（不含 `.md` 或 `.agent.md`）
- 使用詞首大寫 (Title Case) 並具描述性
- 範例：`'測試專家'`

#### **tools** (選填)
- Agent 可以使用的工具名稱或別名清單
- 支援以逗號分隔的字串或 YAML 陣列格式
- 如果省略，Agent 可以存取所有可用工具
- 詳細資訊請參閱下方的「工具配置」部分

#### **model** (強烈建議)
- 指定 Agent 應使用的 AI 模型
- VS Code、JetBrains IDE、Eclipse 和 Xcode 均支援
- 範例：`'Claude Sonnet 4.5'`, `'gpt-4'`, `'gpt-4o'`
- 根據 Agent 的複雜程度和所需功能進行選擇

#### **target** (選填)
- 指定目標環境：`'vscode'` 或 `'github-copilot'`
- 如果省略，Agent 在這兩個環境中皆可用
- 當 Agent 具有特定環境的功能時使用

#### **infer** (選填)
- 布林值，控制 Copilot 是否可以根據上下文自動使用此 Agent
- 如果省略，預設為 `true`
- 設定為 `false` 則需要手動選擇 Agent

#### **metadata** (選填，僅限 GitHub.com)
- 用於 Agent 標註的名稱-值對物件
- 範例：`metadata: { category: 'testing', version: '1.0' }`
- VS Code 不支援

#### **mcp-servers** (選填，僅限組織/企業)
- 設定僅供此 Agent 使用的 MCP 伺服器
- 僅支援組織/企業級 Agent
- 參見下方的「MCP 伺服器配置」部分

## 工具配置

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
| `execute` | shell, Bash, powershell | Shell 執行 | 在適當的 Shell 中執行指令 |
| `read` | Read, NotebookRead, view | 檔案讀取 | 讀取檔案內容 |
| `edit` | Edit, MultiEdit, Write, NotebookEdit | 檔案編輯 | 編輯和修改檔案 |
| `search` | Grep, Glob, search | 程式碼搜尋 | 搜尋檔案或檔案中的文字 |
| `agent` | custom-agent, Task | Agent 呼叫 | 呼叫其他自訂 Agent |
| `web` | WebSearch, WebFetch | 網路存取 | 獲取網頁內容並進行搜尋 |
| `todo` | TodoWrite | 任務管理 | 建立和管理任務清單 (僅限 VS Code) |

### 內建 MCP 伺服器工具

**GitHub MCP 伺服器**：
```yaml
tools: ['github/*']  # 所有 GitHub 工具
tools: ['github/get_file_contents', 'github/search_repositories']  # 特定工具
```
- 預設提供所有唯讀工具
- Token 範圍限定於來源儲存庫

**Playwright MCP 伺服器**：
```yaml
tools: ['playwright/*']  # 所有 Playwright 工具
tools: ['playwright/navigate', 'playwright/screenshot']  # 特定工具
```
- 配置為僅存取 localhost
- 用於瀏覽器自動化和測試

### 工具選擇最佳實踐

- **最小權限原則**：僅啟用 Agent 目的所需的工具
- **安全性**：除非明確需要，否則限制 `execute` 權限
- **專注**：較少的工具 = 更清晰的 Agent 目的和更好的效能
- **文件**：針對複雜配置說明為何需要特定工具

## 子 Agent 呼叫 (Agent 編排)

Agent 可以使用 `runSubagent` 來呼叫其他 Agent，以編排多步驟工作流。

### 運作方式

在工具清單中包含 `agent` 以啟用子 Agent 呼叫：

```yaml
tools: ['read', 'edit', 'search', 'agent']
```

然後使用 `runSubagent` 呼叫其他 Agent：

```javascript
const result = await runSubagent({
  description: '此步驟的作用',
  prompt: `你是 [Specialist] 專家。

上下文：
- 參數：${parameterValue}
- 輸入：${inputPath}
- 輸出：${outputPath}

任務：
1. 執行特定工作
2. 將結果寫入輸出位置
3. 回傳完成摘要`
});
```

### 基本模式

使用以下結構來呼叫每個子 Agent：

1. **description**：子 Agent 呼叫的清楚單行目的
2. **prompt**：帶有替換變數的詳細指令

提示詞 (prompt) 應包含：
- 子 Agent 的身分（專家角色）
- 它需要的內容（參數、路徑）
- 要做什麼（具體任務）
- 在何處寫入輸出
- 回傳什麼（摘要）

### 範例：多步驟處理

```javascript
// 第 1 步：處理資料
const processing = await runSubagent({
  description: '轉換原始輸入資料',
  prompt: `你是資料處理專家。

專案：${projectName}
輸入：${basePath}/raw/
輸出：${basePath}/processed/

任務：
1. 讀取輸入目錄中的所有檔案
2. 執行轉換
3. 將處理後的檔案寫入輸出
4. 建立摘要：${basePath}/processed/summary.md

回傳：已處理的檔案數量以及發現的任何問題`
});

// 第 2 步：分析 (取決於第 1 步)
const analysis = await runSubagent({
  description: '分析處理後的資料',
  prompt: `你是資料分析專家。

專案：${projectName}
輸入：${basePath}/processed/
輸出：${basePath}/analysis/

任務：
1. 從輸入中讀取處理後的檔案
2. 生成分析報告
3. 寫入至：${basePath}/analysis/report.md

回傳：主要發現和識別出的模式`
});
```

### 關鍵點

- **在提示詞中傳遞變數**：針對所有動態值使用 `${variableName}`
- **保持提示詞專注**：為每個子 Agent 提供清晰、具體的任務
- **回傳摘要**：每個子 Agent 應報告它完成了什麼
- **順序執行**：當步驟彼此依賴時，使用 `await` 以維持順序
- **錯誤處理**：在繼續執行後續步驟前檢查結果

### ⚠️ 工具可用性要求

**關鍵**：如果子 Agent 需要特定工具（例如：`edit`、`execute`、`search`），編排者必須在自己的 `tools` 清單中包含這些工具。子 Agent 無法存取其父編排者無法使用的工具。

**範例**：
```yaml
# 如果您的子 Agent 需要編輯檔案、執行指令或搜尋程式碼
tools: ['read', 'edit', 'search', 'execute', 'agent']
```

編排者的工具權限充當所有被呼叫子 Agent 的上限。請仔細規劃您的工具清單，以確保所有子 Agent 都擁有其所需的工具。

### ⚠️ 重要限制

**子 Agent 編排不適合大規模資料處理。** 在以下情況請避免使用 `runSubagent`：
- 處理數百或數千個檔案
- 處理大型資料集
- 在大型程式碼庫上執行批次轉換
- 編排超過 5-10 個連續步驟

每次子 Agent 呼叫都會增加延遲和內容開銷。對於大量處理，請直接在單個 Agent 中實作邏輯。僅在協調針對專注、易於管理的資料集的專業任務時使用編排。

## Agent 提示詞結構

前言下方的 Markdown 內容定義了 Agent 的行為、專業知識和指令。結構良好的提示詞通常包含：

1. **Agent 身分與角色**：Agent 是誰及其主要角色
2. **核心職責**：Agent 執行的具體任務
3. **方法與策略**：Agent 如何完成任務
4. **指南與約束**：要做/避免什麼，以及品質標準
5. **輸出預期**：預期的輸出格式和品質

### 提示詞撰寫最佳實踐

- **具體且直接**：使用祈使語句（如「分析」、「生成」）；避免含糊的詞彙
- **定義邊界**：明確說明範圍限制和約束
- **包含上下文**：說明領域專業知識並參考相關框架
- **專注於行為**：描述 Agent 應如何思考和工作
- **使用結構化格式**：標題、專案符號和列表使提示詞易於掃描

## 變數定義與擷取

Agent 可以定義動態參數，以從使用者輸入中擷取值，並在整個 Agent 行為和子 Agent 通訊中使用。這使得 Agent 能夠靈活地根據使用者提供的資料調整內容。

### 何時使用變數

**在以下情況使用變數**：
- Agent 行為取決於使用者輸入
- 需要將動態值傳遞給子 Agent
- 希望 Agent 在不同上下文中可重複使用
- 需要參數化的工作流
- 需要追蹤或引用使用者提供的上下文

**範例**：
- 從使用者提示詞中擷取專案名稱
- 為流水線處理擷取認證名稱
- 識別檔案路徑或目錄
- 擷取配置選項
- 解析功能名稱或模組識別碼

### 變數宣告模式

在 Agent 提示詞的早期定義變數部分，以記錄預期參數：

```markdown
# Agent 名稱

## 動態參數

- **參數名稱**：描述與用法
- **另一個參數**：如何擷取與使用

## 你的任務

處理 [參數名稱] 以完成 [任務]。
```

### 變數擷取方法

#### 1. **明確的使用者輸入**
如果在提示詞中未偵測到變數，請要求使用者提供：

```markdown
## 你的任務

透過分析您的程式碼庫來處理專案。

### 第 1 步：識別專案
如果未提供專案名稱，請**詢問使用者**：
- 專案名稱或識別碼
- 基本路徑或目錄位置
- 配置類型（如果適用）

使用此資訊來為所有後續任務提供上下文。
```

#### 2. **從提示詞中隱含擷取**
從使用者的自然語言輸入中自動擷取變數：

```javascript
// 範例：從使用者輸入中擷取認證名稱
const userInput = "處理我的認證";

// 擷取關鍵資訊
const certificationName = extractCertificationName(userInput);
// 結果："我的認證"

const basePath = `certifications/${certificationName}`;
// 結果："certifications/我的認證"
```

#### 3. **內容變數解析**
使用檔案內容或工作區資訊來推導變數：

```markdown
## 變數解析策略

1. **來自使用者提示詞**：首先，在使用者輸入中尋找明確提及的內容
2. **來自檔案內容**：檢查目前的檔案名稱或路徑
3. **來自工作區**：使用工作區資料夾或動動態專案
4. **來自設定**：參考配置文件
5. **詢問使用者**：如果上述方法皆失敗，請要求提供缺失的資訊
```

### 在 Agent 提示詞中使用變數

#### 指令中的變數替換

在 Agent 提示詞中使用範本變數使其動態化：

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
2. 根據專案配置處理檔案
3. 將結果寫入至：`${outputDir}/`
4. 生成摘要報告

## 品質標準

- 維持 **${projectName}** 的專案特定程式碼規範
- 遵循目錄結構：`${basePath}/[結構]`
```

#### 將變數傳遞給子 Agent

呼叫子 Agent 時，透過提示詞中的範本變數傳遞所有內容：

```javascript
// 擷取並準備變數
const basePath = `projects/${projectName}`;
const inputPath = `${basePath}/src/`;
const outputPath = `${basePath}/docs/`;

// 使用所有已替換變數的提示詞傳遞給子 Agent
const result = await runSubagent({
  description: '生成專案文件',
  prompt: `你是文件專家。

專案：${projectName}
輸入：${inputPath}
輸出：${outputPath}

任務：
1. 從 ${inputPath} 讀取原始碼檔案
2. 生成完整的專案文件
3. 寫入至 ${outputPath}/index.md
4. 包含程式碼範例和用法指南

回傳：生成的專案文件摘要（檔案數、字數）`
});
```

子 Agent 會接收嵌入在提示詞中的所有必要內容。變數在發送提示詞之前解析，因此子 Agent 使用具體的路徑和值，而非變數佔位符。

### 實際範例：程式碼審核編排器

一個簡單編排器的範例，透過多個專業 Agent 驗證程式碼：

```javascript
async function reviewCodePipeline(repositoryName, prNumber) {
  const basePath = `projects/${repositoryName}/pr-${prNumber}`;

  // 第 1 步：安全性審核
  const security = await runSubagent({
    description: '掃描安全性漏洞',
    prompt: `你是安全性審核專家。

儲存庫：${repositoryName}
PR：${prNumber}
程式碼：${basePath}/changes/

任務：
1. 針對 OWASP Top 10 漏洞掃描程式碼
2. 檢查隱碼攻擊 (injection attacks)、認證缺陷
3. 將發現寫入至 ${basePath}/security-review.md

回傳：發現的嚴重、高風險和中風險問題清單`
  });

  // 第 2 步：測試涵蓋範圍檢查
  const coverage = await runSubagent({
    description: '驗證變更的測試涵蓋範圍',
    prompt: `你是測試涵蓋範圍專家。

儲存庫：${repositoryName}
PR：${prNumber}
變更：${basePath}/changes/

任務：
1. 分析已修改檔案的程式碼涵蓋範圍
2. 識別未測試的關鍵路徑
3. 將報告寫入至 ${basePath}/coverage-report.md

回傳：目前的涵蓋範圍百分比和差距`
  });

  // 第 3 步：彙整結果
  const finalReport = await runSubagent({
    description: '彙整所有審核發現',
    prompt: `你是審核彙整專家。

儲存庫：${repositoryName}
報告：${basePath}/*.md

任務：
1. 讀取 ${basePath}/ 中的所有審核報告
2. 將發現綜合成單一報告
3. 決定整體判定結果（核准/需要修正/封鎖）
4. 寫入至 ${basePath}/final-review.md

回傳：最終判定和執行摘要`
  });

  return finalReport;
}
```

此模式適用於任何編排場景：擷取變數、以清晰的內容呼叫子 Agent、等待結果。


### 變數最佳實踐

#### 1. **清晰的文件**
始終記錄預期的變數：

```markdown
## 必要變數
- **projectName**：專案名稱（字串，必要）
- **basePath**：專案檔案的根目錄（路徑，必要）

## 選填變數
- **mode**：處理模式 - quick/standard/detailed（列舉，預設值：standard）
- **outputFormat**：輸出格式 - markdown/json/html（列舉，預設值：markdown）

## 衍生變數
- **outputDir**：自動設定為 ${basePath}/output
- **logFile**：自動設定為 ${basePath}/.log.md
```

#### 2. **命名一致性**
使用一致的變數命名規範：

```javascript
// 佳：清晰、具描述性的命名
const variables = {
  projectName,          // 要處理的專案
  basePath,            // 專案檔案所在位置
  outputDirectory,     // 儲存結果的位置
  processingMode,      // 如何處理（詳細程度）
  configurationPath    // 設定檔路徑
};

// 應避免：含糊或不一致
const bad_variables = {
  name,     // 太過通用
  path,     // 不清楚是哪個路徑
  mode,     // 太短
  config    // 太過含糊
};
```

#### 3. **驗證與約束**
記錄有效值和約束：

```markdown
## 變數約束

**projectName**：
- 類型：字串（允許字母數字、連字號、底線）
- 長度：1-100 個字元
- 必要：是
- 模式：`/^[a-zA-Z0-9_-]+$/`

**processingMode**：
- 類型：列舉
- 有效值："quick" (< 5 分鐘), "standard" (5-15 分鐘), "detailed" (15 分鐘以上)
- 預設值："standard"
- 必要：否
```

## MCP 伺服器配置 (僅限組織/企業)

MCP 伺服器透過額外工具擴展 Agent 功能。僅支援組織和企業級 Agent。

### 配置格式

```yaml
---
name: my-custom-agent
description: '具備 MCP 整合的 Agent'
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
- **env**：環境變數（支援機密資訊）

### 環境變數與機密資訊 (Secrets)

機密資訊必須在「copilot」環境下的儲存庫設定中進行配置。

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
- 存取：使用儲存庫配置的 MCP 伺服器

### 組織/企業層級 Agent
- 位置：`.github-private/agents/`（然後移動到 `agents/` 根目錄）
- 範圍：組織/企業中的所有儲存庫皆可用
- 存取：可以配置專用的 MCP 伺服器

### 命名規範
- 使用小寫並使用連字號：`test-specialist.agent.md`
- 名稱應反映 Agent 目的
- 檔案名稱成為預設 Agent 名稱（如果未指定 `name`）
- 允許的字元：`.`, `-`, `_`, `a-z`, `A-Z`, `0-9`

## Agent 處理與行為

### 版本控制
- 基於 Agent 檔案的 Git commit SHA
- 為不同的 Agent 版本建立分支/標籤
- 使用儲存庫/分支的最新版本進行實體化
- PR 互動使用相同的 Agent 版本以保持一致性

### 名稱衝突
優先順序（由高至低）：
1. 儲存庫層級 Agent
2. 組織層級 Agent
3. 企業層級 Agent

較低層級的配置會覆寫具有相同名稱的較高層級配置。

### 工具處理
- `tools` 清單會篩選可用的工具（內建和 MCP）
- 未指定工具 = 啟用所有工具
- 空清單 (`[]`) = 停用所有工具
- 特定清單 = 僅啟用這些工具
- 系統會忽略無法辨識的工具名稱（允許特定環境的工具）

### MCP 伺服器處理順序
1. 開箱即用的 MCP 伺服器（例如：GitHub MCP）
2. 自訂 Agent MCP 配置（僅限組織/企業）
3. 儲存庫層級 MCP 配置

每個層級都可以覆寫前一層級的設定。

## Agent 建立檢核表

### 前言 (Frontmatter)
- [ ] `description` 欄位已填寫且具描述性（50-150 個字元）
- [ ] `description` 已用單引號括起來
- [ ] 已指定 `name`（選填，但建議使用）
- [ ] 已正確配置 `tools`（或刻意省略）
- [ ] 已指定 `model` 以獲得最佳效能
- [ ] 如果為特定環境，已設定 `target`
- [ ] 如果需要手動選擇，已將 `infer` 設定為 `false`

### 提示詞內容
- [ ] 已定義明確的 Agent 身分與角色
- [ ] 已明確列出核心職責
- [ ] 已解釋方法與策略
- [ ] 已指定指南與約束
- [ ] 已記錄輸出預期
- [ ] 在有助益之處提供範例
- [ ] 指令具體且具可操作性
- [ ] 已明確定義範圍與邊界
- [ ] 總內容在 30,000 個字元以內

### 檔案結構
- [ ] 檔案名稱遵循小寫且使用連字號的規範
- [ ] 檔案放置在正確的目錄中（`.github/agents/` 或 `agents/`）
- [ ] 檔案名稱僅使用允許的字元
- [ ] 副檔名為 `.agent.md`

### 品質保證
- [ ] Agent 目的具唯一性且不重複
- [ ] 工具精簡且必要
- [ ] 指令清晰且無歧義
- [ ] 已使用具代表性的任務對 Agent 進行測試
- [ ] 文件參考為最新版本
- [ ] 已處理安全性考量（如果適用）

## 常見 Agent 模式

### 測試專家
**目的**：專注於測試涵蓋範圍與品質
**工具**：所有工具（用於全面的測試建立）
**方法**：分析、識別差距、撰寫測試，避免變更實際執行程式碼

### 實作規劃師
**目的**：建立詳細的技術計畫與規格
**工具**：限於 `['read', 'search', 'edit']`
**方法**：分析需求、建立文件，避免實作

### 程式碼審核者
**目的**：審核程式碼品質並提供回饋
**工具**：僅限 `['read', 'search']`
**方法**：分析、建議改進，不直接進行修改

### 重構專家
**目的**：改進程式碼結構與維護性
**工具**：`['read', 'search', 'edit']`
**方法**：分析模式、提出重構建議、安全地實作

### 安全性稽核員
**目的**：識別安全性問題與漏洞
**工具**：`['read', 'search', 'web']`
**方法**：掃描程式碼、對照 OWASP 檢查、報告發現

## 應避免的常見錯誤

### 前言錯誤
- ❌ 缺失 `description` 欄位
- ❌ 說明文字未用引號括起來
- ❌ 在未查閱文件的狀況下使用無效的工具名稱
- ❌ 錯誤的 YAML 語法（縮排、引號）

### 工具配置問題
- ❌ 不必要地授予過多的工具存取權限
- ❌ 遺漏 Agent 目的所需的必要工具
- ❌ 未一致地使用工具別名
- ❌ 忘記 MCP 伺服器命名空間 (`server-name/tool`)

### 提示詞內容問題
- ❌ 含糊、歧義的指令
- ❌ 衝突或矛盾的指南
- ❌ 缺乏明確的範圍定義
- ❌ 缺失輸出預期
- ❌ 過於冗長的指令（超過字元限制）
- ❌ 對於複雜任務缺乏範例或上下文

### 組織性問題
- ❌ 檔案名稱未反映 Agent 目的
- ❌ 目錄錯誤（混淆儲存庫與組織層級）
- ❌ 在檔案名稱中使用空格或特殊字元
- ❌ 重複的 Agent 名稱導致衝突

## 測試與驗證

### 手動測試
1. 使用正確的前言建立 Agent 檔案
2. 重新載入 VS Code 或重新整理 GitHub.com
3. 從 Copilot Chat 的下拉選單中選擇該 Agent
4. 使用具代表性的使用者查詢進行測試
5. 驗證工具存取是否如預期運作
6. 確認輸出符合預期

### 整合測試
- 在範圍內使用不同檔案類型測試 Agent
- 驗證 MCP 伺服器連線（如果已配置）
- 檢查 Agent 在缺失內容時的行為
- 測試錯誤處理和邊際情況
- 驗證 Agent 切換和移交

### 品質檢查
- 逐一檢查 Agent 建立檢核表
- 對照常見錯誤清單進行檢視
- 與儲存庫中的範例 Agent 進行比較
- 針對複雜 Agent 取得同儕審核
- 記錄任何特殊的配置需求

## 其他資源

### 官方文件
- [建立自訂 Agent](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [自訂 Agent 配置](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [VS Code 中的自訂 Agent](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [MCP 整合](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)

### 社群資源
- [Awesome Copilot Agents 集合](https://github.com/github/awesome-copilot/tree/main/agents)
- [自訂化函式庫範例](https://docs.github.com/en/copilot/tutorials/customization-library/custom-agents)
- [您的第一個自訂 Agent 教學](https://docs.github.com/en/copilot/tutorials/customization-library/custom-agents/your-first-custom-agent)

### 相關檔案
- [提示詞檔案指南](./prompt.instructions.md) - 用於建立提示詞檔案
- [指令指南](./instructions.instructions.md) - 用於建立指令檔案

## 版本相容性備註

### GitHub.com (Coding Agent)
- ✅ 完全支援所有標準前言屬性
- ✅ 儲存庫和組織/企業層級 Agent
- ✅ MCP 伺服器配置（組織/企業）
- ❌ 不支援 `model`, `argument-hint`, `handoffs` 屬性

### VS Code / JetBrains / Eclipse / Xcode
- ✅ 支援用於 AI 模型選擇的 `model` 屬性
- ✅ 支援 `argument-hint` 和 `handoffs` 屬性
- ✅ 使用者個人設定檔和工作區層級 Agent
- ❌ 無法在儲存庫層級配置 MCP 伺服器
- ⚠️ 某些屬性的行為可能有所不同

為多個環境建立 Agent 時，請專注於通用屬性，並在所有目標環境中進行測試。必要時使用 `target` 屬性建立特定環境的 Agent。
