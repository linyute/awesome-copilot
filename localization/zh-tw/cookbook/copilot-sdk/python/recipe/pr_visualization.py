#!/usr/bin/env python3

import subprocess
import sys
import os
import re
from copilot import CopilotClient

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
    return input("輸入 GitHub 存放庫 (擁有者/存放庫): ").strip()

# ============================================================================
# 主要應用程式
# ============================================================================

def main():
    print("🔍 PR 建立時間圖表產生器\n")

    # 確定存放庫
    args = parse_args()
    repo = None

    if "repo" in args:
        repo = args["repo"]
        print(f"📦 使用指定的存放庫: {repo}")
    elif is_git_repo():
        detected = get_github_remote()
        if detected:
            repo = detected
            print(f"📦 偵測到 GitHub 存放庫: {repo}")
        else:
            print("⚠️  找到 Git 存放庫但未偵測到 GitHub 遠端。")
            repo = prompt_for_repo()
    else:
        print("📁 不在 Git 存放庫中。")
        repo = prompt_for_repo()

    if not repo or "/" not in repo:
        print("❌ 存放庫格式無效。應為: 擁有者/存放庫")
        sys.exit(1)

    owner, repo_name = repo.split("/", 1)

    # 建立 Copilot 用戶端 - 不需要自訂工具！
    client = CopilotClient(log_level="error")
    client.start()

    session = client.create_session(
        model="gpt-5",
        system_message={
            "content": f""
<context>
您正在分析 GitHub 存放庫的提取要求 (Pull Request): {owner}/{repo_name}
目前工作目錄為: {os.getcwd()}
</context>

<instructions>
- 使用 GitHub MCP Server 工具獲取 PR 資料
- 使用您的檔案和程式碼執行工具產生圖表
- 將產生的任何影像儲存到目前工作目錄
- 回應請保持簡潔
</instructions>
""
        }
    )

    # 設定事件處理
    def handle_event(event):
        if event["type"] == "assistant.message":
            print(f"\n🤖 {event['data']['content']}\n")
        elif event["type"] == "tool.execution_start":
            print(f"  ⚙️  {event['data']['toolName']}")

    session.on(handle_event)

    # 初始提示 - 讓 Copilot 處理細節
    print("\n📊 開始分析...\n")

    session.send(prompt=f""
      獲取過去一週 {owner}/{repo_name} 的開放提取要求。
      計算每個 PR 的建立天數。
      然後產生一張長條圖影像，顯示 PR 建立時間的分佈
      （將它們分成合理的分組，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄下的 \"pr-age-chart.png\".
      最後，摘要 PR 健康狀況 - 平均建立時間、最舊的 PR，以及有多少可能被視為停滯。
    ")

    session.wait_for_idle()

    # 互動迴圈
    print("\n💡 詢問後續問題或輸入 \"exit\" 結束。\n")
    print("範例：")
    print("  - \"擴展到上個月\"")
    print("  - \"顯示最舊的 5 個 PR\"")
    print("  - \"改為產生圓餅圖\"")
    print("  - \"改依作者分組而非依建立時間\"")
    print()

    while True:
        user_input = input("您: ").strip()

        if user_input.lower() in ["exit", "quit"]:
            print("👋 再見！")
            break

        if user_input:
            session.send(prompt=user_input)
            session.wait_for_idle()

    session.destroy()
    client.stop()

if __name__ == "__main__":
    main()
