# Actuator

相依性：`spring-boot-starter-actuator`。

## 暴露

- Web 暴露預設僅有 `health`（Boot 3/4）。請明確設定允許清單：`management.endpoints.web.exposure.include=health,info,metrics,prometheus`。
- 停用其餘端點：在 Boot 3.4+ 上設定 `management.endpoints.access.default=none`，接著啟用所選取的項目（`management.endpoint.<id>.access=read-only`）；較舊的 `management.endpoint.<id>.enabled` 在 3.3 及更早版本仍可使用。
- 移至內部連接埠：`management.server.port=9090`（以及 `management.server.address`）。
- 使用 Spring Security 進行防護：請參閱 `spring-security` 技能及其中的 `references/actuator-protection.md`。
- 資訊端點：`management.info.env.enabled=true`、`management.info.git.mode=simple`，以及透過建構外掛程式的 `build-info` 目標提供 `management.info.build`。

## 健康檢查

```yaml
management:
  endpoint:
    health:
      show-details: when-authorized
      roles: ACTUATOR_ADMIN
      probes:
        enabled: true
      group:
        readiness:
          include: readinessState,db
        liveness:
          include: livenessState
```

- 探針（`/actuator/health/liveness`、`/readiness`）在 Kubernetes 上會自動啟用；在其他環境中啟用需設定 `probes.enabled=true`（Boot 4 預設啟用它們）。
- 存活探針絕不能依賴外部系統（資料庫故障絕不能導致 Pod 重新啟動）。若需要，僅將資料庫、訊息代理程式等納入整備探針。
- 自訂指標：實作 `HealthIndicator`（或 `ReactiveHealthIndicator`）；透過設定逾時以保持檢查快速完成。
- 優雅關機：設定 `server.shutdown=graceful` 與 `spring.lifecycle.timeout-per-shutdown-phase=30s`。

## 其他實用端點

`metrics`、`prometheus`、`loggers`（於執行階段變更層級；需保護）、`httpexchanges`（需要 `HttpExchangeRepository` Bean）、`scheduledtasks`、`caches`、`startup`（需要 `BufferingApplicationStartup`）。將 `env`、`configprops`、`beans`、`mappings` 視為敏感端點。
