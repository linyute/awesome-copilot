---
name: flowstudio-power-automate-mcp
description: >-
  透過 FlowStudio MCP 伺服器連接並操作 Power Automate 雲端流程。
  當需要執行以下任務時使用：列出流程、讀取流程定義、檢查執行歷程記錄、檢查
  動作輸出、重新提交執行、取消執行中的流程、檢視連線、取得
  觸發程序 URL、驗證定義、監視流程健康狀況，或任何需要
  透過 MCP 工具與 Power Automate API 溝通的任務。也可用於 Power Platform
  環境探索與連線管理。需要 FlowStudio MCP
  訂閱或相容的伺服器 — 請參閱 https://mcp.flowstudio.app
---

# 透過 FlowStudio MCP 使用 Power Automate

此技能讓 AI 代理程式能夠透過 **FlowStudio MCP 伺服器** 以程式化方式讀取、監視及操作 Microsoft Power Automate
雲端流程 — 無需瀏覽器、無需 UI、無需手動步驟。

> **需求：** [FlowStudio](https://mcp.flowstudio.app) MCP 訂閱 (或
> 相容的 Power Automate MCP 伺服器)。您將需要：
> - MCP 端點：`https://mcp.flowstudio.app/mcp` (所有訂閱者皆相同)
> - API 金鑰 / JWT 權杖 (`x-api-key` 標頭 — **不可** 使用 Bearer)
> - Power Platform 環境名稱 (例如 `Default-<tenant-guid>`)

---

## 真實來源 (Source of Truth)

| 優先順序 | 來源 | 涵蓋範圍 |
|----------|--------|--------|
| 1 | **真實 API 回應** | 始終信任伺服器實際傳回的內容 |
| 2 | **`tools/list`** | 工具名稱、參數名稱、類型、必要旗標 |
| 3 | **SKILL 文件與參考檔案** | 回應格式、行為說明、工作流程方法 |

> **每次新工作階段請從 `tools/list` 開始。**
> 它會傳回每個工具的授權且最新的結構描述 — 參數名稱、
> 類型與必要旗標。SKILL 文件則涵蓋了 `tools/list` 無法告訴您的內容：
> 回應格式、非顯而易見的行為以及端對端的工作流程模式。
>
> 如果任何文件與 `tools/list` 或真實的 API 回應不符，
> 以 API 為準。

---

## 建議語言：Python 或 Node.js

此技能以及配套的建構 / 偵錯技能中的所有範例皆使用 **具備 `urllib.request` 的 Python**
(標準函式庫 — 無需 `pip install`)。**Node.js** 也是同樣理想的選擇：自 Node 18+ 起內建 `fetch`，JSON 處理也是
原生的，且 async/await 模型可乾淨地對應至 MCP 工具呼叫的請求-回應模式 —
這對於已在使用 JavaScript/TypeScript 技術堆疊的團隊來說非常契合。

| 語言 | 評價 | 備註 |
|---|---|---|
| **Python** | ✅ 建議使用 | 乾淨的 JSON 處理，無轉義問題，所有技能範例皆使用它 |
| **Node.js (≥ 18)** | ✅ 建議使用 | 內建 `fetch` + `JSON.stringify`/`JSON.parse`；async/await 非常適合 MCP 呼叫模式；無需額外套件 |
| PowerShell | ⚠️ 避免用於流程操作 | `ConvertTo-Json -Depth` 會在不通知的情況下截斷巢狀定義；引號與轉義會破壞複雜的承載資料。適用於快速的 `tools/list` 探索呼叫，但不適用於建立或更新流程。 |
| cURL / Bash | ⚠️ 可能可行但脆弱 | 對巢狀 JSON 進行 Shell 轉義極易出錯；無原生 JSON 解析器 |

> **簡言之 — 請使用下方的核心 MCP 協助程式 (Python 或 Node.js)。** 兩者皆可在單一可重複使用的函式中處理
> JSON-RPC 框架、驗證與回應解析。

