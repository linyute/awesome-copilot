# REST API (Spring MVC)

已在 Boot 4.1.1（Framework 7）上驗證，並在標註處對 Boot 3.5.16（Framework 6.2）進行驗證。端點安全性：`spring-security`。測試切片（`@WebMvcTest`、`MockMvcTester`、`@RestClientTest`）：`spring-boot-testing`。

## Starter 與套件（Boot 3 對比 4）

| | Boot 3 | Boot 4 |
| --- | --- | --- |
| Web starter | `spring-boot-starter-web` | `spring-boot-starter-webmvc`（加上 `spring-boot-starter-webmvc-test`） |
| `RestClient` 自動設定 | 僅限 Boot 3.2+，位於 web starter 中；3.0/3.1 不可用 | 新增 `spring-boot-starter-restclient` |
| `@WebMvcTest` | `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest` | `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`（亦包含 `AutoConfigureMockMvc`） |
| Mock 一個 bean | `@MockitoBean`（3.4+；`@MockBean` 在 4 中移除） | `@MockitoBean`（`org.springframework.test.context.bean.override.mockito`） |
| JSON | Jackson 2 `ObjectMapper` | Jackson 3 `tools.jackson.databind.json.JsonMapper` bean |

Jackson 2 databind 仍可能透過傳遞依賴存在於類別路徑中（例如透過 Spring for Apache Kafka），但這不是在 Boot 4 中針對它編寫程式碼的理由。存在暫時性的 Jackson 2 橋接器（`spring-boot-jackson2`，請參閱 Boot 4 遷移指引與 `spring-boot-4-migration`）。

## 控制器與驗證

```java
public record CreateOrderRequest(@NotBlank String customer, @Positive BigDecimal total) {}

@RestController
@RequestMapping("/api/orders")
class OrderController {
	private final OrderService orders;
	OrderController(OrderService orders) { this.orders = orders; }

	@PostMapping
	ResponseEntity<OrderSummary> create(@Valid @RequestBody CreateOrderRequest req) {
		var created = orders.create(req);
		return ResponseEntity.created(URI.create("/api/orders/" + created.id())).body(created);
	}
}
```

- 資源使用複數名詞，動作使用 HTTP 動詞；建立成功回傳 `201` + `Location`，刪除回傳 `204`，找不到資源透過例外狀況回傳 `404` 而非回傳 `null`。
- 請求/回應型別使用 record，與實體分開。Bean Validation（`jakarta.validation.constraints.*`）放在 record 元件上。在 Framework 6.1+（Boot 3.2+）中，直接在 `@RequestParam`/`@PathVariable` 參數上加上限制條件，並省略類別層級的 `@Validated`：內建的 MVC 方法驗證會引發 `HandlerMethodValidationException`。類別層級的 `@Validated` 則會啟用 AOP 驗證，預設會引發 `ConstraintViolationException` 且需要其自有的錯誤處理常式。在較舊的 Framework 版本上，請使用該 AOP 方法並明確將例外狀況映射至 HTTP 400。
- 切勿接受無限制的輸入：對分頁的 `size` 設定上限，在伺服器/反向代理層限制請求本體大小。
- 僅在公開 Spring Data 的 page JSON 可接受時才回傳 `Page<T>`；對於穩定的公開協定，建議回傳自訂的 `record PageResponse<T>(List<T> content, long total, int page, int size)`。分頁參數與穩定排序請參閱 `data.md`。

## 錯誤處理：ProblemDetail (RFC 9457)

```java
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler(OrderNotFoundException.class)
	ProblemDetail notFound(OrderNotFoundException ex) {
		var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
		pd.setTitle("Order not found");
		return pd;
	}
}
```

- 繼承 `ResponseEntityExceptionHandler` 會將 Spring MVC 自身的例外狀況（驗證的 `MethodArgumentNotValidException` 以及在 Framework 6.1+ 中的 `HandlerMethodValidationException`、格式錯誤的 JSON、不支援的媒體類型、無效的 API 版本）轉換為 `application/problem+json`（已驗證：驗證錯誤會產生狀態碼 400 的 problem detail；未知的 API 版本錯誤會回傳 400）。測試時應涵蓋無效的查詢/路徑參數以及無效的請求本體；類別層級的 `@Validated` 絕不能將其轉移為未處理的 AOP 例外狀況。
- 已驗證相同的 advice 在 Boot 3.5.16 上可直接運作。請勿在 `detail` 中回傳包含內部細節（SQL、類別名稱）的例外狀況訊息；請記錄它們，回傳穩定的訊息，並為用戶端新增自訂屬性（`pd.setProperty("code", "ORDER_NOT_FOUND")`）。
- 使用 `jsonPath("$.status")`、`jsonPath("$.title")` 與 `content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)` 進行測試。

## API 版本控制（僅限 Boot 4 / Framework 7）

Framework 7 具備一流的 API 版本控制支援；這在 Framework 6 中不存在（已驗證：`@GetMapping(version = ...)` 在 Boot 3.5.16 上無法編譯，在該版本請使用如 `/api/v1/...` 的 URL 前綴）。

```properties
spring.mvc.apiversion.use.header=X-API-Version
spring.mvc.apiversion.default=1
spring.mvc.apiversion.supported=1,2
```

