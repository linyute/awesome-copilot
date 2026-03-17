---
name: eval-driven-dev
description: 檢測 Python LLM 應用程式、建構黃金資料集、編寫基於評估的測試、執行測試並分析失敗的根本原因 — 涵蓋完整的評估驅動開發週期。每當使用者開發、測試、QA、評估或基準測試呼叫 LLM 的 Python 專案時，務必使用此技能，即使他們沒有明確說出「評估 (evals)」。用於確保 AI 應用程式正常運作、在提示 (prompt) 變更後捕捉迴歸、除錯代理程式行為差異的原因，或在發布前驗證輸出品質。
---

# 使用 pixie 進行評估驅動開發 (Eval-Driven Development)

此技能的核心在於執行工作，而非描述。當使用者要求你為其應用程式設定評估時，你應該讀取其程式碼、編輯其檔案、執行命令並產生一個可運作的測試管線 — 而非為他們編寫一份稍後遵循的計劃。

**所有由 pixie 產生的檔案都位於專案根目錄下的單一 `pixie_qa` 目錄中：**

```
pixie_qa/
  MEMORY.md              # 你的理解與評估計劃
  observations.db        # SQLite 追蹤資料庫 (由 enable_storage 自動建立)
  datasets/              # 黃金資料集 (JSON 檔案)
  tests/                 # 評估測試檔案 (test_*.py)
  scripts/               # 輔助指令稿 (build_dataset.py 等)
```

---

## 設定與迭代：何時停止

**這至關重要。** 你的操作取決於使用者的要求。

### 「設定 QA」/「設定評估」/「新增測試」(設定意圖)

使用者想要一個**可運作的評估管線**。你的工作是第 0 到 6 階段：安裝、理解、檢測、編寫測試、建構資料集、執行測試。**在第一次測試執行後停止**，無論測試通過還是失敗。報告：

1. 你設定了什麼 (檢測、測試檔案、資料集)
2. 測試結果 (通過/失敗、分數)
3. 如果測試失敗：失敗內容和可能原因的**簡短摘要** — 但切勿修復任何內容

然後詢問：_「QA 設定已完成。測試顯示 N/M 通過。要我調查失敗原因並開始迭代嗎？」_

只有在使用者的確認後，才繼續進入第 7 階段 (調查與修復)。

**例外**：如果測試執行本身出錯 (匯入失敗、遺漏 API 金鑰、設定錯誤) — 這些是**設定問題**，而非評估失敗。修復它們並重新執行，直到獲得能反映實際應用程式品質 (而非損壞的管線) 的乾淨測試執行。

### 「修復」/「改進」/「除錯」/「為什麼 X 失敗」(迭代意圖)

使用者希望你調查並修復。完成所有階段，包括第 7 階段 — 調查失敗、找出根本原因、套用修復、重建資料集、重新執行測試、迭代。

### 歧義要求

如果意圖不明確，預設為**僅進行設定**，並在迭代前詢問。及早停止並詢問，比對使用者的應用程式程式碼進行不必要的變更更好。

---

## 評估邊界：要評估什麼

**評估驅動開發專注於依賴 LLM 的行為。** 目的在於捕捉系統中非確定性且難以用傳統單元測試進行測試的部分（即 LLM 呼叫及其驅動的決策）的品質迴歸。

### 範圍內 (評估此項)

- LLM 回應品質：事實正確性、相關性、格式合規性、安全性
- 代理程式路由決策：LLM 是否選擇了正確的工具/交接 (handoff)/操作？
- 提示 (Prompt) 有效性：提示是否產生所需的行為？
- 多輪連貫性：代理程式是否在多輪對話中保持上下文？

### 範圍外 (切勿使用評估測試此項)

- **工具實作** (資料庫查詢、API 呼叫、關鍵字比對、業務邏輯) — 這些是傳統軟體；請使用單元測試來測試它們
- **基礎架構** (身份驗證、速率限制、快取、序列化)
- **確定性的後處理** (格式化、過濾、排序結果)

