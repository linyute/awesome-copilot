
# 驗證檢查清單 — 分析後品質管控門檻

此檔案是所有威脅模型報告定稿前必須通過的驗證規則之**單一事實來源**。它被設計成與輸出資料夾路徑一同交給驗證子代理。

> **權限階層：** 本檔案包含「檢查」規則（品質管控門檻的通過/失敗標準）。產生受檢內容的「編寫」規則位於 `orchestrator.md` 中。為了提高能見度，某些規則會同時出現在這兩個檔案中 — 如果它們發生衝突：`orchestrator.md` 在編寫決定（如何撰寫）方面具有優先權，而本檔案在通過/失敗標準（何謂有效輸出）方面具有優先權。請勿為了「去重複」而從任一檔案中刪除規則 — 重疊是為了提高能見度而刻意為之。

**何時使用：** 在所有輸出檔案撰寫完成後（從 0.1-architecture.md 到 0-assessment.md），執行本檔案中的每項檢查。如果任何檢查失敗，請在定稿前修正問題。

**子代理委派：** 協調器可以使用以下提示詞將整個檔案委派給驗證子代理：
> 「閱讀 [verification-checklist.md](./verification-checklist.md)。針對每項檢查，檢查指定的輸出檔案，並回報通過/失敗（PASS/FAIL）及證據。修正任何失敗之處。」

---

## 內嵌快速檢查（在每次撰寫檔案後立即執行）

> **目的：** 這些是撰寫代理程式在建立每個檔案後立即執行的輕量級自我檢查 — 而不是延遲到步驟 10。由於代理程式剛撰寫完檔案，內容仍處於活動內容中，這使得這些檢查非常有效。
>
> **如何使用：** 在撰寫每個檔案之前，先閱讀 `skeletons/skeleton-*.md` 中對應的骨架。在每次呼叫 `create_file` 之後，掃描您剛撰寫的內容中是否有這些模式。如果任何檢查失敗，請在繼續下一步之前立即修正該檔案。
>
> **骨架合規規則：** 每個輸出檔案必須遵循其骨架的章節順序、表格欄位標題和標題名稱。請勿加入骨架中未包含的章節/表格。請勿重新命名骨架標題。

### 撰寫 `3-findings.md` 後：
- [ ] 第一個發現標題以 `### FIND-01:` 開頭（不是 `F01`、`F-01` 或 `Finding 1`）
- [ ] 每個發現都有這些精確的列標籤：`SDL Bugbar Severity`、`Remediation Effort`、`Mitigation Type`、`Exploitability Tier`、`Exploitation Prerequisites`、`Component`
- [ ] 每個 CVSS 值都包含 `CVSS:4.0/` 前綴
- [ ] 每個 `Related Threats` 儲存格都包含 `](2-stride-analysis.md#`（超連結，而非純文字）
- [ ] 每個發現都有 `#### Description`、`#### Evidence`、`#### Remediation` 和 `#### Verification` 子標題（不是 `Recommendation`、不是 `Impact`、不是 `Mitigation`、也不是粗體 `**Description:**` 段落）— 恰好 4 個子標題，無額外內容
- [ ] 每個 `#### Description` 章節至少有 2 句技術細節（不是單句摘要）
- [ ] 每個 `#### Evidence` 章節都引用特定的檔案路徑、行號或配置鍵（不是「在程式碼庫中發現」之類的通用陳述）
- [ ] 每個發現都有全部 10 個強制屬性列：`SDL Bugbar Severity`、`CVSS 4.0`、`CWE`、`OWASP`、`Exploitation Prerequisites`、`Exploitability Tier`、`Remediation Effort`、`Mitigation Type`、`Component`、`Related Threats`
- [ ] 每個 CWE 值都是超連結：包含 `](https://cwe.mitre.org/`（不是像 `CWE-79` 這樣的純文字）
- [ ] 每個 OWASP 值都使用 `:2025` 字尾（不是 `:2021`）
- [ ] 發現按層級（Tier 1/2/3 標題）組織，而非按嚴重性（無 `## Critical Findings`）
- [ ] **層級先決條件一致性（內嵌）**：針對每個發現，使用標準對應：`None`→T1；`Authenticated User`/`Privileged User`/`Internal Network`/`Local Process Access`→T2；`Host/OS Access`/`Admin Credentials`/`Physical Access`/`{Component} Compromise`/組合→T3。⛔ 禁止使用 `Application Access` 和 `Host Access`。
- [ ] 計算發現標題數量 — 它們必須是連續的：FIND-01、FIND-02、FIND-03...
- [ ] 無時間估計：搜尋 `~`、`Sprint`、`Phase`、`hour`、`day`、`week` — 絕不能出現
- [ ] **威脅涵蓋範圍驗證表** 檔案末尾需有，欄位為 `Threat ID | Finding ID | Status`
- [ ] **涵蓋範圍表狀態值** 使用表情符號前綴：`✅ Covered (FIND-XX)`、`✅ Mitigated (FIND-XX)`、`🔄 Mitigated by Platform` — 而非像「Finding」、「Mitigated」、「Covered」這樣的純文字
- [ ] **涵蓋範圍表欄位名稱** 必須精確為 `Threat ID | Finding ID | Status` — 而非 `Threat | Finding | Status`

### 撰寫 `0-assessment.md` 後：
- [ ] 第一個 `## ` 標題為 `## Report Files`
- [ ] 計算 `## ` 標題 — 恰好 7 個，名稱必須精確如下：Report Files、Executive Summary、Action Summary、Analysis Context & Assumptions、References Consulted、Report Metadata、Classification Reference
- [ ] 標題包含 `&` 而非 `and`：搜尋 `Analysis Context & Assumptions`
- [ ] 計算 `---` 分隔線 — 至少 5 條
- [ ] `### Quick Wins` 標題存在
- [ ] 在 Action Summary 下方、Quick Wins 之前，存在 `### Priority by Tier and CVSS Score` 標題
- [ ] **優先級表最多 10 列**：計算「Priority by Tier and CVSS Score」表格中的資料列 — 必須 ≤ 10
- [ ] **優先級表排序順序**：所有 Tier 1 發現排在最前面，接著是 Tier 2，最後是 Tier 3。在每個層級內，CVSS 分數較高的排在前面。❌ T2 發現出現在 T1 發現之前 → 失敗
- [ ] **優先級表發現超連結**：每個發現（Finding）儲存格都是超連結 `[FIND-XX](3-findings.md#find-xx-title-slug)`。在每一列中搜尋 `](3-findings.md#` — 必須存在。❌ 無連結的純文字 `FIND-XX` → 失敗
- [ ] **優先級表錨點解析**：針對每個超連結，驗證錨點代稱是否與 3-findings.md 中實際編寫的 `### FIND-XX:` 標題相符。從標題文字計算錨點（小寫、空格換成連字號、刪除特殊字元）。❌ 如果任何標題包含狀態標籤如 `[STILL PRESENT]` 或 `[NEW]`，則為失敗 — 狀態標籤絕不能出現在標題中（參見階段 2 檢查）。錨點應從乾淨、無標籤的標題文字計算。
- [ ] **Action Summary 層級超連結**：Action Summary 表格中的 Tier 1、Tier 2、Tier 3 儲存格是指向 `3-findings.md#tier-N` 錨點的超連結
- [ ] `### Needs Verification` 標題存在
- [ ] `### Finding Overrides` 標題存在
- [ ] **Action Summary 恰好有 4 個資料列**：Tier 1、Tier 2、Tier 3、Total。在 Action Summary 表格中搜尋 `| Mitigated |` 或 `| Platform |` 或 `| Fixed |` — 如果發現則為失敗。這些不是獨立的層級。
- [ ] **Git 提交包含日期**：`| Git Commit |` 列必須同時包含 SHA 和提交日期（例如：`f49298ff` (`2026-03-04`)）。如果只顯示雜湊值而無日期 → 失敗。
- [ ] **基準/目標提交包含日期**（增量模式）：`| Baseline Commit |` 和 `| Target Commit |` 列必須各自在 SHA 旁邊包含日期。
- [ ] `### Security Standards` 和 `### Component Documentation` 標題存在（兩個參考資料子區段）
- [ ] Report Metadata 表格中存在 `| Model |` 列
- [ ] Report Metadata 表格中存在 `| Analysis Started |` 列
- [ ] Report Metadata 表格中存在 `| Analysis Completed |` 列
- [ ] Report Metadata 表格中存在 `| Duration |` 列
- [ ] Metadata 值被反引號包圍：檢查 metadata 值儲存格中是否有 `` ` ``
- [ ] **Report Files 表格首列**：`0-assessment.md` 是第一筆資料列（不是 `0.1-architecture.md`）
- [ ] **Report Files 完整性**：輸出資料夾中每個產生的 `.md` 和 `.mmd` 檔案，在 Report Files 表格中都有一對應列（`threat-inventory.json` 故意排除在外）
- [ ] **Report Files 條件列**：僅當實際產生這些檔案時，才出現 `1.2-threatmodel-summary.mmd` 和 `incremental-comparison.html` 列
- [ ] **威脅數量備註區塊引用**：Executive Summary 包含 `> **Note on threat counts:**` 段落
- [ ] **邊界數量**：Executive Summary 中的邊界數量必須與 `1-threatmodel.md` 中實際的信任邊界表列數相符
- [ ] **Action Summary 層級優先級**：Tier 1 = 🔴 Critical Risk、Tier 2 = 🟠 Elevated Risk、Tier 3 = 🟡 Moderate Risk。這些是固定的 — 絕不根據數量進行修改。
- [ ] **Risk Rating 標題** 無表情符號：`### Risk Rating: Elevated` 而非 `### Risk Rating: 🟠 Elevated`

### 撰寫 `0.1-architecture.md` 後：
- [ ] 計算 `sequenceDiagram` 出現次數 — 至少 3 次
- [ ] 前 3 個循序圖具有 `participant` 行和 `->>` 訊息箭頭（不是空的圖表區塊）
- [ ] Key Components 表格列數與元件圖節點數相符
- [ ] 每個 Key Components 表格列都使用 PascalCase 名稱（不是短橫線連接的 `my-component` 或蛇形命名 `my_component`）
- [ ] 每個 Key Components Type 儲存格必須是以下之一：`Process`、`Data Store`、`External Service`、`External Interactor` — 無臨時類型如 `Role`、`Function`
- [ ] Technology Stack 表格全部 5 列均已填寫：Languages、Frameworks、Data Stores、Infrastructure、Security
- [ ] `## Security Infrastructure Inventory` 章節存在（未遺失）
- [ ] `## Repository Structure` 章節存在（未遺失）

