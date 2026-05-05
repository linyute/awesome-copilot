# 開放式編碼 (Open Coding)

針對採樣的追蹤進行自由格式的筆記編寫，此階段尚無任何分類法。在選取追蹤樣本後，閱讀每一項追蹤並寫下關於出錯原因的簡短且具體的觀察。這些原始筆記將用於 [軸心式編碼 (axial coding)](axial-coding.md)，在該階段筆記會被歸類至具名的失敗類別中 — 並最終轉化為評估目標或修復優先順序。

**每當使用者想要** 在沒有固定分類法的情況下查看 Trace 或 Span 時使用 — 例如：「此代理程式出了什麼問題」、「我剛檢測了我的應用程式，該從哪裡開始」、「審閱這些追蹤」、「模型犯了哪些錯誤」、「協助我理清這些輸出」，或任何在建立類別前需要基於數據的觀察結果的情境。

## 選擇單元 (Choosing the unit)

開放式編碼有兩個不一定需要匹配的範圍：

- **審閱範圍 (Review scope)** — **Trace (追蹤)**。將輸入 → 工具呼叫 → 擷取的上下文 → 輸出視為一個完整故事來閱讀。
- **記錄範圍 (Recording scope)** — **預設為 Trace**。真實的觀察通常是追蹤形狀的（「詢問了 X，得到了 Y；答案未解決問題」），在此階段強制將其定位到 Span 會承擔您尚無數據支持的因果歸因 — 這是軸心式編碼的工作。

  僅在以下情況之一時才降至 **Span**：
  - Span 單獨讀取時即是錯誤的：觸發了異常、工具傳回了錯誤回應、輸出格式錯誤。
  - 您對該領域已有足夠瞭解，無需跨 Span 推斷即可當場判定失敗原因。

工作階段 (Session) 層級的發現是軸心式編碼的聚合目標，而非開放式編碼的筆記 — Phoenix 有 REST `/v1/projects/{id}/session_annotations` 但沒有工作階段的 `add-note` 路徑。

## 流程 (Process)

1. **檢查 (Inspect)** — 從您的樣本中獲取一個 Trace。
2. **閱讀 (Read)** — 查看輸入、輸出、異常、工具呼叫、擷取的上下文。
3. **筆記 (Note)** — 撰寫一句描述出錯原因的具體句子（若正確則跳過）。
4. **記錄 (Record)** — 預設透過 `px trace add-note` 將筆記附加至 Trace；針對孤立/機械性的失敗則附加至 Span。
5. **迭代 (Iterate)** — 移動至下一個 Trace；重複此過程直到樣本用盡或達到飽和。

## 檢查 (Inspection)

