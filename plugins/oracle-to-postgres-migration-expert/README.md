# Oracle 轉 PostgreSQL 移轉專家外掛程式

適用於 .NET 解決方案中 Oracle 轉 PostgreSQL 應用程式移轉的專家 Agent。直接執行程式碼編輯、執行指令，並引導使用者完成結構化、設有關卡的移轉工作流程。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install oracle-to-postgres-migration-expert@awesome-copilot
```

## 內含項目

### Agent

| Agent | 說明 |
|-------|-------------|
| `Oracle-to-PostgreSQL Migration Expert` | 適用於 Oracle→PostgreSQL 移轉的專家 Agent。直接進行程式碼編輯並執行指令，向使用者介紹移轉概念與常見陷阱。 |

### 技能 (Skills)

| 技能 | 說明 |
|-------|-------------|
| `reviewing-oracle-to-postgres-migration` | 透過比對程式碼與已知行為差異（空字串、refcursors、型別強制轉換、排序/定序、UNION ALL 規劃風險、具體化檢視表重新整理行為、時間戳記、並行交易等）來識別 Oracle 轉 PostgreSQL 的移轉風險。 |
| `creating-oracle-to-postgres-master-migration-plan` | 探索 .NET 解決方案中的所有專案，分類各專案的 Oracle 轉 PostgreSQL 移轉資格，並產出持久的總體移轉計畫。 |
| `migrating-oracle-to-postgres-stored-procedures` | 將 Oracle PL/SQL 預存程序移轉至 PostgreSQL PL/pgSQL。轉換 Oracle 專屬語法，保留方法簽章與型別錨定參數，並套用明確的定序規則（僅在適當時使用 `"C"`，需要時使用特定地區設定的定序）。 |
| `planning-oracle-to-postgres-migration-integration-testing` | 為 .NET 資料存取產物建立整合測試計畫，識別需要驗證涵蓋範圍的儲存機制 (repository)、DAO 和服務層。 |
| `scaffolding-oracle-to-postgres-migration-test-project` | 搭建一個帶有交易回復基底類別與種子資料管理器的 xUnit 整合測試專案，用於 Oracle 轉 PostgreSQL 移轉驗證。 |
| `creating-oracle-to-postgres-migration-integration-tests` | 產生具備確定性種子資料的資料庫無關 xUnit 整合測試，驗證兩個資料庫系統之間的行為一致性。 |
| `creating-oracle-to-postgres-migration-bug-report` | 為 Oracle 轉 PostgreSQL 移轉驗證期間發現的缺陷建立結構化錯誤報告，包含嚴重性、根本原因與補救步驟。 |
| `migrating-oracle-to-postgres-data-access-code` | 將 .NET/C# 資料存取程式碼從 Oracle 移轉至 PostgreSQL (Npgsql)。替換 Oracle NuGet 套件、重寫 ADO.NET 型別參考、修正 DbType 對應、更新預存程序呼叫模式，並調整連線字串設定。 |

## 功能

### 教育指引

專家 Agent 在整個移轉過程中為使用者提供指導：

- **移轉概念**：解釋 Oracle→PostgreSQL 的差異（空字串與 NULL、NO_DATA_FOUND 例外狀況、排序/定序行為、TO_CHAR 轉換、型別強制轉換嚴格度、REF CURSOR 處理、UNION ALL 規劃注意事項、具體化檢視表重新整理需求、並行交易、時間戳記/時區行為）
- **陷阱參考**：呈現移轉知識中的洞見，讓使用者了解為何需要進行變更
- **最佳做法**：就盡可能減少變更、保留邏輯與確保結構描述不變性提供建議
- **工作流程指引**：呈現一個六階段、設有關卡的移轉工作流程，並在每個關卡提供明確的成功準則

### 建議後行動 (Suggest-Then-Act) 模式

專家會建議可採取行動的後續步驟，且僅在使用者確認後才會繼續：

1. **教育**說明移轉主題及其重要性
2. **建議**具有預期成果的建議動作
3. **確認**使用者是否希望繼續
4. **採取行動** — 直接進行編輯並執行指令
5. **摘要**已產生的內容並建議下一步

無自主鏈結 — 由使用者控制進度與順序。

對於變更資料庫的動作，專家會提供指令碼與明確的執行指示；由使用者套用資料庫變更。

## 移轉工作流程

專家引導使用者完成六個階段、設有關卡的工作流程。每個階段在推進之前都必須滿足其成功準則。

**第 1 階段 — 探索與規劃** *(整個解決方案)*

- 探索所有專案並分類移轉資格
- 產出 `Reports/MasterMigrationPlan.md`，記錄 DDL 產物位置以及是否已使用外部工具（例如 `ora2pg`）

**第 2 階段 — 移轉前規劃與風險分析** *(每個專案)*

- 識別資料存取層（儲存機制、DAO、服務類別、SQL/程序呼叫）
- 產出 `Reports/{ProjectName}/OracleRiskAnalysis.md` — 程式碼中發現的 Oracle/PostgreSQL 行為差異的穩定分析參考
- 推導出 `Reports/{ProjectName}/MigrationChecklist.md` — 適用於第 5 階段的編號且可執行的檢查清單

**第 3 階段 — Oracle 測試專案建立與驗證** *(每個專案)*

- 搭建以 Oracle 為目標的 xUnit 測試專案並撰寫整合測試
- 建立通過的 Oracle 基準線 — 失敗的基準線代表在移轉開始*之前*就已存在缺陷
- 將任何行為差異記錄為結構化錯誤報告

**第 4 階段 — 結構描述與 DDL 移轉** *(每個專案)*

- 若 `MasterMigrationPlan.md` 記錄了外部工具已產生 PostgreSQL DDL，則略過
- 依相依性順序移轉：型別/列舉 → 資料表/序列 → 索引/條件約束 → 檢視表 → 觸發程序 → 預存程序 (PL/SQL → PL/pgSQL)
- 將產物輸出至 `DDL/Postgres/{ProjectName}/`；使用者套用指令碼並確認乾淨套用

**第 5 階段 — 程式碼移轉** *(每個專案)*

- 將應用程式專案複製到同層級的 `.Postgres` 專案中，新增至解決方案，並更新命名空間/組件名稱
- 使用 `migrating-oracle-to-postgres-data-access-code` 技能逐項處理 `MigrationChecklist.md`
- 在每個項目之後執行 `dotnet build`；在繼續之前修正錯誤
- 將完成的檢查清單與 `OracleRiskAnalysis.md` 進行交叉比對，以確認每項風險都已解決或具有合理解釋而推遲

**第 6 階段 — PostgreSQL 測試專案建立與驗證** *(每個專案)*

- 將 Oracle 測試專案複製為以第 5 階段應用程式複本為目標的 `.Postgres` 命名空間測試專案
- 移轉測試專案，以 `dotnet build` 作為每次變更的關卡
- 迭代修正使用者回報的失敗 — 預存程序的修正會寫回 `DDL/Postgres/{ProjectName}/`
- Oracle 測試專案在整個過程中必須保持不變

## 先決條件

- 具備 GitHub Copilot 的 Visual Studio Code
- 具有待移轉 Oracle 相依性的 .NET 解決方案
- 存取 Oracle 執行個體（用於基準線測試）與 PostgreSQL 執行個體（用於驗證）

## 目錄結構

Agent 預期並會在您的存放庫中建立以下結構：

```
.github/
└── oracle-to-postgres-migration/
    ├── Reports/
    │   ├── MasterMigrationPlan.md
    │   └── {ProjectName}/
    │       ├── OracleRiskAnalysis.md
    │       ├── MigrationChecklist.md
    │       ├── PostgresTestMigrationPlan.md
    │       └── BUG_REPORT_*.md
    └── DDL/
        ├── Oracle/                  # Oracle DDL scripts (pre-migration)
        └── Postgres/
            └── {ProjectName}/       # PostgreSQL DDL scripts per project (post-migration)
```

## 使用方式

1. **尋求指引**：使用移轉問題或情境呼叫專家（例如：*「我該如何處理將 .NET 解決方案移轉到 PostgreSQL 的問題？」* 或 *「Oracle 對於空字串的處理與 PostgreSQL 有何不同？」*）
2. **學習與規劃**：專家會解釋概念、揭示陷阱洞見，並呈現建議的工作流程步驟
3. **選擇您的下一步**：決定要處理的任務（總體計畫、風險分析、測試、程式碼移轉等）
4. **確認並採取行動**：告知專家繼續執行，它將直接進行編輯並執行指令
5. **檢閱並繼續**：檢查結果並詢問下一步

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個由社群驅動的 GitHub Copilot 擴充功能集合。

## 授權條款

MIT
