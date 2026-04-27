# 產生 PR 帳齡圖表

建構一個互動式 CLI 工具，使用 Copilot 的內建功能為 GitHub 儲存庫視覺化提取要求 (pull request) 的帳齡分佈。

> **可執行的範例：** [recipe/pr-visualization.ts](recipe/pr-visualization.ts)
>
> ```bash
> cd recipe && npm install
> # 從目前的 git 儲存庫自動偵測
> npx tsx pr-visualization.ts
>
> # 明確指定一個儲存庫
> npx tsx pr-visualization.ts --repo github/copilot-sdk
> # 或執行：npm run pr-visualization
> ```

## 範例情境

您想了解儲存庫中的 PR 已開啟了多長時間。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP Server 擷取 PR 資料並產生圖表影像。

## 先決條件

```bash
npm install @github/copilot-sdk
npm install -D typescript tsx @types/node
```

## 用法

```bash
# 從目前的 git 儲存庫自動偵測
npx tsx pr-visualization.ts

# 明確指定一個儲存庫
npx tsx pr-visualization.ts --repo github/copilot-sdk
```

## 完整範例：pr-visualization.ts

```typescript
#!/usr/bin/env npx tsx

import { execSync } from "node:child_process";
import * as readline from "node:readline";
import { CopilotClient, approveAll } from "@github/copilot-sdk";

// ============================================================================
// Git & GitHub 偵測
// ============================================================================

function isGitRepo(): boolean {
    try {
        execSync("git rev-parse --git-dir", { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

function getGitHubRemote(): string | null {
    try {
        const remoteUrl = execSync("git remote get-url origin", {
            encoding: "utf-8",
        }).trim();

        // 處理 SSH: git@github.com:owner/repo.git
        const sshMatch = remoteUrl.match(/git@github\.com:(.+\/.+?)(?:\.git)?$/);
        if (sshMatch) return sshMatch[1];

        // 處理 HTTPS: https://github.com/owner/repo.git
        const httpsMatch = remoteUrl.match(/https:\/\/github\.com\/(.+\/.+?)(?:\.git)?$/);
        if (httpsMatch) return httpsMatch[1];

        return null;
    } catch {
        return null;
    }
}

function parseArgs(): { repo?: string } {
    const args = process.argv.slice(2);
    const repoIndex = args.indexOf("--repo");
    if (repoIndex !== -1 && args[repoIndex + 1]) {
        return { repo: args[repoIndex + 1] };
    }
    return {};
}

async function promptForRepo(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question("輸入 GitHub 儲存庫 (owner/repo): ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ============================================================================
// 主應用程式
// ============================================================================

async function main() {
    console.log("🔍 PR 帳齡圖表產生器\n");

    // 決定儲存庫
    const args = parseArgs();
    let repo: string;

    if (args.repo) {
        repo = args.repo;
        console.log(`📦 使用指定的儲存庫：${repo}`);
    } else if (isGitRepo()) {
        const detected = getGitHubRemote();
        if (detected) {
            repo = detected;
            console.log(`📦 偵測到 GitHub 儲存庫：${repo}`);
        } else {
            console.log("⚠️  找到 Git 儲存庫但未偵測到 GitHub 遠端。");
            repo = await promptForRepo();
        }
    } else {
        console.log("📁 不在 Git 儲存庫中。");
        repo = await promptForRepo();
    }

    if (!repo || !repo.includes("/")) {
        console.error("❌ 儲存庫格式無效。預期格式：owner/repo");
        process.exit(1);
    }

    const [owner, repoName] = repo.split("/");

    // 建立 Copilot 用戶端 - 無需自訂工具！
    const client = new CopilotClient({ logLevel: "error" });

    const session = await client.createSession({
        onPermissionRequest: approveAll,
        model: "gpt-5",
        systemMessage: {
            content: `
<context>
您正在分析以下 GitHub 儲存庫的提取要求 (pull request): ${owner}/${repoName}
目前的工作目錄是：${process.cwd()}
</context>

