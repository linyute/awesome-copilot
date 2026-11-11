---
name: spring-boot-4-migration
description: '將 Spring Boot 3.x 應用程式移轉至 Spring Boot 4.0（Spring Framework 7、Jackson 3、模組化 Starter、JSpecify）。僅在明確進行 Boot 3.x 至 4 移轉、修復由其引起的建構或測試失敗，或審查移轉時使用。不適用於 3.x 修補程式版本升級或 4.0 至 4.1 升級；針對這些情況請遵循目標 Boot 版本的版本資訊與升級指南。涵蓋 Maven 與 Gradle（Kotlin DSL、版本目錄）。'
---

# Spring Boot 3.x 至 4.0 移轉

逐步移轉工作流程。主題詳細資訊位於 `references/`；僅載入與目前步驟相關的檔案。

## 規則

- 絕不讀取或列印機密（`.env`、認證資訊、屬性檔案中的權杖）。
- 每個步驟僅變更一件事，並在每個步驟後執行測試套件；切勿認可無法建構的內容。
- 明確釘選版本；切勿使用 `latest` 或開放式範圍。
- 不確定時請檢查官方來源：Spring Boot GitHub wiki 上的 Spring Boot 4.0 移轉指南以及 spring.io 上的版本資訊。

## 工作流程

1. **偵測目前狀態**
   - Boot 版本：`pom.xml`（`spring-boot-starter-parent` / BOM 版本）、`build.gradle(.kts)`（`org.springframework.boot` 外掛程式）或 `gradle/libs.versions.toml`。
   - 建構工具：`pom.xml` + `mvnw` 代表 Maven；`build.gradle.kts` / `build.gradle` 代表 Gradle（Kotlin 或 Groovy DSL）。使用專案包裝函式（`./mvnw`、`./gradlew`）。
   - Java 版本（Boot 4 需要 Java 17+，建議使用 Java 25）、Kotlin 版本，以及重要函式庫（Jackson、Hibernate、Security、Kafka、Elasticsearch、MongoDB）。
   - 請參閱[先決條件](references/01-prerequisites.md)。
2. **先移轉至最新的 3.5.x。** 若專案早於 3.5，先升級至最新的 3.5.x，修復棄用警告，並在接觸 4.0 之前讓測試全部通過。切勿從 3.2 直接跳到 4.0。
3. **基準**：執行完整建構與測試（`./mvnw verify` 或 `./gradlew build`），並記錄移轉前已存在的失敗。
4. **升級至 4.0.x**（parent/BOM 或外掛程式版本），並依此順序修復建構，在每個項目後執行建構：
   1. Starter 與模組：[Starter 與已移除的功能](references/02-starters-and-removed-features.md)。選擇傳統 Starter 或新的模組化 Starter；Boot 4 將自動組態拆分為多個模組，每種技術現在都有自己的 `*-test` starter。
   2. 建構檔案與第三方相依性：[建構與相依性](references/05-build-and-dependencies.md)以及 [Kotlin/Java 建構設定](references/10-kotlin-and-java-build-config.md)。
   3. Jackson 3（新的 `tools.jackson` 套件）：[Jackson 3](references/03-jackson-3.md)。存在臨時的 Jackson 2 相容性模組；計畫將其移除。
   4. 核心框架（JSpecify 可為 null 性、套件重定位、記錄、DevTools、`PropertyMapper`）：[核心框架](references/04-core-framework.md)。
   5. 組態屬性（MongoDB、Spring Session、持久化、Kafka 重試）：[組態屬性](references/06-configuration-properties.md)。暫時加入 `spring-boot-properties-migrator` 以找出重新命名的索引鍵，隨後將其移除。
   6. Web 與傳訊變更（結尾斜線比對、`HttpMessageConverters`、Jersey、Kafka、RabbitMQ）：[Web 與傳訊](references/07-web-and-messaging.md)。
   7. 測試（Mockito/`@MockBean` 替代方案、`@SpringBootTest` 變更、`@PropertyMapping`）：[測試](references/08-testing.md)。
   8. Actuator 與可觀測性模組、健康狀態探針：[Actuator 與可觀測性](references/09-actuator-and-observability.md)。
5. **驗證** 搭配[檢查清單、常見陷阱與資源](references/11-checklist-pitfalls-resources.md)：完整建構、測試、啟動、actuator 健康狀態、主要端點的例行性測試，以及原生映像檔建構（若有使用）。

## 建構工具注意事項

