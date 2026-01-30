--- 
name: 'copilot-sdk'
description: '使用 GitHub Copilot SDK 建構 Agentic 應用程式。適用於在應用程式中嵌入 AI Agent、建立自訂工具、實作串流回應、管理工作階段、連接到 MCP 伺服器或建立自訂 Agent。觸發條件包括 Copilot SDK、GitHub SDK、Agentic 應用程式、嵌入 Copilot、可程式化 Agent、MCP 伺服器、自訂 Agent。'
---

# GitHub Copilot SDK

使用 Python、TypeScript、Go 或 .NET 在任何應用程式中嵌入 Copilot 的 Agentic 工作流程。

## 總覽

GitHub Copilot SDK 公開了 Copilot CLI 背後的相同引擎：一個經過生產測試、您可以透過程式碼呼叫的 Agent 執行階段。無需建構您自己的協作流程 - 您定義 Agent 行為，Copilot 負責處理規劃、工具呼叫、檔案編輯等。

## 前提條件

1. 已安裝 **GitHub Copilot CLI** 並完成驗證 ([安裝指南](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli))
2. **語言執行階段**：Node.js 18+、Python 3.8+、Go 1.21+ 或 .NET 8.0+

驗證 CLI：`copilot --version`

## 安裝

### Node.js/TypeScript
```bash
mkdir copilot-demo && cd copilot-demo
npm init -y --init-type module
npm install @github/copilot-sdk tsx
```

### Python
```bash
pip install github-copilot-sdk
```

### Go
```bash
mkdir copilot-demo && cd copilot-demo
go mod init copilot-demo
go get github.com/github/copilot-sdk/go
```

### .NET
```bash
dotnet new console -n CopilotDemo && cd CopilotDemo
dotnet add package GitHub.Copilot.SDK
```

## 快速入門

### TypeScript
```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1" });

const response = await session.sendAndWait({ prompt: "2 + 2 等於多少？" });
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

執行：`npx tsx index.ts`

### Python
```python
import asyncio
from copilot import CopilotClient

async def main():
    client = CopilotClient()
    await client.start()

    session = await client.create_session({"model": "gpt-4.1"})
    response = await session.send_and_wait({"prompt": "2 + 2 等於多少？"})

    print(response.data.content)
    await client.stop()

asyncio.run(main())
```

### Go
```go
package main

import (
    "fmt"
    "log"
    "os"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    client := copilot.NewClient(nil)
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    session, err := client.CreateSession(&copilot.SessionConfig{Model: "gpt-4.1"})
    if err != nil {
        log.Fatal(err)
    }

    response, err := session.SendAndWait(copilot.MessageOptions{Prompt: "2 + 2 等於多少？"}, 0)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(*response.Data.Content)
    os.Exit(0)
}
```

### .NET (C#)
```csharp
using GitHub.Copilot.SDK;

await using var client = new CopilotClient();
await using var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-4.1" });

var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = "2 + 2 等於多少？" });
Console.WriteLine(response?.Data.Content);
```

執行：`dotnet run`

## 串流回應

啟用即時輸出以獲得更好的使用者體驗 (UX)：

### TypeScript
```typescript
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
    if (event.type === "session.idle") {
        console.log(); // 完成後換行
    }
});

await session.sendAndWait({ prompt: "講一個短笑話" });

await client.stop();
process.exit(0);
```

### Python
```python
import asyncio
import sys
from copilot import CopilotClient
from copilot.generated.session_events import SessionEventType

async def main():
    client = CopilotClient()
    await client.start()

    session = await client.create_session({
        "model": "gpt-4.1",
        "streaming": True,
    })

    def handle_event(event):
        if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
            sys.stdout.write(event.data.delta_content)
            sys.stdout.flush()
        if event.type == SessionEventType.SESSION_IDLE:
            print()

    session.on(handle_event)
    await session.send_and_wait({"prompt": "講一個短笑話"})
    await client.stop()

asyncio.run(main())
```

### Go
```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Model:     "gpt-4.1",
    Streaming: true,
})

