# FlowStudio MCP — 工具回應目錄

FlowStudio Power Automate MCP 伺服器的回應形式與行為說明。

> **關於工具名稱與參數**：偏好使用 `list_skills` 與 `tool_search`。
> 它們會傳回具針對性且最新的結構描述，而無需一次載入所有 MCP 工具。
> 僅在 meta-tools 無法使用時，才將 `tools/list` 作為低階遞補方案。
> 本文件涵蓋工具結構描述未載明之處：透過實際使用發現的**回應形式**
> 與**非顯而易見的行為**。

---

## 信任來源

| 優先順序 | 來源 | 涵蓋範圍 |
|----------|--------|--------|
| 1 | **實際 API 回應** | 一律信任伺服器實際傳回的內容 |
| 2 | **`list_skills` / `tool_search`** | 工具名稱、參數名稱、類型、必要旗標 |
| 3 | **本文件** | 回應形式、行為說明、注意事項 |

> 若本文件與 `tool_search`、`tools/list` 或實際 API 行為不一致，
> 概以 API 為準。請據此相應更新本文件。

---

## 環境與租用戶探索

### `list_live_environments`

回應：直接傳回環境陣列。
```json
[
  {
    "id": "Default-26e65220-5561-46ef-9783-ce5f20489241",
    "displayName": "FlowStudio (default)",
    "sku": "Production",
    "location": "australia",
    "state": "Enabled",
    "isDefault": true,
    "isAdmin": true,
    "isMember": true,
    "createdTime": "2023-08-18T00:41:05Z"
  }
]
```

> 在所有其他工具中將 `id` 值用作 `environmentName`。

### `list_store_environments`

與 `list_live_environments` 形式相同，但從快取讀取（速度更快）。

---

## 連線探索

### `list_live_connections`

回應：包含 `connections` 陣列的包裝函式物件。
```json
{
  "connections": [
    {
      "id": "shared-office365-9f9d2c8e-55f1-49c9-9f9c-1c45d1fbbdce",
      "displayName": "user@contoso.com",
      "connectorName": "shared_office365",
      "environment": "Default-26e65220-...",
      "createdBy": "User Name",
      "authenticatedUser": "user@contoso.com",
      "overallStatus": "Connected",
      "statuses": [{"status": "Connected"}],
      "createdTime": "2024-03-12T21:23:55.206815Z",
      "connectionReferenceTemplate": {
        "connectionName": "shared-office365-9f9d2c8e-55f1-49c9-9f9c-1c45d1fbbdce",
        "source": "Invoker",
        "id": "/providers/Microsoft.PowerApps/apis/shared_office365"
      },
      "hostTemplate": {
        "connectionName": "shared_office365"
      }
    }
  ],
  "totalCount": 56,
  "error": null
}
```

> **重要欄位**：`id` 是用於 `connectionReferences` 中的 `connectionName` 值。
>
> **重要欄位**：`connectorName` 對應至 apiId：
> `"/providers/Microsoft.PowerApps/apis/" + connectorName`
>
> 依狀態篩選：若存在，偏好使用 `overallStatus == "Connected"`；否則
> 檢查 `statuses[0].status == "Connected"`。
>
> `environmentName` 為必要項目 — 此平台無法跨環境列出連線
> （省略將傳回 400 MissingEnvironmentFilter）。請從
> `list_live_environments` 取得環境名稱。
>
> 傳遞 `search=<connector or account>` 以縮小輸出並接收
> 可直接複製到 `update_live_flow` 的 `connectionReferenceTemplate`
> 與 `hostTemplate` 值。

### `list_store_connections`

來自快取的相同連線資料。

---

## 流程探索與列出

### `list_live_flows`

