# 觀察：採樣策略 (TypeScript) (Observe: Sampling Strategies (TypeScript))

如何有效地對生產環境追蹤進行採樣以供審核。

## 策略 (Strategies)

### 1. 失敗導向（最高優先順序） (Failure-Focused (Highest Priority))

使用伺服器端篩選器僅獲取您需要的內容：

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";

// 伺服器端篩選器 — 僅傳回 ERROR Span
const { spans: errors } = await getSpans({
  project: { projectName: "my-project" },
  statusCode: "ERROR",
  limit: 100,
});

// 僅獲取 LLM Span
const { spans: llmSpans } = await getSpans({
  project: { projectName: "my-project" },
  spanKind: "LLM",
  limit: 100,
});

// 依 Span 名稱篩選
const { spans: chatSpans } = await getSpans({
  project: { projectName: "my-project" },
  name: "chat_completion",
  limit: 100,
});
```

### 2. 離群值 (Outliers)

```typescript
const { spans } = await getSpans({
  project: { projectName: "my-project" },
  limit: 200,
});
const latency = (s: (typeof spans)[number]) =>
  new Date(s.end_time).getTime() - new Date(s.start_time).getTime();
const sorted = [...spans].sort((a, b) => latency(b) - latency(a));
const slowResponses = sorted.slice(0, 50);
```

### 3. 分層採樣（覆蓋率） (Stratified (Coverage))

```typescript
// 從每個類別中平均採樣
function stratifiedSample<T>(items: T[], groupBy: (item: T) => string, perGroup: number): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupBy(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return [...groups.values()].flatMap((g) => g.slice(0, perGroup));
}

const { spans } = await getSpans({
  project: { projectName: "my-project" },
  limit: 500,
});
const byQueryType = stratifiedSample(spans, (s) => s.attributes?.["metadata.query_type"] ?? "unknown", 20);
```

### 4. 指標引導 (Metric-Guided)

```typescript
import { getSpanAnnotations } from "@arizeai/phoenix-client/spans";

// 為您的 Span 獲取標核，然後依標籤篩選
const { annotations } = await getSpanAnnotations({
  project: { projectName: "my-project" },
  spanIds: spans.map((s) => s.context.span_id),
  includeAnnotationNames: ["hallucination"],
});

const flaggedSpanIds = new Set(
  annotations.filter((a) => a.result?.label === "hallucinated").map((a) => a.span_id)
);
const flagged = spans.filter((s) => flaggedSpanIds.has(s.context.span_id));
```

## Trace 層級採樣 (Trace-Level Sampling)

當您需要完整的請求（Trace 中的所有 Span）時，使用 `getTraces`：

```typescript
import { getTraces } from "@arizeai/phoenix-client/traces";

// 帶有完整 Span 樹的近期 Trace
const { traces } = await getTraces({
  project: { projectName: "my-project" },
  limit: 100,
  includeSpans: true,
});

// 依工作階段篩選（例如：多輪對話）
const { traces: sessionTraces } = await getTraces({
  project: { projectName: "my-project" },
  sessionId: "user-session-abc",
  includeSpans: true,
});

// 時間視窗採樣
const { traces: recentTraces } = await getTraces({
  project: { projectName: "my-project" },
  startTime: new Date(Date.now() - 60 * 60 * 1000), // 過去一小時
  limit: 50,
  includeSpans: true,
});
```

## 建立審核佇列 (Building a Review Queue)

```typescript
// 將伺服器端篩選器組合成審核佇列
const { spans: errorSpans } = await getSpans({
  project: { projectName: "my-project" },
  statusCode: "ERROR",
  limit: 30,
});
const { spans: allSpans } = await getSpans({
  project: { projectName: "my-project" },
  limit: 100,
});
const random = allSpans.sort(() => Math.random() - 0.5).slice(0, 30);

const combined = [...errorSpans, ...random];
const unique = [...new Map(combined.map((s) => [s.context.span_id, s])).values()];
const reviewQueue = unique.slice(0, 100);
```

## 樣本大小指南 (Sample Size Guidelines)

| 用途 | 大小 |
| ------- | ---- |
| 初步探索 | 50-100 |
| 錯誤分析 | 100+ (直到飽和為止) |
| 黃金資料集 | 100-500 |
| 評審校準 | 每個類別 100+ |

**飽和 (Saturation)：** 當新的追蹤不再顯示新的失敗模式時停止。
