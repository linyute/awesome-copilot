# MCP 引導 (MCP Bootstrap) — 快速參考

代理程式開始呼叫 FlowStudio MCP 伺服器所需的一切資訊。

```
端點：     https://mcp.flowstudio.app/mcp
通訊協定： 透過 HTTP POST 執行的 JSON-RPC 2.0
傳輸方式： 可串流 HTTP — 每次請求一個 POST，無 SSE，無 WebSocket
驗證：     包含 JWT 權杖的 x-api-key 標頭 (非 Bearer)
```

## 必要標頭

```
Content-Type: application/json
x-api-key: <權杖>
User-Agent: FlowStudio-MCP/1.0    ← 必填，否則 Cloudflare 會封鎖您
```

## 第 1 步 — 發現工具組合包 (Tool Bundles)

偏好的冷啟動 (cold-start) 呼叫：

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/call",
      "params":{"name":"list_skills","arguments":{}}}
```

傳回目前的組合包 (`build-flow`, `create-flow`, `debug-flow`,
`monitor-flow`, `discover`, `governance`) 及其成員工具名稱。免費 —
不計入方案限制。

然後載入相關的結構描述：

```json
POST {"jsonrpc":"2.0","id":2,"method":"tools/call",
      "params":{"name":"tool_search","arguments":{"query":"skill:create-flow"}}}
```

使用 `query:"select:tool1,tool2"` 載入精確的工具，並在使用者意圖模糊時使用關鍵字搜尋，例如 `query:"send email"`。

對於極低層級的 MCP 用戶端，可使用後備方案：

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

`tools/list` 會傳回所有工具的名稱、說明和輸入結構描述，但它比較沉重，不應作為熟悉 FlowStudio 中繼工具之代理程式的首選。

## 第 2 步 — 呼叫工具

```json
POST {"jsonrpc":"2.0","id":1,"method":"tools/call",
      "params":{"name":"<工具名稱>","arguments":{...}}}
```

## 回應形狀

```
成功 → {"result":{"content":[{"type":"text","text":"<JSON 字串>"}]}}
錯誤 → {"result":{"content":[{"type":"text","text":"{\"error\":{...}}"}]}}
```

務必將 `result.content[0].text` 解析為 JSON 以取得實際資料。

## 關鍵提示

- 工具結果是文字欄位內的 JSON 字串 — **需要進行兩次解析**
- 已解析本文中的 `"error"` 欄位：`null` = 成功，物件 = 失敗
- `environmentName` 對於大多數工具是必填的，但 **不適用於**：
  `list_live_environments`, `list_live_connections`, `list_store_flows`,
  `list_store_environments`, `list_store_makers`, `get_store_maker`,
  `list_store_power_apps`, `list_store_connections`
- 如有疑慮，請檢查來自 `tool_search` (或作為後備方案的 `tools/list`) 之各個工具結構描述中的 `required` 陣列