回應：包含 `flows` 陣列的包裝函式物件。
```json
{
  "mode": "owner",
  "flows": [
    {
      "id": "0757041a-8ef2-cf74-ef06-06881916f371",
      "displayName": "My Flow",
      "state": "Started",
      "triggerType": "Request",
      "triggerKind": "Http",
      "createdTime": "2023-08-18T01:18:17Z",
      "lastModifiedTime": "2023-08-18T12:47:42Z",
      "owners": "<aad-object-id>",
      "definitionAvailable": true
    }
  ],
  "totalCount": 100,
  "nextLink": null,
  "error": null
}
```

> 透過 `result["flows"]` 存取。`id` 是純 UUID --- 直接用作 `flowName`。
>
> `mode` 指示所使用的存取範圍（`"owner"` 或 `"admin"`）。
>
> 較新伺服器版本中新增的參數：
> - `search`：在伺服器端依顯示名稱篩選。
> - `mode`：`owner` 代表 MCP 身分所擁有的流程；`admin` 代表
>   管理員帳戶可見的所有流程。
> - `timeoutSeconds`：傳回包含 `nextLink` 的部分結果，以避免在
>   超大型環境中等待。
> - `continuationUrl`：傳遞上一個 `nextLink` 以接續相同的查詢。

### `list_store_flows`

回應：**直接傳回陣列**（無包裝函式）。
```json
[
  {
    "id": "3991358a-f603-e49d-b1ed-a9e4f72e2dcb.0757041a-8ef2-cf74-ef06-06881916f371",
    "displayName": "Admin | Sync Template v3 (Solutions)",
    "state": "Started",
    "triggerType": "OpenApiConnectionWebhook",
    "environmentName": "3991358a-f603-e49d-b1ed-a9e4f72e2dcb",
    "runPeriodTotal": 100,
    "createdTime": "2023-08-18T01:18:17Z",
    "lastModifiedTime": "2023-08-18T12:47:42Z"
  }
]
```

> **`id` 格式**：`<environmentId>.<flowId>` --- 依第一個 `.` 分割以擷取流程 UUID：
> `flow_id = item["id"].split(".", 1)[1]`

### `get_store_flow`

回應：來自快取的單一流程中繼資料（選定欄位）。
```json
{
  "id": "<environmentId>.<flowId>",
  "displayName": "My Flow",
  "state": "Started",
  "triggerType": "Recurrence",
  "runPeriodTotal": 100,
  "runPeriodFailRate": 0.1,
  "runPeriodSuccessRate": 0.9,
  "runPeriodFails": 10,
  "runPeriodSuccess": 90,
  "runPeriodDurationAverage": 29410.8,
  "runPeriodDurationMax": 158900.0,
  "runError": "{"code": "EACCES", ...}",
  "description": "Flow description",
  "tier": "Premium",
  "complexity": "{...}",
  "actions": 42,
  "connections": ["sharepointonline", "office365"],
  "owners": ["user@contoso.com"],
  "createdBy": "user@contoso.com"
}
```

> `runPeriodDurationAverage` / `runPeriodDurationMax` 單位為**毫秒**（除以 1000）。
> `runError` 是 **JSON 字串** --- 請使用 `json.loads()` 進行解析。

---

## 流程定義（即時 API）

### `get_live_flow`

回應：來自 PA API 的完整流程定義。
```json
{
  "name": "<flow-guid>",
  "properties": {
    "displayName": "My Flow",
    "state": "Started",
    "definition": {
      "triggers": { "..." },
      "actions": { "..." },
      "parameters": { "..." }
    },
    "connectionReferences": { "..." }
  }
}
```

### `update_live_flow`

**建立模式**：省略 `flowName` --- 建立新流程。`definition` 與 `displayName` 為必要項目。

**更新模式**：提供 `flowName` --- 對現有流程進行 PATCH。

回應：
```json
{
  "created": false,
  "flowKey": "<environmentId>.<flowId>",
  "updated": ["definition", "connectionReferences"],
  "displayName": "My Flow",
  "state": "Started",
  "definition": { "...full definition..." },
  "error": null
}
```

