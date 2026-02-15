# 測試 — 完整的參考資料

Aspire 提供 `Aspire.Hosting.Testing`，用於針對完整的 AppHost 執行整合測試。測試會啟動整個分散式應用程式 (或其子集)，並針對實際服務執行判斷提示 (assertions)。

---

## 套件

```xml
<PackageReference Include="Aspire.Hosting.Testing" Version="*" />
```

---

## 核心模式：DistributedApplicationTestingBuilder

```csharp
// 1. 從您的 AppHost 建立測試建置器
var builder = await DistributedApplicationTestingBuilder
    .CreateAsync<Projects.MyAppHost>();

// 2. (選用) 覆寫用於測試的資源
// ... 請參閱下方的自訂章節

// 3. 建構並啟動應用程式
await using var app = await builder.BuildAsync();
await app.StartAsync();

// 4. 為您的服務建立 HTTP 用戶端
var client = app.CreateHttpClient("api");

// 5. 執行判斷提示 (assertions)
var response = await client.GetAsync("/health");
Assert.Equal(HttpStatusCode.OK, response.StatusCode);
```

---

## xUnit 範例

### 基本健康檢查測試

```csharp
public class HealthTests(ITestOutputHelper output)
{
    [Fact]
    public async Task AllServicesAreHealthy()
    {
        var builder = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.AppHost>();

        await using var app = await builder.BuildAsync();
        await app.StartAsync();

        // 測試每個服務的健康檢查端點
        var apiClient = app.CreateHttpClient("api");
        var apiHealth = await apiClient.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, apiHealth.StatusCode);

        var workerClient = app.CreateHttpClient("worker");
        var workerHealth = await workerClient.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, workerHealth.StatusCode);
    }
}
```

### API 整合測試

```csharp
public class ApiTests(ITestOutputHelper output)
{
    [Fact]
    public async Task CreateOrder_ReturnsCreated()
    {
        var builder = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.AppHost>();

        await using var app = await builder.BuildAsync();
        await app.StartAsync();

        var client = app.CreateHttpClient("api");

        var order = new { ProductId = 1, Quantity = 2 };
        var response = await client.PostAsJsonAsync("/orders", order);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<Order>();
        Assert.NotNull(created);
        Assert.Equal(1, created.ProductId);
    }
}
```

### 測試並等待就緒

```csharp
[Fact]
public async Task DatabaseIsSeeded()
{
    var builder = await DistributedApplicationTestingBuilder
        .CreateAsync<Projects.AppHost>();

    await using var app = await builder.BuildAsync();
    await app.StartAsync();

    // 等待 API 完全就緒 (所有相依性均健康)
    await app.WaitForResourceReadyAsync("api");

    var client = app.CreateHttpClient("api");
    var response = await client.GetAsync("/products");

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    var products = await response.Content.ReadFromJsonAsync<List<Product>>();
    Assert.NotEmpty(products);
}
```

---

## MSTest 範例

```csharp
[TestClass]
public class IntegrationTests
{
    [TestMethod]
    public async Task ApiReturnsProducts()
    {
        var builder = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.AppHost>();

        await using var app = await builder.BuildAsync();
        await app.StartAsync();

        var client = app.CreateHttpClient("api");
        var response = await client.GetAsync("/products");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }
}
```

---

## NUnit 範例

```csharp
[TestFixture]
public class IntegrationTests
{
    [Test]
    public async Task ApiReturnsProducts()
    {
        var builder = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.AppHost>();

        await using var app = await builder.BuildAsync();
        await app.StartAsync();

        var client = app.CreateHttpClient("api");
        var response = await client.GetAsync("/products");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
}
```

---

## 自訂測試 AppHost

### 覆寫資源

```csharp
var builder = await DistributedApplicationTestingBuilder
    .CreateAsync<Projects.AppHost>();

// 將實際資料庫替換為測試容器
builder.Services.ConfigureHttpClientDefaults(http =>
{
    http.AddStandardResilienceHandler();
});

// 新增測試特定組態
builder.Configuration["TestMode"] = "true";

await using var app = await builder.BuildAsync();
await app.StartAsync();
```

### 排除資源

```csharp
var builder = await DistributedApplicationTestingBuilder
    .CreateAsync<Projects.AppHost>(args =>
    {
        // 針對僅限 API 的測試，不啟動工作者 (worker)
        args.Args = ["--exclude-resource", "worker"];
    });
```

### 使用特定環境進行測試

```csharp
var builder = await DistributedApplicationTestingBuilder
    .CreateAsync<Projects.AppHost>(args =>
    {
        args.Args = ["--environment", "Testing"];
    });
```

---

## 連接字串存取

```csharp
// 在測試中獲取資源的連接字串
var connectionString = await app.GetConnectionStringAsync("db");

// 使用它在測試中直接查詢資料庫
using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();
var count = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM products");
Assert.True(count > 0);
```

---

## 最佳做法

1. **在發送要求前使用 `WaitForResourceReadyAsync`** — 確保所有相依性均健康
2. **每個測試應彼此獨立** — 不要依賴先前測試的狀態
3. **對應用程式使用 `await using`** — 確保即使在測試失敗時也能進行清理
4. **測試實際的基礎設施** — Aspire 會啟動真正的容器 (Redis、PostgreSQL 等)，為您提供高逼真度的整合測試
5. **保持測試 AppHost 精簡** — 排除特定測試案例中不需要的資源
6. **使用測試特定組態** — 覆寫設定以實現測試隔離
7. **逾時保護** — 由於容器啟動需要時間，請設定合理的測試逾時時間：

```csharp
[Fact(Timeout = 120_000)]  // 2 分鐘
public async Task SlowIntegrationTest() { ... }
```

---

## 專案結構

```
MyApp/
├── src/
│   ├── MyApp.AppHost/           # AppHost 專案
│   ├── MyApp.Api/               # API 服務
│   ├── MyApp.Worker/            # 工作者 (worker) 服務
│   └── MyApp.ServiceDefaults/   # 共用預設值
└── tests/
    └── MyApp.Tests/             # 整合測試
        ├── MyApp.Tests.csproj   # 參考 AppHost + 測試套件
        └── ApiTests.cs          # 測試類別
```

```xml
<!-- MyApp.Tests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <IsAspireTestProject>true</IsAspireTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Aspire.Hosting.Testing" Version="*" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="*" />
    <PackageReference Include="xunit" Version="*" />
    <PackageReference Include="xunit.runner.visualstudio" Version="*" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\MyApp.AppHost\MyApp.AppHost.csproj" />
  </ItemGroup>
</Project>
```
