# Ralph Loop：自主式 AI 任務迴圈

建構自主的程式碼編寫迴圈，其中 AI 代理程式會挑選任務、實作它們、針對背壓 (測試、建構) 進行驗證、提交並重複 — 每次迭代都在全新的上下文中。

> **可執行範例：** [recipe/ralph_loop.py](recipe/ralph_loop.py)
>
> 從儲存庫根目錄安裝相依套件並執行：
>
> ```bash
> pip install -r cookbook/copilot-sdk/python/recipe/requirements.txt
> python cookbook/copilot-sdk/python/recipe/ralph_loop.py
> ```
>
> 在執行迴圈之前，請確保目前的工作目錄中存在 `PROMPT_build.md` 和 `PROMPT_plan.md`。

## 什麼是 Ralph Loop？

[Ralph loop](https://ghuntley.com/ralph/) 是一種自主開發工作流程，AI 代理程式會在隔離的上下文視窗中疊代處理任務。關鍵見解：**狀態儲存在磁碟上，而不是模型上下文中**。每次迭代都會以全新狀態開始，從檔案讀取目前的狀態，完成一個任務，將結果寫回磁碟，然後退出。

```
┌─────────────────────────────────────────────────┐
│                   loop.sh                       │
│  while true:                                    │
│    ┌─────────────────────────────────────────┐  │
│    │  全新呼叫 (隔離上下文)                  │  │
│    │                                         │  │
│    │  1. 讀取 PROMPT.md + AGENTS.md          │  │
│    │  2. 研究 specs/* 和程式碼               │  │
│    │  3. 從計畫中挑選下一個任務              │  │
│    │  4. 實作 + 執行測試                     │  │
│    │  5. 更新計畫、提交、退出                │  │
│    └─────────────────────────────────────────┘  │
│    ↻ 下次迭代 (全新上下文)                      │
└─────────────────────────────────────────────────┘
```

**核心原則：**

- **每次迭代全新的上下文**：每個迴圈都會建立一個新的呼叫 — 沒有上下文累積，始終處於「智慧區」
- **磁碟作為共享狀態**：`IMPLEMENTATION_PLAN.md` 在迭代之間持續存在，並作為協調機制
- **背壓引導品質**：測試、建構和 Lint 會拒絕糟糕的工作 — 代理程式必須在提交前修復問題
- **兩種模式**：規劃 (間隙分析 → 產生計畫) 和 建構 (從計畫中實作)

## 簡單版本

最小的 Ralph loop — 相當於 `while :; do cat PROMPT.md | copilot ; done` 的 SDK 版本：

```python
import asyncio
from pathlib import Path
from copilot import CopilotClient, MessageOptions, SessionConfig, PermissionHandler


async def ralph_loop(prompt_file: str, max_iterations: int = 50):
    client = CopilotClient()
    await client.start()

    try:
        prompt = Path(prompt_file).read_text()

        for i in range(1, max_iterations + 1):
            print(f"\n=== 迭代 {i}/{max_iterations} ===")

            # 每次迭代全新的呼叫 — 上下文隔離是重點
            session = await client.create_session(
                SessionConfig(model="gpt-5.1-codex-mini",
        on_permission_request=PermissionHandler.approve_all)
            )
            try:
                await session.send_and_wait(
                    MessageOptions(prompt=prompt), timeout=600
                )
            finally:
                await session.destroy()

            print(f"迭代 {i} 完成。")
    finally:
        await client.stop()


# 使用方式：指向您的 PROMPT.md
asyncio.run(ralph_loop("PROMPT.md", 20))
```

這就是您入門所需的全部內容。提示檔案告訴代理程式要做什麼；代理程式讀取專案檔案、完成工作、提交並退出。迴圈以乾淨的狀態重新啟動。

## 理想版本

完整的 Ralph 模式包含規劃和建構模式，符合 [Ralph Playbook](https://github.com/ClaytonFarr/ralph-playbook) 架構：

```python
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
    print(f"提示: {prompt_file}")
    print(f"最大:    {max_iterations} 次迭代")
    print("━" * 40)

    try:
        prompt = Path(prompt_file).read_text()

        for i in range(1, max_iterations + 1):
            print(f"\n=== 迭代 {i}/{max_iterations} ===")

            session = await client.create_session(SessionConfig(
                model="gpt-5.1-codex-mini",
                # 將代理程式固定在專案目錄
                working_directory=str(Path.cwd()),
                # 為無人值守操作自動批准工具呼叫
                on_permission_request=lambda _req, _ctx: {
                    "kind": "approved", "rules": []
                },
            ))

            # 紀錄工具使用以獲取可見性
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

            print(f"\n迭代 {i} 完成。")

        print(f"\n達到最大迭代次數: {max_iterations}")
    finally:
        await client.stop()


if __name__ == "__main__":
    args = sys.argv[1:]
    mode = "plan" if "plan" in args else "build"
    max_iter = next((int(a) for a in args if a.isdigit()), 50)
    asyncio.run(ralph_loop(mode, max_iter))
```

### 必要的專案檔案

理想版本預期您的專案中有此檔案結構：

```
專案根目錄/
├── PROMPT_plan.md              # 規劃模式說明
├── PROMPT_build.md             # 建構模式說明
├── AGENTS.md                   # 操作指南 (建構/測試指令)
├── IMPLEMENTATION_PLAN.md      # 任務列表 (由規劃模式產生)
├── specs/                      # 需求規格 (每個主題一個)
│   ├── auth.md
│   └── data-pipeline.md
└── src/                        # 您的原始程式碼
```

### 範例 `PROMPT_plan.md`

```markdown
0a. 研究 `specs/*` 以學習應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md (如果存在) 以了解目前的計畫。
0c. 研究 `src/` 以了解現有程式碼和共享工具。

1. 比較規格與程式碼 (間隙分析)。建立或更新
   IMPLEMENTATION_PLAN.md 作為尚未實作的優先任務清單。不要實作任何東西。

重要：不要假設功能缺失 — 先搜尋程式碼庫以確認。優先更新現有工具，而不是建立臨時計畫副本。
```

### 範例 `PROMPT_build.md`

```markdown
0a. 研究 `specs/*` 以學習應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md。
0c. 研究 `src/` 以供參考。

1. 從 IMPLEMENTATION_PLAN.md 中選擇最重要的項目。在進行更改之前，請搜尋程式碼庫 (不要假設尚未實作)。
2. 實作後，執行測試。如果功能缺失，請新增它。
3. 當您發現問題時，請立即更新 IMPLEMENTATION_PLAN.md。
4. 當測試通過時，請更新 IMPLEMENTATION_PLAN.md，然後 `git add -A`
   然後使用說明性訊息 `git commit`。

5. 撰寫文件時，請記錄原因。
6. 完全實作。沒有佔位符或 stub。
7. 保持 IMPLEMENTATION_PLAN.md 為最新 — 未來的迭代取決於它。
```

### 範例 `AGENTS.md`

保持簡潔 (~60 行)。它在每次迭代時都會載入，因此過大會浪費上下文。

```markdown
## 建構與執行

python -m pytest

## 驗證

- 測試: `pytest`
- 型別檢查: `mypy src/`
- Lint: `ruff check src/`
```

## 最佳實踐

1. **每次迭代全新的上下文**：不要跨迭代累積上下文 — 這正是重點
2. **磁碟是您的資料庫**：`IMPLEMENTATION_PLAN.md` 是隔離呼叫之間的共享狀態
3. **背壓至關重要**：`AGENTS.md` 中的測試、建構、Lint — 代理程式必須在提交前通過它們
4. **從規劃模式開始**：先產生計畫，然後切換到建構
5. **觀察與調整**：觀察早期迭代，當代理程式以特定方式失敗時，新增護欄到提示中
6. **計畫是可丟棄的**：如果代理程式偏離軌道，刪除 `IMPLEMENTATION_PLAN.md` 並重新規劃
7. **保持 `AGENTS.md` 簡潔**：它在每次迭代都會載入 — 僅限操作資訊，不要記錄進度
8. **使用沙箱**：代理程式自主執行並擁有完整的工具存取權 — 將其隔離
9. **設定 `working_directory`**：將呼叫固定在您的專案根目錄，以便工具操作正確解析路徑
10. **自動批准權限**：使用 `on_permission_request` 在不中斷迴圈的情況下允許工具呼叫

## 何時使用 Ralph Loop

**適用於：**

- 使用測試驅動驗證來實作規格的功能
- 大型重構拆分為許多小任務
- 具有明確需求且無人值守、長時間執行的開發
- 任何可以透過背壓 (測試/建構) 驗證正確性的工作

**不適用於：**

- 迴圈中需要人類判斷的任務
- 不受益於疊代的單次操作
- 沒有可測試驗收標準的模糊需求
- 方向不清楚的探索性原型

## 參見

- [錯誤處理](error-handling.md) — 長時間執行呼叫的逾時模式和優雅關閉
- [持久化呼叫](persisting-sessions.md) — 在重新啟動後儲存並恢復呼叫
