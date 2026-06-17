# AWS 雲端開發外掛程式 (AWS Cloud Development Plugin)

全面的 AWS 雲端開發工具，包括基礎設施即程式碼 (Infrastructure as Code)、無伺服器函式 (serverless functions)、架構模式以及成本優化，用於構建可擴展的雲端應用程式。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install aws-cloud-development@awesome-copilot
```

## 包含內容

### 指令 (斜線指令 Slash Commands)

| 指令 | 描述 |
|---------|-------------|
| `/aws-cloud-development:aws-cost-optimize` | 分析應用程式中使用的 AWS 資源（IaC 檔案和/或目標帳戶/區域中的資源）並優化成本 - 為識別出的優化項建立 GitHub issue。 |
| `/aws-cloud-development:aws-resource-health-diagnose` | 分析 AWS 資源健康狀況，從 CloudWatch 紀錄和指標中診斷問題，並針對識別出的問題建立修復計畫。 |
| `/aws-cloud-development:aws-resource-query` | 使用自然語言查詢任何 AWS 資源（EC2、S3、RDS、Lambda、VPC、IAM、Secrets Manager 等）。嚴格唯讀 — 不進行寫入或刪除。 |
| `/aws-cloud-development:aws-well-architected-review` | 對當前工作負載的 IaC 和架構執行 AWS 架構完善框架 (Well-Architected Framework) 審查，生成發現結果並建立用於改進的 GitHub issue。 |

### 代理 (Agents)

| 代理 | 描述 |
|-------|-------------|
| `aws-principal-architect` | 使用 AWS 架構完善框架原則和 AWS 最佳實踐提供專業的 AWS 首席架構師指導。 |
| `aws-serverless-architect` | 提供專業的 AWS 無伺服器架構師指導，專注於事件驅動架構、Lambda、API Gateway 和無伺服器最佳實踐。 |
| `terraform-aws-planning` | 擔任 AWS Terraform 基礎設施即程式碼任務的實作規劃師。 |
| `terraform-aws-implement` | 擔任 AWS Terraform 基礎設施即程式碼編碼專家，負責建立和審查 AWS 資源的 Terraform。 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
