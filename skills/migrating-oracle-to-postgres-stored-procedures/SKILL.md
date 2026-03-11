---
name: migrating-oracle-to-postgres-stored-procedures
description: '將 Oracle PL/SQL 預存程序遷移至 PostgreSQL PL/pgSQL。翻譯 Oracle 特定的語法，保留方法簽章與類型錨定參數，在適當時利用 orafce，並套用 COLLATE "C" 以實現與 Oracle 相容的文字排序。在資料庫遷移期間將 Oracle 預存程序或函式轉換為 PostgreSQL 等效項時使用。'
---

# 從 Oracle 到 PostgreSQL 遷移預存程序 (Migrating Stored Procedures from Oracle to PostgreSQL)

將 Oracle PL/SQL 預存程序與函式翻譯為 PostgreSQL PL/pgSQL 等效項。

## 工作流程 (Workflow)

```
進度：
- [ ] 步驟 1：讀取 Oracle 來源程序
- [ ] 步驟 2：翻譯為 PostgreSQL PL/pgSQL
- [ ] 步驟 3：將遷移後的程序寫入 Postgres 輸出目錄
```

**步驟 1：讀取 Oracle 來源程序**

從 `.github/oracle-to-postgres-migration/DDL/Oracle/Procedures and Functions/` 讀取 Oracle 預存程序。參考 `.github/oracle-to-postgres-migration/DDL/Oracle/Tables and Views/` 中的 Oracle 資料表/檢視表定義以進行類型解析。

**步驟 2：翻譯為 PostgreSQL PL/pgSQL**

套用這些翻譯規則：

- 將所有 Oracle 特定的語法翻譯為 PostgreSQL 等效項。
- 保留原始功能與控制流程邏輯。
- 保留類型錨定的輸入參數（例如：`PARAM_NAME IN table_name.column_name%TYPE`）。
- 針對傳遞給其他程序的輸出參數使用明確類型（`NUMERIC`, `VARCHAR`, `INTEGER`） — 不要對這些參數進行類型錨定。
- 不要更改方法簽章。
- 除非 Oracle 來源中已存在，否則不要為物件名稱加上 Schema 名稱前綴。
- 保持例外處理與回滾邏輯不變。
- 不要產生 `COMMENT` 或 `GRANT` 語句。
- 在依文字欄位排序時使用 `COLLATE "C"`，以實現與 Oracle 相容的排序。
- 當 `orafce` 擴充功能可以提高清晰度或保真度時，請善加利用。

參考 `.github/oracle-to-postgres-migration/DDL/Postgres/Tables and Views/` 中的 PostgreSQL 資料表/檢視表定義以獲取目標 Schema 詳細資訊。

**步驟 3：將遷移後的程序寫入 Postgres 輸出目錄**

將每個遷移後的程序放置在 `.github/oracle-to-postgres-migration/DDL/Postgres/Procedures and Functions/{PACKAGE_NAME_IF_APPLICABLE}/` 下的獨立檔案中。每個檔案一個程序。
