# 產生 PR 時長圖表

使用 Copilot 的內建功能建立一個互動式 CLI 工具，視覺化 GitHub 儲存庫的拉取請求 (Pull Request, PR) 時長分佈。

> **可執行範例：** [recipe/pr-visualization.cs](recipe/pr-visualization.cs)
> 
> ```bash
> # 從目前的 git 儲存庫自動偵測
> dotnet run recipe/pr-visualization.cs
> 
> # 明確指定一個儲存庫
> dotnet run recipe/pr-visualization.cs -- --repo github/copilot-sdk
> ```

## 範例場景

您希望了解儲存庫中 PR 已開啟多長時間。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP 伺服器獲取 PR 資料並產生圖表影像。

## 先決條件

```bash
dotnet add package GitHub.Copilot.SDK
```

## 用法

```bash
# 從目前的 git 儲存庫自動偵測
dotnet run

# 明確指定一個儲存庫
dotnet run -- --repo github/copilot-sdk
```

## 完整範例：pr-visualization.cs

```csharp
using System.Diagnostics;
using GitHub.Copilot.SDK;

// ============================================================================ 
// Git 與 GitHub 偵測
// ============================================================================ 

bool IsGitRepo()
{
    try
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "git",
            Arguments = "rev-parse --git-dir",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        })?.WaitForExit();
        return true;
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
    Console.Write("輸入 GitHub 儲存庫 (擁有者/儲存庫名稱)：");
    return Console.ReadLine()?.Trim() ?? "";
}

// ============================================================================ 
// 主應用程式
// ============================================================================ 

Console.WriteLine("🔍 PR 時長圖表產生器\n");

// 確定儲存庫
var repo = ParseRepoArg(args);

if (!string.IsNullOrEmpty(repo))
{
    Console.WriteLine($"📦 使用指定的儲存庫：{repo}");
}
else if (IsGitRepo())
{
    var detected = GetGitHubRemote();
    if (detected != null)
    {
        repo = detected;
        Console.WriteLine($"📦 偵測到 GitHub 儲存庫：{repo}");
    }
    else
    {
        Console.WriteLine("⚠️  找到 Git 儲存庫，但未偵測到 GitHub 遠端。");
        repo = PromptForRepo();
    }
}
else
{
    Console.WriteLine("📁 不在 Git 儲存庫中。");
    repo = PromptForRepo();
}

if (string.IsNullOrEmpty(repo) || !repo.Contains('/'))
{
    Console.WriteLine("❌ 無效的儲存庫格式。預期格式：擁有者/儲存庫名稱");
    return;
}

var parts = repo.Split('/');
var owner = parts[0];
var repoName = parts[1];

// 建立 Copilot 用戶端 - 不需要自定義工具！
await using var client = new CopilotClient(new CopilotClientOptions { LogLevel = "error" });
await client.StartAsync();

var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5",
    OnPermissionRequest = PermissionHandler.ApproveAll,
    SystemMessage = new SystemMessageConfig
    {
        Content = $"""
<context>
您正在分析 GitHub 儲存庫的拉取請求：{owner}/{repoName}
目前的工作目錄為：{Environment.CurrentDirectory}
</context>

<instructions>
- 使用 GitHub MCP 伺服器工具獲取 PR 資料
- 使用您的檔案與程式碼執行工具產生圖表
- 將任何產生的影像儲存到目前工作目錄
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

// 初始提示 - 讓 Copilot 找出詳細資訊
Console.WriteLine("\n📊 開始分析...\n");

await session.SendAsync(new MessageOptions
{
    Prompt = $"""
      獲取 {owner}/{repoName} 過去一週的開放拉取請求。
      計算每個 PR 的時長（以天為單位）。
      然後產生一個條形圖影像，顯示 PR 時長的分佈
      （將它們分組到合理的貯槽中，例如 <1 天、1-3 天等）。
      將圖表儲存為目前目錄中的 "pr-age-chart.png"。
      最後，總結 PR 健康度 - 平均時長、最舊的 PR，以及有多少可能被視為停滯。
    """
});

// 互動式迴圈
Console.WriteLine("\n💡 提出後續問題或輸入 \"exit\" 退出。\n");
Console.WriteLine("範例：");
Console.WriteLine("  - \"擴展到過去一個月\"");
Console.WriteLine("  - \"顯示前 5 個最舊的 PR\"");
Console.WriteLine("  - \"改為產生圓餅圖\"");
Console.WriteLine("  - \"按作者而非時長分組\"");
Console.WriteLine();

while (true)
{
    Console.Write("您：");
    var input = Console.ReadLine()?.Trim();

    if (string.IsNullOrEmpty(input)) continue;
    if (input.ToLower() is "exit" or "quit")
    {
        Console.WriteLine("👋 再見！");
        break;
    }

    await session.SendAsync(new MessageOptions { Prompt = input });
}
```

## 運作方式

1. **儲存庫偵測**：檢查 `--repo` 旗標 → git 遠端 → 提示使用者
2. **無需自定義工具**：完全依賴 Copilot CLI 的內建功能：
   - **GitHub MCP 伺服器** - 從 GitHub 獲取 PR 資料
   - **檔案工具** - 儲存產生的圖表影像
   - **程式碼執行** - 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式工作階段**：初始分析後，使用者可以要求調整

## 為何使用此方法？

| 考量層面         | 自定義工具        | 內建 Copilot                      |
| --------------- | ----------------- | --------------------------------- |
| 程式碼複雜度     | 高                | **極小**                          |
| 維護             | 您自行維護        | **Copilot 維護**                  |
| 彈性             | 固定邏輯          | **AI 決定最佳方法**               |
| 圖表類型         | 您所編寫的內容    | **Copilot 能產生的任何類型**      |
| 資料分組         | 硬編碼的貯槽      | **智慧分組**                      |
