# 步驟 5：執行基於評估的測試

**為什麼需要此步驟**：執行 `pixie test` 並修正任何資料集品質問題 —— `WrapRegistryMissError`、`WrapTypeMismatchError`、錯誤的 `eval_input` 資料或匯入失敗 —— 直到為每個項目產生實際的評估器分數。

---

## 5a. 執行測試

```bash
pixie test
```

若要查看包含每個案例分數和評估器推論的詳細輸出：

```bash
pixie test -v
```

`pixie test` 在執行測試前會自動載入 `.env` 檔案。

測試執行器現在會：

1. 從資料集的 `runnable` 欄位解析 `Runnable` 類別
2. 呼叫 `Runnable.create()` 來建構執行個體，然後執行一次 `setup()`
3. **並行**執行所有資料集項目（最多 4 個並行）：
   a. 從項目中讀取 `entry_kwargs` 和 `eval_input`
   b. 使用 `eval_input` 資料填入 wrap 輸入註冊表
   c. 初始化擷取註冊表
   d. 將 `entry_kwargs` 驗證為 Pydantic 模型並呼叫 `Runnable.run(args)`
   e. 應用程式中的 `wrap(purpose="input")` 呼叫會傳回註冊表的值，而不是呼叫實際的外部服務
   f. `wrap(purpose="output"/"state")` 呼叫擷取資料以供評估
   g. 從擷取的資料建構 `Evaluable`
   h. 執行評估器
4. 執行一次 `Runnable.teardown()`

由於項目是並行執行的，Runnable 的 `run()` 方法必須是並行安全的。如果您看到 `sqlite3.OperationalError`、`"database is locked"` 或類似錯誤，請在您的 Runnable 中加入 `Semaphore(1)`（請參閱步驟 2 參考資料中的並行章節）。

## 5b. 修正資料集/測試環境 (harness) 問題

**資料驗證錯誤**（註冊表遺漏、型別不匹配、反序列化失敗）會按項目回報，並附帶指向特定 `wrap` 名稱和資料集欄位的清晰訊息。此步驟是為了修正**您在步驟 4 中做錯的地方** —— 錯誤的資料、錯誤的格式、缺失的欄位 —— 而不是評估應用程式的品質。

| 錯誤                                  | 原因                                                                                                                    | 修正方式                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `WrapRegistryMissError: name='<key>'` | 資料集項目缺少應用程式 `wrap(purpose="input", name="<key>")` 所預期的 `eval_input` 項目                                 | 在每個受影響項目的 `eval_input` 中加入缺失的 `{"name": "<key>", "value": ...}`               |
| `WrapTypeMismatchError`               | 反序列化的型別與應用程式預期的不匹配                                                                                    | 修正資料集中的值                                                                             |
| Runnable 解析失敗                     | `runnable` 路徑或類別名稱錯誤，或該類別未實作 `Runnable` 協定                                                           | 修正資料集中的 `filepath:ClassName`；確保該類別具有 `create()` 和 `run()` 方法               |
| 匯入錯誤                              | runnable/評估器中的模組路徑或語法錯誤                                                                                  | 修正參考的檔案                                                                               |
| `ModuleNotFoundError: pixie_qa`       | `pixie_qa/` 目錄缺少 `__init__.py`                                                                                      | 執行 `pixie init` 以重新建立它                                                               |
| `TypeError: ... is not callable`      | 評估器名稱指向一個不可呼叫的屬性                                                                                        | 評估器必須是函式、類別或可呼叫的執行個體                                                     |
| `sqlite3.OperationalError`            | 並行的 `run()` 呼叫共享同一個 SQLite 連線                                                                               | 在 Runnable 中加入 `asyncio.Semaphore(1)`（請參閱步驟 2 並行章節）                           |

反覆執行 —— 修正錯誤、重新執行、修正下一個錯誤 —— 直到 `pixie test` 順利執行並為所有項目提供實際的評估器分數。

### 何時停止針對評估器結果進行反覆修正

一旦資料集執行無誤並產生實際分數，請評估結果：

- **自訂函式評估器**（決定性檢查）：如果失敗，問題在於資料集資料或評估器邏輯。修正並重新執行 —— 這些應該會很快收斂。
- **LLM 作為評審 (LLM-as-judge) 評估器**（例如：`Factuality`、`ClosedQA`、自訂 LLM 評估器）：這些在不同執行次數之間存在固有的變異。如果在沒有更改程式碼的情況下，各次執行之間的分數有所波動，則問題在於評估器提示詞品質，而非應用程式行為。**請勿在 LLM 評估器提示詞上花費超過一個修正週期。**執行 2–3 次，評估變異，如果結果方向正確即可接受。
- **一般規則**：當所有自訂函式評估器都穩定通過，且 LLM 評估器產生合理的結果（大部分通過）時，即可停止。完美的 LLM 評估器分數並非目標 —— 目標是建立一個能捕捉實際迴歸問題的可用 QA 流程。

## 5c. 執行分析

一旦測試完成且無設定錯誤並產生實際分數，請執行分析：

```bash
pixie analyze <test_id>
```

其中 `<test_id>` 是 `pixie test` 印出的測試執行識別碼（例如：`20250615-120000`）。這會為每個資料集產生由 LLM 驅動的 Markdown 分析，識別成功和失敗的模式。

## 輸出

- 位於 `{PIXIE_ROOT}/results/<test_id>/result.json` 的測試結果
- 位於 `{PIXIE_ROOT}/results/<test_id>/dataset-<index>.md` 的分析檔案（執行 `pixie analyze` 後）

---

> **如果您在執行測試時遇到非預期錯誤**（參數名稱錯誤、匯入失敗、API 不匹配），在猜測修正方式之前，請閱讀 `wrap-api.md`、`evaluators.md` 或 `testing-api.md` 以獲取權威的 API 參考資料。
