# 使用 evaluate_dataframe 進行批次評估 (Python)

在 DataFrame 上執行評估器。這是核心的 2.0 批次評估 API。

## 建議選用：async_evaluate_dataframe

對於批次評估（特別是使用 LLM 評估器時），建議優先使用非同步 (async) 版本，以獲得更好的吞吐量 (throughput)：

```python
from phoenix.evals import async_evaluate_dataframe

results_df = await async_evaluate_dataframe(
    dataframe=df,              # 欄位名稱與評估器參數相符的 pandas DataFrame
    evaluators=[eval1, eval2], # 評估器列表
    concurrency=5,             # 最大並行 LLM 呼叫次數 (預設為 3)
    exit_on_error=False,       # 選用：遇到第一個錯誤時停止 (預設為 True)
    max_retries=3,             # 選用：重試失敗的 LLM 呼叫 (預設為 10)
)
```

## 同步 (Sync) 版本

```python
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(
    dataframe=df,              # 欄位名稱與評估器參數相符的 pandas DataFrame
    evaluators=[eval1, eval2], # 評估器列表
    exit_on_error=False,       # 選用：遇到第一個錯誤時停止 (預設為 True)
    max_retries=3,             # 選用：重試失敗的 LLM 呼叫 (預設為 10)
)
```

## 結果欄位格式 (Result Column Format)

`async_evaluate_dataframe` / `evaluate_dataframe` 會回傳輸入 DataFrame 的副本，並新增相關欄位。
**結果欄位包含的是字典 (dicts)，而非原始數字。**

對於每個名為 `"foo"` 的評估器，會新增兩個欄位：

| 欄位 | 類型 | 內容 |
| ------ | ---- | -------- |
| `foo_score` | `dict` | `{"name": "foo", "score": 1.0, "label": "True", "explanation": "...", "metadata": {...}, "kind": "code", "direction": "maximize"}` |
| `foo_execution_details` | `dict` | `{"status": "success", "exceptions": [], "execution_seconds": 0.001}` |

只有非 None 的欄位會出現在分數字典中。

### 擷取數值分數

```python
# 錯誤 (WRONG) — 這些將會失敗或產生非預期的結果
score = results_df["relevance"].mean()                    # KeyError!
score = results_df["relevance_score"].mean()              # 嘗試對字典求平均值！

# 正確 (RIGHT) — 從每個字典中擷取數值分數
scores = results_df["relevance_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
mean_score = scores.mean()
```

### 擷取標籤 (Labels)

```python
labels = results_df["relevance_score"].apply(
    lambda x: x.get("label", "") if isinstance(x, dict) else ""
)
```

### 擷取解釋 (Explanations) (用於 LLM 評估器)

```python
explanations = results_df["relevance_score"].apply(
    lambda x: x.get("explanation", "") if isinstance(x, dict) else ""
)
```

### 尋找失敗個案 (Finding Failures)

```python
scores = results_df["relevance_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
failed_mask = scores < 0.5
failures = results_df[failed_mask]
```

## 輸入映射 (Input Mapping)

評估器會將每一列作為一個字典接收。欄位名稱必須與評估器預期的參數名稱相符。如果不相符，請使用 `.bind()` 或 `bind_evaluator`：

```python
from phoenix.evals import bind_evaluator, create_evaluator, async_evaluate_dataframe

@create_evaluator(name="check", kind="code")
def check(response: str) -> bool:
    return len(response.strip()) > 0

# 選項 1：在評估器上使用 .bind() 方法
check.bind(input_mapping={"response": "answer"})
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[check])

# 選項 2：使用 bind_evaluator 函式
bound = bind_evaluator(evaluator=check, input_mapping={"response": "answer"})
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[bound])
```

或者，只需重新命名欄位以符合名稱：

```python
df = df.rename(columns={
    "attributes.input.value": "input",
    "attributes.output.value": "output",
})
```

## 請勿使用 run_evals

```python
# 錯誤 (WRONG) — 舊版 1.0 API
from phoenix.evals import run_evals
results = run_evals(dataframe=df, evaluators=[eval1])
# 回傳 List[DataFrame] — 每個評估器一個 DataFrame

# 正確 (RIGHT) — 目前 2.0 API
from phoenix.evals import async_evaluate_dataframe
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[eval1])
# 回傳單一 DataFrame，其中包含 {name}_score 字典欄位
```

關鍵差異：
- `run_evals` 回傳一個 DataFrame **列表** (每個評估器一個)
- `async_evaluate_dataframe` 回傳**單一** DataFrame，並合併所有結果
- `async_evaluate_dataframe` 使用 `{name}_score` 字典欄位格式
- `async_evaluate_dataframe` 使用 `bind_evaluator` 進行輸入映射（而非 `input_mapping=` 參數）