邊界是：LLM 呼叫的**下游**的所有內容（工具、資料庫、API）都會產生確定性的輸出，這些輸出作為 LLM 驅動系統的**輸入**。評估測試應將這些視為給定的事實，並專注於 LLM 如何處理它們。

**範例**：如果 FAQ 工具具有關鍵字比對 Bug 並傳回錯誤資料，那就是傳統 Bug — 請透過常規程式碼變更修復它，而非調整評估閾值。評估測試的存在是為了驗證在*給定正確的工具輸出*的情況下，LLM 代理程式是否產生正確的面對使用者回應。

建構資料集和預期輸出時，**使用實際的工具/系統輸出作為基準事實 (Ground Truth)**。評估案例的預期輸出應反映在*系統實際產生的工具結果*下，正確的 LLM 回應是什麼樣子。

---

## 第 0 階段：確保安裝了 pixie-qa 且已設定 API 金鑰

在執行任何其他操作之前，請檢查 `pixie-qa` 套件是否可用：

```bash
python -c "import pixie" 2>/dev/null && echo "installed" || echo "not installed"
```

如果未安裝，請安裝它：

```bash
pip install pixie-qa
```

這提供了 `pixie` Python 模組、`pixie` CLI 和 `pixie test` 執行器 — 這些都是檢測和評估所需的。不要跳過此步驟；此技能中的所有其他內容都取決於它。

### 驗證 API 金鑰

