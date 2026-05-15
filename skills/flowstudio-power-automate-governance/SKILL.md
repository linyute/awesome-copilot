---
name: flowstudio-power-automate-governance
description: >-
  使用 FlowStudio MCP 快取存放庫大規模治理 Power Automate 流程和 Power Apps。
  按業務影響對流程進行分類、偵測孤立資源、稽核連接器使用情況、強制執行合規標準、
  管理通知規則並計算治理分數 — 一切皆無需 Dataverse 或 CoE 入門套件。
  當被要求執行以下操作時載入此技能：標記或分類流程、設定業務影響、分配擁有權、
  偵測孤立資源、稽核連接器、檢查合規性、計算封存分數、管理通知規則、
  執行治理審查、產生合規報告、辦理製作者離職手續，或任何涉及向流程寫入
  治理 Metadata 的工作。需要 FlowStudio for Teams 或 MCP Pro+ 訂閱 —
  請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 治理

透過 FlowStudio MCP **快取存放庫 (cached store)** 大規模分類、標記和治理 Power Automate 流程 — 無需 Dataverse，無需 CoE 入門套件，也無需開啟 Power Automate 入口網站。

此技能使用與 `flowstudio-power-automate-monitoring` 相同的 `store_*` 工具系列，但具有不同的 *意圖 (intent)*：治理涉及寫入 Metadata (`update_store_flow`) 並讀取資訊以取得 *稽核與分類* 結果。監控則讀取相同的工具以取得 *營運健康狀態* 結果。請不要試圖記住哪個技能「擁有」哪個工具 — 請根據使用者的操作來選擇。若要進行健康檢查和失敗率儀表板，請改為載入 `flowstudio-power-automate-monitoring`。

> **⚠️ 需要 Pro+ 訂閱。** 此技能呼叫的 `store_*` 工具僅適用於 FlowStudio for Teams 或 MCP Pro+ 訂閱者。
>
> **如果使用者沒有 Pro+ 權限：** 第一個 `store_*` 工具呼叫將傳回 403/404 錯誤。發生這種情況時：
> 1. 停止呼叫 store 工具。
> 2. 告知使用者治理功能需要 Pro+ 訂閱。
> 3. 提供連結至 https://mcp.flowstudio.app/pricing。
>
> **工具發現：** 透過中繼工具而非 `tools/list` 載入工具結構描述 — 若要獲取標準組合包，請呼叫 `tool_search` 並設定 `query: "skill:governance"`；若要獲取單一工具，請設定 `query: "select:update_store_flow"`。此技能涵蓋了工作流程模式和欄位語意 — 這些是 `tool_search` 無法告訴您的內容。如果此文件與實際的 API 回應不符，以 API 為準。

---

## 關鍵：如何擷取流程 ID

`list_store_flows` 傳回的 `id` 格式為 `<environmentId>.<flowId>`。**您必須在第一個 `.` 處進行分割**，以取得適用於所有其他工具的 `environmentName` 和 `flowName`：

```
id = "Default-<envGuid>.<flowGuid>"
environmentName = "Default-<envGuid>"    (第一個 "." 之前的所有內容)
flowName = "<flowGuid>"                  (第一個 "." 之後的所有內容)
```

另外：跳過沒有 `displayName` 或 `state=Deleted` 的條目 — 這些是稀疏記錄或在 Power Automate 中已不存在的流程。如果已刪除的流程其 `monitor=true`，建議停用監控（呼叫 `update_store_flow` 並設定 `monitor=false`）以釋放監控額度（標準方案包含 20 個）。

---

## 寫入工具：`update_store_flow`

`update_store_flow` 僅將治理 Metadata 寫入 **Flow Studio 快取** — 它不會修改 Power Automate 中的流程。這些欄位透過 `get_live_flow` 或 Power Automate 入口網站是不可見的。它們僅存在於 Flow Studio 存放庫中，並供 Flow Studio 的掃描管線和通知規則使用。

這意味著：
- `ownerTeam` / `supportEmail` — 設定 Flow Studio 認定的治理聯絡人。**不會** 變更實際的 Power Automate 流程擁有者。
- `rule_notify_email` — 設定誰會接收 Flow Studio 的失敗/遺漏執行通知。**不會** 變更 Microsoft 內建的流程失敗警示。
- `monitor` / `critical` / `businessImpact` — 僅用於 Flow Studio 的分類。Power Automate 沒有對應的欄位。

