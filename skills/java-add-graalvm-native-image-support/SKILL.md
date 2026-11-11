---
name: 'java-add-graalvm-native-image-support'
description: '適用於 Spring Boot、Micronaut 與純 Java 的 GraalVM Native Image skill：偵測建置工具與架構、新增原生映像檔支援、建構可執行檔、分析錯誤，並反覆迭代直到原生建置成功且二進位檔正常執行。針對 Quarkus 專案，僅分派至 quarkus-native-and-container skill。'
---

# GraalVM 原生映像檔支援 (GraalVM Native Image Support)

為 Java 專案新增 GraalVM Native Image 的單一事實來源，無論採用何種架構。以反覆迭代的方式作業：設定、建構、讀取錯誤、修正、重新建構，直到原生建置成功且可執行檔正常運作。

詳細內容請參閱 `references/`；僅載入專案所需的檔案：

| 主題 | 檔案 |
|---|---|
| Maven / Gradle 原生外掛設定 | [references/build-tools.md](references/build-tools.md) |
| 可達性中繼資料 (Reachability metadata) 與追蹤代理程式 | [references/reachability-metadata.md](references/reachability-metadata.md) |
| 常見建置/執行階段錯誤與修正 | [references/troubleshooting.md](references/troubleshooting.md) |
| Spring Boot (AOT, `-Pnative`, `nativeCompile`, `build-image`) | [references/spring-boot.md](references/spring-boot.md) |
| Quarkus | `quarkus-native-and-container` skill (移交處理)；簡要指引請參閱 [references/quarkus.md](references/quarkus.md) |
| Micronaut | [references/micronaut.md](references/micronaut.md) |

## 步驟 1：分析專案

1. 建置工具：`pom.xml` (Maven) 或 `build.gradle` / `build.gradle.kts` (Gradle)。存在時優先使用包裝函式 (`./mvnw`, `./gradlew`)。
2. 架構，從相依性/外掛判定：
   - Spring Boot：`spring-boot-starter-parent`、`spring-boot-maven-plugin` 或 `org.springframework.boot` Gradle 外掛
   - Quarkus：`io.quarkus` BOM/外掛或 `quarkus-*` 相依性
   - Micronaut：`io.micronaut` parent/外掛或 `micronaut-*` 相依性
   - 否則為純 Java
3. 現有原生設定：native-build-tools 外掛、`META-INF/native-image/`、原生設定檔 (native profile)、`application.properties` 原生索引鍵。
4. 工具鏈：執行 `java -version` 與 `native-image --version`。本機原生編譯需要 GraalVM JDK（含 `native-image`）作為建置所使用的 JDK。容器或 buildpack 建置（透過 `bootBuildImage`/`spring-boot:build-image` 的 Spring Boot buildpacks、Quarkus 容器建置）是在容器內編譯，不需要本機 GraalVM，只需要容器執行階段。對照已安裝的 GraalVM 版本檢查專案的 Java 等級。

若架構為 Quarkus，在此停止並移交給 `quarkus-native-and-container` skill。該處的容器建置不需要本機 GraalVM。

## 範圍與 JVM 基準線

- 新增原生支援不代表獲授權升級 JDK、架構、函式庫、建置工具或包裝函式。保留現有由 BOM/parent 管理的版本與測試慣例；在變更版本以解決原生相容性問題前請先詢問。
- 在編輯前先執行專案現有的 JVM 建置與測試。記錄先前已存在的失敗項目，而非放寬檢查來掩蓋問題。讓 JVM 封裝/執行路徑與原生支援並存運作。
- 在任何核准的相依性或架構變更後，在繼續進行原生建置前重新執行該 JVM 基準線。在 JVM 與原生路徑上驗證相同的相關行為。
- 在建立或變更 CI 工作流程、新增原生 CI 工作或變更執行器 (runner) 資源前請先詢問。若未請求 CI 變更，請分開建議命令。

## 步驟 2：取得 GraalVM 工具鏈

- **Oracle GraalVM**（在 GraalVM Free Terms and Conditions 下免費）與 **GraalVM Community Edition** 組建提供 `native-image`。使用符合專案 Java 版本的發行版本（例如適用於 JDK 21 或更新版本的 GraalVM；Spring Boot 3.x/4.x 需要 Java 17+ 基準線，請參閱 Spring 參考資料）。
- 使用 SDKMAN 安裝（`sdk list java`，接著使用該清單中的識別碼執行 `sdk install java <identifier>`）、供應商下載或 CI 動作（例如 `graalvm/setup-graalvm`）。從供應商目前的下載頁面挑選版本，而非硬式編碼版本號。
- Linux 需要 C 工具鏈與 zlib 標頭檔 (`build-essential`, `zlib1g-dev`)；macOS 需要 Xcode 命令列工具；Windows 需要 Visual Studio Build Tools。請檢查目前 GraalVM 的「Native Image prerequisites」頁面。

## 步驟 3：新增原生支援

依各架構進行：

