---
name: java-hibernate-jpa
description: '在純 Java 中診斷並修正 Hibernate ORM / Jakarta Persistence 問題：N+1 查詢、延遲載入錯誤、識別碼產生、實體 equals/hashCode、串聯 cascade、分頁、批次處理、鎖定、快取、實體上的 Lombok，以及 Hibernate 6/7 的差異。在審查或撰寫 JPA 實體、映射與查詢時使用。不限特定框架。'
---

# Hibernate ORM 與 Jakarta Persistence

針對實體映射與查詢的問題 -> 反模式 -> 修正方案函式庫。不限特定框架：涵蓋 `EntityManager`/`Session` 行為、JPQL/HQL 以及映射標註。若專案使用 Spring Boot 且已安裝 `java-springboot` 與 `spring-boot-testing` 技能，請針對 Spring Data 存放庫、交易綁定與 `@DataJpaTest` 使用這些技能；針對 Panache 與反應式持續性請參閱 Quarkus 技能。針對真實資料庫的整合測試：`java-testcontainers`。

## 首先：偵測技術堆疊

1. 閱讀 `pom.xml`/`build.gradle`（或依賴樹）以確認 `hibernate-core` 與持續性 API：`jakarta.persistence`（Hibernate 6+/Jakarta EE 9+）對比 `javax.persistence`（Hibernate 5，請參閱 `javax-to-jakarta-migration`）。
2. 注意 Hibernate 的主要版本；行為有所不同（請參閱 `references/tooling-and-versions.md`）。Hibernate 6.0-6.1 實作 Jakarta Persistence 3.0，6.2+ 實作 3.1，7.x 實作 3.2，且 Hibernate 7 需要 Java 17+。
3. 注意資料庫類型以及結構描述是否由 Flyway/Liquibase 管理。
4. 在進行任何「最佳化」之前，先在測試中開啟 SQL 記錄與統計資訊（請參閱 `references/tooling-and-versions.md`）：量測陳述式計數。

## 快速決策表

| 徵兆 | 可能原因 | 前往參考 |
| --- | --- | --- |
| 單一請求觸發許多類似的 SELECT | 延遲關聯上的 N+1 | `references/fetching-and-n-plus-one.md` |
| `LazyInitializationException` | 在 session 外部進行延遲存取 | `references/fetching-and-n-plus-one.md` |
| `HHH000104` / `HHH90003004` 警告、記憶體耗損巨大 | 集合 fetch join 搭配分頁 | `references/queries-pagination-batching.md` |
| 新增緩慢、無 JDBC 批次處理 | `IDENTITY` id 或未設定批次處理 | `references/identifiers-and-entity-design.md`, `references/queries-pagination-batching.md` |
| 重複資料列 / 子項遺失 / `Set` 異常 | 不當的 `equals`/`hashCode` 或濫用 cascade | `references/identifiers-and-entity-design.md`, `references/associations-and-cascade.md` |
| 更新遺失、死結 | 缺少鎖定策略 | `references/locking-transactions-caching.md` |
| 快取導致過期或異常資料 | 濫用二級快取/查詢快取 | `references/locking-transactions-caching.md` |
| 結構描述偏離、生產環境使用 `ddl-auto` | 缺少遷移工具 | `references/tooling-and-versions.md` |

## 最高原則（審查時套用）

