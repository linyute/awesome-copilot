# Docker

提供四種多階段（multi-stage）Dockerfile：JVM 與 GraalVM 原生映像，分別適用於 Maven 與 Gradle（Groovy 或 Kotlin DSL）。將所需檔案複製到專案根目錄，並使用 `-f` 建構。AOT 與 CRaC 映像則已延後處理。

| | Maven | Gradle |
|--|-------|--------|
| JVM 映像 | [../assets/Dockerfile](../assets/Dockerfile) | [../assets/Dockerfile-gradle](../assets/Dockerfile-gradle) |
| 原生映像 | [../assets/Dockerfile-native](../assets/Dockerfile-native) | [../assets/Dockerfile-native-gradle](../assets/Dockerfile-native-gradle) |

已在 Boot 4.1.1（web + actuator + validation）、arm64 Docker Desktop 上驗證：四者皆可成功建構並提供 `/hello` 與 `/actuator/health` 服務。JVM 映像大小約為 200 MB，建構時間在一分鐘以內（啟動時間約 2 秒）；原生映像大小約為 175 MB，建構需耗時 2 分 20 秒至 2 分 55 秒（約需 6 GB 的建構器記憶體），啟動時間約 0.09 秒。Gradle 建構會將工具鏈（toolchain）設定為與建構階段相同的 Java 版本（25）。

## 選擇方案

| | JVM 映像 | 原生映像 |
|--|-----------|--------------|
| 建構時間 | 快 | 慢，消耗大量記憶體（數 GB） |
| 啟動時間 / 記憶體 | 數秒 / 較高 | 毫秒級 / 低 |
| 相容性 | 支援所有項目 | 需要 GraalVM 相容的函式庫；可能需要反射提示（reflection hints） |
| 選用時機 | 預設選擇 | 縮減至零（scale-to-zero）、CLI 類型、嚴格的記憶體限制 |

原生映像需要在產生專案時包含 `native` 相依性（`-d dependencies=...,native`）以及 Spring Boot `native` Maven profile（當選取該相依性時由 start.spring.io 自動納入）。

## 所提供 Dockerfile 的特性

- 多階段：在 JDK/GraalVM 映像中建構，在精簡的執行階段映像中執行。
- JVM：將 Boot jar 解壓縮為圖層（layers）（`java -Djarmode=tools -jar app.jar extract --layers --launcher`）以獲得更佳快取效果，執行階段透過 `jlink` 組裝，最終基底為 distroless `nonroot`（無 shell、無套件管理工具）。
- 原生：可執行檔使用 `-H:+StaticExecutableWithDynamicLibC` 建構，並複製至 distroless `nonroot`。選取可執行檔的 `find` 指令必須略過 `*.so`：GraalVM 25 會在其旁留下可執行的 `libjava.so`/`libjvm.so` 虛設常式（stubs），若複製到這些檔案會導致容器結束並回傳 139（記憶體區段錯誤 segfault）。
- 以非 root（non-root）使用者執行，公開 8080，JVM 旗標透過 `JAVA_TOOL_OPTIONS` 傳遞（無 shell 可展開 `JAVA_OPTS`）。
- 固定基底映像標籤（`eclipse-temurin:25-jdk-noble`、`ghcr.io/graalvm/graalvm-community:25`、`gcr.io/distroless/base-debian12:nonroot`）；需符合專案的 Java 版本並於變更時更新。考量重現性，建議透過 digest 固定版本。
- 不使用 Docker `HEALTHCHECK`（distroless 沒有 curl）；由協調器（orchestrator）探測 `/actuator/health`（存活/就緒性探針：`management.endpoint.health.probes.enabled=true`）。
- 維護 `.dockerignore`（`target/`、`build/`、`.git`、`.env`、IDE 檔案），以使機密與建構產物留在 context 之外。

## 建構與執行

```bash
docker build -t my-spring-app .
docker run --rm -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/mydb \
  -e SPRING_DATASOURCE_USERNAME=user -e SPRING_DATASOURCE_PASSWORD=password \
  my-spring-app
```

不使用 Dockerfile 的替代方案：`./mvnw spring-boot:build-image` 或 `./gradlew bootBuildImage`（Cloud Native Buildpacks；Maven 原生建構加上 `-Pnative`，Gradle 需要 `org.graalvm.buildtools.native` 外掛程式）。已在 Boot 4.1.1（web + actuator + validation + data-jpa，Java 25）上驗證：Maven 原生 build-image 約 2 分 40 秒，282 MB 映像；Gradle `bootBuildImage` 需 2-4 分鐘，映像在 0.1-0.2 秒內啟動，且在 native-build-tools 1.1.7 與 1.1.8 下 `/actuator/health` 回傳 UP。曾在 Gradle 上見過原生映像在啟動時因 `Invalid logger interface org.hibernate.validator.internal.util.logging.Log (implementation not found)` 損毀一次，但無法重現；此情況符合 [graalvm/native-build-tools#1017](https://github.com/graalvm/native-build-tools/issues/1017)（Gradle `collectReachabilityMetadata` 將 hibernate-validator metadata 覆寫為 jboss-logging metadata，留下約 2 KB 的檔案）。若發生此問題，請檢查 `unzip -l build/libs/*.jar | grep hibernate-validator.*reachability-metadata.json`（正常狀態約 150 KB），將 `org.graalvm.buildtools.native` 升級至最新版本並使用 `--no-build-cache` 重新建構；務必執行映像並呼叫 `/actuator/health` 測試。

## 開發

在開發期間，使用 `spring-boot-docker-compose` 搭配 `compose.yaml` 處理相依性（參閱 [database.md](database.md)）；請勿在開發期間將應用程式本身容器化。
