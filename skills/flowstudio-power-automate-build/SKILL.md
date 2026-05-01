---
name: flowstudio-power-automate-build
description: >-
  使用 FlowStudio MCP 伺服器建置、建構並部署 Power Automate 雲端流程。
  您的代理程式將建構流程定義、佈線連接、部署並測試 — 全都透過 MCP 完成，
  無需開啟入口網站。
  當使用者要求執行以下操作時，請載入此技能：建立流程、建置新流程、
  部署流程定義、建構 Power Automate 工作流程腳手架、建構流程 JSON、
  更新現有流程的動作、修補流程定義、新增動作到流程、佈線連接，
  或從頭開始產生工作流程定義。
  需要 FlowStudio MCP 訂閱 — 詳見 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 建置與部署 Power Automate 流程

關於如何透過 FlowStudio MCP 伺服器，以程式化方式建構並部署 Power Automate 雲端流程的逐步指引。

**前提條件**：必須可連線至具有有效 JWT 的 FlowStudio MCP 伺服器。
連線設定請參閱 `power-automate-mcp` 技能。
請於 https://mcp.flowstudio.app 進行訂閱。

---

## 事實來源

> **務必先呼叫 `tools/list`** 以確認可用的工具名稱及其參數結構描述。
> 工具名稱和參數可能會隨伺服器版本而變更。
> 此技能涵蓋回應格式、行為備註及建置模式 —
> 這些是 `tools/list` 無法告訴您的內容。如果此文件與 `tools/list` 
> 或實際的 API 回應不符，以 API 為準。

---

## Python 輔助程式

```python
import json, urllib.request

MCP_URL   = "https://mcp.flowstudio.app/mcp"
MCP_TOKEN = "<您的 JWT 權杖>"

def mcp(tool, **kwargs):
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                          "params": {"name": tool, "arguments": kwargs}}).encode()
    req = urllib.request.Request(MCP_URL, data=payload,
        headers={"x-api-key": MCP_TOKEN, "Content-Type": "application/json",
                 "User-Agent": "FlowStudio-MCP/1.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=120)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MCP HTTP {e.code}: {body[:200]}") from e
    raw = json.loads(resp.read())
    if "error" in raw:
        raise RuntimeError(f"MCP 錯誤：{json.dumps(raw['error'])}")
    return json.loads(raw["result"]["content"][0]["text"])

ENV = "<環境 ID>"  # 例如 Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 步驟 1 — 安全檢查：流程是否已存在？

在建置之前，務必先確認是否已存在，以避免重複：

```python
results = mcp("list_live_flows", environmentName=ENV)

# list_live_flows 傳回 { "flows": [...] }
matches = [f for f in results["flows"]
           if "My New Flow".lower() in f["displayName"].lower()]

if len(matches) > 0:
    # 流程已存在 — 修改而非重新建立
    FLOW_ID = matches[0]["id"]   # 來自 list_live_flows 的純 UUID
    print(f"現有流程：{FLOW_ID}")
    defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
else:
    print("找不到流程 — 正在從頭開始建置")
    FLOW_ID = None
```

---

## 步驟 2 — 獲取連接參考 (Connection References)

每個連接器動作都需要一個 `connectionName`，它指向流程 `connectionReferences` 
對應表中的一個鍵。該鍵連結到環境中已通過驗證的連接。

> **強制性**：您「必須」先呼叫 `list_live_connections` — 「不要」向
> 使用者詢問連接名稱或 GUID。API 會傳回您需要的確切值。
> 只有在 API 確認缺少必要的連接時，才提示使用者。

### 2a — 務必先呼叫 `list_live_connections`

```python
conns = mcp("list_live_connections", environmentName=ENV)

# 僅篩選已連接 (已驗證) 的連接
active = [c for c in conns["connections"]
          if c["statuses"][0]["status"] == "Connected"]

# 建立查詢表：connectorName → connectionName (id)
conn_map = {}
for t in active:
    conn_map[t["connectorName"]] = t["id"]

