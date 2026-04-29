# 測試 API 參考

> 由 pixie 原始程式碼文件字串 (docstrings) 自動產生。
> 請勿手動編輯 — 請執行 `uv run python scripts/generate_skill_docs.py`。

pixie.evals — LLM 應用程式的評估控具 (Harness)。

公開 API： - `Evaluation` — 單個評估器執行的結果資料類別 - `Evaluator` — 評估可呼叫物件的協定 - `evaluate` — 針對單個可評估項執行一個評估器 - `run_and_evaluate` — 評估來自 MemoryTraceHandler 的 Span - `assert_pass` — 具備通過/失敗標準的批次評估 - `assert_dataset_pass` — 載入資料集並執行 assert_pass - `EvalAssertionError` — 當 assert_pass 失敗時拋出 - `capture_traces` — 用於記憶體內追蹤擷取的內容管理器 (Context manager) - `MemoryTraceHandler` — 收集 Span 的 InstrumentationHandler - `ScoreThreshold` — 可配置的通過標準 - `last_llm_call` / `root` — 追蹤到可評估項的輔助工具 - `DatasetEntryResult` — 單個資料集項目的評估結果 - `DatasetScorecard` — 具有非統一評估器的每資料集計分卡 - `generate_dataset_scorecard_html` — 將計分卡渲染為 HTML - `save_dataset_scorecard` — 將計分卡 HTML 儲存到磁碟

內建評估器 (Autoevals 配接器)： - `AutoevalsAdapter` — 任何 autoevals `Scorer` 的通用包裝器 - `LevenshteinMatch` — 編輯距離字串相似度 - `ExactMatch` — 精確值比較 - `NumericDiff` — 標準化數值差異 - `JSONDiff` — 結構化 JSON 比較 - `ValidJSON` — JSON 語法 / 結構描述驗證 - `ListContains` — 列表重疊度 - `EmbeddingSimilarity` — 嵌入向量餘弦相似度 - `Factuality` — LLM 事實準確性檢查 - `ClosedQA` — 閉卷 QA 評估 - `Battle` — 正面交鋒 (Head-to-head) 比較 - `Humor` — 幽默偵測 - `Security` — 安全漏洞檢查 - `Sql` — SQL 等效性 - `Summary` — 摘要品質 - `Translation` — 翻譯品質 - `Possible` — 可行性檢查 - `Moderation` — 內容審核 - `ContextRelevancy` — RAGAS 背景相關性 - `Faithfulness` — RAGAS 忠實度 - `AnswerRelevancy` — RAGAS 答案相關性 - `AnswerCorrectness` — RAGAS 答案正確性

## 資料集 JSON 格式

資料集是一個包含以下頂層欄位的 JSON 物件：

```json
{
  "name": "customer-faq",
  "runnable": "pixie_qa/run_app.py:AppRunnable",
  "evaluators": ["Factuality"],
  "entries": [
    {
      "input_data": { "question": "Hello" },
      "description": "Basic greeting",
      "eval_input": [{ "name": "input", "value": "Hello" }],
      "expectation": "A friendly greeting that offers to help",
      "evaluators": ["...", "ClosedQA"]
    }
  ]
}
```

### 項目結構

每個項目中的所有欄位都是頂層的（扁平結構 — 無巢狀）：

```
entry:
  ├── input_data    (必要) — Runnable.run() 的參數
  ├── eval_input      (選用) — {"name": ..., "value": ...} 物件列表 (預設：[])
  ├── description     (必要) — 測試案例的人讀標籤
  ├── expectation     (選用) — 基於比較的評估器的參考資料
  ├── eval_metadata   (選用) — 自訂評估器的額外每項目資料
  └── evaluators      (選用) — 此項目的評估器名稱
```

### 欄位參考

