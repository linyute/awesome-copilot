# pixie API 參考

## 設定

所有設定在呼叫時從環境變數讀取。預設情況下，
每個產物都位於單一的 `pixie_qa` 專案目錄中：

| 變數                | 預設值                     | 說明                       |
| ------------------- | -------------------------- | -------------------------- |
| `PIXIE_ROOT`        | `pixie_qa`                 | 所有產物的根目錄           |
| `PIXIE_DB_PATH`     | `pixie_qa/observations.db` | SQLite 資料庫檔案路徑      |
| `PIXIE_DB_ENGINE`   | `sqlite`                   | 資料庫引擎 (目前為 sqlite) |
| `PIXIE_DATASET_DIR` | `pixie_qa/datasets`        | 資料集 JSON 檔案的目錄     |

---

## 檢測 API (`pixie`)

```python
from pixie import enable_storage, observe, start_observation, flush, init, add_handler
```

| 函式 / 裝飾器       | 簽章                                                         | 備註                                                                                    |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `enable_storage()`  | `() → StorageHandler`                                        | 冪等性。建立資料庫，註冊處理常式。在應用程式啟動時呼叫。                                |
| `init()`            | `(*, capture_content=True, queue_size=1000) → None`          | 由 `enable_storage` 內部呼叫。冪等性。                                                  |
| `observe`           | `(name=None) → decorator`                                    | 包裝同步或非同步函式。將所有關鍵字引數擷取為 `eval_input`，傳回值擷取為 `eval_output`。 |
| `start_observation` | `(*, input, name=None) → ContextManager[ObservationContext]` | 手動範圍 (span)。在內部呼叫 `obs.set_output(v)` 和 `obs.set_metadata(key, value)`。     |
| `flush`             | `(timeout_seconds=5.0) → bool`                               | 清除佇列。在執行後、使用 CLI 命令前呼叫。                                               |
| `add_handler`       | `(handler) → None`                                           | 註冊自訂處理常式 (必須先呼叫 `init()`)。                                                |

---

## CLI 命令

```bash
# 資料集管理
pixie dataset create <name>
pixie dataset list
pixie dataset save <name>                              # 根範圍 (預設)
pixie dataset save <name> --select last_llm_call       # 最後一個 LLM 呼叫
pixie dataset save <name> --select by_name --span-name <name>
pixie dataset save <name> --notes "一些備註"
echo '"預期值"' | pixie dataset save <name> --expected-output

# 執行評估測試
pixie test [path] [-k filter_substring] [-v]
```

**`pixie dataset save` 選擇模式：**

- `root` (預設) — 最外層的 `@observe` 或 `start_observation` 範圍 (span)
- `last_llm_call` — 追蹤中最接近的 LLM API 呼叫範圍
- `by_name` — 符合 `--span-name` 引數的範圍 (採用最後一個匹配的範圍)

---

## 評估控底 (`pixie`)

```python
from pixie import (
    assert_dataset_pass, assert_pass, run_and_evaluate, evaluate,
    EvalAssertionError, Evaluation, ScoreThreshold,
    capture_traces, MemoryTraceHandler,
    last_llm_call, root,
)
```

### 關鍵函式

**`assert_dataset_pass(runnable, dataset_name, evaluators, *, dataset_dir=None, passes=1, pass_criteria=None, from_trace=None)`**

- 依名稱載入資料集，對所有項目執行 `assert_pass`。
- `runnable`：可呼叫項 `(eval_input) → None` (同步或非同步)。必須自行檢測。
- `evaluators`：評估器可呼叫項清單。
- `pass_criteria`：預設為 `ScoreThreshold()` (所有分數 >= 0.5)。
- `from_trace`：`last_llm_call` 或 `root` — 選擇要評估的範圍 (span)。

**`assert_pass(runnable, eval_inputs, evaluators, *, evaluables=None, passes=1, pass_criteria=None, from_trace=None)`**

- 同上，但採用明確的輸入 (以及可選的 `Evaluable` 項目作為預期輸出)。

**`run_and_evaluate(evaluator, runnable, eval_input, *, expected_output=..., from_trace=None)`**

- 執行 `runnable(eval_input)`，擷取追蹤並評估。傳回一個 `Evaluation`。

**`ScoreThreshold(threshold=0.5, pct=1.0)`**

- `threshold`：每個項目的最低分數 (預設為 0.5)。
- `pct`：必須符合閾值的項目比例 (預設為 1.0 = 全部)。
- 範例：`ScoreThreshold(0.7, pct=0.8)` = 80% 的案例分數必須 ≥ 0.7。

**`Evaluation(score, reasoning, details={})`** — 凍結的結果。`score` 為 0.0–1.0。

