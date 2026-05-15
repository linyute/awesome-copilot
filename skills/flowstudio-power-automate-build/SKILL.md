---
name: flowstudio-power-automate-build
description: >-
  使用 FlowStudio MCP 伺服器建構、架構化和部署 Power Automate 雲端流程。
  您的代理程式可以建構流程定義、佈線連線、部署和測試 — 一切皆透過 MCP 完成，
  無需開啟入口網站。當被要求執行以下操作時載入此技能：建立流程、建構新流程、
  部署流程定義、建構 Power Automate 工作流程架構、建構流程 JSON、更新現有
  流程的動作、修補流程定義、向流程新增動作、佈線連線，或從頭開始產生
  工作流程定義。需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 建構和部署 Power Automate 流程

透過 FlowStudio MCP 伺服器以程式設計方式建構和部署 Power Automate 雲端流程的逐步指南。

**先決條件**：必須能夠使用有效的 JWT 存取 FlowStudio MCP 伺服器。
有關連線設定，請參閱 `flowstudio-power-automate-mcp` 技能。
請在 https://mcp.flowstudio.app 訂閱。

工作流程：
1. 載入目前的建構工具。
2. 檢查現有的流程。
3. 解析連線參考。
4. 建構定義。
5. 部署。
6. 驗證。
7. 測試。

---

## 資訊來源 (Source of Truth)

> **務必先呼叫 `list_skills` / `tool_search`** 以確認可用的工具名稱和參數
> 結構描述。工具名稱和參數可能會隨伺服器版本而變更。
> 此技能涵蓋回應形狀、行為備註和建構模式 — 這些是工具結構描述無法告訴您的
> 事項。如果此文件與 `tool_search` 或實際的 API 回應不符，以 API 為準。

---

## Python 協助程式 (Python Helper)

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

## 0. 載入目前的建構工具

對於全新的流程，載入伺服器的 `create-flow` 組合包。對於編輯現有流程，載入 `build-flow`。這可以在建構 JSON 之前，讓代理程式與 MCP 伺服器目前的結構描述保持一致。

```python
schemas = mcp("tool_search", query="skill:create-flow")
# 包含 list_live_environments, list_live_connections,
# describe_live_connector, get_live_dynamic_options, update_live_flow。
```

如果您需要組合包之外的工具，請明確載入它：

```python
mcp("tool_search", query="select:get_live_dynamic_properties")
```

---

## 1. 安全檢查：流程是否已經存在？

建構前務必先檢查，以避免重複：

```python
results = mcp("list_live_flows",
    environmentName=ENV,
    mode="owner",
    search="My New Flow",
    top=20)

# list_live_flows 傳回 { "flows": [...], "mode": "...", ... }
matches = [f for f in results["flows"]
           if "My New Flow".lower() in f["displayName"].lower()]

if len(matches) > 0:
    # 流程已存在 — 進行修改而非建立
    FLOW_ID = matches[0]["id"]   # 來自 list_live_flows 的純 UUID
    print(f"Existing flow: {FLOW_ID}")
    defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
else:
    print("Flow not found — building from scratch")
    FLOW_ID = None
```

對於非常大型的環境，`list_live_flows` 可能會傳回延續 URL (continuation URL)。請以相同的 `mode` 將其作為 `continuationUrl` 傳回，以擷取下一批資料。僅在使用者需要所有環境流程且 MCP 身分具有管理權限時才使用 `mode="admin"`。

---

## 2. 取得連線參考 (Connection References)

每個連接器動作都需要一個 `connectionName`，指向流程 `connectionReferences` 對應表中的一個索引鍵。該索引鍵連結到環境中一個已通過驗證的連線。

> **必填**：您必須先呼叫 `list_live_connections` — 不要詢問使用者的連線名稱或 GUID。API 會傳回您需要的確切值。僅在 API 確認缺少必要的連線時才提示使用者。

### 2a — 尋找作用中連線

```python
conns = mcp("list_live_connections", environmentName=ENV)
active = [c for c in conns["connections"]
          if c["statuses"][0]["status"] == "Connected"]
conn_map = {c["connectorName"]: c["id"] for c in active}
```

對於已知的連接器，傳遞 `search` 參數以減少輸出，並取得可直接貼上的 `connectionReferenceTemplate` 和 `hostTemplate` 值：

```python
sp_conns = mcp("list_live_connections",
    environmentName=ENV,
    search="shared_sharepointonline")
```

### 2b — 確定流程需要哪些連接器

常見的連接器 API 名稱：SharePoint `shared_sharepointonline`、Outlook `shared_office365`、Teams `shared_teams`、簽核 `shared_approvals`、OneDrive `shared_onedriveforbusiness`、Excel `shared_excelonlinebusiness`、Dataverse `shared_commondataserviceforapps`、Forms `shared_microsoftforms`。

