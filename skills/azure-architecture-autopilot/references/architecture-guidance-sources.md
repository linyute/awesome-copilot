# 架構指引來源 (用於設計方向決策)

使用 Azure 官方架構指引的來源註冊表，**僅用於設計方向決策**。

> **此文件中的 URL 是「去哪裡尋找資訊」的清單。**
> 請勿將這些 URL 的內容硬編碼為固定事實。
> 請勿將其用於 SKU、API 版本、區域、模型可用性或 PE 對照決策 — 這些項目由 `azure-dynamic-sources.md` 專門處理。

---

## 用途區分

| 用途 | 使用的文件 | 可決策的項目 |
|---------|----------------|-----------------|
| **設計方向決策** | 此文件 (architecture-guidance-sources) | 架構模式、最佳實務、服務組合方向、安全邊界設計 |
| **部署規格核實** | `azure-dynamic-sources.md` | API 版本、SKU、區域、模型可用性、PE groupId、實際屬性值 |

**絕不可使用此文件決定的項目：**
- API 版本
- SKU 名稱/定價
- 區域可用性
- 模型名稱/版本/部署類型
- PE groupId / DNS 區域對照
- 資源屬性的具體數值

---

## 主要來源

用於設計方向決策的針對性擷取 (Fetch) 目標。

| ID | 文件 | URL | 目的 |
|----|----------|-----|---------|
| A1 | Azure 架構中心 | https://learn.microsoft.com/zh-tw/azure/architecture/ | 樞紐 — 尋找領域特定文件的進入點 |
| A2 | Well-Architected 框架 | https://learn.microsoft.com/zh-tw/azure/architecture/framework/ | 安全性/可靠性/效能/成本/營運原則 |
| A3 | 雲端採用框架 (CAF) / 登陸區域 (Landing Zone) | https://learn.microsoft.com/zh-tw/azure/cloud-adoption-framework/ready/landing-zone/ | 企業治理、網路拓撲、訂閱結構 |
| A4 | Azure AI/ML 架構 | https://learn.microsoft.com/zh-tw/azure/architecture/ai-ml/ | AI/ML 工作負載參考架構中心 |
| A5 | 基礎 Foundry 聊天參考架構 | https://learn.microsoft.com/zh-tw/azure/architecture/ai-ml/architecture/basic-azure-ai-foundry-chat | 基於 Foundry 的基礎聊天機器人結構 |
| A6 | 基準 AI Foundry 聊天參考架構 | https://learn.microsoft.com/zh-tw/azure/architecture/ai-ml/architecture/baseline-openai-e2e-chat | Foundry 聊天機器人企業基準 (包含網路隔離) |
| A7 | RAG 解決方案設計指南 | https://learn.microsoft.com/zh-tw/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide | RAG 模式設計指南 |
| A8 | Microsoft Fabric 概觀 | https://learn.microsoft.com/zh-tw/fabric/get-started/microsoft-fabric-overview | Fabric 平台概觀與工作負載瞭解 |
| A9 | Fabric 治理 / 採用 | https://learn.microsoft.com/zh-tw/power-bi/guidance/fabric-adoption-roadmap-governance | Fabric 治理、採用路線圖 |

## 次要來源 (僅供參考)

非直接擷取目標；僅用於瞭解變更。

| 文件 | URL | 附註 |
|----------|-----|-------|
| Azure 更新 (Updates) | https://azure.microsoft.com/zh-tw/updates/ | 服務變更/新功能公告。非針對性擷取目標 |

---

## 擷取觸發條件 — 何時進行查詢

架構指引文件**並非針對每個請求進行查詢。** 僅在符合以下觸發條件時才執行針對性擷取。

### 觸發條件

0. **在第 1 階段識別出使用者的工作負載類型時 (自動執行)**
   - 預先查詢相關工作負載的參考架構，以調整問題的深度
   - 即使使用者未提到「最佳實務」等字眼，也會自動觸發
   - 目的：在問題中反映官方架構建議的設計決策點，而不僅僅是 SKU/區域規格問題
1. **當使用者要求設計方向的證明時**
   - 出現關鍵字，如「最佳實務 (Best practice)」、「參考架構」、「建議結構」、「基準 (Baseline)」、「well-architected」、「登陸區域 (Landing zone)」、「企業模式」
2. **當新服務組合的架構邊界不明確時**
   - 無法從現有的參考檔案/service-gotchas 中確定的服務間關係
3. **當需要企業級安全性/治理設計時**
   - 訂閱結構、網路拓撲、登陸區域模式

### 不適用觸發條件的情況

- 簡單的資源建立 (SKU/API 版本/區域問題) → 僅使用 `azure-dynamic-sources.md`
- 網域包 (Domain-packs) 中已涵蓋的服務組合 → 優先參考檔案
- Bicep 屬性值核實 → `service-gotchas.md` 或 MS 文件的 Bicep 參考資料

---

## 擷取預算 (Fetch Budget)

| 情境 | 最大擷取次數 |
|----------|----------------|
| 預設 (當觸發條件達成時) | 架構指引文件 **最多 2 份** |
| 允許額外擷取的情況 | 文件間存在衝突 / 核心設計仍不明確 / 使用者明確要求更深入的證明 |
| 簡單的部署規格問題 | **0 次** (不查詢架構指引) |

---

## 按問題類型劃分的決策規則

| 問題類型 | 要查詢的文件 | 要擷取的設計決策點 | 不必查詢的文件 |
|--------------|-------------------|----------------------------------|----------------------|
| RAG / 聊天機器人 / Foundry 應用程式 | A5 或 A6 + A7 | 網路隔離層級、身分驗證方法 (受控識別 vs 金鑰)、索引策略 (推送 vs 提取)、監控範圍 | 不要遍歷整個架構中心 |
| 企業安全性 / 治理 / 登陸區域 | A2 + A3 | 訂閱結構、網路拓撲 (中樞-支點 (Hub-Spoke) 等)、身分/治理模型、安全邊界 | 不需要 AI/ML 領域文件 |
| Fabric 資料平台 | A8 + A9 | 容量模型 (SKU 選取標準)、治理層級、資料邊界 (工作區隔離等) | 不需要 AI 相關文件 |
| 模糊的服務組合 (模式不明) | A1 (從中心尋找最接近的領域文件) + 該文件 | 從文件中識別出的關鍵設計決策點 | 不要遍歷所有子文件 |
| 簡單資源建立值 (SKU/API/區域) | 不查詢 | — | 所有架構指引 |
| 一般 AI/ML 架構 | A4 (中心) + 最接近的參考架構 | 運算隔離、資料邊界、模型服務方法 | 不要全面爬取 |

---

## URL 備援規則 (Fallback Rule)

1. 預設使用繁體中文 (`zh-tw`) 或英文 (`en-us`) 的 Learn URL
2. 若特定 URL 回傳 404 / 重新導向 / 已過時 → 退回至父項中心頁面
   - 範例：若 A5 失敗 → 在 A4 (AI/ML 中心) 搜尋「foundry chat」關鍵字
3. 若在父項中心也找不到 → 在 A1 (架構中心主頁) 按標題關鍵字搜尋
4. **不要因為 URL 存在，就將其內容視為固定規則**

---

## 禁止全面遍歷 (Full Traversal)

- 不要廣泛地遍歷 (爬取) 架構中心的子文件
- 僅根據問題類型的決策規則，針對性擷取 1–2 份相關文件
- 即使在擷取的文件中，也僅參考相關章節；不要閱讀整份文件
- 禁止進行無限制的擷取、遞迴追蹤連結或列舉子頁面
