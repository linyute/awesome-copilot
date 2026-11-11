# 組態

## 格式

使用 `application.properties` 或 `application.yml`，**必須與專案既有使用者一致**。由 start.spring.io 產生的新專案會取得 `application.properties`；YAML 適用於深度巢狀的設定。請勿在同一個專案中混用兩者。

## 設定檔（Profiles）

```properties
# application.properties（共用預設值）
spring.application.name=demo
spring.jpa.open-in-view=false
server.shutdown=graceful
```

- `application-dev.properties`、`application-prod.properties`，透過 `SPRING_PROFILES_ACTIVE`（環境變數）或 `--spring.profiles.active` 啟用。
- 在基底檔案中保留適用於正式環境（prod-safe）的數值；僅在 dev 中覆寫不同之處（例如 `logging.level.com.example=DEBUG`）。
- 測試：使用 `src/test/resources/application.properties` 或 `@TestPropertySource`，而非將 "test" profile 提交至 `main`。

## 外部化數值與機密

- 從環境變數讀取數值，並為本機開發提供預設值：`spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/mydb}`。
- Spring Boot 也會自動將 `SPRING_DATASOURCE_URL` 對應至 `spring.datasource.url`（寬鬆繫結，relaxed binding）。
- 若使用本機 `.env` 檔案：`spring.config.import=optional:file:.env[.properties]`。將 `.env` 加入至 `.gitignore`；提交帶有預留位置數值的 `.env.sample`。
- 絕不提交密碼、權杖或 API 金鑰。在正式環境中，使用平台的機密存放區（Kubernetes secrets、Vault、雲端金鑰保存庫），並公開為環境變數或組態樹狀結構（`spring.config.import=configtree:/run/secrets/`）。

## 型別安全屬性

```java
@ConfigurationProperties(prefix = "app.mail")
@Validated
public record MailProperties(@NotBlank String from, @Positive int retries) {}
```

在應用程式類別上使用 `@ConfigurationPropertiesScan`（或 `@EnableConfigurationProperties`）啟用。優先使用此方式，而非分散各處的 `@Value`。Spring Boot 的註解處理器（`spring-boot-configuration-processor`，選用相依性）會產生 IDE metadata。

## 檢查清單

- [ ] 一致使用單一格式（properties 或 YAML）
- [ ] 存放庫中無機密資訊
- [ ] 預設值可於本機運作；正式環境數值來自環境變數
- [ ] 自訂設定採用具備驗證機制的 `@ConfigurationProperties`
