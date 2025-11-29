---
description: '基於 Microsoft 指導方針，用於建立高效能、可延展且可維護的語意模型，採用星狀結構描述原則的綜合性 Power BI 資料模型最佳實務。'
applyTo: '**/*.{pbix,md,json,txt}'
---

# Power BI 資料模型最佳實務

## 概述
本文件提供設計高效能、可延展且可維護的 Power BI 語意模型的綜合性指示，遵循 Microsoft 官方指導方針和維度模型最佳實務。

## 星狀結構描述設計原則

### 1. 基本資料表類型
**維度資料表** - 儲存描述性業務實體：
- 產品、客戶、地理位置、時間、員工
- 包含唯一索引鍵欄位 (最好是代理索引鍵)
- 資料列數相對較少
- 用於篩選、分組和提供內容
- 支援階層式向下鑽研情境

**事實資料表** - 儲存可測量的業務事件：
- 銷售交易、網站點擊、製造事件
- 包含維度資料表的外來索引鍵
- 用於彙總的數值量值
- 資料列數龐大 (通常隨時間增長)
- 代表特定的粒度/詳細程度

Example Star Schema Structure:

DimProduct (Dimension)          FactSales (Fact)              DimCustomer (Dimension)
├── ProductKey (PK)             ├── SalesKey (PK)             ├── CustomerKey (PK)
├── ProductName                 ├── ProductKey (FK)           ├── CustomerName
├── Category                    ├── CustomerKey (FK)          ├── CustomerType  
├── SubCategory                 ├── DateKey (FK)              ├── Region
└── UnitPrice                   ├── SalesAmount               └── RegistrationDate
                               ├── Quantity
DimDate (Dimension)             └── DiscountAmount
├── DateKey (PK)
├── Date
├── Year
├── Quarter
├── Month
└── DayOfWeek

### 2. 資料表設計最佳實務

#### 維度資料表設計
```
✅ 建議：
- 使用代理索引鍵 (自動遞增整數) 作為主索引鍵
- 包含業務索引鍵以用於整合目的
- 建立階層式屬性 (類別 > 子類別 > 產品)
- 使用描述性名稱和適當的資料類型
- 包含「未知」記錄以處理遺失的維度資料
- 保持維度資料表相對精簡 (聚焦屬性)

❌ 避免：
- 在大型模型中使用自然業務索引鍵作為主索引鍵
- 在同一資料表中混合事實和維度特性
- 建立不必要寬的維度資料表
- 未經適當處理而留下遺失值
```

#### 事實資料表設計
```
✅ 建議：
- 儲存所需的最細微粒度資料
- 使用與維度資料表索引鍵相符的外來索引鍵
- 僅包含數值、可測量的欄位
- 在所有事實資料表資料列中保持一致的粒度
- 使用適當的資料類型 (貨幣使用 decimal，計數使用 integer)

❌ 避免：
- 包含描述性文字欄位 (這些屬於維度)
- 在同一事實資料表中混合不同粒度
- 儲存可在查詢時計算的值
- 當代理索引鍵更簡單時使用複合索引鍵
```

## 關聯設計與管理

### 1. 關聯類型與最佳實務

#### 一對多關聯 (標準模式)
```
組態：
- 從維度 (一端) 到事實 (多端)
- 單向篩選 (維度篩選事實)
- 標記為「假設參考完整性」以提升 DirectQuery 效能

範例：
DimProduct (1) ← ProductKey → (*) FactSales
DimCustomer (1) ← CustomerKey → (*) FactSales
DimDate (1) ← DateKey → (*) FactSales
```

#### 多對多關聯 (謹慎使用)
```
使用時機：
✅ 真實的多對多業務關聯
✅ 當橋接資料表模式不可行時
✅ 用於進階分析情境

最佳實務：
- 盡可能建立明確的橋接資料表
- 使用低基數關聯欄位
- 仔細監控效能影響
- 清楚記錄業務規則

橋接資料表範例：
DimCustomer (1) ← CustomerKey → (*) BridgeCustomerAccount (*) ← AccountKey → (1) DimAccount
```

