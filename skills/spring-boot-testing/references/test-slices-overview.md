# 測試 Slice 總覽

選擇正確 Spring Boot 測試 slice 的快速參考。

## 決策矩陣

| 註解 | 使用時機 | 載入項目 | 速度 |
| ---------- | -------- | ----- | ----- |
| **無** (純 JUnit) | 測試純業務邏輯 | 無 | 最快 |
| `@WebMvcTest` | 控制器 + HTTP 層 | 控制器、MVC、Jackson | 快 |
| `@DataJpaTest` | 儲存庫查詢 | 儲存庫、JPA、資料來源 | 快 |
| `@RestClientTest` | REST 用戶端程式碼 | RestTemplate/RestClient、Jackson | 快 |
| `@JsonTest` | JSON 序列化 | 僅 ObjectMapper | 最快的 slice |
| `@WebFluxTest` | 反應式控制器 | 控制器、WebFlux | 快 |
| `@DataJdbcTest` | JDBC 儲存庫 | 儲存庫、JDBC | 快 |
| `@DataMongoTest` | MongoDB 儲存庫 | 儲存庫、MongoDB | 快 |
| `@DataRedisTest` | Redis 儲存庫 | 儲存庫、Redis | 快 |
| `@SpringBootTest` | 完整整合 | 整個應用程式 | 慢 |

## 選擇指南

### 不使用註解 (純單元測試)

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

**時機**: 純業務邏輯，沒有依賴項目，或可以透過建構函式注入進行 mocking 的簡單依賴項目。

### 使用 @WebMvcTest

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
  @Autowired private MockMvcTester mvc;
  @MockitoBean private OrderService orderService;
}
```

**時機**: 測試請求映射、驗證、JSON 映射、安全性、篩選器。

**取得內容**: MockMvc、ObjectMapper、Spring Security (如果存在)、異常處理程序。

### 使用 @DataJpaTest

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {
  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");
}
```

**時機**: 測試自定義 JPA 查詢、實體映射、交易行為、串接作業。

**取得內容**: 儲存庫 bean、EntityManager、TestEntityManager、交易支援。

### 使用 @RestClientTest

```java
@RestClientTest(WeatherService.class)
class WeatherServiceTest {
  @Autowired private WeatherService weatherService;
  @Autowired private MockRestServiceServer server;
}
```

**時機**: 測試呼叫外部 API 的 REST 用戶端。

**取得內容**: 用於 stub HTTP 回應的 MockRestServiceServer。

### 使用 @JsonTest

```java
@JsonTest
class OrderJsonTest {
  @Autowired private JacksonTester<Order> json;
}
```

**時機**: 測試自定義序列化/反序列化程式、複雜的 JSON 映射。

### 使用 @SpringBootTest

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class OrderIntegrationTest {
  @Autowired private RestTestClient restClient;
}
```

**時機**: 同時測試完整的請求流程、安全性篩選器、資料庫互動。

**取得內容**: 完整的應用程式 context、嵌入式伺服器 (選填)、真實的 bean。

## 常見錯誤

1. **對所有內容使用 @SpringBootTest** - 不必要地降低測試套件的速度
2. **未使用 mocking 服務的 @WebMvcTest** - 導致 context 載入失敗
3. **搭配 @MockBean 使用 @DataJpaTest** - 違背了目的 (您需要真實的儲存庫)
4. **在一個測試中包含多個 slice** - 每個 slice 應該是獨立的測試類別

## 測試中的 Java 25 功能

### 用於測試資料的 Record

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

### 有序集合 (Sequenced Collections)

```java
@Test
void shouldReturnOrdersInSequence() {
  var orders = orderRepository.findAll();
  
  assertThat(orders.getFirst().getStatus()).isEqualTo("NEW");
  assertThat(orders.getLast().getStatus()).isEqualTo("COMPLETED");
  assertThat(orders.reversed().getFirst().getStatus()).isEqualTo("COMPLETED");
}
```

## 各 Slice 的依賴項目

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
