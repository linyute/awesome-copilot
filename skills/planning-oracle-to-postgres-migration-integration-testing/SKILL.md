---
name: planning-oracle-to-postgres-migration-integration-testing
description: '為 Oracle 到 PostgreSQL 資料庫遷移期間的 .NET 資料存取成品建立整合測試計畫。分析單一專案以識別與資料庫互動的存放庫、DAO 和服務層，然後產出結構化測試計畫。在規劃遷移專案的整合測試涵蓋範圍、識別哪些資料存取方法需要測試或為 Oracle 到 PostgreSQL 遷移驗證做準備時使用。'
---

# 規劃 Oracle 到 PostgreSQL 遷移的整合測試 (Planning Integration Testing for Oracle-to-PostgreSQL Migration)

分析單一目標專案以識別需要整合測試的資料存取成品，然後產出結構化且可執行的測試計畫。

## 工作流程 (Workflow)

```
進度：
- [ ] 步驟 1：識別資料存取成品
- [ ] 步驟 2：分類測試優先權
- [ ] 步驟 3：撰寫測試計畫
```

**步驟 1：識別資料存取成品**

僅限於目標專案範圍。尋找與資料庫直接互動的類別和方法 — 存放庫、DAO、預存程序呼叫器、執行 CRUD 操作的服務層。

**步驟 2：分類測試優先權**

根據遷移風險對成品進行排名。對於使用 Oracle 特定功能（Refcursors, `TO_CHAR`, 隱式型別強制, `NO_DATA_FOUND`）的方法，優先權應高於簡單的 CRUD。

**步驟 3：撰寫測試計畫**

撰寫一份涵蓋下列內容的 Markdown 計畫：
- 具有方法簽章的可測試成品清單
- 每個成品的建議測試案例
- 種子資料需求
- 需要驗證的已知 Oracle→PostgreSQL 行為差異

## 輸出

將計畫寫入：`.github/oracle-to-postgres-migration/Reports/{TARGET_PROJECT} Integration Testing Plan.md`

## 關鍵限制

- **單一專案範圍** — 僅規劃目標專案內成品的測試。
- **僅限資料庫互動** — 略過不涉及資料庫的商業邏輯。
- **Oracle 是黃金來源** — 測試應捕捉 Oracle 的預期行為，以便與 PostgreSQL 進行比較。
- **不支援多重連線管理** — 遷移後的應用程式會被複製並重新命名（例如：`MyApp.Postgres`），因此每個執行個體僅針對一個資料庫。
