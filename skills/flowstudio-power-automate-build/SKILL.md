---
name: 'flowstudio-power-automate-build'
description: >-
    使用 FlowStudio MCP 伺服器建構、架設及部署 Power Automate 雲端流程。
    您的代理程式會建構流程定義、連接連線、部署並測試，全程透過 MCP，無需開啟入口網站。
    當使用者要求以下事項時載入此技能：建立流程、建構新流程、
    部署流程定義、架設 Power Automate 工作流程、建構流程 JSON、
    更新現有流程的動作、修補流程定義、將動作新增至流程、連接流程，
    或從頭產生工作流程定義。
    需要 FlowStudio MCP 訂閱，請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 建構與部署 Power Automate 流程

透過 FlowStudio MCP 伺服器以程式化方式建構和部署 Power Automate 雲端流程的逐步指引。
以程式化方式透過 FlowStudio MCP 伺服器建構與部署。

**先決條件**：FlowStudio MCP 伺服器必須可連線且具備有效的 JWT。
有關連線設定，請參閱 `flowstudio-power-automate-mcp` 技能。
請於 https://mcp.flowstudio.app 訂閱

工作流程：
1. 載入目前的建構工具。
2. 檢查現有流程是否存在。
3. 解析連線參考 (connection references)。
4. 建構定義。
5. 部署。
6. 驗證。
7. 測試。

---

## 單一真實來源 (Source of Truth)

> **務必先呼叫 `list_skills` / `tool_search`** 以確認可用的工具
> 名稱與參數結構描述 (schemas)。工具名稱與參數可能會在不同的
> 伺服器版本之間變更。
> 本技能涵蓋回應形狀、行為注意事項與建構模式 —
> 這些是工具結構描述無法告訴你的資訊。如果此文件與
> `tool_search` 或實際的 API 回應不一致，請以 API 為準。

---

## Python 輔助函式

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

ENV = "<environment-id>"  # e.g. Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 0. 載入目前的建構工具

對於全新流程，請載入伺服器的 `create-flow` 組合包。若要編輯
現有流程，請載入 `build-flow`。這能在建構 JSON 之前，讓代理人
與 MCP 伺服器目前的結構描述保持一致。

```python
schemas = mcp("tool_search", query="skill:create-flow")
# Includes list_live_environments, list_live_connections,
# describe_live_connector, get_live_dynamic_options, update_live_flow.
```

如果你需要組合包以外的工具，請明確載入它：

```python
mcp("tool_search", query="select:get_live_dynamic_properties")
```

---

## 1. 安全檢查：該流程是否已存在？

在建構之前務必先檢視，以避免重複建立：

```python
results = mcp("list_live_flows",
    environmentName=ENV,
    mode="owner",
    search="My New Flow",
    top=20)

# list_live_flows returns { "flows": [...], "mode": "...", ... }
matches = [f for f in results["flows"]
           if "My New Flow".lower() in f["displayName"].lower()]

if len(matches) > 0:
    # Flow exists — modify rather than create
    FLOW_ID = matches[0]["id"]   # plain UUID from list_live_flows
    print(f"Existing flow: {FLOW_ID}")
    defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
else:
    print("Flow not found — building from scratch")
    FLOW_ID = None
```

對於非常龐大的環境，`list_live_flows` 可能會傳回接續 URL。
使用相同的 `mode` 將其作為 `continuationUrl` 傳回，以擷取下一批
資料。僅當使用者需要所有環境流程且 MCP 身分具備管理員權限時，
才使用 `mode="admin"`。

---

## 2. 取得連線參考 (Connection References)

每個連接器動作都需要一個指向流程 `connectionReferences` 對應表中
鍵值的 `connectionName`。該鍵值連結至環境中已驗證的連線。
在該環境中。

> **強制要求**：你必須先呼叫 `list_live_connections` — 不要向
> 使用者索取連線名稱或 GUID。API 會傳回你所需的精確值。
> 僅在 API 確認缺少所需連線時才提示使用者。

### 2a — 尋找作用中的連線

```python
conns = mcp("list_live_connections", environmentName=ENV)
active = [c for c in conns["connections"]
          if c["statuses"][0]["status"] == "Connected"]
conn_map = {c["connectorName"]: c["id"] for c in active}
```

對於已知的連接器，傳入 `search` 以減少輸出並取得可直接貼上的
`connectionReferenceTemplate` 與 `hostTemplate` 值：

```python
sp_conns = mcp("list_live_connections",
    environmentName=ENV,
    search="shared_sharepointonline")
```

### 2b — 確定流程需要哪些連接器

