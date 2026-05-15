# 執行狀態結構描述 (Run-State Schema) (v1.5.6)

*`quality/run_state.jsonl`、`quality/PROGRESS.md` 以及 `Calibration Cycles/<cycle>/run_state.jsonl` 的權威結構描述。執行播放手冊的 AI 直接透過檔案工具層寫入這些檔案；協調器 AI 則讀取這些檔案以驅動多基準測試的校準週期。*

*隨附文件：`docs/design/QPB_v1.5.5_Design.md` (「設計 — 執行狀態事件分類法」章節)。*

---

## 檔案位置與擁有權

- `<benchmark>/quality/run_state.jsonl` — 每次執行的事件日誌。僅限附加。由執行播放手冊的 AI 寫入。
- `<benchmark>/quality/PROGRESS.md` — 人類可讀的執行狀態。由 AI 在每個事件發生時進行不可分割的 (atomic) 重寫。
- `Calibration Cycles/<cycle>/run_state.jsonl` — 週期層級的事件日誌。僅限附加。由協調器 AI 寫入。

這三個檔案都位於使用者擁有的繫結掛載工作區中。AI 透過編輯/寫入檔案工具進行寫入，絕不透過 Shell 重新導向或 `tee` (在某些沙箱執行環境中，這些方式會透過不同的 UID 層進行路由)。

---

## 結構描述版本控制

每個 `run_state.jsonl` 都以一個記錄 `schema_version` 的 `_index` 事件開頭。目前的版本為：`"1.5.6"`。結構描述的提升保留了回溯相容性 — 較舊的檔案仍可由較新的解析器讀取。重大的結構描述變更會提升主版本號。

---

## 必填欄位（每個事件）

每個事件物件「必須」具有：

- `ts` — ISO 8601 UTC 時間戳記，帶有 `Z` 字尾 (例如 `"2026-05-15T14:32:01Z"`)。允許但不要求亞秒級精度。
- `event` — 字串，事件類型名稱。必須與 `_index.event_types` 中列出的名稱之一相符。

事件「可以」根據其類型的規格（見下文）具有額外欄位。讀取器可以容忍未知欄位（向前相容）。

---

## 每次執行的事件 (`<benchmark>/quality/run_state.jsonl`)

### `_index`

「始終」為第一列。記錄結構描述 Metadata。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | 始終為 `"_index"` |
| `ts` | 字串 | 是 | ISO 8601 UTC |
| `schema_version` | 字串 | 是 | `"1.5.6"` |
| `event_types` | 字串陣列 | 是 | 此檔案使用的每個事件類型 |
| `benchmark` | 字串 | 是 | 例如 `"chi-1.3.45"`, `"virtio-1.5.1"` |
| `lever_state` | 字串 | 是 | 例如 `"pre-pattern7"`, `"post-pattern7"`, `"baseline"` |
| `started_at` | 字串 | 是 | ISO 8601 UTC，等於此事件的 `ts` |

### `run_start`

標記播放手冊執行的開始。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"run_start"` |
| `ts` | 字串 | 是 | |
| `runner` | 字串 | 是 | `"claude"`, `"codex"`, `"copilot"`, `"cursor"` 之一 |
| `playbook_version` | 字串 | 是 | 例如 `"1.5.6-pre"`, `"1.5.6"` (與 `bin.benchmark_lib.RELEASE_VERSION` 相符) |
| `target_path` | 字串 | 是 | 到基準測試目標的相對路徑 |

### `phase_start`

標記六個播放手冊階段之一的開始。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"phase_start"` |
| `ts` | 字串 | 是 | |
| `phase` | 整數 | 是 | 1, 2, 3, 4, 5 或 6 |

### `pattern_walked`

僅限階段 1。記錄七種探索模式之一已執行。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"pattern_walked"` |
| `ts` | 字串 | 是 | |
| `phase` | 整數 | 是 | 始終為 1 |
| `pattern` | 整數 | 是 | 1 到 7 |
| `findings_count` | 整數 | 是 | 此模式產出的發現數量 |
| `duration_seconds` | 數字 | 選填 | 執行此模式所花費的掛鐘時間 |

### `pass_started` / `pass_ended`

僅限階段 4。記錄四個技能推導傳遞之一的開始/結束。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"pass_started"` 或 `"pass_ended"` |
| `ts` | 字串 | 是 | |
| `phase` | 整數 | 是 | 始終為 4 |
| `pass` | 字串 | 是 | `"A"`, `"B"`, `"C"`, `"D"` 之一 |
| `output_artifact` | 字串 | 選填 | 到傳遞產出物的相對路徑 (用於 `pass_ended`) |

