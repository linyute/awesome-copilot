---
name: flowstudio-power-automate-build
description: >-
  使用 FlowStudio MCP 伺服器建構、鷹架並部署 Power Automate 雲端流程。您的代理程式會建構流程定義、連接連接器、部署並測試 — 全部透過 MCP 執行，無需開啟入口網站。
  在被要求執行以下操作時載入此技能：建立流程、建構新流程、部署流程定義、鷹架 Power Automate 工作流程、建構流程 JSON、更新現有流程的動作、修補流程定義、新增動作至流程、連接連接器，或從頭產生工作流程定義。
  需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 建構與部署 Power Automate 流程

透過 FlowStudio MCP 伺服器以程式方式建構與部署 Power Automate 雲端流程的分步指南。

**先決條件**：必須能夠存取 FlowStudio MCP 伺服器並具有有效的 JWT。
請參閱 `flowstudio-power-automate-mcp` 技能以進行連接設定。
訂閱請至 https://mcp.flowstudio.app

---

## 真理來源 (Source of Truth)

> **請務必先呼叫 `tools/list`** 以確認可用的工具名稱及其參數結構。工具名稱和參數可能會隨伺服器版本而變更。
> 此技能涵蓋回應形狀、行為備註和建構模式 — `tools/list` 無法告訴您的內容。如果本文件與 `tools/list` 或實際的 API 回應有衝突，請以 API 為準。

---

## Python 輔助程式

```python
import json, urllib.request

MCP_URL   = "https://mcp.flowstudio.app/mcp"
MCP_TOKEN = "<YOUR_JWT_TOKEN>"

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
        raise RuntimeError(f"MCP error: {json.dumps(raw['error'])}")
    return json.loads(raw["result"]["content"][0]["text"])

ENV = "<environment-id>"  # 例如 Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 步驟 1 — 安全性檢查：流程是否已存在？

建構前請務必檢查，以避免重複：

```python
results = mcp("list_live_flows", environmentName=ENV)

# list_live_flows 回傳 { "flows": [...] }
matches = [f for f in results["flows"]
           if "My New Flow".lower() in f["displayName"].lower()]

if len(matches) > 0:
    # 流程存在 — 修改而非建立
    FLOW_ID = matches[0]["id"]   # 來自 list_live_flows 的純 UUID
    print(f"Existing flow: {FLOW_ID}")
    defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
else:
    print("Flow not found — building from scratch")
    FLOW_ID = None
```

---

## 步驟 2 — 取得連接參考 (Connection References)

每個連接器動作都需要一個 `connectionName`，指向流程 `connectionReferences` 對應表中的鍵。該鍵連結至環境中已驗證的連接。

> **強制性：** 您 **必須** 先呼叫 `list_live_connections` — 請 **不要** 向使用者詢問連接名稱或 GUID。API 會回傳您所需的確切數值。只有在 API 確認缺少所需的連接時，才提示使用者。

### 2a — 一律先呼叫 `list_live_connections`

```python
conns = mcp("list_live_connections", environmentName=ENV)

# 過濾僅已連接（已驗證）的連接
active = [c for c in conns["connections"]
          if c["statuses"][0]["status"] == "Connected"]

# 建立查詢對應：connectorName → connectionName (id)
conn_map = {}
for c in active:
    conn_map[c["connectorName"]] = c["id"]

print(f"Found {len(active)} active connections")
print("Available connectors:", list(conn_map.keys()))
```

### 2b — 判斷流程所需的連接器

根據您要建構的流程，識別所需的連接器。
常見的連接器 API 名稱：

| 連接器 | API 名稱 |
|---|---|
| SharePoint | `shared_sharepointonline` |
| Outlook / Office 365 | `shared_office365` |
| Teams | `shared_teams` |
| Approvals | `shared_approvals` |
| OneDrive for Business | `shared_onedriveforbusiness` |
| Excel Online (Business) | `shared_excelonlinebusiness` |
| Dataverse | `shared_commondataserviceforapps` |
| Microsoft Forms | `shared_microsoftforms` |

> **不需要連接的流程** (例如僅 Recurrence + Compose + HTTP)
> 可以跳過步驟 2 的其餘部分 — 在部署呼叫中省略 `connectionReferences`。

### 2c — 如果缺少連接，請引導使用者

```python
connectors_needed = ["shared_sharepointonline", "shared_office365"]  # 視流程調整

