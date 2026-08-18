# Azure & Cloud Development 外掛程式

全方位的 Azure 雲端開發工具，包含基礎結構即程式碼（IaC）、無伺服器函式、架構模式以及成本最佳化，用於建構具延展性的雲端應用程式。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install azure-cloud-development@awesome-copilot
```

## 包含內容

### 指令（斜線指令）

| 指令 | 說明 |
|---------|-------------|
| `/azure-cloud-development:azure-resource-health-diagnose` | 分析 Azure 資源健康度、從記錄與遙測中診斷問題，並為識別出的問題建立補救計畫。 |
| `/azure-cloud-development:az-cost-optimize` | 分析應用程式中使用的 Azure 資源（目標資源群組中的 IaC 檔案及/或資源）並最佳化成本 — 為識別出的最佳化項目建立 GitHub issue。 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `azure-principal-architect` | 使用 Azure Well-Architected Framework 原則與 Microsoft 最佳做法提供專業的 Azure 主要架構師指引。 |
| `azure-saas-architect` | 使用 Azure Well-Architected SaaS 原則與 Microsoft 最佳做法，提供專注於多租用戶應用程式的專業 Azure SaaS 架構師指引。 |
| `azure-logic-apps-expert` | 專注於工作流程設計、整合模式與以 JSON 為基礎之工作流程定義語言的 Azure Logic Apps 開發專業指引。 |
| `azure-verified-modules-bicep` | 使用 Azure Verified Modules (AVM) 在 Bicep 中建立、更新或審查 Azure IaC。 |
| `azure-verified-modules-terraform` | 使用 Azure Verified Modules (AVM) 在 Terraform 中建立、更新或審查 Azure IaC。 |
| `terraform-azure-planning` | 擔任 Azure Terraform 基礎結構即程式碼任務的實作規劃人員。 |
| `terraform-azure-implement` | 擔任建立與審查 Azure 資源 Terraform 的 Azure Terraform 基礎結構即程式碼編碼專家。 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot)（GitHub Copilot 擴充功能的社群驅動集合）的一部分。

## 授權條款

MIT
