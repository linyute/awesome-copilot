# AssertJ 基礎

流暢的斷言，提供可讀性高且易於維護的測試。

## 基本斷言

### 物件相等性

```java
assertThat(order.getStatus()).isEqualTo("PENDING");
assertThat(order.getId()).isNotEqualTo(0);
assertThat(order).isEqualTo(expectedOrder);
assertThat(order).isNotNull();
assertThat(nullOrder).isNull();
```

### 字串斷言

```java
assertThat(order.getDescription())
  .isEqualTo("Test Order")
  .startsWith("Test")
  .endsWith("Order")
  .contains("Test")
  .hasSize(10)
  .matches("[A-Za-z ]+");
```

### 數字斷言

```java
assertThat(order.getAmount())
  .isEqualTo(99.99)
  .isGreaterThan(50)
  .isLessThan(100)
  .isBetween(50, 100)
  .isPositive()
  .isNotZero();
```

### 布林值斷言

```java
assertThat(order.isActive()).isTrue();
assertThat(order.isDeleted()).isFalse();
```

## 日期/時間斷言

```java
assertThat(order.getCreatedAt())
  .isEqualTo(LocalDateTime.of(2024, 1, 15, 10, 30))
  .isBefore(LocalDateTime.now())
  .isAfter(LocalDateTime.of(2024, 1, 1))
  .isCloseTo(LocalDateTime.now(), within(5, ChronoUnit.SECONDS));
```

## Optional 斷言

```java
Optional<Order> maybeOrder = orderService.findById(1L);

assertThat(maybeOrder)
  .isPresent()
  .hasValueSatisfying(order -> {
    assertThat(order.getId()).isEqualTo(1L);
  });

assertThat(orderService.findById(999L)).isEmpty();
```

## 例外斷言

### JUnit 5 例外處理

```java
@Test
void shouldThrowException() {
  OrderService service = new OrderService();
  
  assertThatThrownBy(() -> service.findById(999L))
    .isInstanceOf(OrderNotFoundException.class)
    .hasMessage("Order 999 not found")
    .hasMessageContaining("999");
}
```

### AssertJ 例外處理

```java
@Test
void shouldThrowExceptionWithCause() {
  assertThatExceptionOfType(OrderProcessingException.class)
    .isThrownBy(() -> service.processOrder(invalidOrder))
    .withCauseInstanceOf(ValidationException.class);
}
```

## 自定義斷言

為可重複使用的測試程式碼建立領域特定的斷言：

```java
public class OrderAssert extends AbstractAssert<OrderAssert, Order> {
  
  public static OrderAssert assertThat(Order actual) {
    return new OrderAssert(actual);
  }
  
  private OrderAssert(Order actual) {
    super(actual, OrderAssert.class);
  }
  
  public OrderAssert isPending() {
    isNotNull();
    if (!"PENDING".equals(actual.getStatus())) {
      failWithMessage("Expected order status to be PENDING but was %s", actual.getStatus());
    }
    return this;
  }
  
  public OrderAssert hasTotal(BigDecimal expected) {
    isNotNull();
    if (!expected.equals(actual.getTotal())) {
      failWithMessage("Expected total %s but was %s", expected, actual.getTotal());
    }
    return this;
  }
}
```

用法：

```java
OrderAssert.assertThat(order)
  .isPending()
  .hasTotal(new BigDecimal("99.99"));
```

## 軟斷言 (Soft Assertions)

在失敗前收集多個失敗資訊：

```java
@Test
void shouldValidateOrder() {
  Order order = orderService.findById(1L);
  
  SoftAssertions.assertSoftly(softly -> {
    softly.assertThat(order.getId()).isEqualTo(1L);
    softly.assertThat(order.getStatus()).isEqualTo("PENDING");
    softly.assertThat(order.getItems()).isNotEmpty();
  });
}
```

## Satisfies 模式

```java
assertThat(order)
  .satisfies(o -> {
    assertThat(o.getId()).isPositive();
    assertThat(o.getStatus()).isNotBlank();
    assertThat(o.getCreatedAt()).isNotNull();
  });
```

## 在 Spring 中使用

```java
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class OrderServiceTest {
  
  @Autowired
  private OrderService orderService;
  
  @Test
  void shouldCreateOrder() {
    Order order = orderService.create(new OrderRequest("Product", 2));
    
    assertThat(order)
      .isNotNull()
      .extracting(Order::getId, Order::getStatus)
      .containsExactly(1L, "PENDING");
  }
}
```

## 靜態匯入

務必使用靜態匯入以確保斷言簡潔：

```java
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;
```

## 關鍵優點

1. **可讀性高**：類似句子的結構
2. **型別安全**：IDE 自動完成功能可正常運作
3. **豐富的 API**：提供許多內建斷言
4. **可擴充性**：可為您的領域自定義斷言
5. **更好的錯誤資訊**：清晰的失敗訊息