> `error` **一律存在**，但可能為 `null`。請檢查 `result.get("error") is not None`。
>
> 建立時：`created` 為新的流程 GUID（字串）。更新時：`created` 為 `false`。
>
> 必要欄位可能隨伺服器版本而異。在建立或修補流程之前，請使用
> 帶有 `select:update_live_flow` 的 `tool_search`；若需要描述，
> 請包含新描述或來自 `get_live_flow` 的現有描述。
>
> 流程描述是工作流程定義的一部分（`definition.description`），
> 而非目前結構描述中的最上層工具
> 引數。

### `add_live_flow_to_solution`

將非方案流程移轉至方案中。若已存在於方案中則傳回錯誤。

在建立由 Copilot Studio Skills 觸發且必須可被探索為 Agent 工具的
流程後，請使用此工具。為目標方案傳遞 `solutionId`。若伺服器
支援省略 `solutionId`，它會使用環境的預設方案；
對於生產環境 ALM，偏好使用明確的未受管制方案。

此工具僅變更方案成員資格。它不會驗證觸發程序結構描述、
發行 Copilot Studio Agent，亦不保證該流程可被該 Agent
呼叫。

---

## 連接器操作探索

### `describe_live_connector`

描述連接器/API 及其操作。在建立連接器動作之前請使用此工具，
而非猜測操作 JSON。

常見模式：

| 呼叫形式 | 用途 |
|---|---|
| `search="send email"`（無 `connectorName`） | 跨連接器搜尋操作 |
| `connectorName="shared_sharepointonline"` | 單一連接器的精簡操作目錄 |
| `operationId="GetItems"` | 單一操作的展開結構描述 |
| `variant="flowbot_chat"` | 單一操作變體的撰寫範例 |

操作詳細資訊可包含：
- `hint`：來自連接器提示資料表的撰寫指引。
- `exampleDefinition`：可用時提供可直接複製的動作/觸發程序形式。
- 帶有 `nextTool=get_live_dynamic_options` 或
  `nextTool=get_live_dynamic_properties` 的動態中繼資料。

### `get_live_dynamic_options`

解析連接器參數的即時下拉選單/清單選項。將此工具用於
從清單中選取的識別碼，例如 SharePoint 網站/清單、Teams 團隊/頻道，
或其他 `x-ms-dynamic-list` / `x-ms-dynamic-values` 參數。

傳遞由 `describe_live_connector` 傳回的 `dynamicMetadata` 物件、
來自 `list_live_connections` 的連線識別碼，以及任何已解析的相依
參數。

### `get_live_dynamic_properties`

解析連接器參數的即時結構描述/欄位屬性。在得知網站與清單後，
將此工具用於動態欄位集，例如 SharePoint 清單項目資料行。
其有助於動態探索清單結構。

實用參數：
- `parameters`：相依值，例如 `{ "dataset": "<site-url>",
  "table": "<list-id>" }`。
- `propertyName`：檢視精簡回應後請求單一欄位。
- `includeRaw`：僅在需要時包含原始連接器結構描述；其內容可能很大。

---

## 執行歷程記錄與監視

### `get_live_flow_runs`

回應：直接傳回執行陣列（最新的排在前面）。
```json
[{
  "name": "<run-id>",
  "status": "Succeeded|Failed|Running|Cancelled",
  "startTime": "2026-02-25T06:13:38Z",
  "endTime": "2026-02-25T06:14:02Z",
  "triggerName": "Recurrence",
  "error": null
}]
```

> `top` 預設為 **30**，並針對較大數值自動分頁。為每 5 分鐘執行一次的
> 流程設定 `top: 300`，可涵蓋 24 小時的記錄。
>
> 執行識別碼欄位為 **`name`**（非 `runName`）。在其他工具中請將此值
> 作為 `runName` 參數使用。

### `get_live_flow_run_error`

