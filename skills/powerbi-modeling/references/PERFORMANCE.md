# Power BI 模型的效能最佳化

## 資料削減技術

### 1. 移除不必要的資料欄
- 僅匯入報表所需的資料欄
- 除非必要，否則移除稽核資料欄（CreatedBy, ModifiedDate）
- 移除重複/冗餘的資料欄

```
column_operations(operation: "List", filter: { tableNames: ["Sales"] })
// 審查並移除不需要的資料欄
```

### 2. 移除不必要的資料列
- 將歷程記錄資料篩選至相關期間
- 如果不需要，排除已取消/無效的交易
- 在 Power Query 中套用篩選（而非在 DAX 中）

### 3. 降低基數 (Cardinality)
高基數（許多不重複的值）會影響：
- 模型大小
- 重新整理時間
- 查詢效能

**解決方案：**
| 資料欄類型          | 削減技術               |
| ------------------- | ---------------------- |
| 日期時間 (DateTime) | 拆分為日期和時間資料欄 |
| 小數精度            | 四捨五入至所需的精度   |
| 具備模式的文字      | 提取常見的前綴/字尾    |
| 高精度 ID           | 使用代理整數金鑰       |

### 4. 最佳化資料類型
| 從                  | 到                            | 效益                  |
| ------------------- | ----------------------------- | --------------------- |
| 日期時間 (DateTime) | 日期 (Date)（如果不需要時間） | 8 位元組降至 4 位元組 |
| 小數 (Decimal)      | 固定小數 (Fixed Decimal)      | 更好的壓縮效果        |
| 帶數字的文字        | 整數 (Whole Number)           | 顯著提升壓縮效果      |
| 長文字              | 較短的文字                    | 減少儲存空間          |

### 5. 群組與彙總
在不需要詳細資料時預先彙總資料：
- 使用每日而非交易層級
- 使用每月而非每日
- 考慮為 DirectQuery 使用彙總資料表

## 資料欄最佳化

### 優先使用 Power Query 資料欄而非計算結果欄
| 方法             | 何時使用               |
| ---------------- | ---------------------- |
| Power Query (M)  | 可在來源端計算，靜態值 |
| 計算結果欄 (DAX) | 需要模型關聯，動態邏輯 |

Power Query 資料欄：
- 載入速度更快
- 壓縮效果更好
- 使用更少記憶體

### 避免在關聯金鑰上使用計算結果欄
關聯中的 DAX 計算結果欄：
- 無法使用索引
- 為 DirectQuery 生成複雜的 SQL
- 顯著損害效能

**針對多資料欄關聯使用 COMBINEVALUES：**
```dax
// 如果必須為複合金鑰使用計算結果欄
CompositeKey = COMBINEVALUES(",", [Country], [City])
```

### 設定適當的摘要方式
防止非累加性資料欄意外彙總：
```
column_operations(
  operation: "Update",
  definitions: [{
    tableName: "Product",
    name: "UnitPrice",
    summarizeBy: "None"
  }]
)
```

## 關聯最佳化

### 1. 盡量減少雙向關聯
每個雙向關聯會：
- 增加查詢複雜度
- 可能建立歧義路徑
- 降低效能

### 2. 盡可能避免多對多關聯
多對多關聯會：
- 生成更複雜的查詢
- 需要更多記憶體
- 可能產生非預期的結果

### 3. 降低關聯基數
保持關聯資料欄低基數：
- 使用整數金鑰而非文字
- 考慮較高層級的關聯

## DAX 最佳化

### 1. 使用變數
```dax
// 良好 - 計算一次，使用兩次
Sales Growth = 
VAR CurrentSales = [Total Sales]
VAR PriorSales = [PY Sales]
RETURN DIVIDE(CurrentSales - PriorSales, PriorSales)

// 不佳 - 重複計算 [Total Sales] 和 [PY Sales]
Sales Growth = 
DIVIDE([Total Sales] - [PY Sales], [PY Sales])
```

### 2. 避免對整個資料表使用 FILTER
```dax
// 不佳 - 反覆運算整個資料表
Sales High Value = 
CALCULATE([Total Sales], FILTER(Sales, Sales[Amount] > 1000))

// 良好 - 使用資料欄參考
Sales High Value = 
CALCULATE([Total Sales], Sales[Amount] > 1000)
```

### 3. 適當使用 KEEPFILTERS
```dax
// 尊重現有的篩選
Sales with Filter = 
CALCULATE([Total Sales], KEEPFILTERS(Product[Category] = "Bikes"))
```

### 4. 優先使用 DIVIDE 而非除法運算子
```dax
// 良好 - 處理除以零的情況
Margin % = DIVIDE([Profit], [Sales])

// 不佳 - 遇到零會出錯
Margin % = [Profit] / [Sales]
```

## DirectQuery 最佳化

### 1. 盡量減少資料欄與資料表
DirectQuery 模型：
- 針對每個視覺效果查詢來源
- 效能取決於來源端
- 盡量減少擷取的資料量

### 2. 避免複雜的 Power Query 轉換
- 轉換會變成子查詢
- 原生查詢速度更快
- 盡可能在來源端具現化

### 3. 最初保持量值簡單
複雜的 DAX 會生成複雜的 SQL：
- 從基本彙總開始
- 逐漸增加複雜度
- 監控查詢效能

### 4. 停用自動日期/時間
對於 DirectQuery 模型，請停用自動日期/時間：
- 會建立隱藏的計算資料表
- 增加模型複雜度
- 改用明確的日期資料表

## 彙總 (Aggregations)

### 使用者定義的彙總
預先彙總事實資料表以用於：
- 極大型模型（數十億列）
- 混合 DirectQuery/匯入
- 常見查詢模式

```
table_operations(
  operation: "Create",
  definitions: [{
    name: "SalesAgg",
    mode: "Import",
    mExpression: "..."
  }]
)
```

## 效能測試

### 使用效能分析器 (Performance Analyzer)
1. 在 Power BI Desktop 中啟用
2. 開始錄製
3. 與視覺效果互動
4. 審查 DAX 查詢時間

### 使用 DAX Studio 監控
用於以下用途的外部工具：
- 查詢計時
- 伺服器計時
- 查詢計畫

## 驗證清單

- [ ] 已移除不必要的資料欄
- [ ] 已使用適當的資料類型
- [ ] 已處理高基數資料欄
- [ ] 已盡量減少雙向關聯
- [ ] DAX 使用變數處理重複的運算式
- [ ] 未對整個資料表使用 FILTER
- [ ] 使用 DIVIDE 而非除法運算子
- [ ] 已為 DirectQuery 停用自動日期/時間
- [ ] 已使用具代表性的資料測試效能
