# Skill 目錄 (Skill catalog)

僅在需要附隨能力時，將協議好的架構（rapid 模式下的根目錄 `README.md`，SDD 下的 `./docs/spec.md`）與此目錄進行比對。`microsoft-foundry` 為必要項目。針對使用執行階段 skills 的 agent 請採用 Copilot SDK，針對基本 agent 或明確工作流程請採用 Microsoft Agent Framework。若工作流程亦需要 skills，請釐清架構選擇。使用者明確選擇的架構優先於預設值；每個 agent 選擇一種架構，整個解決方案不一定要採用單一架構。

目錄中的收錄不代表該 skill 仍然存在或處於最新狀態。針對選定的候選項目，適時使用 `gh skill preview <repository> <skill>` 與已安裝的 skill metadata 驗證其來源/版本以及可用的 CLI 支援。尊重版本鎖定，並在安裝或更新前先詢問。切勿審核每個已安裝的 skill 或修補第三方複本。除非使用者另有選擇，專案範圍 (project scope) 為預設的安裝範圍。

**新鮮度預檢** (SDD Specify，或在依賴選定 skill 的範例之前)。需要 GitHub CLI 2.90+。`gh skill list --json skillName,sourceURL,scope,version,pinned,path` 僅證明已安裝，不代表新鮮度；使用 `gh skill update --dry-run` 比對 tree SHA，若某項功能已移至受維護的父系或子 skill，請使用該路徑。將每個需要的 skill 標記為 missing (遺漏)、current (最新)、update available (有可用更新) 或 pinned (已鎖定)。獲得核准後，使用 `gh skill update <skill>` 重新整理未鎖定的過期 skill；除非核准 `--unpin`，否則保留鎖定。在唯讀請求中，回報命令及其所需的核准，而不執行它。當 skill 與已安裝的套件 API 衝突時，以套件來源為主；將缺陷作為 issue 或 PR 回報至上游，而非修補本機複本。Foundry 角色來自受維護的 `microsoft-foundry/rbac` 子 skill，而非獨立的 `azure-rbac`。

| 存放庫 (Repository)       | Skill                          | 當架構需要以下項目時建議使用 |
| ------------------------- | ------------------------------ | ------------------------------ |
| `microsoft/azure-skills`  | `microsoft-foundry`            | Agentic Loop 的必要平台執行工具；使用其受維護的 RBAC 指引以取得 Foundry 管理平面與資料平面權限 |
| `microsoft/azure-skills`  | `azure-ai`                     | AI Search、向量/混合搜尋、語意搜尋、Document Intelligence/OCR、語音/STT/TTS |
| `microsoft/azure-skills`  | `azure-aigateway`              | AI Gateway、用於模型/工具/agent 路由的 API Management、語意快取、內容安全、權杖限制、MCP 控管 |
| `microsoft/azure-skills`  | `appinsights-instrumentation`  | Application Insights SDK 安裝、遙測檢測、追蹤、計量與應用程式監視 |
| `microsoft/azure-skills`  | `azure-kusto`                  | KQL 分析、Azure Data Explorer、Log Analytics 樣式遙測探索、時間序列分析 |
| `microsoft/azure-skills`  | `azure-storage`                | 用於基礎資料、上傳、持久成品或文件/檔案落地區域的 Blob/檔案/Data Lake 儲存體 |
| `microsoft/azure-skills`  | `azure-messaging`              | 服務匯流排、事件中心、非同步業務動作、事件擷取、佇列、主題或傳訊 SDK 疑難排解 |
| `microsoft/azure-skills`  | `entra-app-registration`       | Microsoft Graph/OAuth 應用程式註冊、委派驗證、API 權限、MSAL 整合 |
| `microsoft/azure-skills`  | `entra-agent-id`               | Entra Agent Identity、agent OAuth、OBO、工作負載身分識別同盟、跨租用戶 agent 驗證 |
| `microsoft/azure-skills`  | `azure-prepare`                | azd AI 入門版以外的 SDD 服務，或 rapid 模式中明確選擇的 IaC/azd 樣板架構 |
| `microsoft/azure-skills`  | `azure-validate`               | azd/IaC 部署的驗證，包含設定、RBAC 與 what-if 檢查 |
| `microsoft/azure-skills`  | `azure-deploy`                 | 已備妥之 azd/IaC 部署的執行/復原 |
| `github/awesome-copilot`  | `microsoft-agent-framework`    | 基本 agent 或明確 agent 工作流程，或明確選擇 MAF；釐清同時需要執行階段 skills 的工作流程 |
| `github/awesome-copilot`  | `copilot-sdk`                  | 使用執行階段 skills 的 agent，或明確選擇 Copilot SDK；BYOK Foundry 模型、toolbox 工具/skills 與 Responses API |
| `github/awesome-copilot`  | `python-mcp-server-generator`  | Python MCP 伺服器 (FastMCP, 串流 HTTP) |

建置 skills 協助編碼助理建構應用程式；[run skills](run-skills-catalog.md) 則由產生的 agent 執行。遵循目前的 `microsoft-foundry` 工作流程以取得受控管的 skill 版本與 toolbox 設定，並針對已安裝的 SDK API 驗證產生的程式碼。目錄選取不得覆寫 `SKILL.md` 中的模式預設值。此 skill、canvas 與工作流程隨附於 `foundry-agentic-loop` 外掛中；請勿將其安裝為附隨工具。
