# 步驟 4：建構資料集

**為什麼需要此步驟**：資料集將所有內容聯繫在一起 —— runnable（步驟 2）、評估器（步驟 3）以及使用案例（步驟 1b）—— 轉化為具體的測試情境。在測試時，`pixie test` 會使用 `entry_kwargs` 呼叫 runnable，wrap 註冊表會填入 `eval_input`，評估器則會對產生的擷取輸出進行評分。

---

## 理解 `entry_kwargs`、`eval_input` 和 `expectation`

在建構資料集之前，請先了解這些術語的含義：

- **`entry_kwargs`** = 作為 Pydantic 模型傳遞給 `Runnable.run()` 的 kwargs。這些是進入點輸入（使用者訊息、請求主體、CLI 參數）。鍵值必須與為 `run(args: T)` 定義的 Pydantic 模型欄位匹配。

- **`eval_input`** = 對應於應用程式中 `wrap(purpose="input")` 呼叫的 `{"name": ..., "value": ...}` 物件清單。在測試時，這些會由 wrap 註冊表自動注入；應用程式中的 `wrap(purpose="input")` 呼叫會傳回註冊表的值，而不是呼叫實際的外部依賴項。

  **關鍵 (CRITICAL)**：`eval_input` 必須具有**至少一個項目**（由 `min_length=1` 驗證強制執行）。如果應用程式沒有 `wrap(purpose="input")` 呼叫，您仍必須包含至少一個 `eval_input` 項目 —— 使用主要進入點參數作為合成輸入：

  ```json
  "eval_input": [
    { "name": "user_input", "value": "您的營業時間是幾點？" }
  ]
  ```

  每個項目都是一個具有 `name` (str) 和 `value` (任何可 JSON 序列化的值) 的 `NamedData` 物件。

- **`expectation`**（選填）= 特定案例的評估參考。正確的輸出在此情境下應該長什麼樣子。由將輸出與參考進行比較的評估器使用（例如：`Factuality`、`ClosedQA`）。對於不需要參考的輸出品質 (output-quality) 評估器則不需要。

- **eval output** = 應用程式實際產生的內容，在執行時透過 `wrap(purpose="output")` 和 `wrap(purpose="state")` 呼叫擷取。**不儲存在資料集中** —— 它是在 `pixie test` 執行應用程式時產生的。

位於 `pixie_qa/reference-trace.jsonl` 的**參考追蹤 (reference trace)** 是您資料形狀的主要來源：

- 對其進行過濾以查看 `eval_input` 值的精確序列化格式
- 閱讀 `kwargs` 記錄以了解 `entry_kwargs` 結構
- 閱讀 `purpose="output"/"state"` 事件以了解應用程式產生的輸出，以便編寫有意義的 `expectation` 值

---

## 4a. 推導評估器分配

評估準則成品 (`pixie_qa/02-eval-criteria.md`) 將每個準則對應到使用案例。評估器對應成品 (`pixie_qa/03-evaluator-mapping.md`) 則將每個準則對應到具體的評估器名稱。結合這些：

1. **資料集層級預設評估器**：標記為套用於「所有 (All)」使用案例的準則 → 其評估器名稱放入頂層的 `"evaluators"` 陣列中。
2. **項目層級評估器**：僅套用於子集的準則 → 其評估器名稱僅放入相關列的 `"evaluators"` 中，使用 `"..."` 來同時包含預設值。

## 4b. 使用 `pixie format` 檢查資料形狀

在參考追蹤上使用 `pixie format` 以查看精確的資料形狀**以及**資料集項目格式的實際應用程式輸出：

```bash
pixie format --input reference-trace.jsonl --output dataset-sample.json
```

輸出看起來如下：

```json
{
  "entry_kwargs": {
    "user_message": "What are your business hours?"
  },
  "eval_input": [
    {
      "name": "customer_profile",
      "value": { "name": "Alice", "tier": "gold" }
    },
    {
      "name": "conversation_history",
      "value": [{ "role": "user", "content": "What are your hours?" }]
    }
  ],
  "expectation": null,
  "eval_output": {
    "response": "Our business hours are Monday to Friday, 9am to 5pm..."
  }
}
```

**重要**：此範本中的 `eval_output` 是執行中應用程式產生的**完整實際輸出**。請勿將 `eval_output` 複製到您的資料集項目中 —— 這會因為給予評估器真實答案而使測試輕易通過。相反地：

- 使用 `entry_kwargs` 和 `eval_input` 作為資料鍵值和格式的精確範本
- 查看 `eval_output` 以了解應用程式產生的內容 —— 然後編寫一個**簡潔的 `expectation` 描述**，擷取每個情境的關鍵品質準則

**範例**：如果 `eval_output.response` 是 `"Our business hours are Monday to Friday, 9 AM to 5 PM, and Saturday 10 AM to 2 PM."`，將 `expectation` 寫為 `"應提到平日營業時間 (週一至週五 9am–5pm) 和週六營業時間"` —— 這是一個真人或 LLM 評估器可以進行比較的簡短描述。

## 4c. 產生資料集項目

在參考追蹤和使用案例的引導下建立多樣化的項目：

- **`entry_kwargs` 鍵值**必須與 `Runnable.run(args: T)` 中使用的 Pydantic 模型欄位匹配
- **`eval_input`** 必須是與應用程式中 `wrap(purpose="input")` 呼叫的 `name` 值匹配的 `{"name": ..., "value": ...}` 物件清單
- **涵蓋來自 `pixie_qa/02-eval-criteria.md` 的每個使用案例** —— 每個使用案例至少一個項目，且各個項目之間具有具意義的多樣化輸入

