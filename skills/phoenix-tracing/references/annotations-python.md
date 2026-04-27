# Python SDK 標記模式 (Annotation Patterns)

使用 Python 用戶端將回饋加入至 spans、追蹤 (traces)、文件和階段 (sessions)。

## 用戶端設定 (Client Setup)

```python
from phoenix.client import Client
client = Client()  # 預設：http://localhost:6006
```

## Span 標記 (Span Annotations)

針對個別 span 加入回饋：

```python
client.spans.add_span_annotation(
    span_id="abc123",
    annotation_name="quality",
    annotator_kind="HUMAN",
    label="high_quality",
    score=0.95,
    explanation="準確且格式良好",
    metadata={"reviewer": "alice"},
    sync=True
)
```

## 文件標記 (Document Annotations)

針對 RETRIEVER span 中的個別文件進行評分：

```python
client.spans.add_document_annotation(
    span_id="retriever_span",
    document_position=0,  # 從 0 開始的索引
    annotation_name="relevance",
    annotator_kind="LLM",
    label="relevant",
    score=0.95
)
```

## 追蹤標記 (Trace Annotations)

針對整個追蹤的回饋：

```python
client.traces.add_trace_annotation(
    trace_id="trace_abc",
    annotation_name="correctness",
    annotator_kind="HUMAN",
    label="correct",
    score=1.0
)
```

## 階段標記 (Session Annotations)

針對多輪對話的回饋：

```python
client.sessions.add_session_annotation(
    session_id="session_xyz",
    annotation_name="user_satisfaction",
    annotator_kind="HUMAN",
    label="satisfied",
    score=0.85
)
```

## RAG 管線範例 (RAG Pipeline Example)

```python
from phoenix.client import Client
from phoenix.client.resources.spans import SpanDocumentAnnotationData

client = Client()

# 文件相關性 (批次)
client.spans.log_document_annotations(
    document_annotations=[
        SpanDocumentAnnotationData(
            name="relevance", span_id="retriever_span", document_position=i,
            annotator_kind="LLM", result={"label": label, "score": score}
        )
        for i, (label, score) in enumerate([
            ("relevant", 0.95), ("relevant", 0.80), ("irrelevant", 0.10)
        ])
    ]
)

# LLM 回應品質
client.spans.add_span_annotation(
    span_id="llm_span",
    annotation_name="faithfulness",
    annotator_kind="LLM",
    label="faithful",
    score=0.90
)

# 整體追蹤品質
client.traces.add_trace_annotation(
    trace_id="trace_123",
    annotation_name="correctness",
    annotator_kind="HUMAN",
    label="correct",
    score=1.0
)
```

## API 參考

- [Python Client API](https://arize-phoenix.readthedocs.io/projects/client/en/latest/)