missing = [c for c in connectors_needed if c not in conn_map]

if not missing:
    print("✅ All required connections are available — proceeding to build")
else:
    # ── 停止：連接必須以互動方式建立 ──
    # 連接需要在瀏覽器中進行 OAuth 同意 — 沒有 API 可以建立它們。
    print("⚠️  以下連接器在此環境中沒有作用中的連接：")
    for c in missing:
        friendly = c.replace("shared_", "").replace("onlinebusiness", " Online (Business)")
        print(f"   • {friendly}  (API name: {c})")
    print()
    print("請建立遺失的連接：")
    print("  1. 開啟 https://make.powerautomate.com/connections")
    print("  2. 從右上角的選擇器中選擇正確的環境")
    print("  3. 針對上方列出的每個遺失的連接器，點選 '+ New connection'")
    print("  4. 登入並在提示時進行授權")
    print("  5. 完成後告訴我 — 我會重新檢查並繼續建構")
    # 使用者確認前，請勿執行步驟 3。
    # 使用者確認後，重新執行步驟 2a 以重新整理 conn_map。
```

### 2d — 建構 connectionReferences 區塊

僅在 2c 確認沒有遺失連接器後才執行此動作：

```python
connection_references = {}
for connector in connectors_needed:
    connection_references[connector] = {
        "connectionName": conn_map[connector],   # 來自 list_live_connections 的 GUID
        "source": "Invoker",
        "id": f"/providers/Microsoft.PowerApps/apis/{connector}"
    }
```

> **重要 — 動作中的 `host.connectionName`**：在步驟 3 中建構動作時，請將 `host.connectionName` 設定為此對應表中的 **鍵** (例如 `shared_teams`)，而非連接 GUID。GUID 僅包含在 `connectionReferences` 項目中。引擎會將動作的 `host.connectionName` 與鍵進行匹配，以找到正確的連接。

> **替代方案** — 如果您已有使用相同連接器的流程，
> 可以從其定義中擷取 `connectionReferences`：
> ```python
> ref_flow = mcp("get_live_flow", environmentName=ENV, flowName="<existing-flow-id>")
> connection_references = ref_flow["properties"]["connectionReferences"]
> ```

請參閱 `flowstudio-power-automate-mcp` 技能的 **connection-references.md** 參考文件，以了解完整的連接參考結構。

---

## 步驟 3 — 建構流程定義

建構定義物件。請參閱 [flow-schema.md](references/flow-schema.md) 以取得完整結構描述，並參考這些動作模式以進行複製貼上：
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、流程控制、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、解析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint, Outlook, Teams, Approvals

```python
definition = {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "triggers": { ... },   # 請參閱 trigger-types.md / build-patterns.md
    "actions": { ... }     # 請參閱 ACTION-PATTERNS-*.md / build-patterns.md
}
```

> 請參閱 [build-patterns.md](references/build-patterns.md) 以取得完整的、隨時可用的流程定義範本，涵蓋 Recurrence+SharePoint+Teams、HTTP 觸發程序等。

---

## 步驟 4 — 部署 (建立或更新)

`update_live_flow` 在單一工具中同時處理建立與更新。

### 建立新流程 (無現有流程)

省略 `flowName` — 伺服器會產生新的 GUID 並透過 PUT 建立：

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    # 省略 flowName → 建立新流程
    definition=definition,
    connectionReferences=connection_references,
    displayName="Overdue Invoice Notifications",
    description="Weekly SharePoint → Teams notification flow, built by agent"
)

if result.get("error") is not None:
    print("Create failed:", result["error"])
else:
    # 擷取新流程 ID 以供後續步驟使用
    FLOW_ID = result["created"]
    print(f"✅ Flow created: {FLOW_ID}")
```

### 更新現有流程

提供 `flowName` 以執行 PATCH：

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    displayName="My Updated Flow",
    description="Updated by agent on " + __import__('datetime').datetime.utcnow().isoformat()
)

if result.get("error") is not None:
    print("Update failed:", result["error"])
else:
    print("Update succeeded:", result)
