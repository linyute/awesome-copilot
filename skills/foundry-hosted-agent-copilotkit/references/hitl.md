# 人機互動審批

HITL 是此技術堆疊中風險最高的特色：它管制了會產生副作用的重要操作，且其失敗模式是無聲的（例如工具在未經審批的情況下執行，或執行了兩次）。請將每次 HITL 的變更視為安全關鍵（safety-critical），並驗證所有三種結果：核准執行一次、拒絕執行零次、後續輪次（follow-up turns）執行零次。

## 連接配置 (Python, 進程內 AG-UI 端點)

```python
from agent_framework import Agent, tool
from agent_framework_ag_ui import AgentFrameworkAgent, add_agent_framework_fastapi_endpoint

@tool(approval_mode="always_require")
def transfer_money(from_account: str, to_account: str, amount: float) -> str:
    """帳戶間轉帳。"""
    ...

agent = Agent(name="assistant", instructions="...", client=chat_client,
              tools=[transfer_money, check_balance])
wrapped = AgentFrameworkAgent(agent=agent, require_confirmation=True)
add_agent_framework_fastapi_endpoint(app, wrapped, "/")
```

兩者皆為必要設定：工具上的 `approval_mode="always_require"` 以及封裝器上的 `require_confirmation=True`。請注意，`approval_mode` 僅控制*審批* —— `never_require` 並不代表該工具是唯讀的；這是實作者的責任。

