# Phoenix 追蹤：自訂中介資料 (Python) (Phoenix Tracing: Custom Metadata (Python))

為 Span 新增自訂屬性，以獲得更豐富的可觀測性。

## 安裝 (Install)

```bash
pip install arize-phoenix-otel  # 自 0.16.0 版本起重新匯出上下文管理員與 SpanAttributes
```

## 工作階段 (Session)

```python
from phoenix.otel import using_session

with using_session(session_id="my-session-id"):
    # Span 將獲得："session.id" = "my-session-id"
    ...
```

## 使用者 (User)

```python
from phoenix.otel import using_user

with using_user("my-user-id"):
    # Span 將獲得："user.id" = "my-user-id"
    ...
```

## 中介資料 (Metadata)

```python
from phoenix.otel import using_metadata

with using_metadata({"key": "value", "experiment_id": "exp_123"}):
    # Span 將獲得："metadata" = '{"key": "value", "experiment_id": "exp_123"}'
    ...
```

## 標籤 (Tags)

```python
from phoenix.otel import using_tags

with using_tags(["tag_1", "tag_2"]):
    # Span 將獲得："tag.tags" = '["tag_1", "tag_2"]'
    ...
```

## 組合使用 (using_attributes) (Combined (using_attributes))

```python
from phoenix.otel import using_attributes

with using_attributes(
    session_id="my-session-id",
    user_id="my-user-id",
    metadata={"environment": "production"},
    tags=["prod", "v2"],
    prompt_template="Answer: {question}",
    prompt_template_version="v1.0",
    prompt_template_variables={"question": "What is Phoenix?"},
):
    # 所有屬性都會套用於此上下文中的 Span
    ...
```

## 在單一 Span 上設定 (On a Single Span)

```python
span.set_attribute("metadata", json.dumps({"key": "value"}))
span.set_attribute("user.id", "user_123")
span.set_attribute("session.id", "session_456")
```

## 作為裝飾器使用 (As Decorators)

所有的上下文管理員都可以作為裝飾器使用：

```python
from phoenix.otel import using_session, using_user, using_metadata

@using_session(session_id="my-session-id")
@using_user("my-user-id")
@using_metadata({"env": "prod"})
def my_function():
    ...
```
