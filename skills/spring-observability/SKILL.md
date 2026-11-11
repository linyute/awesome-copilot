---
name: 'spring-observability'
description: '在 Spring Boot 3/4 應用程式中新增與審查可觀測性：Actuator 暴露與健康探針、Micrometer 指標、Observation API、OpenTelemetry 追蹤與 OTLP/Prometheus 匯出、帶有相互關聯識別碼的結構化記錄，以及 safe 使用 heapdump/threaddump。在檢測、監視或疑難排解 Spring Boot 服務時使用。'
---

# Spring Boot 可觀測性

涵蓋 Actuator、Micrometer、Observation API、追蹤以及記錄。詳細資訊請參閱 `references/`。針對 JDK 層級的診斷（執行緒傾印、JFR、堆積分析），請參閱 `java-diagnostics` 技能；保護端點請參閱 `spring-security`。

## 安全性規則

- 在檢查設定或 `/actuator/env` 時，絕不讀取或列印秘密（`.env`、憑證、權杖）。
- 絕不要透過公開 HTTP 暴露 `heapdump` 或 `threaddump`。唯一的例外是在具備驗證、TLS 和網路限制的情況下，經過使用者同意的臨時期間，事後必須移除（政策與 `java-diagnostics` 相同）。
- 在生產環境中，未經驗證和網路限制的情況下，絕不要暴露 `env`、`configprops`、`loggers` 或 `shutdown`。
- 透過 Boot BOM 固定相依性版本；不要為 Boot 管理的構件新增明確的版本號。

## 先行偵測

檢查 Boot 版本（3.x 或 4.x）以及目前已存在的相依性（`spring-boot-starter-actuator`、`micrometer-registry-*`、追蹤/OTel 相依性、`logback-spring.xml`）。Boot 4 將可觀測性模組化（`spring-boot-micrometer-*`、`spring-boot-opentelemetry`），但 starter 仍會將它們引入。

## 快速開始

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus   # 允許清單，在生產環境絕不使用 "*"
  endpoint:
    health:
      probes:
        enabled: true                     # /actuator/health/liveness 與 /readiness
      show-details: when-authorized
```

## 主題

- [Actuator、健康群組與探針、端點暴露](references/actuator.md)
- [Micrometer 指標與 Prometheus/OTLP 匯出](references/metrics.md)
- [Observation API 與搭配 OpenTelemetry 的追蹤](references/tracing-observation.md)
- [結構化記錄與相互關聯識別碼](references/logging.md)
- [Heapdump/threaddump 注意事項與執行階段診斷](references/dumps-and-diagnostics.md)

## 檢核清單

- [ ] 僅暴露必要的端點並予以保護；若可能請使用獨立的管理埠。
- [ ] 針對平台（Kubernetes）設定存活與整備探針；整備群組僅包含關鍵相依性。
- [ ] 指標匯出至所選的後端；已設定通用標籤（`application`、`env`）；無高基數標籤（使用者 ID、包含 ID 的 URL）。
- [ ] 審慎設定追蹤取樣機率（Boot 預設為 10%）。
- [ ] 記錄帶有追蹤/範圍 ID；在生產環境使用 JSON 結構化記錄。
- [ ] 自訂的觀測/指標具備測試。

## 本機執行階段洞察（選用）

若需要顯示執行中 Spring Boot 或 Quarkus 應用程式執行狀態的僅供本機開發者主控台（以及可選加入的 MCP 伺服器），請參閱 BootUI：https://github.com/jdubois/boot-ui 與 https://www.julien-dubois.com/boot-ui/。其代理技能可透過 `gh skill install jdubois/boot-ui skills/bootui` 安裝。

- 在新增任何相依性之前，請先徵求使用者同意。
- 僅在 dev/local 設定檔中使用（例如 Maven/Gradle 設定檔或 `developmentOnly` 設定）；絕不部署至生產環境。
- 請遵循 BootUI 自身的說明文件以取得座標與設定，而非複製至此。

另請參閱：<https://docs.spring.io/spring-boot/reference/actuator/observability.html> 與 <https://docs.micrometer.io/micrometer/reference/>。
