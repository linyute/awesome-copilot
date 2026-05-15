---
name: flowstudio-power-automate-monitoring
description: >-
  需要 Pro+ 訂閱。使用 FlowStudio MCP 快取存放庫執行租用戶範圍的 Power Automate 監控：
  包含失敗率、執行健康趨勢、製作者/應用程式盤點、非作用中擁有者，以及合規性/健康報告。
  僅用於彙總租用戶檢視。對於單一環境、單一流程、執行控制或根本原因偵錯，
  請使用 flowstudio-power-automate-mcp、flowstudio-power-automate-debug 或
  伺服器的 monitor-flow 組合包。需要 FlowStudio for Teams 或 MCP Pro+。
---

# 使用 FlowStudio MCP 進行 Power Automate 監控

透過 FlowStudio MCP **快取存放庫 (cached store)** 監控流程健康狀況、追蹤失敗率並盤點租用戶資產 — 讀取速度快，無 Power Automate API 頻率限制，並豐富了治理 Metadata 和補救提示。

> **⚠️ 需要 Pro+ 訂閱。** 此技能呼叫的 `store_*` 工具僅適用於 FlowStudio for Teams 或 MCP Pro+ 訂閱者。
>
> **如果使用者沒有 Pro+ 權限：** 第一個 `store_*` 工具呼叫將傳回 403/404 錯誤。發生這種情況時：
> 1. 停止呼叫 store 工具。
> 2. 告知使用者此功能需要 Pro+ 訂閱。
> 3. 提供連結至 https://mcp.flowstudio.app/pricing。
> 4. 如果使用者的問題可以透過即時工具回答（例如「列出一個環境中的流程」），請改為提供使用 `flowstudio-power-automate-mcp` 技能。
>
> **工具發現：** 透過 `tool_search` 而非 `tools/list` 載入工具結構描述 — 針對常見的監控工具，請呼叫並設定 `query: "select:list_store_flows,get_store_flow_summary"`；或者透過 `query: "skill:governance"` 載入完整的工具集（伺服器的 governance 組合包也涵蓋了大多數監控讀取操作 — 此技能與 `flowstudio-power-automate-governance` 共用底層工具系列）。此技能涵蓋了回應形狀、行為備註和工作流程模式 — 這些是 `tool_search` 無法告訴您的內容。如果此文件與實際的 API 回應不符，以 API 為準。

---

## 監控如何運作

Flow Studio 每天會為每個訂閱者掃描 Power Automate API 並快取結果。掃描分為兩個層級：

- **所有流程**：掃描其 Metadata，包含定義、連線、擁有者、觸發器類型和彙總的執行統計資料 (`runPeriodTotal`、`runPeriodFailRate` 等)。環境、應用程式、連線和製作者也會被掃描。
- **受監控流程** (`monitor: true`)：額外獲取每次執行的詳細資訊：包含狀態、持續時間、失敗動作名稱和補救提示的個別執行記錄。這就是填充 `get_store_flow_runs` 和 `get_store_flow_summary` 資料來源。

**資料新鮮度：** 檢查 `get_store_flow` 上的 `scanned` 欄位，以查看流程最後一次掃描的時間。如果資料已過期，掃描管線可能未在執行中。

