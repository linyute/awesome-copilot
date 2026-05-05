# TOOL Span (TOOL Spans)

## 目的 (Purpose)

TOOL Span 代表外部工具或函式的叫用（例如 API 呼叫、資料庫查詢、計算機、自訂函式）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 | 是否必填 |
| ------------------------- | ------ | ------------------ | ----------- |
| `openinference.span.kind` | 字串 | 必須為 "TOOL" | 是 |
| `tool.name` | 字串 | 工具/函式名稱 | 建議填寫 |

## 屬性參考 (Attribute Reference)

### 工具執行屬性 (Tool Execution Attributes)

| 屬性 | 類型 | 描述 |
| ------------------ | ------------- | ------------------------------------------ |
| `tool.name` | 字串 | 工具/函式名稱 |
| `tool.description` | 字串 | 工具用途/描述 |
| `tool.parameters` | 字串 (JSON) | 定義工具參數的 JSON 結構描述 |
| `input.value` | 字串 (JSON) | 傳遞給工具的實際輸入值 |
| `output.value` | 字串 | 工具輸出/結果 |
| `output.mime_type` | 字串 | 結果內容類型（例如 "application/json"） |

## 範例 (Examples)

### API 呼叫工具 (API Call Tool)

```json
{
  "openinference.span.kind": "TOOL",
  "tool.name": "get_weather",
  "tool.description": "擷取特定地點的目前天氣",
  "tool.parameters": "{\"type\": \"object\", \"properties\": {\"location\": {\"type\": \"string\"}, \"units\": {\"type\": \"string\", \"enum\": [\"celsius\", \"fahrenheit\"]}}, \"required\": [\"location\"]}",
  "input.value": "{\"location\": \"San Francisco\", \"units\": \"celsius\"}",
  "output.value": "{\"temperature\": 18, \"conditions\": \"partly cloudy\"}"
}
```

### 計算機工具 (Calculator Tool)

```json
{
  "openinference.span.kind": "TOOL",
  "tool.name": "calculator",
  "tool.description": "執行數學運算",
  "tool.parameters": "{\"type\": \"object\", \"properties\": {\"expression\": {\"type\": \"string\", \"description\": \"要評估的數學運算式\"}}, \"required\": [\"expression\"]}",
  "input.value": "{\"expression\": \"2 + 2\"}",
  "output.value": "4"
}
```

### 資料庫查詢工具 (Database Query Tool)

```json
{
  "openinference.span.kind": "TOOL",
  "tool.name": "sql_query",
  "tool.description": "對使用者資料庫執行 SQL 查詢",
  "tool.parameters": "{\"type\": \"object\", \"properties\": {\"query\": {\"type\": \"string\", \"description\": \"要執行的 SQL 查詢\"}}, \"required\": [\"query\"]}",
  "input.value": "{\"query\": \"SELECT * FROM users WHERE id = 123\"}",
  "output.value": "[{\"id\": 123, \"name\": \"Alice\", \"email\": \"alice@example.com\"}]",
  "output.mime_type": "application/json"
}
```
