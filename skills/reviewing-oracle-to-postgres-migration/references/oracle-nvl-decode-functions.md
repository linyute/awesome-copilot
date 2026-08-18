# Oracle 至 PostgreSQL：NVL、DECODE 與 Null 處理函式

## 問題

Oracle 提供了多個函式 — `NVL`、`NVL2`、`DECODE` — 這些函式在標準 SQL 中沒有直接對應項目，但常用於 Oracle 預存程序與內嵌 SQL 中。PostgreSQL 使用標準 SQL 替代方案：`COALESCE`、`NULLIF` 和 `CASE` 運算式。

## 行為比較

### NVL

**Oracle：** `NVL(expr, replacement)` — 若 `expr` 為 `NULL` 則回傳 `replacement`，否則回傳 `expr`。

**PostgreSQL：** 使用 `COALESCE(expr, replacement)` — 針對兩個引數在語意上完全相同。

```sql
-- Oracle
NVL(column_name, 'default')

-- PostgreSQL
COALESCE(column_name, 'default')
```

### NVL2

**Oracle：** `NVL2(expr, not_null_val, null_val)` — 若 `expr` 為 IS NOT NULL 則回傳 `not_null_val`，若為 NULL 則回傳 `null_val`。

**PostgreSQL：** 無直接對應項目 — 使用 `CASE`：

```sql
-- Oracle
NVL2(column_name, 'has value', 'no value')

-- PostgreSQL
CASE WHEN column_name IS NOT NULL THEN 'has value' ELSE 'no value' END
```

### DECODE

**Oracle：** `DECODE(expr, search1, result1, search2, result2, ..., default)` — 基於相等性的 switch 分支。

**PostgreSQL：** 無 `DECODE` 函式 — 使用 `CASE WHEN`：

```sql
-- Oracle
DECODE(status, 1, 'Active', 2, 'Inactive', 'Unknown')

-- PostgreSQL
CASE status
  WHEN 1 THEN 'Active'
  WHEN 2 THEN 'Inactive'
  ELSE 'Unknown'
END
```

注意：Oracle 中的 `DECODE` 將兩個 `NULL` 值視為相等（與 `=` 不同）。若任何搜尋值為 `NULL`，請在對應的 `CASE` 中使用 `IS NULL`：

```sql
-- Oracle: DECODE 將 NULL = NULL 視為相等
DECODE(col, NULL, 'empty', col)

-- PostgreSQL
CASE WHEN col IS NULL THEN 'empty' ELSE col END
```

## 移轉動作

### 1. 預存程序

套用上述直接替代方案。特別注意：
- 數值運算式上的 `NVL` — `COALESCE` 在 PostgreSQL 中對型別敏感；請確保兩個引數為相同型別或進行明確轉型。
- 帶有 `NULL` 搜尋值的 `DECODE` — 在 `CASE` 運算式中使用 `IS NULL` 保護條件進行取代。

### 2. 應用程式程式碼（內嵌 SQL 字串）

在 C# 字串常值與查詢建構器中搜尋 `NVL(`、`NVL2(` 和 `DECODE(`。套用相同的替代方案。

### 3. 測試

撰寫特別測試 `NULL` 輸入的測試案例 — `NVL`/`COALESCE` 的 Oracle → PostgreSQL 轉譯很直接，但 `DECODE` → `CASE` 中圍繞 NULL 相等性的極端情況是無訊息行為差異的常見來源。
