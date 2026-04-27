# 產生 PR 年齡圖表

建立一個互動式的 CLI 工具，使用 Copilot 的內建功能將 GitHub 儲存庫的 Pull Request 年齡分佈視覺化。

> **可執行範例：** [recipe/pr_visualization.py](recipe/pr_visualization.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> # 從目前的 git 儲存庫自動偵測
> python pr_visualization.py
>
> # 明確指定儲存庫
> python pr_visualization.py --repo github/copilot-sdk
> ```

## 範例情境

您想要了解儲存庫中的 PR 開啟了多久。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP Server 擷取 PR 資料並產生圖表影像。

## 先決條件

```bash
pip install github-copilot-sdk
```

## 使用方式

```bash
# 從目前的 git 儲存庫自動偵測
python pr_visualization.py

# 明確指定儲存庫
python pr_visualization.py --repo github/copilot-sdk
```

## 完整範例: pr_visualization.py

```python
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
# Git & GitHub 偵測
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
    return input("請輸入 GitHub 儲存庫 (owner/repo): ").strip()

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
            print(f"📦 偵測到 GitHub 儲存庫: {repo}")
        else:
            print("⚠️  找到 Git 儲存庫但未偵測到 GitHub 遠端。")
            repo = prompt_for_repo()
    else:
        print("📁 不在 git 儲存庫中。")
        repo = prompt_for_repo()

    if not repo or "/" not in repo:
        print("❌ 無效的儲存庫格式。預期格式: owner/repo")
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
目前的作業目錄為: {os.getcwd()}
</context>

<instructions>
- 使用 GitHub MCP Server 工具來擷取 PR 資料
- 使用您的檔案和程式碼執行工具來產生圖表
- 將產生的任何影像儲存到目前的目錄
- 您的回應要簡潔
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

    # 初始提示 - 讓 Copilot 決定細節
    print("\n📊 開始分析...\n")

    await session.send(MessageOptions(prompt=f"""
      從過去一週擷取 {owner}/{repo_name} 的開啟 Pull Request。
      計算每個 PR 的年齡 (天數)。
      然後產生一張長條圖，顯示 PR 年齡的分佈
      (將它們分組為合理的桶子，例如 <1 天，1-3 天等)。
      將圖表儲存為 "pr-age-chart.png" 於目前目錄中。
      最後，總結 PR 的健康狀況 - 平均年齡、最古老的 PR，以及有多少個可能被認為是滯後的。
    """))

    await done.wait()

    # 互動迴圈
    print("\n💡 詢問後續問題或輸入 \"exit\" 離開。\n")
    print("範例:")
    print("  - \"擴展到上個月\"")
    print("  - \"顯示我 5 個最古老的 PR\"")
    print("  - \"改為產生圓餅圖\"")
    print("  - \"按作者而不是年齡進行分組\"")
    print()

    while True:
        user_input = input("您: ").strip()

        if user_input.lower() in ["exit", "quit"]:
            print("👋 再見！")
            break

        if user_input:
            done.clear()
            await session.send(MessageOptions(prompt=user_input))
            await done.wait()

    await session.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

## 運作原理

1. **儲存庫偵測**：檢查 `--repo` 旗標 → git 遠端 → 提示使用者
2. **無自訂工具**：完全依賴 Copilot CLI 的內建功能：
   - **GitHub MCP Server** - 從 GitHub 擷取 PR 資料
   - **檔案工具** - 儲存產生的圖表影像
   - **程式碼執行** - 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式呼叫**：在初步分析後，使用者可以要求調整

## 為什麼採用這種方法？

| 構面 | 自訂工具 | 內建 Copilot |
| --------------- | ----------------- | --------------------------------- |
| 程式碼複雜度 | 高 | **最低** |
| 維護 | 您自行維護 | **Copilot 維護** |
| 彈性 | 固定邏輯 | **AI 決定最佳方法** |
| 圖表類型 | 您編寫的內容 | **Copilot 可產生的任何類型** |
| 資料分組 | 硬編碼分組 | **智慧分組** |
