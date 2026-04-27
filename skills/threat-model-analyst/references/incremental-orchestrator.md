# 增量協調器 (Incremental Orchestrator) — 威脅模型更新工作流程

此檔案包含執行**增量威脅模型分析 (incremental threat model analysis)** 的完整協調邏輯 — 建立一個以現有基標 (baseline) 報告為基礎的新威脅模型報告。當使用者要求更新分析且先前已存在 `threat-model-*` 資料夾時，會呼叫此邏輯。

**與單次分析 (`orchestrator.md`) 的關鍵差異：** 此工作流程不會從頭開始探索元件，而是繼承舊報告的元件清單、ID 和慣例。然後，它會針對目前的程式碼驗證每個項目，並探索新項目。

## ⚡ 內容預算 — 選擇性讀取檔案

**階段 1 (設定 + 變更偵測)：** 僅讀取此檔案 (`incremental-orchestrator.md`)。舊的 `threat-inventory.json` 提供結構架構 — 尚不需要讀取其他技能檔案。
**階段 2 (報告產生)：** 讀取 `orchestrator.md` (適用於強制性規則 1–34)、`output-formats.md`、`diagram-conventions.md` — 並在寫入每個檔案之前讀取 `skeletons/` 中的相關架構。請參閱下方的增量特定規則。
**階段 3 (驗證)：** 委派給具備 `verification-checklist.md` 的子代理程式 (所有 9 個階段，包含用於比較 HTML 的第 8 階段)。

---

## 何時使用此工作流程

當符合以下所有條件時，請使用增量分析：
1. 使用者的請求涉及更新、重新執行或重新整理威脅模型
2. 存放庫中已存在先前的 `threat-model-*` 資料夾，且含有有效的 `threat-inventory.json`
3. 使用者提供或暗示以下兩者：基標報告資料夾以及目標提交 (預設為 HEAD)

**觸發範例：**
- 「使用 threat-model-20260309-174425 作為基標來更新威脅模型」
- 「針對先前的報告執行增量威脅模型分析」
- 「自上次威脅模型分析以來，安全性方面有何變化？」
- 「針對最新的提交重新整理威脅模型」

**不適用此工作流程的情況：**
- 首次分析 (無基標) → 使用 `orchestrator.md`
- 「分析此存放庫的安全性」且未提及先前的報告 → 使用 `orchestrator.md`

---

## 輸入 (Inputs)

| 輸入 | 來源 | 是否必要？ |
|-------|--------|-----------|
| 基標報告資料夾 | `threat-model-*` 目錄的路徑 | 是 |
| 基標 `threat-inventory.json` | `{baseline_folder}/threat-inventory.json` | 是 |
| 基標提交 SHA | 來自 `{baseline_folder}/0-assessment.md` 報告 Metadata | 是 |
| 目標提交 | 使用者提供 SHA，或預設為 HEAD | 是 (預設：HEAD) |

---

**⛔ 子代理程式控管適用於所有階段。** 請參閱 `orchestrator.md` 的子代理程式控管章節。子代理程式是唯讀協助程式 — 它們絕不可針對報告檔案呼叫 `create_file`。

## 階段 0：設定與驗證

1. **記錄開始時間：**
   ```
   Get-Date -Format "yyyy-MM-dd HH:mm:ss" -AsUTC
   ```
   儲存為 `START_TIME`。

2. **收集 git 資訊：**
   ```
   git remote get-url origin
   git branch --show-current
   git rev-parse --short HEAD
   hostname
   ```

3. **驗證輸入：**
   - 確認基標資料夾存在：`Test-Path {baseline_folder}/threat-inventory.json`
   - 從 `0-assessment.md` 讀取基標提交 SHA：搜尋 `| Git Commit |` 列
   - 確認目標提交可解析：`git rev-parse {target_sha}`
   - **取得提交日期：** `git log -1 --format="%ai" {baseline_sha}` 與 `git log -1 --format="%ai" {target_sha}` — 不是今天的日期
   - **取得程式碼變更計數** (用於 HTML 指標列)：
     ```
     git rev-list --count {baseline_sha}..{target_sha}
     git log --oneline --merges --grep="Merged PR" {baseline_sha}..{target_sha} | wc -l
     ```
     儲存為 `COMMIT_COUNT` 與 `PR_COUNT`。

4. **基標程式碼存取 — 重用或建立工作區 (worktree)：**
   ```
   # 檢查現有的工作區
   git worktree list
   
   # 如果 baseline_sha 的工作區已存在 → 重用它
   # 驗證：git -C {worktree_path} rev-parse HEAD
   
   # 如果不存在 → 建立一個：
   git worktree add ../baseline-{baseline_sha_short} {baseline_sha}
   ```
   儲存工作區路徑為 `BASELINE_WORKTREE`，以供後續階段驗證舊程式碼。

5. **建立輸出資料夾：**
   ```
   threat-model-{YYYYMMDD-HHmmss}/
   ```

