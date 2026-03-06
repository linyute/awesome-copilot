# DAX 量值與命名慣例

## 命名慣例

### 一般規則
- 使用人類可讀的名稱（允許空格）
- 具備描述性：使用 `Total Sales Amount` 而非 `TSA`
- 除非是普遍理解的縮寫，否則避免使用
- 使用一致的大小寫（建議使用首字母大寫 Title Case）
- 避免使用空格以外的特殊字元

### 資料表命名
| 類型             | 慣例     | 範例                             |
| ---------------- | -------- | -------------------------------- |
| 維度 (Dimension) | 單數名詞 | Customer, Product, Date          |
| 事實 (Fact)      | 商務流程 | Sales, Orders, Inventory         |
| 橋接 (Bridge)    | 組合名稱 | CustomerAccount, ProductCategory |
| 量值資料表       | 底線前綴 | _Measures, _KPIs                 |

### 資料欄命名
| 類型           | 慣例                     | 範例                      |
| -------------- | ------------------------ | ------------------------- |
| 金鑰 (Keys)    | 以 "Key" 或 "ID" 為字尾  | CustomerKey, ProductID    |
| 日期 (Dates)   | 以 "Date" 為字尾         | OrderDate, ShipDate       |
| 金額 (Amounts) | 帶有單位提示的描述性名稱 | SalesAmount, QuantitySold |
| 旗標 (Flags)   | 以 "Is" 或 "Has" 為前綴  | IsActive, HasDiscount     |

### 量值命名
| 類型                         | 慣例              | 範例                                |
| ---------------------------- | ----------------- | ----------------------------------- |
| 彙總 (Aggregations)          | 動詞 + 名詞       | Total Sales, Count of Orders        |
| 比率 (Ratios)                | X per Y 或 X Rate | Sales per Customer, Conversion Rate |
| 時間智慧 (Time Intelligence) | 週期 + 指標       | YTD Sales, PY Total Sales           |
| 比較 (Comparisons)           | 指標 + vs + 基準  | Sales vs Budget, Growth vs PY       |

## 明確量值 vs 隱含量值

### 務必針對以下項建立明確量值：
1. 使用者將查詢的關鍵商務指標
2. 包含篩選操作的複雜計算
3. 在 MDX（Excel 樞紐分析表）中使用的量值
4. 受控彙總（防止平均值的總和）

### 隱含量值（資料欄彙總）
- 適用於簡單的探索
- 設定正確的 SummarizeBy 屬性：
  - 金額：總和 (Sum)
  - 金鑰/ID：無 (Do Not Summarize)
  - 比率/價格：無或平均值 (Average)

## 量值模式

### 基本彙總
```dax
Total Sales = SUM(Sales[SalesAmount])
Order Count = COUNTROWS(Sales)
Average Order Value = DIVIDE([Total Sales], [Order Count])
Distinct Customers = DISTINCTCOUNT(Sales[CustomerKey])
```

### 時間智慧（需要日期資料表）
```dax
YTD Sales = TOTALYTD([Total Sales], 'Date'[Date])
MTD Sales = TOTALMTD([Total Sales], 'Date'[Date])
PY Sales = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))
YoY Growth = DIVIDE([Total Sales] - [PY Sales], [PY Sales])
```

### 百分比計算
```dax
Sales % of Total = 
DIVIDE(
    [Total Sales],
    CALCULATE([Total Sales], REMOVEFILTERS(Product))
)

Margin % = DIVIDE([Gross Profit], [Total Sales])
```

### 累積加總 (Running Totals)
```dax
Running Total = 
CALCULATE(
    [Total Sales],
    FILTER(
        ALL('Date'),
        'Date'[Date] <= MAX('Date'[Date])
    )
)
```

## 資料欄參考

### 最佳實踐：始終限定資料欄名稱
```dax
// 良好 - 完全限定
Sales Amount = SUM(Sales[SalesAmount])

// 不佳 - 未限定（可能導致歧義）
Sales Amount = SUM([SalesAmount])
```

### 量值參考：絕不限定
```dax
// 良好 - 未限定的量值
YTD Sales = TOTALYTD([Total Sales], 'Date'[Date])

// 不佳 - 限定的量值（如果主資料表變更會毀損）
YTD Sales = TOTALYTD(Sales[Total Sales], 'Date'[Date])
```

## 文件記錄

### 量值描述
始終新增描述以解釋：
- 量值計算的內容
- 商務上下文/用法
- 任何重要的假設

```
measure_operations(
  operation: "Update",
  definitions: [{
    name: "Total Sales",
    tableName: "Sales",
    description: "所有已完成銷售交易的總和。不包括退貨和取消的訂單。"
  }]
)
```

### 格式字串
| 資料類型 | 格式字串  | 範例輸出  |
| -------- | --------- | --------- |
| 貨幣     | $#,##0.00 | $1,234.56 |
| 百分比   | 0.0%      | 12.3%     |
| 整數     | #,##0     | 1,234     |
| 小數     | #,##0.00  | 1,234.56  |

## 顯示資料夾 (Display Folders)

將量值組織成邏輯群組：
```
measure_operations(
  operation: "Update",
  definitions: [{
    name: "YTD Sales",
    tableName: "_Measures",
    displayFolder: "Time Intelligence\Year"
  }]
)
```

常見資料夾結構：
```
_Measures
├── Sales
│   ├── Total Sales
│   └── Average Sale
├── Time Intelligence
│   ├── Year
│   │   ├── YTD Sales
│   │   └── PY Sales
│   └── Month
│       └── MTD Sales
└── Ratios
    ├── Margin %
    └── Conversion Rate
```

## 效能變數

使用變數以便：
- 避免重複計算相同的運算式
- 提高可讀性
- 啟用偵錯

```dax
Gross Margin % = 
VAR TotalSales = [Total Sales]
VAR TotalCost = [Total Cost]
VAR GrossProfit = TotalSales - TotalCost
RETURN
    DIVIDE(GrossProfit, TotalSales)
```

## 驗證清單

- [ ] 所有關鍵商務指標都有明確的量值
- [ ] 量值具有清晰、具描述性的名稱
- [ ] 量值具有描述
- [ ] 套用了適當的格式字串
- [ ] 顯示資料夾組織了相關量值
- [ ] 資料欄參考已完全限定
- [ ] 量值參考未被限定
- [ ] 複雜計算使用了變數
