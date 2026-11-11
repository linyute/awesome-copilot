---
name: spring-boot-testing
description: '專家級 Spring Boot 測試專家，為您的情況選取最佳測試技術：測試切片、搭配 @ServiceConnection 的 Testcontainers、Failsafe 整合測試、MockitoBean、JUnit 與 AssertJ。針對 Spring Boot 4 撰寫，附帶 Boot 3 說明。'
---

# Spring Boot 測試

本技能為使用現代模式與最佳做法測試 Spring Boot 應用程式提供專家指引。範例以 Spring Boot 4 為目標；有關 Boot 3 請參閱下方的相容性說明。

## 相容性：優先偵測

在撰寫測試前請先讀取專案的 Spring Boot 版本與測試相依性，切勿隱式升級它們。

| | Spring Boot 3.x | Spring Boot 4.x |
|--|-----------------|-----------------|
| JUnit | 5 (Jupiter) | 預設為 6（相同的 `org.junit.jupiter.api` 註釋；JUnit 5 測試維持運作） |
| 模擬 Bean | 來自 3.4（Spring Framework 6.2）的 `@MockitoBean` / `@MockitoSpyBean`；`@MockBean` / `@SpyBean` 已棄用 | `@MockitoBean` 取代 `@MockBean`（請勿使用舊註釋） |
| 測試 Starter | `spring-boot-starter-test` 涵蓋所有內容 | 模組化：新增 `spring-boot-starter-webmvc-test`、`spring-boot-starter-data-jpa-test`，... |
| 切片匯入 | `org.springframework.boot.test.autoconfigure...` | 已搬移，例如 `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` |
| Testcontainers | 1.x 名稱 | 2.x 名稱（`testcontainers-postgresql`） |

詳細資訊：[references/sb4-migration.md](references/sb4-migration.md)、[references/mockitobean.md](references/mockitobean.md)。

## 核心原則

1. **測試金字塔**：單元測試（快速） > 切片測試（聚焦） > 整合測試（完整）
2. **正確工具**：使用能帶給您信心的最窄切片
3. **AssertJ 風格**：流暢、具可讀性的斷言優於冗長的比對器
4. **現代 API**：偏好 MockMvcTester 與 RestTestClient，勝過傳統替代方案

## 該使用哪種測試切片？

| 情境 | 註釋 | 參考文件 |
|----------|------------|-----------|
| 控制器 + HTTP 語意 | `@WebMvcTest` | [references/webmvctest.md](references/webmvctest.md) |
| Repository + JPA 查詢 | `@DataJpaTest` | [references/datajpatest.md](references/datajpatest.md) |
| REST 用戶端 + 外部 API | `@RestClientTest` | [references/restclienttest.md](references/restclienttest.md) |
| JSON（反）序列化 | `@JsonTest` | [references/test-slices-overview.md](references/test-slices-overview.md) |
| 完整應用程式 | `@SpringBootTest` | [references/test-slices-overview.md](references/test-slices-overview.md) |

## 測試切片參考

- [references/test-slices-overview.md](references/test-slices-overview.md) - 決策矩陣與比較
- [references/webmvctest.md](references/webmvctest.md) - 使用 MockMvc 的 Web 層
- [references/datajpatest.md](references/datajpatest.md) - 使用 Testcontainers 的資料層
- [references/restclienttest.md](references/restclienttest.md) - REST 用戶端測試

## 測試工具參考

- [references/mockmvc-tester.md](references/mockmvc-tester.md) - AssertJ 風格的 MockMvc (3.2+)
- [references/mockmvc-classic.md](references/mockmvc-classic.md) - 傳統 MockMvc (3.2 之前)
- [references/resttestclient.md](references/resttestclient.md) - Spring Boot 4+ REST 用戶端
- [references/mockitobean.md](references/mockitobean.md) - 模擬相依性

## 斷言函式庫

- [references/assertj-basics.md](references/assertj-basics.md) - 純量、字串、布林值、日期
- [references/assertj-collections.md](references/assertj-collections.md) - List、Set、Map、陣列

## Testcontainers 與整合測試