---

## 階段 1：載入舊報告架構

讀取基標 `threat-inventory.json` 並擷取結構架構：

```
從 threat-inventory.json 載入：
  - components[]  → 所有元件 ID、類型、邊界、來源檔案、指紋
  - flows[]       → 所有流向 ID、來源/目標、協定
  - boundaries[]  → 所有邊界 ID、包含列表
  - threats[]     → 所有威脅 ID、元件對應、STRIDE 類別、層級
  - findings[]    → 所有發現 ID、標題、嚴重性、CWE、元件對應
  - metrics       → 用於驗證的總計

儲存為「繼承的清單 (inherited inventory)」— 結構基礎。
```

**尚不要讀取**舊報告 Markdown 檔案中的完整內文。僅載入結構化資料。僅在以下情況視需要讀取舊報告內文：
- 驗證特定程式碼模式先前是否已分析過
- 解決元件角色或分類的歧義
- 決定發現項目的狀態時需要歷程背景

---

## 階段 2：逐一元件變更偵測

針對繼承清單中的每個元件，判定其變更狀態：

```
針對繼承清單中的每個元件：

  1. 在目標提交檢查 source_files 是否存在：
     git ls-tree {target_sha} -- {each source_file}
  
  2. 如果所有來源檔案皆遺失：
     → change_status = "removed"
     → 將所有連結的威脅標記為 "removed_with_component"
     → 將所有連結的發現標記為 "removed_with_component"
  
  3. 如果來源檔案存在，檢查是否有變更：
     git diff --stat {baseline_sha} {target_sha} -- {source_files}
     
     如果沒有變更 → change_status = "unchanged"
     
     如果有變更，檢查是否與安全性相關：
       讀取 diff：git diff {baseline_sha} {target_sha} -- {source_files}
       尋找以下方面的變更：
       - 驗證/認證模式 (權杖、密碼、憑證)
       - 網路/API 介面 (新端點、變更的監聽器、連接埠繫結)
       - 輸入驗證 (清理、解析、反序列化)
       - 命令執行模式 (shell exec、程序產生)
       - 組態值 (TLS 設定、CORS、安全性標頭)
       - 相依性 (新套件、版本變更)
       
       如果與安全性相關 → change_status = "modified"
       如果僅為外觀變更 (空格、註解、記錄、文件) → change_status = "unchanged"
  
  4. 如果檔案移動或重新命名：
     git log --follow --diff-filter=R {baseline_sha}..{target_sha} -- {source_files}
     → change_status = "restructured"
     → 更新來源檔案參照至新路徑
```

**記錄每個元件的分類** — 這將驅動所有後續決策。

---

## 階段 3：掃描新元件

```
1. 列舉 {target_sha} 中的原始目錄/檔案，且未被任何現有元件的
   source_files 或 source_directories 參照者。
   重點關注：新的頂層目錄、新的 *Service.cs/*Agent.cs/*Server.cs 類別、
   新的 Helm 部署、新的 API 控制器。

2. 套用來自 orchestrator.md 的相同元件探索規則：
   - 以類別為錨點的命名 (取自實際類別名稱的 PascalCase)
   - 元件資格標準 (跨越信任邊界或處理安全性資料)
   - 相同的命名程序 (主要類別 → 指令碼 → 組態 → 目錄 → 技術)

3. 針對每個候選新元件：
   - 驗證其在基標時不存在：git ls-tree {baseline_sha} -- {path}
   - 如果其在基標時已存在 → 這是舊分析中「遺漏的元件」
     → 新增至「需要驗證」章節並註明：「元件在基標時已存在，
       但未包含在先前的分析中。可能代表分析存在缺漏。」
   - 如果確實是新的 (檔案在基標時不存在)：
     → change_status = "new"
     → 按照相同的 PascalCase 命名規則指派新的元件 ID
     → 將在階段 4 執行完整的 STRIDE 分析
```

---

## 階段 4：產生報告檔案

現在產生所有報告檔案。**在開始之前請先讀取相關的技能檔案：**
- `orchestrator.md` — 強制性規則 1–34 適用於所有報告檔案
- `output-formats.md` — 範本與格式規則
- `diagram-conventions.md` — 圖表顏色與樣式
- **在寫入「每個」檔案之前，請先讀取 `skeletons/skeleton-*.md` 中對應的架構** — 「逐字」複製並填寫 `[FILL]` 預留位置

**⛔ 子代理程式控管 (強制性 — 防止重複資料夾錯誤)：** 父代理程式擁有「所有」檔案建立權。子代理程式是「唯讀」協助程式，負責搜尋程式碼、收集內容並執行驗證 — 它們絕不可針對報告檔案呼叫 `create_file`。請參閱 `orchestrator.md` 中的完整子代理程式控管規則。唯一的例外是針對大型存放庫委派產生 `threat-inventory.json` — 即使如此，子代理程式提示也必須包含確切的輸出檔案路徑，以及僅寫入該單一檔案的明確指示。

