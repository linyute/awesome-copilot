# 安全地升級相依性

截至 2026 年中，此堆疊的每一層都處於 1.0 之前、版本候選或預覽版階段：`@ag-ui/*` 為 0.0.x、`agent-framework-ag-ui` 為 RC、Foundry 裝載套件為 alpha/beta、託管代理程式本身為預覽版，且 CopilotKit 每週發布會變更 API 的次要版本。升級是此堆疊最容易損壞的地方。切勿單獨升級單一套件。

## 版本關係規則 (必須同時滿足所有條件)

1. **`@ag-ui/client` ↔ `@copilotkit/runtime`**：執行階段會固定一個精確的 `@ag-ui/client` 版本。您的應用程式的 `@ag-ui/client` 必須與之相配，否則 TypeScript 會因 `HttpAgent` 外觀差異（例如缺少 `pendingInterrupts`）而發生錯誤。在升級 CopilotKit 後，請閱讀已安裝執行階段的 `package.json` 並進行調整。
2. **`@copilotkit/*` 套件必須同步移動**：`react-core`、`react-ui` 和 `runtime` 是同步發布的 — 切勿混用版本。檢查 lockfile 是否確實解析了 `package.json` 所要求的版本。
3. **`agent-framework-*` Python 套件保持在同一個分支**：`agent-framework-core`、`agent-framework-foundry`、`agent-framework-ag-ui` 和裝載套件必須來自相容的版本。請依賴 `agent-framework-core` + 特定的額外項目，而非 `agent-framework` 元套件（它會拖入選用相依性，從而破壞 Foundry 遠端映像的建構）。
4. **裝載協定版本 ↔ 代理程式 manifest**：Foundry 裝載套件實作了特定的 Responses 協定版本；`agent.yaml` 與 `agent.manifest.yaml` 必須宣告相同的 `version:`，否則代理程式在啟動時會因明確的協定不相容 RuntimeError 而快速失敗。請在同一個提交中升級套件與兩個 manifest。
5. **已棄用套件檢查**：`agent-framework-azure-ai` 已被 `agent-framework-foundry` 取代。若程式碼庫仍匯入舊套件，請在進行任何其他升級前先進行遷移。

## 升級流程

1. **首先清點本機因應措施 (workarounds)。** 維護一個記帳簿，將程式碼庫中的每個補丁/因應措施對應到其存在之目的的上游 issue（例如：核准轉發程式碼 ↔ microsoft/agent-framework#6652；`previous_response_id` 防護 ↔ #6851/#6828；前端 fetch-bind 墊片 ↔ 非法呼叫 (Illegal-invocation) 錯誤）。升級是移除這些因應措施的唯一時機，且僅能在該 issue 已在隨附版本中關閉，且防護該因應措施的迴歸測試在沒有它的情況下通過時才能移除。切勿僅因版本升級就刪除因應措施。
2. **閱讀實際發布的內容。** CopilotKit 的發布說明通常是空的自動發布存根 — 請對比版本之間隨附的 `.d.ts` 檔案以了解 API 變更，並掃描 issue 追蹤器以尋找您整合路徑中的迴歸問題（遠端 `HttpAgent` + 前端工具在歷史上是個脆弱的組合）。
3. **根據上述規則協調地進行升級**；重新安裝；檢查 lockfile 解析結果。
4. **即時驗證完整矩陣** — 而不只是編譯：
   - 透過實際 UI 的讀取/查詢路徑；
   - 代理程式可見的前端工具（明確驗證 — 此部分先前曾發生過迴歸）；
   - 核准 (approve) 剛好執行受限工具一次；拒絕 (reject) 執行零次；
   - 核准後的後續回合不會重複執行（hitl.md 風險）；
   - 工具/核准卡在 `RUN_FINISHED` 之後仍然存在，而不僅僅是在串流處理期間。
5. **對於託管代理程式**：在相依性變更後重新啟動 `azd ai agent run`（本機執行階段在兩次執行之間不會快取任何內容，但您記憶體中的種子資料會重設 — 在斷言之前重新建立基準），然後重新部署並抽樣檢查已部署的端點；本機成功並不代表遠端映像建構成功（遠端建構會獨立解析相依性 — 明確固定版本可避免偏移）。

## 每次升級時要檢查的已知上游問題

狀態截至 2026 年 7 月為準 — 在採取行動前請重新確認：

| Issue | 造成的影響 | 本機因應措施模式 |
| --- | --- | --- |
| microsoft/agent-framework#6652 | AG-UI 配接器會在本地解析 HITL 核准；絕不轉發給遠端/託管代理程式，因此獲得核准的工具不會重新執行 | 橋接器中的自訂核准路由 |
| microsoft/agent-framework#6851 | 受核准限制的工具在稍後無關的回合中，透過 `previous_response_id` 鏈結默默地重新執行（重複的副作用） | 不要鏈結來自核准解析回合的回應識別碼 (hitl.md) |
| microsoft/agent-framework#6828 | 完成後核准 UI 狀態恢復為「進行中」；與 #6851 相關 | 除非與 #6851 搭配，否則僅影響外觀 |
| CopilotKit/CopilotKit#5813 | 前端工具在使用遠端 `HttpAgent` 時未轉發至 `RunAgentInput.tools` (1.62.x 時代) | 升級至已修復之版本以上；每次升級後重新測試工具可見性 |
| CopilotKit/CopilotKit#5812 | 在 `RUN_ERROR` 之後發出 `TEXT_MESSAGE_END`，破壞了錯誤處理 | 升級至已修復之版本以上 |

## Foundry 平台截止日期

在 2026 年 4 月之前的預覽版後端（`azure-ai-agentserver-agentframework` / `-langgraph` 路徑）上部署的託管代理程式已於 2026-05-22 終止支援 — 任何仍在此路徑上的項目都必須在目前的裝載套件上重新部署，而非就地升級。請參閱 Microsoft Learn 上的託管代理程式遷移指南 (`/azure/foundry/agents/how-to/migrate-hosted-agent-preview`)。
