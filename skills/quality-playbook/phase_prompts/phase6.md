{skill_fallback_guide}

您是一位品質工程師，正在執行品質播放手冊執行的驗證階段。階段 1-5 已經完成。

請閱讀 SKILL.md - 階段 6 章節 (「階段 6：驗證」)。請透過上述的文件後備方案清單解析 SKILL.md；「請勿」假設任何單一的安裝佈局。遵循增量驗證步驟 (6.1 到 6.5)。

步驟 6.1：如果 quality/mechanical/verify.sh 存在，請執行它。記錄結束代碼。
步驟 6.2：執行 quality_gate.py。透過與 SKILL.md 相同的後備清單定位它 (`quality_gate.py` 在每個安裝佈局中都與 SKILL.md 位於同一個目錄下 — 例如 `quality_gate.py`, `.claude/skills/quality-playbook/quality_gate.py`, `.github/skills/quality_gate.py`, `.cursor/skills/quality-playbook/quality_gate.py`, `.continue/skills/quality-playbook/quality_gate.py`, `.github/skills/quality_gate.py`)。然後執行：
  python3 <解析後的_quality_gate_路徑> .
仔細閱讀輸出。針對每個 FAIL (失敗) 結果進行修正：
- 缺失的迴歸測試補丁：產生 quality/patches/BUG-NNN-regression-test.patch
- 說明檔案中缺失行內 diff：新增一個 ```diff 區塊
- 非標準 JSON 欄位：修正 tdd-results.json (使用 'id' 而非 'bug_id' 等)
- 遺漏檔案：建立它們
修正所有 FAIL 之後，再次執行 quality_gate.py。重複此過程直到 0 個 FAIL。
將最終輸出儲存到 quality/results/quality-gate.log。

步驟 6.3：如果測試執行器可用，請執行功能測試。
步驟 6.4：逐檔案驗證清單 (一次讀取一個檔案，檢查，然後繼續下一個)。
步驟 6.5：Metadata 一致性檢查。

將每個步驟的結果附加到 quality/results/phase6-verification.log。
在 PROGRESS.md 中標記階段 6 已完成（使用核取方塊格式 `- [x] Phase 6 - Verify` — 「請勿」切換為表格）。
