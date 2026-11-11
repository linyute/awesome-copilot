# 記錄 (Logging)

## 結構化記錄 (Boot 3.4+)

內建支援；無需額外相依性即可支援 ECS、Logstash 與 GELF 格式。

```yaml
logging:
  structured:
    format:
      console: ecs        # 亦可為：logstash, gelf
      file: ecs
    ecs:
      service:
        name: orders
        version: 1.4.0
        environment: prod
```

- 使用 `logging.structured.json.include/exclude/rename/add.*` 自訂 JSON。對於基於程式碼的自訂，實作 `StructuredLoggingJsonMembersCustomizer` 並使用 `logging.structured.json.customizer` 註冊其完整類別名稱，或在 `META-INF/spring.factories` 中的 `org.springframework.boot.logging.structured.StructuredLoggingJsonMembersCustomizer` 下列出實作。單獨的 Spring `@Bean` 不會被發現：記錄會在應用程式上下文之前初始化。
- 自訂格式：實作 `StructuredLogFormatter<E>` 並將 `logging.structured.format.console` 設定為其類別名稱。
- 本機使用純文字，生產環境設定檔中使用 JSON (`application-prod.yml`)。
- 堆疊追蹤塑造：`logging.structured.json.stacktrace.*`。

## 相互關聯識別碼

- 當 classpath 包含追蹤相依性時，`traceId` 與 `spanId` 會被置入 MDC，並顯示於預設記錄模式與結構化輸出中。
- 未啟用追蹤時，請自行設定相互關聯識別碼（透過 Servlet 過濾器將標頭值放入 `MDC`，並在 `finally` 中清除）。
- 自訂模式：`logging.pattern.correlation=[%X{traceId:-},%X{spanId:-}] `；透過 `logging.include-application-name`/`logging.include-application-group` 包含名稱（Boot 3.4+）。
- 將識別碼傳播至下游呼叫（對於啟用追蹤的用戶端會自動處理）。

## 最佳實踐

- 絕不要記錄秘密、權杖、密碼或完整的個人資料。
- 僅能透過受保護的 `loggers` 端點在執行階段變更記錄層級。
