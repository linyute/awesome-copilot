# Python SDK 標核模式 (Python SDK Annotation Patterns)

使用 Python 用戶端為 Span, Trace, 文件與工作階段新增回饋。

## 用戶端設定 (Client Setup)

```python
from phoenix.client import Client
client = Client()  # 預設值：http://localhost:6006
```

## Span 標核 (Span Annotations)

為個別的 Span 新增回饋：

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

## 文件標核 (Document Annotations)

為 RETRIEVER Span 中的個別文件評分：

```python
client.spans.add_document_annotation(
    span_id="retriever_span",
    document_position=0,  # 0 基索引
    annotation_name="relevance",
    annotator_kind="LLM",
    label="relevant",
    score=0.95
)
```

## Trace 標核 (Trace Annotations)

對整個 Trace 的回饋：

```python
client.traces.add_trace_annotation(
    trace_id="trace_abc",
    annotation_name="correctness",
    annotator_kind="HUMAN",
    label="correct",
    score=1.0
)
```

## Span 筆記 (Span Notes)

筆記是針對自由格式文字的一種特殊標核類型 — 適用於開放式編碼 (open coding)，審核者可以在任何準則存在前，在 Span 上留下定性觀察。稍後，這些筆記可以被彙總並提煉為結構化標籤或分數。

筆記是 **僅限附加 (append-only)** 的：每次呼叫都會自動產生一個 UUIDv4 識別碼，因此多個筆記會自然地在同一個 Span 上累積。結構化標核是由 `(name, span_id, identifier)` 識別的 — 您可以透過提供不同的識別碼（例如每位審核者一個）在同一個 Span 上設定多個同名的標核；寫入相同的 `(name, span_id, identifier)` 則會覆寫現有條目。

```python
client.spans.add_span_note(
    span_id="abc123def456",
    note="回應中出現非預期的權杖，需要審核",
)
```

## 工作階段標核 (Session Annotations)

對多輪對話的回饋：

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

# 文件相關性（批次）
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

# 整體 Trace 品質
client.traces.add_trace_annotation(
    trace_id="trace_123",
    annotation_name="correctness",
    annotator_kind="HUMAN",
    label="correct",
    score=1.0
)
```

## API 參考 (API Reference)

- [Python Client API](https://arize-phoenix.readthedocs.io/projects/client/en/latest/)
