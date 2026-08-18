---
name: 'migrating-oracle-to-postgres-data-access-code'
description: '將 .NET/C# 資料存取程式碼從 Oracle 移轉至 PostgreSQL (Npgsql)。替換 Oracle NuGet 套件、重寫 OracleConnection/OracleCommand/OracleDataReader 用法、修正 DbType 對應、更新預存程序呼叫模式，並調整連線字串設定。適用於在 Oracle 到 PostgreSQL 資料庫移轉期間移轉 .NET 專案的應用程式程式碼層。'
---

# 將 .NET 資料存取程式碼從 Oracle 移轉至 PostgreSQL

將單一 `.Postgres` 複本專案的 C# 資料存取層從 Oracle (Oracle.ManagedDataAccess) 移轉至 PostgreSQL (Npgsql)。依照 `Reports/{ProjectName}/MigrationChecklist.md` 逐項進行處理。

## 先決條件

- `.Postgres` 專案複本已存在（在階段 5 設定中建立）。
- `Reports/{ProjectName}/MigrationChecklist.md` 存在，且為要變更內容的單一事實來源。
- `Reports/{ProjectName}/OracleRiskAnalysis.md` 存在，用於交叉比對行為差異。

## 工作流程

```
Progress:
- [ ] Step 1: Replace NuGet packages
- [ ] Step 2: Update connection string configuration
- [ ] Step 3: Rewrite ADO.NET type references
- [ ] Step 4: Fix DbType mappings
- [ ] Step 5: Migrate stored procedure invocation
- [ ] Step 6: Address Oracle-specific SQL and syntax
- [ ] Step 7: Build and verify
```

**步驟 1：替換 NuGet 套件**

在 `.Postgres` 專案的 `.csproj` 中：

- 移除：`Oracle.ManagedDataAccess.Core`、`Oracle.EntityFrameworkCore`（以及任何其他 `Oracle.*` 套件）
- 新增：`Npgsql`（用於 ADO.NET）及/或 `Npgsql.EntityFrameworkCore.PostgreSQL`（用於 EF Core）
- 保持版本釘選與目標 .NET 版本一致；請勿引入比解決方案中類似套件已使用版本更新的套件版本。
- 如果專案廣泛使用 `System.Data` 抽象概念（`IDbConnection`、`IDbCommand`），則介面層級的程式碼可能需要較少的變更 — 請先識別它們。

**步驟 2：更新連線字串設定**

- 在 `appsettings.json`、`appsettings.{env}.json`、`web.config`、`app.config` 或環境變數設定中找出 Oracle 連線字串。
- 替換為與 Npgsql 相容的連線字串：`Host=localhost;Port=5432;Database=mydb;Username=myuser;Password=mypassword`
- 請勿寫死認證 — 使用已在使用的相同設定機制（例如環境變數、機密管理員、`IConfiguration`）。
- 僅在連線字串索引鍵為 Oracle 專用時（例如 `OracleConnection`）才進行更新。優先保留相同的索引鍵名稱以最大程度減少應用程式設定變更。

**步驟 3：重寫 ADO.NET 型別參照**

將 Oracle 特定的 ADO.NET 型別替換為 Npgsql 等效項：

| Oracle 型別 | Npgsql 替換項 |
|---|---|
| `OracleConnection` | `NpgsqlConnection` |
| `OracleCommand` | `NpgsqlCommand` |
| `OracleDataReader` | `NpgsqlDataReader` |
| `OracleDataAdapter` | `NpgsqlDataAdapter` |
| `OracleParameter` | `NpgsqlParameter` |
| `OracleTransaction` | `NpgsqlTransaction` |
| `OracleException` | `NpgsqlException` |
| `OracleDbType` | `NpgsqlDbType`（來自 `NpgsqlTypes` 命名空間） |

相應更新 `using` 指示詞（`using Oracle.ManagedDataAccess.Client` → `using Npgsql`）。

如果程式碼庫使用透過相依性插入 (DI) 註冊的 `IDbConnection`/`IDbCommand` 抽象，請僅更新 DI 註冊和連線字串 — 取用端程式碼可能不需要變更。

**步驟 4：修正 DbType 與 NpgsqlDbType 對應**

Oracle 參數型別不會 1:1 對應至 Npgsql。審查每個設定了明確型別的 `OracleParameter`（現為 `NpgsqlParameter`）：

| Oracle 型別 | 備註 |
|---|---|
| `OracleDbType.Varchar2` | 使用 `NpgsqlDbType.Varchar` 或省略（Npgsql 會從值推斷） |
| `OracleDbType.Clob` | 使用 `NpgsqlDbType.Text` |
| `OracleDbType.Number` | 視有效位數而定使用 `NpgsqlDbType.Numeric` 或 `NpgsqlDbType.Integer` |
| `OracleDbType.Date` | 使用 `NpgsqlDbType.Date`（僅日期）或 `NpgsqlDbType.Timestamp`（若使用了時間元件） |
| `OracleDbType.TimeStamp` | 使用 `NpgsqlDbType.Timestamp` |
| `OracleDbType.RefCursor` | 使用 `NpgsqlDbType.Refcursor` — 請參閱步驟 5 |
| `OracleDbType.Char` | 使用 `NpgsqlDbType.Char` |

