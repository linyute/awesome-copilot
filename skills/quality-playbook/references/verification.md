# 驗證檢查清單 (階段 6：驗證)

在宣告品質播放手冊完成之前，請檢查下方的每項基準測試。如果任何一項失敗，請返回並進行修復。

## 自我檢查基準測試 (Self-Check Benchmarks)

### 1. 測試計數

計算啟發式目標值：(可測試規格章節數) + (QUALITY.md 情境數) + (步驟 5 中的防禦性模式數)。

- **遠低於目標** → 您可能遺漏了規格需求或對防禦性模式的審查不夠仔細。請返回檢查。
- **接近目標** → 審查您是否測試了負面個案與邊界。
- **高於目標** → 沒問題，只要每個測試都有意義即可。不要為了湊數而湊數。

### 2. 情境涵蓋範圍 (Scenario Coverage)

統計 QUALITY.md 中的情境數量。統計功能測試檔案中的情境測試函式數量。這兩個數值必須完全匹配。

### 3. 跨變體涵蓋範圍 (Cross-Variant Coverage)

如果專案處理 N 個輸入變體，有多少百分比的測試涵蓋了所有 N 個變體？

計算方式：在所有變體中進行迴圈或參數化的測試數 / 總測試數。

**啟發式方法：~30%。** 如果遠低於此比例，請尋找應參數化的單一變體測試。常見候選對象：結構完整性、身分驗證、必填欄位存在性、資料關係、語意正確性。確切的百分比不如確保跨領域屬性在所有變體中都得到測試來得重要。

### 4. 邊界與負面測試計數

統計步驟 5 中的防禦性模式數量。統計您的邊界/負面測試數量。兩者的比例應接近 1:1。如果顯著低於此比例，請撰寫更多針對未測試防禦性模式的測試。

### 5. 斷言深度 (Assertion Depth)

掃描您的斷言。有多少是存在性檢查 (presence checks) 與數值檢查 (value checks)？如果超過一半是僅檢查存在性 (`assert x is not None`, `assert x in output`)，請強化它們以檢查實際數值。

### 6. 層級正確性 (Layer Correctness)

針對每個測試，問自己：「我是在測試『需求』還是『機制』？」如果任何測試僅斷言引發了特定的錯誤型別，而未同時驗證管線輸出，則它是在測試機制。請重寫以測試結果。

### 7. 變更有效性 (Mutation Validity)

針對每個變更 fixture 的測試，驗證變更值是否位於步驟 5b 結構描述對應表的「接受 (Accepts)」資料欄中。如果任何變更使用了結構描述拒絕的型別，測試會因驗證錯誤而失敗，而非測試防禦性程式碼。請修正它。

### 8. 所有測試皆通過 — 零失敗且零錯誤

使用專案的測試執行器執行測試套件：

- **Python**: `pytest quality/test_functional.py -v`
- **Scala**: `sbt "testOnly *FunctionalSpec"`
- **Java**: `mvn test -Dtest=FunctionalTest` 或 `gradle test --tests FunctionalTest`
- **TypeScript**: `npx jest functional.test.ts --verbose`
- **Go**: `go test -v` 目標指向產出的測試檔案所屬套件 — 使用專案現有的模組與套件佈局
- **Rust**: `cargo test` 目標指向產出的測試 — 可能是 `tests/` 中的整合測試目標或行內的 `#[cfg(test)]` 測試，需符合專案慣例

**同時檢查失敗與錯誤。** 大多數測試框架會區分測試失敗（斷言錯誤）與測試錯誤（設定失敗、缺失 fixture、匯入/解析錯誤、初始化期間的異常）。兩者皆視為損壞的測試。常見錯誤：產生的測試引用了不存在的共享 fixture 或協助程式。這些會顯示為設定錯誤，而非斷言失敗 — 但它們同樣是損壞的。

**預期失敗 (xfail) 測試不計入此基準測試。** `quality/test_regression.*` 中的迴歸測試使用預期失敗標記 (`@pytest.mark.xfail(strict=True)`, `@Disabled`, `t.Skip`, `#[ignore]`) 來確認已知漏洞仍然存在。這些測試「本應」失敗 — 這正是其目的。 「零失敗且零錯誤」基準測試適用於 `quality/test_functional.*`（功能測試套件），而「不」適用於 `quality/test_regression.*`（漏洞確認套件）。如果您的測試執行器回報來自標記為 xfail 的迴歸測試的失敗，這是正確行為，而非違反基準測試。如果 xfail 測試意外「通過」，則代表漏洞已修復，應移除 xfail 標記 — 請將此視為一項需要調查的發現，而非測試失敗。