**`capture_traces()`** — 上下文管理員；用於記憶體內追蹤擷取，無須資料庫。

**`last_llm_call(trace)`** / **`root(trace)`** — `from_trace` 輔助程式。

---

## 評估器

### 啟發式 (無需 LLM)

| 評估器                           | 使用時機                            |
| -------------------------------- | ----------------------------------- |
| `ExactMatchEval(expected=...)`   | 輸出必須與預期字串完全相同          |
| `LevenshteinMatch(expected=...)` | 部分字串相似度 (編輯距離)           |
| `NumericDiffEval(expected=...)`  | 標準化的數值差異                    |
| `JSONDiffEval(expected=...)`     | 結構化 JSON 比較                    |
| `ValidJSONEval(schema=None)`     | 輸出是有效的 JSON (可選符合 schema) |
| `ListContainsEval(expected=...)` | 輸出清單包含預期項目                |

### LLM 作為審判者 (需要 OpenAI 金鑰或相容的用戶端)

| 評估器                                                | 使用時機                         |
| ----------------------------------------------------- | -------------------------------- |
| `FactualityEval(expected=..., model=..., client=...)` | 輸出與參考內容相比，事實是否準確 |
| `ClosedQAEval(expected=..., model=..., client=...)`   | 閉卷 QA 比較                     |
| `SummaryEval(expected=..., model=..., client=...)`    | 摘要品質                         |
| `TranslationEval(expected=..., language=..., ...)`    | 翻譯品質                         |
| `PossibleEval(model=..., client=...)`                 | 輸出是否可行/合理                |
| `SecurityEval(model=..., client=...)`                 | 輸出中無安全性弱點               |
| `ModerationEval(threshold=..., client=...)`           | 內容審核                         |
| `BattleEval(expected=..., model=..., client=...)`     | 正面交鋒比較                     |

### RAG / 檢索

| 評估器                                            | 使用時機                     |
| ------------------------------------------------- | ---------------------------- |
| `ContextRelevancyEval(expected=..., client=...)`  | 檢索到的上下文是否與查詢相關 |
| `FaithfulnessEval(client=...)`                    | 回答是否忠於提供的上下文     |
| `AnswerRelevancyEval(client=...)`                 | 回答是否解決了問題           |
| `AnswerCorrectnessEval(expected=..., client=...)` | 回答與參考內容相比是否正確   |

### 自訂評估器範本

```python
from pixie import Evaluation, Evaluable

async def my_evaluator(evaluable: Evaluable, *, trace=None) -> Evaluation:
    # evaluable.eval_input  — 傳遞給被觀察函式的引數
    # evaluable.eval_output — 函式傳回的內容
    # evaluable.expected_output — 參考答案 (若未提供則為 UNSET)
    score = 1.0 if "expected pattern" in str(evaluable.eval_output) else 0.0
    return Evaluation(score=score, reasoning="...")
```

---

## 資料集 Python API

```python
from pixie import DatasetStore, Evaluable

store = DatasetStore()                               # 讀取 PIXIE_DATASET_DIR
store.create("my-dataset")                          # 建立空資料集
store.create("my-dataset", items=[...])             # 建立包含項目的資料集
store.append("my-dataset", Evaluable(...))          # 新增一個項目
store.get("my-dataset")                             # 傳回 Dataset
store.list()                                        # 列出名稱
store.remove("my-dataset", index=2)                 # 依索引移除
store.delete("my-dataset")                          # 完全刪除
```

**`Evaluable` 欄位：**

- `eval_input`：輸入 (`@observe` 擷取的函式關鍵字引數)
- `eval_output`：輸出 (被觀察函式的傳回值)
- `eval_metadata`：額外資訊的字典 (trace_id, span_id, provider, token 數量等) — 始終包含 `trace_id` 和 `span_id`
- `expected_output`：用於比較的參考答案 (若未提供則為 `UNSET`)

---

## ObservationStore Python API

```python
from pixie import ObservationStore

store = ObservationStore()   # 讀取 PIXIE_DB_PATH
await store.create_tables()

# 讀取追蹤
await store.list_traces(limit=10, offset=0)         # → 追蹤摘要清單
await store.get_trace(trace_id)                     # → list[ObservationNode] (樹狀結構)
await store.get_root(trace_id)                      # → 根 ObserveSpan
await store.get_last_llm(trace_id)                  # → 最近的 LLMSpan
await store.get_by_name(name, trace_id=None)        # → 範圍 (span) 清單

# ObservationNode
node.to_text()          # 美化列印範圍樹
node.find(name)         # 依名稱尋找子範圍
node.children           # 子 ObservationNode 清單
node.span               # 底層範圍 (ObserveSpan 或 LLMSpan)
```
