# 引導 (Elicitation)

引導讓工具可以透過用戶端在**執行期間要求使用者輸入**。大型語言模型 (LLM) 看不到問題；用戶端會直接向使用者呈現。這將單次工具呼叫轉變為互動式流程 — 收集確認、缺失的參數、憑證 (URL 模式) 等。

> **規格版本：** 2025-11-25。URL 模式是較新的補充 (最初 2025-06-18 只有表單模式)。

## 兩種模式

| 模式 | 作用 | 何時使用 |
|---|---|---|
| **表單 (頻內)** | 伺服器傳送 JSON 結構描述 (Schema)；用戶端呈現表單；使用者透過相同的 MCP 通道回傳值。 | 確認、缺失的參數、結構化選擇。 |
| **URL (頻外)** | 伺服器傳送 URL；用戶端在瀏覽器中開啟；使用者在該處完成流程；伺服器另外檢查狀態。 | OAuth、付款、任何 MCP 通道不得看見的內容。 |

## 前提條件：具狀態傳輸

引導需要伺服器向用戶端傳送請求並等待回應。這僅適用於：
- STDIO (始終)。
- 具狀態 HTTP (`options.Stateless = false`)。

在無狀態 HTTP 中，`ElicitAsync` 將擲回異常 — 因為沒有回傳的傳輸通道。

## 表單模式 — 完整範例

```csharp
using System.ComponentModel;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

[McpServerToolType]
public class BookingTools
{
    [McpServerTool, Description("預訂會議室。要求使用者確認。")]
    public static async Task<string> BookRoom(
        IMcpServer server,
        [Description("會議室名稱")] string room,
        [Description("開始時間 (ISO 8601)")] DateTime start,
        CancellationToken ct)
    {
        var elicit = await server.ElicitAsync(new ElicitRequestParams
        {
            Message = $"確認預訂 '{room}' 於 {start:HH:mm}？",
            RequestedSchema = new ElicitRequestParams.RequestSchema
            {
                Properties = new Dictionary<string, ElicitRequestParams.PrimitiveSchemaDefinition>
                {
                    ["confirm"] = new ElicitRequestParams.BooleanSchema
                    {
                        Description = "確認預訂",
                        Default = true
                    },
                    ["notes"] = new ElicitRequestParams.StringSchema
                    {
                        Description = "預訂的選擇性備註"
                    }
                }
            }
        }, ct);

        if (elicit.Action != "accept")
            return "使用者已取消預訂。";

        var confirmed = elicit.Content?["confirm"].GetBoolean() ?? false;
        var notes     = elicit.Content?["notes"].GetString() ?? "";

        if (!confirmed)
            return "使用者拒絕確認。";

        // …執行預訂…
        return $"已預訂 '{room}' 於 {start:O}。備註：{notes}";
    }
}
```

### 結構描述 (Schema) 基本類型

您可以從以下項目建構 `RequestedSchema`：

| 類型 | C# 類別 | 備註 |
|---|---|---|
| 字串 (String) | `StringSchema` | `Default`、`Description`。如果需要，可在伺服器端加入 JSON-Schema 驗證。 |
| 數字 (Number) | `NumberSchema` | 用於整數和浮點數。 |
| 布林值 (Boolean) | `BooleanSchema` | 呈現為核取方塊 / 切換開關。 |
| 單選列舉 (無標題) | `UntitledSingleSelectEnumSchema` | 值列表；用戶端呈現為下拉選單/單選按鈕。 |
| 單選列舉 (具標題) | `TitledSingleSelectEnumSchema` | 每個值都有顯示標題。 |
| 多選列舉 | `UntitledMultiSelectEnumSchema` / `TitledMultiSelectEnumSchema` | 多選下拉選單 / 核取方塊群組。 |

每個項目都接受 `Description` 和 `Default`。

### 回應形狀

`ElicitResult`：
- `Action` — `"accept"` (接受)、`"reject"` (拒絕) 或 `"cancel"` (取消)。務必先檢查此項。
- `Content` — 包含使用者提交值的 `Dictionary<string, JsonElement>?`。若使用者拒絕/取消則為 `null`。

務必處理非接受 (non-accept) 的路徑：

```csharp
if (elicit.Action == "cancel")
    return "使用者已取消。未做任何變更。";
if (elicit.Action == "reject")
    return "使用者已拒絕。";
// Action == "accept" → 可安全讀取 elicit.Content
```

## URL 模式 — 完整範例

URL 模式適用於使用者必須在 MCP 通道**之外**完成某些作業的流程 — 通常是 OAuth。

```csharp
[McpServerTool, Description("連結使用者的 GitHub 帳戶。")]
public static async Task<string> ConnectGitHub(
    IMcpServer server,
    IOAuthService oauth,
    CancellationToken ct)
{
    var elicitationId = Guid.NewGuid().ToString();
    var authUrl = oauth.BuildAuthorizationUrl(state: elicitationId);

    var result = await server.ElicitAsync(new ElicitRequestParams
    {
        Mode = "url",
        ElicitationId = elicitationId,
        Url = authUrl,
        Message = "請在剛開啟的瀏覽器視窗中授權存取 GitHub。"
    }, ct);

    if (result.Action != "accept")
        return "授權已取消。";

    // 使用者已返回。透過 elicitationId 尋找保存的權杖 (token)。
    var token = await oauth.GetTokenByStateAsync(elicitationId, ct);
    return token is not null ? "已連線。" : "授權未完成。";
}
```

### `UrlElicitationRequiredException`

當工具因授權而受**阻斷** (而非引導使用者完成流程) 時，請擲回 `UrlElicitationRequiredException`。用戶端會向使用者呈現該 URL，且呼叫會完全失敗。這對於「授權後重試」模式非常有用：

```csharp
if (!oauth.HasValidToken)
{
    var id = Guid.NewGuid().ToString();
    throw new UrlElicitationRequiredException(
        "Authorization required",
        new[]
        {
            new ElicitRequestParams
            {
                Mode = "url",
                ElicitationId = id,
                Url = oauth.BuildAuthorizationUrl(state: id),
                Message = "請登入以繼續。"
            }
        });
}
```

## 何時不應使用引導

- **LLM 可以用自然語言詢問的簡單確認。** 如果您可以在工具的說明字串 (docstring) 中加入「我應該執行 X 嗎？」，並讓 LLM 來詢問，這比強制回應表單的摩擦力更小。
- **LLM 應該進行推理的分支。** 不要用表單取代 LLM 的判斷 — 僅針對 LLM 字面上無法決定的事物進行引導 (例如使用者祕密、即時同意、從僅使用者知道的列表中進行挑選)。
- **無狀態部署。** 無法運作 — 請參閱上述前提條件。

## 用戶端能力檢查

不要盲目地呼叫 `ElicitAsync`。請先檢查：

```csharp
if (server.ClientCapabilities?.Elicitation is null)
    return "此用戶端不支援引導；請將該值作為引數傳遞。";

var elicit = await server.ElicitAsync(...);
```

這在舊版用戶端上會優雅地降級。
