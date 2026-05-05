# 工作階段 (TypeScript) (Sessions (TypeScript))

透過使用工作階段 ID (session ID) 將追蹤分組，來追蹤多輪對話。**直接使用來自 `@arizeai/openinference-core` 的 `withSpan`** — 無需包裝器 (wrappers) 或自訂公用程式。

## 核心概念 (Core Concept)

**工作階段模式：**
1. 在應用程式啟動時產生一個唯一的 `session.id`。
2. 匯出 SESSION_ID，並在需要之處匯入 `withSpan`。
3. 使用 `withSpan` 為每次互動建立一個帶有 `session.id` 的父項 CHAIN Span。
4. 所有子項 Span（LLM, TOOL, AGENT 等）會自動分組在父項之下。
5. 在 Phoenix 中依 `session.id` 查詢追蹤，以查看所有互動。

## 實作（最佳實踐） (Implementation (Best Practice))

### 1. 設定 (instrumentation.ts) (1. Setup (instrumentation.ts))

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

// 產生並匯出工作階段 ID
export const SESSION_ID = randomUUID();
```

### 2. 用法（應用程式程式碼） (2. Usage (app code))

```typescript
import { withSpan } from "@arizeai/openinference-core";
import { SESSION_ID } from "./instrumentation";

// 直接使用 withSpan - 無需包裝器
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

### 帶有輸入參數 (With Input Parameters)

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

### 工作階段 ID 範圍 (Session ID Scope)
- **CLI/桌面應用程式**：在程序啟動時產生一次。
- **網站伺服器**：為每個使用者工作階段產生（例如在登入時，儲存在工作階段儲存空間中）。
- **無狀態 API**：從用戶端接收 session.id 作為參數。

### Span 階層 (Span Hierarchy)
```
cli.interaction (CHAIN) ← 在此處設定 session.id
├── ai.generateText (AGENT)
│   ├── ai.generateText.doGenerate (LLM)
│   └── ai.toolCall (TOOL)
└── ai.generateText.doGenerate (LLM)
```

`session.id` 僅設定在 **根 Span (root span)** 上。子項 Span 會依據追蹤階層自動分組。

### 查詢工作階段 (Querying Sessions)

```bash
# 獲取某個工作階段的所有追蹤
npx @arizeai/phoenix-cli traces \
  --endpoint http://localhost:6006 \
  --project your-app \
  --format raw \
  --no-progress | \
  jq '.[] | select(.spans[0].attributes["session.id"] == "YOUR-SESSION-ID")'
```

## 相依性 (Dependencies)

```json
{
  "dependencies": {
    "@arizeai/openinference-core": "^2.0.5",
    "@arizeai/phoenix-otel": "^0.4.1"
  }
}
```

**附註：** **不** 需要 `@opentelemetry/api` — 它僅用於手動 Span 管理。

## 為何使用此模式？ (Why This Pattern?)

1. **簡單**：僅需匯出 SESSION_ID 並直接使用 withSpan — 無需包裝器。
2. **內建**：來自 `@arizeai/openinference-core` 的 `withSpan` 處理了一切。
3. **型別安全**：保留函式簽名與型別資訊。
4. **自動生命週期**：處理 Span 建立、錯誤追蹤與清理。
5. **與框架無關**：適用於任何 LLM 框架（AI SDK, LangChain 等）。
6. **無額外相依性**：不需要 `@opentelemetry/api` 或自訂公用程式。

## 新增更多屬性 (Adding More Attributes)

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
      "metadata.environment": "prod",  // 自訂中介資料
    },
  }
);
```

## 反面模式：不要建立包裝器 (Anti-Pattern: Don't Create Wrappers)

❌ **不要這樣做：**
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

## 替代方案：Context API 模式 (Alternative: Context API Pattern)

對於網站伺服器或複雜的非同步流程，若您需要透過中介軟體 (middleware) 傳播工作階段 ID，可以使用 Context API：

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

**在以下情況使用 Context API：**
- 建構具有中介軟體鏈的網站伺服器。
- 工作階段 ID 需要流經許多非同步邊界。
- 您無法控制呼叫堆疊（例如框架提供的處理常式）。

**在以下情況使用 withSpan：**
- 建構 CLI 應用程式或腳本。
- 您可以控制函式呼叫點。
- 偏好更簡單、更明確的程式碼。

## 相關內容 (Related)

- `fundamentals-universal-attributes.md` — 其他通用屬性（使用者 ID、中介資料）。
- `span-chain.md` — CHAIN Span 規範。
- `sessions-python.md` — Python 工作階段追蹤模式。