執行後檢查：
- 所有測試皆通過 — 計數必須等於總測試計數
- 零失敗 (Zero failures)
- 零錯誤/設定失敗 (Zero errors/setup failures)

如果存在設定錯誤，說明您忘記建立 fixture/設定檔案，或是您引用了不存在的協助程式。請返回並建立它們或將測試重寫為自給自足。

### 9. 現有測試未損壞

執行專案完整的測試套件（不僅僅是您的新測試）。您的新檔案不應破壞任何現有內容。

## 文件驗證 (Documentation Verification)

### 10. QUALITY.md 情境引用了真實程式碼與標籤來源

每個情境都應提及程式碼庫中實際存在的函式名稱、檔案名稱或模式。對每個引用執行 grep 以確認其存在。

如果工作基於非正式需求，請驗證每個情境與測試皆包含使用規範格式的需求標籤：`[Req: formal — README §3]`, `[Req: inferred — from validate_input() behavior]`, `[Req: user-confirmed — "must handle empty input"]`。推論需求應在階段 7 的互動對話中標記供使用者審查。

### 11. RUN_CODE_REVIEW.md 是自給自足的

一個沒有先前背景資訊的 AI 應能閱讀它並執行有用的審查。檢查：它是否列出了引導檔案？它是否具有特定的焦點區域？護欄規則是否存在？

### 12. RUN_INTEGRATION_TESTS.md 是可執行且欄位準確的

每個命令都應可運作。每項檢查都應具有具體的通過/失敗標準 — 不是「驗證看起來正確」，而是具體的預期結果。

**驗證品質閘道是根據欄位參考表撰寫的，而非憑記憶。** 檢查：

1. RUN_INTEGRATION_TESTS.md 中是否存在欄位參考表，且針對每個結構描述中的每個欄位都有一列
2. **欄位計數檢查**：針對每個結構描述，統計實際結構描述檔案中的欄位數量，並統計您表格中的列數。如果數值不匹配，說明您遺漏了欄位或虛構了欄位。最常見的失敗是：結構描述有 8 個欄位，但表格僅有 2-3 個「重要」欄位。
3. **字元對字元檢查**：立即重新閱讀每個結構描述檔案，並將表格中的每個欄位名稱與檔案內容進行比較。`document_id` ≠ `doc_id`。`sentiment_score` ≠ `sentiment`。`classification` ≠ `category`。
4. 每個型別與約束皆符合結構描述（`float 0-1` 不是 `int 0-100`，`string enum` 不是 `integer`）

如果任何欄位名稱、計數或型別有誤，請在繼續之前修正。表格是基礎 — 如果表格有誤，基於它建立的每個品質閘道都是錯誤的。

### 13. RUN_SPEC_AUDIT.md 提示語可供複製貼上

決定性的稽核提示應能在不經修改的情況下（除了檔案引用語法），直接貼入 Claude Code, Cursor 和 Copilot 中運作。

### 14. 結構化輸出結構描述有效且合規

驗證 `RUN_TDD_TESTS.md` 與 `RUN_INTEGRATION_TESTS.md` 皆指示代理程式產出：
- 使用框架原生報告器的 JUnit XML 輸出 (pytest `--junitxml`, gotestsum `--junitxml`, Maven Surefire 報告, `jest-junit`, `cargo2junit`)
- `quality/results/` 中的附屬 JSON 檔案 (`tdd-results.json` 或 `integration-results.json`)

檢查每個協定的 JSON 結構描述是否包含所有必填欄位：
- **tdd-results.json**: `schema_version`, `skill_version`, `date`, `project`, `bugs`, `summary`。每項漏洞：`id`, `requirement`, `red_phase`, `green_phase`, `verdict`, `fix_patch_present`, `writeup_path`。
- **integration-results.json**: `schema_version`, `skill_version`, `date`, `project`, `recommendation`, `groups`, `summary`, `uc_coverage`。每個群組：`group`, `name`, `use_cases`, `result`。

