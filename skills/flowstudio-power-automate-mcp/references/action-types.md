# FlowStudio MCP — 動作類型參考 (Action Types Reference)

用於識別 `get_live_flow` 傳回之動作類型的精簡查閱表。
使用此表來 **閱讀與理解** 現有的流程定義。

> 如需完整的複製貼上建構模式，請參閱 `flowstudio-power-automate-build` 技能。

---

## 如何閱讀流程定義

每個動作都具有 `"type"` (類型)、`"runAfter"` (在之後執行) 和 `"inputs"` (輸入)。`runAfter` 物件宣告了相依性：`{"Previous": ["Succeeded"]}`。有效的狀態包括：`Succeeded` (成功)、`Failed` (失敗)、`Skipped` (被跳過)、`TimedOut` (逾時)。

---

## 動作類型快速參考

| 類型 | 用途 | 需檢查的關鍵欄位 | 輸出參考 |
|---|---|---|---|
| `Compose` | 儲存/轉換值 | `inputs` (任何運算式) | `outputs('Name')` |
| `InitializeVariable` | 宣告變數 | `inputs.variables[].{name, type, value}` | `variables('name')` |
| `SetVariable` | 更新變數 | `inputs.{name, value}` | `variables('name')` |
| `IncrementVariable` | 增加數值變數的值 | `inputs.{name, value}` | `variables('name')` |
| `AppendToArrayVariable` | 推送到陣列變數 | `inputs.{name, value}` | `variables('name')` |
| `If` | 條件分支 | `expression.and/or`, `actions`, `else.actions` | — |
| `Switch` | 多向分支 | `expression`, `cases.{case, actions}`, `default` | — |
| `Foreach` | 陣列上的迴圈 | `foreach`, `actions`, `operationOptions` | `item()` / `items('Name')` |
| `Until` | 直到條件成立前的迴圈 | `expression`, `limit.{count, timeout}`, `actions` | — |
| `Wait` | 延遲 | `inputs.interval.{count, unit}` | — |
| `Scope` | 分組 / try-catch | `actions` (巢狀動作對應表) | `result('Name')` |
| `Terminate` | 結束執行 | `inputs.{runStatus, runError}` | — |
| `OpenApiConnection` | 連接器呼叫 (SP, Outlook, Teams…) | `inputs.host.{apiId, connectionName, operationId}`, `inputs.parameters` | `outputs('Name')?['body/...']` |
| `OpenApiConnectionWebhook` | Webhook 等待 (簽核、調適型卡片) | 與上述相同 | `body('Name')?['...']` |
| `Http` | 外部 HTTP 呼叫 | `inputs.{method, uri, headers, body}` | `outputs('Name')?['body']` |
| `Response` | 傳回給 HTTP 呼叫者 | `inputs.{statusCode, headers, body}` | — |
| `Query` | 篩選陣列 | `inputs.{from, where}` | `body('Name')` (篩選後的陣列) |
| `Select` | 重塑/投影陣列 | `inputs.{from, select}` | `body('Name')` (投影後的陣列) |
| `Table` | 陣列 → CSV/HTML 字串 | `inputs.{from, format, columns}` | `body('Name')` (字串) |
| `ParseJson` | 使用結構描述解析 JSON | `inputs.{content, schema}` | `body('Name')?['field']` |
| `Expression` | 內建函式 (例如 ConvertTimeZone) | `kind`, `inputs` | `body('Name')` |

---

## 連接器識別

當您看到 `type: OpenApiConnection` 時，請根據 `host.apiId` 識別連接器：

| apiId 字尾 | 連接器 |
|---|---|
| `shared_sharepointonline` | SharePoint |
| `shared_office365` | Outlook / Office 365 |
| `shared_teams` | Microsoft Teams |
| `shared_approvals` | 簽核 (Approvals) |
| `shared_office365users` | Office 365 使用者 |
| `shared_flowmanagement` | 流程管理 (Flow Management) |

`operationId` 說明了具體的操作（例如 `GetItems`, `SendEmailV2`, `PostMessageToConversation`）。`connectionName` 則對應到 `properties.connectionReferences` 中的 GUID。

---

## 常見運算式 (閱讀速查表)

| 運算式 | 意義 |
|---|---|
| `@outputs('X')?['body/value']` | 來自連接器動作 X 的陣列結果 |
| `@body('X')` | 動作 X 的直接本文 (Query, Select, ParseJson) |
| `@item()?['Field']` | 目前迴圈項目的欄位 |
| `@triggerBody()?['Field']` | 觸發承載資料欄位 |
| `@variables('name')` | 變數值 |
| `@coalesce(a, b)` | a, b 中第一個非 null 的值 |
| `@first(array)` | 第一個元素 (如果為空則為 null) |
| `@length(array)` | 陣列計數 |
| `@empty(value)` | 如果為 null/空字串/空陣列則為 True |
| `@union(a, b)` | 合併陣列 — **重複項以第一個為準** |
| `@result('Scope')` | 範圍內部的動作結果陣列 |
