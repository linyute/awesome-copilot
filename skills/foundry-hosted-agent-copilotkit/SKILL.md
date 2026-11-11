---
name: foundry-hosted-agent-copilotkit
description: '建構與演進結合 CopilotKit React 前端與以 Microsoft Foundry 託管代理人形式執行的 Microsoft Agent Framework 代理人的代理人 Web 應用程式，雙方透過 AG-UI 通訊協定連線。涵蓋連線架構選擇、使用 Foundry 原生基語而非自行手工打造管線、代理人工具、真人介入 (Human-in-the-loop) 核准、生成式 UI 與共用狀態、本機執行與 azd 部署、除錯事件串流以及安全升級。'
---

# CopilotKit + AG-UI + Microsoft Foundry 託管代理人

當 React/Next.js 應用程式使用 CopilotKit 並透過 AG-UI 與託管於 Microsoft Foundry 的 Microsoft Agent Framework (MAF) 代理人進行通訊時，請使用此技能。這涵蓋新專案建構以及對現有應用程式的變更。Foundry 託管代理人為付費的 Azure 服務。

使用 `azd ai agent init` 樣板化代理人，並使用慣用的 React/Next.js 工具樣板化前端。接著遵循此技能處理兩者連線的所有環節。

## 心智模型 (Mental model)

```text
React (CopilotKit v2)        CopilotKitProvider / CopilotChat threadId=<conv_ id> / useInterrupt
      │ HTTP
CopilotKit runtime           CopilotRuntime({ agents: { default: new HttpAgent({ url }) } })
      │ AG-UI (SSE)
AG-UI gateway (FastAPI)      add_agent_framework_fastapi_endpoint(app, AgentFrameworkAgent(FoundryAgent(...),
                                use_service_session=True, service_session_id_from_thread_id=True))   ← 不保留對話串狀態
      │ OpenAI Responses + Entra token (https://ai.azure.com/.default)
Foundry hosted agent         ResponsesHostServer(Agent(tools=[...]))  ← 使用 azd 部署
```

**已部署的託管代理人本身不支援 AG-UI。** 它對外公開 `.../agents/<name>/endpoint/protocols/openai/responses` (Responses 通訊協定) 或 `.../protocols/invocations`。請使用 MAF 本身的配接器 (`FoundryAgent` + `agent-framework-ag-ui`) 進行轉譯，而不要手動撰寫 SSE 轉譯器。由於瀏覽器端無法存放 Entra 權杖，因此閘道一律位於伺服器端。

## 優先使用平台原生功能

在編寫任何底層管道程式碼之前，請先查閱此表格。每一列都是舊程式庫中過去手工自行實作的功能。

