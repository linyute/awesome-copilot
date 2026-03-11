---
name: creating-oracle-to-postgres-migration-bug-report
description: '針對 Oracle 到 PostgreSQL 遷移期間發現的缺陷建立結構化錯誤報告。在將 Oracle 和 PostgreSQL 之間的行為差異記錄為具有嚴重性、根本原因和修復步驟的可採取行動錯誤報告時使用。'
---

# 為 Oracle 到 PostgreSQL 遷移建立錯誤報告 (Creating Bug Reports for Oracle-to-PostgreSQL Migration)

## 何時使用

- 記錄由 Oracle 和 PostgreSQL 之間的行為差異引起的缺陷
- 為 Oracle 到 PostgreSQL 遷移專案撰寫或檢閱錯誤報告

## 錯誤報告格式

使用 [references/BUG-REPORT-TEMPLATE.md](references/BUG-REPORT-TEMPLATE.md) 中的模板。每份報告必須包含：

- **狀態 (Status)**：✅ RESOLVED, ⛔ UNRESOLVED, 或 ⏳ IN PROGRESS
- **元件 (Component)**：受影響的端點、存放庫或預存程序
- **測試 (Test)**：相關自動化測試名稱
- **嚴重性 (Severity)**：低 / 中 / 高 / 緊急 — 根據影響範圍而定
- **問題 (Problem)**：預期的 Oracle 行為 vs. 觀察到的 PostgreSQL 行為
- **情境 (Scenario)**：包含種子資料、操作、預期結果和實際結果的有序重現步驟
- **根本原因 (Root Cause)**：導致缺陷的特定 Oracle/PostgreSQL 行為差異
- **解決方案 (Solution)**：已做或需要的變更，並附上明確的檔案路徑
- **驗證 (Validation)**：在兩個資料庫上確認修復的步驟

## Oracle 到 PostgreSQL 指引

- **Oracle 是真實來源** — 從 Oracle 基準線建構預期行為
- 明確指出資料層細微差異：空字串 vs. NULL、類型強制的嚴格程度、定序 (Collation)、序列值、時區、填補、條件約束
- 除非正確行為需要，否則應避免更改用戶端程式碼；若提出變更，請清楚記錄並說明理由

## 寫作風格

- 淺顯易懂的語言、短句、清晰的後續行動
- 始終使用現在式或過去式
- 針對步驟和驗證使用項目符號和編號清單
- 使用最少的 SQL 摘錄和記錄作為證據；省略敏感資料並保持程式碼片段可重現
- 遵循現有的執行階段/語言版本；避免投機性的修復

## 檔名慣例

將錯誤報告儲存為 `BUG_REPORT_<DescriptiveSlug>.md`，其中 `<DescriptiveSlug>` 是簡短的 PascalCase 識別碼（例如：`EmptyStringNullHandling`, `RefCursorUnwrapFailure`）。
