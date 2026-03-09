---
name: flowstudio-power-automate-build
description: >-
  使用 FlowStudio MCP 伺服器建構、架構並部署 Power Automate 雲端流程。當被要求執行下列工作時載入此技能：建立流程、建構新流程、部署流程定義、架構 Power Automate 工作流程、建構流程 JSON、更新現有流程的動作、修補流程定義、將動作加入流程、接通連線，或從頭開始產生工作流程定義。需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 建構與部署 Power Automate 流程

透過 FlowStudio MCP 伺服器以程式化方式建構與部署 Power Automate 雲端流程的逐步指南。

**先決條件**：必須可連線至具備有效 JWT 的 FlowStudio MCP 伺服器。
有關連線設定，請參閱 `flowstudio-power-automate-mcp` 技能。
請至 https://mcp.flowstudio.app 訂閱

---

## 資訊來源 (Source of Truth)

> **務必先呼叫 `tools/list`** 以確認可用的工具名稱及其參數 Schema。工具名稱與參數可能會隨伺服器版本而變更。本技能涵蓋了回應形式、行為說明及建構模式 — 這些是 `tools/list` 無法告訴您的資訊。如果此文件與 `tools/list` 或實際的 API 回應不符，請以 API 為準。

---

## Python 輔助程式 (Python Helper)

```python
import json, urllib.request

MCP_URL   = "https://mcp.flowstudio.app/mcp"
MCP_TOKEN = "<您的_JWT_TOKEN>"

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
        raise RuntimeError(f"MCP 錯誤: {json.dumps(raw['error'])}")
    return json.loads(raw["result"]["content"][0]["text"])

ENV = "<環境-識別碼>"  # 範例：Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 步驟 1 — 安全檢查：流程是否已存在？

在建構之前務必先檢查，以避免重複：

```python
results = mcp("list_store_flows",
    environmentName=ENV, searchTerm="我的新流程")

# list_store_flows 直接傳回陣列 (無包裝物件)
if len(results) > 0:
    # 流程已存在 — 進行修改而非建立
    # id 格式為 "envId.flowId" — 進行分割以取得流程 UUID
    FLOW_ID = results[0]["id"].split(".", 1)[1]
    print(f"現有流程：{FLOW_ID}")
    defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
else:
    print("找不到流程 — 從頭開始建構")
    FLOW_ID = None
```

---

## 步驟 2 — 取得連線參考 (Connection References)

每個連接器動作都需要一個 `connectionName`，指向流程 `connectionReferences` 對應表 (map) 中的一個鍵 (key)。該鍵會連結到環境中已通過驗證的連線。

> **強制要求**：您必須先呼叫 `list_live_connections` — **不可** 向使用者詢問連線名稱或 GUID。API 會傳回您確切需要的數值。僅在 API 確認缺少所需連線時才提示使用者。

### 2a — 務必先呼叫 `list_live_connections`

```python
conns = mcp("list_live_connections", environmentName=ENV)

# 僅篩選出已連線 (已驗證) 的連線
active = [c for c in conns["connections"]
          if c["statuses"][0]["status"] == "Connected"]

# 建立查閱表：connectorName → connectionName (id)
conn_map = {}
for c in active:
    conn_map[c["connectorName"]] = c["id"]

print(f"找到 {len(active)} 個作用中的連線")
print("可用的連接器：", list(conn_map.keys()))
```

### 2b — 確定流程需要哪些連接器

根據您正在建構的流程，識別需要哪些連接器。常見連接器 API 名稱：

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

> **不需要連線的流程** (例如僅使用循環、組合與 HTTP) 可以跳過步驟 2 的其餘部分 — 在部署呼叫中省略 `connectionReferences`。

### 2c — 如果缺少連線，引導使用者

```python
connectors_needed = ["shared_sharepointonline", "shared_office365"]  # 依流程調整

missing = [c for c in connectors_needed if c not in conn_map]

if not missing:
    print("✅ 所有必要的連線皆可用 — 正在開始建構")
