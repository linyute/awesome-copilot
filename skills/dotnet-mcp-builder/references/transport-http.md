# Streamable HTTP 傳輸 (ASP.NET Core)

Streamable HTTP 是現代的遠端傳輸方式。單一端點接受透過 HTTP POST 傳送的 JSON-RPC，並在伺服器有多個訊息要傳送時，（選用地）將回應作為 Server-Sent Events (SSE) 串流回傳。

> **僅支援 SSE 已被棄用。** 舊版的「HTTP+SSE」傳輸（獨立的 POST 端點 + GET SSE 端點）已從新的用戶端中移除。請使用 Streamable HTTP。僅在必須支援已知的舊版用戶端時啟用舊版 SSE (`EnableLegacySse = true`)，並記錄原因。

## 何時選擇 HTTP

- 多租戶或遠端代管的伺服器。
- 前端透過 OAuth / API 閘道進行驗證。
- 水平擴展的部署（設定 `Stateless = true`）。
- 容器、Azure Container Apps、Kubernetes 等。

對於本機單一使用者情境，[STDIO](./transport-stdio.md) 更為簡單。

## 最小伺服器

```bash
dotnet new web -n MyHttpServer -f net10.0
cd MyHttpServer
dotnet add package ModelContextProtocol.AspNetCore --version 2.2.0
```

```csharp
// Program.cs
using ModelContextProtocol.Server;
using System.ComponentModel;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddMcpServer()
    // 自 2.x 起，Stateless 預設為 true：每個請求都是獨立的，
    // 無 Mcp-Session-Id 追蹤，無 SSE 工作階段端點 — 已為
    // 水平擴展做好準備，無需黏性工作階段 (sticky sessions)。
    .WithHttpTransport()
    .WithToolsFromAssembly();

var app = builder.Build();

app.MapMcp();              // 在 "/" 掛載 MCP 端點
// app.MapMcp("/mcp");     // 或在路徑前綴下掛載

app.Run("http://localhost:3001");

[McpServerToolType]
public static class EchoTool
{
    [McpServerTool, Description("將訊息回顯給用戶端。")]
    public static string Echo(string message) => $"hello {message}";
}
```

## 無狀態 vs. 具狀態 — 最重要的決策

> **v2 重大變更：** `HttpServerTransportOptions.Stateless` 現預設為 **`true`**（在 1.x 上預設為 `false`）。升級至 2.x 而未修改選項的伺服器會停止建立工作階段並停止公開 SSE 端點。請明確設定 `Stateless = false` 以還原舊版行為。

| 模式                   | `options.Stateless`      | 行為                                                                                                                                                                          | 何時使用                                                                                                                                    |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **無狀態 (Stateless)** | `true` (自 2.x 起為預設) | 無 `Mcp-Session-Id`。每個 POST 都是獨立的。服務目前的 (2026-07-28) 修訂版。                                                                                                   | 水平擴展、簡單工具伺服器、目前通訊協定用戶端。                                                                                              |
| **具狀態 (Stateful)**  | `false`                  | 伺服器指派並追蹤 `Mcp-Session-Id`。長生命週期工作階段。**降級相容模式：** 伺服器拒絕 2026-07-28 修訂版，以便雙路徑用戶端後備至支援 initialize 的修訂版（2025-11-25 或更早）。 | 舊版 `ElicitAsync`/sampling/roots 路徑、推送記錄通知、尚未採用 2026-07-28 的用戶端。需要在負載平衡器設定工作階段同質性 (session affinity)。 |

**原則：** 在目前的 (2026-07-28) 通訊協定上沒有 HTTP 工作階段 —「在工具執行途中向使用者提問」使用多來回模式（擲出 `InputRequiredException`，處理重試的呼叫；請參閱 [`elicitation.md`](./elicitation.md)），該模式在兩種工作階段模式和兩種修訂版中均可運作。僅針對舊版路徑設定 `Stateless = false` — `ElicitAsync`、已棄用的 `SampleAsync`/`RequestRootsAsync` 或推送記錄/通知訊息 — 並且要知道這會將 HTTP 用戶端鎖定在支援 initialize 的舊版修訂版。在無狀態預設下，這些舊版呼叫在執行階段會因為沒有可傳遞的通道而失敗。

## 端點結構

`MapMcp(pattern = "")` 在 `pattern` 建立路由群組並對應：
- **POST** — 接受 JSON-RPC 請求/回應/通知。依據 `Accept` 標頭以及是否需要傳回多個訊息，回傳 JSON 回應或 SSE 串流。
- **GET** — 由具狀態工作階段用於伺服器至用戶端的 SSE 通道。
- **DELETE** — 終止具狀態工作階段。

