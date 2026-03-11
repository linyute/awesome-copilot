# Oracle 到 PostgreSQL：TO_CHAR() 數值轉換 (TO_CHAR() Numeric Conversions)

## 目錄

- 問題
- 根本原因
- 解決方案模式 — CAST, 格式字串, 字串串接
- 遷移檢核表
- 應用程式程式碼檢閱
- 測試建議
- 常見位置
- 需留意的錯誤訊息

## 問題 (Problem)

Oracle 允許 `TO_CHAR()` 在不指定格式規範的情況下將數值型別轉換為字串：

```sql
-- Oracle：運作正常
SELECT TO_CHAR(vessel_id) FROM vessels;
SELECT TO_CHAR(fiscal_year) FROM certificates;
```

PostgreSQL 在對數值型別使用 `TO_CHAR()` 時要求必須提供格式字串，否則會引發：

```
42883: function to_char(numeric) does not exist
```

## 根本原因 (Root Cause)

- **Oracle**：不含格式遮罩的 `TO_CHAR(number)` 會使用預設格式將數值隱式轉換為字串。
- **PostgreSQL**：針對數值型別，`TO_CHAR()` 一律要求明確的格式字串（例如：`'999999'`, `'FM999999'`）。

## 解決方案模式 (Solution Patterns)

### 模式 1：使用 CAST (建議做法)

最乾淨的遷移方法是將 `TO_CHAR(numeric_column)` 替換為 `CAST(numeric_column AS TEXT)`：

```sql
-- Oracle
SELECT TO_CHAR(vessel_id) AS vessel_item FROM vessels;

-- PostgreSQL (偏好做法)
SELECT CAST(vessel_id AS TEXT) AS vessel_item FROM vessels;
```

**優點：**

- 在 PostgreSQL 中更具慣用性
- 意圖更清晰
- 不需要格式字串

### 模式 2：提供格式字串

如果您需要特定的數值格式，請使用明確的格式遮罩：

```sql
-- 帶有格式的 PostgreSQL
SELECT TO_CHAR(vessel_id, 'FM999999') AS vessel_item FROM vessels;
SELECT TO_CHAR(amount, 'FM999999.00') AS amount_text FROM payments;
```

**格式遮罩：**

- `'FM999999'`：固定寬度整數 (FM = Fill Mode，移除前導空格)
- `'FM999999.00'`：保留兩位小數
- `'999,999.00'`：帶有千分位分隔符號

### 模式 3：字串串接

針對數值轉換為隱式的簡單串接：

```sql
-- Oracle
WHERE TO_CHAR(fiscal_year) = '2024'

-- PostgreSQL (使用串接)
WHERE fiscal_year::TEXT = '2024'
-- 或
WHERE CAST(fiscal_year AS TEXT) = '2024'
```

## 遷移檢核表 (Migration Checklist)

遷移包含 `TO_CHAR()` 的 SQL 時：

1. **識別所有 TO_CHAR() 呼叫**：在 SQL 字串、預存程序和應用程式查詢中搜尋 `TO_CHAR\(`。
2. **檢查引數型別**：
   - **DATE/TIMESTAMP**：保留帶有格式字串的 `TO_CHAR()`（例如：`TO_CHAR(date_col, 'YYYY-MM-DD')`）。
   - **NUMERIC/INTEGER**：替換為 `CAST(... AS TEXT)` 或加入格式字串。
3. **測試輸出**：驗證字串表示形式是否符合預期（無非預期的空格、小數點等）。
4. **更新比較邏輯**：如果是進行數值與字串的比較，請確保兩側型別一致。

## 應用程式程式碼檢閱 (Application Code Review)

### C# 範例

```csharp
// 之前 (Oracle)
var sql = "SELECT TO_CHAR(id) AS id_text FROM entities WHERE TO_CHAR(status) = @status";

// 之後 (PostgreSQL)
var sql = "SELECT CAST(id AS TEXT) AS id_text FROM entities WHERE CAST(status AS TEXT) = @status";
```

## 測試建議 (Testing Recommendations)

1. **單元測試**：驗證數值轉字串的轉換是否回傳預期值。

   ```csharp
   [Fact]
   public void GetVesselNumbers_ReturnsVesselIdsAsStrings()
   {
       var results = dal.GetVesselNumbers(certificateType);
       Assert.All(results, item => Assert.True(int.TryParse(item.DISPLAY_MEMBER, out _)));
   }
   ```

2. **整合測試**：確保使用 `CAST()` 的查詢執行時無誤。
3. **比較測試**：驗證帶有數值轉字串比較的 WHERE 子句能正確篩選。

## 常見位置 (Common Locations)

在下列位置搜尋 `TO_CHAR`：

- ✅ 預存程序與函式 (DDL 指令碼)
- ✅ 應用程式資料存取層 (DAL 類別)
- ✅ 動態 SQL 建構器
- ✅ 報表查詢
- ✅ ORM/Entity Framework 原始 SQL

## 需留意的錯誤訊息 (Error Messages to Watch For)

```
Npgsql.PostgresException: 42883: function to_char(numeric) does not exist
Npgsql.PostgresException: 42883: function to_char(integer) does not exist
Npgsql.PostgresException: 42883: function to_char(bigint) does not exist
```

## 另請參閱 (See Also)

- [oracle-to-postgres-type-coercion.md](oracle-to-postgres-type-coercion.md) — 相關的型別轉換問題
- PostgreSQL 文件：[資料型別格式化函式](https://www.postgresql.org/docs/current/functions-formatting.html)
