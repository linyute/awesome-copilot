# 評估者：Python 中的 LLM 評估者 (Evaluators: LLM Evaluators in Python)

LLM 評估者使用語言模型來判斷輸出。當標準較為主觀時使用。

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

使用 XML 標籤包覆變數以提高清晰度：

| 變數 | XML 標籤 |
| -------- | ------- |
| `{{input}}` | `<question>{{input}}</question>` |
| `{{output}}` | `<response>{{output}}</response>` |
| `{{reference}}` | `<reference>{{reference}}</reference>` |
| `{{context}}` | `<context>{{context}}</context>` |

## create_classifier (Factory)

傳回 `ClassificationEvaluator` 的簡寫工廠。針對更多參數/自訂需求，優先建議直接實體化 `ClassificationEvaluator`：

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

資料欄名稱必須與範本變數相符。重新命名資料欄或使用 `bind_evaluator`：

```python
# 選項 1：重新命名資料欄以符合範本變數
df = df.rename(columns={"user_query": "input", "ai_response": "output"})

# 選項 2：使用 bind_evaluator
from phoenix.evals import bind_evaluator

bound = bind_evaluator(
    evaluator=helpfulness,
    input_mapping={"input": "user_query", "output": "ai_response"},
)
```

## 執行中 (Running)

```python
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(dataframe=df, evaluators=[helpfulness])
```

## 最佳實踐 (Best Practices)

1. **具體化** - 精確定義通過/失敗的含義。
2. **包含範例** - 針對每個標籤展示具體案例。
3. **預設包含解釋** - `ClassificationEvaluator` 會自動包含解釋。
4. **研究內建提示詞** - 參考 `phoenix.evals.__generated__.classification_evaluator_configs` 以獲取結構良好的評估提示詞範例（Faithfulness, Correctness, DocumentRelevance 等）。
