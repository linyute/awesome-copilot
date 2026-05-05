# Phoenix 追蹤：專案 (TypeScript) (Phoenix Tracing: Projects (TypeScript))

**使用專案 (Projects)（Phoenix 的頂層分組方式）來依應用程式組織追蹤。**

## 概觀 (Overview)

專案將單一應用程式或實驗的追蹤分組。

**用於：** 環境（開發/測試/生產）、A/B 測試、版本控制

## 設定 (Setup)

### 環境變數（建議做法） (Environment Variable (Recommended))

```bash
export PHOENIX_PROJECT_NAME="my-app-prod"
```

```typescript
process.env.PHOENIX_PROJECT_NAME = "my-app-prod";
import { register } from "@arizeai/phoenix-otel";
register();  // 使用 "my-app-prod"
```

### 程式碼 (Code)

```typescript
import { register } from "@arizeai/phoenix-otel";
register({ projectName: "my-app-prod" });
```

## 使用案例 (Use Cases)

**環境：**
```typescript
// 開發、測試、生產
register({ projectName: "my-app-dev" });
register({ projectName: "my-app-staging" });
register({ projectName: "my-app-prod" });
```

**A/B 測試：**
```typescript
// 比較模型
register({ projectName: "chatbot-gpt4" });
register({ projectName: "chatbot-claude" });
```

**版本控制：**
```typescript
// 追蹤版本
register({ projectName: "my-app-v1" });
register({ projectName: "my-app-v2" });
```
