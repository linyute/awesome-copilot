---
description: '適用於 T-SQL 的 SQL Server 專用寫入安全規則：搭配 THROW 的 XACT_ABORT、感知 @@TRANCOUNT 的交易、預設失敗關閉的預行作業、批次 OUTPUT...INTO 封存、僅限自動認可的管理陳述式，以及唯讀 DMV 診斷。'
applyTo: '**/*.sql, **/*.ps1'
---

# SQL Server 生產環境安全 T-SQL

在撰寫或檢閱針對 SQL Server 執行的 T-SQL、SQL Server Agent 作業或 PowerShell 時，請套用這些規則。這些規則著重於確保指令碼在生產周邊系統中安全執行，以作為一般 SQL 樣式指引的補充。

## 指令碼標頭

每個指令碼開頭都應包含說明以下內容的註解區塊：

- 目的（一行）
- `COMPAT:` 最低 SQL Server 版本（例如 `CREATE OR ALTER` 需要 `SQL Server 2016 SP1+`）以及是否可在 Azure SQL 受控執行個體上運作
- `Perms:` 所需的權限（例如 `VIEW SERVER STATE`，或在 SQL Server 2022+ 上需要 `VIEW SERVER PERFORMANCE STATE`）
- 指令碼為唯讀還是會寫入資料

如果您不確定目標版本中是否存在特定語法或 DMV 資料行，請直接說明而不要猜測。

## 任何寫入作業（DML 或 DDL）的必要結構

- 開頭使用 `SET NOCOUNT ON; SET XACT_ABORT ON;`。
- 將與交易相容的工作包裝在 `BEGIN TRY ... BEGIN TRANSACTION ... COMMIT ... END TRY BEGIN CATCH ... END CATCH` 中。
- 某些管理陳述式無法在使用者交易中執行（例如 `CREATE DATABASE`、`ALTER DATABASE`、`DROP DATABASE`、`BACKUP`、`RESTORE` 和 `RECONFIGURE`）。對於這些陳述式，請使用自動認可路徑取代交易包裝函式：保留相同的預行作業預設值與確認關卡、在帶有 `THROW;` 的 `TRY ... CATCH` 中獨立執行每個陳述式、檢查執行前後的狀態，並撰寫特定作業的復原步驟（例如要從中還原的備份，或要設回的先前設定值）。
- 在 `CATCH` 區塊中，僅在交易處於開啟狀態時才復原，然後執行 `THROW;`，以便原始錯誤編號與行號傳達給呼叫端與 Agent 作業歷程記錄。請勿吞下錯誤。
- 在可能於外部交易內部呼叫的單一交易預存程序中，請在進入時、任何讀取之前檢查 `@@TRANCOUNT`，並且僅在它為 `0` 時才開始並認可交易。若其為 `0` 且 `IMPLICIT_TRANSACTIONS` 為 ON（`@@OPTIONS & 2`），請在 `BEGIN TRANSACTION` 之前拒絕該呼叫，因為 `BEGIN TRANSACTION` 隨後會開啟第二層，而單一 `COMMIT` 會使寫入維持未認可狀態並保留其鎖定（例如 `IF @@TRANCOUNT = 0 AND (@@OPTIONS & 2) = 2 THROW 50000, N'Run with IMPLICIT_TRANSACTIONS OFF; this procedure owns its transaction.', 1;`）。分批認可的預存程序必須拒絕在呼叫端擁有的交易內部或在 `IMPLICIT_TRANSACTIONS ON`（`@@OPTIONS & 2`）下執行，因為兩者都會保留每個批次的鎖定與記錄，直到外部認可為止，且會讓後續的復原復原先前的批次。
- 預設使用安全關閉（fail closed）的預行作業（dry run）。在 T-SQL 中，請使用 `@DryRun bit = 1` 參數，並將明確 `0` 以外的任何值（包括 `NULL`）視為預行作業（`IF @DryRun IS NULL OR @DryRun <> 0`）。參數預設值僅涵蓋省略的引數，因此切勿單獨測試 `IF @DryRun = 1`。預行作業會列印或傳回將會變更的內容（例如資料列計數）且不變更任何內容。
- 在 PowerShell 中，單靠 `SupportsShouldProcess` 與 `-WhatIf` 並不會使預行作業成為預設行為。需要一個預設為關閉的明確 `-Apply` 參數，並將每次變更包裝在 `if ($Apply -and $PSCmdlet.ShouldProcess($target, $action)) { ... }` 中。若沒有 `-Apply`，請報告將變更的內容並結束。
- 確保指令碼具等冪性（idempotent）：`CREATE OR ALTER`、`IF OBJECT_ID(...) IS NULL`、`IF NOT EXISTS`。切勿無訊息覆寫現有的 Agent 作業、連結伺服器、警示、登入或使用者；應偵測並停止或要求明確旗標。
- 每個 `UPDATE` 與 `DELETE` 都必須有具選擇性的 `WHERE` 子句。使用 `TOP (N)` 迴圈分批處理大量變更，每個批次一個簡短交易，並累計資料列計數。
- 移動資料列（先封存後刪除）時，使用 `OUTPUT ... INTO` 將每個批次的索引鍵擷取至全新清空的索引鍵集中，且僅刪除證實已在該批次中複製的資料列。
- 在預存程序頂端驗證參數，並在輸入無效時傳回具記錄說明的非零傳回代碼。

### 預存程序範本

