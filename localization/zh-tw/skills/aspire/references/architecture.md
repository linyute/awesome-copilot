# 架構 — 深入探討

此參考資料涵蓋了 Aspire 的內部架構：DCP 引擎、資源模型、服務探索、網路、遙測和事件系統。

---

## 開發人員控制平面 (DCP)

DCP 是 Aspire 在 `aspire run` 模式中使用的**執行階段引擎**。關鍵事實：

- 使用 **Go** 編寫 (非 .NET)
- 公開一個 **與 Kubernetes 相容的 API 伺服器** (僅限本地，不是真正的 K8s 叢集)
- 管理資源生命週期：建立、啟動、健康檢查、停止、重新啟動
- 透過本地容器執行階段 (Docker、Podman、Rancher) 執行容器
- 將可執行檔作為原生作業系統程序執行
- 透過具有自動連接埠分配功能的 Proxy 層處理網路
- 為 Aspire 儀表板的即時資料提供基礎

### DCP vs Kubernetes

| 特性 | DCP (本地開發) | Kubernetes (生產環境) |
|---|---|---|
| API | 與 Kubernetes 相容 | 完整的 Kubernetes API |
| 範圍 | 單機 | 叢集 |
| 網路 | 本地 Proxy、自動連接埠 | 服務網格、Ingress |
| 儲存 | 本地磁碟區 | PVC、雲端儲存 |
| 目的 | 開發人員內部迴圈 | 生產環境部署 |

與 Kubernetes 相容的 API 意味著 Aspire 理解相同的資源抽象，但 DCP **不是** Kubernetes 散佈版本 — 它是一個輕量級的本地執行階段。

---

## 資源模型

Aspire 中的一切都是**資源**。資源模型是階層式的：

### 類型階層

```
IResource (介面)
└── Resource (抽象基底)
    ├── ProjectResource          — .NET 專案參考
    ├── ContainerResource        — Docker/OCI 容器
    ├── ExecutableResource       — 原生程序 (多語言應用程式)
    ├── ParameterResource        — 組態值或秘密 (secret)
    └── 基礎設施資源
        ├── RedisResource
        ├── PostgresServerResource
        ├── MongoDBServerResource
        ├── SqlServerResource
        ├── RabbitMQServerResource
        ├── KafkaServerResource
        └── ... (每個整合一個)
```

### 資源屬性

每個資源都有：
- **名稱** — AppHost 內的唯一識別碼
- **狀態** — 生命週期狀態 (Starting, Running, FailedToStart, Stopping, Stopped 等)
- **註釋 (Annotations)** — 附加到資源的 Metadata
- **端點 (Endpoints)** — 資源公開的網路端點
- **環境變數** — 插入到程序/容器中

### 註釋 (Annotations)

註釋是附加到資源的 Metadata 包。常見的內建註釋：

| 註釋 | 目的 |
|---|---|
| `EndpointAnnotation` | 定義 HTTP/HTTPS/TCP 端點 |
| `EnvironmentCallbackAnnotation` | 延遲的環境變數解析 |
| `HealthCheckAnnotation` | 健康檢查組態 |
| `ContainerImageAnnotation` | Docker 映像詳細資訊 |
| `VolumeAnnotation` | 磁碟區掛載組態 |
| `CommandLineArgsCallbackAnnotation` | 動態 CLI 引數 |
| `ManifestPublishingCallbackAnnotation` | 自訂發佈行為 |

### 資源生命週期狀態

```
NotStarted → Starting → Running → Stopping → Stopped
                 ↓                     ↓
          FailedToStart           執行階段不健康 (RuntimeUnhealthy)
                                       ↓
                                  重新啟動中 (Restarting) → Running
```

### DAG (有向無環圖)

資源形成一個相依性圖表。Aspire 按拓撲順序啟動資源：

```
PostgreSQL ──→ API ──→ 前端
Redis ────────↗
RabbitMQ ──→ 工作者 (Worker)
```

