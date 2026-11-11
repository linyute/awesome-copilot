---
name: python-mcp-server-generator
description: '當使用者想要在 Python 中建立新的模型上下文協定（MCP）伺服器時使用此技能。亦可用於將 Python 函式、API 或資料庫作為 MCP 工具公開給 AI 客戶端。此技能使用 MCP Python SDK v2（MCPServer）、具型別的工具、記憶體內測試以及用戶端設定來建立 uv 專案。請勿將其用於 MCP 客戶端或另一種語言的伺服器。'
compatibility: '需要 uv、Python 3.10 或更新版本，以及安裝套件的網路存取權限。MCP Inspector 還需要 Node.js。'
---

# Python MCP 伺服器產生器

使用官方 [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) v2 在 Python 中建立模型上下文協定（MCP）伺服器。SDK v2 支援 MCP 規格修訂版 [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)。同一個伺服器也能為使用較早修訂版的用戶端提供服務。

## 工作流程

複製此檢查清單並追蹤您的進度：

- [ ] 步驟 1：建立專案。
- [ ] 步驟 2：撰寫伺服器。
- [ ] 步驟 3：撰寫測試。
- [ ] 步驟 4：執行測試直到通過。
- [ ] 步驟 5：設定用戶端。

### 步驟 1：建立專案

執行這些指令：

```bash
uv init --app --no-package project-name
cd project-name
uv add "mcp[cli]>=2,<3"
uv add --dev pytest
```

然後刪除 `main.py`。伺服器程式碼放在 `server.py` 中。

- 若不帶 `--no-package`，uv 會建立 `src/` 套件佈局，導致測試無法匯入 `server.py`。
- `uv init` 會建立 `.gitignore` 檔案。不要撰寫其他檔案。

### 步驟 2：撰寫伺服器

從此範本開始：

```python
from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

mcp = MCPServer("Demo", version="0.1.0")


@mcp.tool()
def divide(a: float, b: float) -> float:
    """將 a 除以 b。"""
    if b == 0:
        raise ToolError("b 不得為零。")
    return a / b


if __name__ == "__main__":
    mcp.run()  # stdio 為預設傳輸方式
```

然後針對使用者的請求修改範本：

1. 將 `divide` 替換為使用者所需的工具。
2. 為每個工具提供完整的型別提示與 docstring。SDK 會從型別提示建立輸入結構描述。docstring 則成為工具說明。
3. 當用戶端需要機器可讀取的資料時，傳回 Pydantic 模型或 `TypedDict`。SDK 會從傳回型別建立輸出結構描述。
4. 針對 I/O 使用 `async def`。SDK 會在工作執行緒上執行同步工具。
5. 使用 `@mcp.tool(annotations=ToolAnnotations(read_only_hint=True))`（來自 `mcp.types`）標記唯讀工具。對具破壞性的工具使用 `destructive_hint=True`。
6. 僅在使用者要求時新增資源（`@mcp.resource("users://{user_id}")`）與提示詞（`@mcp.prompt()`）。

預設使用 stdio。僅在使用者要求遠端伺服器或 HTTP 伺服器時閱讀 [references/streamable-http.md](references/streamable-http.md)。

### 步驟 3：撰寫測試

將 `test_server.py` 放在 `server.py` 旁。為每個工具與每個 `ToolError` 撰寫測試：

```python
import pytest

from mcp import Client

from server import mcp


@pytest.mark.anyio
async def test_divide():
    async with Client(mcp) as client:
        result = await client.call_tool("divide", {"a": 6, "b": 3})
        assert result.structured_content == {"result": 2.0}


@pytest.mark.anyio
async def test_divide_by_zero():
    async with Client(mcp) as client:
        result = await client.call_tool("divide", {"a": 1, "b": 0})
        assert result.is_error
        assert "must not be zero" in result.content[0].text
```

