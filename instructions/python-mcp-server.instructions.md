---
description: '使用 Python SDK v2 建構模型上下文協定 (Model Context Protocol, MCP) 伺服器的指示'
applyTo: '**/*.py, **/pyproject.toml, **/requirements.txt'
---

# Python MCP 伺服器開發

這些指示適用於 [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) v2 與 MCP 規格修訂版 [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)。

## 指示

- 使用 **uv** 進行專案管理：`uv init --app --no-package mcp-server-demo` 與 `uv add "mcp[cli]>=2,<3"`。
- 從 `mcp.server` 匯入伺服器類別：`from mcp.server import MCPServer`。
- 請勿使用 `FastMCP` 或 `mcp.server.fastmcp`。SDK v2 已移除此匯入路徑。
- 從 `mcp.server.mcpserver` 匯入 `Context`、`Image`、`Audio`、`Resolve`、`Elicit` 以及 prompt message 類別。
- 使用 `@mcp.tool()`、`@mcp.resource()` 與 `@mcp.prompt()` 裝飾器進行註冊。
- 為所有參數新增型別提示（type hints）。SDK 會從型別提示建立結構描述（schema）並驗證引數。
- 使用 Pydantic 模型、TypedDict 或 dataclass 處理結構化輸出。
- 當工具的傳回型別相容時，該工具會傳回結構化輸出。
- 對於 stdio 傳輸，使用 `mcp.run()` 或 `mcp.run(transport="stdio")`。
- 對於 HTTP 伺服器，使用 `mcp.run(transport="streamable-http")`，或在 Starlette 或 FastAPI 中掛載 `mcp.streamable_http_app()`。
- 將傳輸選項（`host`、`port`、`json_response`、`stateless_http`、`transport_security`）傳遞給 `run()`，而非傳給 `MCPServer(...)`。
- 掛載伺服器時，將相同的選項傳遞給 `streamable_http_app()`。此方法沒有 `port` 選項。
- 將伺服器名稱作為 `MCPServer` 的第一個引數。將所有其他建構函式引數作為關鍵字引數傳遞。
- 在 `MCPServer` 上設定 `version`。若未設定，伺服器會回報空版本。
- SDK v2 型別使用 snake_case 欄位，例如 `read_only_hint`、`structured_content` 與 `is_error`。
- 為工具、資源或 prompt 新增 `ctx: Context` 參數以取得請求上下文（request context）。
- 使用 `await ctx.report_progress(progress, total, message)` 回報進度。
- 使用 `Resolve(fn)` 參數取得使用者輸入。從 `fn` 傳回 `Elicit(message, Model)`。這適用於所有協定修訂版本的客戶端。
- 請勿使用 `ctx.elicit()`。它在 2026-07-28 連線上會失敗。
- 使用標準 `logging` 模組進行記錄。協定記錄（`ctx.info()` 及類似方法）已被棄用。
- 請勿使用取樣（`ctx.session.create_message()`）。它已被棄用。請直接呼叫 LLM 提供者 API。
- 請勿使用 roots（`ctx.session.list_roots()`）。它已被棄用。請從工具參數或伺服器組態取得路徑。
- 使用來自 `mcp.types` 的 `Icon(src="https://...", mime_type="image/png")` 設定圖示。伺服器、工具、資源與 prompt 皆接受 `icons=[...]`。
- 使用 `Image` 類別傳回圖片：`return Image(data=png_bytes, format="png")` 或 `return Image(path=file_path)`。
- 使用 RFC 6570 URI 範本定義資源範本：`@mcp.resource("greeting://{name}")`。
- 使用 `@mcp.completion()` 裝飾器新增自動補全支援。
- 使用 lifespan context manager 來啟動和關閉共用資源。對於 stdio 和 HTTP，lifespan 會為伺服器執行一次。每個記憶體內（in-memory）`Client(mcp)` 都會再次執行它。
- 在工具中從 `ctx.request_context.lifespan_context` 取得 lifespan 物件。使用 `Context[AppContext]` 取得具型別的結果。
- 對於模型必須讀取的錯誤，擲出 `ToolError`（來自 `mcp.server.mcpserver.exceptions`）。
- 請勿為工具失敗擲出 `MCPError`。客戶端會收到協定錯誤，而非帶有 `is_error` 的工具結果。許多主機不會向模型顯示此錯誤。
- 使用 `await ctx.notify_tools_changed()` 傳送清單變更通知。請勿使用 `ctx.session.send_tool_list_changed()`。2026-07-28 連線會捨棄它。
- 在 2026-07-28 修訂版上，可串流 HTTP 請求沒有工作階段（session）。`stateless_http=True` 僅會變更伺服器服務較舊修訂版客戶端的方式。
- `json_response=True` 會為每個請求傳送一個 JSON 本文。在此模式下，伺服器無法在請求期間傳送進度通知。
- 使用 `uv run mcp dev server.py`（MCP Inspector）或 `uv run mcp install server.py`（Claude Desktop）測試伺服器。
- 使用記憶體內客戶端編寫測試：`async with Client(mcp) as client:`（`from mcp import Client`）。
- 在 Starlette 中以不同路徑掛載多個伺服器：`Mount("/path", app=mcp.streamable_http_app())`。主機應用程式的 lifespan 必須為每個伺服器進入 `mcp.session_manager.run()`。
- 對於瀏覽器客戶端，請設定 CORS。允許 `Mcp-*` 請求標頭。公開 `Mcp-Session-Id` 回應標頭。
- 若未設定 `transport_security`，SDK 僅在主機為 `127.0.0.1`、`localhost` 或 `::1` 時檢查 `Host` 和 `Origin` 標頭。對於所有其他主機，請設定 `transport_security=TransportSecuritySettings(allowed_hosts=[...], allowed_origins=[...])`（來自 `mcp.server.transport_security`）。
- 對於多個 worker，請在 `MCPServer` 上設定 `request_state_security=RequestStateSecurity(keys=[...])`。
- 僅在 `MCPServer` 無法提供足夠控制權時，才使用低階 `Server` 類別（來自 `mcp.server`）。