不需要連接器的流程（例如僅使用 定期執行 + 撰寫 + HTTP）可以省略 `connectionReferences`。

### 2c — 如果缺少連線，引導使用者

```python
connectors_needed = ["shared_sharepointonline", "shared_office365"]  # 依流程調整
missing = [c for c in connectors_needed if c not in conn_map]
if missing:
    # 停止：連線需要瀏覽器的 OAuth 授權。
    # 要求使用者在選定的環境中建立缺少的連接器連線，
    # 然後重新執行 list_live_connections。
    raise Exception(f"Missing active connections: {missing}")
```

### 2d — 建構 connectionReferences 區塊

```python
connection_references = {}
host_templates = {}
for connector in connectors_needed:
    c = next(c for c in active if c["connectorName"] == connector)
    connection_references[connector] = c.get("connectionReferenceTemplate") or {
        "connectionName": c["id"],   # 來自 list_live_connections 的連線 ID
        "source": "Invoker",
        "id": f"/providers/Microsoft.PowerApps/apis/{connector}"
    }
    host_templates[connector] = c.get("hostTemplate") or {
        "connectionName": connector
    }
```

在第 3 步的動作 JSON 中，`inputs.host.connectionName` 必須是地圖索引鍵（例如 `shared_teams`），而不是 GUID。GUID 僅屬於 `connectionReferences[connector].connectionName` 值。如果現有流程使用相同的連接器，您也可以從 `get_live_flow` 複製其 `properties.connectionReferences`。

---

## 3. 建構流程定義 (Build the Flow Definition)

建構定義物件。有關完整結構描述，請參閱 [flow-schema.md](references/flow-schema.md)，並參考這些動作模式以獲取複製貼上範本：
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、解析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint, Outlook, Teams, 簽核

```python
definition = {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "triggers": { ... },   # 請參閱 trigger-types.md / build-patterns.md
    "actions": { ... }     # 請參閱 ACTION-PATTERNS-*.md / build-patterns.md
}
```

> 請參閱 [build-patterns.md](references/build-patterns.md) 以獲取完整的、隨插即用的流程定義，涵蓋 定期執行 + SharePoint + Teams、HTTP 觸發器等。

### 在猜測 JSON 之前先探索連接器操作

對於由連接器支援的觸發器/動作，優先使用即時連接器描述器 (live connector describer)，而不是手寫形狀。它可以傳回作者撰寫的提示、標準範例、變體索引鍵、輸入/輸出以及動態 Metadata 指標。

```python
# 當您知道使用者的意圖但不知道 API 時，跨連接器進行搜尋。
matches = mcp("describe_live_connector",
    environmentName=ENV,
    search="send email",
    top=5)

# 在複製 exampleDefinition 之前先描述特定的操作。
op = mcp("describe_live_connector",
    environmentName=ENV,
    connectorName="shared_office365",
    operationId="SendEmailV2")
print(op.get("hint"))
```

當一個操作有多個作者撰寫的變體時，請求流程所需的變體：

```python
teams_chat = mcp("describe_live_connector",
    environmentName=ENV,
    connectorName="shared_teams",
    operationId="PostMessageToConversation",
    variant="flowbot_chat")
```

當操作描述指出某個參數具有動態選項或動態屬性時，請呼叫指示的下一個工具：

```python
sp_op = mcp("describe_live_connector",
    environmentName=ENV,
    connectorName="shared_sharepointonline",
    operationId="GetItems")

sites = mcp("get_live_dynamic_options",
    environmentName=ENV,
    connectorName="shared_sharepointonline",
    connectionName=conn_map["shared_sharepointonline"],
    operationId="GetItems",
    parameterName="dataset",
    dynamicMetadata=sp_op["dynamicParameters"]["dataset"])

fields = mcp("get_live_dynamic_properties",
    environmentName=ENV,
    connectorName="shared_sharepointonline",
    connectionName=conn_map["shared_sharepointonline"],
    operationId="GetItems",
    parameterName="item",
    parameters={"dataset": "<site-url>", "table": "<list-id>"},
    dynamicMetadata=sp_op["dynamicProperties"]["item"])
```

將動態選項用於下拉式選單 ID，例如 SharePoint 網站/清單和 Teams 小組/頻道。將動態屬性用於結構描述/欄位形狀，例如 SharePoint 清單項目欄位。

---

## 4. 部署（建立或更新）

`update_live_flow` 在單個工具中同時處理建立和更新。

### 建立新流程（無現有流程）

省略 `flowName` — 伺服器會產生一個新的 GUID 並透過 PUT 建立：