驗證協定中「不」包含平坦的命令清單結構描述（沒有 `"groups"` 的 `"results"` 或 `"commands_run"` 陣列是不合規的）。驗證判定/結果列舉值僅使用 SKILL.md 中定義的允許值（例如：針對 TDD 判定使用 `"TDD verified"`, `"red failed"`, `"green failed"`, `"confirmed open"`；針對整合結果使用 `"pass"`, `"fail"`, `"skipped"`, `"error"`；針對建議使用 `"SHIP"`, `"FIX BEFORE MERGE"`, `"BLOCK"`)。TDD 判定 `"skipped"` 已棄用 — 請改用帶有 `red_phase: "fail"` 和 `green_phase: "skipped"` 的 `"confirmed open"`。TDD 摘要必須包含 `confirmed_open` 計數，以及 `verified`, `red_failed`, 和 `green_failed`。

兩個附屬 JSON 範本都必須使用 `schema_version: "1.1"` (v1.1 變更：`verdict: "skipped"` 棄用，改用 `"confirmed open"`)。兩個協定都必須包含一個 **寫入後驗證步驟**，指示代理程式在寫入後重新開啟附屬 JSON，並驗證必填欄位、列舉值以及無額外未記錄的根索引鍵。

### 15. 補丁驗證閘道 (Patch Validation Gate) 可執行

針對每個帶有補丁的已確認漏洞，驗證：
1. 補丁驗證閘道中指定的 `git apply --check` 命令使用的是正確的補丁路徑 (`quality/patches/BUG-NNN-*.patch`)
2. 編譯/語法檢查命令與專案實際的組建系統相符 — 而非通用的預留位置
3. 針對直譯語言 (Python, JavaScript)，閘道指明了適當的語法檢查 (`python -m py_compile`, `node --check`, `pytest --collect-only` 或等效項)
4. 閘道包含暫時的工作區 (worktree) 或隱藏並還原 (stash-and-revert) 指令，以符合原始碼邊界規則

### 16. 迴歸測試跳過保護機制 (Skip Guards) 已存在

在 `quality/test_regression.*` 中執行 grep 搜尋語言適用的跳過/xfail 機制。每個測試函式都必須具有保護機制：
- Python: `@pytest.mark.xfail` 或 `@unittest.expectedFailure`
- Go: `t.Skip(`
- Java: `@Disabled`
- Rust: `#[ignore]`
- TypeScript/JavaScript: `test.failing(`, `test.fails(` 或 `it.skip(`

不帶跳過保護機制的迴歸測試會在對未修補程式碼執行測試套件時導致非預期失敗。每個保護機制都必須引用漏洞 ID (BUG-NNN 格式) 與修復補丁路徑。

### 17. 整合群組命令通過預檢發現

針對 `RUN_INTEGRATION_TESTS.md` 中的每個整合測試群組命令，驗證該命令是否能使用框架的試執行 (dry-run) 模式發現至少一個測試 (`pytest --collect-only`, `go test -list`, `vitest list`, `jest --listTests`, `cargo test -- --list`)。命令發現失敗的群組將產生 `covered_fail` 結果，進而將選取器漏洞遮掩為程式碼漏洞。如果某個命令無法驗證（無試執行模式可用），請註明此項限制。

### 18. 所有產出的檔案皆存在版本標記

對 `quality/` 中產出的每個 Markdown 檔案執行 grep 搜尋歸屬行：`Generated by [Quality Playbook]`。對產出的每個程式碼檔案搜尋 `Generated by Quality Playbook`。每個檔案都必須具有帶有正確版本號的標記。不帶標記的檔案無法追溯到建立它的工具與版本。**豁免項**：附屬 JSON 檔案（使用 `skill_version` 欄位）、JUnit XML 檔案（由框架產生）以及 `.patch` 檔案（標記會破壞 `git apply`）。針對具有 Shebang 或編碼 Pragma 的 Python 檔案，驗證標記位於 Pragma 之後，而非之前。

### 19. 已執行列舉完整性檢查

驗證程式碼審查（傳遞 1 與傳遞 2）在程式碼使用 `switch`/`case`、`match` 或 if-else 鏈根據具名常數進行分派的任何地方，皆執行了機械式的雙清單列舉檢查。對於每項此類檢查，審查內容必須顯示：(a) 標頭/列舉/規格中定義的常數清單，(b) 程式碼中實際存在的 case 標籤清單，(c) 任何缺口。聲稱「白名單涵蓋了所有值」或「所有個案皆已處理」而未顯示雙清單比較的審查是不合規的 — 這是該檢查專門預防的幻覺模式。

### 20. 為所有已確認漏洞產生了漏洞說明檔案