#### 一對一關聯 (罕見)
```
使用時機：
- 擴充維度資料表與額外屬性
- 退化維度情境
- 將個人識別資訊 (PII) 與營運資料分離

實作：
- 考慮盡可能合併到單一資料表
- 用於安全性/隱私權分離
- 維護參考完整性
```

### 2. 關聯組態準則
```
篩選方向：
✅ 單向：預設選擇，最佳效能
✅ 雙向：僅當業務邏輯需要交叉篩選時
❌ 避免：循環關聯路徑

交叉篩選方向：
- 維度到事實：始終單向
- 事實到事實：避免直接關聯，使用共用維度
- 維度到維度：僅當業務邏輯需要時

參考完整性：
✅ 當資料品質有保證時，為 DirectQuery 來源啟用
✅ 透過使用 INNER JOIN 提高查詢效能
❌ 如果來源資料有孤立記錄，請勿啟用
```

## 儲存模式最佳化

### 1. 匯入模式最佳實務
```
使用匯入模式的時機：
✅ 資料大小符合容量限制
✅ 需要複雜的分析計算
✅ 具有穩定資料集的歷史資料分析
✅ 需要最佳查詢效能

最佳化策略：
- 移除不必要的欄位和資料列
- 使用適當的資料類型
- 盡可能預先彙總資料
- 對大型資料集實作增量重新整理
- 最佳化 Power Query 轉換
```

#### 匯入資料縮減技術
```
垂直篩選 (欄位縮減)：
✅ 移除報表或關聯中未使用的欄位
✅ 移除可在 DAX 中計算的導出欄位
✅ 移除僅在 Power Query 中使用的中間欄位
✅ 最佳化資料類型 (整數 vs. 小數，日期 vs. 日期時間)

水平篩選 (資料列縮減)：
✅ 篩選至相關時間段 (例如，過去 3 年的資料)
✅ 篩選至相關業務實體 (活躍客戶、特定區域)
✅ 移除測試、無效或已取消的交易
✅ 實作適當的資料封存策略

資料類型最佳化：
文字 → 數值：盡可能將程式碼轉換為整數
日期時間 → 日期：不需要時間時使用日期類型
小數 → 整數：用於整數度量時使用整數
高精度 → 低精度：符合業務需求
```

### 2. DirectQuery 模式最佳實務
```
使用 DirectQuery 模式的時機：
✅ 資料超出匯入容量限制
✅ 即時資料需求
✅ 安全性/合規性要求資料保留在來源端
✅ 與營運系統整合

最佳化要求：
- 最佳化來源資料庫效能
- 在來源資料表上建立適當的索引
- 最小化複雜的 DAX 計算
- 使用簡單的量值和彙總
- 限制每個報表頁面的視覺效果數量
- 實作查詢縮減技術
```

#### DirectQuery 效能最佳化
```
資料庫最佳化：
✅ 在頻繁篩選的欄位上建立索引
✅ 在關聯索引鍵欄位上建立索引
✅ 對複雜聯結使用具體化檢視表
✅ 實作適當的資料庫維護
✅ 考慮用於分析工作負載的資料行存放區索引

DirectQuery 的模型設計：
✅ 保持 DAX 量值簡單
✅ 避免在大型資料表上使用導出欄位
✅ 嚴格使用星狀結構描述設計
✅ 最小化跨資料表操作
✅ 盡可能在來源中預先彙總資料

查詢效能：
✅ 在報表設計中提早套用篩選
✅ 使用適當的視覺效果類型
✅ 限制高基數篩選
✅ 監控和最佳化緩慢的查詢
```

### 3. 複合模型設計
```
使用複合模型的時機：
✅ 結合歷史 (匯入) 與即時 (DirectQuery) 資料
✅ 使用額外資料來源擴充現有模型
✅ 平衡效能與資料即時性需求
✅ 整合多個 DirectQuery 來源

儲存模式選擇：
匯入：小型維度資料表、歷史彙總事實
DirectQuery：大型事實資料表、即時營運資料
雙重：需要同時處理匯入和 DirectQuery 事實的維度資料表
混合：結合歷史 (匯入) 與近期 (DirectQuery) 資料的事實資料表
```