**⛔ 關鍵提醒：增量報告是一份「獨立 (STANDALONE)」報告。** 即使不看舊報告，讀者也必須能了解完整的安全性現況。狀態註釋 ([STILL PRESENT]、[FIXED]、[NEW CODE] 等) 是在完整內容之上的補充 — 而非其替代品。

### 4a. 0.1-architecture.md

- **先讀取 `skeletons/skeleton-architecture.md`** — 用作結構範本
- 複製舊報告的元件結構作為起始範本
- **未變更的元件：** 使用「目前的程式碼」重新產生說明 (而非從舊報告複製貼上)。使用相同的 ID 與慣例。
- **已修改的元件：** 更新說明以反映程式碼變更。加入註釋：`[MODIFIED — 偵測到安全性相關變更]`
- **新元件：** 加入並註釋：`[NEW]`
- **已移除元件：** 加入並註釋：`[REMOVED]` 與簡短說明
- 技術堆疊、部署模型：如有變動則更新，否則延用

  ⛔ **部署分類為強制性 (即使在增量模式下)：**
  `0.1-architecture.md` 必須包含：
  1. `**Deployment Classification:** \`[VALUE]\`` 行 (例如 `K8S_SERVICE`, `LOCALHOST_DESKTOP`)
  2. `### Component Exposure Table` 包含以下欄位：Component, Listens On, Auth Required, Reachability, Min Prerequisite, Derived Tier
  如果基標已有這些，請延用並針對新/修改的元件進行更新。
  如果基標「沒有」這些，請「現在」從程式碼衍生 — 這些是後續所有步驟的備資訊。
  **在完成這兩個元素之前，請勿繼續執行步驟 4b。**

- 場景：保留舊場景，針對新功能加入新場景
- 適用所有來自 `output-formats.md` 的標準 `0.1-architecture.md` 規則

### 4b. 1.1-threatmodel.mmd (DFD)

- **先讀取 `skeletons/skeleton-dfd.md` 與 `skeletons/skeleton-summary-dfd.md`**
- 從舊 DFD 的邏輯配置開始
- 針對延用的元件使用**相同的節點 ID** (這對 ID 穩定性至關重要)
- **新元件：** 使用獨特的樣式加入 — 使用 `classDef newComponent fill:#d4edda,stroke:#28a745,stroke-width:3px`
- **已移除元件：** 顯示為帶有灰色填滿的虛線 — 使用 `classDef removedComponent fill:#e9ecef,stroke:#6c757d,stroke-width:1px,stroke-dasharray:5`
- 針對未變更的流向使用**相同的流向 ID**
- **新流向：** 接續舊報告的編號指派新 ID
- 適用所有來自 `diagram-conventions.md` 的標準 DFD 規則 (flowchart LR、配色方案等)

  ⛔ **DFD 後置檢查點 (GATE)：** 建立 `1.1-threatmodel.mmd` 後，計算元素與邊界數量。如果元素 > 15 或邊界 > 4 → 請「現在」使用 `skeleton-summary-dfd.md` 建立 `1.2-threatmodel-summary.mmd`。在做出決定之前，請勿繼續執行步驟 4c。

### 4c. 1-threatmodel.md

- **先讀取 `skeletons/skeleton-threatmodel.md`** — 使用表格結構
- 元素表：包含所有舊元素與新元素，並加入 `Status` 欄位
  - 值：`Unchanged`, `Modified`, `New`, `Removed`, `Restructured`
- 流向表：包含所有舊流向與新流向，並包含 `Status` 欄位
- 邊界表：繼承的邊界加上任何新邊界
- 如果產生了 `1.2-threatmodel-summary.mmd`，請包含 `## Summary View` 章節，其中包含摘要圖與對應表
- 適用所有來自 `output-formats.md` 的標準表格規則

### 4d. 2-stride-analysis.md

- **先讀取 `skeletons/skeleton-stride-analysis.md`** — 使用摘要表與逐一元件結構

**⛔ 增量 STRIDE 的關鍵提醒 (這些來自 `orchestrator.md` 的規則在此同樣適用)：**
1. **STRIDE-A 中的 "A" 始終代表 "Abuse"** (商業邏輯濫用、工作流程操縱、功能誤用)。「絕不」將 "Authorization" 用作 STRIDE-A 類別名稱。這適用於威脅 ID 字尾 (T01.A)、N/A 理由標籤以及所有內文。授權問題屬於權限提升 (E)，而非 A 類別。
2. **`## Summary` 表格必須出現在檔案「頂端」**，緊接在 `## Exploitability Tiers` 之後，且在任何個別元件章節「之前」。在頂端使用此確切結構：