**.NET** 使用與 Python 封裝器標記不同的機制：將工具封裝在 `ApprovalRequiredAIFunction` 中，然後將*代理（agent）*封裝在 `DelegatingAIAgent` 中，以在 `request_approval` 用戶端工具呼叫之間架起審批內容的橋樑（官方 [`Step04_HumanInLoop`](https://github.com/microsoft/agent-framework/tree/main/dotnet/samples/02-agents/AGUI/Step04_HumanInLoop) 範例中的模式）：

```csharp
// 該工具需要審批；請對代理進行封裝，以便使用者介面可以渲染審批卡片。
AITool[] tools = [new ApprovalRequiredAIFunction(AIFunctionFactory.Create(ApproveExpenseReport))];
var baseAgent = openAIChatClient.AsAIAgent(name: "assistant", instructions: "...", tools: tools);
var agent = new ServerFunctionApprovalAgent(baseAgent, jsonOptions.SerializerOptions);
app.MapAGUI("/", agent);

internal sealed class ServerFunctionApprovalAgent(AIAgent inner, JsonSerializerOptions json)
    : DelegatingAIAgent(inner)
{
    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(...)
    {
        // INBOUND：在內部代理運行之前，將客戶端的 `request_approval` 呼叫及其結果轉換回配對的
        // ToolApprovalRequestContent / ToolApprovalResponseContent。
        // 如果在歷史紀錄中留下未配對結果的 request_approval 工具呼叫，會導致 Azure OpenAI 回應 400：
        // "tool_calls must be followed by tool messages..."。
        var processed = ProcessIncomingFunctionApprovals(messages.ToList(), json);
        await foreach (var update in InnerAgent.RunStreamingAsync(processed, ...))
            // OUTBOUND：將 ToolApprovalRequestContent 轉換為 `request_approval` 客戶端工具呼叫，
            // 以便前端可呈現審批卡片。
            yield return ProcessOutgoingApprovalRequests(update, json);
    }
}
```

內容類型為 `ToolApprovalRequestContent`/`ToolApprovalResponseContent`（而非 `FunctionApprovalRequestContent`），解決方法是*轉換*審批呼叫/結果並保持成對，而不是從訊息歷程記錄中刪除它們，否則 Azure OpenAI 會失敗並顯示 "tool_calls must be followed by tool messages responding to each 'tool_call_id'"（工具呼叫後必須附帶回應每個 'tool_call_id' 的工具訊息）。

## 前端

```tsx
useHumanInTheLoop({
  name: "confirm_changes",           // 必須與伺服器提供的內容一致。
  render: ({ args, respond, status }) => (
    <ApprovalCard
      args={args}
      onApprove={() => respond?.({ accepted: true })}
      onReject={() => respond?.({ accepted: false })}
    />
  ),
});
```

**酬載（payload）格式是一項協定，而非框架功能。** CopilotKit 的 `respond(...)` 接受任何 JSON 值；伺服器端程式碼決定何者算作「已核准」。請仔細閱讀伺服器的偵測邏輯並精確對應 —— 如果 UI 解析 `{ approved: true }` 但伺服器檢查的是 `accepted` 鍵，則會無聲地失敗：點擊後沒有任何反應，各處皆無報錯。每當審批「毫無反應」時，請先將解析後的酬載與伺服器的偵測邏輯進行比對（diff）。

伺服器呈現的審批工具名稱（例如 `confirm_changes`）必須透過 `useHumanInTheLoop` 註冊，否則卡片將永遠不會出現。

## 託管代理（Hosted agents）：審批實際是如何傳遞的

當代理作為 Foundry 託管代理在 Responses 協定後端執行時，受審批管制的工具會在 Responses 串流中呈現為 `mcp_approval_request` 項目。決定必須作為 `mcp_approval_response` 輸入項目傳回；接著，託管代理在核准後會在**伺服器端**重新執行該工具。這會產生兩個後果：

1. **現成的 AG-UI 配接器（adapter）不會將審批轉發給遠端代理** —— 它在本地解析 `confirm_changes`，因此核准看起來成功了，但受管制的工具從未重新執行，且狀態也從未改變（此問題追蹤為 microsoft/agent-framework#6652，截至 2026 年中仍處於 open 狀態）。通往託管代理的橋接器需要明確的審批轉發程式碼。特徵症狀：審批卡片正常工作，核准返回正常回覆，但副作用從未發生。
2. 核准意味著重新執行發生在 UI 視線之外。請透過觀察*狀態變更*（事後查詢受影響的記錄）來進行驗證，而不是看聊天記錄是否正確。

橋接器會明確提供該轉發 —— 在出站（outbound）時，它將託管代理的 `mcp_approval_request` 轉換為前端的審批工具呼叫；在入站（inbound）時，它將 UI 的 `{accepted}` 結果轉換回 `mcp_approval_response` 輸入項目：

```python
# OUTBOUND：託管代理發出 mcp_approval_request -> 將其呈現為前端的
# `confirm_changes` 工具呼叫，以便 CopilotKit 的 useHumanInTheLoop 呈現審批卡片。
elif item["type"] == "mcp_approval_request":
    _PENDING_APPROVAL[thread_id] = item["id"]          # 記住請求 id
    yield tool_call(APPROVAL_TOOL, {                   # APPROVAL_TOOL == "confirm_changes"
        "function_name": item.get("name", ""),
        "function_arguments": item.get("arguments", ""),
    })

# INBOUND（下一輪）：UI 的 {accepted} 結果 -> 轉為託管代理可理解的 mcp_approval_response 輸入項目。
# 原始的 AG-UI adapter 不會執行此步驟。
pending = _PENDING_APPROVAL.get(thread_id)
if pending and last_tool_result and "accepted" in last_tool_result:
    _PENDING_APPROVAL.pop(thread_id, None)
    turn_input = [{"type": "mcp_approval_response",
                   "approval_request_id": pending,
                   "approve": bool(last_tool_result["accepted"])}]
```

## 重複執行危害（在發佈任何 HITL 變更前閱讀）

**症狀：** 一次審批運作正常，但在同一對話中更晚且無關的後續輪次會無聲地重新執行相同的受管制工具 —— 副作用會套用兩次，且沒有審批卡片或任何可見指示。

**根本原因（藉由使用 curl 呼叫託管代理的裸端點 `/responses` 來隔離此問題 —— 過程中沒有 AG-UI，也沒有 CopilotKit）：** 將 `previous_response_id` 串接在已解析 `mcp_approval_response` 的回應之後，會使得託管的執行階段（runtime）在下一輪次中重新執行已核准的工具，而不論該輪次的內容為何。此錯誤存在於 agent-framework/Foundry 託管層中，而非存在於 AG-UI 配接器或 CopilotKit。此問題追蹤為 microsoft/agent-framework#6851（重複執行）與 #6828（相關的審批狀態症狀）；截至 2026 年 7 月，兩者皆仍處於 open 狀態 —— 在依賴框架行為之前，請檢查目前的狀態。

**使用 `previous_response_id` 串接的橋接器之緩解措施：** 在輸入包含 `mcp_approval_response` 的輪次之後，**請勿**儲存該回應識別碼以進行串接 —— 讓下一輪次在沒有 `previous_response_id` 的情況下啟動。這會消耗極少量的對話記憶體，並保證受管制的動作絕不會無聲地執行兩次。平台模式對話（Foundry 的 `conversation` 對話物件，而非回應識別碼串接）有不同的機制 —— 請勿假設它們對此免疫，請進行明確測試。

```python
# 在 response.completed 時，我們通常會儲存 id，以透過 previous_response_id 串接下一輪。
# 但如果「此」輪解決了一個審批（approval），請不要儲存它：
# 透過解析審批的回應進行串接會使託管執行階段在下一個不相關的回合中無聲地
# 重新執行已核准的工具（agent-framework #6851）。
if approval_turn:
    _LAST_RESPONSE.pop(thread_id, None)   # 中斷串接 -> 避免重複執行
else:
    _LAST_RESPONSE[thread_id] = response_id
```

**永久保留的迴歸測試：** 在核准之後，在同一個執行緒（thread）中發送數個無關的後續輪次，並斷言受管制工具的副作用沒有再次發生（例如計數器精確地僅遞增一次）。只有在上游問題被關閉**且**此測試在沒有緩解措施的情況下通過時，才能移除任何本地緩解措施 —— 絕不能僅憑版本號升級就移除。

## HITL 偵錯決策樹

自上而下進行排查；每個步驟皆有其獨特的特徵特徵：

1. **核准 → 400/500 "No tool output found for function call ..."**（找不到函式呼叫的工具輸出） → 代理的模型用戶端是基於 Chat Completions 的。在託管代理上恢復審批需要 Responses 協定用戶端（MAF Python 中的 `FoundryChatClient`）。請更換用戶端。
2. **未出現審批卡片** → 未針對顯露的工具名稱註冊 `useHumanInTheLoop`，或是工具遺漏了 `approval_mode="always_require"`（它會立即執行 —— 請檢查伺服器日誌以確認工具執行情況）。
3. **點擊核准沒有任何反應，且無報錯** → `respond(...)` 與伺服器偵測之間的酬載格式不匹配（請見上述協定）。
4. **審批已解析，回覆開始串流，但狀態從未改變** → 審批在本地端解析，且從未到達遠端代理（屬於 #6652 類問題）。請確認橋接器/配接器確實轉發了 `mcp_approval_response`。
5. **正常運作一次，隨後的輪次發生重複執行** → 請參見上方的重複執行危害。
6. **卡片在執行過程中渲染，但在 `RUN_FINISHED` 時消失** → 訊息快照呈現方式與實際事件不同（多工具呼叫的輪次被合併到單一訊息中；某些 UI 版本僅渲染第一個工具呼叫）。請修正快照建構方式或升級 UI 層；請驗證執行後的 DOM，而非僅僅在執行中驗證。
7. 僅在此時才懷疑環境問題：租戶不匹配的 403、權杖對象錯誤的 401、在本地端執行的代理中過期的記憶體內資料（在測試輪次之間重新啟動 `azd ai agent run`）。
