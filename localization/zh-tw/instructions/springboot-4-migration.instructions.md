---
description: "將 Spring Boot 應用程式從 3.x 遷移到 4.0 的全面指南，重點關注 Gradle Kotlin DSL 和版本目錄"
applyTo: "**/*.java, **/*.kt, **/build.gradle.kts, **/build.gradle, **/settings.gradle.kts, **/gradle/libs.versions.toml, **/*.properties, **/*.yml, **/*.yaml"
---

# Spring Boot 3.x 到 4.0 遷移指南

## 專案情境

本指南提供全面的 GitHub Copilot 指令，用於將 Spring Boot 專案從 3.x 版升級到 4.0 版，重點關注 Gradle Kotlin DSL、版本目錄（`libs.versions.toml`）和 Kotlin 特定的考量。

**Spring Boot 4.0 中的主要架構變更：**
- 模組化依賴項結構，具有更專注、更小的模組
- 需要 Spring Framework 7.x
- Jakarta EE 11 (Servlet 6.1 基準)
- Jackson 3.x 遷移 (套件命名空間變更)
- Kotlin 2.2+ 要求
- 全面的屬性重組

## 系統要求

### 最低版本

- **Java**：17+ (優先選擇最新的 LTS：Java 21 或 25)
- **Kotlin**：2.2.0 或更高版本
- **Spring Framework**：7.x (由 Spring Boot 4.0 管理)
- **Jakarta EE**：11 (Servlet 6.1 基準)
- **GraalVM** (用於原生映像)：25+
- **Gradle**：8.5+ (用於 Kotlin DSL 和版本目錄支援)
- **Gradle CycloneDX 套件**：3.0.0+

### 驗證相容性

```bash
# 檢查目前版本
./gradlew --version
./gradlew dependencies --configuration runtimeClasspath
```

## 遷移前步驟

### 1. 升級到最新的 Spring Boot 3.5.x

在遷移到 4.0 之前，請升級到最新的 3.5.x 版本：

```kotlin
// libs.versions.toml
[versions]
springBoot = "3.5.6" # 遷移到 4.0 之前的最新 3.x
```

### 2. 清理棄用

移除 Spring Boot 3.x 中所有棄用的 API 使用。這些在 4.0 中將是編譯錯誤：

```bash
# 建構並檢視警告
./gradlew clean build --warning-mode all
```

### 3. 檢閱依賴項變更

