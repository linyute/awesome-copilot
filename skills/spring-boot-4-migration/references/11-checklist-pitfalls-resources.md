## 移轉檢查清單

### 移轉前

- [ ] 升級至最新的 Spring Boot 3.5.x
- [ ] 檢視並修復所有棄用警告
- [ ] 記錄目前的相依性版本
- [ ] 執行完整測試套件並驗證建構成功
- [ ] 檢視 [Spring Boot 3.5.x → 4.0 相依性變更](https://docs.spring.io/spring-boot/4.0/appendix/dependency-versions/coordinates.html)

### 核心移轉

- [ ] 使用選定的目前 Spring Boot 4.0.x 修補程式更新 `libs.versions.toml`
- [ ] 將 Kotlin 版本更新至 2.2.0+
- [ ] 重新命名 starter：`spring-boot-starter-web` → `spring-boot-starter-webmvc` 等
- [ ] 加入技術專用的測試 starter（或暫時使用傳統 starter）
- [ ] 若存在 Undertow 相依性請將其移除（切換為 Tomcat/Jetty）
- [ ] 移除 `spring-session-hazelcast` / `spring-session-mongodb` 或加入明確版本

### Jackson 3 移轉

- [ ] 更新匯入：`com.fasterxml.jackson` → `tools.jackson`
- [ ] 更新例外：`jackson-annotations` 仍使用 `com.fasterxml.jackson.core`
- [ ] 重新命名：`@JsonComponent` → `@JacksonComponent`
- [ ] 重新命名：`Jackson2ObjectMapperBuilderCustomizer` → `JsonMapperBuilderCustomizer`
- [ ] 對照 Jackson 3 的 `spring.jackson.json.read.*` / `spring.jackson.json.write.*` 功能檢視 Boot 3 `spring.jackson.parser.*` / `spring.jackson.generator.*` 設定；驗證每個功能名稱與行為，而非機械式地替換前綴
- [ ] 分開檢視 databind 設定：`spring.jackson.deserialization.*` / `spring.jackson.serialization.*` 可能移至 `spring.jackson.datatype.enum.*` 或 `spring.jackson.datatype.datetime.*`（請參閱 `03-jackson-3.md`）
- [ ] 若有需要請考慮使用暫時性的 `spring-boot-jackson2` 模組

### 屬性更新

- [ ] MongoDB：`spring.data.mongodb.*` → `spring.mongodb.*`（針對非 Spring Data 屬性）
- [ ] Session：`spring.session.redis.*` → `spring.session.data.redis.*`
- [ ] 持久化：`spring.dao.exceptiontranslation` → `spring.persistence.exceptiontranslation`
- [ ] Kafka 重試：`backoff.random` → `backoff.jitter`

### 程式碼更新

- [ ] 更新套件：`BootstrapRegistry` → `org.springframework.boot.bootstrap.BootstrapRegistry`
- [ ] 更新套件：`EnvironmentPostProcessor` → `org.springframework.boot.EnvironmentPostProcessor`
- [ ] 更新套件：`EntityScan` → `org.springframework.boot.persistence.autoconfigure.EntityScan`
- [ ] 更新：`RestClient` → `Rest5Client`（Elasticsearch）
- [ ] 更新：`StreamsBuilderFactoryBeanCustomizer` → `StreamsBuilderFactoryBeanConfigurer`（Kafka）
- [ ] 拆分：`RabbitRetryTemplateCustomizer` → `RabbitTemplateRetrySettingsCustomizer` / `RabbitListenerRetrySettingsCustomizer`
- [ ] 替代：`HttpMessageConverters` → `ClientHttpMessageConvertersCustomizer` / `ServerHttpMessageConvertersCustomizer`
- [ ] 更新：若需要 null 處理，使用帶有 `.always()` 的 `PropertyMapper`

### 測試更新

- [ ] 為使用 `@Mock` / `@Captor` 的測試加入 `@ExtendWith(MockitoExtension::class)`
- [ ] 為使用 `MockMvc` 的測試加入 `@AutoConfigureMockMvc`
- [ ] 為使用 `WebTestClient` 的測試加入 `@AutoConfigureWebTestClient`
- [ ] 移轉 `TestRestTemplate` → `RestTestClient`（或加入 `@AutoConfigureTestRestTemplate`）
- [ ] 更新：`@PropertyMapping` 匯入 → `org.springframework.boot.test.context`

### 建構組態

- [ ] 將 Gradle 更新至 8.14+
- [ ] 將 Gradle CycloneDX 外掛程式更新至 3.0.0+
- [ ] 檢視 uber jar 中的選填相依性包含情況
- [ ] 若存在請移除 `loaderImplementation = CLASSIC`
- [ ] 若存在請移除 `launchScript()` 組態

### 驗證

- [ ] 執行 `./gradlew clean build`
- [ ] 執行完整測試套件
- [ ] 透過 TestContainers 驗證整合測試
- [ ] 檢查是否有新的 Kotlin null 安全性警告
- [ ] 測試 Spring Boot Actuator 端點
- [ ] 驗證健康狀態探針（`/actuator/health/liveness`、`/actuator/health/readiness`）
- [ ] 針對新預設值進行效能測試

### 移轉後

- [ ] 檢視 Spring Boot 4.0 版本資訊以獲取其他功能
- [ ] 考慮採用新的 Spring Framework 7.0 功能
- [ ] 規劃從傳統 starter 移轉出去（若有使用）
- [ ] 規劃從 `spring-boot-jackson2` 模組移轉出去（若有使用）
- [ ] 針對 Java 17+ 要求更新 CI/CD 管線
- [ ] 更新部署資訊清單（Servlet 6.1 容器）

## 常見陷阱

1. **傳統 Starter**：記住這些已棄用 - 請規劃向技術專用 starter 進行移轉
2. **Undertow**：已完全移除，無法規避 - 必須使用 Tomcat 或 Jetty
3. **Jackson 3 套件**：容易遺漏 `jackson-annotations` 仍使用舊的 group ID
4. **MongoDB 屬性**：許多已移至 `spring.mongodb.*`，但部分仍留在 `spring.data.mongodb.*`
5. **測試組態**：`@SpringBootTest` 不再自動設定 MockMVC/WebTestClient/TestRestTemplate
6. **Kotlin 2.2**：最低要求 - 舊版本無法運作
7. **Null 安全性**：JSpecify 註釋可能會在 Kotlin 中浮現新警告
8. **PropertyMapper**：null 處理行為發生變更 - 請檢視用法
9. **Jersey + Jackson 3**：不相容 - 請使用 `spring-boot-jackson2` 模組
10. **健康狀態探針**：現在預設啟用 - 可能會影響非 Kubernetes 部署

## 效能考量

- **模組化 Starter**：技術專用 starter 帶來更小的 JAR 與更快的啟動速度
- **Spring Framework 7**：核心框架的效能改善
- **Jackson 3**：改進的 JSON 處理效能
- **虛擬執行緒**：考慮在 Java 21+ 下啟用（`spring.threads.virtual.enabled=true`）

## 資源

- [Spring Boot 4.0 移轉指南](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Spring Boot 4.0 版本資訊](https://github.com/spring-projects/spring-boot/releases)
- [Spring Framework 7.0 文件](https://docs.spring.io/spring-framework/reference/)
- [Jackson 3 移轉指南](https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md)
- [Kotlin 2.2 版本資訊](https://kotlinlang.org/docs/whatsnew22.html)


