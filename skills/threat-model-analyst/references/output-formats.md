# 輸出格式 — 報告檔案範本

⛔ **自我修正指令：** 在使用本文件中的範本寫入任何檔案後，請立即執行底部的自我檢查區段。你對協調器 (orchestrator) 的回應必須包含填寫完整的檢查清單，並為每個項目標記 ✅/❌。如果有任何項目為 ❌，請在進行下一步之前修正該檔案。

本檔案定義了威脅模型分析師產生的每個輸出檔案的結構與內容。每個區段都是獨立的，包含範本、規則與驗證檢查清單。

**圖表慣例**位於獨立檔案：[diagram-conventions.md](./diagram-conventions.md)
**分析方法論**位於獨立檔案：[analysis-principles.md](./analysis-principles.md)

---

## 輸出資料夾

在分析開始時建立一個帶有時間戳記的資料夾：
- 格式：`threat-model-YYYYMMDD-HHmmss` (UTC 時間)
- 範例：`threat-model-20260130-073845`
- 將所有輸出檔案寫入此資料夾

---

## 檔案內容格式化 — 關鍵規則

**切勿將 .md 檔案內容包裹在程式碼圍欄 (code fences) 中。** 當使用 `create_file` 或 `edit_file` 時：
- 工具會將原始內容寫入磁碟。如果你在開始處包含 ` ```markdown `，它會變成檔案中的字面文字。
- **錯誤**：內容以 ` ```markdown ` 開頭 — 檔案將包含圍欄作為字面文字
- **正確**：內容從第 1 行直接以 `# 標題` 開始
- 這適用於所有 .md 檔案：`0.1-architecture.md`、`0-assessment.md`、`1-threatmodel.md`、`2-stride-analysis.md`、`3-findings.md`

**切勿將 .mmd 檔案內容包裹在程式碼圍欄中。** `.mmd` 檔案是原始 Mermaid 原始碼：
- **錯誤**：內容以 ` ```plaintext ` 或 ` ```mermaid ` 開頭
- **正確**：內容從第 1 行以 `%%{init:` 開始，接著第 2 行為 `flowchart` 或 `graph`

**每次檔案寫入前的自我檢查：** 查看內容的第一個字元。如果是 ` ``` ` — 請停止並移除圍欄。

---

## 檔案列表

| 檔案 | 描述 | 總是包含？ |
|------|-------------|---------|
| `0-assessment.md` | 執行摘要、風險評等、行動方案、Metadata | 是 |
| `0.1-architecture.md` | 架構概觀、元件、案例、技術堆疊 | 是 |
| `1-threatmodel.md` | 威脅模型資料流圖 (DFD) + 元件/流程/邊界表格 | 是 |
| `1.1-threatmodel.mmd` | 純 Mermaid 資料流圖 (詳細圖表的單一事實來源) | 是 |
| `1.2-threatmodel-summary.mmd` | 摘要資料流圖 (僅當元件 >15 或邊界 >4 時) | 有條件 |
| `2-stride-analysis.md` | 所有元件的完整 STRIDE-A 分析 | 是 |
| `3-findings.md` | 帶有修補建議的優先排序安全性發現 | 是 |
| `threat-inventory.json` | 用於比較比對的結構化 JSON 清單 | 是 |
| `incremental-comparison.html` | 視覺化 HTML 比較報告 (僅限增量模式) | 有條件 |

---

## 0.1-architecture.md

**用途：** 高階架構概觀 — 在威脅模型分析開始前優先產生。

**產生時機：** 每次執行。非有條件。

**圖表：** 所有圖表皆為 Markdown 中的內嵌 Mermaid。`0.1-architecture.md` 無需獨立的 `.mmd` 檔案。

### 內容結構

```markdown
# 架構概觀

## 系統目的
<!-- 2-4 個句子：這是什麼系統？它解決了什麼問題？使用者是誰？ -->

## 關鍵元件
| 元件 | 類型 | 描述 |
|-----------|------|-------------|
| [名稱] | [程序 / 資料儲存區 / 外部服務 / 外部互動者] | [單行角色描述] |

## 元件圖
<!-- 使用服務/外部/資料儲存區類別定義 (classDef) 的架構圖 (非資料流圖圓圈)。樣式請參閱 diagram-conventions.md。 -->

## 主要案例
<!-- 3-5 個最重要的工作流程。前 3 個必須包含循序圖。 -->

### 案例 1：[名稱]
[2-3 個句子的描述]
<!-- 此處放置 Mermaid 循序圖 (sequenceDiagram) -->

### 案例 2：[名稱]
### 案例 3：[名稱]

## 技術堆疊
| 層級 | 技術 |
|-------|--------------|
| 語言 | ... |
| 框架 | ... |
| 資料儲存區 | ... |
| 基礎設施 | ... |
| 安全性 | ... |

## 佈署模型
<!-- 如何佈署？地端、雲端、混合雲？容器、虛擬機器？ -->

## 安全基礎設施清單
| 元件 | 安全角色 | 組態 | 備註 |
|-----------|---------------|---------------|-------|
| [例如：MISE Sidecar] | [例如：驗證代理 (Authentication proxy)] | [例如：Entra ID OIDC] | [例如：所有 API pod] |

## 儲存庫結構
| 目錄 | 用途 |
|-----------|---------|
| [路徑/] | [內容] |
```

### 處理規則

1. 在建立威脅模型圖**之前**產生
2. 所有內容皆源自程式碼分析 — 請勿臆測
3. 若無法判斷某個區段，請明確說明
4. 目標：最少 **150-250 行**。先前的迭代僅產生 100-150 行，內容過於單薄。請包含詳細的元件描述、連接埠/通訊協定資訊，以及實質的案例敘述。
5. 關鍵元件表格應與威脅模型圖元素一致
6. 使用**架構**圖樣式 (非資料流圖) — 參閱 `diagram-conventions.md`
7. 寫入後，驗證每個 Mermaid 區塊的語法是否有效
8. **主要案例**：前 3 個案例必須包含 Mermaid `sequenceDiagram` 區塊以顯示互動流程。每個循序圖應顯示實際的參與者、帶有通訊協定細節的訊息，以及錯誤路徑的 alt/opt 區塊。
9. **元件一致性**：關鍵元件中列出的每個元件，稍後必須作為 `2-stride-analysis.md` 中的一個區段出現
10. **佈署模型**：必須包含具體細節：連接埠、通訊協定、繫結位址、網路暴露情形，以及佈署拓樸 (單機 / 叢集 / 多層級)
11. **安全基礎設施清單**：填入在程式碼中發現的「每個」與安全相關的元件 (驗證、加密、存取控制、記錄、密碼管理)

---

## 1-threatmodel.md + 1.1-threatmodel.mmd

**用途：** 以資料流圖 (DFD) 呈現的系統威脅模型。

### 產生步驟

**步驟 1：** 建立 `1.1-threatmodel.mmd` (事實來源)
- 純 Mermaid 程式碼，不含 markdown 包裝器
- 使用 `diagram-conventions.md` 中的 DFD 形狀與樣式

**步驟 2：** 執行 `orchestrator.md` 第 4 步中的 POST-DFD GATE，以評估並在達到門檻值時建立 `1.2-threatmodel-summary.mmd`。範本請參閱 `skeletons/skeleton-summary-dfd.md`。

**步驟 3：** 建立 `1-threatmodel.md` (如果產生了摘要，請包含「摘要檢視」區段)

### 1-threatmodel.md 內容

```markdown
# 威脅模型

## 資料流圖
<!-- 從 1.1-threatmodel.mmd 複製正確的圖表，並以 ```mermaid 圍欄包裝 -->

## 元件表
| 元件 | 類型 | TMT 類別 | 描述 | 信任邊界 |
|---------|------|--------------|-------------|----------------|

- **類型** = 高階 DFD 類別：`Process` (程序)、`External Interactor` (外部互動者) 或 `Data Store` (資料儲存)
- **TMT 類別** = 來自 tmt-element-taxonomy.md §1 的特定 TMT ID (例如 `SE.P.TMCore.WebSvc`、`SE.EI.TMCore.Browser`、`SE.DS.TMCore.SQL`)
- 對於執行 sidecar 的 Kubernetes 應用程式 (Pod)，請加入選填的 **並列 Sidecar (Co-located Sidecars)** 欄位 (例如 `MISE, Dapr` 或 `—`)

## 資料流表
| ID | 來源 | 目標 | 協定 | 描述 |
|----|--------|--------|----------|-------------|

## 信任邊界表
| 邊界 | 描述 | 包含 |
|----------|-------------|----------|

## 摘要檢視 (僅在產生摘要圖表時提供)
<!-- 從 1.2-threatmodel-summary.mmd 複製 -->

## 摘要與詳細映射
| 摘要元件 | 包含 | 摘要資料流 | 映射至詳細資料流 |
```

