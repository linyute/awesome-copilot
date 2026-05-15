# Roots

Roots 是**用戶端**向伺服器廣告的檔案系統（或 URI）位置，用來界定伺服器被允許檢視的範圍。想像一下 IDE 中的「開啟工作區資料夾」——使用者已隱含地核准伺服器從這些地方讀取。伺服器在需要時會提取該清單。

## 何時使用 roots

- 建構一個掃描/編輯使用者專案的工具。使用 roots 來了解哪些目錄在範圍內。
- 以尊重使用者開啟的工作區的方式解析相對路徑。
- 將檔案存取限制在廣告的 roots 內（縱深防禦）。

## 前提條件

與取樣/啟發（sampling/elicitation）相同：伺服器到用戶端的請求 → 需要 STDIO 或具狀態的 HTTP。此外，用戶端必須廣告 `roots` 功能。

## 從工具中讀取 roots

```csharp
using System.ComponentModel;
using System.Text;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

[McpServerToolType]
public class WorkspaceTools
{
    [McpServerTool, Description("列出使用者的專案 roots。")]
    public static async Task<string> ListProjectRoots(
        IMcpServer server,
        CancellationToken cancellationToken)
    {
        if (server.ClientCapabilities?.Roots is null)
            return "用戶端不支援 roots。";

        var result = await server.RequestRootsAsync(
            new ListRootsRequestParams(),
            cancellationToken);

        var sb = new StringBuilder();
        foreach (var root in result.Roots)
            sb.AppendLine($"- {root.Name ?? root.Uri}: {root.Uri}");

        return sb.ToString();
    }
}
```

`Root` 具有 `Uri`（字串，通常是 `file://...`）和選用的 `Name`（顯示標籤）。

## 對 root 變更做出反應

當使用者開啟或關閉工作區資料夾時，用戶端會傳送 `notifications/roots/list_changed`。訂閱：

```csharp
builder.Services.Configure<McpServerOptions>(options =>
{
    options.Capabilities ??= new();

    // 用戶端告訴我們它的 roots 已變更；重新整理我們擁有的任何快取。
    options.Capabilities.NotificationHandlers ??= [];
    options.Capabilities.NotificationHandlers[NotificationMethods.RootsListChangedNotification] =
        async (notification, ct) =>
        {
            // 觸發您的重新整理 —— 通常是再次提取 RequestRootsAsync。
        };
});
```

## 一個有用的模式：快取 + 重新整理

Roots 不會經常變更，但在每次工具呼叫時重新獲取是很浪費的。按工作階段（session）快取它們，並在 `roots/list_changed` 時進行重新整理：

```csharp
public class RootsCache
{
    private IReadOnlyList<Root> _roots = Array.Empty<Root>();

    public IReadOnlyList<Root> Current => _roots;

    public async Task RefreshAsync(IMcpServer server, CancellationToken ct)
    {
        if (server.ClientCapabilities?.Roots is null) return;
        var result = await server.RequestRootsAsync(new ListRootsRequestParams(), ct);
        _roots = result.Roots;
    }
}
```

註冊為單一執行個體（singleton）（在具狀態的 HTTP 中為每個工作階段一個，在 STDIO 中自然是單一執行個體）。

## 根據 roots 驗證路徑

縱深防禦：即使工具引數*看起來*像是 root 下的路徑，也要進行驗證。

```csharp
public static bool IsUnderAnyRoot(string absolutePath, IReadOnlyList<Root> roots)
{
    foreach (var root in roots)
    {
        if (!Uri.TryCreate(root.Uri, UriKind.Absolute, out var uri)) continue;
        if (!uri.IsFile) continue;
        var rootPath = Path.GetFullPath(uri.LocalPath);
        if (absolutePath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase))
            return true;
    }
    return false;
}
```

如果工具收到廣告的 roots 之外的路徑，請以明確的訊息拒絕 —— 不要默默地擴大範圍。