回應：失敗執行的結構化錯誤明細。
```json
{
  "runName": "08584296068667933411438594643CU15",
  "failedActions": [
    {
      "actionName": "Apply_to_each_prepare_workers",
      "status": "Failed",
      "error": {"code": "ActionFailed", "message": "An action failed."},
      "code": "ActionFailed",
      "startTime": "2026-02-25T06:13:52Z",
      "endTime": "2026-02-25T06:15:24Z"
    },
    {
      "actionName": "HTTP_find_AD_User_by_Name",
      "status": "Failed",
      "code": "NotSpecified",
      "startTime": "2026-02-25T06:14:01Z",
      "endTime": "2026-02-25T06:14:05Z"
    }
  ],
  "allActions": [
    {"actionName": "Apply_to_each", "status": "Skipped"},
    {"actionName": "Compose_WeekEnd", "status": "Succeeded"},
    {"actionName": "HTTP_find_AD_User_by_Name", "status": "Failed"}
  ]
}
```

> `failedActions` 的順序是由外到內 --- **最後一個項目是根本原因**。
> 請使用 `failedActions[-1]["actionName"]` 作為診斷的起點。

### `get_live_flow_run_action_outputs`

回應：動作詳細資訊物件的陣列。
```json
[
  {
    "actionName": "Compose_WeekEnd_now",
    "status": "Succeeded",
    "startTime": "2026-02-25T06:13:52Z",
    "endTime": "2026-02-25T06:13:52Z",
    "error": null,
    "inputs": "Mon, 25 Feb 2026 06:13:52 GMT",
    "outputs": "Mon, 25 Feb 2026 06:13:52 GMT"
  }
]
```

> **`actionName` 為選填**：省略時會傳回執行中的最上層動作。
> 提供時則傳回特定動作。若該動作在 foreach 內部執行，此工具
> 可能傳回該動作在跨反覆項目中的每次重複；傳遞
> `iterationIndex` 可定位至特定的以零為基底反覆項目。
>
> 對於大量資料動作，輸出可能非常龐大（50 MB+）。請使用 120 秒以上的逾時。

---

## 執行控制

### `resubmit_live_flow_run`

回應：`{ flowKey, resubmitted: true, runName, triggerName }`

### `cancel_live_flow_run`

取消處於 `Running` 狀態的流程執行。

> 請勿取消等候調適型卡片回應的執行 --- 當 Teams 卡片
> 等候使用者輸入時，狀態為 `Running` 屬正常現象。

---

## HTTP 觸發程序工具

### `get_live_flow_http_schema`

已淘汰。偏好使用 `get_live_flow` 並直接從定義中檢視
`Request` 觸發程序的 `inputs.schema` 以及任何 `Response` 動作。

回應索引鍵：
```
flowKey            - Flow GUID
displayName        - Flow display name
triggerName        - Trigger action name (e.g. "manual")
triggerType        - Trigger type (e.g. "Request")
triggerKind        - Trigger kind (e.g. "Http")
requestMethod      - HTTP method (e.g. "POST")
relativePath       - Relative path configured on the trigger (if any)
requestSchema      - JSON schema the trigger expects as POST body
requestHeaders     - Headers the trigger expects
responseSchemas    - Array of JSON schemas defined on Response action(s)
responseSchemaCount - Number of Response actions that define output schemas
```

> 請求主體結構描述位於 `requestSchema`（而非 `triggerSchema`）。

### `get_live_flow_trigger_url`

已淘汰。當需要執行流程時，偏好使用 `trigger_live_flow`；它會針對
HTTP 觸發程序在內部擷取回呼 URL，並針對沒有回呼 URL 的 Button
與 PowerApps 觸發程序使用連接器執行階段。

傳回 HTTP 觸發流程的已簽署回呼 URL。回應包括
`flowKey`、`triggerName`、`triggerType`、`triggerKind`、`triggerMethod`、`triggerUrl`。

### `trigger_live_flow`

