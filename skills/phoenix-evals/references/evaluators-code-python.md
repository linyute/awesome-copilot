# 評估器：Python 中的程式碼評估器 (Code Evaluators)

不使用 LLM 的決定性 (Deterministic) 評估器。快速、便宜且可重現。

## 基本模式 (Basic Pattern)

```python
import re
import json
from phoenix.evals import create_evaluator

@create_evaluator(name="has_citation", kind="code")
def has_citation(output: str) -> bool:
    return bool(re.search(r'\[\d+\]', output))

@create_evaluator(name="json_valid", kind="code")
def json_valid(output: str) -> bool:
    try:
        json.loads(output)
        return True
    except json.JSONDecodeError:
        return False
```

## 參數綁定 (Parameter Binding)

| 參數 | 說明 |
| --------- | ----------- |
| `output` | 任務輸出 |
| `input` | 範例輸入 |
| `expected` | 預期輸出 |
| `metadata` | 範例 Metadata |

```python
@create_evaluator(name="matches_expected", kind="code")
def matches_expected(output: str, expected: dict) -> bool:
    return output.strip() == expected.get("answer", "").strip()
```

## 常見模式

- **正規表示式 (Regex)**：`re.search(pattern, output)`
- **JSON schema**：`jsonschema.validate()`
- **關鍵字 (Keywords)**：`keyword in output.lower()`
- **長度 (Length)**：`len(output.split())`
- **相似度 (Similarity)**：`editdistance.eval()` 或 Jaccard

## 回傳類型 (Return Types)

| 回傳類型 | 結果 |
| ----------- | ------ |
| `bool` | `True` → score=1.0, label="True"；`False` → score=0.0, label="False" |
| `float`/`int` | 直接作為 `score` 值使用 |
| `str` (短，≤3 個單字) | 作為 `label` 值使用 |
| `str` (長，≥4 個單字) | 作為 `explanation` (解釋) 值使用 |
| 包含 `score`/`label`/`explanation` 的 `dict` | 直接映射到 Score 欄位 |
| `Score` 物件 | 直接使用 |

## 重要事項：程式碼評估器 vs LLM 評估器

`@create_evaluator` 裝飾器包裝了一個純 Python 函式。

- `kind="code"` (預設)：用於不呼叫 LLM 的決定性評估器。
- `kind="llm"`：將評估器標記為基於 LLM，但**您**必須在函式內部實作 LLM
  呼叫。該裝飾器不會為您呼叫 LLM。

對於大多數基於 LLM 的評估，建議優先選用 `ClassificationEvaluator`，它會自動處理
LLM 呼叫、結構化輸出解析和解釋：

```python
from phoenix.evals import ClassificationEvaluator, LLM

relevance = ClassificationEvaluator(
    name="relevance",
    prompt_template="Is this relevant?\n{{input}}\n{{output}}\nAnswer:",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"relevant": 1.0, "irrelevant": 0.0},
)
```

## 內建 (Pre-Built)

```python
from phoenix.experiments.evaluators import ContainsAnyKeyword, JSONParseable, MatchesRegex

evaluators = [
    ContainsAnyKeyword(keywords=["disclaimer"]),
    JSONParseable(),
    MatchesRegex(pattern=r"\d{4}-\d{2}-\d{2}"),
]
```
