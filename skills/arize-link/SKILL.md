---
name: arize-link
description: 產生 Arize UI 的深層連結。當使用者想要一個可點擊的 URL 來開啟或分享特定的 Trace, Span, Session, 資料集 (dataset), 標記佇列 (labeling queue), 評估者 (evaluator) 或標核配置 (annotation config)，或與團隊成員分享 Arize 資源時使用。
---

# Arize 連結 (Arize Link)

產生指向 Arize UI 的 Trace, Span, Session, 資料集、標記佇列、評估者與標核配置的深層連結。

## 何時使用 (When to Use)

- 使用者想要一個指向 Trace, Span, Session, 資料集、標記佇列、評估者或標核配置的連結。
- 您有來自匯出資料或日誌的 ID，且需要連結回 UI。
- 使用者要求「開啟」或「檢視」上述任何 Arize 內容。

## 必填輸入 (Required Inputs)

從使用者或上下文（匯出的追蹤資料、解析後的 URL）中收集：

| 一律必填 | 資源特定 |
|---|---|
| `org_id` (base64) | `project_id` + `trace_id` [+ `span_id`] — Trace/Span |
| `space_id` (base64) | `project_id` + `session_id` — Session |
| | `dataset_id` — 資料集 |
| | `queue_id` — 特定佇列（若為清單則省略） |
| | `evaluator_id` [+ `version`] — 評估者 |

**所有路徑 ID 必須經過 base64 編碼**（字元範圍：`A-Za-z0-9+/=`）。原始的數值 ID 會產生一個看起來有效但會導致 404 的 URL。如果使用者提供的是數字，請要求他們直接從 Arize 瀏覽器 URL (`https://app.arize.com/organizations/{org_id}/spaces/{space_id}/…`) 複製 ID。如果您有原始的內部 ID（例如 `Organization:1:abC1`），請先進行 base64 編碼，然後再插入 URL。

## URL 範本 (URL Templates)

基礎 URL：`https://app.arize.com`（若是內部部署則進行覆寫）

**Trace**（加入 `&selectedSpanId={span_id}` 以標示特定 Span）：
```
{base_url}/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedTraceId={trace_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

**Session：**
```
{base_url}/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedSessionId={session_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

**資料集 (Dataset)** (`selectedTab` 為 `examples` 或 `experiments`)：
```
{base_url}/organizations/{org_id}/spaces/{space_id}/datasets/{dataset_id}?selectedTab=examples
```

**佇列清單 / 特定佇列：**
```
{base_url}/organizations/{org_id}/spaces/{space_id}/queues
{base_url}/organizations/{org_id}/spaces/{space_id}/queues/{queue_id}
```

**評估者 (Evaluator)**（遺漏 `?version=…` 則指向最新版本）：
```
{base_url}/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}
{base_url}/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}?version={version_url_encoded}
```
`version` 的值必須經過 URL 編碼（例如結尾的 `=` 變為 `%3D`）。

**標核配置 (Annotation configs)：**
```
{base_url}/organizations/{org_id}/spaces/{space_id}/annotation-configs
```

## 時間範圍 (Time Range)

至關重要：針對 Trace/Span/Session 連結，`startA` 與 `endA`（Epoch 毫秒）是 **必填項** — 遺漏它們將預設為過去 7 天，且若 Trace 落在該視窗之外，將顯示「無近期資料 (no recent data)」。

**優先順序：**
1. **使用者提供的 URL** — 直接擷取並重複使用 `startA`/`endA`。
2. **Span 的 `start_time`** — 前後各緩衝 ±1 天（或若需更窄視窗則為 ±1 小時）。
3. **備用方案** — 過去 90 天（`now - 90d` 到 `now`）。

優先選擇較窄的視窗；90 天視窗載入速度較慢。

## 指示 (Instructions)

1. 從使用者、匯出資料或 URL 上下文中收集 ID。
2. 驗證所有路徑 ID 皆已過 base64 編碼。
3. 根據上述優先順序確定 `startA`/`endA`。
4. 代入適當的範本中，並以可點擊的 Markdown 連結形式呈現。

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|---|---|
| 「無資料 (No data)」 / 空白檢視 | Trace 超出時間視窗 — 擴大 `startA`/`endA` (±1h → ±1d → 90d)。 |
| 404 | ID 錯誤或非 base64。從瀏覽器 URL 重新檢查 `org_id`, `space_id`, `project_id`。 |
| Span 未標示 | `span_id` 可能屬於不同的 Trace。針對匯出的 Span 資料進行驗證。 |
| `org_id` 未知 | `ax` CLI 並未揭露此資訊。要求使用者從 `https://app.arize.com/organizations/{org_id}/spaces/{space_id}/…` 複製。 |

## 相關技能 (Related Skills)

- **arize-trace**：匯出 Span 以獲取 `trace_id`, `span_id` 與 `start_time`。

## 範例 (Examples)

參見 references/EXAMPLES.md 以獲取每種連結類型的完整具體 URL 集合。