在撰寫筆記前，使用 `px` 閱讀 Trace 與 Span 的上下文。開放式編碼以 **Trace** 為單位進行審閱 — 將輸入 → 工具呼叫 → 擷取的上下文 → 輸出視為一個整體。預設記錄在 Trace 上；僅在失敗是機械性的（異常、錯誤回應、格式錯誤的輸出）或您可以當場歸因時才深入研究特定 Span（參見 [選擇單元](#選擇單元)）。

> **不要依 `--status-code ERROR` 篩選樣本。** OTel 的 `status_code` 僅在檢測器擷取到拋出的 Python 異常（網路失敗、5xx、解析錯誤）時才會翻轉為 `ERROR`。幻覺、錯誤的語氣、檢索缺失以及錯誤的工具選取都能乾淨地完成，並以 `OK` 或 `UNSET` 狀態到達。依 `--status-code ERROR` 進行開放式編碼採樣會排除此工作流程旨在發現的人群。

```bash
# 對最近的 Trace 進行採樣 — 開放式編碼中的檢查單元
px trace list --limit 100 --format raw --no-progress | jq '
  .[] | {trace_id: .traceId, root: .rootSpan.name, status,
         input: .rootSpan.attributes["input.value"],
         output: .rootSpan.attributes["output.value"]}
'

# Trace 層級的上下文 — 一個 Trace 中的所有 Span，按 start_time 排序
px trace get <trace-id> --format raw | jq '
  .spans | sort_by(.start_time) | map({span_id: .context.span_id, name, status_code,
    input: .attributes["input.value"],
    output: .attributes["output.value"]})
'

# 深入研究一個 Span（不存在 px span get；請透過 span list 進行篩選）
px span list --trace-id <trace-id> --format raw --no-progress \
  | jq '.[] | select(.context.span_id == "<span-id>")'

# 檢查您即將審閱的 Trace（預設）或 Span 上現有的筆記
# 筆記以 name="note" 的標核形式儲存；請使用 --include-notes（而非 --include-annotations）
px trace list --include-notes --limit 10 --format raw --no-progress | jq '
  .[] | select((.notes // []) | length > 0)
  | {trace_id: .traceId, notes: [.notes[] | .result.explanation]}
'
# Span 上的形狀相同 — 將 px trace 替換為 px span 並使用 .context.span_id
```

在編寫腳本時，務必透過 `jq` 搭配 `--format raw --no-progress` 使用管線。

## 記錄筆記 (Recording Notes)

預設寫入路徑為 `px trace add-note <trace-id> --text "..."` — 大多數觀察結果是追蹤形狀的，不應預先承諾定位。當失敗是孤立的錯誤（異常、錯誤回應、格式錯誤的輸出）或您已當場瞭解失敗結構時，降至 `px span add-note <span-id>`。

```bash
# Trace 層級筆記（預設）
px trace add-note <trace-id> --text "詢問了退貨問題；最終答案卻涵蓋了運送政策"

# Span 層級筆記（機械性或可當場歸因的失敗）
px span add-note <span-id> --text "工具呼叫傳回 500 — 無法連線至供應商 API"

# 互動式循環 — 走訪 Trace，為每個失敗的 Trace 撰寫 Trace 層級筆記
px trace list --last-n-minutes 60 --limit 50 --format raw --no-progress \
  | jq -r '.[].traceId' \
  | while read tid; do
      echo "── trace $tid ──"
      px trace get "$tid" --format raw | jq '
        {input: .rootSpan.attributes["input.value"],
         output: .rootSpan.attributes["output.value"],
         spans: (.spans | sort_by(.start_time) | map({name, status_code}))}
      '
      read -p "$tid 的筆記（留白則跳過）：" note
      [ -z "$note" ] && continue
      px trace add-note "$tid" --text "$note"
    done
```

依狀態代碼進行大量自動標記（例如 `px span list --status-code ERROR | xargs ... add-note "error"`）**並非開放式編碼** — 開放式編碼是手動的、基於觀察的，且涵蓋所有失敗模式，而不僅僅是 Python 拋出異常的 Span。請跳過依狀態代碼的大量標記捷徑；與走訪 Trace 相比，它產出的筆記更少且資訊量更低。

**備用寫入路徑（單行備註）：**

- `POST /v1/trace_notes` 與 `POST /v1/span_notes` — 每次請求接受一個 `{data: {trace_id|span_id, note}}`；用於 CLI 之外的腳本寫入。
- `@arizeai/phoenix-client` 的 `addTraceNote` 與 `addSpanNote` 封裝了相同的端點。
- `px api graphql` 會拒絕變動 (mutation)，並顯示 `"Only queries are permitted."` — 請使用 `px trace/span add-note` 或 REST 端點。

## 何謂優質筆記 (What Makes a Good Note)

| 拙劣的筆記 | 為何拙劣 | 優質筆記 | 為何優質 |
| -------------------- | ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| 「答案錯誤」 | 無可觀察的細節 | 「說商店在下午 6 點關門，但政策是晚上 9 點」 | 引用觀察值與正確值 |
| 「語氣不佳」 | 模糊的判斷 | 「對企業支援案件使用了名字稱呼」 | 具體說明上下文不符之處 |
| 「幻覺」 | 在觀察前先下標籤 | 「引用了結構描述中不存在的產品功能 ('auto-renew')」 | 描述了哪些內容是被捏造的 |
| 「檢索問題」 | 是類別而非觀察 | 「在問題關於退貨時檢索了關於運送的文件」 | 說明檢索到了什麼以及需要什麼 |
| 「模型困惑」 | 不透明 | 「在使用者以英文撰寫時用西班牙文回答」 | 可觀察且可重現 |

寫下您看到的內容，而非您認為它所屬的類別 — 分類發生在 [軸心式編碼 (axial coding)](axial-coding.md)。如 `TONE:` 或 `FACTUAL:` 之類的簡短前綴是個人速記，而非存放庫慣例。

## 飽和 (Saturation)

當觀察結果不再創新時，停止撰寫筆記。訊號包含：

- **重複** — 最後 10–15 個 Trace 產出的筆記描述了您已經看過的失敗。
- **換言之的收斂** — 您發現自己正在撰寫早期筆記的小幅度變體。
- **跳過數量超過筆記數量** — 大多數最近的 Trace 都是正確的，無需筆記。

達到飽和時，移動至 [軸心式編碼 (axial coding)](axial-coding.md) 來將您擁有的內容分組。在飽和後繼續撰寫只會增加 Trace 數量而非見解。您不需要標核每一項 Trace — 標核正確的 Trace 會稀釋訊號。

## 原則 (Principles)

- **自由格式優於結構化** — 在開放式編碼期間不要預先承諾某種分類法；類別在軸心式編碼中出現。
- **具體優於一般** — 引用或轉述觀察到的失敗；模糊的標籤（「回應不佳」）不具備任何訊號。
- **先有上下文後下標籤** — 在撰寫任何筆記前，先檢查輸入、輸出與擷取的上下文。
- **先迭代後分類** — 先完成完整樣本的走訪；在收集過程中抵制分組的誘惑。
- **跳過是有效的** — 正確的 Span 不需要筆記；標核所有內容會稀釋訊號。
