---
name: flowstudio-power-automate-debug
description: >-
  使用 FlowStudio MCP 伺服器針對發生失敗的 Power Automate 雲端流程進行偵錯。
  Graph API 僅顯示頂層狀態碼。本技能為您的代理程式提供動作層級的
  輸入與輸出，以找出真正的根本原因。
  當被要求執行以下作業時載入此技能：偵錯流程、調查失敗的執行紀錄、為什麼
  此流程會失敗、檢查動作輸出、找出流程錯誤的根本原因、
  修正損毀的 Power Automate 流程、診斷逾時、追蹤 DynamicOperationRequestFailure、
  檢查連接器驗證錯誤、從執行紀錄中讀取錯誤詳細資訊，或對運算式
  失敗進行疑難排解。需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 偵錯

透過 FlowStudio MCP 伺服器調查失敗的 Power Automate
雲端流程之逐步診斷程序。

> **真實偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題，非流程錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [Null 值導致子流程當機](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

**先決條件**：必須能夠以有效的 JWT 連線至 FlowStudio MCP 伺服器。
連線設定請參閱 `flowstudio-power-automate-mcp` 技能。
請於 https://mcp.flowstudio.app 訂閱

---

## 事實來源

> **請務必先呼叫 `list_skills` / `tool_search`** 以確認可用的工具
> 名稱與參數結構描述。工具名稱與參數可能會在不同的
> 伺服器版本間變更。
> 本技能涵蓋回應結構、行為注意事項及診斷模式 —
> 這些是工具結構描述無法告訴您的內容。如果本文件與
> `tool_search` 或實際的 API 回應不一致，以 API 為準。

---

## Python 協助程式

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

ENV = "<environment-id>"   # 例如 Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 步驟 1 — 尋找流程

```python
result = mcp("list_live_flows", environmentName=ENV)
# 傳回包裝函式物件：{mode, flows, totalCount, error}
target = next(f for f in result["flows"] if "My Flow Name" in f["displayName"])
FLOW_ID = target["id"]   # 純 UUID — 直接作為 flowName 使用
print(FLOW_ID)
```

---

## 步驟 2 — 尋找失敗的執行紀錄

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=5)
# 直接傳回陣列（最新的排在最前面）：
# [{"name": "08584296068667933411438594643CU15",
#   "status": "Failed",
#   "startTime": "2026-02-25T06:13:38.6910688Z",
#   "endTime": "2026-02-25T06:15:24.1995008Z",
#   "triggerName": "manual",
#   "error": {"code": "ActionFailed", "message": "An action failed..."}},
#  {"name": "...", "status": "Succeeded", "error": null, ...}]

for r in runs:
    print(r["name"], r["status"], r["startTime"])

