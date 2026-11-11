# Streamable HTTP 伺服器

僅對遠端伺服器使用此傳輸方式。本機伺服器使用 stdio。

## 執行伺服器

替換 `server.py` 中的 `mcp.run()`：

```python
import os

if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "8000")),
    )
```

用戶端連線至 `http://HOST:PORT/mcp`。對於 VS Code，撰寫 `.vscode/mcp.json`：

```json
{
  "servers": {
    "demo": {
      "type": "http",
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

## 將伺服器掛載於 ASGI 應用程式中

1. 使用 `mcp.streamable_http_app()` 將伺服器掛載至 Starlette 或 FastAPI 應用程式。
2. 將傳輸選項傳遞給 `streamable_http_app()`。此方法沒有 `port` 選項。
3. 使主應用程式的 lifespan 進入 `mcp.session_manager.run()`。

## 陷阱

- 2026-07-28 修訂版的請求沒有會話。任何複本都可以回應請求。
- `stateless_http=True` 僅變更伺服器為較早修訂版用戶端提供服務的方式。
- `json_response=True` 為每個請求傳送一個 JSON 本文。在此模式下，伺服器無法在請求期間傳送進度通知。
- 若未設定 `transport_security`，SDK 僅在主機為 `127.0.0.1`、`localhost` 或 `::1` 時檢查 `Host` 與 `Origin` 標頭。對於所有其他主機（例如 `0.0.0.0` 或公開主機名稱），伺服器不做任何檢查。對於這些主機，請將 `transport_security=TransportSecuritySettings(allowed_hosts=[...], allowed_origins=[...])`（來自 `mcp.server.transport_security`）傳遞給 `run()` 或 `streamable_http_app()`。
- 對於瀏覽器用戶端，將 CORS 新增至主應用程式。允許 `Mcp-*` 請求標頭。公開 `Mcp-Session-Id` 回應標頭。
- 對於多個工作執行程序，在 `MCPServer` 上設定 `request_state_security=RequestStateSecurity(keys=[...])`（來自 `mcp.server.mcpserver`）。在所有工作執行程序上使用相同的金鑰與相同的伺服器名稱。
