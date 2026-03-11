# Oracle 到 PostgreSQL：FROM 子句中的括號 (Parentheses in FROM Clause)

## 目錄

- 問題
- 根本原因
- 解決方案模式
- 範例
- 遷移檢核表
- 常見位置
- 應用程式程式碼範例
- 需留意的錯誤訊息
- 測試建議

## 問題 (Problem)

Oracle 允許在 FROM 子句中的資料表名稱周圍加上選填的括號：

```sql
-- Oracle：兩者皆有效
SELECT * FROM (TABLE_NAME) WHERE id = 1;
SELECT * FROM TABLE_NAME WHERE id = 1;
```

PostgreSQL **不允許** 在 FROM 子句中的單一資料表名稱周圍加上額外括號，除非它是衍生資料表或子查詢。嘗試使用此模式會導致：

```
Npgsql.PostgresException: 42601: syntax error at or near ")"
```

## 根本原因 (Root Cause)

- **Oracle**：將 `FROM(TABLE_NAME)` 視為等同於 `FROM TABLE_NAME`
- **PostgreSQL**：FROM 子句中的括號僅在下列情況下有效：
  - 子查詢：`FROM (SELECT * FROM table)`
  - 作為聯結 (Join) 語法一部分的明確資料表參考
  - 通用資料表運算式 (CTE)
  - 若無有效的 SELECT 或聯結上下文，PostgreSQL 會引發語法錯誤

## 解決方案模式 (Solution Pattern)

移除資料表名稱周圍不必要的括號：

```sql
-- Oracle (在 PostgreSQL 中會有問題)
SELECT col1, col2
FROM (TABLE_NAME)
WHERE id = 1;

-- PostgreSQL (正確)
SELECT col1, col2
FROM TABLE_NAME
WHERE id = 1;
```

## 範例 (Examples)

### 範例 1：簡單的資料表參考

```sql
-- Oracle
SELECT employee_id, employee_name
FROM (EMPLOYEES)
WHERE department_id = 10;

-- PostgreSQL (已修復)
SELECT employee_id, employee_name
FROM EMPLOYEES
WHERE department_id = 10;
```

### 範例 2：帶有括號的聯結

```sql
-- Oracle (有問題的)
SELECT e.employee_id, d.department_name
FROM (EMPLOYEES) e
JOIN (DEPARTMENTS) d ON e.department_id = d.department_id;

-- PostgreSQL (已修復)
SELECT e.employee_id, d.department_name
FROM EMPLOYEES e
JOIN DEPARTMENTS d ON e.department_id = d.department_id;
```

### 範例 3：有效的子查詢括號 (在兩者中皆可運作)

```sql
-- Oracle 與 PostgreSQL 皆可
SELECT *
FROM (SELECT employee_id, employee_name FROM EMPLOYEES WHERE department_id = 10) sub;
```

## 遷移檢核表 (Migration Checklist)

在修復此問題時，請驗證：

1. **識別所有有問題的 FROM 子句**：
   - 在 SQL 中搜尋 `FROM (` 模式
   - 驗證左括號是否緊接在 `FROM` 之後，且後方接著資料表名稱
   - 確認它**不是**子查詢（內部沒有 SELECT 關鍵字）

2. **區分有效的括號**：
   - ✅ `FROM (SELECT ...)` — 有效的子查詢
   - ✅ `FROM (table_name` 後接聯結 — 檢查後方是否接著 JOIN 關鍵字
   - ❌ `FROM (TABLE_NAME)` — 無效，移除括號

3. **套用修復**：
   - 移除資料表名稱周圍的括號
   - 保留合法子查詢的括號

4. **徹底測試**：
   - 在 PostgreSQL 中執行查詢
   - 驗證結果集與原始 Oracle 查詢相符
   - 包含在整合測試中

## 常見位置 (Common Locations)

在下列位置搜尋 `FROM (`：

- ✅ 預存程序與函式 (DDL 指令碼)
- ✅ 應用程式資料存取層 (DAL 類別)
- ✅ 動態 SQL 建構器
- ✅ 報表查詢
- ✅ 檢視表與具體化檢視表
- ✅ 具有多重聯結的複雜查詢

## 應用程式程式碼範例 (Application Code Examples)

### VB.NET

```vb
' 之前 (Oracle)
StrSQL = "SELECT employee_id, NAME " _
       & "FROM (EMPLOYEES) e " _
       & "WHERE e.department_id = 10"

' 之後 (PostgreSQL)
StrSQL = "SELECT employee_id, NAME " _
       & "FROM EMPLOYEES e " _
       & "WHERE e.department_id = 10"
```

### C#

```csharp
// 之前 (Oracle)
var sql = "SELECT id, name FROM (USERS) WHERE status = @status";

// 之後 (PostgreSQL)
var sql = "SELECT id, name FROM USERS WHERE status = @status";
```

## 需留意的錯誤訊息 (Error Messages to Watch For)

```
Npgsql.PostgresException: 42601: syntax error at or near ")"
ERROR: syntax error at or near ")"
LINE 1: SELECT * FROM (TABLE_NAME) WHERE ...
                      ^
```

## 測試建議 (Testing Recommendations)

1. **語法驗證**：解析所有遷移後的查詢，以確保其在執行時沒有語法錯誤

   ```csharp
   [Fact]
   public void GetEmployees_ExecutesWithoutSyntaxError()
   {
       // 不應擲出錯誤碼為 42601 的 PostgresException
       var employees = dal.GetEmployees(departmentId: 10);
       Assert.NotEmpty(employees);
   }
   ```

2. **結果比較**：驗證遷移前後的結果集是否完全相同
3. **基於 Regex 的搜尋**：使用模式 `FROM\s*\(\s*[A-Za-z_][A-Za-z0-9_]*\s*\)` 來識別候選對象

## 相關檔案 (Related Files)

- 參考：[oracle-to-postgres-type-coercion.md](oracle-to-postgres-type-coercion.md) — 其他語法差異
- PostgreSQL 文件：[SELECT 語句](https://www.postgresql.org/docs/current/sql-select.html)

## 遷移筆記 (Migration Notes)

- 這是單純的語法修復，沒有語義上的影響
- 不需要資料轉換
- 可以安全地套用自動化尋找與取代，但請手動驗證複雜查詢
- 更新整合測試以執行遷移後的查詢
