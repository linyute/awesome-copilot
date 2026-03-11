# Oracle-to-PostgreSQL 遷移專家外掛程式 (Migration Expert Plugin)

用於 .NET 解決方案中 Oracle 到 PostgreSQL 應用程式遷移的專家代理。執行程式碼編輯、執行指令，並呼叫擴充工具，以將 .NET/Oracle 資料存取模式遷移至 PostgreSQL。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install oracle-to-postgres-migration-expert@awesome-copilot
```

## 內容包含 (What's Included)

### 代理 (Agents)

| 代理 | 說明 |
|-------|-------------|
| `Oracle-to-PostgreSQL Migration Expert` | 用於 Oracle→PostgreSQL 遷移的專家代理。直接進行程式碼編輯和執行指令，針對遷移概念和陷阱教育使用者，並在使用者確認後呼叫擴充工具。 |

### 技能 (Skills)

| 技能 | 說明 |
|-------|-------------|
| `reviewing-oracle-to-postgres-migration` | 透過將程式碼與已知的行為差異（空字串、refcursors、類型強制轉換、排序、時間戳記、並行交易等）進行交叉比對，識別 Oracle-to-PostgreSQL 遷移風險。 |
| `creating-oracle-to-postgres-master-migration-plan` | 探索 .NET 解決方案中的所有專案，將各個專案分類為是否符合 Oracle-to-PostgreSQL 遷移資格，並產生一個持久化的主要遷移計畫。 |
| `migrating-oracle-to-postgres-stored-procedures` | 將 Oracle PL/SQL 預存程序遷移至 PostgreSQL PL/pgSQL。翻譯 Oracle 特定的語法，保留方法簽署和類型錨定參數，並套用 `COLLATE "C"` 以實現與 Oracle 相容的文字排序。 |
| `planning-oracle-to-postgres-migration-integration-testing` | 為 .NET 資料存取成品建立整合測試計畫，識別需要驗證涵蓋範圍的儲存庫、DAO 和服務層。 |
| `scaffolding-oracle-to-postgres-migration-test-project` | 建立一個包含交易回復基底類別和種子資料管理器的 xUnit 整合測試專案腳手架，用於 Oracle-to-PostgreSQL 遷移驗證。 |
| `creating-oracle-to-postgres-migration-integration-tests` | 產生與資料庫無關且具備確定性種子資料的 xUnit 整合測試，以驗證跨兩個資料庫系統的行為一致性。 |
| `creating-oracle-to-postgres-migration-bug-report` | 為 Oracle-to-PostgreSQL 遷移驗證期間發現的缺陷建立結構化錯誤報告，包含嚴重程度、根本原因和修復步驟。 |

## 功能特性 (Features)

### 教育性引導 (Educational Guidance)

專家代理在整個遷移旅程中對使用者進行教育：

- **遷移概念 (Migration Concepts)**：解釋 Oracle→PostgreSQL 的差異（空字串與 NULL、NO_DATA_FOUND 異常、排序順序、TO_CHAR 轉換、類型強制轉換嚴格度、REF CURSOR 處理、並行交易、時間戳記/時區行為）
- **陷阱參考 (Pitfall Reference)**：呈現遷移知識中的深入見解，讓使用者瞭解為何需要進行變更
- **最佳實務 (Best Practices)**：針對最小化變更、保留邏輯以及確保結構不可變性 (schema immutability) 提供建議
- **工作流程引導 (Workflow Guidance)**：呈現四個階段的遷移工作流程，作為使用者可以按照自己的進度遵循的指南

### 建議後執行模式 (Suggest-Then-Act Pattern)

專家會建議可執行的後續步驟，並僅在使用者確認後才繼續：

1. **教育 (Educate)**：針對遷移主題及其重要性進行說明
2. **建議 (Suggest)**：提供具有預期結果的建議動作
3. **確認 (Confirm)**：確認使用者想要繼續
4. **執行 (Act)**：直接進行編輯、執行指令或呼叫擴充工具
5. **總結 (Summarize)**：總結產出的內容並建議下一步

不再有自動鏈接 (autonomous chaining) — 使用者控制進度與順序。

## 遷移工作流程 (Migration Workflow)

專家引導使用者完成四個階段的工作流程：

**第 1 階段 — 探索與規劃 (Discovery & Planning)**

1. 建立主要遷移計畫（將解決方案中的所有專案進行分類）
2. 設定 Oracle 與 PostgreSQL 的 DDL 成品 (artifacts)

**第 2 階段 — 程式碼遷移 (Code Migration)** *(各專案)*
3. 遷移應用程式程式碼（透過 `ms-ossdata.vscode-pgsql` 擴充功能）
4. 遷移預存程序 (Oracle PL/SQL → PostgreSQL PL/pgSQL)

**第 3 階段 — 驗證 (Validation)** *(各專案)*
5. 規劃整合測試
6. 建立 xUnit 測試專案腳手架
7. 建立整合測試
8. 對 Oracle（基準線）與 PostgreSQL（目標）執行測試
9. 驗證測試結果
10. 為任何失敗建立錯誤報告 (bug reports)

**第 4 階段 — 報告 (Reporting)**
11. 產生最終遷移報告（透過 `ms-ossdata.vscode-pgsql` 擴充功能）

## 先決條件 (Prerequisites)

- 具備 GitHub Copilot 的 Visual Studio Code
- PostgreSQL 擴充功能 (`ms-ossdata.vscode-pgsql`) — 應用程式程式碼遷移和報告產生所需
- 待遷移的包含 Oracle 依賴項的 .NET 解決方案

## 目錄結構 (Directory Structure)

代理程式期望並在您的儲存庫中建立以下結構：

```
.github/
└── oracle-to-postgres-migration/
    ├── Reports/
    │   ├── Master Migration Plan.md
    │   ├── {Project} Integration Testing Plan.md
    │   ├── {Project} Application Migration Report.md
    │   ├── BUG_REPORT_*.md
    │   └── TestResults/
    └── DDL/
        ├── Oracle/      # Oracle DDL 腳本 (遷移前)
        └── Postgres/    # PostgreSQL DDL 腳本 (遷移後)
```

## 使用方式 (Usage)

1. **尋求引導**：針對遷移問題或情況呼叫專家（例如：*「我應該如何將我的 .NET 解決方案遷移到 PostgreSQL？」*或*「Oracle 與 PostgreSQL 在處理空字串方面有什麼不同？」*）
2. **學習與規劃**：專家解釋概念，呈現陷阱見解，並呈現建議的工作流程步驟
3. **選擇您的下一步**：決定要處理哪個工作（主要計畫、程式碼遷移、測試等）
4. **確認並執行**：告訴專家繼續執行，它將直接進行編輯、執行指令或呼叫擴充工具
5. **檢閱並繼續**：檢查結果並要求進行下一步

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
