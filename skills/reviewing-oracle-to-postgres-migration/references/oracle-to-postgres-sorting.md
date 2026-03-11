# Oracle 到 PostgreSQL 排序遷移指南 (Oracle to PostgreSQL Sorting Migration Guide)

目的：在將查詢移至 PostgreSQL 時，保留類 Oracle 的排序語義。

## 關鍵要點
- Oracle 通常將一般的 `ORDER BY` 視為二進位/按位元組處理，這會針對 ASCII 提供不分大小寫的排序。
- PostgreSQL 預設值有所不同；若要符合 Oracle 行為，請在排序運算式上使用 `COLLATE "C"`。

## 1) 標準的 `SELECT … ORDER BY`
**目標：** 保持 Oracle 風格的排序。

**模式：**
```sql
SELECT col1
FROM your_table
ORDER BY col1 COLLATE "C";
```

**說明：**
- 將 `COLLATE "C"` 套用到每個必須模擬 Oracle 的排序運算式。
- 適用於遞增/遞減以及多欄位排序，例如：`ORDER BY col1 COLLATE "C", col2 COLLATE "C" DESC`。

## 2) `SELECT DISTINCT … ORDER BY`
**問題：** PostgreSQL 強制要求 `DISTINCT` 的 `ORDER BY` 運算式必須出現在 `SELECT` 清單中，否則會引發：
`Npgsql.PostgresException: 42P10: for SELECT DISTINCT, ORDER BY expressions must appear in select list`

**Oracle 差異：** Oracle 允許在使用 `DISTINCT` 時，依據未投影的運算式進行排序。

**建議模式 (包裝並排序)：**
```sql
SELECT *
FROM (
  SELECT DISTINCT col1, col2
  FROM your_table
) AS distinct_results
ORDER BY col2 COLLATE "C";
```

**原因：**
- 內部查詢執行 `DISTINCT` 投影。
- 外部查詢安全地對結果集進行排序，並加入 `COLLATE "C"` 以對齊 Oracle 排序。

**提示：**
- 確保外部 `ORDER BY` 中使用的任何欄位都包含在內部投影中。
- 針對多欄位排序，為每個相關運算式指定定序：`ORDER BY col2 COLLATE "C", col3 COLLATE "C" DESC`。

## 驗證檢核表
- [ ] 已在每個應遵循 Oracle 排序規則的 `ORDER BY` 中加入 `COLLATE "C"`。
- [ ] 針對 `DISTINCT` 查詢，已包裝投影並在外部查詢中進行排序。
- [ ] 已確認排序的欄位存在於內部投影中。
- [ ] 重新執行測試或具代表性的查詢，以驗證排序是否符合 Oracle 輸出。
