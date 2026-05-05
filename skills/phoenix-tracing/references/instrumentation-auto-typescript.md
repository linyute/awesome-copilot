# 自動檢測 (TypeScript) (Auto-Instrumentation (TypeScript))

無需變更程式碼即可自動為 LLM 呼叫建立 Span。

## 支援的框架 (Supported Frameworks)

- **LLM SDK：** OpenAI
- **框架：** LangChain
- **安裝方式：** `npm install @arizeai/openinference-instrumentation-{名稱}`

## 設定 (Setup)

**CommonJS（自動）：**

```javascript
const { register } = require("@arizeai/phoenix-otel");
const OpenAI = require("openai");

register({ projectName: "my-app" });

const client = new OpenAI();
```

**ESM（需手動進行）：**

```typescript
import { register, registerInstrumentations } from "@arizeai/phoenix-otel";
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";
import OpenAI from "openai";

register({ projectName: "my-app" });

const instrumentation = new OpenAIInstrumentation();
instrumentation.manuallyInstrument(OpenAI);
registerInstrumentations({ instrumentations: [instrumentation] });
```

**原因：** ESM 匯入會比 `register()` 先執行 (hoisted)，因此需要 `manuallyInstrument()`。

## 限制 (Limitations)

**自動檢測「不會」擷取的部分：**

```typescript
async function myWorkflow(query: string): Promise<string> {
  const preprocessed = await preprocess(query);        // 不會被追蹤
  const response = await client.chat.completions.create(...);  // 會被追蹤（自動）
  const postprocessed = await postprocess(response);   // 不會被追蹤
  return postprocessed;
}
```

**解決方案：** 為自訂邏輯新增手動檢測：

```typescript
import { traceChain } from "@arizeai/openinference-core";

const myWorkflow = traceChain(
  async (query: string): Promise<string> => {
    const preprocessed = await preprocess(query);
    const response = await client.chat.completions.create(...);
    const postprocessed = await postprocess(response);
    return postprocessed;
  },
  { name: "my-workflow" }
);
```

## 結合自動與手動 (Combining Auto + Manual)

```typescript
import { register } from "@arizeai/phoenix-otel";
import { traceChain } from "@arizeai/openinference-core";

register({ projectName: "my-app" });

const client = new OpenAI();

const workflow = traceChain(
  async (query: string) => {
    const preprocessed = await preprocess(query);
    const response = await client.chat.completions.create(...);  // 自動檢測
    return postprocess(response);
  },
  { name: "my-workflow" }
);
```
