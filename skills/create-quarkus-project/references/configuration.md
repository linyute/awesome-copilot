# 組態設定

Quarkus 的讀取順序 (優先順序由高至低)：系統屬性、環境變數、`.env`、`config/application.properties`、`src/main/resources/application.properties` (或搭配 `quarkus-config-yaml` 使用 `.yaml`)。

## 設定檔 (Profiles)

內建設定檔：`dev` (`quarkus:dev`)、`test`、`prod` (已封裝的應用程式)。

```properties
quarkus.http.port=8080
%dev.quarkus.log.level=DEBUG
%prod.quarkus.http.cors.enabled=false
```

環境變數對應：`quarkus.http.port` -> `QUARKUS_HTTP_PORT`。使用 `-Dquarkus.profile=staging` 或 `QUARKUS_PROFILE` 啟用特定設定檔。

## 型別安全組態

```java
@ConfigMapping(prefix = "app.mail")
public interface MailConfig {
    String from();
    @WithDefault("25") int port();
    Optional<String> replyTo();
}
```

透過建構子注入。僅對單一值使用 `@ConfigProperty(name = "app.name")`。在對應方法上使用 Bean Validation 註解進行驗證 (需要 `hibernate-validator`)。

## 秘密 (Secrets)

切勿提交秘密。請使用 `${DB_PASSWORD}` 運算式、環境變數、Kubernetes secrets 或保存庫 (vault) 擴充功能。保留一個 `.env` 檔案 (已加入 git-ignore) 用於本機覆寫；Quarkus 也會從已封裝應用程式的工作目錄載入該檔案，因此切勿將其部署。
