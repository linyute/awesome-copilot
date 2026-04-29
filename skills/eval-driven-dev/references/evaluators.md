# 內建評估器

> 由 pixie 原始程式碼文件字串 (docstrings) 自動產生。
> 請勿手動編輯 — 請執行 `uv run python scripts/generate_skill_docs.py`。

Autoevals 配接器 — 包裝了 `autoevals` 評分器的預製評估器。

此模組提供 `:class:AutoevalsAdapter`，它將 autoevals 的 `Scorer` 介面橋接到 pixie 的 `Evaluator` 協定，並提供一組用於常見評估任務的工廠函式。

公開 API（所有這些也都從 `pixie.evals` 重新匯出）：

**核心配接器：** - `:class:AutoevalsAdapter` — 任何 autoevals `Scorer` 的通用包裝器。

**啟發式評分器 (無需 LLM)：** - `:func:LevenshteinMatch` — 編輯距離字串相似度。 - `:func:ExactMatch` — 精確值比較。 - `:func:NumericDiff` — 標準化數值差異。 - `:func:JSONDiff` — 結構化 JSON 比較。 - `:func:ValidJSON` — JSON 語法 / 結構描述驗證。 - `:func:ListContains` — 兩個字串列表之間的重疊。

**嵌入向量評分器：** - `:func:EmbeddingSimilarity` — 透過嵌入向量進行餘弦相似度計算。

**LLM 即評審 (LLM-as-judge) 評分器：** - `:func:Factuality`, `:func:ClosedQA`, `:func:Battle`,
`:func:Humor`, `:func:Security`, `:func:Sql`,
`:func:Summary`, `:func:Translation`, `:func:Possible`。

**內容審核：** - `:func:Moderation` — OpenAI 內容審核檢查。

**RAGAS 指標：** - `:func:ContextRelevancy`, `:func:Faithfulness`,
`:func:AnswerRelevancy`, `:func:AnswerCorrectness`。

## 評估器選擇指南

根據**輸出類型**和評估標準選擇評估器：

| 輸出類型 | 評估器類別 | 範例 |
| -------------------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| 確定性的（標籤、是/否、固定格式） | 啟發式：`ExactMatch`, `JSONDiff`, `ValidJSON` | 標籤分類、JSON 擷取 |
| 帶有參考答案的開放式文本 | LLM 即評審：`Factuality`, `ClosedQA`, `AnswerCorrectness` | 聊天機器人回應、QA、摘要 |
| 帶有預期背景/根據 (Grounding) 的文本 | RAG：`Faithfulness`, `ContextRelevancy` | RAG 管線 |
| 帶有風格/格式要求的文本 | 透過 `create_llm_evaluator` 自訂 | 親和語音回應、語氣檢查 |
| 多面向品質 | 多個評估器組合 | 事實準確性 + 相關性 + 語氣 |
| 依賴追蹤的品質（工具使用、路由） | 透過 `create_agent_evaluator` 的代理評估器 | 工具正確性、多步推理 |

關鍵規則：

- 對於開放式 LLM 文本，**絕不**使用 `ExactMatch` — LLM 輸出是非確定性的。
- `AnswerRelevancy` **僅限 RAG** — 需要追蹤中有 `context`。若無則回傳 0.0。對於一般（非 RAG）回應相關性，請使用帶有明確標準的 `create_llm_evaluator`。
- 不要對沒有 `expected_output` 的項目使用比較評估器 (`Factuality`, `ClosedQA`, `ExactMatch`) — 它們會產生無意義的分數。

---

## 評估器參考

### `AnswerCorrectness`

