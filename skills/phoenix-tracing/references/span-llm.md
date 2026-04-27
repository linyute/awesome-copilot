# LLM Spans

代表對語言模型（OpenAI、Anthropic、本機模型等）的呼叫。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 說明 |
|-----------|------|-------------|
| `openinference.span.kind` | String | 必須為 "LLM" |
| `llm.model_name` | String | 模型識別碼（例如："gpt-4"、"claude-3-5-sonnet-20241022"） |

## 關鍵屬性 (Key Attributes)

| 類別 | 屬性 | 範例 |
|----------|------------|---------|
| **模型** | `llm.model_name`, `llm.provider` | "gpt-4-turbo", "openai" |
| **符記 (Tokens)** | `llm.token_count.prompt`, `llm.token_count.completion`, `llm.token_count.total` | 25, 8, 33 |
| **成本 (Cost)** | `llm.cost.prompt`, `llm.cost.completion`, `llm.cost.total` | 0.0021, 0.0045, 0.0066 |
| **參數 (Parameters)** | `llm.invocation_parameters` (JSON) | `{"temperature": 0.7, "max_tokens": 1024}` |
| **訊息 (Messages)** | `llm.input_messages.{i}.*`, `llm.output_messages.{i}.*` | 請參閱下方範例 |
| **工具 (Tools)** | `llm.tools.{i}.tool.json_schema` | 函式定義 |

## 成本追蹤 (Cost Tracking)

**核心屬性：**
- `llm.cost.prompt` - 總輸入成本 (USD)
- `llm.cost.completion` - 總輸出成本 (USD)
- `llm.cost.total` - 總成本 (USD)

**詳細成本明細 (Detailed cost breakdown)：**
- `llm.cost.prompt_details.{input,cache_read,cache_write,audio}` - 輸入成本組成部分
- `llm.cost.completion_details.{output,reasoning,audio}` - 輸出成本組成部分

## 訊息 (Messages)

**輸入訊息 (Input messages)：**
- `llm.input_messages.{i}.message.role` - "user"、"assistant"、"system"、"tool"
- `llm.input_messages.{i}.message.content` - 文字內容
- `llm.input_messages.{i}.message.contents.{j}` - 多模態 (Multimodal)（文字 + 圖片）
- `llm.input_messages.{i}.message.tool_calls` - 工具呼叫

**輸出訊息 (Output messages)：** 結構與輸入訊息相同。

## 範例：基本 LLM 呼叫 (Basic LLM Call)

```json
{
  "openinference.span.kind": "LLM",
  "llm.model_name": "claude-3-5-sonnet-20241022",
  "llm.invocation_parameters": "{\"temperature\": 0.7, \"max_tokens\": 1024}",
  "llm.input_messages.0.message.role": "system",
  "llm.input_messages.0.message.content": "你是一個非常有幫助的助理。",
  "llm.input_messages.1.message.role": "user",
  "llm.input_messages.1.message.content": "法國的首都是哪裡？",
  "llm.output_messages.0.message.role": "assistant",
  "llm.output_messages.0.message.content": "法國的首都是巴黎。",
  "llm.token_count.prompt": 25,
  "llm.token_count.completion": 8,
  "llm.token_count.total": 33
}
```

## 範例：包含工具呼叫的 LLM (LLM with Tool Calls)

```json
{
  "openinference.span.kind": "LLM",
  "llm.model_name": "gpt-4-turbo",
  "llm.input_messages.0.message.content": "舊金山的天氣如何？",
  "llm.output_messages.0.message.tool_calls.0.tool_call.function.name": "get_weather",
  "llm.output_messages.0.message.tool_calls.0.tool_call.function.arguments": "{\"location\": \"San Francisco\"}",
  "llm.tools.0.tool.json_schema": "{\"type\": \"function\", \"function\": {\"name\": \"get_weather\"}}"
}
```

## 另請參閱

- **檢測 (Instrumentation)：** `instrumentation-auto-python.md`、`instrumentation-manual-python.md`
- **完整規格：** https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md
