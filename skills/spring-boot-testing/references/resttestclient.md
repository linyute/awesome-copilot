# RestTestClient

Spring Boot 4+ 的新一代 REST 用戶端測試（取代 TestRestTemplate）。

## 概觀

RestTestClient 是 TestRestTemplate 的新一代替代方案，提供基於 RestClient 架構的流暢 API。

## 設定

### 相依性 (Spring Boot 4+)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-restclient-test</artifactId>
  <scope>test</scope>
</dependency>
```

### 基本設定

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class OrderIntegrationTest {

  @Autowired
  private RestTestClient restClient;
}
```

## HTTP 方法

### GET 請求

```java
@Test
void shouldGetOrder() {
  restClient
    .get()
    .uri("/orders/1")
    .exchange()
    .expectStatus()
    .isOk()
    .expectBody(Order.class)
    .value(order -> {
      assertThat(order.getId()).isEqualTo(1L);
      assertThat(order.getStatus()).isEqualTo("PENDING");
    });
}
```

### POST 請求

```java
@Test
void shouldCreateOrder() {
  OrderRequest request = new OrderRequest("Laptop", 2);

  restClient
    .post()
    .uri("/orders")
    .contentType(MediaType.APPLICATION_JSON)
    .body(request)
    .exchange()
    .expectStatus()
    .isCreated()
    .expectHeader()
    .location("/orders/1")
    .expectBody(Long.class)
    .isEqualTo(1L);
}
```

### PUT 請求

```java
@Test
void shouldUpdateOrder() {
  restClient
    .put()
    .uri("/orders/1")
    .body(new OrderUpdate("COMPLETED"))
    .exchange()
    .expectStatus()
    .isOk();
}
```

### DELETE 請求

```java
@Test
void shouldDeleteOrder() {
  restClient
    .delete()
    .uri("/orders/1")
    .exchange()
    .expectStatus()
    .isNoContent();
}
```

## 回應斷言

### 狀態碼

```java
restClient
  .get()
  .uri("/orders/1")
  .exchange()
  .expectStatus()
  .isOk()           // 200
  .isCreated()      // 201
  .isNoContent()    // 204
  .isBadRequest()   // 400
  .isNotFound()     // 404
  .is5xxServerError() // 5xx
  .isEqualTo(200);  // Specific code
```

### 標頭

```java
restClient
  .post()
  .uri("/orders")
  .exchange()
  .expectHeader()
  .location("/orders/1")
  .contentType(MediaType.APPLICATION_JSON)
  .exists("X-Request-Id")
  .valueEquals("X-Api-Version", "v1");
```

### 主體斷言

```java
restClient
  .get()
  .uri("/orders/1")
  .exchange()
  .expectBody(Order.class)
  .value(order -> assertThat(order.getId()).isEqualTo(1L))
  .returnResult();
```

### JSON 路徑

```java
restClient
  .get()
  .uri("/orders")
  .exchange()
  .expectBody()
  .jsonPath("$.content[0].id").isEqualTo(1)
  .jsonPath("$.content[0].status").isEqualTo("PENDING")
  .jsonPath("$.totalElements").isNumber();
```

## 請求設定

### 標頭

```java
restClient
  .get()
  .uri("/orders/1")
  .header("Authorization", "Bearer token")
  .header("X-Api-Key", "secret")
  .exchange();
```

### 查詢參數

```java
restClient
  .get()
  .uri(uriBuilder -> uriBuilder
    .path("/orders")
    .queryParam("status", "PENDING")
    .queryParam("page", 0)
    .queryParam("size", 10)
    .build())
  .exchange();
```

### 路徑變數

```java
restClient
  .get()
  .uri("/orders/{id}", 1L)
  .exchange();
```

## 搭配 MockMvc

RestTestClient 亦可與 MockMvc 協同運作（無需啟動伺服器）：

```java
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureRestTestClient
class OrderMockMvcTest {

  @Autowired
  private RestTestClient restClient;

  @Test
  void shouldWorkWithMockMvc() {
    // Uses MockMvc under the hood - no server startup
    restClient
      .get()
      .uri("/orders/1")
      .exchange()
      .expectStatus()
      .isOk();
  }
}
```

## 比較：RestTestClient 與 TestRestTemplate

| 功能 | RestTestClient | TestRestTemplate |
| --- | --- | --- |
| API 風格 | 流暢斷言 API | 基於 RestTemplate |
| Spring Boot 版本 | 4.0+（偏好） | 3.x（已棄用） |
| MockMvc 支援 | 是 | 否 |
| 斷言類型 | 內建斷言庫 | 外部（AssertJ） |
| 響應式支援 | 否（請使用 WebTestClient） | 否 |

## 從 TestRestTemplate 遷移

### 之前（已棄用）

```java
@Autowired
private TestRestTemplate restTemplate;

@Test
void shouldGetOrder() {
  ResponseEntity<Order> response = restTemplate
    .getForEntity("/orders/1", Order.class);

  assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
  assertThat(response.getBody().getId()).isEqualTo(1L);
}
```

### 之後 (RestTestClient)

```java
@Autowired
private RestTestClient restClient;

@Test
void shouldGetOrder() {
  restClient
    .get()
    .uri("/orders/1")
    .exchange()
    .expectStatus()
    .isOk()
    .expectBody(Order.class)
    .value(order -> assertThat(order.getId()).isEqualTo(1L));
}
```

## 最佳實踐

1. 將 `@SpringBootTest(WebEnvironment.RANDOM_PORT)` 用於完整的端對端測試
2. 針對 Web 層測試偏好 `bindTo(mockMvc)` 以節省伺服器啟動開銷
3. 優先使用具型別的物件轉換，而非脆弱的 JSON 路徑斷言
4. 針對已知的成功狀態碼使用內建的 `isOk()`、`isCreated()` 等便捷方法
5. 針對非同步或反應式端點測試，請改用 `WebTestClient`
