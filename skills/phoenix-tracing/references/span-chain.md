# CHAIN Spans

## 目的 (Purpose)

CHAIN spans 代表應用程式中的協排層 (orchestration layers)（例如：LangChain 鏈、自訂工作流程、應用程式進入點）。通常用作根 spans (root spans)。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 說明 | 必要 |
| ------------------------- | ------ | --------------- | -------- |
| `openinference.span.kind` | String | 必須為 "CHAIN" | 是 |

## 通用屬性 (Common Attributes)

CHAIN spans 通常會使用 [通用屬性 (Universal Attributes)](fundamentals-universal-attributes.md)：

- `input.value` - 進入鏈的輸入（使用者查詢、請求酬載 (request payload)）
- `output.value` - 來自鏈的輸出（最終回應）
- `input.mime_type` / `output.mime_type` - 格式指標

## 範例：根鏈 (Root Chain)

```json
{
  "openinference.span.kind": "CHAIN",
  "input.value": "{\"question\": \"法國的首都是哪裡？\"}",
  "input.mime_type": "application/json",
  "output.value": "{\"answer\": \"法國的首都是巴黎。\", \"sources\": [\"doc_123\"]}",
  "output.mime_type": "application/json",
  "session.id": "session_abc123",
  "user.id": "user_xyz789"
}
```

## 範例：巢狀子鏈 (Nested Sub-Chain)

```json
{
  "openinference.span.kind": "CHAIN",
  "input.value": "摘要此文件：...",
  "output.value": "此文件討論了..."
}
```
