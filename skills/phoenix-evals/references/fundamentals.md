# 基本概念 (Fundamentals)

針對 AI 系統的應用程式特定測試。程式碼優先，LLM 用於細微差別，人類用於真實標準。

## 評估器類型 (Evaluator Types)

| 類型 | 速度 | 成本 | 使用案例 |
| ---- | ----- | ---- | -------- |
| **程式碼 (Code)** | 快 | 便宜 | Regex、JSON、格式、完全符合 |
| **LLM** | 中 | 中 | 主觀品質、複雜準則 |
| **人類 (Human)** | 慢 | 昂貴 | 地面實況 (Ground truth)、校準 |

**決策：** 程式碼優先 → 僅當程式碼無法捕捉準則時才使用 LLM → 人類用於校準。

## 分數結構 (Score Structure)

| 屬性 | 必要 | 說明 |
| -------- | -------- | ----------- |
| `name` | 是 | 評估器名稱 |
| `kind` | 是 | `"code"`、`"llm"` 或 `"human"` |
| `score` | 否* | 0-1 數值 |
| `label` | 否* | `"pass"` (通過)、`"fail"` (失敗) |
| `explanation` | 否 | 依據/理由 |

*`score` 或 `label` 必須擇一提供。

## 二元 (Binary) > 李克特量表 (Likert)

使用通過/失敗，而非 1-5 的量表。準則更明確，也更容易校準。

```python
# 使用多個二元檢查，而非單一李克特量表
evaluators = [
    AnswersQuestion(),    # 是/否
    UsesContext(),        # 是/否
    NoHallucination(),    # 是/否
]
```

## 快速模式 (Quick Patterns)

### 程式碼評估器 (Code Evaluator)

```python
from phoenix.evals import create_evaluator

@create_evaluator(name="has_citation", kind="code")
def has_citation(output: str) -> bool:
    return bool(re.search(r'\[\d+\]', output))
```

### LLM 評估器 (LLM Evaluator)

```python
from phoenix.evals import ClassificationEvaluator, LLM

evaluator = ClassificationEvaluator(
    name="helpfulness",
    prompt_template="...",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"not_helpful": 0, "helpful": 1}
)
```

### 執行實驗 (Run Experiment)

```python
from phoenix.client.experiments import run_experiment

experiment = run_experiment(
    dataset=dataset,
    task=my_task,
    evaluators=[evaluator1, evaluator2],
)
print(experiment.aggregate_scores)
```
