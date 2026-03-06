# FlowStudio MCP — 工具回應目錄 (Tool Response Catalog)

FlowStudio Power Automate MCP 伺服器的回應格式與行為備註。

> **關於工具名稱與參數**：請務必在伺服器上呼叫 `tools/list`。
> 它會傳回每個工具的授權且最新的結構描述。
> 本文件涵蓋了 `tools/list` **無法** 告訴您的內容：透過實際使用發現的 **回應格式** 
> 與 **非顯而易見的行為**。

---

## 真實來源 (Source of Truth)

| 優先順序 | 來源 | 涵蓋範圍 |
|----------|--------|--------|
| 1 | **真實 API 回應** | 始終信任伺服器實際傳回的內容 |
| 2 | **`tools/list`** | 工具名稱、參數名稱、類型、必要旗標 |
| 3 | **本文件** | 回應格式、行為說明、注意事項 |

> 如果本文件與 `tools/list` 或真實的 API 行為不符，
> 以 API 為準。請據此更新本文件。

---

## 環境與租用戶探索 (Environment & Tenant Discovery)

### `list_live_environments`

回應：環境的直接陣列。
```json
[
  {
    "id": "Default-26e65220-5561-46ef-9783-ce5f20489241",
    "displayName": "FlowStudio (預設)",
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

> 在所有其他工具中，請將 `id` 值作為 `environmentName` 使用。

### `list_store_environments`

與 `list_live_environments` 格式相同，但從快取讀取 (速度較快)。

---

## 連線探索 (Connection Discovery)

### `list_live_connections`

回應：包含 `connections` 陣列的包裝物件。
```json
{
  "connections": [
    {
      "id": "shared-office365-9f9d2c8e-55f1-49c9-9f9c-1c45d1fbbdce",
      "displayName": "user@contoso.com",
      "connectorName": "shared_office365",
      "createdBy": "使用者名稱",
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
> 依狀態篩選：`statuses[0].status == "Connected"`。
>
> **注意**：`tools/list` 將 `environmentName` 標記為選填，但若省略它，伺服器
> 會傳回 `MissingEnvironmentFilter` (HTTP 400)。請務必傳遞 `environmentName`。

### `list_store_connections`

來自快取的相同連線資料。

---

## 流程探索與列出 (Flow Discovery & Listing)

### `list_live_flows`

回應：包含 `flows` 陣列的包裝物件。
```json
{
  "mode": "owner",
  "flows": [
    {
      "id": "0757041a-8ef2-cf74-ef06-06881916f371",
      "displayName": "我的流程",
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
  "error": null
}
```

> 透過 `result["flows"]` 存取。`id` 是純 UUID --- 直接作為 `flowName` 使用。
>
> `mode` 表示所使用的存取範圍 (`"owner"` 或 `"admin"`)。

### `list_store_flows`

回應：**直接陣列** (無包裝)。
```json
[
  {
    "id": "3991358a-f603-e49d-b1ed-a9e4f72e2dcb.0757041a-8ef2-cf74-ef06-06881916f371",
    "displayName": "管理員 | 同步範本 v3 (解決方案)",
    "state": "Started",
    "triggerType": "OpenApiConnectionWebhook",
    "environmentName": "3991358a-f603-e49d-b1ed-a9e4f72e2dcb",
    "runPeriodTotal": 100,
    "createdTime": "2023-08-18T01:18:17Z",
    "lastModifiedTime": "2023-08-18T12:47:42Z"
  }
]
```

> **`id` 格式**：`envId.flowId` --- 在第一個 `.` 處分割以擷取流程 UUID：
> `flow_id = item["id"].split(".", 1)[1]`

### `get_store_flow`

回應：來自快取的單一流程 Metadata (選定欄位)。
```json
{
  "id": "envId.flowId",
  "displayName": "我的流程",
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
  "description": "流程描述",
  "tier": "Premium",
  "complexity": "{...}",
  "actions": 42,
  "connections": ["sharepointonline", "office365"],
  "owners": ["user@contoso.com"],
  "createdBy": "user@contoso.com"
}
```

> `runPeriodDurationAverage` / `runPeriodDurationMax` 的單位為 **毫秒** (除以 1000 即為秒)。
> `runError` 是一個 **JSON 字串** --- 請使用 `json.loads()` 解析。

---

## 流程定義 (即時 API)

### `get_live_flow`

回應：來自 PA API 的完整流程定義。
```json
{
  "name": "<flow-guid>",
  "properties": {
    "displayName": "我的流程",
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

**建立模式**：省略 `flowName` --- 建立新流程。需要 `definition` 與 `displayName`。

**更新模式**：提供 `flowName` --- 修補 (PATCH) 現有流程。

回應：
```json
{
  "created": false,
  "flowKey": "envId.flowId",
  "updated": ["definition", "connectionReferences"],
  "displayName": "我的流程",
  "state": "Started",
  "definition": { "...完整定義..." },
  "error": null
}
```

> `error` **始終存在**，但可能為 `null`。請檢查 `result.get("error") is not None`。
>
> 建立時：`created` 為新流程的 GUID (字串)。更新時：`created` 為 `false`。
>
> `description` **始終為必要項** (建立與更新模式)。

### `add_live_flow_to_solution`

將非解決方案流程遷移至解決方案中。如果流程已在解決方案中則傳回錯誤。

---

## 執行歷程記錄與監視 (Run History & Monitoring)

### `get_live_flow_runs`

回應：執行的直接陣列 (最新的在前)。
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

> `top` 預設為 **30**，針對更高的值會自動分頁。針對每 5 分鐘執行一次的流程，
> 請設定 `top: 300` 以涵蓋 24 小時。
>
> 執行 ID 欄位為 **`name`** (並非 `runName`)。在其他工具中請將此值作為 `runName` 參數使用。

### `get_live_flow_run_error`

回應：針對失敗執行的結構化錯誤分析。
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

> `failedActions` 的順序是由外而內 --- **最後一個項目即為根源原因**。
> 使用 `failedActions[-1]["actionName"]` 作為診斷的起點。

### `get_live_flow_run_action_outputs`

回應：動作詳細資料物件的陣列。
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

> **`actionName` 為選填**：省略它將傳回執行中的「所有」動作；
> 提供它則僅傳回該動作的單一元素陣列。
>
> 針對大量資料動作，輸出可能會非常大 (50 MB+)。請使用 120 秒以上的逾時設定。

---

## 執行控制 (Run Control)

### `resubmit_live_flow_run`

回應：`{ flowKey, resubmitted: true, runName, triggerName }`

### `cancel_live_flow_run`

取消 `Running` 狀態的流程執行。

> 請勿取消正在等待自適應卡片回應的執行 --- 當 Teams 卡片正在等待使用者輸入時，
> `Running` 狀態是正常的。

---

## HTTP 觸發工具 (HTTP Trigger Tools)

### `get_live_flow_http_schema`

回應鍵值：
```
flowKey            - 流程 GUID
displayName        - 流程顯示名稱
triggerName        - 觸發動作名稱 (例如 "manual")
triggerType        - 觸發類型 (例如 "Request")
triggerKind        - 觸發種類 (例如 "Http")
requestMethod      - HTTP 方法 (例如 "POST")
relativePath       - 在觸發程序上設定的相對路徑 (如果有)
requestSchema      - 觸發程序預期作為 POST 主體的 JSON 結構描述
requestHeaders     - 觸發程序預期的標頭
responseSchemas    - 在回應動作上定義的 JSON 結構描述陣列
responseSchemaCount - 定義輸出結構描述的回應動作數量
```

> 請求主體結構描述位於 `requestSchema` (並非 `triggerSchema`)。

### `get_live_flow_trigger_url`

傳回 HTTP 觸發流程的已簽署回呼 URL。回應包含
`flowKey`、`triggerName`、`triggerType`、`triggerKind`、`triggerMethod`、`triggerUrl`。

### `trigger_live_flow`

回應鍵值：`flowKey`、`triggerName`、`triggerUrl`、`requiresAadAuth`、`authType`、
`responseStatus`、`responseBody`。

> **僅適用於 `Request` (HTTP) 觸發程序。** 針對週期間隔 (Recurrence) 
> 與其他觸發類型會傳回錯誤：`"only HTTP Request triggers can be invoked via this tool"`。
>
> `responseStatus` + `responseBody` 包含流程回應動作的輸出。
> 自動處理 AAD 驗證的觸發程序。

---

## 流程狀態管理 (Flow State Management)

### `set_store_flow_state`

啟動或停止流程。傳遞 `state: "Started"` 或 `state: "Stopped"`。

---

## 儲存工具 (Store Tools) --- 僅限 FlowStudio for Teams

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

過去 N 天的快取執行歷程記錄，包含持續時間與補救提示。

### `get_store_flow_errors`

僅限失敗的快取執行，包含失敗動作名稱與補救提示。

### `get_store_flow_trigger_url`

來自快取的觸發程序 URL (即時，無需呼叫 PA API)。

### `update_store_flow`

更新治理 Metadata (描述、標籤、監視旗標、通知規則、商務影響)。

### `list_store_makers` / `get_store_maker`

製作者 (公民開發者) 探索與詳細資料。

### `list_store_power_apps`

從快取列出所有 Power Apps 畫布應用程式。

---

## 行為備註 (Behavioral Notes)

透過實際 API 使用發現的非顯而易見行為。這些是 
`tools/list` 無法告訴您的內容。

### `get_live_flow_run_action_outputs`
- **`actionName` 為選填**：省略以取得所有動作，提供以取得單一動作。
  這會將回應從 N 個元素變更為 1 個元素 (仍為陣列)。
- 針對大量資料動作，輸出可能超過 50 MB --- 請務必使用 120 秒以上的逾時設定。

### `update_live_flow`
- `description` **始終為必要項** (建立與更新模式)。
- 回應中 **始終存在** `error` 鍵值 --- `null` 表示成功。
  請勿使用 `if "error" in result` 檢查；請檢查 `result.get("error") is not None`。
- 建立時，`created` = 新流程的 GUID (字串)。更新時，`created` = `false`。

### `trigger_live_flow`
- **僅適用於 HTTP Request 觸發程序。** 針對週期間隔、連接器與其他觸發類型會傳回錯誤。
- 自動處理 AAD 驗證的觸發程序 (模擬 Bearer 權杖)。

### `get_live_flow_runs`
- `top` 預設為 **30**，針對更高的值具備自動分頁功能。
- 執行 ID 欄位為 `name`，並非 `runName`。在其他工具中請將此值作為 `runName` 使用。
- 執行結果會以「最新的在前」順序傳回。

### Teams `PostMessageToConversation` (透過 `update_live_flow`)
- **「與流程機器人聊天」**：`body/recipient` = `"user@domain.com;"` (帶有尾隨分號的字串)。
- **「頻道」**：`body/recipient` = `{"groupId": "...", "channelId": "..."}` (物件)。
- `poster`：針對工作流程機器人身分使用 `"Flow bot"`，針對使用者身分使用 `"User"`。

### `list_live_connections`
- `id` 是您在 `connectionReferences` 中所需使用的 `connectionName` 值。
- `connectorName` 對應至 apiId：`"/providers/Microsoft.PowerApps/apis/" + connectorName`。
