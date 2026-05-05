# 生產環境：持續評估 (Production: Continuous Evaluation)

能力評估 (Capability) vs 退化評估 (Regression) 以及持續的回饋循環。

## 兩種評估類型 (Two Types of Evals)

| 類型 | 通過率目標 | 目的 | 更新方式 |
| ---- | ---------------- | ------- | ------ |
| **能力 (Capability)** | 50-80% | 測量改進程度 | 加入更難的案例 |
| **退化 (Regression)** | 95-100% | 捕捉損壞情況 | 加入已修復的錯誤 |

## 飽和 (Saturation)

當能力評估的通過率達到 >95% 時，表示已飽和：
1. 將通過的案例晉升至退化測試套件。
2. 在能力測試套件中加入新的、具挑戰性的案例。

## 回饋循環 (Feedback Loop)

```
生產環境 → 取樣流量 → 執行評估者 → 尋找失敗
    ↑                                  ↓
部署  ←  執行 CI 評估  ←  建立測試案例  ←  錯誤分析
```

## 實作 (Implementation)

建構一個持續監控循環：

1. **定期取樣近期 Trace**（例如：每小時 100 個 Trace）。
2. **針對採樣的 Trace 執行評估者**。
3. **將結果記錄至 Phoenix** 以進行追蹤。
4. **將有問題的結果排入隊列** 供人工審閱。
5. **從重複發生的失敗模式建立測試案例**。

### Python

```python
from phoenix.client import Client
from datetime import datetime, timedelta

client = Client()

# 1. 採樣近期的 Span（包含完整的評估屬性）
spans_df = client.spans.get_spans_dataframe(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    root_spans_only=True,
    limit=100,
)

# 2. 執行評估者
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(
    dataframe=spans_df,
    evaluators=[quality_eval, safety_eval],
)

# 3. 將結果作為標核上傳
from phoenix.evals.utils import to_annotation_dataframe

annotations_df = to_annotation_dataframe(results_df)
client.spans.log_span_annotations_dataframe(dataframe=annotations_df)
```

### TypeScript

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";
import { logSpanAnnotations } from "@arizeai/phoenix-client/spans";

// 1. 採樣近期的 Span
const { spans } = await getSpans({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  parentId: null, // 僅限根 Span
  limit: 100,
});

// 2. 執行評估者（由使用者定義）
const results = await Promise.all(
  spans.map(async (span) => ({
    spanId: span.context.span_id,
    ...await runEvaluators(span, [qualityEval, safetyEval]),
  }))
);

// 3. 將結果作為標核上傳
await logSpanAnnotations({
  spanAnnotations: results.map((r) => ({
    spanId: r.spanId,
    name: "quality",
    score: r.qualityScore,
    label: r.qualityLabel,
    annotatorKind: "LLM" as const,
  })),
});
```

對於 Trace 層級的監控（例如：代理程式工作流程），請使用 `get_traces`/`getTraces` 來識別 Trace：

```python
# Python: 識別慢速 Trace
traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    sort="latency_ms",
    order="desc",
    limit=50,
)
```

```typescript
// TypeScript: 識別慢速 Trace
import { getTraces } from "@arizeai/phoenix-client/traces";

const { traces } = await getTraces({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  limit: 50,
});
```

## 告警 (Alerting)

| 條件 | 嚴重性 | 行動 |
| --------- | -------- | ------ |
| 退化率 < 98% | 緊急 (Critical) | 傳呼值班人員 |
| 能力下降 | 警告 (Warning) | Slack 通知 |
| 能力 > 95% 持續 7 天 | 資訊 (Info) | 安排審閱 |

## 關鍵原則 (Key Principles)

- **兩套測試套件** - 始終維持 能力 + 退化 兩套評估。
- **晉升案例** - 將持續通過的案例移至退化測試。
- **追蹤趨勢** - 監控一段時間內的變化，而非僅看快照。