```java
@GetMapping(value = "/{id}", version = "1")  OrderSummary getV1(@PathVariable Long id) { ... }
@GetMapping(value = "/{id}", version = "2")  OrderSummary getV2(@PathVariable Long id) { ... }
```

標頭的替代方案包括 `...use.path-segment`、`...use.query-parameter` 與 `...use.media-type-parameter`。已驗證：缺少標頭的請求會使用預設版本，而不受支援的版本（`3`）會回傳 `400` problem detail（「Invalid API version」）。僅在重大變更不可避免時進行版本控制；增量變更不需要新版本。

## 呼叫其他服務

### RestClient (Boot 3.2+/4)

`RestClient` 與 `RestClientAdapter` 需要 Framework 6.1+；Boot 的 builder 自動設定從 3.2 開始提供。在 Boot 3.0/3.1 上，請保留專案現有的 `RestTemplate`，而非產生此範例或隱式升級依賴項。

在 Boot 4 上新增 `spring-boot-starter-restclient`（它已在驗證的建構中提供並注入了 builder；Boot 3.2+：`RestClient.Builder` 隨附於 web starter）。注入 **builder**（`RestClient.Builder`），切勿在沒有 builder 的情況下直接建立用戶端，以確保可觀測性與自訂器能夠套用（`spring-observability`）。透過屬性/自訂器設定基礎 URL 與逾時時間，而非每次呼叫個別指定。優先使用 `RestClient` 而非 `RestTemplate`（處於維護模式），非反應式情境下亦優先於 `WebClient`。

```java
@Bean
RestClients ratesClient(RestClient.Builder builder) {
	return builder.baseUrl("https://rates.example.com").build();
}
// 使用方式：ratesClient.get().uri("/rates/{c}", "EUR").retrieve().body(Rate.class);
```

`retrieve()` 在遇到 4xx/5xx 時會擲出 `RestClientResponseException`；請在邊界處將其映射至您自訂的例外狀況。

### HTTP 介面 (`@HttpExchange`)

```java
@HttpExchange("/rates")
public interface RatesClient {
	record Rate(String currency, double value) {}

	@GetExchange("/{currency}")
	Rate get(@PathVariable String currency);
}
```

- **Boot 4 / Framework 7：** 使用 `@ImportHttpServices` 註冊並在屬性中設定 URL（已驗證）：
  ```java
  @Configuration(proxyBeanMethods = false)
  @ImportHttpServices(group = "rates", types = RatesClient.class)
  class HttpClientsConfig {}
  ```
  ```properties
  spring.http.serviceclient.rates.base-url=https://rates.example.com
  ```
  接著如同任何 bean 一樣注入 `RatesClient`。
- **Boot 3.2+ / Framework 6.1+：** `@ImportHttpServices` 不存在（已驗證）。請手動建立代理物件：
  ```java
  var client = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build().createClient(RatesClient.class);
  ```
  （`org.springframework.web.client.support.RestClientAdapter`，在 Boot 4 上相同。）
- **Boot 3.0/3.1 / Framework 6.0：** 若 WebClient 已可用，HTTP 介面可搭配 Framework 6.0 的 `HttpServiceProxyFactory` API 使用 `WebClientAdapter`。否則請保留現有的 `RestTemplate` 設定；切勿引入 `RestClientAdapter` 或隱式新增 WebFlux。
- **測試 (Boot 3.2+/4)：** `MockRestServiceServer.bindTo(RestClient.Builder)` 無需網路連線即可記錄並回應請求（針對手動與 Boot 4 設定均已驗證通過）；僅在搭配真實 HTTP 進行協定測試時使用 WireMock。

## OpenAPI (springdoc)

springdoc 並非由 Spring Boot 直接管理：請從 springdoc 相容性表格中挑選符合 Boot 主要版本的系列並予以鎖定。已驗證：在 Boot 4.1.1 上的 `org.springdoc:springdoc-openapi-starter-webmvc-ui` 3.1.1 成功提供 `/v3/api-docs`，包含控制器路徑（springdoc 2.x 鎖定 Boot 3）。僅在非生產環境 profile 中或在身分驗證保護下公開 Swagger UI（`/swagger-ui.html`）；並在 `spring-security` 中允許相關路徑。謹慎使用 `@Operation`/`@ApiResponse` 撰寫文件；控制器簽章與驗證標註通常足以提供結構描述所需資訊。

## 搭配 JSpecify 的 Null 安全性 (Framework 7 / Boot 4)

Spring Framework 7 與 Boot 4 以 JSpecify（`org.jspecify.annotations`）標註其 API：除非標註為 `@Nullable`，否則所有項目皆為非 null。在您的程式碼中：

- 在 `package-info.java` 中新增 `@NullMarked`（已驗證在 Boot 4.1.1 上可編譯，此時 `org.jspecify:jspecify` 已在類別路徑中），並使用 `org.jspecify.annotations.Nullable` 標註可為 null 的參數、回傳值與欄位。
- 在修改相關檔案時，以 JSpecify 取代 `org.springframework.lang.Nullable`/`NonNull`（在 Framework 7 中已廢棄）。
- JSpecify 僅作為工具（IDE、NullAway、Error Prone）的文件說明，在執行時期**不會**進行驗證。針對請求驗證請繼續使用 `jakarta.validation.constraints.NotNull`/`@NotBlank`。選用：僅在專案要求時才在建構中新增 NullAway。
