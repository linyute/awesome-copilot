---
name: copilot-sdk
description: '使用 GitHub Copilot SDK 建構代理型應用程式。在應用程式中嵌入 AI 代理人、建立自訂工具、實作串流回應、管理工作階段、連線至 MCP 伺服器或建立自訂代理人時使用。可由 Copilot SDK、GitHub SDK、agentic app、embed Copilot、programmable agent、MCP server、custom agent 等關鍵字觸發。'
---

# GitHub Copilot SDK

使用 Python、TypeScript、Go 或 .NET 將 Copilot 的代理型工作流程嵌入至任何應用程式中。

## 概觀

GitHub Copilot SDK 公開了 Copilot CLI 背後的相同引擎：一個經過正式環境考驗的代理人執行階段，可透過程式設計方式呼叫。無需建構自己的協調機制 — 由你定義代理人行為，Copilot 負責規劃、工具呼叫、檔案編輯等作業。

## 先決條件

1. **GitHub Copilot 存取權限** 與通過驗證的環境
2. **語言執行階段**：Node.js ^20.19.0 或 >=22.12.0、Python 3.11+、Go 1.24+，或相容於 .NET Standard 2.0 的實作
3. **Go**：已安裝並驗證 GitHub Copilot CLI（[安裝指南](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)）

TypeScript、Python 與 .NET 套件預設使用隨附的 Copilot 執行階段，因此不需要個別安裝 CLI。

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

# 選用：預先下載隨附的執行階段，而非在首次使用時下載
python -m copilot download-runtime
```

已發布的 Python wheel 包含固定的執行階段版本。預先下載命令會在本地快取該執行階段；若略過，SDK 會在首次使用時嘗試自動下載。

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
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-4.1",
});

const response = await session.sendAndWait({ prompt: "What is 2 + 2?" });
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

執行：`npx tsx index.ts`

### Python
```python
import asyncio
from copilot import CopilotClient, PermissionHandler

async def main():
    async with CopilotClient() as client:
        async with await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model="gpt-4.1",
        ) as session:
            response = await session.send_and_wait("What is 2 + 2?")
            print(response.data.content)

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

    session, err := client.CreateSession(&copilot.SessionConfig{
        OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
        Model:               "gpt-4.1",
    })
    if err != nil {
        log.Fatal(err)
    }

    response, err := session.SendAndWait(copilot.MessageOptions{Prompt: "What is 2 + 2?"}, 0)
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
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-4.1",
});

var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = "What is 2 + 2?" });
Console.WriteLine(response?.Data.Content);
```

執行：`dotnet run`

## 串流回應

啟用即時輸出以提供更佳的使用者體驗：

### TypeScript
```typescript
import { CopilotClient, approveAll, SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-4.1",
    streaming: true,
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
    if (event.type === "session.idle") {
        console.log(); // 完成時換行
    }
});

await session.sendAndWait({ prompt: "Tell me a short joke" });

await client.stop();
process.exit(0);
```

### Python
```python
import asyncio
import sys
from copilot import CopilotClient, PermissionHandler
from copilot.generated.session_events import SessionEventType

async def main():
    async with CopilotClient() as client:
        async with await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model="gpt-4.1",
            streaming=True,
        ) as session:
            def handle_event(event):
                if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                    sys.stdout.write(event.data.delta_content)
                    sys.stdout.flush()
                if event.type == SessionEventType.SESSION_IDLE:
                    print()

            session.on(handle_event)
            await session.send_and_wait("Tell me a short joke")

asyncio.run(main())
```

### Go
```go
session, err := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
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

_, err = session.SendAndWait(copilot.MessageOptions{Prompt: "Tell me a short joke"}, 0)
```

### .NET
```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
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

await session.SendAndWaitAsync(new MessageOptions { Prompt = "Tell me a short joke" });
```

## 自訂工具

定義 Copilot 在推理過程中可呼叫的工具。當你定義工具時，需要告訴 Copilot：
1. **工具的功能**（描述）
2. **需要哪些參數**（結構描述）
3. **要執行什麼程式碼**（處理常式）

### TypeScript (JSON 結構描述)
```typescript
import { CopilotClient, approveAll, defineTool, SessionEvent } from "@github/copilot-sdk";

const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "The city name" },
        },
        required: ["city"],
    },
    handler: async (args: { city: string }) => {
        const { city } = args;
        // 在真實應用程式中，在此呼叫天氣 API
        const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    onPermissionRequest: approveAll,
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
    prompt: "What's the weather like in Seattle and Tokyo?",
});

