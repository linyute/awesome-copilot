# 記錄、靜態分析、封裝與 CI

在 Maven 3.10.0 與 Gradle 9.8.1 搭配 JDK 21.0.12 與 25.0.4 上驗證，除非標記為未驗證。

## 記錄 (Logging)：SLF4J + 單一後端

```xml
<dependency><groupId>org.slf4j</groupId><artifactId>slf4j-api</artifactId><version>2.0.20</version></dependency>
<dependency><groupId>ch.qos.logback</groupId><artifactId>logback-classic</artifactId><version>1.6.5</version><scope>runtime</scope></dependency>
```

```java
private static final Logger log = LoggerFactory.getLogger(Main.class);

log.info("order {} placed for {}", orderId, customerId);     // 預留位置，非字串串接
log.warn("payment failed for order {}", orderId, exception); // 例外狀況放最後：完整堆疊追蹤
log.atInfo().addKeyValue("area", area).log("computed");     // SLF4J 2 流暢 API (已驗證)
```

- 函式庫僅相依於 `slf4j-api`；應用程式負責選擇後端。執行階段類別路徑上剛好只能有一個後端（否則 SLF4J 會針對多個繫結發出警告）。
- 最小 `src/main/resources/logback.xml`（已驗證）：包含模式 `%d{HH:mm:ss.SSS} %-5level [%thread] %logger{36} requestId=%X{requestId} - %msg %kvp%n` 的 `ConsoleAppender`，`<logger name="your.package" level="DEBUG"/>`，根等級為 `INFO`。`%X{requestId}` 呈現 MDC 請求識別碼，`%kvp` 呈現流暢 `addKeyValue` 欄位；單純的 `%msg` 兩者皆無法呈現。若無設定檔，Logback 預設以 DEBUG 等級記錄至主控台。
- 使用 Lambda (`log.atDebug().log(() -> ...)`) 或 `isDebugEnabled` 保護耗費資源的引數建構。等級：ERROR = 需立即關注，WARN = 未預期但已處理，INFO = 業務事件，DEBUG/TRACE = 診斷資訊。
- 切勿記錄密碼秘密、權杖、完整請求主體或個人資料；使用 MDC (`MDC.put("requestId", id)` ... `finally MDC.remove`) 進行相互關聯。切勿在應用程式程式碼中使用 `System.out` 進行診斷。
- 不要記錄例外狀況的同時又將其重新擲出（造成重複雜訊）；在處理該例外狀況之處進行記錄。

## 編譯器警告：`-Xlint`

Maven：

```xml
<plugin>
  <artifactId>maven-compiler-plugin</artifactId>
  <version>3.16.0</version>
  <configuration>
    <release>21</release>
    <compilerArgs><arg>-Xlint:all</arg><arg>-Werror</arg></compilerArgs>
  </configuration>
</plugin>
```

Gradle：`tasks.withType<JavaCompile>().configureEach { options.release = 21; options.compilerArgs.addAll(listOf("-Xlint:all", "-Werror")) }`。

`-Werror` 將警告轉為建置失敗；在範例專案上已驗證在 21 與 25 上乾淨通過，但在現有程式碼庫上可能會因數百個警告而導致失敗。先引入 `-Xlint:all`，僅在專案乾淨無警告且使用者同意時才新增 `-Werror`。

## Spotless (格式化)

Maven（已驗證 3.10.4；違規時 `spotless:check` 失敗，`spotless:apply` 進行修復）：

```xml
<plugin>
  <groupId>com.diffplug.spotless</groupId>
  <artifactId>spotless-maven-plugin</artifactId>
  <version>3.10.4</version>
  <configuration>
    <java><googleJavaFormat/><removeUnusedImports/></java>
  </configuration>
</plugin>
```

Gradle（已驗證 8.10.4）：`plugins { id("com.diffplug.spotless") version "8.10.4" }` 與 `spotless { java { googleJavaFormat(); removeUnusedImports() } }`；執行 `./gradlew spotlessCheck` / `spotlessApply`。

格式化風格是團隊決策：google-java-format 使用 2 個空格縮排。若專案已具備 `.editorconfig`/Eclipse/IntelliJ 格式化設定，請設定 Spotless 予以比對（或不新增）。僅將 `spotless:apply` 套用至修改過的檔案，絕不可對整個存放庫進行順手重新格式化。在 JDK 21 與 25 上運作方式相同。

## Error Prone (編譯時期的程式錯誤模式)

Maven，在 JDK 21 與 25 上使用 `error_prone_core` 2.50.0 驗證（它捕捉到 `String.equals(Integer)` 為 `EqualsIncompatibleType`）：

