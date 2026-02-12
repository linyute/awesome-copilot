#!/usr/bin/env python3

"""
Ralph loop：具有每次反覆運算全新內容的自主 AI 任務迴圈。

兩種模式：
  - "plan"：讀取 PROMPT_plan.md，產生/更新 IMPLEMENTATION_PLAN.md
  - "build"：讀取 PROMPT_build.md，實作任務、執行測試、提交

每次反覆運算都會建立一個新的工作階段，以便代理程式始終在其內容視窗的
「智慧區域」內運作。狀態透過磁碟上的檔案 (IMPLEMENTATION_PLAN.md、AGENTS.md、specs/*)
在反覆運算之間共享。

用法：
  python ralph_loop.py              # 建構模式，50 次反覆運算
  python ralph_loop.py plan         # 規劃模式
  python ralph_loop.py 20           # 建構模式，20 次反覆運算
  python ralph_loop.py plan 5       # 規劃模式，5 次反覆運算
"""

import asyncio
import sys
from pathlib import Path

from copilot import CopilotClient, MessageOptions, SessionConfig


async def ralph_loop(mode: str = "build", max_iterations: int = 50):
    prompt_file = "PROMPT_plan.md" if mode == "plan" else "PROMPT_build.md"

    client = CopilotClient()
    await client.start()

    print("━" * 40)
    print(f"模式:   {mode}")
    print(f"提示字: {prompt_file}")
    print(f"上限:    {max_iterations} 次反覆運算")
    print("━" * 40)

    try:
        prompt = Path(prompt_file).read_text()

        for i in range(1, max_iterations + 1):
            print(f"\n=== 反覆運算 {i}/{max_iterations} ===")

            session = await client.create_session(SessionConfig(
                model="gpt-5.1-codex-mini",
                # 將代理程式固定在專案目錄
                working_directory=str(Path.cwd()),
                # 自動核准工具呼叫以進行自動化執行
                on_permission_request=lambda _req, _ctx: {
                    "kind": "approved",
                    "rules": [],
                },
            ))

            # 記錄工具使用情況以提高可見性
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

            print(f"\n反覆運算 {i} 完成。")

        print(f"\n已達到最大反覆運算次數：{max_iterations}")
    finally:
        await client.stop()


if __name__ == "__main__":
    args = sys.argv[1:]
    mode = "plan" if "plan" in args else "build"
    max_iter = next((int(a) for a in args if a.isdigit()), 50)
    asyncio.run(ralph_loop(mode, max_iter))
