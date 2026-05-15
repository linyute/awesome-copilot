# FlowStudio MCP — 工具回應目錄

FlowStudio Power Automate MCP 伺服器的回應形狀和行為備註。

> **對於工具名稱和參數**：建議優先使用 `list_skills` 和 `tool_search`。
> 它們會傳回重點明確且最新的結構描述，而不會一次載入所有的 MCP 工具。
> 僅在無法使用中繼工具時，才將 `tools/list` 作為低層級的後備方案。
> 此文件涵蓋了工具結構描述 **未** 告訴您的內容：透過實際使用發現的 **回應形狀**
> 和 **非顯著行為**。

---

## 資訊來源 (Source of Truth)

| 優先順序 | 來源 | 涵蓋範圍 |
|----------|--------|--------|
| 1 | **實際的 API 回應** | 始終相信伺服器實際傳回的內容 |
| 2 | **`list_skills` / `tool_search`** | 授權工具結構描述、參數名稱、類型、必填旗標 |
| 3 | **此文件** | 回應形狀、行為備註、陷阱 |

> 如果此文件與 `tool_search`、`tools/list` 或實際的 API 行為不符，以 API 為準。請相應地更新此文件。

---

## 環境與租用戶發現

### `list_live_environments`

回應：環境的直接陣列。
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

> 將 `id` 值用作所有其他工具中的 `environmentName`。

### `list_store_environments`

與 `list_live_environments` 形狀相同，但從快取中讀取 (速度更快)。

---

## 連線發現

### `list_live_connections`

回應：包含 `connections` 陣列的包裝物件。
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

> **關鍵欄位**：`id` 是 `connectionReferences` 中使用的 `connectionName` 值。
>
> **關鍵欄位**：`connectorName` 對應到 apiId：
> `"/providers/Microsoft.PowerApps/apis/" + connectorName`
>
> 依狀態篩選：存在時優先選用 `overallStatus == "Connected"`；否則
> 檢查 `statuses[0].status == "Connected"`。
>
> 對於建構工作流程，請傳遞 `environmentName` 以避免使用錯誤環境中的連線。僅在有意盤點所有環境中的連線時才省略它。
>
> 傳遞 `search=<連接器或帳號>` 以縮小輸出範圍，並接收可直接複製到 `update_live_flow` 中的 `connectionReferenceTemplate` 和 `hostTemplate` 值。

### `list_store_connections`

來自快取的相同連線資料。

---

## 流程發現與列出

### `list_live_flows`

回應：包含 `flows` 陣列的包裝物件。
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
      "owners": "<aad-物件-id>",
      "definitionAvailable": true
    }
  ],
  "totalCount": 100,
  "nextLink": null,
  "error": null
}
```

> 透過 `result["flows"]` 存取。`id` 是純 UUID — 直接用作 `flowName`。
>
> `mode` 指出使用的存取範圍 (`"owner"` 或 `"admin"`)。
>
> 較新伺服器版本中新增的參數：
> - `search`：在伺服器端依顯示名稱進行篩選。
> - `mode`：`owner` 代表 MCP 身分擁有的流程；`admin` 代表管理員帳戶可見的所有流程。
> - `timeoutSeconds`：在非常大型的環境中，不需等待，直接傳回包含 `nextLink` 的部分結果。
> - `continuationUrl`：傳遞先前的 `nextLink` 以繼續同一個查詢。

### `list_store_flows`

回應：**直接陣列** (無包裝)。
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

> **`id` 格式**：`<environmentId>.<flowId>` — 在第一個 `.` 處分割以擷取流程 UUID：
> `flow_id = item["id"].split(".", 1)[1]`

### `get_store_flow`

回應：來自快取的單一流程 Metadata (選定欄位)。
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
  "runError": "{\"code\": \"EACCES\", ...}",
  "description": "流程說明",
  "tier": "Premium",
  "complexity": "{...}",
  "actions": 42,
  "connections": ["sharepointonline", "office365"],
  "owners": ["user@contoso.com"],
  "createdBy": "user@contoso.com"
}
```

> `runPeriodDurationAverage` / `runPeriodDurationMax` 的單位為 **毫秒** (需除以 1000)。
> `runError` 是一個 **JSON 字串** — 請使用 `json.loads()` 進行解析。

---

## 流程定義 (Live API)

### `get_live_flow`

回應：來自 Power Automate API 的完整流程定義。
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

**建立模式 (Create mode)**：省略 `flowName` — 建立一個新流程。`definition` 和 `displayName` 為必填。