受測應用程式幾乎肯定需要 LLM 提供者的 API 金鑰 (例如 `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)。像 `FactualityEval` 這樣的 LLM 作為審判者的評估器也需要 `OPENAI_API_KEY`。**在執行任何操作之前**，請驗證是否已設定金鑰：

```bash
[ -n "$OPENAI_API_KEY" ] && echo "OPENAI_API_KEY set" || echo "OPENAI_API_KEY missing"
```

如果未設定，請詢問使用者。在未設定金鑰的情況下，請勿繼續執行應用程式或評估 — 你將會遇到無聲失敗或匯入時的錯誤。

---

## 第 1 階段：了解應用程式

在觸碰任何程式碼之前，請花時間實際閱讀原始碼。程式碼會比詢問使用者告訴你更多資訊，並且這會讓你處於更有利的地位，能就評估內容和方式做出良好的決策。

### 調查內容

1. **軟體如何執行**：進入點是什麼？你如何啟動它？它是 CLI、伺服器還是函式庫函式？需要哪些引數、設定檔或環境變數？

2. **LLM 的所有輸入**：這不僅限於使用者的訊息。追蹤納入任何 LLM 提示中的每一段資料：
   - 使用者輸入 (查詢、訊息、上傳的檔案)
   - 系統提示 (硬編碼或範本化)
   - 檢索到的上下文 (RAG 區塊、搜尋結果、資料庫記錄)
   - 工具定義與函式結構 (schema)
   - 對話歷史記錄 / 記憶體
   - 變更提示行為的設定或功能旗標

3. **所有中間步驟與輸出**：逐步查看從輸入到最終輸出的程式碼路徑，並記錄每個階段：
   - 檢索 / 搜尋結果
   - 工具呼叫及其結果
   - 代理程式路由 / 交接決策
   - 中間 LLM 呼叫 (例如：在最終答案之前的摘要)
   - 後處理或格式化步驟

4. **最終輸出**：使用者看到什麼？它是什麼格式？品質期望是什麼？

5. **使用案例與預期行為**：應用程式應該處理哪些不同的事項？對於每個使用案例，「良好」的回應看起來像什麼？什麼構成失敗？

### 撰寫 MEMORY.md

將你的發現記錄在 `pixie_qa/MEMORY.md` 中。這是評估工作的主要工作文件。它應該是人類可讀的，且詳細到足以讓不熟悉專案的人了解應用程式與評估策略。

**至關重要：MEMORY.md 記錄你對現有應用程式程式碼的理解。它絕對不得包含對 pixie 命令、你計劃新增的檢測程式碼或尚不存在的指令稿/函式的參照。** 這些屬於後面的章節，且僅在實作後才加入。

了解章節應包括：

```markdown
# 評估備註：<專案名稱>

## 應用程式如何運作

### 進入點與執行流程

<說明如何啟動/執行應用程式，逐步說明發生的情況>

### LLM 呼叫的輸入

<針對程式碼庫中的每個 LLM 呼叫，記錄以下內容：>

- 在程式碼中的位置 (檔案 + 函式名稱)
- 使用什麼系統提示 (引用它或進行摘要)
- 哪些使用者/動態內容饋送到其中
- 哪些工具/函式可供其使用

### 中間處理

<描述輸入和輸出之間的任何步驟：>
- 檢索、路由、工具執行等。
- 包含每個步驟的程式碼指標 (檔案:行號)

### 最終輸出

<使用者看到什麼、什麼格式、品質門檻應該是多少>

### 使用案例

<列出應用程式處理的每個不同場景，以及良好/錯誤輸出的範例>

## 評估計劃

### 評估什麼以及為什麼

<品質面向：事實正確性、相關性、格式合規性、安全性等。>

### 評估精細度

<哪個函式/範圍 (span) 邊界擷取一個「測試案例」？為什麼是該邊界？>

### 評估器與標準

<針對每項評估測試，指定：評估器、資料集、閾值、推論>

### 評估所需的資料

<需要擷取哪些資料點，以及它們所在的程式碼指標>
```

如果程式碼中有某些內容確實不明確，請詢問使用者 — 但一旦你仔細閱讀了程式碼，大多數問題都會迎刃而解。

---

## 第 2 階段：決定評估內容

現在你已經了解了應用程式，你可以就測量內容做出周到的選擇：

- **最重要的品質維度是什麼？** QA 應用程式的事實正確性、結構化擷取的輸出格式、RAG 的相關性、面向使用者文字的安全性。
- **評估哪個範圍 (span)**：整個管線 (`root`) 還是僅 LLM 呼叫 (`last_llm_call`)？如果你正在除錯檢索，你可能會在不同於檢查最終答案品質的地方進行評估。
- **哪些評估器合適**：請參閱 `references/pixie-api.md` → 評估器。事實性 QA：`FactualityEval`；結構化輸出：`ValidJSONEval` / `JSONDiffEval`；RAG 管線：`ContextRelevancyEval` / `FaithfulnessEval`。
- **通過標準**：`ScoreThreshold(threshold=0.7, pct=0.8)` 意味著 80% 的案例必須得分 ≥ 0.7。思考一下此應用程式「足夠好」的樣子。
- **預期輸出**：`FactualityEval` 需要它們。格式評估器通常不需要。

在撰寫任何程式碼之前，請使用計劃更新 `pixie_qa/MEMORY.md`。

---

## 第 3 階段：檢測應用程式

將 pixie 檢測新增至**現有的生產環境程式碼**。目標是擷取已經作為應用程式正常執行路徑的一部分的函式的輸入和輸出。檢測必須位於**實際程式碼路徑**上 — 也就是應用程式在生產環境中執行時使用的相同程式碼 — 以便在評估執行和實際使用期間都能擷取追蹤。

### 在應用程式啟動時加入 `enable_storage()`

在應用程式啟動程式碼的開頭呼叫 `enable_storage()` 一次 — 在 `main()` 內部，或在伺服器初始化頂部。**切勿在模組層級** (檔案頂部，任何函式之外) 呼叫，因為這會導致在匯入時觸發儲存設定。

適合的位置：

- 在 `if __name__ == "__main__":` 區塊內部
- 在 FastAPI `lifespan` 或 `on_startup` 處理常式中
- 在 `main()` / `run()` 函式頂部
- 在測試檔案中的 `runnable` 函式內部

```python
# ✅ 正確 — 在應用程式啟動時
async def main():
    enable_storage()
    ...

# ✅ 正確 — 在測試的 runnable 中
def runnable(eval_input):
    enable_storage()
    my_function(**eval_input)

# ❌ 錯誤 — 在模組層級，在匯入時執行
from pixie import enable_storage
enable_storage()  # 只要有任何檔案匯入此模組，這就會執行！
```

### 使用 `@observe` 或 `start_observation` 包裝現有函式

**至關重要：檢測生產環境程式碼路徑。切勿為測試建立單獨的函式或替代程式碼路徑。**

`@observe` 裝飾器或 `start_observation` 上下文管理員應放置在應用程式在正常運作期間實際呼叫的**現有函式**上。如果應用程式的進入點是互動式 `main()` 循環，請檢測 `main()` 或它在每輪使用者對話中呼叫的核心函式 — 而非建立一個重複邏輯的新輔助函式。

```python
# ✅ 正確 — 裝飾現有的生產環境函式
from pixie import observe

@observe(name="answer_question")
def answer_question(question: str, context: str) -> str:  # 現有的函式
    ...  # 現有的程式碼，保持不變
```

```python
# ✅ 正確 — 在現有函式中使用上下文管理員
from pixie import start_observation

async def main():  # 現有的函式
    ...
    with start_observation(input={"user_input": user_input}, name="handle_turn") as obs:
        result = await Runner.run(current_agent, input_items, context=context)
        # ... 現有的回應處理 ...
        obs.set_output(response_text)
    ...
```

```python
# ❌ 錯誤 — 建立一個重複 main() 邏輯的新函式
@observe(name="run_for_eval")
async def run_for_eval(user_messages: list[str]) -> str:
    # 這重複了 main() 的功能，建立了一個與生產環境偏離的單獨程式碼路徑。
    # 請勿這樣做。
    ...
```

**規則：**

- **切勿為評估目的而在應用程式程式碼中新增新的包裝函式。**
- **切勿變更函式的介面** (引數、傳回型別、行為)。
- **切勿將生產環境邏輯重複到單獨的「可測試」函式中。**
- 檢測純粹是附加的 — 如果你移除所有 pixie 匯入和裝飾器，應用程式的運作方式應完全相同。
- 檢測後，在執行結束時呼叫 `flush()`，以確保所有範圍 (span) 都已寫入。
- 對於互動式應用程式 (CLI 循環、聊天介面)，請檢測**每輪處理**函式 — 即接收使用者輸入並產生回應的函式。評估 `runnable` 應該呼叫這個相同的函式。

**重要提示**：所有 pixie 符號都可以從頂層 `pixie` 套件匯入。切勿告訴使用者從子模組 (`pixie.instrumentation`, `pixie.evals`, `pixie.storage.evaluable` 等) 匯入 — 始終使用 `from pixie import ...`。

---

## 第 4 階段：編寫評估測試檔案

在建構資料集之前先編寫測試檔案。這看起來可能有些反常，但它會強迫你在開始收集資料之前決定你要衡量的實際內容 — 否則資料收集將會失去方向。

建立 `pixie_qa/tests/test_<功能>.py`。模式是：一個呼叫應用程式**現有生產環境函式**的 `runnable` 配接器，以及一個呼叫 `assert_dataset_pass` 的非同步測試函式：

```python
from pixie import enable_storage, assert_dataset_pass, FactualityEval, ScoreThreshold, last_llm_call

from myapp import answer_question


def runnable(eval_input):
    """在應用程式中重播一個資料集項目。

    呼叫生產環境應用程式使用的相同函式。
    這裡的 enable_storage() 確保在評估執行期間擷取追蹤。
    """
    enable_storage()
    answer_question(**eval_input)


async def test_factuality():
    await assert_dataset_pass(
        runnable=runnable,
        dataset_name="<資料集名稱>",
        evaluators=[FactualityEval()],
        pass_criteria=ScoreThreshold(threshold=0.7, pct=0.8),
        from_trace=last_llm_call,
    )
```

請注意，`enable_storage()` 屬於 `runnable` 內部，而非測試檔案中的模組層級 — 它需要在每次呼叫時觸發，以便為該特定執行擷取追蹤。

`runnable` 呼叫**生產環境使用的相同函式** — 它不建立新的程式碼路徑。唯一的附加內容是 `enable_storage()`，用於在評估期間擷取追蹤。

測試執行器是 `pixie test` (而非 `pytest`)：

```bash
pixie test                           # 執行目前目錄中所有的 test_*.py
pixie test pixie_qa/tests/           # 指定路徑
pixie test -k factuality             # 依名稱過濾
pixie test -v                        # 詳細 (verbose)：顯示每個案例的分數和推論
```

`pixie test` 會自動尋找專案根目錄 (包含 `pyproject.toml`, `setup.py` 或 `setup.cfg` 的目錄)，並將其新增至 `sys.path` — 就像 pytest 一樣。測試檔案中不需要 `sys.path` 的技巧。

---

## 第 5 階段：建構資料集

先建立資料集，然後透過使用具代表性的輸入**實際執行應用程式**來填入資料。這至關重要 — 資料集項目應包含真實的應用程式輸出和追蹤中繼資料，而非捏造的資料。

```bash
pixie dataset create <資料集名稱>
pixie dataset list   # 驗證它是否存在
```

### 執行應用程式並將追蹤擷取至資料集

編寫一個簡單的指令稿 (`pixie_qa/scripts/build_dataset.py`)，針對每個輸入呼叫已檢測的函式，清除 (flush) 追蹤，然後將它們儲存至資料集：

```python
import asyncio
from pixie import enable_storage, flush, DatasetStore, Evaluable

from myapp import answer_question

GOLDEN_CASES = [
    ("法國的首都是哪裡？", "巴黎"),
    ("光速是多少？", "每秒 299,792,458 公尺"),
]

async def build_dataset():
    enable_storage()
    store = DatasetStore()
    try:
        store.create("qa-golden-set")
    except FileExistsError:
        pass

    for question, expected in GOLDEN_CASES:
        result = answer_question(question=question)
        flush()

        store.append("qa-golden-set", Evaluable(
            eval_input={"question": question},
            eval_output=result,
            expected_output=expected,
        ))

asyncio.run(build_dataset())
```

或者，使用 CLI 進行單一案例擷取：

```bash
# 執行應用程式 (必須啟動 enable_storage())
python -c "from myapp import main; main('法國的首都是哪裡？')"

# 將根範圍 (root span) 儲存至資料集
pixie dataset save <資料集名稱>

# 或專門儲存最後一個 LLM 呼叫：
pixie dataset save <資料集名稱> --select last_llm_call

# 新增背景資訊：
pixie dataset save <資料集名稱> --notes "基礎地理問題"

# 針對 FactualityEval 等評估器附加預期輸出：
echo '"巴黎"' | pixie dataset save <資料集名稱> --expected-output
```

**建構資料集的關鍵規則：**

- **務必執行應用程式** — 切勿手動捏造 `eval_output`。重點在於擷取應用程式實際產生的內容。
- **包含預期輸出**，以便進行像 `FactualityEval` 這樣基於比較的評估。預期輸出應反映在**給定工具/系統實際傳回的內容下，正確的 LLM 回應** — 而非基於修復非 LLM Bug 的理想化答案。
- **涵蓋你關心的範圍**：正常案例、邊緣案例、應用程式可能出錯的場景。
- 使用 `pixie dataset save` 時，可評估項的 `eval_metadata` 將自動包含 `trace_id` 和 `span_id`，以便稍後進行除錯。

---

## 第 6 階段：執行測試

```bash
pixie test pixie_qa/tests/ -v
```

`-v` 旗標會顯示每個案例的分數和推論，這讓你更容易查看哪些通過，哪些沒通過。檢查通過率在給定的 `ScoreThreshold` 下是否合理。

**在此階段之後，如果使用者的意圖是「設定 (setup)」— 停止。** 報告結果並在繼續之前詢問。請參閱上面的「設定與迭代」。

---

## 第 7 階段：調查失敗原因

**僅當使用者要求進行迭代/修復，或在設定後明確確認時，才繼續執行此處。**

當測試失敗時，目標是了解*為什麼*，而不是調整閾值直到測試通過。調查必須徹底並記錄在案 — 使用者需要看到實際資料、你的推論以及你的結論。

### 步驟 1：取得詳細的測試輸出

```bash
pixie test pixie_qa/tests/ -v    # 顯示每個案例的分數和推論
```

擷取完整的詳細輸出。針對每個失敗案例，請記錄：

- `eval_input` (傳送的內容)
- `eval_output` (應用程式產生的內容)
- `expected_output` (預期內容，如果適用的話)
- 評估器分數與推論

### 步驟 2：檢查追蹤資料

針對每個失敗案例，查閱完整的追蹤以瞭解應用程式內部的運作情況：

```python
from pixie import DatasetStore

store = DatasetStore()
ds = store.get("<資料集名稱>")
for i, item in enumerate(ds.items):
    print(i, item.eval_metadata)   # trace_id 就在這裡
```

接著檢查完整的範圍樹：

```python
import asyncio
from pixie import ObservationStore

async def inspect(trace_id: str):
    store = ObservationStore()
    roots = await store.get_trace(trace_id)
    for root in roots:
        print(root.to_text())   # 完整的範圍樹：輸入、輸出、LLM 訊息

asyncio.run(inspect("此處填入-trace-id"))
```

### 步驟 3：根本原因分析

逐步查看追蹤並精確識別失敗的來源。常見模式：

| 症狀 | 可能原因 |
| ------- | ------------ |

**與 LLM 相關的失敗 (透過提示/模型/評估變更來修復)：**

| 症狀                                                | 可能原因                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| 儘管工具結果正確，輸出在事實上仍是錯誤的 | 提示未指示 LLM 忠實使用工具輸出 |
| 代理程式路由至錯誤的工具/交接 | 路由提示或交接描述不明確 |
| 輸出格式錯誤 | 提示中缺少格式說明 |
| LLM 產生幻覺 (hallucinated) 而非使用工具 | 提示未強制執行工具使用 |

**非 LLM 失敗 (透過傳統程式碼變更來修復，超出評估範圍)：**

| 症狀                                           | 可能原因                                            |
| ------------------------------------------------- | ------------------------------------------------------- |
| 工具傳回錯誤資料 | 工具實作中的 Bug — 修復工具，而非評估 |
| 由於關鍵字不匹配而根本未呼叫工具 | 工具選擇邏輯損壞 — 修復程式碼 |
| 資料庫傳回過時/錯誤的記錄 | 資料問題 — 獨立修復 |
| API 呼叫失敗並顯示錯誤 | 基礎架構問題 |

對於非 LLM 失敗：請在調查記錄中註明並建議修復程式碼，但**請勿調整評估期望或閾值以適應非 LLM 程式碼中的 Bug**。評估測試應在假設系統其餘部分正常運作的情況下衡量 LLM 的品質。

### 步驟 4：將發現記錄在 MEMORY.md 中

**每次失敗調查都必須以結構化格式記錄在 `pixie_qa/MEMORY.md` 中**：

```markdown
### 調查：<測試名稱> 失敗 — <日期>

**測試**：`pixie_qa/tests/test_customer_service.py` 中的 `test_faq_factuality`
**結果**：3/5 個案例通過 (60%)，閾值為 80% ≥ 0.7

#### 失敗案例 1：「哪些排數有額外的腿部空間？」

- **eval_input**：`{"user_message": "哪些排數有額外的腿部空間？"}`
- **eval_output**：「抱歉，我沒有額外腿部空間的確切排數...」
- **expected_output**：「第 5-8 排為豪華經濟艙，擁有額外的腿部空間」
- **評估器分數**：0.1 (FactualityEval)
- **評估器推論**：「輸出聲稱不知道答案，而參考內容明確指出是第 5-8 排...」

**追蹤分析**：
檢查了追蹤 `abc123`。範圍樹顯示：

1. 分流代理程式 (Triage Agent) 路由至 FAQ 代理程式 ✓
2. FAQ 代理程式呼叫 `faq_lookup_tool("哪些排數有額外的腿部空間？")` ✓
3. `faq_lookup_tool` 傳回「抱歉，我不知道...」← **根本原因**

**根本原因**：`faq_lookup_tool` (customer_service.py:112) 使用關鍵字比對。
座位 FAQ 項目是由關鍵字 `["seat", "seats", "seating", "plane"]` 觸發的。
問題「哪些排數有額外的腿部空間？」不包含這些關鍵字，因此掉入了預設的「我不知道」回應。

**分類**：非 LLM 失敗 — 關鍵字比對工具損壞。
LLM 代理程式正確路由至 FAQ 代理程式並使用了工具；工具本身傳回了錯誤資料。

**修復**：將 `"row"`, `"rows"`, `"legroom"` 新增至 `faq_lookup_tool` (customer_service.py:130) 中的座位關鍵字清單。這是傳統的程式碼修復，而非評估/提示變更。

**驗證**：修復後，重新執行：
\`\`\`bash
python pixie_qa/scripts/build_dataset.py # 重新整理資料集
pixie test pixie_qa/tests/ -k faq -v # 驗證
\`\`\`
```

### 步驟 5：修復並重新執行

進行針對性的變更，視需要重建資料集，然後重新執行。最後務必提供使用者正確的命令來進行驗證：

```bash
pixie test pixie_qa/tests/test_<功能>.py -v
```

---

## 記憶體範本 (Memory Template)

````markdown
# 評估備註：<專案名稱>

## 應用程式如何運作

### 進入點與執行流程

<說明如何啟動/執行應用程式。從輸入到輸出的逐步流程。>

### LLM 呼叫的輸入

<針對每個 LLM 呼叫，記錄以下內容：在程式碼中的位置、系統提示、動態內容、可用工具>

### 中間處理

<輸入和輸出之間的步驟：檢索、路由、工具呼叫等。每個步驟的程式碼指標。>

### 最終輸出

<使用者看到的內容。格式。品質期望。>

### 使用案例

<每個場景及良好/錯誤輸出的範例：>

1. <使用案例 1>：<說明>
   - 輸入範例：...
   - 良好輸出：...
   - 錯誤輸出：...

## 評估計劃

### 評估什麼以及為什麼

<品質面向與原理>

### 評估器與標準

| 測試 | 資料集 | 評估器 | 標準 | 原理 |
| ---- | ------- | --------- | -------- | --------- |
| ...  | ...     | ...       | ...      | ...       |

### 評估所需的資料

<要擷取的資料，附帶程式碼指標>

## 資料集

| 資料集 | 項目 | 目的 |
| ------- | ----- | ------- |
| ...     | ...   | ...     |

## 調查記錄

### <日期> — <測試名稱> 失敗

<如第 7 階段所述的完整結構化調查>
````

---

## 參考

請參閱 `references/pixie-api.md` 以取得所有 CLI 命令、評估器簽章以及 Python 資料集/儲存 API。
