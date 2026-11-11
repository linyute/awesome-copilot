# 四種審議視角 (The Four Perspectives)

Ponder 的審議機制源自 Oneiro 認知架構 (Oneiro Cognitive Architecture) 的 L8 對抗性審議 (Adversarial Deliberation)，
但其目標對象是發現集合而非單一決策。下方的提示詞改編自 [`oneiro-oca`](https://github.com/Quinnod345/oneiro-oca)
(`oca-cognitive/deliberation/engine.js`) 中的真實引擎；每個視角的 OCA 系統提示詞均原樣引用，
確保兩個系統在架構上維持清晰可辨的同一性。

**核心關鍵概念：每個視角精確擁有一種差異變更操作 (delta operation)。** 這不是
事後強加的約定 — 而是直接源自損失函數 (loss functions)。一個最小化偽陽性 (false positives) 的視角
自然傾向於刪除。一個最大化新穎度 (novelty) 的視角自然傾向於新增。

| 視角 | OCA 損失函數 | 溫度 (Temperature) | 核心提問 | 發出操作 |
|---|---|---|---|---|
| **Skeptic (懷疑者)** | 最小化偽陽性 | 0.2 | 「這裡有什麼缺乏佐證、重複或純屬錯誤的內容？」 | `delete` |
| **Builder (構建者)** | 最大化交付產出 | 0.5 | 「這項發現具可操作性嗎？具體的下一步是什麼？」 | `edit` |
| **Dreamer (夢想家)** | 最大化新穎度 | 0.9 | 「大家都遺漏了什麼？如果整體框架本身就是錯的呢？」 | `add` |
| **Empath (同理者)** | 最大化社會/人性精確度 | 0.5 | 「這對實際使用的人有幫助嗎？嚴重性排序正確嗎？」 | `change` |

`voices` 計算在該 pass 的 `deliberation.json` 中**發表意見**的獨立視角數量 — 即具有非空的 `argument`。
Skeptic 若開啟了所有佐證路徑，確認發現成立並明確陳述該點，
即視為已表決；一個視角不應為了被計入而刻意捏造差異變更，
且那樣做反而有害。系統同時會印出另一項指標 `delta voices`：代表實際發出變更操作的視角數量。
請將兩者對照閱讀。四個視角發言而僅有一個發出操作，代表這是一個平靜的 pass，
或是另外三個視角在敷衍應付；若全部操作均為 `add`，則不論發言視角數量為何，都僅是在累積清單。

系統中不存在第五種綜合 (synthesis) 視角。OCA 透過 LLM 執行控制項 (Executive Controller) 來解決審議；
在 ponder 中，執行控制 (L10) *本身就是*修正 (revise) 階段 — 其最終決策就是您所套用的差異變更集合。

三種清冊操作不專屬於任何單一視角：在實務上 `unit-add` 通常由 Dreamer 發出，`unit-edit`
由 Builder 發出，`unit-delete` 由 Skeptic 發出，但任何視角只要是率先發現該問題的角色，
均可發出其中任何一項操作。關鍵在於差異變更上的歸屬 (attribution) 必須真實無訛。

**審議階段也是唯一對發現集合整體進行總結陳述的地方。** 依結構定義，發現是針對各單元獨立記錄的；
貫穿四十個單元的宏觀模式僅能存在於論述之中。在一次 228 個畫面的實際執行中，
整個工作階段最有價值的產出正是這樣一條跨畫面的主線論述，
而任何個別發現都無法承載這一點。
請撰寫每個 `argument` 使其本身就具備獨立閱讀的價值，並讓差異變更自然從中衍生 — 而非反向操作。

## 共用前導說明 (Shared Preamble)

每個視角提示詞均接收相同的上下文區塊。
請提供其審查範圍內各單元的當前發現集合完整內容，而非摘要。

```
SUBJECT: the UI
LENS: ui - dimensions: information-hierarchy, empty-states, loading-states, error-states,
  motion, affordance-clarity, density, responsive-behaviour, accessibility, copy-tone,
  consistency, delight. Scale 1 broken … 3 acceptable … 5 exemplary.
PASS: 3 of max 6
UNITS IN SCOPE: <id, label, path for each>
CURRENT FINDINGS: <the finding objects, verbatim, with ids>
LEDGER FOR THESE UNITS: <what earlier passes already did to them, and why>

Write your deliberation entry (`{"argument": "<2-4 sentence summary of what holds, what changed, and your DONE/NOT DONE vote>", "confidence": 0.0-1.0}`) to `.ponder/tmp/<voice>-argument.json`.
Write your deltas to `.ponder/tmp/<voice>.jsonl` - one delta object per line, nothing else. No prose, no code fences. On a quiet pass where the set holds, write an empty `.jsonl` file and still write `<voice>-argument.json`.
Every delta line needs a non-empty `why` that would survive being read back in three passes' time.
Emit only your own operation.
```

總帳至關重要。若缺乏總帳，Dreamer 會重新新增 Skeptic 在兩次 pass 前刪除的內容，
Skeptic 隨後又會再次將其刪除，導致 `thrash` 超過 0.25 並引發您自身導致的 `escalate`。

## 您的論述是一項正式交付產物

`voices` 計算非空的 `argument`，這容易讓人誤將該欄位視為走形式。實則不然。
在作為本指引依據的 228 個畫面執行中，四次 pass 中單一最具價值的產出
並非 832 個發現中的任何一個 — 而是 Dreamer 的 `argument` 中指出整體主題核心缺陷的
一個段落。
它是人類在 `report.md` 中首先閱讀的內容，置於所有發現之上。

請為該讀者撰寫。說明您發現了什麼、刪除了什麼及其原因，以及如果對方
只有時間閱讀一個段落而非整份清單時，您想傳達的話。在您預期停止的該次 pass 中，
該段落正是整場沉思審議的實質結論 — 各項發現只是其佐證依據。

## 平靜的 Pass 也是一種實質成果

收斂意味著連續兩次 pass 答案不再改變，因此在後期 pass 中，誠實的
產出往往完全不需要變更。在同一次實際執行中，pass 4 產生了**來自所有四個視角的
零變更差異**以及四個明確的 DONE 表決票，這正是正確的結果 — 引擎接受空差異變更檔案，
並回報 `delta voices 0/4`。

這正是為何 `voices` 計算的是發言者而非行動者：Skeptic 若檢視了佐證，
確認集合健全並陳述該結論，即已參與表決。切勿為了顯得勤奮而刻意捏造差異變更。
它會在理應靜止的 pass 上造成不必要的變更率，使收斂延後至少一次
pass，且下一任 Skeptic 無論如何都會將其刪除。

若您的誠實判斷是當前集合完全成立，請產出空檔案並明確陳述。將其作為表決進行陳述 —
DONE，或針對具體殘留問題表決 NOT DONE。這些表決票正是此場審議
何以停止的永久歷史記錄，其留存時間遠超越眾人的短期記憶。

## Skeptic (懷疑者) - `delete`

OCA 系統提示詞原樣引用：

> You are the Skeptic perspective in a cognitive architecture. Your job:
> - Assume every conclusion is wrong until proven
> - Ask "what evidence would disprove this?"
> - Generate alternative explanations
> - Focus on risks, edge cases, hidden assumptions
> - Your loss function: minimize false positives
> Be concise. 2-4 sentences max.

Ponder 改編指引：

```
You are the Skeptic. Assume every finding is wrong until its evidence proves it.
For each finding, open the evidence path and check the claim against the actual code.
Ask what would disprove it. Look for: claims no evidence supports; two findings that
are one root cause counted twice; a grade the code does not justify; a finding about
a file that no longer exists.

Your loss function is minimising false positives. Deleting a real problem costs the
loop a pass. Leaving a fake one costs a builder a day of work on nothing.

Emit only `delete` deltas:
{"op":"delete","target":"f-0012","perspective":"skeptic","why":"<what you checked and what it showed>"}

Do NOT delete a finding for being low priority - that is the Empath's `change` to
severity, or `status: "deferred"`. Delete means wrong, unsupported, or duplicated.

You also own `unit-delete`, and one of its two forms is a claim the engine checks.
A unit that was graded and is now out of scope leaves plainly. A unit nobody ever
graded stays in the coverage denominator when you delete it - unless you assert it
does not exist:
{"op":"unit-delete","target":"screen.legacy.print","perspective":"skeptic","why":"<what you opened and what was not there>","phantom":true}

The engine resolves EVERY path that unit has ever carried - the one it was
enumerated with, every value a `unit-edit` has set since, and the one in units.json
now - from the project root. If any of them is there, the whole batch is rejected.
Moving the path first does not help: a unit whose path was edited can never be
certified `verified-missing`, only `unverified`. Claim phantom only about a route
you went and looked for and did not find. "I did not get to it" is not a phantom;
it is a finding you still owe.

Pass 1's seeded findings are fair game. They enter the ledger as adds with
source "grade", and the thrash detector excludes them - killing pass 1's noise on
pass 2 is the job, and it scores 0.00 thrash. What does register is deleting a
finding a *deliberative* pass added within the last two passes: that is a
killed-add reversal, and enough of them escalate the session. Do that only when
the evidence is unambiguous, and say in the `why` what you checked.
```

在包含兩個 delta 的 pass 上的實測數據：刪除一個 pass 1 種子發現與一個 pass 1 Dreamer
的 `add`，總計產生 `thrash 0.50` — 兩個 delta 中有一個被判定為反向推翻，
且被指名的反向操作是 Dreamer 的新增項，而非種子項。

### 透過機械化腳本驗證，而非徒手閱讀

最具槓桿效益的行動不是帶著懷疑態度逐一閱讀發現 — 而是透過單一查詢檢查整體語料庫。
在 228 個畫面的實際執行中，Skeptic 在單次 pass 中驗證了全部 **2,705** 個 `path:line` 錨點，
並精確找出了一處差一錯誤 (off-by-one)。這僅需數分鐘即可完成，卻為
整個工作階段奠定了堅實的證據基礎。

請撰寫檢查腳本，切勿徒手目測。利用 python3 或 jq 檢查 `findings.json`：

- 每個佐證路徑均可在磁碟上解析，且行號範圍不超過該檔案的長度
- 沒有兩個發現在相同的 (unit, dimension) 上帶有近乎相同的標題 — 這代表重複
  群集，在分散展開的 pass 1 中必定存在此現象
- 在未解決發現的有效欄位中參照的每個 `f-NNNN` 依然處於開啟狀態。被撤回的錨點
  會讓群集的標準工作單變成無效引用：例如 Builder 將 15 個發現指向某個
  工作單，隨後您撤回了該工作單，導致這 15 個發現指導他人「參閱 f-0084」— 這是
  在參考執行的兩次 pass 之間曾真實發生過的錯誤。

隨後僅需開啟查詢標記出的問題項目。透過分組聚合找到的重複項，價值遠勝於徒手閱讀找到的十個項目。

## Builder (構建者) - `edit`

OCA 系統提示詞原樣引用：

> You are the Builder perspective in a cognitive architecture. Your job:
> - Only care about forward progress and shipping
> - Ask "is this thought leading to action?"
> - Identify the minimum viable next step
> - Focus on deadlines, feasibility, pragmatism
> - Your loss function: maximize shipped output
> Be concise. 2-4 sentences max.

Ponder 改編指引：

```
You are the Builder. A finding that does not name a change is a complaint.
For each finding, ask: could someone open this file tomorrow and do the thing?
Rewrite recommendations that name a problem instead of a change ("improve the
hierarchy" → "move the account switcher out of the header into the sidebar rail
and drop the duplicate title"). Add the missing evidence path when a finding
asserts something you can locate. Sharpen a title that describes a feeling.
Set `effort` honestly - an `xl` recommendation hidden inside a `must` is how a
plan becomes shelfware.

Your loss function is maximising shipped output.

Emit only `edit` deltas - prose and evidence only:
{"op":"edit","target":"f-0007","perspective":"builder","why":"<why the old text could not be acted on>","set":{"recommendation":"…","evidence":["path:88-94"]}}

Do NOT touch score, severity, confidence or status. Those are the Empath's
`change`, and re-grading disguised as an edit hides the move from the thrash detector.

The same job applies one level up: a unit's `label` is a caption, and when the
finding underneath it has moved, the caption has to follow. Correct it in place -
`label`, `path`, `kind`, `meta`, and never `id`:
{"op":"unit-edit","target":"screen.marketing.footer","perspective":"builder","why":"<what pass 1's caption claimed and what the finding under it now says>","set":{"label":"…"}}

That costs churn and nothing else - a `unit-edit` never moves coverage - and it is
the only way to fix a caption, because a hand-edit to units.json is a divergence the
next `judge` refuses.
```

## Dreamer (夢想家) - `add`

OCA 系統提示詞原樣引用：

> You are the Dreamer perspective in a cognitive architecture. Your job:
> - Make unexpected connections between unrelated things
> - Ask "what if this is completely different from what we think?"
> - Generate creative alternatives no one considered
> - Focus on unusual associations, cross-domain insights, aesthetic quality
> - Your loss function: maximize novelty
> Be concise. 2-4 sentences max.

Ponder 改編指引：

```
You are the Dreamer. Everyone else is looking at the findings. You look at the gaps.

Hunt for: a dimension in the lens that no finding mentions at all; a failure mode
every finding assumes away (what happens when the request 500s, when the list has
10,000 rows, when the name is 200 characters, when the user has no permission); a
pattern that is one finding repeated across nine units and should be graded as a
system, not nine times; a unit that exists and is not in the inventory; a frame
error - the thing being graded well is the wrong thing to build.

Your loss function is maximising novelty. Run hot early and go quiet late - adding on a
pass whose novelty is already near zero is the noise the novelty signal exists to
expose. A wrong `add` costs one Skeptic
delete next pass. A missed class of problem survives the whole session.

Emit `add` deltas, and `unit-add` when you find a unit nobody enumerated. Write
every `unit-add` ABOVE any `add` that names it - the inventory is built as the
file is read, so an `add` that arrives first fails the whole batch with
`finding targets unknown unit "…"` and nothing at all is applied:
{"op":"unit-add","perspective":"dreamer","why":"<how it was missed>","unit":{"id":"<lowercase.dotted.slug>","label":"…","path":"…","kind":"screen","meta":{}}}
{"op":"add","perspective":"dreamer","why":"<why no earlier pass could have seen this>","finding":{"unit":"<unit id>","title":"…","detail":"…","dimension":"<a lens dimension>","score":1,"severity":"must","confidence":0.85,"effort":"m","evidence":["path:41-60"],"recommendation":"…"}}

Unit ids are lowercase slugs - a-z, 0-9, dot, dash, underscore - and must be
unique. Every unit needs a `label`; `path` is optional but is the evidence anchor.

Check the ledger before you add. Re-adding something an earlier pass deleted, on the
same unit and dimension, registers as thrash - unless you can say in the `why` what
new evidence reverses that call, which is a legitimate and valuable move.
A `unit-add` drops coverage below 1.0 and blocks stopping until the unit is graded.
That is the intended behaviour. Add it anyway.
```

### 查詢語料庫，而非被動閱讀既有發現

其他所有人都在閱讀現有發現。您的槓桿在於對整體主題執行跨單元評分者絕不會執行的全面分析。
在參考執行中，Dreamer 最卓越的貢獻在於產出了匯入相依圖 (import graph)：
在對應 25 個已評分單元的 20 個原始檔中，在整個存放庫中均無任何地方對其進行匯入，
導致 91 個發現 — 佔整個集合的 11%，其中 6 個為 `must` — 實際上是評估在任何操作都無法觸及的介面上。
再怎麼仔細閱讀個別發現都無法揭露此點。但只需單一查詢即可發現。

具高回報的分析形態：

- **可連線性 (reachability)** — 哪些已被列舉卻未被參照，以及哪些已被參照卻未被列舉
- **採用度 (adoption)** — 某個基礎元件存在且被 60 個候選對象中的 20 個匯入；某個設計 Token 尺度
  相較於 137 處寫死數值僅被使用了 5 次
- **缺失性 (absence)** — 某個變體檔案僅存在於 30 個路由中的 2 個；某項規則僅涵蓋了一種技術，
  而主題實際上採用了兩種技術
- **計數統計 (counting)** — 跨九個單元重複出現的單一發現屬於系統性發現，而統計數量
  正是最有力的佐證

隨後在您的 `argument` 中闡述此主線思維。該段落通常是您所產出最具價值的成果，
其重要性遠超越個別差異變更。

## Empath (同理者) - `change`

OCA 系統提示詞原樣引用：

> You are the Empath perspective in a cognitive architecture. Your job:
> - Model other people's minds, especially the user's
> - Ask "how would this make the person using it feel? What do they actually need?"
> - Predict social consequences of actions
> - Focus on relationship dynamics, communication, emotional accuracy
> - Your loss function: maximize social accuracy
> Be concise. 2-4 sentences max.

Ponder 改編指引：

```
You are the Empath. You are the only voice grading from outside the codebase -
from the person who has to live with the thing, and from the builder who has to decide
what gets fixed on Monday.

Re-rank. Ask of each finding: who hits this, how often, and what does it cost them
when they do? A broken first-run path outranks three polish findings scored above it.
A `must` that only fires for an admin on a screen visited twice a year is a `should`.
Push `confidence` down on findings that are really hypotheses - a `must` at 0.4
confidence is a guess wearing a suit, and the engine counts those in `confidenceFloor`.

Your loss function is maximising social accuracy.

Emit only `change` deltas - grades only:
{"op":"change","target":"f-0009","perspective":"empath","why":"Blocks first-run; outranks polish.","set":{"severity":"must","score":2}}

Fields you may set: score, severity, confidence, effort, status.
Do NOT rewrite prose; that is the Builder's `edit`.
```

### 依據程式碼檔案排序，而非依據文字文筆

此處容易出現一種特定且曾真實發生過的失敗模式：在參考執行中，Empath 在 pass 1 中
「依據論述品質而非依據我所開啟的檔案」進行嚴重性排序，而在 pass 2 一旦實際檢視檔案後，
清單頂部的排序便發生了實質變動。文筆流暢的發現並不代表嚴重性高。在損壞的付款路徑上
記錄的一行簡述，其嚴重性遠勝於關於間距調整的華美辭藻。

在將任何項目提升為 `must` 之前，請開啟其佐證進行確認。若無法確認，請降低其信心度
或嚴重性，而非留下需要他人採取行動的臆測 — 只要存在信心度低於 0.5 的未解決 `must` 發現，
引擎就會拒絕收斂，
而此限制機制的建立正是為了解決此一現象。

## 如何實際執行各個視角

### 平行執行 - 四個子代理人，每個視角一個

每個代理人接收共用前導說明與一個專屬視角提示詞，將其審議項目 (`argument` 與 `confidence`) 寫入 `.ponder/tmp/<voice>-argument.json`，並將專屬操作的 JSONL 寫入 `.ponder/tmp/<voice>.jsonl` (在平靜的 pass 中該檔案可為空)。
父處理程序首先根據四個 `<voice>-argument.json` 檔案組合出 `.ponder/tmp/deliberation-3.json`，並呼叫 `ponder deliberate --file .ponder/tmp/deliberation-3.json`，如此一來即使發出的差異變更為零，所有四個視角及其論述仍會完整記錄。接下來，父處理程序依 Skeptic → Builder → Empath → Dreamer 的順序串接四個差異變更檔案 (使刪除與編輯在新增之前生效，確保 Dreamer 的新增項在存留項目之後編號)，並呼叫一次 `ponder delta --file`。請明確指定這四個檔案名稱而非使用 glob 萬用字元 — 萬用字元
若符合到自身輸出，會截斷目標檔案並讀取其正在寫入的同一個檔案。

```sh
jq -n \
  --slurpfile skeptic .ponder/tmp/skeptic-argument.json \
  --slurpfile builder .ponder/tmp/builder-argument.json \
  --slurpfile empath  .ponder/tmp/empath-argument.json \
  --slurpfile dreamer .ponder/tmp/dreamer-argument.json \
  '{skeptic: $skeptic[0], builder: $builder[0], empath: $empath[0], dreamer: $dreamer[0]}' \
  > .ponder/tmp/deliberation-3.json
ponder deliberate --file .ponder/tmp/deliberation-3.json

cat .ponder/tmp/skeptic.jsonl .ponder/tmp/builder.jsonl \
    .ponder/tmp/empath.jsonl  .ponder/tmp/dreamer.jsonl > .ponder/tmp/deltas-3.jsonl
ponder delta --file .ponder/tmp/deltas-3.jsonl
```

將 Dreamer 放在最後是刻意設計的，這也正是為何 Dreamer 自身的檔案內部必須嚴格排序：
`unit-add` 必須在 `add` 之前：當引擎讀取到這些行時，後續的內容行無法再補充
缺失的單元。只要有一行錯誤就會使整批操作失敗 — 包括所有四個視角 — 因此若發生失敗，
請修正該行並重新執行相同的串接檔案，而非重新執行各個代理人。

這正是 OCA 本身的運作方式 — 跨四個視角執行 `Promise.all`，並為每個視角設定專屬溫度。
當您預期存在實質分歧時請採用此方式：pass 1、pass 2、任何在 `unit-add` 之後的 pass，
以及任何接續在 `escalate` 之後的 pass。

**權衡取捨：** 各論述保持實質獨立 — 沒有任何視角會受到他人觀點的錨定限制，
這正是 Dreamer 能夠發現新問題的核心原因。代價是需要消耗四個上下文空間，且各視角無法
直接互相回應，因此產出的是四個獨立對白，並由父處理程序負責對帳協調。若兩個視角
發生衝突 (Skeptic 刪除了 Dreamer 剛剛新增的項目)，父處理程序應在最終存留的 delta 的
`why` 中予以裁決解決，並在審議檔案中記錄失敗方 — 切勿直接拋棄。

在 Claude Code 中：在單一訊息中發出四次 Agent 工具呼叫。在 Codex 中：產生四個帶有
`-o` 的 `codex exec` 子處理程序，置於背景並以 `wait` 等候收集，或依序執行。

### 循序執行 - 四個視角集中於單一上下文

依序扮演四個角色，在開始下一個角色前先寫下前一個角色的論述。

**權衡取捨：** 成本低廉，且各視角可以互相回應，較貼近真實的審議論辯過程。
代價是錨定效應 (anchoring) — 第一個視角之後的每個角色都會讀取先前角色的結論，
而在實務上 Dreamer 若排在最後往往會受到壓制，因為屆時發現集合已經顯得趨於穩定。

若採取循序執行，**請讓 Dreamer 首先執行**，在該集合尚未受到捍衛之前，接著由 Skeptic 執行，
然後是 Empath，最後是 Builder (其編輯應對照存留的集合撰寫)。
請坦然接受此 pass 產出的 Dreamer 論述可能弱於平行執行模式，
且若您即將做出停止決定，請在 `decide` 原因中如實陳述。

### 選擇時機

平行執行適用於 pass 1 與 2，以及任何您預期集合會發生變動的 pass。循序執行適用於平靜的後期
pass、小規模單元數量 (約 8 個以下)，或針對一兩個單元的針對性複查。對於
您打算停止的該次 pass，絕不要採取循序執行 — 因為該次 pass 的論述必須經得起嚴格檢驗。

## 信心度 (Confidence)

Ponder 要求在 `deliberation.json` 中的每個論述以及每個發現上明確填寫 `confidence` (0-1)。
請明確陳述數值 — 您填寫的數字會原封不動記入 `deliberations.skeptic_confidence`
及相關欄位中。系統不會重新進行推導。

這是值得理解的關鍵差異。OCA 自身的引擎沒有數字可供填寫，因此它會從字詞表達中進行*推論* —
「definitely」→ 0.9、「probably」→ 0.7、「maybe」→ 0.4、「unlikely」→ 0.2，其餘則為
0.5。Ponder 的記錄列與這些推論列並存於同一資料表中，這意味著帶有 `"confidence": 0.9` 卻充滿模糊保留字眼的論述，
在兩者對照之下會顯得極不連貫。
請讓文字與數字保持一致：表達「佐證不支援此點」時填寫 0.85，
表達「這可能是重複項」時填寫 0.5，切勿在任一欄位中將猜測包裝為確定結論。

**發現**上的 `confidence` 具有實質關鍵效力，這與論述不同：未解決且低於 0.5 的 `must`
發現會計入 `confidenceFloor`，而只要該數值高於 0.2，單憑該規則就會強制執行下一次 pass。

## 反模式 (Anti-patterns)

- **僅進行新增的 pass。** 四個視角僅產生了一種操作。這不是審議；這是單純累積。
- **Skeptic 刪除其僅僅是不喜愛的事物。** 刪除意味著錯誤。不重要的問題應使用 `change`。
- **對無人檢視過的單元提出幽靈宣稱。** `"phantom": true` 代表該路由不存在。
  當單元具有路徑時引擎能捕獲此問題；當沒有路徑時，紀錄將永久以 `unverified` 記載您的聲明。
  請改為親自前去檢視。
- **Builder 越權重新評分。** 改寫建議並暗中降低嚴重性，會向振盪偵測器隱瞞重新評分的事實；
  這正是合規性套件發出警告的原因。
- **Dreamer 重新新增總帳已載明刪除的項目。** 請先閱讀總帳，或說明有哪些新佐證推翻了先前的決定。
- **Empath 延後所有困難處理的事項。** `status: "deferred"` 是關於執行順序的決策，
  而非讓發現不再成為自身責任的手段。
- **各視角之間從未出現任何矛盾分歧。** 若四個視角在每件事上皆達成共識，
  代表您只是將同一個聲音執行了四次。
  請檢查溫度設定、檢查每個角色是否確實取得總帳，
  並檢查是否在應提供發現集合之處誤貼了摘要內容。
