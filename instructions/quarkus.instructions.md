---
applyTo: '**/*.java, **/application*.properties, **/application*.yml, **/application*.yaml, **/pom.xml, **/build.gradle, **/build.gradle.kts'
description: 'Quarkus 開發標準與指示'
---

- 僅在專案使用 Quarkus（`io.quarkus` 相依性或 Quarkus Maven/Gradle 外掛程式）時套用這些指示。
- 在提出變更建議之前，請先檢查專案現有的 Quarkus 和 Java 版本（pom.xml、build.gradle、`quarkus.platform.version`）；除非被要求升級，否則請保持原樣。對於新專案，請以來自 https://code.quarkus.io/api/streams 的建議串流為目標（測試時為 3.40；4.0 仍處於測試階段）以及 Java 21+（最低 Java 17）。切勿在建議中寫死修補版本號；請使用 Quarkus BOM。

## 相依性與建構

- 透過 Quarkus 擴充功能新增功能（`./mvnw quarkus:add-extension -Dextensions=...` 或 `quarkus extension add`），版本由平台 BOM 管理。
- 對於新專案和明確移轉，請使用 Quarkus REST（`quarkus-rest`、`quarkus-rest-jackson`）。在現有的 RESTEasy Classic（`quarkus-resteasy*`）專案中保持該技術堆疊：兩者不相容，混合使用會導致建構失敗。
- 使用 `./mvnw quarkus:dev`（或 `./gradlew quarkusDev`）進行開發；保留 Maven/Gradle wrapper。

## CDI 與程式碼

- 使用建構函式插入；在單一建構函式上 `@Inject` 是可選的。避免在生產程式碼中使用欄位插入。
- 優先使用 `@ApplicationScoped` bean；僅使用 `jakarta.*` 匯入。
- 對 DTO 使用 record。保持 REST 資源精簡並委派給服務層。
- 對分組的型別安全組態使用 `@ConfigMapping` 介面；對單一值使用 `@ConfigProperty`。切勿寫死機密資訊；使用環境變數或機密存放區，以及設定檔（profiles）（`%dev`、`%test`、`%prod`）。
- 使用 `quarkus.log.*` 和 JBoss Logging（或 SLF4J）進行記錄。

## REST 與驗證

- 傳回明確的狀態碼並集中對應錯誤，而非在每個資源中使用 try/catch。在 Quarkus REST 專案中，使用 `RestResponse`/`Response`、`@ResponseStatus` 和 `@ServerExceptionMapper`；在 RESTEasy Classic 專案中這些不可用，因此請使用 Jakarta REST `Response` 和帶有 `@Provider` 註釋的 `ExceptionMapper`。
- 使用 Hibernate Validator（`quarkus-hibernate-validator`、`@Valid`）驗證輸入。
- 為生產服務新增 `quarkus-smallrye-health` 和計量指標（`quarkus-micrometer-registry-prometheus` 或其他 Micrometer 登錄擴充功能；僅 `quarkus-micrometer` 不會匯出任何內容）；僅向受信任的網路公開它們。

## 資料

- 使用 Hibernate ORM with Panache（`quarkus-hibernate-orm-panache`）；對於非簡單領域優先使用 repository 模式（`PanacheRepository<T>`），簡單領域則使用 active record。
- 在修改資料的服務或資源方法上加上 `@Transactional`；對清單查詢進行分頁。
- 在生產環境中使用 Flyway 或 Liquibase 管理結構結構描述（schema），而非 `drop-and-create`。
- 在開發/測試中依賴 Dev Services 來取得資料庫和訊息中介軟體（brokers）；請勿在 `%dev`/`%test` 中為其設定 URL。

## 安全性

- 使用 `quarkus-oidc`（或 `quarkus-smallrye-jwt`）進行驗證，並使用 `@RolesAllowed`/`quarkus.http.auth.permission.*` 進行授權。預設保護端點安全性。

## 測試

- 對應用程式測試使用 `@QuarkusTest` 搭配 RestAssured，對封裝的 jar/原生/容器測試使用 `@QuarkusIntegrationTest`，對 CDI 模擬使用 `@InjectMock`。
- 對外部相依性使用 Dev Services 和 `QuarkusTestResourceLifecycleManager`；在開發模式中使用持續測試。
- 使用 `./mvnw verify -DskipITs=false` 執行 `*IT` 測試（Failsafe；產生的 pom 會設定 `skipITs=true`），而非 `test`。測試成品為 `quarkus-junit`（3.31+）或 `quarkus-junit5`（較舊版本）；保持專案所使用的版本。

## 避免事項

- 目標為原生（native）時，使用大量反射的函式庫而未加上 `@RegisterForReflection`。
- 在事件迴圈（event loop）上進行封鎖呼叫（使用 `@Blocking` 或搭配 `@RunOnVirtualThread` 的虛擬執行緒）。
- 吞掉例外狀況或寫死組態數值。

升級 Quarkus：在編輯之前，請先執行 `quarkus update`（<https://quarkus.io/guides/update-quarkus>）並閱讀該版本的移轉指南：<https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.20>（變更版本號）。