常見連接器 API 名稱：SharePoint `shared_sharepointonline`、Outlook
`shared_office365`、Teams `shared_teams`、Approvals `shared_approvals`、
OneDrive `shared_onedriveforbusiness`、Excel `shared_excelonlinebusiness`、
Dataverse `shared_commondataserviceforapps`、Forms `shared_microsoftforms`。

不需要連接器的流程 (例如僅包含 Recurrence + Compose + HTTP)
可省略 `connectionReferences`。

### 2c — 若缺少連線，引導使用者

```python
connectors_needed = ["shared_sharepointonline", "shared_office365"]  # adjust per flow
missing = [c for c in connectors_needed if c not in conn_map]
if missing:
    # STOP: connections require browser OAuth consent.
    # Ask the user to create the missing connector connections in the
    # selected environment, then re-run list_live_connections.
    raise Exception(f"Missing active connections: {missing}")
```

### 2d — 建構 connectionReferences 區塊

```python
connection_references = {}
host_templates = {}
for connector in connectors_needed:
    c = next(c for c in active if c["connectorName"] == connector)
    connection_references[connector] = c.get("connectionReferenceTemplate") or {
        "connectionName": c["id"],   # the connection id from list_live_connections
        "source": "Invoker",
        "id": f"/providers/Microsoft.PowerApps/apis/{connector}"
    }
    host_templates[connector] = c.get("hostTemplate") or {
        "connectionName": connector
    }
```

在步驟 3 的動作 JSON 中，`inputs.host.connectionName` 必須是對應表鍵值 (例如
`shared_teams`)，而非 GUID。GUID 僅屬於
`connectionReferences[connector].connectionName` 值內部。若現有流程使用
相同的連接器，你也可以從 `get_live_flow` 複製其
`properties.connectionReferences`。

---

## 3. 建構流程定義 (Flow Definition)

建構定義物件。請參閱 [flow-schema.md](references/flow-schema.md)
以取得完整結構描述，以及下列動作模式參考以取得可複製貼上的範本：
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、剖析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint、Outlook、Teams、Approvals

```python
definition = {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "triggers": { ... },   # see trigger-types.md / build-patterns.md
    "actions": { ... }     # see ACTION-PATTERNS-*.md / build-patterns.md
}
```

> 請參閱 [build-patterns.md](references/build-patterns.md) 以取得完整且立即可用的
> 流程定義，涵蓋 Recurrence+SharePoint+Teams、HTTP 觸發程序等。

### 在猜測 JSON 之前先探索連接器操作

對於由連接器支援的觸發程序/動作，相較於手寫形狀，更偏好使用即時連接器描述工具。
它可以傳回撰寫提示、標準範例、變體鍵值、
輸入/輸出以及動態 metadata 指標。

```python
# Search across connectors when you know the user's intent but not the API.
matches = mcp("describe_live_connector",
    environmentName=ENV,
    search="send email",
    top=5)

# Describe a specific operation before copying an exampleDefinition.
op = mcp("describe_live_connector",
    environmentName=ENV,
    connectorName="shared_office365",
    operationId="SendEmailV2")
print(op.get("hint"))
```

當某個操作具有多個撰寫的變體時，請請求流程
所需的變體：

```python
teams_chat = mcp("describe_live_connector",
    environmentName=ENV,
    connectorName="shared_teams",
    operationId="PostMessageToConversation",
    variant="flowbot_chat")
```

當操作描述指出某個參數具有動態選項或動態屬性時，
請呼叫指示的下一個工具：

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

使用動態選項取得下拉式選單 ID，例如 SharePoint 網站/清單與 Teams
團隊/通道。使用動態屬性取得結構描述/欄位形狀，例如
SharePoint 清單項目資料行。

---

## 4. 部署 (建立或更新)

`update_live_flow` 可在單一工具中同時處理建立與更新。

### 建立新流程 (無現有流程)

省略 `flowName` — 伺服器會產生新的 GUID 並透過 PUT 建立：

```python
definition["description"] = "Weekly SharePoint → Teams notification flow, built by agent"

result = mcp("update_live_flow",
    environmentName=ENV,
    # flowName omitted → creates a new flow
    definition=definition,
    connectionReferences=connection_references,
    displayName="Overdue Invoice Notifications"
)

if result.get("error") is not None:
    print("Create failed:", result["error"])
else:
    # Capture the new flow ID for subsequent steps
    FLOW_ID = result["created"]
    print(f"✅ Flow created: {FLOW_ID}")
```

### 更新現有流程

提供 `flowName` 以進行 PATCH：

```python
definition["description"] = (
    "Updated by agent on " + __import__('datetime').datetime.utcnow().isoformat()
)

result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=definition,
    connectionReferences=connection_references,
    displayName="My Updated Flow"
)

if result.get("error") is not None:
    print("Update failed:", result["error"])
else:
    print("Update succeeded:", result)
```

