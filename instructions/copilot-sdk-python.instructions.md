---
applyTo: "**.py, pyproject.toml, setup.py"
description: '本檔案提供使用 GitHub Copilot SDK 建構 Python 應用程式的指引。'
name: 'GitHub Copilot SDK Python 指引'
---

## 核心原則

- SDK 處於技術預覽階段，可能會發生重大變更
- 需要 Python 3.9 或更高版本
- 需要安裝 GitHub Copilot CLI 並加入 PATH
- 全程使用 async/await 模式 (asyncio)
- 支援非同步上下文管理器 (async context managers) 和手動生命週期管理
- 提供型別提示 (Type hints) 以獲得更好的 IDE 支援

## 安裝

請務必透過 pip 安裝：

```bash
pip install github-copilot-sdk
# 或使用 poetry
poetry add github-copilot-sdk
# 或使用 uv
uv add github-copilot-sdk
```

## 客戶端初始化 (Client Initialization)

### 基本客戶端設定

```python
from copilot import CopilotClient
import asyncio

async def main():
    async with CopilotClient() as client:
        # 使用客戶端...
        pass

asyncio.run(main())
```

### 客戶端設定選項 (Client Configuration Options)

建立 CopilotClient 時，請使用包含以下鍵 (key) 的字典 (dict)：

- `cli_path` - CLI 執行檔路徑 (預設值：從 PATH 或 COPILOT_CLI_PATH 環境變數中獲取 "copilot")
- `cli_url` - 現有 CLI 伺服器的 URL (例如 "localhost:8080")。提供此選項時，客戶端不會啟動新處理程序 (process)
- `port` - 伺服器連接埠 (預設值：0 表示隨機)
- `use_stdio` - 使用 stdio 傳輸而非 TCP (預設值：True)
- `log_level` - 記錄層級 (預設值："info")
- `auto_start` - 自動啟動伺服器 (預設值：True)
- `auto_restart` - 當機時自動重新啟動 (預設值：True)
- `cwd` - CLI 處理程序的工作目錄 (預設值：os.getcwd())
- `env` - CLI 處理程序的環境變數 (dict)

### 手動伺服器控制

如需明確控制：

```python
from copilot import CopilotClient
import asyncio

async def main():
    client = CopilotClient({"auto_start": False})
    await client.start()
    # Use client...
    await client.stop()

asyncio.run(main())
```

當 `stop()` 耗時過長時，請使用 `force_stop()`。

## 對話階段管理 (Session Management)

### 建立對話階段 (Creating Sessions)

為 SessionConfig 使用字典 (dict)：

```python
session = await client.create_session({
    "model": "gpt-5",
    "streaming": True,
    "tools": [...],
    "system_message": { ... },
    "available_tools": ["tool1", "tool2"],
    "excluded_tools": ["tool3"],
    "provider": { ... }
})
```

### 對話階段設定選項 (Session Config Options)

- `session_id` - 自訂對話階段 ID (str)
- `model` - 模型名稱 ("gpt-5", "claude-sonnet-4.5" 等)
- `tools` - 公開給 CLI 的自訂工具 (list[Tool])
- `system_message` - 系統訊息自訂 (dict)
- `available_tools` - 工具名稱白名單 (list[str])
- `excluded_tools` - 工具名稱黑名單 (list[str])
- `provider` - 自訂 API 提供者設定 (BYOK) (ProviderConfig)
- `streaming` - 啟用串流回應區塊 (bool)
- `mcp_servers` - MCP 伺服器設定 (list)
- `custom_agents` - 自訂代理人 (custom agents) 設定 (list)
- `config_dir` - 設定目錄覆蓋 (str)
- `skill_directories` - 技能目錄 (list[str])
- `disabled_skills` - 已停用的技能 (list[str])
- `on_permission_request` - 權限請求處理常式 (callable)

### 恢復對話階段 (Resuming Sessions)

```python
session = await client.resume_session("session-id", {
    "tools": [my_new_tool]
})
```

### 對話階段操作 (Session Operations)

- `session.session_id` - 獲取對話階段識別碼 (str)
- `await session.send({"prompt": "...", "attachments": [...]})` - 傳送訊息，回傳 str (訊息 ID)
- `await session.send_and_wait({"prompt": "..."}, timeout=60.0)` - 傳送並等待閒置，回傳 SessionEvent | None
- `await session.abort()` - 中止目前處理
- `await session.get_messages()` - 獲取所有事件/訊息，回傳 list[SessionEvent]
- `await session.destroy()` - 清理對話階段

