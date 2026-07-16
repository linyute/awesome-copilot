# 疑難排解：症狀 → 根本原因 → 修正

所有項目均為經實測驗證的失敗模式及其精確特徵。HITL 專屬的失敗位於 hitl.md；此檔案依分層涵蓋了其他所有內容。

## 偵錯方法

在修改程式碼之前，先在儘可能低的層級進行重現：

1. `curl -N -X POST <agui-endpoint> -H 'Content-Type: application/json' -d '<minimal RunAgentInput>'` —— 讀取原始的 AG-UI SSE 事件。重現 → 前端無辜。
2. 對於託管型代理程式，直接呼叫純粹的 `/responses`（或 `/invocations`）端點。重現 → AG-UI 轉接器與 CopilotKit 無辜；錯誤位於框架/託管層級。此技術是用於隔離重複執行錯誤（hitl.md）的方法。
3. 在每次測試之間重新啟動於本機執行的代理程式 —— 來自先前測試的記憶體內狀態會導致結果在兩個方向上都產生偏差。

## CopilotKit 執行階段 / 前端

| 症狀 | 根本原因 | 修正 |
| --- | --- | --- |
| "找不到代理程式 `<name>`" | 執行階段的 `agents` 鍵值、`<CopilotKit agent>` 屬性與託管的 `agent.yaml` 名稱之間的名字不一致；或是執行階段設定中的單一端點/多端點路由不相符 | 為代理程式名稱使用一個共享的常數；根據已安裝版本的說明文件檢查執行階段的端點模式選項 |
| 對執行階段子路由（例如對話討論串 threads）的請求傳回 404/405 | 路由處理常式註冊在固定路徑，但執行階段版本預期的是用於處理多個子路徑的全包式（catch-all）路由 | 使用選用的全包式路由區段（Next.js App Router 中的 `[[...slug]]`），並匯出處理常式支援的所有 HTTP 方法 |
| `next build` 型別錯誤：`HttpAgent` 缺少屬性（例如 `pendingInterrupts`） | 安裝的 `@ag-ui/client` 版本與建構 `@copilotkit/runtime` 時所使用的版本不同 | 將 `@ag-ui/client` 鎖定在與安裝的 `@copilotkit/runtime` 所依賴的完全相同之版本（檢查其 package.json） |
| 主控台："Failed to execute 'fetch' on 'Window': Illegal invocation"；代理程式從未執行 | 某個函式庫將 `fetch` 擷取為純粹參考，並使用錯誤的 `this` 呼叫它（常見於 CopilotKit v2 對話討論串儲存 + `@ag-ui/client` `HttpAgent`） | 在載入任何模組之前綁定 fetch，例如在根配置（root layout）`<head>` 中的內嵌指令碼：`if(!window.fetch.__bound){var f=window.fetch.bind(window);f.__bound=true;window.fetch=f;}` |
| 代理程式無法偵測到前端工具 | 已知的轉發迴歸問題：註冊的前端工具未包含在 `RunAgentInput.tools` 中（CopilotKit/CopilotKit#5813，1.62.x 時代） | 升級至已修正的版本之後；在進行任何 CopilotKit 升級後，務必明確地重新測試前端工具的可見性 |
| 在執行錯誤後，停止按鈕 / 錯誤處理損毀 | 在 `RUN_ERROR` 之後附加 `TEXT_MESSAGE_END` 的事件順序錯誤（CopilotKit/CopilotKit#5812） | 追蹤已修正的版本；避免依賴錯誤發生後的事件 |
| 當執行結束時，工具/核准卡片會消失 | 執行結束時的 `MESSAGES_SNAPSHOT` 與即時事件所呈現的對話輪次不同（例如：多個工具呼叫被合併至單一訊息中；UI 僅渲染第一個呼叫） | 修正快照建構（每個助理訊息僅包含一個工具呼叫）或升級 UI 層級；務必驗證執行後的 DOM |
| 升級後的 API 變動（處理常式工廠重新命名、提供者屬性變更） | CopilotKit 在次要版本之間變動了 API；`useCopilotAction` 為舊版遺留項目 | 根據安裝套件中隨附的 `.d.ts` 檔案驗證名稱，而不是憑說明文件或記憶體 |

## AG-UI / 轉接器層

