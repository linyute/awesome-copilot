# Oracle 到 PostgreSQL 排序移轉指南

目的：在將查詢移至 PostgreSQL 時，保留類似 Oracle 的排序語意。

## 關鍵要點
- Oracle 和 PostgreSQL 的預設定序（Collation）可能會有顯著差異。
- 僅在您明確需要類似 Oracle 的二進位排序，且無要求其他不同排序規則時，才使用 `COLLATE "C"`。
- 如果 Oracle 使用明確的語言排序（例如 `NLS_SORT = French`），請對應至明確的 PostgreSQL 區域設定定序，而不是強行使用 `"C"`。

## 1) 標準 `SELECT … ORDER BY`
**目標：** 保持 Oracle 樣式的排序。

**模式（僅在需要與 Oracle 相容的二進位排序時）：**
```sql
SELECT col1
FROM your_table
ORDER BY col1 COLLATE "C";
```

**備註：**
- 僅對必須模擬 Oracle 二進位排序的排序運算式套用 `COLLATE "C"`。
- 適用於遞增/遞減和多欄位排序，例如 `ORDER BY col1 COLLATE "C", col2 COLLATE "C" DESC`。

## 1b) 語言環境感知排序（當 Oracle 使用 NLS_SORT 時）

如果 Oracle 使用特定語言環境的排序，例如：
```sql
ORDER BY nlssort(Externalusers.UserID, 'NLS_SORT = French')
```
請對應至明確的 PostgreSQL 定序，例如：
```sql
ORDER BY Externalusers.UserID COLLATE "ca_FR.utf-8"
```

使用目標環境中存在的定序。使用以下查詢搜尋可用的定序：
```sql
SELECT collname, collprovider, collcollate, collctype
FROM pg_collation
ORDER BY collname;
```

## 2) `SELECT DISTINCT … ORDER BY`
**問題：** PostgreSQL 強制要求對於 `DISTINCT`，`ORDER BY` 運算式必須出現在 `SELECT` 清單中，否則會引發：
`Npgsql.PostgresException: 42P10: for SELECT DISTINCT, ORDER BY expressions must appear in select list`

**Oracle 差異：** Oracle 允許在使用 `DISTINCT` 時對未投影的運算式進行排序。

**建議模式（包裝並排序）：**
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
- 外部查詢安全地對結果集進行排序，並在需要的地方加入明確的定序以與 Oracle 排序對齊。

**提示：**
- 確保外部 `ORDER BY` 中使用的任何欄位都包含在內部投影中。
- 對於多欄位排序，整理每個相關運算式：`ORDER BY col2 COLLATE "C", col3 COLLATE "C" DESC`。

## 驗證檢核表
- [ ] 僅在需要的地方套用明確的定序（`"C"` 用於類似 Oracle 的二進位排序，語言環境定序用於語言排序）。
- [ ] 對於 `DISTINCT` 查詢，包裝了投影並在外部查詢中進行排序。
- [ ] 確認排序的欄位存在於內部投影中。
- [ ] 重新執行測試或具代表性的查詢，以驗證排序是否與 Oracle 輸出相符。
