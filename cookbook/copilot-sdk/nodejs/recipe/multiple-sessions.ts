import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();

// 建立多個獨立的工作階段
const session1 = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
});
const session2 = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
});
const session3 = await client.createSession({
    onPermissionRequest: approveAll,
    model: "claude-sonnet-4.5",
});

console.log("已建立 3 個獨立工作階段");

// 每個工作階段維護自己的對話記錄
await session1.sendAndWait({ prompt: "你正在協助一個 Python 專案" });
await session2.sendAndWait({ prompt: "你正在協助一個 TypeScript 專案" });
await session3.sendAndWait({ prompt: "你正在協助一個 Go 專案" });

console.log("已傳送初始 Context 給所有工作階段");

// 後續訊息保留在各自的 Context 中
await session1.sendAndWait({ prompt: "我該如何建立虛擬環境？" });
await session2.sendAndWait({ prompt: "我該如何設定 tsconfig？" });
await session3.sendAndWait({ prompt: "我該如何初始化一個模組？" });

console.log("已傳送後續問題給每個工作階段");

// 清除所有工作階段
await session1.destroy();
await session2.destroy();
await session3.destroy();
await client.stop();

console.log("所有工作階段已成功銷毀");