**關鍵規則：**
- `.mmd` 與 `.md` 中的圖表必須完全相同 (複製，不要重新產生)
- 詳細資料流使用 `DF01`、`DF02`；摘要資料流使用 `SDF01`、`SDF02`

---

## 2-stride-analysis.md

**目的：** 對每個元件進行完整的 STRIDE + 濫用案例 (Abuse Cases) 威脅分析。

### 結構要求

1. 每個元件的威脅**必須分為層級 1 (Tier 1)、層級 2 (Tier 2)、層級 3 (Tier 3) 次分段**，並使用獨立的表格
2. 摘要表**必須包含 T1、T2、T3 欄位**
3. 每個元件都會出現這三個層級的次分段 (即使為空 — 請使用「*未識別出層級 N 威脅*」)

### 錨點安全標題 (關鍵)

元件 `## ` 標題會成為來自 `3-findings.md` 的連結目標。
- **僅**使用字母、數字、空格與連字號
- **標題中禁止使用：** `&`、`/`、`(`、`)`、`.`、`:`、`'`、`"`、`+`、`@`、`!`
- 替換方式：`&` → `and`、`/` → `-`、移除括號

**錨點規則：** 標題 → 小寫，空格 → 連字號，去除連字號以外的非英數字。

### 範本

> **⛔ 關鍵：`## 摘要` 表必須出現在檔案頂部，緊接在 `## 可利用性層級` 之後，且在任何個別 `## 元件` 區段之前。它是導覽輔助工具 — 讀者需要先看到它。模型經常會將其移至底部 — 這是錯誤的。請遵循此確切順序：`# STRIDE + 濫用案例 — 威脅分析` → `## 可利用性層級` → `## 摘要` → `---` → `## 元件 1` → `## 元件 2` → ...**

> **⛔ 嚴格層級定義 — 請確實套用。請勿使用主觀判斷。** 這是一項技能指令 — 請勿將此行複製到輸出中。下方的層級表是放入報告中的內容，不包含此指令行。

> **⛔ 外洩指令檢查：** 輸出檔案不得包含「嚴格層級定義」、「請勿使用主觀判斷」文字，或任何以 `⛔` 開頭的行。這些是技能指令，而非報告內容。如果您在輸出中看到它們，請在完成前將其移除。

```markdown
# STRIDE + 濫用案例 — 威脅分析

## 可利用性層級

威脅根據攻擊者需要的前提條件分為三個可利用性層級：

| 層級 | 標籤 | 前提條件 | 指派規則 (Assignment Rule) |
|------|-------|---------------|----------------|
| **層級 1** | 直接暴露 | `無 (None)` | 可由未經身分驗證且「無」先前存取權限的外部攻擊者利用。前提條件欄位「必須」寫為 `None`。 |
| **層級 2** | 有條件風險 | 單一前提條件：`已驗證使用者`、`特權使用者`、`內部網路` 或單一 `{邊界} 存取` | 需要「正好一種」形式的存取。前提條件欄位只有「一個」項目。 |
| **層級 3** | 深度防禦 | `主機/作業系統存取`、`管理員認證資訊`、`{元件} 遭入侵`、`實體存取` 或以 `+` 連結的多個前提條件 | 需要重大的先前入侵、基礎架構存取或多個組合前提條件。 |
```

> **⛔ 逐字複製層級表。** 第 4 欄必須是 `指派規則 (Assignment Rule)` (不可是 `Example`、`Description`、`Criteria` 或任何其他名稱)。儲存格值必須是上述確切文字 — 請勿將其替換為特定部署的範例。請勿在表格後加入「影響層級指派的部署背景」段落 — 部署背景屬於個別元件區段，而非層級定義。

> **⛔ STRIDE-A 類別標籤 (強制性 — 「A」代表「濫用 (Abuse)」，絕非「授權 (Authorization)」)：**
> 在所有表格 (摘要、每個元件的層級表、threat-inventory.json) 中使用的 7 個 STRIDE-A 類別為：
> **S**poofing (偽冒) | **T**ampering (竄改) | **R**epudiation (否認) | **I**nformation Disclosure (資訊洩漏) | **D**enial of Service (阻斷服務) | **E**levation of Privilege (權限提升) | **A**buse (濫用)
> 「濫用」涵蓋：商業邏輯濫用、工作流程操作、功能誤用、合法功能的非預期使用。
> 模型經常會在 A 欄位產生「Authorization」— 這是錯誤的。如果您在任何地方看到將「Authorization」作為 STRIDE 類別標籤，請將其替換為「Abuse」。威脅列中的類別欄位「必須」寫為「Abuse」(而非「Authorization」)。N/A 項目也必須寫為「Abuse — N/A」(而非「Authorization — N/A」)。

## 摘要
| 元件 | 連結 | S | T | R | I | D | E | A | 總計 | T1 | T2 | T3 | 風險 |
|-----------|------|---|---|---|---|---|---|---|-------|----|----|----|------|

---

## 元件名稱

**信任邊界：** [邊界名稱]
**角色：** [簡短描述]
**資料流：** [DF ID 列表]
**Pod 並列部署：** [如果是 K8s 則為 sidecar — 參閱 diagram-conventions.md]

### STRIDE-A 分析

> **⛔ 類別命名：7 個 STRIDE-A 類別為：偽冒 (Spoofing)、竄改 (Tampering)、否認 (Repudiation)、資訊洩漏 (Information Disclosure)、阻斷服務 (Denial of Service)、權限提升 (Elevation of Privilege)、濫用 (Abuse)。「A」類別「一律」為「濫用 (Abuse)」— 絕非「授權 (Authorization)」。授權問題屬於權限提升 (E)。這適用於 N/A 正當性標籤、威脅表類別欄位以及所有說明文字。**

#### 層級 1 — 直接暴露 (無前提條件)
| ID | 類別 | 威脅 | 前提條件 | 受影響資料流 | 緩解措施 | 狀態 |
|----|----------|--------|---------------|---------------|------------|--------|

#### 層級 2 — 有條件風險
| ID | 類別 | 威脅 | 前提條件 | 受影響資料流 | 緩解措施 | 狀態 |

