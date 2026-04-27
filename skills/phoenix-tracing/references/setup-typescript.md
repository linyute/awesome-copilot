# TypeScript 設定 (Setup)

使用 `@arizeai/phoenix-otel` 在 TypeScript/JavaScript 中設定 Phoenix 追蹤。

## Metadata

| 屬性 | 值 |
|-----------|-------|
| 優先權 (Priority) | 關鍵 - 所有追蹤皆需要 |
| 設定時間 (Setup Time) | < 5 分鐘 |

## 快速開始 (Quick Start)

```bash
npm install @arizeai/phoenix-otel
```

```typescript
import { register } from "@arizeai/phoenix-otel";
register({ projectName: "my-app" });
```

預設連線至 `http://localhost:6006`。

## 組態 (Configuration)

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
export PHOENIX_API_KEY="你的 API 金鑰"
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

**ESM（需要手動檢測/Manual instrumentation）：**

```typescript
import { register, registerInstrumentations } from "@arizeai/phoenix-otel";
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";
import OpenAI from "openai";

register({ projectName: "my-app" });

const instrumentation = new OpenAIInstrumentation();
instrumentation.manuallyInstrument(OpenAI);
registerInstrumentations({ instrumentations: [instrumentation] });
```

**原因：** ESM 的匯入會被提升 (hoisted)，因此需要呼叫 `manuallyInstrument()`。

## 框架整合 (Framework Integration)

**Next.js (App Router)：**

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { register } = await import("@arizeai/phoenix-otel");
    register({ projectName: "my-nextjs-app" });
  }
}
```

**Express.js：**

```typescript
import { register } from "@arizeai/phoenix-otel";

register({ projectName: "my-express-app" });

const app = express();
```

## 在結束前排清 (Flushing) Spans

**關鍵提醒：** 如果在程序結束時 spans 仍留在處理器的佇列中，則可能無法匯出。請呼叫 `provider.shutdown()` 以在結束前明確進行排清。

**標準模式：**

```typescript
const provider = register({
  projectName: "my-app",
  batch: true,
});

async function main() {
  await doWork();
  await provider.shutdown();  // 結束前排清 spans
}

main().catch(async (error) => {
  console.error(error);
  await provider.shutdown();  // 發生錯誤時也排清
  process.exit(1);
});
```

**替代方案：**

```typescript
// 使用 batch: false 進行立即匯出（無需進行關機排清）
register({
  projectName: "my-app",
  batch: false,
});
```

有關包含優雅終止 (graceful termination) 的生產環境模式，請參閱 `production-typescript.md`。

## 驗證 (Verification)

1. 開啟 Phoenix UI：`http://localhost:6006`
2. 執行您的應用程式
3. 檢查您專案中的追蹤

**啟用診斷紀錄 (diagnostic logging)：**

```typescript
import { DiagLogLevel, register } from "@arizeai/phoenix-otel";

register({
  projectName: "my-app",
  diagLogLevel: DiagLogLevel.DEBUG,
});
```

## 疑難排解 (Troubleshooting)

**沒有追蹤：**
- 驗證 `PHOENIX_COLLECTOR_ENDPOINT` 是否正確
- 為 Phoenix Cloud 設定 `PHOENIX_API_KEY`
- 對於 ESM：確保已呼叫 `manuallyInstrument()`
- **若使用 `batch: true`**：在結束前呼叫 `provider.shutdown()` 以排清佇列中的 spans（請參閱「排清 Spans」章節）

**追蹤遺漏：**
- 若使用 `batch: true`：在程序結束前呼叫 `await provider.shutdown()` 以排清佇列中的 spans
- 替代方案：設定 `batch: false` 進行立即匯出（無需進行關機排清）

**遺漏屬性：**
- 檢查檢測 (instrumentation) 是否已註冊（ESM 需要手動設定）
- 請參閱 `instrumentation-auto-typescript.md`

## 另請參閱

- **自動檢測 (Auto-instrumentation)：** `instrumentation-auto-typescript.md`
- **手動檢測 (Manual instrumentation)：** `instrumentation-manual-typescript.md`
- **API 文件：** https://arize-ai.github.io/phoenix/
