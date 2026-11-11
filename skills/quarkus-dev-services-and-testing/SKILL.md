---
name: quarkus-dev-services-and-testing
description: 'Quarkus Dev Services 與測試：零設定容器、@QuarkusTest、@QuarkusIntegrationTest、測試資源、RestAssured、@InjectMock、設定檔與持續測試。在 Quarkus 專案中撰寫或修正測試時使用。'
---

# Quarkus Dev Services 與測試

請先檢查專案的 Quarkus 版本。框架無關的 Testcontainers 用法若已安裝可使用選填的 `java-testcontainers` 技能（否則請參閱 <https://java.testcontainers.org/>）；本技能僅涵蓋 Quarkus 特有功能。

## Dev Services

在開發與測試模式下，當存在相關擴充功能且未設定連線時，Quarkus 會自動啟動容器（PostgreSQL、MySQL、Kafka、Redis、Keycloak，...）（需要 Docker 或 Podman）。

```properties
# Global switch
quarkus.devservices.enabled=true
%dev.quarkus.datasource.devservices.image-name=postgres:17
# Reuse container across restarts (also requires testcontainers.reuse.enable=true in ~/.testcontainers.properties)
quarkus.datasource.devservices.reuse=true
# Fixed port (optional)
quarkus.datasource.devservices.port=5432
# Share between apps in dev mode
quarkus.kafka.devservices.shared=true
```

使用 `quarkus.<ext>.devservices.enabled=false` 停用特定項目；明確設定 URL/主機也會停用它。Dev UI（`/q/dev-ui`）列出執行中的服務。

## 測試

```java
@QuarkusTest
class GreetingResourceTest {
    @Test
    void hello() {
        given().when().get("/hello").then().statusCode(200).body(is("Hello"));
    }
}
```

相依性，test 範圍：`io.quarkus:quarkus-junit`（3.31+，3.40 範本所產生的項目）或 `quarkus-junit5`（3.27 範本；在 3.40 上仍有發布且可解析）以及 `io.rest-assured:rest-assured`。保留專案已使用的任何一種。

- 在測試中使用 `@Inject` 插入 Bean；使用 `io.quarkus.test.InjectMock` 模擬 CDI Bean（`quarkus-junit-mockito`，舊稱為 `quarkus-junit5-mockito`；已在 3.40.1 上驗證模擬 `PanacheRepository` Bean）。
- 安全性：`@TestSecurity(user="alice", roles="admin")`（`quarkus-test-security`）。
- 設定檔：`@TestProfile(MyProfile.class)` 搭配 `QuarkusTestProfile#getConfigOverrides()`；會重新啟動應用程式，因此請謹慎使用。
- 交易：`@TestTransaction` 在測試後回復。
- `@QuarkusIntegrationTest` 針對已封裝的構件（jar、原生二進位檔或容器）執行；您無法在該處插入 Bean，僅能透過 HTTP 進行呼叫。

## 測試資源

```java
public class WireMockResource implements QuarkusTestResourceLifecycleManager {
    public Map<String,String> start() { /* start, return config overrides */ return Map.of(); }
    public void stop() { }
}

@QuarkusTest
@WithTestResource(WireMockResource.class)   // io.quarkus.test.common.WithTestResource
class MyTest { }
```

`@WithTestResource`（已在 3.40.1 上驗證）套用於受標註的測試類別；當資源組合變更時 Quarkus 會重新啟動應用程式。較舊的 `@QuarkusTestResource` 在 3.40.1 上仍可編譯並執行，但除非設定 `restrictToAnnotatedClass = true`，否則會全域套用至所有測試。請勿在測試類別中為資源提供的值放置 `@ConfigProperty` 插入點：測試類別會被當作 Bean 進行掃描，且對於缺少該資源的其他測試類別，應用程式將無法啟動。當擴充功能支援時，偏好使用 Dev Services 而非自訂資源。

## 執行

```bash
./mvnw test                 # unit/@QuarkusTest
./mvnw verify -DskipITs=false  # also runs *IT via maven-failsafe-plugin
```

常見陷阱：`*IT` 類別（`@QuarkusIntegrationTest`）由 Failsafe 在 `verify` 階段執行，且需要 `quarkus-maven-plugin` 的 `build` 目標以及專案範本所產生的 Failsafe 設定（附帶 `java.util.logging.manager` 與 `maven.home` 系統屬性）。`./mvnw test` 會靜默略過它們，且 3.27 與 3.40 範本亦設定了 `<skipITs>true</skipITs>`，因此單純的 `./mvnw verify` 也會略過它們（已驗證）：請傳遞 `-DskipITs=false`（或 `-Dnative`，其設定檔會反轉該旗標）。使用 `-Dnative` 且在 macOS 或 Windows 上進行容器建構時，二進位檔是 Linux ELF，IT 會以 `Exit code is: '126'` 失敗；針對這些情況請使用本機 Mandrel/GraalVM 建構。

持續測試：執行 `./mvnw quarkus:dev` 並按 `r` 開始或重新執行測試，按 `p` 暫停測試（`h` 列出快速鍵）；一旦執行，測試會在程式碼變更時重新執行（`quarkus.test.continuous-testing=enabled|paused|disabled`）。

已在 Quarkus 3.40.1（JDK 26，Docker Desktop）上驗證：搭配 Dev Services PostgreSQL（預設為 `postgres:18`）的 `@QuarkusTest`、`@TestTransaction`、`@TestProfile`、`@TestSecurity`、`@InjectMock`，以及透過 Failsafe 的 `*IT`。在 3.27.6 上亦驗證了 `@QuarkusTest` 與 Dev Services。

## 檢查清單

- 在撰寫自訂資源前先使用 Dev Services。
- 讓 `@QuarkusTest` 類別共用相同的設定檔/資源以避免重新啟動。
- 不要硬編碼連接埠；RestAssured 會自動使用 `quarkus.http.test-port`。

另請參閱：<https://quarkus.io/guides/dev-services>、<https://quarkus.io/guides/getting-started-testing>；升級請使用 `quarkus update`（<https://quarkus.io/guides/update-quarkus>）。
