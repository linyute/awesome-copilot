# 步驟 3：定義評估器

**為什麼要執行此步驟**：在應用程式已進行檢測（步驟 2）後，您現在將每個評估標準映射到具體的評估器——並在需要時實作自訂評估器——以便資料集（步驟 4）可以按名稱參考它們。

---

## 3a. 將標準映射到評估器

**來自步驟 1b 的每個評估標準——包括使用者在提示詞中指定的任何維度——都必須有對應的評估器。** 如果使用者要求「真實性、完整性和偏見」，您需要三個評估器（或一個涵蓋這三者的多標準評估器）。請勿默默地刪除任何要求的維度。

對於每個評估標準，決定如何進行評估：

- **是否可以使用內建評估器進行檢查？** （事實正確性 → `Factuality`，精確匹配 → `ExactMatch`，RAG 忠實度 → `Faithfulness`）
- **是否需要自訂評估器？** 大多數特定於應用程式的標準都需要——使用 `create_llm_evaluator` 並配合提示詞來執行該標準。
- **它是全域的還是特定於案例的？** 全域標準適用於所有資料集項目。特定於案例的標準僅適用於某些資料列。

對於開放式的 LLM 文字，**切勿**使用 `ExactMatch`——LLM 的輸出是非決定性的。

`AnswerRelevancy` **僅適用於 RAG**——它需要追蹤中的 `context`（上下文）值。如果沒有它，將傳回 0.0。對於不使用 RAG 的一般相關性，請使用帶有自訂提示詞的 `create_llm_evaluator`。

## 3b. 實作自訂評估器

如果任何標準需要自訂評估器，請立即實作。將自訂評估器放置在 `pixie_qa/evaluators.py` 中（如果有很多，則放在子模組中）。

### `create_llm_evaluator` 工廠

當品質維度是特定領域且沒有內建評估器符合時使用。

傳回值是一個**準備好使用的評估器實例**。將其指派給模組級別的變數——`pixie test` 將直接匯入並使用它（不需要類別包裝器）：

```python
from pixie import create_llm_evaluator

concise_voice_style = create_llm_evaluator(
    name="ConciseVoiceStyle",
    prompt_template="""
    You are evaluating whether this response is concise and phone-friendly.

    Input: {eval_input}
    Response: {eval_output}

    Score 1.0 if the response is concise (under 3 sentences), directly addresses
    the question, and uses conversational language suitable for a phone call.
    Score 0.0 if it's verbose, off-topic, or uses written-style formatting.
    """,
)
```

在您的資料集 JSON 中，透過其 `filepath:callable_name` 參考（例如 `"pixie_qa/evaluators.py:concise_voice_style"`）來參考該評估器。

**範本變數的工作方式**：`{eval_input}`、`{eval_output}`、`{expectation}` 是僅有的佔位符。每個都被替換為對應 `Evaluable` 欄位的字串表示形式：

- **單一項目** `eval_input` / `eval_output` → 項目的值（字串、JSON 序列化的字典/列表）
- **多重項目** `eval_input` / `eval_output` → 將 `name → value` 映射到每個項目的 JSON 字典

LLM 裁判看到完整的序列化值。

**規則**：

- **僅使用 `{eval_input}`、`{eval_output}`、`{expectation}`** ——不允許像 `{eval_input[key]}` 這樣的巢狀存取（這將導致 `ValueError` 並崩潰）
- **保持範本簡短直接** ——系統提示詞已經告訴 LLM 傳回 `Score: X.X`。您的範本只需要呈現資料並定義評分標準。
- **不要指示 LLM 「解析」或「擷取」資料** ——只需呈現值並陳述標準。LLM 可以自然地讀取 JSON。

**非 RAG 回應相關性**（代替 `AnswerRelevancy`）：

```python
response_relevance = create_llm_evaluator(
    name="ResponseRelevance",
    prompt_template="""
    You are evaluating whether a customer support response is relevant and helpful.

    Input: {eval_input}
    Response: {eval_output}
    Expected: {expectation}

    Score 1.0 if the response directly addresses the question and meets expectations.
    Score 0.5 if partially relevant but misses important aspects.
    Score 0.0 if off-topic, ignores the question, or contradicts expectations.
    """,
)
```

