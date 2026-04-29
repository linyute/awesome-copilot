# 步驟 4：建立資料集

**為何需要此步驟**：資料集將所有內容串聯在一起 — Runnable (步驟 2)、評估器 (步驟 3) 和使用案例 (步驟 1c) — 轉化為具體的測試場景。在測試時，`pixie test` 使用 `input_data` 呼叫 Runnable，Wrap 註冊表會填充 `eval_input`，評估器則會對產生的擷取輸出進行評分。

**在建立項目之前**，請檢視：

- **`pixie_qa/00-project-analysis.md`** — 能力清單和失敗模式。資料集項目應涵蓋能力清單中的項目，並包含針對所列失敗模式的項目。
- **`pixie_qa/02-eval-criteria.md`** — 使用案例及其能力覆蓋範圍。確保每個列出的使用案例都有具代表性的項目。

---

## 理解 `input_data`、`eval_input` 與 `expectation`

在建立資料集之前，請先理解這些術語的含義：

- **`input_data`** = 作為 Pydantic 模型傳遞給 `Runnable.run()` 的關鍵字參數 (Kwargs)。這些是應用程式的輸入資料（使用者訊息、請求本文、CLI 參數）。鍵值必須與為 `run(args: T)` 定義的 Pydantic 模型欄位匹配。

- **`eval_input`** = 對應於應用程式中 `wrap(purpose="input")` 呼叫的 `{"name": ..., "value": ...}` 物件列表。在測試時，這些資料會由 Wrap 註冊表自動注入；應用程式中的 `wrap(purpose="input")` 呼叫會回傳註冊表中的值，而不會呼叫真實的外部相依性。

  只有當應用程式沒有 `wrap(purpose="input")` 呼叫時，`eval_input` **才可為空列表**。**如果應用程式具有 Input Wrap，則每個資料集項目必須提供對應的 `eval_input` 值及其預先擷取的內容** — 否則應用程式在評估期間會發起真實的外部呼叫，這會導致評估緩慢、不穩定且不可重現。參見第 4b′ 節了解如何擷取這些內容。

  每個項目都是一個 `NamedData` 物件，具有 `name` (str) 和 `value` (任何 JSON 可序列化值)。

- **`expectation`** (選用) = 案例特定的評估參考。正確的輸出在此場景下應有的樣子。由需要將輸出與參考進行比較的評估器使用（例如：`Factuality`, `ClosedQA`）。對於不需要參考的輸出品質評估器，則不需要此欄位。

- **評估輸出 (Eval output)** = 應用程式實際產生的內容，由執行階段的 `wrap(purpose="output")` 和 `wrap(purpose="state")` 呼叫擷取。**不儲存在資料集中** — 它是在 `pixie test` 執行應用程式時產生的。

位於 `pixie_qa/reference-trace.jsonl` 的**參考追蹤**是你的資料形狀事實來源：

- 篩選它以查看 `eval_input` 值的確切序列化格式。
- 閱讀 `kwargs` 記錄以理解 `input_data` 的結構。
- 閱讀 `purpose="output"/"state"` 事件以理解應用程式產生的輸出，以便編寫有意義的 `expectation` 值。

---

## 4a. 推導評估器分配

評估標準成品 (`pixie_qa/02-eval-criteria.md`) 將每個標準映射到使用案例。評估器映射成品 (`pixie_qa/03-evaluator-mapping.md`) 將每個標準映射到具體的評估器名稱。將兩者結合：

1. **資料集層級預設評估器**：標記為適用於「所有」使用案例的標準 → 其評估器名稱進入頂層的 `"evaluators"` 陣列。
2. **項目層級評估器**：僅適用於子集的標準 → 其評估器名稱進入相關資料列中的 `"evaluators"`，並使用 `"..."` 來包含預設值。

## 4b. 使用 `pixie format` 檢查資料形狀

在參考追蹤上執行 `pixie format`，以資料集項目格式查看確切的資料形狀**以及**應用程式的實際輸出：

