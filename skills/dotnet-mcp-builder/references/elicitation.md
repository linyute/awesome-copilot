# Elicitation (引導/向使用者提問)

Elicitation 允許工具在**執行途中透過用戶端向使用者請求輸入**。LLM 看不到該問題；用戶端會直接向使用者呈現該問題。這將單次工具呼叫轉變為互動式流程 — 收集確認、遺漏的參數、認證資訊 (URL 模式) 等。

> **規格版本：** 截至 2026-07-28 有效（elicitation *不*屬於 v2 棄用項目 — sampling/roots/logging 才是）。URL 模式是較新的新增功能（最初 2025-06-18 僅有表單模式）。

> **2026-07-28 變更了 HTTP 上的規則。** 目前修訂版移除了 HTTP 工作階段和伺服器→用戶端的 `elicitation/create` 請求，因此 **`ElicitAsync` 完全無法在 2026-07-28 Streamable HTTP 上使用** — 設定 `Stateless = false` 的伺服器會拒絕該修訂版，並透過舊版 `initialize` 後備機制服務用戶端。目前通訊協定在工具執行途中提問的方法是**多來回模式 (multi-round-trip pattern)**：從工具擲出 `InputRequiredException`（使用 `InputRequest.ForElicitation(...)` 建構請求），並在用戶端重試呼叫時將 `context.Params.InputResponses` 作為 `ElicitResult` 讀回。它適用於兩種通訊協定修訂版和兩種工作階段模式，包括完全無狀態的 HTTP。下方的 `ElicitAsync` 指引適用於 **STDIO 和舊版具狀態 HTTP** — 請參閱 [SDK elicitation 文件](https://csharp.sdk.modelcontextprotocol.io/v2/concepts/elicitation/elicitation.html)以取得完整的 MRTR 模式。

## 兩種模式

| 模式 | 作用 | 何時使用 |
|---|---|---|
| **表單 (帶內, in-band)** | 伺服器傳送 JSON Schema；用戶端轉譯表單；使用者透過相同的 MCP 通道送回數值。 | 確認、遺漏的參數、結構化選擇。 |
| **URL (帶外, out-of-band)** | 伺服器傳送 URL；用戶端在瀏覽器中開啟；使用者在該處完成流程；伺服器分開檢查狀態。 | OAuth、付款、任何 MCP 通道不可見的內容。 |

## `ElicitAsync` 的先決條件：具狀態傳輸（舊版修訂版）

`ElicitAsync` 要求伺服器*向*用戶端傳送請求並等待回應。這僅適用於：
- STDIO（一律支援）。
- 具狀態 HTTP (`options.Stateless = false`) — 在 2.x 上，這代表處於支援 initialize 修訂版的舊版用戶端（請參閱上方橫幅）。

在無狀態 HTTP 中（包括所有 2026-07-28 Streamable HTTP），`ElicitAsync` 會擲出例外狀況 (`InvalidOperationException`)：因為沒有傳輸通道可以回傳。請改用多來回 `InputRequiredException` 模式。

## 表單模式 — 完整範例

```csharp
using System.ComponentModel;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

[McpServerToolType]
public class BookingTools
{
    [McpServerTool, Description("預訂會議室。向使用者要求確認。")]
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
                        Description = "預訂的選用備註"
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

### Schema 原始型別

你可以使用以下型別建構 `RequestedSchema`：

| 型別 | C# 類別 | 備註 |
|---|---|---|
| 字串 (String) | `StringSchema` | `Default`、`Description`。若需要可在伺服器端新增 JSON-Schema 驗證。 |
| 數值 (Number) | `NumberSchema` | 用於整數和浮點數。 |
| 布林值 (Boolean) | `BooleanSchema` | 轉譯為核取方塊 / 切換開關。 |
| 單選列舉（無標題） | `UntitledSingleSelectEnumSchema` | 數值清單；用戶端轉譯為下拉選單/選項按鈕。 |
| 單選列舉（有標題） | `TitledSingleSelectEnumSchema` | 每個數值都有顯示標題。 |
| 多選列舉 | `UntitledMultiSelectEnumSchema` / `TitledMultiSelectEnumSchema` | 多選下拉選單 / 核取方塊群組。 |

每個型別皆接受 `Description` 和 `Default`。

### 回應結構

`ElicitResult`：
- `Action` — `"accept"`、`"reject"` 或 `"cancel"`。一律先檢查此項目。
- `Content` — 包含使用者提交值的 `Dictionary<string, JsonElement>?`。若使用者拒絕/取消則為 `null`。

一律處理非 accept 路徑：

```csharp
if (elicit.Action == "cancel")
    return "使用者已取消。未進行任何變更。";
if (elicit.Action == "reject")
    return "使用者已拒絕。";
// Action == "accept" → 可以安全讀取 elicit.Content
```

## URL 模式 — 完整範例

URL 模式適用於使用者必須在 MCP 通道**之外**完成某些操作的流程 — 通常是 OAuth。

```csharp
[McpServerTool, Description("連線使用者的 GitHub 帳戶。")]
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

    // 使用者已返回。透過 elicitationId 查詢持久化的權杖。
    var token = await oauth.GetTokenByStateAsync(elicitationId, ct);
    return token is not null ? "已連線。" : "授權未完成。";
}
```

### `UrlElicitationRequiredException`

當工具因驗證而**受阻**（而非引導使用者完成驗證）時，請擲出 `UrlElicitationRequiredException`。用戶端會向使用者呈現 URL，且呼叫乾淨地失敗。適用於 auth 後重試模式：

```csharp
if (!oauth.HasValidToken)
{
    var id = Guid.NewGuid().ToString();
    throw new UrlElicitationRequiredException(
        "需要授權",
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

## 何時不要使用 Elicitation

- **LLM 可以用自然語言詢問的微小確認。** 如果你可以在工具的 docstring 中表達「我應該執行 X 嗎？」並讓 LLM 詢問，這比強制回應表單摩擦力更低。
- **LLM 應該進行推理的分支。** 不要用表單取代 LLM 的判斷 — 僅在 LLM 確實無法決定的事項上進行 elicit（使用者機密、即時同意、從只有使用者知道的清單中挑選）。
- **無狀態部署。** 無法運作 — 請參閱上方的先決條件。

## 用戶端功能檢查

不要盲目呼叫 `ElicitAsync`。請先檢查：

```csharp
if (server.ClientCapabilities?.Elicitation is null)
    return "此用戶端不支援 elicitation；請將數值作為引數傳遞。";

var elicit = await server.ElicitAsync(...);
```

這可在較舊的用戶端上平準降級。
