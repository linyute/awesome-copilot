# 參考架構服務對應 (Reference architecture service map)

`foundry-agentic-loop` skill 的參考資料：將參考架構領域對應至 Azure 服務與附隨 skills，**僅在規格有需求時新增**。`foundry-agentic-loop` 在提出 skill 建議時將規格對照此地圖進行比對；它不是預設的資源清單。

僅在規格需要或期望時，使用此地圖提議額外的 Azure 服務。切勿將每個參考架構方塊都變成預設資源。綠地 (greenfield) 基準為執行於 Foundry 模型上的 Foundry 託管 agent，搭配一個承載其 skills、工具與基礎的 toolbox。架構遵循 SKILL.md 的規則：使用執行階段 skills 的 agent 採用 Copilot SDK，基本 agent 與明確工作流程採用 Microsoft Agent Framework。

| 參考架構領域 | 當規格需要以下項目時新增 | 建議的服務 / 能力 | Skill |
| --- | --- | --- | --- |
| 託管 Agent | 託管執行階段、agent 部署、prompt agent、agent 工具、evals、模型部署、專案設定 | Azure AI Foundry 託管 agents、Foundry 專案、Foundry 模型、Foundry evals | `microsoft/azure-skills` / `microsoft-foundry` |
| Foundry 模型 | 前沿模型部署、區域/SKU 選取、配額/容量規劃 | Foundry 模型部署 | `microsoft/azure-skills` / `microsoft-foundry` |
| Foundry IQ | 具基礎的知識、擷取、向量/混合搜尋、OCR/文件擷取、語音功能 | 透過 toolbox MCP 端點公開的 Foundry IQ 知識庫；需要時以 Azure AI Search / Document Intelligence / Speech 作為支援服務 | `microsoft/azure-skills` / `azure-ai` - 請參閱 [`foundry-iq-grounding.md`](foundry-iq-grounding.md) 以了解代理中介的 toolbox 路徑與直接擷取應急出口 |
| Work IQ / Microsoft 365 整合 | Microsoft Graph、委派驗證、企業工作流程整合、agent 身分識別 | Entra 應用程式註冊或 Entra Agent ID；若 `microsoft/azure-skills` 外部有提供請使用 Work IQ 專屬 skill | `microsoft/azure-skills` / `entra-app-registration`, `entra-agent-id` |
| Fabric IQ / 分析基礎 | 分析資料、KQL 探索、Data Lake 或 Blob 支援的基礎 | 用於 KQL 分析的 Azure Data Explorer；用於檔案與基礎資料的 Azure Storage/Data Lake | `microsoft/azure-skills` / `azure-kusto`, `azure-storage` |
| Toolbox / API / MCP 工具 | API 門面、MCP 控管、工具路由、配額、速率限制、語意快取 | 作為 AI Gateway 的 Azure API Management | `microsoft/azure-skills` / `azure-aigateway` |
| 控制平面：Evals | 針對追蹤的品質、安全性、費用與迴歸關卡 | Foundry Evals 與持續評估 | `microsoft/azure-skills` / `microsoft-foundry` |
| 控制平面：內容安全 (Content Safety) | 集中式 LLM 原則、越獄 (jailbreak) 偵測、內容安全、權杖限制 | AI Gateway 原則及/或 Foundry 防護措施 | `microsoft/azure-skills` / `azure-aigateway`, `microsoft-foundry` |
| 控制平面：可觀察性 | 遙測、追蹤、計量、應用程式監視、KQL 診斷 | Application Insights、Azure Monitor、Log Analytics/KQL | `microsoft/azure-skills` / `appinsights-instrumentation`, `azure-kusto`, `azure-diagnostics` |
| Azure 基礎建設 | 部署樣板架構、驗證、部署執行、最低權限存取 | azd/Bicep 準備、驗證、部署、RBAC | `microsoft/azure-skills` / `azure-prepare`, `azure-validate`, `azure-deploy`，以及 `microsoft-foundry/rbac` 子 skill |
