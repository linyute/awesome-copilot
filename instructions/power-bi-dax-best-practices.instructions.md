---
description: '基於 Microsoft 指導方針，用於建立高效、可維護和高性能 DAX 函式的 Power BI DAX 最佳實踐和模式。'
applyTo: '**/*.{pbix,dax,md,txt}'
---

# Power BI DAX 最佳實踐

## 概述
本文件根據 Microsoft 的官方指導方針和最佳實踐，提供了在 Power BI 中編寫高效、可維護和高性能 DAX (資料分析表達式) 函式的全面說明。

## 核心 DAX 原則

### 1. 函式結構和變數
始終使用變數來提高性能、可讀性和偵錯：

```dax
// ✅ 推薦：使用變數提高清晰度和性能
Sales YoY Growth % =
VAR CurrentSales = [Total Sales]
VAR PreviousYearSales = 
    CALCULATE(
        [Total Sales],
        SAMEPERIODLASTYEAR('Date'[Date])
    )
RETURN
    DIVIDE(CurrentSales - PreviousYearSales, PreviousYearSales)

// ❌ 避免：沒有變數的重複計算  
Sales YoY Growth % =
DIVIDE(
    [Total Sales] - CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date])),
    CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))
)
```

**變數的主要優點：**
- **性能**：計算只評估一次並快取
- **可讀性**：複雜的函式變得自我文件化
- **偵錯**：可以暫時回傳變數值進行測試
- **可維護性**：只需在一處進行更改

### 2. 正確的引用語法
遵循 Microsoft 建議的欄位和量值引用模式：

```dax
// ✅ 始終完全限定欄位引用
Customer Count = 
DISTINCTCOUNT(Sales[CustomerID])

Profit Margin = 
DIVIDE(
    SUM(Sales[Profit]),
    SUM(Sales[Revenue])
)

// ✅ 絕不完全限定量值引用
YTD Sales Growth = 
DIVIDE([YTD Sales] - [YTD Sales PY], [YTD Sales PY])

// ❌ 避免：不合格的欄位引用
Customer Count = DISTINCTCOUNT([CustomerID])  // 模糊

// ❌ 避免：完全限定的量值引用
Growth Rate = DIVIDE(Sales[Total Sales] - Sales[Total Sales PY], Sales[Total Sales PY])  // 如果量值移動會中斷
```

### 3. 錯誤處理策略
使用適當的模式實施強大的錯誤處理：

```dax
// ✅ 推薦：使用 DIVIDE 函式進行安全除法
Profit Margin = 
DIVIDE([Total Profit], [Total Revenue])

// ✅ 推薦：在模型設計中使用防禦性策略
Average Order Value = 
VAR TotalOrders = COUNTROWS(Orders)
VAR TotalRevenue = SUM(Orders[Amount])
RETURN
    IF(TotalOrders > 0, DIVIDE(TotalRevenue, TotalOrders))

// ❌ 避免：ISERROR 和 IFERROR 函式（性能影響）
Profit Margin = 
IFERROR([Total Profit] / [Total Revenue], BLANK())

// ❌ 避免：可以預防的複雜錯誤處理
Unsafe Calculation = 
IF(
    OR(
        ISBLANK([Revenue]),
        [Revenue] = 0
    ),
    BLANK(),
    [Profit] / [Revenue]
)
```

## DAX 函式類別和最佳實踐

### 聚合函式
```dax
// 使用適當的聚合函式以提高性能
Customer Count = DISTINCTCOUNT(Sales[CustomerID])  // ✅ 用於唯一計數
Order Count = COUNTROWS(Orders)                    // ✅ 用於行計數  
Average Deal Size = AVERAGE(Sales[DealValue])      // ✅ 用於平均值

// 當 COUNTROWS 更合適時避免使用 COUNT
// ❌ COUNT(Sales[OrderID]) - 計數行較慢
// ✅ COUNTROWS(Sales) - 更快、更明確
```

