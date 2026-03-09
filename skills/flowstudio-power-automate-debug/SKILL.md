---
name: flowstudio-power-automate-debug
description: >-
  使用 FlowStudio MCP 伺服器對失敗的 Power Automate 雲端流程進行偵錯。當被要求執行下列工作時載入此技能：流程偵錯、調查失敗的執行記錄、了解流程失敗原因、檢視動作輸出、尋找流程錯誤的根本原因、修正損壞的 Power Automate 流程、診斷逾時、追蹤 DynamicOperationRequestFailure、檢查連接器驗證錯誤、讀取執行記錄中的錯誤詳細資料，或排除運算式故障。需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app
---

# 使用 FlowStudio MCP 進行 Power Automate 偵錯

透過 FlowStudio MCP 伺服器調查失敗的 Power Automate 雲端流程的逐步診斷程序。

**先決條件**：必須可連線至具備有效 JWT 的 FlowStudio MCP 伺服器。
有關連線設定，請參閱 `flowstudio-power-automate-mcp` 技能。
請至 https://mcp.flowstudio.app 訂閱

---

## 資訊來源 (Source of Truth)

> **務必先呼叫 `tools/list`** 以確認可用的工具名稱及其參數 Schema。工具名稱與參數可能會隨伺服器版本而變更。本技能涵蓋了回應形式、行為說明及診斷模式 — 這些是 `tools/list` 無法告訴您的資訊。如果此文件與 `tools/list` 或實際的 API 回應不符，請以 API 為準。

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

ENV = "<環境-識別碼>"   # 範例：Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## FlowStudio for Teams：快速診斷路徑 (跳過步驟 2–4)

如果您有 FlowStudio for Teams 訂閱，呼叫 `get_store_flow_errors` 即可在單次呼叫中傳回每次執行的失敗資料，包含動作名稱與修復提示 — 無須逐步執行即時 API 步驟。

```python
# 快速失敗摘要
summary = mcp("get_store_flow_summary", environmentName=ENV, flowName=FLOW_ID)
# {"totalRuns": 100, "failRuns": 10, "failRate": 0.1,
#  "averageDurationSeconds": 29.4, "maxDurationSeconds": 158.9,
#  "firstFailRunRemediation": "<提示或 null>"}
print(f"失敗率：{summary['failRate']:.0%}，總執行次數：{summary['totalRuns']}")

# 每次執行的錯誤詳細資料 (需要設定主動監控)
errors = mcp("get_store_flow_errors", environmentName=ENV, flowName=FLOW_ID)
if errors:
    for r in errors[:3]:
        print(r["startTime"], "|", r.get("failedActions"), "|", r.get("remediationHint"))
    # 如果 errors 已確認失敗的動作 → 跳轉至步驟 6 (套用修正)
else:
    # 儲存空間中沒有此流程的執行層級詳細資料 — 使用即時工具 (步驟 2–5)
    pass
```

如需完整的治理記錄 (說明、複雜度、層級、連接器清單)：
```python
record = mcp("get_store_flow", environmentName=ENV, flowName=FLOW_ID)
# {"displayName": "我的流程", "state": "Started",
#  "runPeriodTotal": 100, "runPeriodFailRate": 0.1, "runPeriodFails": 10,
#  "runPeriodDurationAverage": 29410.8,   ← 毫秒
#  "runError": "{\"code\": \"EACCES\", ...}",  ← JSON 字串，需剖析
#  "description": "...", "tier": "Premium", "complexity": "{...}"}
if record.get("runError"):
    last_err = json.loads(record["runError"])
    print("上次執行錯誤：", last_err)
```

---

## 步驟 1 — 定位流程

```python
result = mcp("list_live_flows", environmentName=ENV)
# 傳回包裝物件：{mode, flows, totalCount, error}
target = next(f for f in result["flows"] if "我的流程名稱" in f["displayName"])
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
#   "error": {"code": "ActionFailed", "message": "動作失敗..."}},
#  {"name": "...", "status": "Succeeded", "error": null, ...}]

for r in runs:
    print(r["name"], r["status"], r["startTime"])

RUN_ID = next(r["name"] for r in runs if r["status"] == "Failed")
```

---

## 步驟 3 — 取得頂層錯誤

```python
err = mcp("get_live_flow_run_error",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
# 傳回：
# {
#   "runName": "08584296068667933411438594643CU15",
#   "failedActions": [
#     {"actionName": "Apply_to_each_prepare_workers", "status": "Failed",
#      "error": {"code": "ActionFailed", "message": "動作失敗..."},
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

# failedActions 的順序是由外而內。根本原因 (ROOT cause) 是最後一個項目：
root = err["failedActions"][-1]
print(f"根本動作：{root['actionName']} → 代碼：{root.get('code')}")

# allActions 顯示每個動作的狀態 — 對於找出哪些被「跳過 (Skipped)」很有幫助
# 請參閱 common-errors.md 以解碼錯誤代碼。
```

---

## 步驟 4 — 讀取流程定義

```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = defn["properties"]["definition"]["actions"]
print(list(actions.keys()))
```