print(f"找到 {len(active)} 個作用中的連接")
print("可用的連接器：", list(conn_map.keys()))
```

### 2b — 確定流程需要哪些連接器

根據您要建置的流程，識別需要哪些連接器。
常見的連接器 API 名稱：

| 連接器 | API 名稱 |
|---|---|
| SharePoint | `shared_sharepointonline` |
| Outlook / Office 365 | `shared_office365` |
| Teams | `shared_teams` |
| 核准 (Approvals) | `shared_approvals` |
| OneDrive for Business | `shared_onedriveforbusiness` |
| Excel Online (Business) | `shared_excelonlinebusiness` |
| Dataverse | `shared_commondataserviceforapps` |
| Microsoft Forms | `shared_microsoftforms` |

> **不需要任何連接的流程** (例如：僅包含週期性 + 撰寫 + HTTP) 
> 可以略過步驟 2 的其餘部分 — 在部署呼叫中省略 `connectionReferences`。

### 2c — 如果缺少連接，引導使用者

```python
connectors_needed = ["shared_sharepointonline", "shared_office365"]  # 根據每個流程調整

missing = [c for c in connectors_needed if c not in conn_map]

if not missing:
    print("✅ 所有必要的連接皆可用 — 正在繼續建置")
else:
    # ── 停止：必須互動式地建立連接 ──
    # 連接需要在瀏覽器中進行 OAuth 授權 — 任何 API 都無法直接建立。
    print("⚠️  此環境中下列連接器沒有作用中的連接：")
    for c in missing:
        friendly = c.replace("shared_", "").replace("onlinebusiness", " Online (Business)")
        print(f"   • {friendly}  (API 名稱：{c})")
    print()
    print("請建立缺少的連接：")
    print("  1. 開啟 https://make.powerautomate.com/connections")
    print("  2. 從右上角選擇器選取正確的環境")
    print("  3. 針對上方列出的每個缺失連接器，點擊「+ 新增連接」")
    print("  4. 在提示時登入並授權")
    print("  5. 完成後告訴我 — 我將重新檢查並繼續建置")
    # 在使用者確認之前不要繼續執行步驟 3。
    # 使用者確認後，重新執行步驟 2a 以重新整理 conn_map。
```

### 2d — 建置 connectionReferences 區塊

僅在 2c 確認沒有遺漏任何連接器後執行：

```python
connection_references = {}
for connector in connectors_needed:
    connection_references[connector] = {
        "connectionName": conn_map[connector],   # 來自 list_live_connections 的 GUID
        "source": "Invoker",
        "id": f"/providers/Microsoft.PowerApps/apis/{connector}"
    }
```

> **重要 — 動作中的 `host.connectionName`**：在步驟 3 建置動作時，
> 將 `host.connectionName` 設為此對應表中的「鍵」(例如 `shared_teams`)，
> 而「非」連接 GUID。GUID 僅應置於 `connectionReferences` 條目中。
> 引擎會將動作的 `host.connectionName` 與鍵進行比對，以找到正確的連接。

> **替代方案** — 如果您已經有一個使用相同連接器的流程，
> 您可以從其定義中提取 `connectionReferences`：
> ```python
> ref_flow = mcp("get_live_flow", environmentName=ENV, flowName="<現有流程 ID>")
> connection_references = ref_flow["properties"]["connectionReferences"]
> ```

完整的連接參考結構，請參閱 `power-automate-mcp` 技能的 **connection-references.md** 參考。

---

## 步驟 3 — 建置流程定義

建構定義物件。完整的結構描述請參閱 [flow-schema.md](references/flow-schema.md)，
複製並貼上範本請參閱這些動作模式參考：
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、解析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint, Outlook, Teams, Approvals

```python
definition = {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "triggers": { ... },   # 參閱 trigger-types.md / build-patterns.md
    "actions": { ... }     # 參閱 ACTION-PATTERNS-*.md / build-patterns.md
}
```

> 完整的、隨插即用的流程定義 (涵蓋 週期性+SharePoint+Teams, HTTP 觸發器等)，
> 請參閱 [build-patterns.md](references/build-patterns.md)。

---

## 步驟 3a — 解析連接器動態值

當動作輸入需要從連接器下拉選單中選取值時 (例如 SharePoint 清單 ID、Dataverse 資料表名稱、使用者的 Azure AD UPN)，
請使用 `get_live_dynamic_options` 透過 MCP 進行解析，而非硬寫 GUID。

```python
# 依站台解析 SharePoint 清單
opts = mcp("get_live_dynamic_options",
    environmentName=ENV,
    connectorName="shared_sharepointonline",
    operationId="GetTables",
    parameters={"dataset": "https://contoso.sharepoint.com/sites/HR"})