### 篩選和上下文函式
```dax
// 有效使用帶有多個篩選器的 CALCULATE
High Value Customers = 
CALCULATE(
    DISTINCTCOUNT(Sales[CustomerID]),
    Sales[OrderValue] > 1000,
    Sales[OrderDate] >= DATE(2024,1,1)
)

// 正確的上下文修改模式
Same Period Last Year = 
CALCULATE(
    [Total Sales],
    SAMEPERIODLASTYEAR('Date'[Date])
)

// 適當使用 FILTER（避免作為篩選器參數）
// ✅ 推薦：直接篩選表達式
High Value Orders = 
CALCULATE(
    [Total Sales],
    Sales[OrderValue] > 1000
)

// ❌ 避免：FILTER 作為篩選器參數（除非需要表格操作）
High Value Orders = 
CALCULATE(
    [Total Sales],
    FILTER(Sales, Sales[OrderValue] > 1000)
)
```

### 時間智慧模式
```dax
// 標準時間智慧量值
YTD Sales = 
CALCULATE(
    [Total Sales],
    DATESYTD('Date'[Date])
)

MTD Sales = 
CALCULATE(
    [Total Sales],
    DATESMTD('Date'[Date])
)

// 帶有正確日期處理的移動平均
3-Month Moving Average = 
VAR CurrentDate = MAX('Date'[Date])
VAR StartDate = EDATE(CurrentDate, -2)
RETURN
    CALCULATE(
        DIVIDE([Total Sales], 3),
        DATESBETWEEN(
            'Date'[Date],
            StartDate,
            CurrentDate
        )
    )

// 季度環比增長
QoQ Growth = 
VAR CurrentQuarter = [Total Sales]
VAR PreviousQuarter = 
    CALCULATE(
        [Total Sales],
        DATEADD('Date'[Date], -1, QUARTER)
    )
RETURN
    DIVIDE(CurrentQuarter - PreviousQuarter, PreviousQuarter)
```

### 進階 DAX 模式
```dax
// 帶有正確上下文的排名
Product Rank = 
RANKX(
    ALL(Product[ProductName]),
    [Total Sales],
    ,
    DESC,
    DENSE
)

// 累計總計
Running Total = 
CALCULATE(
    [Total Sales],
    FILTER(
        ALL('Date'[Date]),
        'Date'[Date] <= MAX('Date'[Date])
    )
)

// ABC 分析 (Pareto)
ABC Classification = 
VAR CurrentProductSales = [Total Sales]
VAR TotalSales = CALCULATE([Total Sales], ALL(Product))
VAR RunningTotal = 
    CALCULATE(
        [Total Sales],
        FILTER(
            ALL(Product),
            [Total Sales] >= CurrentProductSales
        )
    )
VAR PercentageOfTotal = DIVIDE(RunningTotal, TotalSales)
RETURN
    SWITCH(
        TRUE(),
        PercentageOfTotal <= 0.8, "A",
        PercentageOfTotal <= 0.95, "B",
        "C"
    )
```

## 性能優化技術

### 1. 有效的變數使用
```dax
// ✅ 將昂貴的計算儲存在變數中
Complex Measure = 
VAR BaseCalculation = 
    CALCULATE(
        SUM(Sales[Amount]),
        FILTER(
            Product,
            Product[Category] = "Electronics"
        )
    )
VAR PreviousYear = 
    CALCULATE(
        BaseCalculation,
        SAMEPERIODLASTYEAR('Date'[Date])
    )
RETURN
    DIVIDE(BaseCalculation - PreviousYear, PreviousYear)
```

### 2. 上下文轉換優化
```dax
// ✅ 最小化迭代器函式中的上下文轉換
Total Product Profit = 
SUMX(
    Product,
    Product[UnitPrice] - Product[UnitCost]
)

// ❌ 避免在大型表格中不必要的計算欄位
// 如果可能，請改在 Power Query 中建立
```

### 3. 有效的篩選模式
```dax
// ✅ 有效使用表格表達式
Top 10 Customers = 
CALCULATE(
    [Total Sales],
    TOPN(
        10,
        ALL(Customer[CustomerName]),
        [Total Sales]
    )
)

// ✅ 利用關係篩選
Sales with Valid Customers = 
CALCULATE(
    [Total Sales],
    FILTER(
        Customer,
        NOT(ISBLANK(Customer[CustomerName]))
    )
)
```