---

## 您可以做什麼

FlowStudio MCP 有兩個存取層級。**FlowStudio for Teams** 訂閱者可同時獲得
快速的 Azure 資料表儲存 (快取的快照資料 + 治理 Metadata) 以及
完整的 Power Automate API 即時存取權限。**僅限 MCP 的訂閱者** 則可獲得即時工具 —
這已足以建立、偵錯與操作流程。

### 即時工具 (Live Tools) — 開放給所有 MCP 訂閱者

| 工具 | 功能 |
|---|---|
| `list_live_flows` | 直接從 PA API 列出環境中的流程 (始終為最新狀態) |
| `list_live_environments` | 列出服務帳戶可見的所有 Power Platform 環境 |
| `list_live_connections` | 從 PA API 列出環境中的所有連線 |
| `get_live_flow` | 擷取完整的流程定義 (觸發程序、動作、參數) |
| `get_live_flow_http_schema` | 檢查 HTTP 觸發流程的 JSON 主體結構描述與回應結構描述 |
| `get_live_flow_trigger_url` | 取得 HTTP 觸發流程目前的已簽署回呼 URL |
| `trigger_live_flow` | 傳送 POST 至 HTTP 觸發流程的回呼 URL (自動處理 AAD 驗證) |
| `update_live_flow` | 在單次呼叫中建立新流程或修補現有的定義 |
| `add_live_flow_to_solution` | 將非解決方案流程遷移至解決方案中 |
| `get_live_flow_runs` | 列出最近的執行歷程記錄，包含狀態、開始/結束時間與錯誤 |
| `get_live_flow_run_error` | 針對失敗的執行取得結構化的錯誤詳細資訊 (各個動作) |
| `get_live_flow_run_action_outputs` | 檢查執行中任何動作 (或每次 foreach 疊代) 的輸入/輸出 |
| `resubmit_live_flow_run` | 使用原始觸發承載資料重新執行失敗或已取消的執行 |
| `cancel_live_flow_run` | 取消目前正在執行的流程執行 |

### 儲存工具 (Store Tools) — 僅限 FlowStudio for Teams 訂閱者

這些工具會從 FlowStudio Azure 資料表讀取 (及寫入) — 這是您租用戶流程的受監視
快照，並豐富了治理 Metadata 與執行統計資料。

| 工具 | 功能 |
|---|---|
| `list_store_flows` | 從快取搜尋流程，包含治理旗標、執行失敗率與擁有者 Metadata |
| `get_store_flow` | 取得單一流程的完整快取詳細資訊，包含執行統計資料與治理欄位 |
| `get_store_flow_trigger_url` | 從快取取得觸發程序 URL (即時，無需呼叫 PA API) |
| `get_store_flow_runs` | 過去 N 天的快取執行歷程記錄，包含持續時間與補救提示 |
| `get_store_flow_errors` | 僅限失敗的快取執行，包含失敗動作名稱與補救提示 |
| `get_store_flow_summary` | 彙總統計資料：成功率、失敗次數、平均/最大持續時間 |
| `set_store_flow_state` | 透過 PA API 啟動或停止流程，並將結果同步回儲存庫 |
| `update_store_flow` | 更新治理 Metadata (描述、標籤、監視旗標、通知規則、商務影響) |
| `list_store_environments` | 從快取列出所有環境 |
| `list_store_makers` | 從快取列出所有製作者 (公民開發者) |
| `get_store_maker` | 取得製作者的流程/應用程式計數與帳戶狀態 |
| `list_store_power_apps` | 從快取列出所有 Power Apps 畫布應用程式 |
| `list_store_connections` | 從快取列出所有 Power Platform 連線 |

---

## 優先呼叫哪個工具層級

