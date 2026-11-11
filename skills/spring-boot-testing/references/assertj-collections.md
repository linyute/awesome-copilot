# AssertJ 集合

適用於集合的 AssertJ 斷言：`List`、`Set`、`Map`、陣列與 Stream。

## 何時使用此參考文件

- 受測值為 `List`、`Set`、`Map`、陣列或 `Stream`
- 您需要對多個元素、其順序或其中的特定欄位進行斷言
- 您正在使用 `extracting()`、`filteredOn()`、`containsExactly()` 或類似的集合方法
- 對單一純量或單一物件進行斷言 → 請改用 [assertj-basics.md](assertj-basics.md)

## 基本集合檢查

```java
List<Order> orders = orderService.findAll();

assertThat(orders).isNotEmpty();
assertThat(orders).isEmpty();
assertThat(orders).hasSize(3);
assertThat(orders).hasSizeGreaterThan(0);
assertThat(orders).hasSizeLessThanOrEqualTo(10);
```

## 包含斷言

```java
// Contains (any order, allows extras)
assertThat(orders).contains(order1, order2);

// Contains exactly these elements in this order (no extras)
assertThat(statuses).containsExactly("NEW", "PENDING", "COMPLETED");

// Contains exactly these elements in any order (no extras)
assertThat(statuses).containsExactlyInAnyOrder("COMPLETED", "NEW", "PENDING");

// Contains any of these elements (at least one match required)
assertThat(statuses).containsAnyOf("NEW", "CANCELLED");

// Does not contain
assertThat(statuses).doesNotContain("DELETED");
```

## 擷取欄位

在斷言前從每個元素擷取單一欄位：

```java
assertThat(orders)
  .extracting(Order::getStatus)
  .containsExactly("NEW", "PENDING", "COMPLETED");
```

將多個欄位擷取為元組（Tuple）：

```java
assertThat(orders)
  .extracting(Order::getId, Order::getStatus)
  .containsExactly(
    tuple(1L, "NEW"),
    tuple(2L, "PENDING"),
    tuple(3L, "COMPLETED")
  );
```

## 斷言前篩選

```java
assertThat(orders)
  .filteredOn(order -> order.getStatus().equals("PENDING"))
  .hasSize(2)
  .extracting(Order::getId)
  .containsExactlyInAnyOrder(1L, 3L);

// Filter by field value
assertThat(orders)
  .filteredOn("status", "PENDING")
  .hasSize(2);
```

## 述詞檢查

```java
assertThat(orders).allMatch(o -> o.getTotal().compareTo(BigDecimal.ZERO) > 0);
assertThat(orders).anyMatch(o -> o.getStatus().equals("COMPLETED"));
assertThat(orders).noneMatch(o -> o.getStatus().equals("DELETED"));

// With description for failure messages
assertThat(orders)
  .allSatisfy(o -> assertThat(o.getId()).isPositive());
```

## 逐元素有序斷言

依序對每個元素進行個別條件斷言：

```java
assertThat(orders).satisfiesExactly(
  first  -> assertThat(first.getStatus()).isEqualTo("NEW"),
  second -> assertThat(second.getStatus()).isEqualTo("PENDING"),
  third  -> {
    assertThat(third.getStatus()).isEqualTo("COMPLETED");
    assertThat(third.getTotal()).isGreaterThan(BigDecimal.ZERO);
  }
);
```

## 巢狀 / 平坦化集合

```java
// flatExtracting: flatten one level of nested collections
assertThat(orders)
  .flatExtracting(Order::getItems)
  .extracting(OrderItem::getProduct)
  .contains("Laptop", "Mouse");
```

## 遞迴欄位比較

依欄位而非物件同一性比較元素：

```java
assertThat(orders)
  .usingRecursiveFieldByFieldElementComparator()
  .containsExactlyInAnyOrder(expectedOrder1, expectedOrder2);

// Ignore specific fields (e.g. generated IDs or timestamps)
assertThat(orders)
  .usingRecursiveFieldByFieldElementComparatorIgnoringFields("id", "createdAt")
  .containsExactly(expectedOrder1, expectedOrder2);
```

## Map 斷言

```java
Map<String, Integer> stockByProduct = inventoryService.getStock();

assertThat(stockByProduct)
  .isNotEmpty()
  .hasSize(3)
  .containsKey("Laptop")
  .doesNotContainKey("Fax Machine")
  .containsEntry("Laptop", 10)
  .containsEntries(entry("Laptop", 10), entry("Mouse", 50));

assertThat(stockByProduct)
  .hasEntrySatisfying("Laptop", qty -> assertThat(qty).isGreaterThan(0));
```

## 陣列斷言

```java
String[] roles = user.getRoles();

assertThat(roles).hasSize(2);
assertThat(roles).contains("ADMIN");
assertThat(roles).containsExactlyInAnyOrder("USER", "ADMIN");
```

## Set 斷言

```java
Set<String> tags = product.getTags();

assertThat(tags).contains("electronics", "sale");
assertThat(tags).doesNotContain("expired");
assertThat(tags).hasSizeGreaterThanOrEqualTo(1);
```

## 靜態匯入

```java
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.assertj.core.api.Assertions.entry;
```

## 重點摘要

1. **`containsExactly` 對比 `containsExactlyInAnyOrder`** — 當順序重要時使用前者
2. **在包含檢查前使用 `extracting()`** — 避免在領域物件上實作 `equals()`
3. **`filteredOn()` + `extracting()`** — 組合使用以精確斷言集合的子集
4. **`satisfiesExactly()`** — 當每個元素需要不同的斷言時使用
5. **`usingRecursiveFieldByFieldElementComparator()`** — 對於 DTO 與 record 偏好使用此方法勝過 `equals()`
