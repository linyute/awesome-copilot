# 實驗：在 TypeScript 中執行實驗 (Experiments: Running Experiments in TypeScript)

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

// 帶有上下文 (RAG)
const ragTask = async (example) => {
  const prompt = `Context: ${example.input.context}\nQ: ${example.input.question}`;
  return await callLLM(prompt);
};
```

## 評估者參數 (Evaluator Parameters)

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
  maxConcurrency: 5, // 限制並行執行數
});
```

## 穩定性 (Stability)

當任務或評估者具備非確定性（例如 LLM 呼叫、工具使用、串流輸出或 LLM-as-judge）時，單次執行的分數會存在雜訊。在小型資料集上，這種每次執行的雜訊可能會掩蓋提示詞變更所帶來的訊號。

透過多次重複 (repetitions) 取平均值，可讓回報的分數反映提示詞本身，而非取樣雜訊：

```typescript
await runExperiment({
  // ...
  repetitions: 3,
});
```

考量因素：

- 當任務或評估者是 LLM 呼叫且資料集較小時，建議使用重複次數。
- 當每個範例的成本較低且您主要想穩定分數時，優先選擇重複次數；當您還需要涵蓋更多行為時，優先選擇擴大資料集。
- 當任務與評估者皆為確定性（例如與地面實況進行字串比對）時，請跳過重複次數 — 單次執行即為最終答案。

在以下情況考慮增加穩定性：

- 同一實驗的重複執行結果發生偏移，且偏移程度大於您試圖測量的差異。
- 提示詞變更導致範例標籤發生翻轉，但這種翻轉與輸出實際變化的方式不符。
- 評審在同一個輸出上的推理在不同執行之間讀起來有差異。

重複執行也是 `repetitions: 1`（預設值）所默認依賴的機制 — 不要僅根據單次的 10 範例執行就做出調優決策。

## 稍後新增評估 (Add Evaluations Later)

```typescript
import { evaluateExperiment } from "@arizeai/phoenix-client/experiments";

await evaluateExperiment({ client, experiment, evaluators: [newEvaluator] });
```
