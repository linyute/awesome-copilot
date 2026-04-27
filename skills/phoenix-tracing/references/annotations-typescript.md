# TypeScript SDK 標記模式 (Annotation Patterns)

使用 TypeScript 用戶端將回饋加入至 spans、追蹤 (traces)、文件和階段 (sessions)。

## 用戶端設定 (Client Setup)

```typescript
import { createClient } from "phoenix-client";
const client = createClient();  // 預設：http://localhost:6006
```

## Span 標記 (Span Annotations)

針對個別 span 加入回饋：

```typescript
import { addSpanAnnotation } from "phoenix-client";

await addSpanAnnotation({
  client,
  spanAnnotation: {
    spanId: "abc123",
    name: "quality",
    annotatorKind: "HUMAN",
    label: "high_quality",
    score: 0.95,
    explanation: "準確且格式良好",
    metadata: { reviewer: "alice" }
  },
  sync: true
});
```

## 文件標記 (Document Annotations)

針對 RETRIEVER span 中的個別文件進行評分：

```typescript
import { addDocumentAnnotation } from "phoenix-client";

await addDocumentAnnotation({
  client,
  documentAnnotation: {
    spanId: "retriever_span",
    documentPosition: 0,  // 從 0 開始的索引
    name: "relevance",
    annotatorKind: "LLM",
    label: "relevant",
    score: 0.95
  }
});
```

## 追蹤標記 (Trace Annotations)

針對整個追蹤的回饋：

```typescript
import { addTraceAnnotation } from "phoenix-client";

await addTraceAnnotation({
  client,
  traceAnnotation: {
    traceId: "trace_abc",
    name: "correctness",
    annotatorKind: "HUMAN",
    label: "correct",
    score: 1.0
  }
});
```

## 階段標記 (Session Annotations)

針對多輪對話的回饋：

```typescript
import { addSessionAnnotation } from "phoenix-client";

await addSessionAnnotation({
  client,
  sessionAnnotation: {
    sessionId: "session_xyz",
    name: "user_satisfaction",
    annotatorKind: "HUMAN",
    label: "satisfied",
    score: 0.85
  }
});
```

## RAG 管線範例 (RAG Pipeline Example)

```typescript
import { createClient, logDocumentAnnotations, addSpanAnnotation, addTraceAnnotation } from "phoenix-client";

const client = createClient();

// 文件相關性 (批次)
await logDocumentAnnotations({
  client,
  documentAnnotations: [
    { spanId: "retriever_span", documentPosition: 0, name: "relevance",
      annotatorKind: "LLM", label: "relevant", score: 0.95 },
    { spanId: "retriever_span", documentPosition: 1, name: "relevance",
      annotatorKind: "LLM", label: "relevant", score: 0.80 }
  ]
});

// LLM 回應品質
await addSpanAnnotation({
  client,
  spanAnnotation: {
    spanId: "llm_span",
    name: "faithfulness",
    annotatorKind: "LLM",
    label: "faithful",
    score: 0.90
  }
});

// 整體追蹤品質
await addTraceAnnotation({
  client,
  traceAnnotation: {
    traceId: "trace_123",
    name: "correctness",
    annotatorKind: "HUMAN",
    label: "correct",
    score: 1.0
  }
});
```

## API 參考

- [TypeScript Client API](https://arize-ai.github.io/phoenix/)
