---
name: azure-pricing
description: '使用 Azure 零售價格 API (prices.azure.com) 獲取即時 Azure 零售價格，並估算 Copilot Studio 代理人點數消耗。當使用者詢問任何 Azure 服務的成本、想要比較 SKU 價格、需要定價資料進行成本估算、提到 Azure 定價、Azure 成本、Azure 帳單，或詢問 Copilot Studio 定價、Copilot 點數或代理人使用量估算時使用。涵蓋運算、儲存、網路、資料庫、AI、Copilot Studio 以及所有其他 Azure 服務系列。'
compatibility: 需要連通 prices.azure.com 與 learn.microsoft.com 的網際網路存取權限。無須身分驗證。
metadata:
  author: anthonychu
  version: "1.2"
---

# Azure 定價技能 (Azure Pricing Skill)

使用此技能從公開的 Azure 零售價格 API 檢索即時 Azure 零售定價資料。無須進行身分驗證。

## 何時使用此技能

- 使用者詢問 Azure 服務的成本（例如：「D4s v5 VM 的費用是多少？」）
- 使用者想要比較不同區域或 SKU 的價格
- 使用者需要針對工作負載或架構進行成本估算
- 使用者提到 Azure 定價、Azure 成本或 Azure 帳單
- 使用者詢問預留執行個體 (Reserved instance) 與隨用隨付 (Pay-as-you-go) 定價的差異
- 使用者想要了解節省方案 (Savings plans) 或現貨 (Spot) 定價

## API 端點 (API Endpoint)

```
GET https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview
```

使用 OData 篩選語法附加 `$filter` 作為查詢參數。務必使用 `api-version=2023-01-01-preview` 以確保包含節省方案資料。

## 逐步指引

若使用者請求中有任何不明確之處，請在呼叫 API 前提出澄清問題，以識別正確的篩選欄位與值。

1. **識別篩選欄位**：從使用者請求中識別（服務名稱、區域、SKU、價格類型）。
2. **解析區域**：API 要求 `armRegionName` 值為全小寫且不含空格（例如："East US" → `eastus`, "West Europe" → `westeurope`, "Southeast Asia" → `southeastasia`）。請參閱 [references/REGIONS.md](references/REGIONS.md) 以獲取完整清單。
3. **建立篩選字串**：使用下方欄位建立篩選字串並獲取 URL。
4. **解析 `Items` 陣列**：從 JSON 回應中解析。每個項目皆包含價格與 Metadata。
5. **處理分頁**：若您需要的結果超過前 1000 筆，請遵循 `NextPageLink`（極少需要）。
6. **計算成本估算**：使用 [references/COST-ESTIMATOR.md](references/COST-ESTIMATOR.md) 中的公式產生每月/年度估算值。
7. **呈現結果**：以清晰的摘要表呈現，包含服務、SKU、區域、單位價格以及每月/年度估算值。

## 可篩選欄位 (Filterable Fields)

| 欄位 | 型別 | 範例 |
|---|---|---|
| `serviceName` | 字串（精確匹配，區分大小寫） | `'Functions'`, `'Virtual Machines'`, `'Storage'` |
| `serviceFamily` | 字串（精確匹配，區分大小寫） | `'Compute'`, `'Storage'`, `'Databases'`, `'AI + Machine Learning'` |
| `armRegionName` | 字串（精確匹配，全小寫） | `'eastus'`, `'westeurope'`, `'southeastasia'` |
| `armSkuName` | 字串（精確匹配） | `'Standard_D4s_v5'`, `'Standard_LRS'` |
| `skuName` | 字串（支援 contains） | `'D4s v5'` |
| `priceType` | 字串 | `'Consumption'`, `'Reservation'`, `'DevTestConsumption'` |
| `meterName` | 字串（支援 contains） | `'Spot'` |

使用 `eq` 表示相等，`and` 用於組合，以及 `contains(field, 'value')` 用於部分匹配。

## 篩選字串範例

```
# 美國東部 Functions 的所有消耗價格
serviceName eq 'Functions' and armRegionName eq 'eastus' and priceType eq 'Consumption'

# 西歐的 D4s v5 VM（僅限消耗價格）
armSkuName eq 'Standard_D4s_v5' and armRegionName eq 'westeurope' and priceType eq 'Consumption'

# 某個區域的所有儲存價格
serviceName eq 'Storage' and armRegionName eq 'eastus'

# 特定 SKU 的現貨定價
armSkuName eq 'Standard_D4s_v5' and contains(meterName, 'Spot') and armRegionName eq 'eastus'

# 1 年預留定價
serviceName eq 'Virtual Machines' and priceType eq 'Reservation' and armRegionName eq 'eastus'

# Azure AI / OpenAI 定價（現位於 Foundry Models 下）
serviceName eq 'Foundry Models' and armRegionName eq 'eastus' and priceType eq 'Consumption'

# Azure Cosmos DB 定價
serviceName eq 'Azure Cosmos DB' and armRegionName eq 'eastus' and priceType eq 'Consumption'
```

## 完整獲取 URL 範例

```
https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&$filter=serviceName eq 'Functions' and armRegionName eq 'eastus' and priceType eq 'Consumption'
```

建構 URL 時，將空格進行 URL 編碼為 `%20`，單引號編碼為 `%27`。

## 關鍵回應欄位

