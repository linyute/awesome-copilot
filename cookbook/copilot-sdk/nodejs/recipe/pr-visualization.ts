#!/usr/bin/env tsx

import { CopilotClient, approveAll } from "@github/copilot-sdk";
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
    console.log("🔍 PR 年齡圖表產生器\n");

    // 確定儲存庫
    const args = parseArgs();
    let repo: string;

    if (args.repo) {
        repo = args.repo;
        console.log(`📦 使用指定的儲存庫: ${repo}`);
    } else if (isGitRepo()) {
        const detected = getGitHubRemote();
        if (detected) {
            repo = detected;
            console.log(`📦 已偵測到 GitHub 儲存庫: ${repo}`);
        } else {
            console.log("⚠️  找到 Git 儲存庫但未偵測到 GitHub 遠端。");
            repo = await promptForRepo();
        }
    } else {
        console.log("📁 不在 Git 儲存庫中。");
        repo = await promptForRepo();
    }

    if (!repo || !repo.includes("/")) {
        console.error("❌ 無效的儲存庫格式。應為: owner/repo");
        process.exit(1);
    }

    const [owner, repoName] = repo.split("/");

    // 建立 Copilot 用戶端 - 不需要自訂工具！
    const client = new CopilotClient({ logLevel: "error" });

    const session = await client.createSession({
        onPermissionRequest: approveAll,
        model: "gpt-5",
        systemMessage: {
            content: `
<context>
你正在分析 GitHub 儲存庫 ${owner}/${repoName} 的提取請求 (PR)
目前的當前工作目錄是: ${process.cwd()}
</context>

<instructions>
- 使用 GitHub MCP Server 工具來取得 PR 資料
- 使用你的檔案和程式碼執行工具來產生圖表
- 將任何產生的影像儲存到目前的目錄
- 簡明扼要地回答
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
      取得 ${owner}/${repoName} 在過去一週的開啟提取請求 (PR)。
      計算每個 PR 的天數。
      然後產生一個顯示 PR 年齡分佈的長條圖影像
      （將它們分成合理的類別，例如 <1 天、1-3 天等）。
      將圖表另存為目前目錄下的 "pr-age-chart.png"。
      最後，總結 PR 的健康狀況 - 平均年齡、最舊的 PR，以及有多少可能被認為已過期。
    `,
    });

    // 互動式迴圈
    const askQuestion = () => {
        rl.question("你: ", async (input) => {
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

    console.log('💡 詢問後續問題或輸入 "exit" 離開。\n');
    console.log("範例:");
    console.log('  - "擴展到上個月"');
    console.log('  - "顯示我 5 個最舊的 PR"');
    console.log('  - "改為產生圓餅圖"');
    console.log('  - "按作者而不是年齡分組"');
    console.log("");

    askQuestion();
}

main().catch(console.error);
