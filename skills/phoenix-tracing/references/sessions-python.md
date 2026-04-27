# 階段 (Sessions) (Python)

透過階段 ID (session IDs) 將追蹤 (traces) 進行分組，以追蹤多輪對話。

## 設定 (Setup)

```python
from openinference.instrumentation import using_session

with using_session(session_id="user_123_conv_456"):
    response = llm.invoke(prompt)
```

## 最佳實務 (Best Practices)

**差 (BAD)：只有父 span 獲得階段 ID**

```python
from openinference.semconv.trace import SpanAttributes
from opentelemetry import trace

span = trace.get_current_span()
span.set_attribute(SpanAttributes.SESSION_ID, session_id)
response = client.chat.completions.create(...)
```

**好 (GOOD)：所有子 spans 都繼承階段 ID**

```python
with using_session(session_id):
    response = client.chat.completions.create(...)
    result = my_custom_function()
```

**原因：** `using_session()` 會自動將階段 ID 傳遞 (propagates) 到所有巢狀 (nested) spans。

## 階段 ID 模式 (Session ID Patterns)

```python
import uuid

session_id = str(uuid.uuid4())
session_id = f"user_{user_id}_conv_{conversation_id}"
session_id = f"debug_{timestamp}"
```

好 (Good)：`str(uuid.uuid4())`、`"user_123_conv_456"`
差 (Bad)：`"session_1"`、`"test"`、空字串

## 多輪對話聊天機器人範例 (Multi-Turn Chatbot Example)

```python
import uuid
from openinference.instrumentation import using_session

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
from openinference.instrumentation import using_attributes

with using_attributes(
    user_id="user_123",
    session_id="conv_456",
    metadata={"tier": "premium", "region": "us-west"}
):
    response = llm.invoke(prompt)
```

## LangChain 整合 (Integration)

LangChain 的執行緒 (threads) 會被自動識別為階段 (sessions)：

```python
from langchain.chat_models import ChatOpenAI

response = llm.invoke(
    [HumanMessage(content="Hi!")],
    config={"metadata": {"thread_id": "user_123_thread"}}
)
```

Phoenix 可識別：`thread_id`、`session_id`、`conversation_id`

## 另請參閱

- **TypeScript 階段：** `sessions-typescript.md`
- **階段文件：** https://docs.arize.com/phoenix/tracing/sessions
