---
applyTo: "**.py, pyproject.toml, setup.py"
description: '本檔案提供使用 GitHub Copilot SDK 建立 Python 應用程式的指引。'
name: 'GitHub Copilot SDK Python 指引'
---

## 核心原則

- SDK 正處於技術預覽階段，可能會發生重大變更
- 需要 Python 3.9 或更高版本
- 需要已安裝 GitHub Copilot CLI 並將其加入 PATH
- 全程使用非同步/等待模式 (asyncio)
- 支援非同步內容管理員和手動生命週期管理
- 提供型別提示以獲得更好的 IDE 支援

## 安裝

請務必透過 pip 安裝：

```bash
pip install github-copilot-sdk
# 或使用 poetry
poetry add github-copilot-sdk
# 或使用 uv
uv add github-copilot-sdk
```

## 用戶端初始化

### 基本用戶端設定

```python
from copilot import CopilotClient, PermissionHandler
import asyncio

async def main():
    async with CopilotClient() as client:
        # 使用用戶端...
        pass

asyncio.run(main())
```

### 用戶端設定選項

建立 CopilotClient 時，請使用具有以下鍵值的 dict：

- `cli_path` - CLI 執行檔路徑 (預設值：PATH 或 COPILOT_CLI_PATH 環境變數中的 "copilot")
- `cli_url` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。提供此選項時，用戶端不會衍生程序
- `port` - 伺服器連接埠 (預設值：0 表示隨機)
- `use_stdio` - 使用 stdio 傳輸而非 TCP (預設值：True)
- `log_level` - 日誌層級 (預設值："info")
- `auto_start` - 自動啟動伺服器 (預設值：True)
- `auto_restart` - 當機時自動重新啟動 (預設值：True)
- `cwd` - CLI 程序的目前工作目錄 (預設值：os.getcwd())
- `env` - CLI 程序的環境變數 (dict)

### 手動伺服器控制

如需明確控制：

```python
from copilot import CopilotClient
import asyncio

async def main():
    client = CopilotClient({"auto_start": False})
    await client.start()
    # 使用用戶端...
    await client.stop()

asyncio.run(main())
```

當 `stop()` 耗時過長時，請使用 `force_stop()`。

## 會話管理

### 建立會話

使用 dict 作為 SessionConfig：

```python
session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "model": "gpt-5",
    "streaming": True,
    "tools": [...],
    "system_message": { ... },
    "available_tools": ["tool1", "tool2"],
    "excluded_tools": ["tool3"],
    "provider": { ... }
})
```

### 會話設定選項

- `session_id` - 自訂會話 ID (str)
- `model` - 模型名稱 ("gpt-5"、"claude-sonnet-4.5" 等)
- `tools` - 向 CLI 公開的自訂工具 (list[Tool])
- `system_message` - 系統訊息自訂 (dict)
- `available_tools` - 工具名稱白名單 (list[str])
- `excluded_tools` - 工具名稱黑名單 (list[str])
- `provider` - 自訂 API 提供者設定 (BYOK) (ProviderConfig)
- `streaming` - 啟用串流回應區塊 (bool)
- `mcp_servers` - MCP 伺服器設定 (list)
- `custom_agents` - 自訂代理人設定 (list)
- `config_dir` - 設定目錄覆蓋 (str)
- `skill_directories` - 技能目錄 (list[str])
- `disabled_skills` - 已停用的技能 (list[str])
- `on_permission_request` - 權限請求處理器 (callable)

### 恢復會話

```python
session = await client.resume_session("session-id", {
    "on_permission_request": PermissionHandler.approve_all,
    "tools": [my_new_tool]
})
```

### 會話操作

- `session.session_id` - 取得會話識別碼 (str)
- `await session.send({"prompt": "...", "attachments": [...]})` - 傳送訊息，回傳 str (訊息 ID)
- `await session.send_and_wait({"prompt": "..."}, timeout=60.0)` - 傳送並等待閒置，回傳 SessionEvent | None
- `await session.abort()` - 中止目前的處理
- `await session.get_messages()` - 取得所有事件/訊息，回傳 list[SessionEvent]
- `await session.destroy()` - 清理會話

## 事件處理

### 事件訂閱模式

請務必使用 asyncio 事件或 future 來等待會話事件：

```python
import asyncio

done = asyncio.Event()

def handler(event):
    if event.type == "assistant.message":
        print(event.data.content)
    elif event.type == "session.idle":
        done.set()

session.on(handler)
await session.send({"prompt": "..."})
await done.wait()
```

### 取消訂閱事件

`on()` 方法會回傳一個用於取消訂閱的函式：

```python
unsubscribe = session.on(lambda event: print(event.type))
# 稍後...
unsubscribe()
```

### 事件類型

