# @DataJpaTest

使用隔離的資料層切片 (Slice) 測試 JPA Repositories。

## 基本結構

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
}
```

## 哪些內容會被載入

- Repository Beans
- EntityManager / TestEntityManager
- DataSource
- 交易管理員 (Transaction manager)
- 不包含 Web 層、服務 (Services) 或控制器 (Controllers)

## 測試自定義查詢

```java
@Test
void shouldFindOrdersByStatus() {
  // Given - 使用 var 讓程式碼更簡潔
  var pending = new Order("PENDING");
  var completed = new Order("COMPLETED");
  entityManager.persist(pending);
  entityManager.persist(completed);
  entityManager.flush();
  
  // When
  var pendingOrders = orderRepository.findByStatus("PENDING");
  
  // Then - 使用序列集合 (Sequenced Collection) 方法
  assertThat(pendingOrders).hasSize(1);
  assertThat(pendingOrders.getFirst().getStatus()).isEqualTo("PENDING");
}
```

## 測試原生查詢 (Native Queries)

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

## 測試分頁 (Pagination)

```java
@Test
void shouldReturnPagedResults() {
  // 使用 IntStream 插入 20 筆訂單
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

## 測試延遲載入 (Lazy Loading)

```java
@Test
void shouldLazyLoadOrderItems() {
  var order = new Order("PENDING");
  order.addItem(new OrderItem("Product", 2));
  entityManager.persist(order);
  entityManager.flush();
  entityManager.clear(); // 從持久化 Context 中分離
  
  var found = orderRepository.findById(order.getId());
  
  assertThat(found).isPresent();
  // 這將觸發延遲載入
  assertThat(found.get().getItems()).hasSize(1);
  assertThat(found.get().getItems().getFirst().getProduct()).isEqualTo("Product");
}
```

## 測試級聯 (Cascading)

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

## 使用 H2 vs 真實資料庫

### H2 (預設 - 不建議用於與生產環境一致性的測試)

```java
@DataJpaTest // 預設使用內嵌式 H2
class OrderRepositoryH2Test {
  // 速度快，但可能會錯過特定資料庫的問題
}
```

### Testcontainers (推薦)

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryPostgresTest {
  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");
}
```

## 交易行為

測試預設為 @Transactional，且在每個測試後都會回滾 (Roll back)。

```java
@Test
@Rollback(false) // 不回滾 (鮮少需要)
void shouldPersistData() {
  orderRepository.save(new Order("PENDING"));
  // 測試後資料將保留在資料庫中
}
```

## 關鍵要點

1. 使用 TestEntityManager 設定測試資料
2. 在 persist() 後務必使用 flush() 以觸發 SQL
3. 使用 clear() 清理 Entity Manager 以測試延遲載入
4. 使用真實資料庫 (Testcontainers) 以獲得準確的結果
5. 同時測試成功與失敗案例
6. 利用 Java 25 的 var 關鍵字使變數宣告更簡潔
7. 使用序列集合方法 (getFirst()、getLast()、reversed())
