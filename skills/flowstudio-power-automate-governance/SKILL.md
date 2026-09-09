---
name: 'flowstudio-power-automate-governance'
description: >-
  使用 FlowStudio MCP 快取存放區大規模治理 Power Automate 流程與 Power Apps。
  依業務影響分類流程、偵測孤立資源、稽核連接器使用情況、
  強制執行合規性標準、管理通知規則，並計算治理分數 —
  完全不需要 Dataverse 或 CoE Starter Kit。
  當被要求執行以下作業時載入此技能：標記或分類流程、設定業務影響、
  指派擁有權、偵測孤立資源、稽核連接器、檢查合規性、
  計算封存分數、管理通知規則、執行治理審查、產生
  合規性報告、辦理製作者離職交接，或任何涉及將治理
  中繼資料寫入流程的工作。需要 FlowStudio for Teams 或 MCP Pro+
  訂閱 — 請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 治理

透過 FlowStudio MCP **快取存放區**大規模分類、標記與治理 Power Automate 流程
— 不需要 Dataverse，不需要 CoE Starter Kit，也不需要
Power Automate 入口網站。

此技能使用與 `flowstudio-power-automate-monitoring` 相同的 `store_*` 工具系列，
但具有不同的*意圖*：治理會寫入中繼資料 (`update_store_flow`)
並讀取以取得*稽核與分類*結果。監控則是為了*維運健全狀況*結果
而讀取相同的工具。不要試圖記住哪個技能「擁有」哪個工具
— 請依使用者的操作來選擇。若要進行健全狀況檢查與
失敗率儀表板，請改為載入 `flowstudio-power-automate-monitoring`。

> **⚠️ 需要 Pro+ 訂閱。** 此技能呼叫的 `store_*` 工具
> 僅適用於 FlowStudio for Teams 或 MCP Pro+ 訂閱者。
>
> **如果使用者沒有 Pro+ 存取權限：** 第一個 `store_*` 工具呼叫
> 將會傳回 403/404 錯誤。當這種情況發生時：
> 1. 停止呼叫 store 工具
> 2. 告知使用者治理功能需要 Pro+ 訂閱
> 3. 提供連結給他們：https://mcp.flowstudio.app/pricing
>
> **探索：** 透過 meta 工具載入工具結構描述，而非透過 `tools/list` —
> 針對標準套件呼叫 `tool_search` 並帶入 `query: "skill:governance"`，
> 或針對單一工具帶入 `query: "select:update_store_flow"`。此技能涵蓋
> 工作流程模式與欄位語意 — 這些是 `tool_search` 無法告訴您的內容。
> 如果此文件與實際 API 回應不一致，以 API 為準。

---

## 重要：如何擷取流程識別碼

`list_store_flows` 會傳回格式為 `<environmentId>.<flowId>` 的 `id`。**您必須在第一個 `.` 處進行分割**，
以取得適用於所有其他工具的 `environmentName` 與 `flowName`：

```
id = "Default-<envGuid>.<flowGuid>"
environmentName = "Default-<envGuid>"    (第一個 "." 之前的所有內容)
flowName = "<flowGuid>"                  (第一個 "." 之後的所有內容)
```

此外：跳過沒有 `displayName` 或 `state=Deleted` 的項目 —
這些是稀疏記錄或在 Power Automate 中已不存在的流程。
如果已刪除的流程其 `monitor=true`，建議停用監控
（使用 `update_store_flow` 並帶入 `monitor=false`）以釋出監控配額
（標準方案包含 20 個）。

---

## 寫入工具：`update_store_flow`

`update_store_flow` 僅將治理中繼資料寫入 **FlowStudio 快取**
— 它「不會」修改 Power Automate 中的流程。這些欄位
無法透過 `get_live_flow` 或 PA 入口網站檢視。它們僅存在於
FlowStudio 存放區中，並由 FlowStudio 的掃描管線與
通知規則所使用。

這表示：
- `ownerTeam` / `supportEmail` — 設定 FlowStudio 視為
  治理連絡人的對象。這「不會」變更實際的 PA 流程擁有者。
