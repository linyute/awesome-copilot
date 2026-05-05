# 工作階段 (Python) (Sessions (Python))

透過使用工作階段 ID (session ID) 將追蹤分組，來追蹤多輪對話。

## 設定 (Setup)

```python
from phoenix.otel import using_session

with using_session(session_id="user_123_conv_456"):
    response = llm.invoke(prompt)
```

## 最佳實踐 (Best Practices)

**錯誤做法：僅父項 Span 獲得工作階段 ID**

```python
from phoenix.otel import SpanAttributes
from opentelemetry import trace

span = trace.get_current_span()
span.set_attribute(SpanAttributes.SESSION_ID, session_id)
response = client.chat.completions.create(...)
```

**正確做法：所有子項 Span 皆繼承工作階段 ID**

```python
with using_session(session_id):
    response = client.chat.completions.create(...)
    result = my_custom_function()
```

**原因：** `using_session()` 會自動將工作階段 ID 傳播至所有巢狀 Span。

## 工作階段 ID 模式 (Session ID Patterns)

```python
import uuid

session_id = str(uuid.uuid4())
session_id = f"user_{user_id}_conv_{conversation_id}"
session_id = f"debug_{timestamp}"
```

正確範例：`str(uuid.uuid4())`, `"user_123_conv_456"`
錯誤範例：`"session_1"`, `"test"`, 空字串

## 多輪對話機器人範例 (Multi-Turn Chatbot Example)

```python
import uuid
from phoenix.otel import using_session

session_id = str(uuid.uuid4())
messages = []

def send_message(user_input: str) -> str:
    messages.append({"role": "user", "content": user_input})

    with using_session(session_id):
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages
        )

    assistant_message = response.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_message})
    return assistant_message
```

## 額外屬性 (Additional Attributes)

```python
from phoenix.otel import using_attributes

with using_attributes(
    user_id="user_123",
    session_id="conv_456",
    metadata={"tier": "premium", "region": "us-west"}
):
    response = llm.invoke(prompt)
```

## LangChain 整合 (LangChain Integration)

LangChain 的執行緒 (threads) 會自動被辨識為工作階段：

```python
from langchain.chat_models import ChatOpenAI

response = llm.invoke(
    [HumanMessage(content="您好！")],
    config={"metadata": {"thread_id": "user_123_thread"}}
)
```

Phoenix 可辨識：`thread_id`, `session_id`, `conversation_id`

## 參閱 (See Also)

- **TypeScript 工作階段：** `sessions-typescript.md`
- **工作階段文件：** https://docs.arize.com/phoenix/tracing/sessions
