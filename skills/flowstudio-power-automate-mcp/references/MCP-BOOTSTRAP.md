# MCP 引導 — 快速參考 (Quick Reference)

代理程式開始呼叫 FlowStudio MCP 伺服器所需的一切。

```
端點：  https://mcp.flowstudio.app/mcp
協定：  JSON-RPC 2.0 (透過 HTTP POST)
傳輸：  串流 HTTP — 每個請求單一 POST，無 SSE，無 WebSocket
驗證：      x-api-key 標頭搭配 JWT 權杖 (非 Bearer)
```

## 必要標頭

```
Content-Type: application/json
x-api-key: <token>
User-Agent: FlowStudio-MCP/1.0    ← 必要，否則 Cloudflare 會封鎖您
```

## 步驟 1 — 探索工具

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

回傳所有工具名稱、說明與輸入結構描述。
免費 — 不計入方案額度。

## 步驟 2 — 呼叫工具

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/call",
      "params":{"name":"<tool_name>","arguments":{...}}}
```

## 回應形狀

```
成功 → {"result":{"content":[{"type":"text","text":"<JSON 字串>"}]}}
錯誤   → {"result":{"content":[{"type":"text","text":"{\"error\":{...}}"}]}}
```

請務必解析 `result.content[0].text` 為 JSON 以取得實際資料。

## 關鍵提示

- 工具結果為文字欄位內的 JSON 字串 — **需要雙重解析**
- 已解析本體中的 `"error"` 欄位：`null` = 成功，物件 = 失敗
- 大多數工具皆需要 `environmentName`，但以下工具 **不需要**：
  `list_live_environments`, `list_live_connections`, `list_store_flows`,
  `list_store_environments`, `list_store_makers`, `get_store_maker`,
  `list_store_power_apps`, `list_store_connections`
- 若有疑問，請檢查 `tools/list` 中每個工具結構描述的 `required` 陣列