else:
    # ── 停止：必須以互動方式建立連線 ──
    # 連線需要在瀏覽器中進行 OAuth 授權 — 任何 API 都無法建立連線。
    print("⚠️  下列連接器在此環境中沒有作用中的連線：")
    for c in missing:
        friendly = c.replace("shared_", "").replace("onlinebusiness", " Online (Business)")
        print(f"   • {friendly}  (API 名稱：{c})")
    print()
    print("請建立缺少的連線：")
    print("  1. 開啟 https://make.powerautomate.com/connections")
    print("  2. 從右上方選擇正確的環境")
    print("  3. 為上方列出的每個缺少連接器按一下 '+ 新增連線'")
    print("  4. 在出現提示時登入並授權")
    print("  5. 完成後告訴我 — 我將重新檢查並繼續建構")
    # 在使用者確認之前，請勿繼續執行步驟 3。
    # 使用者確認後，重新執行步驟 2a 以重新整理 conn_map。
```

### 2d — 建構 connectionReferences 區塊

僅在 2c 確認沒有缺少的連接器後執行此操作：

```python
connection_references = {}
for connector in connectors_needed:
    connection_references[connector] = {
        "connectionName": conn_map[connector],   # 來自 list_live_connections 的 GUID
        "source": "Invoker",
        "id": f"/providers/Microsoft.PowerApps/apis/{connector}"
    }
```

> **重要 — 動作中的 `host.connectionName`**：在步驟 3 中建構動作時，請將 `host.connectionName` 設定為此對應表中的 **鍵 (key)** (例如 `shared_teams`)，而非連線 GUID。GUID 僅用於 `connectionReferences` 項目內部。引擎會將動作的 `host.connectionName` 與鍵進行比對，以尋找正確的連線。

> **替代方案** — 如果您已有使用相同連接器的流程，可以從其定義中擷取 `connectionReferences`：
> ```python
> ref_flow = mcp("get_live_flow", environmentName=ENV, flowName="<現有流程-識別碼>")
> connection_references = ref_flow["properties"]["connectionReferences"]
> ```

有關完整的連線參考結構，請參閱 `power-automate-mcp` 技能的 **connection-references.md** 參考資料。

---

## 步驟 3 — 建構流程定義

建構定義物件。有關完整結構，請參閱 [flow-schema.md](references/flow-schema.md)，有關複製貼上範本，請參閱這些動作模式參考：
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、表格式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、剖析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint、Outlook、Teams、核准

```python
definition = {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "triggers": { ... },   # 參見 trigger-types.md / build-patterns.md
    "actions": { ... }     # 參見 ACTION-PATTERNS-*.md / build-patterns.md
}
```

> 有關完整、可直接使用的流程定義 (涵蓋循環+SharePoint+Teams、HTTP 觸發程序等)，請參閱 [build-patterns.md](references/build-patterns.md)。

---

## 步驟 4 — 部署 (建立或更新)

`update_live_flow` 可在單一工具中處理建立與更新。

### 建立新流程 (無現有流程)

省略 `flowName` — 伺服器會產生新的 GUID 並透過 PUT 建立：

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    # 省略 flowName → 建立新流程
    definition=definition,
    connectionReferences=connection_references,
    displayName="逾期發票通知",
    description="由代理程式建構的每週 SharePoint → Teams 通知流程"
)

if result.get("error") is not None:
    print("建立失敗：", result["error"])
else:
    # 擷取新流程識別碼以供後續步驟使用
    FLOW_ID = result["created"]
    print(f"✅ 流程已建立：{FLOW_ID}")
```

### 更新現有流程

提供 `flowName` 進行 PATCH：

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    displayName="我的更新流程",
    description="代理程式更新於 " + __import__('datetime').datetime.utcnow().isoformat()
)

if result.get("error") is not None:
    print("更新失敗：", result["error"])
else:
    print("更新成功：", result)
