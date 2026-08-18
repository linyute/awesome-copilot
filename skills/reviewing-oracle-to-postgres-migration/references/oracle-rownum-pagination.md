# Oracle 至 PostgreSQL：ROWNUM 分頁 vs LIMIT/OFFSET

## 問題

Oracle 使用 `ROWNUM` 虛擬資料欄進行分頁和資料列限制。PostgreSQL 使用標準的 `LIMIT` / `OFFSET` 語法。`ROWNUM` 在*何時*指派方面也有根本上的不同，這會影響篩選行為。

## 行為比較

**Oracle：**
- `ROWNUM` 在 `ORDER BY` 之前指派 — 在未排序的結果集上使用 `ROWNUM` 篩選是不具決定性的
- 取得「排序後的前 N 筆資料列」的常見模式需要子查詢：
  ```sql
  SELECT * FROM (SELECT * FROM t ORDER BY col) WHERE ROWNUM <= 10
  ```
- `ROWNUM BETWEEN n AND m` 需要雙重包裝的子查詢

**PostgreSQL：**
- `LIMIT n` 在套用 `ORDER BY` 之後限制結果資料列 — 直接且具決定性
- `OFFSET n` 跳過資料列；與 `LIMIT` 結合以進行分頁
- 不存在 `ROWNUM` 虛擬資料欄

## 程式碼範例

```sql
-- Oracle: 依日期排序的前 10 筆資料列
SELECT * FROM (
  SELECT * FROM orders ORDER BY created_at DESC
) WHERE ROWNUM <= 10;

-- PostgreSQL 對等語法
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Oracle: 第 11–20 筆資料列 (透過 ROWNUM 進行鍵集分頁)
SELECT * FROM (
  SELECT t.*, ROWNUM rn FROM (
    SELECT * FROM orders ORDER BY created_at DESC
  ) t WHERE ROWNUM <= 20
) WHERE rn > 10;

-- PostgreSQL 對等語法
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10 OFFSET 10;
```

## 移轉動作

### 1. 預存程序

將所有基於 `ROWNUM` 的限制模式取代為 `LIMIT`/`OFFSET`：

```sql
-- Oracle
WHERE ROWNUM = 1
WHERE ROWNUM <= :n

-- PostgreSQL
LIMIT 1
LIMIT :n            -- 注意：在 PL/pgSQL 中使用 $n 參數樣式
```

對於子查詢包裝模式：
```sql
-- Oracle
SELECT * FROM (SELECT ... ORDER BY col) WHERE ROWNUM <= :n

-- PostgreSQL
SELECT ... ORDER BY col LIMIT :n
```

### 2. 應用程式程式碼（內嵌 SQL 字串）

在 C# 字串常值、`StringBuilder` 和查詢建構器方法中搜尋 `ROWNUM`。套用上述相同的取代模式。

### 3. 測試

確保整合測試驗證結果集大小正確且排序得以保留（即回傳正確的 *n* 筆資料列，而不僅僅是任意 *n* 筆資料列）。
