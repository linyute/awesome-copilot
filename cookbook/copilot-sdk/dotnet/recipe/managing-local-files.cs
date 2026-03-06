#:package GitHub.Copilot.SDK@*
#:property PublishAot=false

using GitHub.Copilot.SDK;

// 建立並啟動用戶端
await using var client = new CopilotClient();
await client.StartAsync();

// 定義檔案操作工具
var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-5"
});

// 等待完成
var done = new TaskCompletionSource();

session.On(evt =>
{
    switch (evt)
    {
        case AssistantMessageEvent msg:
            Console.WriteLine($"\nCopilot: {msg.Data.Content}");
            break;
        case ToolExecutionStartEvent toolStart:
            Console.WriteLine($"  → 執行中: {toolStart.Data.ToolName} ({toolStart.Data.ToolCallId})");
            break;
        case ToolExecutionCompleteEvent toolEnd:
            Console.WriteLine($"  ✓ 已完成: {toolEnd.Data.ToolCallId}");
            break;
        case SessionIdleEvent:
            done.SetResult();
            break;
    }
});

// 請求 Copilot 整理檔案
// 將此更改為您的目標資料夾
var targetFolder = @"C:\Users\Me\Downloads";

await session.SendAsync(new MessageOptions
{
    Prompt = $"""
        分析 "{targetFolder}" 中的檔案並將其整理到子資料夾中。

        1. 首先，列出所有檔案及其 Metadata
        2. 預覽依檔案副檔名進行分組
        3. 建立適當的子資料夾（例如 "images", "documents", "videos"）
        4. 將每個檔案移動到其適當的子資料夾中

        移動任何檔案之前請先確認。
        """
});

await done.Task;