### 撰寫 `1.1-threatmodel.mmd` 後：
- [ ] 第一行以 `%%{init:` 開頭
- [ ] 包含 `classDef process`、`classDef external`、`classDef datastore`
- [ ] 無 Chakra UI 顏色（`#4299E1`、`#48BB78`、`#E53E3E`）
- [ ] 存在 `linkStyle default stroke:#666666,stroke-width:2px`
- [ ] DFD 使用 `flowchart LR`（不是 `flowchart TB`）— 搜尋 `flowchart` 並驗證方向為 `LR`
- [ ] **增量 DFD 樣式（僅限增量模式）**：如果存在新元件，請驗證是否存在 `classDef newComponent fill:#d4edda,stroke:#28a745` 且新元件節點使用 `:::newComponent`（不是 `:::process`）。如果存在已移除的元件，請驗證是否有帶有灰色虛線樣式的 `classDef removedComponent`。❌ `newComponent fill:#6baed6`（與 process 相同的藍色）→ 失敗（視覺上不可見）。

### 撰寫 `2-stride-analysis.md` 後：
- [ ] `## Summary` 出現在任何 `## ComponentName` 章節之前（檢查行號）
- [ ] Summary 表格包含以下欄位：`| Component | Link | S | T | R | I | D | E | A | Total | T1 | T2 | T3 | Risk |` — 搜尋 `| S | T | R | I | D | E | A |` 以驗證
- [ ] Summary 表格 S/T/R/I/D/E/A 欄位包含數值（0, 1, 2, 3...），而不是每個元件都全是相同的 1
- [ ] 每個元件都有 `#### Tier 1`、`#### Tier 2`、`#### Tier 3` 子標題
- [ ] `## ` 標題中沒有 `&`、`/`、`(`、`)`、`:`
- [ ] **標題中無狀態標籤（任何檔案）**：搜尋所有 `.md` 檔案中是否包含 `^##.+\[Existing\]`、`^##.+\[Fixed\]`、`^##.+\[Partial\]`、`^##.+\[New\]`、`^##.+\[Removed\]`，以及同樣的 `###` 標題。同時檢查舊式標籤：`^##.+\[STILL`、`^##.+\[NEW`、`^###.+\[STILL`、`^###.+\[NEW CODE`。❌ 標題中的標籤會破壞錨點連結並污染目錄。狀態必須作為區塊引用出現在章節主體的第一行（`> **[Tag]**`），而不是在標題中。
- [ ] **關鍵 — A = Abuse（濫用），絕非 Authorization（授權）**：在檔案中搜尋 `| Authorization |`。如果任何匹配項是 STRIDE 類別標籤（而非在威脅描述句子中）→ 立即修正為 `| Abuse |`。STRIDE-A 中的「A」代表「Abuse」（業務邏輯濫用、工作流操縱、功能誤用）。這是觀察到最常見的單一錯誤。
- [ ] **不計入 N/A 項目**：如果任何元件的某個 STRIDE 類別為 `N/A — {justification}`，請驗證該類別在 Summary 表格中顯示為 `0`（而非 `1`）
- [ ] **STRIDE 狀態值**：每個威脅列的 Status 欄位必須精確使用以下之一：`Open`、`Mitigated`、`Platform`。不使用 `Partial`、`N/A`、`Accepted` 或臨時值。
- [ ] **平台比例**：計算具備 `Platform` 狀態的威脅與總威脅數量的比例。如果 >20%（獨立式）或 >35%（K8s 算子（Operator））→ 重新檢查每個平台（Platform）項目。
- [ ] **STRIDE 欄位算術**：針對每個 Summary 表格列，驗證 S+T+R+I+D+E+A = Total 且 T1+T2+T3 = Total
- [ ] **威脅表中的完整類別名稱**：Category 欄位使用完整名稱（`Spoofing`、`Tampering`、`Information Disclosure`、`Denial of Service`、`Elevation of Privilege`、`Abuse`）— 而非縮寫（`S`、`T`、`DoS`、`EoP`）
- [ ] **N/A 表格存在**：每個元件章節都有一個 `| Category | Justification |` 表格，列出無威脅的 STRIDE 類別 — 不是散文或項目符號格式
- [ ] **Link 欄位是獨立的**：Summary 表格的第 2 欄是 `Link`，包含 `[Link](#anchor)` 值 — 元件名稱不包含嵌入的超連結
- [ ] **可利用性層級第 4 欄**：層級定義表格的第 4 欄名稱必須為 `Assignment Rule`（不是 `Example`、`Description`、`Criteria`）

### 撰寫 `incremental-comparison.html`（僅限增量模式）後：
- [ ] HTML 的度量指標列（metrics bar）中包含 `Trust Boundaries` 或 `Boundaries` — 搜尋文字「Boundaries」
- [ ] STRIDE 熱圖有 13 欄：Component、S、T、R、I、D、E、A、Total、divider、T1、T2、T3 — 在 HTML 中搜尋 `T1`、`T2` 和 `T3`
- [ ] 已修正/新增/先前未識別的狀態資訊僅出現在有顏色的狀態卡片中，而不會同時出現在度量指標列的小型內嵌徽章中
- [ ] 熱圖中沒有 `| Authorization |` 作為 STRIDE 類別標籤 — 在熱圖列中搜尋「Authorization」
- [ ] **HTML 數量與 Markdown 數量相符**：HTML 熱圖中的總威脅數必須等於 `2-stride-analysis.md` 中的總計列。如果不同，請根據 STRIDE 摘要資料重新產生 HTML 熱圖。HTML 中的 T1+T2+T3 總計也必須相符。
- [ ] **比較卡片存在**：HTML 包含 `comparison-cards` div，其中有 3 張卡片：基準（雜湊 + 日期 + 評級）、目標（雜湊 + 日期 + 評級）、趨勢（方向 + 持續時間）
- [ ] **來自 git log 的提交日期**：比較卡片中的基準和目標日期必須與實際提交日期相符（不是今天的日期，也不是分析執行日期）
- [ ] **Code Changes 方塊**：第 5 個度量指標方塊顯示提交數量和 PR 數量（不是「Time Between」）
- [ ] **無 Time Between 方塊**：搜尋「Time Between」— 絕不能出現在度量指標列中
- [ ] **狀態卡片需簡明扼要**：每個狀態卡片的 `card-items` div 必須僅包含一句簡短的摘要。❌ 卡片中列出的威脅 ID (T06.S, T02.E)、發現 ID (FIND-14) 或元件名稱 → 失敗。在 `card-items` div 中搜尋 `T\d+\.` 和 `FIND-\d+`。詳細的項目分析應屬於威脅/發現狀態分析章節，而非摘要卡片。

### 撰寫任何增量報告檔案後（增量模式 — 內嵌檢查）：
- [ ] **僅限簡化顯示標籤**：搜尋所有 `.md` 檔案中是否包含舊式標籤：`[STILL PRESENT]`、`[NEW CODE]`、`[NEW IN MODIFIED]`、`[PREVIOUSLY UNIDENTIFIED]`、`[PARTIALLY MITIGATED]`、`[REMOVED WITH COMPONENT]`、`[MODIFIED]`。❌ 任何匹配項 → 失敗。請替換為簡化標籤：`[Existing]`、`[Fixed]`、`[Partial]`、`[New]`、`[Removed]`。
- [ ] **有效顯示標籤**：每個發現/威脅註解必須精確使用 5 個簡化標籤之一：`[Existing]`、`[Fixed]`、`[Partial]`、`[New]`、`[Removed]`。標籤必須作為區塊引用出現在主體的第一行：`> **[Tag]**`。
- [ ] **元件狀態簡化**：元件狀態欄位僅使用：`Unchanged`、`Modified`、`New`、`Removed`。❌ `Restructured` → 失敗（改用 `Modified`）。
- [ ] **變更摘要表使用簡化標籤**：Threat Status 表格有 4 列（Existing/Fixed/New/Removed）。Finding Status 表格有 5 列（Existing/Fixed/Partial/New/Removed）。❌ 舊式列如 `Still Present`、`New (Code)`、`Partially Mitigated` → 失敗。

### 撰寫 `threat-inventory.json`（內嵌檢查）後：
- [ ] **JSON 威脅數量與 STRIDE 檔案相符**：計算 `2-stride-analysis.md` 中的唯一威脅 ID 數量（grep `^\| T\d+\.`）。此數量必須等於 JSON 中的 `threats` 陣列長度。如果 STRIDE 的威脅多於 JSON → 則威脅在序列化過程中丟失。請重新建立 JSON。
- [ ] **JSON 度量指標內部一致**：`metrics.total_threats` 必須等於 `threats` 陣列長度。`metrics.total_findings` 必須等於 `findings` 陣列長度。

### 撰寫 `0-assessment.md`（數量驗證）後：
- [ ] Executive Summary 中的元素數量與實際的元素表列數相符（如有需要，請重新閱讀 `1-threatmodel.md`）
- [ ] 發現數量與 `3-findings.md` 中實際的 `### FIND-` 標題數量相符
- [ ] 威脅數量與 `2-stride-analysis.md` 摘要表中的總計相符

---

## 階段 0 — 常見偏差掃描

這些是所有先前執行中最常觀察到的偏差。產生輸出後，掃描每個輸出檔案中是否有這些特定的模式。每項檢查都有一個**錯誤**模式供搜尋，以及一個**正確**的預期模式。

**如何使用：** 針對每項檢查，對輸出檔案進行 grep/掃描以尋找錯誤模式。如果發現 → 失敗。接著驗證正確模式是否存在。此階段會捕捉產生模型儘管有指令但仍傾向於犯下的重複錯誤。

### 0.1 結構偏差

- [ ] **按嚴重性而非層級組織發現** — 搜尋 `## Critical Findings`、`## Important Findings`、`## High Findings`。這些絕不能存在。❌ `## Critical Findings` → ✅ `## Tier 1 — Direct Exposure (No Prerequisites)`
- [ ] **扁平 STRIDE 表格（無層級子章節）** — `2-stride-analysis.md` 中的每個元件必須具有 `#### Tier 1`、`#### Tier 2`、`#### Tier 3` 子標題。❌ 每個元件單一扁平表格 → ✅ 三個獨立的層級子章節
- [ ] **發現中缺少可利用性層級或修復工作量** — `3-findings.md` 中的每個 `### FIND-` 區塊必須同時包含 `Exploitability Tier` 和 `Remediation Effort` 列。❌ 缺少任一欄位 → ✅ 兩者均為強制要求
- [ ] **STRIDE 摘要缺少層級欄位** — `2-stride-analysis.md` 中的摘要表必須包含 `T1`、`T2`、`T3` 欄位。❌ 僅有 S/T/R/I/D/E/A/Total → ✅ 必須同時具備 T1/T2/T3/Risk 欄位
- [ ] **STRIDE 摘要位於底部** — 搜尋 `## Summary` 與第一個 `## Component` 的行號。❌ 摘要在元件之後 → ✅ 摘要在所有元件章節之前，緊接在 `## Exploitability Tiers` 之後
- [ ] **可利用性層級表格欄位** — `2-stride-analysis.md` 中的層級定義表格必須精確包含這 4 欄：`Tier | Label | Prerequisites | Assignment Rule`。❌ `Example`、`Description`、`Criteria` 作為第 4 欄 → ✅ 僅限 `Assignment Rule`。Assignment Rule 儲存格必須包含嚴格的規則文字，而不是特定於部署的範例。

