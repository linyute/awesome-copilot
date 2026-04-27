# @RestClientTest

使用 MockRestServiceServer 隔離測試 REST 用戶端。

## 總覽

`@RestClientTest` 自動設定：

- 具有 mock 伺服器支援的 RestTemplate/RestClient
- Jackson ObjectMapper
- MockRestServiceServer

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

### 成功且包含主體

```java
server.expect(requestTo("/users/1"))
  .andRespond(withSuccess()
    .contentType(MediaType.APPLICATION_JSON)
    .body("{\"id\": 1, \"name\": \"John\"}"));
```

### 從資源成功

```java
server.expect(requestTo("/users/1"))
  .andRespond(withSuccess()
    .body(new ClassPathResource("user-response.json")));
```

### 已建立

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
  
  server.verify(); // 驗證是否符合所有預期
}
```

## 忽略多餘的請求

```java
@Test
void shouldHandleMultipleCalls() {
  server.expect(ExpectedCount.manyTimes(),
    requestTo(matchesPattern("/api/.*")))
    .andRespond(withSuccess());
  
  // 允許多次呼叫
  service.callApi();
  service.callApi();
  service.callApi();
}
```

## 在測試之間重設

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

## 最佳實務

1. 務必在測試結束時執行 `server.verify()`
2. 對於大型 JSON 回應使用資源檔案
3. 針對最小集合的請求屬性進行比對
4. 在 @BeforeEach 中重設伺服器
5. 測試錯誤回應，而不僅僅是成功
6. 驗證 POST/PUT 呼叫的請求主體