#### 雙重儲存模式策略
```
雙重模式的用途：
✅ 與匯入和 DirectQuery 事實相關的維度資料表
✅ 小型、緩慢變更的參考資料表
✅ 需要彈性查詢的查閱資料表

組態：
- 將維度資料表設定為雙重模式
- Power BI 自動選擇最佳查詢路徑
- 維護維度資料的單一副本
- 啟用高效的跨來源關聯
```

## 進階模型模式

### 1. 日期資料表設計
```
基本日期資料表屬性：
✅ 連續日期範圍 (無間隙)
✅ 在 Power BI 中標記為日期資料表
✅ 包含標準階層 (年 > 季 > 月 > 日)
✅ 新增業務特定欄位 (會計年度、工作日、假日)
✅ 日期欄位使用日期資料類型

日期資料表實作：
DateKey (整數)：20240315 (YYYYMMDD 格式)
Date (日期)：2024-03-15
Year (整數)：2024
Quarter (文字)：2024 年第一季
Month (文字)：2024 年 3 月
MonthNumber (整數)：3
DayOfWeek (文字)：星期五
IsWorkingDay (布林值)：TRUE
FiscalYear (整數)：2024
FiscalQuarter (文字)：2024 會計年度第三季
```

### 2. 緩慢變更維度 (SCD)
```
類型 1 SCD (覆寫)：
- 使用新值更新現有記錄
- 遺失歷史內容
- 實作和維護簡單
- 用於非關鍵屬性變更

類型 2 SCD (歷史保留)：
- 為變更建立新記錄
- 維護完整的歷史記錄
- 包含生效日期範圍
- 使用代理索引鍵進行唯一識別

實作模式：
CustomerKey (代理)：1, 2, 3, 4
CustomerID (業務)：101, 101, 102, 103
CustomerName：「John Doe」、「John Smith」、「Jane Doe」、「Bob Johnson」
EffectiveDate：2023-01-01、2024-01-01、2023-01-01、2023-01-01
ExpirationDate：2023-12-31、9999-12-31、9999-12-31、9999-12-31
IsCurrent：FALSE、TRUE、TRUE、TRUE
```

### 3. 角色扮演維度
```
情境：日期資料表用於訂單日期、出貨日期、交貨日期

實作選項：

選項 1：多個關聯 (建議)
- 單一日期資料表與事實資料表有多個關聯
- 一個作用中關聯 (訂單日期)
- 出貨日期和交貨日期的非作用中關聯
- 在 DAX 量值中使用 USERELATIONSHIP

選項 2：多個日期資料表
- 獨立資料表：OrderDate、ShipDate、DeliveryDate
- 每個都有專屬關聯
- 對報表作者來說更直觀
- 因重複而導致模型大小更大

DAX 實作：
Sales by Order Date = [Total Sales]  // 使用作用中關聯
Sales by Ship Date = CALCULATE([Total Sales], USERELATIONSHIP(FactSales[ShipDate], DimDate[Date]))
Sales by Delivery Date = CALCULATE([Total Sales], USERELATIONSHIP(FactSales[DeliveryDate], DimDate[Date]))
```

### 4. 多對多橋接資料表
```
情境：學生可以參加多個課程，課程可以有多個學生

橋接資料表設計：
DimStudent (1) ← StudentKey → (*) BridgeStudentCourse (*) ← CourseKey → (1) DimCourse

橋接資料表結構：
StudentCourseKey (PK)：代理索引鍵
StudentKey (FK)：參考 DimStudent
CourseKey (FK)：參考 DimCourse
EnrollmentDate：額外內容
Grade：額外內容
Status：啟用、完成、已放棄

關聯組態：
- DimStudent 到 BridgeStudentCourse：一對多
- BridgeStudentCourse 到 DimCourse：多對一
- 將一個關聯設定為雙向以進行篩選傳播
- 從報表檢視中隱藏橋接資料表
```

## 效能最佳化策略

