#!/usr/bin/env tsx

import { CopilotClient } from "@github/copilot-sdk";
import { execSync } from "node:child_process";
import * as readline from "node:readline";

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
        rl.question("輸入 GitHub 存放庫 (擁有者/存放庫): ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ============================================================================ 
// 主要應用程式
// ============================================================================ 

async function main() {
    console.log("🔍 PR 建立時間圖表產生器\n");

    // 確定存放庫
    const args = parseArgs();
    let repo: string;

    if (args.repo) {
        repo = args.repo;
        console.log(`📦 使用指定的存放庫: ${repo}`);
    } else if (isGitRepo()) {
        const detected = getGitHubRemote();
        if (detected) {
            repo = detected;
            console.log(`📦 偵測到 GitHub 存放庫: ${repo}`);
        } else {
            console.log("⚠️  找到 Git 存放庫但未偵測到 GitHub 遠端。");
            repo = await promptForRepo();
        }
    } else {
        console.log("📁 不在 Git 存放庫中。");
        repo = await promptForRepo();
    }

    if (!repo || !repo.includes("/")) {
        console.error("❌ 存放庫格式無效。應為: 擁有者/存放庫");
        process.exit(1);
    }

    const [owner, repoName] = repo.split("/");

    // 建立 Copilot 用戶端 - 不需要自訂工具！
    const client = new CopilotClient({ logLevel: "error" });

    const session = await client.createSession({
        model: "gpt-5",
        systemMessage: {
            content: `
<context>
您正在分析 GitHub 存放庫的提取要求 (Pull Request): ${owner}/${repoName}
目前工作目錄為: ${process.cwd()}
</context>

<instructions>
- 使用 GitHub MCP Server 工具獲取 PR 資料
- 使用您的檔案和程式碼執行工具產生圖表
- 將產生的任何影像儲存到目前工作目錄
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

    // 初始提示 - 讓 Copilot 處理細節
    console.log("\n📊 開始分析...\n");

    await session.sendAndWait({
        prompt: `
      獲取過去一週 ${owner}/${repoName} 的開放提取要求。
      計算每個 PR 的建立天數。
      然後產生一張長條圖影像，顯示 PR 建立時間的分佈
      （將它們分成合理的分組，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄下的 "pr-age-chart.png"。
      最後，摘要 PR 健康狀況 - 平均建立時間、最舊的 PR，以及有多少可能被視為停滯。
    `,
    });

    // 互動迴圈
    const askQuestion = () => {
        rl.question("您: ", async (input) => {
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

    console.log('💡 詢問後續問題或輸入 "exit" 結束。\n');
    console.log("範例：");
    console.log('  - "擴展到上個月"');
    console.log('  - "顯示最舊的 5 個 PR"');
    console.log('  - "改為產生圓餅圖"');
    console.log('  - "改依作者分組而非依建立時間"');
    console.log("");

    askQuestion();
}

main().catch(console.error);