## 應避免的常見 DAX 反模式

### 1. 性能反模式
```dax
// ❌ 避免：嵌套的 CALCULATE 函式
Inefficient Nested = 
CALCULATE(
    CALCULATE(
        [Total Sales],
        Product[Category] = "Electronics"
    ),
    'Date'[Year] = 2024
)

// ✅ 推薦：帶有多個篩選器的單一 CALCULATE
Efficient Single = 
CALCULATE(
    [Total Sales],
    Product[Category] = "Electronics",
    'Date'[Year] = 2024
)

// ❌ 避免：不必要地將 BLANK 轉換為零
Sales with Zero = 
IF(ISBLANK([Total Sales]), 0, [Total Sales])

// ✅ 推薦：保持 BLANK 為 BLANK 以獲得更好的視覺行為
Sales = SUM(Sales[Amount])
```

### 2. 可讀性反模式
```dax
// ❌ 避免：沒有變數的複雜嵌套表達式
Complex Without Variables = 
DIVIDE(
    CALCULATE(SUM(Sales[Revenue]), Sales[Date] >= DATE(2024,1,1)) - 
    CALCULATE(SUM(Sales[Revenue]), Sales[Date] >= DATE(2023,1,1), Sales[Date] < DATE(2024,1,1)),
    CALCULATE(SUM(Sales[Revenue]), Sales[Date] >= DATE(2023,1,1), Sales[Date] < DATE(2024,1,1))
)

// ✅ 推薦：清晰的基於變數的結構
Year Over Year Growth = 
VAR CurrentYear = 
    CALCULATE(
        SUM(Sales[Revenue]),
        Sales[Date] >= DATE(2024,1,1)
    )
VAR PreviousYear = 
    CALCULATE(
        SUM(Sales[Revenue]),
        Sales[Date] >= DATE(2023,1,1),
        Sales[Date] < DATE(2024,1,1)
    )
RETURN
    DIVIDE(CurrentYear - PreviousYear, PreviousYear)
```

## DAX 偵錯和測試策略

### 1. 基於變數的偵錯
```dax
// 使用此模式進行逐步偵錯
Debug Measure = 
VAR Step1 = CALCULATE([Sales], 'Date'[Year] = 2024)
VAR Step2 = CALCULATE([Sales], 'Date'[Year] = 2023)  
VAR Step3 = Step1 - Step2
VAR Step4 = DIVIDE(Step3, Step2)
RETURN
    -- 回傳不同的變數進行測試：
    -- Step1  -- 測試當年銷售額
    -- Step2  -- 測試去年銷售額  
    -- Step3  -- 測試差異計算
    Step4     -- 最終結果
```

### 2. 測試模式
```dax
// 在量值中包含資料驗證
Validated Measure = 
VAR Result = [Complex Calculation]
VAR IsValid = 
    Result >= 0 && 
    Result <= 1 && 
    NOT(ISBLANK(Result))
RETURN
    IF(IsValid, Result, BLANK())
```

## 量值組織和命名

### 1. 命名約定
```dax
// 使用描述性、一致的命名
Total Sales = SUM(Sales[Amount])
Total Sales YTD = CALCULATE([Total Sales], DATESYTD('Date'[Date]))
Total Sales PY = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))
Sales Growth % = DIVIDE([Total Sales] - [Total Sales PY], [Total Sales PY])

// 量值類別的前綴
KPI - Revenue Growth = [Sales Growth %]
Calc - Days Since Last Order = DATEDIFF(MAX(Orders[OrderDate]), TODAY(), DAY)
Base - Order Count = COUNTROWS(Orders)
```

