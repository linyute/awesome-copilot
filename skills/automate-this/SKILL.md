---
name: automate-this
description: '分析手動程序的操作側錄，並產出針對性的、可運行的自動化指令碼。從影片檔案中擷取畫面與音訊旁白，重建逐步工作流程，並使用使用者機器上已安裝的工具建議多個複雜層級的自動化。'
---

# 自動化此程序 (Automate This)

分析手動程序的操作側錄，並為其建立可運行的自動化。

使用者錄製自己執行重複或繁瑣事務的過程，將影片檔案交給您，而您負責弄清楚他們在做什麼、原因為何，以及如何透過編寫指令碼來將其自動化。

## 前提條件檢查 (Prerequisites Check)

在分析任何錄製內容之前，請確認所需的工具是否可用。靜默執行這些檢查，僅在出現問題時才顯示：

```bash
command -v ffmpeg >/dev/null 2>&1 && ffmpeg -version 2>/dev/null | head -1 || echo "NO_FFMPEG"
command -v whisper >/dev/null 2>&1 || command -v whisper-cpp >/dev/null 2>&1 || echo "NO_WHISPER"
```

- **必須具備 ffmpeg。** 如果缺少，請告訴使用者：`brew install ffmpeg` (macOS) 或其作業系統的等效指令。
- **Whisper 是選用的。** 僅在錄製內容有旁白時才需要。如果缺少且錄製內容有音軌，請建議：`pip install openai-whisper` 或 `brew install whisper-cpp`。如果使用者拒絕，則僅進行視覺分析。

## 第 1 階段：從錄製內容中擷取內容 (Phase 1: Extract Content from the Recording)

給定影片檔案路徑（通常在 `~/Desktop/`），擷取視覺畫面與音訊：

### 畫面擷取 (Frame Extraction)

每 2 秒擷取一個畫面。這在涵蓋範圍與上下文視窗限制之間取得了平衡。

```bash
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/automate-this-XXXXXX")
chmod 700 "$WORK_DIR"
mkdir -p "$WORK_DIR/frames"
ffmpeg -y -i "<VIDEO_PATH>" -vf "fps=0.5" -q:v 2 -loglevel warning "$WORK_DIR/frames/frame_%04d.jpg"
ls "$WORK_DIR/frames/" | wc -l
```

在該階段的後續暫存檔案路徑中均使用 `$WORK_DIR`。權限模式為 0700 的個別執行目錄可確保擷取的畫面僅能由目前使用者讀取。

如果錄製內容長度超過 5 分鐘（超過 150 個畫面），請將間隔增加到每 4 秒擷取一個畫面，以保持在上下文限制內。告訴使用者您正在為較長的錄製內容降低取樣頻率。

### 音訊擷取與逐字稿 (Audio Extraction and Transcription)

檢查影片是否具有音軌：

```bash
ffprobe -i "<VIDEO_PATH>" -show_streams -select_streams a -loglevel error | head -5
```

如果音訊存在：

```bash
ffmpeg -y -i "<VIDEO_PATH>" -ac 1 -ar 16000 -loglevel warning "$WORK_DIR/audio.wav"

# 使用可用的 whisper 二進位檔
if command -v whisper >/dev/null 2>&1; then
  whisper "$WORK_DIR/audio.wav" --model small --language en --output_format txt --output_dir "$WORK_DIR/"
  cat "$WORK_DIR/audio.txt"
elif command -v whisper-cpp >/dev/null 2>&1; then
  whisper-cpp -m "$(brew --prefix 2>/dev/null)/share/whisper-cpp/models/ggml-small.bin" -l en -f "$WORK_DIR/audio.wav" -otxt -of "$WORK_DIR/audio"
  cat "$WORK_DIR/audio.txt"
else
  echo "NO_WHISPER"
fi
```

如果兩個 whisper 二進位檔都不可用且錄製內容有音訊，請告知使用者他們缺少旁白上下文，並詢問他們是否要安裝 Whisper (`pip install openai-whisper` 或 `brew install whisper-cpp`) 或繼續進行僅限視覺的分析。

## 第 2 階段：重建程序 (Phase 2: Reconstruct the Process)

分析擷取的畫面（以及逐字稿，如果有），以建立對使用者行為的結構化理解。依序檢閱畫面並識別：

1. **使用的應用程式** — 錄製內容中出現了哪些應用程式？（瀏覽器、終端機、Finder、郵件用戶端、試算表、IDE 等）
2. **操作序列** — 使用者依序做了什麼？逐一點擊、逐步操作。
3. **資料流** — 步驟之間傳遞了哪些資訊？（複製的文字、下載的檔案、表單輸入等）
4. **決策點** — 是否有使用者停頓、檢查某事或做出選擇的時刻？
5. **重複模式** — 使用者是否使用不同的輸入多次執行相同的操作？
6. **痛點** — 哪些部分的程序看起來緩慢、容易出錯或繁瑣？旁白通常會直接揭示這一點（「我討厭這個部分」、「這總是花很長時間」、「我必須為每一個都這樣做」）。