### 1. 模型大小最佳化
```
欄位最佳化：
✅ 完全移除未使用的欄位
✅ 使用最小的適當資料類型
✅ 使用查閱資料表將高基數文字轉換為整數
✅ 移除冗餘的導出欄位

資料列最佳化：
✅ 篩選至業務相關的時間段
✅ 移除無效、測試或已取消的交易
✅ 適當封存歷史資料
✅ 對於不斷增長的資料集使用增量重新整理

彙總策略：
✅ 預先計算常見的彙總
✅ 使用摘要資料表進行高階報表
✅ 在 Premium 中實作自動彙總
✅ 考慮使用 OLAP Cube 處理複雜的分析需求
```

### 2. 關聯效能
```
索引鍵選擇：
✅ 使用整數索引鍵而非文字索引鍵
✅ 偏好代理索引鍵而非自然索引鍵
✅ 確保來源資料中的參考完整性
✅ 在索引鍵欄位上建立適當的索引

基數最佳化：
✅ 設定正確的關聯基數
✅ 適當時使用「假設參考完整性」
✅ 最小化雙向關聯
✅ 盡可能避免多對多關聯

交叉篩選策略：
✅ 預設使用單向篩選
✅ 僅在需要時啟用雙向
✅ 測試交叉篩選的效能影響
✅ 記錄雙向關聯的業務原因
```

### 3. 查詢效能模式
```
高效模型模式：
✅ 正確的星狀結構描述實作
✅ 正規化的維度資料表
✅ 非正規化的事實資料表
✅ 相關資料表之間的一致粒度
✅ 適當使用導出資料表和欄位

查詢最佳化：
✅ 預先篩選大型資料集
✅ 為資料使用適當的視覺效果類型
✅ 最小化報表中的複雜 DAX
✅ 有效利用模型關聯
✅ 對於大型、即時資料集考慮使用 DirectQuery
```

## 安全性與治理

### 1. 資料列層級安全性 (RLS)
```
實作模式：

使用者型安全性：
[UserEmail] = USERPRINCIPALNAME()

角色型安全性：
VAR UserRole = 
    LOOKUPVALUE(
        UserRoles[Role],
        UserRoles[Email],
        USERPRINCIPALNAME()
    )
RETURN
    Customers[Region] = UserRole

動態安全性：
LOOKUPVALUE(
    UserRegions[Region],
    UserRegions[Email], 
    USERPRINCIPALNAME()
) = Customers[Region]

最佳實務：
✅ 使用不同的使用者帳戶進行測試
✅ 保持安全性邏輯簡單且高效
✅ 清楚記錄安全性要求
✅ 使用安全性角色，而非個別使用者篩選
✅ 考慮複雜 RLS 的效能影響
```

### 2. 資料治理
```
文件要求：
✅ 所有量值的業務定義
✅ 資料沿襲和來源系統對應
✅ 重新整理排程和相依性
✅ 安全性和存取控制文件
✅ 變更管理程序

資料品質：
✅ 實作資料驗證規則
✅ 監控資料完整性
✅ 適當處理遺失值
✅ 驗證業務規則實作
✅ 定期資料品質評估

版本控制：
✅ Power BI 檔案的原始碼控制
✅ 環境升級程序
✅ 變更追蹤和核准程序
✅ 備份和復原程序
```

## 測試與驗證框架

### 1. 模型測試檢查表
```
功能測試：
□ 所有關聯功能正常
□ 量值計算出預期值
□ 篩選適當傳播
□ 安全性規則按設計運作
□ 資料重新整理成功完成

效能測試：
□ 模型在可接受的時間內載入
□ 查詢在 SLA 要求內執行
□ 視覺效果互動反應靈敏
□ 記憶體使用量在容量限制內
□ 完成並行使用者負載測試

資料品質測試：
□ 沒有遺失的外來索引鍵關聯
□ 量值總計與來源系統相符
□ 日期範圍完整且連續
□ 安全性篩選產生正確結果
□ 業務規則正確實作
```

### 2. 驗證程序
```
業務驗證：
✅ 將報表總計與來源系統進行比較
✅ 與業務使用者驗證複雜計算
✅ 測試邊緣案例和邊界條件
✅ 確認業務邏輯實作
✅ 驗證不同篩選條件下的報表準確性

技術驗證：
✅ 使用實際資料量進行效能測試
✅ 並行使用者測試
✅ 使用不同使用者角色進行安全性測試
✅ 資料重新整理測試和監控
✅ 災難復原測試
```

