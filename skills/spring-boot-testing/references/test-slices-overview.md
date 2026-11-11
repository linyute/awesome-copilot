# 測試切片概觀

快速挑選合適 Spring Boot 測試切片的參考指南。

## 決策矩陣

| 註解 | 使用時機 | 載入內容 | 速度 |
| ---------- | -------- | ----- | ----- |
| **無** (純 JUnit) | 測試純商務邏輯 | 無 | 最快 |
| `@WebMvcTest` | 控制器 + HTTP 層 | 控制器、MVC、Jackson | 快 |
| `@DataJpaTest` | Repository 查詢 | Repository、JPA、DataSource | 快 |
| `@RestClientTest` | REST 用戶端程式碼 | RestTemplate/RestClient、Jackson | 快 |
| `@JsonTest` | JSON 序列化 | 僅 ObjectMapper | 最快切片 |
| `@WebFluxTest` | 反應式控制器 | 控制器、WebFlux | 快 |
| `@DataJdbcTest` | JDBC Repository | Repository、JDBC | 快 |
| `@DataMongoTest` | MongoDB Repository | Repository、MongoDB | 快 |
| `@DataRedisTest` | Redis Repository | Repository、Redis | 快 |
| `@SpringBootTest` | 完整整合 | 整個應用程式 | 慢 |

## 挑選指引

### 不使用註解（純單元測試）

```java
class PriceCalculatorTest {
  private PriceCalculator calculator = new PriceCalculator();

  @Test
  void shouldApplyDiscount() {
    var result = calculator.applyDiscount(100, 0.1);
    assertThat(result).isEqualTo(new BigDecimal("90.00"));
  }
}
```

**適用時機**：純商務邏輯、無相依性或可透過建構子注入進行模擬的簡單相依性。

### 使用 @WebMvcTest

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
  @Autowired private MockMvcTester mvc;
  @MockitoBean private OrderService orderService;
}
```

**適用時機**：測試請求映射、驗證、JSON 映射、安全性、過濾器。

**獲取內容**：MockMvc、ObjectMapper、Spring Security（若存在）。

### 使用 @DataJpaTest

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {
  @Container
  // Testcontainers 2.x: org.testcontainers.postgresql.PostgreSQLContainer (non-generic); 1.x: PostgreSQLContainer<?> in org.testcontainers.containers
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");
}
```

**適用時機**：測試自訂 JPA 查詢、實體映射、交易行為、級聯操作。

**獲取內容**：Repository Bean、EntityManager、TestEntityManager、內嵌資料庫。

### 使用 @RestClientTest

```java
@RestClientTest(WeatherService.class)
class WeatherServiceTest {
  @Autowired private WeatherService weatherService;
  @Autowired private MockRestServiceServer server;
}
```

**適用時機**：測試呼叫外部 API 的 REST 用戶端。

**獲取內容**：用以模擬 HTTP 回應的 MockRestServiceServer、RestClient/RestTemplate 建造者。

### 使用 @JsonTest

```java
@JsonTest
class OrderJsonTest {
  @Autowired private JacksonTester<Order> json;
}
```

**適用時機**：測試自訂序列化器/反序列化器、複雜的 JSON 映射。

### 使用 @SpringBootTest

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class OrderIntegrationTest {
  @Autowired private RestTestClient restClient;
}
```

**適用時機**：整合測試完整請求流程、安全過濾器、資料庫互動。

**獲取內容**：完整應用程式上下文、內嵌伺服器（若指定）、所有 Bean。

## 常見錯誤

1. **對所有測試皆使用 @SpringBootTest** - 不必要地拖慢測試套件執行速度
2. **在 @WebMvcTest 中未模擬服務** - 導致上下文載入失敗
3. **在 @DataJpaTest 中使用 @MockBean** - 失去切片測試的意義（應測試真實 Repository）
4. **在單一測試中混用多個切片** - 每個切片應為獨立的測試類別

## 測試中的 Java 25 功能

### 使用 Record 作為測試資料

```java
record OrderRequest(String product, int quantity) {}
record OrderResponse(Long id, String status, BigDecimal total) {}
```

### 測試中的模式比對

```java
@Test
void shouldHandleDifferentOrderTypes() {
  var order = orderService.create(new OrderRequest("Product", 2));

  switch (order) {
    case PhysicalOrder po -> assertThat(po.getShippingAddress()).isNotNull();
    case DigitalOrder do_ -> assertThat(do_.getDownloadLink()).isNotNull();
    default -> throw new IllegalStateException("Unknown order type");
  }
}
```

### 用於 JSON 的文字區塊

```java
@Test
void shouldParseComplexJson() {
  var json = """
    {
      "id": 1,
      "status": "PENDING",
      "items": [
        {"product": "Laptop", "price": 999.99},
        {"product": "Mouse", "price": 29.99}
      ]
    }
    """;

  assertThat(mvc.post().uri("/orders")
    .contentType(APPLICATION_JSON)
    .content(json))
    .hasStatus(CREATED);
}
```

### 序列集合 (Sequenced Collections)

```java
@Test
void shouldReturnOrdersInSequence() {
  var orders = orderRepository.findAll();

  assertThat(orders.getFirst().getStatus()).isEqualTo("NEW");
  assertThat(orders.getLast().getStatus()).isEqualTo("COMPLETED");
  assertThat(orders.reversed().getFirst().getStatus()).isEqualTo("COMPLETED");
}
```

## 依切片分類的相依性

```xml
<!-- WebMvcTest -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webmvc-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- DataJpaTest -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- RestClientTest -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-restclient-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- Testcontainers -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
```
