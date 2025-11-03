---
description: '使用 C# SDK 建構模型上下文協定 (MCP) 伺服器的說明'
applyTo: '**/*.cs, **/*.csproj'
---

# C# MCP 伺服器開發

## 說明

- 大多數專案使用 **ModelContextProtocol** NuGet 套件（預發行版）：`dotnet add package ModelContextProtocol --prerelease`
- HTTP 型 MCP 伺服器使用 **ModelContextProtocol.AspNetCore**
- 最小依賴項（僅限用戶端或低階伺服器 API）使用 **ModelContextProtocol.Core**
- 始終使用 `LogToStandardErrorThreshold = LogLevel.Trace` 將日誌記錄設定為 stderr，以避免干擾 stdio 傳輸
- 在包含 MCP 工具的類別上使用 `[McpServerToolType]` 屬性
- 在方法上使用 `[McpServerTool]` 屬性將其公開為工具
- 使用 `System.ComponentModel` 中的 `[Description]` 屬性來文件化工具和參數
- 支援工具方法中的依賴注入 - 將 `McpServer`、`HttpClient` 或其他服務作為參數注入
- 使用 `McpServer.AsSamplingChatClient()` 從工具內部向用戶端發出取樣請求
- 在類別上使用 `[McpServerPromptType]` 和在方法上使用 `[McpServerPrompt]` 來公開提示
- 對於 stdio 傳輸，在建構伺服器時使用 `WithStdioServerTransport()`
- 使用 `WithToolsFromAssembly()` 自動發現並註冊當前組件中的所有工具
- 工具方法可以是同步或非同步（返回 `Task` 或 `Task<T>`）
- 始終為工具和參數包含全面的描述，以幫助 LLM 理解其目的
- 在非同步工具中使用 `CancellationToken` 參數以實現適當的取消支援
- 返回簡單類型（字串、整數等）或可以序列化為 JSON 的複雜物件
- 為了進行細粒度控制，將 `McpServerOptions` 與自訂處理程式（如 `ListToolsHandler` 和 `CallToolHandler`）一起使用
- 對於協定級別錯誤，使用 `McpProtocolException` 和適當的 `McpErrorCode` 值
- 使用相同 SDK 或任何符合 MCP 的用戶端中的 `McpClient` 測試 MCP 伺服器
- 使用 Microsoft.Extensions.Hosting 組織專案以實現適當的 DI 和生命週期管理

## 最佳實踐

- 保持工具方法專注且單一用途
- 使用有意義的工具名稱，清楚地表明其功能
- 提供詳細的描述，解釋工具的作用、預期的參數以及它返回的內容
- 驗證輸入參數並針對無效輸入拋出 `McpProtocolException` 和 `McpErrorCode.InvalidParams`
- 使用結構化日誌記錄來幫助調試，而不會污染 stdout
- 使用 `[McpServerToolType]` 將相關工具組織到邏輯類別中
- 在公開存取外部資源的工具時考慮安全隱患
- 使用內建的 DI 容器來管理服務生命週期和依賴項
- 實作適當的錯誤處理並返回有意義的錯誤訊息
- 在與 LLM 整合之前單獨測試工具

## 常見模式

### 基本伺服器設定
```csharp
var builder = Host.CreateApplicationBuilder(args);
builder.Logging.AddConsole(options => 
    options.LogToStandardErrorThreshold = LogLevel.Trace);
builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
await builder.Build().RunAsync();
```

### 簡單工具
```csharp
[McpServerToolType]
public static class MyTools
{
    [McpServerTool, Description("Description of what the tool does")]
    public static string ToolName(
        [Description("Parameter description")] string param) => 
        $"Result: {param}";
}
```

### 帶有依賴注入的工具
```csharp
[McpServerTool, Description("Fetches data from a URL")]
public static async Task<string> FetchData(
    HttpClient httpClient,
    [Description("The URL to fetch")] string url,
    CancellationToken cancellationToken) =>
    await httpClient.GetStringAsync(url, cancellationToken);
```

### 帶有取樣的工具
```csharp
[McpServerTool, Description("Analyzes content using the client's LLM")]
public static async Task<string> Analyze(
    McpServer server,
    [Description("Content to analyze")] string content,
    CancellationToken cancellationToken)
{
    var messages = new ChatMessage[]
    {
        new(ChatRole.User, $"Analyze this: {content}")
    };
    return await server.AsSamplingChatClient()
        .GetResponseAsync(messages, cancellationToken: cancellationToken);
}
```
