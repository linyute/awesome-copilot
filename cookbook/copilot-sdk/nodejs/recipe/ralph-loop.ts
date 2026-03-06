import { readFile } from "fs/promises";
import { CopilotClient } from "@github/copilot-sdk";

/**
 * Ralph loop：具有每次反覆運算全新內容的自主 AI 任務迴圈。
 *
 * 兩種模式：
 *   - "plan"：讀取 PROMPT_plan.md，產生/更新 IMPLEMENTATION_PLAN.md
 *   - "build"：讀取 PROMPT_build.md，實作任務、執行測試、提交
 *
 * 每次反覆運算都會建立一個新的工作階段，以便代理程式始終在其內容視窗的
 * 「智慧區域」內運作。狀態透過磁碟上的檔案 (IMPLEMENTATION_PLAN.md、AGENTS.md、specs/*)
 * 在反覆運算之間共享。
 *
 * 用法：
 *   npx tsx ralph-loop.ts              # 建構模式，50 次反覆運算
 *   npx tsx ralph-loop.ts plan         # 規劃模式
 *   npx tsx ralph-loop.ts 20           # 建構模式，20 次反覆運算
 *   npx tsx ralph-loop.ts plan 5       # 規劃模式，5 次反覆運算
 */

type Mode = "plan" | "build";

async function ralphLoop(mode: Mode, maxIterations: number) {
    const promptFile = mode === "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";

    const client = new CopilotClient();
    await client.start();

    console.log("━".repeat(40));
    console.log(`模式:   ${mode}`);
    console.log(`提示字: ${promptFile}`);
    console.log(`上限:    ${maxIterations} 次反覆運算`);
    console.log("━".repeat(40));

    try {
        const prompt = await readFile(promptFile, "utf-8");

        for (let i = 1; i <= maxIterations; i++) {
            console.log(`\n=== 反覆運算 ${i}/${maxIterations} ===`);

            const session = await client.createSession({
                model: "gpt-5.1-codex-mini",
                // 將代理程式固定在專案目錄
                workingDirectory: process.cwd(),
                // 自動核准工具呼叫以進行自動化執行
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

            console.log(`\n反覆運算 ${i} 完成。`);
        }

        console.log(`\n已達到最大反覆運算次數：${maxIterations}`);
    } finally {
        await client.stop();
    }
}

// 剖析 CLI 引數
const args = process.argv.slice(2);
const mode: Mode = args.includes("plan") ? "plan" : "build";
const maxArg = args.find((a) => /^\d+$/.test(a));
const maxIterations = maxArg ? parseInt(maxArg) : 50;

ralphLoop(mode, maxIterations).catch(console.error);