合併語意 — 僅更新您提供的欄位。傳回完整的更新記錄（形狀與 `get_store_flow` 相同）。

必要參數：`environmentName`、`flowName`。所有其他欄位均為選填。

### 可設定的欄位

| 欄位 | 類型 | 用途 |
|---|---|---|
| `monitor` | bool | 啟用執行層級掃描 (標準方案包含 20 個流程) |
| `rule_notify_onfail` | bool | 在任何執行失敗時發送電子郵件通知 |
| `rule_notify_onmissingdays` | number | 當流程 N 天未執行時發送通知 (0 = 停用) |
| `rule_notify_email` | string | 以逗號分隔的通知收件者 |
| `description` | string | 流程的功能說明 |
| `tags` | string | 分類標記 (也會從說明的 `#hashtags` 中自動擷取) |
| `businessImpact` | string | 低 / 中 / 高 / 關鍵 (Low / Medium / High / Critical) |
| `businessJustification` | string | 流程存在的原因，以及它自動化的業務流程 |
| `businessValue` | string | 業務價值聲明 |
| `ownerTeam` | string | 負責的小組 |
| `ownerBusinessUnit` | string | 業務單位 |
| `supportGroup` | string | 支援呈報群組 |
| `supportEmail` | string | 支援聯絡電子郵件 |
| `critical` | bool | 指定為業務關鍵流程 |
| `tier` | string | 標準或進階 (Standard or Premium) |
| `security` | string | 安全性分類或備註 |

> **關於 `security` 的警示：** `get_store_flow` 上的 `security` 欄位包含結構化的 JSON (例如 `{"triggerRequestAuthenticationType":"All"}`)。寫入 `"reviewed"` 這樣的純字串會覆寫此內容。若要將流程標記為已通過安全性審查，請改用 `tags`。

---

## 治理工作流程

### 1. 合規性詳細資訊審查 (Compliance Detail Review)

識別缺少必要治理 Metadata 的流程。

```
1. 詢問使用者他們要求的合規性欄位有哪些
2. 執行 list_store_flows
3. 對於每個作用中流程：分割 id，呼叫 get_store_flow，檢查必要欄位
4. 報告不合規的流程並列出遺漏的欄位
5. 若要進行更新：詢問數值，然後呼叫 update_store_flow(...提供的欄位)
```

常見的合規性欄位：`description`、`businessImpact`、`businessJustification`、`ownerTeam`、`supportEmail`、`monitor`、`rule_notify_onfail`、`critical`。在標記之前，請先詢問使用者的政策。

### 2. 孤立資源偵測 (Orphaned Resource Detection)

尋找由已刪除或已停用的 Azure AD 帳戶擁有的流程。

```
1. 執行 list_store_makers
2. 篩選 deleted=true 且 ownerFlowCount > 0 的項目
3. 執行 list_store_flows → 收集所有流程
4. 對於每個作用中流程：分割 id，取得 get_store_flow，解析 owners JSON
5. 將擁有者的 principalId 與孤立製作者的 id 進行比對
6. 重新分配治理聯絡人，或標記標籤以準備退役
```

`update_store_flow` 不會轉移實際的 Power Automate 擁有權；請使用管理中心或 PowerShell 執行該操作。有些看似孤立的流程是系統產生的；請在適當時標記它們，而非重新分配。存放庫的涵蓋範圍僅與最近一次掃描同步。

### 3. 封存分數計算 (Archive Score Calculation)

為每個流程計算一個非作用中分數 (0-7)，以識別清理候選對象。

```
1. 執行 list_store_flows
2. 對於每個作用中流程：分割 id，取得 get_store_flow
3. 符合下列條件各得 1 分：建立時間≈修改時間、名稱包含 test/demo/temp/copy、
   建立超過 12 個月、已停止/停權、無擁有者、近期無執行記錄、complexity.actions < 5
4. 分數 5-7：建議封存；3-4：標記 #archive-review；0-2：作用中
5. 對於確認封存的項目：執行 set_live_flow_state(..., "Stopped") 並附加 #archived 標籤
```