將此重建結果呈現給使用者，列出編號步驟清單，並請他們在建議自動化之前確認其準確性。這至關重要 — 錯誤的理解會導致無用的自動化。

格式：

```
這是我在錄製內容中看到您執行的操作：

1. 開啟 Chrome 並瀏覽至 [特定 URL]
2. 使用憑證登入
3. 點擊進入報告儀表板
4. 下載 CSV 匯出檔案
5. 在 Excel 中開啟 CSV
6. 篩選 B 欄為 "pending" 的資料列
7. 將這些資料列複製到新的試算表中
8. 將新的試算表寄送電子郵件給 [收件者]

您針對不同的報告類型重複了步驟 3-8 三次。

[如果存在旁白]：您提到匯出步驟是最慢的部分，且您每個週一早上都會執行此操作。

這是否符合您當時的操作？我有任何弄錯或遺漏的地方嗎？
```

在使用者確認重建結果準確之前，**不可** 進入第 3 階段。

## 第 3 階段：環境指紋 (Phase 3: Environment Fingerprint)

在建議自動化之前，了解使用者實際擁有哪些工具可供使用。執行這些檢查：

```bash
echo "=== OS ===" && uname -a
echo "=== Shell ===" && echo $SHELL
echo "=== Python ===" && { command -v python3 && python3 --version 2>&1; } || echo "not installed"
echo "=== Node ===" && { command -v node && node --version 2>&1; } || echo "not installed"
echo "=== Homebrew ===" && { command -v brew && echo "installed"; } || echo "not installed"
echo "=== Common Tools ===" && for cmd in curl jq playwright selenium osascript automator crontab; do command -v $cmd >/dev/null 2>&1 && echo "$cmd: yes" || echo "$cmd: no"; done
```

使用此結果將建議限制在使用者已擁有的工具。絕不要建議需要安裝五個新工具的自動化，除非較簡單的路徑確實無效。

## 第 4 階段：建議自動化 (Phase 4: Propose Automation)

根據重建的程序和使用者的環境，建議最多三個層級的自動化。並非每個程序都需要三個層級 — 請自行判斷。

### 層級結構 (Tier Structure)

**第 1 層 — 快速獲勝 (Quick Win，設定時間少於 5 分鐘)**
最小的有用自動化。一個 Shell 別名、一行指令、一個鍵盤快捷鍵、一段 AppleScript 程式碼片段。自動化單一最痛苦的步驟，而非整個程序。

**第 2 層 — 指令碼 (Script，設定時間少於 30 分鐘)**
一個獨立的指令碼 (Bash、Python 或 Node — 視使用者擁有的工具而定)，可端對端自動化完整程序。處理常見錯誤。需要時可手動執行。

**第 3 層 — 完全自動化 (Full Automation，設定時間少於 2 小時)**
第 2 層的指令碼，外加：排程執行 (Cron、Launchd 或 GitHub Actions)、記錄、錯誤通知，以及任何必要的整合鷹架 (API 金鑰、驗證權杖等)。

### 建議格式 (Proposal Format)

針對每個層級，提供：

```
## 第 [N] 層：[名稱]

**自動化的內容：** [重建結果中的哪些步驟]
**維持手動的內容：** [哪些步驟仍需要人工執行]
**節省時間：** [根據錄製長度與重複次數估計每次執行節省的時間]
**前提條件：** [任何尚未安裝的必要項目 — 理想情況下為空]

**運作方式：**
[2-3 句淺顯易懂的英文解釋]

**程式碼：**
[完整、可運行且包含註釋的程式碼 — 而非虛擬程式碼]

**如何測試：**
[驗證其運作的確切步驟，如果可能，請從模擬執行 (dry run) 開始]

**如何復原：**
[如果出現問題，如何還原任何變更]
```

### 應用程式特定的自動化策略 (Application-Specific Automation Strategies)

根據錄製內容中出現的應用程式使用這些策略：

**基於瀏覽器的工作流程：**
- 首選：檢查該網站是否具有公開 API。API 呼叫比瀏覽器自動化可靠 10 倍。搜尋 API 文件。
- 次選：針對具有已知端點的簡單 HTTP 請求使用 `curl` 或 `wget`。
- 三選：針對需要點擊 UI 的工作流程使用 Playwright 或 Selenium。偏好 Playwright — 它更快且較不不穩定。
- 尋找模式：如果使用者重複從儀表板下載相同的報告，幾乎可以肯定它可以透過 API 或具有查詢參數的直接 URL 取得。

