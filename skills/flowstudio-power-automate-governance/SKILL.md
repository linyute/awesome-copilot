---
name: flowstudio-power-automate-governance
description: >-
  使用 FlowStudio MCP 快取儲存區大規模管理 Power Automate 流程與 Power Apps。依業務影響對流程進行分類、偵測孤立資源、稽核連接器使用情況、強制執行合規標準、管理通知規則，並計算治理分數 — 全部無需使用 Dataverse 或 CoE Starter Kit。
  在被要求執行以下操作時載入此技能：標記或分類流程、設定業務影響、指派擁有權、偵測孤立資源、稽核連接器、檢查合規性、計算封存分數、管理通知規則、執行治理審查、產生合規報告、停用流程建立者 (offboard a maker)，或任何涉及將治理中繼資料寫入流程的任務。需要 FlowStudio for Teams 或 MCP Pro+ 訂閱 — 請參閱 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 治理

透過 FlowStudio MCP **快取儲存區**大規模分類、標記並管理 Power Automate 流程 — 無需 Dataverse、無需 CoE Starter Kit，也無需開啟 Power Automate 入口網站。

此技能使用 `update_store_flow` 寫入治理中繼資料，並使用監控工具 (`list_store_flows`, `get_store_flow`, `list_store_makers` 等) 讀取租用戶狀態。如需監控與健康檢查工作流程，請參閱 `flowstudio-power-automate-monitoring` 技能。

> **每次工作階段都請先呼叫 `tools/list`** 以確認工具名稱與參數。
> 本技能涵蓋工作流程與模式 — `tools/list` 無法告訴您的內容。如果本文件與 `tools/list` 或實際的 API 回應有衝突，請以 API 為準。

---

## 關鍵：如何擷取流程 ID

`list_store_flows` 回傳的 ID 格式為 `<environmentId>.<flowId>`。您 **必須以第一個 `.` 分割** 以取得所有其他工具所需的 `environmentName` 和 `flowName`：

```
id = "Default-<envGuid>.<flowGuid>"
environmentName = "Default-<envGuid>"    (第一個 "." 之前的所有內容)
flowName = "<flowGuid>"                  (第一個 "." 之後的所有內容)
```

此外：請跳過沒有 `displayName` 或 `state=Deleted` 的條目 — 這些是稀疏記錄或在 Power Automate 中已不存在的流程。
如果已刪除的流程具有 `monitor=true`，建議停用監控 (`update_store_flow` 並將 `monitor=false`) 以釋放監控插槽（標準方案包含 20 個）。

---

## 寫入工具：`update_store_flow`

`update_store_flow` 僅將治理中繼資料寫入 **Flow Studio 快取** — 它 **不會** 修改 Power Automate 中的流程。這些欄位在 `get_live_flow` 或 PA 入口網站中不可見。它們僅存在於 Flow Studio 儲存區中，並由 Flow Studio 的掃描管線與通知規則使用。

這意味著：
- `ownerTeam` / `supportEmail` — 設定 Flow Studio 視為治理聯絡人的人員。不會變更實際的 PA 流程擁有者。
- `rule_notify_email` — 設定誰會收到 Flow Studio 失敗/遺失執行記錄通知。不會變更 Microsoft 內建的流程失敗警示。
- `monitor` / `critical` / `businessImpact` — 僅限 Flow Studio 分類。Power Automate 沒有對應欄位。

合併語意 — 僅更新您提供的欄位。回傳完整的已更新記錄 (形狀與 `get_store_flow` 相同)。

必需參數：`environmentName`, `flowName`。所有其他欄位皆為選用。

### 可設定欄位

| 欄位 | 型別 | 用途 |
|---|---|---|
| `monitor` | bool | 啟用執行層級掃描 (標準方案：包含 20 個流程) |
| `rule_notify_onfail` | bool | 在任何失敗的執行記錄上傳送電子郵件通知 |
| `rule_notify_onmissingdays` | number | 當流程在 N 天內未執行時傳送通知 (0 = 已停用) |
| `rule_notify_email` | string | 以逗號分隔的通知收件者 |
| `description` | string | 流程的功能說明 |
| `tags` | string | 分類標籤（也會自動從描述 `#hashtags` 中提取） |
| `businessImpact` | string | 低 / 中 / 高 / 關鍵 |
| `businessJustification` | string | 流程存在的原因、自動化了什麼流程 |
| `businessValue` | string | 業務價值說明 |
| `ownerTeam` | string | 當責團隊 |
| `ownerBusinessUnit` | string | 業務單位 |
| `supportGroup` | string | 支援升級群組 |
| `supportEmail` | string | 支援聯絡人電子郵件 |
| `critical` | bool | 指定為業務關鍵 |
| `tier` | string | 標準或進階 |
| `security` | string | 安全性分類或註記 |