- [references/testcontainers-jdbc.md](references/testcontainers-jdbc.md) - `@ServiceConnection` 快速入門、PostgreSQL、MySQL 等
- [references/failsafe-integration-tests.md](references/failsafe-integration-tests.md) - 除非綁定 Failsafe 否則 `*IT` 類別會靜默略過；請執行 `./mvnw verify`

> **Maven 常見陷阱：** 僅在 `<pluginManagement>` 中宣告 Failsafe 代表 `*IT` 測試絕不會執行。請在 `<build><plugins>` 中宣告它並綁定 `integration-test` 與 `verify` 目標，然後執行 `./mvnw verify`。

## 測試資料產生

- [references/instancio.md](references/instancio.md) - 產生複雜測試物件（3 個以上屬性）

## 效能與移轉

- [references/context-caching.md](references/context-caching.md) - 加速測試套件
- [references/sb4-migration.md](references/sb4-migration.md) - Spring Boot 4.0 變更

## 快速決策樹

```
Testing a controller endpoint?
  Yes → @WebMvcTest with MockMvcTester

Testing repository queries?
  Yes → @DataJpaTest with Testcontainers (real DB)

Testing business logic in service?
  Yes → Plain JUnit + Mockito (no Spring context)

Testing external API client?
  Yes → @RestClientTest with MockRestServiceServer

Testing JSON mapping?
  Yes → @JsonTest

Need full integration test?
  Yes → @SpringBootTest with minimal context config
```

## Spring Boot 4 重要特色

- **RestTestClient**：TestRestTemplate 的現代替代方案
- **@MockitoBean**：取代 @MockBean（已棄用）
- **MockMvcTester**：用於 Web 測試的 AssertJ 風格斷言
- **模組化 Starter**：技術專用的測試 starter
- **上下文暫停**：快取上下文的自動暫停（Spring Framework 7）

## 測試最佳做法

### 程式碼複雜度評估

當方法或類別過於複雜而無法有效測試時：

1. **分析複雜度** - 若需要超過 5-7 個測試案例來涵蓋單一方法，該方法很可能過於複雜
2. **建議重構** - 建議將程式碼拆分為更小、更聚焦的函式
3. **使用者決定** - 若使用者同意重構，協助識別提煉點
4. **視需要繼續** - 若使用者決定維持複雜程式碼，請克服困難實作測試

**重構建議範例：**
```java
// Before: Complex method hard to test
public Order processOrder(OrderRequest request) {
  // Validation, discount calculation, payment, inventory, notification...
  // 50+ lines of mixed concerns
}

// After: Refactored into testable units
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

### 避免程式碼冗餘

為常用物件與模擬設定建立協助工具方法，以提升可讀性與可維護性。

### 使用 @DisplayName 組織測試

使用具描述性的顯示名稱釐清測試意圖：

```java
@Test
@DisplayName("Should calculate discount for VIP customer")
void shouldCalculateDiscountForVip() { }

@Test
@DisplayName("Should reject order when customer has insufficient credit")
void shouldRejectOrderForInsufficientCredit() { }
```

### 測試涵蓋順序

始終依此順序建構測試：

1. **主要情境** - 正常路徑（Happy path），最常見的使用案例
2. **其他路徑** - 替代的有效情境、邊緣情況
3. **例外狀況/錯誤** - 無效輸入、錯誤狀況、失敗模式

### 測試正式環境情境

構思測試時請牢記真實的正式環境情境。這使測試更具關聯性，並有助於理解實際正式環境案例中的程式碼行為。

### 測試涵蓋率目標

以 80% 程式碼涵蓋率作為品質與工時之間的實用平衡點。更高的涵蓋率是有益的，但不是唯一的目標。

使用 Jacoco maven 外掛程式進行涵蓋率報告與追蹤。


**涵蓋率規則：**
- 最低 80+% 涵蓋率
- 聚焦於有意義的斷言，而不僅僅是程式碼執行

**優先關注項目：**
1. 業務關鍵路徑（付款處理、訂單驗證）
2. 複雜演算法（定價、折扣計算）
3. 錯誤處理（例外狀況、邊緣情況）
4. 整合點（外部 API、資料庫）

## 相依性（Spring Boot 4）

另請參閱：<https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html> 以及 <https://docs.spring.io/spring-boot/reference/features/dev-services.html>。

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- For WebMvc tests -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webmvc-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- For Testcontainers -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
```