```markdown
# STRIDE-A 威脅分析 (STRIDE-A Threat Analysis)

## 惡用層級 (Exploitability Tiers)
| 層級 | 標籤 | 前提條件 | 指派規則 |
|------|-------|---------------|----------------|
| **層級 1** | 直接曝光 | `None` | 可由未經驗證的外部攻擊者在「無」先前存取權限的情況下利用。 |
| **層級 2** | 條件式風險 | 單一前提條件 | 需要「確切一種」存取形式。 |
| **層級 3** | 縱深防禦 | 多重前提條件或基礎架構存取 | 需要顯著的先前入侵或多個組合前提條件。 |

## 摘要 (Summary)
| 元件 | 連結 | S | T | R | I | D | E | A | 總計 | T1 | T2 | T3 | 風險 |
|-----------|------|---|---|---|---|---|---|---|-------|----|----|----|------|
<!-- 每個元件一列 (包含數值計數)，最後是「總計」列 -->

---
## [第一個元件名稱]
```

3. **每個元件的 STRIDE 類別可能會產生 0、1、2、3 個以上的威脅。** 請「勿」將每個類別限制為最多 1 個威脅。具有豐富安全性介面的元件通常在每個相關類別中應有 2-4 個威脅。如果摘要表中的每個 STRIDE 儲存格都是 0 或 1，則分析過於淺顯 — 請重新檢查並找出額外的威脅向量。摘要表欄位反映的是實際的威脅計數。
4. **⛔ 前提條件下限檢查 (針對每個威脅)：** 在為任何威脅指派前提條件之前，請查閱元件曝光表 (`0.1-architecture.md`) 中的元件 `Min Prerequisite` 與 `Derived Tier`。威脅的前提條件必須 ≥ 元件的下限。威脅的層級必須 ≥ 元件的衍生層級。使用來自 `analysis-principles.md` 的標準前提條件→層級對應。前提條件「必須」僅使用標準值：`None`, `Authenticated User`, `Privileged User`, `Internal Network`, `Local Process Access`, `Host/OS Access`, `Admin Credentials`, `Physical Access`, `{Component} Compromise`。⛔ 禁止使用 `Application Access` 與 `Host Access`。

**⛔ 標題錨點規則 (適用於所有輸出檔案)：** 每個輸出檔案中的所有 `##` 與 `###` 標題必須是「純文字」— 標題文字中「不可」包含狀態標籤 (`[Existing]`, `[Fixed]`, `[Partial]`, `[New]`, `[Removed]` 或任何舊式標籤)。標籤會破壞 Markdown 錨點連結並污染目錄。請改為將狀態註釋放在章節/發現本文的「第一行」：
- ✅ `## KmsPluginProvider` 第一行為 `> **[New]** 此版本中新增的元件。`
- ✅ `### FIND-01: 遺漏驗證檢查` 第一行為 `> **[Existing]**`
- ❌ `## KmsPluginProvider [New]` (破壞 `#kmspluginprovider` 錨點)
- ❌ `### FIND-01: 遺漏驗證檢查 [Existing]` (污染標題)

此規則適用於：`0.1-architecture.md`、`2-stride-analysis.md`、`3-findings.md`、`1-threatmodel.md`。

針對每個元件，STRIDE 分析方法取決於其變更狀態：

| 元件狀態 | STRIDE 方法 |
|-----------------|-----------------|
| **未變更 (Unchanged)** | 延用舊報告中所有的威脅項目，並加上 `[STILL PRESENT]` 註釋。針對目前的程式碼重新驗證每個威脅的緩解狀態。 |
| **已修改 (Modified)** | 在可存取 diff 的情況下重新分析元件。針對每個舊威脅：判定為 `still_present` (仍存在)、`fixed` (已修復)、`mitigated` (已緩解) 或 `modified` (已修改)。從程式碼變更中探索新威脅 → 分類為 `new_in_modified` (修改中新增)。 |
| **新增 (New)** | 進行完整的全新 STRIDE-A 分析 (與單次分析模式相同)。所有威脅分類為 `new_code` (新程式碼)。 |
| **已移除 (Removed)** | 章節標題註明：「元件已移除 — 所有威脅均已解決，狀態為 `removed_with_component` (隨元件移除)。」 |

**威脅 ID 持續性：**
- 舊威脅保留其原始 ID (例如 T01.S, T02.T)
- 新威脅接續舊報告中最高的威脅編號
- 「絕不」重新指派或重用舊的威脅 ID

**不適用 (N/A) 類別 (來自 PRD §3.7)：**
- 每個元件都會處理所有 7 個 STRIDE-A 類別
- 不適用的類別：`N/A — {1 句話的理由}`
- N/A 項目「不」計入摘要表中的威脅總計

**STRIDE 表格中的狀態註釋格式：**
在每個威脅表格列中加入一個 `Change` (變更) 欄位，值為以下之一：
- `Existing` — 威脅存在於目前程式碼中，與先前相同 (包含細節有微調的威脅)
- `Fixed` — 弱點已修復 (必須引用具體的程式碼變更)
- `New` — 來自新元件、程式碼變更或先前未識別的威脅
- `Removed` — 元件已移除

