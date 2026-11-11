# 指標 (Metrics)

Spring Boot 透過 Micrometer 自動配置指標。只要在類別路徑中找到 `micrometer-registry-*`，就會自動配置一個 `MeterRegistry`。

## 匯出

- Prometheus 抓取：新增 `io.micrometer:micrometer-registry-prometheus`（版本由 Boot 管理）並暴露 `prometheus`。端點：`/actuator/prometheus`。
- OTLP 推送：`io.micrometer:micrometer-registry-otlp`，接著設定 `management.otlp.metrics.export.url=http://collector:4318/v1/metrics`。在 Boot 4 中，`spring-boot-starter-opentelemetry` 也提供指標、追蹤與記錄的 OTLP 匯出，請查閱 Boot 參考文件以了解目前的屬性。
- 在測試中停用所有匯出器：`management.defaults.metrics.export.enabled=false`。

## 通用標籤

```java
@Bean
MeterRegistryCustomizer<MeterRegistry> commonTags(@Value("${spring.application.name}") String app) {
    return r -> r.config().commonTags("application", app);
}
```

（套件：Boot 3.x 為 `org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer`；Boot 4.x 為 `org.springframework.boot.micrometer.metrics.autoconfigure.MeterRegistryCustomizer`。）或者設定 `management.metrics.tags.application=${spring.application.name}`。

## 自訂指標

```java
Counter.builder("orders.created").tag("channel", "web").register(registry).increment();
Timer.builder("orders.processing").publishPercentileHistogram().register(registry).record(() -> process());
Gauge.builder("orders.queue.size", queue, Queue::size).register(registry);
```

- 僅在有 `TimedAspect`/`CountedAspect` Bean 且存在 AOP 時使用 `@Timed`/`@Counted`。
- 保持標籤基數有界（絕不要包含使用者 ID、原始 URL、例外訊息）。
- HTTP 伺服器指標：`http.server.requests` 預設開啟；使用 `management.metrics.distribution.percentiles-histogram.http.server.requests=true` 啟用直方圖。
- JVM、資料庫連線池 (HikariCP)、快取、Kafka 與執行器指標在存在時會自動收集。

## 測試

在單元測試中使用 `SimpleMeterRegistry`，並在預設停用指標的切片中使用 `@AutoConfigureObservability`（或明確啟用匯出）。
