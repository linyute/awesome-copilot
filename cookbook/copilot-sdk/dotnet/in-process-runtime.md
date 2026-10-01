# 程序內執行階段

在您自己的程序內執行 Copilot 執行階段，而非啟動一個獨立的 Copilot CLI 程序。

> **可執行範例：** [recipe/in-process-runtime.cs](recipe/in-process-runtime.cs)
>
> ```bash
> dotnet run recipe/in-process-runtime.cs
> ```

## 範例情境

預設情況下，`CopilotClient` 會啟動並管理一個獨立的 Copilot CLI 子程序，並透過
stdio 或 TCP 與之通訊。某些部署 —— 例如沙箱限制嚴格的宿主、單一二進位檔
服務，或限制啟動子程序（子程序）的環境 —— 需要直接將執行階段載入到應用程式
的进程中。

## 使用程序內連線

```csharp
using GitHub.Copilot;

// RuntimeConnection.ForInProcess() 為實驗性 API（診斷碼 GHCP001）。
#pragma warning disable GHCP001

var client = new CopilotClient(new CopilotClientOptions
{
    Connection = RuntimeConnection.ForInProcess()
});

await client.StartAsync();

var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "auto",
    OnPermissionRequest = PermissionHandler.ApproveAll
});

var response = await session.SendAndWaitAsync(
    new MessageOptions { Prompt = "來自程序內執行階段（程序內執行階段）的問候！" });
Console.WriteLine(response?.Data.Content);

await client.StopAsync();
```

`RuntimeConnection.ForInProcess()` 標記了 `[Experimental("GHCP001")]`，因此任何呼叫它的
程式碼都要么用 `#pragma warning disable GHCP001` 抑制診斷碼（如上所示），
要么在專案層級選擇加入。客戶端建立完成之後的一切 —— 工作階段、串流事件、工具、
掛鉤（掛鉤）與權限 —— 其行為與預設的 CLI 啟動式連線完全一致。

## 工作原理

SDK 不會啟動子程序，而是直接將原生 Copilot 執行階段函式庫載入到您的
應用程式中，並透過記憶體內的連線與之通訊，使用的協定與 CLI 傳輸層
相同，都是以 `Content-Length` 封框的 JSON-RPC 協定。執行階段可以從原生
工作執行緒（執行緒）呼叫 SDK 回呼函式；SDK 會負責將這些呼叫封裝
回託管執行緒，無需您額外處理。

您也可以在不改動應用程式程式碼的情況下選取程序內傳輸層：在啟動前
設定 `COPILOT_SDK_DEFAULT_CONNECTION=inprocess` 即可 —— 只有當客戶端
未明確指定連線時，SDK 才會回退到這個環境變數。

## 限制

程序內傳輸層為實驗性功能，有幾項限制需要留意：

- **共享程序狀態**：每個程序內客戶端都共享宿主程序的環境、
  目前工作目錄與原生執行階段函式庫 —— 無法為每個客戶端
  個別覆寫工作目錄或環境變數。
- **拒絕的程序選項**：`CopilotClientOptions.Environment`、遙測設定，
  以及其他假設存在獨立子程序的選項都不支援，設定時會拋出例外。
- **每個程序只能有一個執行階段版本**：一旦載入原生執行階段函式庫，
  再啟動另一個使用不同執行階段函式庫路徑或版本的客戶端就會失敗；
  而重用相同已載入函式庫的其他客戶端則沒有問題。
- **持續載入**：原生函式庫會持續載入至程序結束，即便
  `StopAsync()` 已優雅地關閉客戶端的工作階段與連線 —— 請勿指望之後
  能解除載入並換用不同的執行階段建置。

## 最佳實務

1. **逐平台測試**：在每個部署的 OS/架構組合上驗證啟動、模型回合與
   關閉流程，因為執行階段函式庫的支援程度各不相同。
2. **優先用預設的 CLI 傳輸層**，除非您确实需要避免子程序 ——
   它是最成熟、隔離性最好的部署路徑。
3. **仍要呼叫 `StopAsync()`**：優雅關閉仍會乾淨地關閉工作階段與
   JSON-RPC 連線，即便原生函式庫本身仍保持載入狀態。
4. **盡早設定程序層級的值**：在建立第一個程序內客戶端之前設定環境變數
   與工作目錄，因為之後建立的客戶端無法按個體覆寫這些值。
