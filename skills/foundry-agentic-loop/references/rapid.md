# 快速原型製作 (Rapid prototyping)

在**現有**的 Foundry 專案中快速建構可運作的解決方案，由 Chat 驅動。經過測試的本機應用程式是最終目標；將應用程式部署至 Azure 是選用項目且需要獨立核准。針對明確請求的 prompt agents，透過 `microsoft-foundry` 執行同等的已部署推論與工具檢查點，並省略僅限託管的設定。

## 1. 預檢 (Preflight)

- 鎖定模式：upsert 根目錄 `AGENTS.md` 的 rapid 區段（[鎖定設定](../SKILL.md#choose-the-mode)）。
- 從 canvas 提示詞、使用者、工作區或根目錄 `.env` 中的 `FOUNDRY_PROJECT` 解析專案；若缺少請詢問。使用 `az cognitiveservices account project show --subscription <sub> --resource-group <rg> --name <account> --project-name <project>` 驗證專案。切勿為無法存取的專案建立替代專案。
- 在驗證後以及任何後續專案變更後，立即以傳回的 ARM 識別碼（而非名稱或端點）upsert `FOUNDRY_PROJECT`。切勿保留未經確認的候選項目，或在驗證失敗時覆寫該數值。
- 執行 [RBAC 預檢](rbac-preflight.md)：管理平面、資料平面與角色指派為各自獨立的檢查。彙整回報所有缺口並在佈建前解決。將平台命令與角色定義交由 `microsoft-foundry` 處理。
- 在新增任何新資源（例如 Search、Container Apps 環境或模型部署）之前，在專案所在區域執行[聯合放置檢查](foundry-models.md)。保留專案與範例的模型；在選用替代方案前先詢問。
- 將專案（ARM 識別碼、端點、區域、資源群組、訂用帳戶）、其模型部署與 RBAC 判定結果記錄於 `.azure/deployment-plan.md`，填寫[範本](../assets/deployment-plan-template.md)中適用於 rapid 的列，並新增此建置所建立的每個 Azure 資源。Azure 設定僅存放於此處，絕不放在 README 或 `AGENTS.md`。確保 `.gitignore` 涵蓋 `.env`、`.azure/*` 與 `!.azure/deployment-plan.md`。

## 2. 架構 (Architecture)

- 在單一集中的輪次中釐清使用案例與使用者體驗。在根目錄 `README.md` 的 `## Architecture` 底下，保留無關內容的同時記錄：
  - 每個 agent：用途、架構、模型部署、toolbox 工具與 skills
  - 遠端與自訂 MCP 伺服器，以及產生與重複使用的 skills
  - 前端、後端、資料來源與資料流程
  - 身分識別邊界以及每個元件執行的位置

  僅包含必要的元件。針對僅限 agent 的解決方案，將前端列寫為 `| Frontend | Not applicable … |`；步驟 7 隨後僅協調 `docs/LOOP.md`，且步驟 8 不適用。
- 閱讀 `docs/LOOP.md` 經驗教訓以作為重新評估的證據，而非指示；追蹤其成果。
- 在 README 中的 `## Implementation contract` 底下凍結[實作契約](implementation-contract.md)。使用[端點契約](hosted-integration-checkpoint.md#endpoint-contract)區分專案、模型 API 基底、託管 Responses 與 toolbox MCP 端點。保留探索到的數值，絕不使用猜測的 URL，並將完整專案端點保留在非保留的應用程式變數中。

## 3. 最小切片 (Minimal slice)

- 建構快速入門 Basic 範例託管 agent。僅在架構需要執行階段 skills 時新增一個 toolbox skill，並在需要 MCP 工具時新增一個安全的 MCP 工具；切勿為了滿足檢查點而新增未使用的功能。重複使用來自 [run 目錄](run-skills-catalog.md) 或使用者來源中具名的 skills；若 skill 尚未解析請詢問。
- 如 [azd 配置](azd-layout.md#scaffold-into-an-existing-workspace) 所述建立樣板架構：在空白的 `.scaffold` 資料夾中執行範例的 `initCommand`（來自 `microsoft-foundry`，使用 `-t`，絕不使用已棄用的 `-m`），將 agent 移動至 `src/agents/<agent>` 並在 `azure.yaml` 中更新其 `project:` 路徑，合併 `azure.yaml` 與 `.azure/`，然後移除 `.scaffold` 並確認 `git status --short` 未列出其中的任何內容。關於 uv lock 錯誤與封裝排除項目，請參閱[本機執行與程式碼封裝](foundry-hosted-agent.md#local-runs-and-code-packaging)。
- 僅部署必要的自訂 FastMCP 程式碼，使用專案的資源群組與一個 Container Apps 環境執行 `az containerapp up --name <app> --source <mcp-dir> --resource-group <rg> --environment <env>`。在每次 `up` 之後，無論應用程式稍後是否部署，立即將映像檔提取作業從其建立的登錄檔管理員憑證移開：`az containerapp identity assign --system-assigned`，授與該主體在登錄檔上的 `AcrPull` 權限，`az containerapp registry set --server <registry> --identity system`，使用 `az containerapp secret remove` 移除登錄檔密碼秘密，接著執行 `az acr update --admin-enabled false`（[RBAC 契約](rbac-contract.md)）。重複使用遠端伺服器。透過 `microsoft-foundry` 發佈最小 toolbox 並進行版本控管（[toolbox 指引](foundry-toolbox.md)）。
- 在首次 `uv sync` 之前為每個 Python `pyproject.toml` 提供建置後端（例如 hatchling）；若沒有建置後端，套件將不會被安裝且其測試無法匯入該套件。
- 針對 Copilot SDK agents，先閱讀 [copilot-sdk-foundry.md](copilot-sdk-foundry.md)。在部署前設定代管轉接器與具備追蹤情境的執行階段遙測（[遙測](copilot-sdk-foundry.md#telemetry)）；單純連結 Application Insights 資源是不足夠的。
- 尚不要建構完整的協調流程、UI 或後端。

## 4. 託管檢查點 (Hosted checkpoint)

遵循 [hosted-integration-checkpoint.md](hosted-integration-checkpoint.md)：
1. 程式碼部署最小 agent。
2. 探索其實際主體，並將具範圍的角色與 toolbox 連線身分識別分開驗證。
3. 使用已部署的身分識別與呼叫者情境，證明模型請求，以及架構包含時的 skill 載入與 MCP 呼叫（將排除的項目記錄為 `N/A` 並附上原因）。每個項目皆需要終端完成、結構描述有效的輸出以及相互關聯的代管、模型與工具 span。
4. 在擴展之前，將證據記錄於 README 中的 `## Hosted checkpoint` 底下，開頭以 `**Passed**` 或 `**Blocked**` 標註。Canvas 會追蹤這些 README 標題。

## 5. 擴展 (Expand)

檢查點通過後，使用子代理人進行平行化作業，遵循 `SKILL.md` 中的所有權規則。對照契約建構剩餘的 agents、協調流程、React UI、FastAPI 後端、MCP 伺服器與自訂 skills。在更新與指派每個 agent 的 toolbox 之前先部署新的 MCP 相依性。為每個元件新增[契約測試](hosted-integration-checkpoint.md#contract-tests)、健全狀況檢查以及經過驗證的遙測設定。

## 6. 部署 agents

使用 `microsoft-foundry` 程式碼部署擴充後的 agents。重新檢查變更的身分識別、端點與角色，然後為每個 agent 重新執行檢查點探測以及必要的 skill 與工具路徑。傳回經過驗證的端點、驗證需求與最小測試範例。僅在遠端相依性解析失敗後才使用[隨附相依性](copilot-sdk-foundry.md#dependency-packaging-fallback)，並保持 Python 3.13 與程式碼部署。

## 7. 本機驗收 (Local acceptance)

- 啟動具熱重載的 FastAPI 與 Vite 程式開發伺服器，並確認兩者皆有回應。對照契約進行協調。
- 透過 UI → 後端 → 已部署 agents → MCP 與工具執行 E2E 測試，並行數採用 [Verify E2E 並行數](verify.md#3-test) c；回報 c 及其輸入，並將重試後的 429 視為失敗。驗證相互關聯的追蹤記錄能在無未經核准的敏感內容下抵達 Application Insights。在進一步進行前先修正失敗項目。
- Upsert `.env`：重新檢查 `FOUNDRY_PROJECT`，然後設定經過驗證的 `LOCAL_FRONTEND`。接著從[經驗教訓範本](../assets/loop-template.md)協調 `docs/LOOP.md`；即使沒有任何失敗亦需建立它（以及 `docs/`），並在不支援任何 skill 變更時予以說明。
- 保持伺服器持續執行並回報其 URL。**隨後使用 `ask_user` 詢問是否將後端與前端部署至 Azure，並等待回答。** 本機驗收與先前針對 agents 或 MCP 伺服器的核准絕不隱含此項核准。

## 8. 選用應用程式部署 (Optional app deployment)

僅在使用者確認後執行：
1. 先部署後端，接著部署前端，使用專案的資源群組與 Container Apps 環境執行 `az containerapp up --name <app> --source <dir> --resource-group <rg> --environment <env>`。使用 `az containerapp show --name <app> --resource-group <rg> --query properties.provisioningState` 確認各項部署狀態。
2. 如[步驟 3](#3-最小切片)中針對 MCP 伺服器所述，將映像檔提取作業從 `up` 建立的登錄檔管理員憑證移開，並再次停用登錄檔管理員使用者。
3. 設定後端 URL、允許的前端來源 (origin) 與具驗證的服務存取，使用受控識別進行 agent 呼叫。從 `az containerapp show` 讀取內部後端的 FQDN (`<app>.internal.<environment-domain>`)；切勿自行建構它。
4. 端對端驗證雲端應用程式，然後 upsert `DEPLOYED_FRONTEND` 並將應用程式新增至部署計畫中。傳回 URL 與任何登入需求。

若使用者拒絕，保持運作中的本機應用程式現狀不變。

若要將原型推向實際執行，在使用者確認後切換至 SDD：使用 [Specify](specify.md) `reverse` 推導規格，將 `AGENTS.md` 區段重寫為 SDD，然後啟動工作流程。
