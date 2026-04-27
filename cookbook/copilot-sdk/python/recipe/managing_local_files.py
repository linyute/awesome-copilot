#!/usr/bin/env python3

import asyncio
import os
from copilot import (
    CopilotClient,
    SessionConfig,
    MessageOptions,
    SessionEvent,
    PermissionHandler,
)

async def main():
    # 建立並啟動用戶端
    client = CopilotClient()
    await client.start()

    # 建立對話
    session = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

    done = asyncio.Event()

    # 事件處理常式
    def handle_event(event: SessionEvent):
        if event.type.value == "assistant.message":
            print(f"\nCopilot: {event.data.content}")
        elif event.type.value == "tool.execution_start":
            print(f"  → 執行中: {event.data.tool_name}")
        elif event.type.value == "tool.execution_complete":
            print(f"  ✓ 已完成: {event.data.tool_call_id}")
        elif event.type.value == "session.idle":
            done.set()

    session.on(handle_event)

    # 要求 Copilot 整理檔案
    # 將此變更為您的目標資料夾
    target_folder = os.path.expanduser("~/Downloads")

    await session.send(MessageOptions(prompt=f"""
分析 "{target_folder}" 中的檔案並將它們整理到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽按檔案副檔名分組
3. 建立適當的子資料夾 (例如 "images", "documents", "videos")
4. 將每個檔案移動到其對應的子資料夾

移動任何檔案前請先確認。
"""))

    await done.wait()

    await session.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
