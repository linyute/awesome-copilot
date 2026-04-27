# FlowStudio MCP — 工具回應目錄 (Tool Response Catalog)

FlowStudio Power Automate MCP 伺服器的回應形狀與行為備註。

> **關於工具名稱與參數**：請務必呼叫伺服器上的 `tools/list`。
> 它回傳每個工具的權威且最新的結構描述。
> 本文件涵蓋 `tools/list` 沒有告訴您的內容：**回應形狀** 與透過實際使用發現的 **非明顯行為**。

---

## 真理來源 (Source of Truth)

| 優先順序 | 來源 | 涵蓋內容 |
|----------|--------|--------|
| 1 | **實際 API 回應** | 一律信任伺服器實際回傳的內容 |
| 2 | **`tools/list`** | 工具名稱、參數名稱、型別、必要旗標 |
| 3 | **本文件** | 回應形狀、行為備註、陷阱 |

> 如果本文件與 `tools/list` 或實際的 API 行為有衝突，請以 API 為準。請據此更新本文件。

---

## 環境與租用戶探索

### `list_live_environments`

回應：環境直接陣列。
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

> 在所有其他工具中，將 `id` 值用作 `environmentName`。

### `list_store_environments`

形狀與 `list_live_environments` 相同，但從快取讀取（較快）。

---

## 連接探索

### `list_live_connections`

回應：包含 `connections` 陣列的封裝物件。
```json
{
  "connections": [
    {
      "id": "shared-office365-9f9d2c8e-55f1-49c9-9f9c-1c45d1fbbdce",
      "displayName": "user@contoso.com",
      "connectorName": "shared_office365",
      "createdBy": "User Name",
      "statuses": [{"status": "Connected"}],
      "createdTime": "2024-03-12T21:23:55.206815Z"
    }
  ],
  "totalCount": 56,
  "error": null
}
```

> **關鍵欄位**：`id` 是在 `connectionReferences` 中使用的 `connectionName` 值。
>
> **關鍵欄位**：`connectorName` 對應至 apiId：
> `"/providers/Microsoft.PowerApps/apis/" + connectorName`
>
> 依狀態過濾：`statuses[0].status == "Connected"`。
>
> **注意**：`tools/list` 將 `environmentName` 標記為選用，但如果您省略它，伺服器會回傳 `MissingEnvironmentFilter` (HTTP 400)。請務必傳遞 `environmentName`。

### `list_store_connections`

來自快取的相同連接資料。

---

## 流程探索與清單

### `list_live_flows`

回應：包含 `flows` 陣列的封裝物件。
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
  "error": null
}
```

> 透過 `result["flows"]` 存取。`id` 為純 UUID — 直接當作 `flowName` 使用。
>
> `mode` 指示所使用的存取範圍 (`"owner"` 或 `"admin"`)。

### `list_store_flows`

回應：**直接陣列**（無封裝）。
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

> **`id` 格式**：`<environmentId>.<flowId>` — 以第一個 `.` 分割以擷取流程 UUID：
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
  "runError": "{\"code\": \"EACCES\", ...}",
  "description": "Flow description",
  "tier": "Premium",
  "complexity": "{...}",
  "actions": 42,
  "connections": ["sharepointonline", "office365"],
  "owners": ["user@contoso.com"],
  "createdBy": "user@contoso.com"
}
```

> `runPeriodDurationAverage` / `runPeriodDurationMax` 的單位為 **毫秒** (除以 1000)。
> `runError` 為 **JSON 字串** — 請使用 `json.loads()` 解析。

---

## 流程定義 (即時 API)

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

**建立模式**：省略 `flowName` — 建立新流程。必需 `definition` 和 `displayName`。

**更新模式**：提供 `flowName` — PATCH 現有流程。

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

> `error` **一律存在** 但可能是 `null`。請檢查 `result.get("error") is not None`。
>
> 建立時：`created` 為新流程 GUID (字串)。更新時：`created` 為 `false`。
>
> `description` **一律為必要** (建立與更新模式)。

### `add_live_flow_to_solution`

