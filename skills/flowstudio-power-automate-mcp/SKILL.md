---
name: 'flowstudio-power-automate-mcp'
description: >-
  透過 FlowStudio MCP 連線 Power Automate 的基礎技能 — 驗證設定、
  可重複使用的 MCP 協助程式 (Python + Node.js)、透過 `list_skills` /
  `tool_search` 進行工具探索，以及超大回應處理。當將代理程式連線至
  Power Automate 時，請先載入此技能。針對專門的工作流程，請載入
  `flowstudio-power-automate-build`、`flowstudio-power-automate-debug`、`flowstudio-power-automate-monitoring`
  (Pro+) 或 `flowstudio-power-automate-governance` (Pro+) — 每一項都包含
  工作流程說明，此技能則提供它們共同依賴的底層管道。需要
  FlowStudio MCP 訂閱或相容的伺服器 — 請參閱 https://mcp.flowstudio.app
---

# 透過 FlowStudio MCP 使用 Power Automate — 基礎篇

此技能是**管道層**。它為 AI 代理程式提供了一種可靠的方式來與
FlowStudio MCP 伺服器通訊、探索可用的工具，並清楚地處理
其回應。實際的工作流程說明存在於四個以此技能為基礎的
專門技能中。

> **真實偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題，非流程錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [Null 值導致子流程崩潰](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

> **需求：** [FlowStudio](https://mcp.flowstudio.app) MCP 訂閱（或
> 相容的 Power Automate MCP 伺服器）。您將需要：
> - MCP 端點：`https://mcp.flowstudio.app/mcp`（所有訂閱者皆相同）
> - API 金鑰 / JWT 權杖（`x-api-key` 標頭 — 不是 Bearer）
> - 在 ChatGPT 或 claude.ai 中沒有金鑰：新增 `https://mcp.flowstudio.app/mcp/oauth`
>   作為連接器並使用 Microsoft 登入 — 請參閱
>   [ChatGPT 操作指南](https://learn.flowstudio.app/chatgpt-power-automate)
> - Power Platform 環境名稱（例如 `Default-<tenant-guid>`）

---

## 何時使用哪項技能

技能是依**使用案例意圖**組織的，而不是依它們呼叫的工具。
多個技能會重複使用相同的底層工具 — 請根據使用者想要
達成的目標進行選擇。

| 使用者想要… | 載入此技能 |
|---|---|
| 製作或變更流程（建構新流程、修改現有流程、修復錯誤、部署） | **`flowstudio-power-automate-build`** |
| 診斷流程失敗的原因（針對失敗執行的根本原因分析） | **`flowstudio-power-automate-debug`** |
| 檢視整個租用戶的流程健全狀況、失敗率、資產盤點 | **`flowstudio-power-automate-monitoring`** *(Pro+)* |
| 標記、稽核、分類、評分或淘汰流程 | **`flowstudio-power-automate-governance`** *(Pro+)* |
| 僅連線、設定驗證、編寫協助程式、剖析回應 | 此技能 (基礎篇) |

**相同的工具，不同的視角。** `flowstudio-power-automate-build` 與 `flowstudio-power-automate-debug`
都會呼叫 `update_live_flow`、`get_live_flow` 以及執行錯誤工具 — 它們的差別
在於*方向*（向前 vs 向後）與*意圖*（組合 vs 診斷）。
`flowstudio-power-automate-monitoring` 與 `flowstudio-power-automate-governance` 都會呼叫 Store
工具 — 它們的差別在於*受眾*（維運 vs 合規）與*結果*（讀取
健全狀況 vs 寫入中繼資料）。不要試圖記住「哪些工具屬於哪個
技能」；請依使用者的操作來選擇技能。

---

## 單一真實來源 (Source of Truth)

| 優先順序 | 來源 | 涵蓋範圍 |
|----------|--------|--------|
| 1 | **實際 API 回應** | 永遠相信伺服器實際傳回的內容 |
| 2 | **`tool_search` / `list_skills`** | 具權威性的工具結構描述、參數名稱、類型、必要旗標 |
| 3 | **SKILL 文件與參考檔案** | 工作流程說明、回應形狀、非顯而易見的行為 |

如果文件與實際 API 回應不一致，以 API 為準。此技能（或任何
其他技能）中的工具結構描述可能落後於伺服器 — 在呼叫最近未使用的
工具之前，請呼叫 `tool_search` 以確認目前的形狀。

---

## 代理程式如何探索工具

FlowStudio MCP 伺服器 (v1.1.5+) 公開了兩個**不計費**的 meta 工具，
可讓代理程式僅載入與目前工作相關的工具。請優先使用這些工具，
而非使用 `tools/list`（會一次載入所有 30+ 個結構描述）或猜測
工具名稱。

| Meta 工具 | 何時呼叫 |
|---|---|
| `list_skills` | 冷啟動 — 檢視可用的套件 (`build-flow`, `create-flow`, `debug-flow`, `monitor-flow`, `discover`, `governance`) 並選擇一個 |
| `tool_search` 搭配 `query: "skill:<name>"` | 載入單一套件的完整結構描述集（例如 `skill:debug-flow`） |
| `tool_search` 搭配 `query: "select:tool1,tool2"` | 依名稱載入特定工具（例如跨套件鏈結時） |
| `tool_search` 搭配 `query: "<keywords>"` | 當使用者要求模稜兩可時進行自由文字搜尋（例如 `"cancel run"`） |

伺服器的 `tool_search` 套件特意設計得**比此技能系列更狹窄**
— 它們是每個意圖最可能需要之工具的入門套件。工作流程技能（例如
`flowstudio-power-automate-debug`）可能會提取一個套件，然後隨著工作流程
的推進再次呼叫 `tool_search` 以取得其他工具。

```python
# 冷啟動 — 依意圖選擇套件
skills = mcp("list_skills", {})
# [{"name": "debug-flow", "description": "Investigate why a flow is failing...",
#   "tools": ["get_live_flow_runs", "get_live_flow_run_error", ...]}, ...]

# 載入套件的結構描述
debug_tools = mcp("tool_search", {"query": "skill:debug-flow"})
```

目前常用的套件：

| 套件 | 使用時機 |
|---|---|
| `create-flow` | 建立全新流程；包含環境/連線探索、連接器描述、動態選項與 `update_live_flow` |
| `build-flow` | 讀取或修改現有的流程定義 |
| `debug-flow` | 調查失敗的執行與動作層級的輸入/輸出 |
| `monitor-flow` | 啟動/停止、觸發、取消或重新提交執行 |
| `discover` | 列舉環境、流程與連線 |
| `governance` | Pro+ 快取存放區標記、製作者稽核與中繼資料更新 |

---

## 建議的語言：Python 或 Node.js

此技能系列中的所有範例均使用 **Python 搭配 `urllib.request`**
（標準函式庫 — 不需要 `pip install`）。**Node.js** 也是同樣合適的選擇：
Node 18+ 內建 `fetch`，原生支援 JSON 處理，且 async/await
能俐落地對應到 MCP 工具呼叫的請求-回應模式 — 這使得它
非常適合已經在 JavaScript/TypeScript 技術堆疊中工作的團隊。

| 語言 | 評價 | 備註 |
|---|---|---|
| **Python** | 推薦 | 俐落的 JSON 處理、無逸出字元問題，所有技能範例皆使用它 |
| **Node.js (≥ 18)** | 推薦 | 原生 `fetch` + `JSON.stringify`/`JSON.parse`；無額外套件 |
| PowerShell | 避免用於流程作業 | `ConvertTo-Json -Depth` 會無警示地截斷巢狀定義；引號與逸出字元會破壞複雜的承載資料。適用於快速連線冒煙測試，但不適用於建構或更新流程。 |
| cURL / Bash | 可行但脆弱 | 對巢狀 JSON 進行 Shell 逸出容易出錯；沒有原生 JSON 剖析器 |

> **重點摘要 — 請使用下方的核心 MCP 協助程式 (Python 或 Node.js)。** 兩者都能
> 在單一可重複使用的函式中處理 JSON-RPC 框架、驗證與回應剖析。

---

## 核心 MCP 協助程式 (Python)

在所有後續作業中貫徹使用此協助程式：

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
> - HTTP 401/403 → 權杖遺漏、過期或格式錯誤。從 [mcp.flowstudio.app](https://mcp.flowstudio.app) 取得新的 JWT。
> - HTTP 400 → JSON-RPC 承載資料格式錯誤。檢查 `Content-Type: application/json` 與主體結構。
> - `MCP error: {"code": -32602, ...}` → 工具引數錯誤或遺漏。呼叫帶有 `select:<toolname>` 的 `tool_search` 以確認結構描述。

---

## 核心 MCP 協助程式 (Node.js)

適用於 Node.js 18+ 的同等協助程式（內建 `fetch` — 不需要任何套件）：

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

> 需要 Node.js 18+。對於較舊的 Node，請改用標準函式庫中的 `https.request`
> 或安裝 `node-fetch`。

---

## 驗證連線

確認權杖、端點與協助程式皆正常運作的 3 行冒煙測試：

```python
skills = mcp("list_skills", {})
print(f"Connected — {len(skills)} skill bundles available:",
      [s["name"] for s in skills])
```

預期輸出：

```text
Connected — 6 skill bundles available: ['build-flow', 'create-flow', 'debug-flow', 'monitor-flow', 'discover', 'governance']
```

如果失敗，請參閱上方的**常見驗證錯誤**附註。如果成功，
請移交給符合使用者意圖的工作流程技能。

---

## 處理過大的回應

某些 MCP 工具回應過大，足以溢出代理程式的上下文視窗：

| 工具 | 一般大小 | 原因 |
|---|---|---|
| `describe_live_connector` | 100-600 KB | 連接器的完整 Swagger 規格 |
| `get_live_dynamic_properties` | 50-500 KB | 動態連接器欄位結構描述，例如 SharePoint 清單資料行 |
| `get_live_flow_run_action_outputs`（無 `actionName`） | 50 KB – 數 MB | 頂層動作輸出；若動作位於 foreach 內，可能會傳回每一次重複執行的內容 |
| `get_live_flow`（大型流程） | 50-500 KB | 深度巢狀的分支 |
| `list_live_flows`（大型租用戶） | 50-200 KB | 數百筆流程記錄 |

### 當載具溢出至檔案時

代理程式載具（Claude Code、VS Code Copilot 等）會將過大的回應
儲存至暫存檔（例如 `tool-results/mcp-flowstudio-describe_live_connector-NNNN.txt`），
並傳回路徑而非行內 JSON。該檔案經過**雙重包裝** —
外部的 MCP 外層加上內部經過 JSON 逸出的承載資料：

```text
[{"type":"text","text":"<JSON-escaped payload>"}]
```

進行兩次剖析以取得可用的物件：

```python
import json
with open(path) as f:
    raw = json.loads(f.read())
payload = json.loads(raw[0]["text"])
```

```powershell
$payload = ((Get-Content $path -Raw | ConvertFrom-Json)[0].text) | ConvertFrom-Json
```

### 經驗法則

1. **擷取，不要回顯。** 提取您需要的特定欄位（一個 `operationId`、一個動作的輸出），並在推理前捨棄其餘部分。
2. **務必將 `actionName` 傳遞給 `get_live_flow_run_action_outputs`。** 省略它會擷取所有頂層動作。對於 foreach 內部的動作，傳遞沒有 `iterationIndex` 的 `actionName` 可能會傳回該動作的每次重複執行。
3. **在工作階段內重複使用溢出檔案。** 重新擷取相同的連接器 swagger 會耗費 30 秒以上並產生另一個溢出檔 — 請快取該路徑。
4. **不要直接在溢出檔案中對 JSON 索引鍵執行 grep。** 字串在檔案內經過 JSON 逸出 (`\"OperationId\":`)，因此對 `"OperationId":` 進行純文字 grep 將不會相符。請先剖析，然後篩選。
5. **向使用者摘要工具輸出。** 針對流程清單回顯 `name + state + trigger`，針對執行錯誤回顯 `actionName + status + code` — 除非被要求，否則不要輸出原始 JSON。

```python
# 良好做法 — 深入查看連接器 swagger 中的單一作業
conn = mcp("describe_live_connector", {"environmentName": ENV, "connectorName": "shared_sharepointonline"})
op = conn["properties"]["swagger"]["paths"]["/datasets/{dataset}/tables/{table}/items"]["get"]
print(op["operationId"], "—", op.get("summary"))

# 不良做法 — 將整個 500 KB 的 swagger 保留在上下文中
print(json.dumps(conn, indent=2))   # 請勿這樣做
```

---

## 驗證與連線備註

| 欄位 | 值 |
|---|---|
| 驗證標頭 | `x-api-key: <JWT>` — **非** `Authorization: Bearer` |
| 權杖格式 | 純 JWT — 請勿去除、更改或加入前綴 |
| 逾時時間 | 針對 `get_live_flow_run_action_outputs`（大型輸出）使用 ≥ 120 秒 |
| 環境名稱 | `Default-<tenant-guid>`（透過 `list_live_environments` 或 `list_live_flows` 回應尋找） |

---

## 參考檔案

- [MCP-BOOTSTRAP.md](references/MCP-BOOTSTRAP.md) — 端點、驗證、請求/回應格式（請先閱讀此內容）
- [tool-reference.md](references/tool-reference.md) — 回應形狀與行為注意事項（參數位於 `tool_search` 中）
- [action-types.md](references/action-types.md) — Power Automate 動作類型模式
- [connection-references.md](references/connection-references.md) — 連接器參考手冊
