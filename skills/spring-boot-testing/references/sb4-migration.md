# Spring Boot 4.0 遷移

從 Spring Boot 3.x 遷移至 4.0 時的重要測試變更。

## 相依性變更

### 模組化測試 Starter

Spring Boot 4.0 引入了模組化測試 Starter：

**之前 (3.x)：**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
```

**之後 (4.0) - WebMvc 測試：**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webmvc-test</artifactId>
  <scope>test</scope>
</dependency>
```

**之後 (4.0) - REST 用戶端測試：**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-restclient-test</artifactId>
  <scope>test</scope>
</dependency>
```

## 註解遷移

`@MockBean`/`@SpyBean` 已被 `@MockitoBean`/`@MockitoSpyBean` 取代。請參閱 `mockitobean.md` 取得完整遷移指引。

## 全新測試功能

### RestTestClient

取代 TestRestTemplate（已棄用）：

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

- JUnit 4 已棄用（可暫時使用 JUnit Vintage）
- 擴充功能模型保持相容
- 支援平行測試執行改良

## Testcontainers 2.0

模組命名有所變更：

**之前 (1.x)：**

```xml
<artifactId>postgresql</artifactId>
```

**之後 (2.0)：**

```xml
<artifactId>testcontainers-postgresql</artifactId>
```

## 非 Singleton Bean 模擬

Spring Framework 7 允許模擬 prototype 範圍的 Bean：

```java
@Component
@Scope("prototype")
public class OrderProcessor { }

@SpringBootTest
class OrderServiceTest {
  @MockitoBean
  private OrderProcessor orderProcessor; // Now works!
}
```

## SpringExtension 上下文變更

Extension 上下文現在預設為測試方法範圍（test-method scoped）。

若測試在 `@Nested` 類別中失敗：

```java
@SpringExtensionConfig(useTestClassScopedExtensionContext = true)
@SpringBootTest
class OrderTest {
  // Use old behavior
}
```

## 遷移檢核清單

- [ ] 將 @MockBean 替換為 @MockitoBean
- [ ] 將 @SpyBean 替換為 @MockitoSpyBean
- [ ] 將 TestRestTemplate 替換為 RestTestClient
- [ ] 更新模組化 test starter 相依性
- [ ] 升級 Testcontainers 模組座標
- [ ] 檢查並更新自訂的 SpringExtension 邏輯
- [ ] 驗證並修正任何 @Nested 測試類別
- [ ] 執行完整的測試套件以驗證整體相容性

## 回溯相容性

傳統的 starter（例如 `spring-boot-starter-test-webmvc`）會將已棄用的類別保留至 4.1，但建議儘早遷移至新註解與用戶端。