### 0.2 檔案格式偏差

- [ ] **以程式碼圍欄包裹的 `.md`** — 檢查是否有任何 `.md` 檔案以 ` ```markdown ` 或 ` ````markdown ` 開頭。❌ ` ```markdown\n# Title` → ✅ 第 1 行為 `# Title`
- [ ] **以程式碼圍欄包裹的 `.mmd`** — 檢查 `.mmd` 檔案是否以 ` ```plaintext ` 或 ` ```mermaid ` 開頭。❌ ` ```mermaid\n%%{init:` → ✅ 第 1 行為 `%%{init:`
- [ ] **輸出中洩漏的技能指令** — 在所有 `.md` 檔案中搜尋 `⛔`、`RIGID TIER`、`Do NOT use subjective`、`MANDATORY`、`CRITICAL —`、`decision procedure`。這些是內部的技能指令，不得出現在報告輸出中。❌ 任何相符項目 → ✅ 零相符項目。移除任何洩漏的指令行。
- [ ] **巢狀重複的輸出資料夾** — 檢查輸出資料夾是否包含名稱相同的子資料夾（例如 `threat-model-20260307-081613/threat-model-20260307-081613/`）。❌ 子資料夾存在 → ✅ 刪除巢狀重複項。輸出資料夾應僅包含檔案，不包含子資料夾。
- [ ] **STRIDE-A 使用「Authorization」而非「Abuse」** — 在 `2-stride-analysis.md` 中搜尋被用作 STRIDE 類別名稱的 `| Authorization |` 或 `**Authorization**`。STRIDE-A 中的 A 始終是「Abuse」，絕非「Authorization」。❌ 任何將 Authorization 用作 STRIDE 類別的相符項目 → ✅ 替換為「Abuse」。注意：當「Authorization」出現在威脅說明中時（例如「Authorization header」、「lacks authorization checks」），請勿替換。

### 0.3 評估章節偏差

- [ ] **行動摘要 (Action Summary) 章節名稱錯誤** — 搜尋 `Priority Remediation Roadmap`、`Top Recommendations`、`Key Recommendations`、`Risk Profile`。❌ 任何上述名稱 → ✅ 僅限 `## Action Summary`
- [ ] **獨立的建議章節** — 搜尋作為獨立章節的 `### Key Recommendations` 或 `### Top Recommendations`。❌ 獨立章節 → ✅ Action Summary 即為建議事項
- [ ] **缺少速贏 (Quick Wins) 子章節** — 在 Action Summary 下搜尋 `### Quick Wins`。❌ 缺少 → ✅ 存在（若無低心力 T1 發現則註記）
- [ ] **缺少威脅計數情境** — 在執行摘要 (Executive Summary) 中搜尋 `> **Note on threat counts:**` 引文區塊。❌ 缺少 → ✅ 存在
- [ ] **缺少分析情境與假設** — 搜尋 `## Analysis Context & Assumptions`。❌ 缺少 → ✅ 存在，並包含 `### Needs Verification` 與 `### Finding Overrides` 子章節
- [ ] **缺少必要的評估章節** — 驗證以下 7 個章節是否全部存在：Report Files、Executive Summary、Action Summary、Analysis Context & Assumptions、References Consulted、Report Metadata、Classification Reference。❌ 缺少任何一項 → ✅ 7 個章節全部存在

### 0.4 參考資料與 Metadata 偏差

- [ ] **參考資料 (References Consulted) 為扁平表格** — 搜尋 `| Reference | Usage |` 模式。❌ 兩欄式扁平表格 → ✅ 兩個子章節：`### Security Standards` 包含 `| Standard | URL | How Used |` 以及 `### Component Documentation` 包含 `| Component | Documentation URL | Relevant Section |`
- [ ] **參考資料缺少 URL** — 參考資料表格中的每一列都必須有完整的 `https://` URL。❌ 缺少 URL 欄位或 URL 為空 → ✅ 每列都有完整 URL
- [ ] **報告 Metadata 缺少模型 (Model)** — 搜尋 `| **Model** |` 或 `| Model |` 列。❌ 缺少 → ✅ 存在並填寫實際模型名稱
- [ ] **報告 Metadata 缺少時間戳記** — 搜尋 `Analysis Started`、`Analysis Completed`、`Duration` 列。❌ 缺少任何一項 → ✅ 三項全部存在且包含計算值

### 0.5 發現品質偏差

- [ ] **CVSS 分數缺少向量或缺少前綴** — 對每個發現的 CVSS 欄位執行 Grep。數值必須符合此模式：`\d+\.\d+ \(CVSS:4\.0/AV:`。特別檢查 `CVSS:4.0/` 前綴 — 最常見的偏差是輸出不帶前綴的向量（僅有 `AV:N/AC:L/...`）。❌ `9.3`（僅分數） → ❌ `9.3 (AV:N/AC:L/...)`（無前綴） → ✅ `9.3 (CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N)`
- [ ] **CWE 缺少超連結** — 搜尋前方不帶 `[` 的 `CWE-\d+`。❌ `CWE-78: OS Command Injection` → ✅ `[CWE-78](https://cwe.mitre.org/data/definitions/78.html): OS Command Injection`
- [ ] **OWASP `:2021` 後綴** — 搜尋 `:2021`。❌ `A01:2021` → ✅ `A01:2025`
- [ ] **相關威脅 (Related Threats) 為純文字** — 在 `Related Threats` 列中搜尋不含 `](` 的模式。❌ `T-02, T-17, T-23` → ✅ `[T02.S](2-stride-analysis.md#component-name), [T17.I](2-stride-analysis.md#other-component)`
- [ ] **發現 ID 順序混亂** — 檢查 FIND-NN ID 是否為循序：FIND-01, FIND-02, FIND-03... ❌ `FIND-06` 出現在 `FIND-04` 之前 → ✅ 從上到下循序編號
- [ ] **Tier 1 包含 CVSS AV:L 或 PR:H** — 對每個 Tier 1 發現的 CVSS 向量執行 Grep，檢查是否包含 `AV:L` 或 `PR:H`。❌ 僅限本機存取的 Tier 1 → ✅ 降級至 T2/T3
- [ ] **Tier 1 中僅限 Localhost 或僅限管理員的發現** — 檢查部署情境：實體隔離 (air-gapped)、localhost、僅限單一管理員的服務不應為 Tier 1。❌ 僅限管理員的 Tier 1 → ✅ T2/T3
- [ ] **輸出中的時間估計** — 搜尋 `~1 hour`、`Sprint`、`Phase 1`、`(hours)`、`(days)`、`(weeks)`、`Immediate`。❌ 任何排程用語 → ✅ 僅限 `Low`/`Medium`/`High` 心力標籤
- [ ] **涵蓋範圍 (Coverage) 表格中的「Accepted Risk」** — 在 `3-findings.md` 中搜尋 `Accepted Risk`。❌ 任何相符項目 → 失敗。此工具無權接受風險。每個 `Open` 威脅都必須有一個發現。將所有 `⚠️ Accepted Risk` 替換為 `✅ Covered` 並建立相應的發現。

### 0.6 圖表偏差

- [ ] **配色錯誤** — 在 `.mmd` 檔案與 Mermaid 區塊中搜尋所有 `#[0-9a-fA-F]{6}`。❌ `#4299E1`、`#48BB78`、`#E53E3E`、`#2B6CB0`、`#2D3748`、`#2F855A`、`#C53030` (Chakra UI) → ✅ 僅允許使用：`#6baed6`、`#2171b5`、`#fdae61`、`#d94701`、`#74c476`、`#238b45`、`#e31a1c`、`#666666`、`#ffffff`、`#000000`
- [ ] **自定義 themeVariables 顏色** — 在 init 區塊中搜尋 `secondaryColor`、`tertiaryColor` 或 `primaryTextColor`。❌ `"primaryColor": "#2D3748", "secondaryColor": "#4299E1"` → ✅ themeVariables 中僅限使用 `'background': '#ffffff', 'primaryColor': '#ffffff', 'lineColor': '#666666'`
- [ ] **缺少摘要 MMD** — 計算 `1.1-threatmodel.mmd` 中的節點與子圖 (subgraph)。若元件數量 > 15 或子圖數量 > 4，則必須存在 `1.2-threatmodel-summary.mmd`。❌ 達到閾值但缺少檔案 → ✅ 建立檔案並附上摘要圖表
- [ ] **獨立的側車 (Sidecar) 節點（僅限 K8s）** — 在圖表中搜尋名稱為 `MISE`、`Dapr`、`Envoy`、`Istio`、`Sidecar` 的獨立項目。❌ `MISE(("MISE Sidecar"))` → ✅ `InferencingFlow(("Inferencing Flow<br/>+ MISE"))`
- [ ] **Pod 內 localhost 流程（僅限 K8s）** — 搜尋共用容器之間的 `-->|"localhost"|` 箭頭。❌ 存在 → ✅ 不存在（隱含）
- [ ] **缺少循序圖 (Sequence diagrams)** — `0.1-architecture.md` 中的前 3 個情境必須各自包含一個 `sequenceDiagram` 區塊。❌ 少於 3 個 → ✅ 至少 3 個
- [ ] **技術特定缺口** — 針對儲存庫中的每項技術（Redis、PostgreSQL、Docker、K8s、ML/LLM、NFS 等），驗證至少存在一個發現或已記錄的緩解措施。❌ 技術存在但無涵蓋範圍 → ✅ 處理每項技術

### 0.7 規範模式檢查

- [ ] **發現標題模式** — 所有發現標題均符合 `^### FIND-\d{2}: `（絕非 `F01`、`F-01`、`Finding 1`）
- [ ] **CVSS 前綴模式** — 所有 CVSS 欄位均符合 `\d+\.\d+ \(CVSS:4\.0/AV:`（絕非單純的 `AV:N/AC:L/...`）
- [ ] **相關威脅連結模式** — 每個相關威脅權杖均符合 `\[T\d{2}\.[STRIDEA]\]\(2-stride-analysis\.md#[a-z0-9-]+\)`
- [ ] **評估章節標題精確集合** — 在 `0-assessment.md` 中必須精確包含以下 `##` 標題：Report Files, Executive Summary, Action Summary, Analysis Context & Assumptions, References Consulted, Report Metadata, Classification Reference
- [ ] **不得出現的標題** — `##` 或 `###` 標題不得包含：Severity Distribution、Architecture Risk Areas、Methodology Notes、Deliverables、Priority Remediation Roadmap、Key Recommendations、Top Recommendations

---

## 第 1 階段 — 單一檔案結構檢查

這些檢查會獨立驗證每個檔案。它們可以平行執行。

### 1.1 所有 `.md` 檔案

- [ ] **無程式碼圍欄包裹**：任何 `.md` 檔案均不以 ` ```markdown ` 或 ` ````markdown ` 開頭。每個 `.md` 檔案的第一行必須以 `# 標題` 開始。若任何檔案被圍欄包裹，請立即移除第一行與最後一行。
- [ ] **無 `.mmd` 程式碼圍欄包裹**：`.mmd` 檔案不得以 ` ```plaintext ` 或 ` ```mermaid ` 開頭。它的第一個字元必須是 `%%{init:`。若被包裹，請移除圍欄行。
- [ ] **無空檔案**：每個檔案在標題之外都有實質內容。

### 1.2 `0.1-architecture.md`

- [ ] **必要章節存在**：System Purpose, Key Components, Component Diagram, Top Scenarios, Technology Stack, Deployment Model, Repository Structure
- [ ] **元件圖 (Component Diagram) 存在**，且位於 ` ```mermaid ` 程式碼圍欄內的 Mermaid `flowchart`
- [ ] **使用的架構樣式** — 不使用 DFD 圓圈 `(("名稱"))`。必須使用 `["名稱"]` 或 `(["名稱"])` 並搭配 `service`/`external`/`datastore` 的 classDef 名稱
- [ ] **至少 3 個情境** 包含 Mermaid `sequenceDiagram` 區塊
- [ ] **未建立個別的 `.mmd` 檔案** 用於 0.1-architecture.md — 所有圖表均為內嵌
- [ ] **元件圖元素與關鍵元件表格相符** — 表格中的每一列在圖表中都有對應的節點，反之亦然。計算兩者數量並驗證是否相等。
- [ ] **熱門情境 (Top Scenarios) 反映實際程式碼路徑**，而非假設性的使用案例
- [ ] **部署模型包含網路細節** — 必須至少提到：連接埠號碼 或 繫結地址 (bind addresses) 或 網路拓撲

### 1.3 `1.1-threatmodel.mmd`

- [ ] **檔案存在** 且包含純 Mermaid 程式碼（無 markdown 包裹，無 ` ```mermaid ` 圍欄）
- [ ] **以** `%%{init:` 區塊開頭
- [ ] **包含** `classDef process`, `classDef external`, `classDef datastore`
- [ ] **使用 DFD 形狀**：圓圈 `(("名稱"))` 代表程序 (processes)，矩形 `["名稱"]` 代表外部項目 (externals)，圓柱體 `[("名稱")]` 代表資料儲存 (data stores)

### 1.4 `1-threatmodel.md`

- [ ] **圖表內容與 `1.1-threatmodel.mmd` 相同** — 對 Mermaid 區塊內容進行逐位元組比較（不含 ` ```mermaid ` 圍欄包裹）
- [ ] **元素表格 (Element Table)** 存在，包含以下欄位：Element, Type, TMT Category, Description, Trust Boundary
- [ ] **資料流表格 (Data Flow Table)** 存在，包含以下欄位：ID, Source, Target, Protocol, Description
- [ ] **信任邊界表格 (Trust Boundary Table)** 存在，包含以下欄位：Boundary, Description, Contains
- [ ] **使用了 TMT 類別 ID** — 元素表格的 TMT Category 欄位使用來自 `tmt-element-taxonomy.md` 的特定 TMT 元素 ID（例如 `SE.P.TMCore.WebSvc`, `SE.EI.TMCore.Browser`）。不使用通用標籤如 `Process`, `External`。
- [ ] **流程 ID 符合 DF\d{2} 模式** — 資料流表格中的每個流程 ID 均使用 `DF01`, `DF02` 等格式。不使用 `F1`, `Flow-1`, `DataFlow1`。
- [ ] **若元件數量 > 15 或邊界數量 > 4**：必須存在 `1.2-threatmodel-summary.mmd`，且 `1-threatmodel.md` 必須包含一個「摘要視圖 (Summary View)」章節，其中包含摘要圖表以及「摘要到詳細映射 (Summary to Detailed Mapping)」表格。**驗證方式：** 計算 `1.1-threatmodel.mmd` 中符合形狀語法 `[A-Z]\d+` 的節點與子圖數量。若數量超過閾值但 `1.2-threatmodel-summary.mmd` 不存在 → **失敗 — 在繼續之前請建立摘要圖表**。

### 1.5 `2-stride-analysis.md`

- [ ] **可利用性分層 (Exploitability Tiers) 章節** 位於頂部，包含分層定義表格
- [ ] **摘要表格** 出現在個別元件章節之前（緊接在可利用性分層之後，而非檔案底部）
- [ ] **摘要表格** 包含以下欄位：Component, Link, S, T, R, I, D, E, A, Total, T1, T2, T3, Risk
- [ ] **每個元件** 都有 `## 元件名稱` 標題，後跟 Tier 1, Tier 2, Tier 3 子章節（即使為空，這三個子章節也必須全部存在）
- [ ] **空的階層** 使用「*此元件未識別出 Tier N 威脅。*」
- [ ] **錨點安全標題**：此檔案中的 `## ` 標題不包含以下任何字元：`&`、`/`、`(`、`)`、`.`、`:`、`'`、`"`、`+`、`@`、`!`。替換方式：`&` → `and`、`/` → `-`、省略括號、省略 `:`。
- [ ] **Pod 共用行 (Pod Co-location line)** 存在於 K8s 元件，列出共用的側車 (sidecars)
- [ ] **STRIDE 狀態值** — 每個威脅列的 Status 欄位僅限使用以下其中之一：`Open`, `Mitigated`, `Platform`。不使用 `Partial`, `N/A` 或其他自定值。
- [ ] **標記為 Abuse 的類別** — 在 `2-stride-analysis.md` 中搜尋被用作 STRIDE 類別標籤的 `| Authorization |`。若發現則失敗。STRIDE-A 中的「A」始終是「Abuse」（業務邏輯濫用、工作流操縱、功能誤用），絕非「Authorization」。同時檢查 N/A 項目：`Authorization — N/A` 是錯誤的，必須為 `Abuse — N/A`。
- [ ] **STRIDE 與涵蓋範圍的一致性** — 對於每個威脅 ID，STRIDE 狀態與涵蓋範圍表格狀態必須一致：
  - STRIDE `Open` → 涵蓋範圍 `✅ Covered (FIND-XX)`（發現文件化了需要補救的弱點）
  - STRIDE `Mitigated` → 涵蓋範圍 `✅ Mitigated (FIND-XX)`（發現文件化了團隊建立的現有控制措施）
  - STRIDE `Platform` → 涵蓋範圍 `🔄 Mitigated by Platform`
  - 若 STRIDE 為 `Partial` 但涵蓋範圍為 `Mitigated by Platform` → **衝突。請修正。**
  - 若 STRIDE 為 `Open` 但涵蓋範圍為 `⚠️ Needs Review` → 僅在前提條件 (prerequisites) ≠ `None` 時有效

### 1.6 `3-findings.md`

- [ ] **依階層組織**，精確使用：`## Tier 1 — Direct Exposure (No Prerequisites)`, `## Tier 2 — Conditional Risk (...)`, `## Tier 3 — Defense-in-Depth (...)`
- [ ] **不依嚴重性組織** — 不使用 `## Critical Findings` 或 `## Important Findings` 標題
- [ ] **每個發現** 都有所有強制屬性：SDL Bugbar Severity, CVSS 4.0, CWE, OWASP（帶有 `:2025` 後綴）, Exploitation Prerequisites, Exploitability Tier, Remediation Effort, Mitigation Type, Component, Related Threats
- [ ] **緩解類型 (Mitigation Type) 有效值** — 每個發現的 `Mitigation Type` 列必須精確為以下之一：`Redesign`, `Standard Mitigation`, `Custom Mitigation`, `Existing Control`, `Accept Risk`, `Transfer Risk`。❌ 縮寫形式（`Custom`, `Accept`, `Standard`）或自創值 → 失敗
- [ ] **SDL 嚴重性有效值** — 每個發現的嚴重性為以下之一：`Critical`, `Important`, `Moderate`, `Low`。❌ `High`, `Medium`, `Info` → 失敗
- [ ] **補救心力 (Remediation Effort) 有效值** — 每個發現的心力為以下之一：`Low`, `Medium`, `High`。❌ 時間估計、sprint 標籤 → 失敗
- [ ] **CVSS 4.0 具有完整向量**：每個發現的 CVSS 值都包含數值分數與完整向量字串（例如 `9.3 (CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N)`）。不接受僅有分數。
- [ ] **CWE 格式**：每個 CWE 均使用 `CWE-NNN: Name` 格式（不只是編號）
- [ ] **OWASP 格式**：每個 OWASP 均使用 `A0N:2025` 格式（絕非 `:2021`）
- [ ] **相關威脅** 每個威脅 ID 使用個別連結：`[T01.S](2-stride-analysis.md#component-name)` — 不使用群組連結如 `[T01.S, T01.T](2-stride-analysis.md)`
- [ ] **利用前提條件 (Exploitation Prerequisites) 存在** — 每個 `### FIND-` 區塊都有 `| Exploitation Prerequisites |` 列
- [ ] **元件 (Component) 欄位存在** — 每個 `### FIND-` 區塊都有 `| Component |` 列
- [ ] **Tier 1 不得包含 AV:L 或 PR:H** — 對於每個 Tier 1 發現，驗證其 CVSS 向量不包含 `AV:L` 或 `PR:H`。若發現則必須將階層降級至 T2/T3。
- [ ] **階層與前提條件的一致性（強制性）** — 針對「每個」發現與「每列」威脅，階層必須機械式地根據前提條件並使用規範對應關係衍生：
  - `None` → T1（僅在元件的 Reachability = External 且 Auth = No 時有效）
  - `Authenticated User`, `Privileged User`, `Internal Network`, `Local Process Access` → T2
  - `Host/OS Access`, `Admin Credentials`, `Physical Access`, `{Component} Compromise`, 任何 `A + B` → T3
  - **⛔ 禁用值：** `Application Access`, `Host Access` → 失敗。請替換為 `Local Process Access` (T2) 或 `Host/OS Access` (T3)。
  - **部署情境規則（規則 20）：** 若部署分類為 `LOCALHOST_DESKTOP` 或 `LOCALHOST_SERVICE`，則所有元件均禁用 `None`。將前提條件修正為 `Local Process Access` 或 `Host/OS Access`，然後衍生階層。
  - **暴露表格交叉檢查：** 對於每個發現，在元件暴露表格 (Component Exposure Table) 中查閱其元件。發現的前提條件必須 ≥ 元件的 `Min Prerequisite`。發現的階層必須 ≥ 元件的 `Derived Tier`。
  - **不相符 = 失敗。** 藉由根據部署證據調整前提條件來修正，然後從前提條件衍生階層。
  - **常見違規：** 在僅限 localhost 的元件上使用 `None`；`Application Access`（定義模糊）；具備 `Internal Network` 前提條件的 T1；具備 `None` 前提條件的 T2。
- [ ] **威脅涵蓋範圍驗證表格 (Threat Coverage Verification table)** 存在於檔案末尾，將每個威脅 ID 映射到具有狀態的發現 ID
- [ ] **涵蓋範圍表格僅限有效狀態** — 涵蓋範圍表格中的每一列都必須精確使用這三種狀態之一：`✅ Covered (FIND-XX)`、`✅ Mitigated (FIND-XX)` 或 `🔄 Mitigated by Platform`。❌ `⚠️ Accepted Risk` → 失敗（工具無法接受風險）。❌ `⚠️ Needs Review` → 失敗（每個威脅都必須解決）。❌ 不帶狀態的 `—` → 失敗（未說明的威脅）。
- [ ] **緩解 (Mitigated) 與平台 (Platform) 的區別** — 對於每個 `✅ Mitigated (FIND-XX)` 項目：驗證發現記錄了工程團隊建立的現有安全控制措施（驗證中介軟體、TLS、輸入驗證、檔案權限）。對於每個 `🔄 Mitigated by Platform`：驗證緩解措施來自真正的「外部」系統（Azure AD, K8s RBAC, TPM）。若「平台」描述的是此儲存庫的程式碼 → 重新分類為 `✅ Mitigated` 並建立發現。
- [ ] **平台緩解比例審核（強制性）** — 計算標記為 `🔄 Mitigated by Platform` 的威脅與總威脅數量的比例。若平台比例 > 20% → **警告：可能過度使用平台狀態。** 針對每個平台緩解的威脅，驗證以下所有三個條件：(1) 緩解措施在此儲存庫程式碼之外，(2) 由不同團隊管理，(3) 無法透過修改此程式碼來停用。常見違規：「驗證中介軟體」（這是此處的程式碼 → 應為 `Mitigated`）、「localhost 上的 TLS」（此處的程式碼 → 應為 `Mitigated`）、「檔案權限」（此處的程式碼 → 應為 `Mitigated`）。
- [ ] **涵蓋範圍回饋迴圈驗證** — 在寫入涵蓋範圍表格後，驗證：(1) 每個 STRIDE 狀態為 `Open` 的威脅在表格中都有對應的發現。(2) 不存在不帶狀態的 `—` 破折號。(3) 若存在缺口，則已建立新發現以填補缺口。涵蓋範圍表格是一個「回饋迴圈 (FEEDBACK LOOP)」 — 其目的是捕捉遺漏的發現並強迫建立。若在寫入表格後仍存在缺口，則表示未執行該迴圈。
- [ ] **涵蓋範圍表格中的「Accepted Risk」** — 在 `3-findings.md` 中搜尋 `Accepted Risk`。❌ 任何相符項目 → 失敗。此工具無權接受風險。每個 `Open` 威脅都必須有一個發現。每個 `Mitigated` 威脅都必須有一個發現以記錄團隊的控制措施。
- [ ] **涵蓋範圍表格中的「Needs Review」** — 在 `3-findings.md` 中搜尋 `Needs Review`。❌ 任何相符項目 → 失敗。「Needs Review」已被取代：威脅要麼是 Covered（弱點）、Mitigated（團隊建立了控制措施），要麼是 Platform（外部系統）。不存在延遲分類。

### 1.7 `0-assessment.md`

- [ ] **章節順序**：Report Files → Executive Summary → Action Summary → Analysis Context & Assumptions → References Consulted → Report Metadata → Classification Reference（最後）
- [ ] **報告檔案 (Report Files) 章節** 是標題後的第一個章節
- [ ] **風險評等標題** 無表情符號：`### Risk Rating: Elevated` 而非 `### Risk Rating: 🟠 Elevated`
- [ ] **無獨立的建議章節** — 行動摘要（Action Summary）即為建議內容
- [ ] **行動摘要表** 已存在，包含層級（Tier）、描述（Description）、威脅（Threats）、發現（Findings）、優先級（Priority）欄位
- [ ] **行動摘要（Action Summary）是唯一的名稱**：沒有標題為「優先修復路線圖」、「頂級建議」、「關鍵建議」或「風險概況」的章節
- [ ] **快速獲勝（Quick Wins）子章節** 已存在（若無低工作量的 T1 發現則明確省略）
- [ ] **需要驗證（Needs Verification）章節** 存在於分析背景與假設之下
- [ ] **查閱參考資料（References Consulted）** 有兩個子章節：`### 安全標準` 與 `### 元件文件`
- [ ] **查閱參考資料表** 使用包含完整 URL 的三欄格式：`| Standard | URL | How Used |` 與 `| Component | Documentation URL | Relevant Section |` — 而非扁平的 `| Reference | Usage |` 表格
- [ ] **發現覆寫（Finding Overrides）** 即便為空也使用表格格式（絕不使用純文字）
- [ ] **報告 Metadata** 是分類參考之前的最後一個章節，包含所有必要欄位
- [ ] **Metadata 時間戳記** 來自實際的指令執行（而非衍生自資料夾名稱）
- [ ] **模型（Model）** 欄位已存在 — 數值與使用的模型相符（例如：`Claude Opus 4.6`、`GPT-5.3 Codex`、`Gemini 3 Pro`）
- [ ] **分析開始（Analysis Started）** 與 **分析完成（Analysis Completed）** 欄位已存在，帶有來自 `Get-Date` 指令的 UTC 時間戳記
- [ ] **持續時間（Duration）** 欄位已存在 — 由分析開始與分析完成的時間戳記計算得出
- [ ] **Metadata 數值使用反引號** — 報告 Metadata 表格中的每個數值儲存格必須包裹在反引號中。抽查至少 5 列。
- [ ] **章節間的水平線** — 計算檔案中符合 `---` 的行數。必須 ≥ 6（7 個 `## ` 章節的每對之間各一條）。
- [ ] **分類參考是最後一個章節** — `## 分類參考` 作為最後一個 `## ` 標題存在。包含一個單一的 2 欄表格（`Classification | Values`），列出：可利用性層級、STRIDE + 濫用、SDL 嚴重程度、修復工作量、緩解類型、威脅狀態、CVSS、CWE、OWASP。❌ 缺少章節或格式錯誤 → 失敗。
- [ ] **分類參考是靜態的** — 表格中的數值必須與骨架完全相符（逐字複製）。不增加額外的列，不修改描述。與 `skeleton-assessment.md` 的分類參考章節進行比對。
- [ ] **無禁用的章節標題** — 搜尋：`Severity Distribution`、`Architecture Risk Areas`、`Methodology Notes`、`Deliverables`、`Priority Remediation Roadmap`、`Key Recommendations`、`Top Recommendations`。必須回傳 0 個符合項。
- [ ] **行動摘要層級優先級是固定的** — 在 `0-assessment.md` 的行動摘要表中，驗證優先級欄位：Tier 1 = `🔴 關鍵風險`，Tier 2 = `🟠 高風險`，Tier 3 = `🟡 中度風險`。❌ Tier 1 標示為低/中度/高風險 → 失敗。❌ Tier 2 標示為關鍵/低風險 → 失敗。這些是固定的標籤，無論威脅/發現數量多少都不會改變。
- [ ] **行動摘要包含所有 3 個層級** — 行動摘要表必須包含 Tier 1、Tier 2 與 Tier 3 的列，即使某個層級有 0 個威脅與 0 個發現。缺少層級 → 失敗。

---

## 階段 2 — 圖表渲染檢查

針對所有檔案中的所有 Mermaid 區塊執行。可作為專項子任務指派。

### 2.1 初始化區塊（Init Blocks）

- [ ] **每個流程圖** 都有 `%%{init}%%` 區塊，且第一行包含 `'background': '#ffffff'`
- [ ] **每個循序圖** 都有完整的 `%%{init}%%` 主題變數區塊，且包含 `'background': '#ffffff'`
- [ ] **themeVariables 中無自定義顏色鍵** — 初始化區塊不得包含 `primaryColor`（`#ffffff` 除外）、`secondaryColor` 或 `tertiaryColor`。所有元素顏色僅來自 classDef。

### 2.2 類別定義與色調（Class Definitions & Color Palette）

- [ ] **每個 `classDef`** 都包含 `color:#000000`（明確的黑色文字）
- [ ] **DFD 圖表** 使用 `process`/`external`/`datastore` 類別名稱
- [ ] **架構圖** 使用 `service`/`external`/`datastore` 類別名稱
- [ ] **使用準確的十六進位代碼** — 搜尋 `.mmd` 檔案中所有 `#[0-9a-fA-F]{6}` 數值。唯一允許的填滿顏色為：`#6baed6`、`#fdae61`、`#74c476`、`#ffffff`、`#000000`。唯一允許的線條顏色為：`#2171b5`、`#d94701`、`#238b45`、`#e31a1c`、`#666666`。若出現任何其他十六進位顏色（例如：`#4299E1`、`#48BB78`、`#E53E3E`、`#2B6CB0`），圖表將無法通過此項檢查。

### 2.3 樣式（Styling）

- [ ] **每個流程圖** 都有 `linkStyle default stroke:#666666,stroke-width:2px`
- [ ] **信任邊界樣式** 使用 `stroke:#e31a1c,stroke-width:3px`（而非 `#ff0000` 或 `stroke-width:2px`）
- [ ] **架構層樣式** 使用淺色填滿並搭配相應的邊框（而非紅色的虛線信任邊界）

### 2.4 語法驗證

- [ ] **所有標籤均使用引號包裹**：`["Name"]`、`(("Name"))`、`[("Name")]`、`-->|"Label"|`、`subgraph ID["Title"]`
- [ ] **子圖/結束配對一致**：每個 `subgraph` 都有一個結束的 `end`
- [ ] **任何 Mermaid 區塊中無遺漏字元** 或未關閉的引號

### 2.5 Kubernetes Sidecar 規則

若目標系統未部署於 Kubernetes，請跳過此章節。

- [ ] **每個 K8s 服務節點** 都標註了 sidecar：在節點標籤中使用 `<br/>+ SidecarName`
- [ ] **零獨立 sidecar 節點**：搜尋所有圖表中名為 `MISE`、`Dapr`、`Envoy`、`Istio`、`Sidecar` 的節點 — 這些絕不能作為獨立節點存在
- [ ] **零 pod 內 localhost 流量**：容器與其 sidecar 之間沒有箭頭（無 `-->|"localhost"` 模式）
- [ ] **跨邊界 sidecar 流量源自宿主容器**：所有指向外部目標（Azure AD、Redis 等）的箭頭都來自宿主容器節點，而非來自獨立的 sidecar 節點
- [ ] **元件表**：sidecar 無獨立列 — 在宿主容器的描述欄位中描述

---

## 階段 3 — 跨檔案一致性檢查

這些檢查驗證檔案之間的關係。它們需要同時讀取多個檔案。

### 3.1 元件涵蓋範圍（架構 → STRIDE → 發現）

- [ ] **每個元件** 在 `0.1-architecture.md` 的關鍵元件表中，在 `2-stride-analysis.md` 中都有對應的 `## 元件` 章節
- [ ] **每個元素** 在 `1-threatmodel.md` 的元件表中為行程（Process）者，在 `2-stride-analysis.md` 中都有對應的 `## 元件` 章節
- [ ] **在 `2-stride-analysis.md` 中無孤立元件**，即未出現在元件表中的元件
- [ ] **摘要表元件數量** 與檔案中的 `## 元件` 章節數量相符
- [ ] **元件數量精確匹配** — 計算 `0.1-architecture.md` 關鍵元件表中的列數（不含標頭/分隔線）。計算 `2-stride-analysis.md` 中的 `## ` 元件章節數量（不含 `## 可利用性層級`、`## 摘要`）。這些計數必須相等。

### 3.2 資料流涵蓋範圍（STRIDE ↔ DFD）

- [ ] **每個資料流 ID**（`DF01`、`DF02` 等）來自 `1-threatmodel.md` 的資料流表，均出現在 `2-stride-analysis.md` 中至少一個「受影響流量（Affected Flow）」儲存格中
- [ ] **STRIDE 分析中無孤立流量 ID**，即未在資料流表中定義的 ID

### 3.3 威脅至發現的可追溯性（STRIDE ↔ 發現）

這是最重要的跨檔案檢查。它確保沒有已識別的威脅被無聲地遺漏。

- [ ] **每個威脅 ID** 在 `2-stride-analysis.md` 中（例如：T01.S、T01.T1、T02.I），都透過 `3-findings.md` 的相關威脅欄位被至少一個發現所引用
- [ ] **收集所有威脅 ID**，來自 `2-stride-analysis.md` 中的所有層級表格
- [ ] **收集所有被引用的威脅 ID**，來自 `3-findings.md` 中的相關威脅欄位
- [ ] **涵蓋範圍落差報告**：列出任何出現在 STRIDE 但在發現中缺失的威脅 ID。若存在落差 → 則增加發現或將威脅歸類至現有的相關發現中

### 3.4 發現至 STRIDE 錨點完整性（發現 → STRIDE）

- [ ] **每個相關威脅連結** 在 `3-findings.md` 中均使用格式 `[ThreatID](2-stride-analysis.md#component-anchor)`
- [ ] **每個 `#component-anchor`** 都能解析至 `2-stride-analysis.md` 中實際的 `## 標題`
- [ ] **錨點建構已驗證**：標題 → 小寫 → 空格轉換為連字號 → 刪除連字號以外的非字母數字字元
- [ ] **抽查至少 3 個錨點**，透過點擊連結並確認威脅 ID 存在於該標題下

### 3.5 計數一致性（評估 ↔ 所有檔案）

- [ ] **元素數量** 在執行摘要中與 `1-threatmodel.md` 中實際的元件表列數相符
- [ ] **發現數量** 在執行摘要中與 `3-findings.md` 中實際的發現數量相符
- [ ] **威脅數量** 在執行摘要中與 `2-stride-analysis.md` 摘要表中的總計相符
- [ ] **層級數量** 在威脅數量背景段落中與來自 `2-stride-analysis.md` 實際的 T1/T2/T3 總計相符
- [ ] **行動摘要層級表** 的數量與來自 `3-findings.md`（發現欄位）及 `2-stride-analysis.md`（威脅欄位）實際的各層級數量相符

**計數檢查的驗證方法：**
- 元素數量：計算 `1-threatmodel.md` 元件表中的 `|` 列數，減去 2（標頭 + 分隔線）
- 發現數量：計算 `3-findings.md` 中的 `### FIND-` 標題數量
- 威脅數量：讀取 `2-stride-analysis.md` 摘要表中的總計（Totals）列，取 `Total` 欄位的值
- 層級數量：從同一個總計列中，取 T1、T2、T3 欄位的值

### 3.6 STRIDE 摘要表算術

- [ ] **逐列**：每個元件的 S + T + R + I + D + E + A = 總計
- [ ] **逐列**：每個元件的 T1 + T2 + T3 = 總計
- [ ] **總計列**：跨所有元件列的每個欄位總和等於總計列的值
- [ ] **列數交叉檢查**：每個元件詳細表中的威脅列數等於其在摘要表中的總計
- [ ] **無人為的全 1 模式**：檢查摘要表中是否存在每個元件的每個 STRIDE 欄位（S,T,R,I,D,E,A）均精確為 1 的模式。若所有元件在每個 STRIDE 類別中都精確有 1 個威脅 → 失敗（這表示是公式化的「每個類別至少 1 個」的通膨，而非真實分析）。有效的分析應根據實際攻擊面使各類別的計數有所不同：某些類別可能為 0（帶有 N/A 理由），其他類別可能為 2-3。所有元件出現統一的 1 是人為填充的強烈訊號。
- [ ] **N/A 項目不計入總計**：若任何元件在 STRIDE 類別中具有 `N/A — {理由}` 項目，請驗證摘要表中該類別顯示為 0（而非 1）。N/A 項目不計入威脅。

### 3.7 排序順序（發現）

- [ ] **在每個層級章節內**：發現按關鍵（Critical） → 重要（Important） → 中度（Moderate） → 低（Low）的順序出現
- [ ] **在每個嚴重程度範圍內**：高 CVSS 的發現出現在低 CVSS 的發現之前
- [ ] **無順序錯誤**：依序掃描並確認沒有反轉

### 3.8 報告檔案表（評估 ↔ 輸出資料夾）

- [ ] **列出的每個檔案** 在 `0-assessment.md` 的報告檔案表中，均存在於輸出資料夾中
- [ ] **`0.1-architecture.md` 已列出** 在報告檔案表中
- [ ] **若未產生 `1.2-threatmodel-summary.mmd`**：則從報告檔案表中省略（不以「N/A」註記列出）

---

## 階段 4 — 證據品質檢查

這些檢查驗證發現的實質內容，而不僅僅是結構。理想情況下由具有程式碼存取權限的子代理程式執行。

### 4.1 發現證據

- [ ] **每個發現** 都有一個證據章節，引用特定的檔案/行號/組態
- [ ] **證據是具體的**：顯示實際的程式碼或組態，而非僅僅是「缺少組態」
- [ ] **針對「缺少安全性」的主張**：證據證明平台預設是不安全的（而非僅僅是缺少明確的組態）

### 4.2 標記前先驗證（Verify-Before-Flagging）合規性

- [ ] **安全性基礎設施盤點** 在 STRIDE 分析之前執行（檢查發現中對平台安全性預設值的驗證）
- [ ] **無誤報模式**：當 Dapr Sentry 存在時，沒有發現主張「缺少 mTLS」，或在 K8s ≥1.6 上主張「缺少 RBAC」等。
- [ ] **已套用發現分類**：每個記錄的發現均為「已確認（Confirmed）」（而非「需要驗證」— 那些應歸類於 `0-assessment.md`）

### 4.3「需要驗證」位置

- [ ] **所有「需要驗證」項目**皆位於 `0-assessment.md` 的「分析內容與假設」下方 — 不得位於 `3-findings.md`
- [ ] **無模糊發現**：`3-findings.md` 中的發現具有弱點的正向證據

---

## 驗證摘要範本

執行所有檢查後，產生一份摘要。

次代理程式輸出必須包含：
- 階段名稱
- 檢查總數、通過、失敗
- 針對每個失敗：檢查 ID、檔案、證據、確切修復指令
- 修復後的重新執行狀態

若無計數，請勿僅回傳「看起來不錯」。

```markdown
## 驗證結果

| 階段 | 檢查 | 通過 | 失敗 | 備註 |
|-------|--------|--------|--------|-------|
| 0 — 常見偏離掃描 | [N] | [N] | [N] | [模式相符] |
| 1 — 逐一檔案結構 | [N] | [N] | [N] | [有問題的檔案] |
| 2 — 圖表呈現 | [N] | [N] | [N] | [特定失敗] |
| 3 — 跨檔案一致性 | [N] | [N] | [N] | [發現缺口] |
| 4 — 證據品質 | [N] | [N] | [N] | [誤報風險] |
| 5 — JSON 結構描述 | [N] | [N] | [N] | [結構描述問題] |

### 失敗檢查詳細資訊
<!-- 針對每個失敗的檢查，列出：檢查 ID、檔案、錯誤之處、建議修復方式 -->
```

---

## 階段 5 — threat-inventory.json 結構描述驗證

這些檢查驗證在步驟 8b 中產生的 JSON 清單檔案。此檔案對於比較模式至關重要。

### 5.1 結構描述欄位

- [ ] **`schema_version` 欄位** — 存在且等於 `"1.0"`（獨立）或 `"1.1"`（增量）。若報告包含 `"incremental": true`，schema_version 必須為 `"1.1"`。否則為 `"1.0"`。
- [ ] **`commit` 欄位** — 存在（短 SHA 或 `"Unknown"`）
- [ ] **`components` 陣列** — 非空，至少有 1 個項目
- [ ] **元件 ID** — 每個元件皆有 `id` (PascalCase)、`display`、`type`、`boundary`
- [ ] **元件欄位名稱合規性** — 元件使用 `"display"`（而非 `"display_name"`）。Grep：`"display_name"` 必須回傳 0 個符合項。
- [ ] **威脅欄位名稱合規性** — 威脅使用 `"stride_category"`（而非 `"category"`）。威脅同時具有 `"title"` 與 `"description"`（不只有 description，亦非 `"name"`）。威脅→元件連結位於 `"identity_key"."component_id"` 內（而非威脅物件最上層的 `"component_id"`）。Grep：最上層且在 identity_key 之外的 `"category":` 必須回傳 0 個符合項。Grep：每個威脅物件必須包含 `"title":`。
- [ ] **`boundaries` 陣列** — 存在（對於扁平系統可為空）
- [ ] **`flows` 陣列** — 存在，每個流程皆有標準 ID 格式 `DF_{Source}_to_{Target}`
- [ ] **`threats` 陣列** — 非空
- [ ] **`findings` 陣列** — 非空
- [ ] **`metrics` 物件** — 存在，包含 `total_components`、`total_threats`、`total_findings`

### 5.2 計數一致性

- [ ] **`metrics.total_components == components.length`** — 陣列長度與計數相符
- [ ] **`metrics.total_threats == threats.length`** — 陣列長度與計數相符
- [ ] **`metrics.total_findings == findings.length`** — 陣列長度與計數相符
- [ ] **計數與 Markdown 報告相符** — `total_threats` 等於 STRIDE 摘要表中的總計，`total_findings` 等於 `3-findings.md` 中的 `### FIND-` 計數
- [ ] **截斷恢復閘** — 若上述偵測到任何陣列長度不符，請驗證檔案已重新產生（而非修補）。檢查：對於威脅數 >40 的儲存庫，檔案大小 >10KB；威脅陣列包含 `2-stride-analysis.md` 中出現的「每個」元件項目
- [ ] **預先寫入策略合規性** — 若 `metrics.total_threats > 50`，驗證 JSON 是透過次代理程式委派、Python 腳本或分塊附加寫入的 — 而非單一 `create_file` 呼叫。證據：檢查紀錄中的 `agent` 呼叫、`_extract.py` 腳本或對 JSON 檔案進行的多個 `replace_string_in_file` 操作。

### 5.3 確定性身分穩定性（為比較做好準備）

- [ ] **元件包含確定性身分欄位** — 每個元件皆有 `aliases`（陣列）、`boundary_kind` 與 `fingerprint`
- [ ] **`boundary_kind` 有效值** — 每個元件的 `boundary_kind` 為以下之一：`MachineBoundary`、`NetworkBoundary`、`ClusterBoundary`、`ProcessBoundary`、`PrivilegeBoundary`、`SandboxBoundary`。❌ 任何其他值（例如 `DataStorage`、`ApplicationCore`、`deployment`、`trust`）→ 失敗
- [ ] **邊界包含確定性身分欄位** — 每個邊界皆有 `kind`、`aliases`（陣列）與 `contains_fingerprint`
- [ ] **邊界 `kind` 有效值** — 每個邊界的 `kind` 為與 `boundary_kind` 相同的 6 個與 TMT 對齊的值之一。❌ 任何其他值 → 失敗
- [ ] **無重複的標準元件 ID** — 標準化後，`components[].id` 值是唯一的
- [ ] **別名映射一致** — 在同一個清單中，同一個別名不會出現在兩個不相關的元件 ID 下
- [ ] **指紋證據欄位僅限穩定內容** — `fingerprint` 使用來源檔案/拓撲/類型/協定，而非自由格式的散文
- [ ] **套用確定性排序** — 陣列依標準鍵（`components.id`、`boundaries.id`、`flows.id`、`threats.id`、`findings.id`）排序

### 5.4 比較偏移護欄（驗證比較輸出時）

- [ ] **高信賴度的重新命名候選者不保留為新增/移除** — 具有強烈別名/來源檔案/拓撲重疊的元件對被歸類為 `renamed`/`modified`
- [ ] **邊界重新命名候選者使用包含重疊** — 相同的 `kind` + 高度的 `contains` 重疊被歸類為邊界 `renamed`，而非 `added` + `removed`
- [ ] **辨識分割/合併邊界轉換** — 一對多與多對一的包含轉換被映射至 `split`/`merged` 類別

### 5.5 比較完整性檢查（驗證比較輸出時）

- [ ] **基準 ≠ 目前提交** — `metadata.json` → `baseline.commit` 必須與 `current.commit` 不同。相同提交的比較是無效的（無實際程式碼變更可供比較）。
- [ ] **變更檔案數 > 0** — `metadata.json` → `git_diff_stats.files_changed` 必須 > 0。變更檔案數為 0 的比較沒有程式碼差異，且無意義。
- [ ] **持續時間 > 0** — `metadata.json` → `duration` 必須「不得」為 `"0m 0s"` 或任何低於 2 分鐘的值。真正的比較需要讀取兩個清單、執行多訊號比對、計算熱點圖並產生 HTML — 這需要實際時間。
- [ ] **無外部資料夾引用** — `metadata.json` 與所有輸出檔案「不得」包含對 `D:\One\tm` 或受分析儲存庫之外任何資料夾的引用。報告應僅引用目前儲存庫內的資料夾。
- [ ] **防重複使用驗證** — 比較輸出必須是新產生的，而非從先前的 `threat-model-compare-*` 資料夾複製而來。藉由檢查 `metadata.json` 的時間戳記是否來自本次執行來驗證。
- [ ] **方法論偏移比例** — 若 `diff-result.json` → `metrics.methodology_drift_ratio` > 0.50，驗證 HTML 報告包含方法論偏移警告橫幅。若未計算比例但超過 50% 的元件重新命名共享相同的別名/指紋，則標記為驗證失敗。

---

## 階段 6 — 確定性身分與命名穩定性

這些檢查驗證元件/邊界/流程命名遵循確定性規則，確保在相同程式碼的獨立執行中能產生可重現的輸出。

### 6.1 元件 ID 確定性

- [ ] **元件 ID 衍生自程式碼構件** — `threat-inventory.json` 中的每個元件 ID 必須追溯至實際的類別名稱、檔案路徑、部署 manifest 的 `metadata.name` 或設定鍵。不得使用抽象概念（`ConfigurationStore`、`DataLayer`、`LocalFileSystem`）。針對來源檔案名稱與類別名稱 Grep 元件 ID — 至少 80% 應有直接符合項。
- [ ] **元件錨點驗證** — `threat-inventory.json` 中的每個程序類型元件必須具有非空的 `fingerprint.source_files` 或 `fingerprint.source_directories`。若兩者皆為空 → 失敗（元件無程式碼錨點）。
- [ ] **Helm/K8s 工作負載命名** — 針對 K8s 部署的元件，驗證元件 ID 與 Deployment/StatefulSet YAML 中的 `metadata.name` 相符，而非 Helm 範本檔案名稱或目錄。範例：`DevPortal`（來自部署名稱），而非 `templates-knowledge-deployment`（來自檔案路徑）。
- [ ] **外部服務錨定** — 外部服務（儲存庫中無原始碼）必須錨定至其整合點：客戶端類別名稱、設定鍵或 SDK 相依性。驗證 `fingerprint.config_keys` 或 `fingerprint.class_names` 已填入。
- [ ] **不存在禁止的命名模式** — 元件 ID 不得為通用標籤：Grep `ConfigurationStore`、`DataLayer`、`LocalFileSystem`、`SecurityModule`、`NetworkLayer`、`DatabaseAccess`。→ 必須回傳 0 個符合項。
- [ ] **縮寫一致性** — 眾所周知的縮寫在 PascalCase ID 中必須全大寫：`API`、`NFS`、`LLM`、`SQL`、`DB`、`AD`、`UI`。Grep `Api`（應為 `API`）、`Nfs`（應為 `NFS`）、`Llm`（應為 `LLM`）。→ 必須回傳 0 個符合項。
- [ ] **常見技術命名精確度** — 在適用處驗證這些確切 ID：`Redis`（而非 `RedisCache`）、`Milvus`（而非 `MilvusDB`）、`NginxIngress`（而非 `IngressNginx`）、`AzureAD`（而非 `AzureAd`）、`PostgreSQL`（而非 `Postgres`）。

### 6.2 邊界命名穩定性

- [ ] **邊界 ID 為 PascalCase** — `threat-inventory.json` 中的每個邊界 ID 皆使用衍生自部署拓撲的 PascalCase（例如 `K8sCluster`、`External`、`Application`）。不得使用程式碼架構層（`PresentationLayer`、`BusinessLogic`）。
- [ ] **單一程序應用程式無程式碼層邊界** — 若系統為單一程序（一個 .exe、一個容器），應恰好有 1 個 `Application` 邊界 — 而非 Presentation/Business/Data 層的 4 個以上邊界。計數邊界並驗證比例。
- [ ] **K8s 多服務子邊界** — 針對具有多個 Deployment 的 K8s 命名空間，驗證子邊界存在：`BackendServices`、`DataStorage`、`MLModels`、`Agentic`（視情況而定）。

### 6.3 資料流程完整性

- [ ] **入口/反向代理的雙向流程** — 若入口元件（Nginx、Traefik）路由至後端，驗證「兩個」方向皆存在：`DF_Ingress_to_Backend` 與 `DF_Backend_to_Ingress`。計數通過入口的前向流程並驗證相符的回應流程。
- [ ] **資料庫的雙向流程** — 針對每個 `DF_Service_to_Datastore` 流程，驗證存在對應的 `DF_Datastore_to_Service` 讀取流程。資料庫：Redis、Milvus、PostgreSQL、MongoDB 等。
- [ ] **流程計數穩定性** — 計數 `threat-inventory.json` 中的流程。相同程式碼的兩次獨立執行應產生相同計數（±3 可接受）。若舊分析與 HEAD 分析之間，未變更元件的流程計數差異 >5，則標記為命名偏移。

### 6.4 計數穩定性（跨執行確定性）

- [ ] **元件計數在容許範圍內** — 若比較相同程式碼的兩次分析，元件計數必須在 ±1 以內。差異 ≥3 = 失敗。
- [ ] **邊界計數在容許範圍內** — 相同程式碼 → 邊界計數在 ±1 以內。
- [ ] **程序元件的指紋完整性** — 每個 `type: "process"` 的元件必須具有非空的 `fingerprint.source_directories` 與 `fingerprint.class_names`。程序元件的陣列為空 → 失敗。
- [ ] **STRIDE 類別單一字母強制執行** — JSON 中的每個 `threats[].stride_category` 恰好為一個字母：S、T、R、I、D、E 或 A。Grep 全名（`"Spoofing"`、`"Tampering"`、`"Denial of Service"`）→ 必須回傳 0 個符合項。這可防止熱點圖計算錯誤。

---

## 階段 7 — 基於證據的先決條件與涵蓋範圍完整性

這些檢查驗證先決條件、層級與涵蓋範圍遵循確定性且基於證據的規則。

### 7.1 先決條件判定證據

- [ ] **無部署證據不得有先決條件** — 針對每個 `Exploitation Prerequisites` ≠ `None` 的發現，驗證先決條件反映了實際部署設定（Helm 數值、Dockerfile、服務類型、入口規則）。若先決條件顯示為 `Internal Network` 但無網路限制證據 → 失敗。
- [ ] **相同程式碼的先決條件一致性** — 若相同程式碼的兩次分析針對相同弱點產生不同的先決條件，則技能規則不足。標記以供調查。

### 7.1b 部署分類閘（強制性）

- [ ] **部署分類存在** — `0.1-architecture.md` 必須 contain a `**Deployment Classification:**` line with one of: `LOCALHOST_DESKTOP`, `LOCALHOST_SERVICE`, `AIRGAPPED`, `K8S_SERVICE`, `NETWORK_SERVICE`. ❌ 缺失 → 失敗。
- [ ] **元件暴露表存在** — `0.1-architecture.md` 必須包含 `### Component Exposure Table`，欄位包含：Component、Listens On、Auth Required、Reachability、Min Prerequisite、Derived Tier。❌ 缺失 → 失敗。
- [ ] **暴露表完整性** — 「關鍵元件」表中的每個元件在「元件暴露表」中皆有對應列。❌ 缺失列 → 失敗。
- [ ] **T1 強制執行部署分類** — 若部署分類為 `LOCALHOST_DESKTOP` 或 `LOCALHOST_SERVICE`：
  - 計數 `Exploitation Prerequisites` = `None` 的發現。❌ 計數 > 0 → 失敗（最低必須為 `Local Process Access` 或 `Host/OS Access` minimum）。
  - 計數 `## Tier 1` 中的發現。❌ 計數 > 0 → 失敗（localhost/桌面應用程式必須為 T2+）。
  - 針對 CVSS 中具有 `AV:N` 的每個發現，檢查元件的 `Reachability` 欄位。❌ `AV:N` 且 `Reachability ≠ External` → 失敗。
- [ ] **強制執行最低先決條件** — 針對「每個」發現，在暴露表中查找該發現的「元件」。發現的 `Exploitation Prerequisites` 必須 ≥ 表中的 `Min Prerequisite`。發現的層級必須 ≥ `Derived Tier`。❌ 發現為 `None` 但表顯示為 `Local Process Access` → 失敗。
- [ ] **證據中的先決條件基礎** — 每個發現's `#### Evidence` section must contain a `**Prerequisite basis:**` line citing specific code/config that determines the prerequisite. ❌ 缺失或通用（「於程式碼庫中發現」）→ 失敗。

### 7.2 涵蓋範圍完整性

- [ ] **技術涵蓋範圍檢查** — 針對儲存庫中的每項主要技術（Redis、PostgreSQL、Docker、K8s、ML/LLM、NFS 等），驗證至少有一個發現或紀錄的緩解措施處理了該技術。掃描 `0.1-architecture.md` 的「技術堆疊」表 → 針對每項技術，在 `3-findings.md` 中 Grep 相符的發現。
- [ ] **最小發現門檻** — 小型儲存庫（<20 個檔案）：≥8 個發現；中型（20-100）：≥12 個；大型（100+）：≥18 個。計數 `### FIND-` 標題並根據儲存庫大小進行驗證。
- [ ] **環境感知限制內的平台比例** — 偵測部署模式：若 go.mod 包含 `controller-runtime`/`kubebuilder`/`operator-sdk` → K8s Operator（限制 ≤35%）；否則 → 獨立應用程式（限制 ≤20%）。計數平台狀態威脅 / 威脅總數。若超過限制 → 失敗。在評估中紀錄偵測到的模式。
- [ ] **先決條件為 None 的 DoS = 發現** — 每個 `Prerequisites: None` 的 DoS 威脅 (`.D`) 必須有對應的發現。在 STRIDE 分析中 Grep 先決條件為 None 的 `.D` 威脅，並驗證每個威脅皆映射至涵蓋範圍表中的發現 ID。

### 7.3 安全基礎設施意識

- [ ] **提及安全基礎設施清單** — 若程式碼庫中存在安全元件（服務網格、憑證管理、身分驗證中介軟體），驗證 `0.1-architecture.md` 或 `2-stride-analysis.md` 引用了這些元件。若部署了 Dapr Sentry，則 mTLS 不得被標記為「缺失」。
- [ ] **缺失安全聲明的舉證責任** — 每個聲明「缺失 X」的發現必須證明平台預設是不安全的，而不僅是缺乏明確設定。抽查嚴重性最高的「缺失」發現。

---

## 階段 8 — 比較 HTML 報告結構（僅限比較輸出）

這些檢查驗證 HTML 比較報告結構。

### 8.1 HTML 比較報告結構

- [ ] **恰好有 4 個 `<h2>` 區段** — HTML 必須依序恰好具有這些 `<h2>` 標題：「執行摘要」、「威脅層級分佈」、「STRIDE-A 熱點圖（含偏移指標）」、「比較基準 — 元件映射」。❌ 額外區段如「整體風險轉移」、「關鍵偏移計數」、「計數概覽」、「發現差異」作為 `<h2>` → 失敗（這些應為行內元素或已移除）。❌ 缺少 4 個中的任何一個 → 失敗。
- [ ] **無「發現差異」區段** — HTML 「不得」包含「發現差異」`<h2>` 區段或任何發現差異子區段（已修復、已移除、分析缺口、新增、已變更、未變更）。若存在 → 失敗。
- [ ] **無偏移計數卡片** — HTML 「不得」包含 `.risk-delta` 卡片（已修復發現、新發現、淨變動、已移除、分析缺口、程式碼驗證）。若存在 → 失敗。
- [ ] **風險轉移與計數列為行內元素** — 風險轉移與計數列（元件/威脅/邊界/流程/時間）為行內卡片元素，而非 `<h2>` 區段。若它們以 `<h2>` 出現 → 失敗。
- [ ] **計數列包含信任邊界** — 計數列「必須」顯示信任邊界計數（例如 `2 → 2`）。若計數列缺少邊界 → 失敗。元件、威脅、信任邊界、發現與程式碼變更為 5 個必要的計數方塊。
- [ ] **計數列第 5 個方塊為程式碼變更** — 第 5 個計數方塊「必須」顯示提交數與 PR 數（例如 `142 個提交，23 個 PR`）。❌ 「間隔時間」 → 失敗。持續時間/日期現在位於比較卡片（第 1 區段）中，而非計數列。
- [ ] **比較卡片結構** — 第 1 區段「必須」包含一個 `comparison-cards` div，內含 3 個子卡片：基準（雜湊、日期、分級）、目標（雜湊、日期、分級）、趨勢（方向、持續時間）。❌ 舊式 `subtitle` div 包含 `Baseline: SHA → Target: SHA` → 失敗。❌ 獨立的 `risk-shift` div → 失敗（已併入比較卡片）。
- [ ] **無重複的狀態指標** — 狀態資訊（已修復/新增/先前未識別的計數）「必須」僅出現在「一個」地方：彩色狀態摘要卡片。它們「不得」同時以小型行內徽章或文字形式出現在計數列中。若相同計數同時出現在計數列「與」彩色卡片中 → 失敗（從計數列移除，保留彩色卡片）。
- [ ] **層級標籤與分析報告相符** — HTML 中的「威脅層級分佈」區段必須使用「完全」一致的標籤：「層級 1 — 直接暴露」、「層級 2 — 有條件風險」、「層級 3 — 深層防禦」。❌ 「可能暴露」、「理論性」、「高風險」或任何發明的變體 → 失敗。
- [ ] **區段標題為「比較基準」而非「架構變更」** — 元件映射區段標題必須為「比較基準 — 元件映射」，而非「架構變更」。
- [ ] **熱點圖有 13 欄** — STRIDE-A 熱點圖網格必須具有：元件 | S | T | R | I | D | E | A | 總計 | 分隔線 | T1 | T2 | T3。若缺少 T1/T2/T3 欄位 → 失敗。熱點圖標題必須包含「（含偏移指標）」。

### 8.2 熱點圖準確性（比較輸出）

- [ ] **熱點圖不全為零** — 加總 `stride_heatmap.components` 中所有的 `baseline.Total` 與 `current.Total`。若任一總和為 0 但對應清單中有威脅 → 失敗（熱點圖計算錯誤）。
- [ ] **無重複的重新命名元件列** — 針對 `components_diff.renamed` 中的每個項目，驗證熱點圖針對重新命名的元件（使用目前名稱）恰好具有「一」列，而非兩列（一列全零基準，一列全零目前）。
- [ ] **執行熱點圖異常偵測** — 針對每個 `baseline.Total > 0, current.Total == 0`（消失）的熱點圖列與每個 `baseline.Total == 0, current.Total > 0`（出現）的列：驗證已執行指紋交叉檢查。若消失-出現對共享來源檔案、類別名稱或命名空間 → 這是被遺漏的重新命名，必須重新分類。熱點圖「不得」具有共享來源檔案的相符全零/全新增對。
- [ ] **比較信賴度評分存在** — `diff-result.json` 必須包含 `comparison_confidence` 欄位（"high" 或 "low"）。若存在超過 3 個未解決的熱點圖異常 → 信賴度必須為 "low" 且 HTML 中有警告橫幅。
- [ ] **各元件 STRIDE 算術** — 針對每個熱點圖列：`S+T+R+I+D+E+A == 總計` 且 `T1+T2+T3 == 總計`（基準與目前皆然）。任何不符 → 失敗。
- [ ] **偏移箭頭與 JSON 資料相符** — 針對每個熱點圖單元格，`delta = current - baseline`。若 delta == 0，則無箭頭。若 delta > 0，則為 ▲。若 delta < 0，則為 ▼。抽查至少 3 個元件。
- [ ] **元件移除來源檔案驗證** — 針對 `components_diff.removed` 中的每個元件，驗證其 `source_files` 在目前提交中確實不存在。若來源檔案仍然存在 → 重新分類為重新命名或方法論缺口。