- `runnable` (必要)：指向評估期間驅動應用程式的 `Runnable` 子類別的 `filepath:ClassName` 參考。路徑相對於專案根目錄。
- `evaluators` (資料集層級，選用)：預設評估器名稱 — 套用到每個未宣告自身 `evaluators` 的項目。
- `entries[].input_data` (必要)：作為 Pydantic 模型傳遞給 `Runnable.run()` 的關鍵字參數 (Kwargs)。鍵值必須與 `run(args: T)` 中使用的 Pydantic 模型欄位匹配。
- `entries[].description` (必要)：測試案例的人讀標籤。
- `entries[].eval_input` (選用，預設 `[]`)：`{"name": ..., "value": ...}` 物件列表。用於填充 Wrap 輸入註冊表 — 應用程式中的 `wrap(purpose="input")` 呼叫會回傳以 `name` 為鍵的註冊表值。執行器在建立 `Evaluable` 時會自動在前面加上 `input_data`。
- `entries[].expectation` (選用)：基於比較的評估器的簡潔預期說明。應描述正確的輸出應長什麼樣子，而不是複製逐字輸出。在追蹤上使用 `pixie format` 以查看真實輸出形狀，然後編寫較短的說明。
- `entries[].eval_metadata` (選用)：自訂評估器的額外每項目資料 — 例如：預期的工具名稱、布林旗標、閾值。在評估器中透過 `evaluable.eval_metadata` 存取。
- `entries[].evaluators` (選用)：資料列層級的評估器覆蓋。規則：
  - 省略 → 項目繼承資料集層級的 `evaluators`。
  - `["...", "ClosedQA"]` → 資料集預設值**加上** ClosedQA。
  - `["OnlyThis"]` (無 `"..."`) → **僅限** OnlyThis，不包含預設值。

## 評估器名稱解析

在資料集 JSON 中，評估器名稱解析如下：

- **內建名稱**（如 `"Factuality"`、`"ExactMatch"` 等裸名）會自動解析為 `pixie.{Name}`。
- **自訂評估器**使用 `filepath:callable_name` 格式（例如 `"pixie_qa/evaluators.py:my_evaluator"`）。
- 自訂評估器參考指向模組級的可呼叫物件 — 類別（自動實例化）、工廠函式（若為零參數則呼叫）、評估器函式（原樣使用）或預先實例化的可呼叫物件（例如 `create_llm_evaluator` 的結果 — 原樣使用）。

## CLI 命令

| 命令 | 說明 |
| ------------------------------------------- | ------------------------------------- |
| `pixie test [path] [-v] [--no-open]` | 對資料集檔案執行評估測試 |
| `pixie dataset create <name>` | 建立一個新的空資料集 |
| `pixie dataset list` | 列出所有資料集 |
| `pixie dataset save <name> [--select MODE]` | 將一個 Span 儲存到資料集 |
| `pixie dataset validate [path]` | 驗證資料集 JSON 檔案 |
| `pixie analyze <test_run_id>` | 產生分析和建議 |

---

## 類型

### `Evaluable`

```python
class Evaluable(TestCase):
    eval_output: list[NamedData]      # wrap(purpose="output") + wrap(purpose="state") 值
    # 繼承自 TestCase:
    # eval_input: list[NamedData]     # 來自資料集項目中的 eval_input
    # expectation: JsonValue | _Unset # 來自資料集項目中的 expectation
    # eval_metadata: dict[str, JsonValue] | None  # 來自資料集項目中的 eval_metadata
    # description: str | None
```

評估器的資料載體。擴充 `TestCase` 並加入實際輸出。

- `eval_input` — `list[NamedData]`，由項目的 `eval_input` 欄位加上 `input_data`（由執行器在前面加上）組成。一律至少包含一個項目。
- `eval_output` — `list[NamedData]`，包含執行期間擷取的所有 `wrap(purpose="output")` 和 `wrap(purpose="state")` 值。每個項目都有 `.name` (str) 和 `.value` (JsonValue)。使用 `_get_output(evaluable, "name")` 依名稱尋找。
- `eval_metadata` — 來自項目 `eval_metadata` 欄位的 `dict[str, JsonValue] | None`。
- `expected_output` — 來自資料集的預期文字（若未提供則為 `UNSET`）。

屬性：
eval_input：命名的輸入資料項目（來自資料集 + 執行器預先加入的 input_data）。一律不為空。
eval_output：命名的輸出資料項目（來自執行期間的 Wrap 呼叫）。
每個項目都有 `.name` (str) 和 `.value` (JsonValue)。
包含所有的 `wrap(purpose="output")` 和 `wrap(purpose="state")` 值。
eval_metadata：補充 Metadata（缺失時為 `None`）。
expected_output：評估的預期/參考輸出。
預設為 `UNSET` (未提供)。可以明確
設定為 `None` 以表示「沒有預期輸出」。

### `wrap()` 如何在測試時對應到 `Evaluable` 欄位

當 `pixie test` 執行資料集項目時，應用程式中的 `wrap()` 呼叫會填充評估器收到的 `Evaluable`：