**更新模式 (Update mode)**：提供 `flowName` — 對現有流程執行 PATCH。

回應：
```json
{
  "created": false,
  "flowKey": "<environmentId>.<flowId>",
  "updated": ["definition", "connectionReferences"],
  "displayName": "My Flow",
  "state": "Started",
  "definition": { "...完整定義..." },
  "error": null
}
```

> `error` 在回應中 **始終存在**，但可能為 `null`。請檢查 `result.get("error") is not None`。
>
> 建立時：`created` 是新的流程 GUID (字串)。更新時：`created` 為 `false`。
>
> 必填欄位可能隨伺服器版本而異。在建立或修補流程之前，請配合使用 `select:update_live_flow` 執行 `tool_search`；如果 `description` (說明) 為必填，請在修補時包含新的說明或來自 `get_live_flow` 的現有說明。
>
> 在目前的結構描述中，流程說明是工作流程定義的一部分 (`definition.description`)，而不是頂層工具引數。

### `add_live_flow_to_solution`

將非解決方案流程遷移到解決方案中。如果流程已在解決方案中，則傳回錯誤。

在建立必須可作為代理程式工具發現的 Copilot Studio 技能觸發流程後，請使用此工具。傳遞目標解決方案的 `solutionId`。如果伺服器支援省略 `solutionId`，它將使用環境的預設解決方案；對於生產環境的 ALM (應用程式生命週期管理)，建議優先選用明確的非受控解決方案。

此工具僅變更解決方案成員身分。它不會驗證觸發器結構描述、發佈 Copilot Studio 代理程式，或證明該流程可被代理程式呼叫。

---

## 連接器操作發現

### `describe_live_connector`

說明連接器/API 及其操作。在建立連接器動作之前請使用它，而不是猜測操作 JSON。

常見模式：

| 呼叫形狀 | 用途 |
|---|---|
| 不帶 `connectorName` 使用 `search="send email"` | 跨連接器搜尋操作 |
| `connectorName="shared_sharepointonline"` | 單一連接器的精簡操作目錄 |
| `operationId="GetItems"` | 單一操作的擴展結構描述 |
| `variant="flowbot_chat"` | 單一操作變體的作者撰寫範例 |

操作詳細資訊可包含：
- `hint`：來自連接器提示表的作者撰寫指引。
- `exampleDefinition`：可用時提供可直接複製的動作/觸發器形狀。
- 帶有 `nextTool=get_live_dynamic_options` 或
  `nextTool=get_live_dynamic_properties` 的動態 Metadata。

### `get_live_dynamic_options`

解析連接器參數的即時下拉選單/清單選項。對於從清單中選取的 ID，例如 SharePoint 網站/清單、Teams 小組/頻道，或其他 `x-ms-dynamic-list` / `x-ms-dynamic-values` 參數，請使用此工具。

請傳遞由 `describe_live_connector` 傳回的 `dynamicMetadata` 物件、來自 `list_live_connections` 的連線 ID，以及任何已解析的相依參數。

### `get_live_dynamic_properties`

解析連接器參數的即時結構描述/欄位屬性。在得知網站和清單後，對於動態欄位集（例如 SharePoint 清單項目欄位），請使用此工具。

實用參數：
- `parameters`：相依值，例如 `{ "dataset": "<網站-url>", "table": "<清單-id>" }`。
- `propertyName`：在檢查精簡回應後，請求一個欄位。
- `includeRaw`：僅在需要時包含原始連接器結構描述；它可能會非常大。

---

## 執行歷程記錄與監控

### `get_live_flow_runs`

回應：執行的直接陣列 (最新在前)。
```json
[{
  "name": "<執行-id>",
  "status": "Succeeded|Failed|Running|Cancelled",
  "startTime": "2026-02-25T06:13:38Z",
  "endTime": "2026-02-25T06:14:02Z",
  "triggerName": "Recurrence",
  "error": null
}]
```

> `top` 預設為 **30**，並會針對較大的值自動進行分頁。對於每 5 分鐘執行一次的流程，設定 `top: 300` 可獲得 24 小時的涵蓋範圍。
>
> 執行 ID 欄位是 **`name`** (而不是 `runName`)。請在其他工具中將此值用作 `runName` 參數。

### `get_live_flow_run_error`

