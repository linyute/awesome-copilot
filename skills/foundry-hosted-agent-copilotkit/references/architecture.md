# 架構：AG-UI 產生的位置

此技術堆疊有三個層級必須一致：CopilotKit（React 勾點 + 執行階段）、AG-UI 協定（SSE 事件串流）和 Microsoft Agent Framework (MAF) 代理程式，後者可選作為 Azure AI Foundry 託管代理程式執行。已部署的 Foundry 託管代理程式端點發送 OpenAI 回應（`{project_endpoint}/agents/{name}/endpoint/protocols/openai/responses`）或原始調用協定（`.../protocols/invocations`）——**而非 AG-UI**。將 `@ag-ui/client` 中的 `HttpAgent` 直接指向託管代理程式的 Responses 端點是無法運作的。

有三種可行的佈線方式。在變更任何內容之前，請先識別程式碼庫使用的是哪一種。

## 架構 A — 同進程 AG-UI 端點（代理程式在您的服務內部執行）

代理程式物件與 AG-UI HTTP 端點位於相同的進程中。

Python：

```python
from agent_framework import Agent
from agent_framework_ag_ui import AgentFrameworkAgent, add_agent_framework_fastapi_endpoint
from fastapi import FastAPI

agent = Agent(name="assistant", instructions="...", client=chat_client, tools=[...])
wrapped = AgentFrameworkAgent(agent=agent, require_confirmation=True)  # 啟用人機協同 (HITL)
app = FastAPI()
add_agent_framework_fastapi_endpoint(app, wrapped, "/")
```

.NET：來自 `Microsoft.Agents.AI.Hosting.AGUI.AspNetCore` 的 `builder.Services.AddAGUI()` + `app.MapAGUI("/", agent)`，並帶有核准中介軟體（參見 hitl.md）。

- 所有 7 種 AG-UI 模式（包括狀態快照/差異）皆原生支援——配接器可以看到代理程式的內部事件。
- 模型用戶端仍可以是 Foundry 模型部署；「同進程」是指*代理程式迴圈*執行的位置，而不是模型。
- 這就是 CopilotKit CLI 和 MAF 範例所產生的結構，也是在不需要平台管理對話、每使用者隔離或 Foundry 管理運算時的正確選擇。

## 架構 B — 託管代理程式自身提供 AG-UI 服務（invocations 協定）

託管代理程式本身的容器發送 AG-UI，部署在 Foundry 的 `invocations` 協定下（根據 Foundry 託管代理程式文件，為「自訂串流協定 (AG-UI 等) → Invocations」）。`agent.yaml` 宣告：

```yaml
protocols:
  - protocol: invocations
    version: 2.0.0
```

且容器在 `/invocations` 處提供 AG-UI 請求服務（Microsoft 的 `foundry-samples` 存放庫在 `samples/python/hosted-agents/bring-your-own/invocations/ag-ui/` 下有一個自備 invocations AG-UI 範例）。CopilotKit 執行階段的 `HttpAgent` 指向已部署的 invocations 端點。

- AG-UI 功能的行為與架構 A 相同，因為配接器仍然包裝同進程代理程式——它只是在 Foundry 管理的運算中執行。
- 您放棄了 Responses 協定的平台管理對話歷史記錄；對話狀態需由您自行管理。
- 對已部署端點的呼叫需要 Entra 驗證 (`DefaultAzureCredential`)，因此 CopilotKit 執行階段通常仍需要一個精簡的伺服器端代理以附加權杖——瀏覽器無法直接呼叫它。

## 架構 C — 通往 Responses 協定託管代理程式的轉譯橋接器

託管代理程式使用 `responses` 協定進行部署（平台管理的對話歷史記錄、代理程式版本控制、每使用者隔離），並有一個單獨的橋接服務在 AG-UI 與 Responses 串流之間進行轉譯。這是工作量最高的佈線方式；只有在您特別需要 Responses 平台功能時才選擇它。

