# 記錄

Spring Boot 預設透過 SLF4J 使用 Logback 進行記錄。程式碼必須僅相依於 SLF4J API（`org.slf4j.Logger`），絕不可相依於 Logback 或 `System.out`。

```java
private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

logger.info("Order {} created for customer {}", order.id(), customerId);
logger.error("Payment failed for order {}", orderId, exception); // 例外狀況置於最後，無預留位置
```

## 規則

- 使用參數化訊息，而非字串串接。
- 層級：`ERROR` = 需要注意；`WARN` = 可復原的異常狀況；`INFO` = 商業事件與生命週期；`DEBUG`/`TRACE` = 診斷資訊（正式環境中關閉）。
- 絕不記錄機密、權杖、密碼或個人資料；改為記錄識別碼。
- 例外狀況僅在處理該例外之處記錄一次，並附帶堆疊追蹤（stack trace）。
- 請勿在緊湊迴圈（tight loops）內部進行記錄。

## 組態

```properties
logging.level.root=INFO
logging.level.com.example=INFO
# dev 設定檔：logging.level.com.example=DEBUG
```

優先使用 properties 設定，而非自訂 `logback-spring.xml`；僅在 properties 無法滿足需求（appenders、輪替檔案）時才新增 XML。

## 結構化記錄（Spring Boot 3.4+）

針對正式環境與記錄彙總，無需額外相依性即可輸出 JSON：

```properties
logging.structured.format.console=ecs
```

其他內建格式：`logstash`、`gelf`。在容器中，將記錄輸出至主控台（console），並讓平台進行收集。

## 關聯性（Correlation）

使用 Micrometer Tracing / `spring-observability` 技能，讓 trace 與 span id 顯示在記錄中；請求範圍（request-scoped）數值使用 MDC（`MDC.put("requestId", ...)`，並務必在 `finally` 中清除）。
