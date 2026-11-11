# Testcontainers JDBC

使用 Testcontainers 在真實資料庫中測試 JPA Repository。

## 概觀

Testcontainers 在 Docker 容器中提供真實資料庫實例，避免 H2/內嵌資料庫的相容性問題。

## 快速上手：`@ServiceConnection` (PostgreSQL)

請先確認專案的版本。Testcontainers 2.x（Spring Boot 4 / Spring Framework 7）精簡了模組命名，並移除容器類別上的泛型：

| | Testcontainers 2.x (Boot 4) | Testcontainers 1.x (Boot 3) |
|---|---|---|
| PostgreSQL | `org.testcontainers.postgresql.PostgreSQLContainer` | `org.testcontainers.containers.PostgreSQLContainer<?>` |
| MySQL | `org.testcontainers.mysql.MySQLContainer` | `org.testcontainers.containers.MySQLContainer<?>` |
| 構件 ID | `testcontainers-postgresql` | `postgresql` |

`@ServiceConnection`（Spring Boot 3.1+）取代了 `@DynamicPropertySource`，能根據容器自動配置 `spring.datasource.*`。

### 相依性 (Boot 4 / Testcontainers 2.x)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers-postgresql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers-junit-jupiter</artifactId>
  <scope>test</scope>
</dependency>
```

### 選項 A：共享設定（推薦，可在測試間重複使用容器）

```java
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration { // public: tests in sub-packages import it

  @Bean
  @ServiceConnection
  PostgreSQLContainer postgresContainer() {
    return new PostgreSQLContainer("postgres:18-alpine");
  }
}

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class OrderIT { }
```

本機開發時針對相同容器啟動應用程式（例如 `TestApplication.java`）：請在上述類別加上 `@TestConfiguration(proxyBeanMethods = false)`，並在包含 `main` 的測試啟動器中以 `SpringApplication.from(Application::main).with(ContainersConfig.class).run(args)` 執行。

### 選項 B：每個測試類別獨立容器

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryPostgresTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");

  @Autowired
  private OrderRepository orderRepository;

  @Autowired
  private TestEntityManager entityManager;
}
```

注意：`Order` 是 SQL 的保留字；名為 `Order` 的實體需要以 `@Table(name = "orders")` 指定資料表名稱，以相容於 PostgreSQL。

## MySQL 設定

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers-mysql</artifactId>
  <scope>test</scope>
</dependency>
```

```java
import org.testcontainers.mysql.MySQLContainer; // 2.x

@Container
@ServiceConnection
static MySQLContainer mysql = new MySQLContainer("mysql:8.4");
```

Testcontainers 1.x (Boot 3) 變形：`org.testcontainers.containers.MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")`，構件 ID 為 `mysql`。

## 多個資料庫

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class MultiDatabaseTest {

  @Container
  @ServiceConnection(name = "primary")
  static PostgreSQLContainer primaryDb = new PostgreSQLContainer("postgres:18");

  @Container
  @ServiceConnection(name = "analytics")
  static PostgreSQLContainer analyticsDb = new PostgreSQLContainer("postgres:18");
}
```

## 容器重用（速度最佳化）

跨執行重用僅限本機開發。請在 `~/.testcontainers.properties` 中透過 `testcontainers.reuse.enable=true` 啟用，並呼叫 `.withReuse(true)`。搭配 singleton 容器模式可避免類別間重複啟動：

```java
@ServiceConnection
static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18")
  .withReuse(true);

static {
  postgres.start();
}
```

關於通用的生命週期、singleton 與重用規則，請使用本指南的通則設定。

## 資料庫初始化

### 使用 SQL 指令碼

```java
@Container
@ServiceConnection
static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18")
  .withInitScript("schema.sql");
```

### 搭配 Flyway

```java
@SpringBootTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MigrationTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");

  @Autowired
  private Flyway flyway;

  @Test
  void shouldApplyMigrations() {
    flyway.migrate();
    // Test code
  }
}
```

## 進階設定

### 自訂資料庫/結構描述 (Schema)

```java
@Container
@ServiceConnection
static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18")
  .withDatabaseName("testdb")
  .withUsername("testuser")
  .withPassword("testpass")
  .withInitScript("init-schema.sql");
```

### 等候策略

```java
@Container
static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18")
  .waitingFor(Wait.forLogMessage(".*database system is ready.*", 1));
```

## 測試範例

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");

  @Autowired
  private OrderRepository orderRepository;

  @Autowired
  private TestEntityManager entityManager;

  @Test
  void shouldFindOrdersByStatus() {
    // 給定 (Given)
    entityManager.persist(new Order("PENDING"));
    entityManager.persist(new Order("COMPLETED"));
    entityManager.flush();

    // 當 (When)
    List<Order> pending = orderRepository.findByStatus("PENDING");

    // 那麼 (Then)
    assertThat(pending).hasSize(1);
    assertThat(pending.get(0).getStatus()).isEqualTo("PENDING");
  }

  @Test
  void shouldSupportPostgresSpecificFeatures() {
    // 可使用 Postgres 特定功能，例如：
    // - JSONB 欄位
    // - 陣列類型
    // - 全文搜尋
  }
}
```

## @DynamicPropertySource 替代方案

若未（或無法）使用 @ServiceConnection：

```java
@SpringBootTest
@Testcontainers
class OrderServiceTest {

  @Container
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }
}
```

## 支援的資料庫

容器類別 (2.x) 位於 `org.testcontainers.<module>.<Name>Container`（1.x 位於 `org.testcontainers.containers.<Name>Container<?>`）：

| 資料庫 | 容器類別 | Maven 構件 |
| -------- | --------------- | -------------- |
| PostgreSQL | PostgreSQLContainer | testcontainers-postgresql |
| MySQL | MySQLContainer | testcontainers-mysql |
| MariaDB | MariaDBContainer | testcontainers-mariadb |
| SQL Server | MSSQLServerContainer | testcontainers-mssqlserver |
| Oracle | OracleContainer | testcontainers-oracle-free |
| MongoDB | MongoDBContainer | testcontainers-mongodb |

## 執行 `*IT` 類別

命名為 `*IT` 的整合測試會在 Maven 的 Failsafe 中執行，而非 Surefire；請參閱 [failsafe-integration-tests.md](failsafe-integration-tests.md)，否則測試將不會執行。

## 最佳實踐

1. 盡可能使用 @ServiceConnection (Spring Boot 3.1+)
2. 啟用容器重用以加快本機建置速度
3. 使用特定版本（postgres:18）而非 latest
4. 將容器設定保留在 static 欄位中
5. 將 @DataJpaTest 與 AutoConfigureTestDatabase.Replace.NONE 搭配使用
