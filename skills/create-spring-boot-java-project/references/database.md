# 資料庫（PostgreSQL）

預設值：PostgreSQL（映像 `postgres:18-alpine`，參閱 [versions.md](versions.md)）、Spring Data JPA、Hibernate、HikariCP。相依性：`data-jpa`、`postgresql`、`docker-compose`、`testcontainers`。

## 組態

```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/mydb}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:user}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:password}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
spring.jpa.show-sql=false
```

驅動程式類別會從 URL 自動偵測；請勿手動設定。上述預設值僅供本機開發使用：正式環境憑證來自環境變數（參閱 [configuration.md](configuration.md)）。

## 綱要管理（`ddl-auto`）

遵循 `java-hibernate-jpa` 技能的綱要管理規則（原型/本機、使用 Flyway/Liquibase 的正式環境，或外部管理）。下方的表格與設定將其套用至 Spring Boot。

| 數值 | 行為 | 適用情境 |
|-------|-----------|---------|
| `update` | 新增缺少的資料表/欄位，絕不卸除（drop） | 本機開發 / 原型 |
| `validate` | 若綱要與實體不符，則於啟動時失敗 | 正式環境 |
| `create` / `create-drop` | 於啟動時重新建立綱要（並於關閉時卸除） | 一次性測試 |
| `none` | Hibernate 不執行任何動作 | 綱要由其他處管理 |

Hibernate 的 `update` 雖然方便，但無法進行重新命名、卸除或移轉資料。針對正式環境的綱要演進，**Flyway 或 Liquibase 為選用但建議使用**：新增 starter：在 Boot 4 上為 `spring-boot-starter-flyway` 加上 `org.flywaydb:flyway-database-postgresql`（或 `spring-boot-starter-liquibase`），因為 Boot 4 自動組態位於 starter 中；在 Boot 3 上則直接新增 `org.flywaydb:flyway-core` 加上 `flyway-database-postgresql`（或 `liquibase-core`）。將移轉指令碼放在 `src/main/resources/db/migration`（`V1__init.sql`），並設定 `ddl-auto=validate`。當使用者需要具備版本的移轉或應用程式準備進入正式環境時，將其加入。

## 實體

保持實體具備精確的註解（`@Table`、`@Column(length=..., nullable=...)`、`@Index`），以確保產生或驗證的 DDL 正確無誤。使用 `GenerationType.IDENTITY` 或序列（sequence）、時間戳記使用 `Instant`，並避免在 API 中公開實體（使用 DTO/record）。

## 本機開發：Docker Compose

搭配 `spring-boot-docker-compose`，Spring Boot 會自動啟動 `compose.yaml` 並連接資料來源（無需指定 URL）：

```yaml
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user", "-d", "mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## 測試

使用帶有 `@ServiceConnection` 的 Testcontainers；請參閱 `spring-boot-testing` 技能（`references/testcontainers-jdbc.md`）。固定映像標籤；絕不使用 `latest`。start.spring.io 會在 `compose.yaml` 與 `TestcontainersConfiguration` 中產生 `postgres:latest`：請將兩者皆替換為 `postgres:18-alpine`（已驗證）。

## 效能與正式環境

- HikariCP 為預設集區（pool）；微調 `spring.datasource.hikari.maximum-pool-size` 與 `connection-timeout`。
- 避免 N+1 查詢：使用 `JOIN FETCH` 或 `@EntityGraph`；讀取模型使用 DTO 投影（projection）。
- 保持 `open-in-view=false` 並在服務上加上 `@Transactional`。
- 為外部索引鍵（foreign key）以及篩選/排序的欄位建立索引；使用 `EXPLAIN ANALYZE` 檢查執行計畫。