| 症狀 | 根本原因 | 修正 |
| --- | --- | --- |
| 傳送歷程記錄時出現 400 錯誤與「孤立」（orphaned）的工具呼叫錯誤 | 原始的 AG-UI 訊息歷程記錄被重新傳送至自行管理歷程記錄的 Responses 端點 | 衍生出每輪的輸入（最新的使用者訊息或核准決定）；絕不重新傳送完整的對話紀錄 |
| 在執行時間較長的無聲工具運作中途，UI 顯示 500 錯誤 | Proxy/閘道器中斷了閒置的 SSE 連線 | 每隔約 10 秒從 AG-UI 端點發出 SSE 保持連線（keep-alive）的註解（`: ping`） |
| `useCoAgent().state` 總是為空 | 代理程式上未設定狀態結構描述（schema），且沒有工具寫入狀態鍵值 —— 或是無狀態合成的架構 C（參閱 patterns.md） | 設定狀態結構描述並確保有工具寫入它；在 Responses 橋接器上，確認確實存在狀態合成 |

## Foundry 連線 / 驗證

| 症狀 | 根本原因 | 修正 |
| --- | --- | --- |
| 401 "audience is incorrect" | 以預設的 `cognitiveservices.azure.com` 範圍（scope）請求權杖 | 請求範圍 `https://ai.azure.com/.default` |
| 即使已登入且具備該角色，仍出現 403 `Microsoft.MachineLearningServices/workspaces/agents/action` | `az` CLI 的作用中訂閱/租戶與 Foundry 專案的訂閱/租戶不同（多租戶帳戶）。在錯誤的租戶下進行角色查閱甚至無法解析代理人（assignee），從而模擬出缺少 RBAC 的情況 | 將 `az account show` 與專案的租戶/訂閱進行比較；使用 `az account set --subscription <correct>` 或 `az login --tenant <correct>`。不需變更任何程式碼 —— 請勿誤認為套件迴歸問題 |
| 已部署的代理程式對來自自訂用戶端的每次呼叫都傳回 400 | 用戶端傳送了 `x-ms-user-isolation-key`；已部署的代理程式使用的是衍生自 Entra 的隔離機制 | 為已部署的代理程式移除該標頭（header） |
| 橋接器中的非同步 `DefaultAzureCredential` 失敗 | 遺失非同步傳輸（async transport） | `pip install aiohttp` |
| 對剛啟動的本機代理程式之首次請求傳回 404 `DeploymentNotFound`，即使該模型部署確實存在 | 託管執行階段中的預熱不穩定 | 重試一次，或使用相同的環境變數重新啟動 |
| 新的 `azd ai agent run` 失敗，並顯示「Address already in use」（令人困惑的 hypercorn 追蹤記錄） | 殘留的本機託管代理程式處理程序佔用了連接埠 8088 | 執行 `ss -ltnp | grep 8088`，刪除（kill）殘留的處理程序，然後重試 |

## Python 相依性陷阱

| 症狀 | 根本原因 | 修正 |
| --- | --- | --- |
| Foundry 遠端映像檔建構在奇特的遞移相依性（wasm 相關）上失敗 | 依賴 `agent-framework` 中繼套件，該套件會拖入選用的額外項目（extras） | 僅依賴 `agent-framework-core` 加上您實際使用的特定額外項目（例如 `agent-framework-foundry`、`agent-framework-ag-ui`） |
| 託管容器中針對 `mcp` 出現 `ImportError` | `agent_framework_foundry_hosting` 自 `mcp` 匯入，但在遠端建構中並未遞移地被拉取 | 在託管的 requirements 檔案中加入明確鎖定的 `mcp` 版本 |
| 遺失 `httpx` API（`AsyncClient` 消失） | 以搶先體驗（prerelease）解析度進行安裝時，拉取了 httpx 1.0 開發建構版本 | 將 httpx 鎖定在目前的穩定版本線上 |
| 託管的代理程式快速失敗：`RuntimeError: the hosted environment is running on protocol 1.0.0, but the agent requires protocol 2.0.0` | 託管套件的 Responses 協定版本與 `agent.yaml`/`agent.manifest.yaml` 中宣告的 `version:` 不一致 | 同時升級套件以及兩個資訊清單（manifest）的協定版本 |
| 透過 Foundry 代理程式用戶端進行呼叫時，Python `@tool`「沒有在 Foundry 中執行」 | 設計上，用戶端工具的可呼叫物件是在用戶端執行；在該路徑上，只有 Foundry 原生工具會在伺服器端執行 | 此為預期行為 —— 如果工具必須在該處執行，請託管代理程式（在伺服器端執行迴圈） |
