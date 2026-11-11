# 連線配置參考 (Wiring reference)

下方的套件名稱截至 2026 年底為最新版本。請一律安裝**最新**版本，並對照已安裝的套件驗證名稱：Python 透過 `python -c "import agent_framework_ag_ui as m; print(m.__all__)"`，TypeScript 透過 `.d.ts` 檔案。

## 1. 託管代理人 (Hosted agent)

在一個**乾淨目錄**中使用新的環境，以非互動方式針對現有的 Foundry 專案樣板化代理人：

```bash
azd ai agent init --no-prompt -e <env> -p <project-arm-id> -d <model-deployment> \
  --agent-name my-agent --protocol responses --deploy-mode code \
  --runtime python_3_13 --entry-point main.py --src src/my-agent
azd env get-values -e <env>   # FOUNDRY_PROJECT_ENDPOINT、AZURE_AI_MODEL_DEPLOYMENT_NAME 與
                              # AZURE_LOCATION (= 專案所在區域) 均必須設定
```

- 在已有 `azure.yaml` 或其他 azd 環境的目錄中執行 `init` 可能會導致 `FOUNDRY_PROJECT_ENDPOINT` 為空，使得 `azd deploy` 失敗並顯示 `Foundry dependencies are not ready: ... FOUNDRY_PROJECT_ENDPOINT is not set`。請在乾淨目錄中重新開始，而非修補該環境。
- 現有專案**不需要** `azd provision`，亦不需要 `--infra`。`init` 後執行 `azd deploy` 即為整個流程。

所有設定均在 `azure.yaml` (駝峰式命名 camelCase) 中宣告。舊有獨立的 `agent.yaml`/`agent.manifest.yaml` 檔案已遭廢棄。代理人服務如下所示：

```yaml
services:
  my-agent:
    project: src/my-agent
    host: azure.ai.agent
    language: python
    uses: [ai-project]
    env:
      AZURE_AI_MODEL_DEPLOYMENT_NAME: ${AZURE_AI_MODEL_DEPLOYMENT_NAME}
    codeConfiguration: { runtime: python_3_13, entryPoint: main.py }
    protocols:
      - protocol: responses
        version: 2.0.0
```

`main.py` 必須使用以 Responses 為基礎的聊天用戶端。核准恢復執行 (approval resume) 需要 `FoundryChatClient`；使用 Chat Completions 用戶端會失敗並出現 `No tool output found for function call`。

```python
import asyncio, os
from agent_framework import Agent, tool
from agent_framework.foundry import FoundryChatClient
from agent_framework_foundry_hosting import ResponsesHostServer
from azure.identity import DefaultAzureCredential

@tool
def get_balance(account: str) -> str:
    """帳戶餘額的唯讀查詢。"""
    ...

@tool(approval_mode="always_require")
def transfer(from_account: str, to_account: str, amount: float) -> str:
    """轉帳。具副作用，因此必須先由人員核准。"""
    ...

async def main() -> None:
    client = FoundryChatClient(
        project_endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],  # 託管時自動注入
        model=os.environ["AZURE_AI_MODEL_DEPLOYMENT_NAME"],
        credential=DefaultAzureCredential(),
    )
    agent = Agent(client=client, instructions="...", tools=[get_balance, transfer],
                  default_options={"store": False})  # 託管層擁有歷程記錄
    await ResponsesHostServer(agent).run_async()

if __name__ == "__main__":
    asyncio.run(main())
```

相依套件 (`requirements.txt`)：`agent-framework-foundry`、`agent-framework-foundry-hosting` 與 `azure-identity`。請以 `==` 將每個套件釘選至最新發佈版本。託管套件僅以搶先預覽版形式存在，且遠端建構會自行解析相依套件。請相依於這些特定套件，而非 `agent-framework` 中繼套件。

`ResponsesHostServer` 預設會在 Foundry 中保存交談狀態與待處理核准 (`FoundryAgentSessionStore`, `FoundryFunctionApprovalStore`)。請勿針對這些功能自行打造存放區。

