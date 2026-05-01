---
name: flowstudio-power-automate-debug
description: >-
  使用 FlowStudio MCP 伺服器對失敗的 Power Automate 雲端流程進行偵錯。
  Graph API 僅顯示頂層狀態碼。此技能為您的代理程式提供
  動作層級的輸入與輸出，以找出真正的根本原因。
  當使用者要求執行以下操作時，請載入此技能：對流程進行偵錯、調查失敗的執行記錄、
  為什麼此流程失敗、檢查動作輸出、找出流程錯誤的根本原因、
  修復損壞的 Power Automate 流程、診斷逾時、追蹤 DynamicOperationRequestFailure、
  檢查連接器驗證錯誤、從執行記錄中讀取錯誤詳細資訊，或排解 
  運算式失敗。需要 FlowStudio MCP 訂閱 — 詳見 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 偵錯

透過 FlowStudio MCP 伺服器調查失敗的 Power Automate 雲端流程的逐步診斷程序。

> **真實偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題，而非流程臭蟲](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [空值 (Null) 導致子流程崩潰](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

**前提條件**：必須可連線至具有有效 JWT 的 FlowStudio MCP 伺服器。
連線設定請參閱 `power-automate-mcp` 技能。
請於 https://mcp.flowstudio.app 進行訂閱。

---

## 事實來源

> **務必先呼叫 `tools/list`** 以確認可用的工具名稱及其參數結構描述。
> 工具名稱和參數可能會隨伺服器版本而變更。
> 此技能涵蓋回應格式、行為備註及診斷模式 — 
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

ENV = "<環境 ID>"   # 例如 Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 步驟 1 — 定位流程

```python
result = mcp("list_live_flows", environmentName=ENV)
# 傳回一個包裝物件：{mode, flows, totalCount, error}
target = next(f for f in result["flows"] if "My Flow Name" in f["displayName"])
FLOW_ID = target["id"]   # 純 UUID — 直接作為 flowName 使用
print(FLOW_ID)
```

---

## 步驟 2 — 尋找失敗的執行記錄

```python
runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=5)
# 直接傳回陣列 (由新到舊)：
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

## 步驟 3 — 獲取頂層錯誤

> **關鍵**：`get_live_flow_run_error` 會告訴您是「哪一個」動作失敗。
> `get_live_flow_run_action_outputs` 則會告訴您「為什麼」失敗。
> 您「必須」兩者都呼叫。絕不要只看錯誤代碼 — 像 `ActionFailed`、
> `NotSpecified` 和 `InternalServerError` 這些代碼只是通用的包裝。
> 真正的根本原因 (錯誤的欄位、空值、HTTP 500 主體、堆疊追蹤) 
> 只有在動作的輸入與輸出中才看得到。

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

# failedActions 是按由外而內的順序排列。根本原因 (ROOT) 是「最後一項」：
root = err["failedActions"][-1]
print(f"根動作：{root['actionName']} → 代碼：{root.get('code')}")

# allActions 顯示每個動作的狀態 — 對於找出哪些被略過 (Skipped) 很有用
# 解碼錯誤代碼請參閱 common-errors.md。
```

---

## 步驟 4 — 檢查失敗動作的輸入與輸出

> **這是最重要的步驟。** `get_live_flow_run_error` 僅提供 
> 通用的錯誤代碼。實際的錯誤詳細資訊 — HTTP 狀態碼、
> 回應主體、堆疊追蹤、空值 — 都存在於動作的執行階段 
> 輸入與輸出中。**在識別出失敗動作後，務必立即檢查它。**

```python
# 獲取根本失敗動作的完整輸入與輸出
root_action = err["failedActions"][-1]["actionName"]
detail = mcp("get_live_flow_run_action_outputs",
    environmentName=ENV,
    flowName=FLOW_ID,
    runName=RUN_ID,
    actionName=root_action)

out = detail[0] if detail else {}
print(f"動作：{out.get('actionName')}")
print(f"狀態：{out.get('status')}")

# 對於 HTTP 動作，真正的錯誤在於 outputs.body
if isinstance(out.get("outputs"), dict):
    status_code = out["outputs"].get("statusCode")
    body = out["outputs"].get("body", {})
    print(f"HTTP {status_code}")
    print(json.dumps(body, indent=2)[:500])

    # 錯誤主體通常是巢狀的 JSON 字串 — 請解析它們
    if isinstance(body, dict) and "error" in body:
        err_detail = body["error"]
        if isinstance(err_detail, str):
            err_detail = json.loads(err_detail)
        print(f"錯誤：{err_detail.get('message', err_detail)}")

# 對於運算式錯誤，錯誤資訊在 error 欄位中
if out.get("error"):
    print(f"錯誤：{out['error']}")

# 同時檢查輸入 — 它們顯示使用了什麼運算式/URL/主體
if out.get("inputs"):
    print(f"輸入：{json.dumps(out['inputs'], indent=2)[:500]}")
```

### 動作輸出揭示的資訊 (錯誤代碼無法提供的)

| `get_live_flow_run_error` 的錯誤代碼 | `get_live_flow_run_action_outputs` 揭示的內容 |
|---|---|
| `ActionFailed` | 哪一個巢狀動作實際失敗，以及其 HTTP 回應 |
| `NotSpecified` | 包含真實錯誤的 HTTP 狀態碼 + 回應主體 |
| `InternalServerError` | 伺服器的錯誤訊息、堆疊追蹤或 API 錯誤 JSON |
| `InvalidTemplate` | 失敗的確切運算式，以及空值/類型錯誤的值 |
| `BadRequest` | 已傳送的請求主體，以及伺服器拒絕它的原因 |

### 範例：HTTP 動作傳回 500

```
錯誤代碼："InternalServerError" ← 這沒提供任何資訊

動作輸出揭示：
  HTTP 500
  body: {"error": "Cannot read properties of undefined (reading 'toLowerCase')
    at getClientParamsFromConnectionString (storage.js:20)"}
  ← 這告訴您 Azure Function 崩潰了，因為連線字串未定義
```

### 範例：對空值執行運算式導致錯誤

```
錯誤代碼："BadRequest" ← 通用代碼

動作輸出揭示：
  inputs: "body('HTTP_GetTokenFromStore')?['token']?['access_token']"
  outputs: ""   ← 空字串，路徑解析為空值 (null)
  ← 這告訴您回應格式變更了 — token 位於 body.access_token，而非 body.token.access_token
```

---

## 步驟 5 — 讀取流程定義

```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = defn["properties"]["definition"]["actions"]
print(list(actions.keys()))
```

在定義中找到失敗的動作。檢查其 `inputs` 運算式，以了解它預期什麼資料。

---

## 步驟 6 — 從失敗處回溯

當失敗動作的輸入參考了上游動作時，也請檢查那些動作。
回溯鏈條，直到找到損毀資料的源頭：

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
    print(f"輸入： {json.dumps(out.get('inputs', ''), indent=2)[:300]}")
    print(f"輸出： {json.dumps(out.get('outputs', ''), indent=2)[:300]}")
```

> ⚠️ 來自陣列處理動作的輸出酬載可能非常龐大。
> 列印前務必進行切割 (例如 `[:500]`)。

> **提示**：省略 `actionName` 可在單次呼叫中獲取「所有」動作。
> 這會傳回每個動作的輸入/輸出 — 當您不確定是哪一個上游動作 
> 產生了損毀資料時很有用。但回應可能非常大，請使用 120 秒以上的逾時設定。

---

## 步驟 7 — 準確鎖定根本原因

### 運算式錯誤 (例如：對空值執行 `split`)
如果錯誤提及 `InvalidTemplate` 或函式名稱：
1. 在定義中找到該動作
2. 檢查它讀取的是哪一個上游動作/運算式
3. **檢查該上游動作的輸出**，確認是否有空值 (null) 或缺失欄位

```python
# 範例：動作使用 split(item()?['Name'], ' ')
# → 原始資料中的 Name 為空值
result = mcp("get_live_flow_run_action_outputs", ..., actionName="Compose_Names")
if not result:
    print("Compose_Names 未傳回任何輸出")
    names = []
else:
    names = result[0].get("outputs", {}).get("body") or []
nulls = [x for x in names if x.get("Name") is None]
print(f"有 {len(nulls)} 筆記錄的 Name 為空值")
```

### 錯誤的欄位路徑
運算式 `triggerBody()?['fieldName']` 傳回空值 → `fieldName` 錯誤。
**檢查觸發器輸出**，以查看實際的欄位名稱：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="<觸發動作名稱>")
print(json.dumps(result[0].get("outputs"), indent=2)[:500])
```

### HTTP 動作傳回錯誤
錯誤代碼顯示 `InternalServerError` 或 `NotSpecified` — **務必檢查 
動作輸出**以獲取實際的 HTTP 狀態和回應主體：
```python
result = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_Get_Data")
out = result[0]
print(f"HTTP {out['outputs']['statusCode']}")
print(json.dumps(out['outputs']['body'], indent=2)[:500])
```

### 連接 / 驗證失敗
尋找 `ConnectionAuthorizationFailed` — 連接擁有者必須與 
執行流程的服務帳戶相符。無法透過 API 修復；請在 PA 設計器中修復。

### Outlook 使用者選擇器失敗 (`DynamicListValuesUndefinedOrInvalid`)
Outlook 動作 (如 `GetEmailsV3`) 使用的參數 (`mailboxAddress`, `to`, `cc`, `from`)，其下拉選單是由 `builtInOperation:AadGraph.GetUsers` 支援的 — 但該功能在 PA `listEnum` 層級已損壞，且始終傳回 `DynamicListValuesUndefinedOrInvalid`。
當代理程式透過 `update_live_flow` 重建或修改 Outlook 動作，並嘗試透過動態選項解析使用者時，就會出現此問題。**不要透過重試 AadGraph 來修復它** — 請改用 `shared_office365users.SearchUserV2` (傳回相同的 AAD 使用者格式)。
可運行的模式請參閱 `power-automate-build` 技能的**步驟 3a — 解析連接器動態值**。`describe_live_connector` (v1.1.6+) 會在受影響的參數上傳回此備援作為結構化 `fallback` 欄位。

---

## 步驟 8 — 執行修復

**針對運算式/資料問題**：
```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
acts = defn["properties"]["definition"]["actions"]

# 範例：修復對可能為空值的 Name 執行 split 的問題
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

> ⚠️ `update_live_flow` 始終會傳回 `error` 鍵。
> `null` (Python `None`) 值表示成功。

---

## 步驟 9 — 驗證修復

> **使用 `resubmit_live_flow_run` 來測試「任何」流程 — 不僅限於 HTTP 觸發器。**
> `resubmit_live_flow_run` 會使用其原始觸發酬載重播過往的執行。
> 這適用於「每一種」觸發器類型：週期性、SharePoint 
> 「建立項目時」、連接器 Webhook、按鈕觸發器及 HTTP 
> 觸發器。您「不需要」要求使用者手動觸發流程，或 
> 等待下一次排程執行。
>
> 唯一無法使用「重新提交 (resubmit)」的情況是**從未執行過的 
> 全新流程** — 因為它沒有過往的執行記錄可供重播。

```python
# 重新提交失敗的執行記錄 — 適用於任何觸發器類型
resubmit = mcp("resubmit_live_flow_run",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
print(resubmit)   # {"resubmitted": true, "triggerName": "..."}

# 等待約 30 秒後檢查
import time; time.sleep(30)
new_runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=3)
print(new_runs[0]["status"])   # Succeeded = 完成
```

### 何時使用重新提交 (Resubmit) vs 觸發 (Trigger)

| 場景 | 使用工具 | 為什麼 |
|---|---|---|
| **測試修復** (任何流程) | `resubmit_live_flow_run` | 重播導致失敗的確切觸發酬載 — 這是最佳的驗證方式 |
| 週期性 / 排程流程 | `resubmit_live_flow_run` | 無法透過其他方式隨需觸發 |
| SharePoint / 連接器觸發器 | `resubmit_live_flow_run` | 若不建立真實的 SP 項目則無法觸發 |
| 帶有「自定義」測試酬載的 HTTP 觸發器 | `trigger_live_flow` | 當您需要傳送與原始執行不同的資料時 |
| 從未執行過的全新流程 | `trigger_live_flow` (僅限 HTTP) | 不存在可供重新提交的過往執行記錄 |

### 使用自定義酬載測試 HTTP 觸發的流程

對於具有 `Request` (HTTP) 觸發器的流程，當您需要 
傳送與原始執行「不同」的酬載時，請使用 `trigger_live_flow`：

```python
# 首先檢查觸發器預期什麼內容
schema = mcp("get_live_flow_http_schema",
    environmentName=ENV, flowName=FLOW_ID)
print("預期的主體結構描述：", schema.get("requestSchema"))
print("回應結構描述：", schema.get("responseSchemas"))

# 使用測試酬載觸發
result = mcp("trigger_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    body={"name": "Test User", "value": 42})
print(f"狀態：{result['responseStatus']}, 主體：{result.get('responseBody')}")
```

> `trigger_live_flow` 會自動處理 AAD 驗證的觸發器。
> 僅適用於 `Request` (HTTP) 觸發器類型的流程。

---

## 快速診斷決策樹

| 症狀 | 第一步工具 | 接著「務必」呼叫 | 尋找重點 |
|---|---|---|---|
| 流程顯示為 Failed | `get_live_flow_run_error` | 對失敗動作執行 `get_live_flow_run_action_outputs` | `outputs` 中的 HTTP 狀態 + 回應主體 |
| 錯誤代碼是通用的 (`ActionFailed`, `NotSpecified`) | — | `get_live_flow_run_action_outputs` | `outputs.body` 包含真實的錯誤訊息、堆疊追蹤或 API 錯誤 |
| HTTP 動作傳回 500 | — | `get_live_flow_run_action_outputs` | `outputs.statusCode` + 帶有伺服器錯誤詳細資訊的 `outputs.body` |
| 運算式崩潰 | — | 對前一個動作執行 `get_live_flow_run_action_outputs` | 輸出主體中的空值 / 類型錯誤欄位 |
| 流程從未啟動 | `get_live_flow` | — | 檢查 `properties.state` 是否為 "Started" |
| 動作傳回錯誤資料 | `get_live_flow_run_action_outputs` | — | 實際輸出主體 vs 預期主體 |
| 已執行修復但仍失敗 | 重新提交後執行 `get_live_flow_runs` | — | 新執行記錄的 `status` 欄位 |

> **規則：絕不要僅根據錯誤代碼進行診斷。** `get_live_flow_run_error` 
> 會識別失敗的動作。`get_live_flow_run_action_outputs` 則揭示 
> 實際原因。務必兩者都呼叫。

---

## 參考檔案

- [common-errors.md](references/common-errors.md) — 錯誤代碼、可能原因及修復方式
- [debug-workflow.md](references/debug-workflow.md) — 針對複雜失敗的完整決策樹

## 相關技能

- `power-automate-mcp` — 基礎技能：連接設定、MCP 輔助程式、工具探索
- `power-automate-build` — 建置並部署新流程
