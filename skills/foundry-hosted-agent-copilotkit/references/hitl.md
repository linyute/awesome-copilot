# 真人介入 (Human-in-the-loop) 核准

HITL 為具副作用的操作提供關卡保護，且其失敗往往是無訊息的：工具在未獲核准前即執行、執行了兩次，或者在核准後完全不執行。每個 HITL 變更必須透過三種方式驗證：
- 核准 (Approve) 執行該工具**一次**。
- 拒絕 (Reject) 執行該工具**零次**。
- 後續對話回合執行該工具**零次**。

## 選擇機制

| 情境 | 機制 | 跨重新啟動具備持久性？ |
| --- | --- | --- |
| 託管代理人上具關卡保護工具的聊天 (架構 A) | 託管代理人工具上的 `approval_mode="always_require"`。AG-UI 配接器會將其呈現為 AG-UI **中斷 (interrupt)** 並將決定轉發給託管代理人 | Foundry 端：是 (`FoundryFunctionApprovalStore`)。閘道的進行中登錄表則否：因閘道重新啟動而中斷的待處理核准會在**不執行該工具**的情況下被拒絕，使用者需重新提問 |
| 同處理程序代理人 (架構 B) | 相同的工具旗標；配接器在本地端解析核准 | **否。** 核准待處理時重新啟動會導致其無法被解析 |
| 多步驟規劃、不可逆步驟、可能等待數日的核准 | 帶有伺服器核發關卡權杖的 Invocations 工作流程代理人 ([wiring §6](wiring.md#6-invocations-workflow-agent-wiring-d)) | 是 (`FoundryStateStore` + `@multi_turn_task`) |

## 伺服器端

```python
@tool(approval_mode="always_require")
def transfer(from_account: str, to_account: str, amount: float) -> str: ...
```

- 在架構 A 中，此旗標位於**託管代理人的**工具上。閘道必須如 [wiring §2](wiring.md#2-ag-ui-gateway-wiring-a) 般執行：`use_service_session=True` 且 `service_session_id_from_thread_id=True`（執行緒 ID = Foundry `conv_…` ID），再加上互通相容層 (interop shim)。若沒有交談連續性，每個核准都會變成新的核准請求。
- `approval_mode` 僅控制核准機制。`never_require` 並不會使工具變成唯讀。
- **.NET：** 將工具包裝在 `ApprovalRequiredAIFunction` 中。遵循官方 AGUI `Step04_HumanInLoop` 範例，在 `DelegatingAIAgent` 中將 `ToolApprovalRequestContent`/`ToolApprovalResponseContent` 橋接至用戶端核准工具呼叫。在歷程記錄中保持呼叫與其結果**成對存在**；若移除其中一個，會導致 Azure OpenAI 傳回 400 "tool_calls must be followed by tool messages"。

## 前端 (CopilotKit v2)

閘道以 `RUN_FINISHED.outcome = {type: "interrupt", interrupts: [...]}` 結束該輪執行。每個中斷包含：
- `id`（託管的 `mcpr_...` 核准識別碼）
- `message`（例如 "Approve running transfer?"）
- `metadata.agent_framework.function_call` (`name`, `arguments`)

使用 `useInterrupt` 處理它。CopilotKit 隨後會以規格 `resume` 陣列恢復該輪執行。

```tsx
"use client";
import { useState } from "react";
import { useInterrupt } from "@copilotkit/react-core/v2";

type Call = { name?: string; arguments?: Record<string, unknown> };
type Pending = { id: string; message?: string; metadata?: unknown };
type Resolve = (payload?: unknown, interruptId?: string) => Promise<unknown>;

function ApprovalCard({ interrupt, resolve }: { interrupt: Pending; resolve: Resolve }) {
  const [decision, setDecision] = useState<boolean>();
  const call = (interrupt.metadata as { agent_framework?: { function_call?: Call } })
    ?.agent_framework?.function_call;
  const decide = (approved: boolean) => { setDecision(approved); void resolve({ approved }, interrupt.id); };
  return (
    <div data-testid="approval-card">
      <p>{interrupt.message ?? "Approve this action?"}</p>
      <pre>{call?.name} {JSON.stringify(call?.arguments)}</pre>
      {decision === undefined ? (
        <>
          <button onClick={() => decide(true)}>Approve</button>
          <button onClick={() => decide(false)}>Reject</button>
        </>
      ) : <p>{decision ? "Approved" : "Rejected"}</p>}
    </div>
  );
}

export function ApprovalUI() {
  useInterrupt({
    // 每個開啟的中斷對應一張卡片，各自透過其自身的識別碼解析。CopilotKit 僅在
    // 所有開啟的中斷皆獲得決定後才會恢復執行；未指定識別碼的 resolve() 會以第一個為目標。
    render: ({ interrupts, resolve }) => (
      <>{interrupts.map((i) => <ApprovalCard key={i.id} interrupt={i as Pending} resolve={resolve} />)}</>
    ),
  });
  return null;
}
```

- 將 `ApprovalUI` 掛載在 `CopilotKitProvider` 內部。卡片預設會在 `CopilotChat` 內部轉譯 (`renderInChat`)。
- 平行受關卡保護的呼叫：在 agent-framework-ag-ui 1.4.0 中，託管代理人的平行關卡呼叫會**每次 Run 呈現一個中斷**。每個決定都會恢復執行，然後詢問下一個。在最後一個決定做出前不會執行任何內容；隨後經核准的呼叫各執行一次，經拒絕的則傳回 "rejected by user"。轉譯所有 `interrupts` 可在單次執行包含多個中斷時維持 UI 正確。
- 負載 (payload) 為嚴格合約：`{approved: boolean}`，並接受 `accepted` 作為相容舊版的別名。任何其他格式皆不執行任何動作，且不回報錯誤。若要拒絕，請使用 `resolve({approved: false})`，而非 `cancel()`。取消操作會丟棄該決定，而不會通知代理人該呼叫已被拒絕。
- 配接器亦會為舊版前端發出 `confirm_changes` 工具呼叫。使用 `useInterrupt` 時，請勿註冊 `useHumanInTheLoop("confirm_changes")`；請改為在工具轉譯器中隱藏它（請參閱 [wiring §3](wiring.md#3-copilotkit-runtime-and-react)）。
- 使用 `useDefaultRenderTool` 或 `useRenderTool` 轉譯工具結果。核准後，託管工具的結果會以 `TOOL_CALL_RESULT` 抵達，否則不會有任何內容呈現它。

## 依據效果驗證核准

在架構 A 中，經核准的工具會在**託管代理人上**執行，超出了 UI 的視線範圍。看似正確的交談記錄無法證明任何事情。請檢查副作用本身：查詢資料庫記錄，或讓工具寫入可觀察的標記。請永久保留此迴歸測試：
- 在一次核准之後，於同一個對話串中發送數個不相關的後續對話回合。
- 斷言該副作用僅發生了一次。

## 較舊版本

在 2026 年中發佈的版本之前，AG-UI 配接器會在本地端解析核准，且絕不轉發給託管代理人 (microsoft/agent-framework#6652)。透過解析核准的回應鏈結 `previous_response_id` 亦可能在後續回合中重新執行該工具 (#6851)。兩者皆已在上游修復：#7271、#7345、#7480、#7594。

若程式庫中仍包含手動編寫的橋接器，用於轉換 `mcp_approval_request`/`mcp_approval_response` 或在核准回合後跳過儲存回應識別碼，請遵循以下步驟：
1. 升級至最新的 `agent-framework-*` 套件。
2. 在不使用該暫時因應措施 (workaround) 的情況下執行迴歸測試。
3. 僅在測試通過時刪除該暫時因應措施。

wiring §2 相容層中的兩個目前互通性修正亦遵循相同的規則。

## 除錯決策樹

由上而下進行排查：
1. **核准時出現 400/500 "No tool output found for function call"**：託管代理人使用了 Chat Completions 用戶端。請改用 `FoundryChatClient`。
2. **沒有核准卡片，瀏覽器顯示 `INCOMPLETE_STREAM` / "Cannot send 'TOOL_CALL_END' event: No active tool call found"**：閘道缺少來自 wiring §2 的相容層。
3. **沒有核准卡片，亦無錯誤**：`useInterrupt` 未掛載在提供者內部，或者工具缺少 `approval_mode` 且已立即執行。使用 curl 檢查 `RUN_FINISHED.outcome`，並使用 `azd ai agent monitor` 檢查託管代理人記錄。
4. **核准後產生另一個核准請求而非執行工具**：閘道未使用 `use_service_session=True`。
5. **點擊無反應，無錯誤**：負載 (payload) 不相符（參見上方的合約）。閘道回覆 `APPROVAL_RESUME_REQUIRED` 表示用戶端傳送了工具訊息但未包含 `resume` 項目。
6. **核准後執行了工具，但後續的每個回合皆傳回空的執行**（僅 `RUN_STARTED` → `RUN_FINISHED`）：重複的中斷工具訊息傳達至配接器。請套用 wiring §2 的相容層。
7. **核准後顯示回覆，但副作用從未發生**：決定未傳達至託管代理人。升級套件，接著以帶有 resume 的 `curl` 呼叫閘道，觀察是否有傳回 `TOOL_CALL_RESULT`。
8. **運作一次，但後續回合重複發生副作用**：過時的暫時因應措施或過舊的套件（請參閱「較舊版本」）。
9. **執行期間卡片可見，但在 `RUN_FINISHED` 後消失**：最終的 `MESSAGES_SNAPSHOT` 與即時事件不同。在執行後檢查 DOM，並升級 CopilotKit。
10. **`RUN_ERROR` "No pending approval interrupt found for resume interruptId 'mcpr_…'"**：閘道已重新啟動，或者 resume 傳送到了與發出核准時不同的複本。工具並未執行且交談仍可使用，因此請重新提問。若有多個複本，請使用工作階段同質性 (session affinity)。對於必須在重新啟動後存活的核准，請使用 Invocations 工作流程。
