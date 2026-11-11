# Azure 部署計畫

## 目標 (Target)

| 欄位 | 數值 |
| --- | --- |
| 解決方案 | `hr-proto` |
| 模式 | `rapid` |
| Foundry 專案 | `/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-example/providers/Microsoft.CognitiveServices/accounts/example-ai/projects/hr-proto` |
| 訂用帳戶 | `Example` (`00000000-0000-0000-0000-000000000000`) |
| 資源群組 | `rg-example` (專案的群組) |
| 區域 | 專案的區域，`swedencentral` |

## 資源 (Resources)

| 資源 | 層級 | 用途 | SKU | 身分識別 | 預估每月費用 |
| --- | --- | --- | --- | --- | --- |
| Foundry 帳戶與專案 | — | Agent、模型、toolbox (重複使用) | S0 | system | 依用量計費 |
| Container Apps 環境 `cae-hr-proto` | — | `hr-mcp` (已部署)；後端與前端 (未部署) | Consumption | user-assigned | 預估值：低 |

## RBAC

判定結果：`READY`。
