# 評估者：TypeScript 中的 LLM 評估者 (Evaluators: LLM Evaluators in TypeScript)

LLM 評估者使用語言模型來判斷輸出。使用 Vercel AI SDK。

## 快速開始 (Quick Start)

```typescript
import { createClassificationEvaluator } from "@arizeai/phoenix-evals";
import { openai } from "@ai-sdk/openai";

const helpfulness = await createClassificationEvaluator<{
  input: string;
  output: string;
}>({
  name: "helpfulness",
  model: openai("gpt-4o"),
  promptTemplate: `Rate helpfulness.
<question>{{input}}</question>
<response>{{output}}</response>
Answer (helpful/not_helpful):`,
  choices: { not_helpful: 0, helpful: 1 },
});
```

## 範本變數 (Template Variables)

使用 XML 標籤：`<question>{{input}}</question>`, `<response>{{output}}</response>`, `<context>{{context}}</context>`

## 使用 asExperimentEvaluator 建立自訂評估者 (Custom Evaluator with asExperimentEvaluator)

```typescript
import { asExperimentEvaluator } from "@arizeai/phoenix-client/experiments";

const customEval = asExperimentEvaluator({
  name: "custom",
  kind: "LLM",
  evaluate: async ({ input, output }) => {
    // 您在此處的 LLM 呼叫
    return { score: 1.0, label: "pass", explanation: "..." };
  },
});
```

## 預建評估者 (Pre-Built Evaluators)

```typescript
import { createFaithfulnessEvaluator } from "@arizeai/phoenix-evals";

const faithfulnessEvaluator = createFaithfulnessEvaluator({
  model: openai("gpt-4o"),
});
```

## 最佳實踐 (Best Practices)

- 標準要具體
- 在提示詞中包含範例
- 使用 `<thinking>` 進行鏈式思考 (chain of thought)
