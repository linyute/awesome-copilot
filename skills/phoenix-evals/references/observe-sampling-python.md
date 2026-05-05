# 觀察：採樣策略 (Observe: Sampling Strategies)

如何有效地對生產環境追蹤進行採樣以供審核。

## 策略 (Strategies)

### 1. 失敗導向（最高優先順序） (Failure-Focused (Highest Priority))

```python
errors = spans_df[spans_df["status_code"] == "ERROR"]
negative_feedback = spans_df[spans_df["feedback"] == "negative"]
```

### 2. 離群值 (Outliers)

```python
long_responses = spans_df.nlargest(50, "response_length")
slow_responses = spans_df.nlargest(50, "latency_ms")
```

### 3. 分層採樣（覆蓋率） (Stratified (Coverage))

```python
# 從每個類別中平均採樣
by_query_type = spans_df.groupby("metadata.query_type").apply(
    lambda x: x.sample(min(len(x), 20))
)
```

### 4. 指標引導 (Metric-Guided)

```python
# 審核被自動化評估者標記的追蹤
flagged = spans_df[eval_results["label"] == "hallucinated"]
borderline = spans_df[(eval_results["score"] > 0.3) & (eval_results["score"] < 0.7)]
```

## 建立審核佇列 (Building a Review Queue)

```python
def build_review_queue(spans_df, max_traces=100):
    queue = pd.concat([
        spans_df[spans_df["status_code"] == "ERROR"],
        spans_df[spans_df["feedback"] == "negative"],
        spans_df.nlargest(10, "response_length"),
        spans_df.sample(min(30, len(spans_df))),
    ]).drop_duplicates("span_id").head(max_traces)
    return queue
```

## 樣本大小指南 (Sample Size Guidelines)

| 用途 | 大小 |
| ------- | ---- |
| 初步探索 | 50-100 |
| 錯誤分析 | 100+ (直到飽和為止) |
| 黃金資料集 (Golden dataset) | 100-500 |
| 評審校準 | 每個類別 100+ |

**飽和 (Saturation)：** 當新的追蹤不再顯示新的失敗模式時停止。

## Trace 層級採樣 (Trace-Level Sampling)

當您需要完整的請求（每個 Trace 的所有 Span）時，使用 `get_traces`：

```python
from phoenix.client import Client
from datetime import datetime, timedelta

client = Client()

# 帶有完整 Span 樹的近期 Trace
traces = client.traces.get_traces(
    project_identifier="my-app",
    limit=100,
    include_spans=True,
)

# 時間視窗採樣（例如：過去一小時）
traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    limit=50,
    include_spans=True,
)

# 依工作階段篩選（多輪對話）
traces = client.traces.get_traces(
    project_identifier="my-app",
    session_id="user-session-abc",
    include_spans=True,
)

# 依延遲排序以尋找最慢的請求
traces = client.traces.get_traces(
    project_identifier="my-app",
    sort="latency_ms",
    order="desc",
    limit=50,
)
```
