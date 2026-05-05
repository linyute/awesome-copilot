# TypeScript 設定 (TypeScript Setup)

使用 `@arizeai/phoenix-otel` 在 TypeScript/JavaScript 中設定 Phoenix 追蹤。

## 中介資料 (Metadata)

| 屬性 | 值 |
|-----------|-------|
| 優先順序 | 緊急 (Critical) - 所有追蹤皆必需 |
| 設定時間 | <5 分鐘 |

## 快速開始 (Quick Start)

```bash
npm install @arizeai/phoenix-otel
```

```typescript
import { register } from "@arizeai/phoenix-otel";
register({ projectName: "my-app" });
```

預設連線至 `http://localhost:6006`。

## 配置 (Configuration)

```typescript
import { register } from "@arizeai/phoenix-otel";

register({
  projectName: "my-app",
  url: "http://localhost:6006",
  apiKey: process.env.PHOENIX_API_KEY,
  batch: true
});
```

**環境變數：**

```bash
export PHOENIX_API_KEY="your-api-key"
export PHOENIX_COLLECTOR_ENDPOINT="http://localhost:6006"
export PHOENIX_PROJECT_NAME="my-app"
```

## ESM vs CommonJS

**CommonJS（自動）：**

```javascript
const { register } = require("@arizeai/phoenix-otel");
register({ projectName: "my-app" });

const OpenAI = require("openai");
```

**ESM（需要手動檢測）：**

```typescript
import { register, registerInstrumentations } from "@arizeai/phoenix-otel";
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";
import OpenAI from "openai";

register({ projectName: "my-app" });

const instrumentation = new OpenAIInstrumentation();
instrumentation.manuallyInstrument(OpenAI);
registerInstrumentations({ instrumentations: [instrumentation] });
```

**原因：** ESM 匯入會比 `register()` 先執行（hoisted），因此需要 `manuallyInstrument()`。

## 框架整合 (Framework Integration)

**Next.js (App Router):**

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { register } = await import("@arizeai/phoenix-otel");
    register({ projectName: "my-nextjs-app" });
  }
}
```

**Express.js:**

```typescript
import { register } from "@arizeai/phoenix-otel";

register({ projectName: "my-express-app" });

const app = express();
```

## 在結束前排清 Span (Flushing Spans Before Exit)

**至關重要：** 如果您的程序結束時 Span 仍排隊在處理器中，則可能不會被匯出。請呼叫 `provider.shutdown()` 在結束前進行明確排清。

**標準模式：**

```typescript
const provider = register({
  projectName: "my-app",
  batch: true,
});

async function main() {
  await doWork();
  await provider.shutdown();  // 結束前排清 Span
}

main().catch(async (error) => {
  console.error(error);
  await provider.shutdown();  // 發生錯誤時也要排清
  process.exit(1);
});
```

**備用方案：**

```typescript
// 使用 batch: false 進行立即匯出（無需關閉作業）
register({
  projectName: "my-app",
  batch: false,
});
```

如需包含優雅終止 (graceful termination) 的生產環境模式，請參閱 `production-typescript.md`。

## 驗證 (Verification)

1. 開啟 Phoenix UI：`http://localhost:6006`
2. 執行您的應用程式
3. 在您的專案中檢查追蹤

**啟用診斷日誌：**

```typescript
import { DiagLogLevel, register } from "@arizeai/phoenix-otel";

register({
  projectName: "my-app",
  diagLogLevel: DiagLogLevel.DEBUG,
});
```

## 疑難排解 (Troubleshooting)

**無追蹤：**
- 驗證 `PHOENIX_COLLECTOR_ENDPOINT` 正確無誤。
- 為 Phoenix Cloud 設定 `PHOENIX_API_KEY`。
- 對於 ESM：確保已呼叫 `manuallyInstrument()`。
- **使用 `batch: true` 時：** 在結束前呼叫 `provider.shutdown()` 以排清佇列中的 Span（見「在結束前排清 Span」章節）。

**追蹤遺失：**
- 使用 `batch: true` 時：在程序結束前呼叫 `await provider.shutdown()` 以排清佇列中的 Span。
- 備用方案：設定 `batch: false` 進行立即匯出（無需關閉作業）。

**缺少屬性：**
- 檢查檢測是否已註冊（ESM 需要手動設定）。
- 參閱 `instrumentation-auto-typescript.md`。

## 參閱 (See Also)

- **自動檢測**：`instrumentation-auto-typescript.md`
- **手動檢測**：`instrumentation-manual-typescript.md`
- **API 文件**：https://arize-ai.github.io/phoenix/