**試算表與資料工作流程：**
- 使用帶有 pandas 的 Python 進行資料篩選、轉換與聚合。
- 如果使用者在 Excel 中執行簡單的欄位操作，一個 5 行的 Python 指令碼即可取代整個手動程序。
- 使用 `csvkit` 進行快速的命令列 CSV 操作，而無需編寫程式碼。
- 如果輸出需要維持 Excel 格式，請使用 openpyxl。

**電子郵件工作流程：**
- macOS：`osascript` 可以控制 Mail.app 來傳送帶有附件的電子郵件。
- 跨平台：Python `smtplib` 用於傳送，`imaplib` 用於讀取。
- 如果電子郵件遵循模板，請從具有變數替換的模板檔案產出內文。

**檔案管理工作流程：**
- 針對移動/複製/重新命名模式使用 Shell 指令碼。
- 針對批次操作使用 `find` + `xargs`。
- 針對變更觸發的自動化使用 `fswatch` 或 `watchman`。
- 如果使用者依日期或類型將檔案整理到資料夾中，那是一個 3 行的 Shell 指令碼。

**終端機/CLI 工作流程：**
- 針對頻繁鍵入的指令使用 Shell 別名。
- 針對多步驟序列使用 Shell 函式。
- 針對專案特定的任務集使用 Makefile。
- 如果使用者使用不同的參數執行相同的指令，那是一個迴圈。

**macOS 特定工作流程：**
- 使用 AppleScript/JXA 控制原生應用程式 (Mail、Calendar、Finder、Preview 等)。
- 針對不需要程式碼的簡單多應用程式工作流程使用「捷徑」應用程式 (Shortcuts.app)。
- 針對基於檔案的工作流程使用 `automator`。
- 針對排程任務使用 `launchd` plist 檔案 (在 macOS 上優於 Cron)。

**跨應用程式工作流程 (資料在應用程式之間移動)：**
- 識別資料傳遞點。每次傳遞都是一個自動化的機會。
- 錄製內容中基於剪貼簿的傳遞建議應用程式之間不互通 — 請改為尋找 API、基於檔案的遞交或直接整合。
- 如果使用者從應用程式 A 複製並貼上到應用程式 B，自動化應直接從 A 的資料來源讀取並寫入 B 的輸入格式。

### 製作具針對性的建議 (Making Proposals Targeted)

將這些原則套用到每個建議：

1. **優先自動化瓶頸。** 錄製內容中的旁白與時間點會揭露哪個步驟實際上是痛苦的。對最糟糕的步驟進行 30 秒的自動化，勝過對整個程序進行 2 小時的自動化。

2. **符合使用者的技能程度。** 如果錄製內容顯示有人熟悉終端機，請建議 Shell 指令碼。如果顯示有人在使用 GUI，請建議具有簡單觸發方式的內容（按兩下指令碼、執行捷徑或鍵入一個指令）。

3. **估算實際節省的時間。** 計算錄製時長並乘以他們執行該操作的頻率。「這段錄製長度為 4 分鐘。您說您每天都會執行此操作。那每年就是 17 小時。第 1 層將其縮減為每次 30 秒 — 您可以拿回 16 小時。」

4. **處理 80% 的情況。** 自動化的第一個版本應完美涵蓋常見路徑。邊緣情況可在第 3 層處理，或標記為需要人工干預。

5. **保留人工檢查點。** 如果錄製內容顯示使用者在程序中途進行檢閱或核准，請將其保留為手動步驟。不要將需要判斷的操作自動化。

6. **建議模擬執行。** 每個指令碼都應具備一個模式，顯示其「將要」執行什麼而不實際執行。`--dry-run` 旗標、預覽輸出或在破壞性操作前的確認提示。

7. **考慮驗證與秘密。** 如果程序涉及登入或使用憑證，絕不要硬編碼它們。使用環境變數、鑰匙圈存取 (macOS `security` 指令) 或在執行階段提示輸入。

8. **考慮失敗模式。** 如果網站當機了怎麼辦？如果檔案不存在？如果格式變更了？好的建議會提到這一點並加以處理。

## 第 5 階段：建構與測試 (Phase 5: Build and Test)

當使用者選擇一個層級時：

1. 將完整的自動化程式碼寫入檔案（建議一個合理的位元置 — 如果存在專案目錄，則為專案目錄，否則為 `~/Desktop/`）。
2. 在使用者觀看時逐步進行模擬執行或測試。
3. 如果測試成功，示範如何實際執行。
4. 如果失敗，診斷並修正 — 不要嘗試一次後就放棄。

## 清理 (Cleanup)

分析完成後（不論結果如何），清理擷取的畫面與音訊：

```bash
rm -rf "$WORK_DIR"
```

告訴使用者您正在清理暫存檔案，以便他們知道沒有遺留任何內容。