## 事件處理 (Event Handling)

### 事件訂閱模式 (Event Subscription Pattern)

請務必使用 asyncio 事件或 futures 來等待對話階段事件：

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

### 取消訂閱事件 (Unsubscribing from Events)

`on()` 方法會回傳一個用於取消訂閱的函式：

```python
unsubscribe = session.on(lambda event: print(event.type))
# 稍後...
unsubscribe()
```

### 事件型別 (Event Types)

使用屬性存取來進行事件型別檢查：

```python
def handler(event):
    if event.type == "user.message":
        # 處理使用者訊息
        pass
    elif event.type == "assistant.message":
        print(event.data.content)
    elif event.type == "tool.executionStart":
        # 工具執行開始
        pass
    elif event.type == "tool.executionComplete":
        # 工具執行完成
        pass
    elif event.type == "session.start":
        # 對話階段開始
        pass
    elif event.type == "session.idle":
        # 對話階段處於閒置狀態 (處理完成)
        pass
    elif event.type == "session.error":
        print(f"錯誤：{event.data.message}")

session.on(handler)
```

## 串流回應 (Streaming Responses)

### 啟用串流

在 SessionConfig 中設定 `streaming: True`：

```python
session = await client.create_session({
    "model": "gpt-5",
    "streaming": True
})
```

### 處理串流事件

同時處理增量 (delta) 事件和最終事件：

```python
import asyncio

done = asyncio.Event()

def handler(event):
    if event.type == "assistant.message.delta":
        # 增量文字區塊
        print(event.data.delta_content, end="", flush=True)
    elif event.type == "assistant.reasoning.delta":
        # 增量推論區塊 (取決於模型)
        print(event.data.delta_content, end="", flush=True)
    elif event.type == "assistant.message":
        # 最終完整訊息
        print("\n--- 最終結果 ---")
        print(event.data.content)
    elif event.type == "assistant.reasoning":
        # 最終推論內容
        print("--- 推論過程 ---")
        print(event.data.content)
    elif event.type == "session.idle":
        done.set()

session.on(handler)
await session.send({"prompt": "講個故事給我聽"})
await done.wait()
```

注意：無論串流設定為何，一律會傳送最終事件 (`assistant.message`, `assistant.reasoning`)。

## 自訂工具 (Custom Tools)

### 使用 define_tool 定義工具

使用 `define_tool` 進行工具定義：

```python
from copilot import define_tool

async def fetch_issue(issue_id: str):
    # 從追蹤器獲取問題 (issue) 詳情
    return {"id": issue_id, "status": "open"}

session = await client.create_session({
    "model": "gpt-5",
    "tools": [
        define_tool(
            name="lookup_issue",
            description="從追蹤器獲取問題 (issue) 詳情",
            parameters={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "問題 (Issue) ID"}
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
    location: str = Field(description="城市名稱")
    units: str = Field(default="fahrenheit", description="溫度單位")

async def get_weather(args: WeatherArgs, inv):
    return {"temperature": 72, "units": args.units}

session = await client.create_session({
    "tools": [
        define_tool(
            name="get_weather",
            description="獲取特定地點的天氣",
            parameters=WeatherArgs.model_json_schema(),
            handler=lambda args, inv: get_weather(WeatherArgs(**args), inv)
        )
    ]
})
```

### 工具回傳型別 (Tool Return Types)

- 回傳任何可 JSON 序列化的值 (會自動包裝)
- 或回傳 ToolResult 字典 (dict) 以進行完整控制：

```python
{
    "text_result_for_llm": str,  # 顯示給 LLM 的結果
    "result_type": "success" | "failure",
    "error": str,  # 選填：內部錯誤 (不顯示給 LLM)
    "tool_telemetry": dict  # 選填：遙測資料 (Telemetry data)
}
```

### 工具處理常式簽章 (Tool Handler Signature)

工具處理常式接收兩個引數：

- `args` (dict) - 由 LLM 傳遞的工具引數
- `invocation` (ToolInvocation) - 關於呼叫的 Metadata
  - `invocation.session_id` - 對話階段 ID
  - `invocation.tool_call_id` - 工具呼叫 ID
  - `invocation.tool_name` - 工具名稱
  - `invocation.arguments` - 與 args 參數相同

### 工具執行流程 (Tool Execution Flow)

當 Copilot 呼叫工具時，客戶端會自動：

