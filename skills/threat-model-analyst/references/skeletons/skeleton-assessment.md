# Skeleton: 0-assessment.md

> **⛔ 逐字複製下方的範本內容（不包括外部程式碼區塊）。取代 `[FILL]` 預留位置。切勿新增/重新命名/重新排序章節。**
> `[FILL]` = 單一值 | `[FILL-PROSE]` = 段落 | `[REPEAT]...[END-REPEAT]` = N 個複本 | `[CONDITIONAL]...[END-CONDITIONAL]` = 若符合條件則包含

---

```markdown
# 安全性評估

---

## 報告檔案

| File | Description |
|------|-------------|
| [0-assessment.md](0-assessment.md) | 此文件 — 執行摘要、風險評等、行動計畫、Metadata |
| [0.1-architecture.md](0.1-architecture.md) | 架構總覽、元件、案例、技術棧 |
| [1-threatmodel.md](1-threatmodel.md) | 威脅模型 DFD 圖，包含元件、流程與邊界表格 |
| [1.1-threatmodel.mmd](1.1-threatmodel.mmd) | 純 Mermaid DFD 原始檔 |
| [2-stride-analysis.md](2-stride-analysis.md) | 所有元件的完整 STRIDE-A 分析 |
| [3-findings.md](3-findings.md) | 已排序優先順序的安全性發現與補救措施 |
[CONDITIONAL: 若產生了 1.2-threatmodel-summary.mmd 則包含]
| [1.2-threatmodel-summary.mmd](1.2-threatmodel-summary.mmd) | 大型系統的摘要 DFD |
[END-CONDITIONAL]
[CONDITIONAL: 包含於增量分析]
| [incremental-comparison.html](incremental-comparison.html) | 視覺化比較報告 |
[END-CONDITIONAL]

<!-- ⛔ 表格後檢查：驗證報告檔案：
  1. `0-assessment.md` 為第一行（非 0.1-architecture.md）
  2. 列出所有產生的檔案
  3. 僅在該檔案存在時，才顯示條件列（1.2-threatmodel-summary.mmd, incremental-comparison.html）
  若有任何檢查失敗 → 立即修正。 -->

---

## 執行摘要

[FILL-PROSE: 2-3 段關於系統及其安全性狀況的摘要]

[FILL: "此分析涵蓋了跨 [M] 個信任邊界的 [N] 個系統元件。"]

### 風險評等：[FILL: Critical / Elevated / Moderate / Low]

[FILL-PROSE: 風險評等理由段落]

> **關於威脅數量的說明：** 此分析在 [FILL: M] 個元件中識別出 [FILL: N] 個威脅。此計數反映了全面的 STRIDE-A 涵蓋範圍，而非系統性的不安全性。其中，**[FILL: T1 count] 個可被直接利用**且無先決條件（第 1 層級）。其餘 [FILL: T2+T3 count] 個代表有條件的風險和深度防禦考量。

<!-- ⛔ 章節後檢查：驗證執行摘要：
  1. 風險評等標題中沒有表情符號：`### 風險評等：Elevated` 而非 `### 風險評等：🟠 Elevated`
  2. 關於威脅數量的說明區塊引言已存在
  3. 元件數量和邊界數量與 1-threatmodel.md 中的實際數量相符
  若有任何檢查失敗 → 立即修正。 -->

---

## 行動摘要

