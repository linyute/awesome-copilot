# MCP 啟動 (Bootstrap) — 快速參考

代理程式開始呼叫 FlowStudio MCP 伺服器所需的一切資訊。

```
端點：     https://mcp.flowstudio.app/mcp
協定：     HTTP POST 上的 JSON-RPC 2.0
傳輸：     可串流 HTTP — 每次請求單一 POST，無 SSE，無 WebSocket
驗證：     帶有 JWT 權杖的 x-api-key 標頭 (不可使用 Bearer)
```

## 必要標頭

```
Content-Type: application/json
x-api-key: <權杖>
User-Agent: FlowStudio-MCP/1.0    ← 必要，否則 Cloudflare 會將您封鎖
```

## 步驟 1 — 探索工具

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

傳回所有工具及其名稱、描述與輸入結構描述。
免費 — 不計入方案限制。

## 步驟 2 — 呼叫工具

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/call",
      "params":{"name":"<工具名稱>","arguments":{...}}}
```

## 回應格式

```
成功 → {"result":{"content":[{"type":"text","text":"<JSON 字串>"}]}}
錯誤 → {"result":{"content":[{"type":"text","text":"{\"error\":{...}}"}]}}
```

務必將 `result.content[0].text` 解析為 JSON 以取得實際資料。

## 關鍵提示

- 工具結果是位於文字欄位中的 JSON 字串 — **需要兩次解析**
- 解析後主體中的 `"error"` 欄位：`null` = 成功，物件 = 失敗
- 大多數工具都需要 `environmentName`，但以下工具 **不需要**：
  `list_live_environments`、`list_live_connections`、`list_store_flows`、
  `list_store_environments`、`list_store_makers`、`get_store_maker`、
  `list_store_power_apps`、`list_store_connections`
- 如有疑慮，請檢查 `tools/list` 中每個工具結構描述中的 `required` 陣列
