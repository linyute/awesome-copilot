# 評估器：內建 (Pre-Built)

僅用於探索。在實際生產 (production) 之前請先驗證。

## Python

```python
from phoenix.evals import LLM
from phoenix.evals.metrics import FaithfulnessEvaluator

llm = LLM(provider="openai", model="gpt-4o")
faithfulness_eval = FaithfulnessEvaluator(llm=llm)
```

**注意**：`HallucinationEvaluator` 已棄用 (deprecated)。請改用 `FaithfulnessEvaluator`。
它使用 "faithful"/"unfaithful" (忠實/不忠實) 標籤，並將分數 1.0 設定為忠實。

## TypeScript

```typescript
import { createHallucinationEvaluator } from "@arizeai/phoenix-evals";
import { openai } from "@ai-sdk/openai";

const hallucinationEval = createHallucinationEvaluator({ model: openai("gpt-4o") });
```

## 可用清單 (2.0)

| 評估器 | 類型 | 說明 |
| --------- | ---- | ----------- |
| `FaithfulnessEvaluator` | LLM | 回答是否忠實於內容 (context)？ |
| `CorrectnessEvaluator` | LLM | 回答是否正確？ |
| `DocumentRelevanceEvaluator` | LLM | 擷取的文件是否具備相關性？ |
| `ToolSelectionEvaluator` | LLM | 代理 (agent) 是否選擇了正確的工具？ |
| `ToolInvocationEvaluator` | LLM | 代理是否正確地呼叫了工具？ |
| `ToolResponseHandlingEvaluator` | LLM | 代理是否妥善處理了工具的回傳？ |
| `MatchesRegex` | Code | 輸出是否符合正規表示式 (regex) 模式？ |
| `PrecisionRecallFScore` | Code | 精確率/召回率/F-score 指標 |
| `exact_match` | Code | 字串完全符合 |

舊版評估器 (`HallucinationEvaluator`、`QAEvaluator`、`RelevanceEvaluator`、`ToxicityEvaluator`、`SummarizationEvaluator`) 位於 `phoenix.evals.legacy` 中且已棄用。

## 何時使用

| 情況 | 建議 |
| --------- | -------------- |
| 探索 (Exploration) | 尋找追蹤 (traces) 以進行審查 |
| 尋找離群值 (Find outliers) | 依分數排序 |
| 生產 (Production) | 先驗證 (>80% 與人類標籤一致) |
| 特定領域 | 建立自訂評估器 |

## 探索模式 (Exploration Pattern)

```python
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(dataframe=traces, evaluators=[faithfulness_eval])

# 分數欄位包含字典 — 擷取數值分數
scores = results_df["faithfulness_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
low_scores = results_df[scores < 0.5]   # 審查這些個案
high_scores = results_df[scores > 0.9]  # 同樣進行抽樣
```

## 需要驗證

```python
from sklearn.metrics import classification_report

print(classification_report(human_labels, evaluator_results["label"]))
# 目標：>80% 一致性
```