```bash
uv run pixie format --input reference-trace.jsonl --output dataset-sample.json
```

輸出如下所示：

```json
{
  "input_data": {
    "user_message": "你們的營業時間是幾點？"
  },
  "eval_input": [
    {
      "name": "customer_profile",
      "value": { "name": "Alice", "tier": "gold" }
    },
    {
      "name": "conversation_history",
      "value": [{ "role": "user", "content": "你們的營業時間是幾點？" }]
    }
  ],
  "expectation": null,
  "eval_output": {
    "response": "我們的營業時間是週一至週五，上午 9 點至下午 5 點..."
  }
}
```

**重要提示**：此範本中的 `eval_output` 是由運行中的應用程式產生的**完整實際輸出**。**請勿**將 `eval_output` 複製到你的資料集項目中 — 這會給予評估器真實答案，使測試變得毫無意義（恆真）。相反地：

- 使用 `input_data` 和 `eval_input` 作為資料鍵值和格式的精確範本。
- 查看 `eval_output` 以了解應用程式產生的內容 — 然後編寫一個**簡潔的 `expectation` 說明**，擷取每個場景的關鍵品質標準。

**範例**：如果 `eval_output.response` 是 `"我們的營業時間是週一至週五上午 9 點至下午 5 點，以及週六上午 10 點至下午 2 點。"`, 則將 `expectation` 寫成 `"應提及平日營業時間 (週一至週五 9am-5pm) 和週六營業時間"` — 這是一段人類或 LLM 評估器可以進行比較的簡短說明。

## 4b′. 擷取 `eval_input` 的外部內容 (強制要求)

**關鍵要求**：如果應用程式具有任何 `wrap(purpose="input")` 呼叫，則每個資料集項目**必須**在 `eval_input` 中提供對應的**預先擷取的真實內容**。空的 `eval_input` 列表意味著應用程式將在每次評估執行期間發起真實的外部呼叫（HTTP 請求、資料庫查詢、API 呼叫）— 這會使評估變得緩慢、不穩定且不可重現。

### 為什麼這很重要

在執行 `pixie test` 期間，應用程式中的每個 `wrap(purpose="input", name="X")` 呼叫都會檢查 Wrap 註冊表是否有具名為 `"X"` 的值：

- **如果找到**：直接回傳註冊的值（不發起外部呼叫）。
- **如果未找到**：執行真實的外部呼叫（非確定性、緩慢、可能會失敗）。

`eval_input: []` 項目意味著註冊表中沒有任何內容，因此每個外部相依性都會即時執行。這違背了檢測 (Instrumentation) 的初衷。

### 如何擷取內容

對於應用程式中的每個 `wrap(purpose="input", name="X")`，你必須擷取一次真實資料並將其嵌入資料集中。請選擇以下方法之一：

**選項 A — 使用參考追蹤** (偏好方式)：

來自步驟 2c 的參考追蹤已經包含每個 `purpose="input"` Wrap 的擷取值。擷取它們：

```bash
# 查看參考追蹤以尋找 Input Wrap 值
grep '"purpose": "input"' pixie_qa/reference-trace.jsonl
```

或者使用 `pixie format` 以資料集項目格式查看資料 — 輸出中的 `eval_input` 陣列已經包含具有正確名稱和形狀的擷取值。

**選項 B — 直接獲取內容** (適用於具有不同輸入的新項目)：

在建立具有不同輸入源（例如：不同的 URL、不同的查詢）的資料集項目時，透過執行一次相依性程式碼來擷取內容：

```python
# 範例：對於網頁抓取工具，執行一次應用程式自身的獲取邏輯
from myapp.fetcher import fetch_page
page_content = fetch_page(target_url)  # 使用應用程式的真實程式碼路徑
```

然後將擷取的內容包含在項目的 `eval_input` 中：

```json
{
  "eval_input": [
    {
      "name": "fetch_result",
      "value": "<在此處填入擷取的頁面內容>"
    }
  ]
}
```

