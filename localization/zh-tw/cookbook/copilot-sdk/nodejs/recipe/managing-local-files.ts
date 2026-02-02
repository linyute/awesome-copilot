import { CopilotClient } from "@github/copilot-sdk";
import * as os from "node:os";
import * as path from "node:path";

// 建立並啟動用戶端
const client = new CopilotClient();
await client.start();

// 建立工作階段
const session = await client.createSession({
    model: "gpt-5",
});

// 事件處理常式
session.on((event) => {
    switch (event.type) {
        case "assistant.message":
            console.log(`\nCopilot: ${event.data.content}`);
            break;
        case "tool.execution_start":
            console.log(`  → 執行中: ${event.data.toolName} ${event.data.toolCallId}`);
            break;
        case "tool.execution_complete":
            console.log(`  ✓ 已完成: ${event.data.toolCallId}`);
            break;
    }
});

// 請求 Copilot 整理檔案
// 將此更改為您的目標資料夾
const targetFolder = path.join(os.homedir(), "Downloads");

await session.sendAndWait({
    prompt: `
分析 "${targetFolder}" 中的檔案並將其整理到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽依檔案副檔名進行分組
3. 建立適當的子資料夾（例如 "images", "documents", "videos"）
4. 將每個檔案移動到其適當的子資料夾中

移動任何檔案之前請先確認。
`,
});

await session.destroy();
await client.stop();