# opts["value"] → [{"Name": "<list-guid>", "DisplayName": "Employees"}, ...]
```

> **外部參數自動橋接** (伺服器 v1.1.6+)：您可以直接在 `parameters` 中傳遞任意外部參數 — 
> 伺服器現在會自動合成 PA `listEnum` 所需的 `parameterReference` 映射。
> 在 1.1.6 之前，您必須手動宣告 `dynamicMetadata.parameters: {paramName: {parameterReference: "name"}}`，
> 否則會收到 `IncorrectDynamicInvokeParameter` 錯誤。這使得透過動態選項管道 
> (例如 `shared_office365users.SearchUserV2` 進行 AAD 使用者查詢) 呼叫任意連接器操作變得實用。

### AadGraph 使用者選擇器備援

對於 Outlook 動作 (如 `GetEmailsV3`，其參數為 `mailboxAddress`, `to`, `cc`, `from`)，
PA 的 `listEnum` 使用 `builtInOperation:AadGraph.GetUsers` — 但此功能已損壞，
且每次呼叫都會傳回 `DynamicListValuesUndefinedOrInvalid`。

`describe_live_connector` (v1.1.6+) 會偵測這些參數，並在每個受影響的參數上 
傳回一個指向可用替代方案的結構化 `fallback` 欄位。**請使用 `shared_office365users.SearchUserV2`** 
來解析相同的 AAD 使用者格式 `{value: [{id, displayName, mail, userPrincipalName, ...}]}`：

```python
# 借用一個 shared_office365users 連接 (任何作用中的連接皆可)
conn = next(c for c in conn_map if "office365users" in c)

users = mcp("get_live_dynamic_options",
    environmentName=ENV,
    connectorName="shared_office365users",
    connectionName=conn_map[conn],   # 參見步驟 2a
    operationId="SearchUserV2",
    parameters={"searchTerm": "john", "top": 10})
# users["value"] → [{"Id": "...", "DisplayName": "John Smith", "Mail": "..."}, ...]
```

然後將解析出的 `Mail` 值填入 Outlook 動作的參數中 — 無需直接呼叫 `AadGraph.GetUsers`。

---

## 步驟 4 — 部署 (建立或更新)

`update_live_flow` 工具可同時處理建立與更新。

### 建立新流程 (尚無現有流程)

省略 `flowName` — 伺服器會產生新的 GUID 並透過 PUT 建立：

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    # 省略 flowName → 建立新流程
    definition=definition,
    connectionReferences=connection_references,
    displayName="Overdue Invoice Notifications",
    description="每週 SharePoint → Teams 通知流程，由代理程式建置"
)

if result.get("error") is not None:
    print("建立失敗：", result["error"])
else:
    # 獲取新流程 ID 以供後續步驟使用
    FLOW_ID = result["created"]
    print(f"✅ 流程已建立：{FLOW_ID}")
```

### 更新現有流程

提供 `flowName` 以進行 PATCH：

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    displayName="我的更新後流程",
    description="由代理程式更新於 " + __import__('datetime').datetime.utcnow().isoformat()
)

if result.get("error") is not None:
    print("更新失敗：", result["error"])
else:
    print("更新成功：", result)
```

> ⚠️ `update_live_flow` 始終會傳回 `error` 鍵。
> `null` (Python `None`) 表示成功 — 不要因為該鍵存在就視為失敗。
>
> ⚠️ 建立和更新時，「說明 (description)」欄位皆為必填。

### 常見部署錯誤

| 錯誤訊息 (包含) | 原因 | 修正方式 |
|---|---|---|
| `missing from connectionReferences` | 動作的 `host.connectionName` 參考了對應表中不存在的鍵 | 確保 `host.connectionName` 使用 `connectionReferences` 中的「鍵」(例如 `shared_teams`)，而非原始 GUID |
| `ConnectionAuthorizationFailed` / 403 | 連接 GUID 屬於其他使用者或未經授權 | 重新執行步驟 2a，並使用屬於目前 `x-api-key` 使用者的連接 |
| `InvalidTemplate` / `InvalidDefinition` | 定義 JSON 中存在語法錯誤 | 檢查 `runAfter` 鏈、運算式語法及動作類型拼字 |
| `ConnectionNotConfigured` | 連接器動作存在，但連接 GUID 無效或已過期 | 重新檢查 `list_live_connections` 以獲取新的 GUID |

---

## 步驟 5 — 驗證部署

```python
check = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)