針對 `tdd-results.json` 中的每個漏洞（包含 `verdict: "TDD verified"` 與 `verdict: "confirmed open"`），驗證對應的 `quality/writeups/BUG-NNN.md` 檔案是否存在，且 `tdd-results.json` 具有該漏洞的非空 `writeup_path`。每個說明檔案必須包含：摘要、規格參考、程式碼引用、可觀察後果、修復 diff 以及測試說明。不帶說明檔案的已確認漏洞是不完整的。

### 21. 分類驗證探針包含可執行證據

開啟分類報告 (`quality/spec_audits/YYYY-MM-DD-triage.md`)。針對透過驗證探針確認或拒絕的每項發現，驗證分類條目中是否包含測試斷言（不僅僅是文字推理）。拒絕條目必須包含證實發現有誤的「通過」斷言。確認條目必須包含證實漏洞存在的「失敗」斷言。每個斷言必須引用確切的行號。基於文字推理（「第 3527-3528 列明確保留了 X」）而無機械式斷言的分類判定是不合規的。

### 22. 列舉清單從程式碼擷取，而非從需求複製

當程式碼審查包含列舉檢查（例如，「函式 X 中存在的 case 標籤」）時，驗證程式碼端清單是否包含來自實際原始碼的逐項行號。如果清單與需求清單逐字相同且無行號，則該列舉可能是被複製而非擷取的，必須重新執行。同時驗證分類稽核前抽查回報的是引用行的實際內容（「第 3527 列包含 `default:`」），而非僅僅確認主張（「第 3527 列保留了 RING_RESET」）。

### 23. 機械式驗證成品存在且通過完整性檢查

對於斷言函式處理/保留/分派一組具名常數（特徵位元、列舉值、作業碼表格）的每個合約或需求，驗證對應的 `quality/mechanical/<函式>_cases.txt` 檔案是否存在，且是由非互動式 Shell 管線產生的。引用分派函式涵蓋範圍而未引用機械式成品的合約是不合規的。

**完整性檢查（強制性）**：執行 `bash quality/mechanical/verify.sh`。此指令碼重新執行產生每個機械式成品的相同擷取命令，並執行 diff 比較結果。如果「任何」diff 非空，則成品被竄改過 — 模型可能寫入了預期的輸出而非擷取實際的 Shell 輸出。必須透過重新執行擷取命令（而非編輯檔案）來重新產生不匹配的成品。此檢查的存在是因為在 v1.3.19 中，模型執行了正確的 awk/grep 命令，但在檔案中寫入了虛構的 9 列輸出（包含幻覺的 `case VIRTIO_F_RING_RESET:`），而實際的命令僅產出 8 列。

### 24. 原始碼檢驗迴歸測試已執行 (不使用 `run=False`)

在 `quality/test_regression.*` 中執行 grep 搜尋 `run=False` (Python)、帶有原始碼檢驗註解的 `t.Skip` 或等效的跳過機制。其目的是原始碼結構驗證（函式主體中存在字串、case 標籤存在、列舉擷取）的任何迴歸測試皆「必須」執行 — 「絕不能」使用 `run=False`。這些測試是安全、確定性的字串比對作業。實際失敗的 `xfail(strict=True)` 測試會報告為 XFAIL (預期)，這是正確的行為。具備 `run=False` 的原始碼檢驗測試是最糟的狀態：正確的檢查存在但從未觸發。

### 25. 通過矛盾閘道 (Contradiction Gate) (可執行證據 vs. 文字)

驗證在結案時沒有任何可執行產出物與文字產出物相矛盾。具體而言：(a) 如果任何 `quality/mechanical/*` 檔案顯示某個常數缺失，則任何文字產出物 (`CONTRACTS.md`, `REQUIREMENTS.md`, 程式碼審查, 分類) 皆不得聲稱其存在；(b) 如果帶有 `xfail` 的迴歸測試實際失敗 (XFAIL)，`BUGS.md` 在沒有提交參考的情況下不得聲稱該漏洞「已在工作樹中修復」；(c) 如果 TDD 可追溯性顯示紅相失敗，則分類不得聲稱對應的程式碼是合規的。任何矛盾在結案前皆必須解決。

### 26. 版本標記一致性

從 SKILL.md Metadata 讀取 `version:` 欄位（在技能安裝目錄中定位 SKILL.md — 通常為 `.github/skills/SKILL.md` 或 `.claude/skills/quality-playbook/SKILL.md`）。檢查每個產出的成品：PROGRESS.md 的 `Skill version:` 欄位、每個 `> Generated by` 歸屬行、每個程式碼檔案標頭標記，以及每個附屬 JSON 的 `skill_version` 欄位。每個版本標記都必須與 SKILL.md Metadata 完全匹配。單個不匹配即視為基準測試失敗。此檢查的存在是因為在 v1.3.21 基準測試中，由於硬編碼範本，9 個存放庫中有 5 個具有來自舊版技能的版本標記。

