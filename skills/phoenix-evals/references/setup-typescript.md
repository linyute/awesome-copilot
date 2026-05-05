# 設定：TypeScript (Setup: TypeScript)

Phoenix 評估與實驗所需的套件。

## 安裝 (Installation)

```bash
# 使用 npm
npm install @arizeai/phoenix-client @arizeai/phoenix-evals @arizeai/phoenix-otel

# 使用 pnpm
pnpm add @arizeai/phoenix-client @arizeai/phoenix-evals @arizeai/phoenix-otel
```

## LLM 提供者 (LLM Providers)

針對 LLM-as-judge 評估者，請安裝 Vercel AI SDK 提供者：

```bash
npm install ai @ai-sdk/openai      # Vercel AI SDK + OpenAI
npm install @ai-sdk/anthropic      # Anthropic
npm install @ai-sdk/google         # Google
```

或使用直接提供者 SDK：

```bash
npm install openai                 # OpenAI direct
npm install @anthropic-ai/sdk      # Anthropic direct
```

## 快速驗證 (Quick Verify)

```typescript
import { createClient } from "@arizeai/phoenix-client";
import { createClassificationEvaluator } from "@arizeai/phoenix-evals";
import { registerPhoenix } from "@arizeai/phoenix-otel";

// 所有匯入都應正常運作
console.log("Phoenix TypeScript 設定完成");
```