```python
definition["description"] = "每週 SharePoint → Teams 通知流程，由代理程式建構"

result = mcp("update_live_flow",
    environmentName=ENV,
    # 省略 flowName → 建立一個新流程
    definition=definition,
    connectionReferences=connection_references,
    displayName="逾期發票通知"
)

if result.get("error") is not None:
    print("建立失敗：", result["error"])
else:
    # 擷取新的流程 ID 以用於後續步驟
    FLOW_ID = result["created"]
    print(f"✅ 流程已建立：{FLOW_ID}")
```

### 更新現有流程

提供 `flowName` 進行 PATCH 更新：

```python
definition["description"] = (
    "由代理程式於 " + __import__('datetime').datetime.utcnow().isoformat() + " 更新"
)

result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    displayName="我更新後的流程"
)

if result.get("error") is not None:
    print("更新失敗：", result["error"])
else:
    print("更新成功：", result)
```

> ⚠️ `update_live_flow` 始終傳回一個 `error` 鍵。
> `null`（Python `None`）表示成功 — 不要將該鍵的存在視為失敗。
>
> ⚠️ 流程描述位於 `definition["description"]`。目前的伺服器會附加 `#flowstudio-mcp` 以用於使用情況追蹤。除非 `tool_search` 在活動結構描述中顯示頂層 `description` 引數，否則不要傳遞該引數。

### 常見部署錯誤

| 錯誤訊息（包含） | 原因 | 修復方法 |
|---|---|---|
| `missing from connectionReferences` | 動作的 `host.connectionName` 引用了 `connectionReferences` 對應表中不存在的索引鍵 | 確保 `host.connectionName` 使用來自 `connectionReferences` 的 **索引鍵** (例如 `shared_teams`)，而不是原始 GUID |
| `ConnectionAuthorizationFailed` / 403 | 連線 GUID 屬於其他使用者或未獲授權 | 重新執行第 2a 步，並使用目前 `x-api-key` 使用者擁有的連線 |
| `InvalidTemplate` / `InvalidDefinition` | 定義 JSON 中存在語法錯誤 | 檢查 `runAfter` 鏈、運算式語法和動作類型拼字 |
| `ConnectionNotConfigured` | 連接器動作存在，但連線 GUID 無效或已過期 | 重新檢查 `list_live_connections` 以取得新的 GUID |

---

## 5. 驗證部署

```python
check = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)

# 確認狀態
print("狀態：", check["properties"]["state"])  # 應為 "Started"
# 如果狀態為 "Stopped"，請使用 set_live_flow_state — 而非 update_live_flow
# mcp("set_live_flow_state", environmentName=ENV, flowName=FLOW_ID, state="Started")

# 確認我們新增的動作存在
acts = check["properties"]["definition"]["actions"]
print("動作：", list(acts.keys()))
```

---

## 6. 測試流程

> **必填**：在觸發任何測試執行之前，請 **要求使用者確認**。
> 執行流程具有實際的副作用 — 它可能會傳送電子郵件、張貼 Teams 訊息、寫入 SharePoint、啟動簽核或呼叫外部 API。解釋流程將執行的操作，並在呼叫 `trigger_live_flow` 或 `resubmit_live_flow_run` 之前等待明確的核准。

### 更新後的流程（已有先前執行記錄） — 任何觸發器類型

> **優先使用 `resubmit_live_flow_run`**。它適用於每一種觸發器類型 — 定期執行、SharePoint、連接器 Webhook、按鈕 (Button) 和 HTTP。它會重播原始的觸發承載資料。不要要求使用者手動觸發流程，或等待下一次排程執行。

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=1)
if runs:
    # 適用於定期執行、SharePoint、連接器觸發器 — 不僅僅是 HTTP
    result = mcp("resubmit_live_flow_run",
        environmentName=ENV, flowName=FLOW_ID, runName=runs[0]["name"])
    print(result)   # {"resubmitted": true, "triggerName": "..."}
```

### HTTP 觸發流程 — 自定義測試承載資料

僅當您需要傳送與原始執行 **不同** 的承載資料時才使用 `trigger_live_flow`。若要驗證修復，`resubmit_live_flow_run` 會更好，因為它使用的是導致失敗的確切資料。

```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
triggers = defn["properties"]["definition"]["triggers"]
manual = next(iter(triggers.values()))
print("預期本文：", manual.get("inputs", {}).get("schema"))

result = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID,
    body={"name": "Test", "value": 1})
print(f"狀態：{result['responseStatus']}")
```

### 全新的非 HTTP 流程（定期執行、連接器觸發器等）

一個全新的定期執行或連接器觸發流程 **沒有先前的執行記錄** 可以重新提交，也沒有 HTTP 端點可以呼叫。這是您需要下列臨時 HTTP 觸發器方法的唯一情境。**先使用臨時 HTTP 觸發器進行部署，測試動作，然後再切換到生產環境觸發器。**

精簡配方：

```python
production_trigger = definition["triggers"]
definition["triggers"] = {
    "manual": {"type": "Request", "kind": "Http", "inputs": {"schema": {}}}
}