### 27. 機械式目錄合規性

如果 `quality/mechanical/` 存在，它必須至少包含一個 `verify.sh` 檔案。空的 `quality/mechanical/` 目錄是不合規的。如果不存在分派函式合約，則該目錄不應存在 — 應改在 PROGRESS.md 中記錄 `Mechanical verification: NOT APPLICABLE`。如果該目錄包含擷取產出物，`verify.sh` 必須包含每個儲存檔案的一個驗證區塊（而不僅僅是一個）。僅檢查多個成品中之一的 verify.sh 是不完整的。

### 28. TDD 成品結案

如果 `quality/BUGS.md` 包含任何已確認的漏洞，則 `quality/results/tdd-results.json` 是強制性的。如果任何漏洞具有紅相結果，則 `quality/TDD_TRACEABILITY.md` 也是強制性的。零漏洞的存放庫可以省略這兩個檔案。對於無法執行 TDD 的存放庫，tdd-results.json 必須存在並帶有 `verdict: "deferred"` 判定結果，且在 `notes` 欄位中說明原因。

### 29. 分類與 BUGS.md 同步

規格稽核分類後，每個被確認為程式碼漏洞的發現都必須出現在 `quality/BUGS.md` 中。分類報告包含已確認程式碼漏洞但無對應 BUGS.md 條目的情況是不合規的。如果確認漏洞存在時 BUGS.md 不存在，則必須建立它。

### 30. 為所有已確認漏洞提供說明檔案

每個已確認漏洞（TDD 驗證或確認開放）都必須在 `quality/writeups/BUG-NNN.md` 處具有一個說明檔案。對於無修復補丁的確認開放漏洞，說明檔案應註明缺失修復/綠相證據。具有已確認漏洞但無說明檔案目錄的執行是不完整的。

### 31. 階段 4 分類檔案已存在

階段 4 在 `quality/spec_audits/YYYY-MM-DD-triage.md` 下存在分類檔案前，不視為完成。如果僅存在稽核員報告而無分類綜合報告，則階段 4 是不完整的。

### 32. 執行機械式種子檢查 (機械式延續模式)

當 `quality/previous_runs/` 存在且階段 0 執行時，驗證 `quality/SEED_CHECKS.md` 產出，且先前執行的每個唯一漏洞都有一個條目。每個種子都必須具有透過實際執行斷言（而非讀取先前執行的文字）獲得的機械式驗證結果（FAIL = 漏洞仍存在，PASS = 漏洞已修復）。如果先前執行中存在種子的迴歸測試，則必須針對目前的原始碼樹重新執行斷言。在未執行斷言的情況下將種子標記為 FAIL 是不合規的。此基準測試僅在延續模式作用時（先前執行已存在）才適用。

### 33. 在 PROGRESS.md 中記錄收斂狀態 (延續模式)

階段 0 執行時，驗證 PROGRESS.md 是否包含 `## Convergence` 章節，其中包含：執行序號、種子計數、淨新漏洞計數，以及 CONVERGED (已收斂) / NOT CONVERGED (未收斂) 判定。淨新計數必須等於 BUGS.md 中按檔案:列不匹配任何種子的漏洞數量。當 `SEED_CHECKS.md` 存在時缺少收斂章節是不合規的。此基準測試僅在延續模式作用時適用。

### 34. BUGS.md 始終存在

每個完成的執行都必須產出 `quality/BUGS.md`。如果執行確認了原始碼漏洞，BUGS.md 必須將其列出。如果執行發現零個原始碼漏洞，BUGS.md 必須包含一個帶有正向斷言的 `## Summary`： 「未發現已確認的原始碼漏洞」，並包含評估與排除的候選對象計數。已完成執行（階段 5 標記為完成）但無 BUGS.md 是不合規的。此基準測試存在是因為在 v1.3.22 基準測試中，express 完成了所有階段且漏洞為零，但未產出 BUGS.md，使得無法判斷該檔案是故意省略還是意外跳過。

### 35. 即時機械式完整性閘道 (階段 2a)