> **關於 `security` 的注意事項：** `get_store_flow` 上的 `security` 欄位包含結構化 JSON (例如 `{"triggerRequestAuthenticationType":"All"}`)。寫入像 `"reviewed"` 這樣的純字串會覆寫此內容。若要將流程標記為已通過安全性審查，請改用 `tags`。

---

## 治理工作流程

### 1. 合規詳細資料審查

識別遺失必要治理中繼資料的流程 — 相當於 CoE Starter Kit 的 Developer Compliance Center。

```
1. 詢問使用者他們需要哪些合規欄位
   (或使用其組織現有的治理政策)
2. list_store_flows
3. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 檢查哪些必要欄位遺失或為空
4. 報告遺失欄位的非合規流程
5. 針對每個非合規流程：
   - 向使用者詢問數值
   - update_store_flow(environmentName, flowName, ...提供的欄位)
```

**可用於合規檢查的欄位：**

| 欄位 | 範例政策 |
|---|---|
| `description` | 每個流程都應有說明文件 |
| `businessImpact` | 分類為 低 / 中 / 高 / 關鍵 |
| `businessJustification` | 高/關鍵影響流程為必要 |
| `ownerTeam` | 每個流程都應有一個當責團隊 |
| `supportEmail` | 生產環境流程為必要 |
| `monitor` | 關鍵流程為必要 (注意：標準方案包含 20 個受監控流程) |
| `rule_notify_onfail` | 建議用於受監控流程 |
| `critical` | 指定為業務關鍵流程 |

> 每個組織定義自己的合規規則。上述欄位是基於常見 Power Platform 治理模式 (CoE Starter Kit) 的建議。在將流程標記為非合規之前，請先詢問使用者的需求。
>
> **提示：** 透過 MCP 建立或更新的流程已包含 `description` (由 `update_live_flow` 自動附加)。手動在 Power Automate 入口網站中建立的流程最可能遺失治理中繼資料。

### 2. 孤立資源偵測

找出由已刪除或已停用的 Azure AD 帳戶擁有的流程。

```
1. list_store_makers
2. 過濾條件：deleted=true 且 ownerFlowCount > 0
   注意：已刪除的建立者沒有 displayName/mail — 記錄其 id (AAD OID)
3. list_store_flows → 收集所有流程
4. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析擁有者：json.loads(record["owners"])
   - 檢查是否有任何擁有者 principalId 符合孤立建立者的 id
5. 報告孤立流程：建立者 id、流程名稱、流程狀態
6. 針對每個孤立流程：
   - 重新指派治理：update_store_flow(environmentName, flowName,
       ownerTeam="NewTeam", supportEmail="new-owner@contoso.com")
   - 或除役：set_store_flow_state(environmentName, flowName,
       state="Stopped")
```

> `update_store_flow` 僅更新快取中的治理中繼資料。若要轉移實際的 PA 擁有權，管理員必須使用 Power Platform 系統管理中心或 PowerShell。
>
> **注意：** 許多孤立流程是由系統產生 (由 `DataverseSystemUser` 帳戶為 SLA 監控、知識文章等建立)。這些並非由人員建立 — 請考慮為它們加上標籤，而非重新指派。
>
> **涵蓋範圍：** 此工作流程僅搜尋快取儲存區，不搜尋即時 PA API。上次掃描後建立的流程將不會出現。

### 3. 封存分數計算

計算每個流程的非活動分數 (0-7)，以識別安全的清理候選項目。符合 CoE Starter Kit 的封存評分。

```
1. list_store_flows
2. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
3. 計算封存分數 (0-7)，每項條件 +1 分：
   +1  lastModifiedTime 在 createdTime 的 24 小時內
   +1  displayName 包含 "test", "demo", "copy", "temp", 或 "backup"
       (不區分大小寫)
   +1  createdTime 超過 12 個月前
   +1  狀態為 "Stopped" 或 "Suspended"
   +1  json.loads(owners) 為空陣列 []
   +1  runPeriodTotal = 0 (從未執行或沒有近期執行記錄)
   +1  解析 json.loads(complexity) → 動作 < 5
4. 分類：
   分數 5-7：建議封存 — 報告給使用者確認
   分數 3-4：標記供審查 →
     從 get_store_flow 回應讀取現有標籤，附加 #archive-review
     update_store_flow(environmentName, flowName, tags="<現有標籤> #archive-review")
   分數 0-2：作用中，無需採取行動
5. 針對使用者確認的封存：
   set_store_flow_state(environmentName, flowName, state="Stopped")
   讀取現有標籤，附加 #archived
   update_store_flow(environmentName, flowName, tags="<現有標籤> #archived")
```