**選項 C — 對每個輸入執行 `pixie trace`** (最徹底的方式)：

對於每一組 `input_data`，執行 `pixie trace` 以使用真實相依性執行應用程式並擷取所有值：

```bash
pixie trace --runnable pixie_qa/run_app.py:AppRunnable --input  trace-input.json
```

然後從產生的追蹤中擷取 `purpose="input"` 值並將其用作 `eval_input`。

### 內容格式

`eval_input` 值必須與 `wrap()` 呼叫回傳的**確切類型和格式**匹配。檢查參考追蹤以查看應用程式產生的格式：

- 如果 Wrap 擷取的是字串（例如：HTML 內容、Markdown 文本），則值為字串。
- 如果 Wrap 擷取的是字典（例如：資料庫記錄），則值為 JSON 物件。
- 如果 Wrap 擷取的是列表，則值為 JSON 陣列。

**不要跳過此步驟**。應用程式中的每個 `wrap(purpose="input")` 必須在每個資料集資料列中都有對應的 `eval_input` 項目。如果你在應用程式有 Input Wrap 的情況下仍使用空的 `eval_input` 繼續執行，評估將會不可靠。

## 4c. 產生資料集項目

在參考追蹤和使用案例的引導下，建立多樣化的項目：

- **`input_data` 鍵值**必須與 `Runnable.run(args: T)` 中使用的 Pydantic 模型欄位匹配。
- **`eval_input`** 必須是 `{"name": ..., "value": ...}` 物件列表，且名稱應與應用程式中的 `wrap(purpose="input")` 名稱匹配。
- **涵蓋 `pixie_qa/02-eval-criteria.md` 中的每個使用案例** — 每個使用案例至少一個項目，且各個項目之間的輸入應有顯著差異。

**如果使用者在提示詞中指定了資料集或資料來源** (例如：包含研究問題或對話場景的 JSON 檔案)，請閱讀該檔案，將每個項目改編為 `input_data` / `eval_input` 的形狀，並將其納入資料集中。**請勿**忽略指定的資料。

### 項目品質檢查表

在完成資料集之前，請根據以下標準驗證每個項目：

**輸入真實性**：

- `eval_input` 是否包含遵守合成邊界 (參見步驟 2c) 的現實世界資料？使用者編寫的參數可以接受；現實世界資料應從來源獲取，而非憑空捏造。
- `eval_input` 中的現實世界資料是否符合 `00-project-analysis.md`「現實輸入特性」中描述的規模和複雜度？如果分析指出輸入通常為 5KB–500KB，那麼 200 字元的輸入就不具代表性。
- 提示詞的答案是否難以從輸入中擷取？如果答案位於標記清晰的 HTML 標籤或第一句話中，則無法測試擷取品質。

**場景多樣性**：

- 項目是否涵蓋了顯著不同的難度等級 — 而不僅僅是相同難度的不同主題？
- 是否至少有一個項目針對 `00-project-analysis.md` 中的失敗模式，且你預期該項目可能真的會導致評分下降（而非保證通過）？
- 項目是否在輸入資料中使用了不同的結構模式（而不僅僅是將不同的內容填入同一個範本）？

**難度校準**：

- 是否至少有一個項目是你真的不確定應用程式是否能正確處理的？如果你確信每個項目都能輕易通過，則資料集太簡單了。
- 考慮包含一個刻意具有挑戰性、用以探測已知限制的項目 — 即「壓力測試 (Stress test)」項目。如果它通過了，那很好。如果失敗了，評估已證明其能捕捉真實問題。

### 資料集項目的反模式