### `finding_logged`

記錄當前階段中記錄了一項發現（技能分歧、程式碼漏洞等）。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"finding_logged"` |
| `ts` | 字串 | 是 | |
| `phase` | 整數 | 是 | 1-6 |
| `finding_id` | 字串 | 是 | 例如 `"BUG-007"`, `"REQ-042"` |
| `category` | 字串 | 是 | 例如 `"code-bug"`, `"skill-divergence"`, `"missing-citation"`, `"prose-to-code-mismatch"` |

### `artifact_written`

記錄產出/更新了一個成品檔案。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"artifact_written"` |
| `ts` | 字串 | 是 | |
| `relative_path` | 字串 | 是 | 相對於基準測試目標的路徑 (例如 `"quality/EXPLORATION.md"`) |
| `byte_size` | 整數 | 選填 | 寫入時的檔案大小 |
| `line_count` | 整數 | 選填 | 行數 |

### `gate_check`

記錄單次品質閘道檢查的結果。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"gate_check"` |
| `ts` | 字串 | 是 | |
| `gate_name` | 字串 | 是 | 來自 `quality_gate.py` 的識別碼 |
| `verdict` | 字串 | 是 | `"pass"`, `"fail"`, `"warn"`, `"skip"` 之一 |
| `reason` | 字串 | 選填 | 人類可讀的說明 |

### `phase_end`

標記階段的結束。在寫入前會根據階段預期的產出物進行交叉驗證（見下方的「交叉驗證規則」）。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"phase_end"` |
| `ts` | 字串 | 是 | |
| `phase` | 整數 | 是 | 1-6 |
| `key_counts` | 物件 | 是 | 階段專屬的計數 (見下文) |
| `artifacts_produced` | 字串陣列 | 是 | 此階段產出的成品的相對路徑 |
| `duration_seconds` | 數字 | 選填 | 整個階段的花費掛鐘時間 |

每個階段的 `key_counts`：

- 階段 1：`{"findings_total": N, "patterns_walked": M}` (完整的階段 1 中 M 應為 7)
- 階段 2：`{"findings_promoted": N, "findings_dropped": M}`
- 階段 3：`{"bugs_identified": N, "bug_writeups": M}`
- 階段 4：`{"req_count": N, "uc_count": M, "passes_complete": K}` (K 應為 4)
- 階段 5：`{"gate_checks_total": N, "gate_failures": M}`
- 階段 6：`{"bugs_md_count": N, "gate_verdict": "pass|fail|partial"}`

### `error`

記錄執行期間發生的錯誤。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"error"` |
| `ts` | 字串 | 是 | |
| `phase` | 整數 | 選填 | 如果錯誤受階段限制 |
| `message` | 字串 | 是 | 人類可讀的描述 |
| `recoverable` | 布林值 | 是 | 如果為 true，執行將重試受影響的階段；如果為 false，執行正在中止 |

### `documentation_state`

v1.5.6+。記錄階段 1 進入時的文件可用性狀態。目前唯一發出的狀態是 `"code_only"`，表示 `reference_docs/` 與 `reference_docs/cite/` 未包含公認的純文字內容 (`.md` 或 `.txt`)，且階段 1 正在以僅原始碼模式執行（參見 `references/code-only-mode.md`）。`"with_docs"` 值保留用於未來的明確發出；目前的 `documentation_state` 事件缺失即暗示存在文件。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"documentation_state"` |
| `ts` | 字串 | 是 | |
| `state` | 字串 | 是 | 目前為 `"code_only"`。未來值可能包含 `"with_docs"`。 |
| `reason` | 字串 | 是 | 自由格式 (例如 `"reference_docs/ 為空"`) |

當發出 `documentation_state state="code_only"` 時，播放手冊還會向 `quality/EXPLORATION.md` 前置一個「文件狀態：僅原始碼模式」章節，並向 `quality/PROGRESS.md` 新增一個「文件狀態：code_only」行，以便閱讀任何一項成品的任何人都能看到降級情況。新增 `documentation_state` 事件的新執行必須將其包含在 `_index.event_types` 清單中。

