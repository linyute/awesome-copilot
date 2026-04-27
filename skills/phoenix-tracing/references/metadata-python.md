# Phoenix 追蹤：自訂 Metadata (Python)

將自訂屬性加入至 spans 以實現更豐富的可觀測性 (observability)。

## 安裝 (Install)

```bash
pip install openinference-instrumentation
```

## 階段 (Session)

```python
from openinference.instrumentation import using_session

with using_session(session_id="my-session-id"):
    # spans 將會獲得："session.id" = "my-session-id"
    ...
```

## 使用者 (User)

```python
from openinference.instrumentation import using_user

with using_user("my-user-id"):
    # spans 將會獲得："user.id" = "my-user-id"
    ...
```

## Metadata

```python
from openinference.instrumentation import using_metadata

with using_metadata({"key": "value", "experiment_id": "exp_123"}):
    # spans 將會獲得："metadata" = '{"key": "value", "experiment_id": "exp_123"}'
    ...
```

## 標籤 (Tags)

```python
from openinference.instrumentation import using_tags

with using_tags(["tag_1", "tag_2"]):
    # spans 將會獲得："tag.tags" = '["tag_1", "tag_2"]'
    ...
```

## 組合使用 (using_attributes)

```python
from openinference.instrumentation import using_attributes

with using_attributes(
    session_id="my-session-id",
    user_id="my-user-id",
    metadata={"environment": "production"},
    tags=["prod", "v2"],
    prompt_template="Answer: {question}",
    prompt_template_version="v1.0",
    prompt_template_variables={"question": "What is Phoenix?"},
):
    # 此內容 (context) 中的所有屬性都將套用到 spans
    ...
```

## 在單一 Span 上

```python
span.set_attribute("metadata", json.dumps({"key": "value"}))
span.set_attribute("user.id", "user_123")
span.set_attribute("session.id", "session_456")
```

## 作為裝飾器 (Decorators)

所有上下文管理器都可以作為裝飾器使用：

```python
@using_session(session_id="my-session-id")
@using_user("my-user-id")
@using_metadata({"env": "prod"})
def my_function():
    ...
```
