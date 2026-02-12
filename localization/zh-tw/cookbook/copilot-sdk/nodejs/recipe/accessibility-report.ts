#!/usr/bin/env tsx

import { CopilotClient } from "@github/copilot-sdk";
import * as readline from "node:readline";

// ============================================================================
// 主要應用程式
// ============================================================================

async function main() {
    console.log("=== 協助工具報告產生器 ===\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const askQuestion = (query: string): Promise<string> =>
        new Promise((resolve) => rl.question(query, (answer) => resolve(answer.trim())));

    let url = await askQuestion("輸入要分析的 URL：");

    if (!url) {
        console.log("未提供 URL。正在結束。");
        rl.close();
        return;
    }

    // 確保 URL 具有協定
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }

    console.log(`\n正在分析：${url}`);
    console.log("請稍候...\n");

    // 使用 Playwright MCP 伺服器建立 Copilot 用戶端
    const client = new CopilotClient();

    const session = await client.createSession({
        model: "claude-opus-4.6",
        streaming: true,
        mcpServers: {
            playwright: {
                type: "local",
                command: "npx",
                args: ["@playwright/mcp@latest"],
                tools: ["*"],
            },
        },
    });

    // 設定串流事件處理
    let idleResolve: (() => void) | null = null;

    session.on((event) => {
        if (event.type === "assistant.message.delta") {
            process.stdout.write(event.data.deltaContent ?? "");
        } else if (event.type === "session.idle") {
            idleResolve?.();
        } else if (event.type === "session.error") {
            console.error(`\n錯誤：${event.data.message}`);
            idleResolve?.();
        }
    });

    const waitForIdle = (): Promise<void> =>
        new Promise((resolve) => {
            idleResolve = resolve;
        });

    const prompt = `
    使用 Playwright MCP 伺服器分析此網頁的協助工具：${url}
    
    請執行以下操作：
    1. 使用 playwright-browser_navigate 導覽至該 URL
    2. 使用 playwright-browser_snapshot 擷取協助工具快照
    3. 分析快照並提供詳細的協助工具報告
    
    請嚴格按照此結構格式化報告，並使用表情符號指示：

    📊 協助工具報告：[網頁標題] (domain.com)

    ✅ 運作良好的部分
    | 類別 | 狀態 | 詳細資訊 |
    |----------|--------|---------|
    | 語言 | ✅ 通過 | lang="en-US" 設定正確 |
    | 網頁標題 | ✅ 通過 | "[標題]" 具備描述性 |
    | 標題階層 | ✅ 通過 | 單一 H1，正確的 H2/H3 結構 |
    | 圖片 | ✅ 通過 | 所有 X 張圖片皆有替代文字 |
    | 檢視區 | ✅ 通過 | 允許雙指縮放 (無 user-scalable=no) |
    | 連結 | ✅ 通過 | 無含糊不清的 "按這裡" 連結 |
    | 減少動態 | ✅ 通過 | 支援 prefers-reduced-motion |
    | 自動播放媒體 | ✅ 通過 | 無自動播放的音訊/影片 |

    ⚠️ 發現的問題
    | 嚴重程度 | 問題 | WCAG 標準 | 建議 |
    |----------|-------|----------------|----------------|
    | 🔴 高 | 缺少 <main> 地標 | 1.3.1, 2.4.1 | 將主要內容封裝在 <main> 元件中 |
    | 🔴 高 | 缺少跳過導覽連結 | 2.4.1 | 在頂部新增 "跳至主要內容" 連結 |
    | 🟡 中 | 焦點外框已停用 | 2.4.7 | 預設外框為 none - 確保存在可見的 :focus 樣式 |
    | 🟡 中 | 觸控目標過小 | 2.5.8 | 導覽連結高度為 37px (低於 44px 最小值) |

    📋 統計摘要
    - 連結總數：X
    - 標題總數：X (1× H1，正確階層)
    - 可聚焦元素：X
    - 發現的地標：橫幅 ✅、導覽 ✅、主要 ❌、頁尾 ✅

    ⚙️ 優先建議
    - 新增 <main> 地標 - 將網頁內容封裝在 <main role="main"> 中以供螢幕閱讀器導覽
    - 新增跳過連結 - 在開頭設置隱藏連結：<a href="#main-content" class="skip-link">跳至主要內容</a>
    - 增加觸控目標 - 為導覽連結與標籤新增內距（padding）以符合 44×44px 最小值
    - 驗證焦點樣式 - 測試鍵盤導覽；新增可見的 :focus 或 :focus-visible 外框

    使用 ✅ 表示通過，🔴 表示高嚴重性問題，🟡 表示中嚴重性問題，❌ 表示遺失項目。
    包含來自網頁分析的實際發現 - 不要只是複製範例。
    `;

    let idle = waitForIdle();
    await session.send({ prompt });
    await idle;

    console.log("\n\n=== 報告完成 ===\n");

    // 提示使用者產生測試
    const generateTests = await askQuestion(
        "您是否要產生 Playwright 協助工具測試？(y/n)："
    );

    if (generateTests.toLowerCase() === "y" || generateTests.toLowerCase() === "yes") {
        const detectLanguagePrompt = `
        分析目前工作目錄以偵測此專案中使用的主要程式語言。
        尋找如 package.json、*.csproj、pom.xml、requirements.txt、go.mod 等專案檔案。
        
        僅回應偵測到的語言名稱 (例如："TypeScript"、"JavaScript"、"C#"、"Python"、"Java") 
        以及您偵測到該語言的簡短原因。
        如果未偵測到專案，建議將 "TypeScript" 作為 Playwright 測試的預設語言。
        `;

        console.log("\n正在偵測專案語言...\n");
        idle = waitForIdle();
        await session.send({ prompt: detectLanguagePrompt });
        await idle;

        let language = await askQuestion("\n\n確認測試語言（或輸入其他語言）：");
        if (!language) {
            language = "TypeScript";
        }

        const testGenerationPrompt = `
        根據您剛為 ${url} 產生的協助工具報告，以 ${language} 建立 Playwright 協助工具測試。
        
        測試應：
        1. 驗證報告中的所有協助工具檢查
        2. 針對發現的問題進行測試（以確保問題得到修復）
        3. 包含以下測試：
           - 網頁具有正確的 lang 屬性
           - 網頁具有描述性標題
           - 標題階層正確 (單一 H1，正確巢狀)
           - 所有圖片皆有替代文字
           - 無自動播放媒體
           - 地標區域存在 (橫幅、導覽、主要、頁尾)
           - 跳過導覽連結存在且運作正常
           - 焦點指示器可見
           - 觸控目標符合最小尺寸要求
        4. 使用 Playwright 的協助工具測試功能
        5. 包含說明每個測試的實用註釋
        
        輸出可儲存並執行的完整測試檔案。
        如果您需要驗證任何網頁詳細資訊，請使用 Playwright MCP 伺服器工具。
        `;

        console.log("\n正在產生協助工具測試...\n");
        idle = waitForIdle();
        await session.send({ prompt: testGenerationPrompt });
        await idle;

        console.log("\n\n=== 測試已產生 ===");
    }

    rl.close();
    await session.destroy();
    await client.stop();
}

main().catch(console.error);
