# 實驗：TypeScript 中的資料集

建立並管理評估資料集。

## 建立資料集

`createDataset()` 執行更新 (upsert) 操作：如果已存在同名的資料集，它將會更新以符合提供的範例。使用相同的輸入重新執行則是無操作。

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

// 使用穩定的範例 ID，以便在多次上傳中進行鎖定更新
const { datasetId } = await createDataset({
  client,
  name: "qa-test-v1",
  examples: [
    {
      id: "q-001",                        // 穩定 ID — 伺服器會更新此列，而非插入
      input: { question: "2+2 等於多少？" },
      output: { answer: "4" },
      metadata: { category: "math" },
    },
  ],
});
```

## 範例結構

```typescript
interface Example {
  input: Record<string, unknown>;    // 任務輸入
  output?: Record<string, unknown> | null;  // 預期輸出
  metadata?: Record<string, unknown> | null; // 額外上下文資訊
  splits?: string | string[] | null; // 分割分配 ("train", ["train", "easy"] 等)
  spanId?: string | null;            // OTEL span ID，用於連結回來源追蹤
  id?: string | null;                // 使用者提供的穩定 ID；伺服器會更新相符的資料列
}
```

## 從生產追蹤建立

```typescript
import { getSpans } from "@arizeai/phoenix-client/spans";

const { spans } = await getSpans({
  project: { projectName: "my-app" },
  parentId: null, // 僅限根 span
  limit: 100,
});

const examples = spans.map((span) => ({
  input: { query: span.attributes?.["input.value"] },
  output: { response: span.attributes?.["output.value"] },
  metadata: { spanId: span.context.span_id },
}));

await createDataset({ client, name: "production-sample", examples });
```

## 擷取資料集

```typescript
import { getDataset, listDatasets } from "@arizeai/phoenix-client/datasets";

const dataset = await getDataset({ client, datasetId: "..." });
const all = await listDatasets({ client });
```

## 最佳實務

- **預設使用更新 (Upsert)**：重新上傳至同一個名稱以進行原地更新；在範例上使用 `id`，讓伺服器鎖定特定資料列，而非將每次上傳都視為新資料
- **版本控制**：當您想要一個乾淨的快照而不僅僅是累加編輯時，請使用新名稱 (例如 `qa-test-v2`) 進行版本控制
- **Metadata**：追蹤來源、類別、出處 (provenance)
- **型別安全**：使用來自 `@arizeai/phoenix-client/datasets` 的 `Example` 型別
