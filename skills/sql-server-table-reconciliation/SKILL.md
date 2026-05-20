---
name: sql-server-table-reconciliation
description: "使用時機：跨執行個體比較 SQL Server 資料表、資料移轉驗證、ETL 驗證、資料列不匹配偵測、架構漂移、核對報告、生產與測試環境比較。使用 mssql-python 驅動程式配合 Apache Arrow 進行快速的資料行傳輸與比較。"
---

# SQL Server 資料表核對 (SQL Server Table Reconciliation)

使用 Python 搭配 `mssql-python` 驅動程式和 Apache Arrow，比較兩個 SQL Server 執行個體間相同的資料表。偵測缺失的資料列、資料欄位不匹配、架構漂移 (schema drift)，並產生核對報告。

## 工作流程 (Workflow)

1. 收集來源與目標的連線詳細資訊
2. 識別主鍵 (Primary Key) / 複合鍵
3. 偵測架構差異
4. 透過 Arrow 擷取資料以進行高效的資料行傳輸
5. 比較資料列與資料欄
6. 產生核對報告

## 收集輸入 (Collect Inputs)

| 參數 | 必要 | 描述 |
|-----------|----------|-------------|
| 來源伺服器 | 是 | 來源 SQL Server (例如 `prod-server.database.windows.net`) |
| 來源資料庫 | 是 | 來源資料庫名稱 |
| 目標伺服器 | 是 | 目標 SQL Server (例如 `staging-server.database.windows.net`) |
| 目標資料庫 | 是 | 目標資料庫名稱 |
| 資料表 | 是 | 以逗號分隔的 `schema.table` 名稱，或使用 `schema.*` 萬用字元 (例如 `dbo.Orders,dbo.Items` 或 `dbo.*`) |
| 認證模式 | 是 | `sql` (使用者名稱/密碼) 或 `entra` (Azure AD/權杖) |
| 主鍵 | 自動偵測 | 構成資料列識別的資料欄。如果未提供，將從中繼資料自動偵測。 |
| 欲比較的資料欄 | 全部 | 資料欄的子集，或所有非主鍵的資料欄 |
| 區塊大小 | `100000` | 大型資料表每批處理的資料列數 |
| 輸出格式 | `console` | `console` (主控台), `csv`, `parquet`, 或 `json` |

## 隨附指令碼 (Bundled Script)

核對邏輯已提供為獨立的指令碼，位於 `scripts/reconcile.py`。請根據使用者輸入並配合適當的引數來調用：

```bash
python scripts/reconcile.py \
    --source-server <來源伺服器> \
    --source-database <來源資料庫> \
    --target-server <目標伺服器> \
    --target-database <目標資料庫> \
    --tables "<資料表規格>" \
    --auth <sql|entra> \
    --chunk-size <區塊大小> \
    --output <console|csv|json>
```

### 選用引數 (Optional arguments)

| 引數 | 描述 |
|----------|-------------|
| `--primary-key` | 以逗號分隔的主鍵資料欄。若省略則自動偵測。 |
| `--columns` | 以逗號分隔的欲比較資料欄。若省略則比較所有非主鍵資料欄。 |

### 調用範例 (Example invocations)

使用 SQL 認證比較單一資料表：

```bash
python scripts/reconcile.py \
    --source-server prod-server.database.windows.net \
    --source-database ProdDB \
    --target-server staging-server.database.windows.net \
    --target-database StagingDB \
    --tables "dbo.Orders" \
    --auth sql \
    --output console
```

使用 Entra 認證比較萬用字元指定的資料表，並輸出 CSV：

```bash
python scripts/reconcile.py \
    --source-server prod-server.database.windows.net \
    --source-database ProdDB \
    --target-server staging-server.database.windows.net \
    --target-database StagingDB \
    --tables "dbo.*" \
    --auth entra \
    --output csv
```

### 先決條件 (Prerequisites)

執行前請安裝必要的套件：

```bash
pip install mssql-python pyarrow pandas
```

## 比較規則 (Comparison Rules)

- **比較前先正規化類型**：將 decimal 轉換為相同的精度，修剪字串 (trim)，將 datetime 正規化為 UTC。
- **NULL 處理**：`NULL == NULL` 被視為匹配 (雙方皆缺失 = 無差異)。
- **忽略資料列順序**：始終透過主鍵合併 (PK join) 進行比較，而非根據位置。
- **大型資料表**：使用 `OFFSET/FETCH` 或 `ROW_NUMBER()` 分區進行區塊擷取。

## 基於雜湊的優化 (Hash-Based Optimization，適用於大型資料表)

當資料表超過 100 萬列時，產生雜湊預檢查：

```sql
SELECT {pk_cols},
       HASHBYTES('SHA2_256', CONCAT_WS('|', col1, col2, ...)) AS row_hash
FROM {table}
```

先比較雜湊值；僅針對雜湊不匹配的列擷取完整資料。這能顯著減少資料傳輸量。

## 報告格式 (Report Format)

```
正在核對 dbo.EMPLOYEES...
正在核對 dbo.DEPARTMENTS...
正在核對 dbo.JOBS...

--- dbo.EMPLOYEES ---
  來源：107  目標：107
  缺失：0  多餘：0  不匹配：0
  結果：✓ 內容一致 (IDENTICAL)

--- dbo.DEPARTMENTS ---
  來源：27  目標：27
  缺失：0  多餘：0  不匹配：3
  結果：✗ 發現差異 (DIFFERENCES FOUND)

--- dbo.JOBS ---
  來源：19  目標：19
  缺失：0  多餘：0  不匹配：0
  結果：✓ 內容一致 (IDENTICAL)

=== 摘要：2 個通過，1 個失敗，0 個跳過 / 共 3 個資料表 ===
```

提供單一資料表時，應包含完整詳細資訊 (架構漂移、範例列、不匹配項)。提供多個資料表時，請使用上述的精簡資料表格式，僅針對 `FAIL` 狀態的資料表提供完整細節。

## 效能考量 (Performance Considerations)

| 情境 | 策略 |
|----------|----------|
| < 100K 列 | 單次 Arrow 擷取，記憶體內 pandas 比較 |
| 100K–1M 列 | 分區擷取 (每批 100K)，串流比較 |
| > 1M 列 | 雜湊預檢查 → 僅擷取不匹配的資料列 |
| 寬資料表 (100+ 欄位) | 先比較主鍵 + 雜湊，若不匹配再深入分析特定欄位 |
| 網路頻寬受限 | 使用 Arrow 資料行格式 (比逐列傳輸小 10-50 倍) |

## 限制 (Constraints)

- 始終使用 `mssql-python` 驅動程式 (非 pyodbc, pymssql)。
- 始終透過資料指標使用 Apache Arrow (`cursor.arrow()`) 進行資料擷取。
- 連線 **必須** 使用連線字串格式，不得使用關鍵字引數 (例如 `encrypt=True` 會導致錯誤)。
- 絕不在未識別主鍵的情況下進行比較 —— 若自動偵測失敗請詢問使用者。
- 使用重試邏輯優雅地處理連線失敗。
- **絕不在產生的指令碼中硬編碼認證資訊** —— 請使用 `os.environ` / `getpass` (環境變數：`MSSQL_USER`, `MSSQL_PASSWORD`)。
- 不要在輸出或記錄中列印認證資訊。
- 使用參數化查詢 (`?` 佔位符) 進行中繼資料查找 —— 絕不將使用者輸入以 f-string 插值方式放入 SQL。
