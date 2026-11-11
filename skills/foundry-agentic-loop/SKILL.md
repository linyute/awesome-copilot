---
name: 'foundry-agentic-loop'
description: '在 Microsoft Foundry、GitHub 與 Azure 上建構 agent 解決方案：託管 agent、toolbox 工具與 skill、Foundry IQ 基礎 (grounding) 以及 React/FastAPI 應用程式。三種模式：在現有 Foundry 專案中進行快速原型製作 (rapid prototyping)；規格驅動開發 (SDD)，由 foundry-agentic-loop-workflow 執行 Specify、Implement、Verify 與 Deploy 來建立 Foundry 專案並以 azd 部署，或單獨執行其中一個階段；以及 Improve，從過去的執行紀錄中精進此 skill 與工作流程。適用於 Agentic Loop 請求與 canvas 動作，或從架構到 Azure 部署的端對端 agent 解決方案。不適用於孤立的 Azure 管理或不相關的 UI 修改。'
---

# Foundry Agentic Loop

協調解決方案並使用 `microsoft-foundry` 進行平台操作。使用者的明確選擇優先於預設值。重複使用已知情境，僅詢問遺漏的決策，僅閱讀步驟所需的參考資料，並簡要回報決策、阻礙事項與端點。

## 引導程序 (Bootstrap，每個工作階段一次)

1. **Foundry skill。** 若 `microsoft-foundry` 無法使用，先詢問再進行安裝 (`copilot plugin install azure@awesome-copilot`，或 `gh skill install microsoft/azure-skills microsoft-foundry --agent github-copilot --scope project`) 並重新載入 skills。
2. **Canvas 與工作流程。** 此外掛隨附 `foundry-agentic-loop-canvas` 與 `foundry-agentic-loop-workflow`，列為 `foundry-agentic-loop:<name>` 或 `<name>`。以 `operation: "list"` 呼叫 `extensions_manage`。切勿從 URL 安裝擴充功能，且切勿編輯 Copilot 設定檔。若兩者皆未以此類名稱列出，請告知使用者缺少哪一項以及該項目隨附於外掛中，並在執行 `copilot plugin install foundry-agentic-loop@awesome-copilot` 前先詢問；在使用者核准後，呼叫一次 `extensions_reload`。若其中之一被停用，請告知使用者在其擴充功能設定中重新啟用，並在新的工作階段中繼續：即使重新載入後，執行中的工作階段仍會保持停用狀態。若其中之一失敗，請 `inspect` 並回報其記錄。缺少 canvas 時，繼續在 Chat 中作業；缺少工作流程時，SDD 無法啟動，因此提供快速原型製作選項。
3. **Canvas。** 當從 Chat 開始工作時，開啟一次：以 `canvasId: "foundry-agentic-loop-canvas"`、`instanceId: "foundry-agentic-loop"` 與 `input: { mode }` 呼叫 `open_canvas`。開頭為 `[Agentic Loop canvas action]` 的提示詞來自 canvas；請逐字遵循其目標、核准與繼續指示。

## 選擇模式

