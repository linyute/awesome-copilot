---
name: spring-boot-testing
description: 專家級 Spring Boot 4 測試專家，協助您針對各種情況，配合 Junit 6 與 AssertJ 選擇最佳的 Spring Boot 測試技術。
---

# Spring Boot 測試 (Spring Boot Testing)

本技能針對使用現代模式與最佳實務來測試 Spring Boot 4 應用程式提供專家指引。

## 核心原則 (Core Principles)

1. **測試金字塔 (Test Pyramid)**：單元測試 (Unit，快速) > 切片測試 (Slice，聚焦) > 整合測試 (Integration，完整)
2. **正確的工具 (Right Tool)**：使用能帶給您信心的最窄切片 (slice)
3. **AssertJ 風格 (AssertJ Style)**：使用流暢且易讀的判斷 (assertion)，而非冗長的比對器 (matcher)
4. **現代 API (Modern APIs)**：優先選擇 MockMvcTester 與 RestTestClient，而非舊版的替代方案

## 該使用哪種測試切片？ (Which Test Slice?)

| 場景 | 註釋 | 參考資料 |
|----------|------------|-----------|
| 控制器 + HTTP 語義 | `@WebMvcTest` | [references/webmvctest.md](references/webmvctest.md) |
| 存放庫 (Repository) + JPA 查詢 | `@DataJpaTest` | [references/datajpatest.md](references/datajpatest.md) |
| REST 用戶端 + 外部 API | `@RestClientTest` | [references/restclienttest.md](references/restclienttest.md) |
| JSON (反)序列化 | `@JsonTest` | [references/test-slices-overview.md](references/test-slices-overview.md) |
| 完整應用程式 | `@SpringBootTest` | [references/test-slices-overview.md](references/test-slices-overview.md) |

## 測試切片參考資料 (Test Slices Reference)

- [references/test-slices-overview.md](references/test-slices-overview.md) - 決策矩陣與比較
- [references/webmvctest.md](references/webmvctest.md) - 使用 MockMvc 的網頁層
- [references/datajpatest.md](references/datajpatest.md) - 使用 Testcontainers 的資料層
- [references/restclienttest.md](references/restclienttest.md) - REST 用戶端測試

## 測試工具參考資料 (Testing Tools Reference)

- [references/mockmvc-tester.md](references/mockmvc-tester.md) - AssertJ 風格的 MockMvc (3.2+)
- [references/mockmvc-classic.md](references/mockmvc-classic.md) - 傳統 MockMvc (3.2 以前)
- [references/resttestclient.md](references/resttestclient.md) - Spring Boot 4+ REST 用戶端
- [references/mockitobean.md](references/mockitobean.md) - 模擬 (Mocking) 相依性

## 判斷函式庫 (Assertion Libraries)

- [references/assertj-basics.md](references/assertj-basics.md) - 純量 (Scalar)、字串、布林、日期
- [references/assertj-collections.md](references/assertj-collections.md) - List、Set、Map、陣列

## Testcontainers

- [references/testcontainers-jdbc.md](references/testcontainers-jdbc.md) - PostgreSQL、MySQL 等

## 測試資料產生 (Test Data Generation)

- [references/instancio.md](references/instancio.md) - 產生複雜的測試物件 (3 個以上屬性)

## 效能與遷移 (Performance & Migration)

- [references/context-caching.md](references/context-caching.md) - 加速測試套件
- [references/sb4-migration.md](references/sb4-migration.md) - Spring Boot 4.0 變更

## 快速決策樹 (Quick Decision Tree)

```
正在測試控制器端點嗎？
  是 → 配合 MockMvcTester 使用 @WebMvcTest

正在測試存放庫查詢嗎？
  是 → 配合 Testcontainers (真實資料庫) 使用 @DataJpaTest

正在測試服務 (Service) 中的商業邏輯嗎？
  是 → 使用純 JUnit + Mockito (不含 Spring 情境)

正在測試外部 API 用戶端嗎？
  是 → 配合 MockRestServiceServer 使用 @RestClientTest

正在測試 JSON 對應嗎？
  是 → 使用 @JsonTest

需要進行完整的整合測試嗎？
  是 → 搭配最少情境組態使用 @SpringBootTest
```

