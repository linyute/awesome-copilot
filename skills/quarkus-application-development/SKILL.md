---
name: quarkus-application-development
description: '撰寫 Quarkus 應用程式程式碼：使用 Quarkus REST 的 REST、驗證、例外狀況對應器、OpenAPI、設定、CDI (ArC)、使用 Panache 的 Hibernate ORM、Mutiny 與虛擬執行緒、使用 Kafka 的 Reactive Messaging、OIDC 安全性、健康狀態、度量指標、OpenTelemetry、容錯能力、REST 用戶端、排程器與快取。在現有 Quarkus 專案中實作或變更功能時使用。'
---

# Quarkus 應用程式開發

範圍：現有 Quarkus 專案內部的應用程式程式碼。專案建立請使用 `create-quarkus-project`；Dev Services 與測試請使用 `quarkus-dev-services-and-testing`；原生映像檔與容器映像檔請使用 `quarkus-native-and-container`；核心 JPA 對應與查詢設計若已安裝可使用選填的 `java-hibernate-jpa` 技能（否則請參閱 Hibernate ORM 指南 <https://quarkus.io/guides/hibernate-orm> 以及 Jakarta Persistence 文件）。

## 代理人規則

1. 優先偵測：讀取 `pom.xml`/`build.gradle` 中的 `quarkus.platform.version`、Java 版本以及已存在的擴充功能。保持該版本；使用專案已使用的元件（例如若存在 `quarkus-resteasy*` 則保留）。
2. 使用 `quarkus extension add <name>` 或 `./mvnw quarkus:add-extension -Dextensions=<name>` 新增擴充功能；絕不要手動猜測構件 ID 或版本（由平台 BOM 管理）。使用 `quarkus extension list --installable --search=<text>` 列出候選項。
3. 在新增 Kafka、OIDC/Keycloak 或任何新的基礎架構相依性前詢問使用者（它們會在開發/測試環境啟動容器並改變部署需求）。
4. 除非專案中已使用，否則絕不使用 Spring 相容性擴充功能（`quarkus-spring-*`）。
5. 使用開發模式（`./mvnw quarkus:dev`，然後進入 `/q/dev-ui`）與 `./mvnw verify` 進行驗證；為每個功能撰寫一個 `@QuarkusTest`。未執行前切勿聲稱某功能可運作。
6. 使用 `jakarta.*` 匯入、使用 record 作為 DTO、讓精簡的資源委派給服務處理。
7. 絕不要硬編碼機密或將認證資訊新增至 `application.properties`；請參閱 `references/config-cdi.md`。

## 快速決策

| 需求 | 使用項目 | 詳細資料 |
|---|---|---|
| JSON REST API | `quarkus-rest-jackson`、`quarkus-hibernate-validator`、`quarkus-smallrye-openapi` | `references/rest.md` |
| 具型別設定 | `@ConfigMapping`；單一值使用 `@ConfigProperty` | `references/config-cdi.md` |
| Bean | `@ApplicationScoped`（預設），僅純無狀態持有者使用 `@Singleton` | `references/config-cdi.md` |
| 資料庫 | `quarkus-hibernate-orm-panache` + JDBC 驅動程式，Repository 模式 | `references/persistence.md` |
| 非同步 / 阻斷 | 預設為命令式；需要時使用 `@RunOnVirtualThread` 或 `Uni` | `references/reactive-messaging.md` |
| 傳訊 | `quarkus-messaging-kafka`（SmallRye Reactive Messaging） | `references/reactive-messaging.md` |
| 認證/授權 | `quarkus-oidc`、`@RolesAllowed` | `references/security-oidc.md` |
| 維運 | `quarkus-smallrye-health`、`quarkus-micrometer-registry-prometheus`、`quarkus-opentelemetry`、`quarkus-smallrye-fault-tolerance` | `references/observability-resilience.md` |
| 對外 HTTP、排程、快取 | `quarkus-rest-client-jackson`、`quarkus-scheduler`、`quarkus-cache` | `references/observability-resilience.md` |

## 耗費時間的常見陷阱

- Quarkus 在建構階段解析 CDI：未使用的 Bean 可能會被移除。僅透過程式設計方式查閱的 Bean 需要加上 `@Unremovable`。
- 切勿從另一個 Bean 或測試中讀取或寫入正常範圍 Bean（`@ApplicationScoped`）的公用欄位：您存取的是客戶端代理，而非實例本身（已驗證：透過代理讀取的計數器欄位傳回 0）。請使用方法。
- 切勿在事件迴圈上進行阻斷（在 I/O 執行緒上執行的 `@NonBlocking` 方法、`Uni`/`Multi` 傳回型別）。從該方法中移除任何現有的 `@NonBlocking`（將其與 `@Blocking` 或 `@RunOnVirtualThread` 結合會導致建構失敗），然後新增 `@Blocking` 或 `@RunOnVirtualThread`（請參閱 `references/reactive-messaging.md`）。
- 建構階段屬性的變更需要重新建構；執行階段屬性可透過環境變數（`QUARKUS_DATASOURCE_JDBC_URL`）進行覆寫。
- 請勿在 `%dev`/`%test` 中設定資料庫/代理器/Keycloak 的 URL：這會停用 Dev Services。
- `drop-and-create` 結構描述管理僅適用於開發/測試環境；正式環境請使用 Flyway 或 Liquibase。

已在 Quarkus 3.40.1 與 3.27.6（Java 21 目標，Maven）上搭配鷹架應用程式並透過 `mvn verify` 完成驗證（15 個測試：REST+驗證+對應器、OpenAPI、設定對應、PostgreSQL Dev Services 上的 Panache、Kafka Dev Service 來回傳輸、Keycloak Dev Service 權杖、健康狀態、度量指標、容錯、快取、排程器）。請對照專案版本再次確認名稱。