- `rule_notify_email` — 設定接收 FlowStudio 失敗/遺漏執行
  通知的對象。這「不會」變更 Microsoft 內建的流程失敗警報。
- `monitor` / `critical` / `businessImpact` — 僅為 FlowStudio 的
  分類。Power Automate 沒有對等的欄位。

合併語意 — 僅更新您提供的欄位。傳回完整的
已更新記錄（與 `get_store_flow` 形狀相同）。

必要參數：`environmentName`、`flowName`。所有其他欄位皆為選填。

### 可設定的欄位

| 欄位 | 類型 | 用途 |
|---|---|---|
| `monitor` | bool | 啟用執行層級掃描（標準方案：包含 20 個流程） |
| `rule_notify_onfail` | bool | 在任何執行失敗時傳送電子郵件通知 |
| `rule_notify_onmissingdays` | number | 當流程在 N 天內未執行時傳送通知（0 = 停用） |
| `rule_notify_email` | string | 以逗號分隔的通知收件者 |
| `description` | string | 流程執行的工作內容 |
| `tags` | string | 分類標籤（也會從 description 的 `#hashtags` 自動擷取） |
| `businessImpact` | string | Low / Medium / High / Critical |
| `businessJustification` | string | 流程存在的原因、它自動化了什麼程序 |
| `businessValue` | string | 業務價值說明 |
| `ownerTeam` | string | 負責團隊 |
| `ownerBusinessUnit` | string | 業務單位 |
| `supportGroup` | string | 支援呈報群組 |
| `supportEmail` | string | 支援連絡人電子郵件 |
| `critical` | bool | 指定為關鍵業務 |
| `tier` | string | Standard 或 Premium |
| `security` | string | 安全性分類或附註 |

> **對 `security` 的注意事項：** `get_store_flow` 上的 `security` 欄位
> 包含結構化 JSON（例如 `{"triggerRequestAuthenticationType":"All"}`）。
> 寫入純字串（例如 `"reviewed"`）將會覆寫此內容。若要將
> 流程標記為已通過安全性審查，請改用 `tags`。

---

## 治理工作流程

### 1. 合規性詳細資料審查

識別缺少必要治理中繼資料的流程。

```
1. 詢問使用者他們需要哪些合規性欄位
2. list_store_flows
3. 針對每個作用中流程：分割 id、呼叫 get_store_flow、檢查必要欄位
4. 報告不合規的流程並列出缺少的欄位
5. 進行更新：詢問數值，然後 update_store_flow(...提供的欄位)
```

常見合規性欄位：`description`、`businessImpact`、
`businessJustification`、`ownerTeam`、`supportEmail`、`monitor`、
`rule_notify_onfail`、`critical`。在標記之前請先詢問使用者的原則。

### 2. 孤立資源偵測

尋找由已刪除或已停用的 Azure AD 帳戶所擁有的流程。

```
1. list_store_makers
2. 篩選 deleted=true 且 ownerFlowCount > 0 的項目
3. list_store_flows → 收集所有流程
4. 針對每個作用中流程：分割 id、get_store_flow、剖析 owners JSON
5. 將擁有者的 principalId 與孤立製作者 id 進行比對
6. 重新指派治理連絡人或停止/標記以進行除役
```

`update_store_flow` 不會轉移實際的 PA 擁有權；請使用系統管理中心
或 PowerShell 進行轉移。某些看似孤立的流程是系統產生的；在適當的情況下
將其加上標籤而非重新指派。存放區涵蓋範圍的即時程度取決於
最新的掃描。

### 3. 封存分數計算

計算每個流程的非活動分數 (0-7)，以識別清理候選項目。

```
1. list_store_flows
2. 針對每個作用中流程：分割 id、get_store_flow
3. 每符合一項加 1 分：created≈modified、test/demo/temp/copy 名稱、建立時間 >12 個月、
   已停止/已暫停、無擁有者、近期無執行、complexity.actions < 5
4. 分數 5-7：建議封存；3-4：標記 #archive-review；0-2：作用中
5. 確認封存：set_live_flow_state(..., "Stopped") 並附加 #archived
```

