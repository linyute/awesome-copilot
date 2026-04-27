# 扁平化慣例 (Flattening Convention)

OpenInference 會將巢狀資料結構扁平化為點號標法 (dot-notation) 的屬性，以實現資料庫相容性、OpenTelemetry 相容性以及簡單的查詢。

## 扁平化規則 (Flattening Rules)

**物件 (Objects) → 點號標法**

```javascript
{ llm: { model_name: "gpt-4", token_count: { prompt: 10, completion: 20 } } }
// 變為
{ "llm.model_name": "gpt-4", "llm.token_count.prompt": 10, "llm.token_count.completion": 20 }
```

**陣列 (Arrays) → 零索引標法 (Zero-Indexed Notation)**

```javascript
{ llm: { input_messages: [{ role: "user", content: "Hi" }] } }
// 變為
{ "llm.input_messages.0.message.role": "user", "llm.input_messages.0.message.content": "Hi" }
```

**訊息慣例：必須包含 `.message.` 段 (segment)**

```
llm.input_messages.{index}.message.{field}
llm.input_messages.0.message.tool_calls.0.tool_call.function.name
```

## 完整範例 (Complete Example)

```javascript
// 原始資料
{
  openinference: { span: { kind: "LLM" } },
  llm: {
    model_name: "claude-3-5-sonnet-20241022",
    invocation_parameters: { temperature: 0.7, max_tokens: 1000 },
    input_messages: [{ role: "user", content: "Tell me a joke" }],
    output_messages: [{ role: "assistant", content: "Why did the chicken cross the road?" }],
    token_count: { prompt: 5, completion: 10, total: 15 }
  }
}

// 扁平化後（儲存在 Phoenix spans.attributes JSONB 中）
{
  "openinference.span.kind": "LLM",
  "llm.model_name": "claude-3-5-sonnet-20241022",
  "llm.invocation_parameters": "{\"temperature\": 0.7, \"max_tokens\": 1000}",
  "llm.input_messages.0.message.role": "user",
  "llm.input_messages.0.message.content": "Tell me a joke",
  "llm.output_messages.0.message.role": "assistant",
  "llm.output_messages.0.message.content": "Why did the chicken cross the road?",
  "llm.token_count.prompt": 5,
  "llm.token_count.completion": 10,
  "llm.token_count.total": 15
}
```
