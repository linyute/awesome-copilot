---
name: AWS CloudWatch Investigation
description: '適用於 AWS CloudWatch 的可重複使用調查模式：Logs Insights 查詢範本、警示與部署關聯、縮小影響範圍決策樹，以及用於結構化事件分流的 PromQL 樣式指標查詢模式。'
---

# AWS CloudWatch 調查技能

使用 CloudWatch Logs、Metrics 和 Alarms 調查生產環境事件的可重複使用模式。這些模式旨在事件分流期間進行組合。

---

## 模式 1：Logs Insights 查詢範本

### 錯誤尖峰偵測

尋找時間範圍內的前幾大錯誤，依錯誤類型分組：

```
fields @timestamp, @message, @logStream
| filter @message like /(?i)(error|exception|fatal|critical)/
| stats count(*) as errorCount by bin(5m), @logStream
| sort errorCount desc
| limit 20
```

### 依作業分析 P99 延遲

識別哪些作業導致了延遲尖峰：

```
fields @timestamp, @duration, operation
| filter ispresent(@duration)
| stats avg(@duration) as avgMs,
        pct(@duration, 50) as p50Ms,
        pct(@duration, 95) as p95Ms,
        pct(@duration, 99) as p99Ms,
        count(*) as invocations
  by operation
| sort p99Ms desc
| limit 15
```

### Lambda 冷啟動偵測

量化事件期間冷啟動的影響：

```
fields @timestamp, @duration, @initDuration, @memorySize, @maxMemoryUsed
| filter ispresent(@initDuration)
| stats count(*) as coldStarts,
        avg(@initDuration) as avgInitMs,
        max(@initDuration) as maxInitMs,
        avg(@duration) as avgDurationMs
  by bin(5m)
| sort @timestamp desc
```

### 記憶體不足 (OOM) 偵測

尋找因記憶體壓力而被終止的 Lambda 函式或容器：

```
fields @timestamp, @message, @logStream, @memorySize, @maxMemoryUsed
| filter @message like /Runtime exited|out of memory|OOMKilled|Cannot allocate memory|MemoryError/
| stats count(*) as oomEvents by @logStream, bin(10m)
| sort oomEvents desc
| limit 10
```

針對 OOM 前的記憶體使用率趨勢：

```
fields @timestamp, @maxMemoryUsed, @memorySize
| filter ispresent(@maxMemoryUsed)
| stats max(@maxMemoryUsed / @memorySize * 100) as peakMemPct,
        avg(@maxMemoryUsed / @memorySize * 100) as avgMemPct
  by bin(5m)
| sort @timestamp desc
```

### 逾時偵測

尋找達到設定逾時的呼叫：

```
fields @timestamp, @duration, @logStream, @requestId
| filter @message like /Task timed out/ or @duration > 28000
| stats count(*) as timeouts by @logStream, bin(5m)
| sort timeouts desc
```

---

## 模式 2：警示歷程記錄與部署事件關聯

### 流程

1. **取得警示轉換時間** — 記下警示進入 ALARM 狀態 the確切時間戳記。
2. **查詢 CloudTrail** 以尋找 [警示時間 - 30 分鐘, 警示時間] 期間內與部署相關的事件：

```
# 用於部署事件的 CloudTrail Lake 查詢
SELECT eventTime, eventName, userIdentity.arn, requestParameters
FROM <event-data-store-id>
WHERE eventTime > '<alarm_time_minus_30m>'
  AND eventTime < '<alarm_time>'
  AND eventName IN (
    'UpdateFunctionCode', 'UpdateFunctionConfiguration',
    'UpdateService', 'CreateDeployment', 'RegisterTaskDefinition',
    'CreateChangeSet', 'ExecuteChangeSet',
    'StartPipelineExecution', 'PutImage'
  )
ORDER BY eventTime DESC
```

3. **關聯準則** — 如果符合以下條件，則部署為「已關聯」：
   - 它的目標與警示相同的服務/資源
   - 它在警示轉換前 15 分鐘內完成
   - 部署者身分符合 CI/CD 角色（而非人員進行熱修復）

