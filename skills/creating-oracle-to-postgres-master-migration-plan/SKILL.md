---
name: creating-oracle-to-postgres-master-migration-plan
description: '探索 .NET 解決方案中的所有專案，將每個專案分類為 Oracle 到 PostgreSQL 遷移資格，並產出持久性的主遷移計畫。在啟動多專案 Oracle 到 PostgreSQL 遷移、建立遷移清單或評估哪些 .NET 專案包含 Oracle 相依性時使用。'
---

# 建立 Oracle 到 PostgreSQL 主遷移計畫 (Creating an Oracle-to-PostgreSQL Master Migration Plan)

分析 .NET 解決方案，將每個專案分類為 Oracle→PostgreSQL 遷移資格，並撰寫下游 Agent 和技能可以解析的結構化計畫。

## 工作流程 (Workflow)

```
進度：
- [ ] 步驟 1：探索解決方案中的專案
- [ ] 步驟 2：分類每個專案
- [ ] 步驟 3：與使用者確認
- [ ] 步驟 4：撰寫計畫檔案
```

**步驟 1：探索專案**

在工作區根目錄中尋找解決方案檔案（副檔名為 `.sln` 或 `.slnx`）（如果存在多個，請詢問使用者）。解析它以擷取所有 `.csproj` 專案參考。針對每個專案，記錄名稱、路徑和類型（類別庫、Web API、主控台、測試等）。

**步驟 2：分類每個專案**

掃描每個非測試專案以尋找 Oracle 指標：

- NuGet 參考：`Oracle.ManagedDataAccess`, `Oracle.EntityFrameworkCore`（檢查 `.csproj` 和 `packages.config`）
- 設定項目：`appsettings.json`, `web.config`, `app.config` 中的 Oracle 連線字串
- 程式碼用法：`OracleConnection`, `OracleCommand`, `OracleDataReader`
- `.github/oracle-to-postgres-migration/DDL/Oracle/` 下的 DDL 交叉參考（如果存在）

為每個專案指派一個分類：

| 分類 | 意義 |
|---|---|
| **MIGRATE** | 具有需要轉換的 Oracle 互動 |
| **SKIP** | 無 Oracle 指標（僅限 UI、共享工具等） |
| **ALREADY_MIGRATED** | 存在 `-postgres` 或 `.Postgres` 複製品且看起來已處理 |
| **TEST_PROJECT** | 測試專案；由測試工作流程處理 |

**步驟 3：與使用者確認**

呈現分類清單。在定案前讓使用者調整分類或遷移順序。

**步驟 4：撰寫計畫檔案**

儲存至：`.github/oracle-to-postgres-migration/Reports/Master Migration Plan.md`

使用此確切模板 — 下游取用者依賴此結構：

````markdown
# 主遷移計畫 (Master Migration Plan)

**解決方案：** {solution file name}
**解決方案根目錄：** {REPOSITORY_ROOT}
**建立時間：** {timestamp}
**最後更新：** {timestamp}

## 解決方案摘要 (Solution Summary)

| 指標 | 計數 |
|--------|-------|
| 解決方案中的總專案數 | {n} |
| 需要遷移的專案數 | {n} |
| 已遷移的專案數 | {n} |
| 略過的專案數 (無 Oracle 用法) | {n} |
| 測試專案數 (單獨處理) | {n} |

## 專案清冊 (Project Inventory)

| # | 專案名稱 | 路徑 | 分類 | 備註 |
|---|---|---|---|---|
| 1 | {name} | {relative path} | MIGRATE | {notes} |
| 2 | {name} | {relative path} | SKIP | 無 Oracle 相依性 |

## 遷移順序 (Migration Order)

1. **{ProjectName}** — {理由，例如：「核心資料存取庫；其他專案依賴於它。」}
2. **{ProjectName}** — {理由}
````

排列專案順序，以便在依賴項之前遷移共享/基礎庫。
