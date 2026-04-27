#!/usr/bin/env python3

import asyncio
from copilot import CopilotClient, SessionConfig, MessageOptions, PermissionHandler

async def main():
    client = CopilotClient()
    await client.start()

    # 使用可識別的 ID 建立對話
    session = await client.create_session(SessionConfig(
        session_id="user-123-conversation",
        model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

    await session.send_and_wait(MessageOptions(prompt="讓我們討論 TypeScript 泛型"))
    print(f"對話已建立: {session.session_id}")

    # 銷毀對話，但將資料儲存在磁碟中
    await session.destroy()
    print("對話已銷毀 (狀態已儲存)")

    # 恢復先前的對話
    resumed = await client.resume_session("user-123-conversation", on_permission_request=PermissionHandler.approve_all)
    print(f"已恢復: {resumed.session_id}")

    await resumed.send_and_wait(MessageOptions(prompt="我們剛剛在討論什麼?"))

    # 列出對話
    sessions = await client.list_sessions()
    print("對話:", [s.session_id for s in sessions])

    # 永久刪除對話
    await client.delete_session("user-123-conversation")
    print("對話已刪除")

    await resumed.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