# 確認狀態
print("狀態：", check["properties"]["state"])  # 應為 "Started"
# 如果狀態為 "Stopped"，請使用 set_live_flow_state — 而「非」update_live_flow
# mcp("set_live_flow_state", environmentName=ENV, flowName=FLOW_ID, state="Started")

# 確認我們新增的動作是否存在
acts = check["properties"]["definition"]["actions"]
print("動作：", list(acts.keys()))
```

---

## 步驟 6 — 測試流程

> **強制性**：在觸發任何測試執行之前，**務必詢問使用者以獲得確認**。
> 執行流程會產生實際的副作用 — 它可能會傳送電子郵件、發布 Teams 訊息、
> 寫入 SharePoint、啟動核准或呼叫外部 API。請解釋流程將執行的操作，
> 並等待明確核准後再呼叫 `trigger_live_flow` 或 `resubmit_live_flow_run`。

### 已更新的流程 (已有過往執行記錄) — 適用於「任何」觸發器類型

> **優先使用 `resubmit_live_flow_run`**。它適用於「每一種」觸發器類型 — 
> 週期性、SharePoint、連接器 Webhook、按鈕及 HTTP。它會重播
> 原始的觸發酬載。「不要」要求使用者手動觸發流程，或等待下一次排程執行。

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=1)
if runs:
    # 適用於週期性、SharePoint、連接器觸發器 — 不僅限於 HTTP
    result = mcp("resubmit_live_flow_run",
        environmentName=ENV, flowName=FLOW_ID, runName=runs[0]["name"])
    print(result)   # {"resubmitted": true, "triggerName": "..."}
```

### HTTP 觸發的流程 — 自定義測試酬載

只有當您需要傳送與原始執行「不同」的酬載時，才使用 `trigger_live_flow`。
為了驗證修復，`resubmit_live_flow_run` 會更好，因為它使用導致 
失敗的完全相同的資料。

```python
schema = mcp("get_live_flow_http_schema",
    environmentName=ENV, flowName=FLOW_ID)
print("預期主體 (body)：", schema.get("requestSchema"))

result = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID,
    body={"name": "Test", "value": 1})
print(f"狀態：{result['responseStatus']}")
```

### 全新的非 HTTP 流程 (週期性、連接器觸發器等)

全新的週期性或連接器觸發流程**沒有過往的執行記錄**可供 
重新提交，也沒有可呼叫的 HTTP 端點。這是您需要下列 
「臨時 HTTP 觸發器」方法的唯一場景。**先使用臨時的 
HTTP 觸發器進行部署，測試動作，然後再更換為生產觸發器。**

#### 7a — 儲存實際觸發器，使用臨時 HTTP 觸發器進行部署

```python
# 儲存在步驟 3 建置的生產觸發器
production_trigger = definition["triggers"]

# 替換為臨時 HTTP 觸發器
definition["triggers"] = {
    "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
            "schema": {}
        }
    }
}

# 使用臨時觸發器部署 (建立或更新)
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,       # 若為新建則省略
    definition=definition,
    connectionReferences=connection_references,
    displayName="Overdue Invoice Notifications",
    description="使用臨時 HTTP 觸發器部署以進行測試")

if result.get("error") is not None:
    print("部署失敗：", result["error"])
else:
    if not FLOW_ID:
        FLOW_ID = result["created"]
    print(f"✅ 已使用臨時 HTTP 觸發器部署：{FLOW_ID}")
```

#### 7b — 啟動流程並檢查結果

