#:package GitHub.Copilot.SDK@*
#:property PublishAot=false

// GitHub.Copilot.SDK 套件會公開 GitHub.Copilot 命名空間。
using GitHub.Copilot;

// RuntimeConnection.ForInProcess() 是實驗性 API（診斷碼 GHCP001）：
// 它直接將原生 Copilot runtime 載入此进程中，而非
// 啟動一個獨立的 Copilot CLI 程序。
#pragma warning disable GHCP001

var client = new CopilotClient(new CopilotClientOptions
{
    Connection = RuntimeConnection.ForInProcess()
});

try
{
    await client.StartAsync();

    var session = await client.CreateSessionAsync(new SessionConfig
    {
        Model = "auto",
        OnPermissionRequest = PermissionHandler.ApproveAll
    });

    var response = await session.SendAndWaitAsync(
        new MessageOptions { Prompt = "來自进程內 runtime 的問候！" });
    Console.WriteLine(response?.Data.Content);

    await session.DisposeAsync();
}
finally
{
    // 優雅地停止；原生 runtime 函式庫本身會在程序生命週期內保持載入
    // （請參閱文件中的「Lifecycle behavior」說明）。
    await client.StopAsync();
}
