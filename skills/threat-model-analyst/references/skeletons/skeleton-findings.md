# 骨幹: 3-findings.md

> **⛔ 請逐字複製下方的範本內容 (不含外部程式碼區塊)。替換 `[FILL]` 預留位置。每個發現項都必須包含全部 10 個屬性列。請依層級 (TIER) 而非嚴重性進行組織。**
> **⛔ 請勿縮寫屬性名稱。使用精確名稱：`SDL Bugbar Severity` (而非 `Severity`)、`Exploitation Prerequisites` (而非 `Prerequisites`)、`Exploitability Tier` (而非 `Tier`)、`Remediation Effort` (而非 `Effort`)、`CVSS 4.0` (而非 `CVSS Score`)。**
> **⛔ 請勿使用粗體行內標題 (`**描述:**`)。請使用 `#### Description` Markdown h4 標題。**
> **⛔ 層級區段標題必須為：`## Tier 1 — Direct Exposure (No Prerequisites)`，而非 `## Tier 1 Findings`。**

---

```markdown
# 安全發現項

---

## Tier 1 — Direct Exposure (No Prerequisites)

[重複：每個 Tier 1 發現項一個發現項區塊，依嚴重性 (Critical→Important→Moderate→Low) 排序，然後依 CVSS 降序排序]

### FIND-[FILL: NN]: [FILL: 標題]

| 屬性 | 值 |
|-----------|-------|
| SDL Bugbar Severity | [FILL: Critical / Important / Moderate / Low] |
| CVSS 4.0 | [FILL: N.N] (CVSS:4.0/[FILL: 以 AV: 開頭的完整向量]) |
| CWE | [CWE-[FILL: NNN]](https://cwe.mitre.org/data/definitions/[FILL: NNN].html): [FILL: 弱點名稱] |
| OWASP | A[FILL: NN]:2025 – [FILL: 類別名稱] |
| Exploitation Prerequisites | [FILL: 文字或 "None"] |
| Exploitability Tier | Tier [FILL: 1/2/3] — [FILL: 層級描述] |
| Remediation Effort | [FILL: Low / Medium / High] |
| Mitigation Type | [FILL: Redesign / Standard Mitigation / Custom Mitigation / Existing Control / Accept Risk / Transfer Risk] |
| Component | [FILL: 元件名稱] |
| Related Threats | [T[FILL: NN].[FILL: X]](2-stride-analysis.md#[FILL: component-anchor]), [T[FILL: NN].[FILL: X]](2-stride-analysis.md#[FILL: component-anchor]) |

<!-- ⛔ 發現項後檢查：立即驗證此發現項：
  1. 出現所有 10 個屬性列 (從 SDL Bugbar Severity 到 Related Threats)
  2. 列名稱精確：'SDL Bugbar Severity' (而非 'SDL Bugbar')、'Exploitation Prerequisites' (而非 'Prerequisites')、'Exploitability Tier' (而非 'Risk Tier')、'Remediation Effort' (而非 'Effort')
  3. 相關威脅是帶有 `](2-stride-analysis.md#` 的超連結 — 而非像 'T01.S, T02.T' 這樣的純文字
  4. CVSS 以 `CVSS:4.0/` 開頭 — 而非裸向量
  5. CWE 是指向 cwe.mitre.org 的超連結 — 而非純文字
  6. OWASP 使用 `:2025` 字尾 — 而非 `:2021`
  如果任何檢查失敗 → 在撰寫下一個發現項之前，立即修正此發現項。 -->

#### Description

[FILL-PROSE: 弱點的技術描述]

#### Evidence

**前置條件依據：** [FILL: 引用決定此發現項前置條件的特定程式碼/組態 — 例如，"僅綁定到 127.0.0.1 (src/Server.cs:42)"、"/api 路由上沒有驗證中介軟體 (Startup.cs:18)"、"沒有網路監聽器的主控台應用程式 (Program.cs)"。這必須與 0.1-architecture.md 中的元件暴露表相符。]

[FILL: 特定檔案路徑、行號、組態金鑰、程式碼片段]

#### Remediation

[FILL: 可執行的修復步驟]

#### Verification

[FILL: 如何驗證修復已套用]

<!-- ⛔ 區段後檢查：驗證此發現項的子區段：
  1. 精確出現 4 個子標題：`#### Description`, `#### Evidence`, `#### Remediation`, `#### Verification`
  2. 子標題使用 `####` 層級 (而非粗體 `**描述:**` 行內文字)
  3. 沒有額外的子標題，例如 `#### Impact`, `#### Recommendation`, `#### Mitigation`
  4. 描述至少有 2 句技術細節
  5. 證據引用特定檔案路徑或行號 (而非泛稱)
  如果任何檢查失敗 → 在移動到下一個發現項之前立即修正。 -->

[結束重複]
[條件空白：如果沒有 Tier 1 發現項，請包含此行而非重複區塊]
*此儲存庫未識別出 Tier 1 發現項。*
[結束條件空白]

---

## Tier 2 — Conditional Risk (Authenticated / Single Prerequisite)

[重複：與 Tier 1 相同的發現項區塊結構，以相同方式排序]

### FIND-[FILL: NN]: [FILL: 標題]

| 屬性 | 值 |
|-----------|-------|
| SDL Bugbar Severity | [FILL] |
| CVSS 4.0 | [FILL] (CVSS:4.0/[FILL]) |
| CWE | [CWE-[FILL]](https://cwe.mitre.org/data/definitions/[FILL].html): [FILL] |
| OWASP | A[FILL]:2025 – [FILL] |
| Exploitation Prerequisites | [FILL] |
| Exploitability Tier | Tier [FILL] — [FILL] |
| Remediation Effort | [FILL] |
| Mitigation Type | [FILL] |
| Component | [FILL] |
| Related Threats | [FILL] |

#### Description

[FILL-PROSE]

#### Evidence

**前置條件依據：** [FILL: 引用決定此發現項前置條件的特定程式碼/組態 — 必須與 0.1-architecture.md 中的元件暴露表相符]

[FILL]

#### Remediation

[FILL]

#### Verification

[FILL]

[結束重複]
[條件空白：如果沒有 Tier 2 發現項，請包含此行而非重複區塊]
*此儲存庫未識別出 Tier 2 發現項。*
[結束條件空白]

---

## Tier 3 — Defense-in-Depth (Prior Compromise / Host Access)

[重複：相同的發現項區塊結構]

### FIND-[FILL: NN]: [FILL: 標題]

| 屬性 | 值 |
|-----------|-------|
| SDL Bugbar Severity | [FILL] |
| CVSS 4.0 | [FILL] (CVSS:4.0/[FILL]) |
| CWE | [CWE-[FILL]](https://cwe.mitre.org/data/definitions/[FILL].html): [FILL] |
| OWASP | A[FILL]:2025 – [FILL] |
| Exploitation Prerequisites | [FILL] |
| Exploitability Tier | Tier [FILL] — [FILL] |
| Remediation Effort | [FILL] |
| Mitigation Type | [FILL] |
| Component | [FILL] |
| Related Threats | [FILL] |

#### Description

[FILL-PROSE]

#### Evidence

**前置條件依據：** [FILL: 引用決定此發現項前置條件的特定程式碼/組態 — 必須與 0.1-architecture.md 中的元件暴露表相符]

[FILL]

#### Remediation

[FILL]

#### Verification

[FILL]

[結束重複]
[條件空白：如果沒有 Tier 3 發現項，請包含此行而非重複區塊]
*此儲存庫未識別出 Tier 3 發現項。*
[結束條件空白]
```

在 `3-findings.md` 的末尾，附加威脅涵蓋範圍驗證表：

```markdown
---

## 威脅涵蓋範圍驗證 (Threat Coverage Verification)

| 威脅 ID | 發現項 ID | 狀態 |
|-----------|------------|--------|
[重複：2-stride-analysis.md 中所有元件的威脅，每列一個威脅]
| [FILL: T##.X] | [FILL: FIND-## 或 —] | [FILL: ✅ 已涵蓋 (FIND-XX) / ✅ 已緩解 (FIND-XX) / 🔄 由平台緩解] |
[結束重複]

<!-- ⛔ 表格後檢查：驗證威脅涵蓋範圍驗證：
  1. 狀態列僅使用這 3 個帶有表情符號字首的值：
     - `✅ 已涵蓋 (FIND-XX)` — 弱點需要修復
     - `✅ 已緩解 (FIND-XX)` — 團隊建立了控制措施 (記錄在發現項中)
     - `🔄 由平台緩解` — 外部平台處理它
  2. 請勿使用不帶表情符號的純文字，如 "Finding", "Mitigated", "Covered"
  3. 請勿使用 "Needs Review", "Accepted Risk" 或 "N/A"
  4. 欄位標頭精確為：`Threat ID | Finding ID | Status` (而非 `Threat | Finding | Status`)
  5. 2-stride-analysis.md 中的每個威脅都出現在此表格中 (無缺失威脅)
  如果任何檢查失敗 → 立即修正。 -->
```

**烘焙到此骨幹中的固定規則：**
- 發現項 ID：`FIND-` 字首 (絕非 `F-`, `F01`, `Finding`)
- 屬性名稱：`SDL Bugbar Severity`, `Exploitation Prerequisites`, `Exploitability Tier`, `Remediation Effort` (精確 — 不縮寫)
- CVSS：以 `CVSS:4.0/` 開頭 (絕非裸向量)
- CWE：超連結 (絕非純文字)
- OWASP：`:2025` 字尾 (絕非 `:2021`)
- 相關威脅：個別超連結 (絕非純文字)
- 子區段：`#### Description`, `#### Evidence`, `#### Remediation`, `#### Verification`
- 依層級 (TIER) 組織 — 沒有 `## Critical Findings` 或 `## Mitigated` 區段
- 精確 3 個層級區段 (全部為必填，即使使用 "*此儲存庫未識別出 Tier N 發現項。*" 而留空)
