# 步驟 2c：擷取並驗證參考追蹤

**目標**：透過 Runnable 執行應用程式，擷取追蹤 (Trace)，並驗證檢測 (Instrumentation) 和 Runnable 是否運作正常。追蹤證明了一切都已串接完成，並提供了步驟 4 中建立資料集所需的精確資料形狀。

---

## 選擇追蹤輸入

追蹤輸入決定了哪些程式碼路徑會被擷取。微不足道的輸入會產生微不足道的追蹤，從而遺漏應用程式的真實行為。

輸入必須反映根據你在步驟 2b 中閱讀過的 `pixie_qa/00-project-analysis.md` 中的「現實輸入特性」章節。

輸入分為兩個部分 — 請理解它們之間的邊界：

- **使用者提供的參數** (由你撰寫)：使用者輸入或設定的內容 — 提示詞、查詢、設定旗標、URL、結構描述定義。撰寫這些內容時應具有實際代表性。
- **世界資料** (從生產程式碼擷取，而非捏造)：應用程式在執行期間從外部來源獲取的內容 — 資料庫記錄、API 回應、檔案等。執行一次生產程式碼，將這些資料擷取到追蹤中。僅在以下情況下考慮使用合成資料產生：
  - 使用者明確指示你使用合成資料，或
  - 從真實來源獲取資料不切實際（擷取次數過多、產生實際費用，或耗時過長 — 超過 ~30 分鐘）。

**撰寫輸入前的快速檢查**：「使用者會建立這些資料，還是應用程式會從其他地方獲取？」如果是由應用程式獲取，請讓生產程式碼執行並進行擷取。

| 應用程式類型 | 使用者提供 (由你撰寫) | 世界提供 (由你獲取) |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| 網頁抓取工具 | URL + 提示詞 + 結構描述定義 | HTML 頁面內容 |
| 研究代理 | 研究問題 + 範圍約束 | 來源文件、搜尋結果 |
| 客戶支援機器人 | 客戶說出的訊息 | 來自 CRM 的客戶設定檔、來自工作階段儲存空間的對話紀錄 |
| 程式碼審查工具 | PR URL + 審查標準 | 實際的 Diff、檔案內容、CI 結果 |

### 擷取多個追蹤

在建立資料集之前，請擷取**至少 2 個追蹤**，並使用不同的輸入特性：

- 不同的複雜度（簡單案例 vs. 複雜案例）
- 不同的能力（參見 `00-project-analysis.md` 中的能力清單）
- 不同的邊緣條件（缺失選用資料、異常龐大的輸入）

這種校準可以防止資料集同質化 — 你可以看到應用程式在面對多樣化輸入時的實際表現。

---

## 執行 `pixie trace`

**首先**，驗證應用程式是否可以匯入：`python -c "from <module> import <class>"`。在進入「追蹤-安裝-重試」迴圈之前先捕捉缺失的套件。

```bash
# 建立一個包含輸入資料的 JSON 檔案
echo '{"user_message": "一個現實的範例輸入"}' > pixie_qa/sample-input.json

uv run pixie trace --runnable pixie_qa/run_app.py:AppRunnable \
  --input pixie_qa/sample-input.json \
  --output pixie_qa/reference-trace.jsonl
```

`--input` 旗標接受一個指向 JSON 檔案的**檔案路徑** (而非內嵌 JSON)。JSON 鍵值會成為 Pydantic 模型的關鍵字參數 (Kwargs)。

對於額外的追蹤：

```bash
uv run pixie trace --runnable pixie_qa/run_app.py:AppRunnable \
  --input pixie_qa/sample-input-complex.json \
  --output pixie_qa/trace-complex.jsonl
```

---

## 驗證追蹤

### 快速檢查

追蹤 JSONL 檔案中每個 `wrap()` 事件佔一行，每個 LLM Span 也佔一行：

```jsonl
{"type": "kwargs", "value": {"user_message": "你們的營業時間是？"}}
{"type": "wrap", "name": "customer_profile", "purpose": "input", "data": {...}, ...}
{"type": "llm_span", "request_model": "gpt-4o", "input_messages": [...], ...}
{"type": "wrap", "name": "response", "purpose": "output", "data": "我們的營業時間是...", ...}
```

檢查以下事項：

- 出現了預期的 `wrap` 項目（與程式碼中的 `wrap()` 呼叫一一對應）。
- 出現了至少一個 `llm_span` 項目（確認已進行了真實的 LLM 呼叫）。
- 缺失的項目表示執行路徑與預期不同 — 請在繼續之前修正。

### 格式化並驗證覆蓋範圍

執行 `pixie format` 以資料集項目格式查看資料：

```bash
pixie format --input trace.jsonl --output dataset_entry.json
```

輸出顯示：

- `input_data`：Runnable 參數的確切鍵值。
- `eval_input`：來自 `wrap(purpose="input")` 呼叫的資料。
- `eval_output`：實際的應用程式輸出（來自 `wrap(purpose="output")`）。

針對 `pixie_qa/02-eval-criteria.md` 中的每個評估標準，驗證格式化後的輸出是否包含所需的資料。如果缺少資料點，請回到步驟 2a 並增加 `wrap()` 呼叫。

### 追蹤稽核

在進入步驟 3 之前，請稽核每個追蹤：

1. **世界資料檢查**：對於每個 `wrap(purpose="input")` 欄位，資料是否具有現實的複雜度？對照 `00-project-analysis.md` 中的「現實輸入特性」。如果分析說輸入通常為 5KB–500KB，而你的輸入小於 5KB，則它不具代表性。

2. **LLM Span 檢查**：是否出現了 `llm_span` 項目？如果沒有，說明應用程式的 LLM 呼叫未觸發 — 可能是 Runnable 配置錯誤，或者是 LLM 被模擬 (Mock)/偽造了。請在繼續之前修正此問題。

3. **複雜度檢查**：追蹤是否測試了 `00-project-analysis.md` 中的硬性問題？如果它只測試了正常路徑，請使用難度更高的輸入擷取額外的追蹤。

如果任何檢查失敗，請回頭修正輸入或 Runnable，然後重新擷取。

---

## 輸出

- `pixie_qa/reference-trace.jsonl` — 包含所有預期 Wrap 事件和 LLM Span 的參考追蹤。
- 針對多樣化輸入的額外追蹤檔案。
