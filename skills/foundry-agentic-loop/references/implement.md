# Implement 階段

在 `.azure/deployment-plan.md` 中的目標上建構 `docs/spec.md` 所指定的內容。套用 [skill 預設值](../SKILL.md#defaults) 並使用 `microsoft-foundry` 進行平台操作。協調現有程式碼與基礎結構；切勿在已有工作的基礎上重複架構樣板。

從工作區根目錄執行 azd，並在每個 azd 命令中行內設定 `AZURE_DEV_USER_AGENT=microsoft_foundry_skill`。

## 1. 樣板架構 (Scaffold)

跳過結果已存在的任何步驟。

1. 從 `azd ai agent sample list --language python --output json` 取得 Basic 範例的 `manifestUrl`（推薦的 Basic 項目）。
2. 如[樣板架構至現有工作區](azd-layout.md#scaffold-into-an-existing-workspace)所述架構第一個 agent：在空白的 `.scaffold` 資料夾中使用 `--no-prompt` 執行 `azd ai agent init .`，然後將其移入定位。切勿先執行 `azd init -t`：agent init 會重寫提供者並巢狀包裝專案。
3. 將其服務索引鍵重新命名為 `<agent>`，將其 `project` 指向 `src/agents/<agent>`，並將頂層 `name` 設定為解決方案名稱。針對每個額外的 agent，複製一個可運作的 agent 資料夾至 `src/agents/<name>` 並執行 `azd ai agent init --src ./src/agents/<name> --agent-name <name> --no-prompt --deploy-mode code --runtime python_3_13 --entry-point main.py`。
4. 使用 `azd env set` 設定每個部署計畫變數，每個命令設定一個，優先設定 `AZURE_RESOURCE_GROUP`。使用 `azd env get-values` 讀取確認。
5. 對 `azure.yaml` 進行健全檢查：
   - `services.ai-project.deployments[]` 非空。
   - 沒有常值 `{{…}}`。
   - 每個 `entryPoint` 皆存在。
   - 沒有重複的 `-2` agent 服務。

## 2. 基礎結構與服務 (Infra and services)

嚴格按照 [azd-layout.md](azd-layout.md) 配置 `azure.yaml`、`infra/foundry` 與 `infra/app`：

- **各層 (Layers)：** Foundry 層，接著為 Bicep 應用程式層。
- **宣告式服務：** skills、MCP 連線與 toolbox。
- **應用程式：** 搭配 `remoteBuild` 的 Container Apps。
- **身分識別：** RBAC 契約的每一列，加上用於執行階段執行個體列與 MCP 允許清單的 `postdeploy` 攔截勾點（[部署後的授權](azd-layout.md#grants-after-deploy)）。

使用 `az bicep build --file infra/app/main.bicep` 進行驗證。接著執行 `azd provision --no-prompt`。在工作流程執行之外（其規格核准已涵蓋此操作），先行詢問並指名此階段亦會部署的檢查點服務。在繼續之前，將實際的區域與資源群組（包含 Foundry 提供者的群組 `azd env get-value AZURE_FOUNDRY_RESOURCE_GROUP`）記錄於計畫的 Region、Resource groups 與 Environment variables 列中，並在計畫與 `docs/spec.md` 中記錄任何後備方案及其原因。在根目錄 `.env` 中 upsert `FOUNDRY_PROJECT`（`AZURE_AI_PROJECT_ID` 數值）。針對 Copilot SDK agents，探索模型帳戶的 `/openai/v1/` 基底並執行 `azd env set MODEL_API_BASE_URL <url>`（[端點契約](hosted-integration-checkpoint.md#endpoint-contract)）。

## 3. 建構 (Build)

1. **契約優先。** 對照 `docs/spec.md` 中凍結的契約編寫程式碼。契約變更需先寫入規格書。
2. **整合檢查點。** 在分散平行展開 (fan-out) 前先通過[託管整合檢查點](hosted-integration-checkpoint.md)。建構一個最小 agent 來證明模型請求，並在規格有需求時加上一個 toolbox skill 載入與一個安全的 MCP 工具呼叫；將排除的項目記錄為 `N/A`。
   1. 在背景使用 `azd ai agent run --no-client` 與 `azd ai agent invoke --local "<probe>"` 在本機證明就緒狀態與 skill 載入。`AgenticIdentityToken` 工具呼叫僅在託管環境下運作。
   2. 依 `uses` 順序針對 MCP 伺服器、skill、連線、toolbox 與 agent 服務執行 `azd deploy <service>`。
   3. 使用 `azd ai agent invoke <agent> "<probe>"` 證明託管版本運作正常。
3. **工作串流。** 在子代理人可用時並行建構規格工作串流。每個工作者擁有專屬的工作區相對檔案或資料夾，執行其驗收檢查並將其他位置所需的變更作為 issue 回報。共用檔案保留由負責人持有：`azure.yaml`、`infra/`、`docs/`、`.env`、`.azure/`、`.agentic-loop/`、`AGENTS.md` 與根目錄鎖定檔案。在工作者完成後，工作流程比對 `git status` 與其平行展開前的快照，並將工作串流之外的任何變更路徑作為 issue 交給整合處理。
4. **整合。** 集中整合。執行建置、linter 與單元測試，並鎖定 Python 相依性 (`uv.lock` 或鎖定版本)。

**部署作業。** Implement 僅部署檢查點服務（MCP 伺服器、skills、連線、toolbox 與 agents）；前端、後端與工作者在本機執行直到 Deploy 階段。優先在本機重現 agent 缺陷（使用 `invoke --local` 的 `azd ai agent run`），且僅針對僅限託管的行為重新部署託管 agent，每次驗證修正後部署一次。僅重新部署自上次驗證部署以來原始碼或設定有變更的服務。在發生暫時性 `postdeploy` 失敗後，僅使用 `azd hooks run postdeploy` 重新執行該攔截勾點。

Agent 程式碼遵循以下參考資料：

- [foundry-hosted-agent.md](foundry-hosted-agent.md)
- [copilot-sdk-foundry.md](copilot-sdk-foundry.md) 或 `microsoft-agent-framework`
- [foundry-toolbox.md](foundry-toolbox.md)
- [foundry-iq-grounding.md](foundry-iq-grounding.md)
- [observability.md](observability.md)

## 4. 記錄 (Record)

編寫 `docs/implementation.md`，內容包含：

- 元件及其檔案；
- 橫跨前端、後端、agent、toolbox、模型與遙測之請求的 Mermaid 動畫流程；
- 包含探索到的端點數值的環境變數契約（[端點契約](hosted-integration-checkpoint.md#endpoint-contract)）；
- 檢查點記錄及其證據位置；
- 如何在本機執行每個元件；
- 與規格的偏差及其原因。

若缺少 microsoft-foundry 的 `AGENTS.md` 標記（其快速入門步驟 6），請在 foundry-agentic-loop 標記外部將其補上。

## 關卡 (Gate)

僅在滿足以下條件時通過：

- 佈建成功；
- 檢查點具備證據；
- 建置與單元測試通過；
- 後端透過 agent 的專屬端點 (`azd ai agent show`) 搭配範圍 `https://ai.azure.com/.default` 呼叫 agent。

回報：狀態、摘要、成品、假設、問題與經驗教訓。