**啟動時請採取輕緩降級 (Fail soft)。** 若 `main()` 在提供服務前擲出例外狀況，`/readiness` 絕不會回應，且 Foundry 僅會回報 HTTP 424 `session_not_ready`。請攔截設定錯誤並提供說明缺少項目的虛設常式代理人。

## 2. AG-UI 閘道（架構 A）

閘道是一個小型的 FastAPI 應用程式。MAF 會負責 Responses↔AG-UI 的轉譯以及核准的轉發。

**AG-UI 執行緒 ID 即為 Foundry 交談 ID。** UI 會先建立交談（參見 §3），接著閘道將該執行緒 ID 直接傳遞為 Foundry 交談 (`use_service_session=True, service_session_id_from_thread_id=True`)。Foundry 擁有歷程記錄，因此閘道不保留任何執行緒狀態，亦不需要快照存放區。

交談連續性是**託管核准的必要條件**。若無連續性，每次執行抵達託管代理人時都會被視為全新交談，無法比對已儲存的核准請求，核准操作只會產生第二個核准請求。

```python
# gateway/app.py — 執行：uvicorn app:app --port 8000
import os
from ag_ui.core import EventType
from agent_framework.foundry import FoundryAgent
from agent_framework_ag_ui import AgentFrameworkAgent, add_agent_framework_fastapi_endpoint
from azure.identity.aio import DefaultAzureCredential
from fastapi import FastAPI


class HostedApprovalSafeAgent(AgentFrameworkAgent):
    """已針對 agent-framework-ag-ui 1.4.0 + CopilotKit 1.76 / @ag-ui/client 1.0.1 驗證的互通修正。

    1. CopilotKit 會發送兩次中斷決定：一次作為 `resume`，另一次作為以中斷 ID 為索引鍵的
       工具訊息。重複的訊息會導致配接器略過模型回覆，並導致 Foundry 交談
       持續傳回空的執行。僅保留 `resume`。
    2. 配接器會針對託管核准 ID (`mcpr_...`) 發出 TOOL_CALL_END，但沒有對應的
       TOOL_CALL_START；@ag-ui/client 會以 INCOMPLETE_STREAM 中止執行。將其捨棄。
    當未來版本修復這兩者且 HITL 迴歸測試在無此類別下通過時，即可刪除此類別。
    """

    async def run(self, input_data, **kwargs):
        # 在呼叫 run() 時，端點已將鍵值轉換為 snake_case (interrupt_id, tool_call_id)。
        resumed = {r.get("interrupt_id") or r.get("interruptId") or r.get("id")
                   for r in (input_data.get("resume") or []) if isinstance(r, dict)}
        if resumed:
            input_data = {**input_data, "messages": [
                m for m in input_data.get("messages", [])
                if not (m.get("role") == "tool" and (m.get("tool_call_id") or m.get("toolCallId")) in resumed)]}
        started: set[str] = set()
        async for event in super().run(input_data, **kwargs):
            if event.type == EventType.TOOL_CALL_START:
                started.add(event.tool_call_id)
            elif event.type == EventType.TOOL_CALL_END and event.tool_call_id not in started:
                continue
            yield event


hosted = FoundryAgent(
    project_endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],
    agent_name=os.environ["FOUNDRY_AGENT_NAME"],   # 與 azure.yaml 中的名稱相同
    credential=DefaultAzureCredential(),
    allow_preview=True,                             # 託管代理人工作階段 API 處於預覽階段
)
app = FastAPI()
add_agent_framework_fastapi_endpoint(
    app,
    HostedApprovalSafeAgent(agent=hosted, use_service_session=True,
                            service_session_id_from_thread_id=True),  # threadId == Foundry conv_ id
    "/",
)
```

相依套件：`agent-framework-ag-ui`、`agent-framework-foundry`、`azure-identity`、`aiohttp`（非同步認證憑據所需）、`uvicorn`。