```python
# 觸發流程
test = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID)
print(f"觸發回應狀態：{test['status']}")

# 等待執行完成
import time; time.sleep(15)

# 檢查執行結果
runs = mcp("get_live_flow_runs",
    environmentName=ENV, flowName=FLOW_ID, top=1)
run = runs[0]
print(f"執行記錄 {run['name']}：{run['status']}")

if run["status"] == "Failed":
    err = mcp("get_live_flow_run_error",
        environmentName=ENV, flowName=FLOW_ID, runName=run["name"])
    root = err["failedActions"][-1]
    print(f"根本原因：{root['actionName']} → {root.get('code')}")
    # 在繼續之前，偵錯並修正定義
    # 完整的診斷工作流程，請參閱 power-automate-debug 技能
```

#### 7c — 更換為生產觸發器

一旦測試執行成功，請將臨時 HTTP 觸發器替換為真實的觸發器：

```python
# 還原生產觸發器
definition["triggers"] = production_trigger

result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    description="測試成功後切換至生產觸發器")

if result.get("error") is not None:
    print("觸發器切換失敗：", result["error"])
else:
    print("✅ 生產觸發器已部署 — 流程已上線")
```

> **原理**：觸發器只是進入點 — 無論流程如何啟動，動作都是相同的。
> 透過 HTTP 觸發器進行測試可以練習所有相同的「撰寫 (Compose)」、SharePoint、Teams 等動作。
>
> **連接器觸發器** (例如：「在 SharePoint 中建立項目時」)：
> 如果動作參考了 `triggerBody()` 或 `triggerOutputs()`，請在 
> `trigger_live_flow` 的 `body` 參數中傳遞一個具代表性的測試酬載，
> 其格式應與連接器觸發器產生的格式一致。

---

## 注意事項

| 錯誤 | 後果 | 預防措施 |
|---|---|---|
| 部署時缺少 `connectionReferences` | 400 「請提供 connectionReferences」 | 務必先呼叫 `list_live_connections` |
| Foreach 缺少 `"operationOptions"` | 平行執行，導致寫入時產生競爭條件 | 務必新增 `"Sequential"` |
| `union(old_data, new_data)` | 舊值覆蓋新值 (優先者勝) | 請使用 `union(new_data, old_data)` |
| 對可能為空的字串執行 `split()` | `InvalidTemplate` 崩潰 | 請使用 `coalesce(field, '')` 包裝 |
| 檢查 `result["error"]` 是否存在 | 始終存在；真正的錯誤是 `!= null` | 請使用 `result.get("error") is not None` |
| 流程已部署但狀態為 「Stopped」 | 流程不會按排程執行 | 呼叫 `set_live_flow_state` 並設為 `state: "Started"` — 「不要」使用 `update_live_flow` 變更狀態 |
| Teams 「與 Flow 機器人聊天」 接收者為物件 | 400 `GraphUserDetailNotFound` | 請使用帶有「末尾分號」的純電子郵件字串 (詳見下文) |

### Teams `PostMessageToConversation` — 接收者格式

`body/recipient` 參數格式取決於 `location` 的值：

| 位置 (Location) | `body/recipient` 格式 | 範例 |
|---|---|---|
| **與 Flow 機器人聊天** | 帶有**末尾分號**的純電子郵件字串 | `"user@contoso.com;"` |
| **頻道** | 包含 `groupId` 和 `channelId` 的物件 | `{"groupId": "...", "channelId": "..."}` |

> **常見錯誤**：在「與 Flow 機器人聊天」中傳遞 `{"to": "user@contoso.com"}` 
> 會傳回 400 `GraphUserDetailNotFound` 錯誤。API 需要的是一個純字串。

---

## 參考檔案

- [flow-schema.md](references/flow-schema.md) — 完整的流程定義 JSON 結構描述
- [trigger-types.md](references/trigger-types.md) — 觸發器類型範本
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、解析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint, Outlook, Teams, Approvals
- [build-patterns.md](references/build-patterns.md) — 完整的流程定義範本 (週期性+SP+Teams, HTTP 觸發器)

## 相關技能

- `power-automate-mcp` — 基礎技能：連接設定、MCP 輔助程式、工具探索
- `power-automate-debug` — 在部署後對失敗的流程進行偵錯
