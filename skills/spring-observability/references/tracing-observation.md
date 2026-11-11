# Observation API 與追蹤

## Observation API

單一檢測點即可同時產生指標與追蹤（Micrometer Observation）。

```java
@Service
class OrderService {
    private final ObservationRegistry registry;
    OrderService(ObservationRegistry registry) { this.registry = registry; }

    Order place(Order o) {
        return Observation.createNotStarted("order.place", registry)
            .lowCardinalityKeyValue("channel", o.channel())      // metric + span tag
            .highCardinalityKeyValue("order.id", o.id())         // span tag only
            .observe(() -> doPlace(o));
    }
}
```

或使用 `@Observed(name = "order.place")` 進行註解並註冊 `ObservedAspect` Bean（需要在類別路徑中有 `spring-boot-starter-aop`/AspectJ；Boot 4 命名為 `spring-boot-starter-aspectj`）。透過 `ObservationFilter`、`ObservationPredicate` 與 `ObservationConvention` Bean 進行自訂。

## 搭配 OpenTelemetry 的追蹤

Boot 3.x（橋接至 OTel SDK）：

- `io.micrometer:micrometer-tracing-bridge-otel` 與 `io.opentelemetry:opentelemetry-exporter-otlp`（版本由 Boot 管理）。

Boot 4.x：

- `org.springframework.boot:spring-boot-starter-opentelemetry`（說明文件中用於透過 OTLP 匯出追蹤、指標、記錄的 OpenTelemetry starter）。Zipkin：`spring-boot-starter-zipkin`。
- 存在模組化構件（`spring-boot-micrometer-tracing-opentelemetry`、`spring-boot-opentelemetry`），但建議優先使用 starter。請根據你的 Boot 版本參考文件確認名稱。

```yaml
management:
  tracing:
    sampling:
      probability: 1.0        # 預設 0.1；僅在 dev/test 中使用 1.0
  # Boot 3.5:
  otlp:
    tracing:
      endpoint: http://localhost:4318/v1/traces
  # Boot 4.0 (replaces the block above):
  # opentelemetry:
  #   tracing:
  #     export:
  #       otlp:
  #         endpoint: http://localhost:4318/v1/traces
spring:
  application:
    name: orders               # 轉換為 service.name
```

- 傳播預設為 W3C `traceparent`；`management.tracing.propagation.type` 可加入 B3。
- 自動檢測：Spring MVC/WebFlux 以及由注入的建造者所建置的 `RestClient`、`RestTemplate`、`WebClient`。JDBC 需要額外的檢測庫，例如 datasource-micrometer。
- 訊息傳遞觀測需要明確加入。對於 Kafka，請同時啟用 `spring.kafka.template.observation-enabled=true` 與 `spring.kafka.listener.observation-enabled=true`（兩者預設皆為 false），以建立生產者/監聽器 span 並傳播追蹤上下文。對於 RabbitMQ 或其他訊息傳遞技術，請檢查其特定版本的 template/listener 觀測設定，而不要假設追蹤相依性會直接啟用它們。
- 本機後端：僅在開發環境中透過 Testcontainers/`spring-boot-docker-compose` 使用 Zipkin、Jaeger 或 Grafana LGTM。
- 絕不要將 PII 或秘密放入 span 屬性中。
