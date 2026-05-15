# 資源

資源是由 URI 識別且由伺服器公開的「事物」。主機（Host）會列出這些資源，讓使用者可以選擇要將哪些資源附加到對話中；工具和提示詞也可以透過 `EmbeddedResourceBlock` 引用它們。舉凡檔案、資料庫資料列、API 物件、設定等任何可定址的事物皆可視為資源。

兩種類型：
- **靜態資源** — 固定 URI (`config://app/settings`)。適用於單例。
- **資源範本** — 帶有預留位置的 URI (`docs://articles/{id}`)。主機（或 LLM）會代入參數；您的方法會接收這些參數。

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
    [Description("回傳應用程式設定值。")]
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

## 資源範本

`UriTemplate` 中的預留位置會依名稱對應到方法參數。任何非預留位置的參數都遵循與工具相同的 DI 規則 (`IMcpServer`, `CancellationToken`, 服務)。

```csharp
[McpServerResourceType]
public class DocumentResources
{
    [McpServerResource(
        UriTemplate = "docs://articles/{id}",
        Name = "Article",
        MimeType = "text/markdown")]
    [Description("根據 ID 回傳文件。")]
    public static ResourceContents GetArticle(string id)
    {
        string? content = LoadArticle(id);
        if (content is null)
            throw new McpException($"找不到文件：{id}");

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

| 回傳型別 | 結果 |
|---|---|
| `string` | 以 `TextResourceContents` 包裝，並使用範本中的 URI 及宣告的 `MimeType`。 |
| `byte[]` | 以 `BlobResourceContents` 包裝。 |
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

常見的模式是公開磁碟中的檔案。請注意路徑遍歷（Path Traversal）安全 — 絕不要逐字信任 URI。

```csharp
[McpServerResource(
    UriTemplate = "file://workspace/{*relativePath}",
    Name = "Workspace file")]
public static TextResourceContents ReadFile(string relativePath, IOptions<WorkspaceOptions> opts)
{
    var root = opts.Value.RootPath;
    var fullPath = Path.GetFullPath(Path.Combine(root, relativePath));
    if (!fullPath.StartsWith(root, StringComparison.Ordinal))
        throw new McpException("路徑遍歷已遭封鎖。");

    return new TextResourceContents
    {
        Uri = $"file://workspace/{relativePath.Replace("\\", "/")}",
        MimeType = "text/plain",
        Text = File.ReadAllText(fullPath)
    };
}
```

## 列出動態資源

以屬性（Attribute）為基礎的探索涵蓋了常見的情況（每個範本一個方法）。當您需要**列舉**不符合範本的資源時 — 例如「列出工作區中的每個檔案」 — 請在 `McpServerOptions.Capabilities.Resources` 中實作低階處理常式：

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

您可以混合使用以屬性為基礎和處理常式為基礎的方法 — SDK 會合併兩者。

## 資源訂閱 (伺服器推送更新)

如果用戶端訂閱了某個資源且該資源發生變化，請推送通知：

```csharp
await server.SendNotificationAsync(
    NotificationMethods.ResourceUpdatedNotification,
    new ResourceUpdatedNotificationParams { Uri = "docs://articles/42" },
    cancellationToken);
```

若為整體列表變更：

```csharp
await server.SendNotificationAsync(
    NotificationMethods.ResourceListChangedNotification,
    new ResourceListChangedNotificationParams(),
    cancellationToken);
```

兩者都需要具狀態的傳輸協定。

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

## 資源與工具 — 如何選擇

- **資源：** 使用者（或 LLM）想要將*內容附加*到對話中。唯讀、可定址、可列出。主機控制何時/是否載入。非常適合文件、設定、結構描述。
- **工具：** LLM 想要*執行某些操作*（可能包括讀取資料）。副作用、動作、不符合 URI 的參數。

如果您有 LLM 可能想要*搜尋*的內容，請同時公開兩者：`search_articles` 工具和 `docs://articles/{id}` 資源範本。工具回傳 URI 列表；主機透過資源獲取內容。
