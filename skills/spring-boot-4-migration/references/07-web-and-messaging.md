## Web 框架變更

### 靜態資源位置

`PathRequest#toStaticResources()` 現在預設包含 `/fonts/**`。

**安全性組態（若有需要可排除字型）：**
```kotlin
import org.springframework.boot.security.autoconfigure.web.StaticResourceLocation
import org.springframework.boot.security.autoconfigure.web.servlet.PathRequest

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                // Exclude fonts if needed
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

### 棄用 HttpMessageConverters

由於框架改良（先前將客戶端與伺服器端轉換器混雜在一起），`HttpMessageConverters` 已棄用。

**移轉：**
```kotlin
// Old (Spring Boot 3.x)
import org.springframework.boot.autoconfigure.http.HttpMessageConverters
import org.springframework.context.annotation.Bean

@Configuration
class WebConfig {
    @Bean
    fun customConverters(): HttpMessageConverters {
        return HttpMessageConverters(MyCustomConverter())
    }
}

// New (Spring Boot 4.0)
import org.springframework.boot.http.converter.autoconfigure.ClientHttpMessageConvertersCustomizer
import org.springframework.boot.http.converter.autoconfigure.ServerHttpMessageConvertersCustomizer

@Configuration
class WebConfig {

    // Separate client and server converters
    @Bean
    fun clientConvertersCustomizer(): ClientHttpMessageConvertersCustomizer {
        return ClientHttpMessageConvertersCustomizer { builder ->
            builder.addCustomConverter(MyCustomClientConverter())
        }
    }

    @Bean
    fun serverConvertersCustomizer(): ServerHttpMessageConvertersCustomizer {
        return ServerHttpMessageConvertersCustomizer { builder ->
            builder.addCustomConverter(MyCustomServerConverter())
        }
    }
}
```

### 移除結尾斜線 URL 比對

Spring Framework 7 / Spring Boot 4 中已**移除** `PathMatchConfigurer#setUseTrailingSlashMatch(true)`。
沒有替代的設定開關 — `/foo` 與 `/foo/` 不再視為相同路由。

**移轉：** 將 Spring Framework 的
`UrlHandlerFilter` 註冊為
`FilterRegistrationBean`，使其在安全性鏈之前執行。`wrapRequest()` 使其透明轉發（無重導向），全程保留舊有行為：

```java
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.filter.UrlHandlerFilter;

@Configuration
class WebConfig {

    // After ForwardedHeaderFilter, before ServletRequestPathFilter and security filters.
    private static final int BEFORE_SECURITY_FILTER_ORDER = -101;

    @Bean
    FilterRegistrationBean<UrlHandlerFilter> trailingSlashHandlerFilter() {
        UrlHandlerFilter filter = UrlHandlerFilter.trailingSlashHandler("/**").wrapRequest().build();
        FilterRegistrationBean<UrlHandlerFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(BEFORE_SECURITY_FILTER_ORDER);
        return registration;
    }
}
```

### Jersey 與 Jackson 3 不相容

**Jersey 4.0 限制：** Spring Boot 4.0 支援 Jersey 4.0，而後者**尚未支援 Jackson 3**。

**解決方案：** **取代或並行使用** `spring-boot-jackson2` 相容性模組與 `spring-boot-jackson`：

**libs.versions.toml：**
```toml
[libraries]
spring-boot-starter-jersey = { module = "org.springframework.boot:spring-boot-starter-jersey", version.ref = "springBoot" }
spring-boot-jackson2 = { module = "org.springframework.boot:spring-boot-jackson2", version.ref = "springBoot" }
# Optional: Keep Jackson 3 for non-Jersey parts of application
spring-boot-jackson = { module = "org.springframework.boot:spring-boot-jackson", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.jersey)
    implementation(libs.spring.boot.jackson2) // Required for Jersey JSON processing
    // Optional: Use Jackson 3 elsewhere in application
    // implementation(libs.spring.boot.jackson)
}
```

**注意：** 若您的應用程式僅使用 Jersey，您可以完全使用 Jackson 2 相容性模組取代 Jackson 3。

## 傳訊框架變更

### 替代 Kafka Streams Customizer

**已棄用的 `StreamsBuilderFactoryBeanCustomizer` → `StreamsBuilderFactoryBeanConfigurer`：**

```kotlin
// Old (Spring Boot 3.x)
import org.springframework.boot.autoconfigure.kafka.StreamsBuilderFactoryBeanCustomizer

@Configuration
class KafkaStreamsConfig {
    @Bean
    fun streamsCustomizer(): StreamsBuilderFactoryBeanCustomizer {
        return StreamsBuilderFactoryBeanCustomizer { factoryBean ->
            factoryBean.setKafkaStreamsCustomizer { streams ->
                // Custom config
            }
        }
    }
}

// New (Spring Boot 4.0)
import org.springframework.kafka.config.StreamsBuilderFactoryBeanConfigurer

@Configuration
class KafkaStreamsConfig {
    @Bean
    fun streamsConfigurer(): StreamsBuilderFactoryBeanConfigurer {
        return StreamsBuilderFactoryBeanConfigurer { factoryBean ->
            factoryBean.setKafkaStreamsCustomizer { streams ->
                // Custom config
            }
        }
    }
}
```

**注意：** 新的 configurer 實作了 `Ordered`，預設值為 `0`。

### Kafka 重試屬性變更

**application.yml 移轉：**
```yaml
# Old (Spring Boot 3.x)
spring:
  kafka:
    retry:
      topic:
        backoff:
          random: true

# New (Spring Boot 4.0)
spring:
  kafka:
    retry:
      topic:
        backoff:
          jitter: 0.5 # More flexible than boolean
```

### 拆分 RabbitMQ 重試 Customizer

**Spring AMQP 從 Spring Retry 移至 Spring Framework 核心 retry**，並拆分了 customizer：

```kotlin
// Old (Spring Boot 3.x)
import org.springframework.boot.autoconfigure.amqp.RabbitRetryTemplateCustomizer

@Configuration
class RabbitConfig {
    @Bean
    fun retryCustomizer(): RabbitRetryTemplateCustomizer {
        return RabbitRetryTemplateCustomizer { template ->
            // Applies to both RabbitTemplate and listeners
        }
    }
}

// New (Spring Boot 4.0)
import org.springframework.boot.amqp.autoconfigure.RabbitTemplateRetrySettingsCustomizer
import org.springframework.boot.amqp.autoconfigure.RabbitListenerRetrySettingsCustomizer

@Configuration
class RabbitConfig {

    // For RabbitTemplate operations
    @Bean
    fun templateRetryCustomizer(): RabbitTemplateRetrySettingsCustomizer {
        return RabbitTemplateRetrySettingsCustomizer { settings ->
            settings.retryPolicySettings.maxRetries = 5L
        }
    }

    // For message listeners
    @Bean
    fun listenerRetryCustomizer(): RabbitListenerRetrySettingsCustomizer {
        return RabbitListenerRetrySettingsCustomizer { settings ->
            settings.retryPolicySettings.maxRetries = 3L
        }
    }
}
```

這些 customizer 自 Spring Boot 4.0.0 起即存在（與舊的 `maxAttempts` 不同，`maxRetries` 計算第一次嘗試之後的重試次數）。在 Spring Boot 4.2+ 中，它們移至 `org.springframework.boot.rabbitmq.autoconfigure` 套件；升級至 4.2 時請調整匯入。

