---
name: flowstudio-power-automate-mcp
description: >-
  賦予您的 AI 代理程式與您在 Power Automate 入口網站中相同的檢視能力 — 甚至更多。Graph API 僅回傳頂層執行狀態。Flow Studio MCP 會公開動作層級的輸入、輸出、迴圈迭代以及巢狀子流程失敗資訊。
  在被要求執行以下操作時載入此技能：列出流程、讀取流程定義、檢查執行歷程記錄、檢查動作輸出、重新提交執行記錄、取消執行中的流程、檢視連接、取得觸發程序 URL、驗證定義、監控流程健康狀況，或任何需要透過 MCP 工具與 Power Automate API 通訊的任務。同時也可用於 Power Platform 環境探索與連接管理。需要 FlowStudio MCP 訂閱或相容伺服器 — 請參閱 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 透過 FlowStudio MCP 使用 Power Automate

此技能讓 AI 代理程式能透過 **FlowStudio MCP 伺服器**以程式方式讀取、監控與操作 Microsoft Power Automate 雲端流程 — 無需瀏覽器、無需 UI、無需手動步驟。

> **實際偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題而非流程 Bug](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [Null 值導致子流程當機](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

> **需求：** [FlowStudio](https://mcp.flowstudio.app) MCP 訂閱（或相容的 Power Automate MCP 伺服器）。您將需要：
> - MCP 端點：`https://mcp.flowstudio.app/mcp` (所有訂閱者皆同)
> - API 金鑰 / JWT 權杖 (`x-api-key` 標頭 — 非 Bearer)
> - Power Platform 環境名稱 (例如 `Default-<tenant-guid>`)

---

## 真理來源 (Source of Truth)

| 優先順序 | 來源 | 涵蓋內容 |
|----------|--------|--------|
| 1 | **實際 API 回應** | 一律信任伺服器實際回傳的內容 |
| 2 | **`tools/list`** | 工具名稱、參數名稱、型別、必要旗標 |
| 3 | **技能文件與參考檔案** | 回應形狀、行為備註、工作流程食譜 |

> **每次新的工作階段都請先呼叫 `tools/list`。**
> 它回傳每個工具的權威且最新結構描述 — 參數名稱、型別與必要旗標。技能文件涵蓋了 `tools/list` 無法告訴您的內容：回應形狀、非明顯的行為以及端對端工作流程模式。
>
> 如果任何文件與 `tools/list` 或實際的 API 回應有衝突，請以 API 為準。

---

## 建議語言：Python 或 Node.js

此技能與隨附的建構/偵錯技能中的所有範例皆使用 **Python 搭配 `urllib.request`** (標準程式庫 — 無需 `pip install`)。**Node.js** 是同樣有效的選擇：Node 18+ 內建 `fetch`、原生 JSON 處理，且 async/await 模型可乾淨地對應至 MCP 工具呼叫的請求-回應模式 — 使其成為已經在 JavaScript/TypeScript 技術堆疊中工作的團隊的自然選擇。

| 語言 | 評價 | 備註 |
|---|---|---|
| **Python** | ✅ 建議 | 清晰的 JSON 處理，無跳脫問題，所有技能範例皆使用此語言 |
| **Node.js (≥ 18)** | ✅ 建議 | 原生 `fetch` + `JSON.stringify`/`JSON.parse`；async/await 適合 MCP 呼叫模式；無需額外套件 |
| PowerShell | ⚠️ 流程操作應避免 | `ConvertTo-Json -Depth` 會靜默截斷巢狀定義；引號與跳脫會損壞複雜負載。適合快速的 `tools/list` 探索呼叫，但不適合建構或更新流程。 |
| cURL / Bash | ⚠️ 可行但脆弱 |巢狀 JSON 的 Shell 跳脫容易出錯；沒有原生 JSON 解析器 |

> **總結 — 請使用下方的核心 MCP 輔助程式 (Python 或 Node.js)。** 兩者皆能在單一可重複使用的函式中處理 JSON-RPC 框架、驗證與回應解析。

---

## 您能做什麼

FlowStudio MCP 具有兩個存取層級。**FlowStudio for Teams** 訂閱者可獲得快速的 Azure 資料表儲存區（快照資料 + 治理中繼資料）與完整的即時 Power Automate API 存取權。**僅限 MCP 的訂閱者** 可獲得即時工具 — 這些工具足以建構、偵錯與操作流程。

### 即時工具 — 所有 MCP 訂閱者皆可用

| 工具 | 用途 |
|---|---|
| `list_live_flows` | 直接從 PA API 列出環境中的流程 (一律為最新) |
| `list_live_environments` | 列出服務帳戶可見的所有 Power Platform 環境 |
| `list_live_connections` | 從 PA API 列出環境中的所有連接 |
| `get_live_flow` | 擷取完整流程定義 (觸發程序、動作、參數) |
| `get_live_flow_http_schema` | 檢查 HTTP 觸發流程的 JSON 本文結構描述與回應結構描述 |
| `get_live_flow_trigger_url` | 取得 HTTP 觸發流程當前的簽名回呼 URL |
| `trigger_live_flow` | POST 至 HTTP 觸發流程的回呼 URL (自動處理 AAD 驗證) |
| `update_live_flow` | 在單次呼叫中建立新流程或修補現有定義 |
| `add_live_flow_to_solution` | 將非解決方案流程遷移至解決方案中 |
| `get_live_flow_runs` | 列出最近的執行歷程記錄，包含狀態、開始/結束時間與錯誤 |
| `get_live_flow_run_error` | 取得失敗執行的結構化錯誤詳細資料 (依動作) |
| `get_live_flow_run_action_outputs` | 檢查執行記錄中任何動作（或每個 Foreach 迭代）的輸入/輸出 |
| `resubmit_live_flow_run` | 使用原始觸發負載重新執行失敗或取消的流程 |
| `cancel_live_flow_run` | 取消當前正在執行的流程執行 |

### 儲存區工具 — 僅限 FlowStudio for Teams 訂閱者

這些工具從 Flow Studio Azure 資料表進行讀取 (與寫入) — 這是一個受監控的租用戶流程快照，並豐富了治理中繼資料與執行統計資料。

| 工具 | 用途 |
|---|---|
| `list_store_flows` | 從快取搜尋具有治理旗標、執行失敗率與擁有者中繼資料的流程 |
| `get_store_flow` | 取得單一流程的完整快取詳細資料，包含執行統計與治理欄位 |
| `get_store_flow_trigger_url` | 從快取取得觸發程序 URL (即時，無需 PA API 呼叫) |
| `get_store_flow_runs` | 包含持續時間與修復建議的快取執行歷程記錄 (過去 N 天) |
| `get_store_flow_errors` | 僅包含失敗的執行記錄，附帶動作名稱與修復建議 |
| `get_store_flow_summary` | 彙總統計資料：成功率、失敗次數、平均/最大持續時間 |
| `set_store_flow_state` | 透過 PA API 啟動或停止流程，並將結果同步回儲存區 |
| `update_store_flow` | 更新治理中繼資料 (說明、標籤、監控旗標、通知規則、業務影響) |
| `list_store_environments` | 從快取列出所有環境 |
| `list_store_makers` | 從快取列出所有建立者 (公民開發者) |
| `get_store_maker` | 從快取取得建立者的流程/應用程式計數與帳戶狀態 |
| `list_store_power_apps` | 從快取列出所有 Power Apps 畫布應用程式 |
| `list_store_connections` | 從快取列出所有 Power Platform 連接 |

---

## 該優先呼叫哪種工具

| 任務 | 工具 | 備註 |
|---|---|---|
| 列出流程 | `list_live_flows` | 一律為最新 — 直接呼叫 PA API |
| 讀取定義 | `get_live_flow` | 一律即時擷取 — 非快取 |
| 偵錯失敗 | `get_live_flow_runs` → `get_live_flow_run_error` | 使用即時執行資料 |

> ⚠️ **`list_live_flows` 回傳封裝物件**，包含 `flows` 陣列 — 透過 `result["flows"]` 存取。

> 儲存區工具 (`list_store_flows`, `get_store_flow` 等) 僅提供給 **FlowStudio for Teams** 訂閱者，並提供快取的治理中繼資料。若有疑問，請使用即時工具 — 它們適用於所有訂閱層級。

---

## 步驟 0 — 探索可用工具

請務必先呼叫 `tools/list` 以確認伺服器可存取，並查看確切哪些工具名稱可用 (名稱可能因伺服器版本而異)：

```python
import json, urllib.request

TOKEN = "<YOUR_JWT_TOKEN>"
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
    print("ERROR:", raw["error"]); raise SystemExit(1)
for t in raw["result"]["tools"]:
    print(t["name"], "—", t["description"][:60])
```

---

## 核心 MCP 輔助程式 (Python)

在所有後續操作中使用此輔助程式：

```python
import json, urllib.request

TOKEN = "<YOUR_JWT_TOKEN>"
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
        raise RuntimeError(f"MCP error: {json.dumps(raw['error'])}")
    text = raw["result"]["content"][0]["text"]
    return json.loads(text)
```

> **常見驗證錯誤：**
> - HTTP 401/403 → 權杖遺失、過期或格式錯誤。請從 [mcp.flowstudio.app](https://mcp.flowstudio.app) 取得新的 JWT。
> - HTTP 400 → JSON-RPC 負載格式錯誤。檢查 `Content-Type: application/json` 和本文結構。
> - `MCP error: {"code": -32602, ...}` → 工具引數錯誤或遺失。

---

## 核心 MCP 輔助程式 (Node.js)

Node.js 18+ 的對等輔助程式 (內建 `fetch` — 無需安裝套件)：

```js
const TOKEN = "<YOUR_JWT_TOKEN>";
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
  if (raw.error) throw new Error(`MCP error: ${JSON.stringify(raw.error)}`);
  return JSON.parse(raw.result.content[0].text);
}
```

> 需要 Node.js 18+。若為較舊版本的 Node，請使用標準程式庫中的 `https.request` 或安裝 `node-fetch`。

---

## 列出流程

```python
ENV = "Default-<tenant-guid>"

result = mcp("list_live_flows", {"environmentName": ENV})
# 回傳封裝物件：
# {"mode": "owner", "flows": [{"id": "0757041a-...", "displayName": "My Flow",
#   "state": "Started", "triggerType": "Request", ...}], "totalCount": 42, "error": null}
for f in result["flows"]:
    FLOW_ID = f["id"]   # 純 UUID — 直接當作 flowName 使用
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
print("Actions:", list(actions.keys()))

# 檢查其中一個動作的運算式
print(actions["Compose_Filter"]["inputs"])
```

---

## 檢查執行歷程記錄

```python
# 最近的執行記錄 (最新的在前)
runs = mcp("get_live_flow_runs", {"environmentName": ENV, "flowName": FLOW, "top": 5})
# 回傳陣列：
# [{"name": "08584296068667933411438594643CU15",
#   "status": "Failed",
#   "startTime": "2026-02-25T06:13:38Z",
#   "endTime": "2026-02-25T06:14:02Z",
#   "triggerName": "Recurrence",
#   "error": null}]

for r in runs:
    print(r["name"], r["status"])

# 取得第一個失敗執行記錄的名稱
run_id = next((r["name"] for r in runs if r["status"] == "Failed"), None)
```

---

## 檢查動作輸出

```python
run_id = runs[0]["name"]

out = mcp("get_live_flow_run_action_outputs", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id,
    "actionName": "Get_Customer_Record"   # 來自定義的確切動作名稱
})
print(json.dumps(out, indent=2))
```

---

## 取得執行記錄的錯誤

```python
err = mcp("get_live_flow_run_error", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
# 回傳：
# {"runName": "08584296068...",
#  "failedActions": [
#    {"actionName": "HTTP_find_AD_User_by_Name", "status": "Failed",
#     "code": "NotSpecified", "startTime": "...", "endTime": "..."},
#    {"actionName": "Scope_prepare_workers", "status": "Failed",
#     "error": {"code": "ActionFailed", "message": "An action failed..."}}
#  ],
#  "allActions": [
#    {"actionName": "Apply_to_each", "status": "Skipped"},
#    {"actionName": "Compose_WeekEnd", "status": "Succeeded"},
#    ...
#  ]}

# 根本原因通常是 failedActions 中最深層的項目：
root = err["failedActions"][-1]
print(f"Root failure: {root['actionName']} → {root['code']}")
```

---

## 重新提交執行記錄

```python
result = mcp("resubmit_live_flow_run", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
print(result)   # {"resubmitted": true, "triggerName": "..."}
```

---

## 取消執行中的流程

```python
mcp("cancel_live_flow_run", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
```

> ⚠️ **請勿取消顯示為 `Running` 的執行記錄，因為它正在等待調適型卡片回應。** 此狀態為正常 — 流程已暫停並等待人類在 Teams 中回應。取消它將導致遺失待處理的卡片。

---

## 完整來回範例 — 偵錯並修復失敗流程

```python
# ── 1. 找到流程 ─────────────────────────────────────────────────────
result = mcp("list_live_flows", {"environmentName": ENV})
target = next(f for f in result["flows"] if "My Flow Name" in f["displayName"])
FLOW_ID = target["id"]

# ── 2. 取得最近一次失敗的執行記錄 ────────────────────────────────────
runs = mcp("get_live_flow_runs", {"environmentName": ENV, "flowName": FLOW_ID, "top": 5})
# [{"name": "08584296068...", "status": "Failed", ...}, ...]
RUN_ID = next(r["name"] for r in runs if r["status"] == "Failed")

# ── 3. 取得每個動作的失敗明細 ──────────────────────────────────
err = mcp("get_live_flow_run_error", {"environmentName": ENV, "flowName": FLOW_ID, "runName": RUN_ID})
# {"failedActions": [{"actionName": "HTTP_find_AD_User_by_Name", "code": "NotSpecified",...}], ...}
root_action = err["failedActions"][-1]["actionName"]
print(f"Root failure: {root_action}")

# ── 4. 讀取定義並檢查失敗動作的運算式 ───
defn = mcp("get_live_flow", {"environmentName": ENV, "flowName": FLOW_ID})
acts = defn["properties"]["definition"]["actions"]
print("Failing action inputs:", acts[root_action]["inputs"])

# ── 5. 檢查上一個動作的輸出以找出 null ────────────────
out = mcp("get_live_flow_run_action_outputs", {
    "environmentName": ENV, "flowName": FLOW_ID,
    "runName": RUN_ID, "actionName": "Compose_Names"
})
nulls = [x for x in out.get("body", []) if x.get("Name") is None]
print(f"{len(nulls)} records with null Name")

# ── 6. 套用修復 ─────────────────────────────────────────────────────
acts[root_action]["inputs"]["parameters"]["searchName"] = \
    "@coalesce(item()?['Name'], '')"

conn_refs = defn["properties"]["connectionReferences"]
result = mcp("update_live_flow", {
    "environmentName": ENV, "flowName": FLOW_ID,
    "definition": defn["properties"]["definition"],
    "connectionReferences": conn_refs
})
assert result.get("error") is None, f"Deploy failed: {result['error']}"
# ⚠️ error 鍵一律存在 — 僅在非 None 時失敗

# ── 7. 重新提交並驗證 ───────────────────────────────────────────────
mcp("resubmit_live_flow_run", {"environmentName": ENV, "flowName": FLOW_ID, "runName": RUN_ID})

import time; time.sleep(30)
new_runs = mcp("get_live_flow_runs", {"environmentName": ENV, "flowName": FLOW_ID, "top": 1})
print(new_runs[0]["status"])   # Succeeded = 完成
```

---

## 驗證與連接備註

| 欄位 | 數值 |
|---|---|
| 驗證標頭 | `x-api-key: <JWT>` — **非** `Authorization: Bearer` |
| 權杖格式 | 純 JWT — 請勿剝離、變更或新增前綴 |
| 逾時設定 | 對於 `get_live_flow_run_action_outputs` (大型輸出)，請使用 ≥ 120 秒 |
| 環境名稱 | `Default-<tenant-guid>` (透過 `list_live_environments` 或 `list_live_flows` 回應找到) |

---

## 參考檔案

- [MCP-BOOTSTRAP.md](references/MCP-BOOTSTRAP.md) — 端點、驗證、請求/回應格式 (請先閱讀)
- [tool-reference.md](references/tool-reference.md) — 回應形狀與行為備註 (參數在 `tools/list` 中)
- [action-types.md](references/action-types.md) — Power Automate 動作型別模式
- [connection-references.md](references/connection-references.md) — 連接器參考指南

---

## 更多能力

若要 **對失敗的流程進行端到端診斷** → 請載入 `flowstudio-power-automate-debug` 技能。

若要 **建構與部署新流程** → 請載入 `flowstudio-power-automate-build` 技能。