<!-- 簡化的顯示標籤：Markdown 本文中僅使用這 5 個標籤進行顯示。
  [Existing] = still_present, modified, mitigated (威脅仍然存在)
  [Fixed] = fixed (已完全修復)
  [Partial] = partially_mitigated (程式碼有變更但弱點仍以較小形式存在)
  [New] = new_code, new_in_modified, previously_unidentified (此報告中新增)
  [Removed] = removed_with_component (元件已刪除)
  JSON 中的 change_status 則保留詳細值以供程式化使用。 -->

⛔ 步驟後置檢查：寫入「所有」威脅的 Change 欄位後，請驗證：
  1. 每個威脅列都只有以下其中之一：Existing, Fixed, New, Removed
  2. 沒有舊式標籤：Still Present, New (Code), New (Modified), Previously Unidentified
  3. 已修復 (Fixed) 的威脅必須引用具體的程式碼變更

### 4e. 3-findings.md

⛔ **在寫入任何發現 (Finding) 之前 — 請「現在」重新讀取 `skeletons/skeleton-findings.md`。**
該架構定義了每個發現區塊的「確切」結構，包含 `#### Evidence` 章節中強制性的 `**Prerequisite basis:**` 行。每個發現 — 無論是 [Existing]、[New]、[Fixed] 還是 [Partial] — 「必須」遵循此架構。

⛔ **部署情境檢查點 (FAIL-CLOSED) — 適用於所有發現 (包含新增與延用者)：**
讀取 `0.1-architecture.md` 中的部署分類與元件曝光表。
如果分類為 `LOCALHOST_DESKTOP` 或 `LOCALHOST_SERVICE`：
- 「不可」有任何發現的 `Exploitation Prerequisites` 為 `None` → 修正為 `Local Process Access` 或 `Host/OS Access`
- 「不可」有任何發現位於 `## Tier 1` → 根據前提條件降級至 T2/T3
- CVSS 向量中「不可」使用 `AV:N`，除非元件的 `Reachability = External`
針對「所有」分類：
- 每個發現的前提條件必須 ≥ 元件曝光表中的 `Min Prerequisite`
- 每個發現的層級必須 ≥ 元件曝光表中的 `Derived Tier`
- **「每個」發現的 `#### Evidence` 章節「必須」以 `**Prerequisite basis:**` 行開頭**，引用決定該前提條件的具體程式碼/組態 (例如：「ClusterIP 服務，無 Ingress — 根據曝光表為僅限內部 (Internal Only)」)。這也適用於 [Existing] 發現 — 請從目前的程式碼重新衍生。
- 前提條件「必須」僅使用標準值。⛔ 禁止使用 `Application Access` 與 `Host Access`。

針對每個舊發現，與目前程式碼進行驗證：

| 情況 | change_status | 行動 |
|-----------|---------------|--------|
| 程式碼未變更，弱點依然存在 | `still_present` | 延用，並在本文第一行標註 `> **[Existing]**` |
| 程式碼已變更且修復弱點 | `fixed` | 標註 `> **[Fixed]**`，並引用具體程式碼變更 |
| 程式碼有部分變更 | `partially_mitigated` | 標註 `> **[Partial]**`，解釋變更內容及剩餘風險 |
| 元件已完全移除 | `removed_with_component` | 標註 `> **[Removed]**` |

針對新發現：

| 情況 | change_status | 標籤 |
|-----------|---------------|-------|
| 新元件，新弱點 | `new_code` | `> **[New]**` |
| 現有元件，由程式碼變更引入弱點 | `new_in_modified` | `> **[New]**` — 引用具體變更 |
| 現有元件，弱點在舊程式碼中即存在但被遺漏 | `previously_unidentified` | `> **[New]**` — 透過基標工作區進行驗證 |

<!-- ⛔ 步驟後置檢查：寫入所有發現註釋後：
  1. 每個發現本文都以以下其中之一開頭：[Existing], [Fixed], [Partial], [New], [Removed]
  2. 標籤位於本文開頭的引言區塊 (> **[Tag]**)，而非 ### 標題中
  3. 沒有舊式標籤：[STILL PRESENT], [NEW CODE], [NEW IN MODIFIED], [PREVIOUSLY UNIDENTIFIED], [PARTIALLY MITIGATED], [REMOVED WITH COMPONENT]
  4. JSON 中的 change_status 使用詳細值 (still_present, new_code 等) 以供程式化比較 -->

