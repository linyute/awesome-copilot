# Phoenix 追蹤：生產指南 (Production Guide) (TypeScript)

**關鍵提醒：請為生產部署設定批次處理 (batching)、資料遮罩 (data masking) 以及 span 過濾。**

## Metadata

| 屬性 | 值 |
|-----------|-------|
| 優先權 (Priority) | 關鍵 - 生產就緒性 |
| 影響 (Impact) | 安全性、效能 |
| 設定時間 (Setup Time) | 5-15 分鐘 |

## 批次處理 (Batch Processing)

**啟用批次處理以提升生產效率。** 批次處理透過成組發送 spans 而非個別發送，來減少網路開銷 (network overhead)。

```typescript
import { register } from "@arizeai/phoenix-otel";

const provider = register({
  projectName: "my-app",
  batch: true,  // 生產環境預設值
});
```

### 關機處理 (Shutdown Handling)

**關鍵提醒：** 如果在程序結束時 spans 仍留在處理器的佇列中，則可能無法匯出。請呼叫 `provider.shutdown()` 以在結束前明確進行排清 (flush)。

```typescript
// 明確關機以排清待處理的 spans
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

**優雅終止信號 (Graceful termination signals)：**

```typescript
// 收到 SIGTERM 時優雅關機
const provider = register({
  projectName: "my-server",
  batch: true,
});

process.on("SIGTERM", async () => {
  await provider.shutdown();
  process.exit(0);
});
```

---

## 資料遮罩 (PII 保護) (Data Masking (PII Protection))

**環境變數：**

```bash
export OPENINFERENCE_HIDE_INPUTS=true          # 隱藏 input.value
export OPENINFERENCE_HIDE_OUTPUTS=true         # 隱藏 output.value
export OPENINFERENCE_HIDE_INPUT_MESSAGES=true  # 隱藏 LLM 輸入訊息
export OPENINFERENCE_HIDE_OUTPUT_MESSAGES=true # 隱藏 LLM 輸出訊息
export OPENINFERENCE_HIDE_INPUT_IMAGES=true    # 隱藏圖片內容
export OPENINFERENCE_HIDE_INPUT_TEXT=true      # 隱藏嵌入文字
export OPENINFERENCE_BASE64_IMAGE_MAX_LENGTH=10000  # 限制圖片大小
```

**TypeScript TraceConfig：**

```typescript
import { register } from "@arizeai/phoenix-otel";
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";

const traceConfig = {
  hideInputs: true,
  hideOutputs: true,
  hideInputMessages: true
};

const instrumentation = new OpenAIInstrumentation({ traceConfig });
```

**優先順序 (Precedence)：** 程式碼 > 環境變數 > 預設值

---

## Span 過濾 (Span Filtering)

**抑制 (Suppress) 特定的程式碼區塊：**

```typescript
import { suppressTracing } from "@opentelemetry/core";
import { context } from "@opentelemetry/api";

await context.with(suppressTracing(context.active()), async () => {
  internalLogging(); // 不會產生 spans
});
```

**抽樣 (Sampling)：**

```bash
export OTEL_TRACES_SAMPLER="parentbased_traceidratio"
export OTEL_TRACES_SAMPLER_ARG="0.1"  # 抽樣 10%
```

---

## 錯誤處理 (Error Handling)

```typescript
import { SpanStatusCode } from "@opentelemetry/api";

try {
  result = await riskyOperation();
  span?.setStatus({ code: SpanStatusCode.OK });
} catch (e) {
  span?.recordException(e);
  span?.setStatus({ code: SpanStatusCode.ERROR });
  throw e;
}
```

---

## 生產檢查清單 (Production Checklist)

- [ ] 已啟用批次處理
- [ ] **關機處理：** 結束前呼叫 `provider.shutdown()` 以排清佇列中的 spans
- [ ] **優雅終止：** 收到 SIGTERM/SIGINT 信號時排清 spans
- [ ] 已設定資料遮罩（若是包含 PII，請設定 `HIDE_INPUTS`/`HIDE_OUTPUTS`）
- [ ] 已為健康檢查 (health checks) 或雜訊路徑 (noisy paths) 設定 span 過濾
- [ ] 已實作錯誤處理
- [ ] 若 Phoenix 無法使用，具備優雅降級 (graceful degradation) 機制
- [ ] 已通過效能測試
- [ ] 已設定監控（已檢查 Phoenix UI）
