# 實驗：Python 中的資料集

建立並管理評估資料集。

## 建立資料集

`create_dataset()` 執行更新 (upsert) 操作：如果已存在同名的資料集，它將在原地進行更新；使用相同的輸入重新執行則是無操作。

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

# 使用穩定的範例 ID，以便在多次上傳中進行鎖定更新
dataset = client.datasets.create_dataset(
    name="qa-test-v1",
    examples=[
        {
            "id": "q-001",                      # 穩定 ID — 伺服器會更新此列，而非插入
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
    split_key="split",        # 單一分割資料欄 (使用此欄位取代已過期的 split_keys)
    example_id_key="id",      # 包含穩定範例 ID 的資料欄
)
```

## 從生產追蹤建立

```python
spans_df = client.spans.get_spans_dataframe(project_identifier="my-app")

dataset = client.datasets.create_dataset(
    dataframe=spans_df[["input.value", "output.value"]],
    name="production-sample-v1",
    input_keys=["input.value"],
    output_keys=["output.value"],
)
```

## 擷取資料集

```python
dataset = client.datasets.get_dataset(name="qa-test-v1")
df = dataset.to_dataframe()
```

## 關鍵參數

| 參數 | 說明 |
| --------- | ----------- |
| `input_keys` | 工作輸入的資料欄 |
| `output_keys` | 預期輸出的資料欄 |
| `metadata_keys` | 額外的上下文資訊 |
| `example_id_key` | 具有穩定範例 ID 的資料欄；伺服器會更新相符的資料列，而非插入 |
| `split_key` | 用於分配分割的單一資料欄 (取代已過期的 `split_keys`) |
| `split_keys` | **已過期** — 請改用 `split_key` (單數) |

## 在實驗中使用評估器 (Evaluators)

### 評估器作為實驗評估器

將 phoenix-evals 評估器直接作為 `evaluators` 引數傳遞給 `run_experiment`：

```python
from functools import partial
from phoenix.client import AsyncClient
from phoenix.evals import ClassificationEvaluator, LLM, bind_evaluator

# 定義一個 LLM 評估器
refusal = ClassificationEvaluator(
    name="refusal",
    prompt_template="這是否為拒絕回答？\n問題：{{query}}\n回應：{{response}}",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"refusal": 0, "answer": 1},
)

# 進行繫結以將資料集資料欄對應至評估器參數
refusal_evaluator = bind_evaluator(refusal, {"query": "input.query", "response": "output"})

# 定義實驗任務
async def run_rag_task(input, rag_engine):
    return rag_engine.query(input["query"])

# 執行帶有評估器的實驗
experiment = await AsyncClient().experiments.run_experiment(
    dataset=ds,
    task=partial(run_rag_task, rag_engine=query_engine),
    experiment_name="baseline",
    evaluators=[refusal_evaluator],
    concurrency=10,
)
```

### 評估器作為任務 (中繼評估)

將 LLM 評估器用作實驗 **任務 (task)**，以根據真人標註來測試評估器本身：

```python
from phoenix.evals import create_evaluator

# 評估器本身即為受測任務
def run_refusal_eval(input, evaluator):
    result = evaluator.evaluate(input)
    return result[0]

# 一個簡單的啟發式方法，用於檢查判定結果與真人標註是否一致
@create_evaluator(name="exact_match")
def exact_match(output, expected):
    return float(output["score"]) == float(expected["refusal_score"])

# 執行：評估器為任務，exact_match 對其進行評估
experiment = await AsyncClient().experiments.run_experiment(
    dataset=annotated_dataset,
    task=partial(run_refusal_eval, evaluator=refusal),
    experiment_name="judge-v1",
    evaluators=[exact_match],
    concurrency=10,
)
```

此模式可讓您反覆修正評估器提示，直到它們與真人的判斷一致。
有關完整的工作範例，請參閱 `tutorials/evals/evals-2/evals_2.0_rag_demo.ipynb`。

## 最佳實務

- **預設使用更新 (Upsert)**：重新上傳至同一個名稱以進行原地更新；使用 `example_id_key` 讓伺服器鎖定特定資料列，而非將每次上傳都視為新資料
- **版本控制**：當您想要一個乾淨的快照而不僅僅是累加編輯時，請使用標記或新名稱 (例如 `qa-test-v2`) 進行版本控制
- **Metadata**：追蹤來源、類別、難度
- **平衡**：確保各種類別都有多樣化的涵蓋範圍
- **避免使用 `split_keys`**：請傳遞 `split_key` (單數) — `split_keys` 已過期，且會發出 `DeprecationWarning`
