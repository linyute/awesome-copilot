# 使用 evaluate_dataframe 進行批次評估 (Python) (Batch Evaluation with evaluate_dataframe (Python))

跨 DataFrame 執行評估者。這是核心的 2.0 批次評估 API。

## 優先建議：async_evaluate_dataframe (Preferred: async_evaluate_dataframe)

對於批次評估（特別是使用 LLM 評估者時），優先建議使用非同步版本以獲得更好的輸送量：

```python
from phoenix.evals import async_evaluate_dataframe

results_df = await async_evaluate_dataframe(
    dataframe=df,              # pandas DataFrame，其資料欄位須與評估者參數匹配
    evaluators=[eval1, eval2], # 評估者清單
    concurrency=5,             # 最大並行 LLM 呼叫數（預設為 3）
    exit_on_error=False,       # 選填：是否在發生第一個錯誤時停止（預設為 True）
    max_retries=3,             # 選填：失敗的 LLM 呼叫重試次數（預設為 10）
)
```

## 同步版本 (Sync Version)

```python
from phoenix.evals import evaluate_dataframe

results_df = evaluate_dataframe(
    dataframe=df,              # pandas DataFrame，其資料欄位須與評估者參數匹配
    evaluators=[eval1, eval2], # 評估者清單
    exit_on_error=False,       # 選填：是否在發生第一個錯誤時停止（預設為 True）
    max_retries=3,             # 選填：失敗的 LLM 呼叫重試次數（預設為 10）
)
```

## 結果資料欄格式 (Result Column Format)

`async_evaluate_dataframe` / `evaluate_dataframe` 會傳回輸入 DataFrame 的複本並新增資料欄。
**結果資料欄包含字典 (dicts)，而非原始數值。**

對於名為 `"foo"` 的每個評估者，會新增兩個資料欄：

| 資料欄 | 類型 | 內容 |
| ------ | ---- | -------- |
| `foo_score` | `dict` | `{"name": "foo", "score": 1.0, "label": "True", "explanation": "...", "metadata": {...}, "kind": "code", "direction": "maximize"}` |
| `foo_execution_details` | `dict` | `{"status": "success", "exceptions": [], "execution_seconds": 0.001}` |

只有非 None 的欄位會出現在分數字典中。

### 擷取數值分數 (Extracting Numeric Scores)

```python
# 錯誤做法 — 這些會失敗或產生非預期結果
score = results_df["relevance"].mean()                    # KeyError!
score = results_df["relevance_score"].mean()              # 嘗試對字典取平均值！

# 正確做法 — 從每個字典中擷取數值分數
scores = results_df["relevance_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
mean_score = scores.mean()
```

### 擷取標籤 (Extracting Labels)

```python
labels = results_df["relevance_score"].apply(
    lambda x: x.get("label", "") if isinstance(x, dict) else ""
)
```

### 擷取解釋 (LLM 評估者) (Extracting Explanations (LLM evaluators))

```python
explanations = results_df["relevance_score"].apply(
    lambda x: x.get("explanation", "") if isinstance(x, dict) else ""
)
```

### 尋找失敗案例 (Finding Failures)

```python
scores = results_df["relevance_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
failed_mask = scores < 0.5
failures = results_df[failed_mask]
```

## 輸入映射 (Input Mapping)

評估者以字典形式接收每一列。資料欄名稱必須與評估者預期的參數名稱相符。如果不相符，請使用 `.bind()` 或 `bind_evaluator`：

```python
from phoenix.evals import bind_evaluator, create_evaluator, async_evaluate_dataframe

@create_evaluator(name="check", kind="code")
def check(response: str) -> bool:
    return len(response.strip()) > 0

# 選項 1：在評估者上使用 .bind() 方法
check.bind(input_mapping={"response": "answer"})
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[check])

# 選項 2：使用 bind_evaluator 函式
bound = bind_evaluator(evaluator=check, input_mapping={"response": "answer"})
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[bound])
```

或者直接重新命名資料欄以進行匹配：

```python
df = df.rename(columns={
    "attributes.input.value": "input",
    "attributes.output.value": "output",
})
```

## 絕不使用 run_evals (DO NOT use run_evals)

```python
# 錯誤做法 — 舊版 1.0 API
from phoenix.evals import run_evals
results = run_evals(dataframe=df, evaluators=[eval1])
# 傳回 List[DataFrame] — 每個評估者一個

# 正確做法 — 目前 2.0 API
from phoenix.evals import async_evaluate_dataframe
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[eval1])
# 傳回單一 DataFrame，合併了所有結果
```

主要差異：
- `run_evals` 傳回一個 DataFrame **清單**（每個評估者一個）
- `async_evaluate_dataframe` 傳回 **單一** DataFrame，合併了所有結果
- `async_evaluate_dataframe` 使用 `{name}_score` 字典資料欄格式
- `async_evaluate_dataframe` 使用 `bind_evaluator` 進行輸入映射（而非 `input_mapping=` 參數）