await client.stop();
process.exit(0);
```

### Python (Pydantic)
```python
import asyncio
import random
import sys
from copilot import CopilotClient, PermissionHandler
from copilot.tools import define_tool
from copilot.generated.session_events import SessionEventType
from pydantic import BaseModel, Field

class GetWeatherParams(BaseModel):
    city: str = Field(description="The name of the city to get weather for")

@define_tool(description="Get the current weather for a city")
async def get_weather(params: GetWeatherParams) -> dict:
    city = params.city
    conditions = ["sunny", "cloudy", "rainy", "partly cloudy"]
    temp = random.randint(50, 80)
    condition = random.choice(conditions)
    return {"city": city, "temperature": f"{temp}°F", "condition": condition}

async def main():
    async with CopilotClient() as client:
        async with await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model="gpt-4.1",
            streaming=True,
            tools=[get_weather],
        ) as session:
            def handle_event(event):
                if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                    sys.stdout.write(event.data.delta_content)
                    sys.stdout.flush()

            session.on(handle_event)
            await session.send_and_wait(
                "What's the weather like in Seattle and Tokyo?"
            )

asyncio.run(main())
```

### Go
```go
type WeatherParams struct {
    City string `json:"city" jsonschema:"The city name"`
}

type WeatherResult struct {
    City        string `json:"city"`
    Temperature string `json:"temperature"`
    Condition   string `json:"condition"`
}

getWeather := copilot.DefineTool(
    "get_weather",
    "Get the current weather for a city",
    func(params WeatherParams, inv copilot.ToolInvocation) (WeatherResult, error) {
        conditions := []string{"sunny", "cloudy", "rainy", "partly cloudy"}
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
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
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
    ([Description("The city name")] string city) =>
    {
        var conditions = new[] { "sunny", "cloudy", "rainy", "partly cloudy" };
        var temp = Random.Shared.Next(50, 80);
        var condition = conditions[Random.Shared.Next(conditions.Length)];
        return new { city, temperature = $"{temp}°F", condition };
    },
    "get_weather",
    "Get the current weather for a city"
);

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-4.1",
    Streaming = true,
    Tools = [getWeather],
});
```

## 工具運作方式

當 Copilot 決定呼叫你的工具時：
1. Copilot 傳送包含參數的工具呼叫請求
2. SDK 執行你的處理常式函式
3. 結果傳回給 Copilot
4. Copilot 將結果納入其回應中

Copilot 會根據使用者的問題與你的工具描述，決定何時呼叫該工具。

## 互動式 CLI 助理

建構完整的互動式助理：

### TypeScript
```typescript
import { CopilotClient, approveAll, defineTool, SessionEvent } from "@github/copilot-sdk";
import * as readline from "readline";

