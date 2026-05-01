---
name: flowstudio-power-automate-governance
description: >-
  使用 FlowStudio MCP 快取儲存庫大規模控管 Power Automate 流程與 Power Apps。
  按業務影響對流程進行分類、偵測孤立資源、稽核連接器使用情況、
  執行合規性標準、管理通知規則並計算控管分數 — 
  這一切都不需要 Dataverse 或 CoE 起步套件 (Starter Kit)。
  當使用者要求執行以下操作時，請載入此技能：標記或分類流程、設定業務影響、
  分配所有權、偵測孤立資源、稽核連接器、檢查合規性、計算 
  封存分數、管理通知規則、執行控管檢閱、產生 
  合規性報告、為建立者辦理離職手續，或任何 
  涉及將控管 Metadata 寫入流程的任務。需要 FlowStudio for Teams 
  或 MCP Pro+ 訂閱 — 詳見 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 控管

透過 FlowStudio MCP **快取儲存庫**大規模分類、標記並控管 Power Automate 流程 — 無需 Dataverse、無需 CoE 起步套件，也無需進入 Power Automate 入口網站。

此技能與 `power-automate-monitoring` 使用相同的 `store_*` 工具系列，但具備不同的「意圖」：控管側重於寫入 Metadata (`update_store_flow`) 並讀取以獲得「稽核與分類」結果。監控側重於讀取相同工具以獲得「維運健全狀況」結果。不要嘗試死記硬背哪項技能「擁有」哪項工具 — 請根據使用者的操作來選擇。若要執行健全狀況檢查和失敗率儀表板，請改為載入 `power-automate-monitoring`。

> **⚠️ 需要 Pro+ 訂閱。** 此技能呼叫的 `store_*` 工具僅適用於 FlowStudio for Teams 或 MCP Pro+ 訂閱者。
>
> **如果使用者沒有 Pro+ 存取權限：** 第一個 `store_*` 工具呼叫將傳回 403/404 錯誤。當發生這種情況時：
> 1. 停止呼叫 store 工具
> 2. 告知使用者控管功能需要 Pro+ 訂閱
> 3. 提供連結：https://mcp.flowstudio.app/pricing
>
> **探索：** 透過中繼工具而非 `tools/list` 載入工具結構描述 — 呼叫 `tool_search` 並設定 `query: "skill:governance"` 以獲取標準組合，或 `query: "select:update_store_flow"` 以獲取單一工具。此技能涵蓋工作流程模式和欄位語義 — 這些是 `tool_search` 無法告訴您的內容。如果此文件與實際的 API 回應不符，以 API 為準。

---

## 關鍵：如何提取流程 ID

`list_store_flows` 傳回的 `id` 格式為 `<environmentId>.<flowId>`。**您必須在第一個 `.` 處進行分割**，才能獲得用於所有其他工具的 `environmentName` 和 `flowName`：

```
id = "Default-<envGuid>.<flowGuid>"
environmentName = "Default-<envGuid>"    (第一個 "." 之前的內容)
flowName = "<flowGuid>"                  (第一個 "." 之後的內容)
```

另外：略過沒有 `displayName` 或 `state=Deleted` 的項目 — 這些是疏漏的記錄或已在 Power Automate 中不存在的流程。如果已刪除的流程 `monitor=true`，建議停用監控 (`update_store_flow` 設為 `monitor=false`) 以騰出監控額度 (標準方案包含 20 個)。

---

## 寫入工具：`update_store_flow`

`update_store_flow` 僅將控管 Metadata 寫入 **Flow Studio 快取** — 它「不會」修改 Power Automate 中的流程。這些欄位在 `get_live_flow` 或 PA 入口網站中不可見。它們僅存在於 Flow Studio 儲存庫中，供 Flow Studio 的掃描管線和通知規則使用。

