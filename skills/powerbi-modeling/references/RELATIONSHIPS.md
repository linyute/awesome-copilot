# Power BI 中的關聯

## 關聯屬性

### 基數 (Cardinality)
| 類型         | 使用案例             | 備註                 |
| ------------ | -------------------- | -------------------- |
| 一對多 (*:1) | 維度到事實           | 最常見，首選         |
| 多對一 (1:*) | 事實到維度           | 與上述相同，方向相反 |
| 一對一 (1:1) | 維度延伸             | 謹慎使用             |
| 多對多 (*:*) | 橋接資料表、複雜案例 | 需要仔細設計         |

### 交叉篩選方向
| 設定 | 行為                   | 何時使用       |
| ---- | ---------------------- | -------------- |
| 單向 | 篩選從「一」流向「多」 | 預設，效能最佳 |
| 雙向 | 篩選雙向流動           | 僅在必要時使用 |

## 最佳實踐

### 1. 優先使用一對多關聯
```
Customer (1) --> (*) Sales
Product  (1) --> (*) Sales
Date     (1) --> (*) Sales
```

### 2. 使用單向交叉篩選
雙向篩選：
- 會對效能產生負面影響
- 可能建立具備歧義的篩選路徑
- 可能產生非預期的結果

**僅在以下情況下使用雙向篩選：**
- 透過事實資料表進行維度對維度的分析
- 特定的 RLS 需求

**更好的替代方案：** 在 DAX 量值中使用 CROSSFILTER：
```dax
Countries Sold = 
CALCULATE(
    DISTINCTCOUNT(Customer[Country]),
    CROSSFILTER(Customer[CustomerKey], Sales[CustomerKey], BOTH)
)
```

### 3. 資料表之間僅保留一條作用路徑
- 任何兩個資料表之間只能有一個作用中的關聯
- 針對角色扮演維度使用 USERELATIONSHIP：

```dax
Sales by Ship Date = 
CALCULATE(
    [Total Sales],
    USERELATIONSHIP(Sales[ShipDate], Date[Date])
)
```

### 4. 避免具備歧義的路徑
循環參照會導致錯誤。解決方案：
- 停用其中一個關聯
- 重組模型
- 在量值中使用 USERELATIONSHIP

## 關聯模式

### 標準星狀結構描述
```
     [Date]
       |
[Product]--[Sales]--[Customer]
       |
   [Store]
```

### 角色扮演維度
```
[Date] --(作用中)-- [Sales.OrderDate]
   |
   +--(非作用中)-- [Sales.ShipDate]
```

### 橋接資料表 (多對多)
```
[Customer]--(*)--[CustomerAccount]--(*)--[Account]
```

### 無量值事實資料表 (Factless Fact Table)
```
[Product]--[ProductPromotion]--[Promotion]
```
用於擷取不含量值的關聯。

## 透過 MCP 建立關聯

### 列出目前的關聯
```
relationship_operations(operation: "List")
```

### 建立新關聯
```
relationship_operations(
  operation: "Create",
  definitions: [{
    fromTable: "Sales",
    fromColumn: "ProductKey",
    toTable: "Product", 
    toColumn: "ProductKey",
    crossFilteringBehavior: "OneDirection",
    isActive: true
  }]
)
```

### 停用關聯
```
relationship_operations(
  operation: "Deactivate",
  references: [{ name: "在此輸入關聯的 GUID" }]
)
```

## 疑難排解

### 「具備歧義的路徑 (Ambiguous Path)」錯誤
資料表之間存在多個作用中的路徑。
- 檢查項：多個事實資料表共用維度
- 解決方案：停用冗餘關聯

### 不允許雙向篩選
將會建立循環參照。
- 解決方案：重組或使用 DAX CROSSFILTER

### 未偵測到關聯
資料欄可能具有不同的資料類型。
- 確保兩個資料欄具有相同的類型
- 檢查文字金鑰中是否有尾隨空格

## 驗證清單

- [ ] 盡可能讓所有關聯都是一對多
- [ ] 交叉篩選預設為單向
- [ ] 任何兩個資料表之間只有一個作用中的路徑
- [ ] 角色扮演維度使用非作用中的關聯
- [ ] 無循環參照路徑
- [ ] 金鑰資料欄具有匹配的資料類型
