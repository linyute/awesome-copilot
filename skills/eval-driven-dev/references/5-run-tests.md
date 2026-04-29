# 步驟 5：執行 `pixie test` 並修復機械性問題

**為何需要此步驟**：執行 `pixie test` 並修復 QA 元件中的機械性問題 — 資料集格式問題、Runnable 實作錯誤以及自訂評估器錯誤 — 直到每個項目都能產生真實分數。此步驟**不是**為了評估結果品質或修復應用程式本身。

---

## 5a. 執行測試

```bash
uv run pixie test
```

若要獲取包含各個案例的分數和評估器理由的詳細輸出：

```bash
uv run pixie test -v
```

`pixie test` 在執行測試前會自動載入 `.env` 檔案。

評估控具 (Evaluation harness)：

1. 從資料集的 `runnable` 欄位解析 `Runnable` 類別。
2. 呼叫 `Runnable.create()` 建構執行個體，然後呼叫 `setup()` 一次。
3. **並行 (Concurrent)** 執行所有資料集項目（最多 4 個並行）：
   a. 從項目中讀取 `input_data` 和 `eval_input`。
   b. 使用 `eval_input` 資料填充 Wrap 輸入註冊表。
   c. 初始化擷取註冊表。
   d. 將 `input_data` 驗證為 Pydantic 模型並呼叫 `Runnable.run(args)`。
   e. 應用程式中的 `wrap(purpose="input")` 呼叫會回傳註冊表值，而不是呼叫外部服務。
   f. `wrap(purpose="output"/"state")` 呼叫擷取資料用於評估。
   g. 從擷取的資料建置 `Evaluable`。
   h. 執行評估器。
4. 呼叫 `Runnable.teardown()` 一次。

由於項目是並行執行的，`Runnable` 的 `run()` 方法必須是執行緒安全的 (Concurrency-safe)。如果你看到 `sqlite3.OperationalError`、`"database is locked"` 或類似錯誤，請為你的 Runnable 增加一個 `Semaphore(1)`（參見步驟 2 參考文件中的並行處理部分）。

## 5b. 僅修復機械性問題

此步驟嚴格僅限於修復你在先前步驟中建構的內容 — 資料集、Runnable 以及任何自訂評估器。你是在修復阻止管線執行的機械性問題，**不是**在評估或改進應用程式的輸出品質。

**屬於機械性問題的情形**（請修復這些）：

| 錯誤 | 原因 | 修復方法 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `WrapRegistryMissError: name='<key>'` | 資料集項目缺少 `eval_input` 項目，而該項目是應用程式的 `wrap(purpose="input", name="<key>")` 所預期的 | 在每個受影響項目的 `eval_input` 中增加缺失的 `{"name": "<key>", "value": ...}` |
| `WrapTypeMismatchError` | 反序列化後的類型與應用程式預期的不符 | 修正資料集中的值 |
| Runnable 解析失敗 | `runnable` 路徑或類別名稱錯誤，或類別未實作 `Runnable` 協定 | 修正資料集中的 `filepath:ClassName`；確保類別具有 `create()` 和 `run()` 方法 |
| 匯入錯誤 (Import error) | Runnable 或評估器中的模組路徑或語法錯誤 | 修正被引用的檔案 |
| `ModuleNotFoundError: pixie_qa` | `pixie_qa/` 目錄缺少 `__init__.py` | 執行 `pixie init` 重新建立它 |
| `TypeError: ... is not callable` | 評估器名稱指向了一個不可呼叫的屬性 | 評估器必須是函式、類別或可呼叫實例 |
| `sqlite3.OperationalError` | 並行 `run()` 呼叫共享同一個 SQLite 連線 | 為 Runnable 增加 `asyncio.Semaphore(1)`（參見步驟 2 並行處理部分） |
| 自訂評估器崩潰 | 你的自訂評估器實作中有錯誤 (Bug) | 修正評估器程式碼 |

**不屬於機械性問題的情形**（**不要**在此處修復）：

- 應用程式產生錯誤/低品質的輸出 → 這是應用程式的行為，將在步驟 6 中分析。
- 評估器分數較低 → 這是品質信號，將在步驟 6 中分析。
- 應用程式內部的 LLM 呼叫失敗 → 在步驟 6 中報告，不要進行模擬 (Mock) 或規避。
- 評估器分數在不同執行次數間波動 → 正常的 LLM 非確定性現象，不是錯誤。

重複進行 — 修復錯誤、重新執行、修復下一個錯誤 — 直到 `pixie test` 成功執行完成，並為所有項目提供真實的評估器分數。

## 輸出

`pixie test` 成功完成後，結果會儲存在按項目劃分的目錄結構中：

```
{PIXIE_ROOT}/results/<test_id>/
  meta.json                           # 測試執行 Metadata
  dataset-{idx}/
    metadata.json                     # 資料集名稱、路徑、Runnable
    entry-{idx}/
      config.json                     # 評估器、說明、預期
      eval-input.jsonl                # 餵給評估器的輸入資料
      eval-output.jsonl               # 從應用程式擷取的輸出資料
      evaluations.jsonl               # 評估結果（已評分 + 待處理）
      trace.jsonl                     # LLM 呼叫追蹤（如果已擷取）
```

主控台輸出會印出 `<test_id>`。你將在步驟 6 中引用此目錄。

---

> **如果你在執行測試時遇到非預期的錯誤**（參數名稱錯誤、匯入失敗、API 不匹配），請在盲目猜測修復方法前，先閱讀 `wrap-api.md`、`evaluators.md` 或 `testing-api.md` 獲取權威的 API 參考。
