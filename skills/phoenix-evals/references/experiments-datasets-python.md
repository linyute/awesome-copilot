# 實驗：Python 中的資料集 (Experiments: Datasets in Python)

建立與管理評估資料集。

## 建立資料集 (Creating Datasets)

```python
from phoenix.client import Client

client = Client()

# 從範例建立
dataset = client.datasets.create_dataset(
    name="qa-test-v1",
    examples=[
        {
            "input": {"question": "2+2 等於多少？"},
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

## 來自生產環境追蹤 (From Production Traces)

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

## 關鍵參數 (Key Parameters)

| 參數 | 描述 |
| --------- | ----------- |
| `input_keys` | 用於任務輸入的資料欄 |
| `output_keys` | 用於預期輸出的資料欄 |
| `metadata_keys` | 額外的上下文資訊 |

## 在實驗中使用評估者 (Using Evaluators in Experiments)

### 將評估者作為實驗評估者 (Evaluators as experiment evaluators)

將 phoenix-evals 評估者作為 `evaluators` 引數直接傳遞給 `run_experiment`：

```python
from functools import partial
from phoenix.client import AsyncClient
from phoenix.evals import ClassificationEvaluator, LLM, bind_evaluator

# 定義一個 LLM 評估者
refusal = ClassificationEvaluator(
    name="refusal",
    prompt_template="這是否為拒絕回答？\n問題：{{query}}\n回應：{{response}}",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"refusal": 0, "answer": 1},
)

# 進行繫結以將資料集資料欄映射至評估者參數
refusal_evaluator = bind_evaluator(refusal, {"query": "input.query", "response": "output"})

# 定義實驗任務
async def run_rag_task(input, rag_engine):
    return rag_engine.query(input["query"])

# 執行帶有評估者的實驗
experiment = await AsyncClient().experiments.run_experiment(
    dataset=ds,
    task=partial(run_rag_task, rag_engine=query_engine),
    experiment_name="baseline",
    evaluators=[refusal_evaluator],
    concurrency=10,
)
```

### 將評估者作為任務（中介評估） (Evaluators as the task (meta evaluation))

將 LLM 評估者作為實驗的 **任務 (task)**，以針對人工標核測試評估者本身：

```python
from phoenix.evals import create_evaluator

# 評估者本身即為被測試的任務
def run_refusal_eval(input, evaluator):
    result = evaluator.evaluate(input)
    return result[0]

# 使用簡單的啟發式方法檢查評審與人工的一致性
@create_evaluator(name="exact_match")
def exact_match(output, expected):
    return float(output["score"]) == float(expected["refusal_score"])

# 執行：評估者為任務，使用 exact_match 進行評估
experiment = await AsyncClient().experiments.run_experiment(
    dataset=annotated_dataset,
    task=partial(run_refusal_eval, evaluator=refusal),
    experiment_name="judge-v1",
    evaluators=[exact_match],
    concurrency=10,
)
```

此模式可讓您迭代評估者提示詞，直到它們與人工判斷一致。完整範例請參閱 `tutorials/evals/evals-2/evals_2.0_rag_demo.ipynb`。

## 最佳實踐 (Best Practices)

- **版本管理**：建立新的資料集（例如 `qa-test-v2`），不要修改現有的。
- **中介資料 (Metadata)**：追蹤來源、類別、難度。
- **平衡性**：確保涵蓋各種類別。