```xml
<plugin>
  <artifactId>maven-compiler-plugin</artifactId>
  <version>3.16.0</version>
  <configuration>
    <release>21</release>
    <compilerArgs>
      <arg>-XDcompilePolicy=simple</arg>
      <arg>-XDaddTypeAnnotationsToSymbol=true</arg>   <!-- 在 JDK 21 上為必要；在 25 上接受 -->
      <arg>--should-stop=ifError=FLOW</arg>
      <arg>-Xplugin:ErrorProne -XepDisableWarningsInGeneratedCode</arg>
    </compilerArgs>
    <annotationProcessorPaths>
      <path>
        <groupId>com.google.errorprone</groupId>
        <artifactId>error_prone_core</artifactId>
        <version>2.50.0</version>
      </path>
    </annotationProcessorPaths>
  </configuration>
</plugin>
```

以及 `.mvn/jvm.config`（JDK 16+ 強封裝；每行一個旗標）：

```
--add-exports jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED
--add-exports jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED
--add-exports jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED
--add-exports jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED
--add-exports jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED
--add-exports jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED
--add-exports jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED
--add-exports jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED
--add-opens jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED
--add-opens jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED
```

在 JDK 21 上若缺少 `-XDaddTypeAnnotationsToSymbol=true`，編譯器會失敗並提示 "-XDaddTypeAnnotationsToSymbol=true is required by Error Prone on JDK 21"（已驗證）。Error Prone 警告會以 `[BugPattern]` 編譯器警告出現，並在 `-Werror` 下成為錯誤；使用 `@SuppressWarnings("BugPattern")` 加上註解抑制特定發現項目，而非進行全域停用。

Gradle（使用 `net.ltgt.errorprone` 5.1.1 驗證，它會自行新增 JVM 旗標）：

```kotlin
plugins { java; id("net.ltgt.errorprone") version "5.1.1" }
dependencies { errorprone("com.google.errorprone:error_prone_core:2.50.0") }
```

## Checkstyle 與 SpotBugs (此處未驗證)

僅在專案已有設定時才執行它們 (`maven-checkstyle-plugin`, `spotbugs-maven-plugin`, Gradle `checkstyle`/`com.github.spotbugs`)。使用專案現有的規則檔案；切勿建立全新的規則集或全面抑制發現項目。SpotBugs 分析位元組碼，因此在升級 Java 之前請檢查其 JDK 支援程度。它們與 Error Prone 重疊；同時新增三者通常不具合理性。

## 封裝 (Packaging)

可執行 jar 需要相依性。針對純應用程式（已驗證：僅有 jar 本身會因 SLF4J 出現 `NoClassDefFoundError` 而失敗）：

```bash
mvn -B package dependency:copy-dependencies -DincludeScope=runtime -DoutputDirectory=target/lib
java -cp 'target/app.jar:target/lib/*' demo.Main
```

或使用 shade/assembly 外掛（或 Gradle `application` + `installDist`）產生可散佈套件。在 jar 資訊清單中設定 `Main-Class` (`maven-jar-plugin` `<archive><manifest><mainClass>`)。

**jlink**（已驗證，JDK 21）：建置精簡的執行階段：

```bash
MODS=$(jdeps --ignore-missing-deps --multi-release 21 --print-module-deps --class-path 'target/lib/*' target/app.jar)
jlink --add-modules "$MODS,jdk.unsupported" --strip-debug --no-header-files --no-man-pages --output target/rt
target/rt/bin/java -cp 'target/app.jar:target/lib/*' demo.Main
```

`jdeps` 會遺漏透過反射或 `ServiceLoader` 使用的模組；若應用程式因 `NoClassDefFoundError`/缺少提供者而失敗，請明確新增模組（例如 `java.sql`、`java.xml`、`jdk.crypto.ec`）。僅包含 `java.base` 的執行階段大小為 44 MB。

**jpackage**（在 macOS 上搭配 `--type app-image` 已驗證）：`--input` 目錄必須僅包含 jar 及其相依性，不可包含輸出目錄（使用 `target` 作為輸入會遞迴直到提示 "File name too long"）：

```bash
mkdir target/in && cp target/app.jar target/lib/*.jar target/in/
jpackage --type app-image --name devapp --input target/in --main-jar app.jar \
  --main-class demo.Main --runtime-image target/rt --dest target/app
```

原生安裝程式 (`dmg`, `pkg`, `msi`, `deb`, `rpm`) 需要平台專屬工具與簽署且未經測試；每個安裝程式皆必須在其專屬的作業系統上建構。

## GitHub Actions CI (未驗證：未實際執行)

截至 2026-10，`actions/setup-java` v6 與 `actions/checkout` v7 為最新的主要發行標籤（透過 GitHub API 檢查）；請驗證目前的主要版本，若存放庫原則有所要求，請鎖定完整的認可 SHA。

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [21, 25]
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: ${{ matrix.java }}
          cache: maven            # 或 gradle
      - run: ./mvnw -B verify     # 或 ./gradlew build
```

比對矩陣與專案支援的 Java 發行版本（以及建置的發行版本設定）；針對應用程式使用單一 JDK 即可。針對 Gradle 亦可考慮使用 `gradle/actions/setup-gradle`。保持 `permissions` 最簡化，絕不印出密碼秘密，且未經詢問切勿編輯現有的工作流程。
