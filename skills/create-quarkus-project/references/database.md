# 資料庫

擴充功能：`hibernate-orm-panache`、`jdbc-postgresql` (或其他 JDBC 驅動程式)。選用：`flyway` 或 `liquibase`。

"Panache Next" (統一的封閉式/反應式 API) 在 3.37 中更名為 Quarkus Data：構件為 `quarkus-data-hibernate` (原為 `quarkus-hibernate-panache-next`，更早為 `quarkus-hibernate-panache`)。其在 3.40.1 中的擴充功能中繼資料標記為 `status: experimental`，因此除非使用者要求使用 Quarkus Data，否則請保留使用 `hibernate-orm-panache` (穩定版)。此處未編譯：僅檢查了構件中繼資料以及 3.37/4.0 移轉指南。

## Dev Services

在未設定 `quarkus.datasource.jdbc.url` 的情況下，開發和測試模式會自動啟動 PostgreSQL 容器 (需要 Docker/Podman)。請勿在 `%dev`/`%test` 中設定 URL。調校設定：

```properties
quarkus.datasource.db-kind=postgresql
%dev.quarkus.datasource.devservices.image-name=postgres:17
%dev.quarkus.datasource.devservices.reuse=true
```

若未指定 `image-name`，3.40 會啟動 `postgres:18`；請釘選映像以符合生產環境。`reuse` 僅在 Testcontainers 使用者檔案 `~/.testcontainers.properties` 包含 `testcontainers.reuse.enable=true` 時生效 (否則 Quarkus 會記錄 "Reuse was requested but the environment does not support the reuse of containers")。

生產環境設定放置於 `%prod.`：

```properties
%prod.quarkus.datasource.jdbc.url=${DB_URL}
%prod.quarkus.datasource.username=${DB_USER}
%prod.quarkus.datasource.password=${DB_PASSWORD}
```

## Hibernate ORM

```properties
%dev.quarkus.hibernate-orm.schema-management.strategy=drop-and-create
%prod.quarkus.hibernate-orm.schema-management.strategy=none
```

(`quarkus.hibernate-orm.database.generation` 是已淘汰的舊有名稱：3.40 會為其記錄淘汰警告。`schema-management.strategy` 已在 3.27.6 和 3.40.1 上驗證；針對較舊版本請參閱 Hibernate ORM 指南。)

Panache 儲存機制：

```java
@Entity
public class Product { @Id @GeneratedValue Long id; String name; }

@ApplicationScoped
public class ProductRepository implements PanacheRepository<Product> {}
```

在寫入的方法上加上 `@Transactional`。使用 `find(...).page(Page.of(0, 20))` 進行分頁。

## 移轉 (Migrations)

在生產環境中請使用 Flyway (`quarkus-flyway`) 或 Liquibase (`quarkus-liquibase`)：

```properties
quarkus.flyway.migrate-at-start=true
```

採用 Flyway 或 Liquibase 時，請移除所有 Hibernate 結構描述重建覆寫 (例如上述 `%dev` 的 `drop-and-create`)，並設定 `quarkus.hibernate-orm.schema-management.strategy=none` (或 `validate`)，讓移轉工具單獨管理結構描述；否則 Hibernate 可能會捨棄並重建已移轉的資料表。

搭配 PostgreSQL 時，Flyway 還需要在 `quarkus-flyway` 旁加上資料庫專屬模組 `org.flywaydb:flyway-database-postgresql` (由 Quarkus BOM 管理)；如果沒有它，啟動將會失敗，因為 Flyway 無法處理 PostgreSQL。

將指令碼放在 `src/main/resources/db/migration` (`V1__init.sql`)。Flyway 也會自動取得 Dev Services 提供的資料來源。
