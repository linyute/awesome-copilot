---
name: java-testcontainers
description: '使用 Testcontainers 2.x 在純 Java 中撰寫可靠的整合測試：JUnit Jupiter 生命週期、singleton 容器、重複使用、通用容器、等待策略、網路、初始化指令碼、Docker Compose、CI 以及 Docker/Podman 設定。在新增或修正 Testcontainers 測試，或從 1.x 遷移時使用。不限特定框架。'
---

# Java Testcontainers (2.x)

在 Docker 中為整合測試執行真實依賴項（資料庫、訊息代理程式、快取）。本技能不限特定框架。若專案使用 Spring Boot 且已安裝 `spring-boot-testing` 技能，請針對 `@ServiceConnection`、`@DynamicPropertySource` 與測試切片使用該技能；針對 Quarkus，請依賴 Dev Services（Quarkus 技能/文件），而非手動綁定容器。

## 工作流程

1. 偵測現有版本（`pom.xml` / `build.gradle`）與測試框架（JUnit Jupiter）。Testcontainers 2.x 不支援 JUnit 4。
2. 挑選符合生產環境的最小容器（相同的資料庫引擎與主要版本；切勿使用 H2 取代您關心的實際行為）。
3. 選擇生命週期（下表）、設定等待機制，並將連線詳細資訊連結至受測程式碼。
4. 在本機與 CI 中執行；檢查 Docker 的可用性與速度。

## Testcontainers 2.x 重點要素

- Artifact 均加上 `testcontainers-` 前綴：`org.testcontainers:testcontainers-junit-jupiter`、`testcontainers-postgresql`、`testcontainers-mysql`、`testcontainers-kafka` 等（1.x 為 `junit-jupiter`、`postgresql`）。核心模組仍為 `org.testcontainers:testcontainers`。
- 模組容器類別移至各模組專屬套件，例如 `org.testcontainers.postgresql.PostgreSQLContainer`（1.x 為 `org.testcontainers.containers.PostgreSQLContainer`）。核心類別（`GenericContainer`、`Network`、`wait.strategy.*`）保留在 `org.testcontainers.containers` 下。
- 模組容器類別不再使用泛型：為 `PostgreSQLContainer`，而非 `PostgreSQLContainer<?>`。
- 使用 BOM 保持版本一致：`org.testcontainers:testcontainers-bom:2.0.5`（在 Maven Central 上確認最新發行版本）。
- Docker Compose：使用 `ComposeContainer`（Compose v2）；`DockerComposeContainer` 仍存在於 2.0.5 中（較舊的 API）；優先使用 `ComposeContainer`。

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>testcontainers-bom</artifactId>
      <version>2.0.5</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<dependencies>
  <dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers-junit-jupiter</artifactId>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers-postgresql</artifactId>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.7.14</version>
    <scope>test</scope>
  </dependency>
</dependencies>
```

Gradle：`testImplementation platform("org.testcontainers:testcontainers-bom:2.0.5")`，接著新增不帶版本的相同 Testcontainers artifacts，再加上 `testRuntimeOnly "org.postgresql:postgresql:42.7.14"`。Testcontainers 模組未隨附 JDBC 驅動程式；當專案已依賴該驅動程式時（例如透過 Spring Boot 的 BOM），可略過明確宣告驅動程式。

## 最小測試範例

```java
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
class CustomerStoreIT {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    @Test
    void connects() throws Exception {
        try (var c = java.sql.DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())) {
            org.junit.jupiter.api.Assertions.assertTrue(c.isValid(2));
        }
    }
}
```

一律鎖定映像檔標籤（切勿使用 `latest`）；與生產環境主要版本保持一致。

## 生命週期決策

| 需求 | 模式 |
| --- | --- |
| 每個測試類別一個容器 | `static @Container` 欄位 |
| 每個測試方法全新的容器（緩慢，強隔離） | 非靜態 `@Container` 欄位 |
| 整個測試執行期間一個容器（最快速） | singleton 存放器，請參閱 `references/lifecycle-and-reuse.md` |
| 本機多次執行間保留容器 | `withReuse(true)` + 選擇加入屬性，僅限本機 |

優先採用共用容器並隔離**資料**（截斷/復原、各測試使用獨立結構描述或資料庫），而非重啟容器。

## 檢查清單

- [ ] 映像檔標籤已鎖定且與生產環境相符。
- [ ] 等待策略有意義（模組預設值通常合適；針對 `GenericContainer` 自訂）。
- [ ] 無固定主機連接埠；使用 `getMappedPort`/`getHost`。
- [ ] 在可能的情況下跨類別共用容器（singleton）。
- [ ] 整合測試命名為 `*IT` 並由 failsafe（Maven）或個別的 Gradle 測試任務執行，讓單元測試保持快速。
- [ ] 測試容器中沒有密碼或真實憑證。
- [ ] CI 執行器具備 Docker；失敗時能擷取記錄輸出。

## 參考資料

- `references/lifecycle-and-reuse.md`：個別類別/個別方法、singleton 模式、重複使用、平行執行、資料隔離。
- `references/containers-and-waiting.md`：模組對比 `GenericContainer`、等待策略、環境/設定、初始化指令碼、複製檔案、網路、多容器設定、Docker Compose。
- `references/environment-ci-troubleshooting.md`：Docker/Podman/Colima 設定、CI、私有登錄檔、效能、常見錯誤、1.x 至 2.x 遷移對照表。

官方文件：<https://java.testcontainers.org/>

升級至 2.x：java.testcontainers.org 上未找到專屬的遷移頁面；請閱讀目標版本的 2.0.0 版本資訊 <https://github.com/testcontainers/testcontainers-java/releases/tag/2.0.0> 與所有發行版本 <https://github.com/testcontainers/testcontainers-java/releases>，若有衝突以其為準。
