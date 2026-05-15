# Sampling

Sampling 讓工具可以**透過用戶端呼叫 LLM**，而不是自備模型。伺服器發送「幫我摘要這段內容」的請求，而用戶端會將該請求路由至使用者設定的任何模型（Claude、GPT、本機模型等）。成本和速率限制由用戶端承擔，而非伺服器。

## 何時使用 Sampling

- 工具需要 LLM 步驟（摘要、分類、草稿、擷取），且您不希望在伺服器中隨附或設定自己的模型。
- 您希望尊重使用者的模型選擇、金鑰及成本偏好。
- 您正在建立一個「元」工具，作為其工作的一部分來協調 LLM 工作（例如：多步驟代理程式）。

如果您已有確定性演算法，請勿為了「增添風味」而加入 Sampling 呼叫 — 這會增加延遲和成本。

## 前提條件：具狀態傳輸

與 Elicitation 類似，Sampling 需要伺服器回呼用戶端。STDIO 始終有效；HTTP 則需要設定 `options.Stateless = false`。

## 建議：`IChatClient` 配接器

最整潔的 API 是將 Sampling 通道封裝為 `Microsoft.Extensions.AI.IChatClient`，如此一來您編寫的程式碼看起來就像一般的 LLM 呼叫 .NET：

```csharp
using System.ComponentModel;
using Microsoft.Extensions.AI;
using ModelContextProtocol.Server;

[McpServerToolType]
public class SummaryTools
{
    [McpServerTool(Name = "SummarizeContent"), Description("使用用戶端的 LLM 摘要任意文字。")]
    public static async Task<string> Summarize(
        IMcpServer server,
        [Description("要摘要的文字")] string text,
        CancellationToken cancellationToken)
    {
        ChatMessage[] messages =
        [
            new(ChatRole.User, "簡要摘要以下內容："),
            new(ChatRole.User, text),
        ];

        var options = new ChatOptions
        {
            MaxOutputTokens = 256,
            Temperature = 0.3f,
        };

        var response = await server.AsSamplingChatClient()
            .GetResponseAsync(messages, options, cancellationToken);

        return $"摘要：{response}";
    }
}
```

為何這很棒：
- 與 .NET AI 生態系統其餘部分使用的 `IChatClient` API 相同。
- 可與 `Microsoft.Extensions.AI` 中介軟體（速率限制、重試、遙測、函式呼叫）搭配使用。
- 您可以透過插入不同的 `IChatClient`，在測試中切換至直接提供者。

## 低階：`SampleAsync`

當您需要完全控制請求形狀時：

```csharp
using ModelContextProtocol.Protocol;

CreateMessageResult result = await server.SampleAsync(
    new CreateMessageRequestParams
    {
        Messages =
        [
            new SamplingMessage
            {
                Role = Role.User,
                Content = [new TextContentBlock { Text = "2 + 2 等於多少？" }]
            }
        ],
        MaxTokens = 100,
        Temperature = 0.0f,
        SystemPrompt = "你是一個精確的計算器。",
        // ModelPreferences, StopSequences, IncludeContext...
    },
    cancellationToken);

string answer = result.Content
    .OfType<TextContentBlock>()
    .FirstOrDefault()?.Text ?? string.Empty;
```

`ModelPreferences` 讓您可以提示模型選擇（成本 vs 速度 vs 智慧優先級）；*用戶端* 會決定實際的模型。

```csharp
ModelPreferences = new ModelPreferences
{
    Hints = [new ModelHint { Name = "claude" }],   // 軟性偏好
    CostPriority = 0.2,        // 0..1
    SpeedPriority = 0.4,
    IntelligencePriority = 0.9,
}
```

## `IncludeContext`

Sampling 請求可以要求用戶端包含來自目前對話的內容：

```csharp
IncludeContext = ContextInclusion.ThisServer   // 包含此伺服器之前的訊息
// 或 AllServers，或 None (預設)
```

當您需要 LLM 考量到目前為止聊天中發生的情況，而又不需要您重新提供資訊時，這非常有用。

## 功能檢查

務必確認用戶端支援 Sampling — 許多用戶端並不支援：

```csharp
if (server.ClientCapabilities?.Sampling is null)
    throw new McpException(
        "此用戶端不支援 Sampling。 " +
        "在主機中設定模型或使用不同的 MCP 用戶端。");
```

## 效能備註

- Sampling 呼叫是網路來回傳輸（用戶端 → 其提供者 → 返回）。預計耗時 100ms–數秒不等。請勿進行緊密迴圈。
- Token 成本由 *使用者* 支付（其 API 金鑰/配額）。請保守使用 `MaxTokens`。
- 取消會傳播：如果使用者終止工具呼叫，Sampling 請求也會被取消。

## Sampling vs. 在伺服器端執行

| Sampling (透過用戶端) | 直接 LLM 呼叫 (伺服器端) |
|---|---|
| 使用使用者的模型 + 金鑰 | 使用您服務的金鑰 |
| 尊重使用者的政策/配額 | 由您負責計費/追蹤 |
| 可在使用者擁有的任何主機中運作 | 鎖定在您隨附的模型 |
| 較高延遲 (額外跳轉) | 較低延遲，直接呼叫 |
| 無需管理機密 | 由您管理 API 金鑰 |

對於發佈給許多使用者的「智慧型」伺服器，建議優先選擇 Sampling。對於您希望行為一致且已為模型付費的內部企業伺服器，直接呼叫即可。
