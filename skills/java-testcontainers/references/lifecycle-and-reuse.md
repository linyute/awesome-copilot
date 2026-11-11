# 生命週期、Singleton 與重複使用

## JUnit Jupiter 擴充功能

在類別上標註 `@Testcontainers` 可啟用擴充功能；`@Container` 欄位會由其負責啟動/停止。

- `static` 欄位：在該類別的所有測試前啟動一次，在測試後停止。
- 執行個體欄位：在每個測試方法前後啟動/停止。
- 此擴充功能不會啟動未標註 `@Container` 宣告的容器；請自行呼叫 `start()`。

當缺少 Docker 時，`@Testcontainers(disabledWithoutDocker = true)` 會跳過測試（而非判定失敗）。在選用的本機執行中使用它；在 CI 中則建議直接顯示失敗。

## Singleton 容器模式（整個執行期間）

為每個類別啟動容器會佔用大部分測試時間。透過在靜態初始化程式中啟動的存放器跨類別共用單一執行個體。Ryuk（清理 sidecar）會在 JVM 結束時將其停止，因此不需要明確停止。

```java
import org.testcontainers.postgresql.PostgreSQLContainer;

public final class SharedPostgres {

    public static final PostgreSQLContainer INSTANCE =
            new PostgreSQLContainer("postgres:17-alpine");

    static {
        INSTANCE.start();
    }

    private SharedPostgres() {}
}
```

測試類別讀取 `SharedPostgres.INSTANCE.getJdbcUrl()`，且**不要**使用 `@Container` 進行標註（否則會在第一個類別結束後停止容器）。帶有靜態區塊的抽象基礎類別具有同樣效果。

隔離資料而非隔離容器：在 `@BeforeEach` 中截斷資料表、復原交易，或為每個類別建立獨立的結構描述/資料庫。

## 多次執行間重複使用（僅限本機開發）

重複使用機制會在 JVM 退出後保持容器運作，讓下一次執行能立即完成。

1. 在開發者機器上的 `~/.testcontainers.properties` 中選擇啟用：`testcontainers.reuse.enable=true`。
2. 標記容器：`new PostgreSQLContainer("postgres:17-alpine").withReuse(true)`，並手動啟動它（靜態區塊或 `start()`）。不要使用 `@Container` 進行標註：JUnit 擴充功能會在測試後將其停止，導致無法重複使用。

注意事項：重複使用的容器永遠不會由 Testcontainers 停止（需使用 `docker rm -f` 手動清理）；狀態會持續保留，因此測試必須自行清理資料；除非兩項設定同時存在，否則重複使用會被忽略，因此在程式碼中保留 `withReuse(true)` 是安全的。切勿在 CI 中啟用。

## 平行執行

- 若測試不共用資料列，共用容器的 JUnit 平行模式是可行的；為每個測試提供專屬的租戶/結構描述/索引鍵前綴。
- 請勿將會截斷共用資料表的測試進行平行化。
- 耗費資源的容器（Kafka、Elasticsearch）應保持為 singleton。

## 手動生命週期

容器實作了 `AutoCloseable`：

```java
try (var redis = new GenericContainer<>("redis:7.4-alpine").withExposedPorts(6379)) {
    redis.start();
    // 使用 redis.getHost(), redis.getMappedPort(6379)
}
```

## 連接埠與位址

切勿繫結固定主機連接埠。請使用 `getHost()` 與 `getMappedPort(containerPort)`；針對模組優先使用具型別的 getter（`getJdbcUrl()`、`getBootstrapServers()`）。映射連接埠每次啟動均為隨機分配。
