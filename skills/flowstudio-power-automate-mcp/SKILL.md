---
name: flowstudio-power-automate-mcp
description: >-
  透過 FlowStudio MCP 串接 Power Automate 的基礎技能 — 包含驗證設定、
  可重複使用的 MCP 輔助程式 (Python + Node.js)、透過 `list_skills` /
  `tool_search` 進行工具探索，以及超大回應處理。
  在將代理程式連接到 Power Automate 時，請先載入此技能。
  對於特定的工作流程，請載入 `power-automate-build`、`power-automate-debug`、
  `power-automate-monitoring` (Pro+) 或 `power-automate-governance` (Pro+) — 
  每一項都包含工作流程敘述，而此技能提供它們賴以生存的管線。
  需要 FlowStudio MCP 訂閱或相容的伺服器 — 詳見 https://mcp.flowstudio.app
metadata:
  openclaw:
    requires:
      env:
        - FLOWSTUDIO_MCP_TOKEN
    primaryEnv: FLOWSTUDIO_MCP_TOKEN
    homepage: https://mcp.flowstudio.app
---

# 透過 FlowStudio MCP 串接 Power Automate — 基礎

此技能是**底層管線層**。它為 AI 代理程式提供了一種可靠的方式，來與 FlowStudio MCP 伺服器通訊、探索可用工具並乾淨地處理回應。實際的工作流程敘述存在於四個以此技能為基礎的特化技能中。

