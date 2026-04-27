import { CopilotClient, approveAll } from "@github/copilot-sdk";
import * as os from "node:os";
import * as path from "node:path";

// 建立並啟動用戶端
const client = new CopilotClient();
await client.start();

// 建立工作階段
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
});

// 事件處理程式
session.on((event) => {
    switch (event.type) {
        case "assistant.message":
            console.log(`\nCopilot: ${event.data.content}`);
            break;
        case "tool.execution_start":
            console.log(`  → 正在執行: ${event.data.toolName} ${event.data.toolCallId}`);
            break;
        case "tool.execution_complete":
            console.log(`  ✓ 已完成: ${event.data.toolCallId}`);
            break;
    }
});

// 請 Copilot 整理檔案
// 將此變更為您的目標資料夾
const targetFolder = path.join(os.homedir(), "Downloads");

await session.sendAndWait({
    prompt: `
分析 "${targetFolder}" 中的檔案並將它們整理到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽按副檔名分組的結果
3. 建立適當的子資料夾（例如："images", "documents", "videos"）
4. 將每個檔案移動到適當的子資料夾

請在移動任何檔案之前進行確認。
`,
});

await session.destroy();
await client.stop();
