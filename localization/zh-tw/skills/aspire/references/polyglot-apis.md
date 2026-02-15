# 多語言 API — 完整的參考資料

Aspire 支援 10 種以上的語言/執行階段。AppHost 始終是 .NET，但編排的工作負載可以是任何語言。每種語言都有一個裝載方法，會傳回一個您可以用來連接到相依性圖表中的資源。

---

## 裝載模型差異

| 模型 | 資源類型 | 執行方式 | 範例 |
|---|---|---|---|
| **專案 (Project)** | `ProjectResource` | .NET 專案參考，由 SDK 建構 | `AddProject<T>()` |
| **容器 (Container)** | `ContainerResource` | Docker/OCI 映像 | `AddContainer()`、`AddRedis()`、`AddPostgres()` |
| **可執行檔 (Executable)** | `ExecutableResource` | 原生作業系統程序 | `AddExecutable()`、所有 `Add*App()` 多語言方法 |

所有多語言 `Add*App()` 方法在底層都會建立 `ExecutableResource` 執行個體。它們不需要在 AppHost 端安裝目標語言的 SDK — 只需要在開發機器上安裝工作負載的執行階段即可。

---

## 官方 (由 Microsoft 維護)

### .NET / C\#

```csharp
builder.AddProject<Projects.MyApi>("api")
```

**鏈式方法：**
- `.WithHttpEndpoint(port?, targetPort?, name?)` — 公開 HTTP 端點
- `.WithHttpsEndpoint(port?, targetPort?, name?)` — 公開 HTTPS 端點
- `.WithEndpoint(port?, targetPort?, scheme?, name?)` — 通用端點
- `.WithReference(resource)` — 連接相依性 (連接字串或服務探索)
- `.WithReplicas(count)` — 執行多個執行個體
- `.WithEnvironment(key, value)` — 設定環境變數
- `.WithEnvironment(callback)` — 透過回呼設定環境變數 (延遲解析)
- `.WaitFor(resource)` — 在相依性健康之前不要啟動
- `.WithExternalHttpEndpoints()` — 將端點標記為外部可存取
- `.WithOtlpExporter()` — 設定 OpenTelemetry 匯出器
- `.PublishAsDockerFile()` — 將發佈行為覆寫為 Dockerfile

### Python

```csharp
// 標準 Python 指令碼
builder.AddPythonApp("service", "../python-service", "main.py")

// Uvicorn ASGI 伺服器 (FastAPI, Starlette 等)
builder.AddUvicornApp("fastapi", "../fastapi-app", "app:app")
```

**`AddPythonApp(name, projectDirectory, scriptPath, args?)`**

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)` — 公開 HTTP
- `.WithVirtualEnvironment(path?)` — 使用虛擬環境 (預設：`.venv`)
- `.WithPipPackages(packages)` — 在啟動時安裝 pip 套件
- `.WithReference(resource)` — 連接相依性
- `.WithEnvironment(key, value)` — 設定環境變數
- `.WaitFor(resource)` — 等待相依性健康狀況

**`AddUvicornApp(name, projectDirectory, appModule, args?)`**

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)` — 公開 HTTP
- `.WithVirtualEnvironment(path?)` — 使用虛擬環境 (預設：`.venv`)
- `.WithReference(resource)` — 連接相依性
- `.WithEnvironment(key, value)` — 設定環境變數
- `.WaitFor(resource)` — 等待相依性健康狀況

**Python 服務探索：** 環境變數會自動插入。使用 `os.environ` 讀取：
```python
import os
redis_conn = os.environ["ConnectionStrings__cache"]
api_url = os.environ["services__api__http__0"]
```

### JavaScript / TypeScript

```csharp
// 一般 JavaScript 應用程式 (npm start)
builder.AddJavaScriptApp("frontend", "../web-app")

// Vite 開發伺服器
builder.AddViteApp("spa", "../vite-app")

// Node.js 指令碼
builder.AddNodeApp("worker", "server.js", "../node-worker")
```

**`AddJavaScriptApp(name, workingDirectory)`**

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)` — 公開 HTTP
- `.WithNpmPackageInstallation()` — 在啟動前執行 `npm install`
- `.WithReference(resource)` — 連接相依性
- `.WithEnvironment(key, value)` — 設定環境變數
- `.WaitFor(resource)` — 等待相依性健康狀況

**`AddViteApp(name, workingDirectory)`**

鏈式方法 (與 `AddJavaScriptApp` 相同，外加)：
- `.WithNpmPackageInstallation()` — 在啟動前執行 `npm install`
- `.WithHttpEndpoint(port?, targetPort?, name?)` — Vite 預設為 5173

**`AddNodeApp(name, scriptPath, workingDirectory)`**

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)` — 公開 HTTP
- `.WithNpmPackageInstallation()` — 在啟動前執行 `npm install`
- `.WithReference(resource)` — 連接相依性
- `.WithEnvironment(key, value)` — 設定環境變數