- **捏造現實世界資料**：手動編寫應用程式通常從外部來源獲取的內容（例如：為網頁抓取工具編寫 HTML、為 RAG 系統編寫「擷取的文件」）。這消除了現實世界的複雜性。
- **難度單一**：所有項目都具有相同的複雜程度。真實的工作負載呈分佈狀態 — 有些簡單、有些困難、有些是邊緣案例。
- **答案過於明顯**：每個項目的目標資訊都標記清晰且無歧義。真實資料通常會使答案分散、部分呈現、帶有變體的重複或嵌入在雜訊中。
- **回環式作者身份 (Round-trip authorship)**：你同時編寫了輸入和預期輸出，因此你完全知道裡面有什麼。真正的評估是測試應用程式是否能找到它以前未曾見過的資訊。
- **僅限正常路徑 (Happy paths)**：沒有項目測試錯誤條件、邊緣案例或已知的失敗模式。
- **從同一個簡單追蹤透過微小的措辭修改來建立所有項目**：如果所有項目都具有相似的 `input_data` 和相似的 `eval_input` 資料，則資料集無法測試出任何有意義的結果。每個項目都應代表一個顯著不同的場景。
- **重複使用專案自身的測試固定裝置 (Fixtures) 作為評估資料**：專案的 `tests/`、`fixtures/`、`examples/` 和模擬伺服器目錄包含專為單元/整合測試設計的資料 — 體量小、乾淨、確定性強且極度簡單。將它們用作 `eval_input` 資料會保證 100% 的通過率，且無法提供任何品質信號。即使這些固定裝置看起來很方便，它們也避開了使應用程式工作變得困難的每個現實挑戰。**請改為執行生產程式碼以擷取現實資料**，或產生符合 `00-project-analysis.md` 中規模/複雜度的合成資料。
- **使用專案的模擬/偽造 (Mock/Fake) 實作**：如果專案在其測試基礎設施中包含模擬 LLM、偽造 HTTP 伺服器或存根服務 (Stub services)，**切勿**在你的評估管線中使用它們。你的評估必須使用現實且複雜的資料來測試應用程式的真實程式碼路徑 — 而不是專案自身的測試捷徑。

## 4c′. 針對專案分析驗證覆蓋範圍

在撰寫最終的資料集 JSON 之前，請開啟 `pixie_qa/00-project-analysis.md` 並檢查：

1. **現實輸入特性**：對於列出的每項特性（大小、複雜度、雜訊、多樣性），確認至少有一個資料集項目反映了該特性。如果分析指出「包含導航欄和廣告的混亂輸入」，則至少有一個項目的 `eval_input` 應包含帶有導航欄和廣告的混亂資料。
2. **失敗模式**：對於列出的每個失敗模式，確認至少有一個資料集項目旨在測試它。該項目不需要保證失敗 — 但它應創造該失敗模式「可能」顯現的條件。如果目前的檢測設定無法測試某個失敗模式，請在 `02-eval-criteria.md` 中增加註記並說明原因。
3. **能力覆蓋範圍**：確認資料集涵蓋了評估標準 (步驟 1c) 中列出的能力。每個涵蓋的能力都應至少有一個項目。

如果發現任何缺口，請在繼續步驟 4d 之前增加項目以填補缺口。

## 4c″. 停止檢查 — 資料集真實性稽核 (硬性關卡)

**這是一個硬性關卡**。在所有檢查通過之前，**請勿**繼續步驟 4d。如果任何檢查失敗，請修改資料集並重新稽核。

在撰寫最終的資料集 JSON 之前，請執行此自我稽核：

1. **交叉引用 `00-project-analysis.md`**：開啟「現實輸入特性」章節。對於每項特性（大小、複雜度、雜訊、結構），驗證至少有一個資料集項目的 `eval_input` 反映了該特性。如果分析指出「5KB–500KB 包含導航欄和廣告的 HTML 頁面」，而你最大的 `eval_input` 只有 1KB 的乾淨 HTML，**則資料集不具真實性 — 請增加難度更高的項目。**

2. **計算相異來源數量**：資料集中有多少個唯一的 `eval_input` 資料來源？如果超過 50% 的項目共享相同的 `eval_input` 內容（即使提示詞不同），則資料集缺乏多樣性。對同一輸入進行提示詞變體僅是在測試 LLM 的解釋能力，而非應用程式的資料處理能力。

