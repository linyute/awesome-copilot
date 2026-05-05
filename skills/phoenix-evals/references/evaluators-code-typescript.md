# 評估者：TypeScript 中的程式碼評估者 (Evaluators: Code Evaluators in TypeScript)

不涉及 LLM 的確定性評估者。快速、便宜且具備可重現性。

## 基本模式 (Basic Pattern)

```typescript
import { createEvaluator } from "@arizeai/phoenix-evals";

const containsCitation = createEvaluator<{ output: string }>(
  ({ output }) => /\[\d+\]/.test(output) ? 1 : 0,
  { name: "contains_citation", kind: "CODE" }
);
```

## 帶有完整結果 (asExperimentEvaluator) (With Full Results (asExperimentEvaluator))

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

## 常見模式 (Common Patterns)

- **Regex**: `/pattern/.test(output)`
- **JSON**: `JSON.parse()` + zod schema
- **關鍵字**: `output.includes(keyword)`
- **相似度**: `fastest-levenshtein`