回應索引鍵：`flowKey`、`triggerName`、`triggerKind`、`invocation`、`triggerUrl`、
`requiresAadAuth`、`authType`、`responseStatus`、`responseBody`、`runName`，以及
在未提供必要觸發程序輸入時的 `warning`。

> **適用於 `Request` 觸發程序（HTTP 請求、Button、PowerApps）以及
> 排程（Recurrence）流程。** 排程流程會立即執行，如同入口網站的
> 「執行流程」按鈕，且不接受 `body` — 若提供會被拒絕。自動化
> 連接器觸發程序只會從其來源事件觸發，否則會傳回錯誤。
>
> HTTP 觸發程序透過已簽署的回呼 URL 進行（`invocation: callbackUrl`）。
> Button 與 PowerApps 觸發程序沒有回呼 URL；當帶有 `body` 時，它們會
> 透過 Power Platform 連接器執行階段執行（`connectorFlowToken` 或
> `connectorApihubToken`），這是傳遞輸入的唯一途徑。
> 未帶有主體時，它們會使用成本較低的直接執行（`directRun`）。
>
> `runName` 僅針對連接器執行階段的執行傳回。否則請使用
> `get_live_flow_runs` 查詢該次執行。
>
> Power Automate 不會強制執行觸發程序的 `required` 清單。遺漏輸入
> 仍會以 null 值啟動執行；`warning` 會指名遺漏的索引鍵以及
> 用於重試的主體形式。
>
> 瀏覽器擴充功能金鑰無法存取連接器執行階段，因此 Button 與
> PowerApps 觸發程序在該金鑰類型下只能以空白主體執行。錯誤
> 訊息會列出替代方案（重新提交過去的執行、在流程內部使用
> `coalesce()` 為輸入設定預設值，或使用標準金鑰）。
>
> `responseStatus` + `responseBody` 包含流程的 Response 動作輸出。
> AAD 驗證的觸發程序會自動處理。
>
> **內容類型**：`body` 以 `application/json` 傳送，因此 `triggerBody()` 與
> 觸發程序結構描述會如實接收傳入的物件。於 2026-08-27 在伺服器 1.2.43 上
> 針對具有 `required` 結構描述的 Button、PowerAppV2 與 Skills 觸發程序驗證完成。

---

## 流程狀態管理

### `set_live_flow_state`

在您具有存取權限的任何環境中啟動或停止 Power Automate 流程。
會先讀取目前狀態，且僅在確實需要變更時才發出啟動/停止
呼叫。

參數：`environmentName`、`flowName`、`state`（`"Started"` | `"Stopped"`）— 皆為必要。

回應：
```json
{
  "flowName": "6321ab25-7eb0-42df-b977-e97d34bcb272",
  "environmentName": "Default-26e65220-...",
  "requestedState": "Started",
  "actualState": "Started"
}
```

> **請使用此工具** — 而非 `update_live_flow` — 來啟動或停止流程。
> `update_live_flow` 僅會變更 displayName/definition；PA API 會忽略
> 透過該端點傳遞的狀態。

### `set_store_flow_state`

透過即時 PA API 啟動或停止流程，**並**將更新後的狀態保存回
Power Clarity 快取中。與 `set_live_flow_state` 具有相同參數，但需要
Power Clarity 工作區。

回應（與 `set_live_flow_state` 形式不同）：
```json
{
  "flowKey": "<environmentId>.<flowId>",
  "requestedState": "Stopped",
  "currentState": "Stopped",
  "flow": { /* 完整的 gFlows 記錄，與 get_store_flow 形式相同 */ }
}
```

> 當您僅需要切換狀態時，偏好使用 `set_live_flow_state` — 它更簡單
> 且沒有訂閱要求。
>
> 當您需要立即更新快取（無需等待下一次每日掃描）**且**希望在
> 同一次呼叫中取回完整的已更新控管記錄時，請使用
> `set_store_flow_state` — 這對停止流程並立即加上標籤或進行檢查
> 的工作流程非常有用。

---