> **「封存」的意義：** Power Automate 沒有內建的封存功能。
> 透過 MCP 封存表示：(1) 停止流程使其無法執行，以及 (2) 標記 `#archived` 以便未來清理時容易發現。
> 實際刪除需要 Power Automate 入口網站或系統管理員 PowerShell — 無法透過 MCP 工具完成。

### 4. 連接器稽核

稽核受監控流程中正在使用的連接器。適用於 DLP 影響分析和進階授權規劃。

```
1. list_store_flows(monitor=true)
   (範圍僅限受監控流程 — 稽核所有 1000+ 個流程成本很高)
2. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析連接：json.loads(record["connections"])
     回傳物件陣列，包含 apiName, apiId, connectionName
   - 記錄流程層級的 tier 欄位 ("Standard" 或 "Premium")
3. 建立連接器清單：
   - 使用了哪些 apiNames，以及有多少個流程使用
   - 哪些流程 tier="Premium" (偵測到進階連接器)
   - 哪些流程使用 HTTP 連接器 (apiName 包含 "http")
   - 哪些流程使用自訂連接器 (非 shared_ 前綴的 apiNames)
4. 向使用者報告清單
   - 針對 DLP 分析：使用者提供其 DLP 政策連接器群組，
     代理程式對照清單進行交叉參考
```

> **範圍僅限受監控流程。** 每個流程需要一次 `get_store_flow` 呼叫來讀取 `connections` JSON。標準方案有約 20 個受監控流程 — 可處理。稽核大型租用戶中的所有流程 (1000+) 在 API 呼叫方面成本非常昂貴。
>
> **`list_store_connections`** 回傳連接執行個體（誰建立了哪個連接），但 **不會** 回傳每個流程的連接器型別。請將其用於每個環境的連接計數，而非連接器稽核。
>
> DLP 政策定義無法透過 MCP 取得。代理程式建立連接器清單；使用者提供 DLP 分類以進行交叉參考。

### 5. 通知規則管理

大規模設定流程的監控與警示。

```
為所有關鍵流程啟用失敗警示：
1. list_store_flows(monitor=true)
2. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 如果 critical=true 且 rule_notify_onfail 不為 true：
     update_store_flow(environmentName, flowName,
       rule_notify_onfail=true,
       rule_notify_email="oncall@contoso.com")
   - 如果沒有任何流程 critical=true：這是一個治理發現。
     建議使用者在設定警示前，使用 update_store_flow(critical=true) 將最重要的流程指定為關鍵

為週期性流程啟用遺失執行偵測：
1. list_store_flows(monitor=true)
2. 針對每個 triggerType="Recurrence" 的流程 (在 list 回應中可用)：
   - 跳過狀態為 "Stopped" 或 "Suspended" 的流程 (預期不會執行)
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 如果 rule_notify_onmissingdays 為 0 或未設定：
     update_store_flow(environmentName, flowName,
       rule_notify_onmissingdays=2)
```

> `critical`、`rule_notify_onfail` 和 `rule_notify_onmissingdays` 僅能從 `get_store_flow` 取得，而非 `list_store_flows`。list 呼叫預先過濾為受監控流程；detail 呼叫檢查通知欄位。
>
> **監控限制：** 標準方案 (FlowStudio for Teams / MCP Pro+) 包含 20 個受監控流程。在批次啟用 `monitor=true` 之前，請檢查現有的受監控流程數量：
> `len(list_store_flows(monitor=true))`

### 6. 分類與標記

依連接器型別、業務功能或風險等級批次分類流程。

```
依連接器自動標記：
1. list_store_flows
2. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析連接：json.loads(record["connections"])
   - 根據 apiName 值建立標籤：
     shared_sharepointonline → #sharepoint
     shared_teams → #teams
     shared_office365 → #email
     自訂連接器 → #custom-connector
     HTTP 相關連接器 → #http-external
   - 從 get_store_flow 回應讀取現有標籤，附加新標籤
   - update_store_flow(environmentName, flowName,
       tags="<現有標籤> #sharepoint #teams")
```

