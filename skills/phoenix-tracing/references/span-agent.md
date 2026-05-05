# AGENT Span (AGENT Spans)

AGENT Span 代表自主推理區塊（例如 ReAct 代理程式、規劃循環、多步驟決策）。

**必填：** `openinference.span.kind` = "AGENT"

## 範例 (Example)

```json
{
  "openinference.span.kind": "AGENT",
  "input.value": "預訂下週一前往紐約的航班",
  "output.value": "我已預訂 AA123 航班，於週一上午 9:00 起飛"
}
```