session.On(func(event copilot.SessionEvent) {
    if event.Type == "assistant.message_delta" {
        fmt.Print(*event.Data.DeltaContent)
    }
    if event.Type == "session.idle" {
        fmt.Println()
    }
})

_, err = session.SendAndWait(copilot.MessageOptions{Prompt: "講一個短笑話"}, 0)
```

### .NET
```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    Streaming = true,
});

session.On(ev =>
{
    if (ev is AssistantMessageDeltaEvent deltaEvent)
        Console.Write(deltaEvent.Data.DeltaContent);
    if (ev is SessionIdleEvent)
        Console.WriteLine();
});

await session.SendAndWaitAsync(new MessageOptions { Prompt = "講一個短笑話" });
```

## 自訂工具

定義 Copilot 在推論期間可以呼叫的工具。當您定義工具時，您會告訴 Copilot：
1. **工具的作用** (說明)
2. **它需要的參數** (結構描述)
3. **要執行的程式碼** (處理常式)

### TypeScript (JSON Schema)
```typescript
import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";

const getWeather = defineTool("get_weather", {
    description: "取得城市的目前天氣",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "城市名稱" },
        },
        required: ["city"],
    },
    handler: async (args: { city: string }) => {
        const { city } = args;
        // 在實際應用程式中，在此處呼叫天氣 API
        const conditions = ["晴天", "多雲", "雨天", "晴時多雲"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
    tools: [getWeather],
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
});

await session.sendAndWait({
    prompt: "西雅圖和東京的天氣如何？",
});

await client.stop();
process.exit(0);
```

### Python (Pydantic)
```python
import asyncio
import random
import sys
from copilot import CopilotClient
from copilot.tools import define_tool
from copilot.generated.session_events import SessionEventType
from pydantic import BaseModel, Field

class GetWeatherParams(BaseModel):
    city: str = Field(description="要取得天氣的城市名稱")

@define_tool(description="取得城市的目前天氣")
async def get_weather(params: GetWeatherParams) -> dict:
    city = params.city
    conditions = ["晴天", "多雲", "雨天", "晴時多雲"]
    temp = random.randint(50, 80)
    condition = random.choice(conditions)
    return {"city": city, "temperature": f"{temp}°F", "condition": condition}

async def main():
    client = CopilotClient()
    await client.start()

    session = await client.create_session({
        "model": "gpt-4.1",
        "streaming": True,
        "tools": [get_weather],
    })

    def handle_event(event):
        if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
            sys.stdout.write(event.data.delta_content)
            sys.stdout.flush()

    session.on(handle_event)

    await session.send_and_wait({
        "prompt": "西雅圖和東京的天氣如何？"
    })

    await client.stop()

asyncio.run(main())
```

### Go
```go
type WeatherParams struct {
    City string `json:"city" jsonschema:"城市名稱"`
}

type WeatherResult struct {
    City        string `json:"city"`
    Temperature string `json:"temperature"`
    Condition   string `json:"condition"`
}

getWeather := copilot.DefineTool(
    "get_weather",
    "取得城市的目前天氣",
    func(params WeatherParams, inv copilot.ToolInvocation) (WeatherResult, error) {
        conditions := []string{"晴天", "多雲", "雨天", "晴時多雲"}
        temp := rand.Intn(30) + 50
        condition := conditions[rand.Intn(len(conditions))]
        return WeatherResult{
            City:        params.City,
            Temperature: fmt.Sprintf("%d°F", temp),
            Condition:   condition,
        }, nil
    },
)

session, _ := client.CreateSession(&copilot.SessionConfig{
    Model:     "gpt-4.1",
    Streaming: true,
    Tools:     []copilot.Tool{getWeather},
})
```

### .NET (Microsoft.Extensions.AI)
```csharp
using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using System.ComponentModel;

