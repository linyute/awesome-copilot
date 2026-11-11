## 相依性與建構變更

### Gradle 外掛程式更新

**build.gradle.kts：**
```kotlin
plugins {
    kotlin("jvm") version "2.2.0" // Minimum 2.2.0
    kotlin("plugin.spring") version "2.2.0"
    id("org.springframework.boot") version "4.0.x" // use the current 4.0 patch
    id("io.spring.dependency-management") version "1.1.7"
    id("org.cyclonedx.bom") version "3.0.0" // Minimum 3.0.0
}
```

已驗證：搭配 Kotlin 2.2.0 的 Boot 3.5 -> 4.x 建構成功（Groovy 與 Kotlin DSL，Gradle 9.8.1）。Boot 4.x 管理的 Kotlin 版本比 Boot 3.5（1.9.25）更新，因此搭配 dependency-management/BOM 時，Kotlin 外掛程式版本最好隨之更新。請在 JDK 21 或 25 上執行 Gradle：Kotlin 1.9 編譯器在 JDK 27 下會以 `IllegalArgumentException: 27` 失敗。

### Gradle 中的選填相依性

選填相依性**預設不再包含於 uber jar 中**。Gradle 沒有 Maven 風格的 `optional` 範圍，且 `BootJar` 沒有 `includeOptional` 屬性，因此請改由相依性組態來控制封裝：

```kotlin
dependencies {
    implementation("group:artifact")   // compile and runtime classpath, packaged in the jar
    runtimeOnly("group:artifact")      // runtime only, packaged in the jar
    compileOnly("group:artifact")      // compile time only, not packaged
}
```

若先前為選填的相依性現在在執行階段缺失，請將其移至 `implementation` 或 `runtimeOnly`。

### Spring Retry → Spring Framework Core Retry

Spring Boot 4.0 移除了 **Spring Retry** 的相依性管理（整個產品組合移轉至 Spring Framework 7.0 核心 retry）。

**移轉選項 1：使用 Spring Framework 核心 Retry（建議）**

```kotlin
// Use built-in Spring Framework retry
import org.springframework.core.retry.RetryTemplate
import org.springframework.core.retry.RetryPolicy
import java.time.Duration

@Configuration
class RetryConfig {
    @Bean
    fun retryTemplate(): RetryTemplate {
        val policy = RetryPolicy.builder()
            .maxRetries(3)
            .delay(Duration.ofMillis(1000))
            .build()
        return RetryTemplate(policy)
    }
}
```

**移轉選項 2：明確指定 Spring Retry 版本（暫時性）**

**libs.versions.toml：**
```toml
[versions]
spring-retry = "2.0.5" # Explicit version required

[libraries]
spring-retry = { module = "org.springframework.retry:spring-retry", version.ref = "spring-retry" }
```

**規劃向 Spring Framework 核心 retry 進行移轉。**

### Spring Authorization Server

現已成為 Spring Security 的一部分 - 明確的版本管理已移除。

**libs.versions.toml（先前 - Spring Boot 3.x）：**
```toml
[versions]
spring-authorization-server = "1.3.0" # No longer works

[libraries]
spring-security-oauth2-authorization-server = { module = "org.springframework.security:spring-security-oauth2-authorization-server", version.ref = "spring-authorization-server" }
```

**移轉（Spring Boot 4.0）：**
```toml
[versions]
spring-security = "7.0.0" # Use Spring Security version instead

[libraries]
# Managed by spring-security.version property, not separate
spring-security-oauth2-authorization-server = { module = "org.springframework.security:spring-security-oauth2-authorization-server", version.ref = "spring-security" }
```

或依賴 Spring Boot 相依性管理（建議）：
```kotlin
dependencies {
    implementation("org.springframework.security:spring-security-oauth2-authorization-server")
    // Version managed by Spring Boot 4.0
}
```

### Elasticsearch 用戶端變更

#### 低階用戶端替代方案

**已棄用的低階 `RestClient` → 新的 `Rest5Client`：**

**注意：** 高階用戶端（`ElasticsearchClient` 以及 Spring Data 的 `ReactiveElasticsearchClient`）**維持不變**，且內部已更新為使用新的低階用戶端。

**匯入：**
```kotlin
// Old (Spring Boot 3.x)
import org.elasticsearch.client.RestClient
import org.elasticsearch.client.RestClientBuilder
import org.springframework.boot.autoconfigure.elasticsearch.RestClientBuilderCustomizer

// New (Spring Boot 4.0)
import co.elastic.clients.transport.rest5_client.low_level.Rest5Client
import co.elastic.clients.transport.rest5_client.low_level.Rest5ClientBuilder
import org.springframework.boot.elasticsearch.autoconfigure.Rest5ClientBuilderCustomizer
import org.apache.hc.client5.http.config.ConnectionConfig
import org.apache.hc.core5.util.Timeout
```

**組態：**
```kotlin
@Configuration
class ElasticsearchConfig {

    // Old
    // @Bean
    // fun restClientCustomizer(): RestClientBuilderCustomizer {
    //     return RestClientBuilderCustomizer { builder ->
    //         builder.setRequestConfigCallback { config ->
    //             config.setConnectTimeout(5000)
    //         }
    //     }
    // }

    // New
    @Bean
    fun rest5ClientCustomizer(): Rest5ClientBuilderCustomizer {
        return object : Rest5ClientBuilderCustomizer {
            override fun customize(builder: Rest5ClientBuilder) {}

            // Dedicated callbacks replace setRequestConfigCallback
            override fun customize(builder: ConnectionConfig.Builder) {
                builder.setConnectTimeout(Timeout.ofSeconds(5))
            }
        }
    }
}
```

**相依性整併：**

Sniffer 現在包含在 `co.elastic.clients:elasticsearch-java` 模組中。

**libs.versions.toml：**
```toml
[libraries]
# Remove these - no longer managed
# elasticsearch-rest-client = { module = "org.elasticsearch.client:elasticsearch-rest-client", version = "..." }
# elasticsearch-rest-client-sniffer = { module = "org.elasticsearch.client:elasticsearch-rest-client-sniffer", version = "..." }

# Use single dependency (includes sniffer); let the Boot BOM select the compatible client
elasticsearch-java = { module = "co.elastic.clients:elasticsearch-java" }
```

### Hibernate 相依性變更

**libs.versions.toml：**
```toml
[libraries]
# Renamed module (hibernate-jpamodelgen replaced by hibernate-processor)
hibernate-processor = { module = "org.hibernate.orm:hibernate-processor", version.ref = "hibernate" }

# These artifacts are NO LONGER PUBLISHED by Hibernate:
# hibernate-proxool - discontinued by Hibernate project
# hibernate-vibur - discontinued by Hibernate project
# Remove any dependencies on these modules
```

**注意：** `hibernate-jpamodelgen` 構件仍然存在但已棄用。日後請使用 `hibernate-processor`。
