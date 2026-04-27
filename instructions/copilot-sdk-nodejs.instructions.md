---
applyTo: "**.ts, **.js, package.json"
description: "使用 GitHub Copilot SDK 建構 Node.js/TypeScript 應用程式指南"
name: "GitHub Copilot SDK Node.js 指令"
---

## 核心原則

- SDK 處於技術預覽階段，可能會發生重大變更
- 需要 Node.js 18.0 或更高版本
- 需要安裝 GitHub Copilot CLI 並加入 PATH
- 使用 TypeScript 建構以提供型別安全
- 全程使用 async/await 模式
- 提供完整的 TypeScript 型別定義

## 安裝

請始終透過 npm/pnpm/yarn 安裝：

```bash
npm install @github/copilot-sdk
# 或
pnpm add @github/copilot-sdk
# 或
yarn add @github/copilot-sdk
```

## 客戶端初始化

### 基本客戶端設定

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();
// 使用 client...
await client.stop();
```

### 客戶端設定選項

建立 CopilotClient 時，請使用 `CopilotClientOptions`：

- `cliPath` - CLI 可執行檔路徑 (預設：PATH 中的 "copilot")
- `cliArgs` - 在 SDK 管理的旗標之前加入的額外引數 (string[])
- `cliUrl` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。若提供，客戶端將不會 spawn 處理序
- `port` - 伺服器連接埠 (預設：0 為隨機)
- `useStdio` - 使用 stdio 傳輸而非 TCP (預設：true)
- `logLevel` - 日誌層級 (預設："debug")
- `autoStart` - 自動啟動伺服器 (預設：true)
- `autoRestart` - 當損毀時自動重新啟動 (預設：true)
- `cwd` - CLI 處理序的工作目錄 (預設：process.cwd())
- `env` - CLI 處理序的環境變數 (預設：process.env)

### 手動伺服器控制

若需明確控制：

```typescript
const client = new CopilotClient({ autoStart: false });
await client.start();
// 使用 client...
await client.stop();
```

當 `stop()` 耗時過長時，請使用 `forceStop()`。

## 會話管理 (Session Management)

### 建立會話

使用 `SessionConfig` 進行設定：

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
    streaming: true,
    tools: [...],
    systemMessage: { ... },
    availableTools: ["tool1", "tool2"],
    excludedTools: ["tool3"],
    provider: { ... }
});
```

### 會話設定選項

- `sessionId` - 自訂會話 ID (string)
- `model` - 模型名稱 ("gpt-5", "claude-sonnet-4.5" 等)
- `tools` - 公開給 CLI 的自訂工具 (Tool[])
- `systemMessage` - 系統訊息自訂 (SystemMessageConfig)
- `availableTools` - 工具名稱允許清單 (string[])
- `excludedTools` - 工具名稱排除清單 (string[])
- `provider` - 自訂 API 提供者設定 (BYOK) (ProviderConfig)
- `streaming` - 啟用串流回應區塊 (boolean)
- `mcpServers` - MCP 伺服器設定 (MCPServerConfig[])
- `customAgents` - 自訂代理設定 (CustomAgentConfig[])
- `configDir` - 設定目錄覆寫 (string)
- `skillDirectories` - 技能目錄 (string[])
- `disabledSkills` - 已停用技能 (string[])
- `onPermissionRequest` - 權限要求處理常式 (PermissionHandler)

### 恢復會話

```typescript
const session = await client.resumeSession("session-id", {
  tools: [myNewTool],
  onPermissionRequest: approveAll,
});
```

### 會話操作

- `session.sessionId` - 取得會話識別碼 (string)
- `await session.send({ prompt: "...", attachments: [...] })` - 傳送訊息，回傳 Promise<string>
- `await session.sendAndWait({ prompt: "..." }, timeout)` - 傳送並等待閒置，回傳 Promise<AssistantMessageEvent | null>
- `await session.abort()` - 中止目前處理
- `await session.getMessages()` - 取得所有事件/訊息，回傳 Promise<SessionEvent[]>
- `await session.destroy()` - 清理會話

## 事件處理

### 事件訂閱模式