**發現 ID 持續性：**
- 舊發現保留其原始 ID (FIND-01 到 FIND-N)
- 新發現接續編號：FIND-N+1, FIND-N+2, ...
- 不可有缺漏、不可重複
- 已修復的發現會保留但加上註釋 — 它們「不」會從報告中移除
- **文件順序：** 發現依層級 (1→2→3) 排序，接著依嚴重性 (Critical→Important→Moderate→Low) 排序，最後依 CVSS 遞減排序 — 與單次分析模式相同。由於保留了舊 ID，ID 編號在文件中可能「不是」按數值遞增。這在增量模式下是可以接受的 — ID 穩定性對於跨報告追蹤的優先順序高於順序排列。`### FIND-XX:` 標題將依層級/嚴重性順序出現，而非 ID 順序。

**「先前未識別 (previously-unidentified)」的驗證程序：**
1. 識別該發現的元件與證據檔案
2. 在基標提交版本讀取相同檔案：`cat {BASELINE_WORKTREE}/{file_path}`
3. 如果舊程式碼中已存在弱點模式 → `previously_unidentified`
4. 如果舊程式碼中不存在弱點模式 → `new_in_modified`

### 4f. threat-inventory.json

- **先讀取 `skeletons/skeleton-inventory.md`** — 使用確切的欄位名稱與結構

架構與單次分析相同，但增加了以下欄位：

```json
{
  "schema_version": "1.1",
  "incremental": true,
  "baseline_report": "threat-model-20260309-174425",
  "baseline_commit": "2dd84ab",
  "target_commit": "abc1234",
  
  "components": [
    {
      "id": "McpHost",
      "change_status": "unchanged",
      ...現有欄位...
    }
  ],
  
  "threats": [
    {
      "id": "T01.S",
      "change_status": "still_present",
      ...現有欄位...
    }
  ],
  
  "findings": [
    {
      "id": "FIND-01",
      "change_status": "still_present",
      ...現有欄位...
    }
  ],
  
  "metrics": {
    ...現有欄位...,
    "status_summary": {
      "components": {
        "unchanged": 15,
        "modified": 2,
        "new": 1,
        "removed": 1,
        "restructured": 0
      },
      "threats": {
        "still_present": 80,
        "fixed": 5,
        "mitigated": 3,
        "new_code": 10,
        "new_in_modified": 4,
        "previously_unidentified": 2,
        "removed_with_component": 8
      },
      "findings": {
        "still_present": 12,
        "fixed": 2,
        "partially_mitigated": 1,
        "new_code": 3,
        "new_in_modified": 2,
        "previously_unidentified": 1,
        "removed_with_component": 1
      }
    }
  }
}
```

### 4g. 0-assessment.md

- **先讀取 `skeletons/skeleton-assessment.md`** — 使用章節順序與表格結構

標準評估章節 (所有 7 個均為強制性) 加上增量特定章節：

**標準章節 (與單次分析相同)：**
1. Report Files (報告檔案)
2. Executive Summary (管理摘要，包含 `> **Note on threat counts:**` 引言)
3. Action Summary (行動摘要，包含 `### Quick Wins` 子章節)
4. Analysis Context & Assumptions (分析情境與假設，包含 `### Needs Verification` 與 `### Finding Overrides`)
5. References Consulted (參考資料)
6. Report Metadata (報告 Metadata)
7. Classification Reference (分類參照，複製自架構的靜態表格)

**新增的增量章節 (插入在「行動摘要」與「分析情境」之間)：**

```markdown
## Change Summary (變更摘要)

### Component Changes (元件變更)
| Status | Count | Components |
|--------|-------|------------|
| Unchanged | X | ComponentA, ComponentB, ... |
| Modified | Y | ComponentC, ... |
| New | Z | ComponentD, ... |
| Removed | W | ComponentE, ... |

### Threat Status (威脅狀態)
| Status | Count |
|--------|-------|
| Existing | X |
| Fixed | Y |
| New (Code) | Z |
| New (Modified) | M |
| Previously Unidentified | W |
| Removed with Component | V |

### Finding Status (發現狀態)
| Status | Count |
|--------|-------|
| Existing | X |
| Fixed | Y |
| Partially Mitigated | P |
| New (Code) | Z |
| New (Modified) | M |
| Previously Unidentified | W |
| Removed with Component | V |

### Risk Direction (風險趨勢)
[Improving / Worsening / Stable] — [根據狀態分佈進行 1-2 句話的理由說明]

---

## Previously Unidentified Issues (先前未識別的問題)

這些弱點存在於提交 `{baseline_sha}` 的基標程式碼中，但在先前的分析中未被識別：

| Finding | Title | Component | Evidence |
|---------|-------|-----------|----------|
| FIND-XX | [標題] | [元件] | 基標程式碼位於 `{file}:{line}` |
```

**Report Metadata 新增項目：**
```markdown
| Baseline Report | `{baseline_folder}` |
| Baseline Commit | `{baseline_sha}` (`{baseline_commit_date}` — 執行 `git log -1 --format="%cs" {baseline_sha}`) |
| Target Commit | `{target_sha}` (`{target_commit_date}` — 執行 `git log -1 --format="%cs" {target_sha}`) |
| Baseline Worktree | `{worktree_path}` |
| Analysis Mode | `Incremental` |
```