> **真實偵錯範例**：[子流程中的運算式錯誤](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/fix-expression-error.md) |
> [資料輸入問題，而非流程臭蟲](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/data-not-flow.md) |
> [空值 (Null) 導致子流程崩潰](https://github.com/ninihen1/power-automate-mcp-skills/blob/main/examples/null-child-flow.md)

> **需求：** 需有 [FlowStudio](https://mcp.flowstudio.app) MCP 訂閱 (或相容的 Power Automate MCP 伺服器)。您將需要：
> - MCP 端點：`https://mcp.flowstudio.app/mcp` (所有訂閱者皆同)
> - API 金鑰 / JWT 權杖 (`x-api-key` 標頭 — **非** Bearer)
> - Power Platform 環境名稱 (例如 `Default-<租用戶 GUID>`)

---

## 何時使用哪項技能

技能是按**使用案例意圖**組織的，而非按其呼叫的工具。多項技能會重複使用相同的底層工具 — 請根據使用者嘗試完成的目標來選擇。

| 使用者想要... | 載入此技能 |
|---|---|
| 建立或變更流程 (建置新流程、修改現有流程、修復臭蟲、部署) | **`power-automate-build`** |
| 診斷流程失敗的原因 (針對失敗的執行記錄進行根本原因分析) | **`power-automate-debug`** |
| 查看租用戶範圍內的流程健全狀況、失敗率、資產清單 | **`power-automate-monitoring`** *(Pro+)* |
| 標記、稽核、分類、評分或移除流程 | **`power-automate-governance`** *(Pro+)* |
| 僅進行連接、設定驗證、編寫輔助程式、解析回應 | 此技能 (基礎) |

**相同的工具，不同的視角。** `power-automate-build` 與 `power-automate-debug` 都會呼叫 `update_live_flow`、`get_live_flow` 和執行錯誤工具 — 它們的區別在於「方向」(正向與逆向) 及「意圖」(建構與診斷)。`power-automate-monitoring` 與 `power-automate-governance` 都會呼叫儲存庫 (Store) 工具 — 它們的區別在於「受眾」(維運與合規) 及「結果」(讀取健全狀況與寫入 Metadata)。不要嘗試死記硬背「哪些工具屬於哪項技能」；請根據使用者的操作來選擇技能。

---

## 事實來源

| 優先順序 | 來源 | 涵蓋內容 |
|----------|--------|--------|
| 1 | **實際的 API 回應** | 始終相信伺服器實際傳回的內容 |
| 2 | **`tool_search` / `list_skills`** | 具權威性的工具結構描述、參數名稱、類型、必填旗標 |
| 3 | **SKILL 文件與參考檔案** | 工作流程敘述、回應格式、非顯而易見的行為 |

如果文件與實際的 API 回應不符，以 API 為準。此技能 (或任何其他技能) 中的工具結構描述可能落後於伺服器 — 在呼叫最近未使用的工具前，請先呼叫 `tool_search` 以確認目前的格式。

---

## 代理程式如何探索工具

FlowStudio MCP 伺服器 (v1.1.5+) 公開了兩個**非計費**的中繼工具，讓代理程式僅載入與目前任務相關的工具。請優先使用這些工具，而非 `tools/list` (會一次載入所有 30+ 個結構描述) 或盲目猜測工具名稱。

| 中繼工具 | 何時呼叫 |
|---|---|
| `list_skills` | 冷啟動 — 查看可用的組合 (`build-flow`, `debug-flow`, `monitor-flow`, `discover`, `governance`) 並選取一個 |
| `tool_search` 並設定 `query: "skill:<名稱>"` | 載入單一組合的完整結構描述集 (例如 `skill:debug-flow`) |
| `tool_search` 並設定 `query: "select:tool1,tool2"` | 按名稱載入特定工具 (例如跨組合串接時) |
| `tool_search` 並設定 `query: "<關鍵字>"` | 使用者要求模糊時進行全文檢索 (例如 `"cancel run"`) |

伺服器的 `tool_search` 組合有意設計得**比此技能系列更窄** — 它們是根據各項意圖最可能需要的工具入門包。工作流程技能 (例如 `power-automate-debug`) 可能會提取一個組合，然後隨著工作流程的進行，再次呼叫 `tool_search` 以獲取額外工具。

```python
# 冷啟動 — 按意圖選取組合
skills = mcp("list_skills", {})
# [{"name": "debug-flow", "description": "調查流程失敗的原因...",
#   "tools": ["get_live_flow_runs", "get_live_flow_run_error", ...]}, ...]

# 載入組合的結構描述
debug_tools = mcp("tool_search", {"query": "skill:debug-flow"})
```

---

## 建議語言：Python 或 Node.js

此技能系列中的所有範例均使用 **Python 配合 `urllib.request`** (標準函式庫 — 無需 `pip install`)。**Node.js** 同樣是有效的選擇：`fetch` 在 Node 18+ 中為內建，JSON 處理是原生的，且 async/await 完美對應至 MCP 工具呼叫的請求-回應模式 — 非常適合已在使用 JavaScript/TypeScript 技術棧的團隊。

| 語言 | 評價 | 備註 |
|---|---|---|
| **Python** | 推薦 | 乾淨的 JSON 處理，無逸出問題，所有技能範例皆使用之 |
| **Node.js (≥ 18)** | 推薦 | 內建 `fetch` + `JSON.stringify`/`JSON.parse`；無需額外套件 |
| PowerShell | 避免用於流程操作 | `ConvertTo-Json -Depth` 會靜默截斷巢狀定義；引號與逸出會破壞複雜酬載。僅適用於快速的連線冒煙測試，不適用於建置或更新流程。 |
| cURL / Bash | 可行但脆弱 | 對巢狀 JSON 執行 Shell 逸出極易出錯；無原生 JSON 解析器 |

> **總結 — 請使用下方的核心 MCP 輔助程式 (Python 或 Node.js)。** 兩者皆能在單一可重複使用的函式中處理 JSON-RPC 框架、驗證及回應解析。

---

## 核心 MCP 輔助程式 (Python)

在後續的所有操作中請使用此輔助程式：

```python
import json, urllib.request

TOKEN = "<您的 JWT 權杖>"
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
> - HTTP 401/403 → 權杖缺失、已過期或格式錯誤。請從 [mcp.flowstudio.app](https://mcp.flowstudio.app) 獲取新的 JWT。
> - HTTP 400 → JSON-RPC 酬載格式錯誤。請檢查 `Content-Type: application/json` 以及主體結構。
> - `MCP 錯誤：{"code": -32602, ...}` → 工具引數錯誤或缺失。請呼叫 `tool_search` 並設定 `select:<工具名稱>` 以確認結構描述。

---

## 核心 MCP 輔助程式 (Node.js)

對應的 Node.js 18+ 輔助程式 (內建 `fetch` — 無需套件)：

```js
const TOKEN = "<您的 JWT 權杖>";
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

> 需要 Node.js 18+。若使用舊版 Node，請將 `fetch` 替換為標準函式庫中的 `https.request` 或安裝 `node-fetch`。

---

## 驗證連線

一個 3 行的冒煙測試，確認權杖、端點和輔助程式皆可運作：

```python
skills = mcp("list_skills", {})
print(f"已連接 — 可用 {len(skills)} 個技能組合：",
      [s["name"] for s in skills])
```

預期輸出：

```text
已連接 — 可用 5 個技能組合： ['build-flow', 'debug-flow', 'monitor-flow', 'discover', 'governance']
```

如果失敗，請參閱上方的**常見驗證錯誤**。如果成功，請根據使用者的意圖移交給對應的工作流程技能。

---

## 處理超大回應

某些 MCP 工具回應過大，會超出代理程式的內容視窗 (context window)：

| 工具 | 典型大小 | 原因 |
|---|---|---|
| `describe_live_connector` | 100-600 KB | 連接器的完整 Swagger 規格 |
| `get_live_flow_run_action_outputs` (未指定 `actionName`) | 50 KB – 數 MB | 所有動作 × 所有 foreach 反覆項目 |
| `get_live_flow` (大型流程) | 50-500 KB | 深度巢狀的分支 |
| `list_live_flows` (大型租用戶) | 50-200 KB | 數百條流程記錄 |

### 當載具溢出至檔案時

代理程式載具 (Claude Code, VS Code Copilot 等) 會將超大回應儲存到暫存檔 (例如 `tool-results/mcp-flowstudio-describe_live_connector-NNNN.txt`) 並傳回路徑而非行內 JSON。該檔案是**雙層封裝**的 — 外層是 MCP 包裝，內層是經過 JSON 逸出的酬載：

```text
[{"type":"text","text":"<經過 JSON 逸出的酬載>"}]
```

需要進行兩次解析才能獲得可用的物件：

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

1. **提取而非回應 (Extract, don't echo)。** 僅提取您需要的特定欄位 (單一 `operationId`、單一動作的輸出)，並在進行推理前捨棄其餘部分。
2. **務必將 `actionName` 傳遞給 `get_live_flow_run_action_outputs`。** 省略它會獲取所有動作 × 所有反覆項目 — 雖然適合離線偵錯指令碼，但對接收整個回應的代理程式來說很危險。
3. **在工作階段中重複使用溢出檔案。** 重新獲取相同的連接器 Swagger 需要 30 秒以上並產生另一個溢出檔案 — 請快取該路徑。
4. **不要直接對溢出檔案進行 grep 以尋找 JSON 鍵。** 字串在檔案內經過 JSON 逸出 (`\"OperationId\":`)，因此直接 grep `"OperationId":` 將無法比對。請先解析，再過濾。
5. **向使用者摘要工具輸出。** 針對流程清單回傳 `名稱 + 狀態 + 觸發器`，針對執行錯誤回傳 `動作名稱 + 狀態 + 代碼` — 而非原始 JSON，除非使用者要求。

```python
# 良好實務 — 深入研究連接器 Swagger 中的單一操作
conn = mcp("describe_live_connector", {"environmentName": ENV, "connectorName": "shared_sharepointonline"})
op = conn["properties"]["swagger"]["paths"]["/datasets/{dataset}/tables/{table}/items"]["get"]
print(op["operationId"], "—", op.get("summary"))

# 錯誤實務 — 在內容視窗中保留完整的 500 KB Swagger
print(json.dumps(conn, indent=2))   # 請勿這樣做
```

---

## 驗證與連線備註

| 欄位 | 值 |
|---|---|
| 驗證標頭 | `x-api-key: <JWT>` — **非** `Authorization: Bearer` |
| 權杖格式 | 純 JWT — 請勿剝離、修改或加上前綴 |
| 逾時 | 針對 `get_live_flow_run_action_outputs` (大型輸出) 請使用 ≥ 120 秒 |
| 環境名稱 | `Default-<租用戶 GUID>` (可透過 `list_live_environments` 或 `list_live_flows` 回應找到) |

---

## 參考檔案

- [MCP-BOOTSTRAP.md](references/MCP-BOOTSTRAP.md) — 端點、驗證、請求/回應格式 (請先閱讀此檔)
- [tool-reference.md](references/tool-reference.md) — 回應格式與行為備註 (參數位於 `tool_search` 中)
- [action-types.md](references/action-types.md) — Power Automate 動作類型模式
- [connection-references.md](references/connection-references.md) — 連接器參考指南
