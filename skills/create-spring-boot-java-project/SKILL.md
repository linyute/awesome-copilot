---
name: create-spring-boot-java-project
description: '從 start.spring.io 建立新的 Spring Boot Java 專案（Maven 或 Gradle），並套用組態、PostgreSQL、記錄、安全性、測試與 Docker 的合理預設值。當需要鷹架建置、引導安裝或產生 Spring Boot 應用程式時使用。會偵測既有專案版本且絕不隱式升級。'
---

# 建立 Spring Boot Java 專案

使用 [start.spring.io](https://start.spring.io) 鷹架建置 Spring Boot 應用程式，然後套用一組精簡的主見預設值。目前範圍之外的項目：前端（Vue/React/Angular）、雲端部署（Azure）、Git 設定、CRaC 以及 AOT 映像。

## 步驟 0：建立前先行偵測

- 若工作目錄已包含 `pom.xml` 或 `build.gradle(.kts)`，此為**既有專案**：請勿重新產生。讀取其 Spring Boot、Java 與測試架構版本並遵循之。**絕不隱式升級版本**；應提出升級建議並等待使用者決定。
- 檢查工具：`java -version`（符合所選 Java 版本的 JDK）、`docker --version`（Testcontainers 與 Compose 所需）。在預設路徑上（透過 start.spring.io 的目前 Boot 版本）不需要預先安裝 Maven/Gradle：會使用產生的包裝函式（wrapper）。Boot 3.5 遞補方案需要安裝過一次 Maven 或 Gradle 以建立包裝函式（參閱 [versions.md](references/versions.md)）。
- 僅詢問缺少之處：專案名稱、群組識別碼（group id）、套件、建構工具（預設 **Maven**）、相依性（預設：web、actuator、validation、devtools；當需要資料庫或驗證時新增 `data-jpa`、`postgresql`、`security`、`docker-compose`、`testcontainers`）。

## 步驟 1：解析版本

遵循 [references/versions.md](references/versions.md)：在執行階段查詢 `https://start.spring.io/metadata/client` 以取得最新穩定 Spring Boot 版本，若離線則遞補至文件中記載的固定值。絕不要在任何地方寫死 `latest`。

## 步驟 2：產生專案

使用具有明確固定參數的 start.spring.io HTTP API（不使用管線安裝程式）。請替換大寫數值。

Maven：

```bash
curl -fsS https://start.spring.io/starter.zip \
  -d type=maven-project -d language=java -d packaging=jar \
  -d bootVersion=BOOT_VERSION -d javaVersion=JAVA_VERSION \
  -d groupId=com.example -d artifactId=demo -d name=demo \
  -d packageName=com.example.demo -d baseDir=demo \
  -d dependencies=web,actuator,validation,devtools \
  -o demo.zip && unzip -q demo.zip && rm demo.zip
```

Gradle：相同的指令，改用 `-d type=gradle-project`（Groovy DSL）或 `-d type=gradle-project-kotlin`（Kotlin DSL；語言仍為 `java`）。

檢查結果（`ls demo`，讀取建構檔案）並確保包裝函式（`mvnw` 或 `gradlew`）具備執行權限。若為資料庫專案，請加上 `-d dependencies=...,data-jpa,postgresql,docker-compose,testcontainers`。

## 步驟 3：套用預設值

| 領域 | 執行項目 | 參考資料 |
|------|-----------|-----------|
| Boot 3 與 4 的差異 | Starter 名稱、Jackson 3、測試模組 | [references/spring-boot-4.md](references/spring-boot-4.md) |
| 組態 | `application.properties` 或 `.yml`（與專案一致）、設定檔（profile）、`@ConfigurationProperties`、透過環境變數傳遞機密 | [references/configuration.md](references/configuration.md) |
| 資料庫 | PostgreSQL、Hibernate 設定、開發用的 Compose、測試用的 Testcontainers | [references/database.md](references/database.md) |
| 記錄 | SLF4J、參數化訊息、層級、結構化記錄 | [references/logging.md](references/logging.md) |
| 安全性 | Spring Security 基礎、安全預設值、Problem Details | [references/security.md](references/security.md) |
| Docker | JVM 映像與 GraalVM 原生映像 Dockerfile | [references/docker.md](references/docker.md) |
| 測試 | 參閱 `spring-boot-testing` 技能（slices、Testcontainers、Failsafe） | `skills/spring-boot-testing` |
| 最佳做法 | 參閱 `java-springboot` 技能與 `instructions/springboot.instructions.md` | `skills/java-springboot` |

保持點開頭的檔案（dotfiles）精簡：涵蓋 `target/`、`build/`、`.gradle/`、IDE 資料夾與 `.env` 的 `.gitignore`；絕不提交 `.env`（提交 `.env.sample`）。

## 步驟 4：驗證

1. 建構與測試：`./mvnw verify`（Maven）或 `./gradlew build`（Gradle）。
2. 執行：`./mvnw spring-boot:run` 或 `./gradlew bootRun`，接著 `curl -fsS localhost:8080/actuator/health` 必須回傳 `{"status":"UP"}`。
3. 回報所選版本以及任何被略過或延後的項目。

## 出處

改編自 Apache-2.0 技能 [jdubois/dr-jskill](https://github.com/jdubois/dr-jskill)；請參閱 [references/PROVENANCE.md](references/PROVENANCE.md)。