result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,       # 如果是建立新流程則省略
    definition=definition,
    connectionReferences=connection_references,
    displayName="逾期發票通知")
FLOW_ID = FLOW_ID or result["created"]

test = mcp("trigger_live_flow", environmentName=ENV, flowName=FLOW_ID,
           body={"sample": "payload"})
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=1)

if runs[0]["status"] == "Failed":
    err = mcp("get_live_flow_run_error",
        environmentName=ENV, flowName=FLOW_ID, runName=runs[0]["name"])
    raise Exception(err["failedActions"][-1])

definition["triggers"] = production_trigger
mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references)
```

觸發器僅僅是進入點；透過 HTTP 測試仍然會執行相同的動作。如果動作使用 `triggerBody()` 或 `triggerOutputs()`，請傳遞一個形狀類似於生產環境觸發承載資料且具有代表性的 `trigger_live_flow.body`。

---

## 陷阱 (Gotchas)

| 錯誤 | 後果 | 預防措施 |
|---|---|---|
| 部署時缺少 `connectionReferences` | 400 "Supply connectionReferences" | 務必先呼叫 `list_live_connections` |
| Foreach 缺少 `"operationOptions"` | 平行執行，寫入時發生競爭條件 | 務必新增 `"Sequential"` |
| `union(old_data, new_data)` | 舊值覆寫新值（先到先得） | 使用 `union(new_data, old_data)` |
| 對可能為 null 的字串執行 `split()` | `InvalidTemplate` 崩潰 | 使用 `coalesce(field, '')` 包裝 |
| 檢查 `result["error"]` 是否存在 | 始終存在；真正的錯誤是 `!= null` | 使用 `result.get("error") is not None` |
| 流程已部署但狀態為 "Stopped" | 流程不會按排程執行 | 呼叫 `set_live_flow_state` 並設定 `state: "Started"` — 不要使用 `update_live_flow` 進行狀態變更 |
| Teams「與流程機器人聊天」收件者為物件 | 400 `GraphUserDetailNotFound` | 使用帶有結尾分號的純字串（見下文） |
| Copilot/技能流程不在解決方案中 | Copilot Studio 可能無法將其識別為代理程式工具 | 部署後，使用目標 `solutionId` 呼叫 `add_live_flow_to_solution` |
| 針對 MCP 測試使用按鈕/技能觸發器 | MCP 無法直接觸發生產環境觸發器 | 透過臨時 HTTP 孿生流程測試相同的動作，然後將觸發器切換回來 |
| 連接器動作缺少 `metadata.operationMetadataId` | 設計器/僅限執行 UI 的行為可能不一致 | 保留現有的 ID；為新的連接器動作新增穩定的 GUID |
| 佔位符 Excel `scriptId` | 儲存時動態驗證失敗 | 部署前解析實際的 Office 指令碼 ID |
| SharePoint `PatchItem` 省略必要欄位 | 即使欄位沒有變更，儲存仍可能失敗 | 重複傳送未變更的必要欄位，例如 `item/Title` |
| Copilot Studio 連接器呼叫草稿代理程式 | 連接器調用可能失敗或遇到過時行為 | 在測試/重新提交流程前發佈代理程式 |

### Teams `PostMessageToConversation` — 收件者格式

`body/recipient` 參數格式取決於 `location` 的值：

| 位置 | `body/recipient` 格式 | 範例 |
|---|---|---|
| **與流程機器人聊天** | 帶有 **結尾分號** 的純電子郵件字串 | `"user@contoso.com;"` |
| **頻道** | 包含 `groupId` 和 `channelId` 的物件 | `{"groupId": "...", "channelId": "..."}` |

> **常見錯誤**：在「與流程機器人聊天」中傳遞 `{"to": "user@contoso.com"}` 會傳回 400 `GraphUserDetailNotFound` 錯誤。API 預期的是純字串。

---

## 參考檔案

- [flow-schema.md](references/flow-schema.md) — 完整的流程定義 JSON 結構描述
- [trigger-types.md](references/trigger-types.md) — 觸發器類型範本
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、解析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint, Outlook, Teams, 簽核
- [build-patterns.md](references/build-patterns.md) — 完整的流程定義範本 (定期執行 + SP + Teams, HTTP 觸發器)

## 相關技能

- `flowstudio-power-automate-mcp` — 核心連線設定與工具參考
- `flowstudio-power-automate-debug` — 部署後對失敗流程進行偵錯