#### 層級 3 — 深度防禦
| ID | 類別 | 威脅 | 前提條件 | 受影響資料流 | 緩解措施 | 狀態 |
```

**⛔ STRIDE 狀態欄位 — 有效值 (必須與覆蓋率表相符)：**
威脅列中的 `狀態` 欄位「必須」使用以下確切值之一：
- `Open` — 威脅未緩解；「必須」映射至一個發現事項 (覆蓋率表中的 `✅ Covered`)。該發現事項記錄了弱點與補救指引。
- `Mitigated` — 威脅由開發團隊在「此」儲存庫中的程式碼、設定或設計決策緩解。映射至覆蓋率表中的 `✅ Mitigated (FIND-XX)`。且「必須」建立一個發現事項，記錄團隊做了「什麼」、在程式碼的「何處」，以及它「如何」緩解威脅。這肯定了開發團隊已完成的安全性工作。
- `Platform` — 威脅由「外部」平台緩解，該平台「不」屬於分析程式碼庫的一部分。請參閱下方的嚴格定義。映射至覆蓋率表中的 `🔄 Mitigated by Platform`。且「不」建立發現事項 — 緩解措施超出此團隊的控制範圍。

**如何區分已緩解 (Mitigated) 與平台 (Platform)：**
| 問題 | 若為「是」→ | 若為「否」→ |
|----------|----------|---------|
| 此緩解措施是否在此存放庫的程式碼中實作？ | `Mitigated` | 檢查下一項 |
| 此緩解措施是否在由此團隊控制的部署組態中？ | `Mitigated` | 檢查下一項 |
| 此緩解措施是否由完全外部的系統提供？ | `Platform` | `Open`（不存在緩解措施） |

**`Mitigated` 的範例（團隊自己的工作 — 建立缺失項以記錄之）：**
- 驗證 JWT 權杖的驗證中介軟體 — 團隊撰寫了此程式碼
- TLS 憑證產生與組態 — 團隊實作了此項
- 程式碼中將檔案權限設定為 0600 — 團隊選擇了安全的預設值
- 輸入驗證或淨化函式 — 團隊建立了防禦機制
- 速率限制中介軟體 — 團隊新增了流量限制
- 僅限本地主機綁定 — 團隊做出了架構性安全決策

**針對 `Mitigated` 威脅的缺失項會記錄現有的控制措施：**
- 標題：描述已就位的措施（例如：「API 端點上的 JWT 驗證中介軟體」）
- 嚴重性：低（現有控制措施）或中等（若控制措施有差距）
- 緩解類型：`Existing Control`
- 修補區段：描述已實作的內容 + 任何強化建議
- 這確保了涵蓋範圍檢視表顯示的是團隊的安全工作，而不僅僅是差距

**⛔「Platform」的嚴格定義（強制性）：**
僅當所有這些條件均成立時，`Platform` 狀態才有效：
1. 緩解措施是由**完全位於**受分析存放庫程式碼之外的系統所提供
2. 緩解措施由**不同的團隊/組織管理**（例如：Azure AD 由 Microsoft 識別團隊管理，而非由此存放庫的團隊管理）
3. 此緩解措施**無法透過修改此存放庫中的程式碼而被停用或削弱**

**合法的 Platform 緩解措施範例：**
- Azure AD 權杖簽署（由 Microsoft 識別團隊管理，而非此程式碼）
- K8s RBAC（由 K8s 控制平面管理，而非此運算子）
- Azure Arc 隧道加密（由 Arc 團隊管理，而非此代理程式）
- TPM 硬體安全（硬體，而非軟體）

**不屬於「Platform」的事物範例 — 它們是 `Mitigated`（團隊的工作）：**
- ✅ 「端點上的驗證中介軟體」→ `Mitigated` — 團隊撰寫了驗證程式碼。建立記錄此項的缺失項。
- ✅ 「本地主機上的 TLS」→ `Mitigated` — 團隊實作了 TLS。建立記錄此實作的缺失項。
- ✅ 「檔案權限 0600」→ `Mitigated` — 團隊設定了安全預設值。建立記錄此選擇的缺失項。
- ✅ 「本地主機綁定」→ `Mitigated` — 團隊做出了架構性安全決策。建立缺失項。
- ✅ 「輸入驗證」→ `Mitigated` — 團隊建立了防禦機制。建立記錄驗證內容的缺失項。
- ✅ 「操作狀態機」→ `Mitigated` — 團隊的邏輯防止了濫用。建立缺失項。

**⛔ 最大 Platform 比例：** 若超過 20% 的威脅被歸類為「🔄 Mitigated by Platform」，請重新檢查每一項。許多應為 `Mitigated`（團隊的程式碼）而非 `Platform`（外部）。在典型的應用程式中，5-15% 是真正的平台緩解，20-40% 是由團隊自己的程式碼緩解，其餘則是 `Open`（需要修補）。

**⛔ 絕對不要使用這些值：**
- ❌ `Partial` — 意義含糊。若為部分緩解，則為 `Open`（剩餘的差距即為缺失項）
- ❌ `N/A` — 若在表格中，則每一項威脅皆適用
- ❌ `Accepted` — 此工具不接受風險
- ❌ `Needs Review` — 每一項威脅必須是 Covered、Mitigated 或 Platform

**一致性規則：** STRIDE `Status` 欄位與缺失項涵蓋範圍檢視表 `Status` 必須一致：
| STRIDE 狀態 | 涵蓋範圍檢視表狀態 | 意義 |
|---|---|---|
| `Open` | `✅ Covered (FIND-XX)` | 缺失項記錄了需要修補的漏洞 |
| `Mitigated` | `✅ Mitigated (FIND-XX)` | 缺失項記錄了團隊建立的現有控制措施 — 為安全工作提供肯定 |
| `Platform` | `🔄 Mitigated by Platform` | 外部平台處理之 — 不需要缺失項 |

**⛔「已接受風險」與「需要審閱」是被禁止的。** 此工具無權接受風險或延後處理威脅。每一項威脅都對應到一個缺失項（Covered 或 Mitigated）或是真正的外部平台緩解。不存在中間地帶。

### 算術驗證（強制性）

在撰寫所有元件表格後：
1. 計算每個元件在各類別（S,T,R,I,D,E,A）下的實際威脅列數 — 與摘要表進行比較
2. 驗證每一列的總計 = S+T+R+I+D+E+A
3. 驗證每一列的 T1+T2+T3 = 總計
4. 驗證總計列 = 各欄位之和
5. 列數交叉檢查：詳細資料中的威脅列 = 摘要中的總計

---

## 3-findings.md

**目的：** 具有證據與修補建議的優先排序安全缺失項。

> **⛔ 重要：在撰寫此檔案之前，請閱讀 [skeleton-findings.md](./skeletons/skeleton-findings.md) 並逐字複製每個缺失項的骨架。填寫 `[FILL]` 預留位置。這可防止範本偏離。**

### 結構需求

按**可利用性層級**排序（非按嚴重性）：
1. `## Tier 1 — 直接暴露（無前提條件）`
2. `## Tier 2 — 有條件風險（已驗證 / 單一前提條件）`
3. `## Tier 3 — 縱深防禦（先前已遭入侵 / 主機存取權）`

**請勿**使用 `## Critical Findings`、`## Important Findings` 等。
在每個層級**內**按嚴重性排序，然後按 CVSS 降冪排序。

**缺失項的層級分配：**
- 缺失項的層級由其「利用前提條件」值決定，使用與 STRIDE-A 層級分配相同的規則（參見 [analysis-principles.md](./analysis-principles.md)）
- 若一個缺失項涵蓋了多個層級的威脅（透過相關威脅），則將其分配至其相關威脅中的**最高優先級層級**（最低層級編號）

**每個層級內的排序：** 按以下方式對缺失項進行排序：
1. **SDL Bugbar 嚴重性**降冪：Critical → Important → Moderate → Low
2. **在每個嚴重性分段內**，按 CVSS 4.0 分數降冪排序（最高者優先）

**在撰寫完所有缺失項後**，驗證排序順序：
- 列出所有缺失項及其嚴重性、CVSS 分數和層級
- 確認在同一個嚴重性分段和層級內，CVSS 較高的缺失項不會出現在 CVSS 較低的缺失項之後
- 若排序錯誤，請在完成前重新編號並重新排序

**缺失項 ID 編號 — 必須是連續的：**
- 僅使用 `FIND-01`、`FIND-02`、`FIND-03` ...。不允許 `F-01`、`F01` 或 `Finding 1` 格式。
- ID 必須在文件中按順序出現：FIND-01 在 FIND-02 之前，FIND-02 在 FIND-03 之前，依此類推。
- ❌ 絕對不要在文件中讓 FIND-06 出現在 FIND-04 之前。若重新排序缺失項，請重新編號所有 ID 以維持連續順序。
- 在最終排序後，由上而下掃描文件：第一個缺失項標題必須是 FIND-01，下一個是 FIND-02，依此類推。不留間隔，不亂序。

### 缺失項屬性（全部為強制性）

| 屬性 | 描述 |
|-----------|-------------|
| SDL Bugbar 嚴重性 | Critical / Important / Moderate / Low |
| CVSS 4.0 | 分數與完整向量字串（例如：`9.3 (CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N)`） — 兩者皆為強制性 |
| CWE | ID、名稱與超連結（例如：`[CWE-306](https://cwe.mitre.org/data/definitions/306.html): 關鍵函式缺少驗證`） |
| OWASP | Top 10:2025 對應（A01:2025 格式 — 絕非 :2021） |
| 利用前提條件 | 來自層級定義 |
| 可利用性層級 | Tier 1 / Tier 2 / Tier 3 |
| 修補工作量 | Low / Medium / High |
| 緩解類型 | Redesign / Standard Mitigation / Custom Mitigation / Existing Control / Accept Risk / Transfer Risk |
| 元件 | 受影響的元件 |
| 相關威脅 | 指向 `2-stride-analysis.md#component-anchor` 的個別連結 |

### 完整缺失項範例

```markdown
### FIND-01: API 上缺少驗證

| 屬性 | 數值 |
|-----------|-------|
| SDL Bugbar 嚴重性 | Critical |
| CVSS 4.0 | 9.3 (CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N) |
| CWE | [CWE-306](https://cwe.mitre.org/data/definitions/306.html): 關鍵函式缺少驗證 |
| OWASP | A07:2025 – 驗證失敗 |
| 利用前提條件 | 無 (外部攻擊者) |
| 可利用性層級 | 第 1 層 — 直接暴露 |
| 修復工作量 | 中 |
| 緩解類型 | 標準緩解 |
| 元件 | API 閘道 |
| 相關威脅 | [T01.S](2-stride-analysis.md#api-gateway), [T01.R](2-stride-analysis.md#api-gateway) |

#### 描述

API 端點 /api/v1/resources 在不進行任何驗證檢查的情況下接受請求...

#### 證據

`src/Controllers/ResourceController.cs` 第 45 行 — 控制器上沒有 `[Authorize]` 屬性。

#### 修復

將 `[Authorize]` 屬性加入到控制器類別中，並在 `Program.cs` 中配置 JWT 持有人驗證 (bearer authentication)。

#### 驗證

向 `/api/v1/resources` 發送未經驗證的 GET 請求 — 應回傳 401 Unauthorized。
```

