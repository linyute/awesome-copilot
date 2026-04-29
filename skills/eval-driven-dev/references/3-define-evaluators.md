# 步驟 3：定義評估器

**為何需要此步驟**：隨著應用程式已完成檢測（步驟 2），你現在需要將每個評估標準映射到具體的評估器 — 並在需要時實作自訂評估器 — 以便資料集（步驟 4）可以依名稱引用它們。

---

## 3a. 將標準映射到評估器

**步驟 1c 中的每個評估標準 — 包含使用者在提示詞中指定的任何維度 — 都必須有對應的評估器。** 如果使用者要求評估「事實性、完整性和偏見」，你需要三個評估器（或一個涵蓋這三者的多標準評估器）。不要默默刪除任何要求的維度。優先選擇測量 `pixie_qa/00-project-analysis.md` 中識別出的**硬性問題 / 失敗模式**的評估器 — 這些比通用的品質評估器更有價值。

對於每個評估標準，請按照以下決策順序選擇評估器：

1. **內建評估器** — 如果標準符合標準評估器（事實正確性 → `Factuality`，精確匹配 → `ExactMatch`，RAG 忠實度 → `Faithfulness`）。參見 `evaluators.md` 以獲取完整目錄。
2. **代理評估器 (Agent evaluator)** (`create_agent_evaluator`) — **所有語義、定性和應用程式專屬標準的預設選擇**。代理評估器由你（編碼代理）在步驟 6 中評分，屆時你將整體審核每個項目的追蹤和輸出。對於諸如「擷取是否準確反映了來源內容？」、「是否存在幻覺值？」或「應用程式是否優雅地處理了混亂的輸入？」等標準，這比自動化評分有效得多。
3. **手動自訂評估器** — 僅用於**機械性、確定性的檢查**，在這些檢查中程式化函式是絕對正確的：欄位存在性、正則表達式模式匹配、JSON 結構描述驗證、數值閾值、類型檢查。**絕不將手動自訂評估器用於語義品質** — 如果檢查需要對內容是否正確、相關或完整進行*判斷*，請改用代理評估器。

**區分結構化標準與語義標準**：對於每個標準，請自問：「是否可以透過一個簡單的程式化規則來檢查並始終得出正確答案？」如果是 → 手動自訂評估器。如果否 → 代理評估器。大多數應用程式專屬的品質標準都是語義性的，而非結構化的。

對於開放式的 LLM 文本，**絕不**使用 `ExactMatch` — 因為 LLM 輸出是非確定性的。

`AnswerRelevancy` **僅限 RAG** — 它需要追蹤中包含 `context` 值。若無則回傳 0.0。對於一般的相關性評估，請使用具有清晰標準的代理評估器。

## 3b. 實作自訂評估器

如果任何標準需要自訂評估器，請現在實作。將自訂評估器放在 `pixie_qa/evaluators.py` 中（如果數量較多則放在子模組中）。

### 代理評估器 (`create_agent_evaluator`) — 預設選擇

將代理評估器用於**所有語義、定性和基於判斷的標準**。這些由你（編碼代理）在步驟 5d 中評分，屆時你將結合完整背景審核每個項目的追蹤和輸出 — 對於諸如準確性、完整性、幻覺偵測或錯誤處理等品質維度，這比任何自動化方法都有效得多。

```python
from pixie import create_agent_evaluator

extraction_accuracy = create_agent_evaluator(
    name="ExtractionAccuracy",
    criteria="擷取的資料準確反映了來源內容。所有欄位均包含來自來源的正確值 "
             "— 沒有幻覺、捏造或佔位符的值。將 final_answer 與 fetched_content "
             "和 parsed_content 進行比較，以驗證每個聲明的事實。",
)

noise_handling = create_agent_evaluator(
    name="NoiseHandling",
    criteria="應用程式正確地忽略了來源中的導航欄、範本內容、廣告和其他 "
             "非內容元素。擷取的資料僅包含與使用者提示相關的資訊，而不包含來自頁面結構的雜訊。",
)

schema_compliance = create_agent_evaluator(
    name="SchemaCompliance",
    criteria="輸出包含提示中要求的所有欄位，且具有適當的類型和非平凡 (Non-trivial) 的值。 "
             "缺少欄位、必要資料為 Null 或具有通用佔位符文本的欄位皆視為失敗。",
)
```

在資料集中透過 `filepath:callable_name` 引用代理評估器（例如：`"pixie_qa/evaluators.py:extraction_accuracy"`）。

在執行 `pixie test` 期間，代理評估器在主控台顯示為 `⏳`。它們將在步驟 5d 中評分。

**編寫有效的標準**：`criteria` 字串是你將在步驟 5d 遵循的評分準則 (Rubric)。請使其具體且具備可操作性：

- **錯誤示範**：「檢查輸出是否良好」 — 太過模糊，無法保持評分一致性。
- **錯誤示範**：「回應應具備準確性」 — 沒有說明應與什麼進行比較。
- **正確示範**：「將擷取的欄位與原始 HTML/文件進行比較。每個欄位必須在來源中都有對應的段落。標註任何值無法追溯到來源內容的欄位。」
- **正確示範**：「應用程式應保留來源文件的結構階層。如果來源有章節/子章節，擷取結果應反映該巢狀結構，而非將所有內容壓平為單一層級。」