### 手動自訂評估器

自訂評估器可以是**同步或非同步函式**。將它們指派給 `pixie_qa/evaluators.py` 中的模組級別變數：

```python
from pixie import Evaluation, Evaluable

def my_evaluator(evaluable: Evaluable, *, trace=None) -> Evaluation:
    score = 1.0 if "expected pattern" in str(evaluable.eval_output) else 0.0
    return Evaluation(score=score, reasoning="...")
```

在資料集中透過 `filepath:callable_name` 參考：`"pixie_qa/evaluators.py:my_evaluator"`。

**存取 `eval_metadata` 和擷取的資料**：自訂評估器透過 `Evaluable` 欄位存取每個條目的 Metadata 和 `wrap()` 輸出：

- `evaluable.eval_metadata` —— 來自條目 `eval_metadata` 欄位的字典（例如 `{"expected_tool": "endCall"}`）
- `evaluable.eval_output` —— 包含所有 `wrap(purpose="output")` 和 `wrap(purpose="state")` 值的 `list[NamedData]`。每個項目都有 `.name` (str) 和 `.value` (JsonValue)。使用下方的輔助工具按名稱查閱。

```python
def _get_output(evaluable: Evaluable, name: str) -> Any:
    """從 eval_output 中按名稱查閱 wrap 值。"""
    for item in evaluable.eval_output:
        if item.name == name:
            return item.value
    return None

def call_ended_check(evaluable: Evaluable, *, trace=None) -> Evaluation:
    expected = evaluable.eval_metadata.get("expected_call_ended") if evaluable.eval_metadata else None
    actual = _get_output(evaluable, "call_ended")
    if expected is None:
        return Evaluation(score=1.0, reasoning="No expected_call_ended in eval_metadata")
    match = bool(actual) == bool(expected)
    return Evaluation(
        score=1.0 if match else 0.0,
        reasoning=f"Expected call_ended={expected}, got {actual}",
    )
```

## 3c. 產出評估器映射產出物

將標準對評估器的映射寫入 `pixie_qa/03-evaluator-mapping.md`。此產出物橋接了評估標準（步驟 1b）和資料集（步驟 4）。

**關鍵事項**：使用 `evaluators.md` 參考文件中顯示的精確評估器名稱——內建評估器使用其簡稱（例如 `Factuality`、`ClosedQA`），自訂評估器使用 `filepath:callable_name` 格式（例如 `pixie_qa/evaluators.py:ConciseVoiceStyle`）。

### 範本

```markdown
# 評估器映射

## 使用的內建評估器

| 評估器名稱 | 涵蓋的標準 | 適用於 |
| ---------- | ---------- | ------ |
| Factuality | 事實準確性 | 所有項目 |
| ClosedQA   | 回答正確性 | 具有 expected_output 的項目 |

## 自訂評估器

| 評估器名稱 | 涵蓋的標準 | 適用於 | 來源檔案 |
| ---------- | ---------- | ------ | -------- |
| pixie_qa/evaluators.py:ConciseVoiceStyle | 電話友善語氣 | 所有項目 | pixie_qa/evaluators.py |

## 適用性摘要

- **資料集級別預設值**（適用於所有項目）：Factuality, pixie_qa/evaluators.py:ConciseVoiceStyle
- **特定項目**（適用於子集）：ClosedQA（僅適用於具有 expected_output 的項目）
```

## 輸出

- `pixie_qa/evaluators.py` 中的自訂評估器實作（如果需要任何自訂評估器）
- `pixie_qa/03-evaluator-mapping.md` —— 標準對評估器的映射

---

> **評估器選擇指南**：請參閱 `evaluators.md` 以獲取完整的評估器目錄、選擇指南（哪種評估器適用於哪種輸出類型）以及 `create_llm_evaluator` 參考。
>
> **如果您在實作評估器時遇到非預期的錯誤**（匯入失敗、API 不匹配），請在猜測修復方法之前閱讀 `evaluators.md` 以獲取權威的評估器參考，並閱讀 `wrap-api.md` 以獲取 API 詳細資訊。