4. **加強關聯性：**
   - 檢查同一個警示在先前的部署週期中是否正常
   - 驗證在相同時間範圍內沒有其他環境變更（調整大小事件、設定變更）
   - 尋找同時開始的 canary/合成監控失敗

### 輸出格式

```
部署關聯：
  事件：UpdateFunctionCode
  時間：2024-03-15T14:23:07Z（警示前 12 分鐘）
  執行者：arn:aws:sts::123456789012:assumed-role/github-actions-deploy/session
  資源：arn:aws:lambda:us-east-1:123456789012:function:payment-processor
  關聯性：強 — 相同的資源、CI/CD 執行者，且前一個週期的警示狀態為正常
```

---

## 模式 3：縮小影響範圍決策樹

使用此決策樹系統性地將事件範圍從最廣泛縮小到最精確：

```
開始
  |
  v
[1] 帳戶 — 哪些帳戶顯示警示？
  |  - 檢查：警示是否在多個帳戶中觸發？
  |  - 如果是 → 懷疑是共享服務（SSO、網路、共享部署管道）
  |  - 如果否 → 移至區域
  v
[2] 區域 — 哪些區域受到影響？
  |  - 檢查：其他區域是否有相同的警示？
  |  - 如果是多區域 → 懷疑是全域服務（IAM、Route53、S3 全域）
  |  - 如果是單一區域 → 移至服務
  v
[3] 服務 — 哪一個服務命名空間顯示降級？
  |  - 檢查 CloudWatch 命名空間：AWS/Lambda、AWS/ECS、AWS/ApiGateway 等。
  |  - 如果是多個服務 → 懷疑是共享相依性（VPC、NAT、DNS、IAM）
  |  - 如果是單一服務 → 移至作業
  v
[4] 作業 — 哪一個 API 動作或函式失敗？
  |  - 針對 Lambda：哪一個函式名稱？
  |  - 針對 ECS：哪一個服務/任務定義？
  |  - 針對 API GW：哪一個階段/資源/方法？
  |  - 如果是所有作業 → 懷疑是服務層級問題（節流、配額）
  |  - 如果是特定作業 → 移至資源
  v
[5] 資源 — 哪一個特定的資源執行個體？
     - 函式 ARN、任務 ID、資料庫執行個體識別碼
     - 這是您的調查目標
     - 進行針對此資源範圍的日誌與追蹤分析
```

### 共享相依性調查

當影響範圍跨越多個服務時，請依以下順序調查：

1. **VPC/網路** — NAT 閘道器 ErrorPortAllocation、封包遺失、DNS 解析失敗
2. **IAM/STS** — AssumeRole 的 ThrottlingException、權杖發放延遲
3. **下游相依性** — 共享資料庫、快取或外部 API
4. **部署管道** — 來自同一個管道執行的跨服務同時部署
5. **AWS 服務事件** — 檢查該區域 of AWS Health Dashboard 和 Service Health

---

## 模式 4：PromQL 樣式指標查詢模式

這些模式使用 CloudWatch 指標數學運算和 GetMetricData 來建置複合訊號。將它們表示為儀表板或程式編寫擷取的指標查詢。

### 錯誤率百分比

```
MetricDataQueries:
  - Id: errors
    MetricStat:
      Metric:
        Namespace: AWS/Lambda
        MetricName: Errors
        Dimensions: [{Name: FunctionName, Value: TARGET}]
      Period: 60
      Stat: Sum
  - Id: invocations
    MetricStat:
      Metric:
        Namespace: AWS/Lambda
        MetricName: Invocations
        Dimensions: [{Name: FunctionName, Value: TARGET}]
      Period: 60
      Stat: Sum
  - Id: error_rate
    Expression: "errors / invocations * 100"
    Label: "Error Rate %"
```

### 延遲異常偵測（與基準比較）

