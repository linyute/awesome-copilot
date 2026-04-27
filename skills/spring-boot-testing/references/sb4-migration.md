# Spring Boot 4.0 遷移

從 Spring Boot 3.x 遷移到 4.0 時的主要測試變更。

## 依賴項目變更

### 模組化測試 Starter

Spring Boot 4.0 引入了模組化測試 starter：

**之前 (3.x):**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
```

**之後 (4.0) - WebMvc 測試:**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webmvc-test</artifactId>
  <scope>test</scope>
</dependency>
```

**之後 (4.0) - REST 用戶端測試:**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-restclient-test</artifactId>
  <scope>test</scope>
</dependency>
```

## 註解遷移

### @MockBean → @MockitoBean

**已棄用 (3.x):**

```java
@MockBean
private OrderService orderService;
```

**新增 (4.0):**

```java
@MockitoBean
private OrderService orderService;
```

### @SpyBean → @MockitoSpyBean

**已棄用 (3.x):**

```java
@SpyBean
private PaymentGatewayClient paymentClient;
```

**新增 (4.0):**

```java
@MockitoSpyBean
private PaymentGatewayClient paymentClient;
```

## 新增測試功能

### RestTestClient

取代 TestRestTemplate (已棄用)：

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class OrderIntegrationTest {
  
  @Autowired
  private RestTestClient restClient;
  
  @Test
  void shouldCreateOrder() {
    restClient
      .post()
      .uri("/orders")
      .body(new OrderRequest("Product", 2))
      .exchange()
      .expectStatus()
      .isCreated()
      .expectHeader()
      .location("/orders/1");
  }
}
```

## JUnit 6 支援

Spring Boot 4.0 預設使用 JUnit 6：

- JUnit 4 已棄用 (暫時使用 JUnit Vintage)
- 所有 JUnit 5 功能仍可運作
- 移除 JUnit 4 依賴項目以進行乾淨的遷移

## Testcontainers 2.0

模組命名已變更：

**之前 (1.x):**

```xml
<artifactId>postgresql</artifactId>
```

**之後 (2.0):**

```xml
<artifactId>testcontainers-postgresql</artifactId>
```

## 非 Singleton Bean Mocking

Spring Framework 7 允許對 prototype-scoped bean 進行 mocking：

```java
@Component
@Scope("prototype")
public class OrderProcessor { }

@SpringBootTest
class OrderServiceTest {
  @MockitoBean
  private OrderProcessor orderProcessor; // 現在可以運作了！
}
```

## SpringExtension Context 變更

Extension context 現在預設為 test-method 範圍。

如果測試在 @Nested 類別中失敗：

```java
@SpringExtensionConfig(useTestClassScopedExtensionContext = true)
@SpringBootTest
class OrderTest {
  // 使用舊行為
}
```

## 遷移檢查清單

- [ ] 將 @MockBean 替換為 @MockitoBean
- [ ] 將 @SpyBean 替換為 @MockitoSpyBean
- [ ] 將 Testcontainers 依賴項目更新為 2.0 命名
- [ ] 根據需要新增模組化測試 starter
- [ ] 將 TestRestTemplate 遷移至 RestTestClient
- [ ] 移除 JUnit 4 依賴項目
- [ ] 更新自定義 TestExecutionListener 實作
- [ ] 測試 @Nested 類別行為

## 回溯相容性

使用 "classic" starter 進行逐步遷移：

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test-classic</artifactId>
  <scope>test</scope>
</dependency>
```

這會在您逐步遷移時提供舊行為。
