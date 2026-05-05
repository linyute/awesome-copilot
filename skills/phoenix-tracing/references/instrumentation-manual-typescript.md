# 手動檢測 (TypeScript) (Manual Instrumentation (TypeScript))

使用便利的包裝器 (wrappers) 或 `withSpan` 新增自訂 Span，以實現細粒度的追蹤控制。

## 設定 (Setup)

```bash
npm install @arizeai/phoenix-otel @arizeai/openinference-core
```

```typescript
import { register } from "@arizeai/phoenix-otel";
register({ projectName: "my-app" });
```

## 快速參考 (Quick Reference)

| Span 種類 | 方法 | 使用情境 |
|-----------|--------|----------|
| CHAIN | `traceChain` | 工作流程、管線、編排 |
| AGENT | `traceAgent` | 多步驟推理、規劃 |
| TOOL | `traceTool` | 外部 API、函式呼叫 |
| RETRIEVER | `withSpan` | 向量搜尋、文件擷取 |
| LLM | `withSpan` | LLM API 呼叫（優先建議使用自動檢測） |
| EMBEDDING | `withSpan` | 嵌入向量產生 |
| RERANKER | `withSpan` | 文件重新排序 |
| GUARDRAIL | `withSpan` | 安全檢查、內容審核 |
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

## 針對其他種類使用 withSpan (withSpan for Other Kinds)

```typescript
import { withSpan, getInputAttributes, getRetrieverAttributes } from "@arizeai/openinference-core";

// 帶有自訂屬性的 RETRIEVER
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

**選項 (Options)：**

```typescript
withSpan(fn, {
  kind: "RETRIEVER",              // OpenInference Span 種類
  name: "span-name",              // Span 名稱（預設為函式名稱）
  processInput: (args) => {},     // 將輸入轉換為屬性
  processOutput: (result) => {},  // 將輸出轉換為屬性
  attributes: { key: "value" }    // 靜態屬性
});
```

## 擷取輸入/輸出 (Capturing Input/Output)

**務必為評估就緒的 Span 擷取輸入/輸出。** 使用 `getInputAttributes` 與 `getOutputAttributes` 協助工具來實現自動 MIME 類型偵測：

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
    // 使用協助工具 - 自動 MIME 類型偵測
    processInput: (input) => getInputAttributes(input),
    processOutput: (result) => getOutputAttributes(result.text),
  }
);

await handleQuery("2+2 等於多少？");
```

**擷取到的內容：**

```json
{
  "input.value": "2+2 等於多少？",
  "input.mime_type": "text/plain",
  "output.value": "2+2 等於 4。",
  "output.mime_type": "text/plain"
}
```

**協助工具行為：**
- 字串 (Strings) → `text/plain`
- 物件/陣列 (Objects/Arrays) → `application/json`（自動序列化）
- `undefined`/`null` → 不設定屬性

**為什麼這很重要：**
- Phoenix 評估者需要 `input.value` 與 `output.value`。
- Phoenix UI 會在追蹤檢視中顯眼地顯示輸入/輸出，以便進行偵錯。
- 實現匯出資料以建立微調資料集。

### 自訂輸入/輸出處理 (Custom I/O Processing)

在標準輸入/輸出屬性旁設定自訂中介資料：

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

## 參閱 (See Also)

- **Span 屬性：** `span-chain.md`, `span-retriever.md`, `span-tool.md` 等。
- **屬性協助工具：** https://docs.arize.com/phoenix/tracing/manual-instrumentation-typescript#attribute-helpers
- **自動檢測：** `instrumentation-auto-typescript.md`（用於框架整合）