對於 Oracle 從值推斷型別的參數，Npgsql 也會推斷 — 明確的型別設定通常是不必要的且可以移除。

**步驟 5：移轉預存程序呼叫**

Oracle 與 PostgreSQL 的預存程序呼叫有顯著差異：

- **指令型別**：針對函式呼叫保留 `CommandType.StoredProcedure`。對於使用 `OUT` 參數的程序，PostgreSQL 在某些版本的 Npgsql 中需要具有 `CALL proc_name(...)` 語法的 `CommandType.Text` — 請對照目標 Npgsql 版本進行驗證。
- **RefCursor 處理**：Oracle 將 RefCursor 作為輸出參數傳回；PostgreSQL 則以不同方式傳回它們：
  - 對於 `RETURNS TABLE` / `RETURNS SETOF`，直接使用 `ExecuteReader()` — 不需要游標參數。
  - 對於 `RETURNS refcursor`，在交易內呼叫，從輸出參數讀取游標名稱，然後發出 `FETCH ALL IN "<cursor_name>"`。
  - 移除任何 Oracle 特定的游標包裝程式碼（例如 `OracleRefCursor`）。
- **OUT 參數**：PostgreSQL 預存程序使用 `INOUT` 或函式傳回值。確認參數方向與移轉後的程序簽章相符。
- **序列 `NEXTVAL`**：將 `SELECT {SEQUENCE}.NEXTVAL FROM DUAL` 替換為 `SELECT nextval('{sequence_name}')`。
- **具名參數**：Npgsql 使用 `@param_name`；Oracle 使用 `:param_name`。更新所有參數名稱前置詞。

**步驟 6：處理 Oracle 特定的 SQL 與 C# 模式**

審查行內 SQL 字串與查詢建構器中的 Oracle 特定建構並進行替換：

| Oracle 建構 | PostgreSQL 替換項 |
|---|---|
| `ROWNUM <= n` | `LIMIT n` |
| `ROWNUM = 1` | `LIMIT 1` |
| `NVL(x, y)` | `COALESCE(x, y)` |
| `DECODE(expr, v1, r1, ...)` | `CASE WHEN expr = v1 THEN r1 ... END` |
| `SYSDATE` / `SYSTIMESTAMP` | `NOW()` 或 `CURRENT_TIMESTAMP` |
| `TO_CHAR(date, fmt)` | `TO_CHAR(date, fmt)`（大部分相容；驗證格式字串） |
| `TO_DATE(str, fmt)` | `TO_DATE(str, fmt)`（驗證格式字串） |
| `TO_NUMBER(str)` | `CAST(str AS NUMERIC)` 或 `str::NUMERIC` |
| `||` 字串串接 | `||`（相容） |
| `DUAL` 資料表 | 移除 `FROM DUAL`；PostgreSQL 評估 `SELECT expr` 無需資料表 |
| `CONNECT BY` 階層 | 使用遞迴通用資料表運算式 (`WITH RECURSIVE`) 重寫 |
| `MERGE INTO` | 重寫為 `INSERT ... ON CONFLICT DO UPDATE` |
| 空字串 `''` 視為 NULL | Oracle 將 `''` 視為 NULL；PostgreSQL 則否 — 檢查比較與 `IS NULL` 保護條件 |
| `VARCHAR2` | `VARCHAR` 或 `TEXT` |

**步驟 7：建構與驗證**

在處理完所有檢查清單項目後：

1. 在 `.Postgres` 專案上執行 `dotnet build`。修復任何剩餘的編譯錯誤。
2. 驗證沒有殘留 Oracle 特定的命名空間：搜尋 `Oracle.ManagedDataAccess`、`OracleConnection`、`OracleCommand`、`:param` 模式。
3. 在 `Reports/{ProjectName}/MigrationChecklist.md` 中標記已完成的項目。

## EF Core 專案

如果專案使用 `Oracle.EntityFrameworkCore`：

- 替換 `DbContext` 設定中的提供者註冊：`.UseOracle(...)` → `.UseNpgsql(...)`
- 替換 `OracleDbContextOptionsBuilder` 參照。
- 審查 `OnModelCreating` 以尋找 Oracle 特定的設定（例如 `HasColumnType("NUMBER")` → `HasColumnType("numeric")`）。
- 序列設定：`modelBuilder.HasSequence<int>("seq_name").StartsAt(1).IncrementsBy(1)` 語法相容；驗證參照序列的資料行預設值。
- 請勿執行 EF Core 移轉 — 結構描述是透過 DDL 指令碼在外部進行管理（階段 4）。

## 主要限制條件

- 僅在 `.Postgres` 複本內工作 — 絕不修改以 Oracle 為目標的原始專案。
- 保持現有的 .NET 和 C# 版本；請勿引入較新的語言或執行階段功能。
- 保留註解與應用程式邏輯；僅變更 PostgreSQL 相容性所必需的內容。
- Oracle 是單一事實來源 — 行為差異必須記錄為錯誤回報，而不是靜默更改。
