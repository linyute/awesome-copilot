# 產生協助工具報告

建構一個 CLI 工具，使用 Playwright MCP 伺服器分析網頁協助工具（accessibility），並產生詳細的 WCAG 相容報告，且可選擇產生測試程式碼。

> **可執行範例：** [recipe/accessibility-report.ts](recipe/accessibility-report.ts)
>
> ```bash
> cd recipe && npm install
> npx tsx accessibility-report.ts
> # 或：npm run accessibility-report
> ```

## 範例情境

您想要稽核網站的協助工具合規性。此工具使用 Playwright 導覽至 URL，擷取協助工具快照，並產生一份結構化報告，內容涵蓋 WCAG 標準，如地標（landmarks）、標題階層、焦點管理與觸控目標。它還可以產生 Playwright 測試檔案，以自動執行未來的協助工具檢查。

## 先決條件

```bash
npm install @github/copilot-sdk
npm install -D typescript tsx @types/node
```

您還需要安裝 `npx`（已安裝 Node.js）以執行 Playwright MCP 伺服器。

## 使用方式

```bash
npx tsx accessibility-report.ts
# 根據提示輸入 URL
```

## 完整範例：accessibility-report.ts

```typescript
#!/usr/bin/env npx tsx

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
    
    請使用表情符號指示格式化報告：
    - 📊 協助工具報告標題
    - ✅ 運作良好的部分（包含類別、狀態、詳細資訊的表格）
    - ⚠️ 發現的問題（包含嚴重程度、問題、WCAG 標準、建議的表格）
    - 📋 統計摘要（連結、標題、可聚焦元素、地標）
    - ⚙️ 優先建議

    使用 ✅ 表示通過，🔴 表示高嚴重性問題，🟡 表示中嚴重性問題，❌ 表示遺失項目。
    包含來自網頁分析的實際發現。
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
        分析目前工作目錄以偵測主要程式語言。
        僅回應偵測到的語言名稱與簡短說明。
        如果未偵測到專案，建議將 "TypeScript" 作為預設語言。
        `;

        console.log("\n正在偵測專案語言...\n");
        idle = waitForIdle();
        await session.send({ prompt: detectLanguagePrompt });
        await idle;

        let language = await askQuestion("\n\n確認測試語言（或輸入其他語言）：");
        if (!language) language = "TypeScript";

        const testGenerationPrompt = `
        根據您剛為 ${url} 產生的協助工具報告，
        以 ${language} 建立 Playwright 協助工具測試。
        
        包含以下測試：lang 屬性、標題、標題階層、替代文字、
        地標、跳過導覽、焦點指示器與觸控目標。
        使用 Playwright 的協助工具測試功能並包含實用註釋。
        輸出完整的測試檔案。
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
```

## 運作方式

1. **Playwright MCP 伺服器**：設定一個執行 `@playwright/mcp` 的本機 MCP 伺服器，以提供瀏覽器自動化工具
2. **串流輸出**：使用 `streaming: true` 與 `assistant.message.delta` 事件進行即時的逐權杖輸出
3. **協助工具快照**：Playwright 的 `browser_snapshot` 工具可擷取網頁的完整協助工具樹
4. **結構化報告**：提示詞設計了一種與 WCAG 對齊且一致的報告格式，並帶有表情符號嚴重程度指示器
5. **測試產生**：可選擇性地偵測專案語言並產生 Playwright 協助工具測試

## 關鍵概念

### MCP 伺服器設定

此食譜設定了與工作階段一同執行的本機 MCP 伺服器：

```typescript
const session = await client.createSession({
    mcpServers: {
        playwright: {
            type: "local",
            command: "npx",
            args: ["@playwright/mcp@latest"],
            tools: ["*"],
        },
    },
});
```

這使模型能夠存取 Playwright 瀏覽器工具，例如 `browser_navigate`、`browser_snapshot` 與 `browser_click`。

### 搭配事件進行串流

與 `sendAndWait` 不同，此食譜使用串流進行即時輸出：

```typescript
session.on((event) => {
    if (event.type === "assistant.message.delta") {
        process.stdout.write(event.data.deltaContent ?? "");
    } else if (event.type === "session.idle") {
        idleResolve?.();
    }
});
```

## 互動範例

```
=== 協助工具報告產生器 ===

輸入要分析的 URL：github.com

正在分析：https://github.com
請稍候...

📊 協助工具報告：GitHub (github.com)

✅ 運作良好的部分
| 類別 | 狀態 | 詳細資訊 |
|----------|--------|---------|
| 語言 | ✅ 通過 | lang="en" 設定正確 |
| 網頁標題 | ✅ 通過 | "GitHub" 可辨識 |
| 標題階層 | ✅ 通過 | 正確的 H1/H2 結構 |
| 圖片 | ✅ 通過 | 所有圖片皆有替代文字 |

⚠️ 發現的問題
| 嚴重程度 | 問題 | WCAG 標準 | 建議 |
|----------|-------|----------------|----------------|
| 🟡 中 | 某些連結缺少描述性文字 | 2.4.4 | 為僅含圖示的連結新增 aria-label |

📋 統計摘要
- 連結總數：47
- 標題總數：8 (1× H1，正確階層)
- 可聚焦元素：52
- 發現的地標：橫幅 ✅、導覽 ✅、主要 ✅、頁尾 ✅

=== 報告完成 ===

您是否要產生 Playwright 協助工具測試？(y/n)：y

正在偵測專案語言...
偵測到 TypeScript (發現 package.json)

確認測試語言（或輸入其他語言）：

正在產生協助工具測試...
[產生的測試檔案輸出...]

=== 測試已產生 ===
```