var getWeather = AIFunctionFactory.Create(
    ([Description("城市名稱")] string city) =>
    {
        var conditions = new[] { "晴天", "多雲", "雨天", "晴時多雲" };
        var temp = Random.Shared.Next(50, 80);
        var condition = conditions[Random.Shared.Next(conditions.Length)];
        return new { city, temperature = "${temp}°F", condition };
    },
    "get_weather",
    "取得城市的目前天氣"
);

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    Streaming = true,
    Tools = [getWeather],
});
```

## 工具如何運作

當 Copilot 決定呼叫您的工具時：
1. Copilot 傳送包含參數的工具呼叫請求
2. SDK 執行您的處理常式函式
3. 結果被傳回給 Copilot
4. Copilot 將結果整合到其回應中

Copilot 根據使用者的問題和您的工具說明來決定何時呼叫您的工具。

## 互動式 CLI 助理

建構一個完整的互動式助理：

### TypeScript
```typescript
import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";
import * as readline from "readline";

const getWeather = defineTool("get_weather", {
    description: "取得城市的目前天氣",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "城市名稱" },
        },
        required: ["city"],
    },
    handler: async ({ city }) => {
        const conditions = ["晴天", "多雲", "雨天", "晴時多雲"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
    tools: [getWeather],
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log("天氣助理 (輸入 'exit' 退出)");
console.log("嘗試：'巴黎的天氣如何？'\n");

const prompt = () => {
    rl.question("您：", async (input) => {
        if (input.toLowerCase() === "exit") {
            await client.stop();
            rl.close();
            return;
        }

        process.stdout.write("助理：");
        await session.sendAndWait({ prompt: input });
        console.log("\n");
        prompt();
    });
};

prompt();
```

### Python
```python
import asyncio
import random
import sys
from copilot import CopilotClient
from copilot.tools import define_tool
from copilot.generated.session_events import SessionEventType
from pydantic import BaseModel, Field

class GetWeatherParams(BaseModel):
    city: str = Field(description="要取得天氣的城市名稱")

@define_tool(description="取得城市的目前天氣")
async def get_weather(params: GetWeatherParams) -> dict:
    conditions = ["晴天", "多雲", "雨天", "晴時多雲"]
    temp = random.randint(50, 80)
    condition = random.choice(conditions)
    return {"city": params.city, "temperature": f"{temp}°F", "condition": condition}

async def main():
    client = CopilotClient()
    await client.start()

    session = await client.create_session({
        "model": "gpt-4.1",
        "streaming": True,
        "tools": [get_weather],
    })

    def handle_event(event):
        if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
            sys.stdout.write(event.data.delta_content)
            sys.stdout.flush()

    session.on(handle_event)

    print("天氣助理 (輸入 'exit' 退出)")
    print("嘗試：'巴黎的天氣如何？'\n")

    while True:
        try:
            user_input = input("您：")
        except EOFError:
            break

        if user_input.lower() == "exit":
            break

        sys.stdout.write("助理：")
        await session.send_and_wait({"prompt": user_input})
        print("\n")

    await client.stop()

asyncio.run(main())
```

## MCP 伺服器整合

連接到 MCP (Model Context Protocol) 伺服器以使用預建工具。連接到 GitHub 的 MCP 伺服器以存取存放庫、議題 (Issue) 和 PR：

### TypeScript
```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    mcpServers: {
        github: {
            type: "http",
            url: "https://api.githubcopilot.com/mcp/",
        },
    },
});
```

### Python
```python
session = await client.create_session({
    "model": "gpt-4.1",
    "mcp_servers": {
        "github": {
            "type": "http",
            "url": "https://api.githubcopilot.com/mcp/",
        },
    },
})
```

### Go
```go
session, _ := client.CreateSession(&copilot.SessionConfig{
    Model: "gpt-4.1",
    MCPServers: map[string]copilot.MCPServerConfig{
        "github": {
            Type: "http",
            URL:  "https://api.githubcopilot.com/mcp/",
        },
    },
})
```

### .NET
```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    McpServers = new Dictionary<string, McpServerConfig>
    {
        ["github"] = new McpServerConfig
        {
            Type = "http",
            Url = "https://api.githubcopilot.com/mcp/",
        },
    },
});
```

## 自訂 Agent

為特定工作定義專門的 AI 角色：

### TypeScript
```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    customAgents: [{
        name: "pr-reviewer",
        displayName: "PR 審查員",
        description: "審查 PR 是否符合最佳實踐",
        prompt: "您是一位資深程式碼審查員。請專注於安全性、效能和可維護性。",
    }],
});
```

### Python
```python
session = await client.create_session({
    "model": "gpt-4.1",
    "custom_agents": [{
        "name": "pr-reviewer",
        "display_name": "PR 審查員",
        "description": "審查 PR 是否符合最佳實踐",
        "prompt": "您是一位資深程式碼審查員。請專注於安全性、效能和可維護性。",
    }],
})
```

## 系統訊息

自訂 AI 的行為和個性：

### TypeScript
```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    systemMessage: {
        content: "您是我們工程團隊的得力助手。請務必保持簡潔。",
    },
});
```

### Python
```python
session = await client.create_session({
    "model": "gpt-4.1",
    "system_message": {
        "content": "您是我們工程團隊的得力助手。請務必保持簡潔。",
    },
})
```

## 外部 CLI 伺服器

單獨在伺服器模式下執行 CLI 並將 SDK 連接到它。這對於偵錯、資源共享或自訂環境非常有用。

### 以伺服器模式啟動 CLI
```bash
copilot --server --port 4321
```

### 將 SDK 連接到外部伺服器

#### TypeScript
```typescript
const client = new CopilotClient({
    cliUrl: "localhost:4321"
});

