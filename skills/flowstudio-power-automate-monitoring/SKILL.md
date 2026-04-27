---
name: flowstudio-power-automate-monitoring
description: >-
  使用 FlowStudio MCP 快取儲存區監控 Power Automate 流程健康狀況、追蹤失敗率並盤點租用戶資產。即時 API 僅回傳頂層執行狀態。儲存區工具可顯示彙總統計資料、包含修復建議的每次執行失敗詳細資訊、建立者活動以及 Power Apps 清單 — 全部來自快速的快取，對 PA API 沒有速率限制壓力。
  在被要求執行以下操作時載入此技能：檢查流程健康狀況、找出失敗的流程、取得失敗率、審查錯誤趨勢、列出所有已啟用監控的流程、檢查誰建立了流程、找出不活躍的建立者、盤點 Power Apps、查看環境或連接計數、取得流程摘要，或任何租用戶範圍的健康總覽。需要 FlowStudio for Teams 或 MCP Pro+ 訂閱 — 請參閱 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 監控

透過 FlowStudio MCP **快取儲存區**監控流程健康狀況、追蹤失敗率並盤點租用戶資產 — 快速讀取、無 PA API 速率限制，並豐富了治理中繼資料與修復建議。

> **需求：** [FlowStudio for Teams 或 MCP Pro+](https://mcp.flowstudio.app) 訂閱。
>
> **每次工作階段都請先呼叫 `tools/list`** 以確認工具名稱與參數。
> 本技能涵蓋回應形狀、行為備註與工作流程模式 — `tools/list` 無法告訴您的內容。如果本文件與 `tools/list` 或實際的 API 回應有衝突，請以 API 為準。

---

## 監控運作原理

Flow Studio 每天為每位訂閱者掃描 Power Automate API 並快取結果。分為兩個層級：

- **所有流程** 皆會掃描其中繼資料：定義、連接、擁有者、觸發程序型別與彙總執行統計資料 (`runPeriodTotal`, `runPeriodFailRate` 等)。環境、應用程式、連接與建立者也會一併掃描。
- **受監控流程** (`monitor: true`) 則會額外取得每次執行的詳細資訊：包含狀態、持續時間、失敗動作名稱與修復建議的個別執行記錄。這就是 `get_store_flow_runs`、`get_store_flow_errors` 和 `get_store_flow_summary` 資料的來源。

**資料新鮮度：** 檢查 `get_store_flow` 上的 `scanned` 欄位以查看流程上次掃描的時間。若資料過舊，掃描管線可能未執行。

**啟用監控：** 透過 `update_store_flow` 或 Flow Studio for Teams 應用程式設定 `monitor: true`
([如何選取流程](https://learn.flowstudio.app/teams-monitoring))。

**指定關鍵流程：** 對業務關鍵流程使用 `update_store_flow` 並設定 `critical=true`。這使得治理技能的通知規則管理能夠自動針對關鍵流程設定失敗警示。

---

## 工具

| 工具 | 用途 |
|---|---|
| `list_store_flows` | 列出具有失敗率與監控過濾器的流程 |
| `get_store_flow` | 完整快取記錄：執行統計、擁有者、層級、連接、定義 |
| `get_store_flow_summary` | 彙總執行統計：成功/失敗率、平均/最大持續時間 |
| `get_store_flow_runs` | 每次執行歷程記錄，包含持續時間、狀態、失敗動作、修復建議 |
| `get_store_flow_errors` | 僅包含失敗的執行記錄，附帶動作名稱與修復建議 |
| `get_store_flow_trigger_url` | 從快取取得觸發程序 URL (即時，無需 PA API 呼叫) |
| `set_store_flow_state` | 啟動或停止流程，並將狀態同步回快取 |
| `update_store_flow` | 設定監控旗標、通知規則、標籤、治理中繼資料 |
| `list_store_environments` | 所有 Power Platform 環境 |
| `list_store_connections` | 所有連接 |
| `list_store_makers` | 所有建立者 (公民開發者) |
| `get_store_maker` | 建立者詳細資料：流程/應用程式計數、授權、帳戶狀態 |
| `list_store_power_apps` | 所有 Power Apps 畫布應用程式 |

---

## 儲存區 vs 即時 (Store vs Live)

| 問題 | 使用儲存區 | 使用即時 |
|---|---|---|
| 有多少流程失敗？ | `list_store_flows` | — |
| 過去 30 天的失敗率是多少？ | `get_store_flow_summary` | — |
| 顯示流程的錯誤歷程記錄 | `get_store_flow_errors` | — |
| 是誰建構此流程的？ | `get_store_flow` → 解析 `owners` | — |
| 讀取完整流程定義 | `get_store_flow` 包含 (JSON 字串) | `get_live_flow` (結構化) |
| 檢查執行記錄中的動作輸入/輸出 | — | `get_live_flow_run_action_outputs` |
| 重新提交失敗的執行記錄 | — | `resubmit_live_flow_run` |

> 儲存區工具回答「發生了什麼事？」和「健康狀況如何？」。
> 即時工具回答「究竟哪裡出錯？」和「立即修復它」。

> 如果 `get_store_flow_runs`、`get_store_flow_errors` 或 `get_store_flow_summary` 回傳空白結果，請檢查：(1) 流程是否設定為 `monitor: true`？以及 (2) `scanned` 欄位是否為最新？請使用 `get_store_flow` 驗證兩者。

---

## 回應形狀

### `list_store_flows`

直接陣列。過濾器：`monitor` (bool), `rule_notify_onfail` (bool),
`rule_notify_onmissingdays` (number)。

```json
[
  {
    "id": "Default-<envGuid>.<flowGuid>",
    "displayName": "Stripe subscription updated",
    "state": "Started",
    "triggerType": "Request",
    "triggerUrl": "https://...",
    "tags": ["#operations", "#sensitive"],
    "environmentName": "Default-26e65220-...",
    "monitor": true,
    "runPeriodFailRate": 0.012,
    "runPeriodTotal": 82,
    "createdTime": "2025-06-24T01:20:53Z",
    "lastModifiedTime": "2025-06-24T03:51:03Z"
  }
]
```

> `id` 格式：`Default-<envGuid>.<flowGuid>`。以第一個 `.` 分割以取得 `environmentName` 和 `flowName`。
>
> `triggerUrl` 和 `tags` 為選用。某些條目是稀疏的（僅有 `id` + `monitor`） — 請跳過沒有 `displayName` 的條目。
>
> `list_store_flows` 上的標籤是從流程的 `description` 欄位自動提取的（製作人員使用的雜湊標籤，如 `#operations`）。透過 `update_store_flow(tags=...)` 寫入的標籤是分開儲存的，且僅在 `get_store_flow` 上可見 — 它們 **不會** 出現在清單回應中。

### `get_store_flow`

完整快取記錄。關鍵欄位：

| 類別 | 欄位 |
|---|---|
| 身分 | `name`, `displayName`, `environmentName`, `state`, `triggerType`, `triggerKind`, `tier`, `sharingType` |
| 執行統計 | `runPeriodTotal`, `runPeriodFails`, `runPeriodSuccess`, `runPeriodFailRate`, `runPeriodSuccessRate`, `runPeriodDurationAverage`/`Max`/`Min` (毫秒), `runTotal`, `runFails`, `runFirst`, `runLast`, `runToday` |
| 治理 | `monitor` (bool), `rule_notify_onfail` (bool), `rule_notify_onmissingdays` (number), `rule_notify_email` (string), `log_notify_onfail` (ISO), `description`, `tags` |
| 新鮮度 | `scanned` (ISO), `nextScan` (ISO) |
| 生命週期 | `deleted` (bool), `deletedTime` (ISO) |
| JSON 字串 | `actions`, `connections`, `owners`, `complexity`, `definition`, `createdBy`, `security`, `triggers`, `referencedResources`, `runError` — 皆需使用 `json.loads()` 解析 |

> 持續時間欄位 (`runPeriodDurationAverage`, `Max`, `Min`) 的單位為 **毫秒**。除以 1000 即為秒。
>
> `runError` 包含最近一次執行的錯誤作為 JSON 字串。解析它：
> `json.loads(record["runError"])` — 無錯誤時回傳 `{}`。

### `get_store_flow_summary`

時間視窗內 (預設：過去 7 天) 的彙總統計資料。

```json
{
  "flowKey": "Default-<envGuid>.<flowGuid>",
  "windowStart": null,
  "windowEnd": null,
  "totalRuns": 82,
  "successRuns": 81,
  "failRuns": 1,
  "successRate": 0.988,
  "failRate": 0.012,
  "averageDurationSeconds": 2.877,
  "maxDurationSeconds": 9.433,
  "firstFailRunRemediation": null,
  "firstFailRunUrl": null
}
```

> 當視窗內沒有此流程的執行資料時，回傳所有零。
> 使用 `startTime` 和 `endTime` (ISO 8601) 參數變更視窗。

### `get_store_flow_runs` / `get_store_flow_errors`

直接陣列。`get_store_flow_errors` 過濾為僅 `status=Failed`。
參數：`startTime`, `endTime`, `status` (陣列：`["Failed"]`, `["Succeeded"]` 等)。

> 當無執行資料時，兩者皆回傳 `[]`。

### `get_store_flow_trigger_url`

```json
{
  "flowKey": "Default-<envGuid>.<flowGuid>",
  "displayName": "Stripe subscription updated",
  "triggerType": "Request",
  "triggerKind": "Http",
  "triggerUrl": "https://..."
}
```

> `triggerUrl` 對於非 HTTP 觸發程序為 null。

### `set_store_flow_state`

呼叫即時 PA API，然後將狀態同步回快取並回傳完整的已更新記錄。

```json
{
  "flowKey": "Default-<envGuid>.<flowGuid>",
  "requestedState": "Stopped",
  "currentState": "Stopped",
  "flow": { /* 完整的 gFlows 記錄，形狀與 get_store_flow 相同 */ }
}
```

> 嵌入的 `flow` 物件立即反映新狀態 — 無需後續呼叫 `get_store_flow`。對於停止流程後立即在同一轉折中讀取其標籤/監控/擁有者中繼資料的治理工作流程非常有用。
>
> 若只需切換狀態，功能上等同於 `set_live_flow_state`，但 `set_live_flow_state` 僅回傳 `{flowName, environmentName, requestedState, actualState}` 且不會同步快取。若僅需切換狀態且不介意快取新鮮度，建議優先使用 `set_live_flow_state`。

### `update_store_flow`

更新治理中繼資料。僅更新提供的欄位 (合併)。
回傳完整的已更新記錄 (形狀與 `get_store_flow` 相同)。

可設定欄位：`monitor` (bool), `rule_notify_onfail` (bool),
`rule_notify_onmissingdays` (number, 0=已停用),
`rule_notify_email` (逗號分隔), `description`, `tags`,
`businessImpact`, `businessJustification`, `businessValue`,
`ownerTeam`, `ownerBusinessUnit`, `supportGroup`, `supportEmail`,
`critical` (bool), `tier`, `security`。

### `list_store_environments`

直接陣列。

```json
[
  {
    "id": "Default-26e65220-...",
    "displayName": "Flow Studio (default)",
    "sku": "Default",
    "type": "NotSpecified",
    "location": "australia",
    "isDefault": true,
    "isAdmin": true,
    "isManagedEnvironment": false,
    "createdTime": "2017-01-18T01:06:46Z"
  }
]
```

> `sku` 值：`Default`, `Production`, `Developer`, `Sandbox`, `Teams`。

### `list_store_connections`

直接陣列。可能會非常巨大 (1500+ 個項目)。

```json
[
  {
    "id": "<environmentId>.<connectionId>",
    "displayName": "user@contoso.com",
    "createdBy": "{\"id\":\"...\",\"displayName\":\"...\",\"email\":\"...\"}",
    "environmentName": "...",
    "statuses": "[{\"status\":\"Connected\"}]"
  }
]
```

> `createdBy` 和 `statuses` 是 **JSON 字串** — 請使用 `json.loads()` 解析。

### `list_store_makers`

直接陣列。

```json
[
  {
    "id": "09dbe02f-...",
    "displayName": "Catherine Han",
    "mail": "catherine.han@flowstudio.app",
    "deleted": false,
    "ownerFlowCount": 199,
    "ownerAppCount": 209,
    "userIsServicePrinciple": false
  }
]
```

> 已刪除的建立者具有 `deleted: true`，且沒有 `displayName`/`mail` 欄位。

### `get_store_maker`

完整建立者記錄。關鍵欄位：`displayName`, `mail`, `userPrincipalName`,
`ownerFlowCount`, `ownerAppCount`, `accountEnabled`, `deleted`, `country`,
`firstFlow`, `firstFlowCreatedTime`, `lastFlowCreatedTime`,
`firstPowerApp`, `lastPowerAppCreatedTime`,
`licenses` (M365 SKU 的 JSON 字串)。

### `list_store_power_apps`

直接陣列。

```json
[
  {
    "id": "<environmentId>.<appId>",
    "displayName": "My App",
    "environmentName": "...",
    "ownerId": "09dbe02f-...",
    "ownerName": "Catherine Han",
    "appType": "Canvas",
    "sharedUsersCount": 0,
    "createdTime": "2023-08-18T01:06:22Z",
    "lastModifiedTime": "2023-08-18T01:06:22Z",
    "lastPublishTime": "2023-08-18T01:06:22Z"
  }
]
```

---

## 常見工作流程

### 找出不健康的流程

```
1. list_store_flows
2. 過濾 runPeriodFailRate > 0.1 且 runPeriodTotal >= 5
3. 依 runPeriodFailRate 降序排序
4. 針對每個流程：get_store_flow 以取得完整詳細資訊
```

### 檢查特定流程的健康狀況

```
1. get_store_flow → 檢查 scanned (新鮮度), runPeriodFailRate, runPeriodTotal
2. get_store_flow_summary → 附帶選用時間視窗的彙總統計
3. get_store_flow_errors → 包含修復建議的每次執行失敗詳細資訊
4. 若需要更深入診斷 → 切換至即時工具：
   get_live_flow_runs → get_live_flow_run_action_outputs
```

### 在流程上啟用監控

```
1. 使用 monitor=true 呼叫 update_store_flow
2. 選擇性設定 rule_notify_onfail=true, rule_notify_email="user@domain.com"
3. 執行資料將在下次每日掃描後出現
```

### 每日健康檢查

```
1. list_store_flows
2. 標記 runPeriodFailRate > 0.2 且 runPeriodTotal >= 3 的流程
3. 標記狀態為 "Stopped" 的受監控流程 (可能表示自動暫停)
4. 針對關鍵失敗 → get_store_flow_errors 以取得修復建議
```

### 建立者稽核

```
1. list_store_makers
2. 識別仍擁有流程的已刪除帳戶 (deleted=true, ownerFlowCount > 0)
3. get_store_maker 以取得特定使用者的完整詳細資訊
```

### 盤點

```
1. list_store_environments → 環境計數、SKU、位置
2. list_store_flows → 依狀態、觸發型別、失敗率進行流程計數
3. list_store_power_apps → 應用程式計數、擁有者、共用
4. list_store_connections → 每個環境的連接計數
```

---

## 相關技能

- `power-automate-mcp` — 核心連接設定、即時工具參考
- `power-automate-debug` — 透過動作層級輸入/輸出進行深度診斷 (即時 API)
- `power-automate-build` — 建構與部署流程定義
- `power-automate-governance` — 治理中繼資料、標記、通知規則、CoE 模式