將非解決方案的流程遷移至解決方案中。若已在解決方案中，則回傳錯誤。

---

## 執行歷程記錄與監控

### `get_live_flow_runs`

回應：執行記錄的直接陣列（最新的在前）。
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

> `top` 預設為 **30**，對於較高數值會自動分頁。若需 24 小時覆蓋率（針對每 5 分鐘執行一次的流程），請設定 `top: 300`。
>
> 執行 ID 欄位為 **`name`** (非 `runName`)。在其他工具中請使用此值作為 `runName` 參數。

### `get_live_flow_run_error`

回應：失敗執行的結構化錯誤詳細資料。
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

> `failedActions` 依外層至內層排序 — **最後一項為根本原因**。
> 使用 `failedActions[-1]["actionName"]` 作為診斷的起點。

### `get_live_flow_run_action_outputs`

回應：動作詳細物件陣列。
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

> **`actionName` 為選用**：省略可回傳執行中的所有動作；提供則僅回傳該動作的單一元素陣列。
> 針對大型資料動作，輸出可能非常巨大 (50 MB+)。請使用 120 秒以上的逾時設定。

---

## 執行控制

### `resubmit_live_flow_run`

回應：`{ flowKey, resubmitted: true, runName, triggerName }`

### `cancel_live_flow_run`

取消當前執行的流程執行記錄。

> 請勿取消等待調適型卡片回應的執行記錄 — 狀態 `Running` 是正常的，表示流程正在等待人工回應 Teams 卡片。取消它將導致遺失待處理的卡片。

---

## HTTP 觸發程序工具

### `get_live_flow_http_schema`

回應鍵：
```
flowKey            - 流程 GUID
displayName        - 流程顯示名稱
triggerName        - 觸發動作名稱 (例如 "manual")
triggerType        - 觸發型別 (例如 "Request")
triggerKind        - 觸發種類 (例如 "Http")
requestMethod      - HTTP 方法 (例如 "POST")
relativePath       - 觸發程序上設定的相對路徑 (如有)
requestSchema      - 觸發程序預期的 JSON 結構描述 (POST body)
requestHeaders     - 觸發程序預期的標頭
responseSchemas    - Response 動作定義的 JSON 結構描述陣列
responseSchemaCount - 定義輸出結構描述的 Response 動作數量
```

> 請求本文結構描述位於 `requestSchema` (而非 `triggerSchema`)。

### `get_live_flow_trigger_url`

回傳 HTTP 觸發流程的簽名回呼 URL。回應包含 `flowKey`, `triggerName`, `triggerType`, `triggerKind`, `triggerMethod`, `triggerUrl`。

### `trigger_live_flow`

回應鍵：`flowKey`, `triggerName`, `triggerUrl`, `requiresAadAuth`, `authType`,
`responseStatus`, `responseBody`。

> **僅適用於 `Request` (HTTP) 觸發程序。** 若用於 Recurrence、連接器及其他觸發程序型別，將回傳錯誤：`"only HTTP Request triggers can be invoked via this tool"`。
> `Button` 型別觸發程序會回傳 `ListCallbackUrlOperationBlocked`。
>
> `responseStatus` + `responseBody` 包含流程 Response 動作的輸出。
> AAD 驗證觸發程序會自動處理。
>
> **內容型別注意事項**：本文以 `application/octet-stream` (原始) 而非 `application/json` 傳送。具有包含 `required` 欄位的觸發結構描述的流程，會因為 PA 在根據結構描述解析前先驗證 `Content-Type` 而拒絕請求並回傳 `InvalidRequestContent` (400)。沒有結構描述的流程，或設計為接受原始輸入的流程 (例如內部解析本文的 Baker 模式流程)，將可正常運作。流程會收到以 Base64 編碼的 JSON，包含 `$content` 及 `$content-type: application/octet-stream`。

---

## 流程狀態管理

### `set_live_flow_state`

透過即時 PA API 啟動或停止 Power Automate 流程。**不需** Power Clarity 工作區 — 適用於任何經授權帳戶可存取的流程。會先讀取當前狀態，僅在確實需要變更時才發出啟動/停止呼叫。

