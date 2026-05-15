# NuGet 套件與目標架構

## 三個官方套件

所有套件都位於 [`ModelContextProtocol` NuGet 個人檔案](https://www.nuget.org/profiles/ModelContextProtocol)。官方 C# SDK 存放庫為 [`modelcontextprotocol/csharp-sdk`](https://github.com/modelcontextprotocol/csharp-sdk)，由 MCP 專案與 Microsoft 共同維護。

| 套件 | 何時使用 | 包含內容 |
|---|---|---|
| **`ModelContextProtocol`** | STDIO 伺服器與多數專案的預設選項 | `Core` + `Microsoft.Extensions.Hosting` 整合、屬性偵測 (`AddMcpServer`, `WithToolsFromAssembly` 等) |
| **`ModelContextProtocol.AspNetCore`** | 裝載於 ASP.NET Core 的 HTTP (串流) 伺服器 | 以上內容 + `WithHttpTransport` 與 `MapMcp` |
| **`ModelContextProtocol.Core`** | 純用戶端、自訂主機、不希望包含 `Microsoft.Extensions.*` 相依項的低階案例 | 僅包含協定 + 傳輸 + 低階 `McpServer.Create` / `McpClient.CreateAsync` |

**經驗法則：**
- 新的 STDIO 伺服器 → `ModelContextProtocol` + `Microsoft.Extensions.Hosting`。
- 新的 HTTP 伺服器 → 僅需 `ModelContextProtocol.AspNetCore` (它會遞迴拉取所有您需要的內容)。
- 純用戶端應用程式 → `ModelContextProtocol.Core` (若您也需要用戶端的裝載/DI，則使用 `ModelContextProtocol`)。

## 版本

截至 2026 年，穩定版本線為 **1.x** (撰寫本文時最新版本為 `1.2.0`)。`0.x` 版本線為預覽版，且存有破壞性差異 —— 如果您發現參考 `0.4`/`0.6` 的文件或部落格文章，請將其視為過時資訊。

若要檢查最新版本：

```bash
dotnet search ModelContextProtocol --prerelease
```

## 目標架構

此 SDK 的目標為 **`.NET 8.0`** 與 **`netstandard2.0`**。這代表它可執行於：
- .NET 8 (LTS)
- .NET 9
- .NET 10 (目前的 LTS —— 建議用於新專案)
- .NET Framework 4.6.2+ 透過 netstandard2.0 (較少見；僅用於舊版主機)

對於 HTTP 伺服器，您特別需要支援 ASP.NET Core 的 TFM (即 .NET 8/9/10)。

## 專案設定指令

### STDIO 伺服器

```bash
dotnet new console -n MyMcpServer -f net10.0
cd MyMcpServer
dotnet add package ModelContextProtocol
dotnet add package Microsoft.Extensions.Hosting
```

### HTTP (串流) 伺服器

```bash
dotnet new web -n MyMcpServer -f net10.0
cd MyMcpServer
dotnet add package ModelContextProtocol.AspNetCore
```

(`dotnet new web` 會建立一個極簡的 ASP.NET Core 專案 —— 正是 `MapMcp` 所需要的內容。)

### 用戶端

```bash
dotnet new console -n MyMcpClient -f net10.0
cd MyMcpClient
dotnet add package ModelContextProtocol.Core
```

## 非必要但通常很有用

| 套件 | 原因 |
|---|---|
| `Microsoft.Extensions.AI` | 提供 `IChatClient`、`ChatMessage`、`ChatRole`、`ChatOptions` —— 這些是 `AsSamplingChatClient()` 與提示回傳型別所使用的抽象概念。 |
| `Microsoft.Extensions.AI.Abstractions` | 透過遞迴拉取，但對於 `DataContent`、`TextContent` 等型別值得了解。 |
| `OpenTelemetry.Extensions.Hosting` | SDK 會為工具呼叫發出 OTel 追蹤與計量資訊 —— 如果使用者有可觀測性需求，請進行串接。 |

## 關於 `dnx`？

較新的 Microsoft 範例有時會顯示透過 `dnx PackageName --version 1.2.3` 啟動伺服器。這是一種有效的發行模型：將您的伺服器發佈為 NuGet 套件，並讓使用者在不複製存放庫的情況下執行它。這與伺服器本身的建構方式無關 —— 保持程式碼相同，只需更改啟動指令即可。
