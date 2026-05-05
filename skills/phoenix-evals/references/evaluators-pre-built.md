# 評估者：預建評估者 (Evaluators: Pre-Built)

僅用於探索。在投入生產環境前請務必驗證。

## Python

```python
from phoenix.evals import LLM
from phoenix.evals.metrics import FaithfulnessEvaluator

llm = LLM(provider="openai", model="gpt-4o")
faithfulness_eval = FaithfulnessEvaluator(llm=llm)
```

**附註**：`HallucinationEvaluator` 已棄用。請改用 `FaithfulnessEvaluator`。它使用 「faithful」/「unfaithful」標籤，1.0 分表示為 faithful。

## TypeScript

```typescript
import { createHallucinationEvaluator } from "@arizeai/phoenix-evals";
import { openai } from "@ai-sdk/openai";

const hallucinationEval = createHallucinationEvaluator({ model: openai("gpt-4o") });
```

## 可用版本 (2.0) (Available (2.0))

| 評估者 | 類型 | 描述 |
| --------- | ---- | ----------- |
| `FaithfulnessEvaluator` | LLM | 回應是否忠於上下文？ |
| `CorrectnessEvaluator` | LLM | 回應是否正確？ |
| `DocumentRelevanceEvaluator` | LLM | 擷取的文件是否相關？ |
| `ToolSelectionEvaluator` | LLM | 代理程式是否選擇了正確的工具？ |
| `ToolInvocationEvaluator` | LLM | 代理程式是否正確叫用了工具？ |
| `ToolResponseHandlingEvaluator` | LLM | 代理程式是否妥善處理了工具回應？ |
| `MatchesRegex` | 程式碼 | 輸出是否符合 Regex 模式？ |
| `PrecisionRecallFScore` | 程式碼 | 精確度 (Precision)/召回率 (Recall)/F-score 指標 |
| `exact_match` | 程式碼 | 字串完全比對 |

舊版評估者 (`HallucinationEvaluator`, `QAEvaluator`, `RelevanceEvaluator`, `ToxicityEvaluator`, `SummarizationEvaluator`) 位於 `phoenix.evals.legacy` 中且已棄用。

## 何時使用 (When to Use)

| 情況 | 建議 |
| --------- | -------------- |
| 探索 | 尋找要審閱的追蹤 |
| 尋找離群值 | 依分數排序 |
| 生產環境 | 務必先驗證（>80% 人工一致性） |
| 特定領域 | 建構自訂評估者 |

## 探索模式 (Exploration Pattern)

```python
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(dataframe=traces, evaluators=[faithfulness_eval])

# 分數資料欄包含字典 — 擷取數值分數
scores = results_df["faithfulness_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
low_scores = results_df[scores < 0.5]   # 審閱這些
high_scores = results_df[scores > 0.9]  # 同樣進行採樣
```

## 需要驗證 (Validation Required)

```python
from sklearn.metrics import classification_report

print(classification_report(human_labels, evaluator_results["label"]))
# 目標：>80% 一致性
```
