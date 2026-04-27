# 實驗：Python 中的資料集 (Datasets)

建立與管理評估資料集。

## 建立資料集 (Creating Datasets)

```python
from phoenix.client import Client

client = Client()

# 從範例 (examples) 建立
dataset = client.datasets.create_dataset(
    name="qa-test-v1",
    examples=[
        {
            "input": {"question": "What is 2+2?"},
            "output": {"answer": "4"},
            "metadata": {"category": "math"},
        },
    ],
)

# 從 DataFrame 建立
dataset = client.datasets.create_dataset(
    dataframe=df,
    name="qa-test-v1",
    input_keys=["question"],
    output_keys=["answer"],
    metadata_keys=["category"],
)
```

## 從生產追蹤 (Production Traces) 建立

```python
spans_df = client.spans.get_spans_dataframe(project_identifier="my-app")

dataset = client.datasets.create_dataset(
    dataframe=spans_df[["input.value", "output.value"]],
    name="production-sample-v1",
    input_keys=["input.value"],
    output_keys=["output.value"],
)
```

## 擷取資料集 (Retrieving Datasets)

```python
dataset = client.datasets.get_dataset(name="qa-test-v1")
df = dataset.to_dataframe()
```

## 關鍵參數

| 參數 | 說明 |
| --------- | ----------- |
| `input_keys` | 用於任務輸入的欄位 |
| `output_keys` | 用於預期輸出的欄位 |
| `metadata_keys` | 額外的內容 (context) |

## 在實驗中使用評估器

### 評估器作為實驗評估器 (Evaluators as experiment evaluators)

將 phoenix-evals 評估器直接作為 `evaluators` 引數傳遞給 `run_experiment`：

```python
from functools import partial
from phoenix.client import AsyncClient
from phoenix.evals import ClassificationEvaluator, LLM, bind_evaluator

# 定義一個 LLM 評估器
refusal = ClassificationEvaluator(
    name="refusal",
    prompt_template="Is this a refusal?\nQuestion: {{query}}\nResponse: {{response}}",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"refusal": 0, "answer": 1},
)

# 綁定 (Bind) 以將資料集欄位映射到評估器參數
refusal_evaluator = bind_evaluator(refusal, {"query": "input.query", "response": "output"})

# 定義實驗任務
async def run_rag_task(input, rag_engine):
    return rag_engine.query(input["query"])

# 使用評估器執行實驗
experiment = await AsyncClient().experiments.run_experiment(
    dataset=ds,
    task=partial(run_rag_task, rag_engine=query_engine),
    experiment_name="baseline",
    evaluators=[refusal_evaluator],
    concurrency=10,
)
```

### 評估器作為任務 (Meta 評估)

將 LLM 評估器用作實驗**任務** (task)，以針對人類標註來測試評估器本身：

```python
from phoenix.evals import create_evaluator

# 評估器本身就是被測試的任務
def run_refusal_eval(input, evaluator):
    result = evaluator.evaluate(input)
    return result[0]

# 一個簡單的啟發式 (heuristic) 檢查裁判與人類的一致性
@create_evaluator(name="exact_match")
def exact_match(output, expected):
    return float(output["score"]) == float(expected["refusal_score"])

# 執行：評估器是任務，exact_match 則對其進行評估
experiment = await AsyncClient().experiments.run_experiment(
    dataset=annotated_dataset,
    task=partial(run_refusal_eval, evaluator=refusal),
    experiment_name="judge-v1",
    evaluators=[exact_match],
    concurrency=10,
)
```

此模式可讓您反覆調整評估器提示，直到它們與人類判斷一致。
請參閱 `tutorials/evals/evals-2/evals_2.0_rag_demo.ipynb` 以取得完整範例。

## 最佳實務 (Best Practices)

- **版本控制 (Versioning)**：建立新的資料集（例如 `qa-test-v2`），不要修改現有資料集
- **Metadata**：追蹤來源、類別與難易度
- **平衡**：確保各種類別都有多樣化的涵蓋範圍
