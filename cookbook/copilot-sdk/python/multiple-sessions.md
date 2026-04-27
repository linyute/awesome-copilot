---
description: '處理多個會話的範例'
---

# 處理多個會話

同時管理多個獨立的對話。

> **可執行範例：** [recipe/multiple_sessions.py](recipe/multiple_sessions.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> python multiple_sessions.py
> ```

## 範例情境

您需要平行執行多個對話，每個對話都有自己的上下文和歷史記錄。

## Python

```python
import asyncio
from copilot import CopilotClient, SessionConfig, MessageOptions, PermissionHandler

async def main():
    client = CopilotClient()
    await client.start()

    # 建立多個獨立的會話
    session1 = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))
    session2 = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))
    session3 = await client.create_session(SessionConfig(model="claude-sonnet-4.5",
        on_permission_request=PermissionHandler.approve_all))

    # 每個會話都維持自己的對話歷史記錄
    await session1.send(MessageOptions(prompt="您正在協助進行 Python 專案"))
    await session2.send(MessageOptions(prompt="您正在協助進行 TypeScript 專案"))
    await session3.send(MessageOptions(prompt="您正在協助進行 Go 專案"))

    # 後續訊息會保留在其各自的上下文中
    await session1.send(MessageOptions(prompt="我該如何建立虛擬環境？"))
    await session2.send(MessageOptions(prompt="我該如何設定 tsconfig？"))
    await session3.send(MessageOptions(prompt="我該如何初始化模組？"))

    # 清理所有會話
    await session1.destroy()
    await session2.destroy()
    await session3.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

## 自訂會話 ID

使用自訂 ID 以便於追蹤：

```python
session = await client.create_session(SessionConfig(
    session_id="user-123-chat",
    model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

print(session.session_id)  # "user-123-chat"
```

## 列出會話

```python
sessions = await client.list_sessions()
for session_info in sessions:
    print(f"會話：{session_info.session_id}")
```

## 刪除會話

```python
# 刪除特定會話
await client.delete_session("user-123-chat")
```

## 使用案例

- **多使用者應用程式**：每個使用者一個會話
- **多任務工作流程**：針對不同任務使用個別會話
- **A/B 測試**：比較來自不同模型的回應