```
MetricDataQueries:
  - Id: current_p99
    MetricStat:
      Metric:
        Namespace: AWS/Lambda
        MetricName: Duration
        Dimensions: [{Name: FunctionName, Value: TARGET}]
      Period: 300
      Stat: p99
  - Id: baseline_p99
    MetricStat:
      Metric:
        Namespace: AWS/Lambda
        MetricName: Duration
        Dimensions: [{Name: FunctionName, Value: TARGET}]
      Period: 300
      Stat: p99
    # 使用設定為上週相同時間範圍的 StartTime/EndTime
  - Id: anomaly_ratio
    Expression: "current_p99 / baseline_p99"
    Label: "Latency vs Baseline (ratio > 2 = anomaly)"
```

### 節流壓力分數

將多個節流訊號合併為單一壓力指標：

```
MetricDataQueries:
  - Id: lambda_throttles
    MetricStat:
      Metric: {Namespace: AWS/Lambda, MetricName: Throttles}
      Period: 60
      Stat: Sum
  - Id: api_gw_429s
    MetricStat:
      Metric: {Namespace: AWS/ApiGateway, MetricName: 4XXError, Dimensions: [{Name: ApiName, Value: TARGET}]}
      Period: 60
      Stat: Sum
  - Id: dynamo_throttles
    MetricStat:
      Metric: {Namespace: AWS/DynamoDB, MetricName: ThrottledRequests, Dimensions: [{Name: TableName, Value: TARGET}]}
      Period: 60
      Stat: Sum
  - Id: throttle_pressure
    Expression: "lambda_throttles + api_gw_429s + dynamo_throttles"
    Label: "Combined Throttle Pressure"
```

### 並行執行容許空間

```
MetricDataQueries:
  - Id: concurrent
    MetricStat:
      Metric: {Namespace: AWS/Lambda, MetricName: ConcurrentExecutions}
      Period: 60
      Stat: Maximum
  - Id: headroom
    Expression: "1000 - concurrent"
    Label: "Remaining Concurrency (account limit 1000)"
```

---

## 模式 5：事件時間軸重建

### 流程

透過合併來自多個來源的資料來重建精確的時間軸：

1. **收集時間戳記：**

| 來源 | 查詢 | 產出 |
|--------|-------|--------|
| CloudWatch 警示 | 警示歷程記錄 API | 狀態轉換時間 |
| CloudWatch 指標 | 具有 1 分鐘週期的 GetMetricData | 第一個異常點 |
| CloudWatch 日誌 | 搭配 `earliest(@timestamp)` 的 Logs Insights | 第一次錯誤發生 |
| CloudTrail | 依時間篩選的 LookupEvents | 部署/變更事件 |
| AWS Health | DescribeEvents | AWS 端的事件 |

2. **建置時間軸：**

```
fields @timestamp, @message
| filter @message like /ERROR|WARN|timeout|refused|denied/
| stats earliest(@timestamp) as firstSeen, latest(@timestamp) as lastSeen, count(*) as occurrences
  by @message
| sort firstSeen asc
| limit 20
```

3. **識別順序：**

```
時間軸：
  T-15m: CloudTrail — 由 CI/CD 角色執行 UpdateFunctionCode
  T-12m: 日誌 — 第一個錯誤「Connection refused to payments-api.internal」
  T-10m: 指標 — 錯誤計數超過 5/分鐘臨界值
  T-8m:  警示 — PaymentProcessorErrors 進入 ALARM 狀態
  T-5m:  指標 — p99 延遲飆升至 28 秒（逾時）
  T-0:   目前 — 錯誤率為 45%，警示仍在觸發
```

4. **確定根本事件** — 發生在所有症狀之前最早的變更。從第一個症狀向後推導至最近的突變（部署、設定變更、調整大小事件或外部相依性轉移）。

### 注意事項

- CloudWatch 指標時間戳記是週期結束時間。14:05 的 1 分鐘資料點涵蓋 14:04-14:05。
- CloudTrail 事件可能會有長達 15 分鐘的傳送延遲。請使用 `eventTime`，而非內嵌時間。
- 日誌群組時間戳記取決於代理程式/SDK 寫入間隔。請預留 30-60 秒的時鐘偏差。
- 警示狀態變更有內建的評估延遲（週期 x 評估週期）。實際的異常開始得更早。
