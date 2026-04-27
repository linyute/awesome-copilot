import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();

// 建立一個具有記憶 ID 的工作階段
const session = await client.createSession({
    onPermissionRequest: approveAll,
    sessionId: "user-123-conversation",
    model: "gpt-5",
});

await session.sendAndWait({ prompt: "讓我們討論 TypeScript 泛型" });
console.log(`工作階段已建立: ${session.sessionId}`);

// 銷毀工作階段但將資料保留在磁碟上
await session.destroy();
console.log("工作階段已銷毀（狀態已儲存）");

// 恢復之前的會話
const resumed = await client.resumeSession("user-123-conversation", { onPermissionRequest: approveAll });
console.log(`已恢復: ${resumed.sessionId}`);

await resumed.sendAndWait({ prompt: "我們剛才討論了什麼？" });

// 列出工作階段
const sessions = await client.listSessions();
console.log(
    "工作階段:",
    sessions.map((s) => s.sessionId)
);

// 永久刪除工作階段
await client.deleteSession("user-123-conversation");
console.log("工作階段已刪除");

await resumed.destroy();
await client.stop();
