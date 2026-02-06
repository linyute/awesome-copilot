# 資料庫與資料管理延伸模組

適用於 PostgreSQL、SQL Server 的資料庫管理、SQL 最佳化和資料管理工具，以及一般資料庫開發的最佳做法。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install database-data-management@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 描述 |
|---------|-------------|
| `/database-data-management:sql-optimization` | 通用 SQL 效能最佳化助手，用於所有 SQL 資料庫 (MySQL、PostgreSQL、SQL Server、Oracle) 的全面查詢調校、索引策略和資料庫效能分析。提供執行計劃分析、分頁最佳化、批次作業和效能監控指引。 |
| `/database-data-management:sql-code-review` | 通用 SQL 程式碼檢閱助手，針對所有 SQL 資料庫 (MySQL、PostgreSQL、SQL Server、Oracle) 進行全面的安全性、可維護性和程式碼品質分析。專注於 SQL 隱碼攻擊防護、存取控制、程式碼標準和反模式偵測。補充 SQL 最佳化提示以實現完整的開發覆蓋。 |
| `/database-data-management:postgresql-optimization` | 專注於 PostgreSQL 獨特功能、進階資料類型和 PostgreSQL 專屬功能的 PostgreSQL 開發助手。涵蓋 JSONB 操作、陣列類型、自訂類型、範圍/幾何類型、全文檢索搜尋、視窗函式和 PostgreSQL 擴充功能生態系統。 |
| `/database-data-management:postgresql-code-review` | 專注於 PostgreSQL 最佳做法、反模式和獨特品質標準的 PostgreSQL 程式碼檢閱助手。涵蓋 JSONB 操作、陣列使用、自訂類型、結構描述設計、函式最佳化，以及 PostgreSQL 專屬安全性功能 (如資料列層級安全性 (RLS))。 |

### Agent

| Agent | 描述 |
|-------|-------------|
| `postgresql-dba` | 使用 PostgreSQL 擴充功能處理 PostgreSQL 資料庫。 |
| `ms-sql-dba` | 使用 MS SQL 擴充功能處理 Microsoft SQL Server 資料庫。 |

## 來源

此延伸模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
