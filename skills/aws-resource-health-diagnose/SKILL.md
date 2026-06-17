---
name: aws-resource-health-diagnose
description: '分析 AWS 資源健康狀況，從 CloudWatch 日誌和指標中診斷問題，並為識別出的問題建立修復計劃。'
---

# AWS 資源運作狀態與問題診斷 (AWS Resource Health & Issue Diagnosis)

此工作流分析特定的 AWS 資源以評估其運作狀態，使用 CloudWatch 日誌和指標診斷潛在問題，並為發現的任何問題制定全面的修復計劃。

## 先決條件
- 已配置 AWS CLI 並通過身分驗證
- 已識別目標 AWS 資源（名稱、類型，以及可選的區域/帳戶）
- 在目標資源上啟用了 CloudWatch 日誌記錄和指標

## 工作流程步驟

### 第 1 步：獲取 AWS 診斷最佳實踐
獲取 `https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/` 以獲取監控和疑難排解指導，從而為診斷方法提供參考。

### 第 2 步：資源發現與識別
使用適合其類型的 AWS CLI 命令定位目標資源：

```bash
# EC2
aws ec2 describe-instances --filters "Name=tag:Name,Values=<name>"
# Lambda
aws lambda get-function --function-name <name>
# RDS
aws rds describe-db-instances --db-instance-identifier <name>
# ECS
aws ecs describe-services --cluster <cluster> --services <name>
# ALB
aws elbv2 describe-load-balancers --names <name>
# DynamoDB
aws dynamodb describe-table --table-name <name>
# SQS
aws sqs get-queue-attributes --queue-url <url> --attribute-names All
# API Gateway
aws apigatewayv2 get-apis
```

如果找到多個匹配項，請提示使用者指定區域/帳戶。

### 第 3 步：健康狀態評估
執行特定於服務的運作狀態檢查：

```bash
# EC2
aws ec2 describe-instance-status --instance-ids <id>

# RDS
aws rds describe-db-instances --db-instance-identifier <name> \
  --query 'DBInstances[0].DBInstanceStatus'

# Lambda - 過去 24 小時的錯誤率
aws cloudwatch get-metric-statistics --namespace AWS/Lambda \
  --metric-name Errors --dimensions Name=FunctionName,Value=<name> \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 3600 --statistics Sum

# ECS
aws ecs describe-services --cluster <cluster> --services <name> \
  --query 'services[0].[status,runningCount,desiredCount,pendingCount]'
```

按服務類型劃分的關鍵運作狀態指標：
- **Lambda**: 錯誤率、節流率、Duration P99、並發執行數
- **RDS**: CPU 使用率、FreeStorageSpace、DatabaseConnections、讀取延遲/寫入延遲
- **ECS**: 運行中與預期的任務計數、任務停止原因
- **ALB**: TargetResponseTime, HTTPCode_ELB_5XX_Count, UnHealthyHostCount
- **SQS**: ApproximateNumberOfMessagesNotVisible, ApproximateAgeOfOldestMessage
- **DynamoDB**: ConsumedReadCapacityUnits, ThrottledRequests, SuccessfulRequestLatency

### 第 4 步：日誌與指標分析
查找日誌群組並執行 CloudWatch Logs Insights 查詢：

```bash
# 查找日誌群組
aws logs describe-log-groups --log-group-name-prefix /aws/<service>/<name>

# 開始查詢（過去 24 小時的錯誤）
aws logs start-query \
  --log-group-name /aws/lambda/<name> \
  --start-time $(date -u -d '24 hours ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'filter @message like /ERROR/ | stats count(*) as errorCount by bin(1h)'

# 獲取結果
aws logs get-query-results --query-id <id>

# Lambda 冷啟動 (Cold starts)
aws logs start-query \
  --log-group-name /aws/lambda/<name> \
  --start-time $(date -u -d '24 hours ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'filter @type = "REPORT" | filter @initDuration > 0 | stats count() as coldStarts by bin(1h)'

# RDS 效能詳情 (RDS Performance Insights，如果已啟用)
aws pi get-resource-metrics \
  --service-type RDS --identifier db:<identifier> \
  --metric-queries '[{"Metric":"db.load.avg"}]' \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period-in-seconds 3600
```

識別：反覆出現的錯誤模式、與部署的相關性（CloudTrail）、效能趨勢、依賴項失敗。

### 第 5 步：問題分類與根本原因分析
**嚴重程度**:
- **緊急 (Critical)**: 服務不可用、數據丟失、安全事件
- **高 (High)**: 效能下降、錯誤率 >5%、間歇性故障
- **中 (Medium)**: 警告、欠佳配置、輕微效能問題
- **低 (Low)**: 資訊警報、優化機會

**根本原因類別**:
- 配置問題：設定錯誤、缺少環境變數、IAM 權限遭拒
- 資源限制：CPU/記憶體/磁碟限制、Lambda 節流、RDS 連線耗盡
- 網路問題：安全群組規則、VPC 路由、DNS、NACL
- 應用程式問題：程式碼錯誤、記憶體洩漏、未處理的異常、慢查詢
- 依賴項問題：下游超時、SQS/SNS 失敗、外部 API 限制
- 安全問題：KMS 金鑰問題、證書過期

### 第 6 步：產生修復計劃

**即時行動** (緊急):
```bash
# Lambda 節流 — 增加預留並行性
aws lambda put-reserved-concurrency \
  --function-name <name> --reserved-concurrent-executions 100

# RDS 連線耗盡 — 重啟以重設連線
aws rds reboot-db-instance --db-instance-identifier <name>
```

**短期修復** (高/中): 配置調整、規格調整 (Right-sizing)、CloudWatch 警報改進、IAM 修正。

**長期改進**: 韌性架構變更、預防性監控、透過 EventBridge 啟用 AWS Health Dashboard 通知。

### 第 7 步：報告與使用者確認

呈報發現結果：
```
🏥 AWS 資源運作狀態評估

📊 資源概覽：
• 資源：[名稱] ([類型])
• 狀態：[健康/警告/緊急]
• 區域：[區域] | 帳戶：[帳戶 ID]

🚨 已識別的問題：
• 緊急：X | 高：Y | 中：Z | 低：N

🔍 首要問題：
1. [問題]：[描述] — 影響：[高/中/低]
2. [問題]：[描述] — 影響：[高/中/低]

🛠️ 修復方案：X 項即時、Y 項短期、Z 項長期行動

❓ 是否繼續查看詳細的修復計劃？(y/n)
```

然後產生一份完整的 markdown 報告，涵蓋：健康指標、帶有根本原因分析的問題、帶有 AWS CLI 命令的分階段修復步驟、CloudWatch 警報建議以及驗證檢查清單。

## 錯誤處理
- **未找到資源**: 請使用者澄清名稱/區域
- **身分驗證問題**: 引導進行 `aws configure`
- **權限不足**: 列出所需的 IAM 操作 (`logs:*`, `cloudwatch:*`, `pi:*`)
- **無可用日誌**: 建議為該資源類型啟用 CloudWatch 日誌記錄
- **查詢超時**: 使用較短的時間窗口

## 成功標準
- ✅ 在所有關鍵指標上準確評估了資源運作狀態
- ✅ 已識別所有重大問題並按嚴重程度分類
- ✅ 對重大問題完成了根本原因分析
- ✅ 具備帶有 AWS CLI 命令的可操作修復計劃
- ✅ 包含 CloudWatch 監控建議
- ✅ 實施步驟包括驗證和回滾程序
