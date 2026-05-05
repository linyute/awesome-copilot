# Phoenix 追蹤：生產環境指南 (TypeScript) (Phoenix Tracing: Production Guide (TypeScript))

**至關重要：為生產環境部署配置批次處理、資料遮蔽與 Span 篩選。**

## 中介資料 (Metadata)

| 屬性 | 值 |
|-----------|-------|
| 優先順序 | 緊急 (Critical) - 生產就緒必需 |
| 影響程度 | 安全性、效能 |
| 設定時間 | 5-15 分鐘 |

## 批次處理 (Batch Processing)

**啟用批次處理以提升生產環境效率。** 批次處理透過分組發送 Span 而非逐一發送，來減少網路開銷。

```typescript
import { register } from "@arizeai/phoenix-otel";

const provider = register({
  projectName: "my-app",
  batch: true,  // 生產環境預設值
});
```

### 關閉作業處理 (Shutdown Handling)

**至關重要：** 若您的程序結束時 Span 仍排隊在處理器中，則可能不會被匯出。請呼叫 `provider.shutdown()` 在結束前進行明確排清。

```typescript
// 明確關閉以排清佇列中的 Span
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

**優雅終止訊號：**

```typescript
// 收到 SIGTERM 時優雅關閉
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

## 資料遮蔽（PII 防護） (Data Masking (PII Protection))

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

**優先順序：** 程式碼 > 環境變數 > 預設值

---

## Span 篩選 (Span Filtering)

**抑制特定程式碼區塊的追蹤：**

```typescript
import { suppressTracing } from "@opentelemetry/core";
import { context } from "@opentelemetry/api";

await context.with(suppressTracing(context.active()), async () => {
  internalLogging(); // 不會產生 Span
});
```

**採樣 (Sampling)：**

```bash
export OTEL_TRACES_SAMPLER="parentbased_traceidratio"
export OTEL_TRACES_SAMPLER_ARG="0.1"  # 採樣 10%
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

## 生產環境檢查清單 (Production Checklist)

- [ ] 已啟用批次處理
- [ ] **關閉作業處理**：在結束前呼叫 `provider.shutdown()` 以排清佇列中的 Span
- [ ] **優雅終止**：在收到 SIGTERM/SIGINT 訊號時排清 Span
- [ ] 已配置資料遮蔽（若涉及 PII 則設定 `HIDE_INPUTS`/`HIDE_OUTPUTS`）
- [ ] 針對健康檢查/高雜訊路徑進行 Span 篩選
- [ ] 已實作錯誤處理
- [ ] 在 Phoenix 無法使用時能優雅降級
- [ ] 已完成效能測試
- [ ] 已配置監控（已檢查 Phoenix UI）
