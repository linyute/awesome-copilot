# 參考索引

| 檔案 | 簡要說明 |
| --- | --- |
| [empty-strings-handling.md](empty-strings-handling.md) | Oracle 將 '' 視為 NULL；PostgreSQL 保持空字串為獨立狀態——在程式碼、測試和移轉中對齊行為的模式。 |
| [no-data-found-exceptions.md](no-data-found-exceptions.md) | Oracle SELECT INTO 會引發 "no data found" 例外狀況；PostgreSQL 則不會——加入明確的 NOT FOUND 處理以模擬 Oracle 行為。 |
| [oracle-parentheses-from-clause.md](oracle-parentheses-from-clause.md) | Oracle 允許 `FROM(TABLE_NAME)` 語法；PostgreSQL 需要 `FROM TABLE_NAME`——移除資料表名稱周圍不必要的括號。 |
| [oracle-to-postgres-sorting.md](oracle-to-postgres-sorting.md) | 如何使用 COLLATE "C" 和 DISTINCT 包裝模式在 PostgreSQL 中保留類似 Oracle 的排序語意。 |
| [oracle-to-postgres-to-char-numeric.md](oracle-to-postgres-to-char-numeric.md) | Oracle 允許無格式的 TO_CHAR(numeric)；PostgreSQL 需要格式字串——改用 CAST(numeric AS TEXT)。 |
| [oracle-to-postgres-type-coercion.md](oracle-to-postgres-type-coercion.md) | PostgreSQL 嚴格類型檢查對照 Oracle 隱含強制轉型——透過加上引號或對字面值進行轉型來修正比較錯誤。 |
| [postgres-union-all-planner.md](postgres-union-all-planner.md) | 當述詞下推（Predicate pushdown）受限時，UNION ALL 分支可能會產生不佳的計畫——審閱計畫並在需要時分割或重塑查詢。 |
| [postgres-materialized-view-refresh.md](postgres-materialized-view-refresh.md) | 變更基底資料表後，具體化檢視表（Materialized view）不會自動重新整理——應用程式或工作必須明確重新整理它們。 |
| [postgres-concurrent-transactions.md](postgres-concurrent-transactions.md) | PostgreSQL 每個連線僅允許一個作用中命令——具體化結果或使用單獨的連線以避免並行作業錯誤。 |
| [postgres-refcursor-handling.md](postgres-refcursor-handling.md) | refcursor 處理的差異；PostgreSQL 需要以游標名稱擷取——用於解包和讀取結果的 C# 模式。 |
| [oracle-to-postgres-timestamp-timezone.md](oracle-to-postgres-timestamp-timezone.md) | CURRENT_TIMESTAMP / NOW() 在 PostgreSQL 中傳回 UTC 格式化的 timestamptz；Npgsql 顯現出 DateTime.Kind=Unspecified——在連線開啟時和應用程式程式碼中強制使用 UTC。 |