ALWAYS 使用 async/await 或 Promises 來等待會話事件：

```typescript
await new Promise<void>((resolve) => {
  session.on((event) => {
    if (event.type === "assistant.message") {
      console.log(event.data.content);
    } else if (event.type === "session.idle") {
      resolve();
    }
  });

  session.send({ prompt: "..." });
});
```

### 取消訂閱事件

`on()` 方法回傳一個取消訂閱的函式：

```typescript
const unsubscribe = session.on((event) => {
  // 處理常式
});
// 稍後...
unsubscribe();
```

### 事件類型

使用區分聯集 (discriminated unions) 與型別防護 (type guards) 來處理事件：

```typescript
session.on((event) => {
  switch (event.type) {
    case "user.message":
      // 處理使用者訊息
      break;
    case "assistant.message":
      console.log(event.data.content);
      break;
    case "tool.executionStart":
      // 工具執行開始
      break;
    case "tool.executionComplete":
      // 工具執行完成
      break;
    case "session.start":
      // 會話開始
      break;
    case "session.idle":
      // 會話閒置 (處理完成)
      break;
    case "session.error":
      console.error(`錯誤: ${event.data.message}`);
      break;
  }
});
```

## 串流回應 (Streaming Responses)

### 啟用串流

在 SessionConfig 中設定 `streaming: true`：

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
    streaming: true,
});
```

### 處理串流事件

處理 delta 事件 (增量) 與最終事件：

```typescript
await new Promise<void>((resolve) => {
  session.on((event) => {
    switch (event.type) {
      case "assistant.message_delta":
        // 增量文字區塊
        process.stdout.write(event.data.deltaContent);
        break;
      case "assistant.reasoning_delta":
        // 增量推理區塊 (視模型而定)
        process.stdout.write(event.data.deltaContent);
        break;
      case "assistant.message":
        // 最終完整訊息
        console.log("\n--- 最終 ---");
        console.log(event.data.content);
        break;
      case "assistant.reasoning":
        // 最終推理內容
        console.log("--- 推理 ---");
        console.log(event.data.content);
        break;
      case "session.idle":
        resolve();
        break;
    }
  });

  session.send({ prompt: "給我一個故事" });
});
```

注意：無論是否啟用串流，都會傳送最終事件 (`assistant.message`, `assistant.reasoning`)。

## 自訂工具

### 使用 defineTool 定義工具

使用 `defineTool` 進行型別安全工具定義：

```typescript
import { defineTool } from "@github/copilot-sdk";

const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
  tools: [
    defineTool({
      name: "lookup_issue",
      description: "從追蹤器擷取問題詳細資料",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "問題 ID" },
        },
        required: ["id"],
      },
      handler: async (args) => {
        const issue = await fetchIssue(args.id);
        return issue;
      },
    }),
  ],
});
```

### 使用 Zod 定義參數

SDK 支援 Zod 結構定義參數：

```typescript
import { z } from "zod";

const session = await client.createSession({
    onPermissionRequest: approveAll,
  tools: [
    defineTool({
      name: "get_weather",
      description: "取得地點的天氣",
      parameters: z.object({
        location: z.string().describe("城市名稱"),
        units: z.enum(["celsius", "fahrenheit"]).optional(),
      }),
      handler: async (args) => {
        return { temperature: 72, units: args.units || "fahrenheit" };
      },
    }),
  ],
});
```

### 工具回傳型別

- 回傳任何 JSON 可序列化值 (自動包裝)
- 或回傳 `ToolResultObject` 以完全控制中繼資料：

```typescript
{
    textResultForLlm: string;  // 顯示給 LLM 的結果
    resultType: "success" | "failure";
    error?: string;  // 內部錯誤 (不會顯示給 LLM)
    toolTelemetry?: Record<string, unknown>;
}
```

### 工具執行流程

當 Copilot 呼叫工具時，客戶端會自動：

1. 執行你的處理常式函式
2. 序列化回傳值
3. 回應 CLI

## 系統訊息自訂 (System Message Customization)

### 追加模式 (Append Mode，預設 — 保留安全護欄)

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
  systemMessage: {
    mode: "append",
    content: `
