# Prompts

Prompts 是可重複使用且參數化的訊息範本，使用者（而非 LLM）通常會從清單中挑選 — 就像聊天用戶端中的「斜線指令」。伺服器定義它們；主機則將其呈現為功能表。

## Anatomy of a prompt

```csharp
using System.ComponentModel;
using Microsoft.Extensions.AI;
using ModelContextProtocol.Server;

[McpServerPromptType]
public class CodePrompts
{
    [McpServerPrompt, Description("Generates a code review prompt.")]
    public static IEnumerable<ChatMessage> CodeReview(
        [Description("The programming language")] string language,
        [Description("The code to review")] string code) =>
        [
            new(ChatRole.User,
                $"Please review the following {language} code:\n\n```{language}\n{code}\n```"),
            new(ChatRole.Assistant,
                "I'll review the code for correctness, style, and potential improvements.")
        ];
}
```

註冊它：

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
| `PromptMessage` / `IEnumerable<PromptMessage>` | 低階 — 當您需要完整控制內容區塊（內嵌資源、每條訊息多個具型別的區塊）時使用。 |
| `GetPromptResult` | 完整控制 — 設定 `Messages` 和 `Description`。 |

`ChatMessage`/`ChatRole` 來自 `Microsoft.Extensions.AI`。它們是高階形式，也是您 90% 的時間應該使用的型別。僅在需要內嵌資源或精細的內容分型時，才降級使用 `PromptMessage`/`ContentBlock`。

## 引數

每個參數（在 SDK 排除掉的特殊參數 — `IMcpServer`、`CancellationToken` 等之後）都會成為使用者在挑選 Prompt 時可見的 Prompt 引數。請在每個參數上使用 `[Description]` 來解釋使用者應該提供什麼。

若要將引數標記為選填，請給予其預設值：

```csharp
[McpServerPrompt, Description("…")]
public static ChatMessage Greeting(
    [Description("Their preferred greeting style")] string style = "casual")
    => new(ChatRole.User, $"Greet me in a {style} style.");
```

## 圖片與檔案內容

對於包含圖片的 Prompt：

```csharp
[McpServerPrompt, Description("Asks the model to analyze an image.")]
public static IEnumerable<ChatMessage> AnalyzeImage(
    [Description("Instructions for the analysis")] string instructions)
{
    byte[] imageBytes = LoadSampleImage();
    return new[]
    {
        new ChatMessage(ChatRole.User, new AIContent[]
        {
            new TextContent($"Please analyze this image: {instructions}"),
            new DataContent(imageBytes, "image/png")
        })
    };
}
```

對於內嵌文字資源（例如：使用使用者挑選的文件做為對話種子）：

```csharp
[McpServerPrompt, Description("Reviews a referenced document.")]
public static IEnumerable<PromptMessage> ReviewDocument(
    [Description("The document ID to review")] string documentId)
{
    string content = LoadDocument(documentId);
    return new[]
    {
        new PromptMessage
        {
            Role = Role.User,
            Content = new TextContentBlock { Text = "Please review the following document:" }
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

## 非同步 Prompt

Prompt 可以是非同步的 — 當您需要查閱資料來建構訊息時非常有用：

```csharp
[McpServerPrompt, Description("Drafts a release-notes prompt.")]
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
            $"Draft release notes for {repo} {fromTag}→{toTag} from these commits:\n{summary}")
    };
}
```

## 通知用戶端 Prompt 變更

```csharp
await server.SendNotificationAsync(
    NotificationMethods.PromptListChangedNotification,
    new PromptListChangedNotificationParams(),
    cancellationToken);
```

## 何時使用 Prompt 與工具 (Tool)

- **Prompt：** 由「使用者」從功能表中觸發，並提供任何必要的引數。其輸出是訊息，而非資料。適用於「/摘要」、「/程式碼檢視」、「/草擬電子郵件」。
- **工具 (Tool)：** 由「LLM」觸發（通常無需使用者明確操作）以擷取或變更資料。適用於「get_weather」、「create_issue」。

如果兩者皆適用（使用者想要一個斜線指令，而該指令會觸發與 LLM 可呼叫的相同邏輯處理），請同時公開兩者 — 相同的 DTO/服務可以同時支援這兩者。