| 需求 | 原生基語（請勿手動實作） |
| --- | --- |
| 跨回合與重新啟動保留對話歷程記錄 | Foundry **交談 (conversations)**：每個聊天建立一個，使用其 `conv_…` ID 作為 AG-UI 執行緒 ID，閘道會直接傳遞（無須快照存放區） |
| 耐用持久的工具核准 | `ResponsesHostServer` 預設會保存核准請求 (`FoundryFunctionApprovalStore`)。AG-UI 配接器會將其轉換為 AG-UI 中斷 (interrupt) 並將決定轉發回託管代理人 |
| 瀏覽器斷線後仍可持續執行的 Run | Responses `background: true` + `store: true`，然後輪詢或重新連線（請參閱 [連線配置](references/wiring.md#background-runs-gateway)） |
| 具備關卡的耐久多步驟工作流程 | Invocations 託管代理人 + `@multi_turn_task` + `FoundryStateStore` |
| 代理人的個別使用者檔案 | Session Files API；代理人使用自己的工具讀取 `$HOME`。切勿將大型文件直接內嵌於提示詞中 |
| 長期使用者記憶 | Foundry Memory Store（使用者範圍）或 `FoundryMemoryProvider` |
| 工具目錄、Web 搜尋、程式碼直譯器 | 具備 Tool Search 的 Foundry **工具箱** (`FoundryToolbox`)，而非預先列出所有工具 |
| 編寫程式碼時的即時文件 | Microsoft Learn 與 Foundry MCP 伺服器（隨附於本技能的外掛程式） |

## 選擇連線架構

| 若應用程式需要… | 使用 | 閘道程式碼大小 |
| --- | --- | --- |
| 託管代理人 + 聊天 + 工具 + 核准 (**預設**) | **A. 位於 Responses 託管代理人之上的 AG-UI 閘道** | 約 50 行 Python |
| 所有狀態模式、本機原型、無需 Foundry 運算 | **B. 同處理程序 AG-UI**（代理人直接在 FastAPI 應用程式內執行） | 約 15 行 |
| 斷線後持續執行的背景 Run、重新連線、每位使用者的交談清單 | **C. 背景 Run 閘道**（建構於 Foundry 交談之上的自訂 AG-UI 代理人） | 約 150 行 TypeScript |
| 多步驟規劃 → 核准 → 執行，不可重複執行的不可逆步驟 | **D. Invocations 託管代理人**（與 A 或 C 並行） | REST Proxy |

各架構的程式碼位於 [references/wiring.md](references/wiring.md)。在現有程式庫中，在變更任何內容前請先識別其連線方式：
- 被 `add_agent_framework_fastapi_endpoint` 包裝的 `FoundryAgent(...)` 代表架構 A。
- 直接包裝的 `Agent(client=...)` 代表架構 B。
- 呼叫帶有 `background` 的 `/responses` 之自訂 `AbstractAgent` 代表架構 C。
- `azure.yaml` 中的 `protocol: invocations` 代表架構 D。

## 工作流程

1. **選擇或識別連線架構**（參見上方表格）。
2. **使用每個套件的最新版本**（`@copilotkit/*`、`@ag-ui/*`、`agent-framework-*`、`azd` 及其 `azure.ai.agents` 擴充套件）。接著依據即時來源校準：
   - 適用於 MAF 與 Foundry 的 Microsoft Learn MCP 伺服器
   - 適用於專案狀態的 Foundry MCP 伺服器
   - docs.copilotkit.ai 以及已安裝 `@copilotkit/*` 套件中隨附的 `.d.ts` 檔案
   - docs.ag-ui.com

   API 在次版本之間常有變動，請勿盲信記憶中的名稱。
3. **依據下列教戰守則進行建構或修改**。
4. **以對抗性思維對照完成標準進行驗證**。單純編譯成功、伺服器啟動或單次聊天成功回覆並不能作為完成的證明。

## 教戰守則 (Playbooks)

### 端到端建構新應用程式（架構 A）

1. 在**全新目錄**中，針對專案執行 `azd ai agent init --no-prompt ...`。確認 `azd env get-values` 顯示 `FOUNDRY_PROJECT_ENDPOINT`，接著在 `main.py` 中編寫工具 ([wiring §1](references/wiring.md#1-hosted-agent))。
2. 使用 `azd ai agent run` 在本機執行（連接埠 8088），並使用 `azd ai agent invoke --local "hi"` 進行冒煙測試。
3. 執行 `azd deploy`（每次部署均會建立新的代理人版本），然後執行 `azd ai agent invoke "hi"`。
4. 完全依照 [wiring §2](references/wiring.md#2-ag-ui-gateway-wiring-a) 加入 AG-UI 閘道，包含 thread-ID-is-conversation-ID 旗標與互通相容層 (interop shim)。建立交談，接著在碰觸前端 UI 之前，使用其 `conv_…` ID 作為 `threadId`，透過 `curl -N` 測試聊天**以及**核准恢復執行流程。
5. 加入交談路由、CopilotKit 執行階段路由與 React 提供者 ([wiring §3](references/wiring.md#3-copilotkit-runtime-and-react))。
6. 加入 `useInterrupt` 核准 UI 與工具轉譯器 ([hitl.md](references/hitl.md#frontend-copilotkit-v2))。
7. 逐一驗證每項完成標準，先在本機驗證，接著針對已部署的代理人進行驗證。

### 新增或變更代理人工具

1. 使用 `@tool` (Python) 或 `AIFunctionFactory.Create` (.NET) 定義工具，並指定型別與參數描述。
2. 參數描述中請勿包含模型必須推導之資料的具體範例數值。模型會複製字面上的範例。
3. 傳回精簡數值。豐富格式屬於 UI 轉譯器的工作。
4. 具副作用的工具請設定 `approval_mode="always_require"` ([hitl.md](references/hitl.md))。
5. 重新部署託管代理人。工具存在於託管代理人中，而非閘道。
6. 透過 UI 驗證 `TOOL_CALL_*` 事件串流傳輸，且任何解析該引數的元件仍可正常運作。

### 生成式 UI 與共用狀態 (CopilotKit v2 hooks)

| 模式 | 代理人端 | 前端 Hook |
| --- | --- | --- |
| 前端工具（代理人呼叫 UI） | 無；在 `RunAgentInput.tools` 抵達 | `useFrontendTool` |
| 轉譯後端工具呼叫 | 一般 `@tool` | `useRenderTool` / `useRenderToolCall` / `useDefaultRenderTool` |
| 工具呼叫的人工核准 | `approval_mode="always_require"` | `useInterrupt` → `resolve({approved})` |
| 代理人向使用者索取輸入（前端解析工具） | 無 | `useHumanInTheLoop` → `respond(...)` |
| 共用或預測性狀態 | `AgentFrameworkAgent` 上的 `state_schema` / `predict_state_config` | `useAgent`（讀取 `agent.state`） |

狀態模式僅在配接器能看到代理人狀態時才會發出 `STATE_SNAPSHOT`/`STATE_DELTA`：
- **架構 B** 原生支援。
- **架構 A** 必須在閘道的 `AgentFrameworkAgent` 上明確宣告。在承諾提供此功能前請先進行測試。
- **架構 C** 不會產生狀態事件，除非自行合成。

### 針對失效流程進行除錯

從最底層開始逐步向上排查：
1. 使用 `azd ai agent invoke` 或針對 `/responses` 的 `curl` 呼叫託管代理人。
2. 使用真實的交談識別碼呼叫閘道。在此連線架構下，捏造的執行緒識別碼會傳回 HTTP 500：

   ```bash
   CONV=$(curl -s -X POST "$FOUNDRY_PROJECT_ENDPOINT/agents/$FOUNDRY_AGENT_NAME/endpoint/protocols/openai/conversations?api-version=v1" \
     -H "Authorization: Bearer $(az account get-access-token --resource https://ai.azure.com --query accessToken -o tsv)" \
     -H 'content-type: application/json' -d '{}' | jq -r .id)
   curl -N -X POST <gateway>/ -H 'content-type: application/json' -d '{"threadId":"'$CONV'","runId":"r1","messages":[{"id":"m1","role":"user","content":"hi"}],"tools":[],"context":[],"state":{},"forwardedProps":{}}'
   ```
3. 測試 CopilotKit 路由。
4. 測試瀏覽器。

第一個發生失敗的層級即為問題所在。接著對照 [troubleshooting.md](references/troubleshooting.md) 中的徵兆進行處理。託管代理人記錄請使用 `azd ai agent monitor` 檢視。

### 升級相依套件

遵循 [troubleshooting.md](references/troubleshooting.md#upgrades) 中的版本規則。請同時升級所有套件，然後在線上環境重新執行完成標準測試。

## 完成標準 (Completion criteria)

僅當下列所有條件均滿足時，變更才算完成：
1. 聊天路徑可透過真實 UI 運作，而非僅透過 curl。
2. 每個受核准保護的工具均已進行雙向測試：
   - 核准：工具在伺服器上執行一次，且副作用可被觀察到。
   - 拒絕：工具不執行，且代理人確認收到拒絕。
3. 在核准之後，同一個對話串中的後續回合**不會**重複執行受保護的工具。
4. 工具與核准卡片在 `RUN_FINISHED` 之後仍會正常轉譯，而非僅在串流過程中顯示。
5. 對於已部署的變更，檢查項目 1–4 均已針對部署的代理人與閘道通過測試。單純部署成功並不能證明行為正確。
