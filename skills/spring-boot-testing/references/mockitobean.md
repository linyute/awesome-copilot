# @MockitoBean

在 Spring Boot 測試中模擬相依性（在 Spring Boot 4+ 中取代已棄用的 @MockBean）。

## 概觀

`@MockitoBean` 在 Spring Boot 4.0+ 中取代了已棄用的 `@MockBean` 註釋。它會建立 Mockito 模擬並將其註冊到 Spring 上下文中，替換相同型別的任何現有 Bean。

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

## 支援的測試切片

- `@WebMvcTest` - 模擬服務/Repository 相依性
- `@WebFluxTest` - 模擬反應式服務相依性
- `@SpringBootTest` - 使用模擬替換真實 Bean

## 虛設常式方法（Stubbing Methods）

### 基本虛設常式

```java
@Test
void shouldReturnOrder() {
  Order order = new Order(1L, "PENDING");
  given(orderService.findById(1L)).willReturn(order);

  // Test code
}
```

### 多次回傳

```java
given(orderService.findById(anyLong()))
  .willReturn(new Order(1L, "PENDING"))
  .willReturn(new Order(2L, "COMPLETED"));
```

### 擲出例外狀況

```java
given(orderService.findById(999L))
  .willThrow(new OrderNotFoundException(999L));
```

### 引數比對

```java
given(orderService.create(argThat(req -> req.getQuantity() > 0)))
  .willReturn(1L);

given(orderService.findByStatus(eq("PENDING")))
  .willReturn(List.of(new Order()));
```

## 驗證互動

### 驗證方法已呼叫

```java
verify(orderService).findById(1L);
```

### 驗證從未呼叫

```java
verify(orderService, never()).delete(any());
```

### 驗證呼叫次數

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

## 重設模擬

模擬會在測試之間自動重設。若要在測試中途重設：

```java
Mockito.reset(orderService);
```

## 用於部分模擬的 @MockitoSpyBean

使用 `@MockitoSpyBean` 透過 Mockito 包裝真實 Bean。

```java
@SpringBootTest
class OrderServiceIntegrationTest {

  @MockitoSpyBean
  private PaymentGatewayClient paymentClient;

  @Test
  void shouldProcessOrder() {
    doReturn(true).when(paymentClient).processPayment(any());

    // Test with real service but mocked payment client
  }
}
```

## 用於自訂測試 Bean 的 @TestBean

在測試上下文中註冊自訂 Bean 實例：

```java
@SpringBootTest
class OrderServiceTest {

  @TestBean
  private PaymentGatewayClient paymentClient() {
    return new FakePaymentClient();
  }
}
```

## 範圍：Singleton 對比 Prototype

Spring Framework 7+（Spring Boot 4+）支援模擬非 Singleton Bean：

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
    // Test code
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

### 相同型別的多個模擬

使用 Bean 名稱：

```java
@MockitoBean(name = "primaryDataSource")
private DataSource primaryDataSource;

@MockitoBean(name = "secondaryDataSource")
private DataSource secondaryDataSource;
```

## 從 @MockBean 移轉

### 移轉前（已棄用）

```java
@MockBean
private OrderService orderService;
```

### 移轉後（Spring Boot 4+）

```java
@MockitoBean
private OrderService orderService;
```

## 與 Mockito @Mock 的主要差異

| 功能 | @MockitoBean | @Mock |
| ------- | ------------ | ----- |
| 上下文整合 | 是 | 否 |
| Spring 生命週期 | 參與 | 無 |
| 支援 @Autowired | 是 | 否 |
| 測試切片支援 | 是 | 受限 |

## 最佳做法

1. 僅在涉及 Spring 上下文時使用 `@MockitoBean`
2. 對於純單元測試，使用 Mockito 的 `@Mock` 或 `Mockito.mock()`
3. 始終驗證具有副作用的互動
4. 不要驗證簡易查詢（虛設常式已足夠）
5. 若測試修改了共用模擬狀態，請重設模擬