| 應用程式程式碼中的 `wrap()` 呼叫 | Evaluable 欄位 | 類型 | 如何在評估器中存取 |
| ---------------------------------------- | ----------------- | ----------------- | ---------------------------------------------------- |
| `wrap(data, purpose="input", name="X")` | `eval_input` | `list[NamedData]` | 已從資料集項目中的 `eval_input` 預先填充 |
| `wrap(data, purpose="output", name="X")` | `eval_output` | `list[NamedData]` | `_get_output(evaluable, "X")` — 參見下方輔助工具 |
| `wrap(data, purpose="state", name="X")` | `eval_output` | `list[NamedData]` | `_get_output(evaluable, "X")` — 與輸出同一個列表 |
| (來自資料集項目 `expectation`) | `expected_output` | `str \| None` | `evaluable.expected_output` |
| (來自資料集項目 `eval_metadata`) | `eval_metadata` | `dict \| None` | `evaluable.eval_metadata` |

**關鍵見解**：`purpose="output"` 和 `purpose="state"` 的 Wrap 值都會作為 `NamedData` 項目進入 `eval_output`。沒有單獨的 `captured_output` 或 `captured_state` 字典。使用下方的輔助函式依 Wrap 名稱尋找值：

```python
def _get_output(evaluable: Evaluable, name: str) -> Any:
    """從 eval_output 中依名稱尋找 Wrap 值。"""
    for item in evaluable.eval_output:
        if item.name == name:
            return item.value
    return None
```

**`eval_metadata`** 用於將不屬於輸入資料或輸出的額外每項目資料傳遞給評估器 — 例如：預期的工具名稱、布林旗標、閾值。定義為項目的頂層欄位，透過 `evaluable.eval_metadata` 存取。

**完整的自訂評估器範例**（工具呼叫檢查 + 資料集項目）：

```python
from pixie import Evaluation, Evaluable

def _get_output(evaluable: Evaluable, name: str) -> Any:
    """從 eval_output 中依名稱尋找 Wrap 值。"""
    for item in evaluable.eval_output:
        if item.name == name:
            return item.value
    return None

def tool_call_check(evaluable: Evaluable, *, trace=None) -> Evaluation:
    expected = evaluable.eval_metadata.get("expected_tool") if evaluable.eval_metadata else None
    actual = _get_output(evaluable, "function_called")
    if expected is None:
        return Evaluation(score=1.0, reasoning="No expected_tool specified")
    match = str(actual) == str(expected)
    return Evaluation(
        score=1.0 if match else 0.0,
        reasoning=f"Expected {expected}, got {actual}",
    )
```

對應的資料集項目：