透過 MCP 封存表示停止該流程並為其加上標籤。刪除作業需要透過入口網站或
系統管理員 PowerShell。

### 4. 連接器稽核

稽核受監控流程中正在使用哪些連接器。適用於 DLP
影響分析與進階授權規劃。

```
1. list_store_flows(monitor=true)
2. 針對每個作用中流程：分割 id、get_store_flow、剖析 connections JSON
3. 依 apiName 分組；標記 Premium 層級、HTTP 連接器、自訂連接器
4. 向使用者報告盤點結果
```

盡可能將範圍限制在受監控的流程；每次呼叫 `get_store_flow` 都需要花費時間。
`list_store_connections` 會列出連線執行個體，而非每個流程的連接器使用情況。
DLP 原則並未公開；請詢問使用者連接器分類。

### 5. 通知規則管理

大規模設定流程的監控與警報。

```
在所有關鍵流程上啟用失敗警報：
1. list_store_flows(monitor=true)
2. 針對每個作用中流程：分割 id、get_store_flow
3. 若 critical=true 且 rule_notify_onfail 為 false，update_store_flow(...,
   rule_notify_onfail=true, rule_notify_email="oncall@contoso.com")

為排程流程啟用遺漏執行偵測：
1. list_store_flows(monitor=true)
2. 針對作用中的 Recurrence 流程：get_store_flow
3. 若 rule_notify_onmissingdays 為 0/遺漏，update_store_flow(...,
   rule_notify_onmissingdays=2)
```

在批次啟用 `monitor=true` 之前請先檢查監控限制。若沒有任何流程具有
`critical=true`，在設定警報之前請先將此情況報告為治理缺口。

### 6. 分類與標記

依連接器類型、業務功能或風險等級對流程進行批次分類。

```
依連接器自動標記：
1. list_store_flows
2. 針對每個作用中流程：分割 id、get_store_flow、剖析 connections JSON
3. 將 apiName 值對應至標籤 (#sharepoint, #teams, #email, #custom-connector)
4. 讀取現有存放區標籤、附加新標籤、update_store_flow(tags=...)
```

存放區標籤與 description 主題標籤為不同的系統。`tags=` 會覆寫
存放區標籤，因此請採用讀取/附加/寫入方式。除非被要求，否則請避免覆寫計算出的 `tier`。

### 7. 製作者離職交接

當員工離職時，識別其流程與應用程式，並重新指派
FlowStudio 治理連絡人與通知收件者。

```
1. get_store_maker(makerKey="<departing-user-aad-oid>")
   → 檢查 ownerFlowCount、ownerAppCount、deleted 狀態
2. list_store_flows → 收集所有流程
3. 針對每個作用中流程：分割 id、get_store_flow、剖析 owners JSON
4. 標記其擁有者 principalId 符合離職員工 OID 的流程
5. list_store_power_apps → 篩選 ownerId
6. 保留的流程：更新 ownerTeam/supportEmail/rule_notify_email；考慮在
   帳戶刪除前執行 add_live_flow_to_solution
7. 淘汰的流程：set_live_flow_state(..., "Stopped") 並標記 #decommissioned
8. 報告：已重新指派的流程、已遷移至解決方案的流程、已停止的流程、
   需要手動重新指派的應用程式
```

這只會變更 FlowStudio 治理連絡人，而非實際的 PA 擁有權。Power
Apps 擁有權變更屬於手動/系統管理中心的操作。

### 8. 安全性審查

使用快取存放區資料審查流程是否有潛在安全性疑慮。

```
1. list_store_flows(monitor=true)
2. 針對每個作用中流程：分割 id、get_store_flow
3. 剖析 security/connections/referencedResources JSON；在頂層讀取 sharingType
4. 報告調查結果；針對已審查的流程附加 #security-reviewed 標籤
```

安全性訊號：`security.triggerRequestAuthenticationType`、`sharingType`、
`connections`、`referencedResources`、`tier`。切勿覆寫結構化
`security` 欄位；改為在已審查的流程加上標籤。

