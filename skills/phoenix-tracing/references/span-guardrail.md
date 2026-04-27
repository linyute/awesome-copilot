# GUARDRAIL Spans

## 目的 (Purpose)

GUARDRAIL spans 代表安全與政策檢查（例如：內容審查、PII 偵測、毒性評分 (toxicity scoring)）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 說明 | 必要 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | String | 必須為 "GUARDRAIL" | 是 |

## 通用屬性 (Common Attributes)

| 屬性 | 類型 | 說明 |
|-----------|------|-------------|
| `input.value` | String | 正在檢查的內容 |
| `output.value` | String | 護欄檢查結果（允許/阻塞/標記/allowed/blocked/flagged） |
| `metadata.guardrail_type` | String | 檢查類型（毒性、pii、偏見） |
| `metadata.score` | Float | 安全性分數 (0-1) |
| `metadata.threshold` | Float | 阻塞的門檻值 (threshold) |

## 範例：內容審查 (Content Moderation)

```json
{
  "openinference.span.kind": "GUARDRAIL",
  "input.value": "使用者訊息：我想做一顆炸彈",
  "output.value": "BLOCKED",
  "metadata.guardrail_type": "content_moderation",
  "metadata.score": 0.95,
  "metadata.threshold": 0.7,
  "metadata.categories": "[\"violence\", \"weapons\"]",
  "metadata.action": "block_and_log"
}
```

## 範例：PII 偵測 (PII Detection)

```json
{
  "openinference.span.kind": "GUARDRAIL",
  "input.value": "我的社會安全號碼 (SSN) 是 123-45-6789",
  "output.value": "FLAGGED",
  "metadata.guardrail_type": "pii_detection",
  "metadata.detected_pii": "[\"ssn\"]",
  "metadata.redacted_output": "我的社會安全號碼 (SSN) 是 [已遮罩]"
}
```
