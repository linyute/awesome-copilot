# 適用於 .NET 的 Microsoft Graph SDK

當目標專案使用 C# 或其他 .NET 語言編寫時，請使用此參考。

## 權威來源

- SDK 儲存庫：<https://github.com/microsoftgraph/msgraph-sdk-dotnet>
- 範例：<https://github.com/microsoftgraph/msgraph-training-dotnet>
- SDK 變更記錄：<https://github.com/microsoftgraph/msgraph-sdk-dotnet/blob/main/CHANGELOG.md>

## 套件

```xml
<!-- Microsoft Graph SDK v5 (目前版本) -->
<PackageReference Include="Microsoft.Graph" Version="5.*" />

<!-- 用於認證提供者的 Azure Identity -->
<PackageReference Include="Azure.Identity" Version="1.*" />
```

透過 CLI 安裝：
```bash
dotnet add package Microsoft.Graph
dotnet add package Azure.Identity
```

## 用戶端設定

### 受控識別 (Azure 託管應用程式 — 偏好使用)

```csharp
using Azure.Identity;
using Microsoft.Graph;

var credential = new DefaultAzureCredential();
var graphClient = new GraphServiceClient(credential);
```

### 用戶端認證 (僅限應用程式 / 精靈)

```csharp
var credential = new ClientSecretCredential(
    tenantId: Environment.GetEnvironmentVariable("AZURE_TENANT_ID"),
    clientId: Environment.GetEnvironmentVariable("AZURE_CLIENT_ID"),
    clientSecret: Environment.GetEnvironmentVariable("AZURE_CLIENT_SECRET")
);
var graphClient = new GraphServiceClient(credential);
```

在生產環境中，偏好使用 `ClientCertificateCredential` 而非 `ClientSecretCredential`。

### 代理 (On-Behalf-Of, OBO) — 代表已登入使用者的代理程式 / API

```csharp
// incomingToken 是從呼叫者收到的載體權杖 (Bearer Token)
var credential = new OnBehalfOfCredential(
    tenantId: Environment.GetEnvironmentVariable("AZURE_TENANT_ID"),
    clientId: Environment.GetEnvironmentVariable("AZURE_CLIENT_ID"),
    clientSecret: Environment.GetEnvironmentVariable("AZURE_CLIENT_SECRET"),
    userAssertion: new UserAssertion(incomingToken)
);
var graphClient = new GraphServiceClient(credential);
```

### 互動式 (本機開發 / CLI)

```csharp
var credential = new InteractiveBrowserCredential();
var graphClient = new GraphServiceClient(credential);
```

## 常見呼叫模式

### 取得具有欄位選擇的資源

```csharp
var user = await graphClient.Me.GetAsync(config =>
{
    config.QueryParameters.Select = ["displayName", "mail", "jobTitle"];
});
```

### 具有過濾和選擇的清單

```csharp
var messages = await graphClient.Me.Messages.GetAsync(config =>
{
    config.QueryParameters.Filter = "isRead eq false";
    config.QueryParameters.Select = ["subject", "from", "receivedDateTime"];
    config.QueryParameters.Top = 25;
    config.QueryParameters.Orderby = ["receivedDateTime desc"];
});
```

### 使用 PageIterator 進行分頁

```csharp
var messages = await graphClient.Me.Messages.GetAsync();

var allMessages = new List<Message>();
var pageIterator = PageIterator<Message, MessageCollectionResponse>
    .CreatePageIterator(graphClient, messages, (msg) =>
    {
        allMessages.Add(msg);
        return true; // 回傳 false 以提早停止
    });

await pageIterator.IterateAsync();
```

### 傳送電子郵件

```csharp
await graphClient.Me.SendMail.PostAsync(new SendMailPostRequestBody
{
    Message = new Message
    {
        Subject = "來自 Graph 的問候",
        Body = new ItemBody { ContentType = BodyType.Text, Content = "測試訊息" },
        ToRecipients = [new Recipient { EmailAddress = new EmailAddress { Address = "user@contoso.com" } }]
    }
});
```

### 發布 Teams 頻道訊息

```csharp
await graphClient.Teams[teamId].Channels[channelId].Messages.PostAsync(new ChatMessage
{
    Body = new ItemBody { ContentType = BodyType.Html, Content = "<b>來自 Graph 的問候！</b>" }
});
```

## 批次要求

```csharp
using Microsoft.Graph.Models;

var batchRequestContent = new BatchRequestContentCollection(graphClient);

var meRequest = await batchRequestContent.AddBatchRequestStepAsync(
    graphClient.Me.ToGetRequestInformation());
var messagesRequest = await batchRequestContent.AddBatchRequestStepAsync(
    graphClient.Me.Messages.ToGetRequestInformation());

var batchResponse = await graphClient.Batch.PostAsync(batchRequestContent);

var me = await batchResponse.GetResponseByIdAsync<User>(meRequest);
var msgs = await batchResponse.GetResponseByIdAsync<MessageCollectionResponse>(messagesRequest);
```

## 差異查詢 (Delta queries)

```csharp
// 第一次同步 — 取得所有內容 + deltaLink
var deltaResponse = await graphClient.Users.Delta.GetAsDeltaGetResponseAsync();
string? deltaLink = null;

var pageIterator = PageIterator<User, Microsoft.Graph.Users.Delta.DeltaGetResponse>
    .CreatePageIterator(graphClient, deltaResponse, (user) => { /* 處理 */ return true; },
        (req) => { deltaLink = /* 從回應中擷取 */; return req; });

await pageIterator.IterateAsync();
// 儲存 deltaLink 以供下次執行使用

// 後續同步 — 僅限變更內容
// 直接使用儲存的 deltaLink 作為下一個要求 URL
```

## 節流 / 重試中介軟體

SDK 內建重試中介軟體並預設啟用。若要進行明確控制：

```csharp
var handlers = GraphClientFactory.CreateDefaultHandlers();
// 已包含 RetryHandler；視需要設定最大重試次數
var httpClient = GraphClientFactory.Create(handlers);
var graphClient = new GraphServiceClient(httpClient, credential);
```

如果建構自訂重試邏輯，務必檢查 `Retry-After` — 不要使用固定的指數退避。

## 相依性注入 (ASP.NET Core / .NET Worker)

```csharp
// Program.cs
builder.Services.AddSingleton<GraphServiceClient>(_ =>
{
    var credential = new DefaultAzureCredential();
    return new GraphServiceClient(credential);
});
```

## .NET 特定指引

- 針對新專案，目標設定為 .NET 8+。
- 全程使用 `async`/`await` — 所有 Graph SDK 呼叫均為非同步。
- 將 `GraphServiceClient` 註冊為單例 (Singleton)（它在內部快取權杖）。
- 使用 `ILogger` 記錄 Graph 異常 — 捕捉 `ODataError` 以取得 Graph 特定的錯誤詳細資訊。
- 對於使用 OBO 的 ASP.NET Core API，請從 `IHttpContextAccessor` 插入傳入的權杖，並為每個要求建構認證（不要作為單例）。

```csharp
// 捕捉 Graph 錯誤
try
{
    var user = await graphClient.Me.GetAsync();
}
catch (ODataError odataError)
{
    Console.WriteLine($"Graph 錯誤：{odataError.Error?.Code} - {odataError.Error?.Message}");
}
```
