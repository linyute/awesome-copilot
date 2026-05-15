# 可串流 HTTP 傳輸 (ASP.NET Core)

可串流 HTTP 是現代的遠端傳輸方式。單一端點接受透過 HTTP POST 的 JSON-RPC，且當伺服器有多個訊息要傳送時，可以（選擇性地）將回應以伺服器傳送事件 (Server-Sent Events) 的形式串流傳回。

> **僅限 SSE 已被棄用。** 舊有的 "HTTP+SSE" 傳輸（獨立的 POST 端點 + GET SSE 端點）已從新用戶端中移除。請使用可串流 HTTP。僅在必須支援已知的舊版用戶端時才啟用舊版 SSE (`EnableLegacySse = true`)，並記錄原因。

## 何時選擇 HTTP

- 多租戶或遠端託管的伺服器。
- 透過前面的 OAuth / API 閘道進行身份驗證。
- 水平擴充的部署（使用 `Stateless = true`）。
- 容器、Azure Container Apps、Kubernetes 等。

對於本地單一使用者案例，[STDIO](./transport-stdio.md) 更簡單。

## 最小伺服器

```bash
dotnet new web -n MyHttpServer -f net10.0
cd MyHttpServer
dotnet add package ModelContextProtocol.AspNetCore
```

```csharp
// Program.cs
using ModelContextProtocol.Server;
using System.ComponentModel;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddMcpServer()
    .WithHttpTransport(options =>
    {
        // Stateless = true: 每個要求都是獨立的，沒有 Mcp-Session-Id 追蹤。
        // 水平擴充所需，無需黏性工作階段 (sticky sessions)。
        // 停用伺服器對用戶端的功能（sampling, elicitation, roots, unsolicited notifications）。
        options.Stateless = true;
    })
    .WithToolsFromAssembly();

var app = builder.Build();

app.MapMcp();              // 將 MCP 端點掛載於 "/"
// app.MapMcp("/mcp");     // 或在路徑前綴下

app.Run("http://localhost:3001");

[McpServerToolType]
public static class EchoTool
{
    [McpServerTool, Description("將訊息回傳給用戶端。")]
    public static string Echo(string message) => $"hello {message}";
}
```

## 無狀態 vs. 有狀態 — 最重要的決定

| 模式 | `options.Stateless` | 行為 | 何時使用 |
|---|---|---|---|
| **無狀態 (Stateless)** | `true` | 無 `Mcp-Session-Id`。每個 POST 都是獨立的。 | 水平擴充、簡單的工具伺服器、無伺服器啟始的流量。 |
| **有狀態 (Stateful)** | `false` (預設值) | 伺服器指派並追蹤 `Mcp-Session-Id`。長效型工作階段。 | 您需要 elicitation, sampling, roots, 日誌通知，或任何從伺服器推送到用戶端的內容。需要在負載平衡器設定工作階段親和性 (session affinity)。 |

**規則：** 如果使用者想要使用 `ElicitAsync`、`SampleAsync`、`RequestRootsAsync` 中的任何一項，或要推送日誌/通知訊息，**請勿**設定 `Stateless = true`。這些呼叫在執行時會因為沒有傳輸方式可傳送而失敗。

## 端點形狀

`MapMcp(pattern = "")` 會在 `pattern` 建立一個路由群組並對應：
- **POST** — 接受 JSON-RPC 要求/回應/通知。根據 `Accept` 標頭以及是否有多個訊息需要傳回，傳回 JSON 回應或 SSE 串流。
- **GET** — 用於有狀態工作階段的伺服器對用戶端 SSE 頻道。
- **DELETE** — 終止有狀態工作階段。

預設模式是根目錄 (`/`)。若要將 MCP 放在 `/mcp/v1` 下：

```csharp
app.MapMcp("/mcp/v1");
```

在用戶端進行對應 (`Endpoint = new Uri("https://host/mcp/v1")`)。