| Tier | Description | Threats | Findings | Priority |
|------|-------------|---------|----------|----------|
| [Tier 1](3-findings.md#tier-1--direct-exposure-no-prerequisites) | 可直接利用 | [FILL] | [FILL] | 🔴 關鍵風險 |
| [Tier 2](3-findings.md#tier-2--conditional-risk-authenticated--single-prerequisite) | 需要經過身分驗證的存取 | [FILL] | [FILL] | 🟠 高風險 |
| [Tier 3](3-findings.md#tier-3--defense-in-depth-prior-compromise--host-access) | 需要事先遭到入侵 | [FILL] | [FILL] | 🟡 中度風險 |
| **總計** | | **[FILL]** | **[FILL]** | |

<!-- ⛔ 表格後檢查：驗證行動摘要：
  1. 精確為 4 個資料列：Tier 1, Tier 2, Tier 3, Total — 不得有 'Mitigated'、'Platform' 或 'Fixed' 列
  2. Priority 欄位為固定值：Tier 1=🔴 關鍵風險, Tier 2=🟠 高風險, Tier 3=🟡 中度風險 — 絕不因計數而改變
  3. Threats 欄位總和與 2-stride-analysis.md 的 Totals 列相符
  4. Findings 欄位總和與 3-findings.md 的 FIND- 標題計數相符
  5. Tier 1/2/3 儲存格為指向 3-findings.md 層級標題的超連結 — 驗證錨點是否有效
  若有任何檢查失敗 → 在繼續之前立即修正。 -->

### 按層級與 CVSS 分數排序的優先順序（前 10 名）

| Finding | Tier | CVSS Score | SDL Severity | Title |
|---------|------|------------|-------------|-------|
[REPEAT: 僅前 10 個發現，按層級排序（T1 優先，其次 T2，最後 T3），然後在每個層級內按 CVSS 分數降序排序]
| [FIND-XX](3-findings.md#find-xx-title-slug) | T[FILL] | [FILL] | [FILL] | [FILL] |
[END-REPEAT]

<!-- ⛔ 表格後檢查：驗證按層級與 CVSS 分數排序的優先順序：
  1. 最多 10 列（僅前 10 個發現，非所有發現）
  2. 排序順序：所有 Tier 1 發現優先（依 CVSS 降序），接著是 Tier 2（依 CVSS 降序），最後是 Tier 3（依 CVSS 降序）
  3. 每個 Finding 儲存格均為超連結：[FIND-XX](3-findings.md#find-xx-title-slug)
  4. 驗證每個超連結錨點是否有效：從 3-findings.md 中的實際標題文字計算錨點（小寫、空格改為連字號、去除特殊字元）。連結必須與標題一致。
  5. CVSS 分數與 3-findings.md 中該發現的實際 CVSS 值相符
  若有任何檢查失敗 → 立即修正。 -->

### 快速修復 (Quick Wins)

<!-- 快速修復 Finding 欄位：每個 Finding 儲存格必須為指向 3-findings.md 的超連結，格式與優先順序表格相同：
  [FIND-XX](3-findings.md#find-xx-title-slug)
  從 3-findings.md 中的實際標題文字計算錨點。 -->

| Finding | Title | Why Quick |
|---------|-------|-----------|
[REPEAT]
| [FIND-XX](3-findings.md#find-xx-title-slug) | [FILL] | [FILL] |
[END-REPEAT]

---

[CONDITIONAL: 僅包含於增量分析]

## 變更摘要

### 元件變更
| Status | Count | Components |
|--------|-------|------------|
| 未變更 | [FILL] | [FILL] |
| 已修改 | [FILL] | [FILL] |
| 新增 | [FILL] | [FILL] |
| 已移除 | [FILL] | [FILL] |

### 威脅狀態
| Status | Count |
|--------|-------|
| 現有 | [FILL] |
| 已修復 | [FILL] |
| 新增 | [FILL] |
| 已移除 | [FILL] |

### 發現狀態
| Status | Count |
|--------|-------|
| 現有 | [FILL] |
| 已修復 | [FILL] |
| 部分修復 | [FILL] |
| 新增 | [FILL] |
| 已移除 | [FILL] |

### 風險走向

[FILL: Improving / Worsening / Stable] — [FILL-PROSE: 1-2 句理由]

---

## 先前未識別的問題

[FILL-PROSE: 或 "未發現先前未識別的問題。"]

| Finding | Title | Component | Evidence |
|---------|-------|-----------|----------|
[REPEAT]
| [FILL] | [FILL] | [FILL] | [FILL] |
[END-REPEAT]

[END-CONDITIONAL]

---

## 分析情境與假設

### 分析範圍
| Constraint | Description |
|------------|-------------|
| 範圍 | [FILL] |
| 排除 | [FILL] |
| 重點區域 | [FILL] |

### 基礎設施情境
| Category | Discovered from Codebase | Findings Affected |
|----------|--------------------------|-------------------|
[REPEAT]
| [FILL] | [FILL: 包含相對檔案連結] | [FILL] |
[END-REPEAT]

### 待驗證事項
| Item | Question | What to Check | Why Uncertain |
|------|----------|---------------|---------------|
[REPEAT]
| [FILL] | [FILL] | [FILL] | [FILL] |
[END-REPEAT]

### 發現覆寫
| Finding ID | Original Severity | Override | Justification | New Status |
|------------|-------------------|----------|---------------|------------|
| — | — | — | 未套用任何覆寫。請在檢閱後更新此章節。 | — |

### 補充說明

[FILL-PROSE: 或 "無補充說明。"]

---

## 參考資料

### 安全性標準
| Standard | URL | How Used |
|----------|-----|----------|
| Microsoft SDL Bug Bar | https://www.microsoft.com/en-us/msrc/sdlbugbar | 嚴重性分類 |
| OWASP Top 10:2025 | https://owasp.org/Top10/2025/ | 威脅類別 |
| CVSS 4.0 | https://www.first.org/cvss/v4.0/specification-document | 風險評分 |
| CWE | https://cwe.mitre.org/ | 弱點分類 |
| STRIDE | https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats | 威脅列舉 |
[REPEAT: 若有使用額外標準則包含]
| [FILL] | [FILL] | [FILL] |
[END-REPEAT]

### 元件文件
| Component | Documentation URL | Relevant Section |
|-----------|------------------|------------------|
[REPEAT]
| [FILL] | [FILL] | [FILL] |
[END-REPEAT]

---

## 報告 Metadata

| Field | Value |
|-------|-------|
| 原始位置 | `[FILL]` |
| Git 儲存庫 | `[FILL]` |
| Git 分支 | `[FILL]` |
| Git 提交 | `[FILL: 來自 git rev-parse --short HEAD 的 SHA]` (`[FILL: 來自 git log -1 --format="%ai" 的日期 — 非今日日期]`) |
| 模型 | `[FILL]` |
| 機器名稱 | `[FILL]` |
| 分析開始時間 | `[FILL]` |
| 分析完成時間 | `[FILL]` |
| 持續時間 | `[FILL]` |
| 輸出資料夾 | `[FILL]` |
| 提示詞 | `[FILL: 觸發此分析的使用者提示文字]` |
[CONDITIONAL: 增量分析]
| 基準報告 | `[FILL]` |
| 基準提交 | `[FILL: SHA]` (`[FILL: 提交日期]`) |
| 目標提交 | `[FILL: SHA]` (`[FILL: 提交日期]`) |
| 基準工作目錄 | `[FILL]` |
| 分析模式 | `Incremental` |
[END-CONDITIONAL]

<!-- ⛔ 表格後檢查：驗證報告 Metadata：
  1. 所有值均以反引號括起來：`value`
  2. Git 提交、基準提交、目標提交各包含括號內的日期
  3. 持續時間欄位已存在（未缺失）
  4. 模型欄位說明實際的模型名稱
  5. 分析開始時間與分析完成時間為真實的時間戳記（非從資料夾名稱估算）
  若有任何檢查失敗 → 立即修正。 -->

---

## 分類參考

<!-- SKELETON INSTRUCTION: 逐字複製下表。切勿修改其值。切勿將此 HTML 註釋複製到輸出中。 -->

| Classification | Values |
|---------------|--------|
| **利用層級 (Exploitability Tiers)** | **T1** 直接暴露（無先決條件） · **T2** 有條件風險（單一先決條件） · **T3** 深度防禦（多個先決條件或基礎設施存取權限） |
| **STRIDE + Abuse** | **S** 偽造 (Spoofing) · **T** 篡改 (Tampering) · **R** 否認 (Repudiation) · **I** 資訊洩漏 (Information Disclosure) · **D** 阻斷服務 (Denial of Service) · **E** 特權提升 (Elevation of Privilege) · **A** 濫用 (Abuse)（功能誤用） |
| **SDL 嚴重性** | `Critical` · `Important` · `Moderate` · `Low` |
| **補救心力** | `Low` · `Medium` · `High` |
| **緩解類型** | `Redesign` (重新設計) · `Standard Mitigation` (標準緩解) · `Custom Mitigation` (自訂緩解) · `Existing Control` (現有控制) · `Accept Risk` (接受風險) · `Transfer Risk` (轉移風險) |
| **威脅狀態** | `Open` · `Mitigated` · `Platform` |
| **增量標籤** | `[Existing]` · `[Fixed]` · `[Partial]` · `[New]` · `[Removed]`（僅限增量報告） |
| **CVSS** | 帶有 `CVSS:4.0/` 前綴的 CVSS 4.0 向量 |
| **CWE** | 帶有超連結的 CWE ID（例如 [CWE-306](https://cwe.mitre.org/data/definitions/306.html)） |
| **OWASP** | OWASP Top 10:2025 對應（例如 A01:2025 – Broken Access Control） |
```

**此骨架中內嵌的關鍵格式規則：**
- `0-assessment.md` 是報告檔案中的第一列（非 `0.1-architecture.md`）
- `## 分析情境與假設` 使用 `&`（絕不使用單字 "and"）
- 每對 `## ` 章節之間都有 `---` 水平線（至少 6 條）
- `### 快速修復 (Quick Wins)` 始終存在（若無低心力的發現，則附上備用說明）
- `### 待驗證事項` 和 `### 發現覆寫` 始終存在（即使為空且顯示為 `—`）
- 參考資料具有兩個子章節與三欄表格（絕非扁平的兩欄）
- 所有 Metadata 值均以反引號括起來
- 所有 Metadata 欄位均已存在（模型、分析開始時間、分析完成時間、持續時間）
- 風險評等標題中沒有表情符號
- 行動摘要精確具有 4 個資料列：Tier 1, Tier 2, Tier 3, Total — 不得有 "Mitigated" 或 "Platform" 列
- Git 提交列包含括號內的提交日期：`SHA` (`date`)
