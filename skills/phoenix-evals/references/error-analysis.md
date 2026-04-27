# 錯誤分析 (Error Analysis)

在建立評估器之前，先審查追蹤 (traces) 以發現失敗模式。

## 流程 (Process)

1. **抽樣 (Sample)** - 100 個以上的追蹤 (包含錯誤、負面回饋、隨機抽樣)
2. **開放編碼 (Open Code)** - 為每個追蹤編寫自由格式的筆記
3. **軸向編碼 (Axial Code)** - 將筆記歸類為失敗類別
4. **量化 (Quantify)** - 計算每個類別的失敗次數
5. **優先排序 (Prioritize)** - 根據頻率 × 嚴重性進行排名

## 抽樣追蹤 (Sample Traces)

### Span 層級抽樣 (Python — DataFrame)

```python
from phoenix.client import Client

# Client() 用於本機 Phoenix (會退而使用環境變數或 localhost:6006)
# 用於遠端/雲端：Client(base_url="https://app.phoenix.arize.com", api_key="...")
client = Client()
spans_df = client.spans.get_spans_dataframe(project_identifier="my-app")

# 建立具代表性的樣本
sample = pd.concat([
    spans_df[spans_df["status_code"] == "ERROR"].sample(30),
    spans_df[spans_df["feedback"] == "negative"].sample(30),
    spans_df.sample(40),
]).drop_duplicates("span_id").head(100)
```

### Span 層級抽樣 (TypeScript)

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

### 追蹤層級抽樣 (Trace-level sampling) (Python)

當錯誤跨越多個 spans 時（例如代理工作流程），請對整個追蹤進行抽樣：

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
# 每個追蹤包含：trace_id, start_time, end_time, spans
```

### 追蹤層級抽樣 (Trace-level sampling) (TypeScript)

```typescript
import { getTraces } from "@arizeai/phoenix-client/traces";

const { traces } = await getTraces({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  includeSpans: true,
  limit: 100,
});
```

## 新增筆記 (Python)

```python
client.spans.add_span_note(
    span_id="abc123",
    note="時區錯誤 - 說的是東部標準時間 (EST)，但使用者在太平洋標準時間 (PST)"
)
```

## 新增筆記 (TypeScript)

```typescript
import { addSpanNote } from "@arizeai/phoenix-client/spans";

await addSpanNote({
  spanNote: {
    spanId: "abc123",
    note: "時區錯誤 - 說的是東部標準時間 (EST)，但使用者在太平洋標準時間 (PST)"
  }
});
```

## 筆記重點 (What to Note)

| 類型 | 範例 |
| ---- | -------- |
| 事實錯誤 | 錯誤的日期、價格、編造的功能 |
| 資訊缺失 | 未回答問題、遺漏細節 |
| 語氣問題 | 對於內容而言過於隨意/正式 |
| 工具問題 | 錯誤的工具、錯誤的參數 |
| 擷取 (Retrieval) | 錯誤的文件、遺漏相關文件 |

## 優質筆記範例

```
差 (BAD)：  "回答很糟"
好 (GOOD)： "回答說 2 天內出貨，但政策是 5-7 天"
```

## 歸類

```python
categories = {
    "factual_inaccuracy": ["錯誤的出貨時間", "不正確的價格"],
    "hallucination": ["編造了折扣", "虛構的功能"],
    "tone_mismatch": ["對企業客戶語氣過於非正式"],
}
# 優先權 = 頻率 × 嚴重性
```

## 擷取現有的 Annotations

### Python

```python
# 從 spans DataFrame
annotations_df = client.spans.get_span_annotations_dataframe(
    spans_dataframe=sample,
    project_identifier="my-app",
    include_annotation_names=["quality", "correctness"],
)
# annotations_df 包含：span_id (索引), name, label, score, explanation

# 或從特定的 span IDs
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

當新的追蹤不再揭示新的失敗模式時即可停止。最少建議：100 個追蹤。
