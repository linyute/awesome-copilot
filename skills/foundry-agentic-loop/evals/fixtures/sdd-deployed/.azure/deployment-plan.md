# Azure 部署計畫

## 目標 (Target)

| 欄位 | 數值 |
| --- | --- |
| 解決方案 | `claims` |
| 模式 | `sdd` |
| Foundry 專案 | 由 `foundry` 層建立：`/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-claims-dev-foundry/providers/Microsoft.CognitiveServices/accounts/claims-dev-ai/projects/claims` |
| azd 環境 (SDD) | `claims-dev` |
| 訂用帳戶 | `Example` (`00000000-0000-0000-0000-000000000000`)，租用戶 `00000000-0000-0000-0000-000000000000` |
| 資源群組 | 應用程式：`rg-claims-dev`。Foundry：`rg-claims-dev-foundry` |
| 區域 | 偏好 `swedencentral` → 選定 `swedencentral`，因為聯合放置檢查已通過 |
| 基礎結構 (SDD) | `azure.yaml` 各層：`foundry` (`microsoft.foundry`) → `app` (搭配 AVM 的 Bicep，`infra/app`) |

## 模型 (Models)

| 部署 | 模型與版本 | SKU | 容量 | 配額證據 |
| --- | --- | --- | --- | --- |
| `gpt-5.4-mini` | `gpt-5.4-mini` | GlobalStandard | 100K TPM (每次約 60K 權杖下約 ~4 個並行 E2E 案例) | 可用配額已檢查 |

## 資源 (Resources)

| 資源 | 層級 | 用途 | SKU | 身分識別 | 預估每月費用 |
| --- | --- | --- | --- | --- | --- |
| Foundry 帳戶與專案 | foundry | Agents、模型、toolbox | S0 | system | 依用量計費 |
| Container Apps 環境與應用程式 | app | 前端 (外部)、後端 (內部)、MCP | Consumption | user-assigned | 預估值：低 |
| Container Registry | app | 映像檔 (遠端建構) | Basic | 透過身分識別進行 AcrPull | 預估值：低 |
| Log Analytics 與 Application Insights | app | 遙測，已連接至專案 | Pay-as-you-go | — | 預估值：低 |

## RBAC

判定結果：`READY`。
