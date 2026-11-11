## 正式環境就緒功能與模組

### 健康狀態、度量指標與可觀測性模組

Spring Boot 4.0 將正式環境就緒功能模組化為聚焦的模組：

**libs.versions.toml：**
```toml
[libraries]
# Health monitoring
spring-boot-health = { module = "org.springframework.boot:spring-boot-health", version.ref = "springBoot" }

# Micrometer metrics
spring-boot-micrometer-metrics = { module = "org.springframework.boot:spring-boot-micrometer-metrics", version.ref = "springBoot" }
spring-boot-micrometer-metrics-test = { module = "org.springframework.boot:spring-boot-micrometer-metrics-test", version.ref = "springBoot" }

# Micrometer observation
spring-boot-micrometer-observation = { module = "org.springframework.boot:spring-boot-micrometer-observation", version.ref = "springBoot" }

# Distributed tracing
spring-boot-micrometer-tracing = { module = "org.springframework.boot:spring-boot-micrometer-tracing", version.ref = "springBoot" }
spring-boot-micrometer-tracing-test = { module = "org.springframework.boot:spring-boot-micrometer-tracing-test", version.ref = "springBoot" }
spring-boot-micrometer-tracing-brave = { module = "org.springframework.boot:spring-boot-micrometer-tracing-brave", version.ref = "springBoot" }
spring-boot-micrometer-tracing-opentelemetry = { module = "org.springframework.boot:spring-boot-micrometer-tracing-opentelemetry", version.ref = "springBoot" }

# OpenTelemetry integration
spring-boot-opentelemetry = { module = "org.springframework.boot:spring-boot-opentelemetry", version.ref = "springBoot" }

# Zipkin reporter
spring-boot-zipkin = { module = "org.springframework.boot:spring-boot-zipkin", version.ref = "springBoot" }
```

**build.gradle.kts（可觀測性堆疊範例）：**
```kotlin
dependencies {
    // Actuator with metrics and tracing
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.micrometer.observation)
    implementation(libs.spring.boot.micrometer.tracing.opentelemetry)
    implementation(libs.spring.boot.opentelemetry)

    // Test support
    testImplementation(libs.spring.boot.micrometer.metrics.test)
    testImplementation(libs.spring.boot.micrometer.tracing.test)
}
```

**注意：** 大多數使用 starter（例如 `spring-boot-starter-actuator`）的應用程式不需要直接宣告這些模組。需要細粒度控制時請使用直接模組相依性。

## Actuator 變更

### 預設啟用健康狀態探針

存活度（Liveness）與整備度（Readiness）探針現在**預設啟用**。

**application.yml（若有需要可停用）：**
```yaml
management:
  endpoint:
    health:
      probes:
        enabled: false # Disable if not using Kubernetes probes
```

**自動公開：**
- `/actuator/health/liveness`
- `/actuator/health/readiness`

