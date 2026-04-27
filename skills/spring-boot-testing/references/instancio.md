# Instancio

自動產生複雜的測試物件。當實體 (Entities) 或 DTO 具有 3 個以上的屬性時使用。

## 何時使用

- 具有 **3 個或更多屬性**的物件
- 設定 Repositories 的測試資料
- 為控制器 (Controller) 測試建立 DTO
- 避免重複的 Builder 或 Setter 呼叫

## 依賴 (Dependency)

```xml
<dependency>
  <groupId>org.instancio</groupId>
  <artifactId>instancio-junit</artifactId>
  <version>5.5.1</version>
  <scope>test</scope>
</dependency>
```

## 基本用法

### 單一物件

```java
final var order = Instancio.create(Order.class);
// 所有欄位都填入隨機資料
```

### 物件清單

```java
final var orders = Instancio.ofList(Order.class).size(5).create();
// 5 個填入隨機資料的訂單
```

## 自定義數值

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
  .ignore(field(Order::getId)) // 讓資料庫自動產生
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
// 當您需要完全隨機但有效的資料時
final var randomOrder = Instancio.create(Order.class);
// 客戶 (Customer)、訂單項目 (Items)、地址 (Addresses) - 全部填入隨機資料
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
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");
  
  @Autowired
  private OrderRepository orderRepository;
  
  @Test
  void shouldFindOrdersByStatus() {
    // Given: 建立 10 個狀態為 PENDING 的隨機訂單
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

### 控制器 (Controller) 測試設定

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
  
  @Autowired
  private MockMvcTester mvc;
  
  @MockitoBean
  private OrderService orderService;
  
  @Test
  void shouldReturnOrder() {
    // Given: 具有特定 ID 的隨機訂單
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

### Builder 模式的替代方案

```java
// 取代以下方式：
Order order = Order.builder()
  .id(1L)
  .status("PENDING")
  .customer(Customer.builder().name("John").build())
  .items(List.of(
    OrderItem.builder().product("A").price(10).build(),
    OrderItem.builder().product("B").price(20).build()
  ))
  .build();

// 使用此方式：
Order order = Instancio.of(Order.class)
  .set(field(Order::getId), 1L)
  .set(field(Order::getStatus), "PENDING")
  .create();
// 客戶和訂單項目將會自動產生
```

### 帶有種子的資料 (Seeded Data)

```java
// 為可重現的測試提供一致的「隨機」資料
Order order = Instancio.of(Order.class)
  .withSeed(12345L)
  .create();
// 使用種子 12345，每次測試執行都會產生相同的資料
```

## 常見模式

### 電子郵件產生

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

| 方法 | 程式碼行數 | 維護性 |
| -------- | ------------- | --------------- |
| 手動 setter | 10-20 | 低 |
| Builder 模式 | 5-10 | 中 |
| **Instancio** | 2-5 | **高** |

## 最佳實務

1. **用於 3 個以上屬性的物件** - 對於簡單物件不值得使用
2. **僅設定相關內容** - 讓 Instancio 填充其餘部分
3. **搭配 Testcontainers 使用** - 非常適合資料庫種子設定
4. **明確設定 ID** - 在測試特定場景時
5. **忽略自動產生的欄位** - 例如 createdAt、updatedAt

## 連結

- [Instancio 文件](https://www.instancio.org/)
- [JUnit 5 擴充功能](https://www.instancio.org/user-guide/#junit-integration)
