---
description: '建構 Spring Boot 基礎應用程式的指引'
applyTo: '**/*.java'
---

# Spring Boot 開發

僅在專案使用 Spring Boot 時套用這些指示。若為 Kotlin 專案，請參閱 `kotlin-springboot`。

## 一般指示

- 審查程式碼變更時，僅提出具高信賴度的建議。
- 編寫具備良好可維護性實踐的程式碼，包括說明為何做出特定設計決策的註解。
- 處理邊界案例並編寫清楚的例外狀況處理。
- 對於函式庫或外部相依性，請在註解中提及它們的用法與目的。

## Spring Boot 指示

### 相依性插入

- 對所有必要相依性使用建構函式插入。
- 將相依性欄位宣告為 `private final`。

### 組態

- 使用 `application.properties` 或 `application.yml` 進行外部化組態，與專案已使用的格式保持一致。
- 環境設定檔（Profiles）：針對不同環境（dev、test、prod）使用 Spring profiles
- 組態屬性：使用 @ConfigurationProperties 進行型別安全的組態繫結
- 機密管理：使用環境變數或機密管理系統外部化機密資訊

### 程式碼組織

- 套件結構：依功能/領域組織，而非依架構分層
- 關注點分離：保持 controller 精簡、service 專注、repository 簡潔
- 工具類別：將工具類別設為 final 並使用 private 建構函式

### 服務層

- 將商務邏輯置於帶有 `@Service` 註釋的類別中。
- 服務應為無狀態且可測試。
- 透過建構函式插入 repository。
- 服務方法簽章應使用領域識別碼（ID）或 DTO，除非必要，否則不要直接公開 repository 實體。

### 記錄

- 所有記錄均使用 SLF4J（`private static final Logger logger = LoggerFactory.getLogger(MyClass.class);`）。
- 請勿直接使用具體實作（Logback、Log4j2）或 `System.out.println()`。
- 使用參數化記錄：`logger.info("User {} logged in", userId);`。

### 安全性與輸入處理

- 使用參數化查詢 | 始終使用 Spring Data JPA 或 `NamedParameterJdbcTemplate` 以防止 SQL 隱碼攻擊。
- 使用 Bean Validation（`@Valid`、`@NotNull`、`@Size` 等）註釋驗證請求本文與參數，並在 `@RestControllerAdvice` 中處理 `MethodArgumentNotValidException`

## 建構與驗證

- 新增或修改程式碼後，驗證專案是否能繼續建構成功。
- 若專案使用 Maven，請執行 `./mvnw verify`（使用 wrapper）。`package` 會略過 Failsafe 整合測試（`*IT`）。
- 若專案使用 Gradle，請執行 `./gradlew build`（或在 Windows 上執行 `gradlew.bat build`）。
- 確保所有測試皆作為建構的一部分通過。
- 僅將 `package` 或 `test` 作為專注、更快速的指令，而非作為驗證關卡。

## 實用指令

| Gradle 指令               | Maven 指令                        | 說明                                          |
|:--------------------------|:----------------------------------|:----------------------------------------------|
| `./gradlew bootRun`       |`./mvnw spring-boot:run`           | 執行應用程式。                                |
| `./gradlew build`         |`./mvnw verify`                    | 建構並執行所有測試。                          |
| `./gradlew test`          |`./mvnw test`                      | 執行測試。                                    |
| `./gradlew bootJar`       |`./mvnw spring-boot:repackage`     | 將應用程式封裝為 JAR。                        |
| `./gradlew bootBuildImage`|`./mvnw spring-boot:build-image`   | 將應用程式封裝為容器映像檔。                  |