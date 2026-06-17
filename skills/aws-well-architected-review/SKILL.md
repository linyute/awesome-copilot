---
name: aws-well-architected-review
description: '對目前的工項 IaC 和架構執行 AWS Well-Architected Framework (WAF) 審查，產生發現結果並為改進建議建立 GitHub Issue。'
---

# AWS Well-Architected 審查 (AWS Well-Architected Review)

此工作流對您工項的 IaC 檔案和已部署的基礎設施執行結構化的 AWS Well-Architected Framework (WAF) 審查。它識別所有 6 個 WAF 支柱中的風險，並建立 GitHub Issue 來追蹤修復。

## 先決條件
- 已配置 AWS CLI 並通過身分驗證
- 儲存庫中存在 IaC 檔案 (Terraform, CloudFormation, CDK 或 SAM)
- 已配置 GitHub MCP 伺服器並通過身分驗證

## 工作流程步驟

### 第 1 步：加載 Well-Architected Framework 參考
獲取最新的 AWS WAF 最佳實踐：
- `https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html`
- 與工項類型（無伺服器、SaaS 等）相關的特定支柱視角 (Lenses)

### 第 2 步：發現 IaC 與架構
掃描儲存庫以查找 IaC 檔案：
- Terraform: `**/*.tf`
- CloudFormation/SAM: `**/*.yaml`, `**/*.json` (CFn 模板)
- CDK: `lib/**/*.ts`, `bin/**/*.ts`, `cdk.json`

識別正在使用的關鍵 AWS 服務（運算、數據、網路、安全、觀測性）並產生 Mermaid 架構圖。

### 第 3 步：逐支柱審查

#### 支柱 1：卓越營運 (Operational Excellence)
- [ ] 所有基礎設施均定義為 IaC（無手動主控台更改）
- [ ] 所有資源均應用了一致的標記策略
- [ ] 為關鍵指標定義了 CloudWatch 警報
- [ ] 具備自動部署管道（無手動部署）
- [ ] 啟用了 CloudTrail 用於稽核日誌記錄
- [ ] 具備 Runbook 或營運文件

#### 支柱 2：安全性 (Security)
- [ ] IAM 角色使用最小權限原則策略（無理由不得使用 `*` 權限）
- [ ] IaC 或代碼中無硬編碼的憑據
- [ ] 透過 Secrets Manager 或 SSM Parameter Store 管理秘密
- [ ] S3 儲存桶已封鎖公共訪問並啟用了伺服器端加密
- [ ] 敏感資源放置在私有子網路中
- [ ] 安全群組將入站限制在最小要求的埠/CIDR
- [ ] 敏感數據存儲（RDS, EBS, S3, SQS, DynamoDB）啟用了 KMS 加密
- [ ] 所有端點強制執行 SSL/TLS (`enforceSSL: true`)
- [ ] 啟用了 GuardDuty (`aws guardduty list-detectors`)
- [ ] 在面向公眾的 API 和 CloudFront 分發上配置了 AWS WAF
- [ ] 關鍵 S3 儲存桶啟用了 MFA 刪除

#### 支柱 3：可靠性 (Reliability)
- [ ] 生產資料庫採用多可用區 (Multi-AZ) 部署（RDS Multi-AZ, DynamoDB 全球資料表）
- [ ] 配置了具有適當策略的 EC2/ECS 自動縮放 (Auto Scaling)
- [ ] 配置了 S3 版本控制和生命週期策略
- [ ] 啟用了 RDS 自動備份並設定了適當的保留期
- [ ] 啟用了 DynamoDB 時間點復原 (PITR)
- [ ] 為 Lambda, SQS, SNS 配置了無效字母隊列 (DLQ)
- [ ] 配置了用於 DNS 故障轉移的 Route 53 運作狀態檢查
- [ ] 設定了 Lambda 預留並行性，以防止「噪鄰」節流

#### 支柱 4：效能效率 (Performance Efficiency)
- [ ] 執行個體類型大小合適（Lambda 記憶體、EC2 類型、RDS 等級）
- [ ] 在可用處使用了 Graviton/ARM 執行個體（Lambda `arm64`, EC2 Graviton）
- [ ] 實施了快取（ElastiCache, DAX, CloudFront, API Gateway 快取）
- [ ] 使用 CloudFront 進行全球靜態內容分發
- [ ] 為多變的負載模式使用 Aurora Serverless 或 DynamoDB On-Demand
- [ ] 為延遲敏感的同步路徑配置了 Lambda 預佈建並行性

