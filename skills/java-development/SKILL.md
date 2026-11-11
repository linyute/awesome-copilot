---
name: 'java-development'
description: '不依賴架構的日常純 Java 開發：Maven 與 Gradle 使用方式及包裝函式、專案版面配置、相依性與弱點管理、依 JDK 版本的現代 Java 慣用語（records、sealed 型別、模式比對、虛擬執行緒）、SLF4J 記錄、錯誤與 null 處理、不可變性、並行存取基礎、靜態分析與格式化（Spotless、Error Prone、-Xlint）、封裝（jar、jlink、jpackage）以及 GitHub Actions CI。在撰寫、建構、檢閱或維護一般 Java 程式碼時使用。'
---

# Java 開發 (純 Java)

未繫結特定架構之 Java 專案的日常開發指引。若專案使用 Spring Boot、Quarkus、Helidon 或類似架構，針對架構相關考量優先使用該架構的 skills，並將本 skill 用於純 Java 部分。

## 一律適用的規則

1. **先偵測後編寫。** 閱讀 `pom.xml`/`build.gradle*`、`.mvn/`、`gradle/`、`.java-version`/`.sdkmanrc`、`.editorconfig`、CI 檔案以及部分原始檔。比對目前已在使用的建置工具、Java 發行版本、格式化工具、命名慣例、記錄與測試函式庫。
2. **切勿隱含升級。** 切勿將變更 Java 發行版本、建置工具版本、外掛或相依性版本，或新增專案未具備的格式化工具/linter/靜態分析器，作為其他任務的副作用。請先提出建議並詢問。版本升級屬於其專屬任務（若已安裝 `java-upgrade`）。
3. **使用包裝函式** (`./mvnw`, `./gradlew`) 當其存在時；否則使用已安裝的 `mvn`/`gradle`。切勿未經提示主動認可包裝函式。
4. **以建置進行驗證。** 在任何變更後執行專案自身的驗證命令（`./mvnw -B verify` 或 `./gradlew build`）並回報結果。在反覆迭代時先執行範圍較狹窄的命令。若無法執行，請明確說明。
5. **在以下情況前先詢問使用者**：變更公開 API 或序列化/資料庫/通訊格式、提高 Java 發行版本、新增執行階段相依性、在建置中新增工具、刪除或放寬測試、變更 CI，或當兩種合理的設計存在不同權衡取捨時。
6. 優先使用標準函式庫與小型、明確的程式碼，而非引入新的相依性。除非專案已在使用，否則不使用 Lombok。

## 依專案的 Java 發行版本選取慣用語

檢查 `maven.compiler.release`/`<release>`、`java.toolchain` 或 `sourceCompatibility`；切勿使用比該發行版本更新的功能。摘要（詳細資訊與程式碼片段請參閱 `references/modern-java.md`）：

| 發行版本 | 可以使用的功能 |
| --- | --- |
| 8 | lambdas, streams, `Optional`, `java.time` |
| 11 | `var`, `String.isBlank/strip/lines`, `java.net.http.HttpClient`, `List.of`/`Map.of` (9) |
| 17 | records, sealed classes, text blocks, switch expressions, `instanceof` patterns |
| 21 | pattern matching for `switch`, record patterns, **virtual threads**, `SequencedCollection` (`getFirst/getLast/reversed`) |
| 22-24 | 未命名變數 `_` (22), `Stream.gather` (24) |
| 25 | scoped values, 執行個體 `main`/精簡原始檔, 模組匯入宣告 (皆為 final) |

結構化並行 (`StructuredTaskScope`) 在 25 與 27 中仍為**預覽 API**（已驗證：需要 `--enable-preview`）；除非使用者選擇啟用預覽功能，否則切勿在實際執行程式碼中使用。

## 實務中的建置工具

- Maven：`./mvnw -B verify`（編譯、單元測試、整合測試、封裝），針對單一模組使用 `-pl <module> -am`，`dependency:tree`，僅在使用者要求時使用 `-DskipTests`。Gradle：`./gradlew build`，`test --tests 'pkg.Class'`，`dependencies`，`dependencyInsight --dependency <name>`。
- 標準版面配置：`src/main/java`、`src/main/resources`、`src/test/java`、`src/test/resources`；依功能 (feature) 封裝，每個檔案一個頂層型別，無分割套件 (split packages)。
- 明確設定 Java 版本（`maven.compiler.release` / 帶有 `options.release` 的 Gradle 工具鏈）與 UTF-8 編碼；切勿依賴恰好執行建置的 JDK。
- 包裝函式、BOM 與 `dependency:tree`/`versions:` 的使用、版本目錄與多模組版面配置：`references/build-and-dependencies.md`。

## 相依性與弱點

