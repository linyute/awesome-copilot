# Foundry Hosted Agent + CopilotKit 外掛程式

建構並演進代理人 Web 應用程式，讓 CopilotKit React 前端透過 AG-UI 通訊協定與作為 Microsoft Foundry 託管代理人執行的 Microsoft Agent Framework 代理人進行通訊。

## 包含內容

### 技能

| 技能 | 說明 |
| --- | --- |
| `/foundry-hosted-agent-copilotkit` | 選擇串接方式、使用 Foundry 原生基元（交談、持久核准、背景執行、Toolbox、記憶體、工作階段檔案）、新增工具與真人介入（human-in-the-loop）核准、使用 `azd` 部署，以及對 AG-UI 事件串流進行偵錯。 |

### MCP 伺服器

| 伺服器 | 說明 |
| --- | --- |
| `microsoft-learn` | Microsoft Learn MCP 伺服器（`https://learn.microsoft.com/api/mcp`），用於取得最新的 Agent Framework 與 Foundry 文件和程式碼範例。 |
| `foundry` | Foundry MCP 伺服器（`https://mcp.ai.azure.com`），用於檢查 Foundry 專案、模型部署與代理人。使用您的 Microsoft Entra ID 帳戶登入。 |

## 需求

- 擁有 Microsoft Foundry 專案的 Azure 訂用帳戶（託管代理人為付費預覽服務）。
- 具備 `azure.ai.agents` 擴充功能的 Azure Developer CLI (`azd`)，以及 Azure CLI。
- 適用於前端、CopilotKit 執行階段與 AG-UI 閘道的 Node.js 與 Python。