這意味著：
- `ownerTeam` / `supportEmail` — 設置 Flow Studio 認定的控管聯絡人。不會變更 PA 流程的實際擁有者。
- `rule_notify_email` — 設置誰接收 Flow Studio 的失敗/缺失執行通知。不會變更 Microsoft 內建的流程失敗警示。
- `monitor` / `critical` / `businessImpact` — 僅用於 Flow Studio 分類。Power Automate 沒有對等欄位。

合併語義 — 僅更新您提供的欄位。傳回完整的更新後記錄 (格式與 `get_store_flow` 相同)。

必要參數：`environmentName`, `flowName`。其餘欄位皆為選填。

### 可設置欄位

| 欄位 | 類型 | 用途 |
|---|---|---|
| `monitor` | bool | 啟用執行層級掃描 (標準方案：包含 20 個流程) |
| `rule_notify_onfail` | bool | 在任何執行失敗時傳送電子郵件通知 |
| `rule_notify_onmissingdays` | number | 當流程 N 天未執行時傳送通知 (0 = 停用) |
| `rule_notify_email` | string | 以逗號分隔的通知收件者 |
| `description` | string | 流程的功能說明 |
| `tags` | string | 分類標籤 (也會從說明的 `#hashtags` 中自動提取) |
| `businessImpact` | string | 低 / 中 / 高 / 關鍵 (Low / Medium / High / Critical) |
| `businessJustification` | string | 流程存在的原因，及其自動化的程序 |
| `businessValue` | string | 業務價值陳述 |
| `ownerTeam` | string | 負責團隊 |
| `ownerBusinessUnit` | string | 業務單位 |
| `supportGroup` | string | 支援呈報群組 |
| `supportEmail` | string | 支援聯絡電子郵件 |
| `critical` | bool | 指定為業務關鍵流程 |
| `tier` | string | 標準或進階 (Standard or Premium) |
| `security` | string | 安全分類或備註 |

> **關於 `security` 的警告：** `get_store_flow` 上的 `security` 欄位包含結構化的 JSON (例如 `{"triggerRequestAuthenticationType":"All"}`)。寫入 `"reviewed"` 之類的純字串會覆蓋此內容。若要將流程標記為已通過安全審查，請改用 `tags`。

---

## 控管工作流程

### 1. 合規詳細資訊檢閱

識別缺少必要控管 Metadata 的流程 — 相當於 CoE 起步套件的開發人員合規中心 (Developer Compliance Center)。

```
1. 詢問使用者他們需要哪些合規欄位
   (或使用其組織現有的控管原則)
2. list_store_flows
3. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 檢查哪些必要欄位缺失或為空
4. 回報不合規的流程，並列出缺失的欄位
5. 針對每個不合規流程：
   - 詢問使用者相關值
   - update_store_flow(environmentName, flowName, ...提供欄位)
```

**合規檢查可用欄位：**

| 欄位 | 範例原則 |
|---|---|
| `description` | 每個流程都應有文件說明 |
| `businessImpact` | 分類為 低 / 中 / 高 / 關鍵 |
| `businessJustification` | 高/關鍵影響流程必須提供 |
| `ownerTeam` | 每個流程都應有一個負責團隊 |
| `supportEmail` | 生產流程必須提供 |
| `monitor` | 關鍵流程必須提供 (注意：標準方案包含 20 個監控流程) |
| `rule_notify_onfail` | 建議用於受監控的流程 |
| `critical` | 指定業務關鍵流程 |

> 每個組織會定義自己的合規規則。上述欄位是基於常見 Power Platform 控管模式 (CoE 起步套件) 的建議。在將流程標記為不合規之前，請先詢問使用者的需求。
>
> **提示：** 透過 MCP 建立或更新的流程已經具有 `description` (由 `update_live_flow` 自動附加)。在 Power Automate 入口網站中手動建立的流程最有可能缺失控管 Metadata。

### 2. 偵測孤立資源

尋找由已刪除或已停用的 Azure AD 帳戶擁有的流程。

