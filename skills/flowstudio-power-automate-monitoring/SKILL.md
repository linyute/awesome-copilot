---
name: flowstudio-power-automate-monitoring
description: >-
  **需要 Pro+ 訂閱。** 使用 FlowStudio MCP 快取儲存庫進行租用戶範圍的 
  Power Automate 流程健全狀況監控、失敗率分析及資產清單。
  僅針對租用戶範圍的彙總視圖載入此技能 — 而非用於列出單一環境中的流程或 
  偵錯特定執行記錄 (對後者請使用 power-automate-mcp 或 power-automate-debug)。
  這與伺服器的 `monitor-flow` 工具組合不同 (`tool_search query: "skill:monitor-flow"`) 
  — 該組合用於單一流程的執行階段控制 (啟動/停止/觸發/取消/重新提交)；
  而此技能則是用於針對快取儲存庫進行租用戶範圍的健全狀況分析。
  當要求執行以下操作時載入：監控租用戶健全狀況、獲取特定時間範圍內的彙總失敗率、
  檢閱租用戶範圍內的錯誤趨勢、尋找整個租用戶中非活動的建立者、清查 
  租用戶中的所有 Power Apps、計算控管分數、產生合規性報告，
  或執行租用戶範圍的健全狀況概覽。需要 FlowStudio for Teams 
  或 MCP Pro+ 訂閱 — 詳見 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 監控

透過 FlowStudio MCP **快取儲存庫**監控流程健全狀況、追蹤失敗率並清查租用戶資產 — 具備讀取速度快、不受 PA API 速率限制影響等優點，並富含控管 Metadata 及修復提示。

> **⚠️ 需要 Pro+ 訂閱。** 此技能呼叫的 `store_*` 工具僅適用於 FlowStudio for Teams 或 MCP Pro+ 訂閱者。
>
> **如果使用者沒有 Pro+ 存取權限：** 第一個 `store_*` 工具呼叫將傳回 403/404 錯誤。當發生這種情況時：
> 1. 停止呼叫 store 工具
> 2. 告知使用者此功能需要 Pro+ 訂閱
> 3. 提供連結：https://mcp.flowstudio.app/pricing
> 4. 如果他們的問題可以透過即時工具回答 (例如「列出一個環境中的流程」)，請提議改用 `power-automate-mcp` 技能
>
> **探索：** 透過 `tool_search` 而非 `tools/list` 載入工具結構描述 — 使用 `query: "select:list_store_flows,get_store_flow_summary"` 呼叫常用的監控工具，或使用 `query: "skill:governance"` 載入完整集合 (伺服器的控管組合也涵蓋了大多數監控讀取 — 此技能與 `power-automate-governance` 共用底層工具系列)。此技能涵蓋回應格式、行為備註及工作流程模式 — 這些是 `tool_search` 無法告訴您的內容。如果此文件與實際的 API 回應不符，以 API 為準。

---

## 監控運作原理

Flow Studio 每天會為每位訂閱者掃描 Power Automate API 並快取結果。分為兩個層級：

- **所有流程**皆會進行 Metadata 掃描：定義、連接、擁有者、觸發器類型以及彙總執行統計資料 (`runPeriodTotal`, `runPeriodFailRate` 等)。同時也會掃描環境、應用程式、連接及建立者。
- **受監控的流程** (`monitor: true`) 則會額外獲取每次執行的詳細資訊：個別執行記錄、狀態、持續時間、失敗的動作名稱及修復提示。這就是 `get_store_flow_runs`、`get_store_flow_errors` 及 `get_store_flow_summary` 資料的來源。

**資料新鮮度：** 檢查 `get_store_flow` 上的 `scanned` 欄位，以查看流程上次掃描的時間。如果資料過時，可能是掃描管線未在執行。

