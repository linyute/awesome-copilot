# AGENT Spans

AGENT spans 代表自主推理區塊 (autonomous reasoning blocks)（例如：ReAct 代理、規劃迴圈 (planning loops)、多步驟決策）。

**必要項：** `openinference.span.kind` = "AGENT"

## 範例 (Example)

```json
{
  "openinference.span.kind": "AGENT",
  "input.value": "預訂下週一飛往紐約的航班",
  "output.value": "我已預訂 AA123 航班，週一上午 9:00 出發"
}
```