```
1. list_store_makers
2. 篩選 deleted=true 且 ownerFlowCount > 0 的項目
   注意：已刪除的建立者沒有 displayName/mail — 請記錄其 id (AAD OID)
3. list_store_flows → 收集所有流程
4. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析擁有者：json.loads(record["owners"])
   - 檢查是否有任何擁有者的 principalId 與孤立建立者的 id 相符
5. 回報孤立流程：建立者 id、流程名稱、流程狀態
6. 針對每個孤立流程：
   - 重新分配控管：update_store_flow(environmentName, flowName,
       ownerTeam="新團隊", supportEmail="new-owner@contoso.com")
   - 或停止服務：set_store_flow_state(environmentName, flowName,
       state="Stopped")
```

> `update_store_flow` 僅更新快取中的控管 Metadata。若要轉移實際的 PA 所有權，管理員必須使用 Power Platform 系統管理中心或 PowerShell。
>
> **注意：** 許多孤立流程是系統產生的 (由 `DataverseSystemUser` 帳戶建立，用於 SLA 監控、知識庫文章等)。這些從非人為建置 — 請考慮對其進行標記，而非重新分配。
>
> **涵蓋範圍：** 此工作流程僅搜尋快取儲存庫，而不搜尋即時 PA API。上次掃描後建立的流程不會出現。

### 3. 計算封存分數

計算每個流程的非活動分數 (0-7)，以識別安全的清理對象。與 CoE 起步套件的封存評分一致。

```
1. list_store_flows
2. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
3. 計算封存分數 (0-7)，符合以下每項加 1 分：
   +1  lastModifiedTime 與 createdTime 相差 24 小時內
   +1  displayName 包含 "test", "demo", "copy", "temp", 或 "backup"
       (不分大小寫)
   +1  createdTime 超過 12 個月
   +1  state 為 "Stopped" 或 "Suspended"
   +1  json.loads(owners) 為空陣列 []
   +1  runPeriodTotal = 0 (從未執行或最近無執行記錄)
   +1  解析 json.loads(complexity) → actions < 5
4. 分類：
   分數 5-7：建議封存 — 回報給使用者確認
   分數 3-4：標記待檢閱 →
     讀取 get_store_flow 回應中的現有標籤，附加 #archive-review
     update_store_flow(environmentName, flowName, tags="<現有> #archive-review")
   分數 0-2：活躍，無須動作
5. 針對使用者確認封存的流程：
   set_store_flow_state(environmentName, flowName, state="Stopped")
   讀取現有標籤，附加 #archived
   update_store_flow(environmentName, flowName, tags="<現有> #archived")
```

> **「封存」的意義：** Power Automate 沒有內建的封存功能。透過 MCP 封存意指：(1) 停止流程使其無法執行，以及 (2) 標記 `#archived` 以便未來清理時搜尋。實際刪除需要使用 Power Automate 入口網站或管理員 PowerShell — 無法透過 MCP 工具執行。

### 4. 連接器稽核

稽核受監控流程中正在使用的連接器。對 DLP 影響分析和進階授權規劃很有用。

```
1. list_store_flows(monitor=true)
   (範圍僅限受監控流程 — 稽核所有 1000+ 個流程成本太高)
2. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析連接：json.loads(record["connections"])
     傳回包含 apiName, apiId, connectionName 的物件陣列
   - 記錄流程層級的 tier 欄位 ("Standard" 或 "Premium")
3. 建立連接器清單：
   - 哪些 apiName 被使用，以及被多少流程使用
   - 哪些流程 tier="Premium" (偵測到進階連接器)
   - 哪些流程使用 HTTP 連接器 (apiName 包含 "http")
   - 哪些流程使用自定義連接器 (非 shared_ 前綴的 apiName)
4. 向使用者回報清單
   - 針對 DLP 分析：使用者提供其 DLP 原則連接器群組，代理程式對照清單進行交叉引用
```

