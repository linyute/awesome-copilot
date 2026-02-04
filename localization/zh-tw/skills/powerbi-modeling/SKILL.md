---
name: powerbi-modeling
description: '用於建構最佳化資料模型的 Power BI 語義模型建立助手。當處理 Power BI 語義模型、建立量值、設計星狀結構描述、組態關聯、實作 RLS 或最佳化模型效能時使用。針對 DAX 計算、資料表關聯、維度/事實資料表設計、命名慣例、模型文件、基數、交叉篩選方向、計算群組以及資料模型最佳實踐等查詢觸發。在提供建議之前，始終先使用 power-bi-modeling MCP 工具連接到作用中的模型，以了解資料結構。'
---

# Power BI 語義模型建立

引導使用者遵循 Microsoft 最佳實踐，建構經過最佳化且記錄完善的 Power BI 語義模型。
## 何時使用此技能

當使用者詢問以下內容時使用此技能：
- 建立或最佳化 Power BI 語義模型
- 設計星狀結構描述（維度/事實資料表）
- 撰寫 DAX 量值或計算結果欄
- 組態資料表關聯（基數、交叉篩選）
- 實作資料列層級安全性 (RLS)
- 資料表、資料欄、量值的命名慣例
- 為模型新增描述和文件
- 效能調整與最佳化
- 計算群組和欄位參數
- 模型驗證和最佳實踐檢查

**觸發詞：**「建立量值」、「新增關聯」、「星狀結構描述」、「最佳化模型」、「DAX 公式」、「RLS」、「命名慣例」、「模型文件」、「基數」、「交叉篩選」
## 前提條件

### 必要工具
- **Power BI Modeling MCP 伺服器**：連接和修改語義模型所需
  - 啟用：connection_operations、table_operations、measure_operations、relationship_operations 等。
  - 必須組態並執行才能與模型互動

### 選用依賴項
- **Microsoft Learn MCP 伺服器**：建議用於研究最新的最佳實踐
  - 啟用：microsoft_docs_search、microsoft_docs_fetch
  - 用於複雜場景、新功能和官方文件
## 工作流

### 1. 先連接並分析

在提供任何模型建立建議之前，務必先檢查目前的模型狀態：

```
1. 列出連接：connection_operations(operation: "ListConnections")
2. 如果沒有連接，檢查本機執行個體：connection_operations(operation: "ListLocalInstances")
3. 連接到模型 (Desktop 或 Fabric)
4. 取得模型概覽：model_operations(operation: "Get")
5. 列出資料表：table_operations(operation: "List")
6. 列出關聯：relationship_operations(operation: "List")
7. 列出量值：measure_operations(operation: "List")
```

### 2. 評估模型健康狀況

連接後，根據最佳實踐評估模型：

- **星狀結構描述**：資料表是否正確分類為維度或事實？
- **關聯**：基數是否正確？是否盡量減少了雙向篩選？
- **命名**：是否採用人類可讀且一致的命名慣例？
- **文件**：資料表、資料欄、量值是否有描述？
- **量值**：關鍵計算是否有明確的量值？
- **隱藏欄位**：技術資料欄是否在報表檢視中隱藏？

### 3. 提供針對性建議

根據分析，使用參考資料引導改進：
- 星狀結構描述設計：請參閱 [STAR-SCHEMA.md](references/STAR-SCHEMA.md)
- 關聯組態：請參閱 [RELATIONSHIPS.md](references/RELATIONSHIPS.md)
- DAX 量值與命名：請參閱 [MEASURES-DAX.md](references/MEASURES-DAX.md)
- 效能最佳化：請參閱 [PERFORMANCE.md](references/PERFORMANCE.md)
- 資料列層級安全性：請參閱 [RLS.md](references/RLS.md)
## 快速參考：模型品質檢查清單

| 區域 | 最佳實踐 |
|------|--------------|
| 資料表 | 清確的維度與事實資料表分類 |
| 命名 | 人類可讀：使用 `Customer Name` 而非 `CUST_NM` |
| 描述 | 所有資料表、資料欄、量值均有文件記錄 |
| 量值 | 為商務指標建立明確的 DAX 量值 |
| 關聯 | 從維度到事實資料表的一對多關聯 |
| 交叉篩選 | 除非有特定需求，否則使用單向篩選 |
| 隱藏欄位 | 從報表檢視中隱藏技術金鑰和 ID |
| 日期資料表 | 專用的已標記日期資料表 |
## MCP 工具參考

使用這些 Power BI Modeling MCP 操作：

| 操作類別 | 關鍵操作 |
|-------------------|----------------|
| `connection_operations` | Connect, ListConnections, ListLocalInstances, ConnectFabric |
| `model_operations` | Get, GetStats, ExportTMDL |
| `table_operations` | List, Get, Create, Update, GetSchema |
| `column_operations` | List, Get, Create, Update (描述、隱藏、格式) |
| `measure_operations` | List, Get, Create, Update, Move |
| `relationship_operations` | List, Get, Create, Update, Activate, Deactivate |
| `dax_query_operations` | Execute, Validate |
| `calculation_group_operations` | List, Create, Update |
| `security_role_operations` | List, Create, Update, GetEffectivePermissions |

## 常見工作

### 新增帶有描述的量值
```
measure_operations(
  operation: "Create",
  definitions: [{
    name: "Total Sales",
    tableName: "Sales",
    expression: "SUM(Sales[Amount])",
    formatString: "$#,##0",
    description: "所有銷售金額的總和"
  }]
)
```

### 更新資料欄描述
```
column_operations(
  operation: "Update",
  definitions: [{
    tableName: "Customer",
    name: "CustomerKey",
    description: "客戶維度的唯一識別碼",
    isHidden: true
  }]
)
```

### 建立關聯
```
relationship_operations(
  operation: "Create",
  definitions: [{
    fromTable: "Sales",
    fromColumn: "CustomerKey",
    toTable: "Customer",
    toColumn: "CustomerKey",
    crossFilteringBehavior: "OneDirection"
  }]
)
```

## 何時使用 Microsoft Learn MCP

使用 `microsoft_docs_search` 研究目前的最佳實踐：
- 最新的 DAX 函式文件
- 新的 Power BI 功能和功能
- 複雜的模型建立場景（SCD 第 2 類型、多對多）
- 效能最佳化技術
- 安全性實作模式
