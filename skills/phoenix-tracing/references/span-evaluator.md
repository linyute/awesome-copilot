# EVALUATOR Span (EVALUATOR Spans)

## 目的 (Purpose)

EVALUATOR Span 代表品質評估操作（例如答案相關性、忠實度、幻覺偵測）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 | 是否必填 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | 字串 | 必須為 "EVALUATOR" | 是 |

## 常用屬性 (Common Attributes)

| 屬性 | 類型 | 描述 |
|-----------|------|-------------|
| `input.value` | 字串 | 正在被評估的內容 |
| `output.value` | 字串 | 評估結果（分數、標籤、解釋） |
| `metadata.evaluator_name` | 字串 | 評估者識別碼 |
| `metadata.score` | 浮點數 | 數值分數 (0-1) |
| `metadata.label` | 字串 | 類別型標籤（相關/不相關） |

## 範例：答案相關性 (Example: Answer Relevance)

```json
{
  "openinference.span.kind": "EVALUATOR",
  "input.value": "{\"question\": \"法國的首都是哪裡？\", \"answer\": \"法國的首都是巴黎。\"}",
  "input.mime_type": "application/json",
  "output.value": "0.95",
  "metadata.evaluator_name": "answer_relevance",
  "metadata.score": 0.95,
  "metadata.label": "relevant",
  "metadata.explanation": "答案直接回答了問題，且資訊正確"
}
```

## 範例：忠實度檢查 (Example: Faithfulness Check)

```json
{
  "openinference.span.kind": "EVALUATOR",
  "input.value": "{\"context\": \"巴黎在法國。\", \"answer\": \"巴黎是法國的首都。\"}",
  "input.mime_type": "application/json",
  "output.value": "0.5",
  "metadata.evaluator_name": "faithfulness",
  "metadata.score": 0.5,
  "metadata.label": "partially_faithful",
  "metadata.explanation": "答案中關於巴黎是法國首都的主張未獲支持"
}
```