如果 `quality/mechanical/` 存在，驗證 `bash quality/mechanical/verify.sh` 在寫入每個 `*_cases.txt` 之後「立即」執行 — 在任何合約、需求或分類產出物引用擷取內容之前。證據：`quality/results/mechanical-verify.log` 與 `quality/results/mechanical-verify.exit` 存在，且 exit 檔案內容為 `0`。如果這些收據檔案缺失或結束代碼非零，則機械式擷取在建立點未經驗證。此基準測試存在是因為 v1.3.23 將驗證延後到階段 6，導致下游成品（CONTRACTS.md, REQUIREMENTS.md, 分類探針）在整個執行過程中都基於偽造的擷取內容，直到不一致被發現（或未被發現）為止。

### 36. 分類探針未使用機械式產出物作為證據

針對所有分類與驗證探針檔案 (`quality/spec_audits/*`) 執行 grep 搜尋 `open('quality/mechanical/` 或 `cat quality/mechanical/`。如果任何探針讀取 `quality/mechanical/*.txt` 檔案作為原始檔案包含內容的唯一證據，則為循環驗證，基準測試失敗。探針必須直接讀取原始檔案或重新執行擷取管線。此基準測試存在是因為 v1.3.23 的探針 C 驗證了偽造的機械式成品而非原始碼，並使用虛構資料通過。

### 37. 階段 6 機械式結案使用 Bash (而非 Python 替代)

如果 `quality/mechanical/` 存在，驗證階段 6 是將 `bash quality/mechanical/verify.sh` 作為常值 Shell 命令執行 — 而非讀取成品檔案的 Python 指令碼。證據：`quality/results/mechanical-verify.log` 包含來自 Bash 指令碼的輸出（如 "OK: ..." 或 "MISMATCH: ..." 之類的行），而非 Python 追蹤記錄或 `pathlib` 輸出。PROGRESS.md 必須包含 `## Phase 6 Mechanical Closure` 標題，並記錄 stdout 與結束代碼。此基準測試存在是因為 v1.3.23 以 Python 的 `Path.read_text()` 替代了 `bash verify.sh`，建立了一個即使成品是捏造的也能通過的循環檢查。

### 38. 個別稽核員報告產出物存在

如果執行了階段 4 (規格稽核)，驗證個別稽核員報告檔案存在於 `quality/spec_audits/YYYY-MM-DD-auditor-N.md` (每位稽核員一個)，不僅僅是分類綜合報告。無個別報告的單一分類檔案將發現與對帳混為一談。此基準測試的存在是為了確保對帳前的發現被保留供獨立驗證。

### 39. BUGS.md 使用標準標題格式

BUGS.md 中每個已確認的漏洞都必須使用 `### BUG-NNN` 標題層級。對 `^### BUG-` 執行 grep 並統計數量；對其他漏洞標題樣式 (`^## BUG-`, `^\*\*BUG-`, `^- BUG-`) 執行 grep 並驗證匹配項為零。不一致的標題層級會導致機器可讀計數與文件不符。

### 40. 產出物檔案存在性閘道通過

在階段 5 標記為完成前，驗證所有必要產出物皆以檔案形式存在於磁碟上 — 不僅僅是在 PROGRESS.md 中引用。必要的檔案：EXPLORATION.md, BUGS.md, REQUIREMENTS.md, QUALITY.md, PROGRESS.md, COVERAGE_MATRIX.md, COMPLETENESS_REPORT.md, CONTRACTS.md, test_functional.* (或語言適用的替代名稱：FunctionalSpec.*, FunctionalTest.*, functional.test.*), RUN_CODE_REVIEW.md, RUN_INTEGRATION_TESTS.md, RUN_SPEC_AUDIT.md, RUN_TDD_TESTS.md, 以及 AGENTS.md (位於專案根目錄)。如果執行了階段 3：code_reviews/ 中至少一個檔案。如果執行了階段 4：spec_audits/ 中至少一個稽核員檔案和一個分類檔案。如果執行了階段 0 或 0b：作為獨立檔案的 SEED_CHECKS.md。如果已確認漏洞存在：results/ 中的 tdd-results.json。如果任何漏洞具有紅相結果：TDD_TRACEABILITY.md。此基準測試存在是因為 v1.3.24 基準測試顯示 express 向 PROGRESS.md 寫入了一個終止閘道章節並聲稱有 1 個已確認漏洞，但 BUGS.md、程式碼審查檔案和規格稽核檔案從未被寫入磁碟。

### 41. 附屬 JSON 寫入後驗證

