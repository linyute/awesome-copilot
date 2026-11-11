# 設定與 CDI (ArC)

## 設定

依優先權由高至低的來源：系統屬性、環境變數、工作目錄中的 `.env` 檔案（封裝後的應用程式也會載入，因此請勿發布至正式環境；將僅限開發的數值放在 `%dev.`/`%test.` 鍵底下）、應用程式旁的 `config/application.properties`、jar 中的 `application.properties`、MicroProfile 預設值。環境變數對應規則：大寫，非英數字元轉為 `_`（`greeting.max-length` -> `GREETING_MAX_LENGTH`）。

### 設定檔（Profiles）

`%dev.`、`%test.`、`%prod.` 前綴；`quarkus.profile=staging` 或自訂設定檔皆可運作。`quarkus:dev` 為 `dev`，測試為 `test`，封裝後的應用程式為 `prod`。

```properties
greeting.prefix=Hello
%dev.greeting.prefix=Dev hello
# Required in every profile (including custom ones such as staging): startup fails if API_KEY is missing
app.api-key=${API_KEY}
# Fallback only for dev and test
%dev.app.api-key=${API_KEY:dev-only-key}
%test.app.api-key=${API_KEY:dev-only-key}
```

已驗證：使用這些設定，`@QuarkusTest` 會看到 `Hello`（`%dev` 數值不會套用於測試中）與 `dev-only-key`。

### 機密（Secrets）

絕不要認可真實機密。請透過環境變數、掛載為環境/檔案的 Kubernetes 機密，或保存庫擴充功能（`quarkus-vault`、帶有 `quarkus.kubernetes-config.secrets` 的 `quarkus-kubernetes-config`）提供。在 `%prod` 中不要設定預設值，以便在遺漏機密時快速失敗。指向其他鍵的屬性表達式是可以的；請讓認證資訊遠離記錄檔。

### `@ConfigMapping` 對比 `@ConfigProperty`

```java
@ConfigMapping(prefix = "greeting")
public interface GreetingConfig {
    String prefix();
    @WithDefault("10") int maxLength();     // greeting.max-length
    Optional<String> suffix();
    List<String> tags();                    // greeting.tags=a,b
}
```

已驗證：透過 `@Inject GreetingConfig config` 插入，`maxLength()` 傳回來自 `greeting.max-length` 的值，`suffix()` 為空，`tags()` 為 `[a, b]`。巢狀群組為巢狀介面；支援 `Map<String,...>`。當存在時，可在對應方法上使用 hibernate-validator 加入 `@Valid` 風格的條件約束；違反時啟動失敗。

- 對於任何一組相關屬性，使用 `@ConfigMapping`（具型別、啟動時驗證、集中記載）。
- 對於單一數值或需要 `defaultValue` 時，使用 `@ConfigProperty(name = "app.api-key") String key;`。亦適用於建構函式參數。
- 對應前綴底下的未知屬性可能導致啟動失敗；請保持啟用該驗證以捕捉錯字。
- 建構階段對比執行階段：`quarkus.*` 建構階段屬性（在設定參考中有標記）在封裝時即已固定。在假設環境變數覆寫於容器中有效之前，請先檢查擴充功能指南。

## 使用 ArC 的 CDI

ArC 是建構階段 CDI Lite 風格的實作，而非完整的 CDI：沒有可攜式擴充功能（請使用相容建構的擴充功能或 Quarkus 建構步驟），並非所有路徑皆有 decorator，且部分功能有所不同。

- **建構階段解析**：插入點在建構時進行驗證；遺漏或不明確的 Bean 會導致建構失敗，而非執行階段失敗。
- **移除未使用的 Bean**：沒有插入點、沒有觀察者、沒有 producer 使用，且未標註 `@Unremovable` 的 Bean 會被移除。若您透過動態型別使用 `Arc.container().instance(...)` 或 `CDI.current().select(...)` 查閱它們，請加入 `@io.quarkus.arc.Unremovable`。僅作為最後手段使用 `quarkus.arc.remove-unused-beans=none` 進行全域停用。
- **範圍（Scopes）**：`@ApplicationScoped` 是延遲且經過代理的（支援攔截器、模擬、循環相依）；預設選擇。`@Singleton` 未經代理（無客戶端代理，因此無法透過代理進行延遲初始化，且 `@InjectMock` 不適用）：僅用於無狀態持有者。`@RequestScoped` 針對每個 HTTP 請求；`@Dependent` 是預設的虛擬範圍（每個插入點建立新實例）。
- **無 private 插入**：使用套件私有（package-private）欄位或建構函式。Quarkus 建議不要使用 private 插入欄位，因為它們會強制進行反射式存取。偏好建構函式插入（單一建構函式時 `@Inject` 選填）。
- **代理常見陷阱（已驗證）**：`@ApplicationScoped` Bean 是透過子類別代理呼叫的；從外部讀取此類 Bean 的公用欄位會傳回代理本身的（預設）值。請透過方法公開狀態。避免在 Bean 類別與方法上使用 `final`，以及避免在正常範圍 Bean 上使用 private 無引數建構函式。
- **啟動邏輯**：在 Bean 上標註 `@Startup`，或使用 `void onStart(@Observes StartupEvent e)`。積極載入（Eager）的 Bean 切勿在主執行緒上未經注意地執行緩慢阻斷的 I/O。
- **攔截器（Interceptors）**：定義 `@InterceptorBinding` 註釋以及帶有 `@Priority` 的 `@Interceptor`；ArC 僅在建構階段將它們套用至 Bean 類別（而非任意物件）。ArC 支援被攔截的自呼叫（self-invocation），因此呼叫自身被攔截方法（`@Transactional`、`@Retry`、`@CacheResult`）的 Bean 仍會觸發攔截器。
- **Producer 與事件**：`@Produces` 與 `@Observes` 如常運作。`@Priority` 僅對同步 `@Observes` 方法排序；它不會使方法變為非同步。非同步觀察者使用 `@ObservesAsync`，且僅由 `Event.fireAsync(...)`（傳回 `CompletionStage`）通知；`Event.fire(...)` 僅通知同步觀察者。
- **測試**：`@InjectMock`（`quarkus-junit-mockito`；舊版本為 `quarkus-junit5-mockito`）適用於正常範圍的 Bean。請參閱 `quarkus-dev-services-and-testing`。
- **除錯**：Dev UI（`/q/dev-ui`）ArC 頁面列出 Bean、已移除的 Bean 與觀察者。

記錄（Logging）：JBoss Logging（`org.jboss.logging.Logger`）或 `@Inject Logger`，透過 `quarkus.log.*` 設定；請勿直接加入 Logback/Log4j。
