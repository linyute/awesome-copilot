# Ponder 協定 - 指令、JSON 結構、裁決規則

所有這一切的權威來源是 `~/code/ponder/SPEC.md`。此檔案為作業參考：
鍵入什麼內容、傳遞什麼給它、傳回什麼結果。當本檔案與 SPEC.md 不一致時，以 SPEC.md 為準。

## 呼叫

`bin/ponder` 是一個 POSIX `sh` shim，用於執行 `node lib/cli.js`。將其放入 PATH 一次：

```sh
ln -s ~/code/ponder/bin/ponder ~/.local/bin/ponder    # ~/.local/bin 已在 PATH 中
```

每個指令均接受：

| 旗標 | 意義 |
|---|---|
| `--session <slug>` | 要操作的會話。預設為目前專案中最近碰過的**開啟中**會話。 |
| `--json` | 於 stdout 輸出機器可讀取的內容。每當您要剖析結果時使用。 |
| `--help` | 該指令的使用方法。同 `ponder help <command>`。 |

結束代碼：`0` 成功，`1` 使用者錯誤（錯誤旗標、缺少檔案、格式錯誤的 JSON、引擎拒絕的
delta），`2` 狀態機違規（錯誤階段、在 `blocked` 裁決下執行 `decide stop`，或狀態無法
與帳本對帳）。

**每個指令均以 `NEXT:` 行結尾**，指明您目前應履行的階段以及滿足該階段的字面指令。該行
即是驅動代理人的引擎，並且是在上下文壓縮後得以存留的內容。

## 狀態佈局

