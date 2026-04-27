# 階段 (Sessions) (TypeScript)

透過階段 ID (session IDs) 將追蹤 (traces) 進行分組，以追蹤多輪對話。**直接從 `@arizeai/openinference-core` 使用 `withSpan`** — 無需包裝器 (wrappers) 或自訂公用程式。

## 核心概念 (Core Concept)

**階段模式 (Session Pattern)：**
1. 在應用程式啟動時產生一個唯一的 `session.id`
2. 匯出 SESSION_ID，並在需要的地方匯入 `withSpan`
3. 針對每次互動，使用 `withSpan` 建立一個帶有 `session.id` 的父 CHAIN span
4. 所有子 spans (LLM, TOOL, AGENT 等) 會自動在該父項下進行分組
5. 在 Phoenix 中依 `session.id` 查詢追蹤，以查看所有互動

## 實作 (最佳實務) (Implementation (Best Practice))

### 1. 設定 (instrumentation.ts)

```typescript
import { register } from "@arizeai/phoenix-otel";
import { randomUUID } from "node:crypto";

// 初始化 Phoenix
register({
  projectName: "your-app",
  url: process.env.PHOENIX_COLLECTOR_ENDPOINT || "http://localhost:6006",
  apiKey: process.env.PHOENIX_API_KEY,
  batch: true,
});

// 產生並匯出階段 ID
export const SESSION_ID = randomUUID();
```

### 2. 使用方式 (應用程式程式碼)

```typescript
import { withSpan } from "@arizeai/openinference-core";
import { SESSION_ID } from "./instrumentation";

// 直接使用 withSpan - 不需要包裝器
const handleInteraction = withSpan(
  async () => {
    const result = await agent.generate({ prompt: userInput });
    return result;
  },
  {
    name: "cli.interaction",
    kind: "CHAIN",
    attributes: { "session.id": SESSION_ID },
  }
);

// 呼叫它
const result = await handleInteraction();
```

### 包含輸入參數

```typescript
const processQuery = withSpan(
  async (query: string) => {
    return await agent.generate({ prompt: query });
  },
  {
    name: "process.query",
    kind: "CHAIN",
    attributes: { "session.id": SESSION_ID },
  }
);

await processQuery("2+2 等於多少？");
```

## 關鍵點 (Key Points)

### 階段 ID 範圍 (Session ID Scope)
- **CLI/桌面應用程式**：在程序啟動時產生一次
- **網頁伺服器**：針對每個使用者階段產生（例如：在登入時產生，並儲存在階段儲存空間中）
- **無狀態 API**：從用戶端接收 session.id 作為參數

### Span 階層 (Span Hierarchy)
```
cli.interaction (CHAIN) ← 在此設定 session.id
├── ai.generateText (AGENT)
│   ├── ai.generateText.doGenerate (LLM)
│   └── ai.toolCall (TOOL)
└── ai.generateText.doGenerate (LLM)
```

`session.id` 僅設定在**根 span (root span)** 上。子 spans 會透過追蹤階層自動分組。

### 查詢階段 (Querying Sessions)

```bash
# 取得某個階段的所有追蹤
npx @arizeai/phoenix-cli traces \
  --endpoint http://localhost:6006 \
  --project your-app \
  --format raw \
  --no-progress | \
  jq '.[] | select(.spans[0].attributes["session.id"] == "你的階段 ID")'
```

## 相依項目 (Dependencies)

```json
{
  "dependencies": {
    "@arizeai/openinference-core": "^2.0.5",
    "@arizeai/phoenix-otel": "^0.4.1"
  }
}
```

**注意：** 不需要 `@opentelemetry/api` — 它僅用於手動 span 管理。

## 為什麼要使用此模式？

1. **簡單**：只需匯出 SESSION_ID 並直接使用 withSpan — 無需包裝器
2. **內建**：來自 `@arizeai/openinference-core` 的 `withSpan` 處理了一切
3. **型別安全 (Type-safe)**：保留了函式簽名與型別資訊
4. **自動生命週期**：處理 span 的建立、錯誤追蹤與清理
5. **與框架無關 (Framework-agnostic)**：適用於任何 LLM 框架（AI SDK、LangChain 等）
6. **無需額外相依性**：不需要 `@opentelemetry/api` 或自訂公用程式

## 加入更多屬性

```typescript
import { withSpan } from "@arizeai/openinference-core";
import { SESSION_ID } from "./instrumentation";

const handleWithContext = withSpan(
  async (userInput: string) => {
    return await agent.generate({ prompt: userInput });
  },
  {
    name: "cli.interaction",
    kind: "CHAIN",
    attributes: {
      "session.id": SESSION_ID,
      "user.id": userId,              // 追蹤使用者
      "metadata.environment": "prod",  // 自訂 Metadata
    },
  }
);
```

## 反模式 (Anti-Pattern)：不要建立包裝器

❌ **請勿這樣做：**
```typescript
// 不必要的包裝器
export function withSessionTracking(fn) {
  return withSpan(fn, { attributes: { "session.id": SESSION_ID } });
}
```

✅ **應該這樣做：**
```typescript
// 直接使用 withSpan
import { withSpan } from "@arizeai/openinference-core";
import { SESSION_ID } from "./instrumentation";

const handler = withSpan(fn, {
  attributes: { "session.id": SESSION_ID }
});
```

## 替代方案：Context API 模式

對於網頁伺服器或複雜的非同步流，若您需要透過中介軟體 (middleware) 傳遞階段 ID，可以使用 Context API：

```typescript
import { context } from "@opentelemetry/api";
import { setSession } from "@arizeai/openinference-core";

await context.with(
  setSession(context.active(), { sessionId: "user_123_conv_456" }),
  async () => {
    const response = await llm.invoke(prompt);
  }
);
```

**在下列情況下使用 Context API：**
- 建立具有中介軟體鏈 (middleware chains) 的網頁伺服器
- 階段 ID 需要跨越許多非同步邊界 (async boundaries)
- 您無法控制呼叫堆疊（例如：框架提供的處理常式）

**在下列情況下使用 withSpan：**
- 建立 CLI 應用程式或指令稿 (scripts)
- 您可以控制函式呼叫點
- 偏好較簡單、較顯式的程式碼

## 相關內容

- `fundamentals-universal-attributes.md` — 其他通用屬性（user.id, metadata）
- `span-chain.md` — CHAIN span 規範
- `sessions-python.md` — Python 階段追蹤模式
