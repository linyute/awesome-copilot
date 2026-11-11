# @DataJpaTest

使用隔離的資料層切片測試 JPA Repository。

## 基本結構

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {

  @Container
  @ServiceConnection
  // Testcontainers 2.x: org.testcontainers.postgresql.PostgreSQLContainer (non-generic); 1.x: PostgreSQLContainer<?> in org.testcontainers.containers
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");

  @Autowired
  private OrderRepository orderRepository;

  @Autowired
  private TestEntityManager entityManager;
}
```

## 載入的元件

- Repository Bean
- EntityManager / TestEntityManager
- DataSource
- 交易管理員
- 無 Web 層、無服務、無控制器

## 測試自訂查詢

```java
@Test
void shouldFindOrdersByStatus() {
  // Given - Using var for cleaner code
  var pending = new Order("PENDING");
  var completed = new Order("COMPLETED");
  entityManager.persist(pending);
  entityManager.persist(completed);
  entityManager.flush();

  // When
  var pendingOrders = orderRepository.findByStatus("PENDING");

  // Then - Using sequenced collection methods
  assertThat(pendingOrders).hasSize(1);
  assertThat(pendingOrders.getFirst().getStatus()).isEqualTo("PENDING");
}
```

## 測試原生查詢

```java
@Test
void shouldExecuteNativeQuery() {
  entityManager.persist(new Order("PENDING", BigDecimal.valueOf(100)));
  entityManager.persist(new Order("PENDING", BigDecimal.valueOf(200)));
  entityManager.flush();

  var total = orderRepository.calculatePendingTotal();

  assertThat(total).isEqualTo(new BigDecimal("300.00"));
}
```

## 測試分頁

```java
@Test
void shouldReturnPagedResults() {
  // Insert 20 orders using IntStream
  IntStream.range(0, 20).forEach(i -> {
    entityManager.persist(new Order("PENDING"));
  });
  entityManager.flush();

  var page = orderRepository.findByStatus("PENDING", PageRequest.of(0, 10));

  assertThat(page.getContent()).hasSize(10);
  assertThat(page.getTotalElements()).isEqualTo(20);
  assertThat(page.getContent().getFirst().getStatus()).isEqualTo("PENDING");
}
```

## 測試延遲載入

```java
@Test
void shouldLazyLoadOrderItems() {
  var order = new Order("PENDING");
  order.addItem(new OrderItem("Product", 2));
  entityManager.persist(order);
  entityManager.flush();
  entityManager.clear(); // Detach from persistence context

  var found = orderRepository.findById(order.getId());

  assertThat(found).isPresent();
  // This will trigger lazy loading
  assertThat(found.get().getItems()).hasSize(1);
  assertThat(found.get().getItems().getFirst().getProduct()).isEqualTo("Product");
}
```

## 測試串聯（Cascading）

```java
@Test
void shouldCascadeDelete() {
  var order = new Order("PENDING");
  order.addItem(new OrderItem("Product", 2));
  entityManager.persist(order);
  entityManager.flush();

  orderRepository.delete(order);
  entityManager.flush();

  assertThat(entityManager.find(OrderItem.class, order.getItems().getFirst().getId()))
    .isNull();
}
```

## 測試 @Query 方法

```java
@Query("SELECT o FROM Order o WHERE o.createdAt > :date AND o.status = :status")
List<Order> findRecentByStatus(@Param("date") LocalDateTime date, 
                               @Param("status") String status);

@Test
void shouldFindRecentOrders() {
  var old = new Order("PENDING");
  old.setCreatedAt(LocalDateTime.now().minusDays(10));
  var recent = new Order("PENDING");
  recent.setCreatedAt(LocalDateTime.now().minusHours(1));

  entityManager.persist(old);
  entityManager.persist(recent);
  entityManager.flush();

  var recentOrders = orderRepository.findRecentByStatus(
    LocalDateTime.now().minusDays(1), "PENDING");

  assertThat(recentOrders).hasSize(1);
  assertThat(recentOrders.getFirst().getId()).isEqualTo(recent.getId());
}
```

## 使用 H2 對比真實資料庫

### H2（預設 - 不建議用於正式環境一致性）

```java
@DataJpaTest // Uses embedded H2 by default
class OrderRepositoryH2Test {
  // Fast but may miss DB-specific issues
}
```

### Testcontainers（建議）

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryPostgresTest {
  @Container
  @ServiceConnection
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");
}
```

## 交易行為

測試預設為 @Transactional 並在每個測試後回復。

```java
@Test
@Rollback(false) // Don't roll back (rarely needed)
void shouldPersistData() {
  orderRepository.save(new Order("PENDING"));
  // Data will remain in database after test
}
```

## 重點摘要

1. 使用 TestEntityManager 建立設定資料
2. 在 persist() 後始終呼叫 flush() 以觸發 SQL
3. 清理（clear）實體管理員以測試延遲載入
4. 使用真實資料庫（Testcontainers）以獲得準確結果
5. 測試成功與失敗案例
6. 善用 Java 25 var 關鍵字以獲得更簡潔的變數宣告
7. 使用有序集合方法（getFirst()、getLast()、reversed()）