> ⚠️ `update_live_flow` 永遠會傳回 `error` 鍵值。
> `null` (Python `None`) 代表成功 — 請勿將該鍵值的存在視為失敗。
>
> ⚠️ 流程說明位於 `definition["description"]`。目前的伺服器
> 會附加 `#flowstudio-mcp` 以進行用量追蹤。除非 `tool_search`
> 在使用中的結構描述中顯示頂層 `description` 引數，否則請勿傳遞該引數。

### 常見部署錯誤

| 錯誤訊息 (包含) | 原因 | 修正方式 |
|---|---|---|
| `missing from connectionReferences` | 動作的 `host.connectionName` 參照了 `connectionReferences` 對應表中不存在的索引鍵 | 確保 `host.connectionName` 使用來自 `connectionReferences` 的**索引鍵** (例如 `shared_teams`)，而非原始 GUID |
| `ConnectionAuthorizationFailed` / 403 | 連線 GUID 屬於其他使用者或未經授權 | 重新執行步驟 2a 並使用由目前 `x-api-key` 使用者擁有的連線 |
| `InvalidTemplate` / `InvalidDefinition` | 定義 JSON 中的語法錯誤 | 檢查 `runAfter` 鏈、運算式語法與動作類型拼字 |
| `ConnectionNotConfigured` | 存在連接器動作，但連線 GUID 無效或已過期 | 重新檢查 `list_live_connections` 以取得最新的 GUID |

---

## 5. 驗證部署

```python
check = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)

# Confirm state
print("State:", check["properties"]["state"])  # Should be "Started"
# If state is "Stopped", use set_live_flow_state — NOT update_live_flow
# mcp("set_live_flow_state", environmentName=ENV, flowName=FLOW_ID, state="Started")

# Confirm the action we added is there
acts = check["properties"]["definition"]["actions"]
print("Actions:", list(acts.keys()))
```

---

## 6. 測試流程

> **強制要求**：在觸發任何測試執行之前，**向使用者請求確認**。
> 執行流程會產生真實的副作用 — 它可能會傳送電子郵件、張貼 Teams 訊息、
> 寫入 SharePoint、啟動核准或呼叫外部 API。在呼叫 `trigger_live_flow`
> 或 `resubmit_live_flow_run` 之前，請說明流程將執行的動作並等待
> 明確的核准。

### 已更新的流程 (已有先前執行記錄) — 任何觸發程序類型

> **優先使用 `resubmit_live_flow_run`。** 它適用於每種觸發程序類型 —
> Recurrence、SharePoint、連接器 Webhook、Button 以及 HTTP。它會重播
> 原始觸發程序裝載 (payload)。不要要求使用者手動觸發流程或
> 等待下一次排程執行。

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=1)
if runs:
    # Works for Recurrence, SharePoint, connector triggers — not just HTTP
    result = mcp("resubmit_live_flow_run",
        environmentName=ENV, flowName=FLOW_ID, runName=runs[0]["name"])
    print(result)   # {"resubmitted": true, "triggerName": "..."}
```

### HTTP、Button 與 PowerApps 流程 — 自訂測試裝載

僅在需要傳送與原始執行**不同**的裝載時才使用
`trigger_live_flow`。為驗證修正，`resubmit_live_flow_run`
更佳，因為它使用的是導致失敗的精確資料。

```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
triggers = defn["properties"]["definition"]["triggers"]
manual = next(iter(triggers.values()))
print("Expected body:", manual.get("inputs", {}).get("schema"))

result = mcp("trigger_live_flow",
    environmentName=ENV, flowName=FLOW_ID,
    body={"name": "Test", "value": 1})
print(f"Status: {result['responseStatus']}, via: {result['invocation']}")
print(result.get("warning"))   # set when a required input was missing: the run still ran, with null
```

### 全新的非 HTTP 流程

全新的 **Recurrence** 流程不需要暫時性替代方案：部署它，然後
立即使用 `trigger_live_flow` 且不帶 `body` 進行執行 — 與入口網站的
「執行流程」按鈕相同。傳入 body 會被拒絕；排程觸發程序不接受輸入。

全新的**連接器觸發**流程 (SharePoint、Webhooks) 沒有先前的
執行記錄，且在沒有真實來源事件的情況下無法觸發。請使用暫時的
HTTP 觸發程序進行部署、測試各動作，然後切換為正式環境觸發程序：

```python
production_trigger = definition["triggers"]
definition["triggers"] = {
    "manual": {"type": "Request", "kind": "Http", "inputs": {"schema": {}}}
}
result = mcp("update_live_flow", environmentName=ENV,
    flowName=FLOW_ID,       # omit if creating new
    definition=definition, connectionReferences=connection_references,
    displayName="Overdue Invoice Notifications")
