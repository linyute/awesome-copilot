# 實驗：TypeScript 中的資料集 (Datasets)

建立與管理評估資料集。

## 建立資料集 (Creating Datasets)

```typescript
import { createClient } from "@arizeai/phoenix-client";
import { createDataset } from "@arizeai/phoenix-client/datasets";

const client = createClient();

const { datasetId } = await createDataset({
  client,
  name: "qa-test-v1",
  examples: [
    {
      input: { question: "What is 2+2?" },
      output: { answer: "4" },
      metadata: { category: "math" },
    },
  ],
});
```

## 範例結構 (Example Structure)

```typescript
interface DatasetExample {
  input: Record<string, unknown>;    // 任務輸入
  output?: Record<string, unknown>;  // 預期輸出
  metadata?: Record<string, unknown>; // 額外的內容 (context)
}
```

## 從生產追蹤 (Production Traces) 建立

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";

const { spans } = await getSpans({
  project: { projectName: "my-app" },
  parentId: null, // 僅限頂層 spans
  limit: 100,
});

const examples = spans.map((span) => ({
  input: { query: span.attributes?.["input.value"] },
  output: { response: span.attributes?.["output.value"] },
  metadata: { spanId: span.context.span_id },
}));

await createDataset({ client, name: "production-sample", examples });
```

## 擷取資料集 (Retrieving Datasets)

```typescript
import { getDataset, listDatasets } from "@arizeai/phoenix-client/datasets";

const dataset = await getDataset({ client, datasetId: "..." });
const all = await listDatasets({ client });
```

## 最佳實務 (Best Practices)

- **版本控制 (Versioning)**：建立新的資料集，不要修改現有的
- **Metadata**：追蹤來源、類別與原始出處 (provenance)
- **型別安全 (Type safety)**：針對結構使用 TypeScript 介面 (interfaces)