## Spring Boot 4 重點摘要 (Spring Boot 4 Highlights)

- **RestTestClient**：TestRestTemplate 的現代替代方案
- **@MockitoBean**：取代 @MockBean (已淘汰)
- **MockMvcTester**：用於網頁測試的 AssertJ 風格判斷
- **模組化入門套件 (Modular starters)**：特定技術的測試入門套件
- **情境暫停 (Context pausing)**：自動暫停已快取的情境 (Spring Framework 7)

## 測試最佳實務 (Testing Best Practices)

### 程式碼複雜度評估 (Code Complexity Assessment)

當方法或類別過於複雜而難以有效測試時：

1. **分析複雜度** - 如果您需要 5-7 個以上的測試案例來涵蓋單一方法，該方法可能過於複雜
2. **建議進行重構 (Refactoring)** - 建議將程式碼拆解為較小、專注的函式
3. **使用者決定** - 如果使用者同意重構，請協助識別擷取點 (extraction point)
4. **必要時繼續執行** - 如果使用者決定繼續使用複雜的程式碼，即使困難也要實作測試

**重構建議範例：**
```java
// 之前：難以測試的複雜方法
public Order processOrder(OrderRequest request) {
  // 驗證、折扣計算、支付、庫存、通知...
  // 50 多行混雜的考量點
}

// 之後：重構為可測試的單元
public Order processOrder(OrderRequest request) {
  validateOrder(request);
  var order = createOrder(request);
  applyDiscount(order);
  processPayment(order);
  updateInventory(order);
  sendNotification(order);
  return order;
}
```

### 避免程式碼冗餘 (Avoid Code Redundancy)

為常用物件和模擬設定 (mock setup) 建立協助工具方法，以增強易讀性與可維護性。

### 使用 @DisplayName 組織測試 (Test Organization with @DisplayName)

使用具描述性的顯示名稱來釐清測試意圖：

```java
@Test
@DisplayName("Should calculate discount for VIP customer")
void shouldCalculateDiscountForVip() { }

@Test
@DisplayName("Should reject order when customer has insufficient credit")
void shouldRejectOrderForInsufficientCredit() { }
```

### 測試涵蓋順序 (Test Coverage Order)

一律依此順序架構測試：

1. **主要場景 (Main scenario)** - 正常路徑 (happy path)，最常見的使用案例
2. **其他路徑 (Other paths)** - 其他有效的場景、邊緣案例 (edge case)
3. **例外/錯誤 (Exceptions/Errors)** - 無效的輸入、錯誤條件、失敗模式

### 測試生產環境場景 (Test Production Scenarios)

編寫測試時應考量真實的生產環境場景。這使測試更具關聯性，並有助於了解程式碼在實際生產案例中的行為。

### 測試涵蓋率目標 (Test Coverage Goals)

以 80% 的程式碼涵蓋率作為品質與努力之間的實際平衡。較高的涵蓋率有益，但不是唯一的目標。

使用 Jacoco maven 套件進行涵蓋率報告與追蹤。


**涵蓋率規則：**
- 最低 80% 以上涵蓋率
- 專注於具意義的判斷，而不僅僅是執行

**應優先處理的部分：**
1. 關鍵業務路徑 (支付處理、訂單驗證)
2. 複雜演算法 (定價、折扣計算)
3. 錯誤處理 (例外情況、邊緣案例)
4. 整合點 (外部 API、資料庫)

## 相依性 (Spring Boot 4) (Dependencies)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- 用於 WebMvc 測試 -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webmvc-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- 用於 Testcontainers -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
```