### `aborted_missing_docs`

v1.5.6+。記錄由於設定了 `--require-docs` 且 `reference_docs/` 為空，執行在階段 1 進入時中止。對於相同的階段 1 進入，與 `documentation_state state="code_only"` 互斥 — `--require-docs` 是主動中止路徑；缺少該旗標則保留記錄在案的僅原始碼模式降級。在此事件之後，執行器傳回非零值而不調用任何 LLM 工作，因此不會記錄 `phase_start phase=1`。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"aborted_missing_docs"` |
| `ts` | 字串 | 是 | |
| `reason` | 字串 | 是 | 自由格式 (例如 `"reference_docs/ 為空且設定了 --require-docs"`) |

當發出 `aborted_missing_docs` 時，播放手冊還會向 `quality/PROGRESS.md` 寫入一個 `ERROR: aborted_missing_docs — <原因>` 區塊，以便在不讀取 JSONL 的情況下也能看到中止情況。針對空白 `reference_docs/` 傳遞 `--require-docs` 的新執行必須在 `_index.event_types` 清單中包含 `aborted_missing_docs`。

### `run_end`

標記播放手冊執行的結束。

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"run_end"` |
| `ts` | 字串 | 是 | |
| `status` | 字串 | 是 | `"success"`, `"aborted"`, `"failed"` 之一 |
| `total_findings` | 整數 | 選填 | 跨所有階段的總和 |
| `final_verdict` | 字串 | 選填 | 階段 6 閘道判定結果 |

---

## 週期層級事件 (`Calibration Cycles/<cycle>/run_state.jsonl`)

### `_index` (週期層級)

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"_index"` |
| `ts` | 字串 | 是 | |
| `schema_version` | 字串 | 是 | `"1.5.6"` |
| `event_types` | 字串陣列 | 是 | |
| `cycle_name` | 字串 | 是 | 例如 `"2026-05-15-pattern7-displacement-recovery"` |
| `lever_under_test` | 字串 | 是 | 例如 `"lever-1-exploration-breadth-depth"` |
| `benchmarks` | 字串陣列 | 是 | 週期的固定基準測試清單 |
| `iteration` | 整數 | 是 | 反覆運算序數 (1, 2 或 3 — 參見 iterate-cap) |

### `cycle_start`

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"cycle_start"` |
| `ts` | 字串 | 是 | |
| `hypothesis` | 字串 | 是 | 週期的可測試假設 |
| `noise_floor_threshold` | 數字 | 是 | 低於此值的召回率增量被視為噪訊 (預設 0.05) |

### `benchmark_start`

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"benchmark_start"` |
| `ts` | 字串 | 是 | |
| `benchmark` | 字串 | 是 | |
| `lever_state` | 字串 | 是 | `"pre-lever"` 或 `"post-lever"` |

### `lever_change_applied`

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"lever_change_applied"` |
| `ts` | 字串 | 是 | |
| `lever_id` | 字串 | 是 | 例如 `"lever-1-exploration-breadth-depth"` |
| `files_changed` | 字串陣列 | 是 | 相對於 QPB 存放庫根目錄的路徑 |
| `commit_sha` | 字串 | 是 | 實作分支上的提交 SHA |
| `description` | 字串 | 是 | 變更內容 (例如 `"Pattern 7 預算上限 3-5 → 2-3"`) |

### `lever_change_reverted`

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"lever_change_reverted"` |
| `ts` | 字串 | 是 | |
| `files_changed` | 字串陣列 | 是 | |
| `commit_sha` | 字串 | 選填 | 如果還原尚未提交則為 Null/缺失 |

### `benchmark_end`

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"benchmark_end"` |
| `ts` | 字串 | 是 | |
| `benchmark` | 字串 | 是 | |
| `lever_state` | 字串 | 是 | |
| `recall` | 數字 | 是 | 0.0-1.0 |
| `bugs_found` | 字串陣列 | 是 | 此執行發現的漏洞 ID |
| `bugs_missed` | 字串陣列 | 是 | 此執行遺漏的基準線漏洞 ID |
| `historical_baseline_path` | 字串 | 是 | 用於計算召回率的基準線 BUGS.md 路徑 |

### `cycle_end`

