# 提示詞 (Prompts)

提示詞是可重複使用、參數化的訊息範本，通常由使用者（而非 LLM）從清單中挑選 — 類似聊天用戶端中的「斜線指令 (slash commands)」。伺服器定義它們；主機將它們轉譯為功能表。

## 提示詞結構剖析

```csharp
using System.ComponentModel;
using Microsoft.Extensions.AI;
using ModelContextProtocol.Server;

[McpServerPromptType]
public class CodePrompts
{
    [McpServerPrompt, Description("產生程式碼審查提示詞。")]
    public static IEnumerable<ChatMessage> CodeReview(
        [Description("程式設計語言")] string language,
        [Description("要審查的程式碼")] string code) =>
        [
            new(ChatRole.User,
                $"請審查以下 {language} 程式碼：\n\n```{language}\n{code}\n```"),
            new(ChatRole.Assistant,
                "我將審查程式碼的正確性、風格和潛在的改進空間。")
        ];
}
```

註冊提示詞：

```csharp
.WithPrompts<CodePrompts>()
// 或
.WithPromptsFromAssembly()
```

## 回傳型別

| 回傳型別 | 結果 |
|---|---|
| `ChatMessage` | 單一訊息。 |
| `IEnumerable<ChatMessage>` | 對話種子。 |
| `PromptMessage` / `IEnumerable<PromptMessage>` | 較低階 — 當你需要完全控制內容區塊（內嵌資源、每個訊息多個具型別區塊）時使用。 |
| `GetPromptResult` | 完全控制 — 設定 `Messages` 和 `Description`。 |

`ChatMessage`/`ChatRole` 來自 `Microsoft.Extensions.AI`。它們是高階結構，也是你 90% 的時間應該使用的型別。僅在需要內嵌資源或細微的內容型別設定時，才降級使用 `PromptMessage`/`ContentBlock`。

## 引數

每個參數（在排除 SDK 移除的特殊參數如 `IMcpServer`、`CancellationToken` 等之後）都會變成提示詞引數，在使用者挑選提示詞時對其可見。對每個參數使用 `[Description]` 來解釋使用者應該提供什麼。

若要將引數標記為選用，請為其指定預設值：

```csharp
[McpServerPrompt, Description("…")]
public static ChatMessage Greeting(
    [Description("他們偏好的問候風格")] string style = "casual")
    => new(ChatRole.User, $"請以 {style} 風格向我問候。");
```

## 圖片與檔案內容

包含圖片的提示詞：

```csharp
[McpServerPrompt, Description("要求模型分析圖片。")]
public static IEnumerable<ChatMessage> AnalyzeImage(
    [Description("分析指示")] string instructions)
{
    byte[] imageBytes = LoadSampleImage();
    return new[]
    {
        new ChatMessage(ChatRole.User, new AIContent[]
        {
            new TextContent($"請分析此圖片：{instructions}"),
            new DataContent(imageBytes, "image/png")
        })
    };
}
```

內嵌文字資源（例如使用使用者選取的文件為對話植入種子）：

```csharp
[McpServerPrompt, Description("審查參考的文件。")]
public static IEnumerable<PromptMessage> ReviewDocument(
    [Description("要審查的文件 ID")] string documentId)
{
    string content = LoadDocument(documentId);
    return new[]
    {
        new PromptMessage
        {
            Role = Role.User,
            Content = new TextContentBlock { Text = "請審查以下文件：" }
        },
        new PromptMessage
        {
            Role = Role.User,
            Content = new EmbeddedResourceBlock
            {
                Resource = new TextResourceContents
                {
                    Uri = $"docs://documents/{documentId}",
                    MimeType = "text/plain",
                    Text = content
                }
            }
        }
    };
}
```

## 非同步提示詞

提示詞可以是非同步的 — 在需要查詢資料來建構訊息時很有用：

```csharp
[McpServerPrompt, Description("草擬版本資訊提示詞。")]
public static async Task<IEnumerable<ChatMessage>> ReleaseNotes(
    string repo,
    string fromTag,
    string toTag,
    IGitHubClient github,
    CancellationToken ct)
{
    var commits = await github.GetCommitsBetweenAsync(repo, fromTag, toTag, ct);
    var summary = string.Join("\n", commits.Select(c => $"- {c.Message}"));
    return new[]
    {
        new ChatMessage(ChatRole.User,
            $"請根據以下認可記錄為 {repo} {fromTag}→{toTag} 草擬版本資訊：\n{summary}")
    };
}
```

## 向用戶端通知提示詞變更

```csharp
await server.SendNotificationAsync(
    NotificationMethods.PromptListChangedNotification,
    new PromptListChangedNotificationParams(),
    cancellationToken);
```

## 何時使用提示詞 vs. 工具

- **提示詞 (Prompt)：** 由*使用者*從功能表中觸發，提供任何必要的引數。輸出是訊息而非資料。適合用於 "/summarize"、"/code-review"、"/draft-email"。
- **工具 (Tool)：** 由 *LLM* 觸發（通常無需明確的使用者動作）以擷取或變更資料。適合用於 "get_weather"、"create_issue"。

如果兩者皆適用（使用者希望有一個斜線指令來觸發 LLM 也可以呼叫的相同邏輯），請同時公開兩者 — 相同的 DTO/服務可以同時支援這兩者。