FLOW_ID = FLOW_ID or result["flowName"]

mcp("trigger_live_flow", environmentName=ENV, flowName=FLOW_ID,
    body={"sample": "payload"})
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=1)
if runs[0]["status"] == "Failed":
    err = mcp("get_live_flow_run_error",
        environmentName=ENV, flowName=FLOW_ID, runName=runs[0]["name"])
    raise Exception(err["failedActions"][-1])

definition["triggers"] = production_trigger
mcp("update_live_flow", environmentName=ENV, flowName=FLOW_ID,
    definition=definition, connectionReferences=connection_references)
```

觸發程序僅是進入點；透過 HTTP 進行測試仍會執行
相同的動作。若動作使用 `triggerBody()` 或 `triggerOutputs()`，請傳遞
形狀類似正式環境觸發程序裝載的具代表性 `body`。

---

## 常見陷阱 (Gotchas)

| 錯誤 | 後果 | 預防措施 |
|---|---|---|
| 部署時遺漏 `connectionReferences` | 400 "Supply connectionReferences" | 務必先呼叫 `list_live_connections` |
| Foreach 上缺少 `"operationOptions"` | 平行執行，寫入時發生競爭條件 (race conditions) | 務必新增 `"Sequential"` |
| `union(old_data, new_data)` | 舊值覆寫新值 (先贏原則) | 使用 `union(new_data, old_data)` |
| 在可能為 null 的字串上使用 `split()` | `InvalidTemplate` 當機 | 使用 `coalesce(field, '')` 包裝 |
| 檢查 `result["error"]` 是否存在 | 永遠存在；真正的錯誤是 `!= null` | 使用 `result.get("error") is not None` |
| 流程已部署但狀態為 "Stopped" | 流程不會按排程執行 | 呼叫 `set_live_flow_state` 並設定 `state: "Started"` — 請**勿**使用 `update_live_flow` 進行狀態變更 |
| Teams「與 Flow Bot 聊天」收件者作為物件傳遞 | 400 `GraphUserDetailNotFound` | 使用結尾帶有分號的純文字字串 (見下方) |
| Copilot/Skills 流程不在解決方案中 | Copilot Studio 可能無法將其探索為代理人工具 | 部署後，呼叫帶有目標 `solutionId` 的 `add_live_flow_to_solution` |
| 將 Button/Skills 觸發程序用於 MCP 測試 | 即使缺少必要輸入 (null) 仍會執行 | 在 `trigger_live_flow` 的 `body` 中傳遞輸入；出現 `warning` 時，取消並使用完整 body 重試 |
| 連接器動作缺少 `metadata.operationMetadataId` | 設計工具/僅限執行 UI 的行為可能不一致 | 保留現有 ID；為新的連接器動作新增穩定的 GUID |
| 預留位置 Excel `scriptId` | 儲存時動態驗證失敗 | 在部署前解析出真實的 Office Script ID |
| SharePoint `PatchItem` 省略必要欄位 | 即使欄位未變更，儲存仍可能失敗 | 重複傳遞未變更的必要欄位，例如 `item/Title` |
| Copilot Studio 連接器呼叫草稿代理人 | 連接器呼叫可能失敗或遇到過時行為 | 在測試/重新提交流程之前發佈代理人 |

### Teams `PostMessageToConversation` — 收件者格式

`body/recipient` 參數格式取決於 `location` 的值：

| 位置 | `body/recipient` 格式 | 範例 |
|---|---|---|
| **與 Flow bot 聊天** | 帶有**結尾分號**的純電子郵件字串 | `"user@contoso.com;"` |
| **通道** | 包含 `groupId` 與 `channelId` 的物件 | `{"groupId": "...", "channelId": "..."}` |

> **常見錯誤**：在「與 Flow bot 聊天」中傳遞 `{"to": "user@contoso.com"}`
> 會傳回 400 `GraphUserDetailNotFound` 錯誤。API 預期接收純字串。

---

## 參考檔案

- [flow-schema.md](references/flow-schema.md) — 完整流程定義 JSON 結構描述
- [trigger-types.md](references/trigger-types.md) — 觸發程序類型範本
- [action-patterns-core.md](references/action-patterns-core.md) — 變數、控制流程、運算式
- [action-patterns-data.md](references/action-patterns-data.md) — 陣列轉換、HTTP、剖析
- [action-patterns-connectors.md](references/action-patterns-connectors.md) — SharePoint、Outlook、Teams、Approvals
- [build-patterns.md](references/build-patterns.md) — 完整流程定義範本 (Recurrence+SP+Teams、HTTP 觸發程序)

## 相關技能

- `flowstudio-power-automate-mcp` — 核心連線設定與工具參考
- `flowstudio-power-automate-debug` — 在部署後針對失敗流程進行偵錯
