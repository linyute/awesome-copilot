# Testcontainers JDBC

使用 Testcontainers 搭配真實資料庫測試 JPA 儲存庫。

## 總覽

Testcontainers 在 Docker 容器中提供真實的資料庫執行個體以進行整合測試。與 H2 相比，這在生產環境一致性方面更可靠。

## PostgreSQL 設定

### 依賴項目

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
```

### 基本測試

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryPostgresTest {
  
  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");
  
  @Autowired
  private OrderRepository orderRepository;
  
  @Autowired
  private TestEntityManager entityManager;
}
```

## MySQL 設定

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers-mysql</artifactId>
  <scope>test</scope>
</dependency>
```

```java
@Container
@ServiceConnection
static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");
```

## 多個資料庫

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class MultiDatabaseTest {
  
  @Container
  @ServiceConnection(name = "primary")
  static PostgreSQLContainer<?> primaryDb = new PostgreSQLContainer<>("postgres:18");
  
  @Container
  @ServiceConnection(name = "analytics")
  static PostgreSQLContainer<?> analyticsDb = new PostgreSQLContainer<>("postgres:18");
}
```

## 容器重複使用 (速度最佳化)

新增至 `~/.testcontainers.properties`：

```properties
testcontainers.reuse.enable=true
```

接著在程式碼中啟用重複使用：

```java
@Container
@ServiceConnection
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18")
  .withReuse(true);
```

## 資料庫初始化

### 使用 SQL 指令碼

```java
@Container
@ServiceConnection
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18")
  .withInitScript("schema.sql");
```

### 使用 Flyway

```java
@SpringBootTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MigrationTest {
  
  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");
  
  @Autowired
  private Flyway flyway;
  
  @Test
  void shouldApplyMigrations() {
    flyway.migrate();
    // 測試程式碼
  }
}
```

## 進階組態

### 自定義資料庫/結構描述 (Schema)

```java
@Container
@ServiceConnection
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18")
  .withDatabaseName("testdb")
  .withUsername("testuser")
  .withPassword("testpass")
  .withInitScript("init-schema.sql");
```

### 等待策略

```java
@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18")
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
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");
  
  @Autowired
  private OrderRepository orderRepository;
  
  @Autowired
  private TestEntityManager entityManager;
  
  @Test
  void shouldFindOrdersByStatus() {
    // 假設 (Given)
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
    // 可以使用 Postgres 特定的功能，例如：
    // - JSONB 欄位
    // - 陣列類型
    // - 全文搜尋
  }
}
```

## @DynamicPropertySource 替代方案

如果未使用 @ServiceConnection：

```java
@SpringBootTest
@Testcontainers
class OrderServiceTest {
  
  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");
  
  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }
}
```

## 支援的資料庫

| 資料庫 | 容器類別 | Maven Artifact |
| -------- | --------------- | -------------- |
| PostgreSQL | PostgreSQLContainer | testcontainers-postgresql |
| MySQL | MySQLContainer | testcontainers-mysql |
| MariaDB | MariaDBContainer | testcontainers-mariadb |
| SQL Server | MSSQLServerContainer | testcontainers-mssqlserver |
| Oracle | OracleContainer | testcontainers-oracle-free |
| MongoDB | MongoDBContainer | testcontainers-mongodb |

## 最佳實務

1. 盡可能使用 @ServiceConnection (Spring Boot 3.1+)
2. 啟用容器重複使用以加快本地端建構速度
3. 使用特定版本 (postgres:18) 而非 latest
4. 將容器組態保留在靜態欄位中
5. 搭配 AutoConfigureTestDatabase.Replace.NONE 使用 @DataJpaTest
