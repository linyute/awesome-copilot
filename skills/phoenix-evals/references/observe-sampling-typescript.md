# 觀察：抽樣策略 (TypeScript) (Sampling Strategies)

如何有效率地抽樣生產追蹤 (production traces) 以進行審查。

## 策略 (Strategies)

### 1. 聚焦於失敗 (Failure-Focused) (最高優先權)

使用伺服器端過濾器來僅擷取您需要的內容：

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";

// 伺服器端過濾器 — 僅回傳狀態碼為 ERROR 的 spans
const { spans: errors } = await getSpans({
  project: { projectName: "my-project" },
  statusCode: "ERROR",
  limit: 100,
});

// 僅擷取 LLM spans
const { spans: llmSpans } = await getSpans({
  project: { projectName: "my-project" },
  spanKind: "LLM",
  limit: 100,
});

// 依 span 名稱過濾
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

### 3. 分層抽樣 (Stratified) (涵蓋範圍)

```typescript
// 從每個類別中平均抽樣
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

### 4. 由指標引導 (Metric-Guided)

```typescript
import { getSpanAnnotations } from "@arizeai/phoenix-client/spans";

// 擷取您的 spans 的 annotations，然後依標籤 (label) 過濾
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

## 追蹤層級抽樣 (Trace-Level Sampling)

當您需要完整的請求（一個追蹤中的所有 spans）時，請使用 `getTraces`：

```typescript
import { getTraces } from "@arizeai/phoenix-client/traces";

// 包含完整 span 樹的最近追蹤
const { traces } = await getTraces({
  project: { projectName: "my-project" },
  limit: 100,
  includeSpans: true,
});

// 依階段 (session) 過濾（例如：多輪對話）
const { traces: sessionTraces } = await getTraces({
  project: { projectName: "my-project" },
  sessionId: "user-session-abc",
  includeSpans: true,
});

// 時間視窗抽樣
const { traces: recentTraces } = await getTraces({
  project: { projectName: "my-project" },
  startTime: new Date(Date.now() - 60 * 60 * 1000), // 過去一小時
  limit: 50,
  includeSpans: true,
});
```

## 建立審查佇列 (Building a Review Queue)

```typescript
// 組合伺服器端過濾器以建立審查佇列
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

| 目的 | 大小 |
| ------- | ---- |
| 初始探索 | 50-100 |
| 錯誤分析 | 100+ (直到飽和) |
| 黃金資料集 (Golden dataset) | 100-500 |
| 裁判校準 | 每個類別 100+ |

**飽和 (Saturation)**：當新的追蹤顯示相同的失敗模式時即可停止。
