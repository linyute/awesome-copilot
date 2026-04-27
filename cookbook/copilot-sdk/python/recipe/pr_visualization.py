#!/usr/bin/env python3

import asyncio
import subprocess
import sys
import os
import re
from copilot import (
    CopilotClient,
    SessionConfig,
    MessageOptions,
    SessionEvent,
    PermissionHandler,
)

# ============================================================================
# Git 與 GitHub 偵測
# ============================================================================

def is_git_repo():
    try:
        subprocess.run(
            ["git", "rev-parse", "--git-dir"],
            check=True,
            capture_output=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def get_github_remote():
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            check=True,
            capture_output=True,
            text=True
        )
        remote_url = result.stdout.strip()

        # 處理 SSH: git@github.com:owner/repo.git
        ssh_match = re.search(r"git@github\.com:(.+/.+?)(?:\.git)?$", remote_url)
        if ssh_match:
            return ssh_match.group(1)

        # 處理 HTTPS: https://github.com/owner/repo.git
        https_match = re.search(r"https://github\.com/(.+/.+?)(?:\.git)?$", remote_url)
        if https_match:
            return https_match.group(1)

        return None
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None

def parse_args():
    args = sys.argv[1:]
    if "--repo" in args:
        idx = args.index("--repo")
        if idx + 1 < len(args):
            return {"repo": args[idx + 1]}
    return {}

def prompt_for_repo():
    return input("輸入 GitHub 儲存庫 (擁有者/儲存庫名稱): ").strip()

# ============================================================================
# 主要應用程式
# ============================================================================

async def main():
    print("🔍 PR 年齡圖表產生器\n")

    # 決定儲存庫
    args = parse_args()
    repo = None

    if "repo" in args:
        repo = args["repo"]
        print(f"📦 使用指定的儲存庫: {repo}")
    elif is_git_repo():
        detected = get_github_remote()
        if detected:
            repo = detected
            print(f"📦 偵測到的 GitHub 儲存庫: {repo}")
        else:
            print("⚠️  找到 Git 儲存庫，但未偵測到 GitHub 遠端。")
            repo = prompt_for_repo()
    else:
        print("📁 不在 Git 儲存庫中。")
        repo = prompt_for_repo()

    if not repo or "/" not in repo:
        print("❌ 無效的儲存庫格式。應為: 擁有者/儲存庫名稱")
        sys.exit(1)

    owner, repo_name = repo.split("/", 1)

    # 建立 Copilot 用戶端
    client = CopilotClient()
    await client.start()

    session = await client.create_session(SessionConfig(
        model="gpt-5",
        system_message={
            "content": f"""
<context>
您正在分析 GitHub 儲存庫的 Pull Request: {owner}/{repo_name}
目前的工作目錄是: {os.getcwd()}
</context>

<instructions>
- 使用 GitHub MCP 伺服器工具擷取 PR 資料
- 使用檔案與程式碼執行工具產生圖表
- 將任何產生的圖片儲存到目前的工作目錄
- 回覆應簡潔扼要
</instructions>
"""
        },
        on_permission_request=PermissionHandler.approve_all))

    done = asyncio.Event()

    # 設定事件處理
    def handle_event(event: SessionEvent):
        if event.type.value == "assistant.message":
            print(f"\n🤖 {event.data.content}\n")
        elif event.type.value == "tool.execution_start":
            print(f"  ⚙️  {event.data.tool_name}")
        elif event.type.value == "session.idle":
            done.set()

    session.on(handle_event)

    # 初始提示 - 讓 Copilot 找出詳細資訊
    print("\n📊 開始分析...\n")

    await session.send(MessageOptions(prompt=f"""
      從過去一週起擷取 {owner}/{repo_name} 的開啟中的 Pull Request。
      計算每個 PR 的天數。
      接著產生一張長條圖圖片，顯示 PR 年齡的分佈
      (將它們分組為合理的桶狀，例如 <1 天, 1-3 天等)。
      將圖表儲存為 "pr-age-chart.png" 在目前的目錄中。
      最後，總結 PR 的健康狀況 - 平均年齡、最舊的 PR，以及多少 PR 可能被視為過期。
    """))

    await done.wait()

    # 互動迴圈
    print("\n💡 詢問後續問題或輸入 \"exit\" 以離開。\n")
    print("範例:")
    print("  - \"擴展到上個月\"")
    print("  - \"顯示我 5 個最舊的 PR\"")
    print("  - \"改為產生圓餅圖\"")
    print("  - \"改為按作者分組而非按年齡\"")
    print()

    while True:
        user_input = input("您: ").strip()

        if user_input.lower() in ["exit", "quit"]:
            print("👋 再見!")
            break

        if user_input:
            done.clear()
            await session.send(MessageOptions(prompt=user_input))
            await done.wait()

    await session.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