const session = await client.createSession({ model: "gpt-4.1" });
```

#### Python
```python
client = CopilotClient({
    "cli_url": "localhost:4321"
})
await client.start()

session = await client.create_session({"model": "gpt-4.1"})
```

#### Go
```go
client := copilot.NewClient(&copilot.ClientOptions{
    CLIUrl: "localhost:4321",
})

if err := client.Start(); err != nil {
    log.Fatal(err)
}

session, _ := client.CreateSession(&copilot.SessionConfig{Model: "gpt-4.1"})
```

#### .NET
```csharp
using var client = new CopilotClient(new CopilotClientOptions
{
    CliUrl = "localhost:4321"
});

await using var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-4.1" });
```

**注意：** 當提供 `cliUrl` 時，SDK 不會產生或管理 CLI 處理程序 - 它只會連接到現有的伺服器。

## 事件類型

| 事件 | 說明 |
|-------|-------------|
| `user.message` | 使用者輸入已新增 |
| `assistant.message` | 完整的模型回應 |
| `assistant.message_delta` | 串流回應區塊 |
| `assistant.reasoning` | 模型推論 (取決於模型) |
| `assistant.reasoning_delta` | 串流推論區塊 |
| `tool.execution_start` | 工具呼叫已啟動 |
| `tool.execution_complete` | 工具執行已完成 |
| `session.idle` | 無作用中處理 |
| `session.error` | 發生錯誤 |

## 用戶端設定

| 選項 | 說明 | 預設值 |
|--------|-------------|---------|
| `cliPath` | Copilot CLI 執行檔路徑 | 系統 PATH |
| `cliUrl` | 連接到現有伺服器 (例如："localhost:4321") | 無 |
| `port` | 伺服器通訊埠 | 隨機 |
| `useStdio` | 使用 stdio 傳輸而非 TCP | true |
| `logLevel` | 記錄詳細程度 | "info" |
| `autoStart` | 自動啟動伺服器 | true |
| `autoRestart` | 當機時重新啟動 | true |
| `cwd` | CLI 處理程序的工作目錄 | 繼承 |

## 工作階段設定

| 選項 | 說明 |
|--------|-------------|
| `model` | 要使用的 LLM ("gpt-4.1", "claude-sonnet-4.5" 等) |
| `sessionId` | 自訂工作階段識別碼 |
| `tools` | 自訂工具定義 |
| `mcpServers` | MCP 伺服器連線 |
| `customAgents` | 自訂 Agent 角色 |
| `systemMessage` | 覆蓋預設系統提示 |
| `streaming` | 啟用增量回應區塊 |
| `availableTools` | 允許工具的白名單 |
| `excludedTools` | 停用工具的黑名單 |

## 工作階段持久性

在重新啟動後儲存並繼續對話：

### 使用自訂 ID 建立
```typescript
const session = await client.createSession({
    sessionId: "user-123-conversation",
    model: "gpt-4.1"
});
```

### 繼續工作階段
```typescript
const session = await client.resumeSession("user-123-conversation");
await session.send({ prompt: "我們之前討論了什麼？" });
```

### 列出並刪除工作階段
```typescript
const sessions = await client.listSessions();
await client.deleteSession("old-session-id");
```

## 錯誤處理

```typescript
try {
    const client = new CopilotClient();
    const session = await client.createSession({ model: "gpt-4.1" });
    const response = await session.sendAndWait(
        { prompt: "您好！" },
        30000 // 逾時 (毫秒)
    );
} catch (error) {
    if (error.code === "ENOENT") {
        console.error("未安裝 Copilot CLI");
    } else if (error.code === "ECONNREFUSED") {
        console.error("無法連接到 Copilot 伺服器");
    } else {
        console.error("錯誤：", error.message);
    }
} finally {
    await client.stop();
}
```

## 優雅關機

```typescript
process.on("SIGINT", async () => {
    console.log("正在關機...");
    await client.stop();
    process.exit(0);
});
```

## 常見模式

### 多輪對話
```typescript
const session = await client.createSession({ model: "gpt-4.1" });

