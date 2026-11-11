---
name: create-quarkus-project
description: '使用 Quarkus CLI、code.quarkus.io API 或 Maven 外掛程式建立新的 Quarkus 專案 (Maven 或 Gradle)，選擇擴充功能，並在開發模式下執行。當被要求建置結構、啟動或開始 Quarkus 應用程式或 REST API 時使用。'
---

# 建立 Quarkus 專案

## 1. 偵測環境

```bash
java -version          # Java 17、21 或 25 (Quarkus 3.40 建議使用 25，3.27 建議使用 21)
quarkus --version      # 選用的 Quarkus CLI
./mvnw -v || mvn -v    # 或 ./gradlew -v
```

如果資料夾中已包含 Quarkus 專案 (`io.quarkus.platform` BOM、`quarkus-maven-plugin` 或 `io.quarkus` Gradle 外掛程式)，請「不要」建置結構：讀取其 Quarkus 版本並保留該版本。對於新專案，請使用 https://code.quarkus.io/api/streams 上標記為建議的 stream (LTS stream；另請參閱 https://quarkus.io/support/)，並且不要自行捏造修補程式版本：讓工具自動挑選。Quarkus 4.0 仍處於搶先體驗 (beta) 階段，因此除非被要求，否則請勿使用。如果建議的 stream 中缺少某個擴充功能，CLI 會在背後以無訊息方式挑選較舊的 stream；請檢查產生的組建檔案中的 `quarkus.platform.version`。

## 2. 建立專案結構 (Scaffold，擇一)

Quarkus CLI (透過 https://quarkus.io/get-started/ 安裝，例如 SDKMAN `sdk install quarkus`)：

```bash
quarkus create app com.example:demo \
  --extension='rest-jackson,hibernate-orm-panache,jdbc-postgresql,hibernate-validator,smallrye-health' \
  --java=21 --maven        # 或 --gradle
```

沒有 CLI：Maven 外掛程式 (將版本釘選至 https://quarkus.io/guides/maven-tooling 中的目前版本，並將下方的 `QUARKUS_VERSION` 替換為該版本)：

```bash
mvn io.quarkus.platform:quarkus-maven-plugin:QUARKUS_VERSION:create \
  -DprojectGroupId=com.example -DprojectArtifactId=demo \
  -Dextensions='rest-jackson,hibernate-orm-panache,jdbc-postgresql' \
  -DbuildTool=maven        # 或 gradle
```

或者從 https://code.quarkus.io Web UI / REST API 產生 (`https://code.quarkus.io/d?g=com.example&a=demo&e=rest-jackson&b=MAVEN`) 並解壓縮。

## 3. 選擇擴充功能

| 需求 | 擴充功能 |
|---|---|
| REST + JSON | `rest-jackson` (Quarkus REST；非舊版 `resteasy`) |
| 資料庫 ORM | `hibernate-orm-panache`、`jdbc-postgresql` |
| 驗證 | `hibernate-validator` |
| 健康狀態 / 計量值 | `smallrye-health`、`micrometer-registry-prometheus` |
| 驗證與授權 | `oidc` 或 `smallrye-jwt` |
| OpenAPI | `smallrye-openapi` |
| REST 用戶端 | `rest-client-jackson` |
| 容器 | `container-image-jib` (或 `container-image-docker`) |

後續可使用 `quarkus extension add <name>` 或 `./mvnw quarkus:add-extension -Dextensions=<name>` 新增；`quarkus extension list --installable` 會列出可用選項。

## 4. 配置與執行

```
src/main/java/...          # resources、services、entities
src/main/resources/application.properties
src/main/docker/           # Dockerfile.jvm、Dockerfile.native、...
src/test/java/...          # @QuarkusTest / @QuarkusIntegrationTest
```

```bash
./mvnw quarkus:dev         # 或：quarkus dev / ./gradlew quarkusDev
```

產生的測試包含一個 `*IT` 類別，Maven 預設會略過該類別 (範本中的 `<skipITs>true</skipITs>`)；可使用 `./mvnw verify -DskipITs=false` 或 `-Dnative` 執行它。開發模式提供即時重新載入、位於 http://localhost:8080/q/dev-ui 的 Dev UI、Dev Services (自動容器) 以及持續測試 (按下 `r`)。封裝：`./mvnw package` (可執行的 `target/quarkus-app/quarkus-run.jar`)。

## 參考資料

- [組態設定](references/configuration.md)
- [資料庫 (Dev Services、Hibernate、Flyway/Liquibase)](references/database.md)
- [安全性基礎知識](references/security.md)
- [容器映像](references/container-image.md)
- [本機執行階段深入解析 (BootUI)](references/local-runtime-insights.md)

已在 Quarkus 3.40.1 (目前建議的 LTS stream) 上驗證 (scaffold、`./mvnw verify`、`./gradlew build`、開發模式、Dev Services PostgreSQL、搭配 Java 25 版本的 JDK 26)，並在 3.27.6 (較舊的 LTS) 上驗證 `./mvnw verify`。

相關技能：`quarkus-dev-services-and-testing`、`quarkus-native-and-container`。

## 上游來源 (升級前請閱讀)

擷取目標版本的頁面；當它們發生衝突時，請優先參考該頁面而非本技能。

- `quarkus update` (自動化升級，使用 OpenRewrite)：<https://quarkus.io/guides/update-quarkus>
- 移轉指南，每個次要版本一個 Wiki 頁面：<https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.20> (請變更版本)
- 版本發佈公告：<https://quarkus.io/blog/>
- LTS 政策與目前 LTS：<https://quarkus.io/blog/lts-releases/>