```

> ⚠️ `update_live_flow` 一律回傳 `error` 鍵。
> `null` (Python `None`) 表示成功 — 請勿將該鍵的存在視為失敗。
>
> ⚠️ `description` 對於建立和更新都是必要的。

### 常見部署錯誤

| 錯誤訊息 (包含) | 原因 | 修復方法 |
|---|---|---|
| `missing from connectionReferences` | 動作的 `host.connectionName` 參考了不存在於 `connectionReferences` 對應表中的鍵 | 確保 `host.connectionName` 使用 **鍵** (例如 `shared_teams`)，而非原始 GUID |
| `ConnectionAuthorizationFailed` / 403 | 連接 GUID 屬於其他使用者或未經授權 | 重新執行步驟 2a，並使用目前的 `x-api-key` 使用者所擁有的連接 |
| `InvalidTemplate` / `InvalidDefinition` | 定義 JSON 中的語法錯誤 | 檢查 `runAfter` 鏈、運算式語法和動作型別拼字 |
| `ConnectionNotConfigured` | 存在連接器動作但連接 GUID 無效或過期 | 重新檢查 `list_live_connections` 以取得新的 GUID |

---

## 步驟 5 — 驗證部署

```python
check = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)

# 確認狀態
print("State:", check["properties"]["state"])  # 應為 "Started"
# 如果狀態為 "Stopped"，請使用 set_live_flow_state — 請勿使用 update_live_flow
# mcp("set_live_flow_state", environmentName=ENV, flowName=FLOW_ID, state="Started")

# 確認新增的動作是否存在
acts = check["properties"]["definition"]["actions"]
print("Actions:", list(acts.keys()))
```

---

## 步驟 6 — 測試流程

> **強制性：** 在觸發任何測試執行之前，**請務必向使用者徵求確認**。
> 執行流程具有實際的副作用 — 它可能會傳送電子郵件、張貼 Teams 訊息、寫入 SharePoint、啟動核准或呼叫外部 API。請說明流程將執行的動作，並在呼叫 `trigger_live_flow` 或 `resubmit_live_flow_run` 前等待明確核准。

### 更新流程 (具有先前的執行記錄) — 任何觸發程序型別

> **請優先使用 `resubmit_live_flow_run`。** 它適用於 **所有** 觸發程序型別 — Recurrence、SharePoint、連接器 Webhook、按鈕和 HTTP。它會重播原始的觸發負載。請勿要求使用者手動觸發流程或等待下一次排程執行。

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=1)
if runs:
    # 適用於 Recurrence、SharePoint、連接器觸發程序 — 不僅僅是 HTTP
    result = mcp("resubmit_live_flow_run",
        environmentName=ENV, flowName=FLOW_ID, runName=runs[0]["name"])
    print(result)   # {"resubmitted": true, "triggerName": "..."}
```

### HTTP 觸發的流程 — 自訂測試負載

僅在需要傳送與原始執行不同的負載時，才使用 `trigger_live_flow`。若要驗證修復，`resubmit_live_flow_run` 更好，因為它使用了導致失敗的精確資料。

```python
schema = mcp("get_live_flow_http_schema",
    environmentName=ENV, flowName=FLOW_ID)
print("Expected body:", schema.get("requestSchema"))

result = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID,
    body={"name": "Test", "value": 1})
print(f"Status: {result['responseStatus']}")
```

### 全新非 HTTP 流程 (Recurrence、連接器觸發程序等)

全新的 Recurrence 或連接器觸發流程沒有先前的執行記錄可供重播，也沒有 HTTP 端點可呼叫。這是唯一需要下方臨時 HTTP 觸發方式的情境。**請先以臨時 HTTP 觸發程序部署，測試動作，然後再切換至生產觸發程序。**

#### 7a — 儲存實際觸發程序，以臨時 HTTP 觸發程序部署

```python
# 儲存您在步驟 3 中建構的生產觸發程序
production_trigger = definition["triggers"]

# 替換為臨時 HTTP 觸發程序
definition["triggers"] = {
    "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
            "schema": {}
        }
    }
}

# 使用臨時觸發程序部署 (建立或更新)
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,       # 若建立新流程則省略
    definition=definition,
    connectionReferences=connection_references,
    displayName="Overdue Invoice Notifications",
    description="Deployed with temp HTTP trigger for testing")

if result.get("error") is not None:
    print("Deploy failed:", result["error"])
else:
    if not FLOW_ID:
        FLOW_ID = result["created"]
    print(f"✅ Deployed with temp HTTP trigger: {FLOW_ID}")
```

