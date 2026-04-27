import { readFile } from "fs/promises";
import { CopilotClient, approveAll } from "@github/copilot-sdk";

/**
 * Ralph 迴圈：具有每次迭代新鮮 Context 的自主 AI 任務迴圈。
 *
 * 兩種模式：
 *   - "plan": 讀取 PROMPT_plan.md，產生/更新 IMPLEMENTATION_PLAN.md
 *   - "build": 讀取 PROMPT_build.md，實作任務，執行測試，提交程式碼
 *
 * 每次迭代都會建立一個全新的工作階段，以便代理程式始終在
 * 其 Context 視窗的「智慧區」中運作。狀態透過磁碟上的檔案（IMPLEMENTATION_PLAN.md, AGENTS.md, specs/*）在迭代之間共用。
 *
 * 使用方式：
 *   npx tsx ralph-loop.ts              # 建構模式，50 次迭代
 *   npx tsx ralph-loop.ts plan         # 規劃模式
 *   npx tsx ralph-loop.ts 20           # 建構模式，20 次迭代
 *   npx tsx ralph-loop.ts plan 5       # 規劃模式，5 次迭代
 */

type Mode = "plan" | "build";

async function ralphLoop(mode: Mode, maxIterations: number) {
    const promptFile = mode === "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";

    const client = new CopilotClient();
    await client.start();

    console.log("━".repeat(40));
    console.log(`模式:   ${mode}`);
    console.log(`提示: ${promptFile}`);
    console.log(`上限:    ${maxIterations} 次迭代`);
    console.log("━".repeat(40));

    try {
        const prompt = await readFile(promptFile, "utf-8");

        for (let i = 1; i <= maxIterations; i++) {
            console.log(`\n=== 迭代 ${i}/${maxIterations} ===`);

            const session = await client.createSession({
                model: "gpt-5.1-codex-mini",
                // 將代理程式固定在專案目錄中
                workingDirectory: process.cwd(),
                // 自動批准工具呼叫以進行無人值守操作
                onPermissionRequest: approveAll,
            });

            // 記錄工具使用以提高可見性
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

            console.log(`\n迭代 ${i} 完成。`);
        }

        console.log(`\n達到最大迭代次數: ${maxIterations}`);
    } finally {
        await client.stop();
    }
}

// 解析 CLI 引數
const args = process.argv.slice(2);
const mode: Mode = args.includes("plan") ? "plan" : "build";
const maxArg = args.find((a) => /^\d+$/.test(a));
const maxIterations = maxArg ? parseInt(maxArg) : 50;

ralphLoop(mode, maxIterations).catch(console.error);
