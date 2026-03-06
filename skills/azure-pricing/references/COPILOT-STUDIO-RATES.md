# Copilot Studio — 計費費率與估算 (Billing Rates & Estimation)

> 來源：[計費費率與管理](https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management)
> 估算器：[Microsoft 代理人使用量估算器](https://microsoft.github.io/copilot-studio-estimator/)
> 授權指南：[Copilot Studio 授權指南](https://go.microsoft.com/fwlink/?linkid=2320995)

## Copilot 點數費率 (Copilot Credit Rate)

**1 Copilot 點數 = $0.01 USD**

## 計費費率（快取快照 —— 最後更新於 2026 年 3 月）

**重要提示：請務必優先使用內建工具獲取來自上述來源 URL 的即時費率。僅在無法使用網頁獲取功能時，才將此表作為備援使用。**

| 功能 | 費率 | 單位 |
|---|---|---|
| 傳統回答 (Classic answer) | 1 | 每個回應 |
| 生成式回答 (Generative answer) | 2 | 每個回應 |
| 代理人動作 (Agent action) | 5 | 每個動作（觸發、深度推理、主題轉換、電腦使用） |
| 租用戶圖表基礎連接 (Tenant graph grounding) | 10 | 每個訊息 |
| 代理人流程動作 (Agent flow actions) | 13 | 每 100 個流程動作 |
| 文字與生成式 AI 工具（基本） | 1 | 每 10 個回應 |
| 文字與生成式 AI 工具（標準） | 15 | 每 10 個回應 |
| 文字與生成式 AI 工具（進階） | 100 | 每 10 個回應 |
| 內容處理工具 | 8 | 每個頁面 |

### 附註

- **傳統回答**：預先定義、由製作者手動撰寫的回應。具備靜態特性 —— 除非製作者更新，否則不會改變。
- **生成式回答**：使用 AI 模型 (GPT) 動態產生。根據上下文與知識來源進行調整。
- **租用戶圖表基礎連接**：對整個租用戶範圍的 Microsoft Graph 進行 RAG，包含透過連接器存取的外部資料。每個代理人可選用此功能。
- **代理人動作**：在活動地圖中可見的步驟，例如觸發、深度推理、主題轉換。包含「使用電腦的代理人」(Computer-Using Agents)。
- **文字與生成式 AI 工具**：內嵌於代理人中的提示 (Prompt) 工具。根據底層語言模型分為三個層級（基本/標準/進階）。
- **代理人流程動作**：預先定義的流程動作序列，在執行時每個步驟不需要代理人的推理/編排。

### 推理模型計費 (Reasoning Model Billing)

當使用具備推理能力的模型時：

```
總成本 = 該操作的功能費率 + 文字與生成式 AI 工具（進階）每 10 個回應的費率
```

範例：使用推理模型的生成式回答成本為 **2 點數**（生成式回答）**+ 10 點數**（進階回應單價，由 100/10 比例計算）。

## 估算公式

### 輸入參數

| 參數 | 說明 |
|---|---|
| `users` | 終端使用者人數 |
| `interactions_per_month` | 每位使用者每月平均互動次數 |
| `knowledge_pct` | 來自知識來源的回應百分比 % (0-100) |
| `tenant_graph_pct` | 在知識回應中，使用租用戶圖表基礎連接的百分比 % (0-100) |
| `tool_prompt` | 每次工作階段平均的提示工具呼叫次數 |
| `tool_agent_flow` | 每次工作階段平均的代理人流程呼叫次數 |
| `tool_computer_use` | 每次工作階段平均的電腦使用呼叫次數 |
| `tool_custom_connector` | 每次工作階段平均的自訂連接器呼叫次數 |
| `tool_mcp` | 每次工作階段平均的 MCP (Model Context Protocol) 呼叫次數 |
| `tool_rest_api` | 每次工作階段平均的 REST API 呼叫次數 |
| `prompts_basic` | 每次工作階段平均的基本 AI 提示使用次數 |
| `prompts_standard` | 每次工作階段平均的標準 AI 提示使用次數 |
| `prompts_premium` | 每次工作階段平均的進階 AI 提示使用次數 |

### 運算方式

```
總工作階段數 = 使用者人數 × 每月互動次數

── 知識點數 (Knowledge Credits) ──
tenant_graph_credits    = 總工作階段數 × (knowledge_pct/100) × (tenant_graph_pct/100) × 10
generative_answer_credits = 總工作階段數 × (knowledge_pct/100) × (1 - tenant_graph_pct/100) × 2
classic_answer_credits  = 總工作階段數 × (1 - knowledge_pct/100) × 1

── 代理人工具點數 (Agent Tools Credits) ──
工具呼叫次數 = 總工作階段數 × (prompt + computer_use + custom_connector + mcp + rest_api)
工具點數 = 工具呼叫次數 × 5

── 代理人流程點數 (Agent Flow Credits) ──
流程呼叫次數 = 總工作階段數 × tool_agent_flow
流程點數 = ceil(流程呼叫次數 / 100) × 13

── 提示修改器點數 (Prompt Modifier Credits) ──
基本點數    = ceil(總工作階段數 × prompts_basic / 10) × 1
標準點數 = ceil(總工作階段數 × prompts_standard / 10) × 15
進階點數  = ceil(總工作階段數 × prompts_premium / 10) × 100

── 總計 ──
總點數 = 知識 + 工具 + 流程 + 提示
USD 成本 = 總點數 × 0.01
```

## 計費範例（來自 Microsoft 文件）

### 客戶支援代理人

- 每次工作階段包含 4 次傳統回答 + 2 次生成式回答
- 每天 900 位客戶
- **每日**：`[(4×1) + (2×2)] × 900 = 7,200 點數`
- **每月 (30 天)**：約 216,000 點數 = **約 $2,160**

### 業務績效代理人（租用戶圖表基礎連接）

- 每次工作階段包含 4 次生成式回答 + 4 次租用戶圖表基礎連接回應
- 100 位未經授權的使用者
- **每日**：`[(4×2) + (4×10)] × 100 = 4,800 點數`
- **每月 (30 天)**：約 144,000 點數 = **約 $1,440**

### 訂單處理代理人

- 每次觸發包含 4 次動作呼叫（自主執行）
- **每次觸發**：`4 × 5 = 20 點數`

## 員工 vs 客戶代理人類型

| 代理人類型 | 是否包含在 M365 Copilot 中？ |
|---|---|
| 面向員工 (BtoE) | 當使用者具備 Microsoft 365 Copilot 授權時，傳統回答、生成式回答與租用戶圖表基礎連接皆為零成本 |
| 面向客戶/合作夥伴 | 所有使用量皆依正常標準計費 |

## 超額執行規則 (Overage Enforcement)

- 在達到預付容量的 **125%** 時觸發
- 自訂代理人將被停用（進行中的對話會繼續完成）
- 電子郵件通知會發送給租用戶管理員
- 解決方案：重新分配容量、購買更多容量或啟用隨用隨付

## 即時來源 URL

若要獲取最新費率，請獲取這些頁面的內容：

- [計費費率與管理](https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management)
- [Copilot Studio 授權](https://learn.microsoft.com/en-us/microsoft-copilot-studio/billing-licensing)
- [Copilot Studio 授權指南 (PDF)](https://go.microsoft.com/fwlink/?linkid=2320995)
