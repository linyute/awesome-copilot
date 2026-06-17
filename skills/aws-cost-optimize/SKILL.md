---
name: aws-cost-optimize
description: '分析應用程式中使用的 AWS 資源（目標帳戶/區域中的 IaC 檔案和/或資源）並優化成本 — 為識別出的優化建議建立 GitHub Issue。'
---

# AWS 成本優化 (AWS Cost Optimize)

此工作流分析基礎設施即代碼 (IaC) 檔案和 AWS 資源，以產生成本優化建議。它會為每個優化機會建立單獨的 GitHub Issue，並建立一個 EPIC Issue 來協調實施，從而實現成本節約計劃的高效追蹤和執行。

## 先決條件
- 已配置 AWS CLI 並通過身分驗證（`aws sts get-caller-identity` 成功執行）
- 已配置 GitHub MCP 伺服器並通過身分驗證
- 已識別目標 GitHub 儲存庫
- 已部署 AWS 資源（IaC 檔案為選填，但很有幫助）

## 工作流程步驟

### 第 1 步：獲取 AWS 成本優化最佳實踐
**行動**: 在分析之前檢索成本優化最佳實踐
**工具**: 使用 `fetch` 檢索 AWS 文件
**過程**:
1. **加載最佳實踐**:
   - 獲取 `https://docs.aws.amazon.com/cost-management/latest/userguide/cost-optimization-best-practices.html`
   - 獲取 AWS Well-Architected 成本優化支柱摘要
   - 使用這些實踐來為隨後的分析和建議提供資訊

### 第 2 步：發現 AWS 基礎設施
**行動**: 動態發現並分析 AWS 資源和配置
**工具**: AWS CLI + 本地檔案系統訪問
**過程**:
1. **帳戶與區域發現**:
   - 執行 `aws sts get-caller-identity` 以確認帳戶
   - 執行 `aws configure get region` 以確定預設區域

2. **資源發現**（按區域）：
   - EC2 執行個體：`aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,InstanceType,State.Name,Tags]'`
   - RDS 執行個體：`aws rds describe-db-instances --query 'DBInstances[].[DBInstanceIdentifier,DBInstanceClass,Engine,MultiAZ]'`
   - Lambda 函數：`aws lambda list-functions --query 'Functions[].[FunctionName,Runtime,MemorySize,Architectures]'`
   - ECS 叢集/服務：先 `aws ecs list-clusters` 然後 `aws ecs describe-services`
   - S3 儲存桶：`aws s3api list-buckets --query 'Buckets[].Name'`
   - ElastiCache 叢集：`aws elasticache describe-cache-clusters`
   - NAT 閘道：`aws ec2 describe-nat-gateways`
   - 負載平衡器：`aws elbv2 describe-load-balancers`

3. **IaC 偵測**:
   - 掃描 IaC 檔案：`**/*.tf`, `**/*.yaml` (CloudFormation/SAM), `**/*.json` (CloudFormation), `**/cdk.json`, `lib/**/*.ts` (CDK)
   - 解析資源定義以了解預期配置
   - 請勿使用應用程式程式碼檔案 — 僅將 IaC 檔案作為事實來源
   - 如果未找到 IaC 檔案：停止並向使用者報告

### 第 3 步：收集使用指標並驗證目前成本
**行動**: 收集利用率數據並驗證實際資源成本
**工具**: AWS CLI (CloudWatch, Cost Explorer)
**過程**:
1. **CloudWatch 指標**（過去 7 天）：
   ```bash
   # EC2 CPU 利用率
   aws cloudwatch get-metric-statistics \
     --namespace AWS/EC2 --metric-name CPUUtilization \
     --dimensions Name=InstanceId,Value=<id> \
     --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
     --period 3600 --statistics Average

   # Lambda 執行時間 (Duration)
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda --metric-name Duration \
     --dimensions Name=FunctionName,Value=<name> \
     --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
     --period 86400 --statistics Average,Maximum
   ```

