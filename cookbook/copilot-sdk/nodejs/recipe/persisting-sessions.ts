import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();

// 建立具有易記識別碼的工作階段
const session = await client.createSession({
    sessionId: "user-123-conversation",
    model: "gpt-5",
});

await session.sendAndWait({ prompt: "讓我們來討論 TypeScript 泛型 (Generics)" });
console.log(`工作階段已建立: ${session.sessionId}`);

// 銷毀工作階段但將資料保留在磁碟上
await session.destroy();
console.log("工作階段已銷毀（狀態已持久化）");

// 恢復先前的工作階段
const resumed = await client.resumeSession("user-123-conversation");
console.log(`已恢復: ${resumed.sessionId}`);

await resumed.sendAndWait({ prompt: "我們剛才在討論什麼？" });

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
