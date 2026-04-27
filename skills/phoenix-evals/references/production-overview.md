# 生產：總覽 (Overview)

CI/CD 評估 vs 生產監控 - 互補的方法。

## 兩種評估模式 (Two Evaluation Modes)

| 面向 | CI/CD 評估 (CI/CD Evals) | 生產監控 (Production Monitoring) |
| ------ | ----------- | -------------------- |
| **時機 (When)** | 部署前 | 部署後，持續進行 |
| **資料 (Data)** | 固定資料集 | 抽樣流量 |
| **目標 (Goal)** | 防止回歸 (Prevent regression) | 偵測偏移 (Detect drift) |
| **回應 (Response)** | 封鎖部署 | 告警與分析 |

## CI/CD 評估

```python
# 快速、決定性的檢查
ci_evaluators = [
    has_required_format,
    no_pii_leak,
    safety_check,
    regression_test_suite,
]

# 雖然規模小但具代表性的資料集 (~100 個範例)
run_experiment(ci_dataset, task, ci_evaluators)
```

設定門檻值 (thresholds)：回歸 (regression)=0.95，安全 (safety)=1.0，格式 (format)=0.98。

## 生產監控

### Python

```python
from phoenix.client import Client
from datetime import datetime, timedelta

client = Client()

# 抽樣最近的追蹤 (traces)（過去一小時）
traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    include_spans=True,
    limit=100,
)

# 在抽樣流量上執行評估器
for trace in traces:
    results = run_evaluators_async(trace, production_evaluators)
    if any(r["score"] < 0.5 for r in results):
        alert_on_failure(trace, results)
```

### TypeScript

```typescript
import { getTraces } from "@arizeai/phoenix-client/traces";
import { getSpans } from "@arizeai/phoenix-client/spans";

// 抽樣最近的追蹤（過去一小時）
const { traces } = await getTraces({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  includeSpans: true,
  limit: 100,
});

// 或者直接抽樣 spans 以進行評估
const { spans } = await getSpans({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  limit: 100,
});

// 在抽樣流量上執行評估器
for (const span of spans) {
  const results = await runEvaluators(span, productionEvaluators);
  if (results.some((r) => r.score < 0.5)) {
    await alertOnFailure(span, results);
  }
}
```

優先權排序：錯誤 → 負面回饋 → 隨機抽樣。

## 回饋迴圈 (Feedback Loop)

```
生產端發現失敗 → 錯誤分析 → 新增至 CI 資料集 → 防止未來發生回歸
```
