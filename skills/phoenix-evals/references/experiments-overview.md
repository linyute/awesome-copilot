# 實驗：總覽 (Overview)

使用資料集 (datasets)、任務 (tasks) 與評估器 (evaluators) 對 AI 系統進行系統化測試。

## 結構 (Structure)

```
資料集 (DATASET)     → 範例 (Examples)：{input, expected_output, metadata}
任務 (TASK)         → 函式 (function)(input) → output
評估器 (EVALUATORS)  → (input, output, expected) → score
實驗 (EXPERIMENT)    → 在所有範例上執行任務，並對結果評分
```

## 基本用法 (Basic Usage)

```python
from phoenix.client.experiments import run_experiment

experiment = run_experiment(
    dataset=my_dataset,
    task=my_task,
    evaluators=[accuracy, faithfulness],
    experiment_name="improved-retrieval-v2",
)

print(experiment.aggregate_scores)
# {'accuracy': 0.85, 'faithfulness': 0.92}
```

## 工作流程 (Workflow)

1. **建立資料集** - 從追蹤 (traces)、合成資料或手動彙整建立
2. **定義任務** - 要測試的函式（您的 LLM 管線）
3. **選擇評估器** - 基於程式碼及/或 LLM
4. **執行實驗** - 執行並評分
5. **分析與反覆調整** - 審查、修改任務、重新執行

## 測試執行 (Dry Runs)

在完整執行前測試設定：

```python
experiment = run_experiment(dataset, task, evaluators, dry_run=3)  # 僅執行 3 個範例
```

## 最佳實務 (Best Practices)

- **有意義的命名**：例如 `"improved-retrieval-v2-2024-01-15"`，而非 `"test"`
- **資料集版本控制**：不要修改現有的資料集
- **多個評估器**：結合不同的觀點
