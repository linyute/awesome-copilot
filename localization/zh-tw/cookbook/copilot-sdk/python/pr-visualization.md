# 產生 PR 時長圖表

使用 Copilot 的內建功能建立一個互動式 CLI 工具，視覺化 GitHub 儲存庫的拉取請求 (Pull Request, PR) 時長分佈。

> **可執行範例：** [recipe/pr_visualization.py](recipe/pr_visualization.py)
> 
> ```bash
> cd recipe && pip install -r requirements.txt
> # 從目前的 git 儲存庫自動偵測
> python pr_visualization.py
> 
> # 明確指定一個儲存庫
> python pr_visualization.py --repo github/copilot-sdk
> ```

## 範例場景

您希望了解儲存庫中 PR 已開啟多長時間。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP 伺服器獲取 PR 資料並產生圖表影像。

## 先決條件

```bash
pip install copilot-sdk
```

## 用法

```bash
# 從目前的 git 儲存庫自動偵測
python pr_visualization.py

# 明確指定一個儲存庫
python pr_visualization.py --repo github/copilot-sdk
```

## 完整範例：pr_visualization.py

```python
#!/usr/bin/env python3

import subprocess
import sys
import os
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
        import re
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
    return input("輸入 GitHub 儲存庫 (擁有者/儲存庫名稱)：").strip()

# ============================================================================ 
# 主應用程式
# ============================================================================ 

def main():
    print("🔍 PR 時長圖表產生器\n")

    # 確定儲存庫
    args = parse_args()
    repo = None

    if "repo" in args:
        repo = args["repo"]
        print(f"📦 使用指定的儲存庫：{repo}")
    elif is_git_repo():
        detected = get_github_remote()
        if detected:
            repo = detected
            print(f"📦 偵測到 GitHub 儲存庫：{repo}")
        else:
            print("⚠️  找到 Git 儲存庫，但未偵測到 GitHub 遠端。")
            repo = prompt_for_repo()
    else:
        print("📁 不在 Git 儲存庫中。")
        repo = prompt_for_repo()

    if not repo or "/" not in repo:
        print("❌ 無效的儲存庫格式。預期格式：擁有者/儲存庫名稱")
        sys.exit(1)

    owner, repo_name = repo.split("/", 1)

    # 建立 Copilot 用戶端 - 不需要自定義工具！
    client = CopilotClient(log_level="error")
    client.start()

    session = client.create_session(
        model="gpt-5",
        system_message={
            "content": f"""
<context>
您正在分析 GitHub 儲存庫的拉取請求：{owner}/{repo_name}
目前的工作目錄為：{os.getcwd()}
</context>

<instructions>
- 使用 GitHub MCP 伺服器工具獲取 PR 資料
- 使用您的檔案與程式碼執行工具產生圖表
- 將任何產生的影像儲存到目前工作目錄
- 回應請保持簡潔
</instructions>
"""
        }
    )

    # 設定事件處理
    def handle_event(event):
        if event["type"] == "assistant.message":
            print(f"\n🤖 {event['data']['content']}\n")
        elif event["type"] == "tool.execution_start":
            print(f"  ⚙️  {event['data']['toolName']}")

    session.on(handle_event)

    # 初始提示 - 讓 Copilot 找出詳細資訊
    print("\n📊 開始分析...\n")

    session.send(prompt=f"""
      獲取 {owner}/{repo_name} 過去一週的開放拉取請求。
      計算每個 PR 的時長（以天為單位）。
      然後產生一個條形圖影像，顯示 PR 時長的分佈
      （將它們分組到合理的貯槽中，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄中的 "pr-age-chart.png"。
      最後，總結 PR 健康度 - 平均時長、最舊的 PR，以及有多少可能被視為停滯。
    """)

    session.wait_for_idle()

    # 互動式迴圈
    print("\n💡 提出後續問題或輸入 \"exit\" 退出。\n")
    print("範例：")
    print("  - \"擴展到過去一個月\"")
    print("  - \"顯示前 5 個最舊的 PR\"")
    print("  - \"改為產生圓餅圖\"")
    print("  - \"按作者而非時長分組\"")
    print()

    while True:
        user_input = input("您：").strip()

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
```

## 運作方式

1. **儲存庫偵測**：檢查 `--repo` 旗標 → git 遠端 → 提示使用者
2. **無需自定義工具**：完全依賴 Copilot CLI 的內建功能：
   - **GitHub MCP 伺服器** - 從 GitHub 獲取 PR 資料
   - **檔案工具** - 儲存產生的圖表影像
   - **程式碼執行** - 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式工作階段**：初始分析後，使用者可以要求調整

## 為何使用此方法？

| 考量層面         | 自定義工具        | 內建 Copilot                      |
| --------------- | ----------------- | --------------------------------- |
| 程式碼複雜度     | 高                | **極小**                          |
| 維護             | 您自行維護        | **Copilot 維護**                  |
| 彈性             | 固定邏輯          | **AI 決定最佳方法**               |
| 圖表類型         | 您所編寫的內容    | **Copilot 能產生的任何類型**      |
| 資料分組         | 硬編碼的貯槽      | **智慧分組**                      |
