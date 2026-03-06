# 工作階段持續性與恢復

跨應用程式重新啟動儲存並還原對話工作階段。

## 範例場景

您希望使用者即使在關閉並重新開啟您的應用程式後，仍能繼續對話。

> **可執行範例：** [recipe/persisting-sessions.ts](recipe/persisting-sessions.ts)
>
> ```bash
> cd recipe && npm install
> npx tsx persisting-sessions.ts
> # 或：npm run persisting-sessions
> ```

### 使用自定義 ID 建立工作階段

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();

// 使用易記的 ID 建立工作階段
const session = await client.createSession({
    sessionId: "user-123-conversation",
    model: "gpt-5",
});

await session.sendAndWait({ prompt: "讓我們討論 TypeScript 泛型" });

// 工作階段 ID 會被保留
console.log(session.sessionId); // "user-123-conversation"

// 終止工作階段但將資料保留在磁碟上
await session.destroy();
await client.stop();
```

### 恢復工作階段

```typescript
const client = new CopilotClient();
await client.start();

// 恢復先前的工作階段
const session = await client.resumeSession("user-123-conversation");

// 先前的內容已還原
await session.sendAndWait({ prompt: "我們剛才在討論什麼？" });
// AI 記得關於 TypeScript 泛型的討論

await session.destroy();
await client.stop();
```

### 列出可用的工作階段

```typescript
const sessions = await client.listSessions();
console.log(sessions);
// [
//   { sessionId: "user-123-conversation", ... },
//   { sessionId: "user-456-conversation", ... },
// ]
```

### 永久刪除工作階段

```typescript
// 從磁碟中移除工作階段及其所有資料
await client.deleteSession("user-123-conversation");
```

## 獲取工作階段歷程記錄

擷取工作階段中的所有訊息：

```typescript
const messages = await session.getMessages();
for (const msg of messages) {
    console.log(`[${msg.type}]`, msg.data);
}
```

## 最佳實踐

1. **使用具意義的工作階段 ID**：在工作階段 ID 中包含使用者 ID 或內容
2. **處理缺失的工作階段**：在恢復之前檢查工作階段是否存在
3. **清理舊的工作階段**：定期刪除不再需要的工作階段
