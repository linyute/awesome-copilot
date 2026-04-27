# 實驗：在 TypeScript 中執行實驗 (Running Experiments)

使用 `runExperiment` 執行實驗。

## 基本用法 (Basic Usage)

```typescript
import { createClient } from "@arizeai/phoenix-client";
import {
  runExperiment,
  asExperimentEvaluator,
} from "@arizeai/phoenix-client/experiments";

const client = createClient();

const task = async (example: { input: Record<string, unknown> }) => {
  return await callLLM(example.input.question as string);
};

const exactMatch = asExperimentEvaluator({
  name: "exact_match",
  kind: "CODE",
  evaluate: async ({ output, expected }) => ({
    score: output === expected?.answer ? 1.0 : 0.0,
    label: output === expected?.answer ? "match" : "no_match",
  }),
});

const experiment = await runExperiment({
  client,
  experimentName: "qa-experiment-v1",
  dataset: { datasetId: "your-dataset-id" },
  task,
  evaluators: [exactMatch],
});
```

## 任務函式 (Task Functions)

```typescript
// 基本任務
const task = async (example) => await callLLM(example.input.question as string);

// 包含內容 (context) (RAG)
const ragTask = async (example) => {
  const prompt = `Context: ${example.input.context}\nQ: ${example.input.question}`;
  return await callLLM(prompt);
};
```

## 評估器參數 (Evaluator Parameters)

```typescript
interface EvaluatorParams {
  input: Record<string, unknown>;
  output: unknown;
  expected: Record<string, unknown>;
  metadata: Record<string, unknown>;
}
```

## 選項 (Options)

```typescript
const experiment = await runExperiment({
  client,
  experimentName: "my-experiment",
  dataset: { datasetName: "qa-test-v1" },
  task,
  evaluators,
  repetitions: 3, // 每個範例執行 3 次
  maxConcurrency: 5, // 限制並行執行次數
});
```

## 稍後新增評估 (Add Evaluations Later)

```typescript
import { evaluateExperiment } from "@arizeai/phoenix-client/experiments";

await evaluateExperiment({ client, experiment, evaluators: [newEvaluator] });
```
