# 實驗：產生合成測試資料 (TypeScript) (Experiments: Generating Synthetic Test Data (TypeScript))

建立多元且具針對性的測試資料以進行評估。

## 基於維度的方法 (Dimension-Based Approach)

定義變化的軸向，然後產生組合：

```typescript
const dimensions = {
  issueType: ["billing", "technical", "shipping"],
  customerMood: ["frustrated", "neutral", "happy"],
  complexity: ["simple", "moderate", "complex"],
};
```

## 兩步產生法 (Two-Step Generation)

1. **產生元組 (tuples)**（維度值的組合）
2. **轉換為自然查詢**（每個元組進行一次個別的 LLM 呼叫）

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// 步驟 1：建立元組
type Tuple = [string, string, string];
const tuples: Tuple[] = [
  ["billing", "frustrated", "complex"],
  ["shipping", "neutral", "simple"],
];

// 步驟 2：轉換為自然查詢
async function tupleToQuery(t: Tuple): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `請產生一則寫實的客戶訊息：
    問題類型：${t[0]}, 情緒：${t[1]}, 複雜度：${t[2]}
    
    撰寫時請力求自然，若合適可包含錯別字。不要流於公式化。`,
  });
  return text;
}
```

## 目標失敗模式 (Target Failure Modes)

維度應針對錯誤分析中發現的已知失敗：

```typescript
// 來自錯誤分析的發現
const dimensions = {
  timezone: ["EST", "PST", "UTC", "ambiguous"], // 已知失敗點
  dateFormat: ["ISO", "US", "EU", "relative"], // 已知失敗點
};
```

## 品質控制 (Quality Control)

- **驗證**：檢查是否存在預留位置文字、最小長度。
- **去重**：使用嵌入 (embeddings) 移除近乎重複的查詢。
- **平衡性**：確保涵蓋各個維度值。

```typescript
function validateQuery(query: string): boolean {
  const minLength = 20;
  const hasPlaceholder = /\[.*?\]|<.*?>/.test(query);
  return query.length >= minLength && !hasPlaceholder;
}
```

## 何時使用 (When to Use)

| 使用合成資料 | 使用真實資料 |
| ------------- | ------------- |
| 生產環境資料有限 | 具備充足的追蹤 (traces) |
| 測試邊緣案例 | 驗證實際行為 |
| 發佈前評估 | 發佈後監控 |

## 樣本大小 (Sample Sizes)

| 用途 | 大小 |
| ------- | ---- |
| 初步探索 | 50-100 |
| 全面評估 | 100-500 |
| 每個維度 | 每個組合 10-20 個 |