### 手動自訂評估器 — 僅用於機械性檢查

僅對確定性的程式化檢查使用手動自訂評估器，即簡單函式即可得出絕對正確答案的情況。範例：欄位存在性、正規運算式匹配、JSON 結構描述驗證、數值範圍檢查、類型驗證。

**不要將手動自訂評估器用於語義品質**。如果檢查需要對內容是否正確、相關、完整或撰寫良好進行*判斷*，請改用代理評估器。檢驗方法：「正規運算式、字串匹配或比較運算子是否可以完美地實現此檢查？」如果不能，則是語義性的 — 請使用代理評估器。

自訂評估器可以是**同步或異步函式**。將它們分配給 `pixie_qa/evaluators.py` 中的模組級變數：

```python
from pixie import Evaluation, Evaluable

def my_evaluator(evaluable: Evaluable, *, trace=None) -> Evaluation:
    score = 1.0 if "expected pattern" in str(evaluable.eval_output) else 0.0
    return Evaluation(score=score, reasoning="...")
```

在資料集中透過 `filepath:callable_name` 引用：`"pixie_qa/evaluators.py:my_evaluator"`。

**存取 `eval_metadata` 和擷取的資料**：自訂評估器透過 `Evaluable` 欄位存取每項目的 Metadata 和 `wrap()` 輸出：

- `evaluable.eval_metadata` — 來自項目 `eval_metadata` 欄位的字典（例如：`{"expected_tool": "endCall"}`）。
- `evaluable.eval_output` — 包含所有 `wrap(purpose="output")` 和 `wrap(purpose="state")` 值的 `list[NamedData]`。每個項目都有 `.name` (str) 和 `.value` (JsonValue)。使用下方的輔助工具依名稱查詢。

```python
def _get_output(evaluable: Evaluable, name: str) -> Any:
    """從 eval_output 中依名稱尋找 Wrap 值。"""
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
        reasoning=f"預期 call_ended={expected}，實際為 {actual}",
    )
```

### ValidJSON 與字串預期之間的衝突

當存在 `expectation` 欄位時，`ValidJSON` 會將資料集項目的該欄位視為 JSON 結構描述 (JSON Schema)。如果你的項目使用**字串**預期（例如：用於 `Factuality`），將 `ValidJSON` 增加為資料集層級的預設評估器將導致失敗 — 它無法將純字串驗證為 JSON 結構描述。請僅將 `ValidJSON` 套用於具有物件/布林預期的項目，或在資料集依賴字串預期時將其省略。

## 3c. 產生評估器映射成品

將標準與評估器的映射關係寫入 `pixie_qa/03-evaluator-mapping.md`。此成品連接著評估標準（步驟 1c）和資料集（步驟 4）。

**關鍵要求**：使用與 `evaluators.md` 參考資料中完全相同的評估器名稱 — 內建評估器使用其短名稱（例如：`Factuality`, `ClosedQA`），自訂評估器使用 `filepath:callable_name` 格式（例如：`pixie_qa/evaluators.py:ConciseVoiceStyle`）。

### 範本

```markdown
# 評估器映射

## 使用的內建評估器

| 評估器名稱 | 涵蓋的標準 | 適用於 |
| -------------- | ------------------- | -------------------------- |
| Factuality     | 事實準確性 | 所有項目 |
| ClosedQA       | 答案正確性 | 具有 expected_output 的項目 |

## 代理評估器

| 評估器名稱 | 涵蓋的標準 | 適用於 | 來源檔案 |
| ------------------------------------------ | ---------------------------- | ---------- | ---------------------- |
| pixie_qa/evaluators.py:extraction_accuracy | 內容相對於來源的準確性 | 所有項目 | pixie_qa/evaluators.py |
| pixie_qa/evaluators.py:noise_handling      | 導航欄/範本雜訊處理 | 所有項目 | pixie_qa/evaluators.py |

## 手動自訂評估器 (僅限機械性檢查)

| 評估器名稱 | 涵蓋的標準 | 適用於 | 來源檔案 |
| ---------------------------------------------- | -------------------- | ---------- | ---------------------- |
| pixie_qa/evaluators.py:required_fields_present | 必要欄位檢查 | 所有項目 | pixie_qa/evaluators.py |

## 適用性摘要

- **資料集層級預設值** (套用於所有項目)：Factuality, pixie_qa/evaluators.py:extraction_accuracy
- **項目特定** (套用於子集)：ClosedQA (僅限具有 expected_output 的項目)
```

## 輸出

- `pixie_qa/evaluators.py` 中的自訂評估器實作（如果需要任何自訂評估器）。
- `pixie_qa/03-evaluator-mapping.md` — 標準與評估器的映射。

---

> **評估器選擇指引**：參見 `evaluators.md` 獲取完整的內建評估器目錄和 `create_agent_evaluator` 參考。
>
> **如果你在實作評估器時遇到非預期錯誤**（匯入失敗、API 不匹配），請在盲目猜測修復方法前，先閱讀 `evaluators.md` 獲取權威的評估器參考，以及 `wrap-api.md` 獲取 API 詳細資訊。