1. PostgreSQL、Redis 和 RabbitMQ 首先啟動 (沒有相依性)
2. API 在 PostgreSQL 和 Redis 健康後啟動
3. 前端在 API 健康後啟動
4. 工作者在 RabbitMQ 健康後啟動

`.WaitFor()` 為相依性邊緣增加了一個健康檢查門控。沒有它，相依性會啟動，但下游不會等待健康狀態。

---

## 服務探索

Aspire 將環境變數插入每個資源，以便服務可以找到彼此。不需要服務登錄 (registry) 或 DNS — 這是純粹的環境變數插入。

### 連接字串

對於資料庫、快取和訊息代理程式：

```
ConnectionStrings__<resource-name>=<connection-string>
```

範例：
```
ConnectionStrings__cache=localhost:6379
ConnectionStrings__catalog=Host=localhost;Port=5432;Database=catalog;Username=postgres;Password=...
ConnectionStrings__messaging=amqp://guest:guest@localhost:5672
```

### 服務端點

對於 HTTP/HTTPS 服務：

```
services__<resource-name>__<scheme>__0=<url>
```

範例：
```
services__api__http__0=http://localhost:5234
services__api__https__0=https://localhost:7234
services__ml__http__0=http://localhost:8000
```

### .WithReference() 的運作方式

```csharp
var redis = builder.AddRedis("cache");
var api = builder.AddProject<Projects.Api>("api")
    .WithReference(redis);
```

這會：
1. 將 `ConnectionStrings__cache=localhost:<自動連接埠>` 新增至 API 的環境中
2. 在 DAG 中建立一個相依性邊緣 (API 相依於 Redis)
3. 在 API 服務中，`builder.Configuration.GetConnectionString("cache")` 會傳回連接字串

### 跨語言服務探索

所有語言都使用相同的環境變數模式：

| 語言 | 如何讀取 |
|---|---|
| C# | `builder.Configuration.GetConnectionString("cache")` |
| Python | `os.environ["ConnectionStrings__cache"]` |
| JavaScript | `process.env.ConnectionStrings__cache` |
| Go | `os.Getenv("ConnectionStrings__cache")` |
| Java | `System.getenv("ConnectionStrings__cache")` |
| Rust | `std::env::var("ConnectionStrings__cache")` |

---

## 網路

### Proxy 架構

在 `aspire run` 模式中，DCP 為每個公開的端點執行反向 Proxy：

```
瀏覽器 → Proxy (自動分配的連接埠) → 實際服務 (目標連接埠)
```

- **port** (外部連接埠) — 由 DCP 自動分配，除非覆寫
- **targetPort** — 您的服務實際接聽的連接埠
- 為了可觀測性，所有服務間的流量都會經過 Proxy

```csharp
// 讓 DCP 自動分配外部連接埠，服務接聽 8000
builder.AddPythonApp("ml", "../ml", "main.py")
    .WithHttpEndpoint(targetPort: 8000);

// 將外部連接埠固定為 3000
builder.AddViteApp("web", "../frontend")
    .WithHttpEndpoint(port: 3000, targetPort: 5173);
```

### 端點類型

```csharp
// HTTP 端點
.WithHttpEndpoint(port?, targetPort?, name?)

// HTTPS 端點
.WithHttpsEndpoint(port?, targetPort?, name?)

// 通用端點 (TCP、自訂配置)
.WithEndpoint(port?, targetPort?, scheme?, name?, isExternal?)

// 將端點標記為可外部存取 (用於部署)
.WithExternalHttpEndpoints()
```

---

## 遙測 (OpenTelemetry)

Aspire 為 .NET 服務自動設定 OpenTelemetry。對於非 .NET 服務，您可以手動設定 OpenTelemetry，並指向 DCP 收集器。

### 自動設定的內容 (.NET 服務)

