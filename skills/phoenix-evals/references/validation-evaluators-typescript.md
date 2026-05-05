# 驗證評估者 (TypeScript) (Validating Evaluators (TypeScript))

在部署 LLM 評估者之前，先針對人工標註的範例進行驗證。
目標：**>80% TPR 與 >80% TNR**。

角色與一般的任務實驗相反：

| 一般實驗 | 評估者驗證 |
|---|---|
| 任務 = 代理程式邏輯 | 任務 = 執行受測的評估者 |
| 評估者 = 評審輸出 | 評估者 = 與人工地面實況的完全比對 |
| 資料集 = 代理程式範例 | 資料集 = 手工標註的黃金範例 |

## 黃金資料集 (Golden Dataset)

使用獨立的資料集名稱，以免驗證實驗與 Phoenix 中的任務實驗混淆。
將人工地面實況儲存在 `metadata.groundTruthLabel` 中。目標是達成約 50/50 的平衡：

```typescript
import type { Example } from "@arizeai/phoenix-client/types/datasets";

const goldenExamples: Example[] = [
  { input: { q: "法國的首都是哪裡？" }, output: { answer: "巴黎" },       metadata: { groundTruthLabel: "correct" } },
  { input: { q: "法國的首都是哪裡？" }, output: { answer: "里昂" },        metadata: { groundTruthLabel: "incorrect" } },
  { input: { q: "法國的首都是哪裡？" }, output: { answer: "主要城市..." }, metadata: { groundTruthLabel: "incorrect" } },
];

const VALIDATOR_DATASET = "my-app-qa-evaluator-validation"; // 與任務資料集分開
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

// 任務：叫用受測的評估者
const task = async (example: (typeof examples)[number]) => {
  const result = await myEvaluator.evaluate({ input: example.input, output: example.output, metadata: example.metadata });
  return result.label ?? "unknown";
};

// 評估者：與人工地面實況進行完全比對
const exactMatch = asExperimentEvaluator({
  name: "exact-match", kind: "CODE",
  evaluate: ({ output, metadata }) => {
    const expected = metadata?.groundTruthLabel as string;
    const predicted = typeof output === "string" ? output : "unknown";
    return { score: predicted === expected ? 1 : 0, label: predicted, explanation: `預期：${expected}, 得到：${predicted}` };
  },
});

const experiment = await runExperiment({
  client, experimentName: `evaluator-validation-${Date.now()}`,
  dataset: { datasetId }, task, evaluators: [exactMatch],
});

// 計算混淆矩陣 (Confusion matrix)
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
console.log(`TPR: ${tpr.toFixed(1)}%  TNR: ${tnr.toFixed(1)}%  準確度: ${((tp + tn) / total * 100).toFixed(1)}%`);
```

## 結果與品質規則 (Results & Quality Rules)

| 指標 | 目標 | 低值代表 |
|---|---|---|
| TPR (靈敏度 Sensitivity) | >80% | 遺漏了真實的失敗（偽陰性） |
| TNR (特異度 Specificity) | >80% | 誤標了優質輸出（偽陽性） |
| 準確度 (Accuracy) | >80% | 整體表現弱 |

**黃金資料集規則**：~50/50 平衡 · 包含邊緣案例 · 僅使用人工標記 · 絕不進行變動（附加新版本）· 20–50 個範例即足夠。

**下列情況需重新驗證**：提示詞範本變更 · 評審模型變更 · 標準更新 · 生產環境 FP/FN 飆升。

## 參閱 (See Also)

- `validation.md` — 指標定義與概念
- `experiments-running-typescript.md` — `runExperiment` API
- `experiments-datasets-typescript.md` — `createOrGetDataset` / `getDatasetExamples`
