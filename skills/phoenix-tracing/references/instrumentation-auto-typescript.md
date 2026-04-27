# 自動檢測 (Auto-Instrumentation) (TypeScript)

無需變更程式碼，即可自動為 LLM 呼叫建立 spans。

## 支援的框架 (Supported Frameworks)

- **LLM SDKs：** OpenAI
- **框架 (Frameworks)：** LangChain
- **安裝方式：** `npm install @arizeai/openinference-instrumentation-{name}`

## 設定 (Setup)

**CommonJS（自動）：**

```javascript
const { register } = require("@arizeai/phoenix-otel");
const OpenAI = require("openai");

register({ projectName: "my-app" });

const client = new OpenAI();
```

**ESM（需要手動）：**

```typescript
import { register, registerInstrumentations } from "@arizeai/phoenix-otel";
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";
import OpenAI from "openai";

register({ projectName: "my-app" });

const instrumentation = new OpenAIInstrumentation();
instrumentation.manuallyInstrument(OpenAI);
registerInstrumentations({ instrumentations: [instrumentation] });
```

**原因：** ESM 的匯入 (imports) 會在 `register()` 執行前被提升 (hoisted)。

## 限制 (Limitations)

**自動檢測無法擷取的內容：**

```typescript
async function myWorkflow(query: string): Promise<string> {
  const preprocessed = await preprocess(query);        // 未被追蹤
  const response = await client.chat.completions.create(...);  // 已被追蹤（自動）
  const postprocessed = await postprocess(response);   // 未被追蹤
  return postprocessed;
}
```

**解決方案：** 為自訂邏輯新增手動檢測 (manual instrumentation)：

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
    const response = await client.chat.completions.create(...);  // 已由自動檢測追蹤
    return postprocess(response);
  },
  { name: "my-workflow" }
);
```