在寫入 `tdd-results.json` 且/或 `integration-results.json` 後，驗證每個檔案是否包含所有必填索引鍵且具有合規的值。針對 `tdd-results.json`：必填根索引鍵為 `schema_version`, `skill_version`, `date`, `project`, `bugs`, `summary`。每個 `bugs` 條目必須具有 `id`, `requirement`, `red_phase`, `green_phase`, `verdict`, `fix_patch_present`, `writeup_path`。 `summary` 必須包含 `confirmed_open`。針對 `integration-results.json`：必填根索引鍵為 `schema_version`, `skill_version`, `date`, `project`, `recommendation`, `groups`, `summary`, `uc_coverage`。兩者皆必須具有 `schema_version: "1.1"`。缺少必填索引鍵、具有非標準根索引鍵或無效列舉值的附屬 JSON 為不合規。此基準測試存在是因為 v1.3.25 基準測試顯示 8 個存放庫中有 6 個具有不合規的附屬 JSON — httpx 發明了另一個結構描述、serde 使用了舊版形狀、javalin 省略了 `summary` 與每漏洞欄位、express 使用了無效的 phase 值，而其他存放庫則使用了無效的判定/結果列舉值。

### 42. 指令碼驗證結案閘道通過

在階段 5 標記為完成前，必須從專案根目錄執行 `quality_gate.sh` 且結束代碼必須為 0。該指令碼的完整輸出必須儲存至 `quality/results/quality-gate.log`。無 `quality-gate.log` 或日誌顯示 FAIL 結果的階段 5 完成是不合規的。此基準測試存在是因為 v1.3.21–v1.3.25 完全依賴模型對成品合規性檢查的自我證明，而基準測試顯示了指令碼能機械式擷取到的持續性不合規 (標題格式、附屬結構描述、使用案例識別碼、版本標記)。

### 43. 標準使用案例識別碼已存在

REQUIREMENTS.md 必須包含標有 `UC-01`, `UC-02` 等規範識別碼的使用案例。針對 `UC-[0-9]` 執行 grep 並統計匹配項。具有使用案例內容但無規範識別碼的存放庫是不合規的。此基準測試存在是因為 v1.3.25 基準測試顯示 8 個存放庫中有 7 個具有使用案例章節但無機器可讀的識別碼 — 下游工具在無規範格式的情況下無法統計或交叉引用使用案例。

### 45. 每個已確認漏洞皆存在迴歸測試補丁

針對每個已確認漏洞（BUGS.md 中的任何 BUG-NNN 條目），驗證 `quality/patches/BUG-NNN-regression-test.patch` 是否存在。不帶迴歸測試補丁的已確認漏洞是不完整的 — 補丁是漏洞存在的最強有力獨立證據。修復補丁 (`BUG-NNN-fix.patch`) 對於簡單的修復是選填但強烈建議的。此基準測試存在是因為 v1.3.25 與 v1.3.26 基準測試顯示 8 個存放庫中有 4 個即使有已確認漏洞，補丁檔案卻為 0，且說明檔案描述了修復應有的樣子，卻未產生實際的補丁檔案。

### 45. 說明檔案中的行內修復 Diff