```sql
CREATE OR ALTER PROCEDURE dbo.usp_ArchiveOrders
    @OlderThanDays int,
    @BatchSize     int = 1000,
    @DryRun        bit = 1,
    @RowsAffected  int = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @OlderThanDays IS NULL OR @OlderThanDays < 1
    BEGIN
        RAISERROR(N'@OlderThanDays must be >= 1.', 16, 1);
        RETURN 1;
    END;

    IF @BatchSize IS NULL OR @BatchSize NOT BETWEEN 1 AND 50000
    BEGIN
        RAISERROR(N'@BatchSize must be between 1 and 50000.', 16, 1);
        RETURN 2;
    END;

    -- Batches commit independently, so a caller-owned transaction or
    -- IMPLICIT_TRANSACTIONS ON is not allowed.
    IF @@TRANCOUNT > 0 OR (@@OPTIONS & 2) = 2
    BEGIN
        RAISERROR(N'Run outside a caller transaction with IMPLICIT_TRANSACTIONS OFF; this procedure commits per batch.', 16, 1);
        RETURN 3;
    END;

    DECLARE @Cutoff datetime2(0) = DATEADD(DAY, -@OlderThanDays, SYSDATETIME());
    SET @RowsAffected = 0;

    -- Fail closed: anything other than an explicit 0, including NULL, is a dry run.
    IF @DryRun IS NULL OR @DryRun <> 0
    BEGIN
        SELECT @RowsAffected = COUNT(*) FROM dbo.Orders WHERE Status = 'Closed' AND CreatedAt < @Cutoff;
        PRINT CONCAT(N'DRY RUN: would archive ', @RowsAffected, N' rows in batches of ', @BatchSize, N'.');
        RETURN 0;
    END;

    DECLARE @moved TABLE (OrderId int PRIMARY KEY);
    DECLARE @BatchRows int = 1;

    BEGIN TRY
        WHILE @BatchRows > 0
        BEGIN
            DELETE FROM @moved;  -- fresh key set for every batch

            BEGIN TRANSACTION;

            INSERT dbo.OrdersArchive (OrderId, Status, CreatedAt)
            OUTPUT inserted.OrderId INTO @moved (OrderId)
            SELECT TOP (@BatchSize) o.OrderId, o.Status, o.CreatedAt
            FROM dbo.Orders o WITH (UPDLOCK)
            WHERE o.Status = 'Closed' AND o.CreatedAt < @Cutoff
            ORDER BY o.OrderId;

            DELETE o FROM dbo.Orders o JOIN @moved m ON m.OrderId = o.OrderId;
            SET @BatchRows = @@ROWCOUNT;

            COMMIT TRANSACTION;
            SET @RowsAffected += @BatchRows;
        END;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;  -- rolls back only the failing batch
        THROW;
    END CATCH;
END;
```

預設 `@BatchSize` 為 1000；請調整較大的數值，因為取得數千個鎖定的批次可能會升級為封鎖其他工作階段的資料表鎖定。

失敗時，先前的批次會維持已認可狀態，並重新擲回錯誤。由於重新擲回錯誤，SQL Server 不會將 `@RowsAffected` 複製回呼叫端，因此僅在成功完成時將其視為可靠；若要檢視部分進度，請計算封存資料表的資料列數或在重新擲回前記錄每個批次。重新執行會挑選其餘符合資格的資料列。

## 在產生具破壞性或高風險作業之前先詢問

在產生下列任何項目之前，請先停止並要求明確確認，並說明資料遺失或可用性影響：

- `DROP`、`TRUNCATE`、`ALTER TABLE ... DROP COLUMN` 或縮減資料行型別
- 沒有選擇性述詞的 `UPDATE` 或 `DELETE`
- `KILL` 或 `DBCC` 修復選項
- 啟用 `xp_cmdshell`、Ole Automation 或 CLR
- 伺服器層級設定變更（例如 `max server memory`）
- 停用條件約束或觸發程序

在進行任何資料遺失作業之前，請說明應備份的內容、位置以及還原方式。為每項變更加入復原步驟。

## 診斷作業皆為唯讀

- 針對 DMV 的診斷查詢（封鎖鏈結、等候統計資料、耗用資源的查詢、孤立使用者、連結伺服器檢查）絕不能變更狀態。在標頭中標註為 `READ-ONLY`。
- 對於封鎖問題，請找出頭部封鎖者（封鎖其他工作階段但自身未被封鎖的工作階段），並使用 `sys.dm_exec_sessions`、`sys.dm_exec_requests` 與 `sys.dm_exec_sql_text` 顯示鏈結。請勿發出 `KILL`；若使用者決定終止，請提醒其記錄工作階段識別碼與原因，且 `KILL` 會復原已開啟的交易。
- 對於等候統計資料，請擷取 `sys.dm_os_wait_stats` 的兩個快照集並報告差異，排除良性的閒置等候，而不是報告自啟動以來的累計值。
- 對於孤立使用者，請將偵測限制在執行個體驗證的 SQL 使用者（`sys.database_principals` 中的 `type = 'S'` 且 `authentication_type = 1`），其 SID 在 `sys.server_principals` 中沒有相符的資料列。排除系統主體（`dbo`、`guest`、`INFORMATION_SCHEMA`、`sys`）。以 `WITHOUT LOGIN` 建立的使用者、自主資料庫使用者與 Windows 使用者在設計上原本就沒有相符的 SQL 登入，並非孤立使用者。
- 保持孤立使用者偵測作業為唯讀。任何修復皆為獨立的預行優先指令碼，需要確認的使用者與登入對應，使用 `ALTER USER ... WITH LOGIN = ...`，絕不建立登入，也絕不刪除使用者。