<workflow_rules>
- 務必檢查安全漏洞
- 若適用，請建議效能改進
</workflow_rules>
`,
  },
});
```

### 取代模式 (Replace Mode，完全控制 — 移除安全護欄)

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
  systemMessage: {
    mode: "replace",
    content: "你是一個有用的助理。",
  },
});
```

## 檔案附件

將檔案附加至訊息：

```typescript
await session.send({
  prompt: "分析此檔案",
  attachments: [
    {
      type: "file",
      path: "/path/to/file.ts",
      displayName: "我的檔案",
    },
  ],
});
```

## 訊息傳送模式

在訊息選項中使用 `mode` 屬性：

- `"enqueue"` - 將訊息排入處理佇列
- `"immediate"` - 立即處理訊息

```typescript
await session.send({
  prompt: "...",
  mode: "enqueue",
});
```

## 多重會話

會話彼此獨立，可並行執行：

```typescript
const session1 = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
});
const session2 = await client.createSession({
    onPermissionRequest: approveAll,
    model: "claude-sonnet-4.5",
});

await Promise.all([
  session1.send({ prompt: "來自會話 1 的問候" }),
  session2.send({ prompt: "來自會話 2 的問候" }),
]);
```

## 自帶金鑰 (BYOK)

透過 `provider` 使用自訂 API 提供者：

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
  provider: {
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "your-api-key",
  },
});
```

## 會話生命週期管理

### 列出會話

```typescript
const sessions = await client.listSessions();
for (const metadata of sessions) {
  console.log(`${metadata.sessionId}: ${metadata.summary}`);
}
```

### 刪除會話

```typescript
await client.deleteSession(sessionId);
```

### 取得最後會話 ID

```typescript
const lastId = await client.getLastSessionId();
if (lastId) {
  const session = await client.resumeSession(lastId, { onPermissionRequest: approveAll });
}
```

### 檢查連線狀態

```typescript
const state = client.getState();
// 回傳: "disconnected" | "connecting" | "connected" | "error"
```

## 錯誤處理

### 標準異常處理

```typescript
try {
  const session = await client.createSession({ onPermissionRequest: approveAll });
  await session.send({ prompt: "Hello" });
} catch (error) {
  console.error(`錯誤: ${error.message}`);
}
```

### 會話錯誤事件

監控 `session.error` 事件型別以處理執行階段錯誤：

```typescript
session.on((event) => {
  if (event.type === "session.error") {
    console.error(`會話錯誤: ${event.data.message}`);
  }
});
```

## 連線測試

使用 ping 驗證伺服器連線能力：

```typescript
const response = await client.ping("health check");
console.log(`伺服器回應於 ${new Date(response.timestamp)}`);
```

## 資源清理

### 使用 Try-Finally 自動清理

ALWAYS 使用 try-finally 或在 finally 區塊中清理：

```typescript
const client = new CopilotClient();
try {
  await client.start();
  const session = await client.createSession({ onPermissionRequest: approveAll });
  try {
    // 使用 session...
  } finally {
    await session.destroy();
  }
} finally {
  await client.stop();
}
```

### 清理函式模式

```typescript
async function withClient<T>(
  fn: (client: CopilotClient) => Promise<T>,
): Promise<T> {
  const client = new CopilotClient();
  try {
    await client.start();
    return await fn(client);
  } finally {
    await client.stop();
  }
}

async function withSession<T>(
  client: CopilotClient,
  fn: (session: CopilotSession) => Promise<T>,
): Promise<T> {
  const session = await client.createSession({ onPermissionRequest: approveAll });
  try {
    return await fn(session);
  } finally {
    await session.destroy();
  }
}

// 使用方式
await withClient(async (client) => {
  await withSession(client, async (session) => {
    await session.send({ prompt: "Hello!" });
  });
});
```

## 最佳實務

