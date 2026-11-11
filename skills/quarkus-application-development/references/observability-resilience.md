# 可觀測性、復原力、REST 用戶端、排程器、快取

除非標記為「未驗證」，否則以下所有項目均在 Quarkus 3.40.1 與 3.27.6 上進行過實測。

## 健康狀態（`quarkus-smallrye-health`）

端點：`/q/health`、`/q/health/live`、`/q/health/ready`、`/q/health/started`。自訂檢查為 CDI Bean：

```java
@Readiness                       // or @Liveness / @Startup (org.eclipse.microprofile.health)
@ApplicationScoped
public class Ready implements HealthCheck {
    public HealthCheckResponse call() { return HealthCheckResponse.up("demo"); }
}
```

已驗證：`/q/health/ready` 傳回帶有檢查名稱的 200。JDBC 資料來源等擴充功能會新增自身的整備度（readiness）檢查。保持存活度（liveness）檢查簡單瑣碎（不做相依性檢查，否則平台會在服務中斷期間重新啟動 Pod）；將相依性檢查放在整備度中。

## 度量指標（`quarkus-micrometer-registry-prometheus`）

Prometheus 抓取端點位於 `/q/metrics`。插入 `MeterRegistry` 以建立自訂計量器（`registry.counter("demo.fallback").increment()` 呈現為 `demo_fallback_total`，已驗證）。HTTP 伺服器與 JVM 計量器預設開啟。在足夠使用的情況下使用 `@Counted`/`@Timed`（Micrometer 註釋）。僅向叢集/監控網路公開 `/q/metrics` 與 `/q/health`（獨立的管理介面：`quarkus.management.enabled=true`，此處未驗證）。

## OpenTelemetry (`quarkus-opentelemetry`)

預設僅開啟追蹤。度量指標與記錄處於技術預覽階段且在建構時停用：設定 `quarkus.otel.metrics.enabled=true` 與 `quarkus.otel.logs.enabled=true` 以將其匯出（對照 Quarkus OpenTelemetry 指南檢查）。HTTP、REST Client、JDBC（帶有 `quarkus.datasource.jdbc.telemetry=true`）以及傳訊均已進行檢測。透過 `quarkus.otel.exporter.otlp.endpoint=http://collector:4317` 將其指向收集器（僅驗證了在沒有收集器的情況下應用程式會記錄「Failed to export ... Connection refused」至 `localhost:4317` 但仍可運作）。使用 `@WithSpan` 加入自訂 Span 或插入 `Tracer`。在開發模式下，Quarkus Dev Services for observability（Grafana LGTM，`quarkus-observability-devservices-lgtm`）可提供後端；此處未驗證。無特定原因請勿同時設定 Micrometer 與 OTel 度量指標匯出。

## 容錯能力（`quarkus-smallrye-fault-tolerance`）

```java
@Retry(maxRetries = 2) @Fallback(fallbackMethod = "fb")
public String flaky() { throw new IllegalStateException(); }
String fb() { return "fallback"; }
```

已驗證：該方法執行了 3 次（1 次 + 2 次重試）並傳回備用數值。亦支援 `@Timeout`、`@CircuitBreaker`、`@Bulkhead`、`@RateLimit`（SmallRye 擴充功能）。它們是 Bean 方法上的 CDI 攔截器；ArC 亦會攔截自呼叫。適用於 `Uni` 傳回型別（非同步、非阻斷）。始終在遠端呼叫上設定 `@Timeout`；不要重試非等冪操作。

## REST 用戶端（`quarkus-rest-client-jackson`）

```java
@RegisterRestClient(configKey = "echo")
@Path("/greetings")
public interface EchoClient {
    @GET @Path("/{n}") Greeting get(@PathParam("n") String n);
}
```

```properties
quarkus.rest-client.echo.url=${ECHO_URL:http://localhost:8081}
quarkus.rest-client.echo.read-timeout=5000
```

使用 `@RestClient EchoClient echo;` 插入（`org.eclipse.microprofile.rest.client.inject.RestClient`）。已驗證：Bean 插入與啟動（呼叫本身未進行實測）。與 `@Timeout`/`@Retry` 結合使用；使用 `@ClientExceptionMapper` 擲出領域例外狀況。在測試中，透過測試資源搭配 WireMock 替換遠端服務（請參閱 `quarkus-dev-services-and-testing`）。

## 排程器（`quarkus-scheduler`）

在 Bean 方法上使用 `@Scheduled(every = "1s")` 或 `@Scheduled(cron = "{app.cron}")`（已驗證：計數遞增）。使用 `concurrentExecution = SKIP` 以避免重疊。排程器針對每個實例獨立運作；在叢集中請使用 `quarkus-quartz` 擴充功能搭配共用 JDBC 儲存庫與 `quarkus.quartz.clustered=true`（預設為 `false`，因此單獨使用 JDBC 儲存庫無法協調排程器），或使用分散式鎖定以單次執行工作。排程方法在工作執行緒上執行，除非標註 `@NonBlocking`/傳回 `Uni`；針對阻斷式 IO 請使用 `@RunOnVirtualThread`。

## 快取（`quarkus-cache`）

```java
@CacheResult(cacheName = "slow")
public String slow(String k) { ... }
```

已驗證：使用相同索引鍵的兩次呼叫僅執行該方法一次。透過 `quarkus.cache.caffeine."slow".maximum-size=10` 與 `expire-after-write=60S` 進行設定。亦支援 `@CacheInvalidate`、`@CacheInvalidateAll`、`@CacheKey`。基於攔截器實作；ArC 亦會攔截自呼叫。快取針對每個實例在記憶體中獨立保存；共用快取請使用 `quarkus-redis-cache`（此處未驗證）。
