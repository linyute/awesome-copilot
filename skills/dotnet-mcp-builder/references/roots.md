# 根目錄 (Roots)

> **在 2026-07-28 規格中已被棄用。** SDK 2.x 將 roots API 標記為 `[Obsolete]`（建構警告 `MCP9005`）。在過渡期間，它們與舊版用戶端保持通訊協定相容性，但對於新設計，建議讓用戶端將範圍內的路徑作為工具引數傳遞，或透過 elicitation / 多來回 `input_required` 模式進行詢問。保留此頁面以用於維護現有的 1.x 時代伺服器。

Roots 是**用戶端**向伺服器宣傳的檔案系統（或 URI）位置，界定了允許伺服器檢視的範圍。可想像為 IDE 中的「開啟的工作區資料夾」— 使用者已隱式核准伺服器從這些地方讀取資料。伺服器在需要時提取此清單。

## 何時會使用 Roots

- 建構掃描/編輯使用者專案的工具。使用 roots 了解哪些目錄在範圍內。
- 以尊重使用者已開啟工作區的方式解析相對路徑。
- 將檔案存取限制在宣傳的 roots 範圍內（縱深防禦）。

## 先決條件

與 sampling/elicitation 相同：伺服器至用戶端請求 → 需要 STDIO 或具狀態 HTTP。此外，用戶端必須宣傳 `roots` 功能。

## 從工具讀取 Roots

```csharp
using System.ComponentModel;
using System.Text;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

[McpServerToolType]
public class WorkspaceTools
{
    [McpServerTool, Description("列出使用者的專案根目錄。")]
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

`Root` 具有 `Uri`（字串，通常為 `file://...`）和選用的 `Name`（顯示標籤）。

## 對 Root 變更做出反應

當使用者開啟或關閉工作區資料夾時，用戶端會傳送 `notifications/roots/list_changed`。訂閱方式如下：

```csharp
builder.Services.Configure<McpServerOptions>(options =>
{
    options.Capabilities ??= new();

    // 用戶端告訴我們其 roots 已變更；重新整理我們擁有的任何快取。
    options.Capabilities.NotificationHandlers ??= [];
    options.Capabilities.NotificationHandlers[NotificationMethods.RootsListChangedNotification] =
        async (notification, ct) =>
        {
            // 觸發重新整理 — 通常是再次拉取 RequestRootsAsync。
        };
});
```

## 實用模式：快取 + 重新整理

Roots 不常變更，但每次工具呼叫都重新擷取是浪費的。按工作階段快取它們並在 `roots/list_changed` 上重新整理：

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

註冊為單例（在具狀態 HTTP 中為個別工作階段單例，在 STDIO 中自然為單例）。

## 針對 Roots 驗證路徑

縱深防禦：即使工具引數*看起來*像 root 下的路徑，也請進行驗證。

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

如果工具收到宣傳的 roots 之外的路徑，請以明確的訊息拒絕 — 不要默默擴大範圍。
