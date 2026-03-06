#:package GitHub.Copilot.SDK@*
#:property PublishAot=false

using System.Diagnostics;
using GitHub.Copilot.SDK;

// ============================================================================ 
// Git 與 GitHub 偵測
// ============================================================================ 

bool IsGitRepo()
{
    try
    {
        var proc = Process.Start(new ProcessStartInfo
        {
            FileName = "git",
            Arguments = "rev-parse --git-dir",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        });
        proc?.WaitForExit();
        return proc?.ExitCode == 0;
    }
    catch
    {
        return false;
    }
}

string? GetGitHubRemote()
{
    try
    {
        var proc = Process.Start(new ProcessStartInfo
        {
            FileName = "git",
            Arguments = "remote get-url origin",
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        });

        var remoteUrl = proc?.StandardOutput.ReadToEnd().Trim();
        proc?.WaitForExit();

        if (string.IsNullOrEmpty(remoteUrl)) return null;

        // 處理 SSH: git@github.com:owner/repo.git
        var sshMatch = System.Text.RegularExpressions.Regex.Match(
            remoteUrl, @"git@github\.com:(.+/.+?)(?:\.git)?$");
        if (sshMatch.Success) return sshMatch.Groups[1].Value;

        // 處理 HTTPS: https://github.com/owner/repo.git
        var httpsMatch = System.Text.RegularExpressions.Regex.Match(
            remoteUrl, @"https://github\.com/(.+/.+?)(?:\.git)?$");
        if (httpsMatch.Success) return httpsMatch.Groups[1].Value;

        return null;
    }
    catch
    {
        return null;
    }
}

string? ParseRepoArg(string[] args)
{
    var repoIndex = Array.IndexOf(args, "--repo");
    if (repoIndex != -1 && repoIndex + 1 < args.Length)
    {
        return args[repoIndex + 1];
    }
    return null;
}

string PromptForRepo()
{
    Console.Write("輸入 GitHub 存放庫 (擁有者/存放庫): ");
    return Console.ReadLine()?.Trim() ?? "";
}

// ============================================================================ 
// 主要應用程式
// ============================================================================ 

Console.WriteLine("🔍 PR 建立時間圖表產生器\n");

// 確定存放庫
var repo = ParseRepoArg(args);

if (!string.IsNullOrEmpty(repo))
{
    Console.WriteLine($"📦 使用指定的存放庫: {repo}");
}
else if (IsGitRepo())
{
    var detected = GetGitHubRemote();
    if (detected != null)
    {
        repo = detected;
        Console.WriteLine($"📦 偵測到 GitHub 存放庫: {repo}");
    }
    else
    {
        Console.WriteLine("⚠️  找到 Git 存放庫但未偵測到 GitHub 遠端。");
        repo = PromptForRepo();
    }
}
else
{
    Console.WriteLine("📁 不在 Git 存放庫中。");
    repo = PromptForRepo();
}

if (string.IsNullOrEmpty(repo) || !repo.Contains('/'))
{
    Console.WriteLine("❌ 存放庫格式無效。應為: 擁有者/存放庫");
    return;
}

var parts = repo.Split('/');
var owner = parts[0];
var repoName = parts[1];

// 建立 Copilot 用戶端 - 不需要自訂工具！
await using var client = new CopilotClient(new CopilotClientOptions { LogLevel = "error" });
await client.StartAsync();

var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5",
    SystemMessage = new SystemMessageConfig
    {
        Content = $"""
<context>
您正在分析 GitHub 存放庫的提取要求 (Pull Request): {owner}/{repoName}
目前工作目錄為: {Environment.CurrentDirectory}
</context>

<instructions>
- 使用 GitHub MCP Server 工具獲取 PR 資料
- 使用您的檔案和程式碼執行工具產生圖表
- 將產生的任何影像儲存到目前工作目錄
- 回應請保持簡潔
</instructions>
"""
    }
});

// 設定事件處理
session.On(evt =>
{
    switch (evt)
    {
        case AssistantMessageEvent msg:
            Console.WriteLine($"\n🤖 {msg.Data.Content}\n");
            break;
        case ToolExecutionStartEvent toolStart:
            Console.WriteLine($"  ⚙️  {toolStart.Data.ToolName}");
            break;
    }
});

// 初始提示 - 讓 Copilot 處理細節
Console.WriteLine("\n📊 開始分析...\n");

await session.SendAsync(new MessageOptions
{
    Prompt = $"""
      獲取過去一週 {owner}/{repoName} 的開放提取要求。
      計算每個 PR 的建立天數。
      然後產生一張長條圖影像，顯示 PR 建立時間的分佈
      （將它們分成合理的分組，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄下的 "pr-age-chart.png"。
      最後，摘要 PR 健康狀況 - 平均建立時間、最舊的 PR，以及有多少可能被視為停滯。
    """
});

// 互動迴圈
Console.WriteLine("\n💡 詢問後續問題或輸入 \"exit\" 結束。\n");
Console.WriteLine("範例：");
Console.WriteLine("  - \"擴展到上個月\"");
Console.WriteLine("  - \"顯示最舊的 5 個 PR\"");
Console.WriteLine("  - \"改為產生圓餅圖\"");
Console.WriteLine("  - \"改依作者分組而非依建立時間\"");
Console.WriteLine();

while (true)
{
    Console.Write("您: ");
    var input = Console.ReadLine()?.Trim();

    if (string.IsNullOrEmpty(input)) continue;
    if (input.ToLower() is "exit" or "quit")
    {
        Console.WriteLine("👋 再見！");
        break;
    }

    await session.SendAsync(new MessageOptions { Prompt = input });
}