- **Spring Boot**：使用 Maven 時，`spring-boot-starter-parent` 僅在其 `native` 設定檔中管理原生外掛的版本與設定，因此若缺少請在 `<build><plugins>` 中宣告 `native-maven-plugin` 與 `spring-boot-maven-plugin`（不需要版本號）；使用 Gradle 時，在 `org.springframework.boot` 旁套用 `org.graalvm.buildtools.native`；自訂 parent 則需要手動新增外掛。切勿重複 parent 已提供的設定。請參閱 [references/spring-boot.md](references/spring-boot.md)。
- **Quarkus**：移交給 `quarkus-native-and-container` skill。
- **Micronaut**：透過 Micronaut 建置外掛內建支援。請參閱 [references/micronaut.md](references/micronaut.md)。
- **純 Java**（或任何不含架構外掛的專案）：新增 GraalVM Native Build Tools 外掛。請參閱 [references/build-tools.md](references/build-tools.md)。在執行時期從 Maven Central (`org.graalvm.buildtools:native-maven-plugin`) 或 Gradle Plugin Portal (`org.graalvm.buildtools.native`) 解析外掛版本並在建置檔中鎖定版本；切勿憑記憶抄寫版本號。

## 步驟 4：建構

| 設定 | 命令 |
|---|---|
| 純 Maven | `./mvnw -Pnative native:compile` |
| 純 Gradle | `./gradlew nativeCompile` |
| Spring Boot Maven | `./mvnw -Pnative native:compile` (或用於容器的 `spring-boot:build-image`) |
| Spring Boot Gradle | `./gradlew nativeCompile` (或 `bootBuildImage`) |
| Micronaut Maven | `./mvnw package -Dpackaging=native-image` |
| Micronaut Gradle | `./gradlew nativeCompile` |

原生建置速度較慢且耗費大量記憶體 (數 GB 的 RAM)。擷取完整輸以便檢視。

## 步驟 5：反覆迭代直到建置成功

1. 讀取第一個真實錯誤，而非最後的摘要。
2. 對照 [references/troubleshooting.md](references/troubleshooting.md)。
3. 套用最小修正，依下列優先順序進行：
   1. 檢查相容的函式庫/架構版本是否具備內建的原生支援（請參閱 [可達性中繼資料存放庫 (reachability metadata repository)](https://github.com/oracle/graalvm-reachability-metadata)）。提議升級；僅在使用者核准下套用並重新執行 JVM 基準線。若被拒絕，嘗試與目前版本相容的中繼資料或架構提示。
   2. 使用架構自身的機制 (Spring `RuntimeHints`, Quarkus `@RegisterForReflection`, Micronaut `@Introspected`)。
   3. 使用追蹤代理程式收集中繼資料（請參閱 [references/reachability-metadata.md](references/reachability-metadata.md)）。
   4. 在 `src/main/resources/META-INF/native-image/<groupId>/<artifactId>/` 下手動編寫中繼資料。
   5. 僅針對特定類別調整初始化設定 (`--initialize-at-build-time` / `--initialize-at-run-time`)。
4. 重新建構。重複此過程直到建置完成且無任何錯誤。

## 步驟 6：驗證可執行檔

建置成功並不代表全部完成：許多問題僅在執行階段浮現。

- 執行二進位檔並演練主要路徑（HTTP 端點、資料庫存取、序列化、資源載入、排程工作）。
- 在架構支援時執行原生測試 (`native:test`, `nativeTest`, Quarkus `@QuarkusIntegrationTest`)。
- 僅在使用者提出要求時，才將啟動時間與記憶體與 JVM 執行進行比較。
- 回報執行的精確命令、建置與執行是否成功，以及任何殘留的警告。

## 常見陷阱

- 建議在 CI 中使用明確的 GraalVM 版本執行原生建置與原生測試；僅在使用者同意下新增或變更 CI。
- Mockito 預設的 inline 模擬產生器 (mock maker) 在原生映像檔上無法運作 (Mockito 5.0.0 發行說明)；原生測試請使用 subclass 模擬產生器。
- 除非有充分理由，切勿在實際執行建置中留下 `--report-unsupported-elements-at-runtime` 或詳細詳細資訊旗標。

## 參考資料

- [GraalVM Native Image 文件](https://www.graalvm.org/latest/reference-manual/native-image/)
- [Native Build Tools](https://graalvm.github.io/native-build-tools/latest/index.html)
- [GraalVM 可達性中繼資料存放庫](https://github.com/oracle/graalvm-reachability-metadata)
- [Spring Boot GraalVM 原生映像檔](https://docs.spring.io/spring-boot/reference/packaging/native-image/index.html)
- [Quarkus 建構原生可執行檔](https://quarkus.io/guides/building-native-image)
- [Micronaut GraalVM 指引](https://docs.micronaut.io/latest/guide/#graal)

## 上游來源 (在升級 GraalVM 或原生設定前閱讀)

擷取目標版本的頁面；發生衝突時以該頁面為主，優於本 skill。

- GraalVM 發行說明：<https://www.graalvm.org/release-notes/>
- 可達性中繼資料格式：<https://www.graalvm.org/latest/reference-manual/native-image/metadata/>
- 建置組態選項：<https://www.graalvm.org/latest/reference-manual/native-image/overview/BuildConfiguration/>
- 中繼資料存放庫 (檢查函式庫版本是否涵蓋在內)：<https://github.com/oracle/graalvm-reachability-metadata>