> **範圍僅限受監控流程。** 每個流程都需要呼叫一次 `get_store_flow` 來讀取 `connections` JSON。標準方案約有 20 個受監控流程 — 尚可處理。在大型租用戶中稽核所有流程 (1000+) 的 API 呼叫成本將非常高。
>
> **`list_store_connections`** 傳回的是連接執行個體 (誰建立了哪個連接)，而「非」每個流程的連接器類型。請將其用於環境連接計數，而非連接器稽核。
>
> MCP 無法取得 DLP 原則定義。代理程式負責建立連接器清單；使用者提供 DLP 分類以供交叉引用。

### 5. 通知規則管理

大規模配置流程的監控與警示。

```
為所有關鍵流程啟用失敗警示：
1. list_store_flows(monitor=true)
2. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 如果 critical=true 且 rule_notify_onfail 不為 true：
     update_store_flow(environmentName, flowName,
       rule_notify_onfail=true,
       rule_notify_email="oncall@contoso.com")
   - 如果「沒有」流程 critical=true：這是一項控管發現。
     建議使用者在配置警示前，先使用 update_store_flow(critical=true) 
     將其最重要的流程指定為關鍵流程。

為排程流程啟用缺失執行偵測：
1. list_store_flows(monitor=true)
2. 針對 triggerType="Recurrence" 的每個流程 (可在清單回應中取得)：
   - 略過 state="Stopped" 或 "Suspended" 的流程 (不預期會執行)
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 如果 rule_notify_onmissingdays 為 0 或未設定：
     update_store_flow(environmentName, flowName,
       rule_notify_onmissingdays=2)
```

> `critical`, `rule_notify_onfail`, 和 `rule_notify_onmissingdays` 僅能透過 `get_store_flow` 取得，無法透過 `list_store_flows` 取得。清單呼叫會預先篩選出受監控的流程；詳細資訊呼叫則會檢查通知欄位。
>
> **監控限制：** 標準方案 (FlowStudio for Teams / MCP Pro+) 包含 20 個受監控流程。在批次啟用 `monitor=true` 之前，請先檢查已有多少流程被監控：
> `len(list_store_flows(monitor=true))`

### 6. 分類與標記

按連接器類型、業務功能或風險等級批次分類流程。

```
按連接器自動標記：
1. list_store_flows
2. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析連接：json.loads(record["connections"])
   - 根據 apiName 值建立標籤：
     shared_sharepointonline → #sharepoint
     shared_teams → #teams
     shared_office365 → #email
     自定義連接器 → #custom-connector
     HTTP 相關連接器 → #http-external
   - 讀取 get_store_flow 回應中的現有標籤，附加新標籤
   - update_store_flow(environmentName, flowName,
       tags="<現有標籤> #sharepoint #teams")
```

> **兩種標籤系統：** `list_store_flows` 中顯示的標籤是從流程的 `description` 欄位中自動提取的 (例如建立者在 PA 入口網站說明中寫入 `#operations`)。透過 `update_store_flow(tags=...)` 設定的標籤則寫入 Azure Table 快取中的獨立欄位。它們是獨立的 — 寫入儲存庫標籤不會更動說明，而在入口網站編輯說明也不會影響儲存庫標籤。
>
> **標籤合併：** `update_store_flow(tags=...)` 會覆蓋儲存庫標籤欄位。為避免遺失來自其他工作流程的標籤，請先從 `get_store_flow` 讀取目前的儲存庫標籤，附加新標籤後再寫回。
>
> `get_store_flow` 已經有一個由掃描管線計算出的 `tier` 欄位 (Standard/Premium)。除非您需要覆蓋它，否則不應使用 `update_store_flow(tier=...)`。

### 7. 建立者離職手續

當員工離職時，識別其流程與應用程式，並重新分配 Flow Studio 控管聯絡人及通知收件者。