| 訊號 | 模式 |
| --- | --- |
| 根目錄 `AGENTS.md` 包含 Agentic Loop 區段 | 其 `mode`。僅在使用者確認時才切換，然後重寫該區段 |
| Canvas 提示詞或明確選擇 | 依陳述指示 |
| 已選取或指定現有 Foundry 專案；快速原型；不需要部署管線 | **快速原型製作**：[rapid.md](references/rapid.md) |
| 規格、新 Foundry 專案、azd 或 IaC、具備 CI 就緒的存放庫或完整 Azure 部署 | **SDD**：[sdd.md](references/sdd.md) |
| Improve、從執行中學習，或 canvas improve 提示詞 | **Improve**：[improve.md](references/improve.md)；使用 `node scripts/evals.mjs` 衡量變更（建立索引，然後執行 `--base <commit>`；結束代碼 2 表示評估無法使用，因此停止） |
| 單一指定 SDD 階段，且沒有執行中的回合 | 其指引（[Specify](references/specify.md)、[Implement](references/implement.md)、[Verify](references/verify.md) 或 [Deploy](references/deploy.md)）搭配 [SDD 預設值](references/sdd.md#sdd-defaults) |

否則詢問一次，選項包含「快速原型製作（現有 Foundry 專案）」與「SDD（新專案，以 azd 部署）」。

**鎖定設定。** 在進行任何其他工作區寫入之前（在 rapid 預檢中，或在 SDD 工作流程啟動之前），將 [agents-md-rapid.md](assets/agents-md-rapid.md) 或 [agents-md-sdd.md](assets/agents-md-sdd.md) 的區段 upsert 至根目錄 `AGENTS.md`：取代其 `foundry-agentic-loop` 開始與結束標記之間的所有內容，或附加於後方，保留其他內容；然後重新讀取確認。該區段可路由簡短命令（例如 `deploy`）並為 Chat、canvas 與工作流程鎖定模式。Azure 設定只寫入 `.azure/deployment-plan.md`，絕不寫入 `AGENTS.md`。Improve 模式絕不寫入該檔案。

## 預設值

- **Agents：** 公開 Responses API 的 [Foundry 託管 agents](references/foundry-hosted-agent.md)，Python 3.13，程式碼部署。透過 `microsoft-foundry` 的 `foundry-agent/create/quick-start-hosted.md` 搭配 **Basic sample** 建立它們，透過該 skill 進行解析，絕不使用猜測的 URL。僅在 quick-start 無法支援某項功能時才使用其進階工作流程，並保持這些預設值。僅在收到請求時才提示 agent。
- **架構：** 使用執行階段 skills 的 agent 請採用 Copilot SDK（[秘笈](references/copilot-sdk-foundry.md)、[參考 agent](references/copilot-sdk-with-toolbox.py)）；基本 agent 與明確工作流程請採用 Microsoft Agent Framework。若工作流程亦需要 skills，請進行釐清確認。每個 agent 使用一種架構。
- **模型：** rapid 保留 Basic sample 的模型部署，或驗證並重複使用所提供的模型；SDD 預設為 `gpt-5.4-mini`，除非規格另有需求。在建立資源之前，請執行 [foundry-models.md](references/foundry-models.md) 中的聯合放置預檢。切勿硬式編碼替代項目或無提示地重複部署。
- **工具與知識：** 一個受控管的 [Foundry toolbox](references/foundry-toolbox.md)，用於內建工具、MCP 連線與 agent skills；agent 使用其端點，而非硬式編碼的工具 URL。私有知識透過 toolbox 使用 [Foundry IQ](references/foundry-iq-grounding.md)，針對有佐證的主張提供引用來源，並對證據不足時提供確定性的回應；請測試這兩者。僅在需要時才新增 Search。重複使用使用者在 [run catalog](references/run-skills-catalog.md) 中指定的 run skills，而非重新產生。
- **應用程式：** 在 Azure Container Apps 上的 React + Vite、FastAPI 與 FastMCP (串流 HTTP)。Rapid 使用 `az containerapp up --name <app> --source <dir> --resource-group <rg> --environment <env>` 部署；SDD 使用 [azd](references/azd-layout.md) 搭配 `microsoft.foundry` 層與 Bicep (AVM) 應用程式層、`remoteBuild: true` 以及透過受控識別提取的單一 ACR。僅在解決方案需要時才從[參考架構](references/reference-architecture.md)新增服務。
- **應用程式存取：** 依資料做出決定。當應用程式顯示的所有內容皆為範例、合成資料或特意公開的資料時，預設為無需終端使用者登入，即使對內部員工亦然；服務仍使用受控識別進行驗證，且無需匿名工作階段或識別驗證的替代處理解決方案。當顯示私有、機密或特定使用者的資料時，在部署前詢問存取模型，並預設為內部輸入 (internal ingress) 或 Entra 登入；匿名存取需要明確核准。使用登入時，API 會預先授權 SPA，規格會說明自動化瀏覽器測試如何取得使用者權杖，且 Implement 在應用程式註冊建立後立即驗證該權杖路徑。
- **身分識別與安全性：** 受控識別與最低權限無金鑰 RBAC（[協定](references/rbac-contract.md)；使用 [check_rbac_preflight.py](references/check_rbac_preflight.py) 的[預檢](references/rbac-preflight.md)）。分別檢查管理平面、資料平面與角色指派權限；訂用帳戶 Owner 不會授與 Foundry 資料平面角色。為尚未建立的身分識別規劃角色，並在建立後驗證實際的主體。在瀏覽器程式碼或 Git 中不可有憑證；開啟 Foundry 防護措施。
- **可觀察性：** 從後端、agents、MCP 伺服器與模型呼叫輸出 OpenTelemetry 至連接到專案的單一 Application Insights（[observability.md](references/observability.md)）。敏感內容擷取維持關閉，除非在具備遮蔽與保留控制措施下獲得核准。

## 工作區檔案

| 檔案 | 內容 |
| --- | --- |
| `AGENTS.md` (根目錄) | 模式鎖定與簡短命令路由；絕不包含 Azure 設定 |
| `README.md` (rapid) 或 `docs/spec.md` (SDD，來自[規格範本](assets/spec-template.md)) | 協定契約 |
| `.azure/deployment-plan.md` | 兩種模式下的所有 Azure 設定（[範本](assets/deployment-plan-template.md)） |
| `.env` (Git 忽略) | Canvas 讀取的內容：`FOUNDRY_PROJECT`（完整 ARM 識別碼，經由驗證或建立後填入）、`LOCAL_FRONTEND` 與 `DEPLOYED_FRONTEND`（僅限驗證過的 URL）。進行更新，保留其他鍵值並重新讀取 |
| `docs/LOOP.md` | 經驗教訓（[範本](assets/loop-template.md)） |
| `.agentic-loop/runs/<runId>.json` | SDD 執行記錄，由工作流程寫入 |
| `.devcontainer/devcontainer.json` | 選用的 dev container（[資產](assets/devcontainer.json)） |

## 工作規則

- **契約優先。** 在平行工作之前，先凍結服務名稱、環境變數、通訊協定、端點、結構描述、驗證、串流、錯誤與版本（[implementation-contract.md](references/implementation-contract.md)）。
- **整合優先。** 在建構完整協調流程、UI 或後端之前，先以最小 agent 通過[託管整合檢查點](references/hosted-integration-checkpoint.md)：一律包含模型請求，並且僅在架構需要時才包含 toolbox skill 載入與安全的 MCP 呼叫。將排除的功能記錄為 `N/A` 並附上原因，絕不可記錄為通過，也絕不可為了滿足檢查點而新增未使用的功能。
- **證據優先於訊號。** HTTP 200、結束代碼 0 或 `active` 單獨出現絕不算通過；需要終止完成、結構描述有效的輸出、執行證據以及相互關聯的追蹤記錄。以有邊界的診斷進行修正，而非未作修改的重複部署。
- **依完成狀態等待。** 佈建、部署、角色指派傳播與 agent 就緒狀態在其命令或狀態檢查宣告完成時才告終：以較長的初始等待同步執行命令，或在指定的期限內每 30-60 秒輪詢其狀態一次。切勿串接固定的休眠；在 Azure 執行時繼續編寫程式碼。
- **子代理人 (Subagents)。** 在檢查點之前，僅將研究與預檢平行化。在通過之後，給予每位工作者具明確邊界的目標、專屬的工作區相對檔案或資料夾、skill 參考資料、已驗證的情境、契約、驗收檢查與停止條件。由單一擁有者（協調者或 SDD 階段負責人）持有契約與共用檔案：`azure.yaml`、`infra/`、`docs/`、`.env`、`.azure/`、`.agentic-loop/`、`AGENTS.md` 與根目錄鎖定檔案。維持團隊小巧，避免遞迴委派，將共用的 Azure 變更序列化並進行集中整合；工作者的成功不代表驗收通過。委派不會授與額外的核准權限。在沒有子代理人的情況下，以循序方式工作並向使用者說明。
- **安全性。** 重複使用資源；確認需付費、安全性或合規性變更；未經核准時，僅能刪除此組建所建立且佈建失敗的資源；絕不可替使用者登入；絕不可將未驗證的部署回報為成功。
- **工作區邊界。** 建構維持在工作區內部：僅從其自身的 `docs/LOOP.md` 讀取經驗教訓，從 Foundry 範例與這些參考資料搭建樣板，並僅在使用者指定時才使用來自其他資料夾的程式碼。只有 improve 模式可讀取其他位置過去的執行紀錄。
- **Work IQ 情境。** 僅在使用者或 canvas 提示詞提出要求時，在提出釐清問題之前先查詢 `workiq` MCP 伺服器，僅納入重要的需求，依來源類型引用每項需求並進行確認。切勿將機密內容、個人資料或密碼秘密複製到工作區中；若 Work IQ 無法使用或需要同意，請說明並在沒有它的情況下繼續。
- **附隨工具與 SDK。** 針對最新穩定版本（或組建的套件索引所提供的最新穩定版本，並記錄差異）驗證已安裝的 SDK API，並在產生程式碼前鎖定版本；套件來源優於過時的指引。僅針對需要的功能查閱[建置目錄](references/build-skills-catalog.md)；尊重版本鎖定，安裝前先詢問，並將第三方 skill 缺陷路由回上游。

## 經驗教訓

在修正得到驗證之後（失敗的探測或同等的邊界檢查重新成功執行；單純的編輯、認可或部署不代表解決問題），在進行不相關的工作之前，從[範本](assets/loop-template.md) upsert 經驗教訓至工作區的 `docs/LOOP.md`，然後重新讀取確認。保留使用者備忘筆記，更新相符的經驗教訓而非重複建立，且絕不包含密碼秘密、原始 `.env` 數值或承載資料。協調者或 SDD 階段負責人擁有寫入權限；工作者負責回報證據。經驗教訓絕不授權修改 skill 或放寬門檻；improve 模式在獲得核准後套用它們。
