# 觀察：追蹤設定 (Tracing Setup)

設定追蹤以擷取用於評估的資料。

## 快速設定 (Quick Setup)

```python
# Python
from phoenix.otel import register

register(project_name="my-app", auto_instrument=True)
```

```typescript
// TypeScript
import { registerPhoenix } from "@arizeai/phoenix-otel";

registerPhoenix({ projectName: "my-app", autoInstrument: true });
```

## 必要屬性 (Essential Attributes)

| 屬性 | 重要性 |
| --------- | -------------- |
| `input.value` | 使用者的請求 |
| `output.value` | 待評估的回答 |
| `retrieval.documents` | 用於忠實度 (faithfulness) 的內容 (context) |
| `tool.name`, `tool.parameters` | 代理 (agent) 評估 |
| `llm.model_name` | 依模型進行追蹤 |

## 用於評估的自訂屬性 (Custom Attributes for Evals)

```python
span.set_attribute("metadata.client_type", "enterprise")
span.set_attribute("metadata.query_category", "billing")
```

## 匯出以進行評估 (Exporting for Evaluation)

### Spans (Python — DataFrame)

```python
from phoenix.client import Client

# Client() 用於本機 Phoenix (會退而使用環境變數或 localhost:6006)
# 用於遠端/雲端：Client(base_url="https://app.phoenix.arize.com", api_key="...")
client = Client()
spans_df = client.spans.get_spans_dataframe(
    project_identifier="my-app",  # 非 project_name= (已棄用)
    root_spans_only=True,
)

dataset = client.datasets.create_dataset(
    name="error-analysis-set",
    dataframe=spans_df[["input.value", "output.value"]],
    input_keys=["input.value"],
    output_keys=["output.value"],
)
```

### Spans (TypeScript)

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";

const { spans } = await getSpans({
  project: { projectName: "my-app" },
  parentId: null, // 僅限頂層 spans
  limit: 100,
});
```

### 追蹤 (Traces) (Python — 結構化)

當您需要完整的追蹤樹（例如：多輪對話、代理工作流程）時，請使用 `get_traces`：

```python
from datetime import datetime, timedelta

traces = client.traces.get_traces(
    project_identifier="my-app",
    start_time=datetime.now() - timedelta(hours=24),
    include_spans=True,  # 包含每個追蹤的所有 spans
    limit=100,
)
# 每個追蹤包含：trace_id, start_time, end_time, spans (當 include_spans=True 時)
```

### 追蹤 (Traces) (TypeScript)

```typescript
import { getTraces } from "@arizeai/phoenix-client/traces";

const { traces } = await getTraces({
  project: { projectName: "my-app" },
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  includeSpans: true,
  limit: 100,
});
```

## 將評估結果上傳為 Annotations

### Python

```python
from phoenix.evals import evaluate_dataframe
from phoenix.evals.utils import to_annotation_dataframe

# 執行評估
results_df = evaluate_dataframe(dataframe=spans_df, evaluators=[my_eval])

# 將結果格式化為 Phoenix annotations
annotations_df = to_annotation_dataframe(results_df)

# 上傳至 Phoenix
client.spans.log_span_annotations_dataframe(dataframe=annotations_df)
```

### TypeScript

```typescript
import { logSpanAnnotations } from "@arizeai/phoenix-client/spans";

await logSpanAnnotations({
  spanAnnotations: [
    {
      spanId: "abc123",
      name: "quality",
      label: "good",
      score: 0.95,
      annotatorKind: "LLM",
    },
  ],
});
```

標記 (Annotations) 將會顯示在 Phoenix UI 中，與您的追蹤並列。

## 驗證 (Verify)

必要的屬性：`input.value`, `output.value`, `status_code`
對於 RAG：`retrieval.documents`
對於代理：`tool.name`, `tool.parameters`
