#:package GitHub.Copilot.SDK@*
#:property PublishAot=false

// GitHub.Copilot.SDK 套件公開了 GitHub.Copilot 命名空間。
using GitHub.Copilot;

await using var client = new CopilotClient();
await client.StartAsync();

// 建立具有易記識別碼的工作階段
var session = await client.CreateSessionAsync(new SessionConfig
{
    SessionId = "user-123-conversation",
    Model = "gpt-5",
    OnPermissionRequest = PermissionHandler.ApproveAll
});

await session.SendAsync(new MessageOptions { Prompt = "讓我們來討論 TypeScript 泛型 (Generics)" });
Console.WriteLine($"工作階段已建立: {session.SessionId}");

// 銷毀工作階段但將資料保留在磁碟上
await session.DisposeAsync();
Console.WriteLine("工作階段已銷毀（狀態已持久化）");

// 恢復先前的工作階段
var resumed = await client.ResumeSessionAsync("user-123-conversation", new ResumeSessionConfig { OnPermissionRequest = PermissionHandler.ApproveAll });
Console.WriteLine($"已恢復: {resumed.SessionId}");

await resumed.SendAsync(new MessageOptions { Prompt = "我們剛才在討論什麼？" });

// 列出工作階段
var sessions = await client.ListSessionsAsync();
Console.WriteLine("工作階段: " + string.Join(", ", sessions.Select(s => s.SessionId)));

// 永久刪除工作階段
await client.DeleteSessionAsync("user-123-conversation");
Console.WriteLine("工作階段已刪除");

await resumed.DisposeAsync();
await client.StopAsync();
