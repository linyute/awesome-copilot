# 開放編碼 (Open Coding)

針對抽樣的追蹤 (trace)、span 或對話 (session) 撰寫自由格式的筆記，此時尚未建立分類法。在您以正確的單位選取樣本後（請參閱 [選擇分析單位](#choosing-the-unit-of-analysis)），請閱讀每一項並撰寫簡短、具體的觀察，說明出錯之處。這些原始筆記將用於 [軸心編碼](axial-coding.md)，在那裡它們會被分組到具名的失敗類別中，並最終轉化為評估目標或修復優先順序。

**每當使用者** 想要查看 LLM 流量但尚未建立固定分類法時，請使用此方法 — 例如，「這個代理程式出了什麼問題」、「我剛檢測完我的應用程式，我該從哪裡開始」、「審查這些追蹤」、「聊天機器人一直遺失上下文」、「模型正在犯哪些錯誤」、「幫助我理解這些對話」，或任何需要在建立類別之前進行植基觀察的框架。

## 選擇分析單位

正確的單位 — **追蹤、span 或對話** — 取決於問題和系統。請在記錄前深思熟慮地選取；此選擇決定了您全程呼叫的是 `px trace`、`px span` 還是 `px session`，且錯誤的預設值在執行中途修改成本很高。

單位的選擇取決於 **您正在調查的失敗模式實際發生的位置**：

- **追蹤 (Trace)** — 一個輸入 → 一個呼叫圖 → 一個輸出。適用於分類器、單次摘要器、無狀態的工具使用代理程式、單次查詢 RAG。發生在此處的失敗模式：錯誤答案、格式錯誤的輸出、遺漏檢索、單次要求中的錯誤工具選取。
- **Span** — 追蹤內部的一個操作。適用於孤立的機械性失敗（觸發了異常、工具傳回錯誤回應、輸出格式錯誤）或者當您可以一眼看出歸因於特定元件時。當追蹤整體正常但其中一個片段是感興趣的單位時，請使用 span。
- **對話 (Session)** — 共享 `session.id` 的一連串追蹤。適用於多輪對話代理程式、具有情節記憶的代理程式，或者任何失敗模式為 *軌跡* 的情況：跨輪次上下文遺失、飄移出使用者陳述的目標、代理程式忘記陳述的偏好、重複的使用者釐清。這些失敗不存在於任何單一追蹤中；它們僅存在於 *跨* 追蹤的情況下。

### 診斷 — 要讀取的三个訊號

1. **使用者框架**：*傾向於對話*：「對話」、「代理程式忘了」、「飄移」、「記憶」、「跨輪次」、「使用者不得不重複他們說過的話」。*傾向於追蹤*：「此追蹤」、「此呼叫」、「回應是錯的」、「錯誤輸出」。*傾向於 span*：「異常」、「錯誤回應」、「格式錯誤」、「檢索失敗」。

2. **資料形狀**：在進入迴圈前進行探測。對話 ID 位於 `rootSpan.attributes["session.id"]`（它 *不是* 追蹤 JSON 中的頂層欄位），且對於未連接對話的追蹤，其值為 `""` — 請過濾這兩者：

   ```bash
   px trace list --limit 200 --format raw --no-progress \
     | jq '
       [ .[] | .rootSpan.attributes["session.id"] // empty | select(. != "") ]
       | { with_session: length,
           distinct_sessions: (group_by(.) | length),
           median_traces_per_session:
             (group_by(.) | map(length) | sort | .[length/2|floor] // 0) }
     '
   ```

   `with_session: 0` → 未連接對話；追蹤是最小單位。`median_traces_per_session: 1` → 單次追蹤的對話；仍為追蹤。`median_traces_per_session: 5+` → 對話具有意義；對話可能是正確的單位。

3. **系統類型**：開啟一個最近的追蹤並檢查根 span 的輸入。單一使用者訊息 → 一次輪次或一次調用。訊息 *陣列* (`[{role: user}, {role: assistant}, ...]`) → 這是更長對話中的一輪；對話位於對話層級。

   ```bash
   px trace get <trace-id> --format raw \
     | jq '.rootSpan.attributes["input.value"] | (try fromjson catch .) | (type, length?)'
   ```

### 口頭承諾，然後繼續

在記錄任何筆記前，明確陳述單位：

> 「問題：『聊天機器人一直遺失上下文』。資料：中位數為每個對話 7 次追蹤，輸入為訊息陣列。在 **對話 (session)** 層級進行記錄；對於單輪觀察將降至 **追蹤 (trace)**，對於機械性失敗將降至 **span**。」

如果資料有要求，單位可以轉移 — 一個揭示「代理程式從不記得之前的輪次」的追蹤層級調查應轉向對話。記錄觀察結果，然後重新聚焦下一批資料。單位是一個起始假設，而不是合約。

## 編碼註釋識別碼 — 優先選取此項 (Coding Annotation Identifier)

此工作流程產生的每個成品 — 開放編碼筆記、軸心編碼標籤、本機附屬檔案以及 UI 篩選器註釋 — 都會標記一個 **編碼註釋識別碼 (coding annotation identifier)**，以便執行動作是可查詢、可還原且可作為整體查看的。在記錄任何筆記前，選取一個 **具描述性且唯一** 的識別碼。格式建議：

    coding-run:<簡短主題>-<YYYY-MM-DD>

範例：`coding-run:chatbot-context-loss-2026-05-06`、`coding-run:agent-tool-misuse-q2`。對於稍後開啟資料的人來說，具描述性的 ID 比模糊的 UUID 更有意義。`coding-run:` 前綴是一種視覺慣例；該值是工作流程的編碼註釋識別碼，而不是 `px session` ID。

> **工作流程術語 vs. 伺服器註釋名稱。** 此技能將此值稱為 **編碼註釋識別碼**。伺服器端用於 UI 篩選器的註釋名稱 (NAME) 則保持為 `coding_session_id`，以保持與已寫入之資料列的相容性。請不要嘗試重新命名它。

在每次 `px` 呼叫中明確傳遞識別碼。為了可讀性使用 Shell 變數是可以的，但 **不要依賴 Shell 繼承** — 許多代理程式導向裝置會在新的子 Shell 中衍生每個命令，因此 `CODING_ANNOTATION_IDENTIFIER` 可能無法傳播。

```bash
CODING_ANNOTATION_IDENTIFIER="coding-run:chatbot-context-loss-2026-05-06"
```

本機附屬檔案位於 `.px/coding/<標準化後的識別碼>.jsonl`（相對於 CWD，與 `.px/docs` 先例一致）。標準化規則：在檔名中使用該值之前，將不符合 `[a-zA-Z0-9_-]` 的任何字元替換為 `-` — 冒號、斜線和其他 Shell 脆弱字元都會被正規化。對於 `CODING_ANNOTATION_IDENTIFIER="coding-run:chatbot-context-loss-2026-05-06"`，附屬檔案路徑為 `.px/coding/coding-run-chatbot-context-loss-2026-05-06.jsonl`。

驗證此執行尚未開始 — 唯一性是透過 **檢查本機檔案** 來判斷，而非伺服器查詢：

```bash
SLUG=$(echo -n "$CODING_ANNOTATION_IDENTIFIER" | sed 's/[^a-zA-Z0-9_-]/-/g')
SIDECAR=".px/coding/${SLUG}.jsonl"
test ! -f "$SIDECAR" || { echo "附屬檔案已存在於 $SIDECAR — 請選取新的識別碼或刪除該檔案"; exit 1; }
mkdir -p .px/coding
```

如果 `$SIDECAR` 已存在，請為 `CODING_ANNOTATION_IDENTIFIER` 附加一個區分符號 (`-v2`、`-dustin` 等)，重新推導 `SLUG` 並重新檢查。代理程式導向裝置可以在獨立的調用中執行開放編碼和軸心編碼：每個步驟都會從 `CODING_ANNOTATION_IDENTIFIER` 重新推導 `SLUG` 並讀取/寫入同一個檔案。

## 程序

1. **選取編碼註釋識別碼** — 選擇一個具描述性的值，並驗證附屬檔案尚未存在（請參閱 [編碼註釋識別碼](#coding-annotation-identifier-pick-this-first)）。
2. **選取單位** — 完成 [選擇分析單位](#choosing-the-unit-of-analysis) 並承諾使用追蹤、span 或對話。
3. **檢查** — 擷取一個所選單位 (追蹤 / span / 對話) 的實體。
4. **閱讀** — 輸入、輸出、異常、工具呼叫、檢索到的上下文，以及（在對話層級）跨子追蹤的軌跡。
5. **筆記** — 撰寫一個具體的句子說明出錯之處（或者如果正確則跳過）。
6. **記錄** — 執行 `px {trace,span,session} add-note <id> --text "..." --identifier "$CODING_ANNOTATION_IDENTIFIER" --format raw --no-progress`，為筆記新增/更新一列 JSONL 附屬檔案，然後編寫相符的 [UI 篩選器註釋](#ui-filter-annotation)。
7. **反覆執行** — 移動到下一個實體；重複此過程直到樣本用盡或達到飽和。
8. **移交** — 軸心編碼會直接讀取附屬檔案（不需要共享 Shell）；有關 UI 連結，請參閱 [總結](#wrapping-up) 部分。

## 檢查 (Inspection)

使用 `px` 讀取在 [選擇單位](#choosing-the-unit-of-analysis) 中承諾的單位上下文：

- **追蹤單位** — 將一個追蹤的輸入 → 工具呼叫 → 檢索到的上下文 → 輸出作為一個故事來閱讀。
- **Span 單位** — 閱讀一個操作的輸入/輸出以及周邊 span 的上下文。
- **對話單位** — 按順序閱讀追蹤序列；軌跡（輪次、檢索、跨追蹤的工具呼叫模式）是核心資料，而不是任何單一追蹤的輸入和輸出。

> **不要透過 `--status-code ERROR` 篩選樣本。** OTel 的 `status_code` 僅在檢測器擷取到拋出的 Python 異常（網路失敗、5xx、解析錯誤）時才會切換到 `ERROR`。幻覺、錯誤的語氣、檢索遺漏和錯誤的工具選取都會乾淨地完成，並以 `OK` 或 `UNSET` 狀態到達。為了開放編碼而按 `--status-code ERROR` 進行抽樣，會排除此工作流程旨在發現的大部分情況。

```bash
# 抽樣最近的追蹤 — 開放編碼中的檢查單位
px trace list --limit 100 --format raw --no-progress | jq '
  .[] | {trace_id: .traceId, root: .rootSpan.name, status,
         input: .rootSpan.attributes["input.value"],
         output: .rootSpan.attributes["output.value"]}
'

# 追蹤層級上下文 — 一個追蹤中的所有 span，依 start_time 排序
px trace get <trace-id> --format raw | jq '
  .spans | sort_by(.start_time) | map({span_id: .context.span_id, name, status_code,
    input: .attributes["input.value"],
    output: .attributes["output.value"]})
'

# 深入查看一個 span (不存在 px span get；請透過 span list 進行篩選)
px span list --trace-id <trace-id> --format raw --no-progress \
  | jq '.[] | select(.context.span_id == "<span-id>")'

# 在開始審查前，檢查追蹤（預設）或 span 上現有的筆記
# 筆記以 name="note" 的註釋形式儲存；請使用 --include-notes (而非 --include-annotations)
px trace list --include-notes --limit 10 --format raw --no-progress | jq '
  .[] | select((.notes // []) | length > 0)
  | {trace_id: .traceId, notes: [.notes[] | .result.explanation]}
'
# span 上的形狀相同 — 將 px trace 替換為 px span 並使用 .context.span_id
```

撰寫指令碼時，請務必配合 `--format raw --no-progress` 透過 `jq` 進行管線處理。

## 記錄筆記 (Recording Notes)

使用與在 [選擇單位](#choosing-the-unit-of-analysis) 中承諾的單位相符的 `add-note` 命令：`px trace add-note`、`px span add-note` 或 `px session add-note`。每次呼叫都攜帶明確的 `--identifier "$CODING_ANNOTATION_IDENTIFIER"` 和 `--format raw --no-progress`。

傳遞 `--identifier "$CODING_ANNOTATION_IDENTIFIER"` 有兩個作用：
- 在伺服器上使用編碼註釋識別碼標記筆記列，以便清理動作 `px <entity>-annotations delete --identifier "$CODING_ANNOTATION_IDENTIFIER" --all` 能移除此執行產生的所有成品。
- 讓呼叫在 `(entity_id, name='note', identifier)` 上執行 **更新 (upsert)** — 在同一個編碼註釋識別碼內對同一個實體重新執行開放編碼，將會覆寫先前的筆記而非附加第二列。（如果沒有 `--identifier`，伺服器會標記一個唯一的 `px-{kind}-note:<uuid>`，且每次呼叫都會附加。）

在每次成功的 `add-note` 之後，在 `$SIDECAR` 中記錄一列 JSONL。附屬檔案是軸心編碼讀取的內容 — 不需要與伺服器進行往返通訊。這是一個內容移交，而不是程式碼：請保持其可讀性、直接檢查，並使用任何方便的簡易工具。

**附屬檔案 JSONL 資料列形狀 (每次 `add-note` 一個)：**

```json
{"entity_kind":"trace","entity_id":"<trace-id>","note":"<文字>","identifier":"<原始識別碼值，未標準化>","ts":"<ISO-8601 UTC>"}
```

欄位：
- `entity_kind` — `"trace"`、`"span"` 或 `"session"` (與所使用的 `add-note` 子命令相符)
- `entity_id` — 傳遞給 `add-note` 的實體引數 (追蹤 ID、span ID 或對話 ID)
- `note` — 原封不動的 `--text` 值
- `identifier` — **原始的** `$CODING_ANNOTATION_IDENTIFIER` 值，未經標準化；標準化形式僅存在於檔名中
- `ts` — 本機附加時的 ISO-8601 UTC 時間戳記 (例如 `2026-05-08T17:14:09Z`)

如果您在同一個編碼註釋識別碼下修改同一個實體的筆記，請替換該列或附加一個較新的資料列。當存在重複的 `(entity_kind, entity_id)` 資料列時，最新的 `ts` 為目前的筆記。這與 `add-note --identifier` 的伺服器更新行為相符。

最簡追蹤範例：

```bash
px trace add-note <trace-id> \
  --text "詢問了退貨；最終答案涵蓋了運送原則" \
  --identifier "$CODING_ANNOTATION_IDENTIFIER" \
  --format raw --no-progress
```

然後使用上述資料列形狀將相符的 JSONL 資料列新增至 `$SIDECAR`。對於 span 或對話筆記，請相應地更改 `entity_kind`、`entity_id` 和 `px` 子命令。

依狀態碼進行批次自動標記（例如 `px span list --status-code ERROR | xargs ... add-note "error"`）**不是開放編碼** — 開放編碼是手動的、植基於觀察的，並且涵蓋所有失敗模式，而不僅僅是 Python 拋出異常的 span。請跳過按狀態碼批次處理的捷徑；與逐一檢查追蹤相比，它產生的筆記更少且資訊量更低。

### UI 篩選器註釋

每個接收到開放編碼筆記（或稍後的軸心編碼標籤）的實體也需要一個 UI 篩選器註釋，以便 Phoenix UI 可以按編碼註釋識別碼進行篩選。Phoenix 的 UI 篩選語言是基於名稱的，而非基於識別碼的 — UI 中沒有按 `identifier` 篩選的原語，因此 **名稱** 為常數 `coding_session_id` 且 **標籤** 為編碼註釋識別碼值的註釋，才是總結 UI 連結實際篩選的依據。

註釋名稱 `coding_session_id` 是伺服器上承載資料的鍵值，在此次重寫中 **保持不變**。此技能的工作流程術語為「編碼註釋識別碼」；伺服器鍵值保持為 `coding_session_id` 以與已寫入之資料列保持相容。

針對每個改動過的實體，在執行 `add-note` 的同時執行此操作一次（稍後軸心編碼為不同實體加上標籤時也要再次執行）：

```bash
px trace annotate <trace-id> \
  --name coding_session_id \
  --label "$CODING_ANNOTATION_IDENTIFIER" \
  --identifier "$CODING_ANNOTATION_IDENTIFIER"
# 或在相應層級執行 px span annotate / px session annotate
```

註釋的 `--identifier` 與 `$CODING_ANNOTATION_IDENTIFIER` 相符，因此 [總結刪除](#wrapping-up) 會在同一次呼叫中清理它、筆記和軸心編碼標籤。

**後備寫入路徑（單列旁白）：**

- `POST /v1/trace_notes`、`POST /v1/span_notes` 和 `POST /v1/session_notes` — 每次請求接受一個 `{data: {trace_id|span_id|session_id, note, identifier}}`；當選用的 `identifier` 欄位不為空時，會在 `(entity_id, name='note', identifier)` 上執行更新。
- `@arizeai/phoenix-client` 的 `addTraceNote`、`addSpanNote` 和 `addSessionNote` 包裝了相同的端點，並接受筆記物件上一個選用的 `identifier` 欄位。
- GraphQL 端點會以 `"Only queries are permitted."` (僅允許查詢) 拒絕異動 — 請透過 `px {trace,span,session} add-note` 或上述 REST 端點進行寫入。

## 什麼是良好的筆記

| 拙劣的筆記 | 為什麼它很拙劣 | 良好的筆記 | 為什麼它很強大 |
| -------------------- | ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| 「錯誤答案」 | 沒有可觀察的細節 | 「說商店在下午 6 點關門，但原則是晚上 9 點」 | 引用了觀察到的數值與正確的數值 |
| 「語氣不佳」 | 模糊的評判 | 「在處理企業支援工單時使用了名字稱呼」 | 指出了上下文不匹配 |
| 「幻覺」 | 觀察前先貼標籤 | 「引用了結構描述中不存在的產品功能（『自動續約』）」 | 描述了虛構的內容 |
| 「檢索問題」 | 是類別而非觀察 | 「在問題關於退貨時，檢索了關於運送的文件」 | 說明了檢索到的內容與需要的內容 |
| 「模型混淆」 | 不透明 | 「當使用者用英文撰寫時，卻用西班牙文回答」 | 可觀察且可重現 |

請寫下您看到的內容，而不是您認為它所屬的類別 — 分類發生在 [軸心編碼](axial-coding.md) 中。類似 `語氣：` 或 `事實：` 的短前綴是個人速記，而非存放庫慣例。

## 飽和度

當觀察結果不再是新發現時，請停止撰寫筆記。訊號如下：

- **重複** — 最後 10-15 個追蹤產生的筆記描述的是您已經看過的失敗。
- **轉述收斂** — 您發現自己在撰寫早期筆記的細微變體。
- **跳過多於筆記** — 大多數最近的追蹤都是正確的，不需要撰寫筆記。

達到飽和後，移動到 [軸心編碼](axial-coding.md) 來對您已有的內容進行分組。在飽和後繼續，雖然會增加追蹤數量，但不會增加洞察。您不需要為每個追蹤撰寫註釋 — 為正確的追蹤撰寫註釋會稀釋訊號。

## 列出此執行的產出

本機附屬檔案是此執行所編寫筆記的移交記錄。請直接檢查。每一列都是一則筆記記錄；如果同一個實體出現多次，請使用最新的 `ts` 作為目前的筆記。遺漏檔案時的行為：附屬檔案不存在代表此編碼註釋識別碼尚未開始開放編碼；請將其視為零筆記，而非錯誤。格式錯誤的資料列僅限於該列本身：修復或捨棄該不良資料列，而不要編輯鄰近的資料。

## 總結

執行完成後，與使用者分享 Phoenix UI 連結。該連結會根據每個筆記旁編寫的 `coding_session_id` 註釋對專案的追蹤頁面進行篩選。UI 路由 `/projects/:projectId` 預期一個編碼後的 GraphQL 節點 ID，而非專案名稱 — 請透過 `px project get` 進行解析：

```bash
project_id=$(px project get "$PHOENIX_PROJECT" --format raw --no-progress | jq -r '.id')
encoded=$(python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))' \
  "annotations['coding_session_id'].label == '$CODING_ANNOTATION_IDENTIFIER'")
echo "Phoenix UI: $PHOENIX_HOST/projects/$project_id/traces?filterCondition=$encoded"
```

如果使用者想要捨棄此執行產生的所有內容，透過三次限定識別碼的刪除動作即可處理伺服器端，並使用一次 `rm` 處理本機附屬檔案。**執行前請先與使用者確認** — 此動作具破壞性。每次呼叫都需要 `--all`（或同時具備 `--start-time` 和 `--end-time`）來授權掃空；`--identifier` 僅用於篩選，本身絕不授權。如果尚未匯出，請先設定 `PHOENIX_CLI_DANGEROUSLY_ENABLE_DELETES=true`：

```bash
for kind in trace span session; do
  px "$kind-annotations" delete \
    --identifier "$CODING_ANNOTATION_IDENTIFIER" \
    --all -y \
    --format raw --no-progress
done
rm -f "$SIDECAR" ".px/coding/${SLUG}-axial.jsonl"
```

每次 `px <entity>-annotations delete` 呼叫都會在同一次動作中涵蓋筆記、結構化註釋和 `coding_session_id` 註釋，因為它們共用底層的註釋表格。

## 原則

- **每次執行一個編碼註釋識別碼** — 每個伺服器成品和每個附屬檔案資料列都攜帶相同的 `$CODING_ANNOTATION_IDENTIFIER`；切勿鑄造各階段獨立的 ID。
- **明確傳遞 `--identifier`** — 每次 `px` 呼叫都會獲得 `--identifier "$CODING_ANNOTATION_IDENTIFIER"`；不要依賴導向裝置所衍生之子 Shell 中繼承的環境變數。
- **附屬檔案是筆記的移交記錄** — 軸心編碼從本機附屬檔案讀取，而非從伺服器讀取；如果一個實體出現多次，最新的 `ts` 勝出。
- **自由格式優於結構化** — 開放編碼期間不要預先承諾分類法；類別在軸心編碼中產生。
- **具體優於一般** — 引用或轉述觀察到的失敗；模糊的標籤（「不良回應」）不帶有訊號。
- **標記前先看上下文** — 撰寫任何筆記前，請檢查輸入、輸出和檢索到的上下文。
- **分類前先反覆執行** — 先處理完整的樣本；在收集時抵制進行分組的誘惑。
- **跳過是有效的** — 正確的 span 不需要筆記；為所有內容加上註釋會稀釋訊號。
- **還原是選擇性的** — 總結刪除僅在使用者明確確認後才執行；預設路徑為列印 UI 連結並停止。
