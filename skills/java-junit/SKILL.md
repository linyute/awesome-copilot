---
name: 'java-junit'
description: '使用 JUnit 5 與 JUnit 6 (Jupiter)、AssertJ 與 Mockito 編寫、檢閱與修正 Java 單元測試：斷言、參數化與巢狀測試、模擬規則、確定性時間與隨機性、Surefire 與 Failsafe 比較、JaCoCo 覆蓋率、選用的 PIT 變異測試，以及針對 agent 的防護措施（絕不跳過或刪除失敗的測試）。在 Maven 或 Gradle 專案中新增、重構或偵錯測試時使用。不限特定架構。'
---

# 使用 JUnit 5/6、AssertJ 與 Mockito 的 Java 測試

適用於快速、確定性單元測試的不限架構指引。針對 Spring 切片請使用 `spring-boot-testing`（若已安裝）；針對 Docker 中的真實資料庫/代理程式請使用 `java-testcontainers`；針對無法解釋的失敗請使用 `java-debugging`。

## 首先：偵測，切勿強加

1. 閱讀 `pom.xml`/`build.gradle*`：JUnit 版本（`junit-jupiter`、`junit-bom` 或繼承自 Spring Boot BOM）、斷言函式庫、Mockito、Surefire/Failsafe 版本、Java 發行版本。
2. 複製 `src/test/java` 中既有的慣例（命名、斷言函式庫、靜態匯入、模擬風格）。未經詢問切勿將 AssertJ、Mockito 或 JaCoCo 引入未具備這些函式庫的專案中。
3. 切勿隱含調高 JUnit 主要版本；升級屬於其專屬任務（若已安裝請參閱 `java-upgrade`）。

## JUnit 5 與 JUnit 6 比較

| | JUnit 5 (最新 5.14.x) | JUnit 6 (6.0 已發行；目前為 6.1.x) |
| --- | --- | --- |
| Java 基準線 | 8 | **17** (在發佈的 Gradle 模組 metadata 中已驗證) |
| 版本控管 | Platform 1.x, Jupiter 5.x, Vintage 5.x | Platform、Jupiter 與 Vintage 採用單一版本號 |
| API | `org.junit.jupiter.api.*` | 相同套件；本 skill 中的 Jupiter 測試在 5.14.4 與 6.0.3 上編譯與通過無需任何修改 |
| 6.0 中移除的項目 | | `MethodOrderer.Alphanumeric`、已棄用的雙引數 `InvocationInterceptor.interceptDynamicTest(Invocation, ExtensionContext)` 多載 (三引數多載仍保留)、`junit.jupiter.tempdir.scope`、`@CsvFileSource(lineSeparator)` |
| CSV | univocity-parsers | FastCSV：更嚴格的剖析 (結尾引號後不得有字元)；標頭欄位選項現在適用於標頭 |
| 其他 | | `junit-jupiter-migrationsupport` 已棄用；無效的列舉樣式設定值現在會導致探索失敗；`@Nested` 類別順序具確定性但不明顯 |