使用屬性存取來進行事件類型檢查：

```python
def handler(event):
    if event.type == "user.message":
        # 處理使用者訊息
        pass
    elif event.type == "assistant.message":
        print(event.data.content)
    elif event.type == "tool.executionStart":
        # 工具執行已開始
        pass
    elif event.type == "tool.executionComplete":
        # 工具執行已完成
        pass
    elif event.type == "session.start":
        # 會話已開始
        pass
    elif event.type == "session.idle":
        # 會話閒置中 (處理完成)
        pass
    elif event.type == "session.error":
        print(f"Error: {event.data.message}")

session.on(handler)
```

## 串流回應

### 啟用串流

在 SessionConfig 中設定 `streaming: True`：

```python
session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "model": "gpt-5",
    "streaming": True
})
```

### 處理串流事件

處理 delta 事件 (增量) 和最終事件：

```python
import asyncio

done = asyncio.Event()

def handler(event):
    if event.type == "assistant.message.delta":
        # 增量文字區塊
        print(event.data.delta_content, end="", flush=True)
    elif event.type == "assistant.reasoning.delta":
        # 增量推理區塊 (視模型而定)
        print(event.data.delta_content, end="", flush=True)
    elif event.type == "assistant.message":
        # 最終完整訊息
        print("\n--- Final ---")
        print(event.data.content)
    elif event.type == "assistant.reasoning":
        # 最終推理內容
        print("--- Reasoning ---")
        print(event.data.content)
    elif event.type == "session.idle":
        done.set()

session.on(handler)
await session.send({"prompt": "Tell me a story"})
await done.wait()
```

注意：無論串流設定如何，都會傳送最終事件 (`assistant.message`、`assistant.reasoning`)。

## 自訂工具

### 使用 define_tool 定義工具

使用 `define_tool` 進行工具定義：

```python
from copilot import define_tool

async def fetch_issue(issue_id: str):
    # 從追蹤器擷取問題
    return {"id": issue_id, "status": "open"}

session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "model": "gpt-5",
    "tools": [
        define_tool(
            name="lookup_issue",
            description="Fetch issue details from tracker",
            parameters={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Issue ID"}
                },
                "required": ["id"]
            },
            handler=lambda args, inv: fetch_issue(args["id"])
        )
    ]
})
```

### 使用 Pydantic 處理參數

SDK 與 Pydantic 模型配合良好：

```python
from pydantic import BaseModel, Field

class WeatherArgs(BaseModel):
    location: str = Field(description="City name")
    units: str = Field(default="fahrenheit", description="Temperature units")

async def get_weather(args: WeatherArgs, inv):
    return {"temperature": 72, "units": args.units}

session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "tools": [
        define_tool(
            name="get_weather",
            description="Get weather for a location",
            parameters=WeatherArgs.model_json_schema(),
            handler=lambda args, inv: get_weather(WeatherArgs(**args), inv)
        )
    ]
})
```

### 工具回傳類型

- 回傳任何可 JSON 序列化的值 (自動封裝)
- 或回傳 ToolResult dict 以進行完整控制：

```python
{
    "text_result_for_llm": str,  # 顯示給 LLM 的結果
    "result_type": "success" | "failure",
    "error": str,  # 選用：內部錯誤 (不顯示給 LLM)
    "tool_telemetry": dict  # 選用：遙測資料
}
```

### 工具處理器簽署

工具處理器接收兩個引數：

- `args` (dict) - LLM 傳遞的工具引數
- `invocation` (ToolInvocation) - 關於呼叫的 Metadata
  - `invocation.session_id` - 會話 ID
  - `invocation.tool_call_id` - 工具呼叫 ID
  - `invocation.tool_name` - 工具名稱
  - `invocation.arguments` - 與 args 參數相同

### 工具執行流程

當 Copilot 呼叫工具時，用戶端會自動：

1. 執行您的處理器函式
2. 序列化回傳值
3. 回應 CLI

## 系統訊息自訂

### 附加模式 (預設 - 保留安全護欄)

```python
session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "model": "gpt-5",
    "system_message": {
        "mode": "append",
        "content": """
<workflow_rules>
- Always check for security vulnerabilities
- Suggest performance improvements when applicable
</workflow_rules>
"""
    }
})
```

### 取代模式 (完整控制 - 移除安全護欄)

```python
session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "model": "gpt-5",
    "system_message": {
        "mode": "replace",
        "content": "You are a helpful assistant."
    }
})
```

## 檔案附件

將檔案附加到訊息：

```python
await session.send({
    "prompt": "Analyze this file",
    "attachments": [
        {
            "type": "file",
            "path": "/path/to/file.py",
            "display_name": "My File"
        }
    ]
})
```

## 訊息傳遞模式

