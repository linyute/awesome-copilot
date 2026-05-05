# 軸心式編碼 (Axial Coding)

將開放式的觀察結果分組為結構化的失敗分類法。軸心式編碼將筆記、追蹤觀察或開放式編碼的輸出轉化為帶有計數的具名類別，藉此支援後續工作，如評估設計與修復優先順序。此方法在 [開放式編碼 (open coding)](open-coding.md) 之後運作良好，但也可以從任何一組開放式的觀察結果開始。

**每當使用者擁有觀察結果並需要結構時** 請採用此方法 — 例如：「我們有哪些失敗類別」、「我應該為哪些內容建立評估 (evals)」、「我該如何排列修復的優先順序」、「將這些筆記分組」、「MECE 詳解」，或任何要求基於真實追蹤而非憑空想像的類別或計數的情境。

## 選擇單元 (Choosing the unit)

開放式編碼筆記通常是 **Trace 層級** 的（參見 [open-coding.md#選擇單元](open-coding.md#選擇單元)）— 下方的範例以 `px trace` 為主，並以 `px span` 作為 Span 層級筆記的備案。**軸心式標籤可以存在於與啟發它的筆記不同的層級** — 這是一項特性：一旦模式顯示檢索是持續的罪魁禍首，針對「詢問退貨時回答了運送」的 Trace 層級筆記，可以在檢索 Span 上產生一個 Span 層級的標核。在軸心式編碼時進行重新歸因正是軸心式編碼的 *意義* 所在。工作階段 (Session) 層級的總結則透過 REST `/v1/projects/{id}/session_annotations` 進行（無 CLI 寫入路徑）。

## 流程 (Process)

1. **收集 (Gather)** — 從您審閱過的實體中收集開放式編碼筆記（預設為 Trace 層級）。
2. **尋找模式 (Pattern)** — 將具有共同主題的筆記分組。
3. **命名 (Name)** — 建立具備行動導向的類別名稱。
4. **歸因 (Attribute)** — 決定每個類別所屬的層級；軸心式標籤可以從筆記所在的層級移動到模式所指涉的組件。
5. **量化 (Quantify)** — 計算每個類別的失敗次數。

## 分類法範例 (Example Taxonomy)

```yaml
failure_taxonomy:
  內容品質 (content_quality):
    hallucination (幻覺): [invented_facts, fictional_citations]
    incompleteness (不完整): [partial_answer, missing_key_info]
    inaccuracy (不準確): [wrong_numbers, wrong_dates]

  溝通 (communication):
    tone_mismatch (語氣不符): [too_casual, too_formal]
    clarity (清晰度): [ambiguous, jargon_heavy]

  上下文 (context):
    user_context (使用者上下文): [ignored_preferences, misunderstood_intent]
    retrieved_context (檢索到的上下文): [ignored_documents, wrong_context]

  安全 (safety):
    missing_disclaimers (缺少免責聲明): [legal, medical, financial]
```

## 讀取 (Reading)

### 1. 收集 — 擷取開放式編碼筆記 (1. Gather — extract open-coding notes)

開放式編碼筆記以 `name="note"` 的標核形式儲存，且僅在傳遞 `--include-notes` 時傳回。若使用 `--include-annotations`，您將獲得結構化標核但 **不含** 筆記 — 伺服器會從標核陣列中排除筆記。

```bash
# Trace 層級筆記（開放式編碼的預設值）
px trace list --include-notes --format raw --no-progress | jq '
  [ .[] | select((.notes // []) | length > 0) ]
  | map({ trace_id: .traceId, notes: [ .notes[].result.explanation ] })
'

# Span 層級筆記（當開放式編碼因機械性失敗而降至 Span 時）
px span list --include-notes --format raw --no-progress | jq '
  [ .[] | select((.notes // []) | length > 0) ]
  | map({ span_id: .context.span_id, notes: [ .notes[].result.explanation ] })
'
```

### 2. 分組 — 綜合類別 (2. Group — synthesize categories)

審閱上方收集的筆記文字。手動識別重複出現的主題，並草擬候選類別名稱。目標是達成 MECE 涵蓋：每條筆記應恰好符合一個類別。

### 3. 記錄 — 撰寫軸心式編碼標核 (3. Record — write axial-coding annotations)

使用 `px trace annotate` 或 `px span annotate` 為每個實體撰寫一個標核。層級可以與來源筆記所在位置不同 — 參見下方的 **記錄** 章節。

### 4. 量化 — 依類別計數 (4. Quantify — count per category)

記錄完成後，使用 `--include-annotations` 來統計有多少實體帶有各個標籤。下方的範例顯示了 Span 層級的計數；對於 Trace 層級的標核，請將 `px span list` 換成 `px trace list`（`.annotations[]` 的形狀是一樣的）。

```bash
px span list --include-annotations --format raw --no-progress | jq '
  [ .[] | .annotations[]? | select(.name == "failure_category" and .result.label != null) ]
  | group_by(.result.label)
  | map({ label: .[0].result.label, count: length })
  | sort_by(-.count)
'
```

篩選至特定的標核名稱以檢查覆蓋率：

```bash
px span list --include-annotations --format raw --no-progress | jq '
  [ .[] | select((.annotations // []) | any(.name == "failure_category")) ]
  | length
'
```

## 記錄 (Recording)

針對 **標籤** 所屬的層級使用相應的標核指令 — 該層級可能與來源筆記所在位置不同（參見 [選擇單元](#選擇單元)）：

```bash
# Trace 層級標籤（最常見 — 整個 Trace 表現出失敗）
px trace annotate <trace-id> \
  --name failure_category \
  --label answered_off_topic \
  --explanation "詢問了退貨問題；答案卻涵蓋了運送政策" \
  --annotator-kind HUMAN

# Span 層級標籤（當模式指涉特定組件時）
px span annotate <span-id> \
  --name failure_category \
  --label retrieval_off_topic \
  --explanation "針對退貨查詢檢索了運送文件" \
  --annotator-kind HUMAN
```

接受的旗標：`--name`, `--label`, `--score`, `--explanation`, `--annotator-kind` (`HUMAN`, `LLM`, `CODE`)。這些指令沒有 `--identifier` 或 `--sync` 旗標。

### 批次記錄 (Bulk recording)

軸心式編碼對您在開放式編碼期間記錄筆記的實體進行分類。**不要** 依 `--status-code ERROR` 進行篩選 — 那樣只會捕捉到 Python 拋出異常的 Span，這排除了大多數失敗模式（幻覺、錯誤語氣、檢索缺失）。完整原因請參閱 [open-coding.md](open-coding.md#檢查)。

```bash
# 為已經有開放式編碼筆記的 Trace 進行批次標核
px trace list --include-notes --format raw --no-progress \
  | jq -r '.[] | select((.notes // []) | length > 0) | .traceId' \
  | while read tid; do
      px trace annotate "$tid" \
        --name failure_category \
        --label answered_off_topic \
        --annotator-kind HUMAN
    done
```

相同的模式也適用於 Span 層級筆記 — 將 `px trace` 換成 `px span`，並將 `.traceId` 換成 `.context.span_id`。

順帶一提：對於基於 Node 的批次腳本，`@arizeai/phoenix-client` 提供了 `addSpanAnnotation`、`addSpanNote` 與 `addTraceNote`。（目前尚未匯出 `addTraceAnnotation`；請使用 REST 端點或 `px trace annotate` 進行 Trace 層級標核。）

順帶一提：`px api graphql` 拒絕變動 (mutation) — 它無法寫入標核。

## 代理程式失敗分類法 (Agent Failure Taxonomy)

```yaml
agent_failures:
  規劃 (planning): [wrong_plan, incomplete_plan]
  工具選取 (tool_selection): [wrong_tool, missed_tool, unnecessary_call]
  工具執行 (tool_execution): [wrong_parameters, type_error]
  狀態管理 (state_management): [lost_context, stuck_in_loop]
  錯誤恢復 (error_recovery): [no_fallback, wrong_fallback]
```

### 轉移矩陣 — jq 速寫 (Transition Matrix — jq sketch)

若要找出失敗發生在哪些代理程式狀態之間，請識別 Trace 中每個第一個錯誤 Span 之前的最後一個非錯誤 Span。注意：OTel 通常將大多數 Span 保持在 `status_code == "UNSET"`，僅在程式碼明確設定時才設為 `"OK"` — 請匹配 `!= "ERROR"` 而非 `== "OK"`，以便矩陣能運作於典型的 OTel 資料。

```bash
px span list --format raw --no-progress | jq '
  group_by(.context.trace_id)
  | map(
      sort_by(.start_time)
      | { trace_id: .[0].context.trace_id,
          last_non_error: map(select(.status_code != "ERROR")) | last | .name,
          first_err:      map(select(.status_code == "ERROR")) | first | .name }
    )
  | [ .[] | select(.first_err != null) ]
  | group_by([.last_non_error, .first_err])
  | map({ transition: "\(.[0].last_non_error) → \(.[0].first_err)", count: length })
  | sort_by(-.count)
'
```

使用輸出結果來統計哪些狀態間的轉移最容易出錯，並將其加入您的分類法中。

## 何謂優質類別 (What Makes a Good Category)

一個有用的類別應具備：
- **以原因命名**，而非症狀（「工具選取錯誤」，而非「輸出錯誤」）。
- **與修復方案連結** — 如果您無法命名補救措施，則該類別過於模糊。
- **基於數據** — 源自實際筆記文字，而非預先假設。

## 原則 (Principles)

- **MECE** - 每個失敗僅符合一個類別。
- **具行動導向 (Actionable)** - 類別能暗示修復方案。
- **由下而上 (Bottom-up)** - 讓類別從數據中自然出現。
