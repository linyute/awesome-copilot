# Instancio

自動產生複雜的測試物件。當實體/DTO 具有 3 個以上屬性時使用。

## 何時使用

- 具有 **3 個或更多屬性**的物件
- 為 Repository 設定測試資料
- 為控制器測試建立 DTO
- 避免重複呼叫 builder/setter

## 相依性

```xml
<dependency>
  <groupId>org.instancio</groupId>
  <artifactId>instancio-junit</artifactId>
  <version>5.5.1</version>
  <scope>test</scope>
</dependency>
```

## 基本用法

### 簡易物件

```java
final var order = Instancio.create(Order.class);
// All fields populated with random data
```

### 物件清單

```java
final var orders = Instancio.ofList(Order.class).size(5).create();
// 5 orders with random data
```

## 自訂數值

### 設定特定欄位

```java
final var order = Instancio.of(Order.class)
  .set(field(Order::getStatus), "PENDING")
  .set(field(Order::getTotal), new BigDecimal("99.99"))
  .create();
```

### 提供產生的數值

```java
final var order = Instancio.of(Order.class)
  .supply(field(Order::getEmail), () -> "user" + UUID.randomUUID() + "@test.com")
  .create();
```

### 忽略欄位

```java
final var order = Instancio.of(Order.class)
  .ignore(field(Order::getId)) // Let DB generate
  .create();
```

## 複雜物件

### 巢狀物件

```java
final var order = Instancio.of(Order.class)
  .set(field(Order::getCustomer), Instancio.create(Customer.class))
  .set(field(Order::getItems), Instancio.ofList(OrderItem.class).size(3).create())
  .create();
```

### 所有欄位隨機

```java
// When you need fully random but valid data
final var randomOrder = Instancio.create(Order.class);
// Customer, items, addresses - all populated
```

## Spring Boot 整合

### Repository 測試設定

```java
@DataJpaTest
@AutoConfigureTestDatabase
@Testcontainers
class OrderRepositoryTest {

  @Container
  @ServiceConnection
  // Testcontainers 2.x: org.testcontainers.postgresql.PostgreSQLContainer (non-generic); 1.x: PostgreSQLContainer<?> in org.testcontainers.containers
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");

  @Autowired
  private OrderRepository orderRepository;

  @Test
  void shouldFindOrdersByStatus() {
    // Given: Create 10 random orders with PENDING status
    final var orders = Instancio.ofList(Order.class)
      .size(10)
      .set(field(Order::getStatus), "PENDING")
      .create();

    orderRepository.saveAll(orders);

    // When
    final var found = orderRepository.findByStatus("PENDING");

    // Then
    assertThat(found).hasSize(10);
  }
}
```

### 控制器測試設定

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

  @Autowired
  private MockMvcTester mvc;

  @MockitoBean
  private OrderService orderService;

  @Test
  void shouldReturnOrder() {
    // Given: Random order with specific ID
    Order order = Instancio.of(Order.class)
      .set(field(Order::getId), 1L)
      .create();

    given(orderService.findById(1L)).willReturn(order);

    // When/Then
    assertThat(mvc.get().uri("/orders/1"))
      .hasStatus(HttpStatus.OK)
      .bodyJson()
      .convertTo(OrderResponse.class)
      .satisfies(response -> {
        assertThat(response.getId()).isEqualTo(1L);
      });
  }
}
```

## 模式

### Builder 模式替代方案

```java
// Instead of:
Order order = Order.builder()
  .id(1L)
  .status("PENDING")
  .customer(Customer.builder().name("John").build())
  .items(List.of(
    OrderItem.builder().product("A").price(10).build(),
    OrderItem.builder().product("B").price(20).build()
  ))
  .build();

// Use:
Order order = Instancio.of(Order.class)
  .set(field(Order::getId), 1L)
  .set(field(Order::getStatus), "PENDING")
  .create();
// Customer and items auto-generated
```

### 帶種子資料（Seeded Data）

```java
// Consistent "random" data for reproducible tests
Order order = Instancio.of(Order.class)
  .withSeed(12345L)
  .create();
// Same data every test run with seed 12345
```

## 常見模式

### Email 產生

```java
String email = Instancio.gen().net().email();
```

### 日期產生

```java
LocalDateTime createdAt = Instancio.gen().temporal()
  .localDateTime()
  .past()
  .create();
```

### 字串模式

```java
String phone = Instancio.gen().text().pattern("+1-###-###-####");
```

## 比較

| 做法 | 程式碼行數 | 可維護性 |
| -------- | ------------- | --------------- |
| 手動 setter | 10-20 | 低 |
| Builder 模式 | 5-10 | 中 |
| **Instancio** | 2-5 | **高** |

## 最佳做法

1. **用於 3 個以上屬性的物件** - 簡易物件不值得使用
2. **僅設定相關內容** - 讓 Instancio 填入其餘部分
3. **搭配 Testcontainers 使用** - 非常適合資料庫種子植入
4. **明確設定 ID** - 當測試特定情境時
5. **忽略自動產生的欄位** - 例如 createdAt、updatedAt

## 相關連結

- [Instancio 文件](https://www.instancio.org/)
- [JUnit 5 擴充功能](https://www.instancio.org/user-guide/#junit-integration)
