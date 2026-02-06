# Azure 與雲端開發延伸模組

全面的 Azure 雲端開發工具，包含基礎結構即程式碼 (IaC)、無伺服器函式、架構模式以及用於建置可調整規模雲端應用程式的成本最佳化。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install azure-cloud-development@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 描述 |
|---------|-------------|
| `/azure-cloud-development:azure-resource-health-diagnose` | 分析 Azure 資源健康狀況，從記錄和遙測中診斷問題，並為識別出的問題建立修復計劃。 |
| `/azure-cloud-development:az-cost-optimize` | 分析應用程式中使用的 Azure 資源 (IaC 檔案和/或目標資源群組中的資源) 並最佳化成本 - 為識別出的最佳化項目建立 GitHub Issue。 |

### Agent

| Agent | 描述 |
|-------|-------------|
| `azure-principal-architect` | 使用 Azure Well-Architected Framework 原則和 Microsoft 最佳做法提供專家級 Azure 首席架構師指導。 |
| `azure-saas-architect` | 提供專家級 Azure SaaS 架構師指導，專注於使用 Azure Well-Architected SaaS 原則和 Microsoft 最佳做法的多租用戶應用程式。 |
| `azure-logic-apps-expert` | Azure Logic Apps 開發的專家指導，專注於工作流設計、整合模式和基於 JSON 的工作流定義語言。 |
| `azure-verified-modules-bicep` | 使用 Azure 驗證模組 (AVM) 在 Bicep 中建立、更新或檢閱 Azure IaC。 |
| `azure-verified-modules-terraform` | 使用 Azure 驗證模組 (AVM) 在 Terraform 中建立、更新或檢閱 Azure IaC。 |
| `terraform-azure-planning` | 擔任 Azure Terraform 基礎結構即程式碼工作的工作執行規劃員。 |
| `terraform-azure-implement` | 擔任 Azure Terraform 基礎結構即程式碼開發專家，負責建立和檢閱 Azure 資源的 Terraform。 |

## 來源

此延伸模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
