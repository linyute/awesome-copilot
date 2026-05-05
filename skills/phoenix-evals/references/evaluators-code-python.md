# 評估者：Python 中的程式碼評估者 (Evaluators: Code Evaluators in Python)

不涉及 LLM 的確定性評估者。快速、便宜且具備可重現性。

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

## 參數繫結 (Parameter Binding)

| 參數 | 描述 |
| --------- | ----------- |
| `output` | 任務輸出 |
| `input` | 範例輸入 |
| `expected` | 預期輸出 |
| `metadata` | 範例中介資料 |

```python
@create_evaluator(name="matches_expected", kind="code")
def matches_expected(output: str, expected: dict) -> bool:
    return output.strip() == expected.get("answer", "").strip()
```

## 常見模式 (Common Patterns)

- **Regex**: `re.search(pattern, output)`
- **JSON 結構描述 (JSON schema)**: `jsonschema.validate()`
- **關鍵字**: `keyword in output.lower()`
- **長度**: `len(output.split())`
- **相似度**: `editdistance.eval()` 或 Jaccard

## 傳回類型 (Return Types)

| 傳回類型 | 結果 |
| ----------- | ------ |
| `bool` | `True` → score=1.0, label="True"; `False` → score=0.0, label="False" |
| `float`/`int` | 直接作為 `score` 的值 |
| `str` (簡短，≤3 個字) | 作為 `label` 的值 |
| `str` (長篇，≥4 個字) | 作為 `explanation` 的值 |
| 帶有 `score`/`label`/`explanation` 的 `dict` | 直接映射至 Score 欄位 |
| `Score` 物件 | 原樣使用 |

## 重要：程式碼 vs LLM 評估者 (Important: Code vs LLM Evaluators)

`@create_evaluator` 裝飾器包裝的是純 Python 函式。

- `kind="code"` (預設)：針對不呼叫 LLM 的確定性評估者。
- `kind="llm"`：將評估者標記為基於 LLM，但 **您** 必須在函式內部實作 LLM 呼叫。該裝飾器不會替您呼叫 LLM。

對於大多數基於 LLM 的評估，優先建議使用 `ClassificationEvaluator`，它會自動處理 LLM 呼叫、結構化輸出解析與解釋：

```python
from phoenix.evals import ClassificationEvaluator, LLM

relevance = ClassificationEvaluator(
    name="relevance",
    prompt_template="這項是否相關？\n{{input}}\n{{output}}\n答案：",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"relevant": 1.0, "irrelevant": 0.0},
)
```

## 預建評估者 (Pre-Built)

```python
from phoenix.client.experiments import create_evaluator
from phoenix.evals.metrics import MatchesRegex

date_format = MatchesRegex(pattern=r"\d{4}-\d{2}-\d{2}")


@create_evaluator(name="contains_any_keyword", kind="code")
def contains_any_keyword(output, expected):
    keywords = expected.get("keywords", [])
    return any(kw.lower() in str(output).lower() for kw in keywords)


@create_evaluator(name="json_parseable", kind="code")
def json_parseable(output):
    import json

    try:
        json.loads(output)
        return True
    except (json.JSONDecodeError, TypeError):
        return False
```