| 欄位 | 型別 | 是否必填 | 備註 |
|---|---|---|---|
| `event` | 字串 | 是 | `"cycle_end"` |
| `ts` | 字串 | 是 | |
| `verdict` | 字串 | 是 | `"ship"`, `"revert"`, `"iterate"`, `"halt-iterate-cap"` 之一 |
| `recall_before` | 物件 | 是 | 槓桿變更前的各基準測試召回率 |
| `recall_after` | 物件 | 是 | 槓桿變更後的各基準測試召回率 |
| `delta` | 物件 | 是 | 各基準測試增量 (recall_after - recall_before) |
| `cross_benchmark_check` | 物件 | 是 | `{"clean": bool, "regressions": [已發生退步的 基準測試/漏洞 對清單]}` |

---

## 交叉驗證規則 (針對 `phase_end`)

AI 在附加 `phase_end` 事件前會驗證這些條件。如果任何檢查失敗，AI 會附加一個 `recoverable: true` 的 `error` 事件，並重新執行失敗的階段。

| 階段 | 必要條件 |
|---|---|
| 1 | `quality/EXPLORATION.md` 存在，且 ≥ 120 列（與 `bin/run_playbook.check_phase_gate` 中的階段 2 啟動閘道一致），包含至少一個發現章節（Regex `^##\s+(Finding\|Open Exploration Findings\|\d+\.)` — 接受 `## Finding ...`、SKILL 規定的精確標題 `## Open Exploration Findings` 以及編號標題 `## N.`） |
| 2 | 所有九個固定名稱的 Generate 合約產出物皆非空存在於 `quality/` 下：`REQUIREMENTS.md`、`QUALITY.md`、`CONTRACTS.md`、`COVERAGE_MATRIX.md`、`COMPLETENESS_REPORT.md`、`RUN_CODE_REVIEW.md`、`RUN_INTEGRATION_TESTS.md`、`RUN_SPEC_AUDIT.md`、`RUN_TDD_TESTS.md`。此外，至少存在一個非空 `quality/test_functional.<副檔名>`（副檔名視主要語言而定）。在 v1.5.6 之前，此列描述的是 v1.5.5 設計的分類模型 (`EXPLORATION_MERGED.md` / `triage.md`)；該對應關係從未被正式發佈的 SKILL.md / orchestrator_protocol.md / 代理程式檔案所採用，後者始終將階段 2 記錄為「產生」(Generate)。 |
| 3 | `quality/code_reviews/` 目錄包含至少一個審查檔案。如果 `quality/BUGS.md` 具有任何 `### BUG-` 標題，則 `quality/patches/` 包含至少一個 `BUG-*-regression-test.patch` 檔案。在 v1.5.6 之前，此列檢查的是 `quality/RUN_CODE_REVIEW.md` (階段 2 的產生結果，而非階段 3 的審查結果) — 屬於與階段 2 相同的 v1.5.5 設計與正式發佈版本的飄移類別。叢集 B 已協調。 |
| 4 | `quality/spec_audits/` 目錄包含至少一個 `*-triage.md` 檔案「及」至少一個 `*-auditor-*.md` 檔案 (按照 orchestrator_protocol.md 的命名慣例)。當沒有名稱符合模式時，驗證器會退而求其次執行較弱的「≥2 個檔案」檢查 — 帶有任意 `.md` 名稱的舊版自舉執行仍可通過；階段 6 的閘道會強制執行更深層次的合規性。在 v1.5.6 之前，此列檢查的是 `quality/REQUIREMENTS.md` + `COVERAGE_MATRIX.md` (階段 2 的產出物) — 同樣屬於 v1.5.5 設計飄移類別。叢集 B 已協調。 |
| 5 | 如果 `quality/BUGS.md` 具有已確認的 `### BUG-` 條目：`quality/results/tdd-results.json` 非空存在；對於每個已確認漏洞，`quality/writeups/BUG-NNN.md` 存在「且」`quality/results/BUG-NNN.red.log` 存在。在沒有已確認漏洞的情況下，此列自動視為滿足。在 v1.5.6 之前，此列檢查的是 `quality/results/quality-gate.log` (階段 6 的產出物) — 同樣屬於 v1.5.5 設計飄移類別。叢集 B 已協調。 |
| 6 | `quality/results/quality-gate.log` 非空存在，「且」`quality/PROGRESS.md` 包含一個「終止閘道驗證」(Terminal Gate Verification) 章節（此為協調器協定標記，代表階段 6 已完整執行指令碼驗證的閘道）。在 v1.5.6 之前，此列檢查的是 `quality/BUGS.md` + `quality/INDEX.md` — BUGS.md 是階段 3 的產出物，INDEX.md 則從未在發佈的合約中被採用。同樣屬於 v1.5.5 設計飄移類別。叢集 B 已協調。 |