```json
{
  "Items": [
    {
      "retailPrice": 0.000016,
      "unitPrice": 0.000016,
      "currencyCode": "USD",
      "unitOfMeasure": "1 Execution",
      "serviceName": "Functions",
      "skuName": "Premium",
      "armRegionName": "eastus",
      "meterName": "vCPU Duration",
      "productName": "Functions",
      "priceType": "Consumption",
      "isPrimaryMeterRegion": true,
      "savingsPlan": [
        { "unitPrice": 0.000012, "term": "1 Year" },
        { "unitPrice": 0.000010, "term": "3 Years" }
      ]
    }
  ],
  "NextPageLink": null,
  "Count": 1
}
```

僅使用 `isPrimaryMeterRegion` 為 `true` 的項目，除非使用者明確要求非主要計量器。

## 支援的 serviceFamily 值

`Analytics`, `Compute`, `Containers`, `Data`, `Databases`, `Developer Tools`, `Integration`, `Internet of Things`, `Management and Governance`, `Networking`, `Security`, `Storage`, `Web`, `AI + Machine Learning`

## 提示 (Tips)

- `serviceName` 值區分大小寫。不確定時，請先依 `serviceFamily` 篩選，以從結果中探索有效的 `serviceName` 值。
- 若結果為空，請嘗試放寬篩選條件（例如：先移除 `priceType` 或區域限制）。
- 除非請求中指定了 `currencyCode`，否則價格一律以 USD 為單位。
- 針對節省方案價格，請查看每個項目上的 `savingsPlan` 陣列（僅限 `2023-01-01-preview` 版本）。
- 請參閱 [references/SERVICE-NAMES.md](references/SERVICE-NAMES.md) 以獲取常見服務名稱及其正確大小寫的目錄。
- 請參閱 [references/COST-ESTIMATOR.md](references/COST-ESTIMATOR.md) 以獲取成本估算公式與模式。
- 請參閱 [references/COPILOT-STUDIO-RATES.md](references/COPILOT-STUDIO-RATES.md) 以獲取 Copilot Studio 計費費率與估算公式。

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|-------|----------|
| 結果為空 | 放寬篩選條件——先移除 `priceType` 或 `armRegionName` |
| 服務名稱錯誤 | 使用 `serviceFamily` 篩選器以發現有效的 `serviceName` 值 |
| 遺漏節省方案資料 | 確保 URL 中包含 `api-version=2023-01-01-preview` |
| URL 錯誤 | 檢查 URL 編碼——空格為 `%20`，引號為 `%27` |
| 結果過多 | 加入更多篩選欄位（區域、SKU、價格類型）以縮小範圍 |

---

# Copilot Studio 代理人使用量估算

當使用者詢問關於 Copilot Studio 定價、Copilot 點數或代理人使用成本時，請使用此章節。

## 何時使用此章節

- 使用者詢問關於 Copilot Studio 定價或成本
- 使用者詢問關於 Copilot 點數或代理人點數消耗
- 使用者想要估算 Copilot Studio 代理人的每月成本
- 使用者提到代理人使用量估算或 Copilot Studio 估算器
- 使用者詢問執行代理人的費用是多少

## 關鍵事實

- **1 Copilot 點數 = $0.01 USD**
- 點數在整個租用戶 (Tenant) 內共享
- 面向員工且具備 M365 Copilot 授權使用者的代理人，其傳統回答、生成式回答與租用戶圖表 (Tenant Graph) 基礎連接皆為零成本
- 超額執行會在達到預付容量的 125% 時觸發

## 逐步估算流程

1. **收集輸入**：從使用者處獲取：代理人類型（員工/客戶）、使用者人數、每月互動次數、知識庫佔比 %、租用戶圖表佔比 %、每次工作階段的工具使用量。
2. **獲取即時計費費率**：使用內建的網頁獲取工具，從下方列出的來源 URL 下載最新費率。這能確保估算始終使用 Microsoft 最新的定價。
3. **解析獲取的內容**：提取目前的計費費率表（各功能類型的點數）。
4. **計算估算值**：使用獲取內容中的費率與公式：
   - `總工作階段數 = 使用者人數 × 每月互動次數`
   - 知識庫點數：套用租用戶圖表基礎連接費率、生成式回答費率與傳統回答費率
   - 代理人工具點數：根據工具呼叫次數套用代理人動作費率
   - 代理人流程 (Flow) 點數：每 100 個動作套用流程費率
   - 提示 (Prompt) 修改器點數：每 10 個回應套用基本/標準/進階費率
5. **呈現結果**：以清晰的表格呈現類別細目、總點數以及預估的 USD 成本。

## 待獲取的來源 URL

回答 Copilot Studio 定價問題時，請獲取這些 URL 的最新內容作為上下文：

| URL | 內容 |
|---|---|
| https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management | 計費費率表、計費範例、超額執行規則 |
| https://learn.microsoft.com/en-us/microsoft-copilot-studio/billing-licensing | 授權選項、M365 Copilot 包含項目、預付 vs 隨用隨付 |

在計算前，至少獲取第一個 URL（計費費率）。第二個 URL 提供授權問題的補充上下文。

請參閱 [references/COPILOT-STUDIO-RATES.md](references/COPILOT-STUDIO-RATES.md) 以獲取費率、公式與計費範例的快取快照（僅在無法進行網頁獲取時作為備援使用）。