RUN_ID = next(r["name"] for r in runs if r["status"] == "Failed")
```

---

## 步驟 3 — 取得頂層錯誤

> **重要**：`get_live_flow_run_error` 會告訴您**哪個**動作失敗。
> `get_live_flow_run_action_outputs` 則會告訴您**原因**。您必須兩者都呼叫。
> 切勿僅停留在錯誤本身 — 像 `ActionFailed`、
> `NotSpecified` 和 `InternalServerError` 這樣的錯誤代碼只是通用的包裝。真正的
> 根本原因（錯誤欄位、null 值、HTTP 500 內文、堆疊追蹤）只有在
> 動作的輸入和輸出中才看得見。

```python
err = mcp("get_live_flow_run_error",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
# 傳回：
# {
#   "runName": "08584296068667933411438594643CU15",
#   "failedActions": [
#     {"actionName": "Apply_to_each_prepare_workers", "status": "Failed",
#      "error": {"code": "ActionFailed", "message": "An action failed..."},
#      "startTime": "...", "endTime": "..."},
#     {"actionName": "HTTP_find_AD_User_by_Name", "status": "Failed",
#      "code": "NotSpecified", "startTime": "...", "endTime": "..."}
#   ],
#   "allActions": [
#     {"actionName": "Apply_to_each", "status": "Skipped"},
#     {"actionName": "Compose_WeekEnd", "status": "Succeeded"},
#     ...
#   ]
# }

# failedActions 的順序是由外而內。根本原因（ROOT）為最後一筆項目：
root = err["failedActions"][-1]
print(f"Root action: {root['actionName']} → code: {root.get('code')}")

# allActions 顯示每個動作的狀態 — 適合用來找出哪些動作被跳過（Skipped）
# 解讀錯誤代碼請參閱 common-errors.md。
```

---

## 步驟 4 — 檢查失敗動作的輸入與輸出

> **這是最重要的一個步驟。** `get_live_flow_run_error` 僅會提供
> 通用的錯誤代碼。真正的錯誤詳細資訊 — HTTP 狀態碼、
> 回應內文、堆疊追蹤、null 值 — 都存在於動作的執行階段
> 輸入和輸出中。**在識別出失敗動作後，請務必立即
> 檢查該動作。**

```python
# 取得最根本失敗動作的完整輸入與輸出
root_action = err["failedActions"][-1]["actionName"]
detail = mcp("get_live_flow_run_action_outputs",
    environmentName=ENV,
    flowName=FLOW_ID,
    runName=RUN_ID,
    actionName=root_action)

if len(detail) > 1:
    print(f"{root_action} returned {len(detail)} repetitions; inspect iteration indexes")
out = detail[0] if detail else {}
print(f"Action: {out.get('actionName')}")
print(f"Status: {out.get('status')}")

# 對於 HTTP 動作，真正的錯誤位於 outputs.body
if isinstance(out.get("outputs"), dict):
    status_code = out["outputs"].get("statusCode")
    body = out["outputs"].get("body", {})
    print(f"HTTP {status_code}")
    print(json.dumps(body, indent=2)[:500])

    # 錯誤內文通常是巢狀 JSON 字串 — 請剖析它們
    if isinstance(body, dict) and "error" in body:
        err_detail = body["error"]
        if isinstance(err_detail, str):
            err_detail = json.loads(err_detail)
        print(f"Error: {err_detail.get('message', err_detail)}")

# 對於運算式錯誤，錯誤位於 error 欄位中
if out.get("error"):
    print(f"Error: {out['error']}")

# 同時也檢查 inputs — 它們會顯示使用了什麼運算式/URL/內文
if out.get("inputs"):
    print(f"Inputs: {json.dumps(out['inputs'], indent=2)[:500]}")
```

### 動作輸出所揭露的內容（錯誤代碼所無法提供的）

| 來自 `get_live_flow_run_error` 的錯誤代碼 | `get_live_flow_run_action_outputs` 所揭露的內容 |
|---|---|
| `ActionFailed` | 實際失敗的巢狀動作及其 HTTP 回應 |
| `NotSpecified` | HTTP 狀態碼 + 包含真正錯誤的回應內文 |
| `InternalServerError` | 伺服器的錯誤訊息、堆疊追蹤或 API 錯誤 JSON |
| `InvalidTemplate` | 失敗的確切運算式以及 null/錯誤型別的值 |
| `BadRequest` | 已傳送的請求內文以及伺服器拒絕的原因 |

### Foreach 反覆運算

當 `actionName` 指向 foreach 內部的動作時，輸出工具可
傳回該動作的每次重複執行紀錄。每個項目可能包含
帶有迴圈名稱與從零開始之 `itemIndex` 的 `repetitionIndexes`。在
發現可疑項目後，使用 `iterationIndex` 檢查單一反覆運算：

```python
all_reps = mcp("get_live_flow_run_action_outputs",
    environmentName=ENV,
    flowName=FLOW_ID,
    runName=RUN_ID,
    actionName=root_action)

for rep in all_reps[:10]:
    print(rep.get("repetitionIndexes"), rep.get("status"), rep.get("error"))

one_rep = mcp("get_live_flow_run_action_outputs",
    environmentName=ENV,
    flowName=FLOW_ID,
    runName=RUN_ID,
    actionName=root_action,
    iterationIndex=3)
```

### 實證 Compose 夾具

對於不確定的連接器作業，請在有風險的動作之前新增 `Compose_*_Request`，
並在其後新增 `Compose_*_Result`，且結果動作同時允許在
`Succeeded` 與 `Failed` 下執行。這能為未來的偵錯提供乾淨的裝載快照，
而不需要再次部署。請勿在這些夾具中包含
秘密金鑰或過長的二進位裝載。

### 範例：HTTP 動作傳回 500

```
錯誤代碼："InternalServerError" ← 這完全沒告訴您任何資訊

動作輸出揭露：
  HTTP 500
  body: {"error": "Cannot read properties of undefined (reading 'toLowerCase')
    at getClientParamsFromConnectionString (storage.js:20)"}
  ← 這告訴您 Azure Function 當機是因為連線字串為未定義（undefined）
```

### 範例：Null 上的運算式錯誤

```
錯誤代碼："BadRequest" ← 通用錯誤

動作輸出揭露：
  inputs: "body('HTTP_GetTokenFromStore')?['token']?['access_token']"
  outputs: ""   ← 空字串，路徑解析為 null
  ← 這告訴您回應結構已變更 — 權杖位於 body.access_token，而非 body.token.access_token
```

---

## 步驟 5 — 讀取流程定義

```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = defn["properties"]["definition"]["actions"]
print(list(actions.keys()))
```

在定義中尋找失敗的動作。檢查其 `inputs` 運算式
以了解它預期的資料。

---

## 步驟 6 — 從失敗處往回追蹤

當失敗動作的輸入參照了上游動作時，也請檢查那些
動作。沿著鏈結往回逐步檢查，直到找出不良資料的
來源：

```python
# 檢查導致失敗的多個動作
for action_name in [root_action, "Compose_WeekEnd", "HTTP_Get_Data"]:
    result = mcp("get_live_flow_run_action_outputs",
        environmentName=ENV,
        flowName=FLOW_ID,
        runName=RUN_ID,
        actionName=action_name)
    out = result[0] if result else {}
    print(f"\n--- {action_name} ({out.get('status')}) ---")
    print(f"Inputs:  {json.dumps(out.get('inputs', ''), indent=2)[:300]}")
    print(f"Outputs: {json.dumps(out.get('outputs', ''), indent=2)[:300]}")
```

> ⚠️ 來自陣列處理動作的輸出裝載可能會非常大。
> 在列印前請務必進行截斷切片（例如 `[:500]`）。

> **提示**：當您不確定是哪個動作產生了不良資料時，可省略
> `actionName` 以列出頂層動作。一旦您選取了 foreach 內部的動作，
> 請傳遞 `iterationIndex`，以避免將每次重複執行都帶入 context 中。

---

## 步驟 7 — 查明根本原因

### 運算式錯誤（例如在 null 上執行 `split`）
若錯誤提及 `InvalidTemplate` 或函式名稱：
1. 在定義中找出該動作
2. 檢查它讀取了哪個上游動作/運算式
3. **檢查該上游動作的輸出**是否有 null / 遺失欄位

```python
# 範例：動作使用 split(item()?['Name'], ' ')
# → 來源資料中的 Name 為 null
result = mcp("get_live_flow_run_action_outputs", ..., actionName="Compose_Names")
if not result:
    print("No outputs returned for Compose_Names")
    names = []
else:
    names = result[0].get("outputs", {}).get("body") or []
nulls = [x for x in names if x.get("Name") is None]
print(f"{len(nulls)} records with null Name")
```

### 錯誤的欄位路徑
運算式 `triggerBody()?['fieldName']` 傳回 null → `fieldName` 錯誤。
**檢查觸發程序輸出**以查看實際的欄位名稱：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="<trigger-action-name>")
print(json.dumps(result[0].get("outputs"), indent=2)[:500])
```

### 傳回錯誤的 HTTP 動作
錯誤代碼顯示 `InternalServerError` 或 `NotSpecified` — **請務必檢查
動作輸出**以取得實際的 HTTP 狀態與回應內文：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_Get_Data")
out = result[0]
print(f"HTTP {out['outputs']['statusCode']}")
print(json.dumps(out['outputs']['body'], indent=2)[:500])
```

### 連線 / 驗證失敗
尋找 `ConnectionAuthorizationFailed` — 連線擁有者必須與執行
該流程的服務帳戶相符。無法透過 API 修正；請在 PA 設計工具中修正。

### Outlook 使用者選取器失敗（`DynamicListValuesUndefinedOrInvalid`）
像 `GetEmailsV3` 這樣的 Outlook 動作使用的參數（`mailboxAddress`、`to`、`cc`、
`from`），其下拉式選單是由 `builtInOperation:AadGraph.GetUsers` 支援 — 該作業
在 PA listEnum 層已損毀，且總是傳回
`DynamicListValuesUndefinedOrInvalid`。當代理程式透過 `update_live_flow`
重新建構或修改 Outlook 動作並嘗試透過動態選項解析使用者時，就會出現此情況。
**請勿透過重試 AadGraph 來修正它** — 改為切換至
`shared_office365users.SearchUserV2`（傳回相同的 AAD 使用者結構）。
使用 `describe_live_connector` 確認受影響的參數是否公開了結構化的
`fallback`，然後針對 `shared_office365users.SearchUserV2` 呼叫
`get_live_dynamic_options`，而非針對損毀的 AadGraph 作業。
若需要動態欄位結構描述而非下拉式選項，請搭配
`describe_live_connector` 傳回的 metadata 使用
`get_live_dynamic_properties`。

---

## 步驟 8 — 套用修正

**針對運算式/資料問題**：
```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
acts = defn["properties"]["definition"]["actions"]

# 範例：修正可能為 null 之 Name 上的 split
acts["Compose_Names"]["inputs"] = \
    "@coalesce(item()?['Name'], 'Unknown')"

conn_refs = defn["properties"]["connectionReferences"]
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=defn["properties"]["definition"],
    connectionReferences=conn_refs)

print(result.get("error"))  # None = 成功
```

> ⚠️ `update_live_flow` 一律會傳回 `error` 索引鍵。
> 值為 `null`（Python 的 `None`）表示成功。

---

## 步驟 9 — 驗證修正

> **使用 `resubmit_live_flow_run` 測試任何流程 — 不限於 HTTP 觸發程序。**
> `resubmit_live_flow_run` 會使用先前的原始觸發程序裝載
> 重放先前的執行。這適用於**每一種觸發程序類型**：週期性、SharePoint
> 「建立項目時」、連接器 Webhook、按鈕觸發程序以及 HTTP
> 觸發程序。您不需要要求使用者手動觸發流程，也
> 不需要等待下一次排程執行。
>
> 唯一無法使用 `resubmit` 的情況是**從未執行過的全新流程** —
> 因為它沒有先前的執行紀錄可供重放。

```python
# 重新提交失敗的執行紀錄 — 適用於任何觸發程序類型
resubmit = mcp("resubmit_live_flow_run",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
print(resubmit)   # {"resubmitted": true, "triggerName": "..."}

# 等候約 30 秒然後檢查
import time; time.sleep(30)
new_runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=3)
print(new_runs[0]["status"])   # Succeeded = 完成
```

### 何時使用 resubmit 與 trigger

| 情境 | 使用 | 原因 |
|---|---|---|
| 在任何流程上**測試修正** | `resubmit_live_flow_run` | 重放導致失敗的確切觸發程序裝載 — 最佳驗證方式 |
| 週期性 / 排程流程 | `trigger_live_flow`（無 `body`） | 立即執行，類似入口網站的「執行流程」按鈕；resubmit 則是重放過去執行的資料 |
| SharePoint / 連接器觸發程序 | `resubmit_live_flow_run` | 若不建立真實的 SP 項目就無法觸發 |
| 帶有**自訂**測試裝載的 HTTP、按鈕或 PowerApps 觸發程序 | `trigger_live_flow` | 當您需要傳送與原始執行不同的資料時 |
| 全新流程，從未執行過 | `trigger_live_flow` | 不存在先前的執行紀錄可供重新提交 |

### 使用自訂裝載測試 HTTP、按鈕及 PowerApps 流程

對於包含 `Request` 觸發程序（HTTP 請求、手動按鈕或 PowerApps）的流程，
當您需要傳送與原始執行**不同**的裝載時，
請使用 `trigger_live_flow`。針對各種類型將觸發程序輸入作為 `body` 傳遞：

```python
# 首先檢查觸發程序預期的內容 — 直接從流程定義中讀取
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
triggers = defn["properties"]["definition"]["triggers"]
manual = next(iter(triggers.values()))   # 通常是 HTTP 流程上的唯一觸發程序
request_schema = manual.get("inputs", {}).get("schema")
print("Expected body schema:", request_schema)

# 回應結構描述位於 actions 區塊中的 Response 動作上
for name, act in defn["properties"]["definition"]["actions"].items():
    if act.get("type") == "Response":
        print(f"Response {name}:", act.get("inputs", {}).get("schema"))

# 使用測試裝載觸發
result = mcp("trigger_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    body={"name": "Test User", "value": 42})
print(f"Status: {result['responseStatus']}, Body: {result.get('responseBody')}")
print(f"Kind: {result['triggerKind']}, via: {result['invocation']}, run: {result.get('runName')}")
if result.get("warning"):
    print(result["warning"])   # 您遺漏的必要觸發程序輸入
```

> `trigger_live_flow` 會自動處理 AAD 驗證的觸發程序。
> 適用於 `Request` 觸發程序（HTTP 請求、按鈕、PowerApps）以及
> 排程（Recurrence）流程，它會立即執行該流程 — 不需要 `body`，
> 因為排程觸發程序不接受輸入（body 會被拒絕）。自動化
> 連接器觸發程序只能從其來源事件觸發。
>
> Power Automate 不會強制檢查觸發程序的 `required` 輸入。若您遺漏了
> 其中一個，執行仍會啟動，該輸入值為 null，且結果會附帶列出遺失索引鍵的
> `warning`。若這有影響，請取消該次執行，並使用
> 完整的 body 再次呼叫。
>
> 只有按鈕和 PowerApps 執行才會傳回 `runName`。對於 HTTP 觸發程序，
> 請使用 `get_live_flow_runs` 尋找該次執行。
>
> 透過瀏覽器擴充功能金鑰時，按鈕與 PowerApps 觸發程序只能以
> 空 body 執行。該工具會顯示此提示並列出解決方法：重新提交過去的執行紀錄、
> 在流程內部使用 `coalesce(triggerBody()?['x'], 'value')` 為輸入提供預設值，
> 或使用標準 API 金鑰。

---

## 快速參考診斷決策樹

| 徵兆 | 第一個工具 | 接著請務必呼叫 | 尋找目標 |
|---|---|---|---|
| 流程顯示為 Failed | `get_live_flow_run_error` | 在失敗動作上呼叫 `get_live_flow_run_action_outputs` | `outputs` 中的 HTTP 狀態 + 回應內文 |
| 錯誤代碼為一般通用（`ActionFailed`、`NotSpecified`） | — | `get_live_flow_run_action_outputs` | `outputs.body` 包含真正的錯誤訊息、堆疊追蹤或 API 錯誤 |
| HTTP 動作傳回 500 | — | `get_live_flow_run_action_outputs` | `outputs.statusCode` + 帶有伺服器錯誤詳細資料的 `outputs.body` |
| 運算式當機 | — | 在前一個動作上呼叫 `get_live_flow_run_action_outputs` | 輸出內文中的 null / 錯誤型別欄位 |
| 流程從未啟動 | `get_live_flow` | — | 檢查 `properties.state` = "Started" |
| 動作傳回錯誤資料 | `get_live_flow_run_action_outputs` | — | 實際輸出內文與預期內容的比較 |
| 已套用修正但仍失敗 | 重新提交後呼叫 `get_live_flow_runs` | — | 新執行的 `status` 欄位 |

> **原則：切勿僅憑錯誤代碼進行診斷。** `get_live_flow_run_error`
> 可識別失敗的動作。`get_live_flow_run_action_outputs` 則揭露
> 真正的根本原因。請務必兩者都呼叫。

---

## 參考檔案

- [common-errors.md](references/common-errors.md) — 錯誤代碼、可能原因及修正方式
- [debug-workflow.md](references/debug-workflow.md) — 複雜失敗的完整決策樹

## 相關技能

- `flowstudio-power-automate-mcp` — 基礎技能：連線設定、MCP 協助程式、工具探索
- `flowstudio-power-automate-build` — 建構與部署新流程
