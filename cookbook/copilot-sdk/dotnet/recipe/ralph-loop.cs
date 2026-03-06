#:package GitHub.Copilot.SDK@*

using GitHub.Copilot.SDK;

// Ralph loop：具有每次反覆運算全新內容的自主 AI 任務迴圈。
//
// 兩種模式：
//   - "plan"：讀取 PROMPT_plan.md，產生/更新 IMPLEMENTATION_PLAN.md
//   - "build"：讀取 PROMPT_build.md，實作任務、執行測試、提交
//
// 每次反覆運算都會建立一個新的工作階段，以便代理程式始終在其內容視窗的
// 「智慧區域」內運作。狀態透過磁碟上的檔案 (IMPLEMENTATION_PLAN.md、AGENTS.md、specs/*)
// 在反覆運算之間共享。
//
// 用法：
//   dotnet run                      # 建構模式，50 次反覆運算
//   dotnet run plan                 # 規劃模式
//   dotnet run 20                   # 建構模式，20 次反覆運算
//   dotnet run plan 5               # 規劃模式，5 次反覆運算

var mode = args.Contains("plan") ? "plan" : "build";
var maxArg = args.FirstOrDefault(a => int.TryParse(a, out _));
var maxIterations = maxArg != null ? int.Parse(maxArg) : 50;
var promptFile = mode == "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";

var client = new CopilotClient();
await client.StartAsync();

Console.WriteLine(new string('━', 40));
Console.WriteLine($"模式:   {mode}");
Console.WriteLine($"提示字: {promptFile}");
Console.WriteLine($"上限:    {maxIterations} 次反覆運算");
Console.WriteLine(new string('━', 40));

try
{
    var prompt = await File.ReadAllTextAsync(promptFile);

    for (var i = 1; i <= maxIterations; i++)
    {
        Console.WriteLine($"\n=== 反覆運算 {i}/{maxIterations} ===");

        // 全新工作階段 — 每個任務都能獲得完整的內容預算
        var session = await client.CreateSessionAsync(
            new SessionConfig
            {
                Model = "gpt-5.1-codex-mini",
                // 將代理程式固定在專案目錄
                WorkingDirectory = Environment.CurrentDirectory,
                // 自動核准工具呼叫以進行自動化執行
                OnPermissionRequest = (_, _) => Task.FromResult(
                    new PermissionRequestResult { Kind = "approved" }),
            });

        try
        {
            var done = new TaskCompletionSource<string>();
            session.On(evt =>
            {
                // 記錄工具使用情況以提高可見性
                if (evt is ToolExecutionStartEvent toolStart)
                    Console.WriteLine($"  ⚙ {toolStart.Data.ToolName}");
                else if (evt is AssistantMessageEvent msg)
                    done.TrySetResult(msg.Data.Content);
            });

            await session.SendAsync(new MessageOptions { Prompt = prompt });
            await done.Task;
        }
        finally
        {
            await session.DisposeAsync();
        }

        Console.WriteLine($"\n反覆運算 {i} 完成。");
    }

    Console.WriteLine($"\n已達到最大反覆運算次數：{maxIterations}");
}
finally
{
    await client.StopAsync();
}