```

> ⚠️ `update_live_flow` 律會傳回 `error` 鍵。
> `null` (Python 為 `None`) 表示成功 — 請勿將該鍵的存在視為失敗。
>
> ⚠️ 建立與更新皆必須提供 `description`。

### 常見部署錯誤

| 錯誤訊息 (包含) | 原因 | 修正方法 |
|---|---|---|
| `missing from connectionReferences` | 動作的 `host.connectionName` 參考了 `connectionReferences` 對應表中不存在的鍵 | 確保 `host.connectionName` 使用 `connectionReferences` 中的 **鍵 (key)** (例如 `shared_teams`)，而非原始 GUID |
| `ConnectionAuthorizationFailed` / 403 | 連線 GUID 屬於其他使用者或未獲授權 | 重新執行步驟 2a，並使用目前 `x-api-key` 使用者擁有的連線 |
| `InvalidTemplate` / `InvalidDefinition` | 定義 JSON 中有語法錯誤 | 檢查 `runAfter` 鏈、運算式語法及動作類型拼字 |
| `ConnectionNotConfigured` | 連接器動作存在，但連線 GUID 無效或已過期 | 重新檢查 `list_live_connections` 以取得新的 GUID |

---

## 步驟 5 — 驗證部署

```python
check = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)

# 確認狀態
print("狀態：", check["properties"]["state"])  # 應為 "Started"

# 確認我們加入的動作是否存在
acts = check["properties"]["definition"]["actions"]
print("動作：", list(acts.keys()))
```

---

## 步驟 6 — 測試流程

> **強制要求**：在觸發任何測試執行之前，**務必詢問使用者以獲得確認**。
> 執行流程具有實際的副作用 — 可能會傳送電子郵件、發布 Teams 訊息、寫入 SharePoint、啟動核准或呼叫外部 API。請說明流程將執行的操作，並在獲得明確核准後再呼叫 `trigger_live_flow` 或 `resubmit_live_flow_run`。

### 已更新的流程 (已有先前的執行記錄)

最快的方法 — 重新提交最近一次的執行：

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=1)
if runs:
    result = mcp("resubmit_live_flow_run",
        environmentName=ENV, flowName=FLOW_ID, runName=runs[0]["name"])
    print(result)
```

### 已使用 HTTP 觸發程序的流程

直接使用測試裝載 (payload) 觸發：

```python
schema = mcp("get_live_flow_http_schema",
    environmentName=ENV, flowName=FLOW_ID)
print("預期內容：", schema.get("triggerSchema"))

result = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID,
    body={"name": "測試", "value": 1})
print(f"狀態：{result['status']}")
```

### 全新的非 HTTP 流程 (循環、連接器觸發程序等)

全新的循環或連接器觸發流程沒有可重新提交的執行記錄，也沒有可呼叫的 HTTP 端點。**請先使用暫時的 HTTP 觸發程序進行部署，測試動作，然後再切換至實際生產用的觸發程序。**

#### 7a — 儲存實際觸發程序，使用暫時 HTTP 觸發程序部署

```python
# 儲存在步驟 3 中建構的生產用觸發程序
production_trigger = definition["triggers"]

# 取代為暫時的 HTTP 觸發程序
definition["triggers"] = {
    "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
            "schema": {}
        }
    }
}

# 使用暫時觸發程序部署 (建立或更新)
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,       # 若為建立新流程則省略
    definition=definition,
    connectionReferences=connection_references,
    displayName="逾期發票通知",
    description="部署暫時 HTTP 觸發程序以供測試使用")

if result.get("error") is not None:
    print("部署失敗：", result["error"])
else:
    if not FLOW_ID:
        FLOW_ID = result["created"]
    print(f"✅ 已使用暫時 HTTP 觸發程序部署：{FLOW_ID}")
```

#### 7b — 觸發流程並檢查結果

