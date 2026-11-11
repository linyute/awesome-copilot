# AssertJ 基礎知識

用於具可讀性、可維護性測試的流暢斷言（Fluent assertions）。

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

### 數值斷言

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

## 例外狀況斷言

### JUnit 5 例外狀況處理

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

### AssertJ 例外狀況處理

```java
@Test
void shouldThrowExceptionWithCause() {
  assertThatExceptionOfType(OrderProcessingException.class)
    .isThrownBy(() -> service.processOrder(invalidOrder))
    .withCauseInstanceOf(ValidationException.class);
}
```

## 自訂斷言

為可重複使用的測試程式碼建立領域專屬斷言：

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

## 軟斷言（Soft Assertions）

在判定失敗前收集多個失敗：

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

## 搭配 Spring 使用

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

始終使用靜態匯入以保持斷言簡潔：

```java
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;
```

## 主要優勢

1. **具可讀性**：如句子般的結構
2. **型別安全**：IDE 自動完成可正常運作
3. **豐富 API**：許多內建斷言
4. **具擴充性**：針對您領域的自訂斷言
5. **更佳錯誤**：清晰的失敗訊息