**啟用監控：** 透過 `update_store_flow` 或 Flow Studio for Teams 應用程式設置 `monitor: true` ([如何選取流程](https://learn.flowstudio.app/teams-monitoring))。

**指定關鍵流程：** 對業務關鍵流程使用 `update_store_flow` 並設定 `critical=true`。這能讓控管技能的通知規則管理功能自動為關鍵流程配置失敗警示。

---

## 工具

| 工具 | 用途 |
|---|---|
| `list_store_flows` | 列出流程，包含失敗率及監控篩選器 |
| `get_store_flow` | 完整的快取記錄：執行統計、擁有者、層級、連接、定義 |
| `get_store_flow_summary` | 彙總執行統計：成功/失敗率、平均/最大持續時間 |
| `get_store_flow_runs` | 每次執行的歷程記錄，包含持續時間、狀態、失敗動作、修復方案 |
| `get_store_flow_errors` | 僅限失敗的執行，包含動作名稱及修復提示 |
| `get_store_flow_trigger_url` | 來自快取的觸發 URL (即時，無需呼叫 PA API) |
| `set_store_flow_state` | 啟動或停止流程，並將狀態同步回快取 |
| `update_store_flow` | 設置監控旗標、通知規則、標籤、控管 Metadata |
| `list_store_environments` | 所有 Power Platform 環境 |
| `list_store_connections` | 所有連接 |
| `list_store_makers` | 所有建立者 (公民開發者) |
| `get_store_maker` | 建立者詳細資訊：流程/應用程式數量、授權、帳戶狀態 |
| `list_store_power_apps` | 所有 Power Apps 畫布應用程式 |

---

## 儲存庫 vs 即時 (Store vs Live)

| 問題 | 使用儲存庫 (Store) | 使用即時 (Live) |
|---|---|---|
| 有多少流程失敗？ | `list_store_flows` | — |
| 30 天內的失敗率是多少？ | `get_store_flow_summary` | — |
| 顯示流程的錯誤歷程記錄 | `get_store_flow_errors` | — |
| 誰建置了這個流程？ | `get_store_flow` → 解析 `owners` | — |
| 讀取完整的流程定義 | `get_store_flow` 中包含 (JSON 字串) | `get_live_flow` (結構化) |
| 檢查某次執行的動作輸入/輸出 | — | `get_live_flow_run_action_outputs` |
| 重新提交失敗的執行 | — | `resubmit_live_flow_run` |

> 儲存庫工具回答「發生了什麼？」以及「它有多健全？」
> 即時工具回答「具體出了什麼問題？」以及「現在修復它。」

> 如果 `get_store_flow_runs`、`get_store_flow_errors` 或 `get_store_flow_summary` 傳回空結果，請檢查：(1) 流程是否設定了 `monitor: true`？以及 (2) `scanned` 欄位是否為最近？使用 `get_store_flow` 驗證這兩項。

---

## 回應格式

### `list_store_flows`

直接陣列。篩選器：`monitor` (bool), `rule_notify_onfail` (bool), `rule_notify_onmissingdays` (bool)。

```json
[
  {
    "id": "Default-<envGuid>.<flowGuid>",
    "displayName": "Stripe 訂閱已更新",
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

> `id` 格式：`Default-<envGuid>.<flowGuid>`。在第一個 `.` 處分割以獲得 `environmentName` 和 `flowName`。
>
> `triggerUrl` 和 `tags` 為選填。某些條目資訊較少 (僅有 `id` + `monitor`) — 請略過沒有 `displayName` 的項目。
>
> `list_store_flows` 上的標籤是從流程的 `description` 欄位中自動提取的 (建立者的主題標籤，例如 `#operations`)。透過 `update_store_flow(tags=...)` 寫入的標籤則單獨儲存，且僅在 `get_store_flow` 中可見 — 它們「不會」出現在清單回應中。

### `get_store_flow`

完整的快取記錄。關鍵欄位：

| 類別 | 欄位 |
|---|---|
| 身分 | `name`, `displayName`, `environmentName`, `state`, `triggerType`, `triggerKind`, `tier`, `sharingType` |
| 執行統計 | `runPeriodTotal`, `runPeriodFails`, `runPeriodSuccess`, `runPeriodFailRate`, `runPeriodSuccessRate`, `runPeriodDurationAverage`/`Max`/`Min` (毫秒), `runTotal`, `runFails`, `runFirst`, `runLast`, `runToday` |
| 控管 | `monitor` (bool), `rule_notify_onfail` (bool), `rule_notify_onmissingdays` (number), `rule_notify_email` (string), `log_notify_onfail` (ISO), `description`, `tags` |
| 新鮮度 | `scanned` (ISO), `nextScan` (ISO) |
| 生命週期 | `deleted` (bool), `deletedTime` (ISO) |
| JSON 字串 | `actions`, `connections`, `owners`, `complexity`, `definition`, `createdBy`, `security`, `triggers`, `referencedResources`, `runError` — 皆需要 `json.loads()` 解析 |

> 持續時間欄位 (`runPeriodDurationAverage`, `Max`, `Min`) 單位為**毫秒**。請除以 1000 以換算成秒。
>
> `runError` 包含上次執行的錯誤 JSON 字串。解析方式：`json.loads(record["runError"])` — 無錯誤時傳回 `{}`。

### `get_store_flow_summary`

特定時間範圍內的彙總統計資料 (預設為過去 7 天)。

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

> 當時間範圍內沒有該流程的執行資料時，傳回值全為零。使用 `startTime` 和 `endTime` (ISO 8601) 參數來變更時間範圍。

### `get_store_flow_runs` / `get_store_flow_errors`

直接陣列。`get_store_flow_errors` 僅篩選 `status=Failed` 的項目。
參數：`startTime`, `endTime`, `status` (陣列：`["Failed"]`, `["Succeeded"]` 等)。

> 若無執行資料，兩者皆傳回 `[]`。

### `get_store_flow_trigger_url`

```json
{
  "flowKey": "Default-<envGuid>.<flowGuid>",
  "displayName": "Stripe 訂閱已更新",
  "triggerType": "Request",
  "triggerKind": "Http",
  "triggerUrl": "https://..."
}
```

> 非 HTTP 觸發器的 `triggerUrl` 為空值 (null)。

### `set_store_flow_state`

呼叫即時 PA API，然後將狀態同步回快取，並傳回完整的更新後記錄。

```json
{
  "flowKey": "Default-<envGuid>.<flowGuid>",
  "requestedState": "Stopped",
  "currentState": "Stopped",
  "flow": { /* 完整的 gFlows 記錄，格式與 get_store_flow 相同 */ }
}
```

> 嵌入的 `flow` 物件會立即反映新狀態 — 無需隨後呼叫 `get_store_flow`。這對於停止流程後需在同一次操作中讀取其標籤/監控/擁有者 Metadata 的控管工作流程非常有用。
>
> 在變更狀態方面功能等同於 `set_live_flow_state`，但 `set_live_flow_state` 僅傳回 `{flowName, environmentName, requestedState, actualState}` 且不會同步快取。當您只需要切換狀態而不關心快取新鮮度時，請優先使用 `set_live_flow_state`。

### `update_store_flow`

更新控管 Metadata。僅更新提供的欄位 (合併)。傳回完整的更新後記錄 (格式與 `get_store_flow` 相同)。

可設置欄位：`monitor` (bool), `rule_notify_onfail` (bool), `rule_notify_onmissingdays` (number, 0=停用), `rule_notify_email` (逗號分隔), `description`, `tags`, `businessImpact`, `businessJustification`, `businessValue`, `ownerTeam`, `ownerBusinessUnit`, `supportGroup`, `supportEmail`, `critical` (bool), `tier`, `security`。

### `list_store_environments`

直接陣列。

```json
[
  {
    "id": "Default-26e65220-...",
    "displayName": "Flow Studio (預設)",
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

直接陣列。內容可能非常龐大 (1500+ 項目)。

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

> 已刪除的建立者 `deleted: true` 且沒有 `displayName`/`mail` 欄位。

### `get_store_maker`

完整的建立者記錄。關鍵欄位：`displayName`, `mail`, `userPrincipalName`, `ownerFlowCount`, `ownerAppCount`, `accountEnabled`, `deleted`, `country`, `firstFlow`, `firstFlowCreatedTime`, `lastFlowCreatedTime`, `firstPowerApp`, `lastPowerAppCreatedTime`, `licenses` (M365 SKU 的 JSON 字串)。

### `list_store_power_apps`

直接陣列。

```json
[
  {
    "id": "<environmentId>.<appId>",
    "displayName": "我的應用程式",
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

### 尋找不健康的流程

```
1. list_store_flows
2. 篩選 runPeriodFailRate > 0.1 且 runPeriodTotal >= 5 的項目
3. 按 runPeriodFailRate 降冪排序
4. 針對每個項目：呼叫 get_store_flow 以獲取完整詳細資訊
```

### 檢查特定流程的健全狀況

```
1. get_store_flow → 檢查 scanned (新鮮度), runPeriodFailRate, runPeriodTotal
2. get_store_flow_summary → 具備選填時間範圍的彙總統計資料
3. get_store_flow_errors → 每次執行的失敗詳細資訊與修復提示
4. 若需更深層診斷 → 切換至即時工具：
   get_live_flow_runs → get_live_flow_run_action_outputs
```

### 啟用流程監控

```
1. 使用 update_store_flow 設置 monitor=true
2. (選填) 設置 rule_notify_onfail=true, rule_notify_email="user@domain.com"
3. 執行資料將在下次每日掃描後出現
```

### 每日健全狀況檢查

```
1. list_store_flows
2. 標記 runPeriodFailRate > 0.2 且 runPeriodTotal >= 3 的流程
3. 標記 state="Stopped" 的受監控流程 (可能代表自動停權)
4. 針對關鍵失敗項目 → 呼叫 get_store_flow_errors 以獲取修復提示
```

### 建立者稽核

```
1. list_store_makers
2. 識別仍擁有流程的已刪除帳戶 (deleted=true, ownerFlowCount > 0)
3. 針對特定使用者呼叫 get_store_maker 以獲取完整詳細資訊
```

### 資產清查

```
1. list_store_environments → 環境計數、SKU、位置
2. list_store_flows → 按狀態、觸發器類型、失敗率統計流程數量
3. list_store_power_apps → 應用程式數量、擁有者、共享情況
4. list_store_connections → 每個環境的連接數量
```

---

## 相關技能

- `power-automate-mcp` — 基礎技能：連接設定、MCP 輔助程式、工具探索
- `power-automate-debug` — 透過動作層級的輸入/輸出進行深度診斷 (即時 API)
- `power-automate-build` — 建置並部署流程定義
- `power-automate-governance` — 控管 Metadata、標記、通知規則、CoE 模式
