---
name: flowstudio-power-automate-debug
description: >-
  使用 FlowStudio MCP 伺服器對失敗的 Power Automate 雲端流程進行偵錯。
  Graph API 僅顯示頂層狀態代碼。此技能提供動作層級的輸入與輸出，讓您的代理程式能找出真正的根本原因。
  在被要求執行以下操作時載入此技能：偵錯流程、調查失敗的執行記錄、為何此流程失敗、檢查動作輸出、找出流程錯誤的根本原因、修復損壞的 Power Automate 流程、診斷逾時、追蹤 DynamicOperationRequestFailure、檢查連接器驗證錯誤、讀取執行記錄中的錯誤詳細資訊，或對運算式失敗進行疑難排解。
  需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 偵錯

透過 FlowStudio MCP 伺服器調查失敗的 Power Automate 雲端流程的分步診斷流程。

> **實際偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題而非流程 Bug](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [Null 值導致子流程當機](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

**先決條件**：必須能夠存取 FlowStudio MCP 伺服器並具有有效的 JWT。
請參閱 `flowstudio-power-automate-mcp` 技能以進行連接設定。
訂閱請至 https://mcp.flowstudio.app

---

## 真理來源 (Source of Truth)

> **請務必先呼叫 `tools/list`** 以確認可用的工具名稱及其參數結構。工具名稱和參數可能會隨伺服器版本而變更。
> 此技能涵蓋回應形狀、行為備註和診斷模式 — `tools/list` 無法告訴您的內容。如果本文件與 `tools/list` 或實際的 API 回應有衝突，請以 API 為準。

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

ENV = "<environment-id>"   # 例如 Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 步驟 1 — 定位流程

```python
result = mcp("list_live_flows", environmentName=ENV)
# 回傳封裝物件：{mode, flows, totalCount, error}
target = next(f for f in result["flows"] if "My Flow Name" in f["displayName"])
FLOW_ID = target["id"]   # 純 UUID — 直接當作 flowName 使用
print(FLOW_ID)
```

---

## 步驟 2 — 找出失敗的執行記錄

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=5)
# 回傳陣列（最新的在前）：
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

> **關鍵**：`get_live_flow_run_error` 會告訴您 **哪個** 動作失敗。
> `get_live_flow_run_action_outputs` 會告訴您 **為什麼** 失敗。您必須同時呼叫兩者。
> 永遠不要只止步於錯誤本身 — 像 `ActionFailed`、`NotSpecified` 和 `InternalServerError` 這樣的錯誤代碼只是通用的包裝器。實際的根本原因（錯誤欄位、null 值、HTTP 500 本文、堆疊追蹤）僅在動作的輸入和輸出中可見。

```python
err = mcp("get_live_flow_run_error",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
# 回傳：
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

# failedActions 從外層到內層排序。根本原因通常是最後一個項目：
root = err["failedActions"][-1]
print(f"Root action: {root['actionName']} → code: {root.get('code')}")

# allActions 顯示每個動作的狀態 — 用於查看哪些動作被 Skipped
# 請參閱 common-errors.md 以解碼錯誤代碼。
```

---

## 步驟 4 — 檢查失敗動作的輸入與輸出

> **這是最重要的步驟。** `get_live_flow_run_error` 僅提供通用錯誤代碼。實際的錯誤詳細資訊 — HTTP 狀態代碼、回應本文、堆疊追蹤、Null 值 — 存在於動作的執行階段輸入與輸出中。**在識別出失敗動作後，請務必立即檢查它。**

```python
# 取得根本失敗動作的完整輸入與輸出
root_action = err["failedActions"][-1]["actionName"]
detail = mcp("get_live_flow_run_action_outputs",
    environmentName=ENV,
    flowName=FLOW_ID,
    runName=RUN_ID,
    actionName=root_action)

out = detail[0] if detail else {}
print(f"Action: {out.get('actionName')}")
print(f"Status: {out.get('status')}")

# 對於 HTTP 動作，真實錯誤位於 outputs.body
if isinstance(out.get("outputs"), dict):
    status_code = out["outputs"].get("statusCode")
    body = out["outputs"].get("body", {})
    print(f"HTTP {status_code}")
    print(json.dumps(body, indent=2)[:500])

    # 錯誤本文通常是巢狀 JSON 字串 — 請進行解析
    if isinstance(body, dict) and "error" in body:
        err_detail = body["error"]
        if isinstance(err_detail, str):
            err_detail = json.loads(err_detail)
        print(f"Error: {err_detail.get('message', err_detail)}")

# 對於運算式錯誤，錯誤位於 error 欄位
if out.get("error"):
    print(f"Error: {out['error']}")

# 同時檢查輸入 — 它們顯示使用了什麼運算式/URL/本文
if out.get("inputs"):
    print(f"Inputs: {json.dumps(out['inputs'], indent=2)[:500]}")
```

### 動作輸出揭露的內容 (錯誤代碼無法提供的)

| `get_live_flow_run_error` 的錯誤代碼 | `get_live_flow_run_action_outputs` 揭露的內容 |
|---|---|
| `ActionFailed` | 哪個巢狀動作實際失敗及其 HTTP 回應 |
| `NotSpecified` | HTTP 狀態代碼 + 包含真正錯誤的回應本文 |
| `InternalServerError` | 伺服器的錯誤訊息、堆疊追蹤或 API 錯誤 JSON |
| `InvalidTemplate` | 失敗的確切運算式以及 Null/錯誤型別的值 |
| `BadRequest` | 已傳送的請求本文以及伺服器拒絕的原因 |

### 範例：HTTP 動作回傳 500

```
錯誤代碼: "InternalServerError" ← 這無法說明任何問題

動作輸出揭露：
  HTTP 500
  body: {"error": "Cannot read properties of undefined (reading 'toLowerCase')
    at getClientParamsFromConnectionString (storage.js:20)"}
  ← 這告知您 Azure Function 因為連線字串未定義而崩潰
```

### 範例：運算式 Null 錯誤

```
錯誤代碼: "BadRequest" ← 通用訊息

動作輸出揭露：
  inputs: "body('HTTP_GetTokenFromStore')?['token']?['access_token']"
  outputs: ""   ← 空字串，路徑解析為 null
  ← 這告知您回應形狀已變更 — 權杖位於 body.access_token，而非 body.token.access_token
```

---

## 步驟 5 — 讀取流程定義

```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = defn["properties"]["definition"]["actions"]
print(list(actions.keys()))
```

在定義中尋找失敗的動作。檢查其 `inputs` 運算式以了解它預期什麼資料。

---

## 步驟 6 — 從失敗處往回檢查

當失敗動作的輸入參照上游動作時，請同時檢查它們。往回追蹤鏈結直到找到錯誤資料的來源：

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

> ⚠️ 陣列處理動作的輸出負載可能非常巨大。
> 列印前請務必進行截斷 (例如 `[:500]`)。

> **提示**：省略 `actionName` 可在單次呼叫中取得所有動作。
> 這會回傳每個動作的輸入/輸出 — 當您不確定是哪個上游動作產生錯誤資料時非常有用。但請使用 120 秒以上的逾時設定，因為回應可能會非常龐大。

---

## 步驟 7 — 鎖定根本原因

### 運算式錯誤 (例如對 Null 執行 `split`)
如果錯誤提及 `InvalidTemplate` 或函式名稱：
1. 在定義中找到該動作
2. 檢查該運算式讀取了哪個上游動作/運算式
3. **檢查該上游動作的輸出** 中是否有 Null / 遺失的欄位

```python
# 範例：動作使用 split(item()?['Name'], ' ')
# → 來源資料中的 null Name
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
運算式 `triggerBody()?['fieldName']` 回傳 null → `fieldName` 錯誤。
**檢查觸發程序輸出**以查看實際欄位名稱：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="<trigger-action-name>")
print(json.dumps(result[0].get("outputs"), indent=2)[:500])
```

### HTTP 動作回傳錯誤
錯誤代碼說 `InternalServerError` 或 `NotSpecified` — **一律檢查動作輸出** 以取得實際的 HTTP 狀態與回應本文：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_Get_Data")
out = result[0]
print(f"HTTP {out['outputs']['statusCode']}")
print(json.dumps(out['outputs']['body'], indent=2)[:500])
```

### 連接 / 驗證失敗
尋找 `ConnectionAuthorizationFailed` — 連接擁有者必須符合執行流程的服務帳戶。無法透過 API 修復；請在 PA 設計工具中修復。

---

## 步驟 8 — 套用修復

**針對運算式/資料問題**：
```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
acts = defn["properties"]["definition"]["actions"]

# 範例：修復對潛在 Null Name 執行的 split
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

> ⚠️ `update_live_flow` 一律回傳 `error` 鍵。
> `null` (Python `None`) 表示成功。

---

## 步驟 9 — 驗證修復

> **使用 `resubmit_live_flow_run` 測試任何流程 — 而不僅僅是 HTTP 觸發程序。**
> `resubmit_live_flow_run` 會使用原始的觸發負載來重播先前的執行。這適用於 **每一種觸發程序型別**：Recurrence、SharePoint "當項目建立時"、連接器 Webhook、按鈕觸發程序以及 HTTP 觸發程序。您 **不需要** 要求使用者手動觸發流程或等待下一次排程執行。
>
> 唯一無法使用 `resubmit` 的情況是 **從未執行過的全新流程** — 因為它沒有先前的執行記錄可供重播。

```python
# 重新提交失敗的執行記錄 — 適用於任何觸發程序型別
resubmit = mcp("resubmit_live_flow_run",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
print(resubmit)   # {"resubmitted": true, "triggerName": "..."}

# 等待約 30 秒然後檢查
import time; time.sleep(30)
new_runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=3)
print(new_runs[0]["status"])   # Succeeded = 完成
```

### 重新提交與觸發的比較

| 情境 | 使用 | 原因 |
|---|---|---|
| **測試修復** 任何流程 | `resubmit_live_flow_run` | 重播導致失敗的精確觸發負載 — 驗證的最佳方式 |
| 週期性 / 排程流程 | `resubmit_live_flow_run` | 無法以其他任何方式按需觸發 |
| SharePoint / 連接器觸發程序 | `resubmit_live_flow_run` | 無法在不建立實際 SharePoint 項目的情況下觸發 |
| 具有 **自訂** 測試負載的 HTTP 觸發程序 | `trigger_live_flow` | 當您需要傳送與原始執行不同的資料時 |
| 全新流程，從未執行過 | `trigger_live_flow` (僅限 HTTP) | 沒有先前的執行記錄可供重播 |

### 測試具有自訂負載的 HTTP 觸發流程

對於具有 `Request` (HTTP) 觸發程序的流程，當您需要傳送 **與原始執行不同** 的負載時，請使用 `trigger_live_flow`：

```python
# 首先檢查觸發程序預期內容
schema = mcp("get_live_flow_http_schema",
    environmentName=ENV, flowName=FLOW_ID)
print("Expected body schema:", schema.get("requestSchema"))
print("Response schemas:", schema.get("responseSchemas"))

# 以測試負載觸發
result = mcp("trigger_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    body={"name": "Test User", "value": 42})
print(f"Status: {result['responseStatus']}, Body: {result.get('responseBody')}")
```

> `trigger_live_flow` 自動處理 AAD 驗證的觸發程序。
> 僅適用於具有 `Request` (HTTP) 觸發程序型別的流程。

---

## 快速參考診斷決策樹

| 症狀 | 第一個工具 | 接著一律呼叫 | 尋找目標 |
|---|---|---|---|
| 流程顯示 Failed | `get_live_flow_run_error` | `get_live_flow_run_action_outputs` (針對失敗的動作) | `outputs` 中的 HTTP 狀態 + 回應本文 |
| 錯誤代碼通用 (`ActionFailed`, `NotSpecified`) | — | `get_live_flow_run_action_outputs` | `outputs.body` 包含真正的錯誤訊息、堆疊追蹤或 API 錯誤 |
| HTTP 動作回傳 500 | — | `get_live_flow_run_action_outputs` | 包含伺服器錯誤詳細資訊的 `outputs.statusCode` + `outputs.body` |
| 運算式崩潰 | — | `get_live_flow_run_action_outputs` (針對前一個動作) | 輸出本文中的 Null / 錯誤型別欄位 |
| 流程未啟動 | `get_live_flow` | — | 檢查 `properties.state` = "Started" |
| 動作回傳錯誤資料 | `get_live_flow_run_action_outputs` | — | 實際輸出本文對照預期結果 |
| 修復後仍失敗 | `get_live_flow_runs` (重新提交後) | — | 新的執行記錄 `status` 欄位 |

> **規則：絕對不要僅從錯誤代碼診斷。** `get_live_flow_run_error` 識別失敗的動作。`get_live_flow_run_action_outputs` 揭露真正的原因。一律呼叫兩者。

---

## 參考檔案

- [common-errors.md](references/common-errors.md) — 錯誤代碼、可能原因及修復方法
- [debug-workflow.md](references/debug-workflow.md) — 複雜失敗案例的完整決策樹

## 相關技能

- `flowstudio-power-automate-mcp` — 核心連接設定與作業參考
- `flowstudio-power-automate-build` — 建構與部署新流程