1. 執行您的處理常式函式
2. 序列化回傳值
3. 回應給 CLI

## 系統訊息自訂 (System Message Customization)

### 附加模式 (Append Mode) (預設值 - 保留防護欄)

```python
session = await client.create_session({
    "model": "gpt-5",
    "system_message": {
        "mode": "append",
        "content": """
<workflow_rules>
- 務必檢查安全漏洞
- 在適用時提供效能改進建議
</workflow_rules>
"""
    }
})
```

### 取代模式 (Replace Mode) (完整控制 - 移除防護欄)

```python
session = await client.create_session({
    "model": "gpt-5",
    "system_message": {
        "mode": "replace",
        "content": "你是一個很有幫助的助手。"
    }
})
```

## 檔案附件 (File Attachments)

在訊息中附加檔案：

```python
await session.send({
    "prompt": "分析此檔案",
    "attachments": [
        {
            "type": "file",
            "path": "/path/to/file.py",
            "display_name": "我的檔案"
        }
    ]
})
```

## 訊息傳遞模式 (Message Delivery Modes)

在訊息選項中使用 `mode` 鍵：

- `"enqueue"` - 將訊息排入佇列進行處理
- `"immediate"` - 立即處理訊息

```python
await session.send({
    "prompt": "...",
    "mode": "enqueue"
})
```

## 多個對話階段 (Multiple Sessions)

對話階段是獨立的，可以同時執行：

```python
session1 = await client.create_session({"model": "gpt-5"})
session2 = await client.create_session({"model": "claude-sonnet-4.5"})

await asyncio.gather(
    session1.send({"prompt": "來自對話階段 1 的問候"}),
    session2.send({"prompt": "來自對話階段 2 的問候"})
)
```

## 自備金鑰 (Bring Your Own Key, BYOK)

透過 `provider` 使用自訂 API 提供者：

```python
session = await client.create_session({
    "provider": {
        "type": "openai",
        "base_url": "https://api.openai.com/v1",
        "api_key": "您的-api-key"
    }
})
```

## 對話階段生命週期管理 (Session Lifecycle Management)

### 列出對話階段 (Listing Sessions)

```python
sessions = await client.list_sessions()
for metadata in sessions:
    print(f"{metadata.session_id}: {metadata.summary}")
```

### 刪除對話階段 (Deleting Sessions)

```python
await client.delete_session(session_id)
```

### 獲取最後一個對話階段 ID

```python
last_id = await client.get_last_session_id()
if last_id:
    session = await client.resume_session(last_id)
```

### 檢查連線狀態 (Checking Connection State)

```python
state = client.get_state()
# 回傳值："disconnected" | "connecting" | "connected" | "error"
```

## 錯誤處理 (Error Handling)

### 標準例外處理 (Standard Exception Handling)

```python
try:
    session = await client.create_session()
    await session.send({"prompt": "您好"})
except Exception as e:
    print(f"錯誤：{e}")
```

### 對話階段錯誤事件 (Session Error Events)

監控 `session.error` 事件型別以處理執行階段錯誤：

```python
def handler(event):
    if event.type == "session.error":
        print(f"對話階段錯誤：{event.data.message}")

session.on(handler)
```

## 連線測試 (Connectivity Testing)

使用 ping 驗證伺服器連線性：

```python
response = await client.ping("連線健康檢查")
print(f"伺服器回應時間：{response['timestamp']}")
```

## 資源清理 (Resource Cleanup)

### 使用上下文管理器自動清理

請務必使用非同步上下文管理器來自動清理資源：

```python
async with CopilotClient() as client:
    async with await client.create_session() as session:
        # 使用對話階段...
        await session.send({"prompt": "您好"})
    # 對話階段將自動銷毀
# 客戶端將自動停止
```

### 使用 Try-Finally 手動清理

```python
client = CopilotClient()
try:
    await client.start()
    session = await client.create_session()
    try:
        # 使用對話階段...
        pass
    finally:
        await session.destroy()
finally:
    await client.stop()
```

## 最佳做法 (Best Practices)