- **Maven**：變更 parent（或 `spring-boot-dependencies` BOM）版本，然後在 `<dependencies>` 中替換 starter。使用 `./mvnw dependency:tree` 找出過時的傳遞性 Jackson 2、Undertow 或 Spring Retry 用法。參考檔案顯示 Gradle 程式碼片段；將座標直接轉譯為 Maven `<dependency>` 項目。
- **Gradle Kotlin DSL**：更新 `plugins {}` 或版本目錄中的外掛程式版本；使用 `./gradlew dependencies --configuration runtimeClasspath` 檢查解析情況。
- 將 Spring Boot 版本保留在單一位置（parent、BOM 屬性或版本目錄項目）。

## 參考檔案

| 檔案 | 主題 |
|---|---|
| [01-prerequisites.md](references/01-prerequisites.md) | 最低版本要求、移轉前步驟 |
| [02-starters-and-removed-features.md](references/02-starters-and-removed-features.md) | 模組化 Starter、重新命名的 Starter、已移除的伺服器/功能 |
| [03-jackson-3.md](references/03-jackson-3.md) | Jackson 3 套件、重新命名、相容性模組 |
| [04-core-framework.md](references/04-core-framework.md) | JSpecify、套件搬移、記錄、DevTools、PropertyMapper |
| [05-build-and-dependencies.md](references/05-build-and-dependencies.md) | Gradle 外掛程式、Spring Retry、Authorization Server、Elasticsearch、Hibernate |
| [06-configuration-properties.md](references/06-configuration-properties.md) | 重新命名與重組的屬性 |
| [07-web-and-messaging.md](references/07-web-and-messaging.md) | Web 框架、Kafka、RabbitMQ 變更 |
| [08-testing.md](references/08-testing.md) | 測試框架變更 |
| [09-actuator-and-observability.md](references/09-actuator-and-observability.md) | Actuator、Micrometer 與 OpenTelemetry 模組 |
| [10-kotlin-and-java-build-config.md](references/10-kotlin-and-java-build-config.md) | Kotlin 編譯器與 Java 預覽功能組態 |
| [11-checklist-pitfalls-resources.md](references/11-checklist-pitfalls-resources.md) | 最終檢查清單、常見陷阱、連結 |

## 自動化

可用時使用 OpenRewrite（`org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0`，<https://docs.openrewrite.org/recipes/java/spring/boot4/upgradespringboot_4_0-community-edition>），檢視 diff，並在編輯前始終取得特定版本的官方指南。

## 上游來源（移轉前必讀）

擷取目標版本的頁面；當它們發生衝突時，以官方頁面為準優先於本技能。

- Boot 4.0 移轉指南：<https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide>
- Boot 4.0 版本資訊：<https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes>
- 升級 Spring Boot（包含 `spring-boot-properties-migrator`）：<https://docs.spring.io/spring-boot/upgrading.html>
- 系統需求：<https://docs.spring.io/spring-boot/system-requirements.html>
- Boot 發行版本：<https://github.com/spring-projects/spring-boot/releases>
- Spring Framework 7：<https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-7.x>、<https://github.com/spring-projects/spring-framework/wiki/What%27s-New-in-Spring-Framework-7.x>
- Spring Security 7：<https://docs.spring.io/spring-security/reference/migration/index.html>
- Spring Data 2025.1：<https://github.com/spring-projects/spring-data-commons/wiki/Spring-Data-2025.1-Release-Notes>
- Spring Batch 6：<https://docs.spring.io/spring-batch/reference/whatsnew.html>
- Hibernate ORM 7：<https://docs.hibernate.org/orm/7.0/migration-guide/>
- Jackson 3：<https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md>
- Micrometer：<https://github.com/micrometer-metrics/micrometer/wiki/Migration-Guide>

對於 Boot 3.x 修補程式版本升級或 Boot 4.0 至 4.1 升級，請直接使用上述官方連結前往目標 Boot 版本的版本資訊與升級指南。這些是相依性升級，不是 JDK 移轉；請勿將它們導向 `java-upgrade`。

相關技能，各自僅在已安裝時使用（否則使用括號中的備用方案）：
- `spring-security`（Security 7 變更）：退回至上述 Spring Security 7 移轉指南。
- `spring-observability`：退回至[Actuator 與可觀測性](references/09-actuator-and-observability.md)以及上述 Micrometer 指南。
- `java-hibernate-jpa`：退回至上述 Hibernate ORM 7 移轉指南。
- `java-upgrade`（僅在明確要求升級 JDK 時）：退回至目標 JDK 的官方移轉指南。
- `java-diagnostics`（執行階段或啟動失敗）：自行閱讀完整堆疊追蹤與 `mvn dependency:tree` / `gradle dependencies` 輸出。
- `java-testcontainers`（Testcontainers 2.0 測試）：請參閱[測試](references/08-testing.md)以及 Testcontainers 2 移轉注意事項。
- `kotlin-springboot`（Kotlin 特性）：請參閱[Kotlin 與 Java 建構組態](references/10-kotlin-and-java-build-config.md)。
