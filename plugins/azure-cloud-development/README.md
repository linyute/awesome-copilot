# Azure 與雲端開發外掛程式

全面的 Azure 雲端開發工具，包含基礎架構即程式碼 (IaC)、無伺服器函式、架構模式以及成本最佳化，用於建構可延展的雲端應用程式。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install azure-cloud-development@awesome-copilot
```

## 包含內容

### 命令 (斜線命令)

| 命令 | 說明 |
|---------|-------------|
| `/azure-cloud-development:azure-resource-health-diagnose` | 分析 Azure 資源健康狀況，從記錄與遙測資料中診斷問題，並針對識別出的問題建立修復計畫。 |
| `/azure-cloud-development:az-cost-optimize` | 分析應用程式中使用的 Azure 資源 (IaC 檔案和/或目標資源群組中的資源) 並最佳化成本 - 針對識別出的最佳化項目建立 GitHub 議題 (Issue)。 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `azure-principal-architect` | 使用 Azure架構良好框架 (Well-Architected Framework) 原則與 Microsoft 最佳做法，提供專業的 Azure 首席架構師指引。 |
| `azure-saas-architect` | 使用 Azure 架構良好 SaaS 原則與 Microsoft 最佳做法，提供專注於多租用戶應用程式的專業 Azure SaaS 架構師指引。 |
| `azure-logic-apps-expert` | 提供 Azure Logic Apps 開發的專業指引，專注於工作流程設計、整合模式與基於 JSON 的工作流程定義語言 (Workflow Definition Language)。 |
| `azure-verified-modules-bicep` | 使用 Azure 認證模組 (AVM) 建立、更新或檢閱 Bicep 中的 Azure IaC。 |
| `azure-verified-modules-terraform` | 使用 Azure 認證模組 (AVM) 建立、更新或檢閱 Terraform 中的 Azure IaC。 |
| `terraform-azure-planning` | 擔任您 Azure Terraform 基礎架構即程式碼任務的實作規劃者。 |
| `terraform-azure-implement` | 擔任 Azure Terraform 基礎架構即程式碼撰寫專家，負責建立並檢閱 Azure 資源的 Terraform。 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能收藏。

## 授權

MIT
