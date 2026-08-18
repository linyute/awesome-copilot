# AWS Cloud Development 外掛程式

全方位的 AWS 雲端開發工具，包含基礎結構即程式碼（IaC）、無伺服器函式、架構模式以及成本最佳化，用於建構具延展性的雲端應用程式。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install aws-cloud-development@awesome-copilot
```

## 包含內容

### 指令（斜線指令）

| 指令 | 說明 |
|---------|-------------|
| `/aws-cloud-development:aws-cost-optimize` | 分析應用程式中使用的 AWS 資源（目標帳戶/區域中的 IaC 檔案及/或資源）並最佳化成本 — 為識別出的最佳化項目建立 GitHub issue。 |
| `/aws-cloud-development:aws-resource-health-diagnose` | 分析 AWS 資源健康度、從 CloudWatch 記錄與計量中診斷問題，並為識別出的問題建立補救計畫。 |
| `/aws-cloud-development:aws-resource-query` | 使用自然語言查詢任何 AWS 資源（EC2、S3、RDS、Lambda、VPC、IAM、Secrets Manager 等）。嚴格唯讀 — 不進行寫入或刪除。 |
| `/aws-cloud-development:aws-well-architected-review` | 針對目前工作負載的 IaC 與架構執行 AWS Well-Architected Framework 審查，產生調查結果以及改進的 GitHub issue。 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `aws-principal-architect` | 使用 AWS Well-Architected Framework 原則與 AWS 最佳做法提供專業的 AWS 主要架構師指引。 |
| `aws-serverless-architect` | 提供專注於事件驅動架構、Lambda、API Gateway 及無伺服器最佳做法的專業 AWS 無伺服器架構師指引。 |
| `terraform-aws-planning` | 擔任 AWS Terraform 基礎結構即程式碼任務的實作規劃人員。 |
| `terraform-aws-implement` | 擔任建立與審查 AWS 資源 Terraform 的 AWS Terraform 基礎結構即程式碼編碼專家。 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot)（GitHub Copilot 擴充功能的社群驅動集合）的一部分。

## 授權條款

MIT