### 4h. incremental-comparison.html

- **先讀取 `skeletons/skeleton-incremental-html.md`** — 使用 8 區段結構與 CSS 變數

產生一個自帶 CSS 的 HTML 檔案來視覺化比較結果。所有資料均來自 `threat-inventory.json` 中已計算好的 `change_status` 欄位。

**結構：**

```html
<!-- 第 1 區段：標頭 + 比較卡片 -->
<div class="header">
  <div class="report-badge">INCREMENTAL THREAT MODEL COMPARISON</div>
  <h1>{{repo_name}}</h1>
</div>
<div class="comparison-cards">
  <div class="compare-card baseline">
    <div class="card-label">BASELINE (基標)</div>
    <div class="card-hash">{{baseline_sha}}</div>
    <div class="card-date">{{來自 git log 的 baseline_commit_date}}</div>
    <div class="risk-badge">{{old_risk_rating}}</div>
  </div>
  <div class="compare-arrow">→</div>
  <div class="compare-card target">
    <div class="card-label">TARGET (目標)</div>
    <div class="card-hash">{{target_sha}}</div>
    <div class="card-date">{{來自 git log 的 target_commit_date}}</div>
    <div class="risk-badge">{{new_risk_rating}}</div>
  </div>
  <div class="compare-card trend">
    <div class="card-label">TREND (趨勢)</div>
    <div class="trend-direction">{{Improving|Worsening|Stable}}</div>
    <div class="trend-duration">{{N 個月}}</div>
  </div>
</div>

<!-- 第 2 區段：指標列 (5 個區塊 — 不含「間隔時間」，改用「程式碼變更」) -->
<div class="metrics-bar">
  元件：{{old_count}} → {{new_count}} (±N)
  信任邊界：{{old_boundaries}} → {{new_boundaries}} (±N)
  威脅：{{old_count}} → {{new_count}} (±N)  
  發現：{{old_count}} → {{new_count}} (±N)
  程式碼變更：{{COMMIT_COUNT}} 個提交，{{PR_COUNT}} 個 PR
</div>

<!-- 第 3 區段：狀態摘要卡片 (彩色卡片 — 主要視覺化) -->
<div class="status-cards">
  <!-- 綠色卡片：Fixed (計數 + 已修復項目列表) -->
  <!-- 紅色卡片：New (code + modified) (計數 + 新項目列表) -->
  <!-- 琥珀色卡片：Previously Unidentified (計數 + 列表) -->
  <!-- 灰色卡片：Still Present (計數) -->
</div>

<!-- 第 4 區段：元件狀態網格 -->
<table class="component-grid">
  <!-- 每個元件一列：ID | Type | Status (顏色代碼) | Source Files -->
</table>

<!-- 第 5 區段：威脅/發現狀態分解 -->
<div class="status-breakdown">
  <!-- 按狀態分組：Fixed 項目、New 項目等 -->
  <!-- 每個項目：ID | Title | Component | Status -->
</div>

<!-- 第 6 區段：包含差異指標的 STRIDE 熱圖 -->
<!-- ⛔ 強制性：熱圖「必須」有 13 欄，包含分隔線後的 T1/T2/T3 -->
<table class="stride-heatmap">
  <thead>
    <tr>
      <th>Component</th>
      <th>S</th><th>T</th><th>R</th><th>I</th><th>D</th><th>E</th><th>A</th>
      <th>Total</th>
      <th class="divider"></th>
      <th>T1</th><th>T2</th><th>T3</th>
    </tr>
  </thead>
  <tbody>
    <!-- 每個元件一列。每個 STRIDE 儲存格：值 (相對於基標的 ▲+N 或 ▼-N 差異) -->
    <!-- divider 欄位是 STRIDE 總計與層級分解之間的細微視覺分隔線 -->
  </tbody>
</table>

<!-- 第 7 區段：需要驗證 -->
<div class="needs-verification">
  <!-- 分析結果與舊報告不一致的項目 -->
</div>

<!-- 第 8 區段：頁尾 -->
<div class="footer">
  模型：{{model}} | 持續時間：{{duration}}
  基標：{{baseline_folder}} 於 {{baseline_sha}}
  產生時間：{{timestamp}}
</div>
```

