# 產生 PR 時長圖表

使用 Copilot 的內建功能建立一個互動式 CLI 工具，視覺化 GitHub 儲存庫的拉取請求 (Pull Request, PR) 時長分佈。

> **可執行範例：** [recipe/pr-visualization.ts](recipe/pr-visualization.ts)
> 
> ```bash
> cd recipe && npm install
> # 從目前的 git 儲存庫自動偵測
> npx tsx pr-visualization.ts
> 
> # 明確指定一個儲存庫
> npx tsx pr-visualization.ts --repo github/copilot-sdk
> # 或：npm run pr-visualization
> ```

## 範例場景

您希望了解儲存庫中 PR 已開啟多長時間。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP 伺服器獲取 PR 資料並產生圖表影像。

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
import { CopilotClient } from "@github/copilot-sdk";

// ============================================================================ 
// Git 與 GitHub 偵測
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
        rl.question("輸入 GitHub 儲存庫 (擁有者/儲存庫名稱)：", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ============================================================================ 
// 主應用程式
// ============================================================================ 

async function main() {
    console.log("🔍 PR 時長圖表產生器\n");

    // 確定儲存庫
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
            console.log("⚠️  找到 Git 儲存庫，但未偵測到 GitHub 遠端。");
            repo = await promptForRepo();
        }
    } else {
        console.log("📁 不在 Git 儲存庫中。");
        repo = await promptForRepo();
    }

    if (!repo || !repo.includes("/")) {
        console.error("❌ 無效的儲存庫格式。預期格式：擁有者/儲存庫名稱");
        process.exit(1);
    }

    const [owner, repoName] = repo.split("/");

    // 建立 Copilot 用戶端 - 不需要自定義工具！
    const client = new CopilotClient({ logLevel: "error" });

    const session = await client.createSession({
        model: "gpt-5",
        systemMessage: {
            content: `
<context>
您正在分析 GitHub 儲存庫的拉取請求：${owner}/${repoName}
目前的工作目錄為：${process.cwd()}
</context>

<instructions>
- 使用 GitHub MCP 伺服器工具獲取 PR 資料
- 使用您的檔案與程式碼執行工具產生圖表
- 將任何產生的影像儲存到目前工作目錄
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
      獲取 ${owner}/${repoName} 過去一週的開放拉取請求。
      計算每個 PR 的時長（以天為單位）。
      然後產生一個條形圖影像，顯示 PR 時長的分佈
      （將它們分組到合理的貯槽中，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄中的 "pr-age-chart.png"。
      最後，總結 PR 健康度 - 平均時長、最舊的 PR，以及有多少可能被視為停滯。
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

    console.log('💡 提出後續問題或輸入 "exit" 退出。\n');
    console.log("範例：");
    console.log('  - "擴展到過去一個月"');
    console.log('  - "顯示前 5 個最舊的 PR"');
    console.log('  - "改為產生圓餅圖"');
    console.log('  - "按作者而非時長分組"');
    console.log("");

    askQuestion();
}

main().catch(console.error);

```

## 運作方式

1. **儲存庫偵測**：檢查 `--repo` 旗標 → git 遠端 → 提示使用者
2. **無需自定義工具**：完全依賴 Copilot CLI 的內建功能：
    - **GitHub MCP 伺服器** - 從 GitHub 獲取 PR 資料
    - **檔案工具** - 儲存產生的圖表影像
    - **程式碼執行** - 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式工作階段**：初始分析後，使用者可以要求調整

## 範例互動

```
🔍 PR 時長圖表產生器

📦 使用指定的儲存庫：CommunityToolkit/Aspire

📊 開始分析...

  ⚙️  github-mcp-server-list_pull_requests
  ⚙️  powershell

🤖 我已經分析了 CommunityToolkit/Aspire 的 23 個開放 PR：

**PR 時長分佈：**
- < 1 天：3 PRs
- 1-3 天：5 PRs
- 3-7 天：8 PRs
- 1-2 週：4 PRs
- > 2 週：3 PRs

**摘要：**
- 平均時長：6.2 天
- 最舊：PR #142 (18 天) - "新增 Redis 快取支援"
- 潛在停滯 (>7 天)：7 PRs

圖表已儲存至：pr-age-chart.png

💡 提出後續問題或輸入 "exit" 退出。

您：擴展到過去一個月並按作者顯示

  ⚙️  github-mcp-server-list_pull_requests
  ⚙️  powershell

🤖 已更新過去 30 天按作者分組的分析：

| 作者          | 開放 PR | 平均時長 |
|---------------|----------|---------|
| @contributor1 | 5        | 12 天   |
| @contributor2 | 3        | 4 天    |
| @contributor3 | 2        | 8 天    |
| ...           |          |         |

新圖表已儲存至：pr-age-chart.png

您：產生一個顯示時長分佈的圓餅圖

  ⚙️  powershell

🤖 完成！圓餅圖已儲存至：pr-age-chart.png
```

## 為何使用此方法？

| 考量層面         | 自定義工具        | 內建 Copilot                      |
| --------------- | ----------------- | --------------------------------- |
| 程式碼複雜度     | 高                | **極小**                          |
| 維護             | 您自行維護        | **Copilot 維護**                  |
| 彈性             | 固定邏輯          | **AI 決定最佳方法**               |
| 圖表類型         | 您所編寫的內容    | **Copilot 能產生的任何類型**      |
| 資料分組         | 硬編碼的貯槽      | **智慧分組**                      |