#### 支柱 5：成本優化 (Cost Optimization)
- [ ] 為穩定狀態的工項使用 EC2 預留執行個體或 Savings Plans
- [ ] S3 生命週期策略將數據移至更便宜的存儲層
- [ ] 採用 Lambda `arm64` 架構（成本降低 20%）
- [ ] 為 S3/DynamoDB 使用 VPC 端點以避免 NAT 閘道費用
- [ ] 將 gp2 EBS 磁碟區遷移至 gp3（效能相同，成本降低 20%）
- [ ] 開發/測試環境設有自動關機排程
- [ ] 配置了 AWS 預算 (Budgets) 和成本異常偵測
- [ ] 識別了未掛載的 EBS 磁碟區和閒置的 EC2 執行個體

#### 支柱 6：可持續性 (Sustainability)
- [ ] 在可用處選擇 Graviton/ARM 執行個體
- [ ] 優先選擇無伺服器/託管服務，而非始終開啟的 EC2
- [ ] S3 生命週期策略減少了不必要的長期數據存儲
- [ ] 配置了自動縮放以避免過度配置
- [ ] 區域選擇考慮了 AWS 可再生能源承諾

### 第 4 步：風險分類
為每個發現結果進行分類：
- **高風險**: 安全漏洞、單點故障、無備份/復原
- **中風險**: 可靠性欠佳、成本效率低下、效能疑慮
- **低風險**: 偏離最佳實踐、微小的優化機會

### 第 5 步：使用者確認

```
🏗️ AWS Well-Architected 審查摘要

📊 審查結果：
• 已分析的 IaC 檔案：X
• 已識別的 AWS 服務：Y
• 發現結果總數：Z
  • 高風險：A (需立即採取的行動)
  • 中風險：B (應盡快處理)
  • 低風險：C (建議項目)

🔴 首要高風險發現結果：
1. [支柱]：[發現結果] — [為什麼重要]
2. [支柱]：[發現結果] — [為什麼重要]

💡 這將建立 Z 個獨立的 GitHub Issue + 1 個 EPIC Issue。

❓ 是否繼續建立 GitHub Issue？(y/n)
```

### 第 6 步：建立單個發現結果 Issue
標記為 "well-architected" 和支柱名稱（例如："security", "reliability"）。

**標題**: `[WAF-<支柱名稱>] [簡短髮現] — [風險級別]`

**正文**:
```markdown
## 🏗️ Well-Architected 發現結果：[簡短標題]

**支柱**：[名稱] | **風險級別**：[高/中/低] | **投入精力**：[低/中/高]

### 📋 描述
[對發現結果及其重要性的清晰解釋]

### 🔧 修復建議

**IaC 修復** (偏好方式):
```hcl
# Terraform 示例
resource "aws_s3_bucket_server_side_encryption_configuration" "example" {
  bucket = aws_s3_bucket.example.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}
```

**AWS CLI 備選方案**:
```bash
aws s3api put-bucket-encryption --bucket <name> \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'
```

### 📚 AWS 參考資料
- [WAF 最佳實踐連結]
- [AWS 文件連結]

### ✅ 驗證
- [ ] 更改已在 IaC 中實施並部署
- [ ] AWS Config 規則通過（如果適用）
- [ ] Security Hub 發現結果已解決（如果適用）

**Well-Architected 問題**: [對應的 WAF 問題]
```

### 第 7 步：建立 EPIC 追蹤 Issue
標記為 "well-architected" 和 "epic"。

**標題**: `[EPIC] AWS Well-Architected 審查 — 6 個支柱中的 X 項發現`

**正文**: 執行摘要，包含支柱細分表（按支柱和風險級別統計發現結果數量）、Mermaid 架構圖、連結所有單個 Issue 的優先級檢查清單（高 → 中 → 低），以及成功標準：
- 所有高風險發現結果均已解決
- 中風險發現結果已有公認的緩解計劃
- 現有的 CloudWatch 警報或 Config 規則無回歸

## 錯誤處理
- **未找到 IaC 檔案**: 僅限於透過 AWS CLI 進行即時資源發現審查，並註明差距
- **AWS 權限不足**: 列出審查所需的唯讀權限
- **GitHub 建立失敗**: 將所有發現結果以格式化的 markdown 輸出到主控台

## 成功標準
- ✅ 已針對 IaC 和即時基礎設施審查所有 6 個 WAF 支柱
- ✅ 所有發現結果均按風險級別和支柱進行了分類
- ✅ 為每項發現結果提供了帶有 IaC 示例的可操作修復步驟
- ✅ 建立了 GitHub Issue 供團隊追蹤
- ✅ 為 EPIC 上下文產生了架構圖
- ✅ 包含了 AWS 文件參考
