#!/usr/bin/env python3

import asyncio
from copilot import CopilotClient, SessionConfig, MessageOptions, PermissionHandler

async def main():
    client = CopilotClient()
    await client.start()

    # 建立多個獨立對話
    session1 = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))
    session2 = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))
    session3 = await client.create_session(SessionConfig(model="claude-sonnet-4.5",
        on_permission_request=PermissionHandler.approve_all))

    print("已建立 3 個獨立對話")

    # 每個對話維護自己的對話歷程
    await session1.send(MessageOptions(prompt="您正在協助一個 Python 專案"))
    await session2.send(MessageOptions(prompt="您正在協助一個 TypeScript 專案"))
    await session3.send(MessageOptions(prompt="您正在協助一個 Go 專案"))

    print("已將初始上下文傳送至所有對話")

    # 後續訊息保留在各自的上下文中
    await session1.send(MessageOptions(prompt="我該如何建立虛擬環境?"))
    await session2.send(MessageOptions(prompt="我該如何設定 tsconfig?"))
    await session3.send(MessageOptions(prompt="我該如何初始化模組?"))

    print("已傳送後續問題至各個對話")

    # 清理所有對話
    await session1.destroy()
    await session2.destroy()
    await session3.destroy()
    await client.stop()

    print("所有對話已成功銷毀")

if __name__ == "__main__":
    asyncio.run(main())