回應：失敗執行的結構化錯誤明細。
```json
{
  "runName": "08584296068667933411438594643CU15",
  "failedActions": [
    {
      "actionName": "Apply_to_each_prepare_workers",
      "status": "Failed",
      "error": {"code": "ActionFailed", "message": "動作失敗。"},
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

> `failedActions` 的順序是由外而內 — **最後一個項目是根本原因**。
> 使用 `failedActions[-1]["actionName"]` 作為診斷的起點。

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

> **`actionName` 是選填的**：省略它將傳回執行中的頂層動作。
> 提供它則針對特定動作。如果該動作在 foreach 迴圈內執行，工具可能會傳回該動作在所有反覆運算中的每次重複；傳遞 `iterationIndex` 可固定到一次以零為基準的反覆運算。
>
> 對於大數據動作，輸出可能非常大 (50 MB+)。請使用 120 秒以上的逾時設定。

---

## 執行控制

### `resubmit_live_flow_run`

回應：`{ flowKey, resubmitted: true, runName, triggerName }`

### `cancel_live_flow_run`

取消正在處於 `Running` (執行中) 狀態的流程執行。

> 切勿取消正在等待調適型卡片回應的執行 — 當 Teams 卡片正在等待使用者輸入時，狀態為 `Running` 是正常的。

---

## HTTP 觸發器工具

### `get_live_flow_http_schema`

已過期。建議優先選用 `get_live_flow`，並直接從定義中檢查 `Request` 觸發器的 `inputs.schema` 加上任何 `Response` 動作。

回應索引鍵：
```
flowKey            - 流程 GUID
displayName        - 流程顯示名稱
triggerName        - 觸發器動作名稱 (例如 "manual")
triggerType        - 觸發器類型 (例如 "Request")
triggerKind        - 觸發器種類 (例如 "Http")
requestMethod      - HTTP 方法 (例如 "POST")
relativePath       - 觸發器上設定的相對路徑 (如有)
requestSchema      - 觸發器預期作為 POST 本文的 JSON 結構描述
requestHeaders     - 觸發器預期的標頭
responseSchemas    - 在「回應」動作上定義的 JSON 結構描述陣列
responseSchemaCount - 定義輸出結構描述的「回應」動作數量
```

> 請求本文結構描述位於 `requestSchema` 中 (不是 `triggerSchema`)。

### `get_live_flow_trigger_url`

已過期。當您需要調用 HTTP 觸發流程時，建議優先使用 `trigger_live_flow`；它會在內部擷取目前的回呼 URL。

傳回 HTTP 觸發流程的已簽署回呼 URL。回應包含 `flowKey`, `triggerName`, `triggerType`, `triggerKind`, `triggerMethod`, `triggerUrl`。

### `trigger_live_flow`

回應索引鍵：`flowKey`, `triggerName`, `triggerUrl`, `requiresAadAuth`, `authType`,
`responseStatus`, `responseBody`。

> **僅適用於 `Request` (HTTP) 觸發器。** 對於定期執行和其他觸發器類型，會傳回錯誤：`"only HTTP Request triggers can be invoked via this tool"` (僅 HTTP 要求觸發器可透過此工具調用)。
> `Button` 類型的觸發器會傳回 `ListCallbackUrlOperationBlocked`。
>
> `responseStatus` + `responseBody` 包含流程的「回應」動作輸出。
> 自動處理經 AAD 驗證的觸發器。
>
> **內容類型備註**：本文是以 `application/octet-stream` (原始) 格式傳送的，而不是 `application/json`。具有包含 `required` (必填) 欄位之觸發器結構描述的流程，將會因 `InvalidRequestContent` (400) 而拒絕請求，因為 Power Automate 會在根據結構描述進行解析之前驗證 `Content-Type`。沒有結構描述的流程，或旨在接受原始輸入的流程（例如內部解析本文的 Baker 模式流程），將能正常運作。流程會收到 JSON 作為 Base64 編碼的 `$content`，並帶有 `$content-type: application/octet-stream`。

---

## 流程狀態管理

### `set_live_flow_state`

透過即時 Power Automate API 啟動或停止 Power Automate 流程。**不需要** Power Clarity 工作區 — 適用於模擬帳戶可以存取的任何流程。
先讀取目前狀態，僅在確實需要變更時才發出啟動/停止呼叫。

參數：`environmentName`、`flowName`、`state` (`"Started"` | `"Stopped"`) — 皆為必填。

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
> `update_live_flow` 僅變更 displayName/definition；Power Automate API 會忽略透過該端點傳遞的狀態。

### `set_store_flow_state`

透過即時 Power Automate API 啟動或停止流程，**並** 將更新後的狀態持久化回 Power Clarity 快取。參數與 `set_live_flow_state` 相同，但需要 Power Clarity 工作區。

回應（形狀與 `set_live_flow_state` 不同）：
```json
{
  "flowKey": "<environmentId>.<flowId>",
  "requestedState": "Stopped",
  "currentState": "Stopped",
  "flow": { /* 完整的 gFlows 記錄，形狀與 get_store_flow 相同 */ }
}
```

> 當您只需要切換狀態時，建議優先選用 `set_live_flow_state` — 它更簡單且沒有訂閱要求。
>
> 當您需要立即更新快取（而不必等待下一次每日掃描），且希望在同一次呼叫中取回完整的更新治理記錄時，請使用 `set_store_flow_state` — 適用於停止流程並立即對其標記或檢查的工作流程。

---

## Store 工具 — 僅限 FlowStudio for Teams

### `get_store_flow_summary`

回應：彙總的執行統計資料。
```json
{
  "totalRuns": 100,
  "failRuns": 10,
  "failRate": 0.1,
  "averageDurationSeconds": 29.4,
  "maxDurationSeconds": 158.9,
  "firstFailRunRemediation": "<提示或 null>"
}
```

### `get_store_flow_runs`

過去 N 天的快取執行歷程記錄，包含持續時間和補救提示。

### `get_store_flow_errors`

僅包含失敗執行的快取，包含失敗動作名稱和補救提示。

### `get_store_flow_trigger_url`

來自快取的觸發 URL（即時，無 Power Automate API 呼叫）。

### `update_store_flow`

更新治理 Metadata (說明、標記、監控旗標、通知規則、業務影響)。

### `list_store_makers` / `get_store_maker`

製作者（公民開發者）發現與詳細資訊。

### `list_store_power_apps`

從快取中列出所有 Power Apps 畫布應用程式。

---

## 行為備註

透過實際 API 使用發現的非顯著行為。這些是工具結構描述無法告訴您的內容。

### `get_live_flow_run_action_outputs`
- **`actionName` 是選填的**：省略以取得頂層動作，提供以取得單一動作。對於 foreach 迴圈內部的動作，具名動作可能會傳回多次重複；使用 `iterationIndex` 可固定到一次反覆運算。
- 對於大數據動作，輸出可能超過 50 MB — 務必使用 120 秒以上的逾時設定。

### `update_live_flow`
- 必填欄位可能隨伺服器版本而異；在建立/更新前請配合使用 `select:update_live_flow` 執行 `tool_search`。如果 `description` 為必填，請在修補時保留現有說明。
- 回應中 **始終存在** `error` 索引鍵 — `null` 代表成功。
  請勿使用 `if "error" in result` 進行檢查；應檢查 `result.get("error") is not None`。
- 建立時，`created` = 新流程 GUID (字串)。更新時，`created` = `false`。
- **無法變更流程狀態。** 僅更新 displayName, definition, 和 connectionReferences。請使用 `set_live_flow_state` 來啟動/停止流程。

### `trigger_live_flow`
- **僅適用於 HTTP Request 觸發器。** 對於定期執行、連接器及其他觸發器類型，會傳回錯誤。
- 自動處理 AAD 驗證的觸發器 (模擬 Bearer 權杖)。

### `get_live_flow_runs`
- `top` 預設為 **30**，並針對較大的值提供自動分頁。
- 執行 ID 欄位是 `name`，而不是 `runName`。請在其他工具中將此值用作 `runName`。
- 執行記錄是最新在前傳回的。

### Teams `PostMessageToConversation` (透過 `update_live_flow`)
- **"與流程機器人聊天"**：`body/recipient` = `"user@domain.com;"` (帶有結尾分號的字串)。
- **"頻道"**：`body/recipient` = `{"groupId": "...", "channelId": "..."}` (物件)。
- `poster`：Workflows 機器人身分使用 `"Flow bot"`，使用者身分使用 `"User"`。

### `list_live_connections`
- 對於建構工作流程，請傳遞 `environmentName`；省略它將盤點所有環境中的連線。
- 使用 `search=<連接器/帳號>` 以獲得較小的輸出，以及可直接貼上的 `connectionReferenceTemplate` / `hostTemplate` 值。
- `id` 是您在 `connectionReferences` 中為 `connectionName` 需要的值。
- `connectorName` 對應到 apiId：`"/providers/Microsoft.PowerApps/apis/" + connectorName`。
