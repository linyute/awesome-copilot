# Phoenix 追蹤：自訂中介資料 (TypeScript) (Phoenix Tracing: Custom Metadata (TypeScript))

為 Span 新增自訂屬性，以獲得更豐富的可觀測性。

## 使用上下文（傳播至所有子 Span） (Using Context (Propagates to All Child Spans))

```typescript
import { context } from "@arizeai/phoenix-otel";
import { setMetadata } from "@arizeai/openinference-core";

context.with(
  setMetadata(context.active(), {
    experiment_id: "exp_123",
    model_version: "gpt-4-1106-preview",
    environment: "production",
  }),
  async () => {
    // 此區塊內建立的所有 Span 都將具有：
    // "metadata" = '{"experiment_id": "exp_123", ...}'
    await myApp.run(query);
  }
);
```

## 在單一 Span 上設定 (On a Single Span)

```typescript
import { traceChain } from "@arizeai/openinference-core";
import { trace } from "@arizeai/phoenix-otel";

const myFunction = traceChain(
  async (input: string) => {
    const span = trace.getActiveSpan();

    span?.setAttribute(
      "metadata",
      JSON.stringify({
        experiment_id: "exp_123",
        model_version: "gpt-4-1106-preview",
        environment: "production",
      })
    );

    return result;
  },
  { name: "my-function" }
);

await myFunction("hello");
```