`run_end` 事件額外要求：日誌中存在所有 6 個 `phase_end` 事件；最終的 BUGS.md 計數與 `phase_end phase=6 key_counts.bugs_md_count` 相符。

---

## 恢復語意 (Resume semantics)

當 AI 對話在執行目錄中啟動時：

1. 如果 `quality/run_state.jsonl` 不存在：全新執行。寫入 `_index` + `run_start` + `phase_start phase=1`。
2. 如果已存在：讀取所有事件。尋找最後一個未跟隨匹配 `phase_end` 的 `phase_start`。將其稱為「進行中階段」。
3. 驗證進行中階段預期的產出物（根據上方的交叉驗證規則）：
   - 如果產出物完整：附加缺失的 `phase_end` 事件並進入下一個階段。注意：這是針對「對話在中途崩潰但工作已完成」的恢復路徑。
   - 如果產出物不完整：從頭重新執行該階段。先前的對話留下了無法安全恢復的部分狀態。
4. 如果所有 6 個 `phase_end` 事件皆存在但無 `run_end`：附加 `run_end status=success` 並結案。

原則是「相信產出物勝過事件」。如果事件聲稱階段 4 已完成但 `REQUIREMENTS.md` 不存在，AI 會重新執行階段 4。如果事件在階段中途停止但產出物已完整，AI 會補齊事件。

---

## PROGRESS.md 格式

在每個事件發生時進行不可分割的重寫。Markdown 格式。

```markdown
# QPB 執行進度

**啟動時間：** 2026-05-15T14:32:01Z  **基準測試：** chi-1.5.1  **槓桿：** post-pattern7
**執行器：** claude  **播放手冊版本：** 1.5.6

## 階段

- [x] 階段 1 — 探索 (10:10, 12 項發現, 模式 1-7 已執行)
- [x] 階段 2 — 產生 (0:42, 產出 9 個成品)
- [x] 階段 3 — 程式碼審查 (15:31, 識別出 6 個漏洞)
- [x] 階段 4 — 規格稽核 (3 位稽核員, 1 份分類報告)
- [ ] 階段 5 — 對帳 *(進行中，啟動於 14:58:31Z)*
- [ ] 階段 6 — 驗證

## 最近事件 (最後 10 個)

- 2026-05-15T14:58:31Z — phase_start phase=5
- 2026-05-15T14:58:30Z — phase_end phase=4 passes=[A,B,C,D] req_count=89
- 2026-05-15T14:42:11Z — phase_end phase=1 findings=12

## 已產出的成品

- quality/EXPLORATION.md (12,034 位元組)
- quality/REQUIREMENTS.md (28,891 位元組)
- quality/COVERAGE_MATRIX.md (3,022 位元組)
```

章節 (標頭、階段檢查清單、最近事件、已產出的成品) 為必填。階段檢查清單對已完成階段使用 `[x]` (附帶摘要統計)，對未完成階段使用 `[ ]`，並明確註明進行中階段的啟動時間。「最近事件」以人類可讀的形式顯示 `run_state.jsonl` 中的最後 10 行事件。「已產出的成品」顯示此執行寫入的檔案及其大小。

---

## 格式不變量 (由 `bin/run_state_lib.py` 驗證器強制執行)

1. `_index` 位於第 1 列。
2. 每一列都是有效的 JSON (每列一個物件)。
3. 每個事件都有 `ts` 和 `event` 欄位。
4. 每個 `event` 值皆出現在 `_index.event_types` 中。
5. 僅限附加：事件是新增的，絕不編輯。編輯先前的事件是結構描述違規。
6. 指定階段的 `phase_start` 和 `phase_end` 事件在每次執行中最多出現一次（無亂序或重複的階段標記）。
7. `run_start` 位於第 2 列（在 `_index` 之後）；如果執行完成，則 `run_end` 位於最後一列。

驗證器為唯讀檢查。它們將違規行為報告為發現，不會自動修正。