在定義中尋找失敗的動作。檢查其 `inputs` 運算式以了解它預期什麼資料。

---

## 步驟 5 — 檢視動作輸出 (從失敗處往回溯源)

針對失敗 **之前** 的每個動作，檢視其執行階段輸出：

```python
for action_name in ["Compose_WeekEnd", "HTTP_Get_Data", "Parse_JSON"]:
    result = mcp("get_live_flow_run_action_outputs",
        environmentName=ENV,
        flowName=FLOW_ID,
        runName=RUN_ID,
        actionName=action_name)
    # 傳回一個陣列 — 當提供 actionName 時為單一元素
    out = result[0] if result else {}
    print(action_name, out.get("status"))
    print(json.dumps(out.get("outputs", {}), indent=2)[:500])
```

> ⚠️ 陣列處理動作的輸出裝載 (payload) 可能非常龐大。列印前務必進行切割 (例如 `[:500]`)。

---

## 步驟 6 — 精確鎖定根本原因

### 運算式錯誤 (例如對 null 執行 `split`)
如果錯誤中提到 `InvalidTemplate` 或某個函式名稱：
1. 在定義中尋找該動作
2. 檢查它讀取哪個上游動作/運算式
3. 檢視該上游動作的輸出，查看是否有 null 或缺少欄位

```python
# 範例：動作使用 split(item()?['Name'], ' ')
# → 來源資料中的 Name 為 null
result = mcp("get_live_flow_run_action_outputs", ..., actionName="Compose_Names")
# 傳回單一元素陣列；索引 [0] 取得動作物件
if not result:
    print("Compose_Names 沒有傳回輸出")
    names = []
else:
    names = result[0].get("outputs", {}).get("body") or []
nulls = [x for x in names if x.get("Name") is None]
print(f"有 {len(nulls)} 筆記錄的 Name 為 null")
```

### 錯誤的欄位路徑
運算式 `triggerBody()?['fieldName']` 傳回 null → `fieldName` 錯誤。
透過下列方式檢查觸發程序的輸出形狀：
```python
mcp("get_live_flow_run_action_outputs", ..., actionName="<觸發程序-動作-名稱>")
```

### 連線 / 驗證失敗
尋找 `ConnectionAuthorizationFailed` — 連線擁有者必須與執行流程的服務帳戶相符。無法透過 API 修正；請在 Power Automate 設計工具中修正。

---

## 步驟 7 — 套用修正

**針對運算式/資料問題**：
```python
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
acts = defn["properties"]["definition"]["actions"]

# 範例：修正對可能為 null 的 Name 進行分割的問題
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

> ⚠️ `update_live_flow` 律會傳回 `error` 鍵。
> 數值為 `null` (Python 為 `None`) 表示成功。

---

## 步驟 8 — 驗證修正

```python
# 重新提交失敗的執行記錄
resubmit = mcp("resubmit_live_flow_run",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID)
print(resubmit)

# 等待約 30 秒後檢查
import time; time.sleep(30)
new_runs = mcp("get_live_flow_runs", environmentName=ENV, flowName=FLOW_ID, top=3)
print(new_runs[0]["status"])   # Succeeded = 完成
```

### 測試 HTTP 觸發的流程

針對具有 `Request` (HTTP) 觸發程序的流程，使用 `trigger_live_flow` 代替 `resubmit_live_flow_run` 來使用自定義裝載進行測試：

```python
# 首先檢視觸發程序的預期格式
schema = mcp("get_live_flow_http_schema",
    environmentName=ENV, flowName=FLOW_ID)
print("預期的本文 Schema：", schema.get("triggerSchema"))
print("回應 Schema：", schema.get("responseSchemas"))

# 使用測試裝載觸發
result = mcp("trigger_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    body={"name": "測試使用者", "value": 42})
print(f"狀態：{result['status']}, 本文：{result.get('body')}")
```

> `trigger_live_flow` 會自動處理 AAD 驗證的觸發程序。僅適用於 `Request` (HTTP) 類型的觸發流程。

---

## 診斷決策樹快速參考

| 徵狀 | 首先呼叫的工具 | 尋找內容 |
|---|---|---|
| 流程顯示為失敗 | `get_live_flow_run_error` | `failedActions[-1]["actionName"]` = 根本原因 |
| 運算式損毀 | 對前一個動作呼叫 `get_live_flow_run_action_outputs` | 輸出本文中的 null / 類型錯誤欄位 |
| 流程從未啟動 | `get_live_flow` | 檢查 `properties.state` = "Started" |
| 動作傳回錯誤資料 | `get_live_flow_run_action_outputs` | 實際輸出本文 vs 預期內容 |
| 已套用修正但仍失敗 | 重新提交後呼叫 `get_live_flow_runs` | 新執行記錄的 `status` 欄位 |

---

## 參考文件

- [common-errors.md](references/common-errors.md) — 錯誤代碼、可能原因及修正方法
- [debug-workflow.md](references/debug-workflow.md) — 針對複雜失敗的完整決策樹

## 相關技能

- `flowstudio-power-automate-mcp` — 核心連線設定與作業參考
- `flowstudio-power-automate-build` — 建構並部署新流程
