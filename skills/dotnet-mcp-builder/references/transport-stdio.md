# STDIO 傳輸

當伺服器作為用戶端（Claude Desktop、VS Code、MCP Inspector、自訂 CLI）的子處理程序執行時，STDIO 是正確的選擇。用戶端會啟動您的可執行檔；您從 stdin 讀取 JSON-RPC 框架並將其寫入 stdout。

## 何時選擇 STDIO

- 本地優先的伺服器（檔案系統存取、開發工具、CLI 整合）。
- 以單一可執行檔或可透過 `dnx` 執行的 NuGet 套件形式發布。
- 您想要最簡單的部署方案（無網路、無驗證）。
- 您需要伺服器對用戶端的特性（取樣、啟發、根目錄）——STDIO 始終支援這些特性，無需擔心 `Stateless` 旗標。

如果使用者需要遠端/多租戶伺服器，請改用 [HTTP 可串流化](./transport-http.md)。

## 最小化伺服器

```bash
dotnet new console -n MyStdioServer -f net10.0
cd MyStdioServer
dotnet add package ModelContextProtocol
dotnet add package Microsoft.Extensions.Hosting
```

```csharp
// Program.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using System.ComponentModel;

var builder = Host.CreateApplicationBuilder(args);

// 重要：stdout 是 JSON-RPC 頻道。將所有記錄傳送到 stderr。
builder.Logging.AddConsole(o => o.LogToStandardErrorThreshold = LogLevel.Trace);

builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

await builder.Build().RunAsync();

[McpServerToolType]
public static class EchoTool
{
    [McpServerTool, Description("將訊息回傳給用戶端。")]
    public static string Echo(string message) => $"hello {message}";
}
```

## stdout/stderr 陷阱

STDIO 伺服器中最常見的錯誤是有東西將非 JSON-RPC 框架的內容寫入 stdout。用戶端隨後會因為剖析錯誤而中斷連線。

**會悄悄破壞 STDIO 的事物：**
- 程式碼中任何位置的 `Console.WriteLine(...)`。
- 設定了預設主控台接收器（寫入 stdout）的記錄器。
- 如果附加了預設追蹤接聽程式，則為 `Trace.WriteLine(...)`。
- 在啟動時列印橫幅的第三方函式庫。

**防禦性檢查清單：**
1. 在執行任何其他操作**之前**，先將記錄設定為 stderr（上述程式碼片段已完成此操作）。
2. 不要從工具或啟動程式碼中呼叫 `Console.Write*`。使用插入工具類別的 `ILogger`。
3. 如果相依項目產生的記錄過多，請透過 `ILogger` 重新導向其記錄，或在啟動時隱藏它們。

## 伺服器身分識別

SDK 會在 `initialize` 回應中傳送 `serverInfo`（名稱 + 版本）。預設情況下，它會從您的組件中衍生這些資訊。若要覆寫：

```csharp
builder.Services
    .AddMcpServer(options =>
    {
        options.ServerInfo = new()
        {
            Name = "my-stdio-server",
            Version = "1.0.0",
            Title = "My STDIO MCP Server"   // 選填的易讀名稱
        };
    })
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
```

## 從用戶端讀取引數/環境變數

用戶端（例如 Claude Desktop 設定）通常會使用引數 and 環境變數啟動您的伺服器。像讀取任何其他 .NET 應用程式一樣讀取它們：

```csharp
string apiKey = Environment.GetEnvironmentVariable("MY_API_KEY")
    ?? throw new InvalidOperationException("未設定 MY_API_KEY");

string configPath = args.ElementAtOrDefault(0)
    ?? Path.Combine(Environment.CurrentDirectory, "config.json");
```

在 README 中記錄預期的變數/引數，以便使用者知道要在其用戶端設定中加入什麼。

## 連接到 Claude Desktop

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

對於已發布的獨立可執行檔，請將 `command`/`args` 替換為可執行檔路徑。對於使用 `dnx` 的 NuGet 分散式伺服器：

```json
"command": "dnx",
"args": ["MyMcpServer", "--version", "1.2.3"]
```

## 連接到 VS Code (GitHub Copilot Chat)

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

## 本地端偵錯

最乾淨的工作流程是使用 [MCP Inspector](https://github.com/modelcontextprotocol/inspector)：

```bash
npx @modelcontextprotocol/inspector dotnet run --project ./MyStdioServer
```

Inspector 會啟動您的伺服器，開啟一個 UI，並讓您以互動方式呼叫工具 / 列出資源 / 觸發啟發 (elicitations)。更多詳細資訊請參閱 [`testing.md`](./testing.md)。

## 正常關機

`builder.Build().RunAsync()` 已經處理了 SIGINT/SIGTERM。如果您有需要排清的背景工作，請使用 `IHostApplicationLifetime`：

```csharp
var host = builder.Build();
var lifetime = host.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    // 排清、關閉控制代碼等 —— 請保持在 5 秒內，以免用戶端停止回應。
});
await host.RunAsync();
```