### 2. 量值依賴
```dax
// 分層建立量值以實現可重用性
// 基本量值
Revenue = SUM(Sales[Revenue])
Cost = SUM(Sales[Cost])

// 衍生量值  
Profit = [Revenue] - [Cost]
Margin % = DIVIDE([Profit], [Revenue])

// 進階量值
Profit YTD = CALCULATE([Profit], DATESYTD('Date'[Date]))
Margin Trend = [Margin %] - CALCULATE([Margin %], PREVIOUSMONTH('Date'[Date]))
```

## 模型整合最佳實踐

### 1. 使用星型模式
```dax
// 利用適當的關係
Sales by Category = 
CALCULATE(
    [Total Sales],
    Product[Category] = "Electronics"
)

// 使用維度表格進行篩選
Regional Sales = 
CALCULATE(
    [Total Sales],
    Geography[Region] = "North America"
)
```

### 2. 處理缺失的關係
```dax
// 當直接關係不存在時
Cross Table Analysis = 
VAR CustomerList = VALUES(Customer[CustomerID])
RETURN
    CALCULATE(
        [Total Sales],
        FILTER(
            Sales,
            Sales[CustomerID] IN CustomerList
        )
    )
```

## 進階 DAX 概念

### 1. 行上下文與篩選上下文
```dax
// 理解上下文差異
Row Context Example = 
SUMX(
    Sales,
    Sales[Quantity] * Sales[UnitPrice]  // 行上下文
)

Filter Context Example = 
CALCULATE(
    [Total Sales],  // 篩選上下文
    Product[Category] = "Electronics"
)
```

### 2. 上下文轉換
```dax
// 當行上下文變為篩選上下文時
Sales Per Product = 
SUMX(
    Product,
    CALCULATE([Total Sales])  // 上下文轉換發生在這裡
)
```

### 3. 擴展欄位和計算表格
```dax
// 用於複雜的分析場景
Product Analysis = 
ADDCOLUMNS(
    Product,
    "Total Sales", CALCULATE([Total Sales]),
    "Rank", RANKX(ALL(Product), CALCULATE([Total Sales])),
    "Category Share", DIVIDE(
        CALCULATE([Total Sales]),
        CALCULATE([Total Sales], ALL(Product[ProductName]))
    )
)
```

### 4. 進階時間智慧模式
```dax
// 使用計算組進行多週期比較
// 顯示如何建立動態時間計算的範例
Dynamic Period Comparison = 
VAR CurrentPeriodValue = 
    CALCULATE(
        [Sales],
        'Time Intelligence'[Time Calculation] = "Current"
    )
VAR PreviousPeriodValue = 
    CALCULATE(
        [Sales],
        'Time Intelligence'[Time Calculation] = "PY"
    )
VAR MTDCurrent = 
    CALCULATE(
        [Sales],
        'Time Intelligence'[Time Calculation] = "MTD"
    )
VAR MTDPrevious = 
    CALCULATE(
        [Sales],
        'Time Intelligence'[Time Calculation] = "PY MTD"
    )
RETURN
    DIVIDE(MTDCurrent - MTDPrevious, MTDPrevious)

// 使用會計年度和自訂日曆
Fiscal YTD Sales = 
VAR FiscalYearStart = 
    DATE(
        IF(MONTH(MAX('Date'[Date])) >= 7, YEAR(MAX('Date'[Date])), YEAR(MAX('Date'[Date])) - 1),
        7,
        1
    )
VAR FiscalYearEnd = MAX('Date'[Date])
RETURN
    CALCULATE(
        [Total Sales],
        DATESBETWEEN(
            'Date'[Date],
            FiscalYearStart,
            FiscalYearEnd
        )
    )
```

