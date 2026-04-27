# 生產：持續評估 (Continuous Evaluation)

能力評估 (Capability evals) 與回歸評估 (Regression evals) 以及持續進行的回饋迴圈。

## 兩種評估類型

| 類型 | 通過率目標 | 目的 | 更新方式 |
| ---- | ---------------- | ------- | ------ |
| **能力評估 (Capability)** | 50-80% | 測量改進程度 | 新增更難的案例 |
| **回歸評估 (Regression)** | 95-100% | 捕捉損壞情況 | 加入已修復的錯誤 |

## 飽和 (Saturation)

當能力評估的通過率達到 >95% 時，表示它們已飽和：
1. 將通過的案例移至回歸測試套件 (regression suite)
2. 在能力測試套件中新增具挑戰性的案例

## 回饋迴圈 (Feedback Loop)

```
生產 (Production) → 抽樣流量 → 執行評估器 → 發現失敗
    ↑                                              ↓
部署 (Deploy)  ←  執行 CI 評估  ←  建立測試案例  ←  錯誤分析
```

## 實作 (Implementation)

建立一個持續監控迴圈：

1. **定期抽樣最近的追蹤 (traces)**（例如：每小時 100 個追蹤）
2. **在抽樣的追蹤上執行評估器**
3. **將結果紀錄 (Log)** 到 Phoenix 以進行追蹤
4. **將有疑慮的結果加入佇列** 以供人類審查
5. **根據重複發生的失敗模式建立測試案例**

### Python

```python
from phoenix.client import Client
from datetime import datetime, timedelta

client = Client()

# 1. 抽樣最近的 spans（包含用於評估的完整屬性）
spans_df = client.spans.get_spans_dataframe(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    root_spans_only=True,
    limit=100,
)

# 2. 執行評估器
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(
    dataframe=spans_df,
    evaluators=[quality_eval, safety_eval],
)

# 3. 將結果作為 annotations 上傳
from phoenix.evals.utils import to_annotation_dataframe

annotations_df = to_annotation_dataframe(results_df)
client.spans.log_span_annotations_dataframe(dataframe=annotations_df)
```

### TypeScript

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";
import { logSpanAnnotations } from "@arizeai/phoenix-client/spans";

// 1. 抽樣最近的 spans
const { spans } = await getSpans({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  parentId: null, // 僅限頂層 spans
  limit: 100,
});

// 2. 執行評估器（使用者定義）
const results = await Promise.all(
  spans.map(async (span) => ({
    spanId: span.context.span_id,
    ...await runEvaluators(span, [qualityEval, safetyEval]),
  }))
);

// 3. 將結果作為 annotations 上傳
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

對於追蹤層級 (trace-level) 的監控（例如：代理工作流程），使用 `get_traces`/`getTraces` 來識別追蹤：

```python
# Python：識別延遲較高的追蹤
traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    sort="latency_ms",
    order="desc",
    limit=50,
)
```

```typescript
// TypeScript：識別延遲較高的追蹤
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
| 回歸評估 < 98% | 緊急 (Critical) | 呼叫值班人員 (Page oncall) |
| 能力評估下降 | 警告 (Warning) | Slack 通知 |
| 能力評估 > 95% 持續 7 天 | 資訊 (Info) | 排定審查 |

## 關鍵原則

- **兩個套件** - 始終保持能力評估 + 回歸評估
- **案例升級** - 將一致通過的案例移至回歸評估
- **追蹤趨勢** - 隨時間監控，而不僅僅是快照
