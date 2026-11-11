# AOT、CDS 與啟動調校

從量測開始，而非直接調整旗標：在每次變更前後，於目標硬體上透過多次執行記錄啟動時間（`Started ... in N seconds` 記錄，或 `spring.main.log-startup-info=true`）與記憶體（單次計時容易受雜訊干擾：在相同設定的多次執行間觀察到的差異可能大於某些調校帶來的效益）。在沒有明確目標（啟動時間、記憶體、映像檔大小）的情況下，請勿變更 JVM 或 Spring 旗標。已在 Boot 4.1.1、Maven、JDK 26 執行時期（`--release 25`）上進行驗證；這些測試執行期間暫無 JDK 21 與 25 可用。

## Spring AOT（建構時期處理）

Spring AOT 將 bean 定義與反射/代理提示轉換為產生的程式碼。這對於 GraalVM 原生映像檔是必要的，而在 JVM 上則是選用的。

```bash
./mvnw -DskipTests package spring-boot:process-aot    # Gradle: ./gradlew processAot
```

已驗證：在範例應用程式（JPA、Flyway、Kafka、快取、驗證、springdoc）上，`process-aot` 執行成功並在 `target/spring-aot/main/sources/` 下產生原始碼（例如 `DemoApplication__BeanDefinitions.java`）。注意事項：

- AOT 在建構時期評估條件與 bean 定義：改變 bean 圖的設定檔 profile 與屬性（`@Profile`、`@ConditionalOnProperty`）在建構時期即被固定。請勿依賴僅限執行時期的條件。
- `process-aot` 會啟動應用程式上下文，但不會將您的 bean 連線至真實服務；若執行失敗，常見原因包括在建構子中具有僅限執行時期的副作用之 bean，或是有歧義的 main class（在 Maven 中設定 `<start-class>`，請參閱 `create-spring-boot-java-project` 的 `references/spring-boot-4.md`）。
- 自訂反射/資源：使用 `@ImportRuntimeHints` 與 `RuntimeHintsRegistrar` 註冊提示，或針對由 Jackson 序列化的 DTO 使用 `@RegisterReflectionForBinding`。
- 在 JVM 上使用產生的程式碼需要搭配 `-Dspring.aot.enabled=true` 執行並打包 AOT 輸出；該途徑未在此進行驗證且效益有限，因此針對 JVM 啟動優先建議使用下方的 CDS/AOT 快取。

## 原生映像檔（Native Image）

若要產生原生執行檔，請使用 `java-add-graalvm-native-image-support` 技能（建構工具偵測、原生建構、錯誤迭代處理）以及 `create-spring-boot-java-project` 的原生 Dockerfile（`references/docker.md`）。權衡取捨：啟動速度大幅提升且記憶體佔用降低，但建構時間較慢、存在封閉世界假設（closed-world assumption，需要反射提示），且部分函式庫需要額外的提示。本技能未對此進行驗證。

## 類別資料共用 (CDS) / 應用程式 CDS (AppCDS)

Spring Boot 透過解壓縮的 jar 配置支援 CDS（`-Djarmode=tools`）。在 Boot 4.1.1 上的已驗證程序（訓練執行需要應用程式的依賴項，此處為 PostgreSQL）：

```bash
./mvnw -DskipTests package
java -Djarmode=tools -jar target/app.jar extract --destination extracted
cd extracted
# 訓練執行：在結束時建立封存檔（應用程式在 context 重新整理後立即退出）
java -XX:ArchiveClassesAtExit=app.jsa -Dspring.context.exit=onRefresh -jar app.jar
# 生產執行
java -XX:SharedArchiveFile=app.jsa -jar app.jar
```

已驗證：成功建立並使用 `app.jsa`（範例應用程式約 50 MB）且無錯誤。在訓練執行中的 `[warning][cds] Skipping ... Failed verification` 與 `NoClassDefFoundError` 預載入警告涉及函式庫未在類別路徑上的選用類別（reactor、Apache HttpClient、Log4j），屬於無害警告。封存檔與特定的 JVM 及 jar 緊密綁定：在每次發布版本的建構或映像檔建構中重新產生它，並使用與生產環境相同的 JDK 進行訓練執行。

JDK 19+ 亦可在首次執行時自動建立封存檔（`-XX:+AutoCreateSharedArchive -XX:SharedArchiveFile=app.jsa`；已驗證檔案會被建立）。

**JDK 25+ 一步式 AOT 快取**（[JEP 514](https://openjdk.org/jeps/514)）：`java -XX:AOTCacheOutput=app.aot -Dspring.context.exit=onRefresh -jar app.jar`，接著執行 `java -XX:AOTCache=app.aot -jar app.jar`。在 JDK 26 上驗證通過（約 160 MB 快取，使用無誤）。JDK 24 引進了 AOT 快取（[JEP 483](https://openjdk.org/jeps/483)），但需要分開執行 `AOTMode=record` 與 `AOTMode=create` 步驟；它不支援 `AOTCacheOutput`。在選擇指令前請檢查 `java -version`，並將 CDS 作為較舊 JDK 的回退方案。相同規則：每個 JDK 組建與 jar 對應一個快取。

在容器中，應在 `docker build` 期間建立封存檔（最終階段中的 `RUN` 訓練步驟），而非在容器啟動時建立。

## 延遲初始化

```properties
spring.main.lazy-initialization=true
```

- 將 bean 建立推遲至首次使用，這能減少啟動時間與初期的記憶體佔用，但會將失敗風險與首次請求的延遲轉移至執行時期：設定錯誤的 bean 不再快速失敗，且健康檢查可能會在處於半可用狀態的應用程式上誤判通過。建議僅用於開發/測試或短期執行的行程；避免作為生產環境的預設值。在必須及早啟動的 bean 上設定 `@Lazy(false)`（例如排程器、監聽器）。
- 在範例應用程式上的量測結果：在多次執行間未觀察到穩定的啟動效益；請勿做出過度承諾。

## 其他低成本效益

- 移除未使用的 starter 與自動設定；`--debug` 可印出條件評估報告，以找出實際啟動的項目。
- `spring.jpa.open-in-view=false` 與 `spring.main.banner-mode=off` 無需額外成本。
- 僅針對短期執行的 CLI 風格工作設定 `-XX:TieredStopAtLevel=1`；這會損害穩定狀態下的吞吐量。
- 容器記憶體：讓 JVM 依據容器限制自動調整堆積大小（`-XX:MaxRAMPercentage`）；不要將 `-Xmx` 硬編碼為等同於該限制。
- 虛擬執行緒不會改變啟動時間（`references/messaging-caching.md`）。