## 每個工作階段的組態 (HttpContext 存取)

當您需要根據每個 HTTP 要求（驗證、租戶、標頭）改變伺服器行為時，請使用 `ConfigureSessionOptions` 回呼：

```csharp
builder.Services
    .AddMcpServer()
    .WithHttpTransport(options =>
    {
        options.ConfigureSessionOptions = async (httpContext, mcpOptions, ct) =>
        {
            var tenantId = httpContext.Request.Headers["X-Tenant"].ToString();
            mcpOptions.ServerInstructions = $"Tenant: {tenantId}";
            // 根據每個工作階段修改任何 McpServerOptions 欄位
        };
    });
```

在工具內部，如果已註冊 `AddHttpContextAccessor()`，您也可以插入 `IHttpContextAccessor`。請參閱 [`AspNetCoreMcpPerSessionTools` 範例](https://github.com/modelcontextprotocol/csharp-sdk/tree/main/samples/AspNetCoreMcpPerSessionTools)。

## 身份驗證

MCP 端點就只是一個 ASP.NET Core 端點 — 請套用標準中介軟體：

```csharp
builder.Services
    .AddAuthentication("Bearer")
    .AddJwtBearer(/* configure */);
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapMcp().RequireAuthorization();   // protect the endpoint
```

對於 *MCP 伺服器* 作為資源伺服器的 OAuth 流程，請遵循 [MCP 授權規範](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)。[`ProtectedMcpServer` 範例](https://github.com/modelcontextprotocol/csharp-sdk/tree/main/samples/ProtectedMcpServer) 顯示了包含探索端點的運作設定。

對於機器對機器 (machine-to-machine)，使用 API 金鑰中介軟體即可：

```csharp
app.Use(async (ctx, next) =>
{
    if (ctx.Request.Headers["X-Api-Key"] != Configuration["ApiKey"])
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }
    await next();
});
```

## CORS (當用戶端位於瀏覽器中時)

```csharp
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("https://my-host.example.com")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));
// ...
app.UseCors();
app.MapMcp();
```

## 健康檢查與可觀測性

加入標準的 ASP.NET Core 探查；MCP 端點不應作為存活檢查 (liveness check)。

```csharp
builder.Services.AddHealthChecks();
// ...
app.MapHealthChecks("/healthz");
```

SDK 會發出 OpenTelemetry 追蹤（每個工具呼叫一個 `Activity`）和計量。如果使用者有 OTel 管線，請將它們連接起來：

```csharp
builder.Services
    .AddOpenTelemetry()
    .WithTracing(t => t.AddSource("ModelContextProtocol").AddOtlpExporter())
    .WithMetrics(m => m.AddMeter("ModelContextProtocol").AddOtlpExporter());
```

## 部署說明

- **正常進行容器化。** 無需特殊的 MCP 專用 Dockerfile — 它就只是一個 ASP.NET Core 應用程式。
- **位於反向代理後方** (nginx, Azure Front Door, AWS ALB) 時，請確保針對 MCP 路徑**停用** SSE 緩衝。nginx：`proxy_buffering off;`。若未停用，串流回應會被批次處理成一個緩慢的區塊。
- **逾時。** 用戶端可能會長時間維持 SSE 連線開啟。對於有狀態部署，請將代理閒置逾時設定得高一些（例如 5 分鐘以上）；對於無狀態則較不關鍵。
- **Azure Container Apps / App Service** 開箱即用；兩者都支援長效型 HTTP 回應。

## 啟用舊版 SSE (僅限相容性)

```csharp
builder.Services
    .AddMcpServer()
    .WithHttpTransport(options =>
    {
        options.EnableLegacySse = true;
#pragma warning disable MCP9004
        options.Stateless = false; // SSE 需要有狀態模式
#pragma warning restore MCP9004
    })
    .WithToolsFromAssembly();
```

僅在使用者有記錄顯示其用戶端尚未遷移時才這樣做。新的部署不應啟用它。
