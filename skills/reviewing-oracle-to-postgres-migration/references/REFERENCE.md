# 參考索引 (Reference Index)

| 檔案 | 簡要描述 |
| --- | --- |
| [empty-strings-handling.md](empty-strings-handling.md) | Oracle 將 '' 視為 NULL；PostgreSQL 將空字串視為獨立值 — 在程式碼、測試和遷移中對齊行為的模式。 |
| [no-data-found-exceptions.md](no-data-found-exceptions.md) | Oracle 的 SELECT INTO 會引發 "no data found" 例外；PostgreSQL 則不會 — 加入明確的 NOT FOUND 處理以模擬 Oracle 行為。 |
| [oracle-parentheses-from-clause.md](oracle-parentheses-from-clause.md) | Oracle 允許 `FROM(TABLE_NAME)` 語法；PostgreSQL 要求 `FROM TABLE_NAME` — 移除資料表名稱周圍不必要的括號。 |
| [oracle-to-postgres-sorting.md](oracle-to-postgres-sorting.md) | 如何在 PostgreSQL 中使用 COLLATE "C" 和 DISTINCT 包裝模式保留類 Oracle 的排序。 |
| [oracle-to-postgres-to-char-numeric.md](oracle-to-postgres-to-char-numeric.md) | Oracle 允許不含格式的 TO_CHAR(numeric)；PostgreSQL 則要求格式字串 — 改用 CAST(numeric AS TEXT)。 |
| [oracle-to-postgres-type-coercion.md](oracle-to-postgres-type-coercion.md) | PostgreSQL 的嚴格型別檢查 vs. Oracle 的隱式強制轉型 — 透過為常值加上引號或進行轉型來修正比較錯誤。 |
| [postgres-concurrent-transactions.md](postgres-concurrent-transactions.md) | PostgreSQL 每個連線僅允許一個作用中的指令 — 具體化結果或使用獨立連線以避免並行操作錯誤。 |
| [postgres-refcursor-handling.md](postgres-refcursor-handling.md) | Refcursor 處理的差異；PostgreSQL 要求依游標名稱提取 (Fetch) — 用於解開與讀取結果的 C# 模式。 |
| [oracle-to-postgres-timestamp-timezone.md](oracle-to-postgres-timestamp-timezone.md) | PostgreSQL 中的 CURRENT_TIMESTAMP / NOW() 回傳經 UTC 標準化的 timestamptz；Npgsql 則呈現 DateTime.Kind=Unspecified — 在開啟連線時及應用程式程式碼中強制使用 UTC。 |
