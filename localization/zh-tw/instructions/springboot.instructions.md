---
description: '建立 Spring Boot 基礎應用程式的指南'
applyTo: '**/*.java, **/*.kt'
---

# Spring Boot 開發

## 一般說明

- 在審查程式碼更改時，只提出高度自信的建議。
- 編寫具有良好可維護性實踐的程式碼，包括對某些設計決策原因的註釋。
- 處理邊緣情況並編寫清晰的異常處理。
- 對於函式庫或外部依賴項，在註釋中提及它們的用法和目的。

## Spring Boot 說明

### 依賴注入

- 對於所有必需的依賴項，使用建構函式注入。
- 將依賴項欄位宣告為 `private final`。

### 配置

- 使用 YAML 檔案 (`application.yml`) 進行外部化配置。
- 環境設定檔：為不同的環境 (開發、測試、生產) 使用 Spring 設定檔。
- 配置屬性：使用 @ConfigurationProperties 進行類型安全的配置綁定。
- 密鑰管理：使用環境變數或密鑰管理系統外部化密鑰。

### 程式碼組織

- 套件結構：按功能/領域組織，而不是按層次組織。
- 關注點分離：保持控制器精簡，服務專注，儲存庫簡單。
- 公用程式類別：使公用程式類別為 final 並帶有私有建構函式。

### 服務層

- 將業務邏輯放在 `@Service` 註解的類別中。
- 服務應該是無狀態且可測試的。
- 透過建構函式注入儲存庫。
- 服務方法簽名應使用領域 ID 或 DTO，除非必要，否則不要直接公開儲存庫實體。

### 日誌記錄

- 對於所有日誌記錄，使用 SLF4J (`private static final Logger logger = LoggerFactory.getLogger(MyClass.class);`)。
- 不要直接使用具體實作 (Logback, Log4j2) 或 `System.out.println()`。
- 使用參數化日誌記錄：`logger.info("使用者 {} 已登入", userId);`。

### 安全與輸入處理

- 使用參數化查詢 | 始終使用 Spring Data JPA 或 `NamedParameterJdbcTemplate` 來防止 SQL 注入。
- 使用 JSR-380 (`@NotNull`、`@Size` 等) 註解和 `BindingResult` 驗證請求主體和參數。

## 建構與驗證

- 在添加或修改程式碼後，驗證專案是否繼續成功建構。
- 如果專案使用 Maven，執行 `mvn clean package`。
- 如果專案使用 Gradle，執行 `./gradlew build` (或在 Windows 上執行 `gradlew.bat build`)。
- 確保所有測試作為建構的一部分通過。

## 有用的命令

| Gradle 命令            | Maven 命令                     | 描述                                   |
|:--------------------------|:----------------------------------|:----------------------------------------------|
| `./gradlew bootRun`       |`./mvnw spring-boot:run`           | 執行應用程式。                          |
| `./gradlew build`         |`./mvnw package`                   | 建構應用程式。                        |
| `./gradlew test`          |`./mvnw test`                      | 執行測試。                                    |
| `./gradlew bootJar`       |`./mvnw spring-boot:repackage`     | 將應用程式打包為 JAR。             |
| `./gradlew bootBuildImage`|`./mvnw spring-boot:build-image`   | 將應用程式打包為容器映像。 |