- **執行緒 ID 必須是真實的 `conv_…` ID。** 任意的 UUID 會導致 Foundry 傳回 HTTP 500。若未設定 `service_session_id_from_thread_id=True`，`use_service_session=True` 反而需要將執行緒 ID 對應至交談的 `snapshot_store` + `snapshot_scope_resolver`，這會使狀態重新回到閘道中。
- **閘道仍保留的內容：僅限進行中的核准。** `agent-framework-ag-ui` 會將待處理核准保留在處理程序內部的 `InMemoryAGUIApprovalStateStore` 中，此儲存區無法被替換。若閘道在核准待處理時重新啟動：
  - 恢復執行會失敗並出現 `RUN_ERROR` "No pending approval interrupt found for resume interruptId 'mcpr_…'"。
  - 工具**不會**執行。
  - 同一個交談仍可繼續運作，因此使用者只需重新提問。

  除此以外的所有內容在重新啟動後皆可存活。若有多個複本，請使用工作階段同質性 (session affinity)，使恢復請求抵達發出該核准的同一複本。
- **授權：** 閘道會信任其接收到的執行緒 ID。在多使用者應用程式中，記錄哪位使用者建立了各交談（在 §3 路由中），並拒絕其他使用者的執行緒 ID。此對應關係每個交談僅寫入一次，而非每回合寫入。
- curl 測試用的 Resume 格式：`"resume": [{"interruptId": "<來自 RUN_FINISHED.outcome.interrupts 的 mcpr_ id>", "status": "resolved", "payload": {"approved": true}}]`。請將先前的 `MESSAGES_SNAPSHOT` 作為 `messages` 一併傳送。

## 3. CopilotKit 執行階段與 React

執行階段在伺服器端執行。在 Next.js 中，請在 `app/api/copilotkit/[[...slug]]/route.ts` 使用 App Router 路由。v2 執行階段為多路由 (`/info`, `/agent/:id/run`, …)，因此必須使用萬用 (catch-all) 區段。

```ts
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: { default: new HttpAgent({ url: process.env.AGUI_URL! }) }, // 閘道 URL
});
const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });
export const GET = handler;
export const POST = handler;
```

針對 Hono 或 Express 伺服器，請使用來自 `@copilotkit/runtime/v2` 的 `createCopilotHonoHandler` / `createCopilotExpressHandler`。

在伺服器端建立 Foundry 交談。其識別碼將成為 AG-UI 執行緒 ID。將其置於 `app/api/thread/route.ts`（需要在 Next.js 伺服器環境中安裝 `@azure/identity`，並設定 `FOUNDRY_PROJECT_ENDPOINT` 與 `FOUNDRY_AGENT_NAME`）：

```ts
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();

export async function POST() {
  const { token } = await credential.getToken("https://ai.azure.com/.default");
  const url = `${process.env.FOUNDRY_PROJECT_ENDPOINT}/agents/${process.env.FOUNDRY_AGENT_NAME}` +
    `/endpoint/protocols/openai/conversations?api-version=v1`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) return Response.json({ error: `Foundry ${res.status}` }, { status: 502 });
  const { id } = (await res.json()) as { id: string };   // conv_...
  return Response.json({ threadId: id });                 // 多使用者：在此處記錄 (user, id)
}
```

React 端，位於 `app/page.tsx`：

```tsx
"use client";
import { useEffect, useState } from "react";
import { CopilotKitProvider, CopilotChat, useDefaultRenderTool } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { ApprovalUI } from "./approval";   // useInterrupt，參見 hitl.md

function ToolRows() {
  // 託管工具在遠端執行；若無轉譯器，其結果在聊天中將不可見。
  useDefaultRenderTool({
    render: ({ name, result }) => name === "confirm_changes" ? null :
      <div>{name}: {typeof result === "string" ? result : JSON.stringify(result ?? "")}</div>,
  });
  return null;
}

export default function Page() {
  const [threadId, setThreadId] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    fetch("/api/thread", { method: "POST" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || typeof d.threadId !== "string" || !d.threadId.startsWith("conv_")) {
          throw new Error(d.error ?? `Could not start a conversation (HTTP ${r.status})`);
        }
        setThreadId(d.threadId);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!threadId) return <p>正在啟動交談…</p>;
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      <ToolRows />
      <ApprovalUI />
      <CopilotChat agentId="default" threadId={threadId} />
    </CopilotKitProvider>
  );
}
```

