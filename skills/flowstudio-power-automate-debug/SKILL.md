---
name: flowstudio-power-automate-debug
description: >-
  使用 FlowStudio MCP 伺服器對失敗的 Power Automate 雲端流程進行偵錯。
  Graph API 僅顯示頂層狀態碼。此技能為您的代理程式提供動作層級的輸入和輸出，
  以找出實際的根本原因。當被要求執行以下操作時載入此技能：對流程進行偵錯、
  調查失敗的執行、為什麼此流程失敗、檢查動作輸出、尋找流程錯誤的根本原因、
  修復損壞的 Power Automate 流程、診斷逾時、追蹤 DynamicOperationRequestFailure、
  檢查連接器驗證錯誤、從執行中讀取錯誤詳細資訊，或排解運算式失敗。
  需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 偵錯

透過 FlowStudio MCP 伺服器調查失敗的 Power Automate 雲端流程的逐步診斷程序。

> **實際偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題，而非流程錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [Null 值導致子流程崩潰](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

**先決條件**：必須能夠使用有效的 JWT 存取 FlowStudio MCP 伺服器。
有關連線設定，請參閱 `flowstudio-power-automate-mcp` 技能。
請在 https://mcp.flowstudio.app 訂閱。

---

## 資訊來源 (Source of Truth)

> **務必先呼叫 `list_skills` / `tool_search`** 以確認可用的工具名稱和參數
> 結構描述。工具名稱和參數可能會隨伺服器版本而變更。
> 此技能涵蓋回應形狀、行為備註和診斷模式 — 這些是工具結構描述無法告訴您的
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

ENV = "<environment-id>"   # 例如 Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 第 1 步 — 定位流程

```python
result = mcp("list_live_flows", environmentName=ENV)
# 傳回一個包裝物件：{mode, flows, totalCount, error}
target = next(f for f in result["flows"] if "My Flow Name" in f["displayName"])
FLOW_ID = target["id"]   # 純 UUID — 直接用作 flowName
print(FLOW_ID)
```

---

## 第 2 步 — 尋找失敗的執行

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=5)
# 傳回直接陣列 (最新在前)：
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

## 第 3 步 — 取得頂層錯誤

> **關鍵**：`get_live_flow_run_error` 會告訴您 **哪個** 動作失敗了。
> `get_live_flow_run_action_outputs` 則會告訴您 **原因**。您必須兩者都呼叫。
> 絕不要僅止步於錯誤本身 — `ActionFailed`、`NotSpecified` 和 `InternalServerError` 
> 等錯誤代碼只是通用的包裝。真正的根本原因（錯誤的欄位、null 值、HTTP 500 本文、
> 堆疊追蹤）只有在動作的輸入和輸出中才可見。

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

# failedActions 的順序是由外而內。根本原因是最後一項：
root = err["failedActions"][-1]
print(f"根本動作：{root['actionName']} → 代碼：{root.get('code')}")

# allActions 顯示每個動作的狀態 — 適合用來找出被跳過 (Skipped) 的部分
# 請參閱 common-errors.md 來解碼錯誤代碼。
```

---

## 第 4 步 — 檢查失敗動作的輸入與輸出

> **這是最重要的步驟。** `get_live_flow_run_error` 僅提供通用的錯誤代碼。
> 實際的錯誤詳細資訊 — HTTP 狀態碼、回應本文、堆疊追蹤、null 值 — 
> 都包含在動作的執行階段輸入和輸出中。**在識別出失敗的動作後，請務必立即檢查它。**

```python
# 取得根本失敗動作的完整輸入與輸出
root_action = err["failedActions"][-1]["actionName"]
detail = mcp("get_live_flow_run_action_outputs",
    environmentName=ENV,
    flowName=FLOW_ID,
    runName=RUN_ID,
    actionName=root_action)

if len(detail) > 1:
    print(f"{root_action} 傳回了 {len(detail)} 次重複；請檢查反覆運算索引")
out = detail[0] if detail else {}
print(f"動作：{out.get('actionName')}")
print(f"狀態：{out.get('status')}")