- **分散式追蹤** — HTTP 用戶端/伺服器範圍 (spans)、資料庫範圍、訊息範圍
- **計量** — 執行階段計量、HTTP 計量、自訂計量
- **結構化記錄** — 與追蹤內容相互關聯的記錄
- **匯出器** — 指向 Aspire 儀表板的 OTLP 匯出器

### 設定非 .NET 服務

DCP 公開了一個 OTLP 端點。在您的非 .NET 服務中設定這些環境變數：

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=<您的服務名稱>
```

Aspire 會透過 `.WithReference()` 為儀表板收集器自動插入 `OTEL_EXPORTER_OTLP_ENDPOINT`。

### ServiceDefaults 模式

`ServiceDefaults` 專案是一個共用組態函式庫，它標準化了：
- OpenTelemetry 設定 (追蹤、計量、記錄)
- 健康檢查端點 (`/health`、`/alive`)
- 恢復能力策略 (透過 Polly 進行重試、斷路器)

```csharp
// 在每個 .NET 服務的 Program.cs 中
builder.AddServiceDefaults();   // 新增 OTel、健康檢查、恢復能力
// ... 其他服務組態 ...
app.MapDefaultEndpoints();      // 映射 /health 和 /alive
```

---

## 健康檢查

### 內建健康檢查

每個整合都會在用戶端自動新增健康檢查：
- Redis：`PING` 命令
- PostgreSQL：`SELECT 1`
- MongoDB：`ping` 命令
- RabbitMQ：連線檢查
- 等等。

### WaitFor vs WithReference

```csharp
// WithReference：連接連接字串 + 建立相依性邊緣
// (下游可能會在相依性健康之前啟動)
.WithReference(db)

// WaitFor：健康檢查門控 — 下游在健康之前不會啟動
.WaitFor(db)

// 典型模式：兩者皆用
.WithReference(db).WaitFor(db)
```

### 自訂健康檢查

```csharp
var api = builder.AddProject<Projects.Api>("api")
    .WithHealthCheck("ready", "/health/ready")
    .WithHealthCheck("live", "/health/live");
```

---

## 事件系統

AppHost 支援生命週期事件，用於對資源狀態變更做出反應：

```csharp
builder.Eventing.Subscribe<ResourceReadyEvent>("api", (evt, ct) =>
{
    // 當 "api" 資源變得健康時觸發
    Console.WriteLine($"API 已在 {evt.Resource.Name} 準備就緒");
    return Task.CompletedTask;
});

builder.Eventing.Subscribe<BeforeResourceStartedEvent>("db", async (evt, ct) =>
{
    // 在資料庫資源標記為已啟動之前執行資料庫遷移
    await RunMigrations();
});
```

### 可用事件

| 事件 | 何時觸發 |
|---|---|
| `BeforeResourceStartedEvent` | 在資源啟動之前 |
| `ResourceReadyEvent` | 資源健康且準備就緒 |
| `ResourceStateChangedEvent` | 任何狀態轉換 |
| `BeforeStartEvent` | 在整個應用程式啟動之前 |
| `AfterEndpointsAllocatedEvent` | 在所有連接埠分配之後 |

---

## 組態

### 參數

```csharp
// 一般參數
var apiKey = builder.AddParameter("api-key");

// 秘密參數 (在執行時提示，不記錄)
var dbPassword = builder.AddParameter("db-password", secret: true);

// 在資源中使用
var api = builder.AddProject<Projects.Api>("api")
    .WithEnvironment("API_KEY", apiKey);

var db = builder.AddPostgres("db", password: dbPassword);
```

### 組態來源

參數按以下優先順序解析：
1. 命令列引數
2. 環境變數
3. 使用者秘密 (`dotnet user-secrets`)
4. `appsettings.json` / `appsettings.{Environment}.json`
5. 互動式提示 (用於 `aspire run` 期間的秘密)
