# 託管整合檢查點 (Hosted integration checkpoint)

在進行架構設計、首次託管部署以及變更身分識別/端點整合時閱讀。在擴展協調流程或實作完整應用程式之前，先證明託管邊界的可行性。這是一道驗收關卡，而非取代 `microsoft-foundry` 平台工作流程。

## 端點契約 (Endpoint contract)

將這些不同的數值記錄於根目錄 `README.md` (rapid) 或 `docs/implementation.md` (SDD) 中，並將探索到的數值保留在適用的部署設定與 Git 忽略的 `.env` 中。記錄其來源、驗證對象 (audience)、取用端元件與版本。未知數值在探索前維持擱置狀態；切勿從顯示名稱合成端點。

| 應用程式變數 | 意義與驗證方式 |
| --- | --- |
| `APP_FOUNDRY_PROJECT_ENDPOINT` | 包含 `/api/projects/<project>` 的完整專案 URL，由專案探索傳回。供專案用戶端使用。 |
| `MODEL_API_BASE_URL` | 實際託管模型帳戶之相容於 OpenAI 且以 `/openai/v1/` 結尾的基底。供模型提供者使用；它不是專案或託管 agent 的 URL。模型部署名稱另外分開記錄。 |
| `HOSTED_RESPONSES_ENDPOINT` | 已部署 agent 的實際 Responses 請求 URL，包含必要的 API 版本與 agent 路由。記錄探測所使用的 agent 版本；將此完整請求 URL 與附加了 `/responses` 的 SDK 基底 URL 區分開來。 |
| `TOOLBOX_ENDPOINT` | 包含 `api-version=v1` 的 Toolbox MCP URL，從 azd 寫入的 `TOOLBOX_<NAME>_MCP_ENDPOINT` 對應。記錄 toolbox 名稱、其已發佈的預設版本，以及該 URL 是取用者形式（遵循預設值）還是鎖定 `/versions/<v>/`。 |

將 `FOUNDRY_PROJECT` 保留為專案 **ARM 識別碼**，而非端點。維持平台擁有的 `FOUNDRY_*` 變數不受更動。在某次回報的組建中，其自訂的 `FOUNDRY_PROJECT_ENDPOINT` 被僅含帳戶的 URL 覆寫；請使用 `APP_FOUNDRY_PROJECT_ENDPOINT` 作為應用程式經過驗證的完整 URL，明確將其傳遞給專案用戶端，並在啟動時驗證其路徑。切勿在未提示下附加猜測的專案名稱，或降級回退至保留數值。透過 `microsoft-foundry` 驗證目前轉接器如何取用平台設定。

## 最小部署與身分識別

1. 重複使用 Basic 範例、協議的架構與模型部署。實作一個具確定性且唯讀的探測，該探測一律需要模型回應，並在架構使用執行階段 skills 時加上一個 toolbox skill 載入，在架構使用 MCP 工具時加上一個 MCP 工具呼叫；回應會使用其結果。切勿為了滿足檢查點而新增未使用的 skill 或工具。將完整的 UI、後端與多 agent 協調流程排除在此切片之外。將每個排除的功能記錄為 `N/A` 並附上原因；模擬物件或跳過的檢查無法通過必要的邊界驗證。
2. 僅部署必要的 MCP 相依性與 toolbox skill/版本（若有），接著對 agent 進行程式碼部署。針對需計費的操作確認核准。佈建或 `active` 狀態僅代表啟用探測；不代表通過檢查點。
3. 從部署/身分識別 metadata 探索已部署 agent 的**實際主體/物件識別碼** (`azd ai agent show <agent> --output json`：`instance_identity` 接受 Azure 角色；`blueprint` 不接受任何角色，其用戶端識別碼僅加入 MCP Easy Auth 允許清單)。在建立之前無法檢查新的主體。將物件識別碼與用戶端/應用程式識別碼以及 agent 資源識別碼區分開來。記錄租用戶、agent/版本、主體、資源範圍與所需的操作/角色。
4. 驗證有效授權（包含繼承/條件）與實際的資料平面存取權限。將下列回報的組建組合視為檢查項目，而非對每個解決方案的無條件授權。透過 `microsoft-foundry` 解析目前的角色與最低權限範圍。

| 主體 | 資源範圍 | 當此路徑需要時所驗證的角色 |
| --- | --- | --- |
| 執行階段執行個體身分識別 | Foundry 專案 | 用於明確專案/toolbox 存取（包含執行階段 skill 下載，若無此角色託管叫用會傳回 500）的 Foundry User；考慮平台提供的存取權限與目前角色定義。 |
| 執行階段執行個體身分識別 | 實際託管模型的帳戶 | 用於直接帳戶層級 OpenAI 推論的 Cognitive Services OpenAI User。單純的專案存取無法確立此權限。 |
| 直接發出具驗證之 Application Insights 遙測的身分識別 | Application Insights 元件 | Monitoring Metrics Publisher。當 agent 為發送者時，驗證執行階段執行個體身分識別；切勿以部署者的授權替代。 |
| 用於原生 Azure Monitor OTLP 擷取的收集器身分識別 (使用時) | 目標資料收集規則 (DCR) | Monitoring Metrics Publisher。驗證收集器的實際主體，該主體可能與 agent 不同；未使用時切勿新增此路由或授權。 |