```python
AnswerCorrectness(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

答案正確性評估器 (RAGAS)。

結合事實相似度和語義相似度，判斷 `eval_output` 與 `expected_output` 相比是否正確。

**何時使用**：RAG 管線中的 QA 情境，且你擁有參考答案並希望獲得綜合正確性分數。

**需要 `expected_output`**：是。
**需要 `eval_metadata["context"]`**：選用（可提高準確性）。

參數：
client：OpenAI 客戶端實例。

### `AnswerRelevancy`

```python
AnswerRelevancy(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

答案相關性評估器 (RAGAS)。

判斷 `eval_output` 是否直接回答了 `eval_input` 中的問題。

**何時使用**：僅限 RAG 管線 — 需要追蹤中有 `context`。若無則回傳 0.0。對於一般（非 RAG）回應相關性，請改用帶有自訂提示的 `create_llm_evaluator`。

**需要 `expected_output`**：否。
**需要 `eval_metadata["context"]`**：是 — **僅限 RAG 管線**。

參數：
client：OpenAI 客戶端實例。

### `Battle`

```python
Battle(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

正面交鋒 (Head-to-head) 比較評估器 (LLM 即評審)。

使用 LLM 比較 `eval_output` 與 `expected_output`，並根據 `eval_input` 中的指示判斷哪一個更好。

**何時使用**：A/B 測試情境、比較模型輸出或對替代回應進行排名。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `ClosedQA`

```python
ClosedQA(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

閉卷問答評估器 (LLM 即評審)。

使用 LLM 判斷與 `expected_output` 相比，`eval_output` 是否正確回答了 `eval_input` 中的問題。選用 `eval_metadata["criteria"]` 轉發自訂評分標準。

**何時使用**：答案應符合參考資料的 QA 情境 — 例如：客戶支援回答、知識庫查詢。

**需要 `expected_output`**：是 — 不要對沒有 `expected_output` 的項目使用；會產生無意義的分數。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `ContextRelevancy`

```python
ContextRelevancy(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

背景相關性評估器 (RAGAS)。

判斷擷取到的背景是否與查詢相關。將 `eval_metadata["context"]` 轉發給底層評分器。

**何時使用**：RAG 管線 — 評估擷取品質。

**需要 `expected_output`**：是。
**需要 `eval_metadata["context"]`**：是（僅限 RAG 管線）。

參數：
client：OpenAI 客戶端實例。

### `EmbeddingSimilarity`

```python
EmbeddingSimilarity(*, prefix: 'str | None' = None, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

基於嵌入向量的語義相似度評估器。

計算 `eval_output` 與 `expected_output` 嵌入向量之間的餘弦相似度。

**何時使用**：在精確用詞無關緊要時，比較兩個文本的語義。對於轉述內容比 Levenshtein 更穩健，但比 LLM 即評審評估器較缺乏細微差別。

**需要 `expected_output`**：是。

參數：
prefix：選用的前綴文本，用於提供領域背景。
model：嵌入模型名稱。
client：OpenAI 客戶端實例。

### `ExactMatch`

```python
ExactMatch() -> 'AutoevalsAdapter'
```

精確值比較評估器。

如果 `eval_output` 完全等於 `expected_output` 則回傳 1.0，否則回傳 0.0。

**何時使用**：確定性的、結構化的輸出（分類標籤、是/否回答、固定格式字串）。**絕不**用於開放式 LLM 文本 — LLM 輸出是非確定性的，因此精確匹配幾乎總是會失敗。

**需要 `expected_output`**：是。

### `Factuality`

```python
Factuality(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

事實準確性評估器 (LLM 即評審)。

使用 LLM 判斷在給定 `eval_input` 背景的情況下，`eval_output` 是否與 `expected_output` 事實一致。

**何時使用**：事實準確性很重要的開放式文本（聊天機器人回應、QA 回答、摘要）。對於 LLM 產生的文本，優於 `ExactMatch`。

**需要 `expected_output`**：是 — 不要對沒有 `expected_output` 的項目使用；會產生無意義的分數。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `Faithfulness`

```python
Faithfulness(*, client: 'Any' = None) -> 'AutoevalsAdapter'
```

忠實度評估器 (RAGAS)。

判斷 `eval_output` 是否忠於（即由其支撐）所提供的背景。轉發 `eval_metadata["context"]`。

**何時使用**：RAG 管線 — 確保回答不會超出所擷取背景所能支撐的範圍而產生幻覺。

**需要 `expected_output`**：否。
**需要 `eval_metadata["context"]`**：是（僅限 RAG 管線）。

參數：
client：OpenAI 客戶端實例。

### `Humor`

```python
Humor(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

幽默品質評估器 (LLM 即評審)。

使用 LLM 評估 `eval_output` 與 `expected_output` 相比的幽默品質。

**何時使用**：評估創意寫作、聊天機器人個性或娛樂應用程式中的幽默感。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `JSONDiff`

```python
JSONDiff(*, string_scorer: 'Any' = None) -> 'AutoevalsAdapter'
```

結構化 JSON 比較評估器。

遞迴比較兩個 JSON 結構並產生相似度分數。處理巢狀物件、陣列和混合類型。

**何時使用**：需要進行欄位級比較的結構化 JSON 輸出（例如：擷取的資料、API 回應結構描述、工具呼叫參數）。

**需要 `expected_output`**：是。

參數：
string_scorer：選用的用於字串欄位的兩兩評分器。

### `LevenshteinMatch`

```python
LevenshteinMatch() -> 'AutoevalsAdapter'
```

編輯距離字串相似度評估器。

計算 `eval_output` 與 `expected_output` 之間標準化的 Levenshtein 距離。對於相同的字串回傳 1.0，並隨著編輯距離增加而降低分數。

**何時使用**：確定性或近乎確定性的輸出，且可接受微小的文本差異（例如：格式差異、微小的拼寫錯誤）。不適用於開放式 LLM 文本 — 請改用 LLM 即評審評估器。

**需要 `expected_output`**：是。

### `ListContains`

```python
ListContains(*, pairwise_scorer: 'Any' = None, allow_extra_entities: 'bool' = False) -> 'AutoevalsAdapter'
```

列表重疊評估器。

檢查 `eval_output` 是否包含來自 `expected_output` 的所有項目。根據重疊率評分。

**何時使用**：產生項目列表且完整性很重要的輸出（例如：擷取的實體、搜尋結果、建議）。

**需要 `expected_output`**：是。

參數：
pairwise_scorer：選用的兩兩元素比較評分器。
allow_extra_entities：若為 True，則輸出中的額外項目不會受到懲罰。

### `Moderation`

```python
Moderation(*, threshold: 'float | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

內容審核評估器。

使用 OpenAI 審核 API 檢查 `eval_output` 是否包含不安全內容（仇恨言論、暴力、自我傷害等）。

**何時使用**：任何涉及輸出安全性的應用程式 — 聊天機器人、內容產生、面向使用者的 AI。

**需要 `expected_output`**：否。

參數：
threshold：自訂標記閾值。
client：OpenAI 客戶端實例。

### `NumericDiff`

```python
NumericDiff() -> 'AutoevalsAdapter'
```

標準化數值差異評估器。

計算 `eval_output` 與 `expected_output` 之間標準化的數值距離。對於相同的數字回傳 1.0，並隨著差異增加而降低分數。

**何時使用**：數值輸出，且可接受近似相等（例如：價格計算、分數、測量值）。

**需要 `expected_output`**：是。

### `Possible`

```python
Possible(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

可行性 / 合理性評估器 (LLM 即評審)。

使用 LLM 判斷 `eval_output` 是否為合理或可行的回應。

**何時使用**：通用品質檢查，當你想要在沒有特定參考答案的情況下驗證輸出是否合理時。

**需要 `expected_output`**：否。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `Security`

```python
Security(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

安全漏洞評估器 (LLM 即評審)。

使用 LLM 根據 `eval_input` 中的指示檢查 `eval_output` 是否存在安全漏洞。

**何時使用**：程式碼產生、SQL 輸出或任何必須檢查輸出是否存在注入或漏洞風險的情境。

**需要 `expected_output`**：否。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `Sql`

```python
Sql(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

SQL 等效性評估器 (LLM 即評審)。

使用 LLM 判斷 `eval_output` SQL 是否與 `expected_output` SQL 在語義上等效。

**何時使用**：Text-to-SQL 應用程式，且產生的 SQL 應與參考查詢在功能上等效。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `Summary`

```python
Summary(*, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

摘要品質評估器 (LLM 即評審)。

使用 LLM 與 `expected_output` 中的參考摘要相比，評估 `eval_output` 的摘要品質。

**何時使用**：摘要任務，且輸出必須擷取來源材料中的關鍵資訊。

**需要 `expected_output`**：是。

參數：
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `Translation`

```python
Translation(*, language: 'str | None' = None, model: 'str | None' = None, client: 'Any' = None) -> 'AutoevalsAdapter'
```

翻譯品質評估器 (LLM 即評審)。

使用 LLM 與目標語言中的 `expected_output` 相比，評估 `eval_output` 的翻譯品質。

**何時使用**：機器翻譯或多語言輸出情境。

**需要 `expected_output`**：是。

參數：
language：目標語言（例如 `"Spanish"`）。
model：LLM 模型名稱。
client：OpenAI 客戶端實例。

### `ValidJSON`

```python
ValidJSON(*, schema: 'Any' = None) -> 'AutoevalsAdapter'
```

JSON 語法和結構描述驗證評估器。

如果 `eval_output` 是有效的 JSON（且選用性地符合提供的結構描述）則回傳 1.0，否則回傳 0.0。

**何時使用**：必須為有效 JSON 的輸出 — 可選地符合特定結構描述（例如：工具呼叫回應、結構化擷取）。

**需要 `expected_output`**：否。

參數：
schema：選用的要驗證的 JSON 結構描述 (JSON Schema)。

---

## 自訂評估器：`create_llm_evaluator`

從提示詞範本建立自訂 LLM 即評審評估器的工廠。

用法：:

    from pixie import create_llm_evaluator

    concise_voice_style = create_llm_evaluator(
        name="ConciseVoiceStyle",
        prompt_template="""
        你正在評估語音助手的回應是否簡潔且適合電話通訊。

        使用者說：{eval_input}
        助手回應：{eval_output}
        預期行為：{expectation}

        如果回應簡潔（少於 3 句話）、直接回答了問題，且使用了適合電話通話的對話式語言，則給予 1.0 分。如果囉嗦、偏離主題或使用了書面風格的格式，則給予 0.0 分。
        """,
    )

### `create_llm_evaluator`

```python
create_llm_evaluator(name: 'str', prompt_template: 'str', *, model: 'str' = 'gpt-4o-mini', client: 'Any | None' = None) -> '_LLMEvaluator'
```

從提示詞範本建立一個自訂的 LLM 即評審評估器。

範本可以引用以下變數（從 :class:`~pixie.storage.evaluable.Evaluable` 欄位填充）：

- `{eval_input}` — 可評估項的輸入資料。單個項目的列表會展開為該項目的值；多個項目的列表會展開為 `name → value` 對的 JSON 字典。
- `{eval_output}` — 可評估項的輸出資料（規則同 `eval_input`）。
- `{expectation}` — 可評估項的預期輸出。

參數：
name：評估器的顯示名稱（顯示在計分卡中）。
prompt_template：包含 `{eval_input}`, `{eval_output}`, 以及/或 `{expectation}` 預留位置的字串範本。
model：OpenAI 模型名稱（預設：`gpt-4o-mini`）。
client：選用的預先配置的 OpenAI 客戶端實例。

回傳值：
符合 `Evaluator` 協定的評估器可呼叫物件。

拋出：
ValueError：如果範本使用巢狀欄位存取，如 `{eval_input[key]}`（僅支援頂層預留位置）。

### `create_agent_evaluator`

```python
create_agent_evaluator(name: 'str', criteria: 'str') -> '_AgentEvaluator'
```

建立一個將評分延後給編碼代理處理的評估器。

在 `pixie test` 期間，代理評估器不會自動評分。相反地，它們會拋出 `AgentEvaluationPending` 並記錄帶有評估標準的 `PendingEvaluation`。編碼代理（在步驟 6 的指引下）會檢視每個項目的追蹤和輸出，然後對待處理的評估進行評分。

**何時使用**：需要對 LLM 追蹤進行整體檢視的品質維度 — 工具呼叫正確性、多步推理品質、路由決策 — 且自動化的 LLM 即評審提示詞無法捕捉其細微差別之處。

**何時「不」使用**：簡單的文本品質檢查（請改用 `create_llm_evaluator`）、確定性的檢查（使用啟發式評估器），或任何僅憑輸入 + 輸出即可評分而無需追蹤背景的標準。

參數：
name：評估器的顯示名稱（在計分卡中顯示為 ⏳ 待處理）。
criteria：評估內容 — 代理在審核結果時將遵循的評分指示。請保持具體且具備可操作性。

回傳值：
符合 `Evaluator` 協定的評估器可呼叫物件。其 `__call__` 會拋出 `AgentEvaluationPending` 而不是回傳 `Evaluation`。

範例：

```python
from pixie import create_agent_evaluator

ResponseQuality = create_agent_evaluator(
    name="ResponseQuality",
    criteria="回應是否直接回答了使用者的問題，且資訊準確、結構良好。沒有幻覺或偏離主題的內容。",
)

ToolUsageCorrectness = create_agent_evaluator(
    name="ToolUsageCorrectness",
    criteria="應用程式是否根據使用者的意圖以正確的順序呼叫了正確的工具。沒有不必要或遺漏的工具呼叫。",
)
```
