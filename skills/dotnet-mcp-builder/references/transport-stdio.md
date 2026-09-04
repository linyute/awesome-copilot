# STDIO 傳輸

當伺服器作為用戶端（Claude Desktop、VS Code、MCP Inspector、自訂 CLI）的子處理序執行時，STDIO 是正確的選擇。用戶端啟動你的可執行檔；你從 stdin 讀取 JSON-RPC 框架並將它們寫入 stdout。

## 何時選擇 STDIO

- 本地優先的伺服器（檔案系統存取、開發工具、CLI 整合）。
- 作為單一可執行檔或可透過 `dnx` 執行的 NuGet 套件進行發佈。
- 你希望擁有最簡單的部署方案（無網路，無驗證）。
- 你需要伺服器至用戶端的功能（elicitation、通知、已棄用的 sampling/roots）— STDIO 一律支援它們，無需擔心 `Stateless` 旗標。

如果使用者想要遠端/多租戶伺服器，請改用 [HTTP Streamable](./transport-http.md)。

## 最小伺服器

```bash
dotnet new console -n MyStdioServer -f net10.0
cd MyStdioServer
dotnet add package ModelContextProtocol --version 2.2.0
dotnet add package Microsoft.Extensions.Hosting --version 10.0.11
```

```csharp
// Program.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using System.ComponentModel;

var builder = Host.CreateApplicationBuilder(args);

// 重要：stdout 是 JSON-RPC 通道。將所有記錄傳送至 stderr。
builder.Logging.AddConsole(o => o.LogToStandardErrorThreshold = LogLevel.Trace);

builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

await builder.Build().RunAsync();

[McpServerToolType]
public static class EchoTool
{
    [McpServerTool, Description("將訊息回顯給用戶端。")]
    public static string Echo(string message) => $"hello {message}";
}
```

## stdout/stderr 陷阱

STDIO 伺服器中最常見的錯誤是寫入 stdout 的內容不是 JSON-RPC 框架。用戶端隨後會因剖析錯誤而中斷連線。

**會無訊息中斷 STDIO 的情況：**
- 程式碼中任何位置的 `Console.WriteLine(...)`。
- 設定為預設主控台接收器（寫入 stdout）的記錄器。
- 若附加了預設追蹤接聽程式時的 `Trace.WriteLine(...)`。
- 在啟動時列印橫幅的協力廠商函式庫。

**防禦性檢查清單：**
1. 在執行其他任何操作**之前**將記錄設定為 stderr（上述程式碼片段已實作）。
2. 不要從工具或啟動程式碼中呼叫 `Console.Write*`。使用插入至工具類別的 `ILogger`。
3. 如果相依項目干擾過多，請透過 `ILogger` 重新導向其記錄或在啟動時將其隱藏。

## 伺服器識別資訊

SDK 在交涉期間傳送 `serverInfo`（名稱 + 版本）（2026-07-28 `server/discover` 交換，或針對舊版用戶端的舊版 `initialize` 回應 — SDK 會自動處理兩者）。預設情況下，它會從你的組件衍生這些資訊。若要覆寫：

```csharp
builder.Services
    .AddMcpServer(options =>
    {
        options.ServerInfo = new()
        {
            Name = "my-stdio-server",
            Version = "1.0.0",
            Title = "My STDIO MCP Server"   // 選用的人類可讀名稱
        };
    })
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
```

## 從用戶端讀取引數/環境變數

用戶端（例如 Claude Desktop 組態）通常會帶有引數和環境變數啟動你的伺服器。像任何其他 .NET 應用程式一樣讀取它們：

```csharp
string apiKey = Environment.GetEnvironmentVariable("MY_API_KEY")
    ?? throw new InvalidOperationException("MY_API_KEY 未設定");

string configPath = args.ElementAtOrDefault(0)
    ?? Path.Combine(Environment.CurrentDirectory, "config.json");
```

在 README 中記錄預期的變數/引數，以便使用者知道要在其用戶端組態中填入什麼內容。

## 連接至 Claude Desktop

在 `claude_desktop_config.json` 中：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "dotnet",
      "args": ["run", "--project", "C:/path/to/MyStdioServer"],
      "env": {
        "MY_API_KEY": "..."
      }
    }
  }
}
```

對於已發佈的獨立可執行檔，請將 `command`/`args` 替換為可執行檔路徑。對於使用 `dnx` 的 NuGet 發佈伺服器：

```json
"command": "dnx",
"args": ["MyMcpServer", "--version", "1.2.3"]
```

## 連接至 VS Code (GitHub Copilot Chat)

在 `.vscode/mcp.json` 中：

```json
{
  "servers": {
    "my-server": {
      "type": "stdio",
      "command": "dotnet",
      "args": ["run", "--project", "${workspaceFolder}/src/MyMcpServer"]
    }
  }
}
```

## 本地偵錯

最簡潔的工作流程是 [MCP Inspector](https://github.com/modelcontextprotocol/inspector)：

```bash
npx @modelcontextprotocol/inspector dotnet run --project ./MyStdioServer
```

Inspector 會啟動你的伺服器，開啟 UI，並允許你以互動方式呼叫工具 / 列出資源 / 觸發 elicitation。更多資訊請參閱 [`testing.md`](./testing.md)。

## 平順關機 (Graceful shutdown)

`builder.Build().RunAsync()` 已處理 SIGINT/SIGTERM。如果你有背景工作需要清除排清，請使用 `IHostApplicationLifetime`：

```csharp
var host = builder.Build();
var lifetime = host.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    // 排清、關閉控制代碼等 — 保持快速（<5秒）以免用戶端停止回應。
});
await host.RunAsync();
```
