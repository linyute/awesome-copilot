---
name: migrating-oracle-to-postgres-stored-procedures
description: '將 Oracle PL/SQL 預存程序遷移至 PostgreSQL PL/pgSQL。翻譯 Oracle 特定語法、保留方法簽章與型別錨定參數、在適當時利用 orafce，並套用明確的定序對應（僅在適當時使用 `COLLATE "C"`，在需要時使用地區設定定序）。在資料庫遷移期間，將 Oracle 預存程序或函式轉換為 PostgreSQL 對應項目時使用。'
---

# 將預存程序從 Oracle 遷移至 PostgreSQL

將 Oracle PL/SQL 預存程序與函式翻譯為 PostgreSQL PL/pgSQL 對應項目。

## 工作流程

```
進度：
- [ ] 步驟 1：讀取 Oracle 來源程序
- [ ] 步驟 2：翻譯為 PostgreSQL PL/pgSQL
- [ ] 步驟 3：將已遷移的程序寫入 Postgres 輸出目錄
```

**步驟 1：讀取 Oracle 來源程序**

從 `.github/oracle-to-postgres-migration/DDL/Oracle/Procedures and Functions/` 讀取 Oracle 預存程序。請參閱 `.github/oracle-to-postgres-migration/DDL/Oracle/Tables and Views/` 的 Oracle 資料表/檢視定義以進行型別解析。

**步驟 2：翻譯為 PostgreSQL PL/pgSQL**

套用以下翻譯規則：

- 將所有 Oracle 特定語法翻譯為 PostgreSQL 對應項目。
- 保留原始功能與控制流程邏輯。
- 保留型別錨定的輸入參數（例如 `PARAM_NAME IN table_name.column_name%TYPE`）。
- 對傳遞給其他程序的輸出參數使用明確型別（`NUMERIC`、`VARCHAR`、`INTEGER`）— 不要對這些參數使用型別錨定。
- 不要更改方法簽章。
- 除非 Oracle 來源中已存在，否則不要在物件名稱前加上綱要名稱。
- 保留例外處理與回滾邏輯不變。
- 不要產生 `COMMENT` 或 `GRANT` 陳述式。
- 在排序文字時有意識地套用定序：
  - 僅在需要 Oracle 相容的二進位排序且未指定其他排序規則時，才使用 `COLLATE "C"`。
  - 如果 Oracle 使用明確的語言排序（例如 `NLS_SORT = French`），請對應至明確的 PostgreSQL 地區設定定序，而非 `"C"`。
  - 使用 `SELECT collname, collprovider, collcollate, collctype FROM pg_collation ORDER BY collname;` 來探索目標環境中可用的定序。
- 將 `UNION ALL` 視為審查檢查點。驗證每個分支的計劃品質，若合併分支計劃導致效能回退（例如，在大型資料表上出現意外的循序掃描），請重新調整結構。
- 在有助於提高清晰度或保真度時，利用 `orafce` 擴充功能。

請參閱 `.github/oracle-to-postgres-migration/DDL/Postgres/Tables and Views/` 的 PostgreSQL 資料表/檢視定義以了解目標綱要詳情。

**步驟 3：將已遷移的程序寫入 Postgres 輸出目錄**

將每個已遷移的程序放在 `.github/oracle-to-postgres-migration/DDL/Postgres/Procedures and Functions/{PACKAGE_NAME_IF_APPLICABLE}/` 下的獨立檔案中。每個檔案一個程序。
