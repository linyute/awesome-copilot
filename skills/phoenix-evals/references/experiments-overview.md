# 實驗：概觀

使用資料集、任務和評估器對 AI 系統進行系統化測試。

## 結構

```
資料集 (DATASET)     → 範例：{input, expected_output, metadata}
任務 (TASK)        → 函式 (input) → 輸出 (output)
評估器 (EVALUATORS)  → (input, output, expected) → 分數 (score)
實驗 (EXPERIMENT)  → 在所有範例上執行任務，對結果評分
```

## 基本用法

```python
from phoenix.client import Client

client = Client()
experiment = client.experiments.run_experiment(
    dataset=my_dataset,
    task=my_task,
    evaluators=[accuracy, faithfulness],
    experiment_name="improved-retrieval-v2",
)

print(experiment.aggregate_scores)
# {'accuracy': 0.85, 'faithfulness': 0.92}
```

## 工作流程

1. **建立資料集** - 來自追蹤、合成資料或人工整理
2. **定義任務** - 要測試的函式 (您的 LLM 流程)
3. **選擇評估器** - 基於程式碼及/或 LLM
4. **執行實驗** - 執行並評分
5. **分析與迭代** - 檢視、修改任務、重新執行

## 試執行 (Dry Runs)

在完整執行前測試設定：

```python
experiment = client.experiments.run_experiment(
    dataset=dataset,
    task=task,
    evaluators=evaluators,
    dry_run=3,
)  # 僅測試 3 個範例
```

## 非同步用法

當您的任務或評估器進行網路呼叫且您想要更高的傳輸量時，請使用 `AsyncClient`：

```python
from phoenix.client import AsyncClient

client = AsyncClient()
experiment = await client.experiments.run_experiment(
    dataset=my_dataset,
    task=my_async_task,
    evaluators=[accuracy, faithfulness],
    experiment_name="improved-retrieval-v2",
)
```

## 最佳實踐

- **有意義的命名**：例如 `"improved-retrieval-v2-2024-01-15"`，而不是 `"test"`
- **資料集版本化**：不要修改現有的資料集
- **多個評估器**：結合不同的觀點