將儲存的 `conv_…` ID 作為 `threadId` 傳回可在代理人端繼續該交談，因為 Foundry 保留了歷程記錄。在聊天 UI 中重新顯示先前的交談記錄屬於另一個獨立關注點，此設定不涵蓋該部分。

版本規則：
- 安裝最新版本的 `next`、`@copilotkit/react-core` 與 `@copilotkit/runtime` (`@latest`)。
- `@copilotkit/runtime` 會釘選精確的 `@ag-ui/client` 版本。透過 `npm view @copilotkit/runtime@<已安裝版本> dependencies` 從已安裝的執行階段讀取該版本，接著安裝該精確版本：`npm i @ag-ui/client@<釘選版本>`。
- 保持所有 `@copilotkit/*` 套件處於相同版本。

名稱必須在三個地方保持一致：執行階段的 `agents` 索引鍵、`CopilotChat`/`useAgent` 上的 `agentId`，以及提供給閘道的託管代理人名稱。請使用單一共用常數。

## 4. 同處理程序 AG-UI（架構 B）

與 §2 相同，但在一般 `AgentFrameworkAgent` 中包裝本機 `Agent(client=FoundryChatClient(...), tools=[...])` 而非 `FoundryAgent`；不需要 `use_service_session` 與 §2 相容層。所有狀態模式皆原生運作。核准狀態為處理程序區域狀態，因此核准待處理時重新啟動會導致該核准無法解析。請將此架構用於原型設計，或改將持久核准置於託管代理人之後。

## 5. 背景 Run 閘道（架構 C） {#background-runs-gateway}

當執行必須在瀏覽器斷線後持續進行且使用者必須能夠重新開啟交談時，請使用此架構。它是在 Node 閘道中直接驅動 Foundry REST API 的自訂 `AbstractAgent`（來自 `@ag-ui/client`）。從代理人的 Responses 端點 `E = {project}/agents/{name}/endpoint/protocols/openai/responses` 推導 URL：
- `openai = E` 減去 `/responses`
- `agentEndpoint = openai` 減去 `/protocols/openai`

| 步驟 | 呼叫 |
| --- | --- |
| 新執行緒 | `POST {openai}/conversations` → `conversation.id`；`POST {agentEndpoint}/sessions` → `agent_session_id`；儲存 `{threadId → conversationId, sessionId, owner}` |
| 開始回合 | `POST {openai}/responses` `{input, conversation, agent_session_id, background: true, store: true, stream: false}` → 儲存 `response.id` |
| 串流至 UI | 當 `status ∈ {queued, in_progress}` 時，約每秒輪詢一次 `GET {openai}/responses/{id}`。發出由 `GET {openai}/conversations/{id}/items`（以 `after` 分頁直至 `has_more` 為 false）與 `response.output` 合併建構的 `MESSAGES_SNAPSHOT`。以 `RUN_FINISHED` 結束，或以帶有 `response.error` 的 `RUN_ERROR` 結束 |
| 重新連線 | 從已儲存的 `response.id` 開始相同的輪詢迴圈。中斷連線**不可**取消執行 |
| 取消 | `POST {openai}/responses/{id}/cancel` |

每次呼叫皆使用 `?api-version=v1` 以及 `https://ai.azure.com/.default` 的持有人權杖 (bearer token)。

- 使用 `CopilotSseRuntime({ agents, runner })` 註冊自訂 `AgentRunner`，使 Foundry 成為唯一的重播存放區。預設的 `InMemoryAgentRunner` 會保留處理程序全域的執行緒快取，在重新啟動後會與 Foundry 產生分歧。
- 每個回合的輸入僅從最新的使用者訊息推導。將整個 AG-UI 交談記錄重播至 `/responses` 會因孤立工具呼叫而失敗並出現 400 錯誤。
- 若執行緒已有進行中的回應，則傳回 409。

## 6. Invocations 工作流程代理人（架構 D）