來源：JUnit 6.0.0 發行說明 (<https://docs.junit.org/6.0.0/release-notes.html>)。請閱讀目標版本的說明 (<https://docs.junit.org/current/release-notes/>) 並優先參考該文件。JUnit 4 測試需要 Vintage 引擎；切勿在單一類別中混用 `org.junit.Test` 與 `org.junit.jupiter.api.Test`。

相依性（5 與 6 相同；在 Maven 與 Gradle 上已驗證）：匯入 `org.junit:junit-bom`，接著以 `test` 範圍宣告 `org.junit.jupiter:junit-jupiter`（聚合了 api、params、engine）。Gradle 9 額外**需要** `testRuntimeOnly("org.junit.platform:junit-platform-launcher")`（已驗證：若無此相依性測試執行器會失敗並提示 "Failed to load JUnit Platform"）以及 `tasks.test { useJUnitPlatform() }`。Maven 需要 Surefire 3.x（已使用 3.6.0 驗證）。

## 斷言 (Assertions)

比對專案的函式庫。純 Jupiter 規則：預期值放前面、延遲評估的 `Supplier` 訊息、`assertAll`、`assertThrowsExactly`、逾時。（獨立的 `instructions/java-junit5-assertions.instructions.md` 資源有更長的版本，但未隨本 skill 一併安裝。）若專案使用 AssertJ，在處理集合、字串與例外狀況時優先使用它；模式（軟斷言、`assertThatThrownBy`、`extracting`、`containsExactly`、`usingRecursiveComparison`）請參閱 `references/assertj-and-mockito.md`。

- 針對成果與狀態進行斷言，而非內部被呼叫了多少次。
- 比較數值；避免使用純粹的 `assertNotNull`。
- 切勿捕捉 `AssertionError`/`Exception` 來換取測試通過。

## 模擬 (Mockito)

- 僅模擬**跨邊界的協作者**（儲存機制 repository、HTTP 用戶端、時鐘、訊息傳送者）。**切勿**模擬值物件、records、集合、`String` 或受測類別本身；請使用真實執行個體或簡易的假物件 (fakes)。
- 當互動具狀態時，手寫假物件優於模擬物件。
- 搭配 `@Mock`/`@InjectMocks`/`@Captor` 使用 `@ExtendWith(MockitoExtension.class)`。在該處嚴格 stubbing (strict stubs) 為預設值，因此未使用的 stub 會導致測試失敗 (`UnnecessaryStubbingException`)。請修正測試；僅在有充分理由的共用設定中才使用 `@MockitoSettings(strictness = Strictness.LENIENT)` 放寬限制。
- Mockito 5 預設使用 inline 模擬產生器。在 JDK 21+ 上它可能會自我掛接並印出動態代理程式警告。搭配 **Mockito 5.14.0+** 時，改為將 `mockito-core` 註冊為 `-javaagent`（Maven 與 Gradle 的設定請參閱 `references/assertj-and-mockito.md`，已在 JDK 21 與 25 上驗證）。先檢查解析出的版本：較早的 5.x jar 缺少 `Premain-Class`，無法作為代理程式使用。升級前請先詢問；否則使用針對已安裝版本所記錄的檢測設定。
- Mockito 5 需要 Java 11+。其預設的 inline 模擬產生器在 GraalVM 原生映像檔上無法運作，該環境下適合使用 subclass 模擬產生器 (Mockito 5.0.0 發行說明, <https://github.com/mockito/mockito/releases/tag/v5.0.0>)。
- 避免使用 `mockStatic`/`mockConstruction`；請將靜態呼叫包裝在介面背後。

## 確定性 (Determinism)

- 時間：注入 `java.time.Clock` (`Clock.fixed(...)`) 並呼叫 `Instant.now(clock)`；避免在受測程式碼中使用 `Instant.now()`/`LocalDate.now()`。
- 隨機性：注入帶有固定種子的 `Random`/`RandomGenerator`；若為動態產生請記錄種子。
- 切勿依賴預設地區設定、時區、檔案編碼、網路或掛鐘休眠 (wall-clock sleeps)。請明確設定它們（較新的 6.x 發行版本新增了內建的地區設定/時區/系統屬性擴充功能；請檢查您版本的發行說明，否則使用 try/finally）。

## 單元測試與整合測試比較

| | 單元測試 (`*Test`) | 整合測試 (`*IT`) |
| --- | --- | --- |
| Maven | Surefire, `mvn test` | Failsafe, `mvn verify` |
| Gradle | `test` 任務 | 獨立的 `integrationTest` 任務 (JVM Test Suite) 佈線至 `check` |
| 速度 | 毫秒級，無 I/O | 可能使用 Docker/資料庫 |

Surefire 預設挑選 `*Test`、`Test*`、`*Tests`、`*TestCase`；Failsafe 挑選 `*IT`、`IT*`、`*ITCase`。Failsafe 需要繫結 `integration-test` 與 `verify` 目標，並由 `mvn verify` 執行而非 `mvn test`。或者亦可透過 `@Tag` 進行區隔。針對資料庫與代理程式請參閱 `java-testcontainers`；針對 Spring 切片請參閱 `spring-boot-testing`。完整建置程式碼片段請參閱 `references/build-setup.md`。

## 覆蓋率與變異測試 (選用)

- JaCoCo：僅在專案已在使用或使用者要求時新增。搭配 Surefire/Failsafe 使用 `<argLine>@{argLine} ...</argLine>`，避免覆寫 JaCoCo 代理程式。
- 覆蓋率是用來偵測程式碼壞味道的工具，而非目標；切勿新增無斷言的測試來刷高數字，也不要新增專案未具備的覆蓋率關卡。
- PIT（變異測試）速度較慢；僅在專案已在使用或使用者要求時針對變更的類別執行（請參閱 `references/build-setup.md`，該處記錄了經由驗證的 pitest-maven + JUnit 5 外掛執行）。

## 代理人防護措施 (Agent guardrails)

1. **切勿**刪除、註解排除、加上 `@Disabled`、放寬（更寬鬆的斷言、更大的容許範圍、吞掉例外狀況）或跳過失敗的測試以換取綠燈通過。找出根本原因。
2. 判斷哪一方有誤，是測試還是實際執行程式碼。若修正會變更**實際執行行為**，請停下來先詢問使用者；若測試編碼了明顯過時的預期，請說明並提議變更。
3. 切勿新增 `-DskipTests`、`-Dmaven.test.skip`、`-x test` 或 `failIfNoTests=false` 來強行通過建置。
4. 切勿模擬受測類別或對模擬物件內部進行斷言來「證明」正確性。
5. 先執行範圍最狹窄的測試，接著執行完整建置：
   - Maven：`mvn -q -Dtest=OrdersTest test`（單一方法：`-Dtest='OrdersTest#place_should_saveAndNotify_when_itemValid'`），接著執行 `mvn verify`。
   - Gradle：`./gradlew test --tests 'demo.OrdersTest'`，接著執行 `./gradlew check`。
   存在時優先使用專案包裝函式 (`./mvnw`, `./gradlew`)。
6. 不穩定測試 (Flaky test)：透過重新執行重現，接著消除不確定性（時間、順序、共用狀態、非同步等待）；切勿直接新增重試機制。
7. 新程式碼應在現有測試旁新增測試，保持相同風格：正常路徑、邊界情況、錯誤案例。

## 參考資料

- `references/assertj-and-mockito.md`：AssertJ 模式、Mockito 嚴格性/captors/代理程式設定、何時不該模擬。
- `references/build-setup.md`：適用於 JUnit 5/6 的 Maven 與 Gradle (Kotlin DSL) 設定、Failsafe 分隔、JaCoCo、PIT。
