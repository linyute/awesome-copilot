# 使用多個工作階段

同時管理多個獨立的對話。

> **可執行範例：** [recipe/multiple-sessions.ts](recipe/multiple-sessions.ts)
>
> ```bash
> cd recipe && npm install
> npx tsx multiple-sessions.ts
> # 或：npm run multiple-sessions
> ```

## 範例場景

您需要同時執行多個對話，每個對話都有其自己的內容與歷程記錄。

## Node.js

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();

// 建立多個獨立的工作階段
const session1 = await client.createSession({ model: "gpt-5" });
const session2 = await client.createSession({ model: "gpt-5" });
const session3 = await client.createSession({ model: "claude-sonnet-4.5" });

// 每個工作階段都維護自己的對話歷程記錄
await session1.sendAndWait({ prompt: "您正在協助處理一個 Python 專案" });
await session2.sendAndWait({ prompt: "您正在協助處理一個 TypeScript 專案" });
await session3.sendAndWait({ prompt: "您正在協助處理一個 Go 專案" });

// 後續訊息會保留在各自的內容中
await session1.sendAndWait({ prompt: "如何建立虛擬環境？" });
await session2.sendAndWait({ prompt: "如何設定 tsconfig？" });
await session3.sendAndWait({ prompt: "如何初始化模組？" });

// 清理所有工作階段
await session1.destroy();
await session2.destroy();
await session3.destroy();
await client.stop();
```

## 自定義工作階段 ID

使用自定義 ID 以便於追蹤：

```typescript
const session = await client.createSession({
    sessionId: "user-123-chat",
    model: "gpt-5",
});

console.log(session.sessionId); // "user-123-chat"
```

## 列出工作階段

```typescript
const sessions = await client.listSessions();
console.log(sessions);
// [{ sessionId: "user-123-chat", ... }, ...]
```

## 刪除工作階段

```typescript
// 刪除特定的工作階段
await client.deleteSession("user-123-chat");
```

## 使用案例

- **多使用者應用程式**：每個使用者一個工作階段
- **多任務工作流**：針對不同任務使用獨立的工作階段
- **A/B 測試**：比較來自不同模型的回應
