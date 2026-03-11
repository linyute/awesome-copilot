# Oracle 到 PostgreSQL 型別強制轉型問題 (Oracle to PostgreSQL Type Coercion Issues)

## 目錄

- 概觀
- 問題 — 症狀、根本原因、範例
- 解決方案 — 字串常值、明確轉型
- 受影響的常見比較運算子
- 偵測策略
- 真實世界範例
- 預防最佳實踐

## 概觀 (Overview)

本文件描述了將 SQL 程式碼從 Oracle 移植到 PostgreSQL 時遇到的常見遷移問題。此問題源於這兩個資料庫在處理比較運算子中的隱式型別轉換方式上的根本差異。

## 問題 (The Problem)

### 症狀 (Symptom)

將 SQL 查詢從 Oracle 遷移到 PostgreSQL 時，您可能會遇到下列錯誤：

```
Npgsql.PostgresException: 42883: operator does not exist: character varying <> integer
POSITION: [line_number]
```

### 根本原因 (Root Cause)

PostgreSQL 具有**嚴格的型別強制執行**，且不會在比較運算子中執行隱式的型別強制轉型。相比之下，Oracle 在比較操作期間會自動將運算元轉換為相容的型別。

#### 範例不匹配 (Example Mismatch)

**Oracle SQL (運作正常)：**

```sql
AND physical_address.pcountry_cd <> 124
```

- `pcountry_cd` 是 `VARCHAR2`
- `124` 是整數常值
- Oracle 靜默地將 `124` 轉換為字串以進行比較

**PostgreSQL (失敗)：**

```sql
AND physical_address.pcountry_cd <> 124
```

```
42883: operator does not exist: character varying <> integer
```

- `pcountry_cd` 是 `character varying`
- `124` 是整數常值
- PostgreSQL 拒絕此比較，因為型別不匹配

## 解決方案 (The Solution)

### 方法 1：使用字串常值 (建議做法)

將整數常值轉換為字串常值：

```sql
AND physical_address.pcountry_cd <> '124'
```

**優點：**

- 語義正確（國家代碼通常儲存為字串）
- 最有效率
- 意圖最清晰

**缺點：**

- 無

### 方法 2：明確型別轉型

將整數明確轉型為字串型別：

```sql
AND physical_address.pcountry_cd <> CAST(124 AS VARCHAR)
```

**優點：**

- 使轉換明確且可見
- 如果值是參數或複雜運算式，則很有用

**缺點：**

- 效率稍低
- 較為冗長

## 受影響的常見比較運算子 (Common Comparison Operators Affected)

所有的比較運算子都可能觸發此問題：

- `<>` (不等於)
- `=` (等於)
- `<` (小於)
- `>` (大於)
- `<=` (小於或等於)
- `>=` (大於或等於)

## 偵測策略 (Detection Strategy)

從 Oracle 遷移到 PostgreSQL 時：

1. **搜尋 WHERE 子句中與字串/Varchar 欄位比較的數值常值**
2. **尋找如下模式：**
   - `column_name <> 123` (其中欄位為 VARCHAR/CHAR)
   - `column_name = 456` (其中欄位為 VARCHAR/CHAR)
   - `column_name IN (1, 2, 3)` (其中欄位為 VARCHAR/CHAR)

3. **程式碼檢閱檢核表：**
   - 所有比較值的型別是否正確？
   - 字串欄位是否一律使用字串常值？
   - 數值欄位是否一律與數值進行比較？

## 真實世界範例 (Real-World Example)

**原始 Oracle 查詢：**

```sql
SELECT ac040.stakeholder_id,
       ac006.organization_etxt
  FROM ac040_stakeholder ac040
  INNER JOIN ac006_organization ac006 ON ac040.stakeholder_id = ac006.organization_id
 WHERE physical_address.pcountry_cd <> 124
   AND LOWER(ac006.organization_etxt) LIKE '%' || @orgtxt || '%'
 ORDER BY UPPER(ac006.organization_etxt)
```

**修正後的 PostgreSQL 查詢：**

```sql
SELECT ac040.stakeholder_id,
       ac006.organization_etxt
  FROM ac040_stakeholder ac040
  INNER JOIN ac006_organization ac006 ON ac040.stakeholder_id = ac006.organization_id
 WHERE physical_address.pcountry_cd <> '124'
   AND LOWER(ac006.organization_etxt) LIKE '%' || @orgtxt || '%'
 ORDER BY UPPER(ac006.organization_etxt)
```

**變更：** `124` → `'124'`

## 預防最佳實踐 (Prevention Best Practices)

1. **使用型別一致的常值：**
   - 針對字串欄位：一律使用字串常值 (`'value'`)
   - 針對數值欄位：一律使用數值常值 (`123`)
   - 針對日期：一律使用日期常值 (`DATE '2024-01-01'`)

2. **利用資料庫工具：**
   - 使用 IDE 的 SQL Linter 來捕捉型別不匹配
   - 在程式碼檢閱期間執行 PostgreSQL 語法驗證

3. **儘早測試：**
   - 在部署前，針對 PostgreSQL 執行遷移查詢
   - 包含執行所有比較運算子的整合測試

4. **文件化：**
   - 在註釋中記錄任何型別強制轉型
   - 為遷移後的程式碼標記修訂歷史記錄

## 參考資料 (References)

- [PostgreSQL 型別轉型文件](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Oracle 型別轉換文件](https://docs.oracle.com/database/121/SQLRF/sql_elements003.htm)
- [Npgsql 例外：運算子不存在](https://www.npgsql.org/doc/api/NpgsqlException.html)

## 相關問題 (Related Issues)

此問題是更廣泛的 Oracle → PostgreSQL 遷移挑戰的一部分：

- 隱式函式轉換 (例如：`TO_CHAR`, `TO_DATE`)
- 字串串接運算子差異 (`||` 在兩者中皆可運作，但行為不同)
- 數值精度與進位差異
- 比較中的 NULL 處理