```json
{
  "input_data": { "user_message": "I want to end this call" },
  "description": "User requests call end after failed verification",
  "eval_input": [{ "name": "user_input", "value": "I want to end this call" }],
  "expectation": "Agent should call endCall tool",
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

單個評估器應用於單個測試案例的結果。

屬性：
score：0.0 到 1.0 之間的評估分數。
reasoning：人讀說明（必要）。
details：任意 JSON 可序列化的 Metadata。

### `ScoreThreshold`

```python
ScoreThreshold(threshold: 'float' = 0.5, pct: 'float' = 1.0) -> None
```

通過標準：_pct_ 比例的輸入在所有評估器上的得分必須 >= _threshold_。

屬性：
threshold：單個評估必須達到的最低分數。
pct：必須通過的測試案例輸入比例 (0.0–1.0)。

## 評估函式

### `pixie.run_and_evaluate`

```python
pixie.run_and_evaluate(evaluator: 'Callable[..., Any]', runnable: 'Callable[..., Any]', eval_input: 'Any', *, expected_output: 'Any' = <object object at 0x7788c2ad5c80>, from_trace: 'Callable[[list[ObservationNode]], Evaluable] | None' = None) -> 'Evaluation'
```

執行 _runnable(eval_input)_ 的同時擷取追蹤，然後進行評估。

結合了 `_run_and_capture` 和 `evaluate` 的簡便包裝器。Runnable 僅被呼叫一次。

參數：
evaluator：評估器可呼叫物件（同步或異步）。
runnable：要測試的應用程式函式。
eval_input：傳遞給 _runnable_ 的單個輸入。
expected_output：合併到評估項中的選用預期值。
from_trace：從追蹤樹中選擇特定 Span 進行評估的選用可呼叫物件。

回傳值：
`Evaluation` 結果。

拋出：
ValueError：如果執行期間未擷取到任何 Span。

### `pixie.assert_pass`

```python
pixie.assert_pass(runnable: 'Callable[..., Any]', eval_inputs: 'list[Any]', evaluators: 'list[Callable[..., Any]]', *, evaluables: 'list[Evaluable] | None' = None, pass_criteria: 'Callable[[list[list[Evaluation]]], tuple[bool, str]] | None' = None, from_trace: 'Callable[[list[ObservationNode]], Evaluable] | None' = None) -> 'None'
```

對多個輸入執行針對一個 Runnable 的評估器。

對於每個輸入，透過 `_run_and_capture` 執行一次 Runnable，然後透過 `asyncio.gather` 並行使用每個評估器進行評估。

結果矩陣的形狀為 `[eval_inputs][evaluators]`。如果未滿足通過標準，則拋出攜帶該矩陣的 :class:`EvalAssertionError`。

當提供 `evaluables` 時，行為取決於每個項目是否已填充 `eval_output`：

- **eval_output 為 None** — 透過 `run_and_evaluate` 呼叫 `runnable` 以從追蹤產生輸出，且來自評估項的 `expected_output` 會合併到結果中。
- **eval_output 不為 None** — 直接使用評估項（不為該項目呼叫 Runnable）。

參數：
runnable：要測試的應用程式函式。
eval_inputs：輸入列表，每個都傳遞給 _runnable_。
evaluators：評估器可呼叫物件列表。
evaluables：選用的 `Evaluable` 項目列表，每個輸入一個。提供時，其 `expected_output` 會轉發給 `run_and_evaluate`。必須與 _eval_inputs_ 長度相同。
pass_criteria：接收結果矩陣，回傳 `(passed, message)`。預設為 `ScoreThreshold()`。
from_trace：轉發給 `run_and_evaluate` 的選用 Span 選擇器。

拋出：
EvalAssertionError：未滿足通過標準時。
ValueError：_evaluables_ 長度與 _eval_inputs_ 不符時。

### `pixie.assert_dataset_pass`

```python
pixie.assert_dataset_pass(runnable: 'Callable[..., Any]', dataset_name: 'str', evaluators: 'list[Callable[..., Any]]', *, dataset_dir: 'str | None' = None, pass_criteria: 'Callable[[list[list[Evaluation]]], tuple[bool, str]] | None' = None, from_trace: 'Callable[[list[ObservationNode]], Evaluable] | None' = None) -> 'None'
```

依名稱載入資料集，然後使用其項目執行 `assert_pass`。

這是一個簡便包裝器，執行以下操作：

1. 從 `DatasetStore` 載入資料集。
2. 從每個項目中擷取 `eval_input` 作為 Runnable 輸入。
3. 使用完整的 `Evaluable` 項目（攜帶 `expected_output`）作為評估項。
4. 委派給 `assert_pass`。

參數：
runnable：要測試的應用程式函式。
dataset_name：要載入的資料集名稱。
evaluators：評估器可呼叫物件列表。
dataset_dir：資料集儲存庫的覆蓋目錄。為 `None` 時，從 `PixieConfig.dataset_dir` 讀取。
pass_criteria：接收結果矩陣，回傳 `(passed, message)`。
from_trace：轉發給 `assert_pass` 的選用 Span 選擇器。

拋出：
FileNotFoundError：如果不存在名為 _dataset_name_ 的資料集。
EvalAssertionError：未滿足通過標準時。

## 追蹤輔助工具

### `pixie.last_llm_call`

```python
pixie.last_llm_call(trace: 'list[ObservationNode]') -> 'Evaluable'
```

在追蹤樹中尋找具有最新 `ended_at` 的 `LLMSpan`。

參數：
trace：追蹤樹（根 `ObservationNode` 實例列表）。

回傳值：
包裝最近結束的 `LLMSpan` 的 `Evaluable`。

拋出：
ValueError：如果追蹤中不存在 `LLMSpan`。

### `pixie.root`

```python
pixie.root(trace: 'list[ObservationNode]') -> 'Evaluable'
```

將第一個根節點的 Span 作為 `Evaluable` 回傳。

參數：
trace：追蹤樹（根 `ObservationNode` 實例列表）。

回傳值：
包裝第一個根節點 Span 的 `Evaluable`。

拋出：
ValueError：如果追蹤為空。

### `pixie.capture_traces`

```python
pixie.capture_traces() -> 'Generator[MemoryTraceHandler, None, None]'
```

安裝 `MemoryTraceHandler` 並產生它的內容管理器 (Context manager)。

呼叫 `init()`（若已初始化則無操作），然後透過 `add_handler()` 註冊處理程式。退出時移除處理程式並排清交付佇列，以便所有 Span 都能在 `handler.spans` 中使用。
