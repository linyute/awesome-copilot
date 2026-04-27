#!/usr/bin/env python3

"""
Ralph loop: 自主 AI 任務迴圈，每次疊代都有新的上下文。

兩種模式:
  - "plan": 讀取 PROMPT_plan.md，產生/更新 IMPLEMENTATION_PLAN.md
  - "build": 讀取 PROMPT_build.md，執行任務、執行測試、提交程式碼

每次疊代都會建立新的對話，確保 AI 永遠在上下文視窗的「最佳運作區」中運作。
狀態透過磁碟檔案 (IMPLEMENTATION_PLAN.md, AGENTS.md, specs/*) 在疊代之間共享。

用法:
  python ralph_loop.py              # 執行 build 模式，50 次疊代
  python ralph_loop.py plan         # 執行規劃模式
  python ralph_loop.py 20           # 執行 build 模式，20 次疊代
  python ralph_loop.py plan 5       # 執行規劃模式，5 次疊代
"""

import asyncio
import sys
from pathlib import Path

from copilot import CopilotClient, MessageOptions, SessionConfig, PermissionHandler


async def ralph_loop(mode: str = "build", max_iterations: int = 50):
    prompt_file = "PROMPT_plan.md" if mode == "plan" else "PROMPT_build.md"

    client = CopilotClient()
    await client.start()

    print("━" * 40)
    print(f"模式:   {mode}")
    print(f"提示: {prompt_file}")
    print(f"最大疊代次數:    {max_iterations}")
    print("━" * 40)

    try:
        prompt = Path(prompt_file).read_text()

        for i in range(1, max_iterations + 1):
            print(f"\n=== 疊代 {i}/{max_iterations} ===")

            session = await client.create_session(SessionConfig(
                model="gpt-5.1-codex-mini",
                # 將 AI 固定在專案目錄
                working_directory=str(Path.cwd()),
                # 為無人值守的操作自動批准工具呼叫
                on_permission_request=PermissionHandler.approve_all,
            ))

            # 記錄工具使用以利檢視
            def log_tool_event(event):
                if event.type.value == "tool.execution_start":
                    print(f"  ⚙ {event.data.tool_name}")

            session.on(log_tool_event)
            try:
                await session.send_and_wait(
                    MessageOptions(prompt=prompt), timeout=600
                )
            finally:
                await session.destroy()

            print(f"\n疊代 {i} 已完成。")

        print(f"\n達到最大疊代次數: {max_iterations}")
    finally:
        await client.stop()


if __name__ == "__main__":
    args = sys.argv[1:]
    mode = "plan" if "plan" in args else "build"
    max_iter = next((int(a) for a in args if a.isdigit()), 50)
    asyncio.run(ralph_loop(mode, max_iter))