## Store 工具 --- 僅限 FlowStudio for Teams

### `get_store_flow_summary`

回應：彙總的執行統計資料。
```json
{
  "totalRuns": 100,
  "failRuns": 10,
  "failRate": 0.1,
  "averageDurationSeconds": 29.4,
  "maxDurationSeconds": 158.9,
  "firstFailRunRemediation": "<hint or null>"
}
```

### `get_store_flow_runs`

過去 N 天的快取執行歷程記錄，包含執行時間與補救提示。

### `get_store_flow_errors`

快取的僅失敗執行，包含失敗的動作名稱與補救提示。

### `get_store_flow_trigger_url`

來自快取的觸發程序 URL（即時，無 PA API 呼叫）。

### `update_store_flow`

更新控管中繼資料（描述、標籤、監視旗標、通知規則、商業影響）。

### `list_store_makers` / `get_store_maker`

Maker（平民開發人員）探索與詳細資訊。

### `list_store_power_apps`

從快取中列出所有 Power Apps 畫布應用程式。

---

## 行為說明

透過實際 API 使用所發現的非顯而易見行為。這些是
工具結構描述無法告訴您的事項。

### `get_live_flow_run_action_outputs`
- **`actionName` 為選填**：省略以取得最上層動作，提供以取得單一
  動作。對於 foreach 迴圈內的動作，指定名稱的動作可能會傳回多個
  重複項；請使用 `iterationIndex` 定位至特定反覆項目。
- 大量資料動作的輸出可能達到 50 MB+ --- 請一律使用 120 秒以上的逾時。

### `update_live_flow`
- 必要欄位可能隨伺服器版本而異；在建立/更新前請透過 `tool_search`
  （`select:update_live_flow`）進行確認。若 `description` 為必要項，
  請在修補時保留現有描述。
- 回應中**一律存在** `error` 索引鍵 --- `null` 代表成功。
  請勿檢查 `if "error" in result`；請檢查 `result.get("error") is not None`。
- 建立時，`created` = 新流程的 GUID（字串）。更新時，`created` = `false`。
- **無法變更流程狀態。** 僅更新 displayName、definition 以及
  connectionReferences。請使用 `set_live_flow_state` 來啟動/停止流程。

### `trigger_live_flow`
- **適用於 HTTP、Button、PowerApps 以及排程（Recurrence）觸發程序。**
  排程流程在無 `body` 的情況下執行。自動化連接器觸發程序則會報錯。
- 將觸發程序輸入作為 `body` 傳遞。結果中的 `warning` 代表遺漏了必要輸入，
  且該次執行是以該值為 null 啟動的。
- AAD 驗證的觸發程序會自動處理（附加 Bearer 權杖）。

### `get_live_flow_runs`
- `top` 預設為 **30**，針對較大數值會自動分頁。
- 執行識別碼欄位為 `name`，而非 `runName`。在其他工具中將此值用作 `runName`。
- 傳回的執行依最新到最舊排序。

### Teams `PostMessageToConversation`（透過 `update_live_flow`）
- **「Chat with Flow bot」**：`body/recipient` = `"user@domain.com;"`（結尾帶分號的字串）。
- **「Channel」**：`body/recipient` = `{"groupId": "...", "channelId": "..."}`（物件）。
- `poster`：Workflows 機器人身分為 `"Flow bot"`，使用者身分為 `"User"`。

### `list_live_connections`
- `environmentName` 為必要項；此平台無法跨環境列出連線。
  `top` 會在 `search` 之後套用，當上限截斷符合項時，結果會帶有
  `truncated` + `matchedCount`。
- 使用 `search=<connector/account>` 取得較小的輸出以及可直接貼上的
  `connectionReferenceTemplate` / `hostTemplate` 值。
- `id` 是您在 `connectionReferences` 中所需的 `connectionName` 值。
- `connectorName` 對應至 apiId：`"/providers/Microsoft.PowerApps/apis/" + connectorName`。
