# @WebMvcTest

使用具針對性的切片測試來測試 Spring MVC 控制器。

## 基本結構

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

  @Autowired
  private MockMvcTester mvc;

  @MockitoBean
  private OrderService orderService;

  @MockitoBean
  private UserService userService;
}
```

## 載入的項目

- 指定的控制器 -
`@ControllerAdvice` 和
`@JsonComponent` -
`Filter` 和
`WebMvcConfigurer` Bean -
訊息轉換器（Jackson、Gson 等） - 不載入：`@Service`、`@Repository`、`@Component`（必須進行模擬）

## 測試 GET 端點

```java
@Test
void shouldReturnOrder() {
  var order = new Order(1L, "PENDING", BigDecimal.valueOf(99.99));
  given(orderService.findById(1L)).willReturn(order);

  assertThat(mvc.get().uri("/orders/1"))
    .hasStatusOk()
    .hasContentType(MediaType.APPLICATION_JSON)
    .bodyJson()
    .extractingPath("$.status")
    .isEqualTo("PENDING");
}
```

## 測試帶有請求主體的 POST

### 使用文字區塊 (Java 25)

```java
@Test
void shouldCreateOrder() {
  given(orderService.create(any(OrderRequest.class))).willReturn(1L);

  var json = """
    {
      "product": "Product A",
      "quantity": 2
    }
    """;

  assertThat(mvc.post().uri("/orders")
    .contentType(MediaType.APPLICATION_JSON)
    .content(json))
    .hasStatus(HttpStatus.CREATED)
    .hasHeader("Location", "/orders/1");
}
```

### 使用 Record

```java
record OrderRequest(String product, int quantity) {}

@Test
void shouldCreateOrderWithRecord() {
  var request = new OrderRequest("Product A", 2);
  given(orderService.create(any())).willReturn(1L);

  assertThat(mvc.post().uri("/orders")
    .contentType(MediaType.APPLICATION_JSON)
    .content(json.write(request).getJson()))
    .hasStatus(HttpStatus.CREATED);
}
```

## 測試驗證錯誤

```java
@Test
void shouldRejectInvalidOrder() {
  var invalidJson = """
    {
      "product": "",
      "quantity": -1
    }
    """;

  assertThat(mvc.post().uri("/orders")
    .contentType(MediaType.APPLICATION_JSON)
    .content(invalidJson))
    .hasStatus(HttpStatus.BAD_REQUEST)
    .bodyJson()
    .hasPath("$.errors");
}
```

## 測試查詢參數

```java
@Test
void shouldFilterOrdersByStatus() {
  assertThat(mvc.get().uri("/orders?status=PENDING"))
    .hasStatusOk();

  verify(orderService).findByStatus(OrderStatus.PENDING);
}
```

## 測試路徑變數

```java
@Test
void shouldCancelOrder() {
  assertThat(mvc.put().uri("/orders/123/cancel"))
    .hasStatusOk();

  verify(orderService).cancel(123L);
}
```

## 搭配安全性測試

```java
@Test
@WithMockUser(roles = "ADMIN")
void adminShouldDeleteOrder() {
  assertThat(mvc.delete().uri("/orders/1"))
    .hasStatus(HttpStatus.NO_CONTENT);
}

@Test
void anonymousUserShouldBeForbidden() {
  assertThat(mvc.delete().uri("/orders/1"))
    .hasStatus(HttpStatus.UNAUTHORIZED);
}
```

## 多個控制器

```java
@WebMvcTest({OrderController.class, ProductController.class})
class WebLayerTest {
  // Tests multiple controllers in one slice
}
```

## 排除自動設定

```java
@WebMvcTest(OrderController.class)
@AutoConfigureMockMvc(addFilters = false) // Skip security filters
class OrderControllerWithoutSecurityTest {
  // Tests without security filters
}
```

## 重點摘要

1. 永遠使用 @MockitoBean 模擬服務
2. 使用 MockMvcTester 以取得型別安全的 AssertJ 斷言
3. @WebMvcTest 預設包含 Spring Security
4. 測試端點對端點的驗證與錯誤處理
5. 保持測試切片專注於 Web 層 concerns
6. 若需完整上下文驗證請改用 @SpringBootTest