> **兩種標籤系統：** `list_store_flows` 中顯示的標籤是從流程的 `description` 欄位自動提取的（例如製作人員在 PA 入口網站描述中寫入 `#operations`）。透過 `update_store_flow(tags=...)` 設定的標籤會寫入 Azure Table 快取中的獨立欄位。它們是獨立的 — 寫入儲存區標籤不會觸動描述，在入口網站中編輯描述也不會影響儲存區標籤。
>
> **標籤合併：** `update_store_flow(tags=...)` 會覆寫儲存區標籤欄位。為了避免遺失其他工作流程的標籤，請先從 `get_store_flow` 讀取目前的儲存區標籤，附加新的，然後寫回。
>
> `get_store_flow` 已有一個由掃描管線計算的 `tier` 欄位 (Standard/Premium)。僅在需要覆寫時才使用 `update_store_flow(tier=...)`。

### 7. 建立者停用 (Maker Offboarding)

當員工離職時，識別其流程和應用程式，並重新指派 Flow Studio 治理聯絡人與通知收件者。

```
1. get_store_maker(makerKey="<離職使用者-AAD-OID>")
   → 檢查 ownerFlowCount, ownerAppCount, deleted 狀態
2. list_store_flows → 收集所有流程
3. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析擁有者：json.loads(record["owners"])
   - 如果任何 principalId 符合離職使用者的 OID → 標記
4. list_store_power_apps → 過濾 ownerId 符合該 OID 的項目
5. 針對每個標記的流程：
   - 檢查 runPeriodTotal 和 runLast — 它還在使用中嗎？
   - 若要保留：
     update_store_flow(environmentName, flowName,
       ownerTeam="NewTeam", supportEmail="new-owner@contoso.com")
   - 若要除役：
     set_store_flow_state(environmentName, flowName, state="Stopped")
     讀取現有標籤，附加 #decommissioned
     update_store_flow(environmentName, flowName, tags="<現有標籤> #decommissioned")
6. 報告：已重新指派的流程、已停止的流程、需要手動重新指派的應用程式
```

> **這裡「重新指派」的意義：** `update_store_flow` 變更了 Flow Studio 視為治理聯絡人以及接收 Flow Studio 通知的人員。它 **不會** 轉移實際的 Power Automate 流程擁有權 — 這需要 Power Platform 系統管理中心或 PowerShell。此外，請更新 `rule_notify_email`，讓失敗通知傳送給新團隊，而非離職員工的電子郵件。
>
> Power Apps 擁有權無法透過 MCP 工具變更。請回報它們，以便在 Power Apps 系統管理中心進行手動重新指派。

### 8. 安全性審查

使用快取儲存區資料審查流程潛在的安全性顧慮。

```
1. list_store_flows(monitor=true)
2. 針對每個流程 (跳過沒有 displayName 或 state=Deleted 的條目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析安全性：json.loads(record["security"])
   - 解析連接：json.loads(record["connections"])
   - 直接讀取 sharingType (頂層欄位，不在 security JSON 內)
3. 將發現結果報告給使用者以進行審查
4. 針對已審查的流程：
   讀取現有標籤，附加 #security-reviewed
   update_store_flow(environmentName, flowName, tags="<現有標籤> #security-reviewed")
   請勿覆寫 security 欄位 — 它包含結構化驗證資料
```

**可用於安全性審查的欄位：**

| 欄位 | 位置 | 告訴您什麼 |
|---|---|---|
| `security.triggerRequestAuthenticationType` | security JSON | `"All"` = HTTP 觸發程序接受未經驗證的請求 |
| `sharingType` | 頂層 | `"Coauthor"` = 與共同作者共用以進行編輯 |
| `connections` | connections JSON | 流程使用哪些連接器 (檢查是否有 HTTP, 自訂) |
| `referencedResources` | JSON 字串 | 流程存取的 SharePoint 網站、Teams 頻道、外部 URL |
| `tier` | 頂層 | `"Premium"` = 使用進階連接器 |

> 每個組織決定什麼構成安全性顧慮。例如，未經驗證的 HTTP 觸發程序對於 Webhook 接收者 (Stripe, GitHub) 是預期的，但對於內部流程可能是風險。在標記之前，請先審查發現結果的情境。

### 9. 環境治理

稽核環境的合規性與擴張情況。

```
1. list_store_environments
   跳過沒有 displayName 的條目 (租用戶層級的中繼資料列)
2. 標記：
   - 開發人員環境 (sku="Developer") — 應受到限制
   - 非託管環境 (isManagedEnvironment=false) — 治理較少
   - 注意：isAdmin=false 表示當前的服務帳戶缺乏該環境的系統管理員存取權，而非環境沒有系統管理員
3. list_store_flows → 依 environmentName 分組
   - 每個環境的流程計數
   - 失敗率分析：runPeriodFailRate 在 list 回應中 — 無需進行每個流程的 get_store_flow 呼叫
4. list_store_connections → 依 environmentName 分組
   - 每個環境的連接計數
```