await session.sendAndWait({ prompt: "我的名字是 Alice" });
await session.sendAndWait({ prompt: "我的名字是什麼？" });
// 回應："您的名字是 Alice"
```

### 檔案附件
```typescript
await session.send({
    prompt: "分析此檔案",
    attachments: [{
        type: "file",
        path: "./data.csv",
        displayName: "銷售資料"
    }]
});
```

### 中止長時間的操作
```typescript
const timeoutId = setTimeout(() => {
    session.abort();
}, 60000);

session.on((event) => {
    if (event.type === "session.idle") {
        clearTimeout(timeoutId);
    }
});
```

## 可用模型

在執行階段查詢可用模型：

```typescript
const models = await client.getModels();
// 傳回：["gpt-4.1", "gpt-4o", "claude-sonnet-4.5", ...]
```

## 最佳實踐

1. **務必清理**：使用 `try-finally` 或 `defer` 以確保呼叫 `client.stop()`
2. **設定逾時**：針對長時間操作使用帶有逾時設定的 `sendAndWait`
3. **處理事件**：訂閱錯誤事件以進行穩健的錯誤處理
4. **使用串流**：針對長回應啟用串流以提供更好的使用者體驗 (UX)
5. **持久化工作階段**：針對多輪對話使用自訂工作階段 ID
6. **定義清晰的工具**：編寫具有描述性的工具名稱和說明

## 架構

```
您的應用程式
       |
  SDK 用戶端
       | JSON-RPC
  Copilot CLI (伺服器模式)
       |
  GitHub (模型、身分驗證)
```

SDK 會自動管理 CLI 處理程序的生命週期。所有通訊都透過 stdio 或 TCP 上的 JSON-RPC 進行。

## 資源

- **GitHub 存放庫**：https://github.com/github/copilot-sdk
- **入門教學**：https://github.com/github/copilot-sdk/blob/main/docs/tutorials/first-app.md
- **GitHub MCP 伺服器**：https://github.com/github/github-mcp-server
- **MCP 伺服器目錄**：https://github.com/modelcontextprotocol/servers
- **食譜 (Cookbook)**：https://github.com/github/copilot-sdk/tree/main/cookbook
- **範例**：https://github.com/github/copilot-sdk/tree/main/samples

## 狀態

此 SDK 目前處於 **技術預覽** 階段，可能會發生重大變更。尚不建議用於生產用途。