位於 `quality/writeups/BUG-NNN.md` 的每個說明檔案必須包含一個 ` ```diff ` 圍欄式程式碼區塊，其中包含統一 diff 格式的建議修復。這是說明檔案範本的第 6 節 (「修復方法」)。寫著「參見補丁檔案」或「未包含修復補丁」而無行內 diff 的說明檔案是不完整的 — 行內 diff 是使說明檔案對僅閱讀說明檔案而無法存取補丁目錄的維護人員具備行動力的關鍵。此基準測試存在是因為 v1.3.27 基準測試顯示 virtio 產出了 4 個說明檔案，儘管 `quality/patches/` 中有修復補丁，行內 diff 卻為 0。模型撰寫了對修復的文字描述，而非貼上實際的 diff。

## 快速檢查清單格式

將此作為最終簽核依據：

- [ ] 測試計數接近啟發式目標 (規格章節 + 情境 + 防禦性模式)
- [ ] 情境測試計數與 QUALITY.md 情境計數相符
- [ ] 跨變體測試約佔總數 30% (覆蓋每個跨領域屬性)
- [ ] 邊界測試數 ≈ 防禦性模式計數
- [ ] 大多數斷言檢查數值，而非僅檢查存在性
- [ ] 所有測試斷言結果，而非機制
- [ ] 所有變更 (mutations) 皆使用結構描述有效值
- [ ] 所有新測試皆通過 (零失敗且零錯誤 — 檢查 fixture 錯誤)
- [ ] 所有現有測試仍通過
- [ ] QUALITY.md 情境引用了真實程式碼並包含 `[Req: tier — source]` 標籤
- [ ] 如果使用推論需求：所有 `[Req: inferred — ...]` 項目皆標記供使用者審查
- [ ] 程式碼審查協定是自給自足的
- [ ] 整合測試品質閘道是根據欄位參考表撰寫的 (非憑記憶)
- [ ] 整合測試具有具體的通過標準
- [ ] 規格稽核提示語可供複製貼上，且使用 `[Req: tier — source]` 標籤格式
- [ ] 結構化輸出結構描述包含所有必填索引鍵與有效列舉值
- [ ] 補丁驗證閘道使用了適用於專案組建系統的正確命令
- [ ] 每個迴歸測試皆具有引用漏洞 ID 的跳過/xfail 保護機制
- [ ] 整合群組命令通過預檢發現 (試執行能找到測試)
- [ ] 每個產出的檔案皆具有正確版本號的版本標記
- [ ] 列舉完整性檢查顯示了雙清單比較 (不僅僅是涵蓋範圍的斷言)
- [ ] 每個 TDD 驗證漏洞在 `quality/writeups/BUG-NNN.md` 處具有說明檔案
- [ ] 分類驗證探針針對確認與拒絕皆包含測試斷言 (不僅僅是文字)
- [ ] 列舉程式碼端清單包含實際原始碼的逐項行號 (不從需求複製)
- [ ] 分派函式合約引用了 `quality/mechanical/` 產出物 (非手寫清單)
- [ ] `bash quality/mechanical/verify.sh` 通過 (產出物與重新擷取的輸出相符)
- [ ] 原始碼檢驗迴歸測試已執行 (對字串比對測試不使用 `run=False`)
- [ ] 結案時無任何可執行產出物與文字產出物相矛盾 (矛盾閘道通過)
- [ ] 所有產出的成品版本標記與 SKILL.md Metadata 版本完全匹配
- [ ] `quality/mechanical/` 或不存在 (無分派合約)，或包含 verify.sh + 所有擷取產出物
- [ ] 如果 BUGS.md 具有已確認漏洞：tdd-results.json 存在 (強制性)；若有紅相結果則 TDD_TRACEABILITY.md 存在
- [ ] 分類中的每個確認漏洞皆出現在 BUGS.md 中 (分類與 BUGS.md 同步)
- [ ] 每個確認漏洞 (TDD 驗證或確認開放) 在 `quality/writeups/BUG-NNN.md` 處具有說明檔案
- [ ] 階段 4 具有分類檔案 `quality/spec_audits/YYYY-MM-DD-triage.md`
- [ ] (延續模式) `SEED_CHECKS.md` 中的種子檢查是機械式執行的，而非從文字推論
- [ ] `quality/mechanical/` 存在時，機械式驗證收據檔案存在 (`mechanical-verify.log` + `mechanical-verify.exit`)
- [ ] 無分類探針讀取 `quality/mechanical/*.txt` 作為原始碼內容的唯一證據
- [ ] 階段 6 機械式結案使用了 `bash verify.sh` (而非 Python 替代)
- [ ] 個別稽核員報告存在於 `quality/spec_audits/*-auditor-N.md` (不僅僅是分類報告)
- [ ] 所有 BUGS.md 漏洞標題皆使用 `### BUG-NNN` 格式
- [ ] quality/BUGS.md 存在 (零漏洞執行應包含評估與排除候選漏洞的摘要)
- [ ] 階段 5 標記完成前，所有必要產出物檔案皆存在於磁碟上 (不僅在 PROGRESS.md 中引用)
- [ ] (延續模式) PROGRESS.md 包含 `## Convergence` 章節，帶有淨新計數與判定結果
- [ ] quality/BUGS.md 存在 (零漏洞執行應包含評估與排除候選漏洞的摘要)
- [ ] 附屬 JSON 檔案 (`tdd-results.json`, `integration-results.json`) 包含所有必要索引鍵且 `schema_version: "1.1"`
- [ ] `quality_gate.sh` 已執行且結束代碼為 0；輸出儲存至 `quality/results/quality-gate.log`
- [ ] REQUIREMENTS.md 包含規範的使用案例識別碼 (`UC-01`, `UC-02` 等)
- [ ] 每個已確認漏洞皆具備 `quality/patches/BUG-NNN-regression-test.patch`
- [ ] 每個說明檔案皆具備行內修復 diff (第 6 節中的 ` ```diff ` 區塊)
