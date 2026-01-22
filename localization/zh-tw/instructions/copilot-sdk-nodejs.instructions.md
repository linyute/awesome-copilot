---
applyTo: "**.ts, **.js, package.json"
description: '本檔案提供使用 GitHub Copilot SDK 建構 Node.js/TypeScript 應用程式的指引。'
name: 'GitHub Copilot SDK Node.js 指引'
---

## 核心原則

- SDK 處於技術預覽階段，可能會發生重大變更
- 需要 Node.js 18.0 或更高版本
- 需要安裝 GitHub Copilot CLI 並加入 PATH
- 使用 TypeScript 建構以確保型別安全
- 全程使用 async/await 模式
- 提供完整的 TypeScript 型別定義

## 安裝

請務必透過 npm/pnpm/yarn 安裝：

```bash
npm install @github/copilot-sdk
# 或
pnpm add @github/copilot-sdk
# 或
yarn add @github/copilot-sdk
```

## 客戶端初始化 (Client Initialization)

### 基本客戶端設定

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();
// 使用客戶端...
await client.stop();
```

### 客戶端設定選項 (Client Configuration Options)

建立 CopilotClient 時，請使用 `CopilotClientOptions`：

- `cliPath` - CLI 執行檔路徑 (預設值：從 PATH 中獲取 "copilot")
- `cliArgs` - 在 SDK 管理的旗標 (flag) 之前附加的額外引數 (string[])
- `cliUrl` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。提供此選項時，客戶端不會啟動新處理程序 (process)
- `port` - 伺服器連接埠 (預設值：0 表示隨機)
- `useStdio` - 使用 stdio 傳輸而非 TCP (預設值：true)
- `logLevel` - 記錄層級 (預設值："debug")
- `autoStart` - 自動啟動伺服器 (預設值：true)
- `autoRestart` - 當機時自動重新啟動 (預設值：true)
- `cwd` - CLI 處理程序的工作目錄 (預設值：process.cwd())
- `env` - CLI 處理程序的環境變數 (預設值：process.env)

### 手動伺服器控制

如需明確控制：

```typescript
const client = new CopilotClient({ autoStart: false });
await client.start();
// 使用客戶端...
await client.stop();
```

當 `stop()` 耗時過長時，請使用 `forceStop()`。

## 對話階段管理 (Session Management)

### 建立對話階段 (Creating Sessions)

使用 `SessionConfig` 進行設定：

```typescript
const session = await client.createSession({
    model: "gpt-5",
    streaming: true,
    tools: [...],
    systemMessage: { ... },
    availableTools: ["tool1", "tool2"],
    excludedTools: ["tool3"],
    provider: { ... }
});
```

### 對話階段設定選項 (Session Config Options)

- `sessionId` - 自訂對話階段 ID (string)
- `model` - 模型名稱 ("gpt-5", "claude-sonnet-4.5" 等)
- `tools` - 公開給 CLI 的自訂工具 (Tool[])
- `systemMessage` - 系統訊息自訂 (SystemMessageConfig)
- `availableTools` - 工具名稱白名單 (string[])
- `excludedTools` - 工具名稱黑名單 (string[])
- `provider` - 自訂 API 提供者設定 (BYOK) (ProviderConfig)
- `streaming` - 啟用串流回應區塊 (boolean)
- `mcpServers` - MCP 伺服器設定 (MCPServerConfig[])
- `customAgents` - 自訂代理人 (custom agents) 設定 (CustomAgentConfig[])
- `configDir` - 設定目錄覆蓋 (string)
- `skillDirectories` - 技能目錄 (string[])
- `disabledSkills` - 已停用的技能 (string[])
- `onPermissionRequest` - 權限請求處理常式 (PermissionHandler)

### 恢復對話階段 (Resuming Sessions)

```typescript
const session = await client.resumeSession("session-id", {
  tools: [myNewTool],
});
```

### 對話階段操作 (Session Operations)

- `session.sessionId` - 獲取對話階段識別碼 (string)
- `await session.send({ prompt: "...", attachments: [...] })` - 傳送訊息，回傳 Promise<string>
- `await session.sendAndWait({ prompt: "..." }, timeout)` - 傳送並等待閒置，回傳 Promise<AssistantMessageEvent | null>
- `await session.abort()` - 中止目前處理
- `await session.getMessages()` - 獲取所有事件/訊息，回傳 Promise<SessionEvent[]>
- `await session.destroy()` - 清理對話階段

## 事件處理 (Event Handling)

### 事件訂閱模式 (Event Subscription Pattern)

請務必使用 async/await 或 Promises 來等待對話階段事件：

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

### 取消訂閱事件 (Unsubscribing from Events)

`on()` 方法會回傳一個用於取消訂閱的函式：

```typescript
const unsubscribe = session.on((event) => {
  // 處理常式
});
// 稍後...
unsubscribe();
```

### 事件型別 (Event Types)

使用可辨識聯集 (discriminated unions) 搭配型別防護 (type guards) 來進行事件處理：

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
      // 對話階段開始
      break;
    case "session.idle":
      // 對話階段處於閒置狀態 (處理完成)
      break;
    case "session.error":
      console.error(`錯誤：${event.data.message}`);
      break;
  }
});
```