#### 7b — 觸發流程並檢查結果

```python
# 觸發流程
test = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID)
print(f"Trigger response status: {test['status']}")

# 等待執行完成
import time; time.sleep(15)

# 檢查執行結果
runs = mcp("get_live_flow_runs",
    environmentName=ENV, flowName=FLOW_ID, top=1)
run = runs[0]
print(f"Run {run['name']}: {run['status']}")

if run["status"] == "Failed":
    err = mcp("get_live_flow_run_error",
        environmentName=ENV, flowName=FLOW_ID, runName=run["name"])
    root = err["failedActions"][-1]
    print(f"Root cause: {root['actionName']} → {root.get('code')}")
    # 在繼續前進行偵錯並修正定義
    # 請參閱 flowstudio-power-automate-debug 技能以了解完整的診斷流程
```

#### 7c — 切換至生產觸發程序

一旦測試執行成功，請將臨時 HTTP 觸發程序替換回實際觸發程序：

```python
# 還原生產觸發程序
definition["triggers"] = production_trigger

result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    description="Swapped to production trigger after successful test")

if result.get("error") is not None:
    print("Trigger swap failed:", result["error"])
else:
    print("✅ Production trigger deployed — flow is live")
```

> **為什麼這樣有效**：觸發程序僅僅是進入點 — 無論流程如何啟動，動作都是相同的。透過 HTTP 觸發測試可以練習相同的 Compose、SharePoint、Teams 等動作。
>
> **連接器觸發程序** (例如「當項目在 SharePoint 中建立時」)：
> 如果動作參考 `triggerBody()` 或 `triggerOutputs()`，請在 `trigger_live_flow` 的 `body` 參數中傳入與連接器觸發程序產生的形狀相符的測試負載。

---

## 陷阱 (Gotchas)

| 錯誤 | 後果 | 預防 |
|---|---|---|
| 部署中缺少 `connectionReferences` | 400 "Supply connectionReferences" | 一律先呼叫 `list_live_connections` |
| Foreach 缺少 `"operationOptions"` | 平行執行，寫入時發生競爭條件 | 一律新增 `"Sequential"` |
| `union(old_data, new_data)` | 舊值覆寫新值 (先到的獲勝) | 使用 `union(new_data, old_data)` |
| 對潛在 Null 字串執行 `split()` | `InvalidTemplate` 當機 | 使用 `coalesce(field, '')` 包裹 |
| 檢查 `result["error"]` 是否存在 | 一律存在；真正的錯誤為 `!= null` | 使用 `result.get("error") is not None` |
| 流程已部署但狀態為 "Stopped" | 流程不會按排程執行 | 呼叫 `set_live_flow_state` 並設定 `state: "Started"` — 請 **不要** 使用 `update_live_flow` 進行狀態變更 |
| Teams "Chat with Flow bot" 收件者為物件 | 400 `GraphUserDetailNotFound` | 使用帶有後綴分號的純字串 (請參閱下方) |

### Teams `PostMessageToConversation` — 收件者格式

`body/recipient` 參數格式取決於 `location` 的數值：

| 位置 | `body/recipient` 格式 | 範例 |
|---|---|---|
| **Chat with Flow bot** | 帶有 **後綴分號** 的純電子郵件字串 | `"user@contoso.com;"` |
| **Channel** | 包含 `groupId` 和 `channelId` 的物件 | `{"groupId": "...", "channelId": "..."}` |

> **常見錯誤**：將 `{"to": "user@contoso.com"}` 傳給 "Chat with Flow bot" 會回傳 400 `GraphUserDetailNotFound` 錯誤。API 需要純字串。

---

## 參考檔案

- [flow-schema.md](references/flow-schema.md) — 完整流程定義 JSON 結構描述
- [trigger-types.md](references/trigger-types.md) — 觸發程序型別範本
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、流程控制、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、解析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint, Outlook, Teams, Approvals
- [build-patterns.md](references/build-patterns.md) — 完整的流程定義範本 (Recurrence+SP+Teams, HTTP 觸發程序)

## 相關技能

- `flowstudio-power-automate-mcp` — 核心連接設定與工具參考
- `flowstudio-power-automate-debug` — 部署後對失敗流程進行偵錯
