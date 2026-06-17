#:package GitHub.Copilot.SDK@*
#:property PublishAot=false

// GitHub.Copilot.SDK 套件公開了 GitHub.Copilot 命名空間。
using GitHub.Copilot;

var client = new CopilotClient();

try
{
    await client.StartAsync();
    var session = await client.CreateSessionAsync(new SessionConfig
    {
        Model = "gpt-5",
        OnPermissionRequest = PermissionHandler.ApproveAll
    });

    var done = new TaskCompletionSource<string>();
    session.On(evt =>
    {
        if (evt is AssistantMessageEvent msg)
        {
            done.SetResult(msg.Data.Content);
        }
    });

    await session.SendAsync(new MessageOptions { Prompt = "Hello!" });
    var response = await done.Task;
    Console.WriteLine(response);

    await session.DisposeAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"錯誤: {ex.Message}");
}
finally
{
    await client.StopAsync();
}
