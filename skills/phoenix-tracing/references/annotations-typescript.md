# TypeScript SDK 標核模式 (TypeScript SDK Annotation Patterns)

使用 TypeScript 用戶端為 Span, Trace, 文件與工作階段新增回饋。

## 用戶端設定 (Client Setup)

```typescript
import { createClient } from "@arizeai/phoenix-client";
const client = createClient();  // 預設值：http://localhost:6006
```

## Span 標核 (Span Annotations)

為個別的 Span 新增回饋：

```typescript
import { addSpanAnnotation } from "@arizeai/phoenix-client/spans";

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

## Span 筆記 (Span Notes)

筆記是針對自由格式文字的一種特殊標核類型 — 適用於開放式編碼 (open coding)，審核者可以在任何準則存在前，在 Span 上留下定性觀察。稍後，這些筆記可以被彙總並提煉為結構化標籤或分數。

筆記是 **僅限附加 (append-only)** 的：每次呼叫都會自動產生一個 UUIDv4 識別碼，因此多個筆記會自然地在同一個 Span 上累積。結構化標核是由 `(name, spanId, identifier)` 識別的 — 您可以透過提供不同的識別碼（例如每位審核者一個）在同一個 Span 上設定多個同名的標核；寫入相同的 `(name, spanId, identifier)` 則會覆寫現有條目。

```typescript
import { addSpanNote } from "@arizeai/phoenix-client/spans";

await addSpanNote({
  client,
  spanNote: {
    spanId: "abc123",
    note: "此 Span 顯示非預期行為，需要審核"
  }
});
```

## 文件標核 (Document Annotations)

為 RETRIEVER Span 中的個別文件評分：

```typescript
import { addDocumentAnnotation } from "@arizeai/phoenix-client/spans";

await addDocumentAnnotation({
  client,
  documentAnnotation: {
    spanId: "retriever_span",
    documentPosition: 0,  // 0 基索引
    name: "relevance",
    annotatorKind: "LLM",
    label: "relevant",
    score: 0.95
  }
});
```

## Trace 標核 (Trace Annotations)

對整個 Trace 的回饋：

```typescript
import { addTraceAnnotation } from "@arizeai/phoenix-client/traces";

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

## Trace 筆記 (Trace Notes)

整個 Trace 的筆記（單一 Trace 允許有多個筆記）：

```typescript
import { addTraceNote } from "@arizeai/phoenix-client/traces";

await addTraceNote({
  client,
  traceNote: {
    traceId: "abc123def456",
    note: "需要追蹤 — 非預期的工具呼叫順序"
  }
});
```

## 工作階段標核 (Session Annotations)

對多輪對話的回饋：

```typescript
import { addSessionAnnotation } from "@arizeai/phoenix-client/sessions";

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
import { createClient } from "@arizeai/phoenix-client";
import { logDocumentAnnotations, addSpanAnnotation } from "@arizeai/phoenix-client/spans";
import { addTraceAnnotation } from "@arizeai/phoenix-client/traces";

const client = createClient();

// 文件相關性（批次）
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

// 整體 Trace 品質
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

## API 參考 (API Reference)

- [TypeScript Client API](https://arize-ai.github.io/phoenix/)