## 應避免的常見反模式

### 1. 結構描述反模式
```
❌ 雪花型結構描述 (除非必要)：
- 多個正規化維度資料表
- 複雜的關聯鏈
- 降低查詢效能
- 對業務使用者來說更複雜

❌ 單一大型資料表：
- 混合事實和維度
- 極端非正規化
- 難以維護和擴充
- 分析查詢效能不佳

❌ 具有直接關聯的多個事實資料表：
- 事實之間的多對多
- 複雜的篩選傳播
- 難以保持一致性
- 最好使用共用維度
```

### 2. 關聯反模式
```
❌ 隨處可見的雙向關聯：
- 效能影響
- 不可預測的篩選行為
- 維護複雜性
- 應為例外，而非規則

❌ 無業務理由的多對多：
- 通常表示缺少維度
- 可能隱藏資料品質問題
- 複雜的偵錯和維護
- 橋接資料表通常是更好的解決方案

❌ 循環關聯：
- 模糊的篩選路徑
- 不可預測的結果
- 偵錯困難
- 始終透過適當的設計避免
```

## 進階資料模型模式

### 1. 緩慢變更維度實作
```powerquery
// 類型 1 SCD：用於基於雜湊的變更偵測的 Power Query 實作
let
    Source = Source,

    #"Added custom" = Table.TransformColumnTypes(
        Table.AddColumn(Source, "Hash", each Binary.ToText(
            Text.ToBinary(
                Text.Combine(
                    List.Transform({[FirstName],[LastName],[Region]}, each if _ = null then "" else _),
                "|")), 
            BinaryEncoding.Hex)
        ),
        {{"Hash", type text}}
    ),

    #"Marked key columns" = Table.AddKey(#"Added custom", {"Hash"}, false),

    #"Merged queries" = Table.NestedJoin(
        #"Marked key columns",
        {"Hash"},
        ExistingDimRecords,
        {"Hash"},
        "ExistingDimRecords", 
        JoinKind.LeftOuter
    ),

    #"Expanded ExistingDimRecords" = Table.ExpandTableColumn(
        #"Merged queries", 
        "ExistingDimRecords", 
        {"Count"},
        {"Count"}
    ),

    #"Filtered rows" = Table.SelectRows(#"Expanded ExistingDimRecords", each ([Count] = null)),

    #"Removed columns" = Table.RemoveColumns(#"Filtered rows", {"Count"})
in
    #"Removed columns"
```

### 2. 查詢摺疊的增量重新整理
```powerquery
// 優化增量重新整理模式
let
  Source = Sql.Database("server","database"),
  Data  = Source{[Schema="dbo",Item="FactInternetSales"]}[Data],
  FilteredByStart = Table.SelectRows(Data, each [OrderDateKey] >= Int32.From(DateTime.ToText(RangeStart,[Format="yyyyMMdd"]))),
  FilteredByEnd = Table.SelectRows(FilteredByStart, each [OrderDateKey] < Int32.From(DateTime.ToText(RangeEnd,[Format="yyyyMMdd"])))
in
  FilteredByEnd
```

### 3. 語意連結整合
```python
# 在 Python 中使用 Power BI 語意模型
import sempy.fabric as fabric
from sempy.relationships import plot_relationship_metadata

relationships = fabric.list_relationships("my_dataset")
plot_relationship_metadata(relationships)
```

### 4. 進階分割策略
```json
// 具有時間型篩選的 TMSL 分割
"partition": {
      "name": "Sales2019",
      "mode": "import",
      "source": {
        "type": "m",
        "expression": [
          "let",
          "    Source = SqlDatabase,",
          "    dbo_Sales = Source{[Schema=\"dbo\",Item=\"Sales\"]}[Data],",
          "    FilteredRows = Table.SelectRows(dbo_Sales, each [OrderDateKey] >= 20190101 and [OrderDateKey] <= 20191231)",
          "in",
          "    FilteredRows"
        ]
      }
}
```

請記住：始終與業務使用者驗證您的模型設計，並使用實際資料量和使用模式進行測試。使用 Power BI 的內建工具，例如效能分析器和 DAX Studio 進行最佳化和偵錯。
