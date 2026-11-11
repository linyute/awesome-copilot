# 容器、等待機制、網路、Compose

## 模組對比 GenericContainer

若存在專用模組（`testcontainers-postgresql`、`-mysql`、`-mariadb`、`-kafka`、`-mongodb`、`-localstack` 等），優先使用專用模組：它提供正確的等待策略、認證憑證與具型別的 getter。對於其他所有項目，回退使用 `GenericContainer`。

```java
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import java.time.Duration;

GenericContainer<?> app = new GenericContainer<>("my-registry/my-service:1.4.2")
        .withExposedPorts(8080)
        .withEnv("MODE", "test")
        .waitingFor(Wait.forHttp("/health").forStatusCode(200))
        .withStartupTimeout(Duration.ofMinutes(2));
```

## 等待策略

透過 `waitingFor(...)` 設定。請挑選代表「真正就緒」的訊號，而非僅代表「處理程序已啟動」。

| 策略 | 用途 |
| --- | --- |
| `Wait.forListeningPorts()` | 連接埠已開啟（可能在應用程式就緒之前） |
| `Wait.forHttp(path).forStatusCode(200)` | HTTP 健康檢查端點 |
| `Wait.forLogMessage(regex, times)` | 記錄中的就緒字行（正規表示式必須比對整行，例如 `.*ready.*\\n`） |
| `Wait.forHealthcheck()` | 映像檔定義了 `HEALTHCHECK` |
| `Wait.forSuccessfulCommand("cmd")` | 透過容器內部執行命令進行探測 |
| `new WaitAllStrategy().withStrategy(a).withStrategy(b)` | 組合多種策略（`org.testcontainers.containers.wait.strategy.WaitAllStrategy`） |

在緩慢的 CI 環境中應調高 `withStartupTimeout`，而非新增 sleep。切勿使用 `Thread.sleep`；在測試中請使用 Awaitility 輪詢非同步結果。

## 設定與檔案

- `withEnv`、`withCommand`、`withLabel`、`withTmpFs(Map.of("/var/lib/postgresql/data", "rw"))`（以 RAM 為後盾的資料目錄可加速資料庫測試）。
- 類別路徑資源：`withCopyFileToContainer(MountableFile.forClasspathResource("conf.yml"), "/etc/app/conf.yml")`（優先於繫結掛載：適用於遠端 Docker）。
- 繫結掛載（`withFileSystemBind`）在遠端常駐程式與部分無 root 權限（rootless）設定下會失效；請避免使用。

## 初始化指令碼

資料庫模組：`withInitScript("db/init.sql")`（類別路徑）在啟動後執行一次。或者將指令碼複製至 `/docker-entrypoint-initdb.d/`（官方 Postgres/MySQL 映像檔）。對於結構描述演進，請針對容器執行真實的遷移工具（Flyway/Liquibase），而非在初始化指令碼中重複定義 DDL。

## 網路與多容器設定

容器彼此間透過網路別名（network alias）通訊，而非透過映射的連接埠。

```java
import org.testcontainers.containers.Network;

Network net = Network.newNetwork();   // 由 Ryuk 進行清理

var db = new PostgreSQLContainer("postgres:17-alpine")
        .withNetwork(net).withNetworkAliases("db");

var app = new GenericContainer<>("my-registry/my-service:1.4.2")
        .withNetwork(net)
        .withEnv("DB_URL", "jdbc:postgresql://db:5432/test")
        .dependsOn(db)
        .withExposedPorts(8080);
```

在網路內部使用容器內部連接埠（5432）；從測試 JVM 則使用 `getMappedPort`。

## Docker Compose 模組

對於已在 compose 檔案中描述的服務堆疊，使用 `ComposeContainer`（需要 Docker Compose v2 CLI；類別為 `org.testcontainers.containers.ComposeContainer`，位於核心 artifact 中）。

```java
import org.testcontainers.containers.ComposeContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import java.io.File;

static ComposeContainer env = new ComposeContainer(new File("src/test/resources/compose-test.yml"))
        .withExposedService("api", 8080, Wait.forHttp("/health").forStatusCode(200))
        .withExposedService("db", 5432);

env.start(); // 端點僅在啟動後可用
try {
    String host = env.getServiceHost("api", 8080);
    Integer port = env.getServicePort("api", 8080);
    // 針對 host:port 執行測試
} finally {
    env.stop();
}
```

切勿在用於測試的 compose 檔案中發布固定的主機連接埠。對於一到兩個服務，優先使用個別獨立容器（更快速、具型別）；使用 Compose 則是為了重複使用多服務定義。

## 實用附加功能

- `container.followOutput(new Slf4jLogConsumer(log))` 用於串流記錄；失敗時使用 `getLogs()`。
- `withCreateContainerCmdModifier(cmd -> cmd.getHostConfig().withMemory(512L * 1024 * 1024))` 用於限制資源。
- `DockerImageName.parse("mirror/postgres:17").asCompatibleSubstituteFor("postgres")` 用於搭配模組使用映像檔鏡像或自訂映像檔。
