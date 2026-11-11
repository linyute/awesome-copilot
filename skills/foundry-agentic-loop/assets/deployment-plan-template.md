# Azure 部署計畫

> 此工作區 Azure 設定的單一歸宿，適用於兩種模式。由 Specify (SDD) 或 rapid 預檢編寫，隨著資源變更保持最新狀態；Implement 與 Deploy 會讀取此檔案。Rapid 僅填寫適用的列並略過標註為 SDD 的列。不包含密碼秘密。

## 目標 (Target)

| 欄位 | 數值 |
| --- | --- |
| 解決方案 | `{solution}` |
| 模式 | `sdd` 或 `rapid`，與根目錄 `AGENTS.md` 鎖定相符 |
| Foundry 專案 | SDD：由 `foundry` 層建立，於佈建後記錄 ARM 識別碼。Rapid：現有專案的 ARM 識別碼與端點 |
| azd 環境 (SDD) | `{solution}-{stage}` (至多 20 個字元) |
| 訂用帳戶 | `{name}` (`{id}`)，租用戶 `{tenantId}` |
| 已登入主體 | `{upn or appId}` (`{objectId}`) |
| 資源群組 | SDD 應用程式：`rg-{environment}` (全新；`az group exists` 傳回 false)。Foundry：{提供者的群組，於佈建後記錄；rapid：專案的群組} |
| 區域 | 偏好 `{region}` → 選定 `{region}`，原因：{放置證據}。Rapid：專案的區域 |
| Agent 樣板 (SDD) | `azd ai agent init .` 搭配 Basic 範例資訊清單 `{manifestUrl}`，於空白 `.scaffold` 資料夾中建立，隨後移入定位 |
| 基礎結構 (SDD) | `azure.yaml` 各層：`foundry` (`microsoft.foundry`) → `app` (搭配 AVM 的 Bicep，`infra/app`) |

## 模型 (Models)

| 部署 | 模型與版本 | SKU | 容量 | 配額證據 |
| --- | --- | --- | --- | --- |
| `gpt-5.4-mini` | `gpt-5.4-mini` {version} | GlobalStandard | {TPM} (每次約 {tokens} 權杖下約 ~{c} 個並行 E2E 案例) | {區域內的可用配額} |

## 資源 (Resources)

Rapid 僅列出其重複使用或建立的資源，層級填入 `—`。

| 資源 | 層級 | 用途 | SKU | 身分識別 | 預估每月費用 |
| --- | --- | --- | --- | --- | --- |
| Foundry 帳戶與專案 | foundry | Agents、模型、toolbox | S0 | system | 依用量計費 |
| Container Apps 環境與應用程式 | app | 前端、後端、MCP | Consumption | user-assigned | {估計值} |
| Container Registry | app | 映像檔 (遠端建構) | Basic | 透過身分識別進行 AcrPull | {估計值} |
| Log Analytics 與 Application Insights | app | 遙測，已連接至專案 | Pay-as-you-go | — | {估計值} |

## RBAC

來自 foundry-agentic-loop RBAC 預檢的判定結果：`READY` 或 `BLOCKED`。

| 主體 | 角色 | 範圍 | 建立者 |
| --- | --- | --- | --- |
| {identity} | {role} | {scope} | 應用程式層 |
| {deployer} (`AZURE_PRINCIPAL_ID`) | Monitoring Metrics Publisher | Application Insights | 應用程式層 |

{當狀態為 BLOCKED 時：提供給擁有者的現成可用授權區塊。}

## 環境變數 (SDD)

Implement 會使用 `azd env set` 設定這些變數，優先設定 `AZURE_RESOURCE_GROUP`，每個變數執行一個命令。

| 變數 | 數值 |
| --- | --- |
| `AZURE_RESOURCE_GROUP` | `rg-{environment}` |
| `AZURE_SUBSCRIPTION_ID` | `{id}` |
| `AZURE_LOCATION` | `{region}` |
| `AZURE_TENANT_ID` | `{tenantId}` |
| `AZD_AGENT_SKIP_ACR` | 僅當 agent 部署為容器時為 `false` |

## 風險與決策

| 項目 | 決策 | 證據 |
| --- | --- | --- |
| {費用、配額、安全性或合規性項目} | {決策} | {來源} |
