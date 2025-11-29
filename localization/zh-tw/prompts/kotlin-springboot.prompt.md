---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '取得使用 Spring Boot 與 Kotlin 開發應用程式的最佳實踐。'
---

# Spring Boot 與 Kotlin 最佳實踐

你的目標是協助我撰寫高品質、慣用的 Spring Boot 應用程式（Kotlin）。

## 專案設定與結構

- **建構工具：** 使用 Maven（`pom.xml`）或 Gradle（`build.gradle`），並加上 Kotlin 外掛（`kotlin-maven-plugin` 或 `org.jetbrains.kotlin.jvm`）。
- **Kotlin 外掛：** 若使用 JPA，啟用 `kotlin-jpa` 外掛，可自動將實體類別設為 `open`，無需額外樣板程式碼。
- **Starters：** 如同一般 Spring Boot，使用啟動器（如 `spring-boot-starter-web`、`spring-boot-starter-data-jpa`）。
- **套件結構：** 依功能/領域（如 `com.example.app.order`、`com.example.app.user`）組織程式碼，而非依層次。

## 相依性注入與元件

- **主要建構子：** 必要的相依性注入一律使用主要建構子，這是 Kotlin 最慣用且簡潔的方式。
- **不可變性：** 在主要建構子中宣告相依性為 `private val`。全程優先使用 `val`，以促進不可變性。
- **元件標註：** 如同 Java，使用 `@Service`、`@Repository`、`@RestController` 標註。

## 設定

- **外部化設定：** 使用 `application.yml`，其可讀性高且結構分層。
- **型別安全屬性：** 使用 `@ConfigurationProperties` 搭配 `data class`，建立不可變且型別安全的設定物件。
- **Profiles：** 利用 Spring Profiles（`application-dev.yml`、`application-prod.yml`）管理不同環境設定。
- **機密管理：** 絕不硬編機密。請用環境變數或專用機密管理工具（如 HashiCorp Vault 或 AWS Secrets Manager）。

## Web 層（控制器）

- **RESTful API：** 設計清楚且一致的 RESTful 端點。
- **DTO 請用資料類別：** 所有 DTO 請用 Kotlin `data class`，可自動取得 `equals()`、`hashCode()`、`toString()`、`copy()`，並促進不可變性。
- **驗證：** 使用 Java Bean Validation（JSR 380）標註（`@Valid`、`@NotNull`、`@Size`）於 DTO 資料類別。
- **錯誤處理：** 以 `@ControllerAdvice` 與 `@ExceptionHandler` 實作全域例外處理，統一錯誤回應。

## Service 層

- **商業邏輯：** 以 `@Service` 類別封裝商業邏輯。
- **無狀態：** Service 應保持無狀態。
- **交易管理：** 於 Service 方法加上 `@Transactional`。Kotlin 可用於類別或函式層級。

## 資料層（Repository）

- **JPA 實體：** 實體請用類別定義，且必須設為 `open`。強烈建議用 `kotlin-jpa` 編譯器外掛自動處理。
- **空值安全：** 善用 Kotlin 的空值安全（`?`），於型別層級明確定義欄位是否可選或必填。
- **Spring Data JPA：** 透過繼承 `JpaRepository` 或 `CrudRepository` 使用 Spring Data JPA Repository。
- **協程：** 若為反應式應用，資料層可善用 Spring Boot 對 Kotlin 協程的支援。

## 日誌

- **伴生物件 Logger：** 慣用宣告 Logger 的方式是在 companion object 中。
  ```kotlin
  companion object {
      private val logger = LoggerFactory.getLogger(MyClass::class.java)
  }
  ```
- **參數化日誌：** 使用參數化訊息（`logger.info("Processing user {}...", userId)`），提升效能與可讀性。

## 測試

- **JUnit 5：** JUnit 5 為預設，與 Kotlin 完美整合。
- **慣用測試函式庫：** 建議使用 **Kotest** 進行斷言、**MockK** 進行模擬，語法更適合 Kotlin，且更具表達力。
- **測試切片：** 使用 `@WebMvcTest`、`@DataJpaTest` 等測試切片標註，測試應用程式特定部分。
- **Testcontainers：** 整合測試建議用 Testcontainers，可靠測試真實資料庫、訊息代理等。

## 協程與非同步程式設計

- **`suspend` 函式：** 非阻塞非同步程式碼請用 `suspend` 函式於控制器與 Service。Spring Boot 對協程有極佳支援。
- **結構化平行處理：** 用 `coroutineScope` 或 `supervisorScope` 管理協程生命週期。