1. **務必使用非同步上下文管理器** (`async with`) 以自動清理資源
2. **使用 asyncio.Event 或 asyncio.Future** 來等待對話階段閒置 (session.idle) 事件
3. **處理對話階段錯誤 (session.error)** 事件以建立穩健的錯誤處理機制
4. **使用 if/elif 鏈** 來檢查事件型別
5. **啟用串流** 以在互動情境中提供更好的使用者體驗 (UX)
6. **使用 define_tool** 進行工具定義
7. **使用 Pydantic 模型** 進行型別安全的參數驗證
8. **在不再需要時處置事件訂閱**
9. **使用模式為 "append" 的系統訊息 (system_message)** 以保留安全防護欄
10. **啟用串流時，同時處理增量 (delta) 和最終事件**
11. **使用型別提示 (Type hints)** 以獲得更好的 IDE 支援並提升程式碼清晰度

## 常見模式 (Common Patterns)

### 簡單的查詢-回應 (Simple Query-Response)

```python
from copilot import CopilotClient
import asyncio

async def main():
    async with CopilotClient() as client:
        async with await client.create_session({"model": "gpt-5"}) as session:
            done = asyncio.Event()

            def handler(event):
                if event.type == "assistant.message":
                    print(event.data.content)
                elif event.type == "session.idle":
                    done.set()

            session.on(handler)
            await session.send({"prompt": "2+2 等於多少？"})
            await done.wait()

asyncio.run(main())
```

### 多輪對話 (Multi-Turn Conversation)

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

async with await client.create_session() as session:
    await send_and_wait(session, "法國的首都是哪裡？")
    await send_and_wait(session, "它的人口是多少？")
```

### SendAndWait 協助工具

```python
# 使用內建的 send_and_wait 進行更簡單的同步互動
async with await client.create_session() as session:
    response = await session.send_and_wait(
        {"prompt": "2+2 等於多少？"},
        timeout=60.0
    )

    if response and response.type == "assistant.message":
        print(response.data.content)
```

### 具備 Dataclass 回傳型別的工具

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
    "tools": [
        define_tool(
            name="get_user",
            description="獲取使用者資訊",
            parameters={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "使用者 ID"}
                },
                "required": ["user_id"]
            },
            handler=get_user
        )
    ]
})
```

### 具備進度顯示的串流 (Streaming with Progress)

```python
import asyncio

current_message = []
done = asyncio.Event()

def handler(event):
    if event.type == "assistant.message.delta":
        current_message.append(event.data.delta_content)
        print(event.data.delta_content, end="", flush=True)
    elif event.type == "assistant.message":
        print(f"\n\n=== 完成 ===")
        print(f"總長度：{len(event.data.content)} 字元")
    elif event.type == "session.idle":
        done.set()

unsubscribe = session.on(handler)
await session.send({"prompt": "寫一個長篇故事"})
await done.wait()
unsubscribe()
```

### 錯誤復原 (Error Recovery)

```python
def handler(event):
    if event.type == "session.error":
        print(f"對話階段錯誤：{event.data.message}")
        # 可選擇重試或處理錯誤

session.on(handler)

try:
    await session.send({"prompt": "危險的操作"})
except Exception as e:
    # 處理傳送錯誤
    print(f"傳送失敗：{e}")
```

### 使用 TypedDict 提升型別安全

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

# 搭配型別提示使用
options: MessageOptions = {
    "prompt": "您好",
    "mode": "enqueue"
}
await session.send(options)

config: SessionConfig = {
    "model": "gpt-5",
    "streaming": True
}
session = await client.create_session(config)
```

### 用於串流的非同步產生器 (Async Generator for Streaming)

```python
from typing import AsyncGenerator

async def stream_response(session, prompt: str) -> AsyncGenerator[str, None]:
    """將串流回應區塊作為非同步產生器回傳。"""
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

    # 排除剩餘項目
    while not queue.empty():
        yield queue.get_nowait()

    unsubscribe()

# 使用方式
async for chunk in stream_response(session, "講個故事給我聽"):
    print(chunk, end="", flush=True)
```

### 工具的裝飾器模式 (Decorator Pattern for Tools)

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
    description="進行計算",
    parameters={
        "type": "object",
        "properties": {
            "expression": {"type": "string", "description": "數學算式"}
        },
        "required": ["expression"]
    }
)
def calculate(expression: str) -> float:
    return eval(expression)

session = await client.create_session({"tools": [calculate]})
```

## Python 專屬特性 (Python-Specific Features)

### 非同步上下文管理器協定 (Async Context Manager Protocol)

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

事件資料可透過屬性直接存取：

```python
def handler(event):
    # 直接存取事件屬性
    print(event.type)
    print(event.data.content)  # 用於 assistant.message
    print(event.data.delta_content)  # 用於 assistant.message.delta
```
