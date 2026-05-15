# 適用於 TypeScript / JavaScript 的 Microsoft Graph SDK

當目標專案使用 TypeScript 或 JavaScript（Node.js 或瀏覽器）編寫時，請使用此參考。

## 權威來源

- SDK 儲存庫：<https://github.com/microsoftgraph/msgraph-sdk-javascript>
- 範例：<https://github.com/microsoftgraph/msgraph-training-typescript>
- SDK 變更記錄：<https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/main/CHANGELOG.md>

## 套件

```bash
npm install @microsoft/microsoft-graph-client @azure/identity
npm install -D @microsoft/microsoft-graph-types   # TypeScript 型別定義
```

對於 Node.js 環境，也請安裝 fetch polyfill：

```bash
npm install node-fetch
```

## 用戶端設定

### 受控識別 (Azure 託管應用程式 — 偏好使用)

```typescript
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ["https://graph.microsoft.com/.default"],
});

const graphClient = Client.initWithMiddleware({ authProvider });
```

### 用戶端認證 (僅限應用程式 / 精靈)

```typescript
import { ClientSecretCredential } from "@azure/identity";

const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ["https://graph.microsoft.com/.default"],
});

const graphClient = Client.initWithMiddleware({ authProvider });
```

### 代理 (On-Behalf-Of, OBO) — 代表已登入使用者的代理程式 / API

```typescript
import { OnBehalfOfCredential } from "@azure/identity";

// incomingToken 是從呼叫者收到的載體權杖 (Bearer Token) (例如：來自 req.headers.authorization)
const credential = new OnBehalfOfCredential({
  tenantId: process.env.AZURE_TENANT_ID!,
  clientId: process.env.AZURE_CLIENT_ID!,
  clientSecret: process.env.AZURE_CLIENT_SECRET!,
  userAssertionToken: incomingToken,
});

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ["https://graph.microsoft.com/.default"],
});

const graphClient = Client.initWithMiddleware({ authProvider });
```

對於 OBO，請為每個要求建立一個新的用戶端（認證是針對使用者範圍的，不適合以單例模式安全使用）。

### 互動式 (本機開發 / CLI — Node.js)

當瀏覽器可用時，使用 `InteractiveBrowserCredential`。對於無介面環境（SSH、CI 相關、WSL），使用 `DeviceCodeCredential`：

```typescript
import { InteractiveBrowserCredential, DeviceCodeCredential } from "@azure/identity";

// 開啟瀏覽器分頁 — 需要在應用程式註冊中將重新導向 URI 設定為 http://localhost
const credential = new InteractiveBrowserCredential({
  tenantId: process.env.AZURE_TENANT_ID!,
  clientId: process.env.AZURE_CLIENT_ID!,
});

// 在終端機印出裝置代碼 — 適用於任何環境
const credential = new DeviceCodeCredential({
  tenantId: process.env.AZURE_TENANT_ID!,
  clientId: process.env.AZURE_CLIENT_ID!,
  userPromptCallback: (info) => console.log(info.message),
});
```

兩者都需要將應用程式註冊平台設定為 **"Mobile and desktop applications"**。兩者都不使用用戶端密鑰。

## 常見呼叫模式

### 取得具有欄位選擇的資源

```typescript
import { User } from "@microsoft/microsoft-graph-types";

const user: User = await graphClient
  .api("/me")
  .select("displayName,mail,jobTitle")
  .get();
```

### 具有過濾、選擇和排序的清單

```typescript
const result = await graphClient
  .api("/me/messages")
  .filter("isRead eq false")
  .select("subject,from,receivedDateTime")
  .top(25)
  .orderby("receivedDateTime desc")
  .get();
```

### 使用 PageIterator 進行分頁

```typescript
import { PageIterator } from "@microsoft/microsoft-graph-client";
import { Message } from "@microsoft/microsoft-graph-types";

const firstPage = await graphClient.api("/me/messages").top(25).get();

const allMessages: Message[] = [];

const pageIterator = new PageIterator(
  graphClient,
  firstPage,
  (message: Message) => {
    allMessages.push(message);
    return true; // 回傳 false 以提早停止
  }
);

await pageIterator.iterate();
```

### 傳送電子郵件

```typescript
await graphClient.api("/me/sendMail").post({
  message: {
    subject: "來自 Graph 的問候",
    body: { contentType: "Text", content: "測試訊息" },
    toRecipients: [{ emailAddress: { address: "user@contoso.com" } }],
  },
});
```

### 發布 Teams 頻道訊息

```typescript
await graphClient.api(`/teams/${teamId}/channels/${channelId}/messages`).post({
  body: { contentType: "html", content: "<b>來自 Graph 的問候！</b>" },
});
```

### 上傳檔案到 OneDrive (4 MB 以下的小檔案)

```typescript
const content = Buffer.from("檔案內容");
await graphClient
  .api(`/me/drive/root:/${fileName}:/content`)
  .putStream(content);
```

對於大於 4 MB 的檔案，請使用上傳工作階段 (`createUploadSession`)。

## 批次要求

```typescript
const batchRequestBody = {
  requests: [
    { id: "1", method: "GET", url: "/me" },
    { id: "2", method: "GET", url: "/me/messages?$top=5&$select=subject" },
  ],
};

const batchResponse = await graphClient.api("/$batch").post(batchRequestBody);

const meResponse = batchResponse.responses.find((r: any) => r.id === "1");
const messagesResponse = batchResponse.responses.find((r: any) => r.id === "2");
```

## 差異查詢 (Delta queries)

```typescript
// 第一次同步
let response = await graphClient.api("/users/delta").get();
const users: any[] = [];

while (response["@odata.nextLink"]) {
  users.push(...response.value);
  response = await graphClient.api(response["@odata.nextLink"]).get();
}
users.push(...response.value);

const deltaLink: string = response["@odata.deltaLink"];
// 在同步執行之間持久儲存 deltaLink

// 下一次同步 — 僅限變更內容
const changesResponse = await graphClient.api(deltaLink).get();
```

## 節流 / 重試中介軟體

SDK 預設包含重試中介軟體。若要進行明確配置：

```typescript
import {
  Client,
  RetryHandlerOptions,
  RetryHandler,
  MiddlewareFactory,
} from "@microsoft/microsoft-graph-client";

const retryOptions = new RetryHandlerOptions({ maxRetries: 5 });
const middleware = MiddlewareFactory.getDefaultMiddlewareChain(authProvider);

const graphClient = Client.initWithMiddleware({ middleware });
```

務必遵守 `Retry-After` 標頭值 — 當 Graph 指定等待時間時，不要使用固定的退避時間。

## TypeScript 特定指引

- 從 `@microsoft/microsoft-graph-types` 匯入型別，以獲得 Graph 資源的完整 IntelliSense。
- `.api()` 鏈結傳回 `any` — 請從 `@microsoft/microsoft-graph-types` 轉型為適當的型別。
- 對於 ESM 專案，在深層匯入的路徑後綴加上 `/index.js`（例如：`azureTokenCredentials/index.js`）。
- 一致地使用 `async`/`await` — 所有 Graph 呼叫都傳回 Promise。
- 在應用程式層級的程式碼（例如 Express 應用程式初始化）中將 `graphClient` 單例化；對於 OBO 流程，請針對每個要求建構。
- 在 Node.js 18+ 中，原生提供 `fetch` — 不需要 polyfill。

```typescript
// 型別安全的回應範例
import { MessageCollectionResponse } from "@microsoft/microsoft-graph-types";

const response: MessageCollectionResponse = await graphClient
  .api("/me/messages")
  .select("subject,from")
  .get();

const messages = response.value ?? [];
```
