# @MockitoBean

在 Spring Boot 測試中模擬 (Mocking) 依賴關係 (取代 Spring Boot 4+ 中已棄用的 @MockBean)。

## 總覽

`@MockitoBean` 取代了 Spring Boot 4.0+ 中已棄用的 `@MockBean` 註解。它會建立一個 Mockito 模擬物件 (Mock) 並將其註冊到 Spring Context 中，取代任何現有的相同類型 Bean。

## 基本用法

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
  
  @MockitoBean
  private OrderService orderService;
  
  @MockitoBean
  private UserService userService;
}
```

## 支援的測試切片 (Test Slices)

- `@WebMvcTest` - 模擬服務 (Service)/Repository 的依賴關係
- `@WebFluxTest` - 模擬響應式 (Reactive) 服務的依賴關係
- `@SpringBootTest` - 將真實的 Beans 替換為模擬物件

## 虛設方法 (Stubbing Methods)

### 基本虛設

```java
@Test
void shouldReturnOrder() {
  Order order = new Order(1L, "PENDING");
  given(orderService.findById(1L)).willReturn(order);
  
  // 測試程式碼
}
```

### 多次傳回

```java
given(orderService.findById(anyLong()))
  .willReturn(new Order(1L, "PENDING"))
  .willReturn(new Order(2L, "COMPLETED"));
```

### 拋出例外

```java
given(orderService.findById(999L))
  .willThrow(new OrderNotFoundException(999L));
```

### 參數比對 (Argument Matching)

```java
given(orderService.create(argThat(req -> req.getQuantity() > 0)))
  .willReturn(1L);

given(orderService.findByStatus(eq("PENDING")))
  .willReturn(List.of(new Order()));
```

## 驗證互動 (Verifying Interactions)

### 驗證方法已呼叫

```java
verify(orderService).findById(1L);
```

### 驗證從未呼叫

```java
verify(orderService, never()).delete(any());
```

### 驗證次數

```java
verify(orderService, times(2)).findById(anyLong());
verify(orderService, atLeastOnce()).findByStatus(anyString());
```

### 驗證順序

```java
InOrder inOrder = inOrder(orderService, userService);
inOrder.verify(orderService).findById(1L);
inOrder.verify(userService).getUser(any());
```

## 重設模擬物件 (Resetting Mocks)

模擬物件會在測試之間自動重設。若要在測試中途重設：

```java
Mockito.reset(orderService);
```

## 使用 @MockitoSpyBean 進行部分模擬

使用 `@MockitoSpyBean` 將 Mockito 包裝在真實的 Bean 周圍。

```java
@SpringBootTest
class OrderServiceIntegrationTest {
  
  @MockitoSpyBean
  private PaymentGatewayClient paymentClient;
  
  @Test
  void shouldProcessOrder() {
    doReturn(true).when(paymentClient).processPayment(any());
    
    // 使用真實服務但模擬支付客戶端的測試
  }
}
```

## 使用 @TestBean 定義自定義測試 Bean

在測試 Context 中註冊自定義的 Bean 執行實體：

```java
@SpringBootTest
class OrderServiceTest {
  
  @TestBean
  private PaymentGatewayClient paymentClient() {
    return new FakePaymentClient();
  }
}
```

## 作用域 (Scoping)：單例 vs 原型

Spring Framework 7+ (Spring Boot 4+) 支援模擬非單例 (Non-singleton) 的 Beans：

```java
@Component
@Scope("prototype")
public class OrderProcessor {
  public String process() { return "real"; }
}

@SpringBootTest
class OrderServiceTest {
  @MockitoBean
  private OrderProcessor orderProcessor;
  
  @Test
  void shouldWorkWithPrototype() {
    given(orderProcessor.process()).willReturn("mocked");
    // 測試程式碼
  }
}
```

## 常見模式

### 在服務測試中模擬 Repository

```java
@SpringBootTest
class OrderServiceTest {
  @MockitoBean
  private OrderRepository orderRepository;
  
  @Autowired
  private OrderService orderService;
  
  @Test
  void shouldCreateOrder() {
    given(orderRepository.save(any())).willReturn(new Order(1L));
    
    Long id = orderService.createOrder(new OrderRequest());
    
    assertThat(id).isEqualTo(1L);
    verify(orderRepository).save(any(Order.class));
  }
}
```

### 多個相同類型的模擬物件

使用 Bean 名稱：

```java
@MockitoBean(name = "primaryDataSource")
private DataSource primaryDataSource;

@MockitoBean(name = "secondaryDataSource")
private DataSource secondaryDataSource;
```

## 從 @MockBean 遷移

### 之前 (已棄用)

```java
@MockBean
private OrderService orderService;
```

### 之後 (Spring Boot 4+)

```java
@MockitoBean
private OrderService orderService;
```

## 與 Mockito @Mock 的關鍵區別

| 功能 | @MockitoBean | @Mock |
| ------- | ------------ | ----- |
| Context 整合 | 是 | 否 |
| Spring 生命週期 | 參與 | 無 |
| 搭配 @Autowired | 是 | 否 |
| 測試切片支援 | 是 | 有限 |

## 最佳實務

1. 僅在涉及 Spring Context 時使用 `@MockitoBean`
2. 對於純單元測試，請使用 Mockito 的 `@Mock` 或 `Mockito.mock()`
3. 務必驗證具有副作用 (Side effects) 的互動
4. 不要驗證簡單的查詢 (虛設就足夠了)
5. 如果測試修改了共享的模擬狀態，請重設模擬物件