```
1. get_store_maker(makerKey="<離職使用者的 AAD OID>")
   → 檢查 ownerFlowCount, ownerAppCount, 已刪除狀態
2. list_store_flows → 收集所有流程
3. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析擁有者：json.loads(record["owners"])
   - 如果任何 principalId 與離職使用者的 OID 相符 → 標記
4. list_store_power_apps → 篩選 ownerId 與該 OID 相符的項目
5. 針對每個被標記的流程：
   - 檢查 runPeriodTotal 和 runLast — 是否仍活躍？
   - 若要保留：
     update_store_flow(environmentName, flowName,
       ownerTeam="新團隊", supportEmail="new-owner@contoso.com")
   - 若要停止服務：
     set_store_flow_state(environmentName, flowName, state="Stopped")
     讀取現有標籤，附加 #decommissioned
     update_store_flow(environmentName, flowName, tags="<現有> #decommissioned")
6. 回報：已重新分配的流程、已停止的流程、需要手動重新分配的應用程式
```

> **此處「重新分配」的意義：** `update_store_flow` 變更的是 Flow Studio 認定的控管聯絡人以及接收 Flow Studio 通知的人員。它「不會」轉移實際的 Power Automate 流程所有權 — 那需要使用 Power Platform 系統管理中心或 PowerShell。同時請更新 `rule_notify_email`，使失敗通知發送給新團隊，而非離職員工的電子郵件。
>
> 無法透過 MCP 工具變更 Power Apps 所有權。請回報這些項目，以便在 Power Apps 系統管理中心進行手動重新分配。

### 8. 安全審查

使用快取儲存庫資料檢閱流程是否存在潛在安全疑慮。

```
1. list_store_flows(monitor=true)
2. 針對每個流程 (略過沒有 displayName 或 state=Deleted 的項目)：
   - 分割 id → environmentName, flowName
   - get_store_flow(environmentName, flowName)
   - 解析安全性：json.loads(record["security"])
   - 解析連接：json.loads(record["connections"])
   - 直接讀取 sharingType (頂層欄位，不在安全性 JSON 內)
3. 將發現結果回報給使用者檢閱
4. 針對已檢閱的流程：
   讀取現有標籤，附加 #security-reviewed
   update_store_flow(environmentName, flowName, tags="<現有> #security-reviewed")
   「不要」覆蓋安全性欄位 — 它包含結構化的驗證資料
```

**安全審查可用欄位：**

| 欄位 | 位置 | 代表意義 |
|---|---|---|
| `security.triggerRequestAuthenticationType` | 安全性 JSON | `"All"` = HTTP 觸發器接受未經驗證的請求 |
| `sharingType` | 頂層 | `"Coauthor"` = 已與共同作者共享以進行編輯 |
| `connections` | 連接 JSON | 流程使用了哪些連接器 (檢查 HTTP、自定義) |
| `referencedResources` | JSON 字串 | 流程存取的 SharePoint 站台、Teams 頻道、外部 URL |
| `tier` | 頂層 | `"Premium"` = 使用了進階連接器 |

> 各組織會自行決定何謂安全疑慮。例如，Webhook 接收器 (Stripe, GitHub) 預期會有未經驗證的 HTTP 觸發器，但對內部流程而言可能是一項風險。請在標記之前結合背景資訊檢閱結果。

### 9. 環境控管

稽核環境的合規性與擴張情況。

```
1. list_store_environments
   略過沒有 displayName 的項目 (租用戶層級的 Metadata 列)
2. 標記：
   - 開發人員環境 (sku="Developer") — 應受限制
   - 非受控環境 (isManagedEnvironment=false) — 控管較少
   - 注意：isAdmin=false 意指目前的服務帳戶缺少該環境的管理權限，而非該環境沒有管理員
3. list_store_flows → 按 environmentName 分組
   - 每個環境的流程計數
   - 失敗率分析：runPeriodFailRate 位於清單回應中 — 無需逐一呼叫 get_store_flow
4. list_store_connections → 按 environmentName 分組
   - 每個環境的連接計數
```

### 10. 控管儀表板

產生租用戶範圍的控管摘要。