# 對於 HTTP 動作，真正的錯誤在 outputs.body 中
if isinstance(out.get("outputs"), dict):
    status_code = out["outputs"].get("statusCode")
    body = out["outputs"].get("body", {})
    print(f"HTTP {status_code}")
    print(json.dumps(body, indent=2)[:500])

    # 錯誤本文通常是巢狀的 JSON 字串 — 請解析它們
    if isinstance(body, dict) and "error" in body:
        err_detail = body["error"]
        if isinstance(err_detail, str):
            err_detail = json.loads(err_detail)
        print(f"錯誤：{err_detail.get('message', err_detail)}")

# 對於運算式錯誤，錯誤詳細資訊在 error 欄位中
if out.get("error"):
    print(f"錯誤：{out['error']}")

# 同時檢查 inputs (輸入) — 它們顯示了使用了哪些運算式/URL/本文
if out.get("inputs"):
    print(f"輸入：{json.dumps(out['inputs'], indent=2)[:500]}")
```

### 動作輸出揭示的資訊 (錯誤代碼無法揭示的部分)

| 來自 `get_live_flow_run_error` 的錯誤代碼 | `get_live_flow_run_action_outputs` 揭示的內容 |
|---|---|
| `ActionFailed` | 到底是哪個巢狀動作失敗，以及其 HTTP 回應 |
| `NotSpecified` | 帶有真實錯誤的 HTTP 狀態碼 + 回應本文 |
| `InternalServerError` | 伺服器的錯誤訊息、堆疊追蹤或 API 錯誤 JSON |
| `InvalidTemplate` | 失敗的確切運算式以及 null 值或錯誤類型的值 |
| `BadRequest` | 已傳送的要求本文，以及伺服器拒絕要求的原因 |

### Foreach 反覆運算

當 `actionName` 指向 foreach 內部的動作時，輸出工具可以傳回該動作的所有重複。每個項目可能包含具有迴圈名稱和以零為基準的 `itemIndex` 的 `repetitionIndexes`。在找到可疑項目後，使用 `iterationIndex` 檢查其中一次反覆運算：

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

### 證據撰寫動作 (Evidence Compose Bookends)

對於不確定的連接器工作，在具風險的動作之前新增一個 `Compose_*_Request`，並在其後新增一個 `Compose_*_Result`，且結果動作應同時允許 `Succeeded` 和 `Failed` 狀態。這為未來的偵錯提供了清晰的承載資料快照，而不需要再次部署。請勿在這些撰寫動作中包含秘密資訊或超長二進位承載資料。

### 範例：HTTP 動作傳回 500

```
錯誤代碼："InternalServerError" ← 這對您毫無幫助

動作輸出揭示：
  HTTP 500
  body: {"error": "Cannot read properties of undefined (reading 'toLowerCase')
    at getClientParamsFromConnectionString (storage.js:20)"}
  ← 這告訴您 Azure Function 崩潰，因為連線字串未定義
```

### 範例：Null 上的運算式錯誤

```
錯誤代碼："BadRequest" ← 過於通用的錯誤

動作輸出揭示：
  inputs: "body('HTTP_GetTokenFromStore')?['token']?['access_token']"
  outputs: ""   ← 空字串，路徑解析為 null
  ← 這告訴您回應形狀已更改 — 權杖位於 body.access_token，而不是 body.token.access_token
```

---

## 第 5 步 — 讀取流程定義

```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = defn["properties"]["definition"]["actions"]
print(list(actions.keys()))
```

在定義中找到失敗的動作。檢查其 `inputs` 運算式，以了解它預期什麼資料。

---

## 第 6 步 — 從失敗點向後追溯

當失敗動作的輸入引用了上游動作時，也請檢查這些動作。沿著處理鏈向後追溯，直到找到錯誤資料的來源：

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
    print(f"輸入：{json.dumps(out.get('inputs', ''), indent=2)[:300]}")
    print(f"輸出：{json.dumps(out.get('outputs', ''), indent=2)[:300]}")
```

> ⚠️ 陣列處理動作的輸出承載資料可能非常大。
> 在列印之前務必進行切片 (例如 `[:500]`)。

> **提示**：如果您不確定是哪個動作產生了錯誤資料，請省略 `actionName` 以列出頂層動作。一旦選定了 foreach 內部的動作，請傳遞 `iterationIndex` 以避免將所有重複反覆運算拉入內容中。

---

## 第 7 步 — 精確鎖定根本原因

### 運算式錯誤 (例如在 null 上執行 `split`)
如果錯誤提及 `InvalidTemplate` 或函式名稱：
1. 在定義中找到該動作。
2. 檢查它讀取的是哪個上游動作/運算式。
3. **檢查該上游動作的輸出** 中是否有 null / 缺失欄位。

```python
# 範例：動作使用了 split(item()?['Name'], ' ')
# → 來源資料中的 Name 為 null
result = mcp("get_live_flow_run_action_outputs", ..., actionName="Compose_Names")
if not result:
    print("Compose_Names 未傳回任何輸出")
    names = []
else:
    names = result[0].get("outputs", {}).get("body") or []
nulls = [x for x in names if x.get("Name") is None]
print(f"共有 {len(nulls)} 筆記錄的 Name 為 null")
```

### 錯誤的欄位路徑
運算式 `triggerBody()?['fieldName']` 傳回 null → `fieldName` 錯誤。
**檢查觸發器輸出** 以查看實際的欄位名稱：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="<trigger-action-name>")
print(json.dumps(result[0].get("outputs"), indent=2)[:500])
```

### 傳回錯誤的 HTTP 動作
錯誤代碼顯示 `InternalServerError` 或 `NotSpecified` — **務必檢查動作輸出** 以獲取實際的 HTTP 狀態和回應本文：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_Get_Data")
out = result[0]
print(f"HTTP {out['outputs']['statusCode']}")
print(json.dumps(out['outputs']['body'], indent=2)[:500])
```

