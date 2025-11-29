---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '取得 Spring Boot 應用程式開發最佳實踐。'
---

# Spring Boot 最佳實踐

你的目標是協助我依循最佳實踐撰寫高品質 Spring Boot 應用程式。

## 專案設定與結構

- **建置工具：** 使用 Maven（`pom.xml`）或 Gradle（`build.gradle`）管理相依套件。
- **Starters：** 使用 Spring Boot starters（如 `spring-boot-starter-web`、`spring-boot-starter-data-jpa`）簡化相依管理。
- **套件結構：** 依功能/領域組織程式碼（如 `com.example.app.order`、`com.example.app.user`），而非依層（如 `com.example.app.controller`、`com.example.app.service`）。

## 相依性注入與元件

- **建構式注入：** 必要相依一律採用建構式注入，方便測試且依賴明確。
- **不可變性：** 相依欄位宣告為 `private final`。
- **元件標註：** 適當使用 `@Component`、`@Service`、`@Repository`、`@Controller`/`@RestController` 標註 bean。

## 組態

- **外部化組態：** 使用 `application.yml`（或 `application.properties`）管理組態。YAML 結構清晰且易讀。
- **型別安全屬性：** 使用 `@ConfigurationProperties` 綁定組態至強型別物件。
- **Profiles：** 以 Spring Profiles（`application-dev.yml`、`application-prod.yml`）管理環境專屬組態。
- **機密管理：** 不可硬編碼機密。建議用環境變數或專用機密管理工具（如 HashiCorp Vault、AWS Secrets Manager）。

## Web 層（控制器）

- **RESTful API：** 設計清晰一致的 RESTful 端點。
- **DTO（資料傳輸物件）：** API 層使用 DTO 傳遞資料，不直接暴露 JPA 實體給前端。
- **驗證：** 使用 Java Bean Validation（JSR 380）註解（`@Valid`、`@NotNull`、`@Size`）驗證請求資料。
- **錯誤處理：** 以 `@ControllerAdvice` 與 `@ExceptionHandler` 實作全域例外處理，統一錯誤回應。

## Service 層

- **商業邏輯：** 所有商業邏輯皆封裝於 `@Service` 類別。
- **無狀態性：** Service 類別應無狀態。
- **交易管理：** 以 `@Transactional` 標註 service 方法，宣告式管理資料庫交易，並以最細粒度為原則。

## 資料層（Repository）

- **Spring Data JPA：** 標準資料庫操作建議繼承 `JpaRepository` 或 `CrudRepository`。
- **自訂查詢：** 複雜查詢可用 `@Query` 或 JPA Criteria API。
- **投影：** 使用 DTO 投影僅取所需資料。

## 記錄

- **SLF4J：** 使用 SLF4J API 記錄。
- **Logger 宣告：** `private static final Logger logger = LoggerFactory.getLogger(MyClass.class);`
- **參數化記錄：** 記錄訊息建議用參數化（`logger.info("處理使用者 {}...", userId);`），避免字串串接以提升效能。

## 測試

- **單元測試：** 服務與元件建議用 JUnit 5 搭配 Mockito 撰寫單元測試。
- **整合測試：** 使用 `@SpringBootTest` 進行整合測試，載入 Spring 應用程式內容。
- **測試切片：** 依測試目標使用 `@WebMvcTest`（控制器）或 `@DataJpaTest`（Repository）等切片註解。
- **Testcontainers：** 建議用 Testcontainers 進行可靠的整合測試（真實資料庫、訊息代理等）。

## 安全性

- **Spring Security：** 使用 Spring Security 處理認證與授權。
- **密碼編碼：** 密碼一律採用強雜湊演算法（如 BCrypt）編碼。
- **輸入清理：** SQL 注入防範建議用 Spring Data JPA 或參數化查詢。XSS 防範則需正確編碼輸出。
