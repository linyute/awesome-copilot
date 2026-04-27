# Skeleton: 2-stride-analysis.md

> **⛔ 逐字複製下方的範本內容（不包括外部程式碼區塊）。取代 `[FILL]` 預留位置。STRIDE-A 中的「A」始終代表「Abuse」——絕非「Authorization」。**
> **⛔ Exploitability Tiers 表格必須包含且僅有 4 個欄位：`Tier | Label | Prerequisites | Assignment Rule`。請勿合併為 3 個欄位。請勿將 `Assignment Rule` 重新命名為 `Description`。**
> **⛔ Summary 表格必須包含一個 `Link` 欄位：`Component | Link | S | T | R | I | D | E | A | Total | T1 | T2 | T3 | Risk`**
> **⛔ N/A Categories 必須使用表格（`| Category | Justification |`），而非散文/專案符號。**

---

```markdown
# STRIDE + Abuse Cases — 威脅分析

> 此分析使用標準的 **STRIDE** 方法論（Spoofing 偽裝、Tampering 竄改、Repudiation 否認、Information Disclosure 資訊洩漏、Denial of Service 阻斷服務、Elevation of Privilege 權限提升），並擴展了 **Abuse Cases**（業務邏輯濫用、工作流操縱、功能誤用）。下表中的「A」欄代表 Abuse（濫用）——這是一個補充類別，涵蓋了合法功能被誤用於非預期目的的威脅。這與權限提升 (E) 不同，後者涵蓋了授權繞過。

## Exploitability Tiers

根據攻擊者需要的前置條件，威脅分為三個可利用性層級：

| Tier | Label | Prerequisites | Assignment Rule |
|------|-------|---------------|----------------|
| **Tier 1** | 直接暴露 | `None` | 可被未經身分驗證的外部攻擊者利用，且無需事先存取。前置條件欄位必須填寫 `None`。 |
| **Tier 2** | 有條件風險 | 單一前置條件：`Authenticated User`、`Privileged User`、`Internal Network` 或單一 `{Boundary} Access` | 需要且僅需一種形式的存取權。前置條件欄位有一個項目。 |
| **Tier 3** | 縱深防禦 | `Host/OS Access`、`Admin Credentials`、`{Component} Compromise`、`Physical Access` 或使用 `+` 連接的多個前置條件 | 需要事先發生重大入侵、基礎架構存取權或多個組合的前置條件。 |

<!-- ⛔ 表格後檢查：確認此表格包含且僅有 4 個欄位 (Tier|Label|Prerequisites|Assignment Rule)。如果您寫了 3 個欄位或將第 4 個欄位命名為 'Description' 或 'Example' → 請在繼續之前立即修正。 -->

## Summary

| Component | Link | S | T | R | I | D | E | A | Total | T1 | T2 | T3 | Risk |
|-----------|------|---|---|---|---|---|---|---|-------|----|----|----|------|
[重複：每個元件一行 —— 數值化的 STRIDE 計數，0 為有效值，需附帶 N/A 理由]
| [FILL: ComponentName] | [Link](#[FILL: anchor]) | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL: sum] | [FILL] | [FILL] | [FILL] | [FILL: Low/Medium/High/Critical] |
[結束重複]
| **Totals** | | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | **[FILL]** | |

<!-- ⛔ 表格後檢查：確認此摘要 (Summary) 表格：
  1. 包含 14 個欄位：Component | Link | S | T | R | I | D | E | A | Total | T1 | T2 | T3 | Risk
  2. 第 2 欄是獨立的 'Link' 欄位，具有 `[Link](#anchor)` 值 —— 請勿將連結嵌入到 Component 欄位中
  3. 每一行的 S+T+R+I+D+E+A = Total
  4. 每一行的 T1+T2+T3 = Total
  5. 沒有任何一行的每個 STRIDE 欄位皆為 1（若是如此，分析過於淺層）
  6. 'A' 欄位標題代表 'Abuse' 而非 'Authorization'
  如果任何檢查失敗 → 請在撰寫元件章節之前立即修正。 -->

---

[重複：每個元件一個章節 —— 請勿包含外部參與者 (Operator, EndUser) 的章節]

## [FILL: ComponentName]

**信任邊界 (Trust Boundary)：** [FILL: boundary name]
**角色：** [FILL: 簡短描述]
**資料流 (Data Flows)：** [FILL: DF##, DF##, ...]
**Pod 共置 (Pod Co-location)：** [FILL: 若為 K8s 則為 sidecars，若非 K8s 則為 "N/A"]

### STRIDE-A Analysis

#### Tier 1 — 直接暴露 (無前置條件)

| ID | Category | Threat | Prerequisites | Affected Flow | Mitigation | Status |
|----|----------|--------|---------------|---------------|------------|--------|
[重複：威脅行或 "*未識別到 Tier 1 威脅。*"]
| [FILL: T##.X] | [FILL: Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation of Privilege/Abuse] | [FILL] | [FILL] | [FILL: DF##] | [FILL] | [FILL: Open/Mitigated/Platform] |
[結束重複]

#### Tier 2 — 有條件風險

| ID | Category | Threat | Prerequisites | Affected Flow | Mitigation | Status |
|----|----------|--------|---------------|---------------|------------|--------|
[重複：威脅行或 "*未識別到 Tier 2 威脅。*"]
| [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |
[結束重複]

#### Tier 3 — 縱深防禦

| ID | Category | Threat | Prerequisites | Affected Flow | Mitigation | Status |
|----|----------|--------|---------------|---------------|------------|--------|
[重複：威脅行或 "*未識別到 Tier 3 威脅。*"]
| [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |
[結束重複]

#### 類別不適用 (Categories Not Applicable)

| Category | Justification |
|----------|---------------|
[重複：每個不適用的 STRIDE 類別一行 —— A 類別使用 "Abuse" 而非 "Authorization"]
| [FILL: Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation of Privilege/Abuse] | [FILL: 一句話的理由] |
[結束重複]

<!-- ⛔ 元件後檢查：確認此元件：
  1. Category 欄位使用全名（而非 'S', 'T', 'DoS' 等縮寫）
  2. 'A' 類別為 'Abuse'（絕非 'Authorization'）
  3. Status 欄位僅限使用：Open, Mitigated, Platform
  4. 包含所有 3 個層級子章節（即使為空且顯示為 '*未識別到 Tier N 威脅*'）
  5. 任何沒有威脅的 STRIDE 類別皆有對應的 N/A 表格
  如果任何檢查失敗 → 請在移動到下一個元件之前立即修正。 -->

[結束重複]
```

**STRIDE + Abuse Cases — 這 7 個類別確切為：**
Spoofing | Tampering | Repudiation | Information Disclosure | Denial of Service | Elevation of Privilege | Abuse

**注意：** 前 6 個是標準 STRIDE。「Abuse」是業務邏輯誤用（工作流操縱、功能利用、API 濫用）的補充類別。它**不是**「Authorization（授權）」——授權問題屬於權限提升 (E)。

**有效的狀態 (Status) 值：** `Open` | `Mitigated` | `Platform` —— 不允許使用其他值。