將此架構用於規劃 → 核准 → 執行的流程，其中不可逆步驟即便跨容器重新啟動亦絕不可重複執行：
- 在 `azure.yaml` 中宣告 `protocol: invocations`（版本 `2.0.0`）。
- 在代理人中，使用來自 `azure.ai.agentserver.core.tasks` 的 `@multi_turn_task`，並將應用程式檢查點保存在 `FoundryStateStore` (`azure.ai.agentserver.core.storage`) 中。
- 每個對 `/invocations?agent_session_id=<id>` 的 POST 會傳回 202 與 `invocation_id`。輪詢 `GET /invocations/{id}` 取得 `status` 與 `output`。
- 使用伺服器核發的權杖為每個不可逆步驟設定關卡保護（呼叫識別碼 + 步驟索引 + 隨機值，使用 `hmac.compare_digest` 比對）。
- 在副作用前記錄的高水位標記 (watermark) 提供**至多一次 (at-most-once)** 保證：水位標記與動作之間的當機會略過該動作。若要達到**剛好一次 (exactly-once)** 效果，請傳送目的地強制執行的穩定每步驟等冪索引鍵 (idempotency key)，或者在單一交易中同時認可該效果與完成檢查點。
- 復原時 (`ctx.entry_mode == "recovered"`)，將以相同輸入重新呼叫同一個回合。使用該等冪索引鍵調和已啟動但尚未設定檢查點的任何步驟（向目的地詢問是否已發生），而非將水位標記視為完成證明。

瀏覽器透過檢查工作階段所有權的伺服器端 REST Proxy 連線至此代理人。它不經過 AG-UI。

## 7. 驗證與識別身分

- 權杖對象 (audience) 為 `https://ai.azure.com/.default`。`cognitiveservices` 範圍會傳回 401 "audience is incorrect"。
- 切勿向已部署的代理人傳送 `x-ms-user-isolation-key`。隔離來自 Entra 識別身分，該標頭會導致 400 錯誤。
- 閘道的識別身分以及建立交談的 Next.js 伺服器識別身分，需要在 Foundry 專案上具備 **Azure AI User** 角色。在 Azure 中為受控識別 (managed identity)，在本地端為您的 `az login`。
- 閘道為授權邊界：
  - 驗證使用者的 Entra 權杖（簽發者、對象、租用戶、範圍）。
  - 維護使用者 → 執行緒/工作階段所有權索引。
  - 在每次 Foundry 呼叫前檢查所有權。
- Foundry Memory Store 以**專案的**受控識別身分呼叫模型。請將父帳戶上的 Foundry User 角色授予該識別身分，否則記憶體寫入會失敗並出現 401。
- 每個託管代理人均會取得其自身的 Entra 識別身分。模型與工作階段儲存體存取權在專案內授予，但任何其他 Azure 資源皆需要明確的 RBAC 指派。

## 8. 本機循環與部署

```bash
azd ai agent run                       # 真實代理人執行於 http://localhost:8088，使用您的 az login
azd ai agent invoke --local "hi"       # 冒煙測試本機代理人
azd deploy                             # 程式碼部署；每次部署建立新的代理人版本
azd ai agent invoke "hi"               # 呼叫已部署的代理人
azd ai agent show / monitor            # 狀態與記錄
```

- §2 閘道透過名稱鎖定已部署的代理人，因此在測試閘道前請先部署。使用 `azd ai agent run` 在本機反覆測試代理人邏輯。
- 先更新 azd 與 `azure.ai.agents` 擴充套件 (`azd update`, `azd extension upgrade --all`)。「不相容 (Incompatible)」的擴充套件狀態會封鎖每個 `azd ai agent` 命令。
- 若代理人的流量路由已明確釘選 (特定版本上的 FixedRatio)，`azd deploy` 不會將流量移轉至新版本。使用 `azd ai agent show` 檢查。
- 遠端建構獨立解析相依套件。本機成功並不能保證已部署的映像檔可成功建構，因此請釘選版本。
- 若工具有保留記憶體內部狀態，請在兩次驗證階段之間重新啟動本機執行階段。
