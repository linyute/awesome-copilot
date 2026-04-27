---
description: '會話持久性與恢復範例'
---

# 會話持久性與恢復

在應用程式重新啟動後儲存並還原對話會話。

## 範例情境

您希望使用者即使在關閉並重新開啟您的應用程式後，也能繼續之前的對話。

> **可執行範例：** [recipe/persisting_sessions.py](recipe/persisting_sessions.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> python persisting_sessions.py
> ```

### 使用自訂 ID 建立會話

```python
import asyncio
from copilot import CopilotClient, SessionConfig, MessageOptions, PermissionHandler

async def main():
    client = CopilotClient()
    await client.start()

    # 使用易於記憶的 ID 建立會話
    session = await client.create_session(SessionConfig(
        session_id="user-123-conversation",
        model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

    await session.send_and_wait(MessageOptions(prompt="讓我們討論 TypeScript 泛型"))

    # 會話 ID 已保留
    print(session.session_id)  # "user-123-conversation"

    # 銷毀會話，但將資料保留在磁碟上
    await session.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

### 恢復會話

```python
client = CopilotClient()
await client.start()

# 恢復之前的會話
session = await client.resume_session("user-123-conversation", on_permission_request=PermissionHandler.approve_all)

# 之前的上下文已還原
await session.send_and_wait(MessageOptions(prompt="我們剛才在討論什麼？"))

await session.destroy()
await client.stop()
```

### 列出可用會話

```python
sessions = await client.list_sessions()
for s in sessions:
    print("會話：", s.session_id)
```

### 永久刪除會話

```python
# 從磁碟中移除會話及其所有資料
await client.delete_session("user-123-conversation")
```

### 取得會話歷史記錄

```python
messages = await session.get_messages()
for msg in messages:
    print(f"[{msg.type}] {msg.data.content}")
```

## 最佳實踐

1. **使用有意義的會話 ID**：將使用者 ID 或上下文包含在會話 ID 中
2. **處理缺失的會話**：在恢復前檢查會話是否存在
3. **清理舊會話**：定期刪除不再需要的會話
