# 工具 (Tools)

工具是 LLM 可以呼叫的函式。在 C# SDK 中，它們是標記為 `[McpServerToolType]` 的類別上的普通方法，每個方法標記為 `[McpServerTool]`。SDK 會從方法簽章和 `[Description]` 屬性產生 JSON Schema。

## 工具結構剖析

```csharp
using System.ComponentModel;
using ModelContextProtocol.Server;

[McpServerToolType]
public class WeatherTools
{
    // 靜態或執行個體 — 兩者皆可。執行個體方法可取得包含類別的 DI。
    [McpServerTool, Description("回傳城市的目前天氣。")]
    public static string GetWeather(
        [Description("城市名稱，例如 'Brussels'")] string city,
        [Description("單位：'celsius' 或 'fahrenheit'")] string units = "celsius")
    {
        return $"{city}: 18°{units[0]}";
    }
}
```

註冊工具（二選一）：

```csharp
.WithToolsFromAssembly()        // 探索呼叫組件中的所有 [McpServerToolType]
.WithTools<WeatherTools>()      // 明確的單一類別
```

向 LLM 顯示的工具名稱為 `GetWeather`（PascalCase **不會**自動轉換為 snake_case — 除非明確設定 `Name`，否則所見即所得）。

## 屬性選項

```csharp
[McpServerTool(
    Name = "get_weather",                 // 覆寫工具名稱
    Title = "Get current weather",        // 人類可讀的顯示名稱
    Destructive = false,                  // 提示：工具會不可逆地修改狀態
    Idempotent = true,                    // 提示：相同引數 ⇒ 相同結果
    OpenWorld = true,                     // 提示：與外部系統互動
    ReadOnly = true                       // 提示：不變更任何狀態
)]
[Description("回傳城市的目前天氣。")]
public static string GetWeather(...) { ... }
```

行為提示（`Destructive`、`Idempotent`、`OpenWorld`、`ReadOnly`）僅供參考 — 用戶端使用它們來決定自動核准等事項。它們不會改變執行階段行為。

## 非同步、取消、DI

```csharp
[McpServerTool, Description("擷取存放庫的最新認可。")]
public async Task<IEnumerable<Commit>> GetCommits(
    string owner,
    string repo,
    IGitHubClient github,                         // 從 DI 插入
    CancellationToken cancellationToken)          // 由 SDK 插入
{
    return await github.GetCommitsAsync(owner, repo, cancellationToken);
}
```

SDK 識別並特殊處理這些參數型別 — 它們不會出現在工具結構描述中：
- `IMcpServer` / `McpServer` — 目前的伺服器（用於 `ElicitAsync`、`SampleAsync`、`RequestRootsAsync`、傳送通知）。
- `CancellationToken` — 從 JSON-RPC 請求傳播。
- `RequestContext<CallToolRequestParams>` — 完整請求情境（若需要）。
- `IServiceProvider` — 請求範圍的服務提供者。
- 任何可從 DI 解析且 SDK 可識別為非原始裝載的項目。

其他所有內容都被視為 JSON-RPC 引數並進入結構描述中。

## 回傳型別

SDK 會將你回傳的任何內容序列化為適當的內容區塊。實用指引：

| 回傳型別 | LLM 看見的內容 |
|---|---|
| `string` | 單一文字內容區塊。 |
| `int`、`bool`、`double` 等 | 字串化為文字內容區塊。 |
| 任何 DTO (record/class) | 序列化為文字內容區塊中的 JSON，加上適用於支援它的用戶端的結構化內容。 |
| DTO 的 `IEnumerable<T>` | JSON 陣列。 |
| `ContentBlock` / `ImageContentBlock` / `AudioContentBlock` / `EmbeddedResourceBlock` | 該單一區塊，未經修改。 |
| `IEnumerable<ContentBlock>` | 按順序排列的多個區塊。 |
| `CallToolResult` | 完全控制 — 設定 `Content`、`StructuredContent`、`IsError`。 |

### 回傳 LLM 可以處理的結構化資料

