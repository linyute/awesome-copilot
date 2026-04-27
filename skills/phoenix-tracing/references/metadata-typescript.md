# Phoenix 追蹤：自訂 Metadata (TypeScript)

將自訂屬性加入至 spans 以實現更豐富的可觀測性 (observability)。

## 使用上下文 (Context) (會傳遞至所有子 spans)

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
    // 在此區塊中建立的所有 spans 都將具有：
    // "metadata" = '{"experiment_id": "exp_123", ...}'
    await myApp.run(query);
  }
);
```

## 在單一 Span 上

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