| 任務 | 工具 | 備註 |
|---|---|---|
| 列出流程 | `list_live_flows` | 始終為最新 — 直接呼叫 PA API |
| 讀取定義 | `get_live_flow` | 始終即時擷取 — 不快取 |
| 偵錯失敗 | `get_live_flow_runs` → `get_live_flow_run_error` | 使用即時執行資料 |

> ⚠️ **`list_live_flows` 會傳回一個包裝物件**，其中包含 `flows` 陣列 — 請透過 `result["flows"]` 存取。

> 儲存工具 (`list_store_flows`、`get_store_flow` 等) 開放給 **FlowStudio for Teams** 訂閱者，並提供快取的治理 Metadata。如有疑慮請使用即時工具 — 它們適用於所有訂閱層級。

---

## 步驟 0 — 探索可用工具

請務必先呼叫 `tools/list` 以確認伺服器可連線，並查看
確切可用的工具名稱 (名稱可能因伺服器版本而異)：

```python
import json, urllib.request

TOKEN = "<您的_JWT_權杖>"
MCP   = "https://mcp.flowstudio.app/mcp"

def mcp_raw(method, params=None, cid=1):
    payload = {"jsonrpc": "2.0", "method": method, "id": cid}
    if params:
        payload["params"] = params
    req = urllib.request.Request(MCP, data=json.dumps(payload).encode(),
        headers={"x-api-key": TOKEN, "Content-Type": "application/json",
                 "User-Agent": "FlowStudio-MCP/1.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"MCP HTTP {e.code} — 請檢查權杖與端點") from e
    return json.loads(resp.read())

raw = mcp_raw("tools/list")
if "error" in raw:
    print("錯誤：", raw["error"]); raise SystemExit(1)
for t in raw["result"]["tools"]:
    print(t["name"], "—", t["description"][:60])
```

---

## 核心 MCP 協助程式 (Python)

在所有後續作業中使用此協助程式：

```python
import json, urllib.request

TOKEN = "<您的_JWT_權杖>"
MCP   = "https://mcp.flowstudio.app/mcp"

def mcp(tool, args, cid=1):
    payload = {"jsonrpc": "2.0", "method": "tools/call", "id": cid,
               "params": {"name": tool, "arguments": args}}
    req = urllib.request.Request(MCP, data=json.dumps(payload).encode(),
        headers={"x-api-key": TOKEN, "Content-Type": "application/json",
                 "User-Agent": "FlowStudio-MCP/1.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=120)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MCP HTTP {e.code}: {body[:200]}") from e
    raw = json.loads(resp.read())
    if "error" in raw:
        raise RuntimeError(f"MCP 錯誤：{json.dumps(raw['error'])}")
    text = raw["result"]["content"][0]["text"]
    return json.loads(text)
```