3. **難度分佈 (強制門檻)**：對於每個項目，將其標記為「例行性」(routine，確信會通過)、「中等」(moderate，可能會通過但非輕而易舉) 或「挑戰性」(challenging，真的不確定結果或針對已知失敗模式)。

   - **「例行性」項目最高佔 60%**。如果你有 5 個項目，最多只能有 3 個是例行性的。
   - **至少一個「挑戰性」項目**，其目標是 `00-project-analysis.md` 中你真的不確定結果的失敗模式。如果每個項目都保證通過，則資料集無法區分優秀的應用程式與損壞的應用程式。

4. **能力覆蓋範圍 (強制門檻)**：計算 `00-project-analysis.md` 中有多少能力被至少一個資料集項目測試過。

   - **必須涵蓋 ≥50% 的所列能力**。如果分析列出了 6 個能力，則資料集必須測試至少 3 個。
   - 如果覆蓋率低於門檻，請增加針對未涵蓋能力的項目。

5. **專案固定裝置 (Fixture) 污染檢查**：掃描每個 `eval_input` 值。是否有任何資料源自專案的 `tests/`、`fixtures/`、`examples/` 或模擬伺服器目錄？如果是，**請用現實世界資料替換它**。這些固定裝置是為了開發便利而設計的，而非評估真實性。

6. **恆真性 (Tautology) 檢查**：測試管線是否會產生有意義的分數，還是一個封閉迴圈？如果你同時編寫了輸入資料和評估器邏輯，使得通過是結構上保證的（例如：正則表達式擷取器 + 針對手動編寫 HTML 的精確匹配評估器），**則管線是恆真的**，無法捕捉真實問題。應用程式的真實 LLM 應產生輸出，評估器則應評估真正可能失敗的品質維度。

7. **`eval_input` 完整性檢查**：對於檢測過的應用程式程式碼中的每個 `wrap(purpose="input", name="X")` 呼叫，驗證「每個」資料集項目都提供了一個對應的 `eval_input` 項目，且具有 `"name": "X"` 和非空值的 `"value"`。如果應用程式有 Input Wrap 卻有任何項目的 `eval_input: []`，**則資料集不完整 — 缺失擷取的內容**。請回到步驟 4b′ 擷取內容。

## 4d. 建置資料集 JSON 檔案

在 `pixie_qa/datasets/<name>.json` 建立資料集：

```json
{
  "name": "qa-golden-set",
  "runnable": "pixie_qa/run_app.py:AppRunnable",
  "evaluators": ["Factuality", "pixie_qa/evaluators.py:ConciseVoiceStyle"],
  "entries": [
    {
      "input_data": {
        "user_message": "你們的營業時間是幾點？"
      },
      "description": "黃金級帳戶客戶詢問營業時間",
      "eval_input": [
        {
          "name": "customer_profile",
          "value": { "name": "Alice Johnson", "tier": "gold" }
        }
      ],
      "expectation": "應提及週一至週五 9am-5pm 以及週六 10am-2pm"
    },
    {
      "input_data": {
        "user_message": "我想變更一些內容"
      },
      "description": "基礎級客戶發出模糊的變更請求",
      "eval_input": [
        {
          "name": "customer_profile",
          "value": { "name": "Bob Smith", "tier": "basic" }
        }
      ],
      "expectation": "應要求進一步澄清",
      "evaluators": ["...", "ClosedQA"]
    },
    {
      "input_data": {
        "user_message": "我想結束通話"
      },
      "description": "驗證失敗後使用者請求結束通話",
      "eval_input": [
        {
          "name": "customer_profile",
          "value": { "name": "Charlie Brown", "tier": "basic" }
        }
      ],
      "expectation": "助手應呼叫 endCall 工具並結束對話",
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

**項目結構** — 每個項目中的所有欄位都是頂層的（扁平結構 — 無巢狀）：

```
entry:
  ├── input_data    (必要) — Runnable.run() 的參數
  ├── eval_input      (選用) — {"name": ..., "value": ...} 物件列表 (預設：[])
  ├── description     (必要) — 測試案例的人讀標籤
  ├── expectation     (選用) — 基於比較的評估器的參考資料
  ├── eval_metadata   (選用) — 自訂評估器的額外每項目資料
  └── evaluators      (選用) — 此項目的評估器名稱