### 連線 / 驗證失敗
尋找 `ConnectionAuthorizationFailed` — 連線擁有者必須與執行流程的服務帳戶相符。無法透過 API 修復；請在 PA 設計器中修復。

### Outlook 使用者選擇器失敗 (`DynamicListValuesUndefinedOrInvalid`)
Outlook 動作（如 `GetEmailsV3`）使用的參數（`mailboxAddress`, `to`, `cc`, `from`）之下拉選單是由 `builtInOperation:AadGraph.GetUsers` 支援的 — 該操作在 PA listEnum 層級已損壞，且始終傳回 `DynamicListValuesUndefinedOrInvalid`。當代理程式重建或透過 `update_live_flow` 修改 Outlook 動作，並嘗試透過動態選項解析使用者時，就會出現這種情況。**不要嘗試透過重試 AadGraph 來修復它** — 請改用 `shared_office365users.SearchUserV2`（傳回相同的 AAD 使用者形狀）。使用 `describe_live_connector` 確認受影響的參數是否公開了結構化的 `fallback`，然後針對 `shared_office365users.SearchUserV2` 而非損壞的 AadGraph 操作呼叫 `get_live_dynamic_options`。對於動態欄位結構描述而非下拉選單選項，請配合使用由 `describe_live_connector` 傳回的 Metadata 呼叫 `get_live_dynamic_properties`。

---

## 第 8 步 — 套用修復