該橋接器至少必須處理：

1. **串流轉譯**：OpenAI Responses SSE 事件 → AG-UI 事件（`response.output_text.delta` → `TEXT_MESSAGE_CONTENT`，函式呼叫項目 → `TOOL_CALL_*`，`response.completed` → `RUN_FINISHED` 等）。
2. **輪次衍生，而非歷史重播**：從最新的使用者訊息（或核准決策）衍生每一輪的輸入。將完整的原始 AG-UI 訊息歷史記錄重播到 Responses 端點會失敗，並產生關於孤立工具呼叫的 400 錯誤。
3. **HITL 轉發**：將託管代理程式的 `mcp_approval_request` 呈現給 UI，並將使用者的決策作為 `mcp_approval_response` 輸入項目轉發回去——獲核准的工具隨後在*伺服器端*重新執行。股票 AG-UI 配接器會在本地解析核准，從不將其轉發給遠端代理程式（追蹤為 microsoft/agent-framework#6652），因此橋接器需要為此路徑撰寫明確的程式碼。在撰寫自訂路由之前，請針對目前的套件版本驗證是否仍需要此操作。
4. **對話連續性**：`previous_response_id` 鏈接（本地/直接模式）或 Foundry `conversation` 物件（部署/平台模式）。參見 hitl.md 以了解跨核准輪次的 `previous_response_id` 鏈接的關鍵危害。
5. **狀態綜合限制**：`STATE_SNAPSHOT`/`STATE_DELTA` 事件不是由 Responses 串流產生的。共享狀態和預測狀態模式需要橋接器進行綜合（例如從 `response.function_call_arguments.delta`）；如果橋接器沒有實作該功能，這些模式將靜默失效。在承諾此功能前請先確認。

橋接器狀態（回應識別碼或對話快照快取）通常位於記憶體中：在水平擴展前，請執行單一複本或將快取移至外部。

## 本地開發模式

- **架構 A/B**：直接執行 FastAPI/ASP.NET 服務；將 CopilotKit 執行階段的 `HttpAgent` 指向 `http://localhost:<port>/`。
- **託管代理程式 (B/C)**：`azd ai agent run` 使用您的 `az login` 認證和佈署的 Foundry 專案在本地執行真實的託管代理程式（預設連接埠 8088）——沒有模擬。`azd ai agent invoke --local "..."` 發送單個測試承載資料。本地模式下的橋接器指向裸本地端點，而不是已部署的端點（通常透過持有直接 URL 的單個環境變數進行切換）。

## CopilotKit 執行階段佈線（所有架構）

AG-UI 端點不論位於何處，都會在 CopilotKit 執行階段中註冊為 `HttpAgent`：

```ts
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  agents: { "my_agent": new HttpAgent({ url: process.env.AGUI_BACKEND_URL! }) },
});
```

且提供者依名稱選取它：`<CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent">`。`agents` 鍵、`agent` 屬性與（對於託管代理程式）`agent.yaml` 中的名稱之間的名稱漂移是常見的失敗原因——請保持一致。

使用 `useFrontendTool` 註冊的前端工具會流經執行階段進入 AG-UI `RunAgentInput.tools` 陣列，並變為可由代理程式呼叫；這在所有三種架構中都是原生支援的。

## 驗證到 Foundry 端點

- 權杖對象 (Audience) 為 `https://ai.azure.com/.default`——預設的 `cognitiveservices.azure.com` 範圍會產生 401 "audience is incorrect" 錯誤。
- 免金鑰（Entra / `DefaultAzureCredential`）是常態；非同步 Python 認證路徑需要安裝 `aiohttp`。
- 絕不要將 `x-ms-user-isolation-key` 發送到已部署的代理程式——已部署的代理程式從 Entra 身分識別中衍生隔離，並拒絕該標頭且傳回 400 錯誤。
