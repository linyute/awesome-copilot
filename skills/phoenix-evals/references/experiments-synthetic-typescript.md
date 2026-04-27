# 實驗：產生合成測試資料 (TypeScript) (Generating Synthetic Test Data)

為評估建立多樣化且具針對性的測試資料。

## 基於維度的方法 (Dimension-Based Approach)

定義變化軸 (axes of variation)，然後產生組合：

```typescript
const dimensions = {
  issueType: ["billing", "technical", "shipping"],
  customerMood: ["frustrated", "neutral", "happy"],
  complexity: ["simple", "moderate", "complex"],
};
```

## 兩步驟產生 (Two-Step Generation)

1. **產生元組 (Generate tuples)** (維度值的組合)
2. **轉換為自然語言查詢 (Convert to natural queries)** (每個元組進行一次單獨的 LLM 呼叫)

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// 步驟 1：建立元組
type Tuple = [string, string, string];
const tuples: Tuple[] = [
  ["billing", "frustrated", "complex"],
  ["shipping", "neutral", "simple"],
];

// 步驟 2：轉換為自然語言查詢
async function tupleToQuery(t: Tuple): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `Generate a realistic customer message:
    Issue: ${t[0]}, Mood: ${${t[1]}}, Complexity: ${${t[2]}}
    
    Write naturally, include typos if appropriate. Don't be formulaic.`,
  });
  return text;
}
```

## 針對失敗模式 (Target Failure Modes)

維度應針對錯誤分析 (error analysis) 中發現的已知失敗：

```typescript
// 來自錯誤分析的發現
const dimensions = {
  timezone: ["EST", "PST", "UTC", "ambiguous"], // 已知失敗
  dateFormat: ["ISO", "US", "EU", "relative"], // 已知失敗
};
```

## 品質控制 (Quality Control)

- **驗證 (Validate)**：檢查預留位置文字 (placeholder text)、最小長度
- **去重 (Deduplicate)**：使用嵌入 (embeddings) 移除近乎重複的查詢
- **平衡 (Balance)**：確保涵蓋各個維度值

```typescript
function validateQuery(query: string): boolean {
  const minLength = 20;
  const hasPlaceholder = /\[.*?\]|<.*?>/.test(query);
  return query.length >= minLength && !hasPlaceholder;
}
```

## 何時使用

| 使用合成資料 | 使用真實資料 |
| ------------- | ------------- |
| 生產資料有限 | 追蹤 (traces) 充足 |
| 測試邊緣案例 (edge cases) | 驗證實際行為 |
| 推出前的評估 | 推出後的監控 |

## 樣本大小 (Sample Sizes)

| 目的 | 大小 |
| ------- | ---- |
| 初始探索 | 50-100 |
| 全面評估 | 100-500 |
| 每個維度 | 每個組合 10-20 個 |