1. 關聯：`@ManyToOne`/`@OneToOne` 預設為 EAGER；請明確宣告 `fetch = FetchType.LAZY`。`@OneToMany`/`@ManyToMany` 預設為 LAZY 且應保持如此。擷取方式應**依每個查詢個別選擇**（JOIN FETCH、entity graph），而非將映射宣告為 EAGER。
2. 優先使用 `@ManyToOne` 擁有端，且僅在必要時建立雙向 `@OneToMany(mappedBy=...)`；透過協助程式方法保持兩端同步。
3. 集合使用 `Set` 還是 `List`？`@ManyToMany` 請使用 `Set`；帶有 `@JoinColumn` 的單向 `@OneToMany` 或無排序的 `List` 其更新模式代價高昂。
4. 切勿在 `@ManyToOne` 或 `@ManyToMany` 上使用 `CascadeType.REMOVE`/`ALL`。僅在真正由父項擁有的子集合上使用 `orphanRemoval`。
5. 識別碼：針對產生的數值型 id 使用 `SEQUENCE`（pooled 最佳化工具，`allocationSize` 需符合資料庫 increment）；`IDENTITY` 會停用 JDBC insert 批次處理；當 id 必須由用戶端產生時使用 UUID（優先採用時間排序）。
6. 實體：切勿在關聯上使用 Lombok `@Data`/`@EqualsAndHashCode`/`@ToString`；請審慎實作 `equals`/`hashCode`。
7. 從讀取端點回傳 DTO/投影而非實體；切勿在 API 中直接暴露實體（延遲代理物件）。
8. 使用穩定的 `ORDER BY` 進行分頁，包含唯一的 tiebreaker 排序鍵；切勿將 `setMaxResults` 與集合 `JOIN FETCH` 結合。
9. 在服務邊界保持交易精簡；交易內部不得包含遠端呼叫或使用者互動。
10. 大量作業時採批次寫入與排清（flush），並定期清理持續性上下文。
11. 針對真實資料庫引擎在測試中驗證陳述式計數行為。
12. 遵循下方的結構描述管理規則。

## 結構描述管理規則

這是其他技能依名稱參照的單一規則：

- **原型/本機開發：** `hibernate.hbm2ddl.auto=update`（或用於一次性測試的 `create-drop`）是可以接受的。
- **生產環境（預設）：** 使用 Flyway 或 Liquibase 進行具版本的遷移，並設定 `hibernate.hbm2ddl.auto=validate`（或 `none`）。當使用者需要具版本的遷移或應用程式準備進入生產環境時新增它們。
- **外部管理的結構描述：** `none`（或 `validate`）；請勿新增遷移工具。

## 審查重點

檢查 N+1 的陳述式計數、to-one 關聯上明確的 `LAZY`、帶有相符 `allocationSize` 的 sequence 型識別碼，以及在暫時（transient）至持續（persistent）狀態間維持穩定的 `equals`/`hashCode`。版本專屬細節（Hibernate 5/6/7）：`references/tooling-and-versions.md`。

## 參考資料

- `references/fetching-and-n-plus-one.md`：N+1 偵測與修正、延遲對比積極、`LazyInitializationException`、open-session-in-view、DTO 投影。
- `references/identifiers-and-entity-design.md`：id 產生、`equals`/`hashCode`、Lombok、record 對比實體、列舉與轉換器、值型別。
- `references/associations-and-cascade.md`：雙向協助程式、cascade、`orphanRemoval`、集合選擇、`@ManyToMany`。
- `references/queries-pagination-batching.md`：分頁（offset、keyset、記憶體內分頁警告）、大量作業、JDBC 批次處理、`StatelessSession`。
- `references/locking-transactions-caching.md`：開放式/封閉式鎖定、交易邊界、排清模式、二級快取。
- `references/tooling-and-versions.md`：SQL 記錄、統計資訊、測試、連線池大小設定、資料庫遷移、Hibernate 5/6/7 差異。

標準文件：Hibernate ORM 使用者指引 <https://docs.hibernate.org/orm/current/userguide/html_single/> 與 Jakarta Persistence <https://jakarta.ee/specifications/persistence/>。深入背景專文：<https://vladmihalcea.com/>。

升級（擷取目標版本的頁面；若有衝突以官方頁面為準）：遷移指引 <https://hibernate.org/orm/documentation/migrate/>（6.6: <https://docs.hibernate.org/orm/6.6/migration-guide/>，7.0: <https://docs.hibernate.org/orm/7.0/migration-guide/>），發行版本資訊 <https://hibernate.org/orm/releases/>。