## 最佳實踐

- 賦予每個工具函式單一職責。
- 撰寫清楚的 docstring。它們會成為工具的說明描述。
- 使用帶有型別提示且具描述性的參數名稱。
- 使用 Pydantic `Field` 說明驗證輸入。
- 對 I/O 密集型操作使用 async 函式。SDK 會在 worker 執行緒上執行 sync 函式。
- 記錄至 stderr。請勿在 stdio 伺服器中使用 `print()`，因為 stdout 是協定通道。
- 使用環境變數進行組態設定。
- 當工具提供對檔案系統或網路的存取權限時，請格外謹慎。

## 常見模式

### 基本伺服器設定 (stdio)

```python
from mcp.server import MCPServer

mcp = MCPServer("My Server", version="0.1.0")

@mcp.tool()
def calculate(a: int, b: int, op: str) -> int:
    """執行運算"""
    if op == "add":
        return a + b
    return a - b

if __name__ == "__main__":
    mcp.run()  # 預設為 stdio
```

### HTTP 伺服器

```python
from mcp.server import MCPServer

mcp = MCPServer("My HTTP Server", version="0.1.0")

@mcp.tool()
def hello(name: str = "World") -> str:
    """向某人問候"""
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="127.0.0.1", port=8000)
```

### 具結構化輸出的工具

```python
from pydantic import BaseModel, Field

class WeatherData(BaseModel):
    temperature: float = Field(description="攝氏溫度")
    condition: str
    humidity: float

@mcp.tool()
def get_weather(city: str) -> WeatherData:
    """取得城市的天氣"""
    return WeatherData(
        temperature=22.5,
        condition="sunny",
        humidity=65.0
    )
```

### 動態資源

```python
@mcp.resource("users://{user_id}")
def get_user(user_id: str) -> str:
    """取得使用者個人檔案資料"""
    return f"User {user_id} profile data"
```

### 具 Context 的工具

```python
import logging

from mcp.server.mcpserver import Context

logger = logging.getLogger(__name__)

@mcp.tool()
async def process_data(data: str, ctx: Context) -> str:
    """處理資料並回報進度"""
    logger.info("Processing: %s", data)
    await ctx.report_progress(0.5, 1.0, "完成一半")
    return f"Processed: {data}"
```

### 具使用者輸入的工具

```python
from typing import Annotated

from pydantic import BaseModel

from mcp.server.mcpserver import AcceptedElicitation, Elicit, ElicitationResult, Resolve

class Quantity(BaseModel):
    copies: int

async def ask_quantity() -> Elicit[Quantity]:
    """詢問使用者要預訂多少份。"""
    return Elicit("How many copies?", Quantity)

@mcp.tool()
async def reserve(
    title: str,
    quantity: Annotated[ElicitationResult[Quantity], Resolve(ask_quantity)],
) -> str:
    """預訂書本份數"""
    if isinstance(quantity, AcceptedElicitation):
        return f"Reserved {quantity.data.copies} of {title!r}."
    return "Nothing reserved."
```

### 生命週期（Lifespan）管理

```python
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass

from mcp.server import MCPServer
from mcp.server.mcpserver import Context

@dataclass
class AppContext:
    db: Database  # 您的資料庫客戶端

@asynccontextmanager
async def app_lifespan(server: MCPServer) -> AsyncIterator[AppContext]:
    db = await Database.connect()
    try:
        yield AppContext(db=db)
    finally:
        await db.disconnect()

mcp = MCPServer("My App", version="0.1.0", lifespan=app_lifespan)

@mcp.tool()
def query(sql: str, ctx: Context[AppContext]) -> str:
    """查詢資料庫"""
    db = ctx.request_context.lifespan_context.db
    return db.execute(sql)
```

### 包含訊息的 Prompt

```python
from mcp.server.mcpserver import AssistantMessage, Message, UserMessage

@mcp.prompt(title="Code Review")
def review_code(code: str) -> list[Message]:
    """建立程式碼審查 prompt"""
    return [
        UserMessage("Review this code:"),
        UserMessage(code),
        AssistantMessage("I'll review the code for you.")
    ]
```

### 錯誤處理

```python
from mcp.server.mcpserver.exceptions import ToolError

@mcp.tool()
async def risky_operation(input: str) -> str:
    """可能會失敗的操作"""
    if not input:
        raise ToolError("Input must not be empty.")
    result = await perform_operation(input)  # 您的操作
    return f"Success: {result}"
```

### 記憶體內測試

```python
import pytest

from mcp import Client

from server import mcp  # HTTP 伺服器範例

@pytest.mark.anyio
async def test_hello():
    async with Client(mcp) as client:
        result = await client.call_tool("hello", {"name": "MCP"})
        assert result.structured_content == {"result": "Hello, MCP!"}
```