```csharp
public record Forecast(string City, double TempC, string Conditions);

[McpServerTool, Description("回傳 3 天天氣預報。")]
public static Forecast[] GetForecast(string city) =>
    new[]
    {
        new Forecast(city, 18.0, "sunny"),
        new Forecast(city, 16.5, "cloudy"),
        new Forecast(city, 14.2, "rain"),
    };
```

SDK 將陣列發出為 JSON 文字區塊（適用於較舊的用戶端）和 `structuredContent`（適用於較新的用戶端），並從 `Forecast` 推斷輸出結構描述。

> **v2 行為變更：** 非物件結果會以原始 `structuredContent` 數值發出 — 回傳 `72` 會產生 `"structuredContent": 72`，而 1.x 將其包裝為 `{ "result": 72 }`。讀取結構化輸出的用戶端應遵循宣傳的輸出結構描述。如果你手動撰寫 `Tool` 定義（而非使用屬性），請注意在 2.x 中還原序列化時 `inputSchema` 是**必要**的 — 空的 `{}` 即可。

### 回傳圖片 / 音訊

```csharp
[McpServerTool, Description("產生圖表並將其作為 PNG 回傳。")]
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
[McpServerTool, Description("回傳圖表和說明文字。")]
public static IEnumerable<ContentBlock> RenderAnnotatedChart(string title)
{
    byte[] png = Renderer.Render(title);
    return new ContentBlock[]
    {
        new TextContentBlock { Text = $"Chart for: {title}" },
        ImageContentBlock.FromBytes(png, "image/png"),
        new TextContentBlock { Text = "Generated at " + DateTime.UtcNow.ToString("u") }
    };
}
```

### 回傳內嵌資源

當工具結果*本身*是使用者可能想要重複使用的文件時很有用：

```csharp
[McpServerTool, Description("查詢合約。")]
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

## 錯誤處理

工具可以產生兩種類型的錯誤：

### 工具層級錯誤（LLM 可以讀取並從中復原）

擲出任何例外狀況 — SDK 會攔截它並回傳一個 `CallToolResult`，其中 `IsError = true`，例外狀況訊息位於文字區塊中：

```csharp
[McpServerTool, Description("計算 a 除以 b。")]
public static double Divide(double a, double b)
{
    if (b == 0)
        throw new ArgumentException("除數不可為零。");
    return a / b;
}
```

你也可以明確建構結果：

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

### 通訊協定層級錯誤（在 LLM 看到結果之前呼叫就被拒絕）

對於不正確的引數等情況，請使用 `McpException`（或帶有明確錯誤代碼的 `McpProtocolException`）：

```csharp
[McpServerTool, Description("…")]
public static string Process(string input)
{
    if (string.IsNullOrWhiteSpace(input))
        throw new McpProtocolException("缺少必要的輸入", McpErrorCode.InvalidParams);
    return $"已處理：{input}";
}
```

**啟發式原則：** 如果 LLM 應該使用不同的引數*重試*，請擲出常規例外狀況以便它取得工具錯誤。如果呼叫格式錯誤且 LLM 無法修復，請擲出 `McpProtocolException`。

## 向用戶端通知工具清單變更

如果你的工具在執行階段動態增減（例如載入外掛程式、使用者登入），請通知用戶端：

```csharp
await server.SendNotificationAsync(
    NotificationMethods.ToolListChangedNotification,
    new ToolListChangedNotificationParams(),
    cancellationToken);
```

需要具狀態傳輸（STDIO 或具狀態 HTTP）。

## 常見陷阱

- **忘記類別上的 `[McpServerToolType]`。** 單獨的方法層級 `[McpServerTool]` 不會被 `WithToolsFromAssembly` 探索到。
- **模糊的描述。** `[Description("取得資料")]` 會讓 LLM 去猜測。請用一句話描述工具的作用、何時呼叫以及回傳什麼。
- **過大的裝載。** 回傳數 MB JSON 的工具會吃掉模型的情境。請修剪或分頁。對於二進位 Blob，請回傳 `EmbeddedResourceBlock`，讓主機決定如何轉譯它。
- **隱藏錯誤。** 回傳 `"failed"` 字串對 SDK 而言看起來像成功。請擲出例外狀況或設定 `IsError = true`。