### 5. 進階性能優化技術
```dax
// 優化的累計總計
Running Total Optimized = 
VAR CurrentDate = MAX('Date'[Date])
RETURN
    CALCULATE(
        [Total Sales],
        FILTER(
            ALL('Date'[Date]),
            'Date'[Date] <= CurrentDate
        )
    )

// 使用 RANKX 進行高效的 ABC 分析
ABC Classification Advanced = 
VAR ProductRank = 
    RANKX(
        ALL(Product[ProductName]),
        [Total Sales],
        ,
        DESC,
        DENSE
    )
VAR TotalProducts = COUNTROWS(ALL(Product[ProductName]))
VAR ClassAThreshold = TotalProducts * 0.2
VAR ClassBThreshold = TotalProducts * 0.5
RETURN
    SWITCH(
        TRUE(),
        ProductRank <= ClassAThreshold, "A",
        ProductRank <= ClassBThreshold, "B",
        "C"
    )

// 處理平局的高效 Top N
Top N Products with Ties = 
VAR TopNValue = 10
VAR MinTopNSales = 
    CALCULATE(
        MIN([Total Sales]),
        TOPN(
            TopNValue,
            ALL(Product[ProductName]),
            [Total Sales]
        )
    )
RETURN
    IF(
        [Total Sales] >= MinTopNSales,
        [Total Sales],
        BLANK()
    )
```

### 6. 複雜的分析場景
```dax
// 客戶群組分析
Cohort Retention Rate = 
VAR CohortMonth = 
    CALCULATE(
        MIN('Date'[Date]),
        ALLEXCEPT(Sales, Sales[CustomerID])
    )
VAR CurrentMonth = MAX('Date'[Date])
VAR MonthsFromCohort = 
    DATEDIFF(CohortMonth, CurrentMonth, MONTH)
VAR CohortCustomers = 
    CALCULATE(
        DISTINCTCOUNT(Sales[CustomerID]),
        'Date'[Date] = CohortMonth
    )
VAR ActiveCustomersInMonth = 
    CALCULATE(
        DISTINCTCOUNT(Sales[CustomerID]),
        'Date'[Date] = CurrentMonth,
        FILTER(
            Sales,
            CALCULATE(
                MIN('Date'[Date]),
                ALLEXCEPT(Sales, Sales[CustomerID])
            ) = CohortMonth
        )
    )
RETURN
    DIVIDE(ActiveCustomersInMonth, CohortCustomers)

// 市場籃子分析
Product Affinity Score = 
VAR CurrentProduct = SELECTEDVALUE(Product[ProductName])
VAR RelatedProduct = SELECTEDVALUE('Related Product'[ProductName])
VAR TransactionsWithBoth = 
    CALCULATE(
        DISTINCTCOUNT(Sales[TransactionID]),
        Sales[ProductName] = CurrentProduct
    ) +
    CALCULATE(
        DISTINCTCOUNT(Sales[TransactionID]),
        Sales[ProductName] = RelatedProduct
    ) -
    CALCULATE(
        DISTINCTCOUNT(Sales[TransactionID]),
        Sales[ProductName] = CurrentProduct,
        CALCULATE(
            COUNTROWS(Sales),
            Sales[ProductName] = RelatedProduct,
            Sales[TransactionID] = EARLIER(Sales[TransactionID])
        ) > 0
    )
VAR TotalTransactions = DISTINCTCOUNT(Sales[TransactionID])
RETURN
    DIVIDE(TransactionsWithBoth, TotalTransactions)
```

### 7. 進階偵錯和分析
```dax
// 帶有詳細變數檢查的偵錯量值
Complex Measure Debug = 
VAR Step1_FilteredSales = 
    CALCULATE(
        [Sales],
        Product[Category] = "Electronics",
        'Date'[Year] = 2024
    )
VAR Step2_PreviousYear = 
    CALCULATE(
        [Sales],
        Product[Category] = "Electronics",
        'Date'[Year] = 2023
    )
VAR Step3_GrowthAbsolute = Step1_FilteredSales - Step2_PreviousYear
VAR Step4_GrowthPercentage = DIVIDE(Step3_GrowthAbsolute, Step2_PreviousYear)
VAR DebugInfo = 
    "Current: " & FORMAT(Step1_FilteredSales, "#,0") & 
    " | Previous: " & FORMAT(Step2_PreviousYear, "#,0") &
    " | Growth: " & FORMAT(Step4_GrowthPercentage, "0.00%")
RETURN
    -- 在這些之間切換進行偵錯：
    -- Step1_FilteredSales    -- 測試當年
    -- Step2_PreviousYear     -- 測試去年
    -- Step3_GrowthAbsolute   -- 測試絕對增長
    -- DebugInfo              -- 顯示偵錯資訊
    Step4_GrowthPercentage    -- 最終結果

// 性能監控量值
Query Performance Monitor = 
VAR StartTime = NOW()
VAR Result = [Complex Calculation]
VAR EndTime = NOW()
VAR ExecutionTime = DATEDIFF(StartTime, EndTime, SECOND)
VAR WarningThreshold = 5 // 秒
RETURN
    IF(
        ExecutionTime > WarningThreshold,
        "⚠️ 慢： " & ExecutionTime & "s - " & Result,
        Result
    )
```

