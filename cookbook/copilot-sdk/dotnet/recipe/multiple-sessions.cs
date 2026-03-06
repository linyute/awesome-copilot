#:package GitHub.Copilot.SDK@*
#:property PublishAot=false

using GitHub.Copilot.SDK;

await using var client = new CopilotClient();
await client.StartAsync();

// 建立多個獨立的工作階段
var session1 = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });
var session2 = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-5" });
var session3 = await client.CreateSessionAsync(new SessionConfig { Model = "claude-sonnet-4.5" });

Console.WriteLine("已建立 3 個獨立的工作階段");

// 每個工作階段都維護自己的對話歷程記錄
await session1.SendAsync(new MessageOptions { Prompt = "您正在協助一個 Python 專案" });
await session2.SendAsync(new MessageOptions { Prompt = "您正在協助一個 TypeScript 專案" });
await session3.SendAsync(new MessageOptions { Prompt = "您正在協助一個 Go 專案" });

Console.WriteLine("已向所有工作階段傳送初始內容");

// 後續訊息保留在各自的內容中
await session1.SendAsync(new MessageOptions { Prompt = "如何建立虛擬環境？" });
await session2.SendAsync(new MessageOptions { Prompt = "如何設定 tsconfig？" });
await session3.SendAsync(new MessageOptions { Prompt = "如何初始化模組？" });

Console.WriteLine("已向每個工作階段傳送後續問題");

// 清除所有工作階段
await session1.DisposeAsync();
await session2.DisposeAsync();
await session3.DisposeAsync();

Console.WriteLine("所有工作階段已成功銷毀");
