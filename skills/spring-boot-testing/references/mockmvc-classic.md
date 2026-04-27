# MockMvc 經典版 (Classic)

用於 Spring MVC 控制器測試的傳統 MockMvc API (適用於 Spring Boot 3.2 以前版本或舊有程式碼庫)。

## 何時使用此參考

- 專案使用 Spring Boot < 3.2 (無 `MockMvcTester` 可用)
- 現有測試使用 `mvc.perform(...)`，且您正在維護或擴充這些測試
- 您需要將經典的 MockMvc 測試遷移至 `MockMvcTester` (請參閱下方的遷移章節)
- 使用者明確詢問有關 `ResultActions`、`andExpect()` 或 Hamcrest 風格的 Web 斷言

對於 Spring Boot 3.2+ 的新測試，請改用 [mockmvc-tester.md](mockmvc-tester.md)。

## 設定

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

  @Autowired
  private MockMvc mvc;

  @MockBean
  private OrderService orderService;
}
```

## 基本 GET 請求

```java
@Test
void shouldReturnOrder() throws Exception {
  given(orderService.findById(1L)).willReturn(new Order(1L, "PENDING", 99.99));

  mvc.perform(get("/orders/1"))
    .andExpect(status().isOk())
    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    .andExpect(jsonPath("$.id").value(1))
    .andExpect(jsonPath("$.status").value("PENDING"))
    .andExpect(jsonPath("$.totalToPay").value(99.99));
}
```

## 帶有請求本文 (Request Body) 的 POST

```java
@Test
void shouldCreateOrder() throws Exception {
  given(orderService.create(any(OrderRequest.class))).willReturn(1L);

  mvc.perform(post("/orders")
      .contentType(MediaType.APPLICATION_JSON)
      .content("{\"product\": \"Laptop\", \"quantity\": 2}"))
    .andExpect(status().isCreated())
    .andExpect(header().string("Location", "/orders/1"));
}
```

## PUT 請求

```java
@Test
void shouldUpdateOrder() throws Exception {
  mvc.perform(put("/orders/1")
      .contentType(MediaType.APPLICATION_JSON)
      .content("{\"status\": \"COMPLETED\"}"))
    .andExpect(status().isOk());
}
```

## DELETE 請求

```java
@Test
void shouldDeleteOrder() throws Exception {
  mvc.perform(delete("/orders/1"))
    .andExpect(status().isNoContent());
}
```

## 狀態比對器 (Status Matchers)

```java
.andExpect(status().isOk())           // 200
.andExpect(status().isCreated())      // 201
.andExpect(status().isNoContent())    // 204
.andExpect(status().isBadRequest())   // 400
.andExpect(status().isUnauthorized()) // 401
.andExpect(status().isForbidden())    // 403
.andExpect(status().isNotFound())     // 404
.andExpect(status().is(422))          // 任意代碼
```

## JSON Path 斷言

```java
// 精確值
.andExpect(jsonPath("$.status").value("PENDING"))

// 存在性
.andExpect(jsonPath("$.id").exists())
.andExpect(jsonPath("$.deletedAt").doesNotExist())

// 陣列大小
.andExpect(jsonPath("$.items").isArray())
.andExpect(jsonPath("$.items", hasSize(3)))

// 巢狀欄位
.andExpect(jsonPath("$.customer.name").value("John Doe"))
.andExpect(jsonPath("$.customer.address.city").value("Berlin"))

// 使用 Hamcrest 比對器
.andExpect(jsonPath("$.total", greaterThan(0.0)))
.andExpect(jsonPath("$.description", containsString("order")))
```

## 內容斷言

```java
.andExpect(content().contentType(MediaType.APPLICATION_JSON))
.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
.andExpect(content().string(containsString("PENDING")))
.andExpect(content().json("{\"status\":\"PENDING\"}"))
```

## 標頭斷言

```java
.andExpect(header().string("Location", "/orders/1"))
.andExpect(header().string("Content-Type", containsString("application/json")))
.andExpect(header().exists("X-Request-Id"))
.andExpect(header().doesNotExist("X-Deprecated"))
```

## 請求參數與標頭

```java
// 查詢參數 (Query parameters)
mvc.perform(get("/orders").param("status", "PENDING").param("page", "0"))
  .andExpect(status().isOk());

// 路徑變數 (Path variables)
mvc.perform(get("/orders/{id}", 1L))
  .andExpect(status().isOk());

// 請求標頭
mvc.perform(get("/orders/1").header("X-Api-Key", "secret"))
  .andExpect(status().isOk());
```

## 擷取回應

```java
@Test
void shouldReturnCreatedId() throws Exception {
  given(orderService.create(any())).willReturn(42L);

  MvcResult result = mvc.perform(post("/orders")
      .contentType(MediaType.APPLICATION_JSON)
      .content("{\"product\": \"Laptop\", \"quantity\": 1}"))
    .andExpect(status().isCreated())
    .andReturn();

  String location = result.getResponse().getHeader("Location");
  assertThat(location).isEqualTo("/orders/42");
}
```

## 使用 andDo 鏈式呼叫

```java
mvc.perform(get("/orders/1"))
  .andDo(print())              // 將請求/回應列印至主控台 (偵錯用)
  .andExpect(status().isOk());
```

## 靜態匯入

```java
import org.springframework.boot.test.mock.mockito.MockBean;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;
import static org.hamcrest.Matchers.*;
```

## 遷移至 MockMvcTester

| 經典 MockMvc | MockMvcTester (推薦) |
| --- | --- |
| `@Autowired MockMvc mvc` | `@Autowired MockMvcTester mvc` |
| `mvc.perform(get("/orders/1"))` | `mvc.get().uri("/orders/1")` |
| `.andExpect(status().isOk())` | `.hasStatusOk()` |
| `.andExpect(jsonPath("$.status").value("X"))` | `.bodyJson().convertTo(T.class)` + AssertJ |
| 每個方法都要 `throws Exception` | 無受檢例外 (Checked exception) |
| Hamcrest 比對器 | AssertJ 流暢斷言 |

請參閱 [mockmvc-tester.md](mockmvc-tester.md) 以瞭解完整的現代 API。

## 關鍵要點

1. **每個測試方法都必須宣告 `throws Exception`** — `perform()` 會拋出受檢例外
2. **在偵錯期間使用 `andDo(print())`** — 在提交程式碼前請將其移除
3. **優先使用 `jsonPath()` 而非 `content().string()`** — 提供更精確的欄位級斷言
4. **必須使用靜態匯入** — IDE 通常可以自動新增
5. **升級至 Spring Boot 3.2+ 時，請遷移至 MockMvcTester** 以獲得更好的可讀性
