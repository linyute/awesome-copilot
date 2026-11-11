# 疑難排解與升級

首先在最低的故障層級重現問題：託管代理人 → 閘道 (`curl -N`) → CopilotKit 路由 → 瀏覽器。與下方的精確錯誤訊息進行比對。HITL 故障請參閱 [hitl.md](hitl.md#debugging-decision-tree)。

## 託管代理人與 azd

| 徵兆 | 原因 | 修正方式 |
| --- | --- | --- |
| HTTP 424 `session_not_ready` | `main()` 在提供 `/readiness` 服務前即擲出例外狀況（通常缺少環境變數） | 檢查 `azd ai agent monitor`；透過提供帶有可行建議訊息的虛設常式 (stub) 代理人進行輕緩降級 (fail soft) |
| `RuntimeError: ... running on protocol 1.0.0, but the agent requires protocol 2.0.0` | 託管套件與 `azure.yaml` 中的 `protocols[].version` 不一致 | 在同一次認可中同時升級套件與 `azure.yaml` |
| `azd deploy`: `Foundry dependencies are not ready: ... FOUNDRY_PROJECT_ENDPOINT is not set` | `init` 在含有現有 `azure.yaml` 或環境的目錄中執行，導致專案繫結不完整（通常 `AZURE_LOCATION` 也錯誤） | 在乾淨目錄中重新執行 `azd ai agent init --no-prompt -e <new-env> -p ... -d ...` 並檢查 `azd env get-values`；切勿對現有專案執行 `azd provision` |
| `azd ai agent ...` 回報擴充套件「不相容 (Incompatible)」 | azd 核心版本低於該擴充套件的需求 | `azd update && azd extension upgrade --all` |
| 遠端建構失敗，但本機建構成功 | 中繼套件 `agent-framework` 提取了選用額外項目，或未釘選的搶先預覽版解析出不同版本 | 相依於特定的 `agent-framework-*` 套件；釘選版本 |
| 已部署的代理人仍執行舊程式碼 | 流量被釘選至較舊版本 | `azd ai agent show`；將流量移轉至最新版本 |
| 400 "Hosted agents can only be called through the agent endpoint" | 在專案 Responses 端點上帶有 `agent_reference` 進行呼叫 | 使用 `.../agents/<name>/endpoint/protocols/openai/responses`，或 `FoundryAgent(agent_name=...)` |
| `agent_framework.azure` / `agent-framework-azure-ai` 出現 `ImportError` | 已被廢棄取代的套件 | 遷移至 `agent-framework-foundry` |

## 閘道 / AG-UI

| 徵兆 | 原因 | 修正方式 |
| --- | --- | --- |
| 401 "audience is incorrect" | 為錯誤的範圍請求權杖 | 使用 `https://ai.azure.com/.default` |
| 呼叫代理人時出現 401/403 | 閘道識別身分缺少專案上的角色，或權杖來自錯誤的租用戶 | 在專案上指派 Azure AI User 角色；`az login --tenant <id>` |
| 400 提及 `x-ms-user-isolation-key` | 將此標頭傳送至已部署的代理人 | 移除該標頭；識別身分來自 Entra |
| 瀏覽器執行失敗並出現 `INCOMPLETE_STREAM`: "Cannot send 'TOOL_CALL_END' event: No active tool call found with ID 'mcpr_...'" | 配接器關閉了從未啟動的託管核准識別碼 | 使用 [wiring §2](wiring.md#2-ag-ui-gateway-wiring-a) 中的閘道相容層 |
| `RUN_ERROR` `APPROVAL_RESUME_REQUIRED`: "Pending interrupts require a resume entry for every interruptId" | 僅以工具訊息形式傳送核准（v1 風格的 `confirm_changes` 回應） | 使用 `useInterrupt` 進行解析（會傳送 `resume`）；在 curl 中加入 `resume` 陣列 |
| 核准 → 產生第二個核准請求而非執行 | 每次執行都命中新的 Foundry 交談 | `use_service_session=True` + `service_session_id_from_thread_id=True` 搭配 `conv_…` 執行緒 ID |
| 核准之後，每個回合皆傳回 `RUN_STARTED` → `RUN_FINISHED` 且無內容 | 重複的中斷工具訊息傳達至配接器 | 使用 wiring §2 中的閘道相容層 |
| `ValueError: use_service_session=True requires snapshot persistence` | 啟用服務工作階段卻無將執行緒對應至交談的機制 | 加入 `service_session_id_from_thread_id=True` 並使用 `conv_…` ID 作為執行緒 ID ([wiring §2](wiring.md#2-ag-ui-gateway-wiring-a)) |
| 第一回合收到來自 Foundry 的 HTTP 500 `server_error` | 在設定 `service_session_id_from_thread_id=True` 時，執行緒 ID 不是 Foundry 交談 ID（例如 CopilotKit 產生的 UUID） | 先建立交談 (`POST .../endpoint/protocols/openai/conversations`) 並傳入其 `conv_…` ID 作為 `threadId` |
| `RUN_ERROR` "No pending approval interrupt found for resume interruptId" | 閘道重新啟動，或由不同複本接收 resume | 重新提問（工具並未執行）；在複本間使用工作階段同質性 (session affinity) |
| 工具執行但串流中沒有 `TOOL_CALL_RESULT` 事件；工具列轉譯為空 | 閘道執行於較舊的 `agent-framework-foundry`（1.11.0 出現過；1.13.1 可正常運作），通常是全域或使用者目錄 Python 而非專案 venv | 從具有最新套件的獨立 venv 執行閘道；在該 venv *內部*使用 `python -m pip list` 確認 |
| 關於 `aiohttp` 的非同步認證憑據錯誤 | `azure.identity.aio` 需要 aiohttp | `pip install aiohttp` |
| 關於孤立 / 未回答工具呼叫的 400 錯誤 | 將整個 AG-UI 交談記錄重播至 `/responses`（自訂閘道） | 僅傳送最新的使用者訊息以及交談 / 服務工作階段 |
| `useAgent().agent.state` 一律為空 | `AgentFrameworkAgent` 上未宣告 `state_schema`、無工具寫入狀態，或自訂閘道從不發出 `STATE_*` | 在閘道包裝函式上宣告結構描述；使用 curl 驗證 `STATE_SNAPSHOT` |

## CopilotKit / 前端

| 徵兆 | 原因 | 修正方式 |
| --- | --- | --- |
| "Agent `<name>` not found" | 執行階段 `agents` 索引鍵、`agentId` 與代理人名稱不一致 | 使用單一共用常數 |
| `/api/copilotkit/info` 或 `/agent/.../run` 出現 404 | v2 執行階段為多路由，但 Next.js 路由不是萬用 (catch-all) 路由，或 `basePath` 錯誤 | 使用 `app/api/copilotkit/[[...slug]]/route.ts` 搭配對應的 `basePath` |
| TypeScript 錯誤：`HttpAgent` 缺少屬性 | 應用程式的 `@ag-ui/*` 版本與執行階段所釘選的版本不一致 | 將 `@ag-ui/client`/`@ag-ui/core` 對齊至 `npm view @copilotkit/runtime@<v> dependencies` |
| "Failed to execute 'fetch' on 'Window': Illegal invocation" | 函式庫呼叫已擷取的 `fetch` 時缺少其 `this` 內容 | 升級套件；或在提供 fetch 選項處傳入 `fetch.bind(window)` |
| 瀏覽器發出 CORS 錯誤 | 瀏覽器直接呼叫閘道 | 瀏覽器 → CopilotKit 路由（同源） → 伺服器端呼叫閘道；否則使用明確的 CORS 允許清單 |
| 升級後 Hook 未匯出 / 重新命名 | 針對 `/v2` 使用了 v1 名稱 (`useCopilotAction`、`useCoAgent`、`CopilotKit` 提供者) | 從 `@copilotkit/react-core/v2` 匯入 v2 名稱；檢查隨附的 `.d.ts` |
| 開發環境警告 "The agent called the tool ... and no renderer is registered"；工具結果不可見 | 未註冊工具轉譯器 | `useDefaultRenderTool(...)` 或 `useRenderTool({ name, ... })` |
| Playwright：輸入文字停留在輸入框；無 `/agent/.../run` 請求 | 在凍結水合 (hydration) 前輸入，或 `fill()` 未觸發輸入處理常式 | 等待 `networkidle`、`click()`、`pressSequentially(text)`，然後 `press("Enter")` 並斷言輸入框已清空 |
| 工具呼叫在串流時轉譯，隨後消失 | 最終的 `MESSAGES_SNAPSHOT` 與即時事件不同 | 升級套件；在 `RUN_FINISHED` 之後測試 DOM |

## 升級 (Upgrades)

一律遷移至**最新**發佈版本，並同時遷移所有套件：

1. **`@copilotkit/*` 同步升級。** `react-core`、`runtime` 與所有 UI 套件維持在同一版本，且 `@ag-ui/*` 與執行階段所釘選的版本相符。
2. **`agent-framework-*` 維持在同一發佈版本分支。** 同時升級 `-core`、`-foundry`、`-ag-ui` 與 `-foundry-hosting`。
3. **通訊協定版本與 `azure.yaml` 同時變更**（參見上方表格）。
4. **暫時因應措施 (Workarounds) 必須有退場標準。** 維護一份清單，將每個本機因應措施對應至其上游 Issue。僅在修正版本已發佈**且**無此因應措施下通過迴歸測試時，才移除該措施。
5. **檢驗發佈內容。** CopilotKit 發佈說明有時為空虛設常式，因此請比對不同版本間隨附的 `.d.ts` 差異。
6. **在線上環境重新驗證：** 聊天路徑、前端工具抵達 `RunAgentInput.tools`、approve-once / reject-zero / follow-up-zero、`RUN_FINISHED` 之後的卡片，接著重新部署並針對已部署的代理人重複上述驗證。