透過 MCP 進行封存意味著停止流程並為其加上標籤。刪除操作則需要透過入口網站或管理員 PowerShell。

### 4. 連接器稽核 (Connector Audit)

稽核受監控流程中使用的連接器。對於 DLP (資料外洩防護) 影響分析和進階授權規劃非常有用。

```
1. 執行 list_store_flows(monitor=true)
2. 對於每個作用中流程：分割 id，取得 get_store_flow，解析 connections JSON
3. 依 apiName 分組；標記進階 (Premium) 層級、HTTP 連接器、自定義連接器
4. 向使用者報告盤查結果
```

盡可能將範圍限制在受監控的流程；每次 `get_store_flow` 呼叫都會產生成本。`list_store_connections` 列出的是連線實體，而非每個流程的連接器使用情況。DLP 政策並未公開；請向使用者詢問連接器的分類。

### 5. 通知規則管理 (Notification Rule Management)

大規模設定流程的監控和警示。

```
在所有關鍵流程上啟用失敗警示：
1. 執行 list_store_flows(monitor=true)
2. 對於每個作用中流程：分割 id，取得 get_store_flow
3. 如果 critical=true 且 rule_notify_onfail 為 false，
   呼叫 update_store_flow(..., rule_notify_onfail=true, rule_notify_email="oncall@contoso.com")

為排程流程啟用遺漏執行偵測：
1. 執行 list_store_flows(monitor=true)
2. 對於作用中的定期執行 (Recurrence) 流程：取得 get_store_flow
3. 如果 rule_notify_onmissingdays 為 0/遺漏，呼叫 update_store_flow(...,
   rule_notify_onmissingdays=2)
```

在批次啟用 `monitor=true` 之前，請檢查監控限制。如果沒有流程被設為 `critical=true`，請在設定警示前將此情況報告為治理缺口。

### 6. 分類與標記 (Classification and Tagging)

按連接器類型、業務功能或風險等級對流程進行批次分類。

```
依連接器自動標記：
1. 執行 list_store_flows
2. 對於每個作用中流程：分割 id，取得 get_store_flow，解析 connections JSON
3. 將 apiName 值對應到標記 (#sharepoint, #teams, #email, #custom-connector)
4. 讀取現有的存放庫標記，附加新標記，呼叫 update_store_flow(tags=...)
```

存放庫標記和說明中的標籤是分開的系統。`tags=` 會覆寫存放庫標記，因此請採取「讀取/附加/寫入」流程。除非被要求，否則請避免覆寫計算出的 `tier`。

### 7. 製作者離職手續 (Maker Offboarding)

當員工離職時，識別他們的流程和應用程式，並重新分配 Flow Studio 治理聯絡人和通知收件者。

```
1. 執行 get_store_maker(makerKey="<離職使用者的 AAD OID>")
   → 檢查 ownerFlowCount、ownerAppCount、已刪除狀態
2. 執行 list_store_flows → 收集所有流程
3. 對於每個作用中流程：分割 id，取得 get_store_flow，解析 owners JSON
4. 標記擁有者 principalId 與離職使用者 OID 相符的流程
5. 執行 list_store_power_apps → 篩選 ownerId
6. 對於保留的流程：更新 ownerTeam/supportEmail/rule_notify_email；
   在帳號刪除前考慮呼叫 add_live_flow_to_solution
7. 對於停用的流程：執行 set_live_flow_state(..., "Stopped") 並標記 #decommissioned
8. 報告：已重新分配的流程、已遷移到解決方案的流程、已停止的流程、
   需要手動重新分配的應用程式
```

此動作變更的是 Flow Studio 治理聯絡人，而非實際的 Power Automate 擁有權。Power Apps 的擁有權變更是手動/管理中心的工作。

### 8. 安全性審查 (Security Review)

使用快取存放庫資料審查流程是否存在潛在的安全性疑慮。

```
1. 執行 list_store_flows(monitor=true)
2. 對於每個作用中流程：分割 id，取得 get_store_flow
3. 解析 security/connections/referencedResources JSON；讀取頂層的 sharingType
4. 報告發現；對於已審查的流程附加 #security-reviewed 標記
```