- 匯入 BOM（`junit-bom`、`testcontainers-bom`、架構的 BOM）而非重複指定版本；跨模組的每個函式庫保持單一版本。
- 變更前先檢查：`mvn dependency:tree -Dincludes=group:artifact` / `gradlew dependencyInsight`。使用 `dependencyManagement` 或 Gradle constraints 解決衝突，而非隨機排除。
- 使用 `mvn versions:display-dependency-updates` 檢查更新（加上 `-Dmaven.version.ignore` 隱藏 alpha/beta/RC）並予以回報；未經詢問切勿套用重大升級。
- 弱點：使用專案既有的工具（Dependabot/Renovate 警示、OWASP dependency-check、OSV-Scanner、GitHub dependency review）。若不存在請提出建議；切勿無提示自行新增。將密碼秘密排除在掃描器設定之外；以 NVD 為基礎的掃描器需要 API 金鑰才具實用性。

## 依版本而異的失敗 (已驗證)

- **JDK 23+ 不再隱含執行註解處理器**（Lombok、MapStruct、Dagger...）：除非指定 `-processor`、`--processor-path` 或 `--processor-module-path`，否則預設為 `-proc:none`。在組建中宣告處理器路徑（Maven `annotationProcessorPaths`，Gradle `annotationProcessor`）或傳入 `-proc:full`。JDK 21+ 在偵測到隱含使用時會印出警告；`-proc:full` 亦已回移植至 17.0.11、11.0.23 與 8u411。來源：<https://inside.java/2024/06/18/quality-heads-up/>。
- **虛擬執行緒與 `synchronized`**：在 JDK 21-23 上，於 `synchronized` 內部封鎖的虛擬執行緒會釘選至其載體 (carrier)；JEP 491 在 JDK 24+ 中移除了幾乎所有此類釘選。在 21-23 上，封鎖呼叫周圍請優先使用 `ReentrantLock`。來源：<https://openjdk.org/jeps/491>。
- 在 JDK 16+ 上的 **Error Prone** 需要 `--add-exports`/`--add-opens` javac 旗標，在 JDK 21 上需要 `-XDaddTypeAnnotationsToSymbol=true`（請參閱品質參考資料）。
- 切勿使用比專案發行版本更新的語言功能（請參閱上表）。

## 靜態分析與格式化 (僅在已存在或使用者同意時)

尊重現有設定：若專案使用 Spotless/Checkstyle/SpotBugs/Error Prone，執行它們並修正發現的問題；若未使用，請勿新增。當收到引入要求時，先從 `-Xlint:all` 與 Spotless（僅限格式化工具）開始，接著引入 Error Prone。JDK 21 與 25 上適用於 Maven 與 Gradle 的已驗證設定（包含僅限 JDK-21 的 `-XDaddTypeAnnotationsToSymbol=true` 要求以及 Maven `.mvn/jvm.config` 旗標）請參閱 `references/quality-and-packaging.md`。切勿在不相關的變更中重新格式化整個程式碼庫。

## 封裝與 CI

- 純函式庫 jar：`mvn package`/`gradlew jar`。可執行的應用程式：shaded/fat jar 或 `lib/` 目錄加上資訊清單 `Main-Class`；搭配 `jlink` 的自訂執行階段；搭配 `jpackage` 的原生安裝程式/應用程式映像檔（在 macOS 上已驗證，請參閱 `references/quality-and-packaging.md`）。
- GitHub Actions：`actions/checkout`、`actions/setup-java` 搭配 `distribution: temurin`、明確的 `java-version`、內建的相依性 `cache`，接著執行 `./mvnw -B verify` 或 `./gradlew build`。程式碼片段與備註請參閱 `references/quality-and-packaging.md`。未經詢問切勿變更 CI。

## 相關 Skills (安裝時使用)

`java-junit` (單元測試)、`java-testcontainers` (搭配 Docker 的整合測試)、`java-hibernate-jpa` (永續性)、`java-debugging` (失敗與堆疊追蹤)、`java-diagnostics` (效能、記憶體、執行緒、JFR)、`java-upgrade` (JDK/架構升級)、`lsp-setup` (用於導覽與重構的 Java 語言伺服器)。

## 參考資料

- `references/modern-java.md`：慣用語與已驗證的程式碼片段（records、sealed 型別、switch 模式、文字區塊、虛擬執行緒、`SequencedCollection`、未命名變數）、預覽狀態、常見陷阱。
- `references/build-and-dependencies.md`：Maven/Gradle 命令、包裝函式、BOM、衝突診斷、更新檢查、Dependabot/Renovate、弱點掃描。
- `references/quality-and-packaging.md`：記錄設定、`-Xlint`、Spotless、Error Prone、Checkstyle/SpotBugs 備註、jar/jlink/jpackage、GitHub Actions。
