# 內建評估器

> 自動從 pixie 原始碼 docstrings 產生。
> 請勿手動編輯 — 請從上游 [pixie-qa](https://github.com/yiouli/pixie-qa) 原始碼存放庫重新產生。

Autoevals 配接器 — 包裝 `autoevals` 評分器的預製評估器。

此模組提供 :class:`AutoevalsAdapter`，它將 autoevals 的 `Scorer` 介面橋接至 pixie 的 `Evaluator` 協定，以及一組用於常見評估任務的工廠函式。

公用 API (全部也從 `pixie.evals` 重新匯出)：

**核心配接器：** - :class:`AutoevalsAdapter` — 任何 autoevals `Scorer` 的通用包裝器。

**啟發式評分器 (不需要 LLM)：** - :func:`LevenshteinMatch` — 編輯距離字串相似度。 - :func:`ExactMatch` — 精確值比較。 - :func:`NumericDiff` — 正規化數值差異。 - :func:`JSONDiff` — 結構化 JSON 比較。 - :func:`ValidJSON` — JSON 語法 / Schema 驗證。 - :func:`ListContains` — 兩個字串清單之間的重疊。

**嵌入評分器：** - :func:`EmbeddingSimilarity` — 透過嵌入的餘弦相似度。

**LLM 作為評審評分器 (LLM-as-judge scorers)：** - :func:`Factuality`, :func:`ClosedQA`, :func:`Battle`,
:func:`Humor`, :func:`Security`, :func:`Sql`,
:func:`Summary`, :func:`Translation`, :func:`Possible`.

**審核 (Moderation)：** - :func:`Moderation` — OpenAI 內容審核檢查。

**RAGAS 指標：** - :func:`ContextRelevancy`, :func:`Faithfulness`,
:func:`AnswerRelevancy`, :func:`AnswerCorrectness`.

## 評估器選擇指南

根據 **輸出類型** 與評估標準選擇評估器：

| 輸出類型                               | 評估器類別                                            | 範例                              |
| -------------------------------------- | ----------------------------------------------------- | --------------------------------- |
| 決定性 (標籤、是/否、固定格式) | 啟發式：`ExactMatch`, `JSONDiff`, `ValidJSON`            | 標籤分類、JSON 擷取               |
| 帶有參考答案的開放式文字               | LLM 作為評審：`Factuality`, `ClosedQA`, `AnswerCorrectness` | 聊天機器人回應、問答、摘要   |
| 帶有預期上下文/依據的文字               | RAG：`Faithfulness`, `ContextRelevancy`                     | RAG 管線                          |
| 帶有風格/格式要求的文字                 | 透過 `create_llm_evaluator` 自訂                     | 語音友善的回應、語氣檢查          |
| 多面向品質                             | 多個評估器組合                                        | 事實性 + 相關性 + 語氣            |

關鍵規則：

- 對於開放式 LLM 文字，**絕不**使用 `ExactMatch` — LLM 輸出是非決定性的。
- `AnswerRelevancy` **僅限 RAG** — 需要追蹤中的 `context`。沒有它會傳回 0.0。對於一般相關性，請使用 `create_llm_evaluator`。
- 不要對沒有 `expected_output` 的項目使用比較評估器 (`Factuality`, `ClosedQA`, `ExactMatch`) — 它們會產生毫無意義的分數。

---

## 評估器參考

### `AnswerCorrectness`

```python
AnswerCorrectness(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

答案正確性評估器 (RAGAS)。

判斷 `eval_output` 相較於 `expected_output` 是否正確，結合事實相似度與語義相似度。

**何時使用**：RAG 管線中的問答場景，當您有參考答案且想要綜合正確性分數時。

**需要 `expected_output`**：是。
**需要 `eval_metadata["context"]`**：選用 (提高準確度)。

參數：
client：OpenAI 用戶端執行個體。

### `AnswerRelevancy`

```python
AnswerRelevancy(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

答案相關性評估器 (RAGAS)。

判斷 `eval_output` 是否直接回答 `eval_input` 中的問題。

**何時使用**：僅限 RAG 管線 — 需要追蹤中的 `context`。沒有它會傳回 0.0。對於一般 (非 RAG) 回應相關性，請改用帶有自訂提示的 `create_llm_evaluator`。

**需要 `expected_output`**：否。
**需要 `eval_metadata["context"]`**：是 — **僅限 RAG 管線**。

參數：
client：OpenAI 用戶端執行個體。

### `Battle`

```python
Battle(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

正面交鋒 (Head-to-head) 比較評估器 (LLM 作為評審)。

使用 LLM 將 `eval_output` 與 `expected_output` 進行比較，並根據 `eval_input` 中的指示決定哪一個更好。

**何時使用**：A/B 測試場景、比較模型輸出或對替代回應進行排名。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `ClosedQA`

```python
ClosedQA(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

閉卷 (Closed-book) 問答評估器 (LLM 作為評審)。

使用 LLM 判斷 `eval_output` 與 `expected_output` 相比是否正確回答了 `eval_input` 中的問題。選用性地轉發 `eval_metadata["criteria"]` 以用於自訂評分標準。

**何時使用**：答案應與參考資料相符的問答場景 — 例如：客戶支援回答、知識庫查詢。

**需要 `expected_output`**：是 — 請勿對沒有 `expected_output` 的項目使用；會產生毫無意義的分數。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `ContextRelevancy`

```python
ContextRelevancy(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

上下文相關性評估器 (RAGAS)。

判斷擷取的上下文是否與查詢相關。將 `eval_metadata["context"]` 轉發給底層評分器。

**何時使用**：RAG 管線 — 評估擷取品質。

**需要 `expected_output`**：是。
**需要 `eval_metadata["context"]`**：是 (僅限 RAG 管線)。

參數：
client：OpenAI 用戶端執行個體。

### `EmbeddingSimilarity`

```python
EmbeddingSimilarity(*, prefix: 'str | None' = None, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

基於嵌入的語義相似度評估器。

計算 `eval_output` 與 `expected_output` 的嵌入向量之間的餘弦相似度。

**何時使用**：當精確字眼並不重要時，比較兩段文字的語義。比 Levenshtein 更有彈性處理換句話說的內容，但細膩度不如 LLM 作為評審的評估器。

**需要 `expected_output`**：是。

參數：
prefix：選用的前綴文字，用於領域上下文。
model：嵌入模型名稱。
client：OpenAI 用戶端執行個體。

### `ExactMatch`

```python
ExactMatch() -> 'AutoevalsAdapter'
```

精確值比較評估器。

如果 `eval_output` 完全等於 `expected_output`，則傳回 1.0，否則傳回 0.0。

**何時使用**：決定性的、結構化的輸出 (分類標籤、是/否答案、固定格式字串)。**絕不**用於開放式 LLM 文字 — LLM 輸出是非決定性的，因此精確匹配幾乎總是會失敗。

**需要 `expected_output`**：是。

### `Factuality`

```python
Factuality(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

事實準確性評估器 (LLM 作為評審)。

使用 LLM 根據 `eval_input` 上下文，判斷 `eval_output` 在事實上是否與 `expected_output` 一致。

**何時使用**：事實正確性至關重要的開放式文字 (聊天機器人回應、問答、摘要)。對於 LLM 產生的文字，優於 `ExactMatch`。

**需要 `expected_output`**：是 — 請勿對沒有 `expected_output` 的項目使用；會產生毫無意義的分數。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `Faithfulness`

```python
Faithfulness(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

忠實度 (Faithfulness) 評估器 (RAGAS)。

判斷 `eval_output` 是否忠實於 (即由其支援) 所提供的上下文。將 `eval_metadata["context"]` 轉發。

**何時使用**：RAG 管線 — 確保答案不會產生超出擷取上下文支援範圍的幻覺。

**需要 `expected_output`**：否。
**需要 `eval_metadata["context"]`**：是 (僅限 RAG 管線)。

參數：
client：OpenAI 用戶端執行個體。

### `Humor`

```python
Humor(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

幽默品質評估器 (LLM 作為評審)。

使用 LLM 將 `eval_output` 的幽默品質與 `expected_output` 進行比較。

**何時使用**：評估創意寫作、聊天機器人個性或娛樂應用程式中的幽默感。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `JSONDiff`

```python
JSONDiff(*, string_scorer: 'Any' = None) -> 'AutoevalsAdapter'
```

結構化 JSON 比較評估器。

遞迴比較兩個 JSON 結構並產生相似度分數。處理巢狀物件、陣列和混合類型。

**何時使用**：需要欄位級比較的結構化 JSON 輸出 (例如：擷取資料、API 回應架構、工具呼叫引數)。

**需要 `expected_output`**：是。

參數：
string_scorer：選用的字串欄位成對評分器。

### `LevenshteinMatch`

```python
LevenshteinMatch() -> 'AutoevalsAdapter'
```

編輯距離字串相似度評估器。

計算 `eval_output` 與 `expected_output` 之間的正規化 Levenshtein 距離。相同字串傳回 1.0，隨著編輯距離增加，分數隨之降低。

**何時使用**：可接受微小文字變化的決定性或近決定性輸出 (例如：格式差異、微小拼字錯誤)。不適用於開放式 LLM 文字 — 請改用 LLM 作為評審的評估器。

**需要 `expected_output`**：是。

### `ListContains`

```python
ListContains(*, pairwise_scorer: 'Any' = None, allow_extra_entities: 'bool' = False) -> 'AutoevalsAdapter'
```

清單重疊評估器。

檢查 `eval_output` 是否包含 `expected_output` 中的所有項目。根據重疊比例評分。

**何時使用**：完整性至關重要的項目清單輸出 (例如：擷取的實體、搜尋結果、建議)。

**需要 `expected_output`**：是。

參數：
pairwise_scorer：選用的成對元素比較評分器。
allow_extra_entities：如果為 True，則不會懲罰輸出中的額外項目。

### `Moderation`

```python
Moderation(*, threshold: 'float | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

內容審核評估器。

使用 OpenAI 審核 API 檢查 `eval_output` 是否包含不安全內容 (仇恨言論、暴力、自我傷害等)。

**何時使用**：任何考量輸出安全性的應用程式 — 聊天機器人、內容生成、面向使用者的 AI。

**需要 `expected_output`**：否。

參數：
threshold：自訂標記閾值。
client：OpenAI 用戶端執行個體。

### `NumericDiff`

```python
NumericDiff() -> 'AutoevalsAdapter'
```

正規化數值差異評估器。

計算 `eval_output` 與 `expected_output` 之間的正規化數值距離。相同數值傳回 1.0，隨著差異增加，分數隨之降低。

**何時使用**：可接受近似相等的數值輸出 (例如：價格計算、分數、測量值)。

**需要 `expected_output`**：是。

### `Possible`

```python
Possible(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

可行性 / 合理性評估器 (LLM 作為評審)。

使用 LLM 判斷 `eval_output` 是否為合理或可行的回應。

**何時使用**：當您想要在沒有特定參考答案的情況下，驗證輸出是否合理時的通用品質檢查。

**需要 `expected_output`**：否。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `Security`

```python
Security(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

安全性漏洞評估器 (LLM 作為評審)。

使用 LLM 根據 `eval_input` 中的指示，檢查 `eval_output` 是否存在安全性漏洞。

**何時使用**：程式碼產生、SQL 輸出或任何需要檢查輸出是否存在資料隱碼 (injection) 或漏洞風險的場景。

**需要 `expected_output`**：否。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `Sql`

```python
Sql(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

SQL 等效性評估器 (LLM 作為評審)。

使用 LLM 判斷 `eval_output` SQL 與 `expected_output` SQL 在語義上是否等效。

**何時使用**：文字轉 SQL (Text-to-SQL) 應用程式，其中產生的 SQL 功能應等效於參考查詢。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `Summary`

```python
Summary(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

摘要品質評估器 (LLM 作為評審)。

使用 LLM 將 `eval_output` 作為摘要的品質，與 `expected_output` 中的參考摘要進行比較。

**何時使用**：摘要任務，其中輸出必須擷取來源材料的關鍵資訊。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `Translation`

```python
Translation(*, language: 'str | None' = None, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

翻譯品質評估器 (LLM 作為評審)。

使用 LLM 評估 `eval_output` 相對於目標語言中 `expected_output` 的翻譯品質。

**何時使用**：機器翻譯或多語言輸出場景。

**需要 `expected_output`**：是。

參數：
language：目標語言 (例如：`"Spanish"`)。
model：LLM 模型名稱。
client：OpenAI 用戶端執行個體。

### `ValidJSON`

```python
ValidJSON(*, schema: 'Any' = None) -> 'AutoevalsAdapter'
```

JSON 語法與 Schema 驗證評估器。

如果 `eval_output` 是有效的 JSON (且選用性地符合提供的 Schema)，則傳回 1.0，否則傳回 0.0。

**何時使用**：必須是有效 JSON 的輸出 — 選用性地符合特定 Schema (例如：工具呼叫回應、結構化擷取)。

**需要 `expected_output`**：否。

參數：
schema：用於驗證的選用 JSON Schema。

---

## 自訂評估器：`create_llm_evaluator`

從提示範本建立自訂 LLM 作為評審評估器的工廠。

用法：：

    from pixie import create_llm_evaluator

    concise_voice_style = create_llm_evaluator(
        name="ConciseVoiceStyle",
        prompt_template="""
        您正在評估語音代理程式 (voice agent) 的回應是否簡潔且適合電話通訊。

        使用者說：{eval_input}
        代理程式回應：{eval_output}
        預期行為：{expectation}

        如果回應簡潔 (少於 3 句)、直接回答問題，且使用適合電話通訊的對話式語言，則評分為 1.0。如果過於冗長、偏離主題或使用書面格式，則評分為 0.0。
        """,
    )

### `create_llm_evaluator`

```python
create_llm_evaluator(name: 'str', prompt_template: 'str', *, model: 'str' = 'gpt-4o-mini', client: 'Any | None' = None) -> '_LLMEvaluator'
```

從提示範本建立自訂 LLM 作為評審評估器。

範本可參考這些變數 (從 :class:`~pixie.storage.evaluable.Evaluable` 欄位填入)：

- `{eval_input}` — 可評估項目的輸入資料。單一項目清單會展開為該項目的值；多項目清單會展開為 `name → value` 對的 JSON 字典。
- `{eval_output}` — 可評估項目的輸出資料 (規則同 `eval_input`)。
- `{expectation}` — 可評估項目的預期輸出。

參數：
name：評估器的顯示名稱 (顯示在計分卡中)。
prompt_template：包含 `{eval_input}`、`{eval_output}` 和/或 `{expectation}` 佔位符的字串範本。
model：OpenAI 模型名稱 (預設：`gpt-4o-mini`)。
client：選用的預先設定 OpenAI 用戶端執行個體。

傳回值：
滿足 `Evaluator` 協定的評估器可呼叫物件。

引發：
ValueError：如果範本使用巢狀欄位存取，例如 `{eval_input[key]}` (僅支援最上層佔位符)。