安全性訊號：`security.triggerRequestAuthenticationType`、`sharingType`、`connections`、`referencedResources`、`tier`。切勿覆寫結構化的 `security` 欄位；應改為標記已審查的流程。

### 9. 環境治理 (Environment Governance)

稽核環境的合規性和擴張情況。

```
1. 執行 list_store_environments
   跳過沒有 displayName 的條目 (租用戶層級的 Metadata 列)
2. 標記：
   - 開發人員環境
   - 非受控環境
   - 服務帳戶缺乏管理權限的環境 (isAdmin=false)
3. 執行 list_store_flows → 依 environmentName 分組
4. 執行 list_store_connections → 依 environmentName 分組
```

### 10. 治理儀表板 (Governance Dashboard)

產生租用戶範圍的治理摘要。

```
效率指標 (僅限清單呼叫)：
1. total_flows = len(list_store_flows())
2. monitored = len(list_store_flows(monitor=true))
3. with_onfail = len(list_store_flows(rule_notify_onfail=true))
4. 製作者/應用程式/環境/連線數 = list_store_makers/list_store_power_apps/list_store_environments/list_store_connections
5. 計算監控百分比、通知百分比、孤立數量、高失敗次數

詳細指標 (每個流程都需要 get_store_flow — 對於大型租用戶來說成本較高)：
- 合規百分比：已設定 businessImpact 的流程 / 總作用中流程數
- 未記錄數量：無說明的流程
- 層級細分：依 tier 欄位分組
```

---

## 欄位參考：治理中使用的 `get_store_flow` 欄位

以下所有欄位已確認存在於 `get_store_flow` 回應中。
標有 `*` 的欄位也可在 `list_store_flows` 中取得（成本較低）。

| 欄位 | 類型 | 治理用途 |
|---|---|---|
| `displayName` * | string | 封存分數 (偵測 test/demo 名稱) |
| `state` * | string | 封存分數、生命週期管理 |
| `tier` | string | 授權稽核 (Standard vs Premium) |
| `monitor` * | bool | 此流程是否正受到主動監控？ |
| `critical` | bool | 業務關鍵指定 (可透過 update_store_flow 設定) |
| `businessImpact` | string | 合規分類 |
| `businessJustification` | string | 合規證明 |
| `ownerTeam` | string | 擁有權責任歸屬 |
| `supportEmail` | string | 呈報聯絡人 |
| `rule_notify_onfail` | bool | 是否已設定失敗警示？ |
| `rule_notify_onmissingdays` | number | 是否已設定 SLA 監控？ |
| `rule_notify_email` | string | 警示收件者 |
| `description` | string | 文件完整性 |
| `tags` | string | 分類 — `list_store_flows` 僅顯示從說明中擷取的標籤；透過 `update_store_flow` 寫入的存放庫標記需要 `get_store_flow` 才能讀回 |
| `runPeriodTotal` * | number | 活躍程度 |
| `runPeriodFailRate` * | number | 健康狀態 |
| `runLast` | ISO string | 上次執行時間戳記 |
| `scanned` | ISO string | 資料新鮮度 |
| `deleted` | bool | 生命週期追蹤 |
| `createdTime` * | ISO string | 封存分數 (存在時間) |
| `lastModifiedTime` * | ISO string | 封存分數 (過時程度) |
| `owners` | JSON string | 孤立偵測、擁有權稽核 — 使用 json.loads() 解析 |
| `connections` | JSON string | 連接器稽核、層級 — 使用 json.loads() 解析 |
| `complexity` | JSON string | 封存分數 (簡單程度) — 使用 json.loads() 解析 |
| `security` | JSON string | 驗證類型稽核 — 使用 json.loads() 解析，包含 `triggerRequestAuthenticationType` |
| `sharingType` | string | 過度分享偵測 (頂層欄位，不在安全性欄位內) |
| `referencedResources` | JSON string | URL 稽核 — 使用 json.loads() 解析 |

---

## 相關技能

- `flowstudio-power-automate-monitoring` — 健康檢查、失敗率、盤點 (唯讀)
- `flowstudio-power-automate-mcp` — 基礎技能：連線設定、MCP 協助程式、工具發現
- `flowstudio-power-automate-debug` — 深入診斷動作層級的輸入/輸出
- `flowstudio-power-automate-build` — 建構和部署流程定義
