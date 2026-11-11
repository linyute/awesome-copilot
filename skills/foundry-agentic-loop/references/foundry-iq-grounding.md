# Foundry IQ 基礎 (Foundry IQ grounding)

`foundry-agentic-loop` skill 的參考資料：GitHub Copilot SDK **託管 agent** 如何透過取用受控管的 Foundry **toolbox MCP 端點**，經由 **Foundry IQ** 知識庫為企業答案提供佐證基礎 (grounding)。`foundry-agentic-loop` 決定基礎使用 Foundry IQ；本檔案包含存取路徑、身分識別、拒絕回答、驗證與應急出口指引。將索引/知識庫佈建與角色選取交由 `microsoft-foundry` 及其 `rbac` 子 skill 處理。

## 主要模式：託管 agent + toolbox MCP

預設的 foundry-agentic-loop 基礎使用：

1. 執行於 Foundry 託管 agent 上且預設公開 Responses API 的 **GitHub Copilot SDK 託管 agent**。
2. 用於行為指示的 **Foundry Skills API**；agent 在執行階段將受控管的 skill 版本下載至可寫入的暫存目錄中。
3. 透過 Foundry toolbox 連線/工具公開的一個 **Foundry IQ 知識庫**，通常是由 Azure AI Search 支援的 `CognitiveSearch` 或 Foundry IQ 基礎連線。
4. 一個受控管的 **Foundry toolbox MCP 端點**，作為 agent 呼叫的唯一執行階段工具與基礎表面。

託管 agent 預設不應匯入 `azure-search-documents`、具現化 Search 用戶端或呼叫 Foundry IQ 擷取 API。它橋接 toolbox MCP 端點，讓 toolbox 代理中介基礎/工具身分識別，並將 toolbox 回應視為答案證據與引用的來源。直接呼叫 Search 或 Foundry IQ 僅屬於佈建、擷取或下列明確記載的診斷應急出口範疇。

## 禁止繞過規則 (No-bypass rule)

每個企業答案皆透過 toolbox 託管的 Foundry IQ 基礎工具傳遞。應用程式與 agent 絕不可發出繞過知識庫、toolbox 控管或引用契約的隨席 (ad hoc) Azure AI Search 查詢。程式碼內直接擷取僅屬於[應急出口](#應急出口程式碼內直接擷取)的範疇。

## 基礎身分識別 (Grounding identity)

主要 toolbox 路徑是透過代理中介的：

| 擷取路徑 | 驗證身分 | 所需授權 |
| --- | --- | --- |
| **Toolbox MCP 基礎工具** - 附加至 toolbox 的 Foundry IQ / `CognitiveSearch` 連線 | 透過 Agent Service 代理中介之工具身分識別的託管 agent **agent 身分識別** (`agentIdentityId`) | 在 `agentIdentityId` 上擁有 Search / 知識庫資料平面角色；發佈後需重複進行，因為 agent 身分識別可能會變更 |
| **程式碼內直接擷取應急出口** - agent 程式碼使用 `DefaultAzureCredential` 呼叫 Search / Foundry IQ API | 託管 agent **執行階段執行個體受控識別** | 在 Search 服務上的 Search Index Data Reader，於執行階段身分識別存在後在 `postdeploy` 中授與 |

產生的計畫應將代理中介的 toolbox/工具身分識別路徑設為預設。執行階段執行個體受控識別 Search Reader 不屬於基準的一部分；僅在為疑難排解或不受支援的工具情境而明確選取直接擷取時才新增。

連線的驗證模式決定誰來呼叫 Search：`ProjectManagedIdentity` 連線以專案的受控識別進行呼叫（一個經由驗證的組建需要其上的 Search Index Data Reader 加上 Search Service Contributor）。當透過移除角色來證明最低權限時，請等待連線的權杖快取過期後，再信任持續的存取狀態。

## 引用與拒絕回答 (Citations and refusal)

為每個具佐證的主張傳回來源文件、區段與錨點/區塊識別碼 (chunk id)。從過濾後留存的已擷取文件中重建每個引用（標題、區段、錨點、不可路由的來源 URI）；絕不直接傳遞提供者的 Search URL 或模型編寫的引用欄位。在 API 契約中將「零引用的答案」視為拒絕回答。

拒絕回答必須具確定性。優先採用來自基礎工具的結構性訊號 -- 沒有引用在擷取/重新排序後留存 -- 而非對模型文字進行字串比對或信任模型回報的拒絕旗標。首先使用一個受支援與一個不受支援的查詢探測原始擷取：toolbox Search 工具可能會傳回低分文件而非空白清單。若 toolbox 公開重新排序器或相關性閾值，請依每個語料庫保持環境可設定性並在合成前套用，使微弱的比對變成空白證據。否則在 agent 中依照環境設定的最低分數篩選工具的結構化文件，拒絕格式錯誤的分數，並在無文件留存時拒絕回答。

## 執行階段驗證 (Runtime validation)

部署後驗證必須叫用**已部署**的託管 agent 並涵蓋：

1. **已知答案** - 受支援的問題傳回預期的具佐證主張。
2. **引用正確性** - 每個受支援的主張皆引用預期的來源、區段與錨點/區塊。
3. **新鮮度** - 新擷取或更新的來源內容在記錄記載的擷取時間範圍內變得可供擷取。
4. **無受支援來源時拒絕回答** - 不受支援的問題傳回精確的確定性拒絕回答，且不帶有捏造的引用。
5. **擷取遙測** - 記錄/追蹤顯示 toolbox 基礎呼叫、結果/引用計數、延遲與拒絕原因；執行階段記錄顯示沒有直接的 Search 用戶端呼叫。

若已知答案查詢因空白引用而拒絕回答，在調整提示詞之前，請先檢視 toolbox 呼叫結果與 agent 記錄，以檢查代理中介身分識別、角色指派、擷取或檢索失敗。

## 應急出口：程式碼內直接擷取 (Escape hatch: direct in-code retrieval)

僅在 toolbox 路徑無法支援所需的診斷或不受支援的預覽功能時，才使用程式碼內直接 Search / Foundry IQ 擷取。在 `docs/spec.md` (SDD) 或根目錄 `README.md` (rapid) 中記錄，將其與預設 agent 執行階段隔離，並在診斷完成後將其移除或停用。

應急出口的影響：

- 僅在該變體中新增直接擷取 SDK 相依性；切勿在預設託管 agent 相依性中包含 `azure-search-documents`。
- 該呼叫驗證為託管 agent **執行階段執行個體受控識別**，而非 `agentIdentityId`。
- 在具可重現性的 `postdeploy` 攔截勾點中授與 **Search Index Data Reader** 給執行階段執行個體身分識別，因為 Bicep 無法將角色指派給在 agent 部署前尚不存在的身分識別。
- 若應用程式亦在處理程序內執行直接擷取，驗證這兩種驗證路徑；後端應用程式身分識別與託管 agent 執行階段身分識別需要分開的 Search 存取權限。

常見的直接擷取 API 包含 `KnowledgeAgentRetrievalClient` 與 `SearchIndexKnowledgeSourceParams`。將這些 API 的範例與疑難排解保留在此應急出口區段中，以避免被誤認為主要架構。

## 來源

- [在 Microsoft Foundry agents 中使用 skills (預覽版) - azd](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/skills?pivots=azd#manage-skills-with-the-rest-api)
- [在 Foundry 中策劃基於意圖的 toolbox (預覽版)](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/toolbox)
- [Foundry 託管 agents](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/concepts/hosted-agents?view=foundry)