預設模式為根目錄 (`/`)。若要將 MCP 置於 `/mcp/v1` 下：

```csharp
app.MapMcp("/mcp/v1");
```

在用戶端相應比對 (`Endpoint = new Uri("https://host/mcp/v1")`)。

## 版本交涉與路由 (2026-07-28)

- **優先探索：** v2 用戶端探測 `server/discover` 方法以了解功能，而非使用舊版 `initialize` 信號交換。SDK 會同時回應兩者，並自動針對舊版端點（2025-11-25 及更早版本）進行後備 — 你無需為此撰寫任何程式碼，但在流量擷取中看到 `server/discover` 請勿感到意外。
- **可路由標頭：** 每個 Streamable HTTP POST 都帶有 `Mcp-Method` 標頭（例如 `tools/call`），具名呼叫（`tools/call`、`prompts/get`、`resources/read`）額外帶有 `Mcp-Name`（例如工具名稱），以便閘道和速率限制器可以在不剖析 JSON 內文的情況下按工具進行路由/節流。請勿在閘道全域要求 `Mcp-Name` — 探索和清單請求合理地略過它。

## 個別工作階段組態 (HttpContext 存取)

當你需要按 HTTP 請求改變伺服器行為（驗證、租戶、標頭）時，請使用 `ConfigureSessionOptions` 回呼：

```csharp
builder.Services
    .AddMcpServer()
    .WithHttpTransport(options =>
    {
        options.ConfigureSessionOptions = async (httpContext, mcpOptions, ct) =>
        {
            var tenantId = httpContext.Request.Headers["X-Tenant"].ToString();
            mcpOptions.ServerInstructions = $"Tenant: {tenantId}";
            // 按工作階段修改任何 McpServerOptions 欄位
        };
    });
```

在工具內部，若已註冊 `AddHttpContextAccessor()`，你也可以插入 `IHttpContextAccessor`。請參閱 [`AspNetCoreMcpPerSessionTools` 範例](https://github.com/modelcontextprotocol/csharp-sdk/tree/main/samples/AspNetCoreMcpPerSessionTools)。

## 驗證

MCP 端點只是一個 ASP.NET Core 端點 — 套用標準中介軟體即可：

```csharp
builder.Services
    .AddAuthentication("Bearer")
    .AddJwtBearer(/* 設定 */);
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapMcp().RequireAuthorization();   // 保護端點
```

對於 *MCP 伺服器*本身為資源伺服器的 OAuth 流程，請遵循 [MCP 授權規格](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)。[`ProtectedMcpServer` 範例](https://github.com/modelcontextprotocol/csharp-sdk/tree/main/samples/ProtectedMcpServer) 展示了包含探索端點的運作中設定。

對於機器對機器通訊，API 金鑰中介軟體即可滿足需求：

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

## CORS（當用戶端位於瀏覽器內時）

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

## 健康檢查與可檢測性

新增標準 ASP.NET Core 探針；MCP 端點不應用作存活檢查。

```csharp
builder.Services.AddHealthChecks();
// ...
app.MapHealthChecks("/healthz");
```

SDK 發出 OpenTelemetry 追蹤（每個工具呼叫一個 `Activity`）和計量。若使用者有 OTel 管道可進行連接：

```csharp
builder.Services
    .AddOpenTelemetry()
    .WithTracing(t => t.AddSource("ModelContextProtocol").AddOtlpExporter())
    .WithMetrics(m => m.AddMeter("ModelContextProtocol").AddOtlpExporter());
```

## 部署備註

- **正常容器化。** 無需特殊的 MCP 專屬 Dockerfile — 它只是一個 ASP.NET Core 應用程式。
- **在反向代理背後**（nginx、Azure Front Door、AWS ALB），確保針對 MCP 路徑**停用** SSE 緩衝。nginx: `proxy_buffering off;`。若未停用，串流回應會被批次處理成單一緩慢的 Blob。
- **逾時。** 用戶端可能會長時間保持 SSE 連線開啟。對於具狀態部署，請將代理閒置逾時設定得較高（例如 5 分鐘以上）；對於無狀態部署則不太關鍵。
- **Azure Container Apps / App Service** 開箱即可使用；兩者皆支援長生命週期 HTTP 回應。

## 啟用舊版 SSE（僅供相容性使用）

```csharp
builder.Services
    .AddMcpServer()
    .WithHttpTransport(options =>
    {
        options.EnableLegacySse = true;
#pragma warning disable MCP9004
        options.Stateless = false; // SSE 需要具狀態模式
#pragma warning restore MCP9004
    })
    .WithToolsFromAssembly();
```

僅在使用者擁有未移轉的記錄用戶端時才執行此操作。新部署不應啟用它。
