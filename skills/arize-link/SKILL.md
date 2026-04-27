---
name: arize-link
description: 產生 Arize UI 的深層連結。當使用者想要一個可點選的 URL 來開啟特定的追蹤 (Trace)、Span、會話 (Session)、資料集、標註佇列、評估器或標註組態時使用。
---

# Arize 連結 (Arize Link)

產生 Arize UI 的深層連結，用於追蹤 (Trace)、Span、會話 (Session)、資料集、標註佇列、評估器與標註組態。

## 何時使用

- 使用者想要一個指向追蹤、Span、會話、資料集、標註佇列、評估器或標註組態的連結
- 您從匯出的資料或日誌中獲得了 ID，並需要連結回 UI
- 使用者要求在 Arize 中「開啟」或「檢視」上述任何一項

## 必要的輸入

從使用者或內容中收集 (匯出的追蹤資料、解析過的 URL)：

| 始終必要 | 特定資源所需 |
|---|---|
| `org_id` (Base64) | `project_id` + `trace_id` [+ `span_id`] — 追蹤/Span |
| `space_id` (Base64) | `project_id` + `session_id` — 會話 |
| | `dataset_id` — 資料集 |
| | `queue_id` — 特定佇列 (省略則指向列表) |
| | `evaluator_id` [+ `version`] — 評估器 |

**路徑中的所有 ID 必須經過 Base64 編碼** (字元：`A-Za-z0-9+/=`)。原始的數值 ID 會產生一個看起來正確但會導致 404 錯誤的 URL。若使用者提供的是數字，請要求他們直接從 Arize 瀏覽器 URL 複製 ID (`https://app.arize.com/organizations/{org_id}/spaces/{space_id}/…`)。若您擁有原始的內部 ID (例如：`Organization:1:abC1`)，請在插入 URL 之前對其進行 Base64 編碼。

## URL 範本

基準 URL：`https://app.arize.com` (地端部署請覆蓋此值)

**追蹤 (Trace)** (加入 `&selectedSpanId={span_id}` 以醒目提示特定 Span)：
```
{base_url}/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedTraceId={trace_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

**會話 (Session)：**
```
{base_url}/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedSessionId={session_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

**資料集 (Dataset)** (`selectedTab`：`examples` (範例) 或 `experiments` (實驗))：
```
{base_url}/organizations/{org_id}/spaces/{space_id}/datasets/{dataset_id}?selectedTab=examples
```

**佇列列表 / 特定佇列：**
```
{base_url}/organizations/{org_id}/spaces/{space_id}/queues
{base_url}/organizations/{org_id}/spaces/{space_id}/queues/{queue_id}
```

**評估器 (Evaluator)** (省略 `?version=…` 則指向最新版本)：
```
{base_url}/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}
{base_url}/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}?version={version_url_encoded}
```
`version` 數值必須經過 URL 編碼 (例如：末尾的 `=` 變為 `%3D`)。

**標註組態：**
```
{base_url}/organizations/{org_id}/spaces/{space_id}/annotation-configs
```

## 時間範圍 (Time Range)

關鍵：`startA` 與 `endA` (Unix 紀元毫秒數) 是追蹤/Span/會話連結**必要**的 — 省略這些值將預設為過去 7 天，若該追蹤落在該視窗之外，則會顯示「無最近資料 (no recent data)」。

**優先順序：**
1. **使用者提供的 URL** — 直接擷取並重複使用 `startA`/`endA`。
2. **Span 的 `start_time`** — 前後各緩衝 ±1 天 (或前後各 ±1 小時以縮小範圍)。
3. **備援方案** — 過去 90 天 (`現在 - 90天` 到 `現在`)。

優先選用較小的視窗；90 天的視窗載入速度較慢。

## 說明

1. 從使用者、匯出的資料或 URL 內容中收集 ID。
2. 核實路徑中的所有 ID 皆為 Base64 編碼。
3. 根據上述優先順序確定 `startA`/`endA`。
4. 代入適當的範本並以可點選的 Markdown 連結呈現。

## 疑難排解

| 問題 | 解決方案 |
|---|---|
| 「無資料 (No data)」/ 空檢視 | 追蹤落在時間範圍之外 — 放寬 `startA`/`endA` (±1h → ±1d → 90d)。 |
| 404 | ID 錯誤或非 Base64 編碼。請重新檢查瀏覽器 URL 中的 `org_id`, `space_id`, `project_id`。 |
| Span 未醒目提示 | `span_id` 可能屬於不同的追蹤。請對照匯出的 Span 資料進行核實。 |
| `org_id` 未知 | `ax` CLI 未提供此 ID。請要求使用者從 `https://app.arize.com/organizations/{org_id}/spaces/{space_id}/…` 複製。 |

## 相關技能

- **arize-trace**：匯出 Span 以獲取 `trace_id` (追蹤 ID)、`span_id` 與 `start_time` (開始時間)。

## 範例

有關每種連結類型的完整具體 URL，請參閱 references/EXAMPLES.md。
