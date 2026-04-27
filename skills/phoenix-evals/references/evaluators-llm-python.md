# 評估器：Python 中的 LLM 評估器 (LLM Evaluators)

LLM 評估器使用語言模型來判斷輸出。當準則具有主觀性時使用。

## 快速開始 (Quick Start)

```python
from phoenix.evals import ClassificationEvaluator, LLM

llm = LLM(provider="openai", model="gpt-4o")

HELPFULNESS_TEMPLATE = """Rate how helpful the response is.

<question>{{input}}</question>
<response>{{output}}</response>

"helpful" means directly addresses the question.
"not_helpful" means does not address the question.

Your answer (helpful/not_helpful):"""

helpfulness = ClassificationEvaluator(
    name="helpfulness",
    prompt_template=HELPFULNESS_TEMPLATE,
    llm=llm,
    choices={"not_helpful": 0, "helpful": 1}
)
```

## 範本變數 (Template Variables)

使用 XML 標籤來封裝變數以提高清晰度：

| 變數 | XML 標籤 |
| -------- | ------- |
| `{{input}}` | `<question>{{input}}</question>` |
| `{{output}}` | `<response>{{output}}</response>` |
| `{{reference}}` | `<reference>{{reference}}</reference>` |
| `{{context}}` | `<context>{{context}}</context>` |

## create_classifier (工廠) (Factory)

回傳 `ClassificationEvaluator` 的簡寫工廠。為了獲得更多參數/客製化，建議優先使用直接的 `ClassificationEvaluator` 具現化 (instantiation)：

```python
from phoenix.evals import create_classifier, LLM

relevance = create_classifier(
    name="relevance",
    prompt_template="""Is this response relevant to the question?
<question>{{input}}</question>
<response>{{output}}</response>
Answer (relevant/irrelevant):""",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"relevant": 1.0, "irrelevant": 0.0},
)
```

## 輸入映射 (Input Mapping)

欄位名稱必須與範本變數相符。重新命名欄位或使用 `bind_evaluator`：

```python
# 選項 1：重新命名欄位以符合範本變數
df = df.rename(columns={"user_query": "input", "ai_response": "output"})

# 選項 2：使用 bind_evaluator
from phoenix.evals import bind_evaluator

bound = bind_evaluator(
    evaluator=helpfulness,
    input_mapping={"input": "user_query", "output": "ai_response"},
)
```

## 執行 (Running)

```python
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(dataframe=df, evaluators=[helpfulness])
```

## 最佳實務 (Best Practices)

1. **具體明確** - 精確定義通過/失敗的含義
2. **包含範例** - 顯示每個標籤的具體案例
3. **預設提供解釋** - `ClassificationEvaluator` 會自動包含解釋 (explanations)
4. **研讀內建提示** - 參閱 `phoenix.evals.__generated__.classification_evaluator_configs` 以取得結構良好的評估提示範例（例如 Faithfulness、Correctness、DocumentRelevance 等）
