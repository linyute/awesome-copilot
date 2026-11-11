# Heapdump、threaddump 與執行階段診斷

## 注意事項

- `/actuator/heapdump` 會傳回包含記憶體中所有內容的 HPROF 檔案：憑證、權杖、個人資料。它也會暫停 JVM 且檔案大小可能達數 GB。
- `/actuator/threaddump` 會揭露類別名稱、執行緒狀態，有時還包含參數；這是攻擊者的偵察輔助工具。
- 政策（與 `java-diagnostics` 共享）：絕不要透過公開 HTTP 暴露任何一個。唯一的例外是在具備驗證（管理員角色）、TLS 與網路限制（獨立管理埠，僅限內部）的暫時期間，經使用者同意後開啟，事後必須移除。
- 將下載的傾印視為機密資料；加密儲存，分析後刪除，絕不要附加至公開的工作單中。
- Boot 3.x/4.x 可透過 `management.endpoint.heapdump.access=none` 限制存取（Boot 3.4+）；在舊版本中使用 `enabled=false`。

## 安全地使用它們

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,threaddump     # 僅在需要時暴露 heapdump
  endpoint:
    threaddump:
      access: read-only
```

搭配 Spring Security 鏈，將 `EndpointRequest.to("heapdump","threaddump")` 限制為管理員角色（請參閱 `spring-security`）。

## 深入診斷

關於 JDK 工具（`jcmd`、`jstack`、`jfr`、`jmap`、Eclipse MAT、JFR 記錄與分析），請使用 `java-diagnostics` 技能。Actuator 指標（`jvm.memory.used`、`jvm.gc.pause`、`hikaricp.connections.*`、`executor.*`）通常會告訴你該使用哪種工具。
