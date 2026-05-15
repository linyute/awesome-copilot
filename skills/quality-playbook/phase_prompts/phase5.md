{skill_fallback_guide}

您是一位品質工程師，正在繼續執行逐階段的品質播放手冊。階段 1-4 已經完成。

請閱讀下列檔案以獲取內容：
1. quality/PROGRESS.md - 執行 Metadata、階段狀態、累計漏洞 (BUG) 追蹤器
2. quality/BUGS.md - 來自程式碼審查與規格稽核的所有已確認漏洞
3. quality/REQUIREMENTS.md - 衍生的需求
4. SKILL.md - 閱讀階段 5 的章節 (「階段 5：審查後對帳與結案驗證」)。同時閱讀 references/requirements_pipeline.md, references/review_protocols.md 與 references/spec_audit.md。請透過上述的文件後備方案清單解析 SKILL.md 與 references/ 目錄；「請勿」假設任何單一的安裝佈局。

執行階段 5：對帳 + TDD + 結案。

1. 按照 references/requirements_pipeline.md 執行審查後對帳。更新 COMPLETENESS_REPORT.md。
2. 執行結案驗證：追蹤器中的每個 BUG 都必須具有迴歸測試或明確的豁免。
3. 針對「每個」已確認漏洞，在 quality/writeups/BUG-NNN.md 撰寫漏洞說明檔案。規範範本位於 SKILL.md 的「漏洞說明檔案產生」章節（請透過後備方案清單進行解析）— 在撰寫前請先閱讀該章節。請使用該章節列出的確切欄位標題：**Summary (摘要)、Spec reference (規格參考)、The code (程式碼)、Observable consequence (可觀察的後果)、Depth judgment (深度判斷)、The fix (修復方法)、The test (測試)、Related issues (相關問題)**。每個說明檔案都必須包含第 1-4, 6, 7 節；第 5 節 (深度判斷) 僅在後果無法從立即的程式碼中看出時觸發；第 8 節 (相關問題) 僅在存在相關漏洞時包含。「請勿」引入範本之外的欄位（不要將「最簡重現」作為頂層欄位，不要將「補丁路徑」作為頂層欄位 — 這些分別屬於規格參考與測試節）。

   **強制性填充步驟。** 在撰寫說明檔案之前，請重新開啟 quality/BUGS.md 並找到您要撰寫之漏洞的 `### BUG-NNN:` 條目。BUGS.md 中每個已確認漏洞都已包含您所需的內容 — 您的工作是將其內容複製到說明檔案的各節中，而非發明內容。如果 BUGS.md 缺少欄位，那應在 PROGRESS.md 中反映為對帳錯誤，而不是憑空捏造。請使用此欄位對應表：

   | BUGS.md 欄位               | 說明檔案章節                 | 如何使用                                                                 |
   |----------------------------|------------------------------|--------------------------------------------------------------------------|
   | 標題列 (### BUG-NNN:…)     | Summary                      | 說明函式/程式碼路徑及可觀察失敗的一句話。                               |
   | 主要需求                   | Spec reference               | `- 需求：REQ-NNN`                                                        |
   | 規格基礎                   | Spec reference               | `- 規格基礎：<文件路徑 + 行範圍，若有多個請用分號分隔>`，外加一段從引用行中逐字複製的 ≤15 字合約引用。 |
   | 位置                       | The code                     | 引用 `檔案:列` 並描述目前路徑在該處執行的操作。                           |
   | 最簡重現                   | Observable consequence       | 作為觸發輸入編織進後果段落中。                                           |
   | 預期 + 實際行為            | Observable consequence       | 實際行為即為可觀察的失敗；預期行為則定義了落差。                         |
   | 迴歸測試                   | The test                     | `- 迴歸測試：<函式名稱>` — 逐字從 BUGS.md 複製。                         |
   | 補丁 (迴歸)                 | The test                     | `- 迴歸補丁：<路徑>` — 逐字從 BUGS.md 複製。                             |
   | 補丁 (修復)                 | The fix + The test           | 如果存在修復補丁檔案，請讀取並在 ```diff 內貼上統一 diff (unified diff)；同時在 The test 下將補丁路徑列為 `- 修復補丁：<路徑>`。如果不存在修復補丁檔案（已確認開放漏洞），無論如何請在 The fix 中直接寫入最簡具體統一 diff — SKILL.md 要求在每個說明檔案中包含行內 diff。在無補丁的情況下，從 The test 中省略 `修復補丁：` 項目。 |
   | 紅/綠日誌                   | The test                     | `- 紅色收據：quality/results/BUG-NNN.red.log` 及其相符的綠色路徑。       |

   **工作範例。** BUG-004 的 BUGS.md 條目為：

       ### BUG-004: naive upstream timestamps crash ETA math
       - 來源：程式碼審查
       - 嚴重程度：HIGH
       - 主要需求：REQ-006
       - 位置：bus_tracker.py:138-144
       - 規格基礎：quality/REQUIREMENTS.md:163-172; quality/QUALITY.md:57-65
       - 最簡重現：傳回一個其 ExpectedArrivalTime 為不含時區資訊之 ISO 字串 (如 2026-04-21T12:00:00) 的造訪。
       - 預期行為：受影響的抵達時間降級為未知時間，而站點的其餘部分仍可使用。
       - 實際行為：datetime.fromisoformat() 傳回一個 naive datetime，且將其從 datetime.now(timezone.utc) 中減去會引發 TypeError，從而中止站點/要求路徑。
       - 迴歸測試：quality.test_regression.TestPhase3Regressions.test_bug_004_fetch_stop_arrivals_degrades_naive_timestamps
       - 補丁：quality/patches/BUG-004-regression-test.patch, quality/patches/BUG-004-fix.patch

   填充後的說明檔案章節如下所示（草稿 — 請將來自修復補丁檔案的真實統一 diff 貼入 ```diff，不要自行捏造）：

       ## Summary
       當上游造訪攜帶 naive ExpectedArrivalTime 時，fetch_stop_arrivals() 會導致整個站點/要求路徑崩潰，而非將該抵達時間降級為未知時間。

       ## Spec reference
       - 需求：REQ-006
       - 規格基礎：quality/REQUIREMENTS.md:163-172; quality/QUALITY.md:57-65
       - 行為合約引用：「將不良的單次抵達時間戳記降級為未知時間，而非中止整個回應路徑」

       ## The code
       在 bus_tracker.py:138-144，解析器對 ExpectedArrivalTime 呼叫 datetime.fromisoformat(...)，並將結果從 datetime.now(timezone.utc) 中減去……

       ## Observable consequence
       當上游造訪傳回 ExpectedArrivalTime="2026-04-21T12:00:00"（無時區）時，fromisoformat() 傳回一個 naive datetime，減法運算會引發 TypeError，導致整個站點/要求路徑中止，而非僅將受影響的抵達時間降級為未知時間。

       ## The fix
       ```diff
       <在此處貼上來自 quality/patches/BUG-004-fix.patch 的真實統一 diff>
       ```

       ## The test
       - 迴歸測試：quality.test_regression.TestPhase3Regressions.test_bug_004_fetch_stop_arrivals_degrades_naive_timestamps
       - 迴歸補丁：quality/patches/BUG-004-regression-test.patch
       - 修復補丁：quality/patches/BUG-004-fix.patch
       - 紅色收據：quality/results/BUG-004.red.log
       - 綠色收據：quality/results/BUG-004.green.log

   **確認清單（每個說明檔案，在處理下一個漏洞前）。** (a) 每個必要章節都具有從 BUGS.md 或補丁檔案複製而來的已填充內容 — 無空的反引號，無「是在 `` 中確認的程式碼漏洞」或「受影響的實作位於 ``」或「補丁路徑：``」之類的哨兵填充文字。(b) ```diff 圍欄中至少包含一行來自實際修復補丁的 `+` 或 `-`。(c) 摘要命名了真實的函式或程式碼路徑，而非 BUG 識別碼。(d) 最終說明檔案中沒有保留角括號佔位符 (例如 `<...>`) — 這些是來自工作範例與 SKILL.md 的教學標記，絕非可接受的輸出。
4. 執行 TDD 紅-綠週期：對於每個已確認漏洞，對未修補的原始碼執行迴歸測試 -> quality/results/BUG-NNN.red.log。如果存在修復補丁，對修補後的程式碼執行測試 -> quality/results/BUG-NNN.green.log。如果測試執行器不可用，請建立標頭為 NOT_RUN 的日誌並說明原因。
5. 產生附屬 JSON 檔案：quality/results/tdd-results.json 與 quality/results/integration-results.json (schema_version "1.1", 規範欄位：id, requirement, red_phase, green_phase, verdict, fix_patch_present, writeup_path)。
6. 如果存在機械式驗證產出物，請執行 quality/mechanical/verify.sh 並儲存收據。
7. 執行終止閘道驗證，並將其寫入 PROGRESS.md。

### 強制性基數閘道 (MANDATORY CARDINALITY GATE) (槓桿 3, v1.5.2)

在完成此階段之前，請針對目前存放庫狀態執行基數對帳閘道。透過與 SKILL.md 相同的後備清單定位 `quality_gate.py`（它在每個安裝佈局中都與 SKILL.md 位於同一個目錄下），然後將其作為指令碼調用 — `quality_gate.py` 會在其標準傳遞中執行 `check_v1_5_2_cardinality_gate(repo_dir)`：

    python3 <解析後的_quality_gate_路徑> .

其中 `<解析後的_quality_gate_路徑>` 是周遊記錄在案的安裝位置後備清單時的第一個命中項，並將 `SKILL.md` 替換為 `quality_gate.py` (例如 `quality_gate.py`, `.claude/skills/quality-playbook/quality_gate.py`, `.github/skills/quality_gate.py`, `.cursor/skills/quality-playbook/quality_gate.py`, `.continue/skills/quality-playbook/quality_gate.py`, `.github/skills/quality_gate.py`)。

如果閘道輸出包含任何以 `cardinality gate:` 開頭的行，或報告了未涵蓋的單元格、格式錯誤的單元格 ID、多單元格涵蓋範圍中缺少彙整理由，或格式錯誤的降級記錄，請「停止」。修復 BUGS.md 條目或 `compensation_grid_downgrades.json` 檔案。在這些失敗行不再出現之前，請「不要」結案。

對於每個帶有模式標記的 REQ，階段 5 的合約如下：
- 每個 `"present": false` 的矩陣單元格都出現在 BUG 的 `Covers:` 清單或降級記錄中。
- 每個 `Covers:` 條目都使用規範的單元格 ID 形式 `REQ-N/cell-<項目>-<位置>`。
- 具有 ≥2 個 `Covers:` 條目的每個 BUG 都有一個非空的 `Consolidation rationale:` (彙整理由) 行。
- 每個降級記錄都具有 `cell_id`, `authority_ref`, `site_citation`, `reason_class` (在列舉中), `falsifiable_claim` (非空)。

基數閘道是封鎖性的。它有意地比階段 3 的建議性自我檢查更嚴格；建議性檢查旨在及早發現問題，但階段 5 是必須解決這些問題的地方。

在 PROGRESS.md 中標記階段 5 已完成（使用核取方塊格式 `- [x] Phase 5 - Reconciliation` — 「請勿」切換為表格）。

重要：如果任何說明檔案遺漏了非空的 ```diff 區塊，或逐字包含下列任何哨兵短語： "是在 `` 中確認的程式碼漏洞", "受影響的實作位於 ``", "補丁路徑：``", "- 迴歸測試：``", "- 迴歸補丁：``"，quality_gate.py 將會讓階段 5「失敗」。這些兩項檢查是硬性閘道。跳過上述的 BUGS.md 填充步驟雖不會被閘道強制執行，但會產出讀起來像未填充虛設常式的說明檔案並導致人工審查失敗 — 請不要跳過此步驟。
