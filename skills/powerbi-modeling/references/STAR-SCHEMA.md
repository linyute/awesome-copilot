# Power BI 的星狀結構描述設計

## 概覽

星狀結構描述是 Power BI 語義模型的最佳設計模式。它將資料組織為：
- **維度資料表**：啟用篩選和群組（「一」端）
- **事實資料表**：啟用彙總（「多」端）

## 資料表分類

### 維度資料表
- 包含用於篩選/交叉分析的描述性屬性
- 具有唯一的金鑰資料欄（每個實體一行）
- 範例：客戶 (Customer)、產品 (Product)、日期 (Date)、地理位置 (Geography)、員工 (Employee)
- 命名慣例：單數名詞 (`Customer`、`Product`)

### 事實資料表
- 包含可測量的定量資料
- 具有指向維度的外鍵
- 以一致的資料粒度儲存資料（每個交易/事件一行）
- 範例：銷售 (Sales)、訂單 (Orders)、庫存 (Inventory)、網頁造訪 (WebVisits)
- 命名慣例：商務流程名詞 (`Sales`、`Orders`)

## 設計原則

### 1. 分離維度與事實
```
不佳： 包含客戶詳細資訊的單一反正規劃「銷售」資料表
良好： 「銷售」事實資料表 + 「客戶」維度資料表
```

### 2. 一致的資料粒度
事實資料表中的每一列都代表相同的事物：
- 訂單列層級（最常見）
- 每日彙總
- 每月摘要

絕不要在一個資料表中混合不同的資料粒度。

### 3. 代理金鑰 (Surrogate Keys)
當來源缺少唯一識別碼時，新增代理金鑰：
```m
// Power Query：新增索引欄
= Table.AddIndexColumn(Source, "CustomerKey", 1, 1)
```

### 4. 日期維度
務必建立專用的日期資料表：
- 在 Power BI 中標記為日期資料表
- 如果需要，包含財政期間
- 新增相對日期資料欄（IsCurrentMonth、IsPreviousYear）

```dax
Date = 
ADDCOLUMNS(
    CALENDAR(DATE(2020,1,1), DATE(2030,12,31)),
    "Year", YEAR([Date]),
    "Month", FORMAT([Date], "MMMM"),
    "MonthNum", MONTH([Date]),
    "Quarter", "Q" & FORMAT([Date], "Q"),
    "WeekDay", FORMAT([Date], "dddd")
)
```

## 特殊維度類型

### 角色扮演維度 (Role-Playing Dimensions)
同一個維度被多次使用（例如，日期的 OrderDate、ShipDate）：
- 選項 1：複製資料表（OrderDate、ShipDate 資料表）
- 選項 2：在 DAX 中搭配 USERELATIONSHIP 使用非作用中的關聯

### 慢速變更維度 (Slowly Changing Dimensions, 第 2 類型)
使用版本資料欄追蹤歷程記錄變更：
- StartDate、EndDate 資料欄
- IsCurrent 旗標
- 需要在資料倉儲中進行預處理

### 雜項維度 (Junk Dimensions)
將低基數的旗標合併到一個資料表中：
```
OrderFlags 維度：IsRush, IsGift, IsOnline
```

### 退化維度 (Degenerate Dimensions)
將交易識別碼（OrderNumber、InvoiceID）保留在事實資料表中。

## 要避免的反面模式 (Anti-Patterns)

| 反面模式             | 問題                 | 解決方案               |
| -------------------- | -------------------- | ---------------------- |
| 寬型反正規劃資料表   | 效能不佳，難以維護   | 拆分為星狀結構描述     |
| 雪花式（正規化維度） | 額外的聯結會損害效能 | 展平維度               |
| 無橋接的多對多       | 產生歧義的結果       | 新增橋接/連接資料表    |
| 混合粒度事實         | 彙總不正確           | 每個粒度建立獨立資料表 |

## 驗證清單

- [ ] 每個資料表都明確歸類為維度或事實
- [ ] 事實資料表具有指向所有相關維度的外鍵
- [ ] 維度具有唯一的金鑰資料欄
- [ ] 日期資料表存在且已標記
- [ ] 無循環關聯路徑
- [ ] 命名慣例一致
