# 軸心編碼 (Axial Coding)

將開放式的觀察結果分組為結構化的失敗分類。軸心編碼將筆記、追蹤觀察或開放編碼輸出轉換為帶有計數的具名類別，進而支援下游工作，例如評估 (eval) 設計和修復優先級排序。它在 [開放編碼](open-coding.md) 之後效果良好，但也可以從任何開放式觀察集開始。

**每當使用者** 有觀察結果並需要結構化時，請使用此方法 — 例如，「我們有哪些類別的失敗」、「我應該為哪些內容建立評估」、「我該如何排定修復的優先順序」、「分組這些筆記」、「MECE (相互獨立且完全窮盡) 明細」，或任何要求將類別或計數植基於真實追蹤而非憑空想像的框架。

## 編碼註釋識別碼 (重複使用開放編碼的值)

重複使用在開放編碼中選擇的 **編碼註釋識別碼 (coding annotation identifier)** — 下方的每個 `annotate` 呼叫都明確傳遞 `--identifier "$CODING_ANNOTATION_IDENTIFIER"`。在新的 Shell 或新的代理程式調用中，將 `CODING_ANNOTATION_IDENTIFIER` 設定為相同的值 (可從總結 UI URL 或透過列出 `.px/coding/*.jsonl` 恢復)；不要鑄造新的 ID。有關理由和標準化規則，請參閱 [open-coding.md#編碼註釋識別碼 — 優先選取此項](open-coding.md#coding-annotation-identifier-pick-this-first)。

> **工作流程術語 vs. 伺服器註釋名稱。** 此技能將此值稱為 **編碼註釋識別碼**；用於 UI 篩選器的伺服器註釋名稱 (NAME) 則保持為 `coding_session_id`，以保持與已寫入之資料列的相容性。請不要嘗試重新命名伺服器端的鍵值。

```bash
CODING_ANNOTATION_IDENTIFIER="coding-run:chatbot-context-loss-2026-05-06"
SLUG=$(echo -n "$CODING_ANNOTATION_IDENTIFIER" | sed 's/[^a-zA-Z0-9_-]/-/g')
NOTES_SIDECAR=".px/coding/${SLUG}.jsonl"
AXIAL_SIDECAR=".px/coding/${SLUG}-axial.jsonl"
```

## 選擇單位

[open-coding.md#選擇分析單位](open-coding.md#choosing-the-unit-of-analysis) 中的開放編碼診斷程序會承諾一個單位 (追蹤、span 或對話)。軸心編碼預設會繼承該單位 — 如果開放編碼在對話 (session) 層級執行，軸心標籤也會如此；追蹤和 span 亦然。

**軸心標籤所在的層級可以與知會該標籤的筆記所在的層級不同** — 這是一項功能，且在各個方向都有效：

- *追蹤 → span*：當模式揭示檢索是持續出現的問題時，追蹤層級的筆記「在詢問退貨時回答了運送問題」可以在檢索 span 上產生一個 span 層級的註釋。
- *追蹤 → 對話*：一旦您發現模式是「代理程式未能在輪次之間追蹤使用者陳述的上下文」，描述單輪混淆的一批追蹤層級筆記可以在對話層級產生註釋。
- *對話 → 追蹤*：關於跨輪次飄移的對話層級筆記，在仔細閱讀後，可能會歸因於代理程式遺失線索的一個特定輪次；追蹤層級的註釋可以命名該輪次。

無論您在哪個層級編寫軸心標籤，請在同一個實體上編寫相符的 `coding_session_id` UI 篩選器註釋（請參閱下文的 [UI 篩選器註釋](#ui-filter-annotation)），以便 UI 連結能識別它。

## 程序

1. **設定編碼註釋識別碼** — 將 `CODING_ANNOTATION_IDENTIFIER` 設定為在開放編碼中使用的值，並重新推導 `SLUG`、`NOTES_SIDECAR`、`AXIAL_SIDECAR`（請參閱 [編碼註釋識別碼](#coding-annotation-identifier-reuse-the-open-coding-value)）。
2. **收集** — 從 `$NOTES_SIDECAR` 讀取開放編碼筆記（位於開放編碼所承諾的單位）；無需與伺服器進行往返通訊。
3. **找出模式** — 將具有共同主題的筆記進行分組。
4. **命名** — 建立具備行動力的類別名稱。
5. **歸因** — 決定每個類別所屬的層級；軸心標籤可以從來源筆記所在的層級向上（追蹤 → 對話）或向下（追蹤 → span）移動到模式實際涉及的層級。
6. **記錄** — 執行 `px {trace,span,session} annotate ... --name axial_coding_category --label <類別> --identifier "$CODING_ANNOTATION_IDENTIFIER"`，新增/更新一列 JSONL 附屬檔案供標籤使用，然後編寫相符的 `coding_session_id` UI 篩選器註釋。
7. **量化** — 從 `$AXIAL_SIDECAR` 計算每個類別的失敗次數。

## 分類法範例

```yaml
failure_taxonomy:
  content_quality:
    hallucination: [invented_facts, fictional_citations]
    incompleteness: [partial_answer, missing_key_info]
    inaccuracy: [wrong_numbers, wrong_dates]

  communication:
    tone_mismatch: [too_casual, too_formal]
    clarity: [ambiguous, jargon_heavy]

  context:
    user_context: [ignored_preferences, misunderstood_intent]
    retrieved_context: [ignored_documents, wrong_context]

  safety:
    missing_disclaimers: [legal, medical, financial]
```

## 讀取

### 1. 收集 — 從附屬檔案中讀取此執行的開放編碼筆記

開放編碼已將每則筆記一列 JSONL 寫入到 `$NOTES_SIDECAR` (`.px/coding/${SLUG}.jsonl`)。請直接讀取它 — 不需要與伺服器通訊。每一列都有 `entity_kind`、`entity_id`、`note`、`identifier` 和 `ts`。如果同一個 `(entity_kind, entity_id)` 出現多次，請使用最新的 `ts` 作為目前的筆記。

**遺漏檔案時的行為**：如果 `$NOTES_SIDECAR` 不存在，代表此編碼註釋識別碼尚未在此工作目錄 (CWD) 中執行開放編碼 — 請停止並先執行開放編碼，不要默默將其視為零筆記。

**格式錯誤的資料列**：每一列都是可獨立解析的 JSON。如果 `jq` 報告解析錯誤，請手動修復或捨棄該列；不要編輯其他列。

**此執行之外的筆記**：附屬檔案僅攜帶此工作目錄寫入的筆記。若要拉取其他評論者或先前執行編寫的筆記，請透過 `px {trace,span,session} list --include-notes` 進行擷取（這會將筆記嵌入到資料列輸出中）— 此工作流程的附屬檔案有意設計為每個工作目錄、每個編碼識別碼獨立存在。

### 2. 分組 — 合成類別

審查上面收集到的筆記文字。手動識別重複出現的主題，並起草候選類別名稱。目標是實現 MECE 涵蓋範圍：每則筆記應恰好符合一個類別。

### 3. 記錄 — 編寫軸心編碼標籤

使用 `px {trace,span,session} annotate` 在每個實體上編寫一個註釋，每次呼叫都明確傳遞 `--identifier "$CODING_ANNOTATION_IDENTIFIER"`，並在 `$AXIAL_SIDECAR` 中記錄一列 JSONL，以便下方的 [量化](#4-量化 — 從軸心附屬檔案中計算每個類別的次數) 可以在沒有伺服器往返的情況下進行計算。層級可能與來源筆記所在的層級不同 — 請參閱下文的 [記錄](#recording) 部分。

### 4. 量化 — 從軸心附屬檔案中計算每個類別的次數

次數統計來自 `$AXIAL_SIDECAR`（由 [記錄](#3-記錄 — 編寫軸心編碼標籤) 填入）。無需執行伺服器查詢，也不會混合入專案範圍的歷史記錄 — 附屬檔案僅保存此執行編寫的標籤。依 `axial_label` 統計目前的資料列數；如果實體出現多次，請使用最新的 `ts`。

與 `$NOTES_SIDECAR` 相同的遺漏檔案和格式錯誤資料列規則：遺漏軸心附屬檔案意味著尚未編寫任何標籤（請執行 [記錄](#3-記錄 — 編寫軸心編碼標籤)）；格式錯誤的列僅限於該列本身 — 請修復或捨棄，不要編輯鄰近的資料。

## 記錄 (Recording)

針對 **標籤** 所屬的層級使用相符的 annotate 命令 — 該層級可能與來源筆記所在的層級不同（請參閱 [選擇單位](#choosing-the-unit)）。每次呼叫都帶有 `--identifier "$CODING_ANNOTATION_IDENTIFIER"` 和 `--format raw --no-progress`，並與 `$AXIAL_SIDECAR` 中的一個 JSONL 資料列配對。

**軸心附屬檔案 JSONL 資料列形狀 (每次 `annotate` 一個)：**

```json
{"entity_kind":"trace","entity_id":"<trace-id>","annotation_name":"axial_coding_category","axial_label":"<標籤>","explanation":"<選用的解釋>","identifier":"<原始識別碼值，未標準化>","ts":"<ISO-8601 UTC>"}
```

欄位：
- `entity_kind` — `"trace"`、`"span"` 或 `"session"` (與 `annotate` 子命令相符)
- `entity_id` — 傳遞給 `annotate` 的實體引數
- `annotation_name` — 對於軸心標籤，始終為 `"axial_coding_category"` (工作流程保留的註釋名稱)
- `axial_label` — 原封不動的 `--label` 值；這就是 [量化](#4-量化 — 從軸心附屬檔案中計算每個類別的次數) 進行分組的依據
- `explanation` — 選用，但當 `annotate` 呼叫使用了 `--explanation` 時應包含
- `identifier` — **原始的** `$CODING_ANNOTATION_IDENTIFIER` 值，未經標準化；標準化形式僅存在於檔名中
- `ts` — 本機附加時的 ISO-8601 UTC 時間戳記

如果您在同一個編碼註釋識別碼下修改同一個實體的標籤，請替換該列或附加一個較新的資料列。當存在重複的 `(entity_kind, entity_id, annotation_name)` 資料列時，最新的 `ts` 為目前的標籤。這與 `annotate --identifier` 的伺服器更新行為相符。

最簡追蹤範例：

```bash
px trace annotate <trace-id> \
  --name axial_coding_category \
  --label answered_off_topic \
  --explanation "詢問了退貨；回答涵蓋了運送" \
  --annotator-kind HUMAN \
  --identifier "$CODING_ANNOTATION_IDENTIFIER" \
  --format raw --no-progress
```

然後使用上述資料列形狀將相符的 JSONL 資料列新增至 `$AXIAL_SIDECAR`。對於 span 或對話標籤，請相應地更改 `entity_kind`、`entity_id` 和 `px` 子命令。

接受的旗標：`--name`、`--label`、`--score`、`--explanation`、`--annotator-kind` (`HUMAN`, `LLM`, `CODE`)、`--identifier`。沒有 `--sync` 旗標 — CLI 本身會傳遞 `sync=true`。

### UI 篩選器註釋

在與軸心標籤相同的層級編寫 `coding_session_id` 註釋 — 請參閱 [open-coding.md#UI 篩選器註釋](open-coding.md#ui-filter-annotation) 以了解為何 Phoenix UI 篩選器需要基於名稱的註釋，而非裸露的 `--identifier`。如果開放編碼已經在同一個實體上編寫了 `coding_session_id`，此呼叫將執行更新（等冪性）。註釋名稱 `coding_session_id` 不變；僅工作流程的口頭術語為「編碼註釋識別碼」。

```bash
# 與上方軸心標籤相同的層級
px trace annotate <trace-id> \
  --name coding_session_id \
  --label "$CODING_ANNOTATION_IDENTIFIER" \
  --identifier "$CODING_ANNOTATION_IDENTIFIER"
# 或在相應層級執行 px span annotate / px session annotate
```

### 記錄紀律

軸心編碼會對您在開放編碼期間記錄筆記的實體進行分類。使用 `$NOTES_SIDECAR` 作為候選實體的來源，並僅在閱讀筆記文字和周邊追蹤/span/對話上下文後才編寫標籤。**不要** 透過 `--status-code ERROR` 進行篩選 — 那隻會擷取 Python 拋出異常的 span，這會排除大多數失敗模式（幻覺、錯誤的語氣、檢索遺漏）。有關完整理由，請參閱 [open-coding.md](open-coding.md#inspection)。

**後備路徑：** REST `POST /v1/{trace,span,session}_annotations` 和 `@arizeai/phoenix-client` 的 `addSpanAnnotation` / `addSessionAnnotation`（目前未匯出 `addTraceAnnotation` — 請使用 REST 或 `px trace annotate`）。GraphQL 端點拒絕異動 (mutation)。

## 總結

軸心編碼完成後，與使用者分享 Phoenix UI 連結。該連結指向專案的追蹤表格，並透過 `coding_session_id` 註釋進行篩選 — `annotations['coding_session_id'].label == '<編碼-註釋-id>'`。UI 路由 `/projects/:projectId` 預期一個編碼後的 GraphQL 節點 ID，而非專案名稱 — 請透過 `px project get` 進行解析：

```bash
project_id=$(px project get "$PHOENIX_PROJECT" --format raw --no-progress | jq -r '.id')
encoded=$(python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))' \
  "annotations['coding_session_id'].label == '$CODING_ANNOTATION_IDENTIFIER'")
echo "Phoenix UI: $PHOENIX_HOST/projects/$project_id/traces?filterCondition=$encoded"
```

如果使用者想要捨棄此執行產生的所有內容（伺服器上的開放編碼筆記、軸心編碼標籤和 `coding_session_id` 註釋，以及本機附屬檔案），透過三次限定識別碼的刪除動作即可處理伺服器端，並使用一次 `rm` 處理本機附屬檔案。**執行前請先確認** — 此動作具破壞性。每次 `px <entity>-annotations delete` 呼叫都需要 `--all` 來授權無限制的清掃；`--identifier` 僅用於縮小範圍，本身絕不授權刪除。如果尚未匯出，請先設定 `PHOENIX_CLI_DANGEROUSLY_ENABLE_DELETES=true`：

```bash
for kind in trace span session; do
  px "$kind-annotations" delete \
    --identifier "$CODING_ANNOTATION_IDENTIFIER" \
    --all -y \
    --format raw --no-progress
done
rm -f "$NOTES_SIDECAR" "$AXIAL_SIDECAR"
```

每次 `px <entity>-annotations delete` 呼叫都會一併移除筆記、軸心編碼標籤和 `coding_session_id` 註釋，因為它們共用底層的註釋表格；`rm` 則會清除本機附屬檔案。

## 代理程式失敗分類法

```yaml
agent_failures:
  planning: [wrong_plan, incomplete_plan]
  tool_selection: [wrong_tool, missed_tool, unnecessary_call]
  tool_execution: [wrong_parameters, type_error]
  state_management: [lost_context, stuck_in_loop]
  error_recovery: [no_fallback, wrong_fallback]
```

### 轉移矩陣 — jq 速寫

要找出代理程式狀態之間發生失敗的位置，請在追蹤內識別每個第一個錯誤 span 之前的最後一個非錯誤 span。注意：OTel 將大多數 span 保留為 `status_code == "UNSET"`，且僅在程式碼明確執行時才設定為 `"OK"` — 請匹配 `!= "ERROR"` 而不是 `== "OK"`，以便矩陣適用於典型的 OTel 資料。

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

使用輸出結果來清點哪些狀態轉移最容易發生失敗，並將其新增到您的分類法中。

## 什麼是良好的類別

一個有用的類別應具備以下特點：
- **依原因命名**，而非依徵狀命名 (「選錯工具」，而非「不良輸出」)
- **與修復相關聯** — 如果您無法命名補救措施，則類別過於模糊
- **植基於資料** — 從實際筆記文字中產生，而非預先假設

## 原則

- **每次執行一個編碼註釋識別碼** — 每次 `annotate` 呼叫和每個附屬檔案資料列都攜帶 `$CODING_ANNOTATION_IDENTIFIER`，即開放編碼使用的相同值；切勿在執行中途鑄造新的 ID。
- **明確傳遞 `--identifier`** — 每次 `px` 呼叫都會獲得 `--identifier "$CODING_ANNOTATION_IDENTIFIER"`；不要依賴繼承的環境變數。
- **附屬檔案讀取，伺服器寫入** — 收集 (Gather) 和量化 (Quantify) 在本機讀取 `$NOTES_SIDECAR` 和 `$AXIAL_SIDECAR`；記錄 (Record) 寫入伺服器並更新附屬檔案。如果一個實體出現多次，最新的 `ts` 勝出。
- **MECE** — 每次失敗僅符合一個類別。
- **具備行動力** — 類別應能建議修復方法。
- **自下而上** — 讓類別從資料中產生。
- **UI 篩選器註釋始終成對出現** — 切勿在編寫 `axial_coding_category` 時不編寫相符的 `coding_session_id` 註釋；UI 連結取決於它。
