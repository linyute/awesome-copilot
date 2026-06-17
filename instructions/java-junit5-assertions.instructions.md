---
description: "標準化 JUnit 5 (Jupiter) 斷言，包含效能、可讀性和現代功能 (5.8+) 的最佳實踐。涵蓋 Supplier 訊息、assertAll、assertThrowsExactly 以及對效能至關重要的逾時設定。"
applyTo: "**/*Test.java, **/*IT.java, **/*Steps.java, **/*StepDefs.java"
---

# JUnit 5 斷言最佳實踐

在編寫、審查或重構使用 JUnit Jupiter (JUnit 5) 的 Java 測試程式碼時，請遵循以下最佳實踐。這些規則專注於測試準確性、效能（延遲求值）以及利用現代 Jupiter 功能。

## 1. 匯入 (Imports)

優先使用斷言的靜態匯入以減少樣板程式碼。除非您的團隊慣例另有規定，否則請優先使用明確匯入而不是萬用字元 (`*`) 匯入。

```java
// ❌ 錯誤 — 冗長且使測試方法顯得雜亂
Assertions.assertEquals(expected, actual);

// ❌ 錯誤 — 萬用字元匯入（除非這是您團隊的標準）
import static org.junit.jupiter.api.Assertions.*;

// ✅ 正確 — 明確的靜態匯入
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

assertEquals(expected, actual);
```

> **最適用於**：提高可讀性並使測試方法專注於邏輯。始終從 `org.junit.jupiter.api.Assertions` 匯入。

## 2. assertEquals — 預期值在前

`expected`（預期值）始終是**第一個**參數，`actual`（實際值）始終是**第二個**參數。

```java
// ❌ 錯誤 — 順序顛倒；失敗訊息會引起誤導
assertEquals(calculator.add(1, 1), 2);

// ✅ 正確
assertEquals(2, calculator.add(1, 1));

// ✅ 正確 — 浮點數：始終提供誤差範圍 (delta)
assertEquals(0.3, 0.1 + 0.2, 1e-9);
```

> **最適用於**：確保失敗記錄正確顯示 "Expected [X] but was [Y]"（預期為 [X] 但實際為 [Y]）。

## 3. 失敗訊息 — Supplier vs String

當訊息構建開銷較大時（例如：字串格式化或複雜的物件檢查），請將失敗訊息作為 `Supplier<String>` 傳遞。

```java
// ❌ 錯誤 — 即使斷言通過，也會構建昂貴的訊息
assertEquals(expected, actual, "Expected %s but got %s".formatted(expected, actual));

// ✅ 正確 — 僅在失敗時評估（延遲求值 Lazy evaluation）
assertEquals(expected, actual,
    () -> "Expected %s but got %s".formatted(expected, actual));

// ✅ 正確 — 簡單的常數字串字面量（零開銷）
assertTrue(isActive, "User account must be active");
```

> **最適用於**：對效能要求嚴苛的測試套件和複雜的診斷訊息。

## 4. assertAll — 分組相關斷言

檢查同一結果的多個屬性時，請使用 `assertAll`。即使前面的斷言失敗，所有斷言也會執行。

```java
// ❌ 錯誤 — 在第一個失敗處停止；其他屬性未經檢查
assertEquals("Jane", person.firstName());
assertEquals("Doe",  person.lastName());

// ✅ 正確
assertAll("person",
    () -> assertEquals("Jane", person.firstName()),
    () -> assertEquals("Doe",  person.lastName()),
    () -> assertEquals(30,     person.age())
);
```

> **最適用於**：全面的物件狀態驗證，並避免「部分失敗」的歧義。

## 5. 例外測試 — assertThrows vs assertThrowsExactly

`assertThrows` 會回傳例外以供進一步驗證。使用 `assertThrowsExactly` 進行嚴格的類型比對。

```java
// ✅ assertThrows — 如果拋出的類型「是」(IS-A) 預期類型則通過（接受子類別）
ArithmeticException ex = assertThrows(
    ArithmeticException.class,
    () -> calculator.divide(1, 0)
);
assertEquals("/ by zero", ex.getMessage());

// ✅ assertThrowsExactly — 僅當類型「完全匹配」時才通過（JUnit 5.8+）
assertThrowsExactly(IllegalArgumentException.class, () -> {
    throw new IllegalArgumentException("invalid");
});
```

> **最適用於**：`assertThrows` 用於一般層次結構測試；當精確的實作類別是 API 合約的一部分時，使用 `assertThrowsExactly`。

## 6. assertDoesNotThrow

當測試的明確合約是「不應拋出例外」時使用。

```java
// ✅ 正確 — 捕獲並回傳結果以進行進一步斷言
int result = assertDoesNotThrow(() -> service.calculate(data));
assertEquals(100, result);
```

> **最適用於**：明確記錄特定的邊緣情況不應觸發錯誤。

## 7. 效能與期限 — assertTimeout

使用 `assertTimeout` 確保執行在限制範圍內完成。僅在需要硬性中止時使用 `assertTimeoutPreemptively`。

```java
// ✅ assertTimeout — 等待完成，然後檢查持續時間
assertTimeout(Duration.ofSeconds(1), () -> service.heavyTask());

// ⚠️ assertTimeoutPreemptively — 在期限到時硬性中止（獨立執行緒）
// 警告：ThreadLocal 狀態（如 @Transactional）「不會」傳遞。
assertTimeoutPreemptively(Duration.ofMillis(500), () -> service.fastTask());
```

> **最適用於**：SLA 驗證並防止 CI/CD 流水線中的測試掛起。

## 8. 類型安全 — assertInstanceOf

優先使用 `assertInstanceOf` (JUnit 5.8+) 而非 `assertTrue` + `instanceof`，以獲得自動轉型。

```java
// ❌ 錯誤 — 斷言後需要手動轉型
assertTrue(result instanceof SuccessResponse);

// ✅ 正確 — 回傳轉型後的物件
SuccessResponse resp = assertInstanceOf(SuccessResponse.class, result);
assertEquals(200, resp.statusCode());
```

> **最適用於**：測試多型結果並減少樣板式的轉型。

## 9. 集合與陣列 (Collections and Arrays)

使用專用斷言進行深度比較和提供資訊豐富的差異比較 (diffs)。

```java
// ✅ assertIterableEquals — 失敗時逐個元素顯示深度差異
assertIterableEquals(expectedList, actualList);

// ✅ assertArrayEquals — 陣列的深度比較
assertArrayEquals(expectedArray, actualArray);
```

> **最適用於**：驗證列表順序和複雜資料結構的內容。

## 10. 反模式 (Anti-Patterns)

- **錯誤地將 `assertTrue` 用於相等性檢查**：不要使用 `assertTrue(result == 42)`。請使用 `assertEquals(42, result)` 以便在記錄中看到這兩個值。
- **用 `assertNotNull` 代替真實檢查**：如果可以檢查值，就不要只檢查是否為 null。`assertEquals(expected, result)` 總是優於 `assertNotNull(result)`。
- **抑制失敗**：絕不要擷取 `AssertionError` 來隱藏失敗。
- **舊版匯入**：不要在 JUnit 5 測試中混用 `org.junit.Assert` (JUnit 4)。
