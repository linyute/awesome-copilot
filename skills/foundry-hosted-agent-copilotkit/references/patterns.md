# 此堆疊上的 7 種 AG-UI 互動模式

這些是標準的 AG-UI「dojo」模式（dojo.ag-ui.com 有線上的 Microsoft Agent Framework 範例）。MAF AG-UI 整合文件支援所有這七種模式。下表將每種模式對應到其代理端和 CopilotKit 端的實作；隨後的說明涵蓋了那些「非顯而易見」的部分。

CopilotKit hook 命名：`useCopilotAction` 仍然存在，但被記錄為舊版相容性 hook。目前的名稱為：`useFrontendTool`（代理可呼叫的前端工具）、`useHumanInTheLoop`（核准 UI；`useCopilotAction` 搭配 `renderAndWaitForResponse` 的後續替代方案）、`useRenderToolCall` / `useRenderTool`（僅渲染的生成式 UI）、`useCoAgent` / `useCoAgentStateRender`（共用狀態）。請根據已安裝套件的 TypeScript 宣告驗證確切的匯出項目 — 名稱在次要版本之間有所變動。

| # | 模式 | 代理端 (MAF Python) | CopilotKit 端 |
| --- | --- | --- | --- |
| 1 | 代理式聊天 + 前端工具 | 純 `Agent` — 前端工具透過 `RunAgentInput.tools` 傳入 | `useFrontendTool({ name, parameters, handler })` |
| 2 | 後端工具渲染 | `@tool`（在伺服器端執行） | `useRenderToolCall` / 工具名稱的渲染入口 |
| 3 | 人機協同 (Human-in-the-loop) | `@tool(approval_mode="always_require")` + `AgentFrameworkAgent(require_confirmation=True)` | `useHumanInTheLoop({ name, render })`，透過 `respond(...)` 解析 |
| 4 | 代理式生成式 UI | 傳送進度狀態的長時間執行工具 | 渲染進行中狀態的 `useCoAgentStateRender` |
| 5 | 基於工具的生成式 UI | 模型必須呼叫的僅宣告工具（無可執行的主體） | 帶有 `render` 的 `useFrontendTool`，通常 `followUp: false` |
| 6 | 共用狀態 | 狀態結構描述 (state schema) + 來自工具的狀態更新 | `useCoAgent` — 讀取 `state`，透過 `setState` 寫入 |
| 7 | 預測性狀態更新 | 設定為樂觀狀態預測的工具參數串流 | `useCoAgent` + 確認 UI |

## 節省時間的注意事項

**模式 1 (前端工具)。** 工具在瀏覽器中執行；代理僅發出呼叫。如果代理回報看不到前端工具，請檢查 CopilotKit 執行階段在目前的套件版本中是否確實將註冊的工具轉發到 `RunAgentInput.tools` 中 — 在 1.62.x 中曾存在此特定轉發的迴歸問題（CopilotKit/CopilotKit#5813，隨後很快被修復）。與任何程式碼變更相比，升級或鎖定在修復版本之後的版本更為重要。

**模式 2 (後端工具渲染)。** 渲染元件接收串流的工具呼叫參數，隨後接收結果。存在兩個渲染階段：執行期間的即時 `TOOL_CALL_*` 事件，以及執行結束時的 `MESSAGES_SNAPSHOT`。如果在串流期間渲染的卡片在 `RUN_FINISHED` 時因為快照對輪次的表示方式不同而消失（特別是：當 UI 僅渲染第一個呼叫時，多個工具呼叫被合併到單個助理訊息中）。請務必在執行完成後驗證該卡片是否仍然存在。

**模式 3 (HITL)。** 在 hitl.md 中有完整說明 — 包括承載資料結構契約 (payload-shape contract) 和重複執行危害。

**模式 5 (基於工具的生成式 UI)。** 代理端的工具是一個沒有實作的宣告 — 模型「呼叫」它，前端將參數渲染為 UI。當工具呼叫是該輪次的終端行為時，請使用 `followUp: false`，否則代理會多餘地敘述該工具呼叫。如果模型必須始終產生 UI，請在代理端限制工具選擇，而不是寄望於提示詞就足夠了。

**模式 4/6/7 (狀態系列) — 架構依賴性。** 僅當 AG-UI 配接器封裝行程內 (in-process) 代理時（architecture.md 中的架構 A 和 B），才會原生發送 `STATE_SNAPSHOT`/`STATE_DELTA` (RFC 6902 JSON Patch) 事件。Responses 協定橋接器（架構 C）不會從託管代理取得這些事件；它們必須由橋接器從工具參數 delta 中合成，且來自用戶端的 `setState` 必須明確轉發到代理的輸入中。在實作共用狀態功能之前，請確認程式碼庫屬於哪一種架構 — 否則您將會針對永遠不會到達的事件編寫前端程式碼。`useCoAgent().state` 始終保持為空通常意味著代理沒有設定狀態結構描述，或者沒有任何工具寫入狀態鍵，而不是前端的錯誤。

**參數重新命名會波及 UI。** 渲染元件通常會從串流的工具參數中解析特定欄位。重新命名 Python 工具參數會無聲地損壞卡片（錯誤/缺失欄位），而代理仍能繼續工作 — 橋接器/配接器會逐字轉發參數。每當您重新命名工具參數時，請在前端搜尋 (Grep) 舊的欄位名稱。

**安全對齊 (Grounding-safe) 的工具說明文件。** 對於模型應從即時資料（帳號、識別碼、金額）中衍生出來的欄位，請勿在參數描述中嵌入具體的範例值：模型會將描述中的字面範例複製到實際呼叫中。請描述形狀、使用預留位置，並在工具內部進行驗證。
