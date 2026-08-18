# 取樣 (Sampling)

> **在 2026-07-28 規格中已被棄用。** SDK 2.x 將 sampling API 標記為 `[Obsolete]`（建構警告 `MCP9005`）。在過渡期間，它們與舊版用戶端保持通訊協定相容性，但**不要圍繞 sampling 設計新伺服器**：對於「工具在執行途中需要使用者/LLM 輸入」，建議使用多來回 `input_required` 模式；對於「伺服器需要 LLM」，請直接在伺服器端呼叫模型。保留此頁面以用於維護現有的 1.x 時代伺服器；僅將隱藏 `MCP9005` 作為有記錄說明的過渡措施。

Sampling 允許工具**透過用戶端呼叫 LLM**，而不是自帶模型。伺服器發出「幫我摘要這個內容」的請求，用戶端將該請求路由至使用者設定的任何模型（Claude、GPT、本機模型等）。成本和速率限制由用戶端承擔，而非伺服器。

## 何時使用 Sampling

- 工具需要 LLM 步驟（摘要、分類、草擬、擷取），且你不想在伺服器中提供/設定自己的模型。
- 你希望尊重使用者的模型選擇、金鑰和成本偏好。
- 你正在建構一個「元 (meta)」工具，將協調 LLM 工作作為其職責的一部分（例如多步驟 Agent）。

如果你已經有決定性演算法，請不要「為了增添風味」而新增 sampling 呼叫 — 這會增加延遲和成本。

## 先決條件：具狀態傳輸

與 elicitation 類似，sampling 需要伺服器回呼用戶端。STDIO 一律可用；HTTP 需要 `options.Stateless = false`。

## 建議做法：`IChatClient` 配接器

最簡潔的 API 將 sampling 通道包裝為 `Microsoft.Extensions.AI.IChatClient`，因此你可以撰寫看起來像一般呼叫 LLM 的 .NET 程式碼：

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
            new(ChatRole.User, "請簡要摘要以下內容："),
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

這樣做的好處：
- 與 .NET AI 生態系統其餘部分使用的 `IChatClient` API 相同。
- 可與 `Microsoft.Extensions.AI` 中介軟體搭配使用（速率限制、重試、遙測、函式呼叫）。
- 你可以在測試中透過插入不同的 `IChatClient` 來切換至直接提供者。

## 較低階：`SampleAsync`

當你需要完全控制請求結構時：

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
        SystemPrompt = "你是一個精確的計算機。",
        // ModelPreferences, StopSequences, IncludeContext...
    },
    cancellationToken);

string answer = result.Content
    .OfType<TextContentBlock>()
    .FirstOrDefault()?.Text ?? string.Empty;
```

`ModelPreferences` 允許你提示模型選擇偏好（成本 vs. 速度 vs. 智慧優先級）；由*用戶端*決定實際模型。

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

Sampling 請求可以要求用戶端納入目前對話的情境：

```csharp
IncludeContext = ContextInclusion.ThisServer   // 包含此伺服器先前的訊息
// 或 AllServers，或 None（預設）
```

當你需要 LLM 考慮聊天中目前為止發生的事情而無需你重新提供時很有用。

## 功能檢查

一律確認用戶端支援 sampling — 許多用戶端並不支援：

```csharp
if (server.ClientCapabilities?.Sampling is null)
    throw new McpException(
        "此用戶端不支援 sampling。" +
        "請在主機中設定模型或使用不同的 MCP 用戶端。");
```

## 效能備註

- Sampling 呼叫是網路來回通訊（用戶端 → 其提供者 → 返回）。預期耗時 100 毫秒至數秒。請勿緊密迴圈呼叫。
- Token 成本由*使用者*支付（其 API 金鑰/配額）。請對 `MaxTokens` 保持保守。
- 取消會傳播：如果使用者終止工具呼叫，sampling 請求也會被取消。

## Sampling vs. 伺服器端執行

| Sampling（透過用戶端） | 直接呼叫 LLM（伺服器端） |
|---|---|
| 使用使用者的模型 + 金鑰 | 使用你的服務的金鑰 |
| 尊重使用者的原則/配額 | 由你負責計費/追蹤 |
| 適用於使用者擁有的任何主機 | 鎖定在隨附發佈的模型 |
| 較高的延遲（額外躍點） | 較低延遲，直接呼叫 |
| 無需管理機密資訊 | 由你管理 API 金鑰 |

對於發佈給許多使用者的「智慧型」伺服器，偏好使用 sampling。對於內部企業伺服器，若你希望有一致的行為且已為模型付費，直接呼叫即可。
