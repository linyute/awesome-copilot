# 驗證評估器 (TypeScript) (Validating Evaluators)

在部署 LLM 評估器之前，先針對人類標記範例對其進行驗證。
目標：**>80% TPR 與 >80% TNR**。

角色與一般的任務實驗相比是對調的：

| 一般實驗 | 評估器驗證 |
|---|---|
| 任務 (Task) = 代理邏輯 | 任務 (Task) = 執行受測的評估器 |
| 評估器 (Evaluator) = 裁判輸出 | 評估器 (Evaluator) = 與人類地面實況完全符合 |
| 資料集 (Dataset) = 代理範例 | 資料集 (Dataset) = 人類手動標記的黃金範例 |

## 黃金資料集 (Golden Dataset)

使用獨立的資料集名稱，以免驗證實驗在 Phoenix 中與任務實驗混在一起。
將人類地面實況 (human ground truth) 儲存在 `metadata.groundTruthLabel`。目標是達成約 50/50 的平衡：

```typescript
import type { Example } from "@arizeai/phoenix-client/types/datasets";

const goldenExamples: Example[] = [
  { input: { q: "Capital of France?" }, output: { answer: "Paris" },       metadata: { groundTruthLabel: "correct" } },
  { input: { q: "Capital of France?" }, output: { answer: "Lyon" },        metadata: { groundTruthLabel: "incorrect" } },
  { input: { q: "Capital of France?" }, output: { answer: "Major city..." }, metadata: { groundTruthLabel: "incorrect" } },
];

const VALIDATOR_DATASET = "my-app-qa-evaluator-validation"; // 與任務資料集區隔
const POSITIVE_LABEL = "correct";
const NEGATIVE_LABEL = "incorrect";
```

## 驗證實驗 (Validation Experiment)

```typescript
import { createClient } from "@arizeai/phoenix-client";
import { createOrGetDataset, getDatasetExamples } from "@arizeai/phoenix-client/datasets";
import { asExperimentEvaluator, runExperiment } from "@arizeai/phoenix-client/experiments";
import { myEvaluator } from "./myEvaluator.js";

const client = createClient();

const { datasetId } = await createOrGetDataset({ client, name: VALIDATOR_DATASET, examples: goldenExamples });
const { examples } = await getDatasetExamples({ client, dataset: { datasetId } });
const groundTruth = new Map(examples.map((ex) => [ex.id, ex.metadata?.groundTruthLabel as string]));

// 任務：呼叫受測的評估器
const task = async (example: (typeof examples)[number]) => {
  const result = await myEvaluator.evaluate({ input: example.input, output: example.output, metadata: example.metadata });
  return result.label ?? "unknown";
};

// 評估器：與人類地面實況進行完全符合 (exact-match) 檢查
const exactMatch = asExperimentEvaluator({
  name: "exact-match", kind: "CODE",
  evaluate: ({ output, metadata }) => {
    const expected = metadata?.groundTruthLabel as string;
    const predicted = typeof output === "string" ? output : "unknown";
    return { score: predicted === expected ? 1 : 0, label: predicted, explanation: `Expected: ${expected}, Got: ${predicted}` };
  },
});

const experiment = await runExperiment({
  client, experimentName: `evaluator-validation-${Date.now()}`,
  dataset: { datasetId }, task, evaluators: [exactMatch],
});

// 計算混淆矩陣 (confusion matrix)
const runs = Object.values(experiment.runs);
const predicted = new Map((experiment.evaluationRuns ?? [])
  .filter((e) => e.name === "exact-match")
  .map((e) => [e.experimentRunId, e.result?.label ?? null]));

let tp = 0, fp = 0, tn = 0, fn = 0;
for (const run of runs) {
  if (run.error) continue;
  const p = predicted.get(run.id), a = groundTruth.get(run.datasetExampleId);
  if (!p || !a) continue;
  if (a === POSITIVE_LABEL && p === POSITIVE_LABEL) tp++;
  else if (a === NEGATIVE_LABEL && p === POSITIVE_LABEL) fp++;
  else if (a === NEGATIVE_LABEL && p === NEGATIVE_LABEL) tn++;
  else if (a === POSITIVE_LABEL && p === NEGATIVE_LABEL) fn++;
}
const total = tp + fp + tn + fn;
const tpr = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
const tnr = tn + fp > 0 ? (tn / (tn + fp)) * 100 : 0;
console.log(`TPR: ${tpr.toFixed(1)}%  TNR: ${tnr.toFixed(1)}%  Accuracy: ${((tp + tn) / total * 100).toFixed(1)}%`);
```

## 結果與品質規則 (Results & Quality Rules)

| 指標 | 目標 | 數值低落代表 |
|---|---|---|
| TPR (靈敏度/sensitivity) | >80% | 漏掉了真實的失敗 (偽陰性/false negatives) |
| TNR (特異度/specificity) | >80% | 誤標了良好的輸出 (偽陽性/false positives) |
| 準確率 (Accuracy) | >80% | 整體表現不佳 |

**黃金資料集規則：** ~50/50 平衡 · 包含邊緣案例 (edge cases) · 僅限人類標記 · 永不變異 (mutate)（採附加新版本方式） · 20–50 個範例已足夠。

**下列情況請重新驗證：** 提示範本 (prompt template) 變更 · 裁判模型變更 · 準則 (criteria) 更新 · 生產環境出現 FP/FN 飆升。

## 另請參閱

- `validation.md` — 指標定義與概念
- `experiments-running-typescript.md` — `runExperiment` API
- `experiments-datasets-typescript.md` — `createOrGetDataset` / `getDatasetExamples`
