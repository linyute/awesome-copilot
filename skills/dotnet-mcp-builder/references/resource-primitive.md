# 資源 (Resources)

資源是由 URI 識別、由伺服器公開的「實體」。主機會列出它們，讓使用者可以挑選要附加到對話中的項目；工具和提示詞也可以透過 `EmbeddedResourceBlock` 參照它們。可想像為檔案、資料庫資料列、API 物件、設定 — 任何可尋址的內容。

兩種形式：
- **靜態資源 (Static resource)** — 固定 URI (`config://app/settings`)。適用於單例 (singletons)。
- **資源範本 (Resource template)** — 帶有預留位置的 URI (`docs://articles/{id}`)。主機（或 LLM）替換參數；你的方法接收它們。

## 靜態資源

```csharp
using System.ComponentModel;
using System.Text.Json;
using ModelContextProtocol.Server;

[McpServerResourceType]
public class AppResources
{
    [McpServerResource(
        UriTemplate = "config://app/settings",
        Name = "App Settings",
        MimeType = "application/json")]
    [Description("回傳應用程式組態設定。")]
    public static string GetSettings() =>
        JsonSerializer.Serialize(new { theme = "dark", language = "en" });
}
```

註冊：

```csharp
.WithResources<AppResources>()
// 或
.WithResourcesFromAssembly()
```

## 範本化資源

`UriTemplate` 中的預留位置依名稱對應至方法參數。非預留位置的任何項目遵循與工具相同的 DI 規則（`IMcpServer`、`CancellationToken`、服務）。

```csharp
[McpServerResourceType]
public class DocumentResources
{
    [McpServerResource(
        UriTemplate = "docs://articles/{id}",
        Name = "Article",
        MimeType = "text/markdown")]
    [Description("依 ID 回傳文章。")]
    public static ResourceContents GetArticle(string id)
    {
        string? content = LoadArticle(id);
        if (content is null)
            throw new McpException($"找不到文章：{id}");

        return new TextResourceContents
        {
            Uri = $"docs://articles/{id}",
            MimeType = "text/markdown",
            Text = content
        };
    }
}
```

## 回傳型別

| 回傳 | 結果 |
|---|---|
| `string` | 包裝在 `TextResourceContents` 中，使用範本中的 URI 和宣告的 `MimeType`。 |
| `byte[]` | 包裝在 `BlobResourceContents` 中。 |
| `TextResourceContents` | 原樣回傳 — 設定 `Uri`、`MimeType`、`Text`。 |
| `BlobResourceContents` | 原樣回傳 — 使用 `BlobResourceContents.FromBytes(...)`。 |
| `IEnumerable<ResourceContents>` | 多部分資源。 |

### 二進位資源

```csharp
[McpServerResource(
    UriTemplate = "images://photos/{id}",
    Name = "Photo",
    MimeType = "image/png")]
public static BlobResourceContents GetPhoto(int id)
{
    byte[] data = LoadPhoto(id);
    return BlobResourceContents.FromBytes(data, $"images://photos/{id}", "image/png");
}
```

### 指向檔案系統

常見模式是公開磁碟中的檔案。請小心路徑周遊 (path traversal) — 絕不要逐字信任 URI。

```csharp
[McpServerResource(
    UriTemplate = "file://workspace/{*relativePath}",
    Name = "Workspace file")]
public static TextResourceContents ReadFile(string relativePath, IOptions<WorkspaceOptions> opts)
{
    var root = opts.Value.RootPath;
    var fullPath = Path.GetFullPath(Path.Combine(root, relativePath));
    if (!fullPath.StartsWith(root, StringComparison.Ordinal))
        throw new McpException("路徑周遊已被封鎖。");

    return new TextResourceContents
    {
        Uri = $"file://workspace/{relativePath.Replace("\\", "/")}",
        MimeType = "text/plain",
        Text = File.ReadAllText(fullPath)
    };
}
```

## 列出動態資源

基於屬性的探索涵蓋了常見情況（每個範本一個方法）。當你需要**列舉**不符合範本的資源時 — 例如「列出工作區中的每個檔案」— 請在 `McpServerOptions.Capabilities.Resources` 中實作低階處理常式：

```csharp
builder.Services.Configure<McpServerOptions>(options =>
{
    options.Capabilities ??= new();
    options.Capabilities.Resources ??= new();

    options.Capabilities.Resources.ListResourcesHandler = (ctx, ct) =>
    {
        var resources = Directory
            .EnumerateFiles(WorkspaceRoot, "*.*", SearchOption.AllDirectories)
            .Select(path => new Resource
            {
                Uri = "file://workspace/" + Path.GetRelativePath(WorkspaceRoot, path).Replace('\\', '/'),
                Name = Path.GetFileName(path),
                MimeType = "text/plain"
            })
            .ToList();

        return ValueTask.FromResult(new ListResourcesResult { Resources = resources });
    };
});
```

你可以混合使用基於屬性和基於處理常式的方法 — SDK 會合併兩者。

## 資源訂閱（伺服器推送更新）

如果用戶端訂閱了資源且該資源發生變更，請推送通知：

```csharp
await server.SendNotificationAsync(
    NotificationMethods.ResourceUpdatedNotification,
    new ResourceUpdatedNotificationParams { Uri = "docs://articles/42" },
    cancellationToken);
```

對於整個清單的變更：

```csharp
await server.SendNotificationAsync(
    NotificationMethods.ResourceListChangedNotification,
    new ResourceListChangedNotificationParams(),
    cancellationToken);
```

兩者都需要具狀態傳輸。

## 從用戶端讀取資源

```csharp
ReadResourceResult result = await client.ReadResourceAsync("config://app/settings");
foreach (var content in result.Contents)
{
    if (content is TextResourceContents text)
        Console.WriteLine($"[{text.MimeType}] {text.Text}");
    else if (content is BlobResourceContents blob)
        File.WriteAllBytes("out.bin", blob.DecodedData.ToArray());
}
```

## 資源 vs. 工具 — 何時選擇何者

- **資源 (Resource)：** 使用者（或 LLM）想要將*情境附加*到對話中。唯讀、可尋址、可列出。主機控制何時/是否載入它。非常適合文件、組態、結構描述。
- **工具 (Tool)：** LLM 想要*執行某些動作*（可能包括讀取資料）。具有副作用、動作、不符合 URI 的參數。

如果你有 LLM 可能想要*搜尋*的內容，請同時公開兩者：`search_articles` 工具和 `docs://articles/{id}` 資源範本。工具回傳 URI 清單；主機透過資源擷取內容。