```

**頂層欄位：**

- **`runnable`** (必要)：指向步驟 2 中 `Runnable` 類別的 `filepath:ClassName` 參考（例如：`"pixie_qa/run_app.py:AppRunnable"`）。路徑相對於專案根目錄。
- **`evaluators`** (資料集層級，選用)：套用到每個項目的預設評估器名稱 — 即適用於「所有」使用案例標準的評估器。

**每項目欄位 (皆為項目的頂層欄位)：**

- **`input_data`** (必要)：鍵值必須與 `Runnable.run(args: T)` 的 Pydantic 模型欄位匹配。這些是應用程式的輸入資料。
- **`eval_input`** (選用，預設 `[]`)：`{"name": ..., "value": ...}` 物件列表。名稱應與應用程式中的 `wrap(purpose="input")` 名稱匹配。執行器在建立 `Evaluable` 時會自動在前面加上 `input_data`。
- **`description`** (必要)：來自 `pixie_qa/02-eval-criteria.md` 的使用案例單行說明。
- **`expectation`** (選用)：針對需要參考資料的評估器的案例特定預期文本。
- **`eval_metadata`** (選用)：自訂評估器的額外每項目資料 — 例如：預期的工具名稱、布林旗標、閾值。在評估器中透過 `evaluable.eval_metadata` 存取。
- **`evaluators`** (選用)：資料列層級的評估器覆蓋。

### 評估器分配規則

1. 適用於「所有」項目的評估器進入頂層的 `"evaluators"` 陣列。
2. 需要**額外**評估器的項目使用 `"evaluators": ["...", "ExtraEval"]` — `"..."` 會展開為預設值。
3. 需要**完全不同**評估器組合的項目使用 `"evaluators": ["OnlyThis"]`（不使用 `"..."`）。
4. 僅使用預設評估器的項目：省略 `"evaluators"` 欄位。

---

## 建立資料集參考

### 使用 `eval_input` 值

`eval_input` 值是 `{"name": ..., "value": ...}` 物件。使用參考追蹤作為範本 — 複製相關 `purpose="input"` 事件中的 `"data"` 欄位並修改其值：

**簡單字典**：

```json
{ "name": "customer_profile", "value": { "name": "Alice", "tier": "gold" } }
```

**字典列表**（例如：對話紀錄）：

```json
{
  "name": "conversation_history",
  "value": [
    { "role": "user", "content": "你好" },
    { "role": "assistant", "content": "嗨，你好！" }
  ]
}
```

**重要提示**：確切格式取決於 `wrap(purpose="input")` 呼叫所擷取的內容。務必從參考追蹤中複製，而非從頭開始建置。

### 精心設計多樣化的評估場景

涵蓋每個使用案例的不同面向。參考 **`pixie_qa/00-project-analysis.md`** 以了解能力清單和失敗模式：

- **涵蓋每個能力** — 每個來自能力清單的能力至少一個項目，而不僅僅是主要能力。
- **目標失敗模式** — 包含針對專案分析中列出的硬性問題/失敗模式（例如：格式錯誤的輸入、邊緣案例、複雜場景）的項目。
- 同一個請求的不同使用者措辭。
- 邊緣案例（模糊的輸入、缺失的資訊、錯誤條件）。
- 壓力測試特定評估標準的項目。
- 每個來自步驟 1c 的使用案例至少一個項目。

---

## 輸出

`pixie_qa/datasets/<name>.json` — 資料集檔案。
