# Oracle 至 PostgreSQL：日期函式、序列與 DUAL

## 問題

Oracle 依賴數個內建結構 — `SYSDATE`、`SYSTIMESTAMP`、序列 `NEXTVAL` 語法以及 `DUAL` 虛擬資料表 — 這些在 PostgreSQL 中並不存在。每一項都需要直接替換。

## SYSDATE 與 SYSTIMESTAMP

**Oracle：**
- `SYSDATE` — 回傳目前的日期與時間（無時區）作為 Oracle `DATE` 型別
- `SYSTIMESTAMP` — 回傳包含時區的目前時間戳記

**PostgreSQL：**
- 使用 `NOW()` 或 `CURRENT_TIMESTAMP` 取得包含時區的時間戳記
- 使用 `CURRENT_DATE` 僅取得日期
- 使用 `LOCALTIMESTAMP` 取得不含時區的時間戳記（較接近 Oracle 的 `SYSDATE` 語意）

```sql
-- Oracle
SELECT SYSDATE FROM DUAL;
INSERT INTO t (created_at) VALUES (SYSDATE);

-- PostgreSQL
SELECT NOW();
INSERT INTO t (created_at) VALUES (NOW());
-- 或者，如果資料欄僅為 DATE：
INSERT INTO t (created_at) VALUES (CURRENT_DATE);
```

> **警告：** Oracle `DATE` 儲存日期*與*時間；PostgreSQL `DATE` 僅儲存日期。若型別為 `DATE` 的 Oracle 資料欄帶有時間部分，則 PostgreSQL 目標資料欄應為 `TIMESTAMP`，而非 `DATE`。

## 序列 NEXTVAL 語法

**Oracle：**
```sql
SELECT my_sequence.NEXTVAL FROM DUAL;
INSERT INTO t (id) VALUES (my_sequence.NEXTVAL);
```

**PostgreSQL：**
```sql
SELECT nextval('my_sequence');
INSERT INTO t (id) VALUES (nextval('my_sequence'));
```

主要差異：
- PostgreSQL `nextval()` 是一個函式呼叫，序列名稱作為加上引號的字串引數
- Oracle 使用點標記法：`sequence_name.NEXTVAL`
- Oracle 也有 `CURRVAL` → PostgreSQL `currval('sequence_name')`
- 如果資料欄使用 `DEFAULT nextval(...)` 條件約束（在階段 4 DDL 移轉期間設定），應用程式程式碼可以完全省略序列呼叫，並在 `INSERT` 中省略該資料欄

## DUAL 資料表

Oracle 在沒有真實資料表的情況下評估運算式的 `SELECT` 陳述式中需要 `FROM DUAL` 子句。PostgreSQL 沒有 `DUAL` — 運算式可以在沒有 `FROM` 子句的情況下進行選取。

```sql
-- Oracle
SELECT 1 + 1 FROM DUAL;
SELECT SYSDATE FROM DUAL;
SELECT my_sequence.NEXTVAL FROM DUAL;

-- PostgreSQL
SELECT 1 + 1;
SELECT NOW();
SELECT nextval('my_sequence');
```

> **orafce 擴充功能：** 如果安裝了 `orafce`，它會提供一個 `DUAL` 檢視表，使 Oracle 風格的 `FROM DUAL` 查詢無需變更即可運作。這是一個有用的過渡輔助工具，但不應永久依賴。

## 移轉動作

### 1. 預存程序

- 將所有 `SYSDATE` / `SYSTIMESTAMP` 參照取代為 `NOW()` 或 `CURRENT_TIMESTAMP`（驗證資料欄型別 — 若目標為 `TIMESTAMP WITHOUT TIME ZONE`，請使用 `LOCALTIMESTAMP`）
- 將 `sequence_name.NEXTVAL` 取代為 `nextval('sequence_name')`
- 將 `sequence_name.CURRVAL` 取代為 `currval('sequence_name')`
- 從所有僅含運算式的 `SELECT` 陳述式中移除 `FROM DUAL`

### 2. 應用程式程式碼（內嵌 SQL 字串）

在 C# 字串常值中搜尋 `SYSDATE`、`SYSTIMESTAMP`、`.NEXTVAL`、`.CURRVAL` 和 `FROM DUAL`。套用相同的替代方案。

### 3. 測試

- 驗證日期時間斷言使用時區安全比較（有關 Npgsql 專屬行為，請參閱 `oracle-to-postgres-timestamp-timezone.md`）
- 驗證依賴序列的 ID 在斷言中正確填入
