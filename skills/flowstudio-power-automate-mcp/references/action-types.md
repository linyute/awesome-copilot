# FlowStudio MCP — 動作型別參考 (Action Types Reference)

用於識別 `get_live_flow` 所回傳動作型別的精簡查詢表。
請使用此表來 **閱讀並理解** 現有的流程定義。

> 如需完整的複製貼上建構模式，請參閱 `flowstudio-power-automate-build` 技能。

---

## 如何閱讀流程定義

每個動作皆具有 `"type"`、`"runAfter"` 和 `"inputs"`。`runAfter` 物件宣告相依性：`{"Previous": ["Succeeded"]}`。有效狀態：`Succeeded`, `Failed`, `Skipped`, `TimedOut`。

---

## 動作型別快速參考

| 型別 | 用途 | 關鍵檢視欄位 | 輸出參考 |
|---|---|---|---|
| `Compose` | 儲存/轉換數值 | `inputs` (任何運算式) | `outputs('Name')` |
| `InitializeVariable` | 宣告變數 | `inputs.variables[].{name, type, value}` | `variables('name')` |
| `SetVariable` | 更新變數 | `inputs.{name, value}` | `variables('name')` |
| `IncrementVariable` | 遞增數值變數 | `inputs.{name, value}` | `variables('name')` |
| `AppendToArrayVariable` | 推送至陣列變數 | `inputs.{name, value}` | `variables('name')` |
| `If` | 條件分支 | `expression.and/or`, `actions`, `else.actions` | — |
| `Switch` | 多路分支 | `expression`, `cases.{case, actions}`, `default` | — |
| `Foreach` | 陣列迴圈 | `foreach`, `actions`, `operationOptions` | `item()` / `items('Name')` |
| `Until` | 迴圈直到條件滿足 | `expression`, `limit.{count, timeout}`, `actions` | — |
| `Wait` | 延遲 | `inputs.interval.{count, unit}` | — |
| `Scope` | 群組 / Try-Catch | `actions` (巢狀動作對應表) | `result('Name')` |
| `Terminate` | 結束執行記錄 | `inputs.{runStatus, runError}` | — |
| `OpenApiConnection` | 連接器呼叫 (SP, Outlook, Teams…) | `inputs.host.{apiId, connectionName, operationId}`, `inputs.parameters` | `outputs('Name')?['body/...']` |
| `OpenApiConnectionWebhook` | Webhook 等待 (核准, 調適型卡片) | 同上 | `body('Name')?['...']` |
| `Http` | 外部 HTTP 呼叫 | `inputs.{method, uri, headers, body}` | `outputs('Name')?['body']` |
| `Response` | 回傳給 HTTP 呼叫者 | `inputs.{statusCode, headers, body}` | — |
| `Query` | 過濾陣列 | `inputs.{from, where}` | `body('Name')` (過濾後的陣列) |
| `Select` | 重塑/投影陣列 | `inputs.{from, select}` | `body('Name')` (投影後的陣列) |
| `Table` | 陣列 → CSV/HTML 字串 | `inputs.{from, format, columns}` | `body('Name')` (字串) |
| `ParseJson` | 使用結構描述解析 JSON | `inputs.{content, schema}` | `body('Name')?['field']` |
| `Expression` | 內建函式 (例如 ConvertTimeZone) | `kind`, `inputs` | `body('Name')` |

---

## 連接器識別

當您看到 `type: OpenApiConnection` 時，可透過 `host.apiId` 識別連接器：

| apiId 後綴 | 連接器 |
|---|---|
| `shared_sharepointonline` | SharePoint |
| `shared_office365` | Outlook / Office 365 |
| `shared_teams` | Microsoft Teams |
| `shared_approvals` | Approvals (核准) |
| `shared_office365users` | Office 365 Users |
| `shared_flowmanagement` | Flow Management |

`operationId` 告知您特定的作業 (例如 `GetItems`, `SendEmailV2`, `PostMessageToConversation`)。`connectionName` 對應至 `properties.connectionReferences` 中的 GUID。

---

## 常見運算式 (閱讀小抄)

| 運算式 | 意義 |
|---|---|
| `@outputs('X')?['body/value']` | 來自連接器動作 X 的陣列結果 |
| `@body('X')` | 動作 X 的直接本文 (Query, Select, ParseJson) |
| `@item()?['Field']` | 當前迴圈項目的欄位 |
| `@triggerBody()?['Field']` | 觸發程序負載欄位 |
| `@variables('name')` | 變數值 |
| `@coalesce(a, b)` | a, b 中第一個非 null 值 |
| `@first(array)` | 第一個元素 (若為空則為 null) |
| `@length(array)` | 陣列個數 |
| `@empty(value)` | 若為 null/空字串/空陣列則為 true |
| `@union(a, b)` | 合併陣列 — 重複項 **以第一個為準** |
| `@result('Scope')` | 範圍內動作結果的陣列 |
