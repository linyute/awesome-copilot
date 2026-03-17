# 產生協助工具報告

建構一個 CLI 工具，使用 Playwright MCP 伺服器分析網頁協助工具（accessibility），並產生詳細的 WCAG 相容報告，且可選擇產生測試程式碼。

> **可執行範例：** [recipe/accessibility-report.cs](recipe/accessibility-report.cs)
>
> ```bash
> dotnet run recipe/accessibility-report.cs
> ```

## 範例情境

您想要稽核網站的協助工具合規性。此工具使用 Playwright 導覽至 URL，擷取協助工具快照，並產生一份結構化報告，內容涵蓋 WCAG 標準，如地標（landmarks）、標題階層、焦點管理與觸控目標。它還可以產生 Playwright 測試檔案，以自動執行未來的協助工具檢查。

## 先決條件

```bash
dotnet add package GitHub.Copilot.SDK
```

您還需要安裝 `npx`（已安裝 Node.js）以執行 Playwright MCP 伺服器。

## 使用方式

```bash
dotnet run recipe/accessibility-report.cs
# 根據提示輸入 URL
```

## 完整範例：accessibility-report.cs

```csharp
#:package GitHub.Copilot.SDK@*

using GitHub.Copilot.SDK;

// 建立並啟動用戶端
await using var client = new CopilotClient();
await client.StartAsync();

Console.WriteLine("=== 協助工具報告產生器 ===");
Console.WriteLine();

Console.Write("輸入要分析的 URL：");
var url = Console.ReadLine()?.Trim();

if (string.IsNullOrWhiteSpace(url))
{
    Console.WriteLine("未提供 URL。正在結束。");
    return;
}

// 確保 URL 具有協定
if (!url.StartsWith("http://") && !url.StartsWith("https://"))
{
    url = "https://" + url;
}

Console.WriteLine($"\n正在分析：{url}");
Console.WriteLine("請稍候...\n");

// 使用 Playwright MCP 伺服器建立工作階段
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "claude-opus-4.6",
    Streaming = true,
    OnPermissionRequest = PermissionHandler.ApproveAll,
    McpServers = new Dictionary<string, object>()
    {
        ["playwright"] =
        new McpLocalServerConfig
        {
            Type = "local",
            Command = "npx",
            Args = ["@playwright/mcp@latest"],
            Tools = ["*"]
        }
    },
});

// 使用 session.idle 事件等待回應
var done = new TaskCompletionSource();

session.On(evt =>
{
    switch (evt)
    {
        case AssistantMessageDeltaEvent delta:
            Console.Write(delta.Data.DeltaContent);
            break;
        case SessionIdleEvent:
            done.TrySetResult();
            break;
        case SessionErrorEvent error:
            Console.WriteLine($"\n錯誤：{error.Data.Message}");
            done.TrySetResult();
            break;
    }
});

var prompt = $"""
    使用 Playwright MCP 伺服器分析此網頁的協助工具：{url}
    
    請執行以下操作：
    1. 使用 playwright-browser_navigate 導覽至該 URL
    2. 使用 playwright-browser_snapshot 擷取協助工具快照
    3. 分析快照並提供詳細的協助工具報告
    
    請嚴格按照此結構格式化報告，並使用表情符號指示：

    📊 協助工具報告：[網頁標題] (domain.com)

    ✅ 運作良好的部分
    | 類別 | 狀態 | 詳細資訊 |
    |----------|--------|---------|
    | 語言 | ✅ 通過 | lang="en-US" 設定正確 |
    | 網頁標題 | ✅ 通過 | "[標題]" 具備描述性 |
    | 標題階層 | ✅ 通過 | 單一 H1，正確的 H2/H3 結構 |
    | 圖片 | ✅ 通過 | 所有 X 張圖片皆有替代文字 |

    ⚠️ 發現的問題
    | 嚴重程度 | 問題 | WCAG 標準 | 建議 |
    |----------|-------|----------------|----------------|
    | 🔴 高 | 缺少 <main> 地標 | 1.3.1, 2.4.1 | 將主要內容封裝在 <main> 元件中 |
    | 🟡 中 | 焦點外框已停用 | 2.4.7 | 確保存在可見的 :focus 樣式 |

    📋 統計摘要
    - 連結總數：X
    - 標題總數：X
    - 可聚焦元素：X
    - 發現的地標：橫幅 ✅、導覽 ✅、主要 ❌、頁尾 ✅

    ⚙️ 優先建議
    ...

    使用 ✅ 表示通過，🔴 表示高嚴重性問題，🟡 表示中嚴重性問題，❌ 表示遺失項目。
    包含來自網頁分析的實際發現 - 不要只是複製範例。
    """;

await session.SendAsync(new MessageOptions { Prompt = prompt });
await done.Task;

Console.WriteLine("\n\n=== 報告完成 ===\n");

// 提示使用者產生測試
Console.Write("您是否要產生 Playwright 協助工具測試？(y/n)：");
var generateTests = Console.ReadLine()?.Trim().ToLowerInvariant();

if (generateTests == "y" || generateTests == "yes")
{
    // 重設以進行下一次互動
    done = new TaskCompletionSource();

    var detectLanguagePrompt = $"""
        分析目前工作目錄以偵測此專案中使用的主要程式語言。
        僅回應偵測到的語言名稱與簡短說明。
        如果未偵測到專案，建議將 "TypeScript" 作為 Playwright 測試的預設語言。
        """;

    Console.WriteLine("\n正在偵測專案語言...\n");
    await session.SendAsync(new MessageOptions { Prompt = detectLanguagePrompt });
    await done.Task;

    Console.Write("\n\n確認測試語言（或輸入其他語言）：");
    var language = Console.ReadLine()?.Trim();

    if (string.IsNullOrWhiteSpace(language))
    {
        language = "TypeScript";
    }

    // 重設以產生測試
    done = new TaskCompletionSource();

    var testGenerationPrompt = $"""
        根據您剛為 {url} 產生的協助工具報告，以 {language} 建立 Playwright 協助工具測試。
        
        測試應：
        1. 驗證報告中的所有協助工具檢查
        2. 針對發現的問題進行測試（以確保問題得到修復）
        3. 包含地標、標題階層、替代文字、焦點指示器等測試
        4. 使用 Playwright 的協助工具測試功能
        5. 包含說明每個測試的實用註釋
        
        輸出可儲存並執行的完整測試檔案。
        """;

    Console.WriteLine("\n正在產生協助工具測試...\n");
    await session.SendAsync(new MessageOptions { Prompt = testGenerationPrompt });
    await done.Task;

    Console.WriteLine("\n\n=== 測試已產生 ===");
}
```