```
高效指標 (僅限清單呼叫)：
1. total_flows = len(list_store_flows())
2. monitored = len(list_store_flows(monitor=true))
3. with_onfail = len(list_store_flows(rule_notify_onfail=true))
4. makers = list_store_makers()
   → active = deleted=false 的計數
   → orphan_count = deleted=true 且 ownerFlowCount > 0 的計數
5. apps = list_store_power_apps()
   → widely_shared = sharedUsersCount > 3 的計數
6. envs = list_store_environments() → 計數，按 sku 分組
7. conns = list_store_connections() → 計數

從清單資料計算：
- 監控百分比：monitored / total_flows
- 通知百分比：with_onfail / monitored
- 孤立資源計數：來自步驟 4
- 高風險計數：runPeriodFailRate > 0.2 的流程 (位於清單回應中)

詳細指標 (每個流程皆需 get_store_flow — 大型租用戶成本較高)：
- 合規百分比：已設定 businessImpact 的流程 / 總活躍流程
- 未說明計數：沒有說明的流程
- 層級分析：按 tier 欄位分組

針對詳細指標，請在單次遍歷中疊加：
  針對 list_store_flows 中的每個流程 (略過疏漏項目)：
    分割 id → environmentName, flowName
    get_store_flow(environmentName, flowName)
    → 累加 businessImpact, description, tier
```

---

## 欄位參考：控管中使用的 `get_store_flow` 欄位

以下所有欄位皆已確認存在於 `get_store_flow` 回應中。
標註 `*` 的欄位在 `list_store_flows` 中亦有提供 (成本較低)。

| 欄位 | 類型 | 控管用途 |
|---|---|---|
| `displayName` * | string | 封存分數 (測試/展示名稱偵測) |
| `state` * | string | 封存分數、生命週期管理 |
| `tier` | string | 授權稽核 (Standard vs Premium) |
| `monitor` * | bool | 此流程是否正在被積極監控？ |
| `critical` | bool | 業務關鍵指定 (可透過 update_store_flow 設置) |
| `businessImpact` | string | 合規分類 |
| `businessJustification` | string | 合規證明 |
| `ownerTeam` | string | 所有權責任歸屬 |
| `supportEmail` | string | 呈報聯絡人 |
| `rule_notify_onfail` | bool | 是否配置了失敗警示？ |
| `rule_notify_onmissingdays` | number | 是否配置了 SLA 監控？ |
| `rule_notify_email` | string | 警示收件者 |
| `description` | string | 文件完整性 |
| `tags` | string | 分類 — `list_store_flows` 僅顯示從說明提取的主題標籤；由 `update_store_flow` 寫入的儲存庫標籤需要 `get_store_flow` 才能讀回 |
| `runPeriodTotal` * | number | 活躍程度 |
| `runPeriodFailRate` * | number | 健全狀況狀態 |
| `runLast` | ISO string | 上次執行時間戳記 |
| `scanned` | ISO string | 資料新鮮度 |
| `deleted` | bool | 生命週期追蹤 |
| `createdTime` * | ISO string | 封存分數 (機齡) |
| `lastModifiedTime` * | ISO string | 封存分數 (過時程度) |
| `owners` | JSON string | 孤立偵測、所有權稽核 — 使用 json.loads() 解析 |
| `connections` | JSON string | 連接器稽核、層級 — 使用 json.loads() 解析 |
| `complexity` | JSON string | 封存分數 (簡單程度) — 使用 json.loads() 解析 |
| `security` | JSON string | 驗證類型稽核 — 使用 json.loads() 解析，包含 `triggerRequestAuthenticationType` |
| `sharingType` | string | 過度共享偵測 (頂層欄位，不在安全性 JSON 內) |
| `referencedResources` | JSON string | URL 稽核 — 使用 json.loads() 解析 |

---

## 相關技能

- `power-automate-monitoring` — 健全狀況檢查、失敗率、清單清單 (唯讀)
- `power-automate-mcp` — 基礎技能：連接設定、MCP 輔助程式、工具探索
- `power-automate-debug` — 透過動作層級的輸入/輸出進行深度診斷
- `power-automate-build` — 建置並部署流程定義