### 相關威脅連結格式

> **⛔ 關鍵：相關威脅必須是超連結，而非純文字。模型經常輸出如 `T-02, T-17` 的純文字 — 這是錯誤的。每個威脅 ID 必須連結到 STRIDE 分析中特定的元件章節。**

- 每個威脅 ID 的個別連結：`[T01.S](2-stride-analysis.md#component-name)`
- **錯誤**：`T-02, T-17, T-23` (純文字，無連結)
- **錯誤**：`[T08.S, T08.T](2-stride-analysis.md)` (分組，無錨點)
- **正確**：`[T08.S](2-stride-analysis.md#redis-state-store), [T08.T](2-stride-analysis.md#redis-state-store)`
- 每個 `| **相關威脅** |` 儲存格必須僅包含以逗號分隔的 `[Txx.Y](2-stride-analysis.md#anchor)` 格式連結

### 撰寫後檢查

1. **錨點抽查**：驗證 3 個以上的相關威脅連結能導向真實的 `##` 標題
2. **威脅涵蓋範圍檢查**：`2-stride-analysis.md` 中的每個威脅 ID 必須至少被一個發現項引用
3. **排序順序檢查**：在每個層級中，CVSS 較高的發現項不應出現在同一嚴重程度分組中 CVSS 較低的發現項之後
4. **CVSS 與層級的一致性**：掃描每個發現項 — 如果 CVSS 包含 `AV:L` 或 `PR:H`，該發現項絕不能位於第 1 層。請透過調降層級來修正，而非更改 CVSS。
5. **威脅涵蓋範圍驗證表**：在 `3-findings.md` 末尾包含：

```markdown
## 威脅涵蓋範圍驗證

| 威脅 ID | 發現項 ID | 狀態 |
|-----------|------------|--------|
| T01.S | FIND-01 | ✅ 已涵蓋 |
| T01.T | FIND-05 | ✅ 已緩解 (團隊已實作 TLS) |
| T02.I | — | 🔄 由平台緩解 (Azure AD) |
```

`2-stride-analysis.md` 中的每個威脅都必須出現在此表中。狀態為以下之一：
- `✅ 已涵蓋 (FIND-XX)` — 發現項記錄了需要修復的弱點
- `✅ 已緩解 (FIND-XX)` — 發現項記錄了團隊建立的現有控制項 (肯定已完成的安全工作)
- `🔄 由平台緩解` — 由外部系統處理 (僅適用於真正的外部平台)

**⛔ 此表是回饋迴圈，而非文件：**
此表的目的是強迫您檢查您的工作。填寫完畢後：
1. 如果任何威脅在發現項 ID 欄位中為 `—` 且狀態不是 `🔄 由平台緩解` → **您遺漏了一個發現項。請返回並建立一個。**
2. 如果平台計數 > 總威脅數的 20% → **您過度使用平台作為逃生門。請重新檢查。**
3. 如果任何威脅被列為 `⚠️ 已接受風險` 或 `⚠️ 待檢閱` → **違反規則。請建立發現項或驗證其是否真正由平台緩解。**

此表應推動您達到 100% 的涵蓋範圍：每個威脅都對應到一個發現項 (`✅ 已涵蓋`) 或合法的外部平台緩解 (`🔄 由平台緩解`)。沒有第三種選擇。

**⛔ 發現項產生規則：**
如果 `2-stride-analysis.md` 中的威脅具有非空的 `Mitigation` (緩解) 欄位，它必須成為一個發現項。緩解文字提供了修復方法 — 請使用它。唯一的例外是真正由此程式碼無法停用的外部平台 (Azure AD、K8s RBAC、TPM 硬體) 緩解的威脅。

---

## 0-assessment.md

**目的：** 執行摘要、風險評級、行動計畫和 Metadata。報告的「首頁」。

> **⛔ 重要：在撰寫此檔案之前，請閱讀 [skeleton-assessment.md](./skeletons/skeleton-assessment.md) 並逐字複製骨架。填寫 `[FILL]` 預留位置。這可以防止範本偏差。**

### 章節順序 (強制性 — 所有 7 個章節均為必要，請勿跳過任何章節)

1. **報告檔案** (必要) — 連結到所有報告交付物
2. **執行摘要** (必要) — 風險評級 + 涵蓋範圍。不設獨立的「關鍵建議」子章節
3. **行動摘要** (必要) — 基於層級的優先順序行動計畫，包含 `### 快速獲勝 (Quick Wins)` 子章節
4. **分析背景與假設** (必要) — 範圍、基礎設施背景、`### 待驗證` 表、發現項覆蓋
5. **參考資料** (必要) — 安全標準 + 元件文件
6. **報告 Metadata** (必要) — 模型、時間戳記、持續時間、git 資訊
7. **分級參考** (必要) — 必須是最後一個章節。從骨架複製的靜態表格。

⚠️ **強制執行：** 如果某個章節沒有資料，請包含空表格或「不適用 (N/A)」說明 — 絕不要完全省略該章節。在先前的疊代中，代理程式完全跳過了第 1、4、5 和 6 章節。所有七個章節都必須存在。

### 報告檔案範本

報告檔案表格必須將 `0-assessment.md` (此檔案) 列為第一列，隨後是其他檔案：

```markdown
## 報告檔案

| 檔案 | 描述 |
|------|-------------|
| [0-assessment.md](0-assessment.md) | 此文件 — 執行摘要、風險評級、行動計畫、Metadata |
| [0.1-architecture.md](0.1-architecture.md) | 架構概覽、元件、情境、技術堆疊 |
| [1-threatmodel.md](1-threatmodel.md) | 威脅模型 DFD 圖，包含元素、流程和邊界表 |
| [1.1-threatmodel.mmd](1.1-threatmodel.mmd) | 純 Mermaid DFD 原始檔 |
| [1.2-threatmodel-summary.mmd](1.2-threatmodel-summary.mmd) | 摘要 DFD (僅在產生時提供) |
| [2-stride-analysis.md](2-stride-analysis.md) | 所有元件的完整 STRIDE-A 分析 |
| [3-findings.md](3-findings.md) | 帶有修復建議的優先順序安全發現項 |
```

⚠️ **`0-assessment.md` 必須是第一列。** 模型經常將 `0.1-architecture.md` 列在第一位 — 那是錯誤的。此檔案是報告的首頁，應優先列出自身。

### 風險評級

標題必須是純文字，且不得包含表情符號：`### Risk Rating: Elevated`，而非 `### Risk Rating: 🟠 Elevated`

### 威脅計數背景段落

包含在執行摘要的末尾：

```markdown
> **威脅計數說明：** 本分析在 [M] 個元件中識別出 [N] 個威脅。此計數反映了全面的 STRIDE-A 涵蓋範圍，而非系統性的不安全性。其中，**[T1 count] 個可直接利用**且無前提條件 (第 1 層)。剩餘的 [T2+T3 count] 個代表條件性風險和深層防禦考量。
```

### 行動摘要範本

> **⛔ 固定優先順序對應 — 優先順序欄位的值是確定的，而非基於判斷：**
> | 層級 | 優先順序 | 始終為 |
> |------|----------|--------|
> | 第 1 層 | 🔴 關鍵風險 (Critical Risk) | 始終 — 無論威脅/發現項計數為何 |
> | 第 2 層 | 🟠 高風險 (Elevated Risk) | 始終 — 無論威脅/發現項計數為何 |
> | 第 3 層 | 🟡 中度風險 (Moderate Risk) | 始終 — 無論威脅/發現項計數為何 |
>
> **絕不要根據該層級中存在的威脅或發現項數量來更改優先順序。** 即使第 1 層有 0 個威脅 and 0 個發現項，優先順序仍然是 🔴 關鍵風險 — 因為如果存在第 1 層威脅，它將是關鍵的。優先順序反映了該層級固有的嚴重程度，而非計數。將第 1 層列為「🟢 低風險」的報告是錯誤的，必須修正。
```markdown
## 行動摘要

| 層級 | 描述 | 威脅 | 發現項目 | 優先級 |
|------|-------------|---------|----------|----------|
| 第 1 層級 | 直接可利用 | 5 | 3 | 🔴 關鍵風險 |
| 第 2 層級 | 需要經過身份驗證的存取 | 8 | 4 | 🟠 提高的風險 |
| 第 3 層級 | 需要事先遭入侵 | 12 | 5 | 🟡 中度風險 |
| **總計** | | **25** | **12** | |
```

