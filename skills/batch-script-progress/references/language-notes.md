# 語言注意事項 (Language Notes)

優先重複使用現有的記錄器或回報公用程式。這些注意事項說明獨立的 CLI 串流；託管函式與服務可能需要自己的記錄合約。

## Python

- 透過設定為 stderr 的記錄器傳送診斷訊息，或針對小型獨立指令碼使用 `print(..., file=sys.stderr, flush=True)`。請勿在可重複使用的函式庫內設定根記錄器 (root logger)。
- 使用 `time.monotonic()` 計算回報間隔。`-u` 或 `PYTHONUNBUFFERED` 可協助處理子處理序輸出，但請驗證實際的記錄器/串流路徑。
- 根據現有策略處理一般項目例外狀況。避免在寬鬆的項目錯誤 catch 中捕捉 `KeyboardInterrupt` 和其他控制流程例外狀況。
- 從 `main` 回傳約定的代碼，且僅在可執行進入點使用 `raise SystemExit(main())`。

[Python 探針](../examples/batch.py)使用標準函式庫，絕不存取外部資料。

## PowerShell

- `Write-Output` 會寫入成功串流，因此可能會破壞傳回的物件或 JSON。當主機合約支援時，請使用現有的資訊/錯誤串流；對於獨立的原生 CLI，`[Console]::Error.WriteLine(...)` 與 `Flush()` 提供明確的 stderr 輸出。
- `Write-Progress` 取決於主機和喜好設定。它在 CI 或重新導向中可能不可見；請勿將其作為進度的唯一證據。
- Ctrl+C 與主機停止由主機管理，其行為因主機與版本而異。保留現有的停止行為；不要捕捉廣泛的例外狀況並將主機取消計為項目失敗。在適用的情況下使用 `finally` 進行清理，但不要承諾在主機停止管線後提供最終摘要。若正常取消回報是合約的一部分，請在每個支援的主機中測試實際的取消路徑；模擬的測試載體並不能確定這一點。
- 使用 `[System.Diagnostics.Stopwatch]` 計算經過的時間間隔。避免在同一個處理迴圈中使用封鎖性的 `Start-Sleep` 活動訊號。
- 分別檢查終止錯誤 (terminating errors) 與非終止錯誤 (non-terminating errors)。當符合既定策略時，在特定指令程式 (cmdlet) 界限使用 `-ErrorAction Stop`；全域變更 `$ErrorActionPreference` 可能會改變處理行為。
- 在原生命令後立即擷取原生 `$LASTEXITCODE`。在 Windows PowerShell 5.1 上，不要假設非零的原生結束代碼是可以捕捉的終止例外狀況。
- 僅在獨立進入點使用 `exit`。函式/模組應傳回其約定的結果或引發其約定的錯誤，而不終止主機。

[PowerShell 探針](../examples/batch.ps1)是與 Windows PowerShell 5.1 和 PowerShell 7 相容的獨立指令碼。其取消案例是模擬的，不是作業系統訊號測試。

## Node.js

- `console.log` 以 stdout 為目標；`console.error` 以 stderr 為目標。對於穩定的記錄格式，請使用既定的記錄器或明確的串流寫入。
- 使用 `performance.now()` 或 `process.hrtime.bigint()` 計算經過的時間間隔。對於重新導向的寫入，請尊重背壓 (backpressure)，並在 `write` 回傳 false 時等待 `drain`。
- 回報後設定 `process.exitCode`，而非立即呼叫 `process.exit()`，後者可能會截斷待處理的輸出。
- 計時器活動訊號需要可用的事件迴圈。同步 CPU 密集型處理會封鎖計時器；不要單純為了美化輸出而新增工作執行緒 (worker threads)。
- 將 SIGINT/SIGTERM 與現有的取消與清理邏輯整合。不要將取消轉換為可重試的項目失敗。

[Node.js 探針](../examples/batch.mjs)沒有任何相依性，並使用非同步輸出發出器。

## 可執行檔覆寫 (Executable Overrides)

驗證器在 Windows 上預設為 `py -3` 和 `powershell.exe`，在其他地方預設為 `python3` 和 `pwsh`。將 `BATCH_PYTHON` 設定為 Python 可執行檔路徑（而非 Shell 命令）以覆寫 Python 啟動器；以類似方式設定 `BATCH_POWERSHELL`。Node.js 則使用執行驗證器的直譯器。

在 Windows 上，驗證器僅將 `-ExecutionPolicy Bypass` 傳遞給其子 PowerShell 處理序，以便執行未簽署的本機測試載體。它不會變更儲存的電腦/使用者策略，且組織強制執行的策略仍可能封鎖它。在執行隨附的測試載體之前請先進行審閱；請勿將此設定延伸至不受信任的指令碼。

每個探針均接受 `normal`、`mixed`、`partial-zero`、`empty`、`unknown`、`fail-fast`、`cancelled` 或 `live`。除了 `fail-fast` 之外，測試載體合約在發生失敗後仍會繼續；完全成功的結束代碼為 0，`mixed`/fail-fast 為 1，模擬取消為 130。`partial-zero` 測試載體保留了零結束代碼的合約，同時誠實回報部分結果與一個失敗項目。這些是測試載體的選擇，而非強制套用的正式環境結束代碼。在 `live` 模式下，探針會在第一次進度通知後等待一行 stdin，以便驗證器可以在不猜測延遲的情況下證明結束前的送達。
