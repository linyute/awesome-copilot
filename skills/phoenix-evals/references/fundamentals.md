# 基礎知識 (Fundamentals)

針對 AI 系統的應用程式專用測試。程式碼優先，LLM 用於細微差別，人工用於判定真理。

## 評估者類型 (Evaluator Types)

| 類型 | 速度 | 成本 | 使用情境 |
| ---- | ----- | ---- | -------- |
| **程式碼 (Code)** | 快 | 便宜 | Regex, JSON, 格式, 精確比對 |
| **LLM** | 中 | 中 | 主觀品質, 複雜標準 |
| **人工 (Human)** | 慢 | 昂貴 | 地面實況 (Ground truth), 校準 |

**決策路徑：** 程式碼優先 → 僅在程式碼無法捕捉標準時使用 LLM → 使用人工進行校準。

## 分數結構 (Score Structure)

| 屬性 | 必填 | 描述 |
| -------- | -------- | ----------- |
| `name` | 是 | 評估者名稱 |
| `kind` | 是 | `"code"`, `"llm"`, `"human"` |
| `score` | 否* | 0-1 數值 |
| `label` | 否* | `"pass"`, `"fail"` |
| `explanation` | 否 | 理由說明 |

*`score` 或 `label` 必須提供其中之一。

## 二元評分 > 李克特量表 (Binary > Likert)

使用 通過/失敗，而非 1-5 分的量表。標準更清晰，校準更為容易。

```python
# 使用多個二元檢查，而非單一個李克特量表
evaluators = [
    AnswersQuestion(),    # 是/否 (Yes/No)
    UsesContext(),        # 是/否
    NoHallucination(),    # 是/否
]
```

## 快速模式 (Quick Patterns)

### 程式碼評估者 (Code Evaluator)

```python
from phoenix.evals import create_evaluator

@create_evaluator(name="has_citation", kind="code")
def has_citation(output: str) -> bool:
    return bool(re.search(r'\[\d+\]', output))
```

### LLM 評估者 (LLM Evaluator)

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
