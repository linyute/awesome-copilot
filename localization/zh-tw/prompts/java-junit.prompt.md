---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '取得 JUnit 5 單元測試最佳實踐，包括資料驅動測試'
---

# JUnit 5+ 最佳實踐

你的目標是協助我使用 JUnit 5 撰寫有效的單元測試，涵蓋標準與資料驅動測試方法。

## 專案設定

- 採用標準 Maven 或 Gradle 專案結構。
- 測試原始碼放在 `src/test/java`。
- 需加入 `junit-jupiter-api`、`junit-jupiter-engine`、`junit-jupiter-params` 相依套件以支援參數化測試。
- 使用建置工具指令執行測試：`mvn test` 或 `gradle test`。

## 測試結構

- 測試類別名稱以 `Test` 結尾，例如 `CalculatorTest` 對應 `Calculator` 類別。
- 測試方法加上 `@Test`。
- 遵循 Arrange-Act-Assert（AAA）模式。
- 測試命名建議採用 `methodName_should_expectedBehavior_when_scenario`。
- 使用 `@BeforeEach`、`@AfterEach` 進行每次測試前後的初始化與清理。
- 使用 `@BeforeAll`、`@AfterAll` 進行類別層級初始化與清理（必須為 static 方法）。
- 使用 `@DisplayName` 為測試類別與方法加上易讀名稱。

## 標準測試

- 測試聚焦於單一行為。
- 避免在同一測試方法中測試多個條件。
- 測試需獨立且具冪等性（可任意順序執行）。
- 避免測試間相互依賴。

## 資料驅動（參數化）測試

- 使用 `@ParameterizedTest` 標註參數化測試方法。
- 使用 `@ValueSource` 提供簡單字面值（字串、整數等）。
- 使用 `@MethodSource` 指定工廠方法，提供測試參數（Stream、Collection 等）。
- 使用 `@CsvSource` 提供內嵌逗號分隔值。
- 使用 `@CsvFileSource` 由 classpath 讀取 CSV 檔。
- 使用 `@EnumSource` 提供 enum 常數。

## 斷言

- 使用 `org.junit.jupiter.api.Assertions` 的靜態方法（如 `assertEquals`、`assertTrue`、`assertNotNull`）。
- 若需更流暢可讀的斷言，可考慮 AssertJ（`assertThat(...).is...`）。
- 使用 `assertThrows` 或 `assertDoesNotThrow` 測試例外。
- 相關斷言可用 `assertAll` 群組，確保所有斷言皆執行。
- 斷言建議加上描述性訊息，便於失敗時理解原因。

## 模擬與隔離

- 使用 Mockito 等模擬框架建立相依物件。
- 使用 Mockito 的 `@Mock` 與 `@InjectMocks` 簡化模擬建立與注入。
- 介面設計有助於模擬。

## 測試組織

- 依功能或元件以套件分組測試。
- 使用 `@Tag` 進行分類（如 `@Tag("fast")`、`@Tag("integration")`）。
- 嚴格需要時可用 `@TestMethodOrder(MethodOrderer.OrderAnnotation.class)` 與 `@Order` 控制測試執行順序。
- 使用 `@Disabled` 暫時略過測試方法或類別，並註明原因。
- 使用 `@Nested` 以巢狀類別分組測試，提升組織與結構。