### 9. 環境治理

稽核環境的合規性與擴張情況。

```
1. list_store_environments
   跳過沒有 displayName 的項目（租用戶層級中繼資料列）
2. 標記：
   - 開發人員環境
   - 非受控環境
   - 服務帳戶缺少管理員存取權限的環境 (isAdmin=false)
3. list_store_flows → 依 environmentName 分組
4. list_store_connections → 依 environmentName 分組
```

### 10. 治理儀表板

產生整個租用戶的治理摘要。

```
高效指標（僅呼叫 list）：
1. total_flows = len(list_store_flows())
2. monitored = len(list_store_flows(monitor=true))
3. with_onfail = len(list_store_flows(rule_notify_onfail=true))
4. makers/apps/envs/conns = list_store_makers/list_store_power_apps/list_store_environments/list_store_connections
5. 計算 monitoring %、notification %、orphan count、high-failure count

詳細指標（需要針對每個流程執行 get_store_flow — 對大型租用戶而言成本高昂）：
- Compliance %：設定了 businessImpact 的流程 / 作用中流程總數
- Undocumented count：沒有 description 的流程
- Tier breakdown：依 tier 欄位分組
```

---

## 欄位參考：治理中使用的 `get_store_flow` 欄位

以下所有欄位均已確認存在於 `get_store_flow` 回應中。
標有 `*` 的欄位亦可於 `list_store_flows` 中取得（成本較低）。

| 欄位 | 類型 | 治理用途 |
|---|---|---|
| `displayName` * | string | 封存分數（測試/示範名稱偵測） |
| `state` * | string | 封存分數、生命週期管理 |
| `tier` | string | 授權稽核（Standard 與 Premium） |
| `monitor` * | bool | 此流程是否正在主動監控中？ |
| `critical` | bool | 關鍵業務指定（可透過 update_store_flow 設定） |
| `businessImpact` | string | 合規性分類 |
| `businessJustification` | string | 合規性證明 |
| `ownerTeam` | string | 擁有權責任歸屬 |
| `supportEmail` | string | 呈報連絡人 |
| `rule_notify_onfail` | bool | 是否已設定失敗警報？ |
| `rule_notify_onmissingdays` | number | 是否已設定 SLA 監控？ |
| `rule_notify_email` | string | 警報收件者 |
| `description` | string | 文件完整性 |
| `tags` | string | 分類 — `list_store_flows` 僅顯示從 description 擷取的主題標籤；由 `update_store_flow` 寫入的存放區標籤需要 `get_store_flow` 才能讀回 |
| `runPeriodTotal` * | number | 活動層級 |
| `runPeriodFailRate` * | number | 健全狀況狀態 |
| `runLast` | ISO string | 上次執行時間戳記 |
| `scanned` | ISO string | 資料新鮮度 |
| `deleted` | bool | 生命週期追蹤 |
| `createdTime` * | ISO string | 封存分數（存在時間） |
| `lastModifiedTime` * | ISO string | 封存分數（陳舊度） |
| `owners` | JSON string | 孤立偵測、擁有權稽核 — 使用 json.loads() 剖析 |
| `connections` | JSON string | 連接器稽核、層級 — 使用 json.loads() 剖析 |
| `complexity` | JSON string | 封存分數（複雜度） — 使用 json.loads() 剖析 |
| `security` | JSON string | 驗證類型稽核 — 使用 json.loads() 剖析，包含 `triggerRequestAuthenticationType` |
| `sharingType` | string | 過度共用偵測（頂層，不在 security 內部） |
| `referencedResources` | JSON string | URL 稽核 — 使用 json.loads() 剖析 |

---

## 相關技能

- `flowstudio-power-automate-monitoring` — 健全狀況檢查、失敗率、盤點（唯讀）
- `flowstudio-power-automate-mcp` — 基礎技能：連線設定、MCP 協助程式、工具探索
- `flowstudio-power-automate-debug` — 透過動作層級輸入/輸出進行深入診斷
- `flowstudio-power-automate-build` — 建構與部署流程定義