在訊息選項中使用 `mode` 鍵：

- `"enqueue"` - 將訊息放入佇列以供處理
- `"immediate"` - 立即處理訊息

```python
await session.send({
    "prompt": "...",
    "mode": "enqueue"
})
```

## 多個會話

會話彼此獨立，且可以並行執行：

```python
session1 = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "model": "gpt-5",
})
session2 = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "model": "claude-sonnet-4.5",
})

await asyncio.gather(
    session1.send({"prompt": "Hello from session 1"}),
    session2.send({"prompt": "Hello from session 2"})
)
```

## 自備金鑰 (BYOK)

透過 `provider` 使用自訂 API 提供者：

```python
session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "provider": {
        "type": "openai",
        "base_url": "https://api.openai.com/v1",
        "api_key": "your-api-key"
    }
})
```

## 會話生命週期管理

### 列出會話

```python
sessions = await client.list_sessions()
for metadata in sessions:
    print(f"{metadata.session_id}: {metadata.summary}")
```

### 刪除會話

```python
await client.delete_session(session_id)
```

### 取得最後一個會話 ID

```python
last_id = await client.get_last_session_id()
if last_id:
    session = await client.resume_session(last_id, on_permission_request=PermissionHandler.approve_all)
```

### 檢查連線狀態

```python
state = client.get_state()
# 回傳："disconnected" | "connecting" | "connected" | "error"
```

## 錯誤處理

### 標準例外處理

```python
try:
    session = await client.create_session(on_permission_request=PermissionHandler.approve_all)
    await session.send({"prompt": "Hello"})
except Exception as e:
    print(f"Error: {e}")
```

### 會話錯誤事件

監控 `session.error` 事件類型以處理執行階段錯誤：

```python
def handler(event):
    if event.type == "session.error":
        print(f"Session Error: {event.data.message}")

session.on(handler)
```

## 連線測試

使用 ping 驗證伺服器連線性：

```python
response = await client.ping("health check")
print(f"Server responded at {response['timestamp']}")
```

## 資源清理

### 使用內容管理員自動清理

請務必使用非同步內容管理員進行自動清理：

```python
async with CopilotClient() as client:
    async with await client.create_session(on_permission_request=PermissionHandler.approve_all) as session:
        # 使用會話...
        await session.send({"prompt": "Hello"})
    # 會話會自動銷毀
# 用戶端會自動停止
```

### 使用 Try-Finally 手動清理

```python
client = CopilotClient()
try:
    await client.start()
    session = await client.create_session(on_permission_request=PermissionHandler.approve_all)
    try:
        # 使用會話...
        pass
    finally:
        await session.destroy()
finally:
    await client.stop()
```

## 最佳實踐

1. **務必使用非同步內容管理員** (`async with`) 進行自動清理
2. **使用 asyncio.Event 或 asyncio.Future** 來等待 session.idle 事件
3. **處理 session.error** 事件以獲得強健的錯誤處理
4. **使用 if/elif 鏈** 進行事件類型檢查
5. **啟用串流** 以在互動式案例中獲得更好的使用者體驗
6. **使用 define_tool** 定義工具
7. **使用 Pydantic 模型** 進行類型安全的參數驗證
8. **處置事件訂閱**，當不再需要時
9. **搭配使用 system_message 與 mode: "append"** 以保留安全護欄
10. **處理 delta 和最終事件**，當啟用串流時
11. **使用型別提示** 以獲得更好的 IDE 支援和程式碼清晰度

## 常見模式

### 簡單查詢-回應

```python
from copilot import CopilotClient, PermissionHandler
import asyncio

async def main():
    async with CopilotClient() as client:
        async with await client.create_session({
            "on_permission_request": PermissionHandler.approve_all,
            "model": "gpt-5",
        }) as session:
            done = asyncio.Event()

            def handler(event):
                if event.type == "assistant.message":
                    print(event.data.content)
                elif event.type == "session.idle":
                    done.set()

            session.on(handler)
            await session.send({"prompt": "What is 2+2?"})
            await done.wait()

asyncio.run(main())
```

### 多輪對話

```python
async def send_and_wait(session, prompt: str):
    done = asyncio.Event()
    result = []

    def handler(event):
        if event.type == "assistant.message":
            result.append(event.data.content)
            print(event.data.content)
        elif event.type == "session.idle":
            done.set()
        elif event.type == "session.error":
            result.append(None)
            done.set()

    unsubscribe = session.on(handler)
    await session.send({"prompt": prompt})
    await done.wait()
    unsubscribe()

    return result[0] if result else None

async with await client.create_session(on_permission_request=PermissionHandler.approve_all) as session:
    await send_and_wait(session, "What is the capital of France?")
    await send_and_wait(session, "What is its population?")
```

