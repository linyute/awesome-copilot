# 託管代理人開發與部署流程

Foundry 託管代理人是由 `agent.yaml`（身分識別：`kind: hosted`、模型、協定、環境變數、資源 — 結構描述位於 microsoft.github.io/AgentSchema/）、選用的 `agent.manifest.yaml`（參數化範本）與 `azure.yaml`（azd 資源發佈 + 服務設定）所定義。這些檔案中的 `${VAR}` 是 azd 環境變數；`{{ param }}` 是初始時的範本參數。

## 內部迴圈：在本機對真實代理人進行開發

這裡沒有模擬器。`azure.ai.agents` azd 擴充功能會在本機執行實際的託管代理人：

1. `az login` 登入擁有 Foundry 專案的租戶（請參閱下方的 403 陷阱）。
2. `azd ai agent run` — 在本機啟動代理人（預設連接埠為 8088）以對抗已發佈的專案。
3. `azd ai agent invoke --local "<訊息>"` — 單次測試（`-p responses|invocations` 選擇協定，`-f payload.json` 用於結構化輸入）。
4. 將其餘堆疊（AG-UI 端點或橋接器）透過該程式碼庫用於直接/本機模式的任何環境變數，指向本機代理人 URL，並透過真實 UI 來測試功能。

內部迴圈規範：

- **在獨立驗證步驟之間重啟代理人**，如果它會初始化記憶體內資料的話 — 每次核准/拒絕都會變更共享狀態，因此在髒程序上進行的第二次測試執行會因錯誤的原因而通過或失敗。
- 佔用連接埠的過期代理人程序會在下次 `azd ai agent run` 時產生令人困惑的 hypercorn 「Address already in use」追蹤資訊 — 請先將其結束。
- 剛啟動的代理人即使在模型部署存在的情況下，首次要求也可能會因 `DeploymentNotFound` 而出現 404（預熱不穩定現象）— 在調查之前請先重試一次。

## 外部迴圈：部署更新

1. `azd deploy`（或 `azd up` 用於資源發佈 + 部署）。程式碼部署（ZIP）與容器部署是由 `agent.yaml` 中的欄位決定；容器建構預設為遠端 ACR 建構 — 不需要本機 Docker。
2. **每次部署都會建立新的代理人版本。** `azd ai agent show` 可確認目前上線的版本。固定在特定版本的用戶端將不會看到更新；使用「latest」的用戶端則會看到。
3. 行為上驗證已部署的代理人：傳送讀取查詢，並確認後續的重要動作仍會暫停以等待核准。部署成功的輸出僅證明套件封裝作業正常，別無其他。

## 部署陷阱

| 陷阱 | 詳細資訊 |
| --- | --- |
| 僅使用 `azd provision` 會部署預留位置 | Provision 僅會建立基礎架構；如果沒有部署步驟，您會得到一個 hello-world 代理人。請使用 `azd up` 或在發佈後執行 `azd deploy` |
| 基礎映像檔必須來自 MCR | `az acr build` 匿名從 Docker Hub 拉取會遇到 `toomanyrequests` 速率限制。請使用 `mcr.microsoft.com/...` 基礎映像檔 |
| 映像檔中缺少共享的程式碼 | 如果代理人程式碼匯入了代理人目錄之外的模組，則 `azure.yaml` 中的 docker 建構內容必須能夠存取它們 — 且 azd 版本在是否接受父目錄的 `project:`/context 路徑方面存在差異（1.27.0 時代的迴歸拒絕了 `..`）。請在 azd 升級後測試套件封裝 |
| 託管容器環境 | `FOUNDRY_PROJECT_ENDPOINT` 與 `APPLICATIONINSIGHTS_CONNECTION_STRING` 會自動植入到託管容器中；請勿硬編碼它們 |
| 運算資源閒置逾時 | 託管代理人運算資源在閒置約 15 分鐘後會解除配置；閒置後的首次要求會很慢 — 這不是錯誤 |
| 歷程記錄重複（Responses 協定） | 平台會儲存對話歷程記錄；如果代理人本身的聊天用戶端也進行儲存（`store=True`），則對話輪次會重複。請將用戶端/主機選項設定為不儲存 |
| 橋接器/前門調整彈性 | 任何在記憶體中持有每執行緒 response-id 或對話快取的服務，都必須執行單一複本，或者將快取外部化 |
| 租戶不相配 403 | 儘管 RBAC 正確，但 `Microsoft.MachineLearningServices/workspaces/agents/action` 仍遭拒絕，這通常表示 az CLI 的作用中訂閱/租戶不是專案的訂閱/租戶。請使用 `az account set` / `az login --tenant` 進行修正；無需變更程式碼 |

## 生產環境前端接線

部署 AG-UI 端點（架構 A/C 服務，或針對 B 依賴託管的呼叫端點），讓 CopilotKit 執行階段可以在伺服器端存取它；相應地設定執行階段的代理人 URL 環境變數。使用 `https://ai.azure.com/.default` 識別身分，保持無金鑰驗證（Entra）。瀏覽器僅與 CopilotKit 執行階段路由進行通訊 — 絕不要向用戶端公開 Foundry 端點或憑證。
