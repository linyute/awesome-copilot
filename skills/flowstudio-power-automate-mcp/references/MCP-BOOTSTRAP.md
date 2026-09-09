# MCP Bootstrap — 快速參考

Agent 開始呼叫 FlowStudio MCP 伺服器所需的一切資訊。

```
Endpoint:  https://mcp.flowstudio.app/mcp
Protocol:  JSON-RPC 2.0 over HTTP POST
Transport: Streamable HTTP — single POST per request, no SSE, no WebSocket
Auth:      x-api-key header with JWT token (NOT Bearer)
```

## 必要標頭

```
Content-Type: application/json
x-api-key: <token>
User-Agent: FlowStudio-MCP/1.0    ← required, or Cloudflare blocks you
```

## 步驟 1 — 探索工具配套

偏好的冷啟動呼叫：

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/call",
      "params":{"name":"list_skills","arguments":{}}}
```

傳回目前的配套（`build-flow`、`create-flow`、`debug-flow`、
`monitor-flow`、`discover`、`governance`）及其成員工具名稱。免費 —
不計入方案限制。

接著載入相關結構描述：

```json
POST {"jsonrpc":"2.0","id":2,"method":"tools/call",
      "params":{"name":"tool_search","arguments":{"query":"skill:create-flow"}}}
```

使用 `query:"select:tool1,tool2"` 載入確切的工具，並在使用者意圖
不明確時使用關鍵字搜尋，例如 `query:"send email"`。

極低階 MCP 用戶端的遞補方案：

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

`tools/list` 傳回所有工具的名稱、描述與輸入結構描述，但
它負載較重，不應作為已知 FlowStudio meta-tools 的 Agent 之
首選。

## 步驟 2 — 呼叫工具

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/call",
      "params":{"name":"<tool_name>","arguments":{...}}}
```

## 回應形式

```
Success → {"result":{"content":[{"type":"text","text":"<JSON string>"}]}}
Error   → {"result":{"content":[{"type":"text","text":"{\"error\":{...}}"}]}}
```

一律將 `result.content[0].text` 解析為 JSON 以取得實際資料。

## 重要秘訣

- 工具結果為文字欄位內的 JSON 字串 — **需要二次解析**
- 已解析主體中的 `"error"` 欄位：`null` = 成功，物件 = 失敗
- `environmentName` 對多數工具為必要項目，但**不適用**於：
  `list_live_environments`、`list_live_connections`、`list_store_flows`、
  `list_store_environments`、`list_store_makers`、`get_store_maker`、
  `list_store_power_apps`、`list_store_connections`
- 如有疑問，請檢查 `tool_search`（或以 `tools/list` 作為遞補）所提供之
  各工具結構描述中的 `required` 陣列