## 運作方式

1. **Playwright MCP 伺服器**：設定一個執行 `@playwright/mcp` 的本機 MCP 伺服器，以提供瀏覽器自動化工具
2. **串流輸出**：使用 `Streaming = true` 與 `AssistantMessageDeltaEvent` 進行即時的逐權杖（token-by-token）輸出
3. **協助工具快照**：Playwright 的 `browser_snapshot` 工具可擷取網頁的完整協助工具樹
4. **結構化報告**：提示詞設計了一種與 WCAG 對齊且一致的報告格式，並帶有表情符號嚴重程度指示器
5. **測試產生**：可選擇性地偵測專案語言並產生 Playwright 協助工具測試

## 關鍵概念

### MCP 伺服器設定

此食譜設定了與工作階段一同執行的本機 MCP 伺服器：

```csharp
OnPermissionRequest = PermissionHandler.ApproveAll,
McpServers = new Dictionary<string, object>()
{
    ["playwright"] = new McpLocalServerConfig
    {
        Type = "local",
        Command = "npx",
        Args = ["@playwright/mcp@latest"],
        Tools = ["*"]
    }
}
```

這使模型能夠存取 Playwright 瀏覽器工具，例如 `browser_navigate`、`browser_snapshot` 與 `browser_click`。

### 搭配事件進行串流

與 `SendAndWaitAsync` 不同，此食譜使用串流進行即時輸出：

```csharp
session.On(evt =>
{
    switch (evt)
    {
        case AssistantMessageDeltaEvent delta:
            Console.Write(delta.Data.DeltaContent); // 逐權杖
            break;
        case SessionIdleEvent:
            done.TrySetResult(); // 模型已完成
            break;
    }
});
```

## 互動範例

```
=== 協助工具報告產生器 ===

輸入要分析的 URL：github.com

正在分析：https://github.com
請稍候...

📊 協助工具報告：GitHub (github.com)

✅ 運作良好的部分
| 類別 | 狀態 | 詳細資訊 |
|----------|--------|---------|
| 語言 | ✅ 通過 | lang="en" 設定正確 |
| 網頁標題 | ✅ 通過 | "GitHub" 可辨識 |
| 標題階層 | ✅ 通過 | 正確的 H1/H2 結構 |
| 圖片 | ✅ 通過 | 所有圖片皆有替代文字 |

⚠️ 發現的問題
| 嚴重程度 | 問題 | WCAG 標準 | 建議 |
|----------|-------|----------------|----------------|
| 🟡 中 | 某些連結缺少描述性文字 | 2.4.4 | 為僅含圖示的連結新增 aria-label |

📋 統計摘要
- 連結總數：47
- 標題總數：8 (1× H1，正確階層)
- 可聚焦元素：52
- 發現的地標：橫幅 ✅、導覽 ✅、主要 ✅、頁尾 ✅

=== 報告完成 ===

您是否要產生 Playwright 協助工具測試？(y/n)：y

正在偵測專案語言...
偵測到 TypeScript (發現 package.json)

確認測試語言（或輸入其他語言）：

正在產生協助工具測試...
[產生的測試檔案輸出...]

=== 測試已產生 ===
```