**如果使用者在提示中指定了資料集或資料來源**（例如：包含研究問題或對話情境的 JSON 檔案），請閱讀該檔案，將每個項目改編為 `entry_kwargs` / `eval_input` 形狀，並將其納入資料集中。請勿忽略指定的資料。

## 4d. 建構資料集 JSON 檔案

在 `pixie_qa/datasets/<name>.json` 建立資料集：

```json
{
  "name": "qa-golden-set",
  "runnable": "pixie_qa/scripts/run_app.py:AppRunnable",
  "evaluators": ["Factuality", "pixie_qa/evaluators.py:concise_voice_style"],
  "entries": [
    {
      "entry_kwargs": {
        "user_message": "What are your business hours?"
      },
      "description": "客戶詢問金級帳戶的營業時間",
      "eval_input": [
        {
          "name": "customer_profile",
          "value": { "name": "Alice Johnson", "tier": "gold" }
        }
      ],
      "expectation": "應提到週一至週五 9am-5pm 和週六 10am-2pm"
    },
    {
      "entry_kwargs": {
        "user_message": "我想更改一些東西"
      },
      "description": "來自基本層級客戶的模糊更改請求",
      "eval_input": [
        {
          "name": "customer_profile",
          "value": { "name": "Bob Smith", "tier": "basic" }
        }
      ],
      "expectation": "應要求澄清",
      "evaluators": ["...", "ClosedQA"]
    },
    {
      "entry_kwargs": {
        "user_message": "我想結束通話"
      },
      "description": "使用者在驗證失敗後請求結束通話",
      "eval_input": [
        {
          "name": "customer_profile",
          "value": { "name": "Charlie Brown", "tier": "basic" }
        }
      ],
      "expectation": "代理程式應呼叫 endCall 工具並結束對話",
      "eval_metadata": {
        "expected_tool": "endCall",
        "expected_call_ended": true
      },
      "evaluators": ["...", "pixie_qa/evaluators.py:tool_call_check"]
    }
  ]
}
```

### 關鍵欄位

**項目結構** —— 每個項目的所有欄位都是頂層的（扁平結構 —— 無嵌套）：

```
entry:
  ├── entry_kwargs    (必填) — Runnable.run() 的參數
  ├── eval_input      (必填) — {"name": ..., "value": ...} 物件清單
  ├── description     (必填) — 測試案例的人類可讀標籤
  ├── expectation     (選填) — 基於比較的評估器參考
  ├── eval_metadata   (選填) — 自訂評估器的額外單一項目資料
  └── evaluators      (選填) — 此項目的評估器名稱
```

**頂層欄位：**

- **`runnable`** (必填)：對步驟 2 中 `Runnable` 類別的 `filepath:ClassName` 參考（例如：`"pixie_qa/scripts/run_app.py:AppRunnable"`）。路徑相對於專案根目錄。
- **`evaluators`** (資料集層級，選填)：套用於每個項目的預設評估器名稱 —— 適用於「所有」使用案例之準則的評估器。

**單一項目欄位（均位於每個項目的頂層）：**

- **`entry_kwargs`** (必填)：鍵值與 `Runnable.run(args: T)` 的 Pydantic 模型欄位匹配。這些是應用程式的進入點輸入。
- **`eval_input`** (必填)：`{"name": ..., "value": ...}` 物件清單。名稱與應用程式中的 `wrap(purpose="input")` 名稱匹配。
- **`description`** (必填)：來自 `pixie_qa/02-eval-criteria.md` 的使用案例摘要。
- **`expectation`** (選填)：需要參考的評估器的特定案例期望文字。
- **`eval_metadata`** (選填)：自訂評估器的額外單一項目資料 —— 例如：預期的工具名稱、布林旗標、閾值。可在評估器中透過 `evaluable.eval_metadata` 存取。
- **`evaluators`** (選填)：列層級評估器覆寫。

### 評估器分配規則

1. 套用於「所有」項目的評估器放入頂層的 `"evaluators"` 陣列中。
2. 需要**額外**評估器的項目使用 `"evaluators": ["...", "ExtraEval"]` —— `"..."` 會展開為預設值。
3. 需要**完全不同**設定的項目使用 `"evaluators": ["OnlyThis"]` 且不包含 `"..."`。
4. 僅使用預設值的項目：省略 `"evaluators"` 欄位。

---

## 資料集建立參考

### 使用 `eval_input` 值

`eval_input` 值是 `{"name": ..., "value": ...}` 物件。將參考追蹤用作範本 —— 複製相關 `purpose="input"` 事件中的 `"data"` 欄位並調整其值：

**簡單字典 (Simple dict)**：

```json
{ "name": "customer_profile", "value": { "name": "Alice", "tier": "gold" } }
```

**字典清單 (List of dicts)**（例如：對話歷史紀錄）：

```json
{
  "name": "conversation_history",
  "value": [
    { "role": "user", "content": "您好" },
    { "role": "assistant", "content": "您好！" }
  ]
}
```

**重要**：確切格式取決於 `wrap(purpose="input")` 呼叫擷取的內容。請始終從參考追蹤複製，而不是從頭開始建構。

### 打造多樣化的評估情境

涵蓋每個使用案例的不同方面：

- 相同請求的不同使用者措辭
- 邊緣案例（模糊輸入、資訊缺失、錯誤狀況）
- 針對特定評估準則進行壓力測試的項目
- 每個來自步驟 1b 的使用案例至少包含一個項目

---

## 輸出

`pixie_qa/datasets/<name>.json` —— 資料集檔案。
