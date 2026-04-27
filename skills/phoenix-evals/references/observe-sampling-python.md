# 觀察：抽樣策略 (Sampling Strategies)

如何有效率地抽樣生產追蹤 (production traces) 以進行審查。

## 策略 (Strategies)

### 1. 聚焦於失敗 (Failure-Focused) (最高優先權)

```python
errors = spans_df[spans_df["status_code"] == "ERROR"]
negative_feedback = spans_df[spans_df["feedback"] == "negative"]
```

### 2. 離群值 (Outliers)

```python
long_responses = spans_df.nlargest(50, "response_length")
slow_responses = spans_df.nlargest(50, "latency_ms")
```

### 3. 分層抽樣 (Stratified) (涵蓋範圍)

```python
# 從每個類別中平均抽樣
by_query_type = spans_df.groupby("metadata.query_type").apply(
    lambda x: x.sample(min(len(x), 20))
)
```

### 4. 由指標引導 (Metric-Guided)

```python
# 審查由自動評估器標記為有問題的追蹤
flagged = spans_df[eval_results["label"] == "hallucinated"]
borderline = spans_df[(eval_results["score"] > 0.3) & (eval_results["score"] < 0.7)]
```

## 建立審查佇列 (Building a Review Queue)

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

| 目的 | 大小 |
| ------- | ---- |
| 初始探索 | 50-100 |
| 錯誤分析 | 100+ (直到飽和) |
| 黃金資料集 (Golden dataset) | 100-500 |
| 裁判校準 | 每個類別 100+ |

**飽和 (Saturation)**：當新的追蹤顯示相同的失敗模式時即可停止。

## 追蹤層級抽樣 (Trace-Level Sampling)

當您需要完整的請求（每個追蹤的所有 spans）時，請使用 `get_traces`：

```python
from phoenix.client import Client
from datetime import datetime, timedelta

client = Client()

# 包含完整 span 樹的最近追蹤
traces = client.traces.get_traces(
    project_identifier="my-app",
    limit=100,
    include_spans=True,
)

# 時間視窗抽樣（例如，過去一小時）
traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=1),
    limit=50,
    include_spans=True,
)

# 依階段 (session) 過濾（多輪對話）
traces = client.traces.get_traces(
    project_identifier="my-app",
    session_id="user-session-abc",
    include_spans=True,
)

# 依延遲 (latency) 排序以尋找最慢的請求
traces = client.traces.get_traces(
    project_identifier="my-app",
    sort="latency_ms",
    order="desc",
    limit=50,
)
```
