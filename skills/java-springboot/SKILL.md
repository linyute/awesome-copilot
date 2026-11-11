---
name: java-springboot
description: '在現有 Spring Boot 3/4 專案中撰寫與審查應用程式程式碼：控制器、驗證與 ProblemDetail 錯誤處理、Spring Data JPA/JDBC、RestClient 與 HTTP 介面、設定屬性、Kafka/AMQP、快取、排程、虛擬執行緒、AOT 與啟動調校。在新增或變更功能時使用。若要建立新專案鷹架，請改用 create-spring-boot-java-project。'
---

# Spring Boot 應用程式開發

具主見的規則以及深入參考文件的路由指引。參考文件中的程式碼範例已在 Spring Boot 4.1.1（Spring Framework 7）上編譯並執行，且在有所差異處亦於 Boot 3.5.16（Framework 6.2）上驗證。Boot 3 與 4 的差異在各參考文件中標註為「Boot 3」/「Boot 4」。

## 撰寫程式碼之前

1. **進行偵測，切勿假設：** 閱讀 `pom.xml`/`build.gradle(.kts)` 以了解 Spring Boot 版本、Java 版本、使用中的 starter（`spring-boot-starter-web` 適用於 Boot 3，`spring-boot-starter-webmvc` 適用於 Boot 4）、持續性架構（JPA、JDBC）、資料庫遷移工具、測試設定，以及現有程式碼的套件結構與命名慣例。請與其保持一致。
2. **切勿隱式升級 Spring Boot、Java 或依賴項。** 從 Boot 3 升級至 4 屬於審慎評估的獨立工作（`spring-boot-4-migration`）。
3. **新增基礎架構前請先詢問：** 訊息代理程式（Kafka、RabbitMQ）、快取提供者、新資料庫，或排程器/非同步設定。僅新增使用者要求的項目，並使用 Boot 管理的版本（BOM 管理的 artifacts 不指定明確版本，切勿使用 `latest`）。
4. **使用專案自身的建構驗證每項變更：** 執行 `./mvnw verify` 或 `./gradlew build`（若無 wrapper 則使用一般的 `mvn`/`gradle`）。當整合測試使用 Testcontainers 時需要 Docker。

## 路由指引

| 任務 | 閱讀內容 |
| --- | --- |
| 存放庫、投影、分頁、N+1、`@Transactional`、稽核、Flyway/Liquibase、Spring Data JDBC | `references/data.md` |
| 控制器、驗證、`ProblemDetail`、`RestClient`、`@HttpExchange`、API 版本控制、OpenAPI、JSpecify | `references/rest-api.md` |
| Kafka/AMQP、`@Cacheable`/Caffeine、`@Scheduled`、`@Async`、虛擬執行緒、outbox | `references/messaging-caching.md` |
| `@ConfigurationProperties`、設定檔 profile、密碼密鑰、設定匯入、開發時期 Docker Compose / Testcontainers | `references/configuration.md` |
| AOT、CDS/AppCDS、延遲初始化、原生映像檔（Native Image） | `references/aot-and-startup.md` |

若已安裝這些獨立技能，亦可針對其主題使用：否則請依賴官方文件：`java-hibernate-jpa`（JPA 映射）、`spring-boot-testing`（測試）、`spring-security`（身分驗證、授權、CSRF/CORS）、`spring-observability`（度量指標、追蹤、Actuator、記錄）、`create-spring-boot-java-project`（專案預設值、Boot 3 對比 4 建構變更）、`java-add-graalvm-native-image-support`（原生執行檔）。

## 核心規則

- **結構與分層：** 依功能組織套件；建構子注入；控制器回傳 DTO/record，切勿回傳實體；服務層擁有交易權限。
- **驗證與錯誤：** 在請求 record 上使用 Bean Validation 搭配 `@Valid`；使用單一 `@RestControllerAdvice` 回傳 `ProblemDetail`。JSpecify 標註僅用於說明可為 null 性，不進行驗證。
- **Jackson：** Boot 4 使用 Jackson 3（`tools.jackson.databind.*`、`JsonMapper`；標註保留在 `com.fasterxml.jackson.annotation`）；Boot 3 使用 Jackson 2（`com.fasterxml.jackson.databind.*`、`ObjectMapper`）。
- **切片測試注意事項：** 將 `@EnableJpaAuditing`、`@EnableCaching`、`@EnableAsync`、`@EnableScheduling` 放在專屬的 `@Configuration` 類別上，而非放在 `@SpringBootApplication` 類別上，否則像 `@DataJpaTest` 這類切片會啟動失敗（例如找不到 `CacheManager`）。切片不會掃描 `@Configuration` 類別：請使用 `@Import` 匯入測試所需的類別。
- **代理的 Bean：** `@Cacheable`、`@Async` 與 `@Transactional` 透過代理運作：自我呼叫或在 `private`/`final` 方法上呼叫均無效；請透過注入的 bean 進行測試。

## 檢查清單

- [ ] 已偵測版本、建構工具與慣例；starter 符合 Boot 主要版本
- [ ] 未經使用者同意不新增基礎架構或依賴項
- [ ] `./mvnw verify` / `./gradlew build` 通過；程式碼、屬性與記錄中無機密資訊

另請參閱：Spring Boot 參考文件 <https://docs.spring.io/spring-boot/reference/>、Spring Framework 參考文件 <https://docs.spring.io/spring-framework/reference/>、Spring Data <https://docs.spring.io/spring-data/commons/reference/>。
