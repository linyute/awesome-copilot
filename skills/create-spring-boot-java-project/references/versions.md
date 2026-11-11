# 版本處理

## 規則

1. **既有專案：** 從 `pom.xml` / `build.gradle(.kts)` 讀取版本（Spring Boot parent 或外掛程式版本、`java.version`/工具鏈、`spring-boot-starter-test`）。維持這些版本。絕不隱式升級。
2. **新專案：** 在執行階段進行解析，僅在離線時遞補使用下表。
3. 絕不使用 `latest`、`LATEST` 或 `RELEASE` 作為版本，亦不使用管線 shell 安裝程式。

## 解析最新穩定版 Spring Boot

```bash
curl -fsS -H 'Accept: application/json' https://start.spring.io/metadata/client \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['bootVersion']['default'], d['javaVersion']['default'])"
```

- `bootVersion.default` 為目前穩定版本（可能會帶有 `.RELEASE` 後綴，例如 `4.1.1.RELEASE`；請將其去除：傳入 `4.1.1`）。
- 略過包含 `SNAPSHOT`、`M` 或 `RC`（里程碑/快照版本）的 ID，除非使用者明確要求。
- `javaVersion.default` 僅為 start.spring.io 的預設值。請選取已安裝 JDK 支援的最高 LTS 版本（`java -version`），並確保該版本有列於 `javaVersion.values` 中。
- 使用使用者要求的主要版本線。若使用者未指定，請使用最新穩定版；參閱 [spring-boot-4.md](spring-boot-4.md) 瞭解 3.x 與 4.x 之間的變更事項。
- start.spring.io 僅產生 Boot 4.0+（已驗證：`bootVersion=3.5.x` 會回傳 HTTP 400 "compatibility range is >=4.0.0"）。針對 Boot 3.5 專案，請勿使用產生器：手動撰寫建構檔案，使用 `spring-boot-starter-parent` 3.5.x（Maven Central 上的最新 3.5 版本，例如 3.5.16）、`spring-boot-starter-web` 與 `spring-boot-starter-test`，並加上 Maven/Gradle 包裝函式。建立包裝函式（`mvn wrapper:wrapper` / `gradle wrapper`）需要本機已安裝 Maven 或 Gradle；若兩者皆未安裝，請要求使用者安裝其一或改選 Boot 4。
- 驗證該選擇存在於 Maven Central 上：`curl -fsSI https://repo1.maven.org/maven2/org/springframework/boot/spring-boot/BOOT_VERSION/spring-boot-BOOT_VERSION.pom`。

## 遞補數值（離線，2026-10 檢視）

| 項目 | 數值 |
|------|-------|
| Spring Boot | 4.1.1 |
| Java | 25 (LTS) |
| PostgreSQL 映像 | `postgres:18-alpine` |
| Testcontainers | 由 Spring Boot BOM 管理；除非覆寫否則請勿固定版本 |
| JDK 映像 | `eclipse-temurin:25-jdk-noble` |
| GraalVM 映像 | `ghcr.io/graalvm/graalvm-community:25` |

這些數值會隨著時間過時：當 start.spring.io 可連線時，優先使用其回傳結果，並告知使用者使用了哪一個來源。

## 由 BOM 管理的相依性

請勿為 Spring 管理的相依性（Hibernate、Jackson、Testcontainers、PostgreSQL 驅動程式、JUnit）指定版本。僅固定 BOM 未管理的項目（例如 Maven 外掛程式或 Docker 映像標籤）。
