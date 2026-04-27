# EVALUATOR Spans

## 目的 (Purpose)

EVALUATOR spans 代表品質評估操作（例如：回答相關性、忠實度、幻覺偵測）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 說明 | 必要 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | String | 必須為 "EVALUATOR" | 是 |

## 通用屬性 (Common Attributes)

| 屬性 | 類型 | 說明 |
|-----------|------|-------------|
| `input.value` | String | 正在評估的內容 |
| `output.value` | String | 評估結果（分數、標籤、解釋） |
| `metadata.evaluator_name` | String | 評估器識別碼 |
| `metadata.score` | Float | 數值分數 (0-1) |
| `metadata.label` | String | 類別標籤（相關/不相關） |

## 範例：回答相關性 (Answer Relevance)

```json
{
  "openinference.span.kind": "EVALUATOR",
  "input.value": "{\"question\": \"法國的首都是哪裡？\", \"answer\": \"法國的首都是巴黎。\"}",
  "input.mime_type": "application/json",
  "output.value": "0.95",
  "metadata.evaluator_name": "answer_relevance",
  "metadata.score": 0.95,
  "metadata.label": "relevant",
  "metadata.explanation": "回答直接針對問題提供了正確資訊"
}
```

## 範例：忠實度檢查 (Faithfulness Check)

```json
{
  "openinference.span.kind": "EVALUATOR",
  "input.value": "{\"context\": \"巴黎位於法國。\", \"answer\": \"巴黎是法國的首都。\"}",
  "input.mime_type": "application/json",
  "output.value": "0.5",
  "metadata.evaluator_name": "faithfulness",
  "metadata.score": 0.5,
  "metadata.label": "partially_faithful",
  "metadata.explanation": "回答對於巴黎是首都的主張並無相關支援證據"
}
```
