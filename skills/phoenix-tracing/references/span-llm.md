# LLM Span (LLM Spans)

代表對語言模型（OpenAI, Anthropic, 本地端模型等）的呼叫。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 |
|-----------|------|-------------|
| `openinference.span.kind` | 字串 | 必須為 "LLM" |
| `llm.model_name` | 字串 | 模型識別碼（例如 "gpt-4", "claude-3-5-sonnet-20241022"） |

## 關鍵屬性 (Key Attributes)

| 類別 | 屬性 | 範例 |
|----------|------------|---------|
| **模型** | `llm.model_name`, `llm.provider` | "gpt-4-turbo", "openai" |
| **權杖 (Tokens)** | `llm.token_count.prompt`, `llm.token_count.completion`, `llm.token_count.total` | 25, 8, 33 |
| **成本 (Cost)** | `llm.cost.prompt`, `llm.cost.completion`, `llm.cost.total` | 0.0021, 0.0045, 0.0066 |
| **參數 (Parameters)** | `llm.invocation_parameters` (JSON) | `{"temperature": 0.7, "max_tokens": 1024}` |
| **訊息 (Messages)** | `llm.input_messages.{i}.*`, `llm.output_messages.{i}.*` | 參見下方的範例 |
| **工具 (Tools)** | `llm.tools.{i}.tool.json_schema` | 函式定義 |

## 成本追蹤 (Cost Tracking)

**核心屬性：**
- `llm.cost.prompt` - 總輸入成本（美元）
- `llm.cost.completion` - 總輸出成本（美元）
- `llm.cost.total` - 總成本（美元）

**詳細成本分解：**
- `llm.cost.prompt_details.{input,cache_read,cache_write,audio}` - 輸入成本組成部分
- `llm.cost.completion_details.{output,reasoning,audio}` - 輸出成本組成部分

## 訊息 (Messages)

**輸入訊息：**
- `llm.input_messages.{i}.message.role` - "user", "assistant", "system", "tool"
- `llm.input_messages.{i}.message.content` - 文字內容
- `llm.input_messages.{i}.message.contents.{j}` - 多模態（文字 + 圖片）
- `llm.input_messages.{i}.message.tool_calls` - 工具叫用

**輸出訊息：** 結構與輸入訊息相同。

## 範例：基本的 LLM 呼叫 (Example: Basic LLM Call)

```json
{
  "openinference.span.kind": "LLM",
  "llm.model_name": "claude-3-5-sonnet-20241022",
  "llm.invocation_parameters": "{\"temperature\": 0.7, \"max_tokens\": 1024}",
  "llm.input_messages.0.message.role": "system",
  "llm.input_messages.0.message.content": "您是一位有用的助理。",
  "llm.input_messages.1.message.role": "user",
  "llm.input_messages.1.message.content": "法國的首都是哪裡？",
  "llm.output_messages.0.message.role": "assistant",
  "llm.output_messages.0.message.content": "法國的首都是巴黎。",
  "llm.token_count.prompt": 25,
  "llm.token_count.completion": 8,
  "llm.token_count.total": 33
}
```

## 範例：帶有工具呼叫的 LLM (Example: LLM with Tool Calls)

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

## 參閱 (See Also)

- **檢測**：`instrumentation-auto-python.md`, `instrumentation-manual-python.md`
- **完整規範**：https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md