1. **Always use try-finally** 進行資源清理
2. **Use Promises** 等待 session.idle 事件
3. **Handle session.error** 事件以進行穩健的錯誤處理
4. **Use type guards or switch statements** 進行事件處理
5. **Enable streaming** 以在互動情境中提供更好的 UX
6. **Use defineTool** 進行型別安全工具定義
7. **Use Zod schemas** 進行執行階段參數驗證
8. **Dispose event subscriptions** 當不再需要時
9. **Use systemMessage with mode: "append"** 以保留安全護欄
10. **Handle both delta and final events** 當啟用串流時
11. **Leverage TypeScript types** 以獲得編譯時安全

## 常見範例

### 簡單查詢-回應

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
try {
  await client.start();

  const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
  });
  try {
    await new Promise<void>((resolve) => {
      session.on((event) => {
        if (event.type === "assistant.message") {
          console.log(event.data.content);
        } else if (event.type === "session.idle") {
          resolve();
        }
      });

      session.send({ prompt: "2+2 等於多少？" });
    });
  } finally {
    await session.destroy();
  }
} finally {
  await client.stop();
}
```

### 多回合對話

```typescript
const session = await client.createSession({ onPermissionRequest: approveAll });

async function sendAndWait(prompt: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const unsubscribe = session.on((event) => {
      if (event.type === "assistant.message") {
        console.log(event.data.content);
      } else if (event.type === "session.idle") {
        unsubscribe();
        resolve();
      } else if (event.type === "session.error") {
        unsubscribe();
        reject(new Error(event.data.message));
      }
    });

    session.send({ prompt });
  });
}

await sendAndWait("法國的首都是哪裡？"));
await sendAndWait("它的人口是多少？");
```

### SendAndWait 輔助函式

```typescript
// 使用內建的 sendAndWait 以簡化同步互動
const response = await session.sendAndWait({ prompt: "2+2 等於多少？" }, 60000);

if (response) {
  console.log(response.data.content);
}
```

### 具型別安全參數的工具

```typescript
import { z } from "zod";
import { defineTool } from "@github/copilot-sdk";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

const session = await client.createSession({
    onPermissionRequest: approveAll,
  tools: [
    defineTool({
      name: "get_user",
      description: "擷取使用者資訊",
      parameters: z.object({
        userId: z.string().describe("User ID"),
      }),
      handler: async (args): Promise<UserInfo> => {
        return {
          id: args.userId,
          name: "John Doe",
          email: "john@example.com",
          role: "Developer",
        };
      },
    }),
  ],
});
```

### 串流與進度

```typescript
let currentMessage = "";

const unsubscribe = session.on((event) => {
  if (event.type === "assistant.message_delta") {
    currentMessage += event.data.deltaContent;
    process.stdout.write(event.data.deltaContent);
  } else if (event.type === "assistant.message") {
    console.log("\n\n=== 完成 ===");
    console.log(`總長度：${event.data.content.length} 字元`);
  } else if (event.type === "session.idle") {
    unsubscribe();
  }
});

await session.send({ prompt: "寫一個長篇故事" });
```

### 錯誤復原

```typescript
session.on((event) => {
  if (event.type === "session.error") {
    console.error("工作階段錯誤：", event.data.message);
    // 可選地重試或處理錯誤
  }
});

try {
  await session.send({ prompt: "高風險操作" });
} catch (error) {
  // 處理傳送錯誤
  console.error("傳送失敗：", error);
}
```

## TypeScript 專屬功能

### 型別推論

```typescript
import type { SessionEvent, AssistantMessageEvent } from "@github/copilot-sdk";

session.on((event: SessionEvent) => {
  if (event.type === "assistant.message") {
    // 在這裡 TypeScript 知道 event 是 AssistantMessageEvent
    const content: string = event.data.content;
  }
});
```

### 泛型輔助函式

```typescript
async function waitForEvent<T extends SessionEvent["type"]>(
  session: CopilotSession,
  eventType: T,
): Promise<Extract<SessionEvent, { type: T }>> {
  return new Promise((resolve) => {
    const unsubscribe = session.on((event) => {
      if (event.type === eventType) {
        unsubscribe();
        resolve(event as Extract<SessionEvent, { type: T }>);
      }
    });
  });
}

// 用法
const message = await waitForEvent(session, "assistant.message");
console.log(message.data.content);
```