參數：`environmentName`, `flowName`, `state` (`"Started"` | `"Stopped"`) — 皆為必要。

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
> `update_live_flow` 僅變更 displayName/definition；PA API 會忽略透過該端點傳遞的狀態。

### `set_store_flow_state`

透過即時 PA API 啟動或停止流程，**並** 將更新後的狀態保存回 Power Clarity 快取。參數與 `set_live_flow_state` 相同，但需要 Power Clarity 工作區。

回應 (形狀與 `set_live_flow_state` 不同)：
```json
{
  "flowKey": "<environmentId>.<flowId>",
  "requestedState": "Stopped",
  "currentState": "Stopped",
  "flow": { /* 完整的 gFlows 記錄，形狀與 get_store_flow 相同 */ }
}
```

> 當您需要立即更新快取 (無需等待下次每日掃描) **且** 需要在同一呼叫中取得完整更新的治理記錄時，請使用 `set_store_flow_state` — 這對於停止流程並立即標記或檢查其治理中繼資料的工作流程非常有用。
>
> 若只需切換狀態，建議使用 `set_live_flow_state` — 它更簡單且無需訂閱需求。

---

## 儲存區工具 (僅限 FlowStudio for Teams)

### `get_store_flow_summary`

回應：彙總執行統計資料。
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

包含持續時間與修復建議的快取執行歷程記錄 (過去 N 天)。

### `get_store_flow_errors`

僅包含失敗的執行記錄，附帶動作名稱與修復建議。

### `get_store_flow_trigger_url`

來自快取的觸發程序 URL (即時，無需呼叫 PA API)。

### `update_store_flow`

更新治理中繼資料 (說明、標籤、監控旗標、通知規則、業務影響)。

### `list_store_makers` / `get_store_maker`

建立者 (公民開發者) 探索與詳細資料。

### `list_store_power_apps`

來自快取的所有 Power Apps 畫布應用程式清單。

---

## 行為備註

透過實際 API 使用發現的非明顯行為。這些是 `tools/list` 無法告訴您的內容。

### `get_live_flow_run_action_outputs`
- **`actionName` 為選用**：省略可回傳所有動作，提供則僅回傳一個。
  這會將回應從 N 個元素改為 1 個元素 (仍然是陣列)。
- 大量資料動作的輸出可能非常巨大 (50 MB+) — 一律使用 120 秒以上的逾時設定。

### `update_live_flow`
- `description` **一律為必要** (建立與更新模式)。
- 回應中 **一律存在** `error` 鍵 — `null` 表示成功。
  請勿檢查 `if "error" in result`；應檢查 `result.get("error") is not None`。
- 建立時：`created` = 新流程 GUID (字串)。更新時：`created` = `false`。
- **無法變更流程狀態**。僅更新 displayName、definition 和 connectionReferences。請使用 `set_live_flow_state` 來啟動/停止流程。

### `trigger_live_flow`
- **僅適用於 HTTP Request 觸發程序**。對 Recurrence、連接器及其他觸發程序型別回傳錯誤。
- AAD 驗證的觸發程序會自動處理 (模擬 Bearer 權杖)。

### `get_live_flow_runs`
- `top` 預設為 **30**，對更高數值會自動分頁。
- 執行 ID 欄位為 `name`，非 `runName`。請在其他工具中使用此值作為 `runName`。
- 執行記錄回傳順序為最新的在前。

### Teams `PostMessageToConversation` (透過 `update_live_flow`)
- **"Chat with Flow bot"**：`body/recipient` = `"user@domain.com;"` (帶有後綴分號的字串)。
- **"Channel"**：`body/recipient` = `{"groupId": "...", "channelId": "..."}` (物件)。
- `poster`：工作流程機器人身分設為 `"Flow bot"`，使用者身分設為 `"User"`。

### `list_live_connections`
- `id` 是您在 `connectionReferences` 中進行 `connectionName` 所需的值。
- `connectorName` 對應至 apiId：`"/providers/Microsoft.PowerApps/apis/" + connectorName`。
