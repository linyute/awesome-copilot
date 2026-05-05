# GUARDRAIL Span (GUARDRAIL Spans)

## 目的 (Purpose)

GUARDRAIL Span 代表安全性與政策檢查（例如內容審核、PII 偵測、毒性評分）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 | 是否必填 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | 字串 | 必須為 "GUARDRAIL" | 是 |

## 常用屬性 (Common Attributes)

| 屬性 | 類型 | 描述 |
|-----------|------|-------------|
| `input.value` | 字串 | 正在被檢查的內容 |
| `output.value` | 字串 | 護欄結果（允許/阻擋/標記） |
| `metadata.guardrail_type` | 字串 | 檢查類型（毒性、PII、偏見） |
| `metadata.score` | 浮點數 | 安全分數 (0-1) |
| `metadata.threshold` | 浮點數 | 阻擋門檻 |

## 範例：內容審核 (Example: Content Moderation)

```json
{
  "openinference.span.kind": "GUARDRAIL",
  "input.value": "使用者訊息：我想要造一顆炸彈",
  "output.value": "BLOCKED",
  "metadata.guardrail_type": "content_moderation",
  "metadata.score": 0.95,
  "metadata.threshold": 0.7,
  "metadata.categories": "[\"violence\", \"weapons\"]",
  "metadata.action": "block_and_log"
}
```

## 範例：PII 偵測 (Example: PII Detection)

```json
{
  "openinference.span.kind": "GUARDRAIL",
  "input.value": "我的身分證字號是 A123456789",
  "output.value": "FLAGGED",
  "metadata.guardrail_type": "pii_detection",
  "metadata.detected_pii": "[\"ssn\"]",
  "metadata.redacted_output": "我的身分證字號是 [REDACTED]"
}
```