### SendAndWait 輔助函式

```python
# 使用內建的 send_and_wait 進行較簡單的同步互動
async with await client.create_session(on_permission_request=PermissionHandler.approve_all) as session:
    response = await session.send_and_wait(
        {"prompt": "What is 2+2?"},
        timeout=60.0
    )

    if response and response.type == "assistant.message":
        print(response.data.content)
```

### 具有 Dataclass 回傳類型的工具

```python
from dataclasses import dataclass, asdict
from copilot import define_tool

@dataclass
class UserInfo:
    id: str
    name: str
    email: str
    role: str

async def get_user(args, inv) -> dict:
    user = UserInfo(
        id=args["user_id"],
        name="John Doe",
        email="john@example.com",
        role="Developer"
    )
    return asdict(user)

session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "tools": [
        define_tool(
            name="get_user",
            description="Retrieve user information",
            parameters={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"}
                },
                "required": ["user_id"]
            },
            handler=get_user
        )
    ]
})
```

### 具備進度的串流

```python
import asyncio

current_message = []
done = asyncio.Event()

def handler(event):
    if event.type == "assistant.message.delta":
        current_message.append(event.data.delta_content)
        print(event.data.delta_content, end="", flush=True)
    elif event.type == "assistant.message":
        print(f"\n\n=== Complete ===")
        print(f"Total length: {len(event.data.content)} chars")
    elif event.type == "session.idle":
        done.set()

unsubscribe = session.on(handler)
await session.send({"prompt": "Write a long story"})
await done.wait()
unsubscribe()
```

### 錯誤復原

```python
def handler(event):
    if event.type == "session.error":
        print(f"Session error: {event.data.message}")
        # 選用：重試或處理錯誤

session.on(handler)

try:
    await session.send({"prompt": "risky operation"})
except Exception as e:
    # 處理傳送錯誤
    print(f"Failed to send: {e}")
```

### 使用 TypedDict 確保類型安全

```python
from typing import TypedDict, List

class MessageOptions(TypedDict, total=False):
    prompt: str
    attachments: List[dict]
    mode: str

class SessionConfig(TypedDict, total=False):
    model: str
    streaming: bool
    tools: List

# 使用型別提示
options: MessageOptions = {
    "prompt": "Hello",
    "mode": "enqueue"
}
await session.send(options)

config: SessionConfig = {
    "on_permission_request": PermissionHandler.approve_all,
    "model": "gpt-5",
    "streaming": True
}
session = await client.create_session(config)
```

### 用於串流的非同步產生器

```python
from typing import AsyncGenerator

async def stream_response(session, prompt: str) -> AsyncGenerator[str, None]:
    """將回應區塊作為非同步產生器進行串流。"""
    queue = asyncio.Queue()
    done = asyncio.Event()

    def handler(event):
        if event.type == "assistant.message.delta":
            queue.put_nowait(event.data.delta_content)
        elif event.type == "session.idle":
            done.set()

    unsubscribe = session.on(handler)
    await session.send({"prompt": prompt})

    while not done.is_set():
        try:
            chunk = await asyncio.wait_for(queue.get(), timeout=0.1)
            yield chunk
        except asyncio.TimeoutError:
            continue

    # 耗盡剩餘項目
    while not queue.empty():
        yield queue.get_nowait()

    unsubscribe()

# 使用方式
async for chunk in stream_response(session, "Tell me a story"):
    print(chunk, end="", flush=True)
```

### 工具的裝飾器模式

```python
from typing import Callable, Any
from copilot import define_tool

def copilot_tool(
    name: str,
    description: str,
    parameters: dict
) -> Callable:
    """將函式轉換為 Copilot 工具的裝飾器。"""
    def decorator(func: Callable) -> Any:
        return define_tool(
            name=name,
            description=description,
            parameters=parameters,
            handler=lambda args, inv: func(**args)
        )
    return decorator

@copilot_tool(
    name="calculate",
    description="Perform a calculation",
    parameters={
        "type": "object",
        "properties": {
            "expression": {"type": "string", "description": "Math expression"}
        },
        "required": ["expression"]
    }
)
def calculate(expression: str) -> float:
    return eval(expression)

session = await client.create_session({
    "on_permission_request": PermissionHandler.approve_all,
    "tools": [calculate]})
```

## Python 特定功能

### 非同步內容管理員協定

SDK 實作了 `__aenter__` 和 `__aexit__`：

```python
class CopilotClient:
    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()
        return False

class CopilotSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.destroy()
        return False
```

### Dataclass 支援

事件資料可作為屬性使用：

```python
def handler(event):
    # 直接存取事件屬性
    print(event.type)
    print(event.data.content)  # 用於 assistant.message
    print(event.data.delta_content)  # 用於 assistant.message.delta
```