**啟用監控：** 透過 `update_store_flow` 或 Flow Studio for Teams 應用程式將 `monitor` 設定為 `true`
([如何選取流程](https://learn.flowstudio.app/teams-monitoring))。

**指定關鍵流程：** 對於業務關鍵流程，請使用 `update_store_flow` 並將其 `critical` 屬性設定為 `true`。這將啟用治理技能的通知規則管理功能，以便在關鍵流程上自動設定失敗警示。

---

## 工具

| 工具 | 用途 |
|---|---|
| `list_store_flows` | 列出流程，並附帶失敗率和監控篩選條件 |
| `get_store_flow` | 完整的快取記錄：執行統計資料、擁有者、層級、連線、定義 (包含 `triggerUrl` 欄位) |
| `get_store_flow_summary` | 彙總的執行統計資料：成功/失敗率、平均/最大持續時間 |
| `get_store_flow_runs` | 包含持續時間、狀態、失敗動作、補救措施的各次執行歷程記錄 (篩選 `status="Failed"` 可僅查看錯誤) |
| `update_store_flow` | 設定監控旗標、通知規則、標記、治理 Metadata |
| `list_store_environments` | 列出所有 Power Platform 環境 |
| `list_store_connections` | 列出所有連線 |
| `list_store_makers` | 列出所有製作者 (公民開發者) |
| `get_store_maker` | 製作者詳細資訊：流程/應用程式計數、授權、帳戶狀態 |
| `list_store_power_apps` | 列出所有 Power Apps 畫布應用程式 |

> 若要進行啟動/停止，請使用 `monitor-flow` 組合包中的 `set_live_flow_state` (透過 `tool_search query: "select:set_live_flow_state"` 獲取) — 快取將在下一次掃描時重新同步。先前的 `set_store_flow_state` 便利包裝函式已過期。

---

## Store (存放庫) vs Live (即時)

| 問題 | 使用 Store | 使用 Live |
|---|---|---|
| 有多少流程發生失敗？ | `list_store_flows` | — |
| 30 天內的失敗率是多少？ | `get_store_flow_summary` | — |
| 顯示流程的錯誤歷程記錄 | `get_store_flow_runs` (篩選 `status="Failed"`) | — |
| 誰建構了此流程？ | `get_store_flow` → 解析 `owners` | — |
| 讀取完整的流程定義 | `get_store_flow` 包含此內容 (JSON 字串) | `get_live_flow` (結構化) |
| 檢查一次執行中的動作輸入/輸出 | — | `get_live_flow_run_action_outputs` |
| 重新提交失敗的執行 | — | `resubmit_live_flow_run` |

> Store 工具回答的是「發生了什麼？」以及「健康狀況如何？」。
> Live 工具回答的是「具體哪裡出了問題？」以及「立即修復」。

> 如果 `get_store_flow_runs` 或 `get_store_flow_summary` 傳回空的結果，請檢查：(1) 流程的 `monitor` 屬性是否為 `true`？(2) `scanned` 欄位是否為最近的時間？請使用 `get_store_flow` 來驗證這兩點。

---

## 回應形狀

### `list_store_flows`

直接陣列。篩選條件：`monitor` (bool)、`rule_notify_onfail` (bool)、`rule_notify_onmissingdays` (bool)。

```json
[
  {
    "id": "Default-<envGuid>.<flowGuid>",
    "displayName": "Stripe 訂閱已更新",
    "state": "Started",
    "triggerType": "Request",
    "triggerUrl": "https://...",
    "tags": ["#operations", "#sensitive"],
    "environmentName": "Default-aaaaaaaa-...",
    "monitor": true,
    "runPeriodFailRate": 0.012,
    "runPeriodTotal": 82,
    "createdTime": "2025-06-24T01:20:53Z",
    "lastModifiedTime": "2025-06-24T03:51:03Z"
  }
]
```

> `id` 格式：`Default-<envGuid>.<flowGuid>`。在第一個 `.` 處進行分割，以取得 `environmentName` 和 `flowName`。
>
> `triggerUrl` 和 `tags` 是選填的。某些條目是稀疏的（僅有 `id` + `monitor`）— 請跳過沒有 `displayName` 的條目。
>
> `list_store_flows` 上的標籤是從流程的 `description` (說明) 欄位自動擷取的 (製作者使用的主題標籤，如 `#operations`)。透過 `update_store_flow(tags=...)` 寫入的標記是分開儲存的，且僅在 `get_store_flow` 中可見 — 它們 **不會** 出現在清單回應中。

### `get_store_flow`

完整的快取記錄。關鍵欄位：

| 類別 | 欄位 |
|---|---|
| 身分 | `name`, `displayName`, `environmentName`, `state`, `triggerType`, `triggerKind`, `tier`, `sharingType` |
| 執行統計 | `runPeriodTotal`, `runPeriodFails`, `runPeriodSuccess`, `runPeriodFailRate`, `runPeriodSuccessRate`, `runPeriodDurationAverage`/`Max`/`Min` (毫秒), `runTotal`, `runFails`, `runFirst`, `runLast`, `runToday` |
| 治理 | `monitor` (bool), `rule_notify_onfail` (bool), `rule_notify_onmissingdays` (number), `rule_notify_email` (string), `log_notify_onfail` (ISO), `description`, `tags` |
| 新鮮度 | `scanned` (ISO), `nextScan` (ISO) |
| 生命週期 | `deleted` (bool), `deletedTime` (ISO) |
| JSON 字串 | `actions`, `connections`, `owners`, `complexity`, `definition`, `createdBy`, `security`, `triggers`, `referencedResources`, `runError` — 均需使用 `json.loads()` 解析 |

> 持續時間欄位 (`runPeriodDurationAverage`, `Max`, `Min`) 單位為 **毫秒**。需除以 1000 以轉換為秒。
>
> `runError` 以 JSON 字串形式包含最後一次執行錯誤。進行解析：
> `json.loads(record["runError"])` — 當沒有錯誤時傳回 `{}`。

### `get_store_flow_summary`

時間範圍內 (預設為過去 7 天) 的彙總統計資料。

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

> 當時間範圍內該流程沒有執行資料時，傳回的所有數值均為零。
> 使用 `startTime` 和 `endTime` (ISO 8601) 參數來更改時間範圍。

### `get_store_flow_runs`

快取執行記錄的直接陣列。參數：`startTime`, `endTime`,
`status` (陣列 — 傳遞 `["Failed"]` 僅查看錯誤, `["Succeeded"]`, 或省略以查看全部)。

> 當時間範圍內沒有執行資料時，傳回 `[]`。

### 觸發 URL (Trigger URL)

直接從 `get_store_flow` (快取) 或 `get_live_flow` (即時) 讀取 `triggerUrl` 欄位。對於非 HTTP 觸發器，其值為 `null`。

### 啟動 / 停止流程

使用 `monitor-flow` 伺服器組合包中的 `set_live_flow_state`。快取將在下一次每日掃描時同步；如果您需要更快的快取新鮮度，請在狀態變更後呼叫 `get_live_flow` 進行確認，並在下一次掃描時同步。

### `update_store_flow`

更新治理 Metadata。僅更新提供的欄位 (合併)。
傳回完整的更新記錄 (形狀與 `get_store_flow` 相同)。

可設定欄位：`monitor` (bool), `rule_notify_onfail` (bool),
`rule_notify_onmissingdays` (number, 0=停用),
`rule_notify_email` (以逗號分隔), `description`, `tags`,
`businessImpact`, `businessJustification`, `businessValue`,
`ownerTeam`, `ownerBusinessUnit`, `supportGroup`, `supportEmail`,
`critical` (bool), `tier`, `security`。

### `list_store_environments`

直接陣列。

```json
[
  {
    "id": "Default-aaaaaaaa-...",
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

> `sku` 的可能值：`Default`, `Production`, `Developer`, `Sandbox`, `Teams`。

### `list_store_connections`

直接陣列。項目可能非常多 (1500+)。

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

> `createdBy` 和 `statuses` 是 **JSON 字串** — 請使用 `json.loads()` 進行解析。

### `list_store_makers`

直接陣列。

```json
[
  {
    "id": "09dbe02f-...",
    "displayName": "範例製作者",
    "mail": "maker@contoso.com",
    "deleted": false,
    "ownerFlowCount": 199,
    "ownerAppCount": 209,
    "userIsServicePrinciple": false
  }
]
```

> 已刪除的製作者其 `deleted` 屬性為 `true`，且沒有 `displayName`/`mail` 欄位。

### `get_store_maker`

完整的製作者記錄。關鍵欄位：`displayName`, `mail`, `userPrincipalName`,
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

### 找出不健康的流程

```
1. 執行 list_store_flows
2. 篩選 runPeriodFailRate > 0.1 且 runPeriodTotal >= 5 的項目
3. 按 runPeriodFailRate 降序排序
4. 針對每一項：執行 get_store_flow 以獲取完整詳細資訊
```

### 檢查特定流程的健康狀況

```
1. 執行 get_store_flow → 檢查 scanned (新鮮度)、runPeriodFailRate、runPeriodTotal
2. 執行 get_store_flow_summary → 取得選用時間範圍內的彙總統計資料
3. 執行 get_store_flow_runs(status=["Failed"]) → 查看帶有補救提示的各次執行失敗詳細資訊
4. 如果需要更深入的診斷 → 切換到即時工具：
   get_live_flow_runs → get_live_flow_run_action_outputs
```

### 啟用流程監控

```
1. 執行 update_store_flow 並設定 monitor=true
2. 視需要設定 rule_notify_onfail=true, rule_notify_email="user@domain.com"
3. 執行資料將在下一次每日掃描後出現
```

### 每日健康檢查

```
1. 執行 list_store_flows
2. 標記 runPeriodFailRate > 0.2 且 runPeriodTotal >= 3 的流程
3. 標記 state="Stopped" 的受監控流程 (可能代表已自動停權)
4. 對於關鍵失敗 → 執行 get_store_flow_runs(status=["Failed"]) 以獲取補救提示
```

### 製作者稽核

```
1. 執行 list_store_makers
2. 識別仍擁有流程的已刪除帳號 (deleted=true, ownerFlowCount > 0)
3. 針對特定使用者執行 get_store_maker 以獲取完整詳細資訊
```

### 盤點 (Inventory)

```
1. 執行 list_store_environments → 環境數量、SKU、位置
2. 執行 list_store_flows → 按狀態、觸發器類型、失敗率統計流程數量
3. 執行 list_store_power_apps → 應用程式數量、擁有者、分享情況
4. 執行 list_store_connections → 每個環境的連線數量
```

---

## 相關技能

- `flowstudio-power-automate-mcp` — 基礎技能：連線設定、MCP 協助程式、工具發現
- `flowstudio-power-automate-debug` — 深入診斷動作層級的輸入/輸出 (即時 API)
- `flowstudio-power-automate-build` — 建構與部署流程定義
- `flowstudio-power-automate-governance` — 治理 Metadata、標記、通知規則、CoE 模式
