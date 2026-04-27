# 手動檢測 (Manual Instrumentation) (TypeScript)

使用便利包裝器 (convenience wrappers) 或 `withSpan` 新增自訂 spans，以實現細粒度的追蹤控制。

## 設定 (Setup)

```bash
npm install @arizeai/phoenix-otel @arizeai/openinference-core
```

```typescript
import { register } from "@arizeai/phoenix-otel";
register({ projectName: "my-app" });
```

## 快速參考 (Quick Reference)

| Span 種類 | 方法 | 使用案例 |
|-----------|--------|----------|
| CHAIN | `traceChain` | 工作流程、管線 (pipelines)、協排 (orchestration) |
| AGENT | `traceAgent` | 多步驟推理、規劃 |
| TOOL | `traceTool` | 外部 API、函式呼叫 |
| RETRIEVER | `withSpan` | 向量搜尋、文件擷取 |
| LLM | `withSpan` | LLM API 呼叫（建議優先使用自動檢測） |
| EMBEDDING | `withSpan` | 嵌入 (Embedding) 產生 |
| RERANKER | `withSpan` | 文件重排 |
| GUARDRAIL | `withSpan` | 安全檢查、內容審查 |
| EVALUATOR | `withSpan` | LLM 評估 |

## 便利包裝器 (Convenience Wrappers)

```typescript
import { traceChain, traceAgent, traceTool } from "@arizeai/openinference-core";

// CHAIN - 工作流程
const pipeline = traceChain(
  async (query: string) => {
    const docs = await retrieve(query);
    return await generate(docs, query);
  },
  { name: "rag-pipeline" }
);

// AGENT - 推理
const agent = traceAgent(
  async (question: string) => {
    const thought = await llm.generate(`Think: ${question}`);
    return await processThought(thought);
  },
  { name: "my-agent" }
);

// TOOL - 函式呼叫
const getWeather = traceTool(
  async (city: string) => fetch(`/api/weather/${city}`).then(r => r.json()),
  { name: "get-weather" }
);
```

## 適用於其他種類的 withSpan (withSpan for Other Kinds)

```typescript
import { withSpan, getInputAttributes, getRetrieverAttributes } from "@arizeai/openinference-core";

// 包含自訂屬性的 RETRIEVER
const retrieve = withSpan(
  async (query: string) => {
    const results = await vectorDb.search(query, { topK: 5 });
    return results.map(doc => ({ content: doc.text, score: doc.score }));
  },
  {
    kind: "RETRIEVER",
    name: "vector-search",
    processInput: (query) => getInputAttributes(query),
    processOutput: (docs) => getRetrieverAttributes({ documents: docs })
  }
);
```

**選項：**

```typescript
withSpan(fn, {
  kind: "RETRIEVER",              // OpenInference span 種類
  name: "span-name",              // Span 名稱（預設為函式名稱）
  processInput: (args) => {},     // 將輸入轉換為屬性
  processOutput: (result) => {},  // 將輸出轉換為屬性
  attributes: { key: "value" }    // 靜態屬性
});
```

## 擷取輸入/輸出 (Capturing Input/Output)

**請務必為可用於評估的 spans 擷取輸入/輸出 (I/O)。** 使用 `getInputAttributes` 和 `getOutputAttributes` 輔助函式 (helpers) 以實現自動 MIME 類型偵測：

```typescript
import {
  getInputAttributes,
  getOutputAttributes,
  withSpan,
} from "@arizeai/openinference-core";

const handleQuery = withSpan(
  async (userInput: string) => {
    const result = await agent.generate({ prompt: userInput });
    return result;
  },
  {
    name: "query.handler",
    kind: "CHAIN",
    // 使用輔助函式 - 自動 MIME 類型偵測
    processInput: (input) => getInputAttributes(input),
    processOutput: (result) => getOutputAttributes(result.text),
  }
);

await handleQuery("2+2 等於多少？");
```

**擷取的內容：**

```json
{
  "input.value": "What is 2+2?",
  "input.mime_type": "text/plain",
  "output.value": "2+2 equals 4.",
  "output.mime_type": "text/plain"
}
```

**輔助函式行為：**
- 字串 → `text/plain`
- 物件/陣列 → `application/json`（自動序列化）
- `undefined`/`null` → 不設定屬性

**為什麼這很重要：**
- Phoenix 評估器需要 `input.value` 與 `output.value`
- Phoenix UI 會顯眼地顯示 I/O 以便除錯
- 支援匯出資料以用於微調資料集 (fine-tuning datasets)

### 自訂 I/O 處理 (Custom I/O Processing)

在標準 I/O 屬性之外，新增自訂 Metadata：

```typescript
const processWithMetadata = withSpan(
  async (query: string) => {
    const result = await llm.generate(query);
    return result;
  },
  {
    name: "query.process",
    kind: "CHAIN",
    processInput: (query) => ({
      "input.value": query,
      "input.mime_type": "text/plain",
      "input.length": query.length,  // 自訂屬性
    }),
    processOutput: (result) => ({
      "output.value": result.text,
      "output.mime_type": "text/plain",
      "output.tokens": result.usage?.totalTokens,  // 自訂屬性
    }),
  }
);
```

## 另請參閱

- **Span 屬性：** `span-chain.md`、`span-retriever.md`、`span-tool.md` 等。
- **屬性輔助函式：** https://docs.arize.com/phoenix/tracing/manual-instrumentation-typescript#attribute-helpers
- **自動檢測 (Auto-instrumentation)：** `instrumentation-auto-typescript.md` 用於框架整合
