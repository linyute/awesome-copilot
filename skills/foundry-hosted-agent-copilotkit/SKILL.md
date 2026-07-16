---
name: foundry-hosted-agent-copilotkit
description: '針對結合了 CopilotKit 前端與透過 AG-UI 協定在 Azure AI Foundry 託管代理程式上之 Microsoft Agent Framework 代理程式的代理程式網頁應用程式，提供持續開發指引 - 新增和管制代理程式工具、連接人機協同（Human-in-the-loop）核准、建構生成式 UI 和共享狀態、偵錯事件串流、安全地升級 pre-1.0 套件，以及部署託管代理程式更新。'
---

# 開發 CopilotKit + AG-UI + Azure AI Foundry 託管代理程式

針對在此技術堆疊上建構的**現有**應用程式執行開發工作：React/Next.js 前端使用 CopilotKit，透過 AG-UI 協定連接到 Microsoft Agent Framework (MAF) 代理程式（Python 或 .NET），該代理程式在 Azure AI Foundry 託管代理程式（付費 Azure 服務；使用可能會產生費用）上執行，或者正針對該代理程式進行開發。

請**勿**使用此技能來建構全新專案。存在專用的腳手架工具（CopilotKit CLI, `azd ai agent init`）；使用這些工具，然後返回此處執行後續所有操作：新增工具、在核准後管制它們、生成式 UI、共享狀態、偵錯、相依性升級以及部署代理程式更新。

## 心理模型

```text
CopilotKit hooks (React)            useFrontendTool / useHumanInTheLoop /
        │                           useRenderToolCall / useCoAgent
        ▼
CopilotKit Runtime (route handler)  agents: { <name>: new HttpAgent({ url }) }
        │  AG-UI events over SSE
        ▼
AG-UI endpoint                      ← 此處所在位置定義了您的架構
        │
        ▼
MAF Agent (tools, approval modes)   → model deployment
```

最重要的一個事實是：**預設情況下，已部署的 Foundry 託管代理程式端點不會發送 AG-UI。** 它會公開一個 OpenAI 回應端點（`.../protocols/openai/responses`）和/或一個原始的 `.../protocols/invocations` 端點。AG-UI 必須在某處產生，而它在何處產生決定了每個功能（尤其是人機協同核准）的行為方式。三種佈線方式在 [references/architecture.md](references/architecture.md) 中有詳細說明。

## 工作流程

針對此堆疊上的每項工作，請遵循以下步驟：

1. **首先識別佈線方式。** 在變更任何內容之前檢查程式碼庫：
   - `add_agent_framework_fastapi_endpoint(...)` (Python) 或 `MapAGUI(...)` (.NET) 包裝了一個同進程代理程式 → 架構 A（同進程 AG-UI 端點）。
   - 託管代理程式其自身的容器提供 AG-UI 服務，並在 `agent.yaml` 中宣告 `protocol: invocations` → 架構 B。
   - 一個單獨的服務在 AG-UI 端點與託管代理程式的 `/responses` 端點之間進行轉譯（在程式碼中尋找 `previous_response_id`、`mcp_approval_response` 或 Foundry `conversation` 物件）→ 架構 C（轉譯橋接器）。
   - 確認前端代理程式名稱：執行階段 `agents` 設定中的鍵、`<CopilotKit>` 提供者上的 `agent` 屬性，以及 `agent.yaml` 中的託管代理程式名稱都必須一致。
2. **立足於即時文件。** 此處的每一層都是預先 1.0 版或預覽版，且在次要版本之間會發生變動。絕不要相信憑記憶記住的 API：
   - MAF 和 Foundry 託管代理程式：在可用時使用 Microsoft Docs MCP 工具，否則閱讀 learn.microsoft.com（`/agent-framework/integrations/ag-ui/`, `/azure/foundry/`）。
   - CopilotKit：docs.copilotkit.ai（Microsoft Agent Framework 區段）。針對已安裝的 `@copilotkit/*` 套件中隨附的 TypeScript 宣告驗證勾點（Hook）與執行階段 API 名稱——名稱經歷了重構（`useCopilotAction` 是舊版；目前名稱包括 `useFrontendTool`、`useHumanInTheLoop`、`useRenderToolCall`、`useCoAgent`）。
   - AG-UI 協定：docs.ag-ui.com（事件參考，dojo 模式）。
3. **使用下方對應的參考資料執行工作。**
4. **進行對抗性驗證。** 能編譯的建構、啟動的開發伺服器，或單次成功的聊天回覆都不是證明的依據。請套用此技能末尾的完成標準。

## 參考資料

視需求載入；每一項都是自足的：