將部署者、專案受控識別、agent 身分識別、執行階段呼叫者與 **toolbox 連線身分識別**分開處理。Agent 到 toolbox 的存取與連線到下游 MCP/服務的存取是不同的檢查項目。確認所設定的連線驗證模式及其主體/資源權限；agent 授權無法修復下游身分識別錯誤的問題。

使用授權的呼叫者叫用已部署的端點，但確保下游模型/toolbox 操作使用託管的工作負載憑證與平台呼叫者情境。開發者權杖可授權外部探測；但絕不可取代 agent 的內部憑證。禁止複製 `az login` 權杖或使用秘密金鑰後備方案來強行通過檢查點。

## 探測與通過標準

- 在**託管身分識別/情境路徑內部**執行最小直接模型 Responses 請求與 toolbox skill/工具探測，接著執行同等的 SDK 仲介 agent 請求。使用 SDK/工具事件或安全相互關聯的遙測記錄實際載入的 skill 版本與 MCP 工具名稱/呼叫結果，而非採信模型聲稱已使用它們。本機執行僅能證明就緒狀態與 skill 載入：`AgenticIdentityToken` 工具呼叫在主機外部會失敗 ("requires AgentInstanceClientId and AgentBlueprintClientId")。
- Toolbox MCP 呼叫在 Responses 輸出中可能顯示為 `<server>___<tool>`：剖析伺服器前綴並要求精確的工具名稱。檢查 agent 所使用的 toolbox 版本：重新讀取已發佈的預設版本 (`azd ai toolbox show <name>`)，或針對鎖定的 URL 讀取其路徑中的版本，並要求該處具備預期的工具與 skills。
- 使用實際傳回的內容類型來演練 JSON 與 SSE。針對 SSE，取用直到 `response.completed`；單純的 EOF、`[DONE]`、文字增量、`session.idle` 或停止旋轉指示器皆不足以作為判斷依據。針對非串流 JSON，要求具有 `status: "completed"` 的最終回應物件；已排入佇列/處理中的回應需要有邊界的輪詢。在支援串流時，亦需證明串流終端事件。
- 將 `response.failed`、`response.incomplete`、取消、逾時、通訊協定錯誤與內嵌錯誤承載視為失敗，即使 HTTP 為 200 或 CLI 結束代碼為 0 亦然。CLI 包裝常式必須剖析回應，並在終端狀態未成功時傳回失敗。
- 要求非空、結構描述有效且包含預期探測數值以及每個必要 skill/工具/模型操作證據的應用程式輸出。明確拒絕缺少的上游欄位；切勿將遺漏的結果轉化為無內容的成功。
- 相互關聯應用程式請求識別碼、回應識別碼、託管工作階段識別碼、SDK 工作階段/輪次識別碼、agent 版本與服務請求識別碼。在與端點契約相同的檔案中儲存簡要的檢查點記錄與證據位置。缺少證據會導致關卡維持封鎖；將無法取得的識別碼標註為此狀態，絕不自行捏造。
- 要求已部署探測的代管請求、模型請求與必要工具執行 span 抵達所設定的遙測目的地，且不啟用敏感提示詞/完成內容/工具內容的擷取。使用目的地的實際結構描述驗證追蹤/父系關係與 agent/版本識別。針對 Copilot SDK，透過[遙測秘笈](copilot-sdk-foundry.md#telemetry)設定兩個產生者。單純的專案連線、匯出工具啟動訊息或代管請求 span 皆不足以滿足條件。允許有邊界的擷取延遲；缺少必要的 span 會使檢查點維持未完成狀態。唯有在必要檢查通過後，方可開始完整的應用程式工作。

## 診斷決策樹

| 失敗狀況 | 下一步有邊界的動作 |
| --- | --- |
| 匯入、啟動或相依性解析 | 擷取精確的 Python、SDK、代管轉接器與執行中 Copilot 執行階段版本。檢查已安裝的簽章與套件/執行階段相容性。針對遠端解析失敗，使用有條件的[封裝後備方案](copilot-sdk-foundry.md#dependency-packaging-fallback)，而非重寫架構。 |
| 401 | 針對**相同已部署身分識別下**的直接請求與 SDK 請求，比較端點/基底路徑、預期權杖對象、重新整理回呼與轉發的平台情境。不記錄權杖或呼叫者情境標頭數值。 |
| 403 | 分別檢查實際主體/資源/角色組合與 toolbox 下游身分識別。在確認角色變更後，以退避機制與固定期限（例如 5 分鐘內嘗試 5 次）重試最小探測。透過受支援的提供者重新整理憑證；切勿重複部署相同程式碼。 |
| 開發者探測通過，託管探測失敗 | 比較實際身分識別、網路存取、完整專案 URL、模型帳戶與平台呼叫者情境。開發者環境的成功不代表託管環境的證明。切勿停用網路隔離來繞過失敗。 |
| 直接託管請求通過，SDK 失敗 | 比較清理後的方法、路由、部署名稱、API 版本、對象、標頭**名稱**、內容類型與承載結構描述。在變更 RBAC 前先檢查轉接器/SDK/執行階段簽章。 |
| HTTP 成功但輸出失敗/遺漏 | 檢視回應識別碼、最終狀態、結構化錯誤與相符的服務請求識別碼。正確剖析 JSON/SSE；絕不將傳輸層成功重新詮釋為 agent 成功。 |
| 負載下偶發失敗 | 在非同步工作前檢查請求區域情境、回應識別碼比對、工作階段隔離、權杖重新整理、取消機制與不可分割的工具預算保留。 |
| 遙測遺漏或僅限主機 | 分別檢查主機與執行階段產生者設定、作用中追蹤情境、接收器/匯出路由、目的地/結構描述、實際匯出工具身分識別權限、取樣與生命週期排清。允許有邊界的擷取延遲；切勿放行關卡或重複部署未變更的程式碼。 |
| 部署成功後出現暫時性 `postdeploy` 失敗 | 僅重新執行具等冪性的攔截勾點 (`azd hooks run postdeploy`) 及其讀回檢查；切勿重新部署未變更的程式碼。 |

記錄安全的結構化診斷：應用程式相互關聯識別碼、回應識別碼、託管與 SDK 工作階段識別碼、agent 名稱/版本、可用的服務請求識別碼、SDK/執行階段版本、狀態/錯誤代碼與清理後的錯誤摘要。失敗時亦擷取回應標頭（例如 `x-agent-session-id`）。排除 Authorization、cookies、權杖、不透明的呼叫者情境數值、`.env` 傾印與敏感內容主體。

僅在宣告的嘗試次數/期限預算內重試暫時性失敗；切勿盲目重新播放非等冪的工具呼叫。僅針對變更的程式碼、相依性或部署設定進行重新部署。追蹤此任務建立的偵錯處理程序以及託管/SDK 工作階段；事後僅停止那些暫時性資源。保留使用者的工作階段以及驗收移交所需的本機應用程式伺服器。

## 契約測試 (Contract tests)

在擴展每個邊界前新增具針對性的測試，隨後在本地驗收時執行適用的全應用程式案例：

- 遺漏/null 的上游識別碼、輸出、工具結果或結構描述欄位會產生明確的錯誤。
- Responses 文字來自最終的 `message` 輸出項目：當工具項目排在其前方時，最上層的 `output_text` 可能為 null。在首輪次中省略 `previous_response_id`；傳入 null 會傳回 HTTP 400。
- JSON 與 SSE 成功、內嵌錯誤、未完成狀態、截斷的串流與逾時皆能產生正確的終端狀態與錯誤呈現。當 API 僅發出終端 SSE 事件時，在沒有上游串流的情況下呼叫 agent（這可能會走不同的模型路徑），並測試 JSON 與 SSE 是否傳回相同的已驗證結果。
- 並行/交錯的請求將事件與結果對應至其專屬的回應/請求/工作階段識別碼；延遲抵達的結果不可解析另一個請求或覆寫其保存狀態。
- 在發送/await **之前**以不可分割方式保留工具呼叫限制；同時發生的呼叫不可超過上限。測試邊界與被拒絕的呼叫，包含失敗/取消的統計處理。
- 權杖過期/重新整理以及每請求情境能同時抵達模型與 toolbox，且不發生跨使用者/工作階段的洩漏。
- 並行託管請求在執行階段與工具回呼中保留獨立的追蹤/父系關聯。檢查內容擷取預設值、正常排清與明確匯出失敗；本機模擬物件無法取代已部署的 span 擷取證據。
- 應用程式失敗能清楚呈現；重試、保存/重新載入與匯出能保留已驗證的結果與失敗狀態，且不洩漏密碼秘密。除順暢路徑外，亦需演練行動裝置版面配置以及鍵盤導覽/焦點。

## 平台來源

透過已安裝的 `microsoft-foundry` skill 解析命令與變動中的平台契約。於 2026-09-22 檢查的參考資料：

- [託管 agent 權限](https://learn.microsoft.com/azure/foundry/agents/concepts/hosted-agent-permissions)
- [託管執行階段契約](https://learn.microsoft.com/azure/foundry/agents/concepts/hosted-agent-contract)
- [Toolbox 驗證與託管整合](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/use-toolbox-hosted-agent)
- [原始程式碼部署](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent-code)
