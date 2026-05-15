---
name: flowstudio-power-automate-mcp
description: >-
  透過 FlowStudio MCP 串接 Power Automate 的基礎技能 — 包含驗證設定、
  可重複使用的 MCP 協助程式 (Python + Node.js)、透過 `list_skills` /
  `tool_search` 進行工具發現，以及超大型回應的處理。將代理程式連接到
  Power Automate 時，請先載入此技能。對於專門的工作流程，請載入
  `flowstudio-power-automate-build`, `flowstudio-power-automate-debug`, `flowstudio-power-automate-monitoring`
  (Pro+), 或 `flowstudio-power-automate-governance` (Pro+) — 每項技能都包含
  工作流程敘述，而此技能則提供它們所依賴的底層串接管道。需要 FlowStudio MCP
  訂閱或相容的伺服器 — 請參閱 https://mcp.flowstudio.app
---

# 透過 FlowStudio MCP 串接 Power Automate — 基礎

此技能是 **底層管道層**。它為 AI 代理程式提供了一種可靠的方式來與 FlowStudio MCP 伺服器進行通訊、發現可用的工具並乾淨地處理回應。實際的工作流程敘述位於四個專門的技能中，它們都是以此技能為基礎建構的。

> **實際偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題，而非流程錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [Null 值導致子流程崩潰](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

> **需求：** 一個 [FlowStudio](https://mcp.flowstudio.app) MCP 訂閱 (或相容的 Power Automate MCP 伺服器)。您將需要：
> - MCP 端點：`https://mcp.flowstudio.app/mcp` (所有訂閱者皆相同)
> - API 金鑰 / JWT 權杖 (`x-api-key` 標頭 — **非** Bearer)
> - Power Platform 環境名稱 (例如 `Default-<租用戶-guid>`)

---

## 何時使用哪項技能

技能是依據 **使用案例意圖** 組織的，而不是根據它們呼叫哪些工具。多項技能會重複使用相同的底層工具 — 請根據使用者想要完成的任務來選擇。

| 使用者想要… | 載入此技能 |
|---|---|
| 建立或變更流程 (建構新流程、修改現有流程、修復錯誤、部署) | **`flowstudio-power-automate-build`** |
| 診斷流程失敗的原因 (對失敗執行進行根本原因分析) | **`flowstudio-power-automate-debug`** |
| 查看租用戶範圍的流程健康狀況、失敗率、資產盤點 | **`flowstudio-power-automate-monitoring`** *(Pro+)* |
| 標記、稽核、分類、評分或停用流程 | **`flowstudio-power-automate-governance`** *(Pro+)* |
| 僅進行連接、設定驗證、編寫協助程式、解析回應 | 本技能 (基礎) |

**相同的工具，不同的視角。** `flowstudio-power-automate-build` 和 `flowstudio-power-automate-debug` 都會呼叫 `update_live_flow`、`get_live_flow` 和執行錯誤工具 — 它們的區別在於 *方向* (正向 vs 逆向) 和 *意圖* (撰寫 vs 診斷)。`flowstudio-power-automate-monitoring` 和 `flowstudio-power-automate-governance` 都會呼叫 Store 工具 — 它們的區別在於 *受眾* (營運 vs 合規) 和 *結果* (讀取健康狀況 vs 寫入 Metadata)。請不要試圖記住「哪些工具屬於哪項技能」，請根據使用者的操作來選擇技能。

---

## 資訊來源 (Source of Truth)

| 優先順序 | 來源 | 涵蓋範圍 |
|----------|--------|--------|
| 1 | **實際的 API 回應** | 始終相信伺服器實際傳回的內容 |
| 2 | **`tool_search` / `list_skills`** | 具權威性的工具結構描述、參數名稱、類型、必填旗標 |
| 3 | **SKILL 文件與參考檔案** | 工作流程敘述、回應形狀、非顯著行為 |

如果文件與實際的 API 回應不符，以 API 為準。此技能 (或任何其他技能) 中的工具結構描述可能落後於伺服器 — 在調用最近未使用的工具之前，請呼叫 `tool_search` 以確認目前的形狀。

---

## 代理程式如何發現工具

FlowStudio MCP 伺服器 (v1.1.5+) 公開了兩個 **不計費** 的中繼工具，讓代理程式僅載入與目前工作相關的工具。建議優先使用這些工具，而不是 `tools/list` (會一次載入所有 30 多個結構描述) 或猜測工具名稱。

| 中繼工具 | 何時呼叫 |
|---|---|
| `list_skills` | 冷啟動 — 查看可用的組合包 (`build-flow`, `create-flow`, `debug-flow`, `monitor-flow`, `discover`, `governance`) 並選取一個 |
| 搭配 `query: "skill:<名稱>"` 使用 `tool_search` | 載入單個組合包的完整結構描述集 (例如 `skill:debug-flow`) |
| 搭配 `query: "select:tool1,tool2"` 使用 `tool_search` | 按名稱載入特定的工具 (例如在跨組合包鏈結時) |
| 搭配 `query: "<關鍵字>"` 使用 `tool_search` | 當使用者要求模糊時進行全文搜尋 (例如 `"cancel run"`) |

伺服器的 `tool_search` 組合包有意設計得比此技能系列 **更窄** — 它們是根據意圖最可能需要的工具入門包。工作流程技能 (例如 `flowstudio-power-automate-debug`) 可能會拉取一個組合包，然後隨著工作流程的進展再次呼叫 `tool_search` 以獲取其他工具。

```python
# 冷啟動 — 依意圖選取組合包
skills = mcp("list_skills", {})
# [{"name": "debug-flow", "description": "調查流程失敗的原因...",
#   "tools": ["get_live_flow_runs", "get_live_flow_run_error", ...]}, ...]

# 載入組合包的結構描述
debug_tools = mcp("tool_search", {"query": "skill:debug-flow"})
```

目前常見的組合包：

| 組合包 | 何時使用 |
|---|---|
| `create-flow` | 建立全新流程；包含環境/連線發現、連接器說明、動態選項以及 `update_live_flow` |
| `build-flow` | 讀取或修改現有的流程定義 |
| `debug-flow` | 調查失敗的執行以及動作層級的輸入/輸出 |
| `monitor-flow` | 啟動/停止、觸發、取消或重新提交執行 |
| `discover` | 列舉環境、流程和連線 |
| `governance` | Pro+ 快取存放庫標記、製作者稽核和 Metadata 更新 |

---

## 建議語言：Python 或 Node.js

此技能系列中的所有範例都使用 **具有 `urllib.request` 的 Python** (標準函式庫 — 無需 `pip install`)。**Node.js** 也是同樣有效的選擇：從 Node 18+ 開始內建 `fetch`，JSON 處理是原生的，且 async/await 能乾淨地對應到 MCP 工具呼叫的要求-回應模式 — 這使其非常適合已經在使用 JavaScript/TypeScript 技術堆疊的團隊。

| 語言 | 評價 | 備註 |
|---|---|---|
| **Python** | 推薦 | 乾淨的 JSON 處理，無逸出問題，所有技能範例皆使用它 |
| **Node.js (≥ 18)** | 推薦 | 原生 `fetch` + `JSON.stringify`/`JSON.parse`；無需額外套件 |
| PowerShell | 避免用於流程操作 | `ConvertTo-Json -Depth` 會默默截斷巢狀定義；引號和逸出會破壞複雜的承載資料。可用於快速的連線煙霧測試，但不適用於建構或更新流程。 |
| cURL / Bash | 可能可行但脆弱 | 對巢狀 JSON 進行 Shell 逸出容易出錯；沒有原生的 JSON 解析器 |

> **太長不看版 — 請使用下方的核心 MCP 協助程式 (Python 或 Node.js)。** 兩者都能在單個可重複使用的函式中處理 JSON-RPC 框架、驗證和回應解析。

---

## 核心 MCP 協助程式 (Python)

在所有後續操作中使用此協助程式：

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
        raise RuntimeError(f"MCP error: {json.dumps(raw['error'])}")
    text = raw["result"]["content"][0]["text"]
    return json.loads(text)
```

> **常見驗證錯誤：**
> - HTTP 401/403 → 權杖缺失、已過期或格式錯誤。請從 [mcp.flowstudio.app](https://mcp.flowstudio.app) 獲取新的 JWT。
> - HTTP 400 → JSON-RPC 承載資料格式錯誤。請檢查 `Content-Type: application/json` 和主體結構。
> - `MCP 錯誤: {"code": -32602, ...}` → 工具引數錯誤或缺失。請配合使用 `select:<工具名稱>` 呼叫 `tool_search` 以確認結構描述。

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
  if (raw.error) throw new Error(`MCP error: ${JSON.stringify(raw.error)}`);
  return JSON.parse(raw.result.content[0].text);
}
```

> 需要 Node.js 18+。對於舊版 Node，請將 `fetch` 替換為標準函式庫中的 `https.request` 或安裝 `node-fetch`。

---

## 驗證連線

一個 3 行的煙霧測試，可確認權杖、端點和協助程式皆可正常運作：

```python
skills = mcp("list_skills", {})
print(f"已連線 — 提供 {len(skills)} 個技能組合包：",
      [s["name"] for s in skills])
```

預期輸出：

```text
已連線 — 提供 6 個技能組合包：['build-flow', 'create-flow', 'debug-flow', 'monitor-flow', 'discover', 'governance']
```

如果失敗，請參閱上方的 **常見驗證錯誤** 備註。如果成功，請移交至與使用者意圖相符的工作流程技能。

---

## 處理超大型回應

某些 MCP 工具的回應大到足以溢出代理程式的內容視窗：

| 工具 | 典型大小 | 原因 |
|---|---|---|
| `describe_live_connector` | 100-600 KB | 連接器的完整 Swagger 規範 |
| `get_live_dynamic_properties` | 50-500 KB | 動態連接器欄位結構描述，例如 SharePoint 清單資料列 |
| `get_live_flow_run_action_outputs` (無 `actionName`) | 50 KB – 數 MB | 頂層動作輸出；對於 foreach 中的動作，可能會傳回每次重複 |
| `get_live_flow` (大型流程) | 50-500 KB | 深層巢狀的分支 |
| `list_live_flows` (大型租用戶) | 50-200 KB | 數百筆流程記錄 |

### 當導向裝置溢出至檔案時

代理程式導向裝置 (Claude Code, VS Code Copilot 等) 會將超大型回應儲存到暫存檔 (例如 `tool-results/mcp-flowstudio-describe_live_connector-NNNN.txt`) 並傳回路徑，而不是行內 JSON。該檔案是 **雙層包裝** 的 — 外部是 MCP 信封，內部是 JSON 逸出的承載資料：

```text
[{"type":"text","text":"<JSON 逸出的承載資料>"}]
```

需要兩次解析才能獲得可用的物件：

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

1. **擷取，不要回顯 (echo)。** 僅拉取您需要的特定欄位 (一個 `operationId`, 一個動作的輸出) 並在進行推理之前捨棄其餘部分。
2. **務必將 `actionName` 傳遞給 `get_live_flow_run_action_outputs`。** 省略它會獲取所有頂層動作。對於 foreach 內部的動作，傳遞 `actionName` 而不帶 `iterationIndex` 可能會傳回該動作的每次重複。
3. **在同一對話中重複使用溢出檔案。** 重新獲取同一個連接器 swagger 會耗費 30 多秒並產生另一個溢出檔 — 請快取路徑。
4. **不要直接在溢出檔案中 grep JSON 鍵。** 檔案內部的字串是 JSON 逸出的 (`\"OperationId\":`)，因此直接 grep `"OperationId":` 將無法匹配。請先解析，再篩選。
5. **向使用者摘要工具輸出。** 對於流程清單回顯 `名稱 + 狀態 + 觸發器`，對於執行錯誤回顯 `動作名稱 + 狀態 + 代碼` — 而非原始 JSON，除非被要求。

```python
# 正確的做法 — 在連接器 swagger 中深入查看一個操作
conn = mcp("describe_live_connector", {"environmentName": ENV, "connectorName": "shared_sharepointonline"})
op = conn["properties"]["swagger"]["paths"]["/datasets/{dataset}/tables/{table}/items"]["get"]
print(op["operationId"], "—", op.get("summary"))

# 錯誤的做法 — 將整個 500 KB 的 swagger 保留在內容中
print(json.dumps(conn, indent=2))   # 請勿這樣做
```

---

## 驗證與連線備註

| 欄位 | 值 |
|---|---|
| 驗證標頭 | `x-api-key: <JWT>` — **非** `Authorization: Bearer` |
| 權杖格式 | 純 JWT — 不要剝離、修改或加上前綴 |
| 逾時 | 對於 `get_live_flow_run_action_outputs` (大型輸出) 使用 ≥ 120 秒 |
| 環境名稱 | `Default-<租用戶-guid>` (可透過 `list_live_environments` 或 `list_live_flows` 回應找到) |

---

## 參考檔案

- [MCP-BOOTSTRAP.md](references/MCP-BOOTSTRAP.md) — 端點、驗證、要求/回應格式 (請先閱讀此檔案)
- [tool-reference.md](references/tool-reference.md) — 回應形狀和行為備註 (參數位於 `tool_search` 中)
- [action-types.md](references/action-types.md) — Power Automate 動作類型模式
- [connection-references.md](references/connection-references.md) — 連接器參考指南