### 10. 治理儀表板

產生租用戶範圍的治理摘要。

```
有效率的指標 (僅需 list 呼叫)：
1. total_flows = len(list_store_flows())
2. monitored = len(list_store_flows(monitor=true))
3. with_onfail = len(list_store_flows(rule_notify_onfail=true))
4. makers = list_store_makers()
   → active = 計數，deleted=false 的記錄
   → orphan_count = 計數，deleted=true 且 ownerFlowCount > 0 的記錄
5. apps = list_store_power_apps()
   → widely_shared = 計數，sharedUsersCount > 3 的記錄
6. envs = list_store_environments() → 計數，依 sku 分組
7. conns = list_store_connections() → 計數

從 list 資料計算：
- 監控百分比：monitored / total_flows
- 通知百分比：with_onfail / monitored
- 孤立計數：來自步驟 4
- 高風險計數：runPeriodFailRate > 0.2 的流程 (在 list 回應中)

詳細指標 (需要針對每個流程呼叫 get_store_flow — 大型租用戶成本高)：
- 合規百分比：已設定 businessImpact 的流程 / 總作用中流程
- 未記錄計數：沒有 description 的流程
- 層級分析：依 tier 欄位分組

針對詳細指標，單次遍歷所有流程：
  針對 list_store_flows 中的每個流程 (跳過稀疏條目)：
    分割 id → environmentName, flowName
    get_store_flow(environmentName, flowName)
    → 累計 businessImpact, description, tier
```

---

## 欄位參考：治理中使用的 `get_store_flow` 欄位

以下所有欄位皆確認存在於 `get_store_flow` 回應中。
標示 `*` 的欄位也適用於 `list_store_flows` (成本較低)。

| 欄位 | 型別 | 治理用途 |
|---|---|---|
| `displayName` * | string | 封存分數 (測試/範例名稱偵測) |
| `state` * | string | 封存分數、生命週期管理 |
| `tier` | string | 授權稽核 (Standard vs Premium) |
| `monitor` * | bool | 是否正在主動監控此流程？ |
| `critical` | bool | 業務關鍵指定 (可透過 update_store_flow 設定) |
| `businessImpact` | string | 合規分類 |
| `businessJustification` | string | 合規證明 |
| `ownerTeam` | string | 擁有權當責 |
| `supportEmail` | string | 升級聯絡人 |
| `rule_notify_onfail` | bool | 是否設定失敗警示？ |
| `rule_notify_onmissingdays` | number | 是否設定 SLA 監控？ |
| `rule_notify_email` | string | 警示收件者 |
| `description` | string | 文件完整性 |
| `tags` | string | 分類 — `list_store_flows` 僅顯示從描述提取的標籤；由 `update_store_flow` 寫入的儲存區標籤需要 `get_store_flow` 才能讀取 |
| `runPeriodTotal` * | number | 活動層級 |
| `runPeriodFailRate` * | number | 健康狀態 |
| `runLast` | ISO string | 上次執行時間戳記 |
| `scanned` | ISO string | 資料新鮮度 |
| `deleted` | bool | 生命週期追蹤 |
| `createdTime` * | ISO string | 封存分數 (年齡) |
| `lastModifiedTime` * | ISO string | 封存分數 (陳舊度) |
| `owners` | JSON string | 孤立偵測、擁有權稽核 — 使用 json.loads() 解析 |
| `connections` | JSON string | 連接器稽核、層級 — 使用 json.loads() 解析 |
| `complexity` | JSON string | 封存分數 (複雜度) — 使用 json.loads() 解析 |
| `definition` | JSON string | 流程定義 — 使用 json.loads() 解析 |
| `createdBy` | JSON string | 建立者資訊 — 使用 json.loads() 解析 |
| `security` | JSON string | 驗證型別稽核 — 使用 json.loads() 解析，包含 `triggerRequestAuthenticationType` |
| `triggers` | JSON string | 觸發程序稽核 — 使用 json.loads() 解析 |
| `referencedResources` | JSON string | URL 稽核 — 使用 json.loads() 解析 |
| `runError` | JSON string | 最近的錯誤詳細資訊 — 使用 json.loads() 解析 |

---

## 相關技能

- `flowstudio-power-automate-monitoring` — 健康檢查、失敗率、庫存清單 (唯讀)
- `flowstudio-power-automate-mcp` — 核心連接設定、即時工具參考
- `flowstudio-power-automate-debug` — 透過動作層級輸入/輸出進行深度診斷
- `flowstudio-power-automate-build` — 建構與部署流程定義