<instructions>
- 使用 GitHub MCP Server 工具來擷取 PR 資料
- 使用您的檔案和程式碼執行工具來產生圖表
- 將任何產生的影像儲存到目前的工作目錄
- 回應請保持簡潔
</instructions>
`,
        },
    });

    // 設定事件處理
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    session.on((event) => {
        if (event.type === "assistant.message") {
            console.log(`\n🤖 ${event.data.content}\n`);
        } else if (event.type === "tool.execution_start") {
            console.log(`  ⚙️  ${event.data.toolName}`);
        }
    });

    // 初始提示 - 讓 Copilot 找出詳細資訊
    console.log("\n📊 開始分析...\n");

    await session.sendAndWait({
        prompt: `
      擷取 ${owner}/${repoName} 過去一週的開啟狀態提取要求。
      計算每個 PR 的帳齡 (以天為單位)。
      然後產生一張長條圖影像，顯示 PR 帳齡的分佈情形
      (將它們分組到合理的貯槽，例如 <1 天、1-3 天等)。
      將圖表儲存為目前目錄中的 "pr-age-chart.png"。
      最後，總結 PR 健康狀況 — 平均帳齡、最舊的 PR，以及有多少可能被視為陳舊。
    `,
    });

    // 互動式迴圈
    const askQuestion = () => {
        rl.question("您：", async (input) => {
            const trimmed = input.trim();

            if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
                console.log("👋 再見！");
                rl.close();
                await session.destroy();
                await client.stop();
                process.exit(0);
            }

            if (trimmed) {
                await session.sendAndWait({ prompt: trimmed });
            }

            askQuestion();
        });
    };

    console.log('💡 提問追蹤問題或輸入 "exit" 退出。\n');
    console.log("範例：");
    console.log('  - "擴展到過去一個月"');
    console.log('  - "顯示最舊的 5 個 PR"');
    console.log('  - "改為產生圓餅圖"');
    console.log('  - "依作者而非帳齡進行分組"');
    console.log("");

    askQuestion();
}

main().catch(console.error);
```

## 運作方式

1. **儲存庫偵測**：檢查 `--repo` 旗標 → git 遠端 → 提示使用者
2. **無需自訂工具**：完全依賴 Copilot CLI 的內建功能：
    - **GitHub MCP Server** - 從 GitHub 擷取 PR 資料
    - **檔案工具** - 儲存產生的圖表影像
    - **程式碼執行** - 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式工作階段**：在初始分析之後，使用者可以要求進行調整

## 範例互動

```
🔍 PR 帳齡圖表產生器

📦 使用指定的儲存庫：CommunityToolkit/Aspire

📊 開始分析...

  ⚙️  github-mcp-server-list_pull_requests
  ⚙️  powershell

🤖 我已經分析了 CommunityToolkit/Aspire 的 23 個開啟狀態 PR：

**PR 帳齡分佈：**
- < 1 天：3 個 PR
- 1-3 天：5 個 PR
- 3-7 天：8 個 PR
- 1-2 週：4 個 PR
- > 2 週：3 個 PR

**總結：**
- 平均帳齡：6.2 天
- 最舊：PR #142 (18 天) - "Add Redis caching support"
- 潛在陳舊 (>7 天)：7 個 PR

圖表已儲存至：pr-age-chart.png

💡 提問追蹤問題或輸入 "exit" 退出。

您：擴展到過去一個月並依作者顯示

  ⚙️  github-mcp-server-list_pull_requests
  ⚙️  powershell

🤖 過去 30 天的更新分析，依作者分組：

| 作者          | 開啟狀態 PR | 平均帳齡 |
|---------------|------------|---------|
| @contributor1 | 5          | 12 天   |
| @contributor2 | 3          | 4 天    |
| @contributor3 | 2          | 8 天    |
| ...           |            |         |

新圖表已儲存至：pr-age-chart.png

您：產生一張顯示帳齡分佈的圓餅圖

  ⚙️  powershell

🤖 大功告成！圓餅圖已儲存至：pr-age-chart.png
```

## 為什麼採用這種方法？

| 面項            | 自訂工具          | 內建 Copilot                      |
| --------------- | ----------------- | --------------------------------- |
| 程式碼複雜度   | 高                | **極小**                          |
| 維護             | 由您維護          | **由 Copilot 維護**               |
| 彈性             | 固定邏輯          | **AI 決定最佳方法**              |
| 圖表類型       | 您所撰寫的程式碼 | **Copilot 可以產生的任何類型**    |
| 資料分組       | 硬編碼的貯槽      | **智慧分組**                      |