> **⛔ 正好 4 列：行動摘要表格必須正好有 4 個資料列：第 1 層級、第 2 層級、第 3 層級和總計。切勿為「已緩解」、「平台」、「已修復」、「已接受」或任何其他狀態新增資料列。已緩解的威脅分佈在各自的層級中 —— 它們不是獨立的層級。如果您發現自己正在新增「已緩解」列，請停止並將其移除。**

```markdown

### 快速獲益
<!-- 第 1 層級發現項目，補救工作量低 —— 高影響，快速修復 -->
| 發現項目 | 標題 | 為何快速 |
|---------|-------|-----------|
| FIND-XX | [標題] | [原因] |
```

⚠️ **快速獲益是必要的子章節。** `### 快速獲益` 標題和表格必須出現在行動摘要內的層級摘要表格之後。如果不存在低工作量的發現項目，請寫道：`### 快速獲益\n\n未識別出低工作量的發現項目。所有發現項目都需要中度或高度工作量。`

**行動摘要的處理規則：**
1. 使用 `3-findings.md`（每個層級的發現項目）和 `2-stride-analysis.md`（摘要表格中 T1/T2/T3 欄位的每個層級威脅）中的實際計數填寫層級表格
2. 快速獲益僅列出「補救工作量：低」的第 1 層級發現項目 —— 影響最高、工作量最低的項目
3. 如果不存在第 1 層級低工作量的發現項目，請改為顯示第 2 層級低工作量的發現項目，並附註：「未識別出第 1 層級快速獲益。這些第 2 層級項目提供最佳的工作量影響比：」
4. 如果完全不存在低工作量的發現項目，請保留 `### 快速獲益` 標題並新增：`未識別出低工作量的發現項目。所有發現項目都需要中度或高度工作量。`
5. 驗證：發現項目欄位總和必須等於 `3-findings.md` 中的總發現項目計數
6. 驗證：威脅欄位總和必須等於 `2-stride-analysis.md` 摘要表格中的總威脅計數

### ⛔ 行動摘要及所有輸出檔案中的禁止內容

**絕不生成下列任何內容：**
- `### 按階段進行的優先補救` 或任何按階段進行的補救路線圖
- Sprint 參考（`Sprint 1-2`、`Sprint 3-4` 等）
- 基於時間的階段（`階段 1 — 立即`、`階段 2 — 短期`、`階段 3 — 中期`、`階段 4 — 長期`、`待辦清單`）
- 修復時間估計（`~1 小時`、`~2 小時`、`~4 小時`、`1-2 天` 等）
- 時間線或排程語言（`立即`、`下一季度`、`30 天內`、`解決期限`）
- 低/中/高工作量等級後的工作量持續時間標籤（`(小時)`、`(天)`、`(週)`）

**報告識別「什麼」需要修復以及「為什麼」（層級 + 嚴重性 + 工作量等級）。它「不」規定「何時」修復。** 排程是團隊的責任。僅將 `低`、`中`、`高` 用於補救工作量 —— 絕不附加時間長度。

### 分析背景與假設模板

⚠️ **整個章節都是必要的。** 之前的版本完全跳過了它。請包含下面的所有子章節，即使表格為空。

```markdown
## 分析背景與假設

### 分析範圍
| 限制 | 描述 |
|------------|-------------|
| 範圍 | [完整儲存庫或特定區域] |
| 排除項 | [排除內容] |
| 重點區域 | [是否有特別關注的區域] |

### 基礎設施背景
| 類別 | 從程式碼庫中發現 | 受影響的發現項目 |
|----------|--------------------------|-------------------|

**「從程式碼庫中發現」中的每個條目都必須包含指向推斷出資訊的來源檔案或文件的相對連結。** 範例：

```
| 部署模型 | 隔離、單一管理員工作站 ([daemon.json](src/Container/Moby/daemon.json), [InstallAzureEdgeDiagnosticTool.ps1](src/Setup/InstallArtifacts/InstallAzureEdgeDiagnosticTool.ps1)) | 所有發現項目 —— 無第 1 層級 |
| 網路暴露 | 所有服務僅繫結至 localhost:80 ([KustoContainerHelper.psm1](src/Container/Kusto/KustoContainerHelper.psm1)) | FIND-01, FIND-03 |
```

### 需要驗證
| 項目 | 問題 | 檢查內容 | 為何不確定 |
|------|----------|---------------|---------------|

### 發現項目覆寫
| 發現項目 ID | 原始嚴重性 | 覆寫 | 理由 | 新狀態 |
|------------|-------------------|----------|---------------|------------|
| — | — | — | 未套用任何覆寫。審查後更新此章節。 | — |

### 其他備註
<!-- 來自使用者提示的任何其他背景資訊 -->

[使用者提供的自由格式備註]
```

### 參考資料模板

> **⛔ 關鍵：此章節必須有兩個子章節，包含三欄表格（含完整 URL）。切勿簡化為簡單的兩欄 `| 參考資料 | 用法 |` 表格。模型總是試圖簡化這個 —— 請勿簡化它。**

```markdown
## 參考資料

### 安全標準
| 標準 | URL | 如何使用 |
|----------|-----|----------|
| Microsoft SDL Bug Bar | https://www.microsoft.com/en-us/msrc/sdlbugbar | 嚴重性分類 |
| OWASP Top 10:2025 | https://owasp.org/Top10/2025/ | 威脅類別化 |
| CVSS 4.0 | https://www.first.org/cvss/v4.0/specification-document | 風險評分 |
| CWE | https://cwe.mitre.org/ | 弱點分類 |
| STRIDE | https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats | 威脅枚舉方法論 |
| NIST SP 800-53 Rev. 5 | https://csrc.nist.gov/pubs/sp/800-53/r5/upd1/final | 控制項對應 |

### 元件文件
| 元件 | 文件 URL | 相關章節 |
|-----------|------------------|------------------|
| [例如 Dapr] | [例如 https://docs.dapr.io/operations/security/] | [例如 mTLS 設定] |
| [例如 Redis] | [例如 https://redis.io/docs/management/security/] | [例如 身份驗證] |
```

