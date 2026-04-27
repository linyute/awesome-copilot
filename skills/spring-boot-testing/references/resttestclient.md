# RestTestClient

使用 Spring Boot 4+ 的現代化 REST 用戶端測試（取代 TestRestTemplate）。

## 總覽

RestTestClient 是 Spring Boot 4.0+ 中 TestRestTemplate 的現代化替代方案。它為測試 REST 端點提供了流暢、反應式的 API。

## 設定

### 依賴項目 (Spring Boot 4+)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-restclient-test</artifactId>
  <scope>test</scope>
</dependency>
```

### 基本組態

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
  .isEqualTo(200);  // 特定代碼
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

## 請求組態

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

RestTestClient 也可以搭配 MockMvc 運作（無需啟動伺服器）：

```java
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureRestTestClient
class OrderMockMvcTest {
  
  @Autowired
  private RestTestClient restClient;
  
  @Test
  void shouldWorkWithMockMvc() {
    // 底層使用 MockMvc - 無需啟動伺服器
    restClient
      .get()
      .uri("/orders/1")
      .exchange()
      .expectStatus()
      .isOk();
  }
}
```

## 比較：RestTestClient vs TestRestTemplate

| 功能 | RestTestClient | TestRestTemplate |
| ------- | -------------- | ---------------- |
| 風格 | 流暢/反應式 | 命令式 |
| Spring Boot | 4.0+ | 所有版本 (在 4 中已棄用) |
| 斷言 | 內建 | 手動 |
| MockMvc 支援 | 是 | 否 |
| 非同步 | 原生 | 需要額外處理 |

## 從 TestRestTemplate 遷移

### 之前 (已棄用)

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

## 最佳實務

1. 搭配 @SpringBootTest(WebEnvironment.RANDOM_PORT) 使用以進行真實的 HTTP 測試
2. 搭配 @AutoConfigureMockMvc 使用以在不啟動伺服器的情況下進行更快速的測試
3. 利用流暢斷言來提高可讀性
4. 測試成功與錯誤的情境
5. 驗證安全性/API 版本控制的標頭