> **常見驗證錯誤：**
> - HTTP 401/403 → 權杖缺失、逾期或格式錯誤。請從 [mcp.flowstudio.app](https://mcp.flowstudio.app) 取得新的 JWT。
> - HTTP 400 → JSON-RPC 承載資料格式錯誤。請檢查 `Content-Type: application/json` 與主體結構。
> - `MCP error: {"code": -32602, ...}` → 工具引數錯誤或缺失。

---

## 核心 MCP 協助程式 (Node.js)

適用於 Node.js 18+ 的對等協助程式 (內建 `fetch` — 無需套件)：

```js
const TOKEN = "<您的_JWT_權杖>";
const MCP   = "https://mcp.flowstudio.app/mcp";

async function mcp(tool, args, cid = 1) {
  const payload = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: cid,
    params: { name: tool, arguments: args },
  };
  const res = await fetch(MCP, {
    method: "POST",
    headers: {
      "x-api-key": TOKEN,
      "Content-Type": "application/json",
      "User-Agent": "FlowStudio-MCP/1.0",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MCP HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const raw = await res.json();
  if (raw.error) throw new Error(`MCP 錯誤：${JSON.stringify(raw.error)}`);
  return JSON.parse(raw.result.content[0].text);
}
```

> 需要 Node.js 18+。若使用舊版 Node，請將 `fetch` 替換為標準函式庫的 `https.request`
> 或安裝 `node-fetch`。

---

## 列出流程

```python
ENV = "Default-<tenant-guid>"

result = mcp("list_live_flows", {"environmentName": ENV})
# 傳回包裝物件：
# {"mode": "owner", "flows": [{"id": "0757041a-...", "displayName": "我的流程",
#   "state": "Started", "triggerType": "Request", ...}], "totalCount": 42, "error": null}
for f in result["flows"]:
    FLOW_ID = f["id"]   # 純 UUID — 直接作為 flowName 使用
    print(FLOW_ID, "|", f["displayName"], "|", f["state"])
```

---

## 讀取流程定義

```python
FLOW = "<flow-uuid>"

flow = mcp("get_live_flow", {"environmentName": ENV, "flowName": FLOW})

# 顯示名稱與狀態
print(flow["properties"]["displayName"])
print(flow["properties"]["state"])

# 列出所有動作名稱
actions = flow["properties"]["definition"]["actions"]
print("動作：", list(actions.keys()))

# 檢查一個動作的運算式
print(actions["Compose_Filter"]["inputs"])
```

---

## 檢查執行歷程記錄

```python
# 最近的執行 (最新的在前)
runs = mcp("get_live_flow_runs", {"environmentName": ENV, "flowName": FLOW, "top": 5})
# 傳回直接陣列：
# [{"name": "08584296068667933411438594643CU15",
#   "status": "Failed",
#   "startTime": "2026-02-25T06:13:38.6910688Z",
#   "endTime": "2026-02-25T06:15:24.1995008Z",
#   "triggerName": "manual",
#   "error": {"code": "ActionFailed", "message": "動作失敗..."}},
#  {"name": "08584296028664130474944675379CU26",
#   "status": "Succeeded", "error": null, ...}]

for r in runs:
    print(r["name"], r["status"])

# 取得第一個失敗執行的名稱
run_id = next((r["name"] for r in runs if r["status"] == "Failed"), None)
```

---

## 檢查動作的輸出

```python
run_id = runs[0]["name"]

out = mcp("get_live_flow_run_action_outputs", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id,
    "actionName": "Get_Customer_Record"   # 定義中的精確動作名稱
})
print(json.dumps(out, indent=2))
```

---

## 取得執行的錯誤

```python
err = mcp("get_live_flow_run_error", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
# 傳回：
# {"runName": "08584296068...",
#  "failedActions": [
#    {"actionName": "HTTP_find_AD_User_by_Name", "status": "Failed",
#     "code": "NotSpecified", "startTime": "...", "endTime": "..."},
#    {"actionName": "Scope_prepare_workers", "status": "Failed",
#     "error": {"code": "ActionFailed", "message": "動作失敗..."}}
#  ],
#  "allActions": [
#    {"actionName": "Apply_to_each", "status": "Skipped"},
#    {"actionName": "Compose_WeekEnd", "status": "Succeeded"},
#    ...
#  ]}

# 根源原因通常是 failedActions 中的最後一項：
root = err["failedActions"][-1]
print(f"根源失敗：{root['actionName']} → {root['code']}")
```

---

## 重新提交執行

```python
result = mcp("resubmit_live_flow_run", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
print(result)   # {"resubmitted": true, "triggerName": "..."}
```

---

## 取消執行中的執行

```python
mcp("cancel_live_flow_run", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
```

> ⚠️ **請勿取消狀態顯示為 `Running` 且正在等待自適應卡片回應的執行。**
> 該狀態是正常的 — 流程正暫停等待人員在 Teams 中回應。取消它將會捨棄擱置中的卡片。

---

## 完整來回範例 — 偵錯並修復失敗的流程

```python
# ── 1. 尋找流程 ─────────────────────────────────────────────────────
result = mcp("list_live_flows", {"environmentName": ENV})
target = next(f for f in result["flows"] if "我的流程名稱" in f["displayName"])
FLOW_ID = target["id"]

# ── 2. 取得最近一次失敗的執行 ────────────────────────────────────
runs = mcp("get_live_flow_runs", {"environmentName": ENV, "flowName": FLOW_ID, "top": 5})
# [{"name": "08584296068...", "status": "Failed", ...}, ...]
RUN_ID = next(r["name"] for r in runs if r["status"] == "Failed")

# ── 3. 取得逐動作的失敗分析 ──────────────────────────────────
err = mcp("get_live_flow_run_error", {"environmentName": ENV, "flowName": FLOW_ID, "runName": RUN_ID})
# {"failedActions": [{"actionName": "HTTP_find_AD_User_by_Name", "code": "NotSpecified",...}], ...}
root_action = err["failedActions"][-1]["actionName"]
print(f"根源失敗：{root_action}")

# ── 4. 讀取定義並檢查失敗動作的運算式 ───
defn = mcp("get_live_flow", {"environmentName": ENV, "flowName": FLOW_ID})
acts = defn["properties"]["definition"]["actions"]
print("失敗動作輸入：", acts[root_action]["inputs"])

# ── 5. 檢查前一個動作的輸出來尋找 null ────────────────
out = mcp("get_live_flow_run_action_outputs", {
    "environmentName": ENV, "flowName": FLOW_ID,
    "runName": RUN_ID, "actionName": "Compose_Names"
})
nulls = [x for x in out.get("body", []) if x.get("Name") is None]
print(f"共有 {len(nulls)} 筆記錄的 Name 為 null")

# ── 6. 套用修復 ─────────────────────────────────────────────────────
acts[root_action]["inputs"]["parameters"]["searchName"] = \
    "@coalesce(item()?['Name'], '')"

conn_refs = defn["properties"]["connectionReferences"]
result = mcp("update_live_flow", {
    "environmentName": ENV, "flowName": FLOW_ID,
    "definition": defn["properties"]["definition"],
    "connectionReferences": conn_refs
})
assert result.get("error") is None, f"部署失敗：{result['error']}"
# ⚠️ error 鍵值始終存在 — 僅在它不為 None 時才視為失敗

# ── 7. 重新提交並驗證 ───────────────────────────────────────────────
mcp("resubmit_live_flow_run", {"environmentName": ENV, "flowName": FLOW_ID, "runName": RUN_ID})

import time; time.sleep(30)
new_runs = mcp("get_live_flow_runs", {"environmentName": ENV, "flowName": FLOW_ID, "top": 1})
print(new_runs[0]["status"])   # Succeeded = 完成
```

---

## 驗證與連線備註

| 欄位 | 值 |
|---|---|
| 驗證標頭 | `x-api-key: <JWT>` — **不可** 使用 `Authorization: Bearer` |
| 權杖格式 | 純 JWT — 請勿剝離、變更或加上前綴 |
| 逾時 | 針對 `get_live_flow_run_action_outputs` (大型輸出) 請使用 ≥ 120 秒 |
| 環境名稱 | `Default-<tenant-guid>` (透過 `list_live_environments` 或 `list_live_flows` 回應尋找) |

---

## 參考檔案

- [MCP-BOOTSTRAP.md](references/MCP-BOOTSTRAP.md) — 端點、驗證、請求/回應格式 (請先閱讀此檔案)
- [tool-reference.md](references/tool-reference.md) — 回應格式與行為備註 (參數位於 `tools/list`)
- [action-types.md](references/action-types.md) — Power Automate 動作類型模式
- [connection-references.md](references/connection-references.md) — 連線參考指南

---

## 更多功能

若要端對端 **診斷失敗的流程** → 請載入 `power-automate-debug` 技能。

若要 **建構並部署新流程** → 請載入 `power-automate-build` 技能。
