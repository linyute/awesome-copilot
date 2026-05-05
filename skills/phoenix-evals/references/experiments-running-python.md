# 實驗：在 Python 中執行實驗 (Experiments: Running Experiments in Python)

使用 `run_experiment` 執行實驗。

## 基本用法 (Basic Usage)

```python
from phoenix.client import Client
from phoenix.client.experiments import run_experiment

client = Client()
dataset = client.datasets.get_dataset(name="qa-test-v1")

def my_task(example):
    return call_llm(example.input["question"])

def exact_match(output, expected):
    return 1.0 if output.strip().lower() == expected["answer"].strip().lower() else 0.0

experiment = run_experiment(
    dataset=dataset,
    task=my_task,
    evaluators=[exact_match],
    experiment_name="qa-experiment-v1",
)
```

## 任務函式 (Task Functions)

```python
# 基本任務
def task(example):
    return call_llm(example.input["question"])

# 帶有上下文 (RAG)
def rag_task(example):
    return call_llm(f"Context: {example.input['context']}\nQ: {example.input['question']}")
```

## 評估者參數 (Evaluator Parameters)

| 參數 | 存取對象 |
| --------- | ------ |
| `output` | 任務輸出 |
| `expected` | 範例的預期輸出 |
| `input` | 範例輸入 |
| `metadata` | 範例中介資料 |

## 選項 (Options)

```python
experiment = run_experiment(
    dataset=dataset,
    task=my_task,
    evaluators=evaluators,
    experiment_name="my-experiment",
    dry_run=3,       # 使用 3 個範例進行測試
    repetitions=3,   # 每個範例執行 3 次
)
```

## 結果 (Results)

```python
print(experiment.aggregate_scores)
# {'accuracy': 0.85, 'faithfulness': 0.92}

for run in experiment.runs:
    print(run.output, run.scores)
```

## 穩定性 (Stability)

當任務或評估者具備非確定性（例如 LLM 呼叫、工具使用、串流輸出或 LLM-as-judge）時，單次執行的分數會存在雜訊。在小型資料集上，這種每次執行的雜訊可能會掩蓋提示詞變更所帶來的訊號。

透過多次重複 (repetitions) 取平均值，可讓回報的分數反映提示詞本身，而非取樣雜訊：

```python
run_experiment(
    # ...
    repetitions=3,
)
```

考量因素：

- 當任務或評估者是 LLM 呼叫且資料集較小時，建議使用重複次數。
- 當每個範例的成本較低且您主要想穩定分數時，優先選擇重複次數；當您還需要涵蓋更多行為時，優先選擇擴大資料集。
- 當任務與評估者皆為確定性（例如與地面實況進行字串比對）時，請跳過重複次數 — 單次執行即為最終答案。

在以下情況考慮增加穩定性：

- 同一實驗的重複執行結果發生偏移，且偏移程度大於您試圖測量的差異。
- 提示詞變更導致範例標籤發生翻轉，但這種翻轉與輸出實際變化的方式不符。
- 評審在同一個輸出上的推理在不同執行之間讀起來有差異。

重複執行也是 `repetitions=1`（預設值）所默認依賴的機制 — 不要僅根據單次的 10 範例執行就做出調優決策。

## 稍後新增評估 (Add Evaluations Later)

```python
from phoenix.client.experiments import evaluate_experiment

evaluate_experiment(experiment=experiment, evaluators=[new_evaluator])
```
