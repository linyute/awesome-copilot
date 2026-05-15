# 工具

工具是 LLM 可以呼叫的函式。在 C# SDK 中，它們是標記有 `[McpServerToolType]` 的類別中的純方法，且每個方法都標記有 `[McpServerTool]`。SDK 會從方法簽名和 `[Description]` 屬性產生 JSON Schema。

## 工具剖析

```csharp
using System.ComponentModel;
using ModelContextProtocol.Server;

[McpServerToolType]
public class WeatherTools
{
    // 靜態或執行個體 — 兩者皆可。執行個體方法會為包含的類別取得 DI。
    [McpServerTool, Description("傳回城市的目前天氣。")]
    public static string GetWeather(
        [Description("城市名稱，例如 'Brussels'")] string city,
        [Description("單位：'celsius' 或 'fahrenheit'")] string units = "celsius")
    {
        return $"{city}: 18°{units[0]}";
    }
}
```

註冊它（擇一）：

```csharp
.WithToolsFromAssembly()        // 探索呼叫組件中所有的 [McpServerToolType]
.WithTools<WeatherTools>()      // 明確的單一類別
```

顯示給 LLM 的工具名稱是 `GetWeather`（PascalCase 轉換為 snake_case **不是**自動的 — 除非您明確設定 `Name`，否則您看到的即是所得）。

## 屬性選項

```csharp
[McpServerTool(
    Name = "get_weather",                 // 覆蓋工具名稱
    Title = "取得目前天氣",                 // 可讀的顯示名稱
    Destructive = false,                  // 提示：工具會不可逆地修改狀態
    Idempotent = true,                    // 提示：相同的引數 ⇒ 相同的結果
    OpenWorld = true,                     // 提示：與外部系統互動
    ReadOnly = true                       // 提示：不會變更任何狀態
)]
[Description("傳回城市的目前天氣。")]
public static string GetWeather(...) { ... }
```

行為提示（`Destructive`、`Idempotent`、`OpenWorld`、`ReadOnly`）是建議性的 — 用戶端使用它們來決定自動核准等事項。它們不會改變執行階段行為。

## 非同步、取消、DI

```csharp
[McpServerTool, Description("擷取存放庫的最新提交。")]
public async Task<IEnumerable<Commit>> GetCommits(
    string owner,
    string repo,
    IGitHubClient github,                         // 從 DI 注入
    CancellationToken cancellationToken)          // 由 SDK 注入
{
    return await github.GetCommitsAsync(owner, repo, cancellationToken);
}
```

SDK 識別並特別處理這些參數類型 — 它們不會出現在工具結構描述中：
- `IMcpServer` / `McpServer` — 目前的伺服器（用於 `ElicitAsync`、`SampleAsync`、`RequestRootsAsync`、傳送通知）。
- `CancellationToken` — 從 JSON-RPC 要求傳播。
- `RequestContext<CallToolRequestParams>` — 如果您需要，則是完整的要求內容。
- `IServiceProvider` — 要求範圍的服務提供者。
- 任何可從 DI 解析且 SDK 可識別為非原始裝載的內容。

其餘所有內容都將被視為 JSON-RPC 引數並進入結構描述。

## 傳回型別

SDK 會將您傳回的任何內容序列化為適當的內容區塊。實務指南：

| 傳回型別 | LLM 看到的內容 |
|---|---|
| `string` | 單一文字內容區塊。 |
| `int`、`bool`、`double` 等 | 字串化為文字內容區塊。 |
| 任何 DTO (record/class) | 序列化為文字內容區塊中的 JSON，以及針對支援它的用戶端的結構化內容。 |
| DTO 的 `IEnumerable<T>` | JSON 陣列。 |
| `ContentBlock` / `ImageContentBlock` / `AudioContentBlock` / `EmbeddedResourceBlock` | 該單一區塊，保持不變。 |
| `IEnumerable<ContentBlock>` | 依序的多個區塊。 |
| `CallToolResult` | 完全控制 — 設定 `Content`、`StructuredContent`、`IsError`。 |

### 傳回 LLM 可以操作的結構化資料

```csharp
public record Forecast(string City, double TempC, string Conditions);

[McpServerTool, Description("傳回 3 天氣象預報。")]
public static Forecast[] GetForecast(string city) =>
    new[]
    {
        new Forecast(city, 18.0, "sunny"),
        new Forecast(city, 16.5, "cloudy"),
        new Forecast(city, 14.2, "rain"),
    };
```