### 8. 使用複雜資料類型
```dax
// JSON 解析和操作
Extract JSON Value = 
VAR JSONString = SELECTEDVALUE(Data[JSONColumn])
VAR ParsedValue = 
    IF(
        NOT(ISBLANK(JSONString)),
        PATHCONTAINS(JSONString, "$.analytics.revenue"),
        BLANK()
    )
RETURN
    ParsedValue

// 動態量值選擇
Dynamic Measure Selector = 
VAR SelectedMeasure = SELECTEDVALUE('Measure Selector'[MeasureName])
RETURN
    SWITCH(
        SelectedMeasure,
        "Revenue", [Total Revenue],
        "Profit", [Total Profit],
        "Units", [Total Units],
        "Margin", [Profit Margin %],
        BLANK()
    )
```

## DAX 函式文件

### 1. 註解最佳實踐
```dax
/* 
業務規則：根據以下內容計算客戶生命週期價值：
- 客戶生命週期內的平均訂單價值
- 購買頻率（每年訂單數）  
- 客戶壽命（自首次訂單以來的年數）
- 基於上次訂單日期的保留機率
*/
Customer Lifetime Value = 
VAR AvgOrderValue = 
    DIVIDE(
        CALCULATE(SUM(Sales[Amount])),
        CALCULATE(DISTINCTCOUNT(Sales[OrderID]))
    )
VAR OrdersPerYear = 
    DIVIDE(
        CALCULATE(DISTINCTCOUNT(Sales[OrderID])),
        DATEDIFF(
            CALCULATE(MIN(Sales[OrderDate])),
            CALCULATE(MAX(Sales[OrderDate])),
            YEAR
        ) + 1  -- 加 1 以避免單一年份有訂單的客戶除以零
    )
VAR CustomerLifespanYears = 3  -- 業務假設：平均 3 年關係
RETURN
    AvgOrderValue * OrdersPerYear * CustomerLifespanYears
```

### 2. 版本控制和變更管理
```dax
// 在量值描述中包含版本歷史
/*
版本歷史：
v1.0 - 初始實施 (2024-01-15)
v1.1 - 為邊緣情況添加空值檢查 (2024-02-01)  
v1.2 - 使用變數優化性能 (2024-02-15)
v2.0 - 根據利害關係人回饋更改業務邏輯 (2024-03-01)

業務邏輯：
- 排除退貨和取消的訂單
- 使用發貨日期進行收入確認
- 應用區域稅務計算
*/
```

## 測試和驗證框架

### 1. 單元測試模式
```dax
// 建立測試量值進行驗證
Test - Sales Sum = 
VAR DirectSum = SUM(Sales[Amount])
VAR MeasureResult = [Total Sales]
VAR Difference = ABS(DirectSum - MeasureResult)
RETURN
    IF(Difference < 0.01, "PASS", "FAIL: " & Difference)
```

### 2. 性能測試
```dax
// 監控複雜量值的執行時間
Performance Monitor = 
VAR StartTime = NOW()
VAR Result = [Complex Calculation]
VAR EndTime = NOW()
VAR Duration = DATEDIFF(StartTime, EndTime, SECOND)
RETURN
    "結果： " & Result & " | 持續時間： " & Duration & "s"
```

請記住：始終與業務使用者驗證 DAX 函式，以確保計算符合業務要求和預期。使用 Power BI 的性能分析器和 DAX Studio 進行性能優化和偵錯。