會話位於 `<project>/.ponder/<slug>/`，當專案路徑不可寫入時退回至 `~/.ponder/<slug>/`。
哪個目錄是 `<project>` - 以及由何決定 - 詳見
[`ponder start`](#ponder-start-subject---lens-lens)；它每次都會列印出來，且會話中的每個
相對路徑皆相對於它解析。

```
.ponder/<slug>/
  session.json          身分、設定、狀態、pass 歷史
  units.json            盤點清單
  findings.json         即時發現項目集 - 目前真實情況
  ledger.jsonl          僅供附加；歷來套用的每個 delta，永久保存
  passes/NN/
    predict.json        此 pass 的預測，在作業前寫入
    deliberation.json   四個視角的論點
    deltas.jsonl        此 pass 所套用的 delta
    metrics.json        計算出的收斂訊號
    verdict.json        引擎建議 + 代理人決策 + 理由
  report.md             由 `ponder report` 寫入
  oca.log               每次 OCA 橋接失敗記錄，僅供除錯
```

從未從 `findings.json` 或 `ledger.jsonl` 中刪除任何內容。`delete` delta 會設定
`status: "retracted"`。撤回是一種狀態，而非抹除 - 後續 pass 必須能夠看見並反轉先前 pass
所刪除的內容。

**`ledger.jsonl` 每次都在狀態檔案之前寫入**。`units.json`、`findings.json` 與
`passes/NN/deltas.jsonl` 是它的檢視表，指令中途崩潰只會讓帳本領先於它自己的檢視表 -
而 `ponder verify --repair` 會確定性地重新建構。請參閱
[帳本即是權威](#帳本即是權威)。

## 階段狀態機

`session.phase` 指定您下一步應履行的內容。無序到達的指令會以結束代碼 `2` 退出並指出
預期的階段。

```
predict → survey → appraise → deliberate → revise → judge → decide → (next pass) predict
```

| 階段 | Pass 1 | Pass 2+ |
|---|---|---|
| predict | `ponder predict` | `ponder predict` |
| survey | `ponder units` | 自動略過；以 `unit-add` / `unit-edit` / `unit-delete` delta 進行修正 |
| appraise | `ponder grade` | `ponder delta`（同一呼叫滿足 revise） |
| deliberate | `ponder deliberate`（或 `--skip --why`） | 相同 |
| revise | `ponder delta` | 由 appraise 呼叫滿足 |
| judge | `ponder judge` | 相同 |
| decide | `ponder decide` | 相同 |

因此指令序列在 pass 1 為 **predict → units → grade → deliberate → delta → judge → decide**，
而在之後的每個 pass 為 **predict → deliberate → delta → judge → decide**。

## 指令

### `ponder start "<subject>" --lens <lens>`

```sh
ponder start "the UI" --lens ui --max-passes 6 --min-passes 2
ponder start "our error handling" --lens custom --rubric ./rubrics/errors.md --slug errors-aug
```

| 旗標 | 預設值 | 意義 |
|---|---|---|
| `--lens <name>` | 必要 | `ui`、`architecture`、`docs`、`tests`、`product`、`copy`、`custom` |
| `--rubric <file>` | - | 與 `--lens custom` 一起使用時為必要；任何符合透鏡 front-matter 格式的檔案 |
| `--project <path>` | 已解析（下方說明） | 會話中每個相對路徑解析所依據的根目錄，以及 `.ponder/` 的根目錄所在 |
| `--slug <slug>` | `<subject-slug>-<date>` | 會話 ID。衍生自*主旨*而非透鏡，並去除開頭停用詞：`"the UI"` → `ui-2026-08-24`，`"our error handling"` → `error-handling-2026-08-24`。碰撞會加上 `-2` 後綴；已存在之明確指定 `--slug` 會以代碼 `1` 退出 |
| `--max-passes N` | 6 | 達到時產生原因為 `budget` 的 `stop`，永不為 `converged` |
| `--min-passes N` | 2 | 低於此值時，`judge` 始終建議 `continue` |

Ponder 只有一種模式。它進行審議並產出計畫；`ponder apply` 是一個獨立、明確的步驟，
會輸出有序的工作計畫，並且依然絕不修改您的原始碼。

**專案根目錄，以及為何 `project` 行值得閱讀。** 會話中的每個相對路徑 - 每個單元的
`path`、每個發現項目的 `evidence` 錨點、每個針對錨點檢查的虛構主張 - 均自
`session.project` 解析。在沒有 `--project`
的情況下，引擎會從工作目錄向上尋找：首先尋找專案標記（`.git`、
`.hg`、`.svn`、`package.json`、`go.mod`、`Cargo.toml`、`pyproject.toml`、`deno.json(c)`、
`Gemfile`、`pom.xml`、`build.gradle(.kts)`、`composer.json`、`mix.exs`、`*.xcodeproj`、
`*.xcworkspace`）- 最近的相符項即是根目錄，毫無懸念 -
且僅在您上方完全沒有標記時， 再次尋找現有的 `.ponder`
以供採用。兩者皆無時，退回工作目錄。`.ponder` 絕不與標記競爭： 它是存放會話之處，而非定義專案的依據。

`start` 會列印出答案以及由何決定，且 `session.json` 會在 `projectFrom` 中記錄它
（`how`：`explicit` | `marker` | `ponder` | `cwd`）：

```
  project   /abs/path/app  (cwd is /abs/path/app/src; matched .git)
  store     /abs/path/app/.ponder/ui-2026-08-24
```

來自 `--project` 或標記的根目錄是**已確立的**；從 `.ponder` 採用或退回獲得的
則是**推測的**，且 `start` 和 `status` 會在發生時發出警告。推測的根目錄無法證明不存在，
因此在推測根目錄下的虛構主張會被拒絕（請參閱 `ponder delta`）。若列印的根目錄不是
軟體所在位置，請在進行作業前使用 `--project <path>` 重新啟動。

建立會話並列印 **Prior pondering** - 從 OCA
的 `episodic_memory`
讀取最多五個針對類似主旨的早期深思片段。請閱讀它們；那是上次會話結束之處。沒有 OCA、沒有該節區，則無妨。

### `ponder predict --churn <0-1> --claim "<one line>"`

```sh
ponder predict --churn 0.35 --claim "Pass 1 over-graded polish and never opened the error paths."
```

在您檢視任何內容之前寫入。`--churn` 是您對此 pass 之 `churn`
指標（deltas ÷ 即時發現項目） 的估計，`--claim` 是一行關於該
pass 將會發現什麼的主張。在 `judge` 階段評分為 `surprise =
|predicted - actual|`。故意壓低或高估會破壞唯一能說明您是否已掌握主旨的訊號。

**`--churn` 驗證需為 0 ≤ n ≤ 1，超出範圍則以代碼 `1`
退出。** 在 pass 1 中該數值影響不大：因為沒有先前的 pass，引擎不會回報
churn 也不會計算 surprise 分數。但仍請寫下誠實的猜測 -
`--claim` 是傳承下來的部分，且這對組合會記錄在
`passes/01/predict.json` 與 `report.md` 中。評分從
pass 2 開始，此時存在 `churn` 且 `surprise` 是與其之間的距離。 `--claim` 為必要項目且不得為空 - 未陳述的預期無法評分。

### `ponder units --file <units.json>` / `--stdin`

僅限 Pass 1。後續 pass 會透過 `unit-add`、`unit-edit` 與 `unit-delete` delta 來修正盤點清單 -
新增調查所遺漏的內容、更正錯誤的內容、移除超出範圍的內容。

盤點清單也會寫入帳本中，作為單一 `unit-seed`
記錄，按順序攜帶每個單元 ID 以及儲存的每個單元主體。
這使得涵蓋率分母具有可稽核性：未入帳的盤點清單是純憑信任的分母。`unit-seed`
是種子，而非 delta - 它被排除在每個收斂比率和 delta 計數之外，完全就像 `grade` 種子一樣。

### `ponder grade --file <findings.json>` / `--stdin`

僅限 Pass 1。為發現項目集植入種子。每個植入種子的發現項目均以帶有
`source: "grade"` 的 `add` 寫入帳本，
因此帳本保留了每次建立 -
抖動偵測器將這些建立值視為各欄位的第一個設定。但它們被排除在每個比率之外： 種子是
pass 所建立的內容，而不是它所變更的內容，將其計為變動過去曾使 pass 1
的數字逼近上限。 `metrics.json` 將計數分別回報為
`deltas.seeded`。來自評分的 add 也被排除在抖動的
killed-add 規則之外， 因此 pass 2 刪除 pass 1 的雜訊被解讀為懷疑論者（Skeptic）在發揮作用，而非迴圈在震盪。植入種子的發現項目可以攜帶自己的 `why`，這會成為該帳本項目的理由。

### `ponder deliberate --file <deliberation.json>` / `--stdin`

```sh
ponder deliberate --file .ponder/tmp/deliberation-2.json
ponder deliberate --skip --why "Pass 4 was a two-unit re-check; nothing to argue about."
```

`--skip` 是合法的，並會針對會話記錄為 `deliberation_skipped` 元認知觀察。它會顯示在
`report.md` 中。

### `ponder delta --file <deltas.jsonl>` / `--stdin`

按檔案順序套用 pass 的修訂版，**全部成功或全部失敗**：第 40
行有一行不良內容代表整批均不套用，且所有問題都會連同其行號一併列出。每個 delta
都需要非空的 `why` 與 `perspective`。 `unit-add`
必須位於任何指名其所建立單元的 `add` 之上，並位於任何以此單元為目標的
`unit-edit` 或 `unit-delete` 之上 - 盤點清單是隨檔案讀取而建構的，因此反向順序會以 `unknown unit "…"` 失敗。

`--file` 亦接受 delta 物件的 JSON 陣列，而不僅僅是 JSONL。空白行會被略過。

### `ponder judge`

計算目前 pass 的指標，寫入
`passes/NN/metrics.json`，納入任何未解決的 OCA
元認知觀察作為轉向 `escalate` 的決勝條件，並列印建議。僅為建議 - 在 `decide` 之前不會認可任何內容。

### `ponder decide <continue|stop|escalate> --why "<reason>"`

認可您的判定、關閉該 pass，並開啟下一個 pass（或在 `stop` 時關閉會話）。

- 每個決策都需要 `--why`，無論是否覆寫。它會寫入
`verdict.json`，且若有覆寫，會永久呈現在 `report.md` 的
**Overrides** 底下。 - 您可以覆寫建議，**例外**：每當涵蓋率低於 1.0
時，`stop` 會退出代碼 `2` 並列印未評分的單元。
沒有可用於此的旗標。請注意門禁實際讀取的內容 - 不是磁碟上的裁決標籤，而是決策時從
`units.json` 和 `findings.json`
重新計算的涵蓋率，因此過期或手動編輯的 `metrics.json` /
`verdict.json` 不會改變任何事情。在被阻擋時執行 `escalate`
是合法的，並會警告在會話停止前涵蓋率仍必須達到 1.0。 - 覆寫需要至少 12 個字元的
`--why`。 - 當 `voices < 3` 時執行 `stop`
會發出警告並繼續，指明在該 pass 的審議中實際發言的視角。略過審議的 pass
沒有聽取任何人的聲音，因此它總是會發出警告。 - 僅有原因為 `converged` 的 `stop` 會將會話關閉為 `converged`；所有其他停止 - `budget`、`perseveration`、 覆寫 - 會將其關閉為 `stopped`，且 `report.md` 會註明是哪一種。

### `ponder status`

您所在的位置以及您當前應履行的內容：會話身分、pass
編號、階段、單元與發現項目計數、最後的裁決 + 決策 +
理由、專案根目錄及其決定依據，以及未評分的單元清單（若存在）。`--json`
可取得可剖析的相同內容。 **這是恢復執行的指令。**
在對您個人十分鐘前並未親自啟動的會話得出任何結論之前，請先執行它 -
並且在執行時順便閱讀 `project` 行：根目錄為推測的會話一直在針對一個無人選擇的目錄解析其中的每個路徑，它會說明這一點。

### `ponder verify [--repair]`

從第 1 行重播 `ledger.jsonl`，衍生這些記錄必然產生的狀態，並將其與
`units.json` 和 `findings.json` 實際包含的內容進行比較 -
然後將帳本與每個 pass 的 `deltas.jsonl`
檔案進行比較，後者是第二次寫入的相同記錄。 當會話對帳成功時退出 `0` 並給出摘要；當會話無法對帳時退出 `2` 並給出完整診斷。

```
ponder verify - ui-2026-08-24
  ledger    41 records - 1 unit-seed, 24 add, 1 unit-add, 2 unit-edit, 1 unit-delete
  passes    41 of those records also in the per-pass delta files, across 4 pass directories
  units     12 in units.json, 12 derived from the ledger
  findings  29 in findings.json, 29 derived from the ledger
  result    reconciles - every unit and every finding is accounted for by a ledger record
```

**在您未親自啟動的任何會話上，以及在任何中斷之後，請先執行它**。沒有
`--repair` 時它絕不寫入任何內容， 且不獲取任何鎖定 -
這是唯一鎖定取決於旗標的指令。完整機制 -
對帳什麼內容、`--repair` 重建什麼以及拒絕什麼 - 請參閱下方的[帳本即是權威](#帳本即是權威)。

`--json` 攜帶 `divergences`、`ledgerProblems`、`unionProblems`、`ledgerSkipped`、`repaired`、
`rebuilt`、`unrepairable` 與 `counts`，失敗會傳回通常的
`{ "ok": false, "error", "detail", "code": 2, "next" }`。

### `ponder report [--out <path>]`

從目前狀態重新產生可讀取的摘要，順序如下：**Convergence**、**Overrides**、
**Prediction vs reality**、**Coverage**（底下帶有
**Corrected <units>** 與 **Phantom units**）、 依單元分組的
**Findings**、**Retracted**、逐個 pass 的
**Deliberation** 以及完整的 **Ledger**。 在迴圈中途執行是安全的。
`--out` 會將其重導向：報告寫入該路徑**而不是**
`.ponder/<slug>/report.md`，並非同時寫入兩處， 因此若您希望會話自己的複本也重新整理，請先單獨執行 `ponder report`。無論哪種方式，指令都會列印它寫入的位置。

### `ponder apply [--dry-run] [--severity must,should]`

獨立且明確；絕不是 pass 的一部分。選取處於或高於給定嚴重性（預設為 `must`）之
`status: open` 發現項目，
並輸出依單元分組的有序工作計畫，附帶佐證路徑與建議。`--dry-run` 會列印它且不碰任何東西。沒有
`--dry-run` 時， 它會列印、寫入 `apply-plan.md`、將會話標記為
`applied` - 終端狀態 - 並記錄 OCA 情節項目。 **在會話仍開啟的情況下，沒有
`--dry-run` 時它會拒絕（代碼 `2`）**，因此它無法在您背後偷偷關閉深思，且
**在中止的會話上無論如何它都會拒絕（代碼 `2`）** （`session <slug> was
aborted; there is no plan to apply.`）- 在迴圈中途放棄的深思具有無人最終審辯的發現項目， 絕不能夠悄悄變成已套用的會話。**Ponder 絕不編輯主旨的原始碼。** 它交給您一份計畫；由您來完成工作。

### `ponder list` / `ponder abort --why "<reason>"` / `ponder doctor` / `ponder version` / `ponder help`

`list` 顯示兩處儲存庫從此處可見的每個會話 - 此專案的
`.ponder/` 與 `~/.ponder/` 備用儲存庫 - 附帶
slug、
狀態、pass、階段、涵蓋率、透鏡與主旨，並列印它搜尋的儲存庫根目錄。它不帶引數；用它來找回您忘記的
slug。 `abort` 會以永久理由將會話關閉為 `aborted` -
當主旨於內部發生變更時使用它，而非靜默地重新界定開啟中會話的範圍。
`doctor` 列印 node 版本、`psql` 存在性、它將使用的
DSN、OCA
是否可連線、狀態將寫入何處、它從此處解析的專案根目錄及其決定因素，**以及它能看到的每個會話是否與其自身的帳本對帳**
- 未對帳的會話會列在 **Problems** 底下，並附帶診斷它的
`ponder verify --session <slug>`。從祖先
`.ponder` 採用而非由專案標記確立的專案根目錄也是一個 **Problem**， 在此目錄或在它能看見的任何會話中：在這種組態下，無法解析的路徑毫無意義，在您信任它之前值得先了解。在不熟悉的測試控管環境中請先執行它。

`ponder version` - 或 `ponder --version` -
列印引擎版本（`ponder 1.0.0`）而無其他內容；`--json`
會將其包裝在通常的封套中作為 `version`。 `ponder help`
列出每個指令及其用法說明行；`ponder help <command>`
列印單一指令說明，且 `--help` 可作為任何指令的旗標。 引擎所能做的一切都可以從這兩者中發現 - 一個可以執行但無處記錄的指令，是一個無人能夠找到的指令。

## 檔案結構

### `units.json`

```json
{
  "version": 1,
  "lens": "ui",
  "units": [
    { "id": "screen.settings.billing",
      "label": "Settings → Billing",
      "path": "src/routes/settings/billing.tsx",
      "kind": "screen",
      "meta": { "route": "/settings/billing" } }
  ]
}
```

`id` 為必要、唯一、小寫點分隔的 slug，且是**任何東西都無法變更的唯一欄位**
-
它是發現項目的結合鍵，因此移動它會使依附於該單元的每個發現項目變成孤立項目。嘗試變更它的
`unit-edit` 會被拒絕，結束代碼 `1`。`path` 是選填的，但強烈建議填寫：它是佐證錨點，且是讓引擎檢查虛構主張的依據。`addedInPass` 由引擎蓋上戳記。

`label`、`path`、`kind` 與 `meta` 都可以由後續 pass 透過 `unit-edit`
delta 進行更正 - 詳見下方。已離開盤點清單的單元還帶有
`removedInPass`、`removalKind`（`appraised` |
`removed-ungraded` | `phantom`），且在 phantom 上帶有 `phantomVerification` 與 `phantomPath`。所有這些都是引擎戳記的，且都會與帳本進行對帳。

### `findings.json`（`ponder grade` 所接受的內容）

```json
{
  "version": 1,
  "findings": [
    { "unit": "screen.settings.billing",
      "title": "Empty state is a bare 'No invoices' string",
      "detail": "No illustration, no explanation of when invoices appear, no primary action.",
      "dimension": "empty-states",
      "score": 2,
      "severity": "must",
      "confidence": 0.8,
      "effort": "s",
      "evidence": ["src/routes/settings/billing.tsx:88-94"],
      "recommendation": "Add an empty state with cause, expectation and a primary action." }
  ]
}
```

| 欄位 | 值 | 說明 |
|---|---|---|
| `unit` | 單元 `id` | 必須存在於盤點清單中 |
| `dimension` | 該透鏡的維度之一 | 驅動重複項目偵測與反轉偵測 |
| `score` | 整數 1-5 | 1 損毀，3 可接受，5 典範；透鏡定義各階 |
| `severity` | `must` \| `should` \| `could` \| `note` | |
| `confidence` | 0-1 | 低於 0.5 為假說而非結論 |
| `effort` | `xs` \| `s` \| `m` \| `l` \| `xl` | |
| `evidence` | `path:line-line` 的陣列 | 使發現項目具可審辯性而非僅憑意見的要素 |
| `status` | `open` \| `resolved` \| `retracted` \| `deferred` | 引擎管理；起始為 `open` |

引擎會指派
`id`（`f-NNNN`，永不重複使用）、`status`、`createdInPass`、`lastTouchedPass` 與 `history`。請勿傳遞它們。

### `deliberation.json`

```json
{
  "question": "Does the pass-1 finding set survive a second reading of the code?",
  "skeptic": { "argument": "…", "confidence": 0.85 },
  "builder": { "argument": "…", "confidence": 0.7 },
  "dreamer": { "argument": "…", "confidence": 0.75 },
  "empath":  { "argument": "…", "confidence": 0.7 }
}
```

四個鍵及其 `argument` / `confidence` 一對一對應至 OCA
`deliberations`
資料行（`skeptic_argument`、`skeptic_confidence`，…），這就是為什麼要寫成這種結構的原因。`argument`
必須是非空字串；`confidence` 為選填，若存在必須為
0-1。接受少於四個鍵，且 `deliberate` 會警告哪些聲音處於沉默 -
這些正是此 pass 之 `voices` 中所缺少的聲音，因此包含兩個鍵的檔案在 `decide stop` 時會再次發出警告。

另外兩種結構亦受容許且代表相同意義 - `{"perspectives": {"skeptic": {…},
…}}` 以及一個 `{"perspective": "skeptic", "argument": …}`
項目的陣列。引擎本身的錯誤訊息推薦使用 `perspectives` 包裝函式，因此不要對其感到驚訝；上面的扁平形式即可。

`question` 是選填的。它儲存在 `passes/NN/deliberation.json`
中且不會進一步傳遞 - `deliberations` 列的 `decision`
資料行是橋接器合成的字串（`ponder <slug> pass N: revise the finding
set for "<subject>"`），而非您的問題。此 pass 的 delta 摘要成為
`resolution`，且 `resolution_method = 'ponder-pass'` - 在 ponder 中，執行控制綜合*即是*修訂階段。

### `deltas.jsonl` 與 `ledger.jsonl`

每行一個 JSON 物件。您提供
`op`、`perspective`、`why` 以及 op 的負載；引擎蓋上 `pass` 與 `at` 戳記。

```
{"op":"delete","target":"f-0012","perspective":"skeptic","why":"Duplicate of f-0004."}
{"op":"add","perspective":"dreamer","why":"No pass had looked at loading states as a set.","finding":{"unit":"screen.dashboard","title":"…","detail":"…","dimension":"loading-states","score":2,"severity":"should","confidence":0.7,"effort":"s","evidence":["src/routes/dashboard.tsx:20-31"],"recommendation":"…"}}
{"op":"edit","target":"f-0007","perspective":"builder","why":"Recommendation was not actionable.","set":{"recommendation":"…"}}
{"op":"change","target":"f-0009","perspective":"empath","why":"Blocks first-run, outranks polish.","set":{"severity":"must","score":2}}
{"op":"unit-add","perspective":"dreamer","why":"Route was missed in pass 1.","unit":{"id":"screen.invite.accept","label":"Invite → Accept","path":"src/routes/invite/accept.tsx","kind":"screen","meta":{"route":"/invite/:token"}}}
{"op":"unit-edit","target":"screen.settings.billing","perspective":"builder","why":"Route changed in recent refactor.","set":{"path":"src/routes/billing/index.tsx","meta":{"route":"/billing"}}}
{"op":"unit-delete","target":"screen.old.profile","perspective":"skeptic","why":"Route removed in v2.","phantom":true}
```

七個 op。四個用於修訂發現項目集，三個用於修正盤點清單。

| Op | 攜帶內容 | 擁有者 | 用途 |
|---|---|---|---|
| `add` | `finding`（整個發現項目物件，無 `id`） | 夢想家（Dreamer） | 無人涵蓋到的領域 |
| `edit` | `set`（部分發現項目） | 建構者（Builder） | 散文與佐證 - `title`、`detail`、`recommendation`、`evidence` |
| `change` | `set`（部分發現項目） | 同理者（Empath） | 評分 - `score`、`severity`、`confidence`、`effort`、`status` |
| `delete` | `target` | 懷疑論者（Skeptic） | 無依據、重複或錯誤。設定 `status: "retracted"` |
| `unit-add` | `unit` | 任何 | 盤點清單修正。**在單元評分前將涵蓋率降至 1.0 以下** |
| `unit-edit` | `target`（單元 ID）+ `set`（部分單元） | 任何 | 原地更正單元 - `label`、`path`、`kind`、`meta`。**絕不觸碰涵蓋率** - 見下方 |
| `unit-delete` | `target`（單元 ID），選填 `phantom` | 任何 | 盤點清單修正。對涵蓋率的成本完全取決於該單元是否曾被評分 - 見下方 |

引擎不強制規定哪些欄位搭配哪個 op，但當 `change`
僅編輯散文時一致性套件會發出警告 -
這向抖動偵測器隱瞞了重新評分。`delete`
是針對錯誤的發現項目，而非不重要的項目；不重要是針對 `severity` 的 `change`，或 `status: "deferred"`。

### `unit-edit` - 原地修正單元

單元的 `label` 是盤點清單上的標題，而標題容易過期。Pass 1 寫下
`"Billing - both links 404"`；pass 3
開啟檔案發現其中一個連結可解析，並重寫底下的發現項目。若無
`unit-edit` 標題會永遠顯示 404，且 `report.md` 會呈現與其底下發現項目相矛盾的標題。

```json
{"op":"unit-edit","target":"screen.marketing.footer","perspective":"builder",
 "why":"Pass 1's label said both links 404; the finding under it now says the opposite, and says it correctly.",
 "set":{"label":"Marketing footer - /privacy-policy resolves","meta":{"route":"/"}}}
```

（此處為便於閱讀而換行。在檔案中它與每個其他 delta 一樣，是單一行上的單一物件。）

| 欄位 | 規則 |
|---|---|
| `target` | **即時運作中**的單元 ID。未知單元 → 拒絕。已被移除的單元 → 拒絕：*"已離開盤點清單的單元不能原地編輯恢復，而是重新新增"* |
| `set` | 非空物件。可設定 `label`、`path`、`kind`、`meta` - 無其他欄位。未知的欄位會依名稱拒絕：`"note" is not a settable unit field (label, path, kind, meta)` |
| `set.id` | **一律拒絕，結束代碼 `1`**，依名稱明確拒絕而非當作未知欄位。ID 是 `units.json` 與 `findings.json` 之間的結合鍵；移動它會使依附於該單元的每個發現項目孤立。若 ID 本身有誤，請使用 `unit-delete` 刪除它並使用 `unit-add` 新增更正後的單元，並承擔涵蓋率成本 |
| `why` | 如同每個 delta，為必要且非空 |

數值規則：`label` 必須是非空字串。`path` 與
`kind` 接受非空字串或
`null`（清除路徑會清除錨點，但不會清除錨點的*歷史記錄* - 見下方的虛構規則）。`meta` 必須是物件。

**`meta` 依鍵逐一合併。** 所有其他欄位直接覆蓋替換。在 meta 為
`{"route":"/billing","state":"empty"}` 的單元上更正
`{"route":"/settings/billing"}` 會保留原有的
`state` - 修正路由絕不能靜默抹除旁邊的狀態標記。重播會套用相同的合併，因此帳本衍生出位元組完全相同的狀態。

其代價：

- **涵蓋率：無成本。** `unit-edit`
既非新增亦非移除，因此分子與分母完全保持原狀。這就是它存在的全部理由：使用
`unit-delete` + `unit-add`
來修正標題會使涵蓋率降至 1.0
以下並阻擋停止，這會將錯誤標題變成重新開啟的會話。 -
**變動率：計入。** 它是一個修訂 delta。它進入帳本，計入
`churn`，並參與抖動偵測 - 在 pass 2 移動並在 pass 3
放回的標籤是一個
`field-revert`，就像來回切換嚴重性一樣。反轉是根據*有效*值判斷的，因此修改不同
`meta` 鍵的兩次編輯不會被誤判為反轉。 - **記錄：永久。** 每個
`unit-edit` 都會出現在 `report.md` 的
**Corrected <units>** 底下，附帶其
pass、視角、各欄位新值及其 `why` - 與移除所獲得的待遇相同。在 `units.json` 中手動編輯但背後沒有帳本記錄的標籤屬於分歧，每個決策點指令在對帳之前都會拒絕該會話 - 而 `verify --repair` 會透過放回帳本數值來達成對帳。手動編輯會失效；這就是設計本身。

### `unit-delete` 與虛構規則

`unit-delete`
是唯一可以縮短未評分清單的作業，這使其成為繞過涵蓋率閘門的唯一顯著途徑：列舉十二個畫面，
檢視十一個，刪除第十二個。引擎阻斷了這條途徑。三種結果，由引擎決定，而非由您決定：

| 該單元 | `phantom` | 發生結果 |
|---|---|---|
| 攜帶至少一個發現項目（被撤回的也算 - 撤回判定並不會抹消看過的事實） | 省略 | **`appraised`** 移除。誠實的範圍變更：它離開盤點清單*以及*涵蓋率分母 |
| 從未評分 | 省略 | **`removed-ungraded`**。它離開盤點清單但**保留在涵蓋率分母中**，仍列為未評分。涵蓋率不變動且閘門不開啟 |
| 從未評分 | `true` | **`phantom`**，一旦引擎檢查該主張屬實。然後它離開分母 |

虛構（`phantom`）主張會針對**該單元曾攜帶的每個路徑**進行檢查，而不僅僅是目前
`units.json` 所持有的路徑：來自其 `unit-seed` 或
`unit-add` 帳本記錄的原始路徑，加上此後任何 `unit-edit`
設定的每個值，加上目前的值 - 從專案根目錄解析、去重，並包括在*同一個* delta 批次中稍早設定的路徑。

這並非多此一舉。`unit-edit` 可以移動
`path`，
因此僅針對目前數值檢查的主張將成為通過涵蓋率閘門的兩步捷徑：將真實單元指向不存在的檔案名稱，
然後聲稱該單元從未存在，讓引擎驗證其缺失。只要有一條路徑存在，該主張即告瓦解。

| 該單元的路徑 | 結果 |
|---|---|
| **任一**路徑存在 | **整批被拒絕，退出代碼 `1`。** 訊息指出找到的路徑及其來源：`unit "<id>" is claimed phantom, but a path it has carried exists: <abs> (set by a unit-edit in pass 3). Something you can open is not something pass 1 imagined. A phantom claim is checked against every path the unit has ever had, so editing the path first does not clear it.` |
| 恰好一條，從未編輯，且其不存在 | 接受 · `verified-missing`，記錄檢查過的絕對路徑 |
| 路徑曾被編輯且無任何版本存在 | 接受 · **`unverified`，永不為 `verified-missing`。** 每個版本都檢查過且皆缺失，但引擎不會針對已移動的目標證明其不存在。帳本記錄攜帶 `pathsChecked`，且 `ponder delta` 與 `report.md` 都會註明這一點 |
| 單元從未有路徑 | 接受 · `unverified` - 完全無法進行任何檢查 |

這些資料列描述了引擎確定的根目錄：`--project`，或是由專案標記所確立的根目錄。在**推測**的根目錄下
- 採用的祖先 `.ponder`，或工作目錄退回（請參閱 `ponder start`）-
具有路徑但無一路徑可解析的單元會被拒絕，退出代碼 `1`，並指明根目錄與
`--project`：`none of the 2 paths it has carried …
resolves under <root> - but that project root was
guessed, not established`。沒有進行實質檢查，而在錯誤目錄中遺失的檔案並不等於從未存在過的畫面。從未有過路徑的單元不受影響。

因此編輯路徑絕不是*強化*虛構主張的方法。它充其量讓主張停留在與
完全沒有路徑完全相同的水準；在最壞的情況下它會被直接拒絕。

亦會被拒絕的情況：在帶有發現項目的單元上標記 `"phantom": true`（`it cannot
also be a unit that never existed`）、`unit-delete` 以外之任何
op 上的 `phantom`、非布林值的 `phantom`，以及在已移除單元上的第二次
`unit-delete` - 但有一個例外，那就是在您親自查核之後，將 `removed-ungraded` 單元升級為已檢查的虛構主張。

每個被接受的 phantom 都會永久記錄在 `report.md`
的 **Phantom units** 底下，引用其驗證狀態與您的
`why` -
且兩種未驗證的情形在那裡的寫法不同，因為它們是不同的主張：*"此單元沒有路徑，因此無法檢查任何內容"*
相對於
*"此單元的路徑曾被編輯，因此已檢查其每個版本且均未找到，但引擎不會對已移動的目標證明其不存在。"*
在未評分狀態下刪除的單元也會在它從未離開的 **Ungraded** 清單中被指名。這就是規則：您可以縮小主旨範圍，而縮小範圍將永遠被記錄在案。

**`phantom`
代表路徑不存在。它並不代表您失去了耐心。** 引擎只有在有路徑可供檢查時才能發現謊言；未驗證的情況全憑您的誠信。

### `metrics.json`、`verdict.json` 與 `judge --json`

`ponder judge --json` 列印一個封套。每個指令的 `--json`
都有相同的外層結構 -
`ok`、`command`、`session`、指令本身的負載、`warnings`、`next` - 且沒有其他內容到達 stdout，包括警告，警告會移入 `warnings` 陣列：

```json
{ "ok": true, "command": "judge", "session": "ui-2026-08-24",
  "metrics": { "…": "the metrics.json object, inline" },
  "verdict": "blocked", "reason": "coverage",
  "message": "1 of 12 screen has never been graded. Stopping is not permitted.",
  "ungraded": ["screen.invite.accept"],
  "observations": [],
  "warnings": [],
  "next": { "phase": "decide", "command": "ponder decide continue --why "<reason>" …" } }
```

失敗時封套為 `{ "ok": false, "error",
"detail", "code", "next" }` 且處理程序以 `code` 退出。

`metrics.json`
鍵：`version`、`pass`、`at`、八個訊號（`coverage`、`novelty`、`churn`、`thrash`、`surprise`、`stall`、`confidenceFloor`、`voices`），加上
`voiceNames`、`deliberationSkipped`、`deltaVoices`、`deltaVoiceNames`、`predictedChurn`、`claim`、`units`（`enumerated`、
`graded`、`removed`、`removedUngraded`、`phantom`）、`ungraded`、`removedUngraded`、`phantoms`、`findings`
計數、`deltas`（`total`、`byOp`、`seeded`、`revisions`）、`reversals`（每個反轉 delta
的註記）、`shakyMustFindings`、`minPasses`、`maxPasses`。數字四捨五入至小數點後四位，因此 `judge`
列印的表格（兩位小數）與檔案在最後一位數字上會有所出入 - 以檔案為準。在 pass 1 中，`novelty`、`churn`、`thrash`
與 `surprise` 為 `null` 而非 `0`。

`verdict.json`
鍵：`version`、`pass`、`verdict`、`reason`、`rule`、`message`、`notes`、`ungraded`、`signals`（複製的八個訊號，加上
`deltaVoices`）、`removedUngraded`、`phantoms`、`decision`、`why`、`decidedAt`。`decision`、`why` 與 `decidedAt` 起始為 `null`，並由 `decide` 填入。

`reason` 是一個穩定的標籤，而非散文 - 為
`coverage`、`min-passes`、`thrash`、`perseveration`、`low-confidence`、`converged`、`budget`、`oca-observations`、`default`
之一。人類可讀的句子位於 `message` 中。

## 帳本即是權威

所有上述規則管理狀態檔案*應該*包含的內容。但狀態檔案並非權威 -
`.ponder/<slug>/ledger.jsonl`
才是權威，且每當有指令需要做出決策時，狀態檔案**不被信任，而是被重新計算**。

**對帳** 從第 1 行重播
`ledger.jsonl`，衍生這些記錄必然產生的狀態，並進行比較：

| 文件 | 對帳項目 |
|---|---|
| `findings.json` | 存在哪些 ID；以及每個發現項目的 `unit`、`title`、`detail`、`dimension`、`score`、`severity`、`confidence`、`effort`、`evidence`、`recommendation`、`status`、`createdInPass` |
| `units.json` | 存在哪些 ID；以及每個單元的 `label`、`path`、`kind`、`meta`、`addedInPass`、`removedInPass`、`removalKind`、`phantomVerification`、`phantomPath` |

`label`、`path`、`kind` 與 `meta` 包含在該清單中，*因為*
`unit-edit` 會重播它們，包含依鍵逐一的 `meta`
合併。在記錄中修正標題代價很小；在記錄之外修正標題是不可能的。未進行對帳的項目：`lastTouchedPass`、發現項目的
`history`、時間戳記與 `session.json` - 衍生記帳與階段狀態機，這兩者都無法為任何人帶來涵蓋率。

然後它會檢查帳本本身的內部一致性。`ledger.jsonl` 是各 pass
`deltas.jsonl` 檔案的有序聯集 - 一次呼叫同時寫入兩份複本 -
因此這些檔案是每筆記錄獨立的第二份複本。這能捕捉到單獨附加至
`ledger.jsonl` 的貌似合理的行、重新排序的帳本、被截斷的帳本，或在其底下被刪除的 pass 目錄。

**`judge`、`decide`、`report` 與 `apply`
在執行前都會先進行對帳**，若有分歧則以結束代碼 `2`
退出並指明分歧之處。這四個指令將狀態轉化為主張 -
裁決、決策、文件、工作計畫。迴圈的其餘部分不需要承擔此成本：`predict`、`units`、`grade`、`delta`、`status` 與 `list` 執行時不進行對帳。

### 寫入順序 - 始終帳本優先

每個變更狀態的指令都會**先**附加至 `ledger.jsonl`，**之後**再寫入
`units.json`、`findings.json` 與 `passes/NN/deltas.jsonl`。這種不對稱性是刻意設計的：

- **帳本超前** -
完全可復原。每筆記錄決定了狀態檔案必須包含的內容，因此重播可以衍生出它們尚未追上的內容。確定性，無需猜測。
- **狀態超前** -
無法復原。額外資料僅存在於一處，沒有任何內容可供重建。

因此唯一可能發生的當機狀態是可復原的狀態。寫入中斷絕不會導致損失任何 pass 的工作成果。

### `ponder verify --repair`

修復帳本超前的會話：重播帳本，將 `units.json` 與
`findings.json`
重寫為這些記錄必然產生的狀態，將遺失的結尾附加至任何持有嚴格前綴的 `passes/NN/deltas.jsonl`，然後重新對帳並逐行列印重建的內容。

```
Repaired from the ledger
  - units.json - 12 units rebuilt from the ledger (screen.auth.sso, screen.billing were behind it)
  - passes/03/deltas.jsonl - 2 records appended to catch it up to the ledger
```

| `--repair` 發現的狀況 | 處理動作 |
|---|---|
| 帳本建立但狀態檔案缺少的單元或發現項目，或儲存值落後於帳本的欄位 | 重新建構它 |
| 持有該 pass 帳本記錄嚴格前綴的 `passes/NN/deltas.jsonl` | 附加缺失的結尾 |
| 狀態檔案中存在**無任何帳本記錄建立過**的單元或發現項目 | **拒絕** - 資料不存在於任何其他複本中。偽造或無法復原的遺失；兩者皆為嚴重錯誤 |
| 狀態檔案中重複或未識別的項目 | **拒絕** - 相同原因 |
| `passes/NN/deltas.jsonl` 持有帳本所沒有的記錄，或相同位置上有不同的記錄 | **拒絕** - 僅供附加之日誌的兩份複本不一致，而非一份落後 |
| `ledger.jsonl` 內部的問題，或無法剖析的行 | **拒絕** - 修復是*從*帳本重建，因此損壞的帳本無法作為重建基礎 |

每次拒絕均維持結束代碼 `2` 退出，且 `--repair`
在拒絕之前會列印其無法重建的內容。修復後的會話與中斷指令原本應寫入的內容完全相同。若無
`--repair`，`verify` 不寫入任何內容。

**這項機制不能保證什麼。**
它不是數位簽章也不是雜湊鏈。若有人一致地編輯全部三份複本 -
狀態檔案、`ledger.jsonl` 以及在正確位置上的相應
`passes/NN/deltas.jsonl` -
即可擊敗它，這超出威脅模型之外，直截了當地陳述而非隱晦略過。它所做的是將不誠實停止的代價從一次編輯提高為跨三個檔案的一致偽造，其中一個是 `report.md` 引用的僅供附加日誌。

在遇到之前值得知曉的兩個邊界。`session.json` 不參與對帳且
`--repair` 不會重建它 -
帳本記錄的是對單元和發現項目的操作，而非階段狀態機。而在
`unit-seed` 存在之前就已植入盤點清單種子的會話沒有其單元的帳本記錄，因此它永遠無法對帳：請重新植入種子，而非試圖規避它。

## 收斂訊號

| 訊號 | 公式 | 解讀為 |
|---|---|---|
| `coverage` | 已評分單元 ÷ 列舉單元 | 我們是否實際檢視了所有項目？ |
| `novelty` | 修訂 `add` delta ÷ 即時發現項目 - **pass 1 為 null** | 是否仍在開拓新領域？ |
| `churn` | 修訂 delta ÷ 即時發現項目 - **pass 1 為 null** | 此 pass 變動了多少？ |
| `thrash` | 反轉同一目標先前 delta 的修訂 delta ÷ 修訂 delta - **pass 1 為 null** | 是在震盪而非收斂？ |
| `surprise` | \|預測 churn - 實際 churn\| - **pass 1 為 null** | 迴圈對自身的模型化程度 |
| `stall` | 連續 `churn < 0.02` 的 pass 數 | 持續性防護 |
| `confidenceFloor` | `confidence < 0.5` 的 `open` + `must` 發現項目比例 | 重要判定是否仍處於猜測狀態？ |
| `voices` | **在此 pass 審議中發言**的不同視角 | 此 pass 是否與自身進行過辯論？ |

**Pass 1 回報 `novelty`、`churn`、`thrash` 與 `surprise`
為 `null`** - 在訊號表中印為 `-`，且 `-` 不是零。這四項均衡量相對於先前 pass
的變更，而 pass 1 沒有先前 pass：每個發現項目都是新的，因為以前什麼都沒有，且沒有實際的
churn 可供評估預測。它們從 pass 2
開始讀取。`coverage`、`confidenceFloor`、`stall` 與 `voices` 描述的是狀態而非變更，因此它們從 pass 1 起開始讀取。

`novelty` 與 `churn` 的分子是**修訂** delta - `ponder
grade` 寫入的種子 `add` 被排除在外，因此這些數字描述的是 pass
*變更*了什麼，而非它*建立*了什麼。分母是**即時**發現項目計數，總數減去撤回數，因此撤回雜訊不會稀釋下一個
pass 的訊號。`confidenceFloor` 的分母僅為 `open` + `must` 發現項目。

`thrash` 較為特殊：其**兩**個部分都是修訂 delta，而非總
delta，因此它解讀為此 pass
自身撤銷先前工作的修訂比例。`unit-add`、`unit-edit` 或
`unit-delete` 是與其他修訂一樣的修訂 delta - 盤點清單修正計入 `churn`，因為它們推進了深思，且絕不計入 `novelty`，因為它們不是發現項目的 `add`。

**涵蓋率是 `unit-edit` 無法變動的唯一訊號。**
更正單元既非新增亦非移除，因此分子與分母在離開 pass 時與進入時完全相同。

`voices` 計算**參與審辯**的視角，自
`passes/NN/deliberation.json` 讀取：帶有非空 `argument`
的視角即算發言，無論其後續是否產出內容。檢查了佐證、認定發現項目合理並明確說明的懷疑論者已經投票
- 審議聽到了其聲音。略過審議的 pass（`ponder deliberate --skip`）未聽取任何人的意見，其 `voices` 為 0。

舊指標仍可使用且仍值得關注：`judge` 會在 `voices` 底下列印 **`delta
voices`** 行，且 `metrics.json` 攜帶 `deltaVoices` /
`deltaVoiceNames`。請將兩者結合閱讀。`voices 4/4` 配上 `delta
voices 1/4` 代表四個視角進行辯論而一個採取行動 - 有時是真正的平靜
pass，有時是三個視角流於形式。`voices 0/4` 配上健全的 `delta voices` 代表無人辯論的 delta。

當在相同目標上，較早的 pass 將欄位設為 X，較晚的 pass 變更了它，而此 pass
將其設回 X 時，該 delta 即**反轉**了較早的 delta - 透過
`unit-edit` 在單元的 `label`、`path`、`kind` 或 `meta`
上完全比照在發現項目的欄位上，其中植入種子與新增的值視為第一個設定，且 `meta`
依其合併後的值進行比較，而非依提交的部分物件；或者當此 pass `add`
的發現項目在實質上與較早 pass `delete` 的項目相符時（相同 `unit` + 相同 `dimension`）；或者當它 `delete` 在前兩個 pass 內新增的項目時。

## 裁決規則，依序評定

以最先符合者為準。

1. `coverage < 1.0` →
**`blocked`**。不允許停止；裁決會指出每個未評分的單元，並分開列出從未評分即遭刪除的單元，說明它們為何仍計入。不存在覆寫。
2. `pass < minPasses` → **`continue`**。單一 pass
只是意見，不是深思。 3. `thrash > 0.25` →
**`escalate`**。另一個完全相同的 pass 沒有幫助 -
請輪換視角、擴大佐證範圍，或拆分主旨。在 `thrash` 為 null 時略過。 4.
**佐證與檢閱防護（`confidenceFloor > 0` 或 `voices <
3`）：** 任何信心度低於 0.5 的未結案 `must`
發現項目（`confidenceFloor > 0`）或少於三個檢閱視角（`voices <
3`）都會阻止收斂 → 若 `pass >= maxPasses`，原因為 `budget` 的
**`stop`**；否則若 `stall >= 2`，為
**`escalate`**；否則為原因為 `low-confidence` 或
`insufficient-perspectives` 的
**`continue`**。帶著未解決不確定性的靜止狀態無法獲得收斂，無論 churn 多低。
5. **雙 pass 收斂判定：** 兩個連續 pass 均滿足收斂標準（`novelty <
0.05`、`churn < 0.05`、`surprise < 0.1`，且在兩個 pass
中皆有健全的信心度與檢閱視角）→ **`stop`**，原因為
**`converged`**（引擎規則 ID
`3`）。這是黃金路徑。模型是穩定的，驚訝度很低，且兩個獨立的 pass
相互證實了這一點。此規則位於備用持續性停止之前，因此兩次經過充分檢閱且具備信心的平靜 pass
將獲得 `converged`。 6. `stall >= 2` 且 `coverage ==
1.0` → **`stop`**，原因為 `perseveration`（引擎規則 ID
`4`）。毫無變動，且雙 pass 收斂檢查不符合（例如因為先前的 pass
缺乏完整的視角檢閱或信心）。`stall` 僅計算 churn 為數字的 pass，因此沒有 churn 的 pass 無法計入。 7. `pass >= maxPasses` → **`stop`**，原因為 `budget`。回報為預算停止，永不回報為收斂。 8. 否則 → **`continue`**，原因為 `default` - 除非 OCA 針對此迴圈持有嚴重性高的未結案元認知觀察，這會將原本的 `continue` 轉化為原因為 `oca-observations` 的 **`escalate`**。

Pass 1 回報無 `churn`、`novelty` 或
`thrash`，因此規則 3、5 與 6
在此無從觸發，且此略過是明確的，而非偶然為 false 的 null 比較。規則
1 仍然完全適用 - 涵蓋率是從盤點清單與發現項目集計算得出，而非從帳本計算，且它阻擋 pass 1 與阻擋 pass 6 的嚴格程度完全相同。

## 透鏡套件

`lenses/<name>.md`，由代理人在調查與評估階段讀取：

```yaml
---
name: ui
unit: screen
enumerate: |
  How to find every unit. Concrete commands and heuristics.
dimensions: [information-hierarchy, empty-states, loading-states, error-states,
             motion, affordance-clarity, density, responsive-behaviour,
             accessibility, copy-tone, consistency, delight]
scale: { 1: broken, 2: bad, 3: acceptable, 4: good, 5: exemplary }
---
```

正文定義了什麼是單元、如何詳盡列舉、每個維度附帶具體的 1 / 3 / 5
範例、什麼算作佐證，以及四個視角各自應該尋找什麼。`--lens custom
--rubric <file>` 載入任何具有相同 front-matter 格式的檔案。

## OCA 橋接

選填，缺席時無提示，零 npm 相依性 - 它直接呼叫 `psql`。

| 變數 | 預設值 | 意義 |
|---|---|---|
| `PONDER_OCA` | `auto` | `auto` 每個處理程序探測一次，失敗時自動停用；`on` 使無法連線的 OCA 成為嚴重錯誤；`off` 完全略過它 |
| `PONDER_OCA_DSN` | `postgres://localhost/oneiro` | |

每次呼叫逾時為 5 秒。任何非零結束代碼、逾時或剖析失敗均會記錄至
`.ponder/<slug>/oca.log` 並傳回
`null`。**橋接器絕不會破壞引擎** - 若某個 pass 行為異常，OCA 不是原因；請檢查 `oca.log` 並繼續作業。

它為您帶來的好處：`start` 列印相同主旨的早期深思；每個 pass 將評分後的預測寫入
`episodic_memory` 與 `hypotheses`；審議結果存入
`deliberations`；陷入停滯、持續性迴圈、抖動與低信心的 pass
會引發元認知觀察（`metacognitive_observations`），`judge`
會將其作為轉向 `escalate` 的決勝參考讀取。在 `:3333` 上的認知迴圈處理程序**未**在執行且此處不依賴它 - 橋接器直接與 Postgres 通訊。

## 常見錯誤

以下訊息為引擎列印的字面訊息。錯誤輸出至
stderr；`NEXT:` 行仍輸出至 stdout，因此失敗的指令仍會告知您目前所在位置。

| 結束代碼 | 訊息 | 原因 | 修正方式 |
|---|---|---|---|
| `2` | `out of order: "ponder judge" satisfies judge, but this session owes decide.` | 略過或重複了階段 | 照 `NEXT:` 的指示執行。狀態機是在修正您的記憶，而非發生故障 |
| `2` | `cannot stop: coverage is 0.67, not 1.0. 1 screen has never been graded.` | 涵蓋率閘門未通過 | 評分指明的單元。除非該單元已被評分或是經確認的虛構單元，否則 `unit-delete` 不會縮短此清單 |
| `2` | `session <slug> is still open on pass N (<phase>).` | 在開啟中的會話上未帶 `--dry-run` 執行 `ponder apply` | 使用 `--dry-run` 預覽，或先完成深思 |
| `2` | `session <slug> was aborted; there is no plan to apply.` | 在已中止的會話上執行 `ponder apply`（無論是否帶 `--dry-run`） | 無需修正。放棄的深思不是計畫 - 請啟動全新會話 |
| `2` | `pass N has not been judged.` | 會話應履行 `decide` 但缺少 `passes/NN/metrics.json` - 狀態機會先捕捉到常規的 `judge` 之前執行 `decide`，因此這意味著 pass 工件受到干擾 | 再次執行 `ponder judge` |
| `1` | `N problems in this delta batch - nothing was applied.` + `delta line 4: every delta needs a non-empty "why" - an unexplained revision is not a revision.` | delta 未包含理由 | 每個 delta 均需攜帶 `why`。該批次中完全未套用任何內容，請修正後重新執行整個檔案 |
| `1` | `delta line 1: finding targets unknown unit "u.two" - add it first with a unit-add delta.` | `add` 指名了*尚未*存在於盤點清單中的單元 | 將 `unit-add` 行移至該 `add` 之上。在同一個檔案即可；順序並非選填 |
| `1` | `unit "<id>" is claimed phantom, but a path it has carried exists: <abs> (carried by the unit-add that created it in pass 4).` | 在曾指向您可以開啟之檔案的單元上標記 `"phantom": true` | 請前往評分。檔案就在那裡。檢查會針對該單元曾持有的每個路徑執行，因此先移動路徑並無法清除它 |
| `1` | `unit "<id>" is claimed phantom and none of the 2 paths it has carried (…) resolves under <root> - but that project root was guessed, not established (…).` | 在非由 `--project` 亦非由專案標記確立的專案根目錄下標記 `"phantom": true` | 檢查來自 `ponder start` / `ponder status` 的 `project` 行。若根目錄有誤，請使用 `--project <path>` 重新啟動；若正確，主張仍無法從該處檢查，單元需要評分 |
| `1` | `unit-edit may never set "id". The unit id is the join key between units.json and findings.json…` | `unit-edit` 試圖重新命名單元 | ID 不可移動。若 ID 本身有誤，使用 `unit-delete` 刪除它並使用 `unit-add` 新增更正後的單元，並承擔涵蓋率成本 |
| `1` | `"note" is not a settable unit field (label, path, kind, meta).` | `unit-edit` 設定了非四者之一的內容 | 僅限這四個，無其他欄位 |
| `1` | `unit "<id>" was removed in pass 3 - a unit that has left the inventory is not edited back into shape, it is re-added.` | 在已移除的單元上執行 `unit-edit` | 若它屬於主旨，使用 `unit-add` 加回 |
| `2` | `session <slug> does not reconcile with its ledger - 2 divergences.` | 在與帳本不一致的狀態上執行 `judge`、`decide`、`report` 或 `apply` | 執行 `ponder verify --session <slug>` 獲取診斷，若僅帳本超前則執行 `ponder verify --repair`。狀態超前的會話在設計上即為重大錯誤 |
| `1` | `--churn must be between 0 and 1 (got 1.2).` | 預測超出指標所在的 0-1 範圍 | 挑選範圍內的數字。`0` 與 `1.0` 皆合法。在 pass 1 中無人評估它 - 寫下誠實猜測並將內容放在 `--claim` |
| `1` | `overriding the "continue" advice with "stop" needs a --why of at least 12 characters (got 4).` | 覆寫理由過於單薄 | 寫下實際理由。它將永久記錄在 `report.md` 中 |
| `1` | `session "ui-2026-08-24" already exists at …` | `--slug` 發生碰撞 | 選擇其他 slug，或恢復執行：`ponder status --session <slug>` |
| `1` | `<path> line 1 is not valid JSON: …` | 截斷或被 code fence 包裹的 JSONL 行 | 要求批次代理人僅提供 JSONL，無其他內容 - 無散文說明、無程式碼圍欄 |
| `0` | 沒有 **Prior pondering** 節區 | OCA 無法連線，或無相符項目 | 預期之內。若在乎請執行 `ponder doctor` |

有一種失敗完全不列印任何錯誤：在從未評分的單元上執行 `unit-delete`
成功，且涵蓋率未變動。這不是需要規避的錯誤。該單元離開盤點清單並保留在涵蓋率分母中，完全如設計所預期
- 評分它，或者主張 `"phantom": true` 讓引擎進行檢查。