SDK 會將陣列發送為 JSON 文字區塊（針對舊版用戶端）和 `structuredContent`（針對新版用戶端），並從 `Forecast` 推斷輸出結構描述。

### 傳回影像 / 音訊

```csharp
[McpServerTool, Description("產生圖表並將其作為 PNG 傳回。")]
public static ImageContentBlock RenderChart(string title)
{
    byte[] png = Renderer.Render(title);
    return ImageContentBlock.FromBytes(png, "image/png");
}

[McpServerTool, Description("合成語音。")]
public static AudioContentBlock Speak(string text)
{
    byte[] wav = Tts.Synthesize(text);
    return AudioContentBlock.FromBytes(wav, "audio/wav");
}
```

### 混合內容區塊

```csharp
[McpServerTool, Description("傳回圖表和說明文字。")]
public static IEnumerable<ContentBlock> RenderAnnotatedChart(string title)
{
    byte[] png = Renderer.Render(title);
    return new ContentBlock[]
    {
        new TextContentBlock { Text = $"圖表標題：{title}" },
        ImageContentBlock.FromBytes(png, "image/png"),
        new TextContentBlock { Text = "產生於 " + DateTime.UtcNow.ToString("u") }
    };
}
```

### 傳回內嵌資源

當工具結果*本身*是使用者可能想要重複使用的文件時很有用：

```csharp
[McpServerTool, Description("查閱合約。")]
public static EmbeddedResourceBlock GetContract(string id)
{
    return new EmbeddedResourceBlock
    {
        Resource = new TextResourceContents
        {
            Uri = $"contracts://{id}",
            MimeType = "text/markdown",
            Text = LoadContract(id)
        }
    };
}
```

## 錯誤

工具可以產生的錯誤有兩種形式：

### 工具層級錯誤（LLM 可以讀取並從中復原）

擲回任何例外狀況 — SDK 會攔截它並傳回一個 `CallToolResult`，其中 `IsError = true` 且例外狀況訊息位於文字區塊中：

```csharp
[McpServerTool, Description("將 a 除以 b。")]
public static double Divide(double a, double b)
{
    if (b == 0)
        throw new ArgumentException("除數不能為零。");
    return a / b;
}
```

您也可以明確建立結果：

```csharp
[McpServerTool, Description("…")]
public static CallToolResult Foo(...)
{
    return new CallToolResult
    {
        IsError = true,
        Content = [new TextContentBlock { Text = "給 LLM 的詳細錯誤說明。" }]
    };
}
```

### 協定層級錯誤（在 LLM 看到結果之前呼叫就被拒絕）

對於不正確的引數等情況，請使用 `McpException`（或具有明確錯誤代碼的 `McpProtocolException`）：

```csharp
[McpServerTool, Description("…")]
public static string Process(string input)
{
    if (string.IsNullOrWhiteSpace(input))
        throw new McpProtocolException("遺漏必要的輸入", McpErrorCode.InvalidParams);
    return $"已處理：{input}";
}
```

**啟發式方法：** 如果 LLM 應該嘗試使用不同的引數*再試一次*，請擲回一般例外狀況，以便它取得工具錯誤。如果呼叫格式錯誤且 LLM 無法修復，請擲回 `McpProtocolException`。

## 通知用戶端工具清單變更

如果您的工具在執行階段動態增減（例如：載入外掛程式、使用者登入），請通知用戶端：

```csharp
await server.SendNotificationAsync(
    NotificationMethods.ToolListChangedNotification,
    new ToolListChangedNotificationParams(),
    cancellationToken);
```

需要具備狀態的傳輸方式（STDIO 或具狀態的 HTTP）。

## 常見陷阱

- **忘記在類別上標記 `[McpServerToolType]`。** 僅標記方法層級的 `[McpServerTool]` 不會被 `WithToolsFromAssembly` 探索到。
- **描述含糊。** `[Description("取得資料")]` 會讓 LLM 瞎猜。請花一個句子的時間描述工具的作用、何時呼叫它以及它傳回什麼。
- **裝載過大。** 傳回數 MB JSON 的工具會消耗模型的內容。請修剪或分頁。對於二進位大型物件 (binary blobs)，請傳回 `EmbeddedResourceBlock`，以便主機決定如何呈現它。
- **隱藏錯誤。** 傳回 `"failed"` 字串在 SDK 看來像是成功。請擲回例外狀況或設定 `IsError = true`。