**樣式規則：**
- 自帶樣式：所有 CSS 必須位於行內 `<style>` 區塊中。不使用外部 CDN 連結。
- 顏色慣例：綠色 (#28a745) = 已修復，紅色 (#dc3545) = 新弱點，琥珀色 (#fd7e14) = 先前未識別，灰色 (#6c757d) = 仍存在，藍色 (#2171b5) = 已修改。
- 列印友善：包含 `@media print` 樣式。
- 使用與上述相同的 CSS 顏色慣例以保持視覺一致性。

---

## 階段 5：驗證

### 5a. 標準驗證

針對新報告執行標準的 `verification-checklist.md` (階段 0–9)。由於增量報告是獨立報告，因此必須通過所有標準品質檢查。委派給子代理程式，並提供**輸出資料夾的絕對路徑**，以便其讀取報告檔案。

### 5b. 增量驗證

在標準驗證通過後，執行來自 `experiment-history/mode-c-verification-suite.md` 的增量特定檢查 (階段 1–9，共 33 項檢查)。這些檢查驗證以下內容：
- 結構持續性 (每個舊項目都有交代)
- 經過程式碼驗證的狀態準確性 (例如：「已修復」確實經過程式碼差異驗證)
- 「先前未識別」的分類 (透過基標工作區驗證)
- DFD 一致性 (舊節點存在，新節點有區分)
- 獨立報告品質 (沒有指向舊報告的無效參照)
- 比較摘要準確性 (計數與清單相符)
- 「需要驗證」的完整性
- 邊緣案例 (合併、拆分、重寫)
- Metrics/JSON 完整性

### 5c. 修正工作流程

1. 收集所有「通過/失敗」結果。
2. 針對每個「失敗」項目 → 執行檢查項目中建議的「失敗修補」行動。
3. 針對修復後的檔案重新執行失敗的檢查，直到通過為止。
4. 嘗試 2 次修正後，若仍失敗，則將剩餘問題提升至「需要驗證」章節。
5. 記錄結束時間並產生執行摘要。

---

## ⛔ 增量分析特定規則

這些規則補充 (而非取代) `orchestrator.md` 中的 34 條強制性規則：

### 規則 I1：保留舊報告的評估判斷

當新分析欲指派與舊報告不同的 TMT 類別、元件類型、層級或威脅相關性時 → 保留舊報告的值。並在「需要驗證」中記錄不一致之處，包含：
- 舊的值
- 新分析建議的值
- 1-2 句話的理由說明
- 使用者應檢查的事項

**例外：** 針對事實性的錯誤 (檔案路徑、Git metadata、算術錯誤)，應直接修正並在「報告 Metadata」中註明。

### 規則 I2：禁止無聲覆寫

報告本文應使用「舊」報告的評估判斷值。不一致之處需放入「需要驗證」中。使用者必須明確確認任何重新分類。

### 規則 I3：「先前未識別」必須經過驗證

每個 `previously_unidentified` 分類「必須」包含來自基標工作區的證據。分析師必須實際讀取所引用檔案/行號的舊程式碼，並確認弱點模式確實存在。不可僅憑「可能一直都存在」進行猜測。

### 規則 I4：「已修復」必須經過程式碼驗證

每個 `fixed` 分類「必須」引用解決該弱點的具體程式碼變更。不接受諸如「團隊已修復此問題」之類的通用描述 — 請顯示差異 (diff)。

### 規則 I5：`new_in_modified` 需要變更歸因

每個 `new_in_modified` 發現「必須」識別引入該弱點的具體程式碼變更。引用導致該問題的 diff 區塊、新函式、新組態值或新相依性。

### 規則 I6：不要刪除基標工作區

基標工作區可能會被未來的增量分析重用。請「勿」執行 `git worktree remove`。工作區路徑應記錄在「報告 Metadata」中以供參考。

### 規則 I7：變更狀態一致性

元件的 `change_status` 必須與其威脅與發現的狀態保持一致：
- `unchanged` (未變更) 元件 → 其威脅應為 `still_present` (仍存在) (如果是新發現的，則為 `previously_unidentified`)
- `removed` (已移除) 元件 → 其所有的威脅/發現必須為 `removed_with_component`
- `modified` (已修改) 元件 → 至少要有一個威脅為 `modified`, `fixed` 或 `new_in_modified`
- `new` (新增) 元件 → 其所有的威脅必須為 `new_code`

### 規則 I8：延用而非複製

「延用」指的是重新產生一個表達相同意思的威脅/發現項目 — 「不是」逐字複製貼上舊報告文字。重新產生的項目應：
- 使用相同的 ID
- 參照目前的檔案路徑 (即使未變更)
- 以現在式描述目前的程式碼
- 包含 `[STILL PRESENT]` 註釋

---

## 摘要：階段性檢查清單

| 階段 | 行動 | 成功標準 |
|-------|--------|-----------------|
| 0 | 設定、驗證輸入、工作區 | 所有輸入存在，工作區可存取 |
| 1 | 載入舊清單架構 | 所有陣列皆有資料，指標相符 |
| 2 | 逐一元件變更偵測 | 每個元件皆有 `change_status` |
| 3 | 掃描新元件 | 識別出新元件，標記遺漏的元件 |
| 4 | 產生所有報告檔案 | 8-9 個檔案寫入輸出資料夾 |
| 5 | 驗證 (標準 + 增量) | 所有檢查皆通過，或已提升至「需要驗證」 |
