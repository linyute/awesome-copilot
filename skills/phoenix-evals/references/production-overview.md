# 生產環境：概觀 (Production: Overview)

CI/CD 評估 vs 生產環境監控 — 互補的方法。

## 兩種評估模式 (Two Evaluation Modes)

| 面向 | CI/CD 評估 | 生產環境監控 |
| ------ | ----------- | -------------------- |
| **時間點** | 部署前 | 部署後，持續進行 |
| **資料** | 固定資料集 | 採樣的流量 |
| **目標** | 防止退化 (Regression) | 偵測偏移 (Drift) |
| **回應** | 阻擋部署 | 發出告警並分析 |

## CI/CD 評估 (CI/CD Evaluations)

```python
from phoenix.client import Client

client = Client()

# 快速、確定性的檢查
ci_evaluators = [
    has_required_format,
    no_pii_leak,
    safety_check,
    regression_test_suite,
]

# 規模小但具備代表性的資料集（約 100 個範例）
client.experiments.run_experiment(dataset=ci_dataset, task=task, evaluators=ci_evaluators)
```

設定門檻值：退化=0.95, 安全性=1.0, 格式=0.98。

## 生產環境監控 (Production Monitoring)

### Python

```python
from phoenix.client import Client
from datetime import datetime, timedelta

client = Client()

# 採樣近期的 Trace（過去一小時）
traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    include_spans=True,
    limit=100,
)

# 針對採樣流量執行評估者
for trace in traces:
    results = run_evaluators_async(trace, production_evaluators)
    if any(r["score"] < 0.5 for r in results):
        alert_on_failure(trace, results)
```

### TypeScript

```typescript
import { getTraces } from "@arizeai/phoenix-client/traces";
import { getSpans } from "@arizeai/phoenix-client/spans";

// 採樣近期的 Trace（過去一小時）
const { traces } = await getTraces({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  includeSpans: true,
  limit: 100,
});

// 或直接採樣 Span 進行評估
const { spans } = await getSpans({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  limit: 100,
});

// 針對採樣流量執行評估者
for (const span of spans) {
  const results = await runEvaluators(span, productionEvaluators);
  if (results.some((r) => r.score < 0.5)) {
    await alertOnFailure(span, results);
  }
}
```

優先順序：錯誤 → 負面回饋 → 隨機取樣。

## 回饋循環 (Feedback Loop)

```
生產環境發現失敗 → 錯誤分析 → 新增至 CI 資料集 → 防止未來的退化
```
