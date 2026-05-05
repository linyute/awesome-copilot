# 實驗：TypeScript 中的資料集 (Experiments: Datasets in TypeScript)

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
      input: { question: "2+2 等於多少？" },
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
  metadata?: Record<string, unknown>; // 額外的上下文資訊
}
```

## 來自生產環境追蹤 (From Production Traces)

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";

const { spans } = await getSpans({
  project: { projectName: "my-app" },
  parentId: null, // 僅限根 Span
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

## 最佳實踐 (Best Practices)

- **版本管理**：建立新的資料集，不要修改現有的。
- **中介資料 (Metadata)**：追蹤來源、類別、出處。
- **型別安全 (Type safety)**：為結構使用 TypeScript 介面。