**處理規則：**
1. 始終包含安全標準表格 —— 填入實際參考的安全標準
2. 每一列都必須有完整的 URL (https://...) —— 絕不省略 URL 欄位
3. 使用分析期間實際參考的技術填寫元件文件
4. 切勿新增未使用的文件

### 報告 Metadata 模板

> **⛔ 關鍵：以下所有欄位都是強制的。切勿跳過模型、分析開始時間、分析完成時間或持續時間。上一次執行時忽略了這些 —— 這是嚴重的失敗。在開始和結束時執行 `Get-Date` 以計算持續時間。**

```markdown
## 報告 Metadata

| 欄位 | 值 |
|-------|-------|
| 原始位置 | `[完整路徑]` |
| Git 儲存庫 | `[遠端 URL 或「無法取得」]` |
| Git 分支 | `[分支名稱 或「無法取得」]` |
| Git 提交 | `[短 SHA]` (`[YYYY-MM-DD]` —— 執行 `git log -1 --format="%cs" [SHA]` 以取得提交日期) |
| 模型 | `[模型名稱 —— 詢問系統或說明您執行的模型]` |
| 機器名稱 | `[主機名稱]` |
| 分析開始時間 | `[YYYY-MM-DD HH:MM:SS]` |
| 分析開始時間 | `[來自指令的 UTC 時間戳記]` |
| 分析完成時間 | `[來自指令的 UTC 時間戳記]` |
| 持續時間 | `[開始與完成之間的計算差值]` |
| 輸出資料夾 | `[資料夾名稱]` |
| 提示詞 | `[觸發此分析的使用者提示詞文字]` |
```

**收集規則：**
- START_TIME：在工作流步驟 1 執行 `Get-Date -Format "yyyy-MM-dd HH:mm:ss" -AsUTC`
- END_TIME：在寫入 0-assessment.md 之前再次執行
- Git 欄位：`git remote get-url origin`、`git branch --show-current`、`git rev-parse --short HEAD`
- 如果任何指令失敗 → "Unavailable"
- **切勿從資料夾名稱估算時間戳記**
- 模型：註明您目前執行的模型（例如：`Claude Opus 4.6`、`GPT-5.3 Codex`、`Gemini 3 Pro`）
- 機器：執行 `hostname`

### 涵蓋範圍計數一致性

Before writing 0-assessment.md:
- 計算 `1-threatmodel.md` 元件表中的元素數量
- 計算 `3-findings.md` 中的發現數量
- 計算 `2-stride-analysis.md` 摘要表中的威脅數量
- 在執行摘要 (Executive Summary) 和行動摘要 (Action Summary) 中使用這些精確數字

### 格式規則

1. 在每個 `##` 章節之間使用 `---` 水平分割線
2. 報告 Metadata 數值全部用反引號包圍
3. 發現覆蓋 (Finding Overrides) 始終使用表格格式（即使為空）
4. 報告檔案 (Report Files) 章節始終排在第一位
5. `0.1-architecture.md` 始終列在報告檔案表格中

---

## 常見錯誤檢查清單

這些是最常觀察到的偏差。在寫入每個檔案後進行檢查：

1. ❌ 按嚴重性排序 → ✅ 按 **可利用性分層 (Exploitability Tier)** 排序
2. ❌ 扁平的 STRIDE 表格 → ✅ 按每個元件拆分為第 1/2/3 層子章節
3. ❌ 缺少 `可利用性分層` 和 `修復努力` → ✅ 每個發現均為 **必填**
4. ❌ STRIDE 摘要缺少 T1/T2/T3 欄位 → ✅ 包含 T1|T2|T3 欄位
5. ❌ 將 `.md` 包裝在 ` ```markdown ` 程式碼柵欄中 → ✅ 從第 1 行的 `# 標題` 開始。`create_file` 工具寫入原始內容 — 柵欄會變成檔案中的字面文字。
6. ❌ 將 `.mmd` 包裝在 ` ```plaintext ` 或 ` ```mermaid ` 中 → ✅ 從第 1 行的 `%%{init:` 開始。`.mmd` 檔案是原始 Mermaid 原始碼。
7. ❌ 缺少行動摘要 → ✅ 章節標題必須精確為 `## Action Summary`。必須包含 `### Quick Wins` 子章節，並附上第 1 層低努力發現的表格。
8. ❌ 缺少威脅計數上下文段落 → ✅ 在執行摘要中包含 `> **Note on threat counts:**` 區塊引言
9. ❌ 省略空的分層章節 → ✅ 每個元件始終包含所有三個分層
10. ❌ 加入單獨的 `### Key Recommendations` 或 `### Top Recommendations` 或 `### Priority Remediation Roadmap` → ✅ 行動摘要 (Action Summary) 即為建議事項 — 不得使用其他名稱。
11. ❌ 將 sidecar 繪製為獨立節點 → ✅ 參閱 `diagram-conventions.md` 規則 1
12. ❌ 缺少 CVSS 4.0 向量字串 → ✅ 每個發現必須同時具備分數和完整向量（例如：`CVSS:4.0/AV:N/AC:L/...`）
13. ❌ 發現上缺少 CWE 或 OWASP → ✅ 每個發現均為 **必填**
14. ❌ 使用 OWASP `:2021` 後置字串 → ✅ 始終使用 `:2025`（例如：`A01:2025 – Broken Access Control`）。2025 版為目前版本。
15. ❌ 缺少威脅涵蓋範圍驗證表格 → ✅ 在 `3-findings.md` 末尾要求提供
16. ❌ 架構元件未出現在 STRIDE 分析中 → ✅ 0.1-architecture.md 中的每個元件都必須有一個 STRIDE 章節
17. ❌ 缺少熱門情境的循序圖 → ✅ 0.1-architecture.md 中的前 3 個情境必須具備 Mermaid 循序圖
18. ❌ 0-assessment.md 中缺少需要驗證章節 → ✅ 包含在分析上下文與假設下
19. ❌ 完全缺少 `## Analysis Context & Assumptions` 章節 → ✅ **必填**。先前的迭代跳過了此章節。必須包含範圍、需要驗證和發現覆蓋子表。
20. ❌ 缺少 `### Quick Wins` 子章節 → ✅ 行動摘要下 **必填**。列出第 1 層低努力發現；若無，則包含標題並註明。
21. ❌ 跳過 `## Report Files`、`## References Consulted` 或 `## Report Metadata` → ✅ 0-assessment.md 中的所有 7 個章節均為 **必填**。切勿省略任何章節。
22. ❌ 發現識別碼順序混亂（FIND-06 在 FIND-04 之前） → ✅ 發現識別碼必須由上而下按順序排列：FIND-01, FIND-02, FIND-03, ... 排序後重新編號。
23. ❌ CWE 沒有超連結 → ✅ CWE 必須包含超連結：`[CWE-306](https://cwe.mitre.org/data/definitions/306.html): Missing Authentication for Critical Function`
24. ❌ 輸出中出現時間估算或排程 → ✅ 切勿在任何輸出檔案中產生 `~1 hour`、`Sprint 1-2`、`Phase 1 — Immediate`、`(hours)` 或任何時間軸/持續時間。報告說明要修復什麼，而不是何時修復。

---

## threat-inventory.json

**目的：** 所有元件、資料流、邊界、威脅和發現的結構化 JSON 清單。
此檔案可實現兩次威脅模型執行之間的自動化比較。

**何時產生：** 每次執行（步驟 8b）。在所有 Markdown 檔案寫入後產生。

**不在 `0-assessment.md` 中連結** — 這是一個機器可讀的構件，不是人類可讀的報告檔案。

### Schema

```json
{
  "schema_version": "1.0",
  "commit": "abc1234",
  "commit_date": "2025-08-15",
  "branch": "main",
  "analysis_timestamp": "2025-08-15T14:30:00Z",
  "repository": "https://github.com/org/repo",
  "report_folder": "threat-model-20250815-143000",

  "components": [
    {
      "id": "RedisStateStore",
      "display": "Redis 狀態儲存",
      "aliases": ["Redis", "狀態儲存 Redis"],
      "type": "data_store",
      "tmt_type": "SE.DS.TMCore.NoSQL",
      "boundary": "DataLayer",
      "boundary_kind": "ClusterBoundary",
      "source_files": ["helmchart/myapp/templates/redis-statefulset.yaml"],
      "fingerprint": {
        "component_type": "data_store",
        "boundary_kind": "ClusterBoundary",
        "source_files": ["helmchart/myapp/templates/redis-statefulset.yaml"],
        "source_directories": ["helmchart/myapp/templates/"],
        "class_names": [],
        "namespace": "",
        "api_routes": [],
        "config_keys": ["REDIS_HOST", "REDIS_PORT"],
        "dependencies": [],
        "inbound_from": ["InferencingFlow"],
        "outbound_to": [],
        "protocols": ["TCP"]
      },
      "sidecars": []
    }
  ],

  "boundaries": [
    {
      "id": "DataLayer",
      "display": "資料層",
      "aliases": ["資料邊界", "持久化層"],
      "kind": "ClusterBoundary",
      "contains": ["RedisStateStore", "VectorDB"],
      "contains_fingerprint": "RedisStateStore|VectorDB"
    }
  ],

  "flows": [
    {
      "id": "DF_InferencingFlow_to_Redis",
      "display": "DF25: InferencingFlow → Redis",
      "from": "InferencingFlow",
      "to": "RedisStateStore",
      "protocol": "TCP",
      "label": "狀態儲存操作",
      "bidirectional": true,
      "security": {
        "encryption": "none",
        "authentication": "none"
      }
    }
  ],

  "threats": [
    {
      "id": "T05.I",
      "identity_key": {
        "component_id": "RedisStateStore",
        "stride_category": "I",
        "attack_surface": "helmchart/values.yaml:redis.tls.enabled",
        "data_flow_id": "DF_InferencingFlow_to_Redis"
      },
      "title": "資訊洩漏 — Redis 未加密流量",
      "description": "Redis 狀態儲存傳輸資料時未使用 TLS...",
      "tier": 1,
      "prerequisites": "無",
      "affected_flow": "DF25",
      "mitigation": "在 Redis 連線啟用 TLS",
      "status": "開啟"
    }
  ],

  "findings": [
    {
      "id": "FIND-01",
      "identity_key": {
        "component_id": "RedisStateStore",
        "vulnerability": "CWE-306",
        "attack_surface": "helmchart/values.yaml:redis.auth"
      },
      "title": "Redis 狀態儲存沒有驗證機制",
      "severity": "嚴重",
      "cvss_score": 9.4,
      "cvss_vector": "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
      "cwe": "CWE-306",
      "owasp": "A07:2025",
      "tier": 1,
      "effort": "低",
      "related_threats": ["T05.I", "T05.T"],
      "evidence_files": ["helmchart/myapp/values.yaml"],
      "component": "Redis 狀態儲存"
    }
  ],

  "metrics": {
    "total_components": 15,
    "total_flows": 30,
    "total_boundaries": 7,
    "total_threats": 97,
    "total_findings": 18,
    "threats_by_tier": { "T1": 12, "T2": 53, "T3": 32 },
    "findings_by_tier": { "T1": 7, "T2": 7, "T3": 4 },
    "findings_by_severity": { "嚴重": 4, "重要": 8, "中等": 6 },
    "threats_by_stride": { "S": 14, "T": 19, "R": 8, "I": 20, "D": 15, "E": 14, "A": 7 }
  }
}
```

> **⛔ stride_category 必須是單一字母：** `S`、`T`、`R`、`I`、`D`、`E` 或 `A`。切勿使用完整名稱，例如 `"Spoofing"` 或 `"Denial of Service"`。熱圖計算與比較比對取決於單字母代碼。如果您將 `"stride_category"` 寫為 `"Denial of Service"` 而非 `"stride_category": "D"`，熱圖在 STRIDE 欄位將顯示全為零，而層級（tier）欄位則顯示正確數值 — 這是一個嚴重的資料完整性錯誤。

### 增量分析擴充

產生日誌 `threat-inventory.json` 以進行 **增量分析** 時（請參閱 `incremental-orchestrator.md`），請新增以下欄位：

**頂層欄位：**
- `"incremental": true` — 將此標記為增量報告
- `"baseline_report": "threat-model-20260309-174425"` — 基準報告資料夾的路徑
- `"baseline_commit": "2dd84ab"` — 基準報告的提交 (commit) SHA
- `"target_commit": "abc1234"` — 正在分析的提交
- `"schema_version": "1.1"` — 增量報告使用綱要 (schema) 版本 1.1

**每個元件：** `"change_status"` — 以下之一：
- `"unchanged"` — 原始碼檔案相同或僅有格式修改
- `"modified"` — 與安全性相關的原始碼檔案變更
- `"restructured"` — 檔案已移動或重新命名，邏輯元件相同
- `"removed"` — 原始碼檔案已刪除
- `"new"` — 元件在基準中並不存在
- `"merged_into:{id}"` — 已合併至另一個元件
- `"split_into:{id1},{id2}"` — 已拆分為多個元件

**每個威脅：** `"change_status"` — 以下之一：
- `"still_present"` — 威脅存在於目前的程式碼中，且與之前相同
- `"fixed"` — 弱點已修復（必須引用程式碼變更）
- `"mitigated"` — 已套用部分緩解措施
- `"modified"` — 威脅仍然存在但細節已變更
- `"new_code"` — 來自全新元件的威脅
- `"new_in_modified"` — 由現有元件的程式碼變更所引入的威脅
- `"previously_unidentified"` — 威脅存在於基準程式碼中但未包含在舊報告中
- `"removed_with_component"` — 隨元件一同移除

**每個發現事項：** `"change_status"` — 與每個威脅的值相同，外加：
- `"partially_mitigated"` — 程式碼部分變更，弱點部分殘留

**metrics.status_summary** — 每個元件、威脅及發現事項的 `change_status` 計數。完整的綱要 (schema) 請參閱 `incremental-orchestrator.md` §4f。

### 規範命名規則

**元件識別碼 (Component IDs)** — 源自實際的類別/檔案名稱，採用 PascalCase：
- `SupportabilityAgent.cs` → `SupportabilityAgent`
- `PowerShellCommandExecutor.cs` → `PowerShellCommandExecutor`
- "Redis State Store" → `RedisStateStore`
- "Ingress-NGINX" → `IngressNginx`

**資料流識別碼 (Flow IDs)** — 根據端點確定的：
- 格式：`DF_{Source}_to_{Target}`
- `DF_Operator_to_TerminalUI`
- `DF_InferencingFlow_to_RedisStateStore`

**身分識別鍵 (Identity Keys)** — 每個威脅與發現事項都會獲得一個規範的身分識別鍵：
- 威脅：`component_id` + `stride_category` + `attack_surface` + `data_flow_id`
- 發現事項：`component_id` + `vulnerability` (CWE) + `attack_surface`
- 這些鍵獨立於 LLM 生成的內容 — 它們錨定在程式碼構件 (artifacts) 上

### 確定性身分規則 (強制要求)

使用這些規則，使在未變更的程式碼上重複執行時能產生具可比性的清單。

1. **規範識別碼 vs 顯示名稱**
  - `id` 是穩定的身分；`display` 是呈現文字
  - 切勿從發現事項或圖表標籤中的文字敘述推導身分

2. **別名擷取**
  - 每個元件和邊界必須包含一個 `aliases` 陣列
  - 包含從架構/DFD/STRIDE/發現事項中發現的同義詞（去重、排序）
  - 即使顯示用詞在多次執行之間發生變化，也請保持規範的 `id` 穩定

3. **邊界種類分類學 (與 TMT 一致)**
  - 從此集合中使用 `boundary_kind`/`kind` — 描述信任轉換的性質，而非內部內容：
    - `MachineBoundary` — 在不同的主機/虛擬機器之間（例如：主機 ↔ 客體、VM1 ↔ VM2）
    - `NetworkBoundary` — 在網路區域之間（例如：公司區域網路 ↔ 網際網路、DMZ ↔ 內部）
    - `ClusterBoundary` — 在 K8s/容器叢集與外部之間（例如：叢集 ↔ 外部服務）
    - `ProcessBoundary` — 在同一主機上的作業系統程序或容器之間（例如：sidecar ↔ 主容器）
    - `PrivilegeBoundary` — 在不同的權限等級之間（例如：使用者模式 ↔ 核心、無權限 ↔ 管理員）
    - `SandboxBoundary` — 在沙箱化和非沙箱化執行之間（例如：瀏覽器沙箱、WASM）
  - 每個值回答：「越過這條線時發生了什麼變化？」（不同的機器、網路、叢集、程序、權限、沙箱）
  - 請勿使用元件分組標籤（DataStorage、ApplicationCore、AgentExecution）作為邊界種類 — 這些描述的是內部的內容，而非信任轉換的性質

3b. **邊界 ID 衍生** (強制性 — 套用與元件相同的確定性命名)
  - 從部署/基礎設施名稱衍生邊界 ID，而非抽象概念：
    - Docker 主機 → `Docker`（絕非 `DockerEnvironment` 或 `ContainerRuntime`）
    - Kubernetes 叢集 → `K8sCluster`（絕非 `KubernetesEnvironment`）
    - 操作員的機器 → `OperatorWorkstation`（絕非 `HostOS` 或 `LocalMachine`）
    - 外部雲端服務 → `ExternalServices`（絕非 `CloudBoundary`）
    - 資料儲存分組 → `DataStorage`（絕非 `DataLayer` 或 `PersistenceLayer`）
    - 後端應用程式服務 → `BackendServices`（絕非 `AppBoundary` 或 `ApplicationCore`）
    - ML/AI 推論模型 → `MLModels`（絕非 `InferenceModels` 或 `ModelBoundary`）
    - DMZ/公共區域 → `PublicZone`（絕非 `DMZBoundary` 或 `IngressZone`）
    - 代理執行 → `AgentExecution`（保持此精確 ID）
    - 工具執行 → `ToolExecution`（保持此精確 ID）
  - 一旦在步驟 1 中選擇了邊界 ID，請在所有地方使用它（DFD、表格、JSON）
  - 切勿在同一程式碼的多次執行之間重構包含關係（相同元件 → 相同邊界）

4. **元件指紋**
  - `fingerprint` 必須根據穩定的證據建置：
    - 已排序的 `source_files` — 主要來源檔案的完整檔案路徑
    - 已排序的 `source_directories` — 來源檔案的父目錄路徑（在重構時比檔案名稱更穩定）
    - 已排序的 `class_names` — 元件來源檔案中定義的主要類別、結構或介面名稱（例如：`["HealthServer", "IHealthService"]`）。對於非程式碼元件（資料儲存、外部服務），請留空。
    - `namespace` — 主要命名空間/套件（例如：C# 的 `"MCP.Core.Servers.Health"`，Python 的 `"ragapp.src.ingestflow"`）。對於非程式碼元件請留空。
    - 已排序的 `api_routes` — 此元件公開的 HTTP API 端點模式（例如：`["/api/health", "/api/v1/chat"]`）。如果不是 HTTP 服務則留空。
    - 已排序的 `config_keys` — 此元件耗用的環境變數和組態金鑰（例如：`["AZURE_OPENAI_ENDPOINT", "REDIS_HOST"]`）。從 appsettings.json、.env 檔案、Helm 值或讀取環境變數的程式碼中擷取。
    - 已排序的 `dependencies` — 特定於此元件的外部套件/函式庫相依性（例如：NuGet 的 `["Microsoft.SemanticKernel", "Azure.AI.OpenAI"]`，pip 的 `["pymilvus", "fastapi"]`）。僅包含具有此元件特徵的套件，不包含架構範圍的相依性。
    - 已排序的 `inbound_from` 和 `outbound_to` 元件 ID
    - 已排序的 `protocols`
    - `component_type` 和 `boundary_kind`
  - 指紋中請勿包含可變的散文（prose）
  - **確定性比對優先級：** `source_directories` > `class_names` > `namespace` > `api_routes` > `config_keys` 都是在元件重新命名後仍能存續的高度穩定訊號。共享其中任何一項的兩個元件幾乎可以肯定就是同一個真實元件。

  **指紋欄位 → 比較比對訊號對應表：**
  | 指紋欄位 | 比較訊號 | 最高分數 | 穩定性 |
  |---|---|---|---|
  | `source_files` | 訊號 2 — 來源檔案/目錄重疊 | +30 | 高（檔案極少移動） |
  | `source_directories` | 訊號 2 — 來源檔案/目錄重疊 | +25 | 非常高（目錄幾乎從不變動） |
  | `class_names` | 訊號 3 — 類別/命名空間符合 | +25 | 非常高（類別極少重新命名） |
  | `namespace` | 訊號 3 — 類別/命名空間符合 | +20 | 非常高（命名空間是結構性的） |
  | `api_routes` | 訊號 4 — API 路由 / 組態金鑰重疊 | +15 | 高（API 合約有版本控制） |
  | `config_keys` | 訊號 4 — API 路由 / 組態金鑰重疊 | +10 | 高（組態金鑰很穩定） |
  | `dependencies` | 訊號 4 — API 路由 / 組態金鑰重疊 | +5 | 中（套件隨升級而改變） |
  | `inbound_from` / `outbound_to` | 訊號 5 — 拓撲重疊 | +15 | 低（使用可能發生偏移的元件 ID） |
  | `component_type` + `boundary_kind` | 訊號 6 — 類型 + 邊界種類 | +10 | 中（邊界命名可能有所不同） |
  | `protocols` | （不直接計分 — 用作平手決勝局） | — | 中 |

  **此表格中的每個欄位都必須在分析期間填寫 (步驟 8b)。** 當欄位確實不適用時（例如：資料儲存的 `api_routes`），可以接受空陣列 `[]`。但對於程序類型的元件，`source_directories` 和 `class_names` 絕不能為空 — 這些是主要的比對錨點。

5. **邊界包含指紋**
  - `contains_fingerprint` = 已排序的 `contains` 並以 `|` 連接
  - 在比較期間將此用於邊界重新命名偵測

6. **確定性排序**
  - 在寫入 JSON 之前排序所有陣列和巢狀清單欄位
  - 這使差異保持穩定並防止意外的變動

### 處理規則

1. 在寫入所有 markdown 檔案之後產生 (步驟 8b)
2. 從用於寫入 markdown 檔案的相同分析資料中填入
3. 確保元件 ID 使用從實際類別/檔案名稱衍生的 PascalCase
4. 確保流量 ID 使用規範的 `DF_{Source}_to_{Target}` 格式
5. 所有威脅和發現事項身分金鑰必須參考實際的程式碼構件（檔案路徑、組態金鑰）
6. 包含來自步驟 1 的 git metadata（提交、分支、日期）
7. `metrics` 物件必須與 markdown 報告中的計數相符
8. 此檔案未列在 `0-assessment.md` 的報告檔案表格中
9. 填寫 `aliases`、`boundary_kind`/`kind`、`fingerprint` 和 `contains_fingerprint` 以進行確定性比對
10. 如果一個元件在同一次執行中有多個觀察到的名稱，請保留一個規範的 `id` 並將所有備選名稱儲存在 `aliases` 中

> **⚠️ 關鍵 — 陣列完整性：**
> `threats` 陣列必須為 `2-stride-analysis.md` 中列出的每個威脅包含一個項目。
> `findings` 陣列必須為 `3-findings.md` 中的每個發現事項包含一個項目。
> `components` 陣列必須為元件表（Element Table）中的每個元件包含一個項目。
> **驗證：** `threats.length == metrics.total_threats`、`findings.length == metrics.total_findings`、
> `components.length == metrics.total_components`。如果不匹配，則 JSON 不完整 — 請返回
> 並新增缺失的項目。請勿為了節省空間而截斷陣列。

---

## 自我檢查 — 在寫入每個檔案後執行

⛔ **強制性：** 寫入每個檔案後，驗證這些檢查並回報結果。在繼續之前修復任何 ❌。

### 在 `2-stride-analysis.md` 之後：
- [ ] 摘要表出現在個別元件章節之前
- [ ] 每個元件有 3 個層級子章節（第 1 層、第 2 層、第 3 層）
- [ ] 狀態欄位僅使用：`Open`、`Mitigated`、`Platform`（無 `Accepted Risk`，無 `Needs Review`）
- [ ] 平台比例在限制範圍內（獨立運作 ≤20%，K8s Operator ≤35%）
- [ ] 每個威脅都有單字母的 STRIDE 類別 (S/T/R/I/D/E/A)

### 在 `3-findings.md` 之後：
- [ ] 3 個層級標題：`## Tier 1`、`## Tier 2`、`## Tier 3`（皆存在）
- [ ] 檔案中任何地方皆無 "Accepted Risk" 出現
- [ ] 每個發現事項都有 CVSS 4.0 向量字串
- [ ] 行動摘要：T1=嚴重 (Critical)、T2=升高 (Elevated)、T3=中度 (Moderate) 優先級
- [ ] 第 4 欄標題為 "Assignment Rule"（而非 "Example"）

### 在 `threat-inventory.json` 之後：
- [ ] `threats.length == metrics.total_threats`（零容忍）
- [ ] `findings.length == metrics.total_findings`（零容忍）
- [ ] 如果威脅 > 50，請使用子代理/Python/分塊 — 絕非單一 `create_file`
- [ ] 每個元件都有非空的 `fingerprint.source_directories`
- [ ] 陣列按規範金鑰排序
- [ ] **欄位名稱與架構完全相符：** 元件使用 `display`（而非 `display_name`），威脅使用 `stride_category`（而非 `category`），威脅 → 元件連結位於 `identity_key.component_id` 內部（而非頂層 `component_id`），威脅同時具有 `title`（短名稱）和 `description`（較長的散文）— 絕非僅有 `description`

### 在 `0-assessment.md` 之後：
- [ ] 正好有 7 個章節：報告檔案 (Report Files)、執行摘要 (Executive Summary)、行動摘要 (Action Summary)、分析背景與假設 (Analysis Context & Assumptions)、參考文獻 (References Consulted)、報告 Metadata (Report Metadata)、分類參考 (Classification Reference)
- [ ] 每對 `##` 章節之間都有 `---` 水平線

---

## 列舉參考

All reports MUST use these exact values. Do NOT abbreviate, substitute, or invent alternatives.

**元件類型：** `process` | `data_store` | `external_service` | `external_interactor`

**邊界種類 (與 TMT 一致)：** `MachineBoundary` | `NetworkBoundary` | `ClusterBoundary` | `ProcessBoundary` | `PrivilegeBoundary` | `SandboxBoundary`

**可利用性層級：** `Tier 1`（直接暴露 — 無前提條件）| `Tier 2`（有條件風險 — 單一前提條件）| `Tier 3`（縱深防禦 — 多個前提條件）

**STRIDE + 濫用類別：** `S` 偽造 (Spoofing) | `T` 竄改 (Tampering) | `R` 否認 (Repudiation) | `I` 資訊洩漏 (Information Disclosure) | `D` 阻斷服務 (Denial of Service) | `E` 權限提升 (Elevation of Privilege) | `A` 濫用 (Abuse)

**SDL Bugbar 嚴重性：** `Critical` | `Important` | `Moderate` | `Low`

**補救工作量：** `Low` | `Medium` | `High`

**緩解類型 (與 OWASP 一致)：** `Redesign` | `Standard Mitigation` | `Custom Mitigation` | `Existing Control` | `Accept Risk` | `Transfer Risk`

**威脅狀態：** `Open` | `Mitigated` | `Platform`

**發現事項變更狀態 (增量)：** `Still Present` | `Fixed` | `New` | `New (Code)` | `New (Previously Unidentified)` | `Removed`

**OWASP Top 10:2025 後綴：** 一律為 `:2025`（例如：`A01:2025 – Broken Access Control`）
- [ ] 存在 Quick Wins、Needs Verification、Finding Overrides 子章節
- [ ] 已記錄部署模式（K8s Operator vs 獨立運作）
- [ ] 所有 Metadata 值都在反引號中

**同時驗證（適用於所有檔案）：** 輸出中沒有洩漏的指令（⛔、RIGID、NON-NEGOTIABLE）、沒有時間估計、沒有巢狀輸出資料夾。請參閱 `verification-checklist.md` 第 0 階段以取得完整的常見偏差清單。
