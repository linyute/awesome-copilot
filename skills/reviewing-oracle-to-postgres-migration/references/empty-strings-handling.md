# Oracle 到 PostgreSQL：空字串處理差異 (Empty String Handling Differences)

## 問題 (Problem)

Oracle 會自動將 VARCHAR2 欄位中的空字串 (`''`) 轉換為 `NULL`。PostgreSQL 則保留空字串，將其與 `NULL` 區分開來。這種差異可能會在遷移期間導致應用程式邏輯錯誤和測試失敗。

## 行為比較 (Behavior Comparison)

**Oracle：**
- 在 VARCHAR2 欄位中，空字串 (`''`) **一律** 被視為 `NULL`
- `WHERE column = ''` 絕不會匹配任何資料列；請使用 `WHERE column IS NULL`
- 無法區分明確的空字串與 `NULL`

**PostgreSQL：**
- 空字串 (`''`) 與 `NULL` 是**不同**的值
- `WHERE column = ''` 匹配空字串
- `WHERE column IS NULL` 匹配 `NULL` 值

## 程式碼範例 (Code Example)

```sql
-- Oracle 行為
INSERT INTO table (varchar_column) VALUES ('');
SELECT * FROM table WHERE varchar_column IS NULL;  -- 回傳該資料列

-- PostgreSQL 行為  
INSERT INTO table (varchar_column) VALUES ('');
SELECT * FROM table WHERE varchar_column IS NULL;  -- 什麼都不回傳
SELECT * FROM table WHERE varchar_column = '';     -- 回傳該資料列
```

## 遷移行動 (Migration Actions)

### 1. 預存程序 (Stored Procedures)
更新假設空字串會轉換為 `NULL` 的邏輯：

```sql
-- 保留 Oracle 行為 (將空值轉換為 NULL)：
column = NULLIF(param, '')

-- 或接受 PostgreSQL 行為 (保留空字串)：
column = param
```

### 2. 應用程式程式碼 (Application Code)
檢閱檢查 `NULL` 的程式碼，並確保其適當地處理空字串：

```csharp
// 之前 (Oracle 特定)
if (value == null) { }

// 之後 (與 PostgreSQL 相容)
if (string.IsNullOrEmpty(value)) { }
```

### 3. 測試 (Tests)
更新斷言，使其與兩種行為相容：

```csharp
// 與遷移相容的測試模式
var value = reader.IsDBNull(columnIndex) ? null : reader.GetString(columnIndex);
Assert.IsTrue(string.IsNullOrEmpty(value));
```

### 4. 資料遷移 (Data Migration)
決定是否要：
- 將現有的 `NULL` 值轉換為空字串
- 使用 `NULLIF(column, '')` 將空字串轉換為 `NULL`
- 保持原樣並更新應用程式邏輯
