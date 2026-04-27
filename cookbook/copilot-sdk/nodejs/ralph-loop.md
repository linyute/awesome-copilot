# Ralph Loop：自主 AI 任務迴圈

建構自主程式碼編寫迴圈，由 AI 代理選擇任務、實作任務、針對背壓 (backpressure) (測試、建構) 進行驗證、提交，然後重複執行 — 每次反覆運算都在全新的工作階段中進行。

> **可執行的範例：** [recipe/ralph-loop.ts](recipe/ralph-loop.ts)
>
> ```bash
> npm install
> npx tsx recipe/ralph-loop.ts
> ```

## 什麼是 Ralph Loop？

[Ralph loop](https://ghuntley.com/ralph/) 是一種自主開發工作流程，AI 代理在隔離的工作階段中反覆運算任務。核心洞察是：**狀態存在於磁碟上，而非模型的上下文 (context) 中**。每次反覆運算都從頭開始，從檔案中讀取目前狀態，執行一項任務，將結果寫回磁碟，然後退出。

```
┌─────────────────────────────────────────────────┐
│                   loop.sh                       │
│  while true:                                    │
│    ┌─────────────────────────────────────────┐  │
│    │  全新的工作階段 (隔離的上下文)          │  │
│    │                                         │  │
│    │  1. 讀取 PROMPT.md + AGENTS.md          │  │
│    │  2. 研究 specs/* 和程式碼               │  │
│    │  3. 從計劃中挑選下一個任務              │  │
│    │  4. 實作 + 執行測試                     │  │
│    │  5. 更新計劃、提交、退出                │  │
│    └─────────────────────────────────────────┘  │
│    ↻ 下一次反覆運算 (全新的上下文)              │
└─────────────────────────────────────────────────┘
```

**核心原則：**

- **每次反覆運算使用全新的上下文**：每個迴圈都會建立一個新的工作階段 — 不會累積上下文，始終處於「智慧區域」
- **磁碟作為共享狀態**：`IMPLEMENTATION_PLAN.md` 在反覆運算之間持久存在，並作為協調機制
- **背壓導向品質**：測試、建構和 Lint 會拒絕糟糕的工作 — 代理必須在提交前修復問題
- **兩種模式**：計劃 (PLANNING) (差異分析 → 產生計劃) 和建構 (BUILDING) (根據計劃實作)

## 簡單版本

最精簡的 Ralph loop — SDK 等同於 `while :; do cat PROMPT.md | copilot ; done`：

```typescript
import { readFile } from "fs/promises";
import { CopilotClient, approveAll } from "@github/copilot-sdk";

async function ralphLoop(promptFile: string, maxIterations: number = 50) {
  const client = new CopilotClient();
  await client.start();

  try {
    const prompt = await readFile(promptFile, "utf-8");

    for (let i = 1; i <= maxIterations; i++) {
      console.log(`\n=== 反覆運算 ${i}/${maxIterations} ===`);

      // 每次反覆運算使用全新的工作階段 — 上下文隔離是重點
      const session = await client.createSession({
        onPermissionRequest: approveAll,
        model: "gpt-5.1-codex-mini",
      });
      try {
        await session.sendAndWait({ prompt }, 600_000);
      } finally {
        await session.destroy();
      }

      console.log(`反覆運算 ${i} 已完成。`);
    }
  } finally {
    await client.stop();
  }
}

// 用法：指向您的 PROMPT.md
ralphLoop("PROMPT.md", 20);
```

這就是您開始所需的一切。提示檔案告訴代理要做什麼；代理讀取專案檔案、執行工作、提交並退出。迴圈以全新的狀態重新啟動。

## 理想版本

完整的 Ralph 模式，包含計劃和建構模式，符合 [Ralph Playbook](https://github.com/ClaytonFarr/ralph-playbook) 架構：

```typescript
import { readFile } from "fs/promises";
import { CopilotClient } from "@github/copilot-sdk";

type Mode = "plan" | "build";

async function ralphLoop(mode: Mode, maxIterations: number = 50) {
  const promptFile = mode === "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";
  const client = new CopilotClient();
  await client.start();

  console.log(`模式: ${mode} | 提示詞: ${promptFile}`);

  try {
    const prompt = await readFile(promptFile, "utf-8");

    for (let i = 1; i <= maxIterations; i++) {
      console.log(`\n=== 反覆運算 ${i}/${maxIterations} ===`);

      const session = await client.createSession({
        model: "gpt-5.1-codex-mini",
        // 將代理固定在專案目錄
        workingDirectory: process.cwd(),
        // 自動核准工具呼叫以進行無人值守作業
        onPermissionRequest: async () => ({ allow: true }),
      });

      // 記錄工具使用情況以提高可見性
      session.on((event) => {
        if (event.type === "tool.execution_start") {
          console.log(`  ⚙ ${event.data.toolName}`);
        }
      });

      try {
        await session.sendAndWait({ prompt }, 600_000);
      } finally {
        await session.destroy();
      }

      console.log(`反覆運算 ${i} 已完成。`);
    }
  } finally {
    await client.stop();
  }
}

// 解析 CLI 引數：npx tsx ralph-loop.ts [plan] [max_iterations]
const args = process.argv.slice(2);
const mode: Mode = args.includes("plan") ? "plan" : "build";
const maxArg = args.find((a) => /^\d+$/.test(a));
const maxIterations = maxArg ? parseInt(maxArg) : 50;

ralphLoop(mode, maxIterations);
```

### 所需的專案檔案

理想版本預期您的專案中有以下檔案結構：

```
project-root/
├── PROMPT_plan.md              # 計劃模式指令
├── PROMPT_build.md             # 建構模式指令
├── AGENTS.md                   # 作業指南 (建構/測試命令)
├── IMPLEMENTATION_PLAN.md      # 任務清單 (由計劃模式產生)
├── specs/                      # 需求規格 (每個主題一個)
│   ├── auth.md
│   └── data-pipeline.md
└── src/                        # 您的原始程式碼
```

### `PROMPT_plan.md` 範例

```markdown
0a. 研究 `specs/*` 以了解應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md (如果存在) 以了解目前的計劃。
0c. 研究 `src/` 以了解現有的程式碼和共享工具程式。

1. 將規格與程式碼進行比較 (差異分析)。建立或更新
   IMPLEMENTATION_PLAN.md 為尚未實作任務的優先順序項目符號列表。
   請勿實作任何內容。

重要提示：請勿假設功能缺失 — 先搜尋
程式碼庫以確認。優先更新現有的工具程式，
而不是建立臨時副本。
```

### `PROMPT_build.md` 範例

```markdown
0a. 研究 `specs/*` 以了解應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md。
0c. 研究 `src/` 以供參考。

1. 從 IMPLEMENTATION_PLAN.md 中選擇最重要的項目。在
   進行更改之前，請搜尋程式碼庫 (不要假設尚未實作)。
2. 實作後，執行測試。如果缺少功能，請新增。
3. 當您發現問題時，請立即更新 IMPLEMENTATION_PLAN.md。
4. 當測試通過後，更新 IMPLEMENTATION_PLAN.md，然後執行 `git add -A`
   接著執行 `git commit` 並加上具描述性的訊息。

5. 撰寫文件時，請記錄原因 (why)。
6. 完整實作。不使用佔位符或存根 (stubs)。
7. 保持 IMPLEMENTATION_PLAN.md 為最新狀態 — 未來的反覆運算取決於它。
```

### `AGENTS.md` 範例

保持簡短 (約 60 行)。它在每次反覆運算時都會載入，因此臃腫會浪費上下文。

```markdown
## 建構與執行

npm run build

## 驗證

- 測試：`npm test`
- 類型檢查：`npx tsc --noEmit`
- Lint：`npm run lint`
```

## 最佳實務

1. **每次反覆運算使用全新的上下文**：絕不跨反覆運算累積上下文 — 這就是整個重點
2. **磁碟是您的資料庫**：`IMPLEMENTATION_PLAN.md` 是隔離工作階段之間的共享狀態
3. **背壓至關重要**：`AGENTS.md` 中的測試、建構、Lint — 代理必須在提交前通過它們
4. **從計劃 (PLANNING) 模式開始**：先產生計劃，然後切換到建構 (BUILDING)
5. **觀察與調整**：觀察早期的反覆運算，當代理以特定方式失敗時，在提示詞中加入護欄
6. **計劃是可拋棄的**：如果代理偏離軌道，請刪除 `IMPLEMENTATION_PLAN.md` 並重新計劃
7. **保持 `AGENTS.md` 簡短**：它在每次反覆運算時都會載入 — 僅包含作業資訊，不包含進度筆記
8. **使用沙箱**：代理在具有完整工具存取權限的情況下自主執行 — 請隔離它
9. **設定 `workingDirectory`**：將工作階段固定在您的專案根目錄，以便工具操作能正確解析路徑
10. **自動核准權限**：使用 `onPermissionRequest` 允許工具呼叫而不中斷迴圈

## 何時使用 Ralph Loop

**適用於：**

- 從規格實作功能並進行測試驅動的驗證
- 分解為許多小任務的大型重構
- 具有明確需求且無人值守、長期執行的開發
- 任何可透過背壓 (測試/建構) 驗證正確性的工作

**不適用於：**

- 迴圈中途需要人類判斷的任務
- 不會從反覆運算中受益的一次性操作
- 沒有可測試驗收準則的模糊需求
- 方向不明確的探索性原型設計

## 另請參閱

- [錯誤處理](error-handling.md) — 長期執行工作階段的逾時模式和優雅關閉
- [持續性工作階段](persisting-sessions.md) — 跨重新啟動儲存並恢復工作階段
