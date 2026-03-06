# 資料庫與資料管理外掛程式 (Database & Data Management Plugin)

用於 PostgreSQL、SQL Server 的資料庫管理、SQL 最佳化與資料管理工具，以及一般資料庫開發最佳實務。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install database-data-management@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/database-data-management:sql-optimization` | 通用 SQL 效能最佳化助手，用於跨所有 SQL 資料庫 (MySQL, PostgreSQL, SQL Server, Oracle) 的全面查詢調整、編製索引策略與資料庫效能分析。提供執行計畫分析、分頁最佳化、批次操作與效能監控指引。 |
| `/database-data-management:sql-code-review` | 通用 SQL 程式碼檢閱助手，用於跨所有 SQL 資料庫 (MySQL, PostgreSQL, SQL Server, Oracle) 執行全面的安全性、可維護性與程式碼品質分析。專注於 SQL 插入式攻擊防禦、存取控制、程式碼標準與反模式偵測。補充 SQL 最佳化提示以達成完整的開發涵蓋範圍。 |
| `/database-data-management:postgresql-optimization` | 專注於獨特 PostgreSQL 功能、進階資料類型與 PostgreSQL 專屬功能的 PostgreSQL 特化開發助手。涵蓋 JSONB 操作、陣列類型、自訂類型、範圍/幾何類型、全文搜尋、視窗函式與 PostgreSQL 擴充功能生態系統。 |
| `/database-data-management:postgresql-code-review` | 專注於 PostgreSQL 最佳實務、反模式與獨特品質標準的 PostgreSQL 特化程式碼檢閱助手。涵蓋 JSONB 操作、陣列用法、自訂類型、結構定義設計、函式最佳化，以及 PostgreSQL 專屬安全性功能 (如資料列層級安全性, RLS)。 |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `postgresql-dba` | 使用 PostgreSQL 擴充功能與 PostgreSQL 資料庫搭配工作。 |
| `ms-sql-dba` | 使用 MS SQL 擴充功能與 Microsoft SQL Server 資料庫搭配工作。 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