**針對運算式/資料問題**：
```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
acts = defn["properties"]["definition"]["actions"]

# 範例：修復對可能為 null 的 Name 執行的 split
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

> ⚠️ `update_live_flow` 始終傳回一個 `error` 鍵。
> `null`（Python `None`）值表示成功。

---

## 第 9 步 — 驗證修復

> **使用 `resubmit_live_flow_run` 測試任何流程 — 而不僅僅是 HTTP 觸發器。**
> `resubmit_live_flow_run` 使用先前的執行記錄原始觸發承載資料重新進行播放。這適用於 **每一種觸發器類型**：定期執行、SharePoint「建立項目時」、連接器 Webhook、按鈕 (Button) 觸發器以及 HTTP 觸發器。您不需要要求使用者手動觸發流程，或等待下一次排程執行。
>
> 唯一無法使用 `resubmit` 的情況是 **從未執行過的全新流程** — 因為沒有之前的執行記錄可供重播。

```python
# 重新提交失敗的執行 — 適用於任何觸發器類型
resubmit = mcp("resubmit_live_flow_run",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
print(resubmit)   # {"resubmitted": true, "triggerName": "..."}

# 等待約 30 秒，然後檢查
import time; time.sleep(30)
new_runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=3)
print(new_runs[0]["status"])   # Succeeded = 完成
```

### 何時使用重新提交 (Resubmit) vs 觸發 (Trigger)

| 情境 | 使用工具 | 原因 |
|---|---|---|
| **在任何流程上測試修復** | `resubmit_live_flow_run` | 重播導致失敗的確切觸發承載資料 — 驗證修復的最佳方法 |
| 定期執行 / 排程流程 | `resubmit_live_flow_run` | 除此之外，無法依需求觸發 |
| SharePoint / 連接器觸發器 | `resubmit_live_flow_run` | 如果不建立實際的 SP 項目就無法觸發 |
| 帶有 **自定義** 測試承載資料的 HTTP 觸發器 | `trigger_live_flow` | 當您需要傳送與原始執行不同的資料時 |
| 全新的流程，從未執行過 | `trigger_live_flow` (僅限 HTTP) | 不存在先前的執行記錄可供重新提交 |

### 使用自定義承載資料測試 HTTP 觸發的流程

對於具有 `Request` (HTTP) 觸發器的流程，當您需要傳送與原始執行 **不同** 的承載資料時，請使用 `trigger_live_flow`：

```python
# 首先檢查觸發器預期的內容 — 直接從流程定義中讀取
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
triggers = defn["properties"]["definition"]["triggers"]
manual = next(iter(triggers.values()))   # 通常是 HTTP 流程上的唯一觸發器
request_schema = manual.get("inputs", {}).get("schema")
print("預期的本文結構描述：", request_schema)

# 回應結構描述位於動作區塊中的「回應」(Response) 動作上
for name, act in defn["properties"]["definition"]["actions"].items():
    if act.get("type") == "Response":
        print(f"回應 {name}：", act.get("inputs", {}).get("schema"))

# 使用測試承載資料進行觸發
result = mcp("trigger_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    body={"name": "測試使用者", "value": 42})
print(f"狀態：{result['responseStatus']}, 本文：{result.get('responseBody')}")
```

> `trigger_live_flow` 會自動處理 AAD 通過驗證的觸發器。
> 僅適用於 `Request` (HTTP) 觸發器類型的流程。

---

## 快速參考診斷決策樹

| 徵狀 | 第一個使用的工具 | 接著務必呼叫 | 要尋找的內容 |
|---|---|---|---|
| 流程顯示為 Failed (失敗) | `get_live_flow_run_error` | 對失敗動作執行 `get_live_flow_run_action_outputs` | `outputs` 中的 HTTP 狀態 + 回應本文 |
| 錯誤代碼是通用的 (`ActionFailed`, `NotSpecified`) | — | `get_live_flow_run_action_outputs` | `outputs.body` 包含真實的錯誤訊息、堆疊追蹤或 API 錯誤 |
| HTTP 動作傳回 500 | — | `get_live_flow_run_action_outputs` | 帶有伺服器錯誤詳細資訊的 `outputs.statusCode` + `outputs.body` |
| 運算式崩潰 | — | 對先前動作執行 `get_live_flow_run_action_outputs` | 輸出本文中的 null / 錯誤類型欄位 |
| 流程從未啟動 | `get_live_flow` | — | 檢查 `properties.state` = "Started" |
| 動作傳回錯誤的資料 | `get_live_flow_run_action_outputs` | — | 實際的輸出本文 vs 預期值 |
| 已套用修復但仍然失敗 | 重新提交後執行 `get_live_flow_runs` | — | 新執行的 `status` 欄位 |

> **規則：絕不要僅根據錯誤代碼進行診斷。** `get_live_flow_run_error` 
> 會識別失敗的動作。`get_live_flow_run_action_outputs` 則會揭示
> 實際原因。請務必兩者都呼叫。

---

## 參考檔案

- [common-errors.md](references/common-errors.md) — 錯誤代碼、可能原因和修復方法
- [debug-workflow.md](references/debug-workflow.md) — 處理複雜失敗的完整決策樹

## 相關技能

- `flowstudio-power-automate-mcp` — 基礎技能：連線設定、MCP 協助程式、工具發現
- `flowstudio-power-automate-build` — 建構和部署新流程
