# @WebMvcTest

透過聚焦的切片測試 (slice test) 來測試 Spring MVC 控制器。

## 基本結構 (Basic Structure)

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

## 載入的內容 (What Gets Loaded)

- 指定的控制器
- Spring MVC 基礎架構 (HandlerMapping, HandlerAdapter)
- Jackson ObjectMapper (用於 JSON)
- 例外處理常式 (@ControllerAdvice)
- Spring Security 篩選器 (若存在於類別路徑中)
- 驗證 (若存在於類別路徑中)

## 測試 GET 端點 (Testing GET Endpoints)

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

## 測試含有請求本文的 POST (Testing POST with Request Body)

### 使用文字區塊 (Text Blocks) (Java 25)

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

## 測試驗證錯誤 (Testing Validation Errors)

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

## 測試查詢參數 (Testing Query Parameters)

```java
@Test
void shouldFilterOrdersByStatus() {
  assertThat(mvc.get().uri("/orders?status=PENDING"))
    .hasStatusOk();
  
  verify(orderService).findByStatus(OrderStatus.PENDING);
}
```

## 測試路徑變數 (Testing Path Variables)

```java
@Test
void shouldCancelOrder() {
  assertThat(mvc.put().uri("/orders/123/cancel"))
    .hasStatusOk();
  
  verify(orderService).cancel(123L);
}
```

## 配合安全性進行測試 (Testing with Security)

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

## 多個控制器 (Multiple Controllers)

```java
@WebMvcTest({OrderController.class, ProductController.class})
class WebLayerTest {
  // 在一個切片中測試多個控制器
}
```

## 排除自動組態 (Excluding Auto-Configuration)

```java
@WebMvcTest(OrderController.class)
@AutoConfigureMockMvc(addFilters = false) // 跳過安全性篩選器
class OrderControllerWithoutSecurityTest {
  // 不含安全性篩選器的測試
}
```

## 重點 (Key Points)

1. 務必使用 @MockitoBean 模擬服務
2. 使用 MockMvcTester 進行 AssertJ 風格的判斷
3. 測試 HTTP 語義 (狀態、標頭、內容類型)
4. 當副作用很重要時，驗證服務函式的呼叫
5. 不要在此處測試商業邏輯 — 那是單元測試的工作
6. 利用 Java 25 文字區塊處理 JSON 酬載 (payload)
