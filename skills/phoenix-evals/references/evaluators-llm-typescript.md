# 評估器：TypeScript 中的 LLM 評估器 (LLM Evaluators)

LLM 評估器使用語言模型來判斷輸出。使用 Vercel AI SDK。

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

使用 XML 標籤：`<question>{{input}}</question>`、`<response>{{output}}</response>`、`<context>{{context}}</context>`

## 使用 asExperimentEvaluator 建立自訂評估器

```typescript
import { asExperimentEvaluator } from "@arizeai/phoenix-client/experiments";

const customEval = asExperimentEvaluator({
  name: "custom",
  kind: "LLM",
  evaluate: async ({ input, output }) => {
    // 在此進行您的 LLM 呼叫
    return { score: 1.0, label: "pass", explanation: "..." };
  },
});
```

## 內建評估器 (Pre-Built Evaluators)

```typescript
import { createFaithfulnessEvaluator } from "@arizeai/phoenix-evals";

const faithfulnessEvaluator = createFaithfulnessEvaluator({
  model: openai("gpt-4o"),
});
```

## 最佳實務 (Best Practices)

- 準則 (criteria) 應具體明確
- 在提示 (prompts) 中包含範例
- 使用 `<thinking>` 進行思考鏈 (chain of thought)
