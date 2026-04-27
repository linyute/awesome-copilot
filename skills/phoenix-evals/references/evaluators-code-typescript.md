# 評估器：TypeScript 中的程式碼評估器 (Code Evaluators)

不使用 LLM 的決定性評估器。快速、便宜且可重現。

## 基本模式 (Basic Pattern)

```typescript
import { createEvaluator } from "@arizeai/phoenix-evals";

const containsCitation = createEvaluator<{ output: string }>(
  ({ output }) => /\[\d+\]/.test(output) ? 1 : 0,
  { name: "contains_citation", kind: "CODE" }
);
```

## 包含完整結果 (With Full Results) (asExperimentEvaluator)

```typescript
import { asExperimentEvaluator } from "@arizeai/phoenix-client/experiments";

const jsonValid = asExperimentEvaluator({
  name: "json_valid",
  kind: "CODE",
  evaluate: async ({ output }) => {
    try {
      JSON.parse(String(output));
      return { score: 1.0, label: "valid_json" };
    } catch (e) {
      return { score: 0.0, label: "invalid_json", explanation: String(e) };
    }
  },
});
```

## 參數類型 (Parameter Types)

```typescript
interface EvaluatorParams {
  input: Record<string, unknown>;
  output: unknown;
  expected: Record<string, unknown>;
  metadata: Record<string, unknown>;
}
```

## 常見模式

- **正規表示式 (Regex)**：`/pattern/.test(output)`
- **JSON**：`JSON.parse()` + zod schema
- **關鍵字 (Keywords)**：`output.includes(keyword)`
- **相似度 (Similarity)**：`fastest-levenshtein`