| 參考資料 | 何時載入 |
| --- | --- |
| [references/architecture.md](references/architecture.md) | 選擇或理解佈線方式；本地與部署模式；為什麼存在轉譯橋接器以及它必須處理什麼 |
| [references/patterns.md](references/patterns.md) | 實作 7 種 AG-UI 互動模式中的任何一種（前端工具、後端工具呈現、人機協同、生成式 UI、共享狀態、預測狀態） |
| [references/hitl.md](references/hitl.md) | 新增或偵錯人機協同核准，包括已知的重複執行危害 |
| [references/troubleshooting.md](references/troubleshooting.md) | 任何失敗：每一層的症狀 → 根本原因 → 修正方法對照表 |
| [references/upgrading.md](references/upgrading.md) | 升級任何相依性；版本相容性規則；追蹤的上游問題 |
| [references/deploy-loop.md](references/deploy-loop.md) | 使用 `azd ai agent run` 在本地執行代理程式、部署更新、部署注意事項 |

## 工作手冊

### 新增或修改代理程式工具

1. 在代理程式上定義工具（Python 中為 `@tool`；.NET 中為 `AIFunctionFactory.Create`），並帶有具體類型且已說明的參數。
2. 保持文件字串（Docstrings）符合安全接地：不要在參數說明中為模型必須從實際資料衍生出的欄位放入具體的範例數值——模型會複製字面範例。在工具內部使用預留位置並進行驗證。
3. 傳回緊湊且模型可使用的值；豐富的格式化屬於 UI 呈現，而不是工具結果。
4. 現在決定核准模式：具有副作用的工具獲得 `approval_mode="always_require"`（參見 [references/hitl.md](references/hitl.md)）；唯讀工具保持不受限。
5. 如果工具呼叫應該在 UI 中呈現，請為其新增一個 `useRenderToolCall`/呈現項目（[references/patterns.md](references/patterns.md)）。
6. 即時驗證：透過聊天 UI 觸發工具，確認呼叫和結果串流呈現為 `TOOL_CALL_*` 事件，並確認重新命名或重新鍵入的參數沒有破壞任何解析參數的前端元件。

### 將人機協同（HITL）連接到現有工具

完全遵循 [references/hitl.md](references/hitl.md)。摘要：標記工具（`approval_mode="always_require"` / `ApprovalRequiredAIFunction`），在 AG-UI 包裝器上啟用確認，在前端註冊核准 UI 勾點，並使回應承載資料形狀與伺服器偵測所預期的相符。然後測試核准以及拒絕，以及核准後的後續輪次（參見重複執行危害）。

### 建構生成式 UI 或共享狀態

遵循 [references/patterns.md](references/patterns.md) 中的模式表。注意誠實性限制：當 AG-UI 配接器包裝同進程代理程式（架構 A/B）時，狀態同步模式是原生的；透過回應協定（Responses-protocol）橋接器（架構 C），它們需要明確的綜合處理——在承諾此功能之前，請檢查程式碼庫實際實作了什麼。

### 偵錯損壞的流程

1. 首先在最低層進行重現：使用最小的 `RunAgentInput` JSON 主體對 AG-UI 端點進行 `curl -N`，並讀取原始的 SSE 事件。如果該處可以重現錯誤，則前端是無辜的。
2. 對於託管代理程式，再往下一層：直接呼叫代理程式的 `/responses` 端點。這就是已知的重複執行錯誤如何被隔離到框架而不是 UI 堆疊的方法。
3. 將症狀與 [references/troubleshooting.md](references/troubleshooting.md) 進行比對——其中列出了確切的錯誤字串。
4. 如果代理程式持有記憶體中狀態，請在驗證傳遞之間重新啟動本地執行的託管代理程式（`azd ai agent run`）；過期的狀態會導致測試因為錯誤的原因而通過或失敗。

### 升級相依性

遵循 [references/upgrading.md](references/upgrading.md)。絕不要單獨升級單一套件：那裡的版本關係規則（執行階段 ↔ AG-UI 用戶端、代理程式框架行一致性、裝載協定 ↔ 資訊清單版本）必須同時成立，且任何本地因應措施在移除前都必須針對其追蹤的上游問題重新進行驗證。

### 部署代理程式更新

遵循 [references/deploy-loop.md](references/deploy-loop.md)：使用 `azd ai agent run` 針對真實代理程式進行本地反覆運算，然後 `azd deploy`（每次部署都會建立一個新的代理程式版本），接著在宣告成功之前驗證已部署的代理程式（包括核准暫停）。

## 完成標準

只有在以下所有條件都滿足時，此堆疊上的變更才算完成：

1. 讀取/查詢路徑透過真實的 UI（不僅是透過 curl）正常運作。
2. 每個核准管制的工具都經過了雙向測試：核准 → 工具在伺服器端執行且狀態明顯改變；拒絕 → 工具不執行且代理程式確認。
3. 在同一個執行緒中，於核准後發送了至少一個後續輪次，且受管制的工具**沒有**再次靜默執行（[references/hitl.md](references/hitl.md)，重複執行危害）。
4. 工具呼叫在串流結束時正確呈現，而不僅是在串流期間（訊息快照可能與即時事件不同）。
5. 對於已部署的變更：上述檢查是針對已部署的端點執行的，而不僅是在本地執行——部署成功不是行為的證明。