- 記憶體內 `Client` 不需要子處理程序與連接埠。它使用 2026-07-28 修訂版進行連線。
- `mcp` 套件會安裝 `anyio`，該套件提供 `anyio` 標記。不要新增 `pytest-asyncio`。

### 步驟 4：執行測試直到通過

1. 執行 `uv run pytest`。
2. 若測試失敗，請閱讀錯誤。修復伺服器或測試。
3. 再次執行 `uv run pytest`。
4. 僅在所有測試通過時繼續。

### 步驟 5：設定用戶端

對於 VS Code，撰寫 `.vscode/mcp.json`：

```json
{
  "servers": {
    "demo": {
      "type": "stdio",
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/project", "run", "server.py"]
    }
  }
}
```

對於 Claude Desktop，執行 `uv run mcp install server.py`。

告訴使用者這些指令：

- `uv run server.py` 啟動 stdio 伺服器。伺服器在 stdin 上等待主機且不列印任何內容。
- `uv run mcp dev server.py` 開啟 MCP Inspector。Inspector 需要 Node.js。

## 陷阱

SDK v2 與 2026-07-28 修訂版變更了許多 SDK v1 模式。不要複製 SDK v1 範例。

- SDK v2 移除了 `FastMCP` 與 `mcp.server.fastmcp`。使用 `from mcp.server import MCPServer` 匯入伺服器類別。
- 從 `mcp.server.mcpserver` 匯入 `Context`、`Image`、`Audio`、`Resolve`、`Elicit`、`ElicitationResult`、`AcceptedElicitation`、`Message`、`UserMessage` 與 `AssistantMessage`。
- 將伺服器名稱作為第一個 `MCPServer` 引數傳入。將所有其他建構函式引數作為關鍵字引數傳入。它們的位置順序在 SDK v2 中已變更。
- 設定 `version`。若未設定，伺服器會回報空白版本。
- 將傳輸選項（`transport`、`host`、`port`、`json_response`、`stateless_http`、`transport_security`）傳遞給 `run()`，而不是傳遞給 `MCPServer(...)`。
- SDK v2 型別使用 snake_case 欄位，例如 `read_only_hint`、`structured_content` 與 `is_error`。
- 對於模型必須讀取的錯誤，引發 `ToolError`。對於其他例外狀況，模型僅會收到一般錯誤訊息。
- 不要為工具失敗引發 `MCPError`。用戶端會收到協定錯誤，而非帶有 `is_error` 的工具結果。許多主機不會向模型顯示此錯誤。
- 在 stdio 伺服器中，stdout 是協定通道。不要呼叫 `print()`。使用 `logging` 模組記錄至 stderr。
- 不要使用 `ctx.elicit()`。它在 2026-07-28 連線上會失敗。對於工具呼叫期間的使用者輸入，使用 `Resolve(fn)` 標註參數。從 `fn` 傳回 `Elicit(message, Model)`。
- 使用 `await ctx.notify_tools_changed()` 傳送清單變更通知。2026-07-28 連線會捨棄 `ctx.session.send_tool_list_changed()`。
- 對於 stdio 與 HTTP，lifespan 在伺服器啟動時執行一次。測試中的每個記憶體內 `Client(mcp)` 都會再次執行 lifespan。使用 `ctx.request_context.lifespan_context` 讀取其物件。
- 2026-07-28 修訂版已棄用這些功能（[SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577)）。不要將它們新增至新伺服器：
  - **取樣（Sampling）**（`ctx.session.create_message()`）：直接呼叫 LLM 提供者 API。
  - **協定記錄（Protocol logging）**（`ctx.log()`、`ctx.info()` 及類似方法）：使用標準 `logging` 模組。
  - **根目錄（Roots）**（`ctx.session.list_roots()`）：從工具參數、資源 URI 或伺服器設定取得路徑。
- 2026-07-28 修訂版沒有 SSE 傳輸。使用 Streamable HTTP。