## 串流回應 (Streaming Responses)

### 啟用串流

在 SessionConfig 中設定 `streaming: true`：

```typescript
const session = await client.createSession({
  model: "gpt-5",
  streaming: true,
});
```

### 處理串流事件

同時處理增量 (delta) 事件和最終事件：

```typescript
await new Promise<void>((resolve) => {
  session.on((event) => {
    switch (event.type) {
      case "assistant.message.delta":
        // 增量文字區塊
        process.stdout.write(event.data.deltaContent);
        break;
      case "assistant.reasoning.delta":
        // 增量推論區塊 (取決於模型)
        process.stdout.write(event.data.deltaContent);
        break;
      case "assistant.message":
        // 最終完整訊息
        console.log("\n--- 最終結果 ---");
        console.log(event.data.content);
        break;
      case "assistant.reasoning":
        // 最終推論內容
        console.log("--- 推論過程 ---");
        console.log(event.data.content);
        break;
      case "session.idle":
        resolve();
        break;
    }
  });

  session.send({ prompt: "講個故事給我聽" });
});
```

注意：無論串流設定為何，一律會傳送最終事件 (`assistant.message`, `assistant.reasoning`)。

## 自訂工具 (Custom Tools)

### 使用 defineTool 定義工具

使用 `defineTool` 進行型別安全的工具定義：

```typescript
import { defineTool } from "@github/copilot-sdk";

const session = await client.createSession({
  model: "gpt-5",
  tools: [
    defineTool({
      name: "lookup_issue",
      description: "從追蹤器獲取問題 (issue) 詳情",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "問題 (Issue) ID" },
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

### 使用 Zod 處理參數

SDK 支援使用 Zod 結構描述 (schema) 處理參數：

```typescript
import { z } from "zod";

