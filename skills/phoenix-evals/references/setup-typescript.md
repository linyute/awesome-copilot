# 設定：TypeScript (Setup)

執行 Phoenix 評估與實驗所需的套件 (Packages)。

## 安裝 (Installation)

```bash
# 使用 npm
npm install @arizeai/phoenix-client @arizeai/phoenix-evals @arizeai/phoenix-otel

# 使用 pnpm
pnpm add @arizeai/phoenix-client @arizeai/phoenix-evals @arizeai/phoenix-otel
```

## LLM 供應商 (LLM Providers)

對於 LLM 作為裁判 (LLM-as-judge) 的評估器，請安裝 Vercel AI SDK 供應商：

```bash
npm install ai @ai-sdk/openai      # Vercel AI SDK + OpenAI
npm install @ai-sdk/anthropic      # Anthropic
npm install @ai-sdk/google         # Google
```

或者使用直接供應商 SDK：

```bash
npm install openai                 # OpenAI 直連
npm install @anthropic-ai/sdk      # Anthropic 直連
```

## 快速驗證 (Quick Verify)

```typescript
import { createClient } from "@arizeai/phoenix-client";
import { createClassificationEvaluator } from "@arizeai/phoenix-evals";
import { registerPhoenix } from "@arizeai/phoenix-otel";

// 所有匯入都應能正常運作
console.log("Phoenix TypeScript 設定完成");
```
