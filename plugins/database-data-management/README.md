# Database & Data Management 外掛模組

適用於 PostgreSQL、SQL Server 以及一般資料庫開發最佳做法的資料庫管理、SQL 最佳化和資料管理工具。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install database-data-management@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 說明 |
|---------|-------------|
| `/database-data-management:sql-optimization` | 通用 SQL 效能最佳化助理，跨所有 SQL 資料庫 (MySQL、PostgreSQL、SQL Server、Oracle) 進行全面查詢微調、索引策略和資料庫效能分析。提供執行計畫分析、分頁最佳化、批次作業和效能監視指引。 |
| `/database-data-management:sql-code-review` | 通用 SQL 程式碼審查助理，跨所有 SQL 資料庫 (MySQL、PostgreSQL、SQL Server、Oracle) 執行全面的安全性、可維護性和程式碼品質分析。專注於 SQL 隱碼防護、存取控制、程式碼標準和反模式偵測。補充 SQL 最佳化提示詞以實現完整的開發涵蓋範圍。 |
| `/database-data-management:postgresql-optimization` | PostgreSQL 專用開發助理，專注於獨特的 PostgreSQL 功能、進階資料型別和 PostgreSQL 專屬功能。涵蓋 JSONB 作業、陣列型別、自訂型別、範圍/幾何型別、全文檢索搜尋、視窗函式以及 PostgreSQL 擴充功能生態系統。 |
| `/database-data-management:postgresql-code-review` | PostgreSQL 專用程式碼審查助理，專注於 PostgreSQL 最佳做法、反模式和獨特的品質標準。涵蓋 JSONB 作業、陣列使用方式、自訂型別、結構描述設計、函式最佳化以及 PostgreSQL 專屬的安全功能（例如資料列層級安全性，RLS）。 |

### 代理人

| 代理人 | 說明 |
|-------|-------------|
| `postgresql-dba` | 使用 PostgreSQL 擴充功能操作 PostgreSQL 資料庫。 |
| `ms-sql-dba` | 使用 MS SQL 擴充功能操作 Microsoft SQL Server 資料庫。 |

## 來源

此外掛模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群導向的 GitHub Copilot 擴充功能集合。

## 授權條款

MIT
