# Testing API 參考

> 自動從 pixie 原始碼 docstrings 產生。
> 請勿手動編輯 — 請從上游 [pixie-qa](https://github.com/yiouli/pixie-qa) 原始碼存放庫重新產生。

pixie.evals — LLM 應用程式的評估工具。

公開 API: - `Evaluation` — 單次評估器執行的結果資料類別 - `Evaluator` — 評估呼叫介面協定 - `evaluate` — 針對一個可評估物件執行一個評估器 - `run_and_evaluate` — 評估來自 MemoryTraceHandler 的 spans - `assert_pass` — 具備通過/失敗條件的批次評估 - `assert_dataset_pass` — 載入資料集並執行 assert_pass - `EvalAssertionError` — 當 assert_pass 失敗時拋出 - `capture_traces` — 記憶體內 trace 擷取的 context manager - `MemoryTraceHandler` — 收集 spans 的 InstrumentationHandler - `ScoreThreshold` — 可設定的通過標準 - `last_llm_call` / `root` — trace 轉可評估物件的輔助函式 - `DatasetEntryResult` — 單一資料集項目的評估結果 - `DatasetScorecard` — 每個資料集的計分卡，包含非一致的評估器 - `generate_dataset_scorecard_html` — 將計分卡轉成 HTML - `save_dataset_scorecard` — 將計分卡 HTML 儲存到磁碟

內建評估器 (autoevals 配接器): - `AutoevalsAdapter` — 任何 autoevals `Scorer` 的通用包裝器 - `LevenshteinMatch` — 編輯距離字串相似度 - `ExactMatch` — 精確值比較 - `NumericDiff` — 正規化數值差異 - `JSONDiff` — 結構化 JSON 比較 - `ValidJSON` — JSON 語法 / schema 驗證 - `ListContains` — 列表重疊 - `EmbeddingSimilarity` — 嵌入向量餘弦相似度 - `Factuality` — LLM 事實正確性檢查 - `ClosedQA` — 閉卷問答評估 - `Battle` — 二對二比較 - `Humor` — 幽默偵測 - `Security` — 安全漏洞檢查 - `Sql` — SQL 等價性 - `Summary` — 摘要品質 - `Translation` — 翻譯品質 - `Possible` — 可行性檢查 - `Moderation` — 內容審核 - `ContextRelevancy` — RAGAS 上下文相關性 - `Faithfulness` — RAGAS 忠實度 - `AnswerRelevancy` — RAGAS 答案相關性 - `AnswerCorrectness` — RAGAS 答案正確性

## 資料集 JSON 格式

資料集是一個包含這些頂層欄位的 JSON 物件：

```json
{
  "name": "customer-faq",
  "runnable": "pixie_qa/scripts/run_app.py:AppRunnable",
  "evaluators": ["Factuality"],
  "entries": [
    {
      "entry_kwargs": { "question": "Hello" },
      "description": "基本問候",
      "eval_input": [{ "name": "input", "value": "Hello" }],
      "expectation": "友好的問候並提供協助",
      "evaluators": ["...", "ClosedQA"]
    }
  ]
}
```

### 項目結構

所有欄位都在每個項目的頂層（扁平結構 — 無嵌套）：

```
entry:
  ├── entry_kwargs    (必填) — Runnable.run() 的引數
  ├── eval_input      (必填) — {"name": ..., "value": ...} 物件列表
  ├── description     (必填) — 測試案例的人類可讀標籤
  ├── expectation     (選填) — 基於比較的評估器的參考資料
  ├── eval_metadata   (選填) — 自訂評估器的額外每個項目資料
  └── evaluators      (選填) — 此項目的評估器名稱
```

### 欄位參考

- `runnable` (必填): 指向 `Runnable` 子類別的 `filepath:ClassName` 參考，在評估期間驅動應用程式。
- `evaluators` (資料集級別，選填): 預設評估器名稱 — 套用到每個未宣告自己 `evaluators` 的項目。
- `entries[].entry_kwargs` (必填): 作為 Pydantic 模型傳遞給 `Runnable.run()` 的關鍵字引數。鍵必須與 `run(args: T)` 中使用的 Pydantic 模型欄位匹配。
- `entries[].description` (必填): 測試案例的人類可讀標籤。
- `entries[].eval_input` (必填): `{"name": ..., "value": ...}` 物件列表。用於填充 wrap 輸入註冊表 — 應用程式中的 `wrap(purpose="input")` 呼叫會根據 `name` 傳回註冊表值。
- `entries[].expectation` (選填): 基於比較的評估器的簡潔預期描述。應描述正確輸出的樣貌，**不要**複製逐字輸出。在 trace 上使用 `pixie format` 檢視實際輸出形狀，然後編寫較短的描述。
- `entries[].eval_metadata` (選填): 自訂評估器的額外每個項目資料 — 例如，預期的工具名稱、布林旗標、閥值。在評估器中透過 `evaluable.eval_metadata` 存取。
- `entries[].evaluators` (選填): 項目級別評估器覆蓋。規則：
  - 省略 → 項目繼承資料集級別的 `evaluators`。
  - `["...", "ClosedQA"]` → 資料集預設值**加上** ClosedQA。
  - `["OnlyThis"]` (無 `"..."`) → **僅** OnlyThis，無預設值。

## 評估器名稱解析

在資料集 JSON 中，評估器名稱的解析如下：

- **內建名稱** (如 `"Factuality"`, `"ExactMatch"` 等裸名) 會自動解析為 `pixie.{Name}`。
- **自訂評估器** 使用 `filepath:callable_name` 格式 (例如 `"pixie_qa/evaluators.py:my_evaluator"`)。
- 自訂評估器參考指向模組級別的可呼叫物件 — 類別 (自動實體化)、工廠函式 (如果無引數則呼叫)、評估器函式 (按原樣使用) 或預先實體化的可呼叫物件 (例如 `create_llm_evaluator` 的結果 — 按原樣使用)。

## CLI 指令

| 指令                                        | 描述                                  |
| ------------------------------------------- | ------------------------------------- |
| `pixie test [path] [-v] [--no-open]`        | 在資料集檔案上執行評估測試            |
| `pixie dataset create <name>`               | 建立一個新的空資料集                  |
| `pixie dataset list`                        | 列出所有資料集                        |
| `pixie dataset save <name> [--select MODE]` | 將一個 span 儲存到資料集              |
| `pixie dataset validate [path]`             | 驗證資料集 JSON 檔案                  |
| `pixie analyze <test_run_id>`               | 產生分析與建議                        |

---

## 類別

### `Evaluable`

```python
class Evaluable(TestCase):
    eval_output: list[NamedData]      # wrap(purpose="output") + wrap(purpose="state") 的值
    # 繼承自 TestCase:
    # eval_input: list[NamedData]     # 來自資料集項目中的 eval_input
    # expectation: JsonValue | _Unset # 來自資料集項目中的 expectation
    # eval_metadata: dict[str, JsonValue] | None  # 來自資料集項目中的 eval_metadata
    # description: str | None
```

評估器的資料載體。使用實際輸出擴展 `TestCase`。

- `eval_input` — 由項目 `eval_input` 欄位填充的 `list[NamedData]`。**必須至少包含一個項目** (`min_length=1`)。
- `eval_output` — 包含執行期間擷取到的所有 `wrap(purpose="output")` 和 `wrap(purpose="state")` 值的 `list[NamedData]`。每個項目都有 `.name` (str) 和 `.value` (JsonValue)。使用 `_get_output(evaluable, "name")` 依據名稱尋找。
- `eval_metadata` — 來自項目 `eval_metadata` 欄位的 `dict[str, JsonValue] | None`。
- `expected_output` — 來自資料集的預期文字 (如果未提供則為 `UNSET`)。

屬性:
eval_input: 具名的輸入資料項目 (來自資料集)。必須為非空。
eval_output: 具名的輸出資料項目 (來自執行期間的 wrap 呼叫)。
每個項目都有 `.name` (str) 和 `.value` (JsonValue)。
包含所有 `wrap(purpose="output")` 和 `wrap(purpose="state")` 的值。
eval_metadata: 補充 Metadata (缺失時為 `None`)。
expected_output: 評估用的預期/參考輸出。
預設為 `UNSET` (未提供)。可明確設定為 `None` 以表示「沒有預期輸出」。

### `wrap()` 在測試時如何對應到 `Evaluable` 欄位

當 `pixie test` 執行資料集項目時，應用程式中的 `wrap()` 呼叫會填充評估器接收到的 `Evaluable`：

| 應用程式程式碼中的 `wrap()` 呼叫         | Evaluable 欄位    | 類型              | 如何在評估器中存取                                   |
| ---------------------------------------- | ----------------- | ----------------- | ---------------------------------------------------- |
| `wrap(data, purpose="input", name="X")`  | `eval_input`      | `list[NamedData]` | 預先從資料集項目中的 `eval_input` 填充               |
| `wrap(data, purpose="output", name="X")` | `eval_output`     | `list[NamedData]` | `_get_output(evaluable, "X")` — 請參閱下方的輔助函式 |
| `wrap(data, purpose="state", name="X")`  | `eval_output`     | `list[NamedData]` | `_get_output(evaluable, "X")` — 與 output 相同的列表 |
| (來自資料集項目 `expectation`)           | `expected_output` | `str \| None`     | `evaluable.expected_output`                          |
| (來自資料集項目 `eval_metadata`)         | `eval_metadata`   | `dict \| None`    | `evaluable.eval_metadata`                            |

**核心觀點**: `purpose="output"` 和 `purpose="state"` 的 wrap 值最終都會作為 `NamedData` 項目進入 `eval_output`。沒有單獨的 `captured_output` 或 `captured_state` 字典。請使用下方的輔助函式依據 wrap 名稱尋找值：

```python
def _get_output(evaluable: Evaluable, name: str) -> Any:
    """從 eval_output 中依據名稱尋找 wrap 值。"""
    for item in evaluable.eval_output:
        if item.name == name:
            return item.value
    return None
```

**`eval_metadata`** 用於向評估器傳遞額外的每個項目資料，這些資料不是應用程式的輸入或輸出 — e.g.，預期的工具名稱、布林旗標、閥值。定義為項目上的頂層欄位，透過 `evaluable.eval_metadata` 存取。

**完整自訂評估器範例** (工具呼叫檢查 + 資料集項目)：

```python
from pixie import Evaluation, Evaluable

def _get_output(evaluable: Evaluable, name: str) -> Any:
    """從 eval_output 中依據名稱尋找 wrap 值。"""
    for item in evaluable.eval_output:
        if item.name == name:
            return item.value
    return None

def tool_call_check(evaluable: Evaluable, *, trace=None) -> Evaluation:
    expected = evaluable.eval_metadata.get("expected_tool") if evaluable.eval_metadata else None
    actual = _get_output(evaluable, "function_called")
    if expected is None:
        return Evaluation(score=1.0, reasoning="未指定 expected_tool")
    match = str(actual) == str(expected)
    return Evaluation(
        score=1.0 if match else 0.0,
        reasoning=f"預期為 {expected}，得到 {actual}",
    )
```

對應的資料集項目：

```json
{
  "entry_kwargs": { "user_message": "我想結束這通通話" },
  "description": "使用者在驗證失敗後要求結束通話",
  "eval_input": [{ "name": "user_input", "value": "我想結束這通通話" }],
  "expectation": "代理程式應呼叫 endCall 工具",
  "eval_metadata": {
    "expected_tool": "endCall",
    "expected_call_ended": true
  },
  "evaluators": ["...", "pixie_qa/evaluators.py:tool_call_check"]
}
```

### `Evaluation`

```python
Evaluation(score: 'float', reasoning: 'str', details: 'dict[str, Any]' = <factory>) -> None
```

應用於單一測試案例的單一評估器結果。

屬性:
score: 評估分數，介於 0.0 和 1.0 之間。
reasoning: 人類可讀的解釋 (必填)。
details: 任意 JSON 可序列化的 Metadata。

### `ScoreThreshold`

```python
ScoreThreshold(threshold: 'float' = 0.5, pct: 'float' = 1.0) -> None
```

通過標準: _pct_ 比例的輸入在所有評估器上的得分必須 >= _threshold_。

屬性:
threshold: 單個評估必須達到的最低分數。
pct: 必須通過的測試案例輸入比例 (0.0–1.0)。

## 評估函式

### `pixie.run_and_evaluate`

```python
pixie.run_and_evaluate(evaluator: 'Callable[..., Any]', runnable: 'Callable[..., Any]', eval_input: 'Any', *, expected_output: 'Any' = <object object at 0x7788c2ad5c80>, from_trace: 'Callable[[list[ObservationNode]], Evaluable] | None' = None) -> 'Evaluation'
```

執行 _runnable(eval_input)_ 並擷取 trace，然後進行評估。

結合了 `_run_and_capture` 與 `evaluate` 的便利包裝器。
runnable 會被精確呼叫一次。

引數:
evaluator: 評估器可呼叫物件 (同步或非同步)。
runnable: 要測試的應用程式函式。
eval_input: 傳遞給 _runnable_ 的單一輸入。
expected_output: 選填，合併到可評估物件中的預期值。
from_trace: 選填，從 trace 樹中選取特定 span 進行評估的可呼叫物件。

傳回:
`Evaluation` 結果。

拋出:
ValueError: 如果執行期間未擷取到任何 span。

### `pixie.assert_pass`

```python
pixie.assert_pass(runnable: 'Callable[..., Any]', eval_inputs: 'list[Any]', evaluators: 'list[Callable[..., Any]]', *, evaluables: 'list[Evaluable] | None' = None, pass_criteria: 'Callable[[list[list[Evaluation]]], tuple[bool, str]] | None' = None, from_trace: 'Callable[[list[ObservationNode]], Evaluable] | None' = None) -> 'None'
```

針對多個輸入，對一個 runnable 執行評估器。

對於每個輸入，透過 `_run_and_capture` 執行一次 runnable，
然後透過 `asyncio.gather` 同時使用每個評估器進行評估。

結果矩陣的形狀為 `[eval_inputs][evaluators]`。
如果不符合通過標準，則拋出包含該矩陣的 :class:`EvalAssertionError`。

當提供 `evaluables` 時，行為取決於每個項目是否已填充 `eval_output`：

- **eval_output 為 None** — 透過 `run_and_evaluate` 呼叫 `runnable` 以從 trace 產生輸出，並將可評估物件中的 `expected_output` 合併到結果中。
- **eval_output 不為 None** — 直接使用該可評估物件 (不為該項目呼叫 runnable)。

引數:
runnable: 要測試的應用程式函式。
eval_inputs: 輸入列表，每個輸入都會傳遞給 _runnable_。
evaluators: 評估器可呼叫物件的列表。
evaluables: 選填的 `Evaluable` 項目列表，每個輸入對應一個。
提供時，它們的 `expected_output` 會轉發給
`run_and_evaluate`。長度必須與
_eval_inputs_ 相同。
pass_criteria: 接收結果矩陣，並傳回
`(passed, message)`。預設為 `ScoreThreshold()`。
from_trace: 選填，轉發給 `run_and_evaluate` 的 span 選取器。

拋出:
EvalAssertionError: 當不符合通過標準時。
ValueError: 當 _evaluables_ 長度與 _eval_inputs_ 不符時。

### `pixie.assert_dataset_pass`

```python
pixie.assert_dataset_pass(runnable: 'Callable[..., Any]', dataset_name: 'str', evaluators: 'list[Callable[..., Any]]', *, dataset_dir: 'str | None' = None, pass_criteria: 'Callable[[list[list[Evaluation]]], tuple[bool, str]] | None' = None, from_trace: 'Callable[[list[ObservationNode]], Evaluable] | None' = None) -> 'None'
```

按名稱載入資料集，然後使用其中的項目執行 `assert_pass`。

這是一個便利包裝器，其執行內容如下：

1. 從 `DatasetStore` 載入資料集。
2. 從每個項目中擷取 `eval_input` 作為 runnable 的輸入。
3. 使用完整的 `Evaluable` 項目 (帶有 `expected_output`) 作為可評估物件。
4. 委派給 `assert_pass`。

引數:
runnable: 要測試的應用程式函式。
dataset_name: 要載入的資料集名稱。
evaluators: 評估器可呼叫物件列表。
dataset_dir: 覆寫資料集儲存庫的目錄。
若為 `None`，則從 `PixieConfig.dataset_dir` 讀取。
pass_criteria: 接收結果矩陣，並傳回 `(passed, message)`。
from_trace: 選填，轉發給 `assert_pass` 的 span 選取器。

拋出:
FileNotFoundError: 如果不存在名稱為 _dataset_name_ 的資料集。
EvalAssertionError: 當不符合通過標準時。

## Trace 輔助函式

### `pixie.last_llm_call`

```python
pixie.last_llm_call(trace: 'list[ObservationNode]') -> 'Evaluable'
```

在 trace 樹中尋找具有最新 `ended_at` 的 `LLMSpan`。

引數:
trace: trace 樹 (根 `ObservationNode` 實例列表)。

傳回:
包裝了最近結束之 `LLMSpan` 的 `Evaluable`。

拋出:
ValueError: 如果 trace 中不存在 `LLMSpan`。

### `pixie.root`

```python
pixie.root(trace: 'list[ObservationNode]') -> 'Evaluable'
```

將第一個根節點的 span 作為 `Evaluable` 傳回。

引數:
trace: trace 樹 (根 `ObservationNode` 實例列表)。

傳回:
包裝了第一個根節點 span 的 `Evaluable`。

拋出:
ValueError: 如果 trace 為空。

### `pixie.capture_traces`

```python
pixie.capture_traces() -> 'Generator[MemoryTraceHandler, None, None]'
```

安裝並產生 `MemoryTraceHandler` 的 context manager。

呼叫 `init()` (如果已初始化則不執行任何操作)，然後透過 `add_handler()` 註冊處理常式。結束時會移除處理常式並排空傳送佇列，以便所有 spans 都能在 `handler.spans` 中使用。