比較您的依賴項與：
- [Spring Boot 3.5.x 依賴項版本](https://docs.spring.io/spring-boot/3.5/appendix/dependency-versions/coordinates.html)
- [Spring Boot 4.0.x 依賴項版本](https://docs.spring.io/spring-boot/4.0/appendix/dependency-versions/coordinates.html)

## 模組重組和啟動器變更

### 關鍵：模組化架構

Spring Boot 4.0 引入了**更小、更專注的模組**，取代了大型的單體 jar。這要求大多數專案中的依賴項更新。

**對於函式庫作者而言重要：** 由於模組化工作和套件重組，**強烈不建議在同一個 Artifact 中同時支援 Spring Boot 3 和 Spring Boot 4**。函式庫作者應為每個主要版本發布單獨的 Artifact，以避免運行時衝突並確保清晰的依賴項管理。

### 遷移策略：選擇一種方法

#### 選項 1：技術特定的啟動器 (建議用於生產)

Spring Boot 涵蓋的大多數技術現在都具有**專用的測試啟動器伴侶**。這提供了精細的控制。

**完整啟動器參考：** 有關所有可用啟動器（核心、Web、資料庫、Spring Data、訊息、安全性、範本、生產就緒等）及其測試伴侶的綜合表格，請參閱 [官方 Spring Boot 4.0 遷移指南](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide#starters)。

**libs.versions.toml：**
```toml
[versions]
springBoot = "4.0.0"

[libraries]
# 具有專用測試模組的核心啟動器
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-webmvc", version.ref = "springBoot" }
spring-boot-starter-webmvc-test = { module = "org.springframework.boot:spring-boot-starter-webmvc-test", version.ref = "springBoot" }

spring-boot-starter-data-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa", version.ref = "springBoot" }
spring-boot-starter-data-jpa-test = { module = "org.springframework.boot:spring-boot-starter-data-jpa-test", version.ref = "springBoot" }

spring-boot-starter-security = { module = "org.springframework.boot:spring-boot-starter-security", version.ref = "springBoot" }
spring-boot-starter-security-test = { module = "org.springframework.boot:spring-boot-starter-security-test", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.webmvc)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.security)

    testImplementation(libs.spring.boot.starter.webmvc.test)
    testImplementation(libs.spring.boot.starter.data.jpa.test)
    testImplementation(libs.spring.boot.starter.security.test)
}
```

#### 選項 2：經典啟動器 (快速遷移，已棄用)

為了快速遷移，請使用**經典啟動器**，它捆綁了所有自動配置（如 Spring Boot 3.x）：

**libs.versions.toml：**
```toml
[libraries]
spring-boot-starter-classic = { module = "org.springframework.boot:spring-boot-starter-classic", version.ref = "springBoot" }
spring-boot-starter-test-classic = { module = "org.springframework.boot:spring-boot-starter-test-classic", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.classic)
    testImplementation(libs.spring.boot.starter.test.classic)
}
```

**警告**：經典啟動器**已棄用**，並將在未來版本中移除。請規劃遷移到技術特定的啟動器。

#### 選項 3：直接模組依賴項 (進階)

用於對傳輸依賴項進行明確控制：

**libs.versions.toml：**
```toml
[libraries]
spring-boot-webmvc = { module = "org.springframework.boot:spring-boot-webmvc", version.ref = "springBoot" }
spring-boot-webmvc-test = { module = "org.springframework.boot:spring-boot-webmvc-test", version.ref = "springBoot" }
```

### 已重新命名的啟動器 (重大變更)

在您的 `libs.versions.toml` 中更新這些啟動器名稱：

| Spring Boot 3.x | Spring Boot 4.0 | 備註 |
|----------------|-----------------|-------|
| `spring-boot-starter-web` | `spring-boot-starter-webmvc` | 明確命名 |
| `spring-boot-starter-web-services` | `spring-boot-starter-webservices` | 移除連字號 |
| `spring-boot-starter-aop` | `spring-boot-starter-aspectj` | 僅在使用 `org.aspectj.lang.annotation` 時才需要 |
| `spring-boot-starter-oauth2-authorization-server` | `spring-boot-starter-security-oauth2-authorization-server` | 安全性命名空間 |
| `spring-boot-starter-oauth2-client` | `spring-boot-starter-security-oauth2-client` | 安全性命名空間 |
| `spring-boot-starter-oauth2-resource-server` | `spring-boot-starter-security-oauth2-resource-server` | 安全性命名空間 |

**遷移範例 (libs.versions.toml)：**
```toml
[libraries]
# 舊版 (Spring Boot 3.x)
# spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "springBoot" }
# spring-boot-starter-oauth2-client = { module = "org.springframework.boot:spring-boot-starter-oauth2-client", version.ref = "springBoot" }

# 新版 (Spring Boot 4.0)
spring-boot-starter-webmvc = { module = "org.springframework.boot:spring-boot-starter-webmvc", version.ref = "springBoot" }
spring-boot-starter-security-oauth2-client = { module = "org.springframework.boot:spring-boot-starter-security-oauth2-client", version.ref = "springBoot" }
```

### AspectJ 啟動器澄清

僅在您**實際使用 AspectJ 註釋**時才包含 `spring-boot-starter-aspectj`：

```kotlin
// 僅當程式碼使用 org.aspectj.lang.annotation 套件時才需要
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Before

@Aspect
class MyAspect {
    @Before("execution(* com.example..*(..))")
    fun beforeAdvice() { }
}
```

如果不使用 AspectJ，請移除該依賴項。

## 已移除的功能和替代方案

### 嵌入式伺服器

#### Undertow 已移除

**Undertow 已完全移除** - 與 Servlet 6.1 基準不相容。

**遷移：**
- 使用 **Tomcat** (預設) 或 **Jetty**
- **不要**將 Spring Boot 4.0 應用程式部署到非 Servlet 6.1 容器

**libs.versions.toml：**
```toml
[libraries]
# 移除 Undertow
# spring-boot-starter-undertow = { module = "org.springframework.boot:spring-boot-starter-undertow", version.ref = "springBoot" }

# 使用 Tomcat (預設) 或 Jetty
spring-boot-starter-jetty = { module = "org.springframework.boot:spring-boot-starter-jetty", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.webmvc) {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-tomcat")
    }
    implementation(libs.spring.boot.starter.jetty) // Tomcat 的替代方案
}
```

### 會話管理

#### Spring 會話 Hazelcast 和 MongoDB 已移除

**由各自的團隊維護**，不再是 Spring Boot 依賴項管理的一部分。

**遷移 (libs.versions.toml)：**
```toml
[versions]
hazelcast-spring-session = "3.x.x" # 檢查 Hazelcast 文件
mongodb-spring-session = "4.x.x"   # 檢查 MongoDB 文件

[libraries]
# 需要明確版本
spring-session-hazelcast = { module = "com.hazelcast:spring-session-hazelcast", version.ref = "hazelcast-spring-session" }
spring-session-mongodb = { module = "org.springframework.session:spring-session-data-mongodb", version.ref = "mongodb-spring-session" }
```

### 反應式訊息

#### Pulsar 反應式已移除

Spring Pulsar 移除了 Reactor 支援 - 反應式 Pulsar 用戶端已移除。

**遷移：**
- 使用命令式 Pulsar 用戶端
- 或遷移到替代的反應式訊息傳遞（Kafka、RabbitMQ）

### 測試

#### Spock 框架已移除

**Spock 尚不支援 Groovy 5** (Spring Boot 4.0 所需)。

**遷移：**
- 使用 JUnit 5 和 Kotlin
- 或等待 Spock Groovy 5 相容性

### 建構功能

#### 可執行 Jar 啟動腳本已移除

已移除用於「完全可執行」jar 的嵌入式啟動腳本 (Unix 特有，使用有限)。

**build.gradle.kts (移除)：**
```kotlin
// 移除此配置
tasks.bootJar {
    launchScript() // 不再支援
}
```

**替代方案：**
- 直接使用 `java -jar app.jar`
- 使用 Gradle Application 套件進行原生啟動器
- 使用 systemd 服務檔案

#### 經典 Uber-Jar 載入器已移除

經典 uber-jar 載入器已移除。請從您的建構中移除任何載入器實作配置。

**Maven (pom.xml) - 移除：**
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <loaderImplementation>CLASSIC</loaderImplementation> <!-- 移除此行 -->
            </configuration>
        </plugin>
    </plugins>
</build>
```

**Gradle (build.gradle.kts) - 移除：**
```kotlin
tasks.bootJar {
    loaderImplementation = org.springframework.boot.loader.tools.LoaderImplementation.CLASSIC // 移除此行
}
```

## Jackson 3 遷移

### 主要重大變更：套件命名空間

Jackson 3 變更了**群組 ID 和套件名稱**：

| 元件 | 舊版 (Jackson 2) | 新版 (Jackson 3) |
|-----------|----------------|-----------------|
| 群組 ID | `com.fasterxml.jackson` | `tools.jackson` |
| 套件 | `com.fasterxml.jackson.*` | `tools.jackson.*` |
| 例外 | `jackson-annotations` | 仍然使用 `com.fasterxml.jackson.core` 群組 |

**libs.versions.toml：**
```toml
[versions]
jackson = "3.0.1" # 由 Spring Boot 4.0 管理

[libraries]
# Jackson 3 使用新的群組 ID
jackson-databind = { module = "tools.jackson.core:jackson-databind", version.ref = "jackson" }
jackson-module-kotlin = { module = "tools.jackson.module:jackson-module-kotlin", version.ref = "jackson" }

# 例外：annotations 仍然使用舊群組
jackson-annotations = { module = "com.fasterxml.jackson.core:jackson-annotations", version.ref = "jackson" }
```

### 類別和註釋重新命名

更新匯入和註釋：

| Spring Boot 3.x | Spring Boot 4.0 |
|----------------|-----------------|
| `Jackson2ObjectMapperBuilderCustomizer` | `JsonMapperBuilderCustomizer` |
| `JsonObjectSerializer` | `ObjectValueSerializer` |
| `JsonValueDeserializer` | `ObjectValueDeserializer` |
| `@JsonComponent` | `@JacksonComponent` |
| `@JsonMixin` | `@JacksonMixin` |

**遷移範例：**
```kotlin
// 舊版 (Spring Boot 3.x)
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer
import org.springframework.boot.jackson.JsonComponent

@JsonComponent
class CustomSerializer : JsonSerializer<MyType>() { }

@Configuration
class JacksonConfig {
    @Bean
    fun customizer(): Jackson2ObjectMapperBuilderCustomizer {
        return Jackson2ObjectMapperBuilderCustomizer { builder ->
            builder.simpleDateFormat("yyyy-MM-dd")
        }
    }
}

// 新版 (Spring Boot 4.0)
import tools.jackson.databind.ObjectMapper
import org.springframework.boot.autoconfigure.jackson.JsonMapperBuilderCustomizer
import org.springframework.boot.jackson.JacksonComponent

@JacksonComponent
class CustomSerializer : JsonSerializer<MyType>() { }

@Configuration
class JacksonConfig {
    @Bean
    fun customizer(): JsonMapperBuilderCustomizer {
        return JsonMapperBuilderCustomizer { builder ->
            builder.simpleDateFormat("yyyy-MM-dd")
        }
    }
}
```

### 配置屬性變更

**application.yml 遷移：**
```yaml
# 舊版 (Spring Boot 3.x)
spring:
  jackson:
    read:
      enums-using-to-string: true
    write:
      dates-as-timestamps: false

# 新版 (Spring Boot 4.0)
spring:
  jackson:
    json:
      read:
        enums-using-to-string: true
      write:
        dates-as-timestamps: false
```

### Jackson 2 相容性模組 (暫時性)

為了逐步遷移，請使用**暫時性相容性模組** (已棄用，將會移除)：

**libs.versions.toml：**
```toml
[libraries]
spring-boot-jackson2 = { module = "org.springframework.boot:spring-boot-jackson2", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.jackson2)
}
```

**application.yml：**
```yaml
spring:
  jackson:
    use-jackson2-defaults: true # 使用 Jackson 2 行為
```

使用相容性模組時，**屬性在 `spring.jackson2.*` 命名空間下**。

**規劃從此模組遷移** - 它將在未來版本中移除。

## 核心框架變更

### 可空性註釋：JSpecify

Spring Boot 4.0 在整個程式碼庫中添加了 **JSpecify 可空性註釋**。

**影響：**
- Kotlin 空安全可能標記新的警告/錯誤
- 空檢查器 (SpotBugs、NullAway) 可能報告新的問題
- **RestClient 方法如 `body()` 現在明確標記為可空** - 始終檢查是否為空或使用 `Objects.requireNonNull()`

**Kotlin 的遷移：**
```kotlin
// 可能需要明確的可空類型
fun processUser(id: String?): User? {
    return userRepository.findById(id) // 現在可能明確可空
}

// RestClient body() 可以回傳 null
val body: String? = restClient.get()
    .uri("https://api.example.com/data")
    .retrieve()
    .body(String::class.java) // 可空 - 適當處理

if (body != null) {
    println(body.length)
}
```

**Actuator 端點參數：**
- 不能使用 `javax.annotations.NonNull` 或 `org.springframework.lang.Nullable`
- 改用 `org.jspecify.annotations.Nullable`

**libs.versions.toml：**
```toml
[libraries]
jspecify = { module = "org.jspecify:jspecify", version = "1.0.0" }
```

### 套件重新定位

#### BootstrapRegistry

**舊版匯入：**
```kotlin
import org.springframework.boot.BootstrapRegistry
```

**新版匯入：**
```kotlin
import org.springframework.boot.bootstrap.BootstrapRegistry
```

#### EnvironmentPostProcessor

**舊版匯入：**
```kotlin
import org.springframework.boot.env.EnvironmentPostProcessor
```

**新版匯入：**
```kotlin
import org.springframework.boot.EnvironmentPostProcessor
```

**更新 `META-INF/spring.factories`：**
```properties
# 舊版
org.springframework.boot.env.EnvironmentPostProcessor=com.example.MyPostProcessor

# 新版
org.springframework.boot.EnvironmentPostProcessor=com.example.MyPostProcessor
```

**注意：** 棄用形式仍然暫時可用，但將會移除。

#### Entity Scan

**舊版匯入：**
```kotlin
import org.springframework.boot.autoconfigure.domain.EntityScan
```

**新版匯入：**
```kotlin
import org.springframework.boot.persistence.autoconfigure.EntityScan
```

### 日誌變更

#### Logback 預設字元集

日誌檔案現在預設為 **UTF-8** (與 Log4j2 協調一致)：

**logback-spring.xml (明確配置)：**
```xml
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>app.log</file>
        <encoder>
            <charset>UTF-8</charset> <!-- 現在為預設 -->
            <pattern>%d{yyyy-MM-dd HH:mm:ss} - %msg%n</pattern>
        </encoder>
    </appender>
</configuration>
```

**控制台日誌：** 如果可用，使用 `Console#charset()` (Java 17+)，否則回退到 UTF-8。這提供了更好的平台相容性，同時保持一致的編碼。

### DevTools 變更

#### Live Reload 預設停用

**application.yml：**
```yaml
spring:
  devtools:
    livereload:
      enabled: true # 必須在 4.0 中明確啟用
```

**libs.versions.toml：**
```toml
[libraries]
spring-boot-devtools = { module = "org.springframework.boot:spring-boot-devtools", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    developmentOnly(libs.spring.boot.devtools)
}
```

### PropertyMapper API 行為變更

**重大變更：** 當來源為 `null` 時，預設不再呼叫 adapter/predicate 方法。

**遷移模式：**
```kotlin
// 舊版行為 (Spring Boot 3.x)
map.from(source::method).to(destination::method)
// 如果來源回傳 null，則呼叫 destination.method(null)

// 新版行為 (Spring Boot 4.0)
map.from(source::method).to(destination::method)
// 如果來源回傳 null，則跳過呼叫

// 明確的 null 處理 (新版)
map.from(source::method).always().to(destination::method)
// 始終呼叫 destination.method(value)，即使為 null
```

**已移除方法：** `alwaysApplyingNotNull()` - 改用 `always()`。

**遷移範例：** 檢閱 [Spring Boot commit 239f384ac0](https://github.com/spring-projects/spring-boot/commit/239f384ac0893d151b89f204886874c6adb00001) 以了解 Spring Boot 本身如何適應新的 API。

## 依賴項和建構變更

### Gradle 套件更新

**build.gradle.kts：**
```kotlin
plugins {
    kotlin("jvm") version "2.2.0" // 最低 2.2.0
    kotlin("plugin.spring") version "2.2.0"
    id("org.springframework.boot") version "4.0.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.cyclonedx.bom") version "3.0.0" // 最低 3.0.0
}
```

### Gradle 中的可選依賴項

可選依賴項**預設不再包含在 uber jar 中**。

**build.gradle.kts (明確包含可選項)：**
```kotlin
tasks.bootJar {
    includeOptional = true // 如果需要
}
```

### Spring Retry → Spring Framework 核心 Retry

Spring Boot 4.0 移除了 **Spring Retry** 的依賴項管理 (組合正在遷移到 Spring Framework 7.0 核心 retry)。

**遷移選項 1：使用 Spring Framework 核心 Retry (建議)**

```kotlin
// 使用內建的 Spring Framework retry
import org.springframework.core.retry.RetryTemplate
import org.springframework.core.retry.support.RetryTemplateBuilder

@Configuration
class RetryConfig {
    @Bean
    fun retryTemplate(): RetryTemplate {
        return RetryTemplateBuilder()
            .maxAttempts(3)
            .fixedBackoff(1000)
            .build()
    }
}
```

**遷移選項 2：明確的 Spring Retry 版本 (暫時性)**

**libs.versions.toml：**
```toml
[versions]
spring-retry = "2.0.5" # 需要明確版本

[libraries]
spring-retry = { module = "org.springframework.retry:spring-retry", version.ref = "spring-retry" }
```

**規劃遷移到 Spring Framework 核心 retry。**

### Spring 授權伺服器

現在是 Spring Security 的一部分 - 已移除明確的版本管理。

**libs.versions.toml (之前 - Spring Boot 3.x)：**
```toml
[versions]
spring-authorization-server = "1.3.0" # 不再適用

[libraries]
spring-security-oauth2-authorization-server = { module = "org.springframework.security:spring-security-oauth2-authorization-server", version.ref = "spring-authorization-server" }
```

**遷移 (Spring Boot 4.0)：**
```toml
[versions]
spring-security = "7.0.0" # 改用 Spring Security 版本

[libraries]
# 由 spring-security.version 屬性管理，而不是單獨管理
spring-security-oauth2-authorization-server = { module = "org.springframework.security:spring-security-oauth2-authorization-server", version.ref = "spring-security" }
```

或依賴 Spring Boot 依賴項管理 (建議)：
```kotlin
dependencies {
    implementation("org.springframework.security:spring-security-oauth2-authorization-server")
    // 版本由 Spring Boot 4.0 管理
}
```

### Elasticsearch 用戶端變更

#### 低階用戶端替換

**已棄用的低階 `RestClient` → 新的 `Rest5Client`：**

**注意：** 高階用戶端 (`ElasticsearchClient` 和 Spring Data 的 `ReactiveElasticsearchClient`) **保持不變**，並已在內部更新以使用新的低階用戶端。

**匯入：**
```kotlin
// 舊版 (Spring Boot 3.x)
import org.elasticsearch.client.RestClient
import org.elasticsearch.client.RestClientBuilder
import org.springframework.boot.autoconfigure.elasticsearch.RestClientBuilderCustomizer

// 新版 (Spring Boot 4.0)
import co.elastic.clients.transport.rest_client.Rest5Client
import co.elastic.clients.transport.rest_client.Rest5ClientBuilder
import org.springframework.boot.autoconfigure.elasticsearch.Rest5ClientBuilderCustomizer
```

**配置：**
```kotlin
@Configuration
class ElasticsearchConfig {

    // 舊版
    // @Bean
    // fun restClientCustomizer(): RestClientBuilderCustomizer {
    //     return RestClientBuilderCustomizer { builder ->
    //         builder.setRequestConfigCallback { config ->
    //             config.setConnectTimeout(5000)
    //         }
    //     }
    // }

    // 新版
    @Bean
    fun rest5ClientCustomizer(): Rest5ClientBuilderCustomizer {
        return Rest5ClientBuilderCustomizer { builder ->
            builder.setRequestConfigCallback { config ->
                config.setConnectTimeout(5000)
            }
        }
    }
}
```

**依賴項整合：**

Sniffer 現在包含在 `co.elastic.clients:elasticsearch-java` 模組中。

**libs.versions.toml：**
```toml
[libraries]
# 移除這些 - 不再管理
# elasticsearch-rest-client = { module = "org.elasticsearch.client:elasticsearch-rest-client", version = "..." }
# elasticsearch-rest-client-sniffer = { module = "org.elasticsearch.client:elasticsearch-rest-client-sniffer", version = "..." }

# 使用單一依賴項 (包含 sniffer)
elasticsearch-java = { module = "co.elastic.clients:elasticsearch-java", version = "8.x.x" }
```

### Hibernate 依賴項變更

**libs.versions.toml：**
```toml
[libraries]
# 已重新命名的模組 (hibernate-jpamodelgen 由 hibernate-processor 取代)
hibernate-processor = { module = "org.hibernate.orm:hibernate-processor", version.ref = "hibernate" }

# 這些 Artifact 不再由 Hibernate 發布：
# hibernate-proxool - 已由 Hibernate 專案中止
# hibernate-vibur - 已由 Hibernate 專案中止
# 移除對這些模組的任何依賴項
```

**注意：** `hibernate-jpamodelgen` Artifact 仍然存在，但已棄用。未來請使用 `hibernate-processor`。

## 配置屬性變更

### MongoDB 屬性重組

**主要重組：** 非 Spring Data 屬性已移至 `spring.mongodb.*`：

**application.yml 遷移：**
```yaml
# 舊版 (Spring Boot 3.x)
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/mydb
      database: mydb
      host: localhost
      port: 27017
      username: user
      password: pass
      authentication-database: admin
      replica-set-name: rs0
      additional-hosts:
        - host1:27017
        - host2:27017
      ssl:
        enabled: true
        bundle: my-bundle
      representation:
        uuid: STANDARD

management:
  health:
    mongo:
      enabled: true
  metrics:
    mongo:
      command:
        enabled: true
      connectionpool:
        enabled: true

# 新版 (Spring Boot 4.0)
spring:
  mongodb:
    uri: mongodb://localhost:27017/mydb
    database: mydb
    host: localhost
    port: 27017
    username: user
    password: pass
    authentication-database: admin
    replica-set-name: rs0
    additional-hosts:
      - host1:27017
      - host2:27017
    ssl:
      enabled: true
      bundle: my-bundle
    representation:
      uuid: STANDARD # 現在需要明確配置

  data:
    mongodb:
      # Spring Data 特定屬性保留在此處
      auto-index-creation: true
      field-naming-strategy: org.springframework.data.mapping.model.SnakeCaseFieldNamingStrategy
      gridfs:
        bucket: fs
        database: gridfs-db
      repositories:
        type: auto
      representation:
        big-decimal: DECIMAL128 # 現在需要明確配置

management:
  health:
    mongodb: # 從 "mongo" 重新命名
      enabled: true
  metrics:
    mongodb: # 從 "mongo" 重新命名
      command:
        enabled: true
      connectionpool:
        enabled: true
```

**主要變更：**
- **UUID 表示**：**強制** - 未提供預設值，必須明確配置 `spring.mongodb.representation.uuid` (例如 `STANDARD`、`JAVA_LEGACY`、`PYTHON_LEGACY`、`C_SHARP_LEGACY`)
- **BigDecimal 表示**：**強制** - 未提供預設值，必須明確配置 `spring.data.mongodb.representation.big-decimal` (例如 `DECIMAL128`、`STRING`)
- **管理屬性**：`mongo` → `mongodb`
- **未能配置這些將導致在持續化 UUID 或 BigDecimal 值時發生運行時錯誤**

### Spring Session 屬性重新命名

**application.yml 遷移：**
```yaml
# 舊版 (Spring Boot 3.x)
spring:
  session:
    redis:
      namespace: myapp:session
      flush-mode: on-save
    mongodb:
      collection-name: sessions

# 新版 (Spring Boot 4.0)
spring:
  session:
    data:
      redis:
        namespace: myapp:session
        flush-mode: on-save
      mongodb:
        collection-name: sessions
```

### 持久性模組屬性變更

**application.yml 遷移：**
```yaml
# 舊版 (Spring Boot 3.x)
spring:
  dao:
    exceptiontranslation:
      enabled: true

# 新版 (Spring Boot 4.0)
spring:
  persistence:
    exceptiontranslation:
      enabled: true
```

## Web 框架變更

### 靜態資源位置

`PathRequest#toStaticResources()` 現在預設包含 `/fonts/**`。

**安全性配置 (如果需要排除字型)：**
```kotlin
import org.springframework.boot.autoconfigure.security.servlet.PathRequest
import org.springframework.boot.autoconfigure.security.StaticResourceLocation

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                // 如果需要排除字型
                authorize(PathRequest.toStaticResources()
                    .atCommonLocations()
                    .excluding(StaticResourceLocation.FONTS), permitAll)
                authorize(anyRequest, authenticated)
            }
        }
        return http.build()
    }
}
```

### HttpMessageConverters 棄用

`HttpMessageConverters` 因框架改進 (合併用戶端/伺服器轉換器) 而棄用。

**遷移：**
```kotlin
// 舊版 (Spring Boot 3.x)
import org.springframework.boot.autoconfigure.http.HttpMessageConverters
import org.springframework.context.annotation.Bean

@Configuration
class WebConfig {
    @Bean
    fun customConverters(): HttpMessageConverters {
        return HttpMessageConverters(MyCustomConverter())
    }
}

// 新版 (Spring Boot 4.0)
import org.springframework.boot.autoconfigure.http.client.ClientHttpMessageConvertersCustomizer
import org.springframework.boot.autoconfigure.http.server.ServerHttpMessageConvertersCustomizer

@Configuration
class WebConfig {

    // 分離的用戶端和伺服器轉換器
    @Bean
    fun clientConvertersCustomizer(): ClientHttpMessageConvertersCustomizer {
        return ClientHttpMessageConvertersCustomizer { converters ->
            converters.add(MyCustomClientConverter())
        }
    }

    @Bean
    fun serverConvertersCustomizer(): ServerHttpMessageConvertersCustomizer {
        return ServerHttpMessageConvertersCustomizer { converters ->
            converters.add(MyCustomServerConverter())
        }
    }
}
```

### Jersey 和 Jackson 3 不相容性

**Jersey 4.0 限制：** Spring Boot 4.0 支援 Jersey 4.0，但其**尚不支援 Jackson 3**。

**解決方案：** 使用 `spring-boot-jackson2` 相容性模組**取代或與** `spring-boot-jackson` **並用**：

**libs.versions.toml：**
```toml
[libraries]
spring-boot-starter-jersey = { module = "org.springframework.boot:spring-boot-starter-jersey", version.ref = "springBoot" }
spring-boot-jackson2 = { module = "org.springframework.boot:spring-boot-jackson2", version.ref = "springBoot" }
# 可選：為應用程式的非 Jersey 部分保留 Jackson 3
spring-boot-jackson = { module = "org.springframework.boot:spring-boot-jackson", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.jersey)
    implementation(libs.spring.boot.jackson2) // Jersey JSON 處理所需
    // 可選：在應用程式的其他地方使用 Jackson 3
    // implementation(libs.spring.boot.jackson)
}
```

**注意：** 如果您的應用程式只使用 Jersey，則可以完全使用 Jackson 2 相容性模組替換 Jackson 3。

## 訊息框架變更

### Kafka Streams Customizer 替換

**已棄用的 `StreamBuilderFactoryBeanCustomizer` → `StreamsBuilderFactoryBeanConfigurer`：**

```kotlin
// 舊版 (Spring Boot 3.x)
import org.springframework.boot.autoconfigure.kafka.StreamsBuilderFactoryBeanCustomizer

@Configuration
class KafkaStreamsConfig {
    @Bean
    fun streamsCustomizer(): StreamBuilderFactoryBeanCustomizer {
        return StreamBuilderFactoryBeanCustomizer { factoryBean ->
            factoryBean.setKafkaStreamsCustomizer { streams ->
                // 自訂配置
            }
        }
    }
}

// 新版 (Spring Boot 4.0)
import org.springframework.kafka.config.StreamsBuilderFactoryBeanConfigurer

@Configuration
class KafkaStreamsConfig {
    @Bean
    fun streamsConfigurer(): StreamsBuilderFactoryBeanConfigurer {
        return StreamsBuilderFactoryBeanConfigurer { factoryBean ->
            factoryBean.setKafkaStreamsCustomizer { streams ->
                // 自訂配置
            }
        }
    }
}
```

**注意：** 新的配置器實作 `Ordered`，預設值為 `0`。

### Kafka Retry 屬性變更

**application.yml 遷移：**
```yaml
# 舊版 (Spring Boot 3.x)
spring:
  kafka:
    retry:
      topic:
        backoff:
          random: true

# 新版 (Spring Boot 4.0)
spring:
  kafka:
    retry:
      topic:
        backoff:
          jitter: 0.5 # 比布林值更靈活
```

### RabbitMQ Retry Customizer 分割

**Spring AMQP 從 Spring Retry 移至 Spring Framework 核心 retry**，並分割 Customizer：

```kotlin
// 舊版 (Spring Boot 3.x)
import org.springframework.boot.autoconfigure.amqp.RabbitRetryTemplateCustomizer

@Configuration
class RabbitConfig {
    @Bean
    fun retryCustomizer(): RabbitRetryTemplateCustomizer {
        return RabbitRetryTemplateCustomizer { template ->
            // 適用於 RabbitTemplate 和監聽器
        }
    }
}

// 新版 (Spring Boot 4.0)
import org.springframework.boot.autoconfigure.amqp.RabbitTemplateRetrySettingsCustomizer
import org.springframework.boot.autoconfigure.amqp.RabbitListenerRetrySettingsCustomizer

@Configuration
class RabbitConfig {

    // 用於 RabbitTemplate 操作
    @Bean
    fun templateRetryCustomizer(): RabbitTemplateRetrySettingsCustomizer {
        return RabbitTemplateRetrySettingsCustomizer { settings ->
            settings.maxAttempts = 5
        }
    }

    // 用於訊息監聽器
    @Bean
    fun listenerRetryCustomizer(): RabbitListenerRetrySettingsCustomizer {
        return RabbitListenerRetrySettingsCustomizer { settings ->
            settings.maxAttempts = 3
        }
    }
}
```

## 測試框架變更

### Mockito 整合已移除

`MockitoTestExecutionListener` 已移除 (在 3.4 中棄用)。

**遷移到 MockitoExtension：**
```kotlin
// 舊版 (Spring Boot 3.x)
import org.springframework.boot.test.context.SpringBootTest
import org.mockito.Mock
import org.mockito.Captor

@SpringBootTest
class MyServiceTest {
    @Mock
    private lateinit var repository: MyRepository

    @Captor
    private lateinit var captor: ArgumentCaptor<String>
}

// 新版 (Spring Boot 4.0)
import org.springframework.boot.test.context.SpringBootTest
import org.mockito.Mock
import org.mockito.Captor
import org.mockito.junit.jupiter.MockitoExtension
import org.junit.jupiter.api.extension.ExtendWith

@SpringBootTest
@ExtendWith(MockitoExtension::class) // 需要明確的擴展
class MyServiceTest {
    @Mock
    private lateinit var repository: MyRepository

    @Captor
    private lateinit var captor: ArgumentCaptor<String>
}
```

### @SpringBootTest 變更

`@SpringBootTest` 不再自動提供 **MockMVC**、**WebTestClient** 或 **TestRestTemplate**。

#### MockMVC 配置

```kotlin
// 舊版 (Spring Boot 3.x)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc // 自動可用
}

// 新版 (Spring Boot 4.0)
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.HtmlUnit

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc // 需要明確的註釋
class ControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc
}

// HtmlUnit 配置已移至註釋屬性
@AutoConfigureMockMvc(
    htmlUnit = HtmlUnit(webClient = false, webDriver = false)
)
```

#### WebTestClient 配置

```kotlin
// 舊版 (Spring Boot 3.x)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebFluxTest {
    @Autowired
    private lateinit var webTestClient: WebTestClient // 自動可用
}

// 新版 (Spring Boot 4.0)
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient // 需要明確的註釋
class WebFluxTest {
    @Autowired
    private lateinit var webTestClient: WebTestClient
}
```

#### TestRestTemplate → RestTestClient (建議)

**Spring Boot 4.0 引入了 `RestTestClient`** 作為 `TestRestTemplate` 的現代替代方案。

```kotlin
// 舊方法 (仍然適用於註釋)
import org.springframework.boot.test.autoconfigure.web.client.AutoConfigureTestRestTemplate
import org.springframework.boot.test.web.client.TestRestTemplate

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate // 在 4.0 中是必需的
class RestApiTest {
    @Autowired
    private lateinit var testRestTemplate: TestRestTemplate
}

// 新的建議方法
import org.springframework.boot.test.autoconfigure.web.client.AutoConfigureRestTestClient
import org.springframework.boot.resttestclient.RestTestClient

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient // 新註釋
class RestApiTest {
    @Autowired
    private lateinit var restTestClient: RestTestClient

    @Test
    fun testEndpoint() {
        val response = restTestClient.get()
            .uri("/api/users")
            .retrieve()
            .toEntity<List<User>>()

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
    }
}
```

**TestRestTemplate 套件變更 (如果仍然使用)：**

**重要：** 如果繼續使用 `TestRestTemplate`，您必須：
1. 添加 `spring-boot-resttestclient` 測試依賴項
2. **更新套件匯入** (類別已移至新套件)

**libs.versions.toml：**
```toml
[libraries]
spring-boot-resttestclient = { module = "org.springframework.boot:spring-boot-resttestclient", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    testImplementation(libs.spring.boot.resttestclient)
}
```

**更新套件匯入 (必需)：**
```kotlin
// 舊套件匯入 - 將導致編譯失敗
// import org.springframework.boot.test.web.client.TestRestTemplate

// 新套件匯入 - Spring Boot 4.0 中必需
import org.springframework.boot.resttestclient.TestRestTemplate
```

### @PropertyMapping 註釋重新定位

```kotlin
// 舊版 (Spring Boot 3.x)
import org.springframework.boot.test.autoconfigure.properties.PropertyMapping
import org.springframework.boot.test.autoconfigure.properties.Skip

// 新版 (Spring Boot 4.0)
import org.springframework.boot.test.context.PropertyMapping
import org.springframework.boot.test.context.PropertyMapping.Skip
```

## 生產就緒功能和模組

### 健康、指標和可觀察性模組

Spring Boot 4.0 將生產就緒功能模組化為專注的模組：

**libs.versions.toml：**
```toml
[libraries]
# 健康監控
spring-boot-health = { module = "org.springframework.boot:spring-boot-health", version.ref = "springBoot" }

# Micrometer 指標
spring-boot-micrometer-metrics = { module = "org.springframework.boot:spring-boot-micrometer-metrics", version.ref = "springBoot" }
spring-boot-micrometer-metrics-test = { module = "org.springframework.boot:spring-boot-micrometer-metrics-test", version.ref = "springBoot" }

# Micrometer 觀察
spring-boot-micrometer-observation = { module = "org.springframework.boot:spring-boot-micrometer-observation", version.ref = "springBoot" }

# 分散式追蹤
spring-boot-micrometer-tracing = { module = "org.springframework.boot:spring-boot-micrometer-tracing", version.ref = "springBoot" }
spring-boot-micrometer-tracing-test = { module = "org.springframework.boot:spring-boot-micrometer-tracing-test", version.ref = "springBoot" }
spring-boot-micrometer-tracing-brave = { module = "org.springframework.boot:spring-boot-micrometer-tracing-brave", version.ref = "springBoot" }
spring-boot-micrometer-tracing-opentelemetry = { module = "org.springframework.boot:spring-boot-micrometer-tracing-opentelemetry", version.ref = "springBoot" }

# OpenTelemetry 整合
spring-boot-opentelemetry = { module = "org.springframework.boot:spring-boot-opentelemetry", version.ref = "springBoot" }

# Zipkin 報告器
spring-boot-zipkin = { module = "org.springframework.boot:spring-boot-zipkin", version.ref = "springBoot" }
```

**build.gradle.kts (可觀察性堆疊範例)：**
```kotlin
dependencies {
    // 帶有指標和追蹤的 Actuator
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.micrometer.observation)
    implementation(libs.spring.boot.micrometer.tracing.opentelemetry)
    implementation(libs.spring.boot.opentelemetry)

    // 測試支援
    testImplementation(libs.spring.boot.micrometer.metrics.test)
    testImplementation(libs.spring.boot.micrometer.tracing.test)
}
```

**注意：** 大多數使用啟動器 (例如 `spring-boot-starter-actuator`) 的應用程式不需要直接宣告這些模組。使用直接模組依賴項進行精細控制。

## Actuator 變更

### 健康探針預設啟用

活躍度和就緒度探針現在**預設啟用**。

**application.yml (如果需要停用)：**
```yaml
management:
  endpoint:
    health:
      probes:
        enabled: false # 如果不使用 Kubernetes 探針則停用
```

**自動公開：**
- `/actuator/health/liveness`
- `/actuator/health/readiness`

## 建構配置

### Kotlin 編譯器配置

**build.gradle.kts：**
```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "2.2.0" // 最低 2.2.0
    kotlin("plugin.spring") version "2.2.0"
    kotlin("plugin.jpa") version "2.2.0"
    id("org.springframework.boot") version "4.0.0"
    id("io.spring.dependency-management") version "1.1.7"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21) // 或 17、25
    }
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll(
            "-Xjsr305=strict", // 嚴格的空安全
            "-Xemit-jvm-type-annotations" // 發出類型註釋
        )
    }
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        jvmTarget = "21" // 匹配 Java toolchain
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

### Java 預覽功能 (如果使用 Java 25)

**build.gradle.kts：**
```kotlin
tasks.withType<JavaCompile> {
    options.compilerArgs.add("--enable-preview")
}

tasks.withType<Test> {
    jvmArgs("--enable-preview")
}

tasks.withType<JavaExec> {
    jvmArgs("--enable-preview")
}
```

## 遷移檢查表

### 遷移前

- [ ] 升級到最新的 Spring Boot 3.5.x
- [ ] 檢閱並修復所有棄用警告
- [ ] 記錄目前的依賴項版本
- [ ] 運行完整的測試套件並驗證綠色建構
- [ ] 檢閱 [Spring Boot 3.5.x → 4.0 依賴項變更](https://docs.spring.io/spring-boot/4.0/appendix/dependency-versions/coordinates.html)

### 核心遷移

- [ ] 將 `libs.versions.toml` 更新為 Spring Boot 4.0.0
- [ ] 將 Kotlin 版本更新為 2.2.0+
- [ ] 重新命名啟動器：`spring-boot-starter-web` → `spring-boot-starter-webmvc` 等
- [ ] 添加技術特定的測試啟動器 (或暫時使用經典啟動器)
- [ ] 如果存在，移除 Undertow 依賴項 (切換到 Tomcat/Jetty)
- [ ] 移除 `spring-session-hazelcast` / `spring-session-mongodb` 或添加明確版本

### Jackson 3 遷移

- [ ] 更新匯入：`com.fasterxml.jackson` → `tools.jackson`
- [ ] 更新例外：`jackson-annotations` 仍然使用 `com.fasterxml.jackson.core`
- [ ] 重新命名：`@JsonComponent` → `@JacksonComponent`
- [ ] 重新命名：`Jackson2ObjectMapperBuilderCustomizer` → `JsonMapperBuilderCustomizer`
- [ ] 更新屬性：`spring.jackson.read.*` → `spring.jackson.json.read.*`
- [ ] 如果需要，考慮暫時使用 `spring-boot-jackson2` 模組

### 屬性更新

- [ ] MongoDB：`spring.data.mongodb.*` → `spring.mongodb.*` (對於非 Spring Data 屬性)
- [ ] Session：`spring.session.redis.*` → `spring.session.data.redis.*`
- [ ] Persistence：`spring.dao.exceptiontranslation` → `spring.persistence.exceptiontranslation`
- [ ] Kafka retry：`backoff.random` → `backoff.jitter`

### 程式碼更新

- [ ] 更新套件：`BootstrapRegistry` → `org.springframework.boot.bootstrap.BootstrapRegistry`
- [ ] 更新套件：`EnvironmentPostProcessor` → `org.springframework.boot.EnvironmentPostProcessor`
- [ ] 更新套件：`EntityScan` → `org.springframework.boot.persistence.autoconfigure.EntityScan`
- [ ] 更新：`RestClient` → `Rest5Client` (Elasticsearch)
- [ ] 更新：`StreamBuilderFactoryBeanCustomizer` → `StreamsBuilderFactoryBeanConfigurer` (Kafka)
- [ ] 分割：`RabbitRetryTemplateCustomizer` → `RabbitTemplateRetrySettingsCustomizer` / `RabbitListenerRetrySettingsCustomizer`
- [ ] 替換：`HttpMessageConverters` → `ClientHttpMessageConvertersCustomizer` / `ServerHttpMessageConvertersCustomizer`
- [ ] 更新：如果需要 null 處理，`PropertyMapper` 使用 `.always()`

### 測試更新

- [ ] 為使用 `@Mock` / `@Captor` 的測試添加 `@ExtendWith(MockitoExtension::class)`
- [ ] 為使用 `MockMvc` 的測試添加 `@AutoConfigureMockMvc`
- [ ] 為使用 `WebTestClient` 的測試添加 `@AutoConfigureWebTestClient`
- [ ] 將 `TestRestTemplate` 遷移到 `RestTestClient` (或添加 `@AutoConfigureTestRestTemplate`)
- [ ] 更新：`@PropertyMapping` 匯入 → `org.springframework.boot.test.context`

### 建構配置

- [ ] 將 Gradle 更新到 8.5+
- [ ] 將 Gradle CycloneDX 套件更新到 3.0.0+
- [ ] 檢閱 uber jars 中的可選依賴項包含
- [ ] 如果存在，移除 `loaderImplementation = CLASSIC`
- [ ] 如果存在，移除 `launchScript()` 配置

### 驗證

- [ ] 運行 `./gradlew clean build`
- [ ] 運行完整的測試套件
- [ ] 使用 TestContainers 驗證整合測試
- [ ] 檢查新的 Kotlin 空安全警告
- [ ] 測試 Spring Boot Actuator 端點
- [ ] 驗證健康探針 (`/actuator/health/liveness`、`/actuator/health/readiness`)
- [ ] 使用新預設值進行效能測試

### 遷移後

- [ ] 檢閱 Spring Boot 4.0 發行說明以獲取額外功能
- [ ] 考慮採用新的 Spring Framework 7.0 功能
- [ ] 規劃從經典啟動器遷移 (如果使用)
- [ ] 規劃從 `spring-boot-jackson2` 模組遷移 (如果使用)
- [ ] 更新 CI/CD 管道以符合 Java 17+ 要求
- [ ] 更新部署清單 (Servlet 6.1 容器)

## 常見陷阱

1. **經典啟動器**：請記住這些已棄用 - 規劃遷移到技術特定的啟動器
2. **Undertow**：已完全移除，沒有解決方案 - 必須使用 Tomcat 或 Jetty
3. **Jackson 3 套件**：容易遺漏 `jackson-annotations` 仍然使用舊的群組 ID
4. **MongoDB 屬性**：許多已移至 `spring.mongodb.*`，但有些仍保留在 `spring.data.mongodb.*`
5. **測試配置**：`@SpringBootTest` 不再自動配置 MockMVC/WebTestClient/TestRestTemplate
6. **Kotlin 2.2**：最低要求 - 舊版本將無法運作
7. **空安全**：JSpecify 註釋可能會在 Kotlin 中顯示新的警告
8. **PropertyMapper**：null 處理的行為變更 - 檢閱使用情況
9. **Jersey + Jackson 3**：不相容 - 使用 `spring-boot-jackson2` 模組
10. **健康探針**：現在預設啟用 - 可能會影響非 Kubernetes 部署

## 效能考量

- **模組化啟動器**：更小的 JAR 和更快的啟動，使用技術特定的啟動器
- **Spring Framework 7**：核心框架的效能改進
- **Jackson 3**：改進的 JSON 處理效能
- **虛擬執行緒**：考慮使用 Java 21+ 啟用 (`spring.threads.virtual.enabled=true`)

## 資源

- [Spring Boot 4.0 遷移指南](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Spring Boot 4.0 發行說明](https://github.com/spring-projects/spring-boot/releases)
- [Spring Framework 7.0 文件](https://docs.spring.io/spring-framework/reference/)
- [Jackson 3 遷移指南](https://github.com/FasterXML/jackson/wiki/Jackson-3.0-Migration-Guide)
- [Kotlin 2.2 發行說明](https://kotlinlang.org/docs/whatsnew22.html)

---