```python
# 觸發流程
test = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID)
print(f"觸發程序回應狀態：{test['status']}")

# 等待執行完成
import time; time.sleep(15)

# 檢查執行結果
runs = mcp("get_live_flow_runs",
    environmentName=ENV, flowName=FLOW_ID, top=1)
run = runs[0]
print(f"執行 {run['name']}：{run['status']}")

if run["status"] == "Failed":
    err = mcp("get_live_flow_run_error",
        environmentName=ENV, flowName=FLOW_ID, runName=run["name"])
    root = err["failedActions"][-1]
    print(f"根本原因：{root['actionName']} → {root.get('code')}")
    # 在繼續之前偵錯並修正定義
    # 有關完整診斷工作流程，請參閱 power-automate-debug 技能
```

#### 7c — 切換至生產用觸發程序

測試執行成功後，將暫時 HTTP 觸發程序取代為實際的觸發程序：

```python
# 還原生產用觸發程序
definition["triggers"] = production_trigger

result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    description="測試成功後切換至生產用觸發程序")

if result.get("error") is not None:
    print("觸發程序切換失敗：", result["error"])
else:
    print("✅ 生產用觸發程序已部署 — 流程已上線")
```

> **原理**：觸發程序僅是進入點 — 無論流程如何啟動，動作都是相同的。透過 HTTP 觸發程序進行測試，可以執行所有相同的組合 (Compose)、SharePoint、Teams 等動作。
>
> **連接器觸發程序** (例如「在 SharePoint 中建立項目時」)：
> 如果動作參考了 `triggerBody()` 或 `triggerOutputs()`，請在 `trigger_live_flow` 的 `body` 參數中傳遞具代表性的測試裝載，該裝載應符合連接器觸發程序產生的形式。

---

## 注意事項 (Gotchas)

| 錯誤 | 後果 | 預防措施 |
|---|---|---|
| 部署時缺少 `connectionReferences` | 400 "Supply connectionReferences" | 務必先呼叫 `list_live_connections` |
| Foreach 缺少 `"operationOptions"` | 平行執行，寫入時產生競爭條件 | 務必加入 `"Sequential"` |
| `union(old_data, new_data)` | 舊值覆蓋新值 (先贏) | 使用 `union(new_data, old_data)` |
| 對可能為 null 的字串執行 `split()` | `InvalidTemplate` 損毀 | 使用 `coalesce(field, '')` 包裝 |
| 檢查 `result["error"]` 是否存在 | 永遠存在；真正的錯誤是 `!= null` | 使用 `result.get("error") is not None` |
| 流程已部署但狀態為 "Stopped" | 流程不會按排程執行 | 檢查連線驗證；重新啟用 |
| Teams "Chat with Flow bot" 收件者為物件 | 400 `GraphUserDetailNotFound` | 使用帶有後端分號的純字串 (見下文) |

### Teams `PostMessageToConversation` — 收件者格式

`body/recipient` 參數格式取決於 `location` 值：

| 位置 | `body/recipient` 格式 | 範例 |
|---|---|---|
| **與流程機器人聊天 (Chat with Flow bot)** | 帶有 **後端分號** 的純電子郵件字串 | `"user@contoso.com;"` |
| **頻道 (Channel)** | 具有 `groupId` 與 `channelId` 的物件 | `{"groupId": "...", "channelId": "..."}` |

> **常見錯誤**：在「與流程機器人聊天」中傳遞 `{"to": "user@contoso.com"}` 會傳回 400 `GraphUserDetailNotFound` 錯誤。API 預期的是純字串。

---

## 參考文件

- [flow-schema.md](references/flow-schema.md) — 完整流程定義 JSON Schema
- [trigger-types.md](references/trigger-types.md) — 觸發程序類型範本
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、表格式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、剖析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint、Outlook、Teams、核准
- [build-patterns.md](references/build-patterns.md) — 完整流程定義範本 (循環+SP+Teams、HTTP 觸發程序)

## 相關技能

- `flowstudio-power-automate-mcp` — 核心連線設定與工具參考
- `flowstudio-power-automate-debug` — 部署後對失敗流程進行偵錯