2. **AWS Cost Explorer**:
   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
     --granularity MONTHLY --metrics BlendedCost \
     --group-by Type=DIMENSION,Key=SERVICE
   ```

3. **計算基準指標**: CPU/記憶體平均值、Lambda 調用率、數據傳輸模式，以及現實的目前每月總成本。

### 第 4 步：產生成本優化建議
**行動**: 分析資源以識別優化機會
**過程**:
1. **應用優化模式**:

   **運算 (Compute)**:
   - EC2：根據 CPU/記憶體調整規格（平均利用率 <20% → 縮小規格）、將按需 (On-Demand) 轉換為 Savings Plans、遷移至 Graviton/ARM（最高可節省 40%）
   - Lambda：減少閒置函數的記憶體、切換至 `arm64`（節省 20%）
   - ECS/EKS：為開發/批次工項使用 Fargate Spot

   **資料庫 (Database)**:
   - RDS：調整執行個體等級規格、將開發環境轉換為單可用區 (Single-AZ)、為多變負載使用 Aurora Serverless v2
   - DynamoDB：為不可預測的流量從預佈建 (Provisioned) 切換至按需 (On-Demand)
   - ElastiCache：根據記憶體利用率調整節點類型規格

   **儲存 (Storage)**:
   - S3：生命週期策略（30 天後從 Standard → Standard-IA → 90 天後進入 Glacier）、啟用智能分層 (Intelligent-Tiering)
   - EBS：刪除未掛載的磁碟區、將 gp2 轉換為 gp3（效能相同，成本降低 20%）

   **網路 (Network)**:
   - 合併非生產環境的 NAT 閘道
   - 為 S3/DynamoDB 使用 VPC 端點，以避免 NAT 閘道費用

2. **計算優先級評分**:
   ```
   優先級評分 = (價值評分 × 每月節省金額) / (風險評分 × 實施天數)
   高: 評分 > 20 | 中: 評分 5-20 | 低: 評分 < 5
   ```

### 第 5 步：使用者確認
**行動**: 在建立 GitHub Issue 之前呈現摘要並徵得批准

```
🎯 AWS 成本優化摘要

📊 分析結果：
• 已分析資源總數：X
• 目前每月成本：$X
• 潛在每月節省：$Y
• 優化機會：Z
• 高優先級項目：N

🏆 建議：
1. [資源]：[目前] → [目標] = 每月節省 $X - [風險] | [投入精力]
...

💡 這將建立 Y 個獨立的 GitHub Issue + 1 個 EPIC Issue。

❓ 是否繼續建立 GitHub Issue？(y/n)
```

等待使用者確認後再繼續。

### 第 6 步：建立單個優化 Issue
**行動**: 為每項優化建立單獨的 GitHub Issue。標記為 "cost-optimization"（綠色）和 "aws"（橙色）。

**標題**: `[COST-OPT] [資源類型] - [簡短描述] - 每月節省 $X`

**正文**:
```markdown
## 💰 成本優化：[簡短標題]

**每月節省**: $X | **風險級別**: [低/中/高] | **投入精力**: X 天

### 📋 描述
[對優化內容及其必要性的清晰解釋]

### 🔧 實施

**偵測到 IaC 檔案**: [是/否]

```bash
# IaC 修改（首選）或 AWS CLI 備選方案
```

### 📊 證據
- 目前配置：[詳情]
- 使用模式：[來自 CloudWatch 的證據]
- 成本影響：每月 $X → 每月 $Y

### ✅ 驗證步驟
- [ ] 在非生產環境中進行測試
- [ ] 透過 CloudWatch 驗證無效能下降
- [ ] 在 AWS Cost Explorer 中確認成本降低

### ⚠️ 風險與考量因素
- [風險與緩解措施]

**優先級評分**: X | **價值**: X/10 | **風險**: X/10
```

### 第 7 步：建立 EPIC 協調 Issue
**行動**: 建立主追蹤 Issue。標記為 "cost-optimization"（綠色）、"aws"（橙色）、"epic"（紫色）。

**標題**: `[EPIC] AWS 成本優化計劃 - 潛在每月節省 $X`

**正文**: 執行摘要，包含帳戶/區域詳情、目前資源的 Mermaid 架構圖、連結所有單個 Issue 的優先級檢查清單（高 → 中 → 低）、進度追蹤以及成功標準（實現預估節省的 80% 以上，且無效能下降）。

## 錯誤處理
- **AWS 身分驗證失敗**: 引導執行 `aws configure`
- **未找到資源**: 建立關於 AWS 資源部署的資訊性 Issue
- **權限不足**: 列出所需的 IAM 唯讀權限
- **GitHub 建立失敗**: 將格式化的建議輸出到主控台
- **Cost Explorer 未啟用**: 引導使用者在 AWS 主控台中啟用

## 成功標準
- ✅ 所有成本估算均已根據實際配置和 AWS 定價進行驗證
- ✅ 為每項優化建立了單獨的 GitHub Issue
- ✅ EPIC Issue 提供了全面的協調和追蹤
- ✅ 所有建議均包含具體的 AWS CLI 或 IaC 命令
- ✅ 在建立 Issue 之前徵得了使用者確認
