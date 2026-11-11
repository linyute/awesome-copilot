# 建置工具、相依性與弱點

下列命令是在 Maven 3.10.0 / 3.9.11 (包裝函式) 與 Gradle 9.8.1 搭配 JDK 21 與 25 上執行，除非標記為未驗證。

## Maven

```bash
mvn -v                               # 顯示 Maven 以及其執行的 JDK；檢查其是否符合專案的發行版本
./mvnw -B verify                     # 編譯 + 單元測試 + 整合測試 (+ 繫結至 verify 的檢查)
./mvnw -B -q test                    # 僅單元測試
./mvnw -B -pl service -am verify     # 單一模組及其相依項目
./mvnw -B dependency:tree -Dincludes=org.slf4j
./mvnw -B versions:display-dependency-updates
./mvnw -B versions:display-plugin-updates
```

產生包裝函式（僅在使用者需要時）：`mvn wrapper:wrapper -Dmaven=3.9.11` 會建立 `mvnw`、`mvnw.cmd`、`.mvn/wrapper/maven-wrapper.properties`（已驗證，包裝函式 3.3.4，僅含指令碼的發行版本，會在首次執行時下載 Maven）。認可這些檔案並將 `.mvn/` 保留在版本控制中。

最小 `pom.xml` 必要設定：

```xml
<properties>
  <maven.compiler.release>21</maven.compiler.release>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

鎖定外掛版本（驗證時使用了 `maven-compiler-plugin` 3.16.0、`maven-surefire-plugin` 3.6.0、`maven-jar-plugin` 3.5.1），而非依賴 Maven 的預設值；明確的 `<release>` 優於 `source`/`target`。

`versions:display-dependency-updates` 亦會提出預覽版本的建議（其曾建議 `slf4j-api 2.1.0-alpha1`）。使用 `-Dmaven.version.ignore='(?i).*(alpha|beta|rc|-m)[-.0-9]*'` 予以隱藏（已驗證：alpha 版本消失）。回報更新；未經詢問切勿套用重大升級。

多模組：帶有 `<packaging>pom</packaging>`、`<modules>` 與 `<dependencyManagement>`/`<pluginManagement>` 的 parent `pom.xml`；子模組繼承版本。切勿使用 `-Dmaven.test.failure.ignore` 來換取建置通過。

## Gradle

```bash
./gradlew build                      # 編譯 + 測試 + 檢查
./gradlew test --tests 'demo.OrdersTest'
./gradlew dependencies --configuration runtimeClasspath
./gradlew dependencyInsight --dependency slf4j-api --configuration runtimeClasspath
./gradlew --version                  # Gradle + JVM
```

產生包裝函式：`gradle wrapper --gradle-version 9.8.1`（已驗證；建立 `gradlew`、`gradlew.bat`、`gradle/wrapper/*`）。稍後僅在收到要求時使用 `./gradlew wrapper --gradle-version <v>` 進行升級。

```kotlin
plugins { java }
repositories { mavenCentral() }
java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }
tasks.withType<JavaCompile>().configureEach { options.release = 21 }
dependencies {
    implementation("org.slf4j:slf4j-api:2.0.20")
    runtimeOnly("ch.qos.logback:logback-classic:1.6.5")
    testImplementation(platform("org.junit:junit-bom:6.0.3"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
tasks.test { useJUnitPlatform() }
```

工具鏈使 Gradle 能挑選或下載正確的 JDK；保持工具鏈版本等於發行版本。當專案已具備版本目錄 (`gradle/libs.versions.toml`) 時優先使用它。僅在 `java-library` 專案中使用 `api` 與 `implementation` 的區隔。

## 相依性維護規範

- BOM：Maven 在 `dependencyManagement` 中使用 `<scope>import</scope>`；Gradle 使用 `platform("group:bom:version")`。
- 當可轉移版本不正確時，找出是誰引入的（`dependency:tree` / `dependencyInsight`），接著使用 `dependencyManagement` 或帶有原因註解的 Gradle `constraints {}` 區塊進行覆寫。
- 無充分理由切勿混用兩個記錄後端或兩個 JSON/對應函式庫；檢查樹狀結構是否有重複（例如同時存在 `logback-classic` 與 `slf4j-simple`）。
- 移除未使用的相依性（`mvn dependency:analyze` 回報已使用但未宣告以及已宣告但未使用；在刪除前請手動檢視，因為反射與僅限執行階段的函式庫屬於偽陽性）。
- 正確設定範圍：測試函式庫為 `test`，JDBC 驅動程式/記錄後端為 `runtime`。

## 自動化更新

Dependabot (`.github/dependabot.yml`)，此處未驗證但屬標準做法：

```yaml
version: 2
updates:
  - package-ecosystem: maven        # 或 gradle
    directory: "/"
    schedule: { interval: weekly }
    groups:
      minor-and-patch:
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: "/"
    schedule: { interval: weekly }
```

Renovate (`renovate.json`) 是替代方案；兩者皆需要使用者同意才能啟用。僅在 `verify` 通過時才合併更新 PR。

## 弱點掃描 (此處未驗證)

本 skill 的驗證未執行此項目（它需要透過網路下載弱點資料庫，且針對 NVD 需要 API 金鑰）。選擇適合專案的工具：

- GitHub Dependabot 警示 / dependency review action（無建置變更）。
- OWASP dependency-check Maven 外掛 `org.owasp:dependency-check-maven`（編寫此內容時在 Maven Central 上為 13.0.0）：`mvn org.owasp:dependency-check-maven:check -DnvdApiKeyEnvironmentVariable=NVD_API_KEY`；透過 CI 密碼秘密設定 `NVD_API_KEY`，絕不放在存放庫中或作為常值命令列參數。該參數指示外掛讀取哪個環境變數；單純匯出該變數並無法對其進行設定。
- OSV-Scanner (`osv-scanner scan source -r .`) 讀取 `pom.xml`/Gradle 鎖定檔案。

回報發現項目時列出有弱點的成品、修復版本以及其為直接還是可轉移相依性；藉由調高受管理的版本來修正，並執行 `verify`。
