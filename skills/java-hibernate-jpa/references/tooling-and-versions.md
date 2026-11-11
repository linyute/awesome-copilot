# 工具、診斷、遷移、版本

## SQL 記錄與統計資訊

優先使用記錄器分類（logger categories），而非 `hibernate.show_sql`（後者未格式化且不含參數地輸出至 stdout）。將這些元素新增至現有 Logback `logback.xml` 的 `<configuration>` 內（保留其 appender 與 root logger）：

```xml
<logger name="org.hibernate.SQL" level="DEBUG"/>
<logger name="org.hibernate.orm.jdbc.bind" level="TRACE"/>
```

`org.hibernate.orm.jdbc.bind` 適用於 Hibernate 6+；在 Hibernate 5 上請使用 `org.hibernate.type.descriptor.sql.BasicBinder`。針對 Log4j2，在 `log4j2.xml` 的 `<Loggers>` 內以 `<Logger name="..." level="..."/>` 元素設定相同的分類；在 `hibernate.properties` 中的純分類屬性無法設定任一後端。

統計資訊與慢查詢記錄：

```properties
hibernate.generate_statistics=true
hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS=25
```

針對 N+1 迴歸測試中的 SQL 陳述式總數斷言，比對業務使用案例前後的 `sessionFactory.getStatistics().getPrepareStatementCount()`，或使用資料來源代理（例如 datasource-proxy、p6spy）。`getQueryExecutionCount()` 計算的是已執行的 ORM 查詢次數，而非為了初始化延遲關聯而發出的次要 SELECT 次數；`getEntityFetchCount()` 與 `getCollectionFetchCount()` 是實用的補充診斷資訊，非總陳述式計數。僅在開發/測試環境將記錄保持在 DEBUG/TRACE；統計資訊會帶來額外負擔。

針對慢速 SQL 在真實資料庫上使用 `EXPLAIN (ANALYZE)`；外鍵上的索引需由您自行負責（在多數資料庫上 Hibernate 不會為主動為外鍵建立索引）。

## 測試持續性程式碼

- 透過 Testcontainers（`java-testcontainers`）對照生產環境資料庫引擎進行測試，而非使用相容模式的 H2。
- 在斷言讀取前，於測試中進行排清與清理（`em.flush(); em.clear();`），否則您測試的僅是一級快取。
- 在測試中執行真實的遷移指令碼，並使用 `hibernate.hbm2ddl.auto=validate` 捕捉映射與結構描述的偏離。
- 為清單端點新增陳述式計數斷言，以防止 N+1 迴歸問題。

## 連線池大小設定

- Hibernate 在每次交易中使用連線池；連線池大小限制的是並行資料庫工作量，而非請求數量。從小規模開始（粗略遵循 `cores * 2 + effective spindles` 經驗法則，每個應用程式執行個體通常為 10-20 個）並依據量測結果調校。
- 跨執行個體的連線總數必須保持在資料庫 `max_connections` 以下。
- 長時間交易、OSIV 以及交易內部的遠端呼叫是連線池耗盡的常見原因，而非連線數過少。
- 在開發環境設定連線逾時、最大存活時間（低於資料庫/代理閒置限制）與外洩偵測（HikariCP `leakDetectionThreshold`）。
- 當您的連線池支援時，使用連線池的 `autoCommit=false` 與 `hibernate.connection.provider_disables_autocommit=true`，將連線取得推遲至第一條陳述式執行時。

## 結構描述管理

- 生產環境：Flyway 或 Liquibase 遷移，具備版本控制並經過審查；`hibernate.hbm2ddl.auto` 設定為 `validate` 或 `none`。
- `update`/`create`/`create-drop` 僅用於原型開發與一次性測試；`update` 從不刪除或重新命名，且可能會無聲無息地偏離各環境。
- Jakarta Persistence 結構描述產生（`jakarta.persistence.schema-generation.*`）可輸出指令碼供比對差異；切勿盲目套用。
- 為了達成零停機時間（展開/收縮 expand/contract），保持遷移與舊版本相容。Sequence 的 `INCREMENT BY` 必須符合 `allocationSize`。
- 在遷移中明確命名條件約束與索引；在外鍵以及篩選/排序資料行上新增索引。

## Hibernate 版本差異（優先偵測）

| 主題 | Hibernate 5.x | Hibernate 6.x | Hibernate 7.x |
| --- | --- | --- | --- |
| 命名空間 | `javax.persistence`（5.5+ 亦提供 `hibernate-core-jakarta`） | `jakarta.persistence` | `jakarta.persistence` |
| Jakarta Persistence | 2.2 | 3.0 (6.0-6.1), 3.1 (6.2+) | 3.2 |
| Java 基準 | 8+ | 11+ | 17+ |
| 查詢引擎 | HQL 語法解析器 (ANTLR 2) | 重寫（語意查詢模型，ANTLR 4）；更嚴格的 HQL；更多 SQL 功能 | 延續 6 的架構；更多 HQL 功能，更嚴格的驗證 |
| Fetch-join 重複項目 | 需要 `DISTINCT` | 自動去重 | 與 6 相同 |
| 分頁 + 集合 fetch 警告 | `HHH000104` | `HHH90003004` | 與 6 相同 |
| Id 產生 | 舊版 `hibernate.id.new_generator_mappings` | 序列優先的 `AUTO`；`@GenericGenerator` 自 6.5 起廢棄 | 優先使用標準標註與 `@UuidGenerator`/`@IdGeneratorType` |
| Metamodel 產生器 | `hibernate-jpamodelgen` | `hibernate-jpamodelgen`（`hibernate-processor` 為其後繼者，於 7.0 引入） | `hibernate-processor` |
| Hibernate Reactive/其他 | 無 | 獨立 artifacts | 獨立 artifacts |

遷移備註（5 -> 6）：修正 `javax` -> `jakarta` 匯入（`javax-to-jakarta-migration` 技能）、因應更嚴格的語法解析審查 HQL、重新檢查產生的 sequence 名稱與 `allocationSize`、重新檢查 `@Type`/自訂型別使用與 `AttributeConverter`、`Query.getResultList` 行為以及 `@Where`/`@Filter` 使用。請閱讀官方遷移指引：<https://docs.hibernate.org/orm/6.0/migration-guide/> 與 7 的對應指引。撰寫本文時 Hibernate 8 處於測試階段；切勿預設使用其 API。

本技能其他地方提及的特定版本 API（entity-graph hint 對比 `setEntityGraph`、`KeyedPage`、UUID 風格）在使用前應對照專案的 Hibernate 版本進行確認。

## 工具

- Metamodel/具型別的 Criteria：Hibernate 6.x 使用 `hibernate-jpamodelgen`（`hibernate-processor` 在 Maven Central 上首次出現於 7.0.0.Alpha1），Hibernate 7 使用 `hibernate-processor`（`org.hibernate.orm:hibernate-processor`，`provided`/annotation-processor 範圍；`hibernate-jpamodelgen` 7.x 僅為指向它的 Maven relocation）。
- JDK 23+ 不再執行僅在類別路徑上找到的註解處理器：使用單純的 `provided` 依賴項將不會產生 `Entity_` 類別。請在 `maven-compiler-plugin` 上設定 `<proc>full</proc>`（或在 `annotationProcessorPaths` 中列出處理器；Gradle：`annotationProcessor`）。
- 位元組碼增強（延遲基本屬性、dirty tracking、延遲 to-one 反向端）：Hibernate Maven/Gradle 外掛程式；請審慎測試。
- 驗證：Jakarta Bean Validation 會與 persist/update 整合，但無法取代資料庫條件約束。
