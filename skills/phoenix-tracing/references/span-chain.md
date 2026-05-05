# CHAIN Span (CHAIN Spans)

## 目的 (Purpose)

CHAIN Span 代表應用程式中的編排層（例如 LangChain 鏈、自訂工作流程、應用程式進入點）。通常被用作根 Span (root spans)。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 | 是否必填 |
| ------------------------- | ------ | --------------- | -------- |
| `openinference.span.kind` | 字串 | 必須為 "CHAIN" | 是 |

## 常用屬性 (Common Attributes)

CHAIN Span 通常使用 [通用屬性 (Universal Attributes)](fundamentals-universal-attributes.md)：

- `input.value` - 鏈的輸入（使用者查詢、要求內容）
- `output.value` - 鏈的輸出（最終回應）
- `input.mime_type` / `output.mime_type` - 格式指示符

## 範例：根鏈 (Example: Root Chain)

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

## 範例：巢狀子鏈 (Example: Nested Sub-Chain)

```json
{
  "openinference.span.kind": "CHAIN",
  "input.value": "總結此文件：...",
  "output.value": "此文件討論了..."
}
```