const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "The city name" },
        },
        required: ["city"],
    },
    handler: async ({ city }) => {
        const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    onPermissionRequest: approveAll,
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

console.log("Weather Assistant (type 'exit' to quit)");
console.log("Try: 'What's the weather in Paris?'\n");

const prompt = () => {
    rl.question("You: ", async (input) => {
        if (input.toLowerCase() === "exit") {
            await client.stop();
            rl.close();
            return;
        }

        process.stdout.write("Assistant: ");
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
from copilot import CopilotClient, PermissionHandler
from copilot.tools import define_tool
from copilot.generated.session_events import SessionEventType
from pydantic import BaseModel, Field

class GetWeatherParams(BaseModel):
    city: str = Field(description="The name of the city to get weather for")

@define_tool(description="Get the current weather for a city")
async def get_weather(params: GetWeatherParams) -> dict:
    conditions = ["sunny", "cloudy", "rainy", "partly cloudy"]
    temp = random.randint(50, 80)
    condition = random.choice(conditions)
    return {"city": params.city, "temperature": f"{temp}°F", "condition": condition}

async def main():
    async with CopilotClient() as client:
        async with await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model="gpt-4.1",
            streaming=True,
            tools=[get_weather],
        ) as session:
            def handle_event(event):
                if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                    sys.stdout.write(event.data.delta_content)
                    sys.stdout.flush()

            session.on(handle_event)

            print("Weather Assistant (type 'exit' to quit)")
            print("Try: 'What's the weather in Paris?'\n")

            while True:
                try:
                    user_input = input("You: ")
                except EOFError:
                    break

                if user_input.lower() == "exit":
                    break

                sys.stdout.write("Assistant: ")
                await session.send_and_wait(user_input)
                print("\n")

asyncio.run(main())
```

## MCP 伺服器整合

連線至 MCP (Model Context Protocol) 伺服器以取得預先建置的工具。連線至 GitHub 的 MCP 伺服器以存取儲存庫、Issue 與 PR：

### TypeScript
```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
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
async with await client.create_session(
    on_permission_request=PermissionHandler.approve_all,
    model="gpt-4.1",
    mcp_servers={
        "github": {
            "type": "http",
            "url": "https://api.githubcopilot.com/mcp/",
        },
    },
) as session:
    ...
```

### Go
```go
session, _ := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
    Model: "gpt-4.1",
    MCPServers: map[string]copilot.MCPServerConfig{
        "github": {
            "type": "http",
            "url": "https://api.githubcopilot.com/mcp/",
        },
    },
})
```

### .NET
```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
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

## 自訂代理人

針對特定任務定義特化的 AI 角色：

### TypeScript
```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-4.1",
    customAgents: [{
        name: "pr-reviewer",
        displayName: "PR Reviewer",
        description: "Reviews pull requests for best practices",
        prompt: "You are an expert code reviewer. Focus on security, performance, and maintainability.",
    }],
});
```

### Python
```python
async with await client.create_session(
    on_permission_request=PermissionHandler.approve_all,
    model="gpt-4.1",
    custom_agents=[{
        "name": "pr-reviewer",
        "display_name": "PR Reviewer",
        "description": "Reviews pull requests for best practices",
        "prompt": "You are an expert code reviewer. Focus on security, performance, and maintainability.",
    }],
) as session:
    ...
```

## 系統訊息

自訂 AI 的行為與個性：

### TypeScript
```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-4.1",
    systemMessage: {
        content: "You are a helpful assistant for our engineering team. Always be concise.",
    },
});
```

### Python
```python
async with await client.create_session(
    on_permission_request=PermissionHandler.approve_all,
    model="gpt-4.1",
    system_message={
        "content": "You are a helpful assistant for our engineering team. Always be concise.",
    },
) as session:
    ...
```

## 外部 CLI 伺服器

獨立以伺服器模式執行 CLI，並將 SDK 連線至該伺服器。這對於除錯、資源共用或自訂環境特別有用。

### 以伺服器模式啟動 CLI
```bash
copilot --server --port 4321
```

### 將 SDK 連線至外部伺服器

#### TypeScript
```typescript
const client = new CopilotClient({
    cliUrl: "localhost:4321"
});

const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-4.1",
});
```

#### Python
```python
from copilot import CopilotClient, PermissionHandler, RuntimeConnection

async with CopilotClient(
    connection=RuntimeConnection.for_uri("localhost:4321")
) as client:
    async with await client.create_session(
        on_permission_request=PermissionHandler.approve_all,
        model="gpt-4.1",
    ) as session:
        ...
```

#### Go
```go
client := copilot.NewClient(&copilot.ClientOptions{
    CLIUrl: "localhost:4321",
})

if err := client.Start(); err != nil {
    log.Fatal(err)
}

session, _ := client.CreateSession(&copilot.SessionConfig{
	OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
	Model:               "gpt-4.1",
})
```

#### .NET
```csharp
using var client = new CopilotClient(new CopilotClientOptions
{
    CliUrl = "localhost:4321"
});

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Model = "gpt-4.1",
});
```

**注意：** 當設定使用外部伺服器時，SDK 僅管理其連線，而不管理該外部處理程序。

## 事件類型

| 事件 | 描述 |
|-------|-------------|
| `user.message` | 使用者輸入已新增 |
| `assistant.message` | 完整模型回應 |
| `assistant.message_delta` | 串流回應區塊 |
| `assistant.reasoning` | 模型推理（取決於模型） |
| `assistant.reasoning_delta` | 串流推理區塊 |
| `tool.execution_start` | 工具呼叫已開始 |
| `tool.execution_complete` | 工具執行完成 |
| `session.idle` | 無進行中的處理 |
| `session.error` | 發生錯誤 |

## 用戶端設定

| 選項 | 描述 | 預設值 |
|--------|-------------|---------|
| `cliPath` | Copilot CLI 可執行檔路徑 | 系統 PATH |
| `cliUrl` | 連線至現有伺服器（例如 "localhost:4321"） | 無 |
| `port` | 伺服器通訊連接埠 | 隨機 |
| `useStdio` | 使用 stdio 傳輸而非 TCP | true |
| `logLevel` | 記錄詳細程度 | "info" |
| `autoStart` | 自動啟動伺服器 | true |
| `autoRestart` | 當機時重新啟動 | true |
| `cwd` | CLI 處理程序的工作目錄 | 繼承 |

## 工作階段設定

| 選項 | 描述 |
|--------|-------------|
| `model` | 要使用的 LLM（"gpt-4.1"、"claude-sonnet-4.5" 等） |
| `sessionId` | 自訂工作階段識別碼 |
| `tools` | 自訂工具定義 |
| `mcpServers` | MCP 伺服器連線 |
| `customAgents` | 自訂代理人角色 |
| `systemMessage` | 覆寫預設系統提示詞 |
| `streaming` | 啟用增量回應區塊 |
| `availableTools` | 允許使用的工具白名單 |
| `excludedTools` | 停用的工具黑名單 |

## 工作階段持續性

跨重新啟動儲存並繼續對話：

### 使用自訂 ID 建立
```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    sessionId: "user-123-conversation",
    model: "gpt-4.1"
});
```

### 繼續工作階段
```typescript
const session = await client.resumeSession("user-123-conversation", { onPermissionRequest: approveAll });
await session.send({ prompt: "What did we discuss earlier?" });
```

### 列出與刪除工作階段
```typescript
const sessions = await client.listSessions();
await client.deleteSession("old-session-id");
```

## 錯誤處理

```typescript
try {
    const client = new CopilotClient();
    const session = await client.createSession({
        onPermissionRequest: approveAll,
        model: "gpt-4.1",
    });
    const response = await session.sendAndWait(
        { prompt: "Hello!" },
        30000 // 逾時毫秒數
    );
} catch (error) {
    if (error.code === "ENOENT") {
        console.error("Copilot CLI not installed");
    } else if (error.code === "ECONNREFUSED") {
        console.error("Cannot connect to Copilot server");
    } else {
        console.error("Error:", error.message);
    }
} finally {
    await client.stop();
}
```

## 平順關閉

```typescript
process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await client.stop();
    process.exit(0);
});
```

## 常見模式

### 多輪對話
```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-4.1",
});

await session.sendAndWait({ prompt: "My name is Alice" });
await session.sendAndWait({ prompt: "What's my name?" });
// 回應："Your name is Alice"
```

### 檔案附件
```typescript
await session.send({
    prompt: "Analyze this file",
    attachments: [{
        type: "file",
        path: "./data.csv",
        displayName: "Sales Data"
    }]
});
```

### 中止長時間執行的操作
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

1. **一律進行清理**：使用語言原生的上下文管理員或處置機制，或明確中斷工作階段連線並停止用戶端
2. **設定逾時**：針對長時間執行的操作，使用帶有逾時設定的 `sendAndWait`
3. **處理事件**：訂閱錯誤事件以取得穩健的錯誤處理機制
4. **使用串流**：針對長回應啟用串流以提供更佳的使用者體驗
5. **保存工作階段**：在多輪對話中使用自訂工作階段 ID
6. **定義清楚的工具**：撰寫具描述性的工具名稱與描述

## 架構

```
你的應用程式
       |
   SDK 用戶端
       | JSON-RPC
   Copilot CLI（伺服器模式）
       |
   GitHub（模型、身分驗證）
```

SDK 會自動管理 CLI 處理程序的生命週期。所有通訊皆透過 stdio 或 TCP 上的 JSON-RPC 進行。

## 資源

- **GitHub 儲存庫**：https://github.com/github/copilot-sdk
- **入門教學**：https://github.com/github/copilot-sdk/blob/main/docs/tutorials/first-app.md
- **GitHub MCP 伺服器**：https://github.com/github/github-mcp-server
- **MCP 伺服器目錄**：https://github.com/modelcontextprotocol/servers
- **Cookbook**：https://github.com/github/copilot-sdk/tree/main/cookbook
- **範例**：https://github.com/github/copilot-sdk/tree/main/samples

## 狀態

本 SDK 目前處於**技術預覽 (Technical Preview)** 階段，可能會發生重大變更 (breaking changes)。目前不建議用於正式生產環境。
