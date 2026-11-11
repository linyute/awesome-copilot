# @RestClientTest

使用 MockRestServiceServer 隔離測試 REST 用戶端。

## 概觀

`@RestClientTest` 自動配置：

- 支援模擬伺服器的 RestTemplate/RestClient
- Jackson/JSON 序列化支援
- 專為待測試用戶端載入的最小應用程式上下文

## 基本設定

```java
@RestClientTest(WeatherService.class)
class WeatherServiceTest {

  @Autowired
  private WeatherService weatherService;

  @Autowired
  private MockRestServiceServer server;
}
```

## 測試 RestTemplate

```java
@RestClientTest(WeatherService.class)
class WeatherServiceTest {

  @Autowired
  private WeatherService weatherService;

  @Autowired
  private MockRestServiceServer server;

  @Test
  void shouldFetchWeather() {
    // Given
    server.expect(requestTo("https://api.weather.com/v1/current"))
      .andExpect(method(HttpMethod.GET))
      .andExpect(queryParam("city", "Berlin"))
      .andRespond(withSuccess()
        .contentType(MediaType.APPLICATION_JSON)
        .body("{\"temperature\": 22, \"condition\": \"Sunny\"}"));

    // When
    Weather weather = weatherService.getCurrentWeather("Berlin");

    // Then
    assertThat(weather.getTemperature()).isEqualTo(22);
    assertThat(weather.getCondition()).isEqualTo("Sunny");
  }
}
```

## 測試 RestClient (Spring 6.1+)

```java
@RestClientTest(WeatherService.class)
class WeatherServiceTest {

  @Autowired
  private WeatherService weatherService;

  @Autowired
  private MockRestServiceServer server;

  @Test
  void shouldFetchWeatherWithRestClient() {
    server.expect(requestTo("https://api.weather.com/v1/current"))
      .andRespond(withSuccess()
        .body("{\"temperature\": 22}"));

    Weather weather = weatherService.getCurrentWeather("Berlin");

    assertThat(weather.getTemperature()).isEqualTo(22);
  }
}
```

## 請求比對

### 精確 URL

```java
server.expect(requestTo("https://api.example.com/users/1"))
  .andRespond(withSuccess());
```

### URL 模式

```java
server.expect(requestTo(matchesPattern("https://api.example.com/users/\\d+")))
  .andRespond(withSuccess());
```

### HTTP 方法

```java
server.expect(ExpectedCount.once(), 
  requestTo("https://api.example.com/users"))
  .andExpect(method(HttpMethod.POST))
  .andRespond(withCreatedEntity(URI.create("/users/1")));
```

### 請求主體

```java
server.expect(requestTo("https://api.example.com/users"))
  .andExpect(content().contentType(MediaType.APPLICATION_JSON))
  .andExpect(content().json("{\"name\": \"John\"}"))
  .andRespond(withSuccess());
```

### 標頭

```java
server.expect(requestTo("https://api.example.com/users"))
  .andExpect(header("Authorization", "Bearer token123"))
  .andExpect(header("X-Api-Key", "secret"))
  .andRespond(withSuccess());
```

## 回應類型

### 帶有主體的成功回應

```java
server.expect(requestTo("/users/1"))
  .andRespond(withSuccess()
    .contentType(MediaType.APPLICATION_JSON)
    .body("{\"id\": 1, \"name\": \"John\"}"));
```

### 來自資源檔的成功回應

```java
server.expect(requestTo("/users/1"))
  .andRespond(withSuccess()
    .body(new ClassPathResource("user-response.json")));
```

### 已建立 (Created)

```java
server.expect(requestTo("/users"))
  .andExpect(method(HttpMethod.POST))
  .andRespond(withCreatedEntity(URI.create("/users/1")));
```

### 錯誤回應

```java
server.expect(requestTo("/users/999"))
  .andRespond(withResourceNotFound());

server.expect(requestTo("/users"))
  .andRespond(withServerError()
    .body("Internal Server Error"));

server.expect(requestTo("/users"))
  .andRespond(withStatus(HttpStatus.BAD_REQUEST)
    .body("{\"error\": \"Invalid input\"}"));
```

## 驗證請求

```java
@Test
void shouldCallApi() {
  server.expect(ExpectedCount.once(), 
    requestTo("https://api.example.com/data"))
    .andRespond(withSuccess());

  service.fetchData();

  server.verify(); // Verify all expectations met
}
```

## 忽略額外請求

```java
@Test
void shouldHandleMultipleCalls() {
  server.expect(ExpectedCount.manyTimes(),
    requestTo(matchesPattern("/api/.*")))
    .andRespond(withSuccess());

  // Multiple calls allowed
  service.callApi();
  service.callApi();
  service.callApi();
}
```

## 測試之間重設

```java
@BeforeEach
void setUp() {
  server.reset();
}
```

## 測試逾時

```java
server.expect(requestTo("/slow-endpoint"))
  .andRespond(withSuccess()
    .body("{\"data\": \"test\"}")
    .delay(100, TimeUnit.MILLISECONDS));

// 測試逾時處理
```

## 最佳實踐

1. 永遠在測試結束時調用 `server.verify()` 進行驗證
2. 保持回應酬載最小化，僅包含測試所需的欄位
3. 對外部 API 依賴項測試錯誤狀態碼與逾時
4. 針對大型或重複的 JSON 酬載使用 `withSuccess(resource, ...)`
5. 若要模擬服務之間的真實 HTTP 流量，請改用 WireMock
6. 將 `@RestClientTest` 用於單元層級的用戶端測試，WireMock 用於整合測試
