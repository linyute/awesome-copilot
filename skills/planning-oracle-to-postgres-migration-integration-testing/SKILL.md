---
name: planning-oracle-to-postgres-migration-integration-testing
description: '為 Oracle 至 PostgreSQL 資料庫遷移期間的 .NET 資料存取成品建立整合測試計劃。分析單一專案以識別與資料庫互動的儲存庫、DAO 及服務層，然後產生結構化的測試計劃。在規劃已遷移專案的整合測試覆蓋率、識別哪些資料存取方法需要測試，或準備 Oracle 至 PostgreSQL 遷移驗證時使用。'
---

# 規劃 Oracle 至 PostgreSQL 遷移的整合測試

分析單一目標專案以識別需要整合測試的資料存取成品，然後產生結構化、可執行的測試計劃。

## 工作流程

```
進度：
- [ ] 步驟 1：識別資料存取成品
- [ ] 步驟 2：分類測試優先順序
- [ ] 步驟 3：撰寫測試計劃
```

**步驟 1：識別資料存取成品**

僅限目標專案範圍。找出直接與資料庫互動的類別與方法 — 儲存庫、DAO、預存程序呼叫器、執行 CRUD 操作的服務層。

**步驟 2：分類測試優先順序**

依遷移風險對成品進行排名。將使用 Oracle 特定功能（refcursor、`TO_CHAR`、隱式型別強制轉換、`NO_DATA_FOUND`）的方法優先於簡單的 CRUD。

**步驟 3：撰寫測試計劃**

撰寫涵蓋以下內容的 Markdown 計劃：
- 具有方法簽章的可測試成品清單
- 每個成品的建議測試案例
- 種子資料需求
- 需驗證的已知 Oracle→PostgreSQL 行為差異
- 確保每個資料庫接觸點至少有一個測試案例（或針對高風險方法的合理案例集）的覆蓋率對應

在定義建議的測試案例時，明確包含：
- 空字串與 `NULL`/缺失值的文字參數行為。
- 日期時間/時區斷言，包括往返與比較行為。
- 目標欄位使用 `timestamp without time zone` 或 `timestamp(0)` 的情況，並明確指定時區套用預期。

## 輸出

將計劃寫入：`.github/oracle-to-postgres-migration/Reports/{TARGET_PROJECT} Integration Testing Plan.md`

## 主要限制

- **單一專案範圍** — 僅為目標專案內的成品規劃測試。
- **僅限資料庫互動** — 跳過不涉及資料庫的商業邏輯。
- **Oracle 為黃金來源** — 測試應擷取 Oracle 的預期行為以與 PostgreSQL 進行比較。
- **無多連線測試框架** — 已遷移的應用程式會被複製並重新命名（例如 `MyApp.Postgres`），因此每個實例僅指向一個資料庫。