const session = await client.createSession({
  tools: [
    defineTool({
      name: "get_weather",
      description: "獲取特定地點的天氣",
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

### 工具回傳型別 (Tool Return Types)

- 回傳任何可 JSON 序列化的值 (會自動包裝)
- 或回傳 `ToolResultObject` 以進行 Metadata 的完整控制：

```typescript
{
    textResultForLlm: string;  // 顯示給 LLM 的結果
    resultType: "success" | "failure";
    error?: string;  // 內部錯誤 (不顯示給 LLM)
    toolTelemetry?: Record<string, unknown>;
}
```

### 工具執行流程 (Tool Execution Flow)

當 Copilot 呼叫工具時，客戶端會自動：

1. 執行您的處理常式函式
2. 序列化回傳值
3. 回應給 CLI
## 系統訊息自訂 (System Message Customization)

### 附加模式 (Append Mode) (預設值 - 保留防護欄)

```typescript
const session = await client.createSession({
  model: "gpt-5",
  systemMessage: {
    mode: "append",
    content: `
<workflow_rules>
- 務必檢查安全漏洞
- 在適用時提供效能改進建議
</workflow_rules>
`,
  },
});
```

### 取代模式 (Replace Mode) (完整控制 - 移除防護欄)

```typescript
const session = await client.createSession({
  model: "gpt-5",
  systemMessage: {
    mode: "replace",
    content: "你是一個很有幫助的助手。",
  },
});
```

## 檔案附件 (File Attachments)

在訊息中附加檔案：

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

## 訊息傳遞模式 (Message Delivery Modes)

在訊息選項中使用 `mode` 屬性：

- `"enqueue"` - 將訊息排入佇列進行處理
- `"immediate"` - 立即處理訊息

```typescript
await session.send({
  prompt: "...",
  mode: "enqueue",
});
```

## 多個對話階段 (Multiple Sessions)

對話階段是獨立的，可以同時執行：

```typescript
const session1 = await client.createSession({ model: "gpt-5" });
const session2 = await client.createSession({ model: "claude-sonnet-4.5" });

await Promise.all([
  session1.send({ prompt: "來自對話階段 1 的問候" }),
  session2.send({ prompt: "來自對話階段 2 的問候" }),
]);
```

## 自備金鑰 (Bring Your Own Key, BYOK)

透過 `provider` 使用自訂 API 提供者：

```typescript
const session = await client.createSession({
  provider: {
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "您的-api-key",
  },
});
```

## 對話階段生命週期管理 (Session Lifecycle Management)

### 列出對話階段 (Listing Sessions)

```typescript
const sessions = await client.listSessions();
for (const metadata of sessions) {
  console.log(`${metadata.sessionId}: ${metadata.summary}`);
}
```

### 刪除對話階段 (Deleting Sessions)

```typescript
await client.deleteSession(sessionId);
```

### 獲取最後一個對話階段 ID

```typescript
const lastId = await client.getLastSessionId();
if (lastId) {
  const session = await client.resumeSession(lastId);
}
```

### 檢查連線狀態 (Checking Connection State)

```typescript
const state = client.getState();
// 回傳值："disconnected" | "connecting" | "connected" | "error"
```

## 錯誤處理 (Error Handling)

### 標準例外處理 (Standard Exception Handling)

```typescript
try {
  const session = await client.createSession();
  await session.send({ prompt: "您好" });
} catch (error) {
  console.error(`錯誤：${error.message}`);
}
```

### 對話階段錯誤事件 (Session Error Events)

監控 `session.error` 事件型別以處理執行階段錯誤：

```typescript
session.on((event) => {
  if (event.type === "session.error") {
    console.error(`對話階段錯誤：${event.data.message}`);
  }
});
```

## 連線測試 (Connectivity Testing)

使用 ping 驗證伺服器連線性：

```typescript
const response = await client.ping("連線健康檢查");
console.log(`伺服器回應時間：${new Date(response.timestamp)}`);
```

## 資源清理 (Resource Cleanup)

### 使用 Try-Finally 自動清理

請務必使用 try-finally 或在 finally 區塊中進行清理：

```typescript
const client = new CopilotClient();
try {
  await client.start();
  const session = await client.createSession();
  try {
    // 使用對話階段...
  } finally {
    await session.destroy();
  }
} finally {
  await client.stop();
}
```

### 清理函式模式 (Cleanup Function Pattern)

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
  const session = await client.createSession();
  try {
    return await fn(session);
  } finally {
    await session.destroy();
  }
}

// 使用方式
await withClient(async (client) => {
  await withSession(client, async (session) => {
    await session.send({ prompt: "您好！" });
  });
});
```

## 最佳做法 (Best Practices)

1. **務必使用 try-finally** 進行資源清理
2. **使用 Promises** 來等待對話階段閒置 (session.idle) 事件
3. **處理對話階段錯誤 (session.error)** 事件以建立穩健的錯誤處理機制
4. **使用型別防護 (type guards) 或 switch 陳述式** 來進行事件處理
5. **啟用串流** 以在互動情境中提供更好的使用者體驗 (UX)
6. **使用 defineTool** 進行型別安全的工具定義
7. **使用 Zod 結構描述 (schema)** 進行執行階段參數驗證
8. **在不再需要時處置事件訂閱**
9. **使用模式為 "append" 的系統訊息 (systemMessage)** 以保留安全防護欄
10. **啟用串流時，同時處理增量 (delta) 和最終事件**
11. **善用 TypeScript 型別** 以確保編譯時的安全性

## 常見模式 (Common Patterns)

### 簡單的查詢-回應 (Simple Query-Response)

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
try {
  await client.start();

  const session = await client.createSession({ model: "gpt-5" });
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

### 多輪對話 (Multi-Turn Conversation)

```typescript
const session = await client.createSession();

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

await sendAndWait("法國的首都是哪裡？");
await sendAndWait("它的人口是多少？");
```

### SendAndWait 協助工具

```typescript
// 使用內建的 sendAndWait 進行更簡單的同步互動
const response = await session.sendAndWait({ prompt: "2+2 等於多少？" }, 60000);

if (response) {
  console.log(response.data.content);
}
```

### 具備型別安全參數的工具

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
  tools: [
    defineTool({
      name: "get_user",
      description: "獲取使用者資訊",
      parameters: z.object({
        userId: z.string().describe("使用者 ID"),
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

### 具備進度顯示的串流 (Streaming with Progress)

```typescript
let currentMessage = "";

const unsubscribe = session.on((event) => {
  if (event.type === "assistant.message.delta") {
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

### 錯誤復原 (Error Recovery)

```typescript
session.on((event) => {
  if (event.type === "session.error") {
    console.error("對話階段錯誤：", event.data.message);
    // 可選擇重試或處理錯誤
  }
});

try {
  await session.send({ prompt: "危險的操作" });
} catch (error) {
  // 處理傳送錯誤
  console.error("傳送失敗：", error);
}
```

## TypeScript 專屬特性 (TypeScript-Specific Features)

### 型別推論 (Type Inference)

```typescript
import type { SessionEvent, AssistantMessageEvent } from "@github/copilot-sdk";

session.on((event: SessionEvent) => {
  if (event.type === "assistant.message") {
    // TypeScript 在此處知道 event 是 AssistantMessageEvent
    const content: string = event.data.content;
  }
});
```

### 泛型協助工具 (Generic Helper)

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

// 使用方式
const message = await waitForEvent(session, "assistant.message");
console.log(message.data.content);
```
