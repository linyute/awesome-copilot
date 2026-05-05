# 錯誤分析 (Error Analysis)

在建構評估者之前，先審閱 Trace 以發現失敗模式。

## 流程 (Process)

1. **採樣 (Sample)** - 100 個以上的 Trace（包含錯誤、負面回饋、隨機）。
2. **開放式編碼 (Open Code)** - 為每個 Trace 撰寫自由格式的筆記。
3. **軸心式編碼 (Axial Code)** - 將筆記分組為失敗類別。
4. **量化 (Quantify)** - 計算每個類別的失敗次數。
5. **優先排序 (Prioritize)** - 根據 頻率 × 嚴重程度 進行排名。

## 採樣 Trace (Sample Traces)

### Span 層級採樣 (Python — DataFrame)

```python
from phoenix.client import Client

# Client() 適用於本地端 Phoenix（回退至環境變數或 localhost:6006）
# 對於遠端/雲端：Client(base_url="https://app.phoenix.arize.com", api_key="...")
client = Client()
spans_df = client.spans.get_spans_dataframe(project_identifier="my-app")

# 建立具代表性的樣本
sample = pd.concat([
    spans_df[spans_df["status_code"] == "ERROR"].sample(30),
    spans_df[spans_df["feedback"] == "negative"].sample(30),
    spans_df.sample(40),
]).drop_duplicates("span_id").head(100)
```

### Span 層級採樣 (TypeScript)

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";

const { spans: errors } = await getSpans({
  project: { projectName: "my-app" },
  statusCode: "ERROR",
  limit: 30,
});
const { spans: allSpans } = await getSpans({
  project: { projectName: "my-app" },
  limit: 70,
});
const sample = [...errors, ...allSpans.sort(() => Math.random() - 0.5).slice(0, 40)];
const unique = [...new Map(sample.map((s) => [s.context.span_id, s])).values()].slice(0, 100);
```

### Trace 層級採樣 (Python)

當錯誤跨越多個 Span 時（例如代理程式工作流程），請採樣整個 Trace：

```python
from datetime import datetime, timedelta

traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=24),
    include_spans=True,
    sort="latency_ms",
    order="desc",
    limit=100,
)
# 每個 Trace 包含：trace_id, start_time, end_time, spans
```

### Trace 層級採樣 (TypeScript)

```typescript
import { getTraces } from "@arizeai/phoenix-client/traces";

const { traces } = await getTraces({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  includeSpans: true,
  limit: 100,
});
```

## 新增筆記 (Python) (Add Notes (Python))

```python
client.spans.add_span_note(
    span_id="abc123",
    note="時區錯誤 - 說是美東時間下午 3 點，但使用者在美西時間"
)
```

## 新增筆記 (TypeScript) (Add Notes (TypeScript))

```typescript
import { addSpanNote } from "@arizeai/phoenix-client/spans";

await addSpanNote({
  spanNote: {
    spanId: "abc123",
    note: "時區錯誤 - 說是美東時間下午 3 點，但使用者在美西時間"
  }
});
```

## 筆記內容建議 (What to Note)

| 類型 | 範例 |
| ---- | -------- |
| 事實錯誤 | 錯誤的日期、價格、捏造的功能 |
| 遺漏資訊 | 未回答問題、省略細節 |
| 語氣問題 | 對於情境而言太隨意/太正式 |
| 工具問題 | 工具錯誤、參數錯誤 |
| 檢索問題 | 文件錯誤、遺漏相關文件 |

## 優質筆記範例 (Good Notes)

```
差：  「回應不佳」
優： 「回應說 2 天內發貨，但政策是 5-7 天」
```

## 分組至類別 (Group into Categories)

```python
categories = {
    "factual_inaccuracy": ["錯誤的運送時間", "錯誤的價格"],
    "hallucination": ["捏造了折扣", "發明了功能"],
    "tone_mismatch": ["對企業客戶語氣過於隨意"],
}
# 優先順序 = 頻率 × 嚴重程度
```

## 擷取現有的標核 (Retrieve Existing Annotations)

### Python

```python
# 從 spans DataFrame 中擷取
annotations_df = client.spans.get_span_annotations_dataframe(
    spans_dataframe=sample,
    project_identifier="my-app",
    include_annotation_names=["quality", "correctness"],
)
# annotations_df 包含：span_id (索引), name, label, score, explanation

# 或從特定的 Span ID 擷取
annotations_df = client.spans.get_span_annotations_dataframe(
    span_ids=["span-id-1", "span-id-2"],
    project_identifier="my-app",
)
```

### TypeScript

```typescript
import { getSpanAnnotations } from "@arizeai/phoenix-client/spans";

const { annotations } = await getSpanAnnotations({
  project: { projectName: "my-app" },
  spanIds: ["span-id-1", "span-id-2"],
  includeAnnotationNames: ["quality", "correctness"],
});

for (const ann of annotations) {
  console.log(`${ann.span_id}: ${ann.name} = ${ann.result?.label} (${ann.result?.score})`);
}
```

## 飽和度 (Saturation)

當新的 Trace 不再揭示新的失敗模式時停止。最少建議 100 個 Trace。