**JS/TS 服務探索：** 環境變數會自動插入。使用 `process.env`：
```javascript
const redisUrl = process.env.ConnectionStrings__cache;
const apiUrl = process.env.services__api__http__0;
```

---

## 社群 (CommunityToolkit/Aspire)

所有社群整合都遵循相同的模式：在您的 AppHost 中安裝 NuGet 套件，然後使用 `Add*App()` 方法。

### Go

**套件：** `CommunityToolkit.Aspire.Hosting.Golang`

```csharp
builder.AddGolangApp("go-api", "../go-service")
    .WithHttpEndpoint(targetPort: 8080)
    .WithReference(redis)
    .WithEnvironment("LOG_LEVEL", "debug")
    .WaitFor(redis);
```

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`

**Go 服務探索：** 透過 `os.Getenv()` 讀取標準環境變數：
```go
redisAddr := os.Getenv("ConnectionStrings__cache")
```

### Java (Spring Boot)

**套件：** `CommunityToolkit.Aspire.Hosting.Java`

```csharp
builder.AddSpringApp("spring-api", "../spring-service")
    .WithHttpEndpoint(targetPort: 8080)
    .WithReference(postgres)
    .WaitFor(postgres);
```

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`
- `.WithMavenBuild()` — 在啟動前執行 Maven 建置
- `.WithGradleBuild()` — 在啟動前執行 Gradle 建置

**Java 服務探索：** 透過 `System.getenv()` 讀取環境變數：
```java
String dbConn = System.getenv("ConnectionStrings__db");
```

### Rust

**套件：** `CommunityToolkit.Aspire.Hosting.Rust`

```csharp
builder.AddRustApp("rust-worker", "../rust-service")
    .WithHttpEndpoint(targetPort: 3000)
    .WithReference(redis)
    .WaitFor(redis);
```

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`
- `.WithCargoBuild()` — 在啟動前執行 `cargo build`

### Bun

**套件：** `CommunityToolkit.Aspire.Hosting.Bun`

```csharp
builder.AddBunApp("bun-api", "../bun-service")
    .WithHttpEndpoint(targetPort: 3000)
    .WithReference(redis);
```

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`
- `.WithBunPackageInstallation()` — 在啟動前執行 `bun install`

### Deno

**套件：** `CommunityToolkit.Aspire.Hosting.Deno`

```csharp
builder.AddDenoApp("deno-api", "../deno-service")
    .WithHttpEndpoint(targetPort: 8000)
    .WithReference(redis);
```

鏈式方法：
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`

### PowerShell

```csharp
builder.AddPowerShell("ps-script", "../scripts/process.ps1")
    .WithReference(storageAccount);
```

### Dapr

**套件：** `Aspire.Hosting.Dapr` (官方)

```csharp
var dapr = builder.AddDapr();
var api = builder.AddProject<Projects.Api>("api")
    .WithDaprSidecar("api-sidecar");
```

---

## 完整的混合語言範例

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// 基礎設施
var redis = builder.AddRedis("cache");
var postgres = builder.AddPostgres("pg").AddDatabase("catalog");
var mongo = builder.AddMongoDB("mongo").AddDatabase("analytics");
var rabbit = builder.AddRabbitMQ("messaging");

// .NET API (主要)
var api = builder.AddProject<Projects.CatalogApi>("api")
    .WithReference(postgres)
    .WithReference(redis)
    .WithReference(rabbit)
    .WaitFor(postgres)
    .WaitFor(redis);

// Python ML 服務 (FastAPI)
var ml = builder.AddUvicornApp("ml", "../ml-service", "app:app")
    .WithHttpEndpoint(targetPort: 8000)
    .WithVirtualEnvironment()
    .WithReference(redis)
    .WithReference(mongo)
    .WaitFor(redis);

// TypeScript 前端 (Vite + React)
var web = builder.AddViteApp("web", "../frontend")
    .WithNpmPackageInstallation()
    .WithHttpEndpoint(targetPort: 5173)
    .WithReference(api);

// Go 事件處理器
var processor = builder.AddGolangApp("processor", "../go-processor")
    .WithReference(rabbit)
    .WithReference(mongo)
    .WaitFor(rabbit);

// Java 分析服務 (Spring Boot)
var analytics = builder.AddSpringApp("analytics", "../spring-analytics")
    .WithHttpEndpoint(targetPort: 8080)
    .WithReference(mongo)
    .WithReference(rabbit)
    .WaitFor(mongo);

// Rust 高效能工作者
var worker = builder.AddRustApp("worker", "../rust-worker")
    .WithReference(redis)
    .WithReference(rabbit)
    .WaitFor(redis);

builder.Build().Run();
```

這個單一的 AppHost 啟動了跨 5 種語言的 6 個服務以及 4 個基礎設施資源，所有這些都透過自動服務探索連接在一起。
