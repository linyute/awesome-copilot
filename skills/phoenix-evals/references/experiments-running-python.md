# 實驗：在 Python 中執行實驗 (Running Experiments)

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

# 包含內容 (context) (RAG)
def rag_task(example):
    return call_llm(f"Context: {example.input['context']}\nQ: {example.input['question']}")
```

## 評估器參數 (Evaluator Parameters)

| 參數 | 存取方式 |
| --------- | ------ |
| `output` | 任務輸出 |
| `expected` | 範例預期輸出 |
| `input` | 範例輸入 |
| `metadata` | 範例 Metadata |

## 選項 (Options)

```python
experiment = run_experiment(
    dataset=dataset,
    task=my_task,
    evaluators=evaluators,
    experiment_name="my-experiment",
    dry_run=3,       # 使用 3 個範例進行測試執行
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

## 稍後新增評估 (Add Evaluations Later)

```python
from phoenix.client.experiments import evaluate_experiment

evaluate_experiment(experiment=experiment, evaluators=[new_evaluator])
```
