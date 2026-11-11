---
name: ponder
description: '收斂審議迴圈 (Convergent deliberation loop) - 對單一主題重複進行評分審查，直到答案不再改變，同時強制執行涵蓋率，確保沒有任何單元被暗中略過。當使用者要求「沉思/深思 <任何事物>」(例如「深思 UI」、「好好琢磨我們的錯誤處理」)、「仔細想清楚這件事」、「持續思考直到收斂」、「持續循環直到收斂」、「反覆循環直到結果不再改變」、「逐一檢查所有畫面並評分」、「稽核/評價/評分每一個 X」，或要求跨多個單元進行全面性審查評分 (單次審查容易遺漏事物) 時使用。也可用於恢復或復原已在進行中的 ponder 工作階段 — 例如「我們剛才進行到哪裡了」、「繼續琢磨/沉思」、「迴圈中途遺失思路」或專案中存在 .ponder/ 目錄的情況 — 此時應執行 ponder status 而非重新開始。'
---

# Ponder (深思/審議)

Ponder 會對單一主題進行重複評分審查，直到答案不再改變：每一次審查 (pass) 都會修正前一次的發現 — 補足遺漏之處 (`Dreamer` → `add`)、釐清模糊之處 (`Builder` → `edit`)、從人類使用者的實際生活與情感視角重新評定分數偏差處 (`Empath` → `change`)，並撤回缺乏佐證或屬於無效程式碼的雜訊 (`Skeptic` → `delete`)。由您決定要執行多少次 pass；引擎會評估是否已真實達到停止條件，且只要有任何列舉單元尚未評分，就絕不允許停止。

與傳統強制 LLM 在被要求重複審查時捏造微小問題或產生幻覺的多輪提示不同，Ponder 將**認識上的靜默 (epistemic silence)** 視為後期 pass 的目標：所有四種視角都必須驗證佐證並在 `deliberation.json` 中發表意見 (`voices = 4`)，但若其發現已經完全成立，該視角將發出**零個變更差異 (zero deltas)**。連續兩次完全經過審查、具有信心的平靜 pass，將贏得 `stop (converged)` (收斂停止)。

> **在沉思中途遺失思路？請執行 `ponder status`。** 它會指出您當前所在的 pass、您應執行的階段，以及字面上的下一個指令。若您不知道 slug — 或不知道是否存在工作階段 — 請先執行 `ponder list`；專案中若有 `.ponder/` 目錄，通常表示存在工作階段。切勿重新開始：建立第二個工作階段會拋棄第一個工作階段的總帳 (ledger)，而這正是其全部價值所在。在斷定任何東西遺失之前，請參閱[復原與恢復](#復原與恢復)。

執行檔在 `PATH` (`~/.local/bin/ponder`)、`${CLAUDE_PLUGIN_ROOT}/bin/ponder` (作為外掛程式安裝時) 或 `~/code/ponder/bin/ponder`。若 `command -v ponder` 失敗且兩處路徑皆不存在，請將 [`https://github.com/Quinnod345/ponder`](https://github.com/Quinnod345/ponder) 複製 (clone) 至 `~/code/ponder`，並從該經審查的簽出版本執行 `~/code/ponder/install.sh`。**每個指令結尾都會有一行 `NEXT:`，指名您當前應執行的階段。** 該行是驅動您的引擎指示，也是在上下文壓縮 (compaction) 後依然存在的關鍵資訊。

本文件中所有的 `--file` 都是您預先寫入的路徑。在執行第一個指令前，請先建立暫存目錄：`mkdir -p .ponder/tmp/batch`。引擎會忽略 `.ponder/` 底下不含 `session.json` 的目錄，因此 `.ponder/tmp/` 是暫存輸入的安全位置 — `tmp/` 用於交給引擎的內容，`tmp/batch/` 用於分散展開 (fan-out) 代理人寫入的內容。

以下終端機輸出經過縮減，僅用於展示 pass 的**結構外觀**。當終端機輸出範例與引擎不一致時，以引擎為準 — 請以其實際輸出為依據。

更深入的參考文件，僅在需要時載入：

- `references/protocol.md` - 每個指令、每個旗標、每個 JSON 結構、裁決規則、結束代碼，以及對帳 (reconciliation) 與 `verify --repair` 的運作方式。
- `references/perspectives.md` - Skeptic / Builder / Dreamer / Empath 可執行的提示詞，以及如何進行分散展開。
- `references/harness-notes.md` - Claude Code 與 Codex 之間的差異：子代理人、沙盒、psql、安裝。若您準備分散展開工作，亦包含完整的工作階段鎖定說明。

在執行 pass 1 之前，請先閱讀您主題的鏡頭套件 (lens pack，位於 ponder 存放庫中的 `lenses/<lens>.md`)。它定義了什麼是單元、如何窮舉列舉、維度，以及 1-5 分量表各等級的含義。

## 審議迴圈 (The Loop)

### 開始時執行一次

**首先確認您確實處於起點。** 若該主題已開啟過審議，`start` 是錯誤的指令，且建立第二個工作階段會丟棄第一個工作階段的總帳。

```sh
ponder list                                     # 是否已開啟過？若是，請前往「復原與恢復」
ponder doctor                                   # 環境檢查 + 是否可連線至 OCA 橋接器
ponder start "the UI" --lens ui --max-passes 6 --min-passes 2
```

若 OCA 記得先前曾思考過此主題，`start` 會印出 **Prior pondering** — 請仔細閱讀，那是您上次留下的進度。OCA 為選用項目；無法連線時會以無提示方式降級，絕不阻礙 pass 進行。

### 每一次 pass，均依照此順序執行

1. **預測 (predict)** - 在您檢視任何內容之前。
   `ponder predict --churn 0.35 --claim "Pass 1 over-graded empty states and never opened the error paths."`
   您需陳述此 pass 將對發現集合造成什麼影響。引擎會將其評分為 `surprise = |predicted - actual|`。每次都猜低值以顯得校準精確，會破壞唯一能告訴您是否已理解該主題的信號。
   **`--churn` 會驗證為 0-1 之間 — 超出此範圍會被拒絕而非截斷: `ponder predict --churn 1.2` 會以結束代碼 `1` 結束且不記錄任何內容。** `0` 與 `1.0` 均屬合法。在 pass 1 中會記錄此數值但不計分 — 因為沒有前一次 pass，引擎沒有可計算距離的變更率。請寫下真實猜測，並在 `--claim` 中填入具體內容。信號自 pass 2 開始生效。
2. **調查 (survey)** *(僅限 pass 1)* - 使用鏡頭套件的列舉配方窮舉列舉每個單元，或使用 `--scan <dir>` 讓 CLI 直接走訪磁碟/git。
   `ponder units --file .ponder/tmp/units.json --scan src/routes --strict-scope` (或 `ponder units --scan src/routes` 自動將 `<dir>` 下的每個檔案做為種子)
   當 `--scan <dir> --strict-scope` 與 `--file` 一併傳遞時，引擎會對照磁碟上 `<dir>` 下的實際檔案交叉檢查每個 `unit.path`，若遺漏任何檔案則以結束代碼 `2` 結束。後續 pass 則以差異變更 (deltas) 修正清冊：`unit-add` 用於補足調查遺漏處，`unit-edit` 用於修正錯誤處，`unit-delete` 用於移除超出範圍處。
3. **評估 (appraise)** - 對照鏡頭量表對每個單元進行評分。
   Pass 1: `ponder grade --file .ponder/tmp/findings.json`
   Pass 2+: 重新閱讀單元與當前發現。產出為差異變更 (deltas)，於步驟 5 提交 — 在後續 pass 中，您是*透過*修正來評估，因此沒有獨立指令。
4. **審議 (deliberate)** - 將當前發現集合提交給四種視角 (`references/perspectives.md`)。
   `ponder deliberate --file .ponder/tmp/deliberation-2.json`
   **這是撰寫主線敘述的地方，而不僅僅是產生差異變更。** 依結構定義，發現是以單元為基礎；論述 (argument) 是整個迴圈中唯一對整體集合發表總結陳述的地方。在 228 個畫面的執行中，最有價值的產出不是 760 個個別發現之一 — 而是 Dreamer 提出的跨畫面主張，這是任何個別評分都無法承載的。請將每個 `argument` 寫成一段值得獨立閱讀的完整段落，指出跨單元的模式，並讓差異變更自然從中衍生出來。若將論述寫成差異變更的摘要清單，就已經丟失了最重要的核心部分。
   略過審議是合法的，但會記錄在案：`ponder deliberate --skip --why "..."` 會將該 pass 在 `passes/NN/deliberation.json` 中標記為略過，在 `report.md` 中呈現原因，且當 OCA 可連線時，會引發 `deliberation_skipped` 後設認知觀察。即使 OCA 關閉，記錄依然會保留；僅觀察紀錄不會產生。
5. **修正 (revise)** - 套用審議所產生的差異變更。
   `ponder delta --file .ponder/tmp/deltas-2.jsonl`
   每個差異變更都帶有 `op`、`perspective` 以及非空的 `why`。引擎會拒絕沒有 `why` 的差異變更。在 pass 2+ 中，此呼叫亦同時滿足評估階段。
   **具備 Token 效率的內部標記法:** 為降低多輪 pass 的 token 使用量 (4 次 pass 約減少 56%)，您可以使用簡潔的因果箭頭撰寫機器對機器的內部 `deliberation.json` 論述與 `deltas.jsonl` 的 `why` 字串 (`"safe-query.js:5 binds $1 -> SQLi claim false -> retract"`)，同時將所有面向使用者的發現欄位 (`title`、`detail`、`recommendation`) 保持為清晰完整的散文。
6. **裁定 (judge)** - `ponder judge` 計算各項指標並印出建議。
7. **決策 (decide)** - `ponder decide <continue|stop|escalate> --why "..."` 認可您的決定。

在 pass 2+ 中，引擎會略過調查，並將評估整併至 `ponder delta` 呼叫中，因此指令序列為 **predict → deliberate → delta → judge → decide**。階段順序受到嚴格強制：順序錯誤的指令會以結束代碼 `2` 結束，並指名您當前應執行的階段。請相信該訊息，而非憑記憶猜測。若在此清單中您不確定自己處於哪一次 pass 或已完成哪些操作，請停止猜測並執行 **`ponder status`** — 此操作輕量且不取得鎖定，可同時回答這兩個問題 ([復原與恢復](#復原與恢復))。

`voices` 計算在**審議中發言**的視角數量 — 即在 `passes/NN/deliberation.json` 中具有非空的 `argument`。Skeptic 若檢視了佐證，確認發現成立並陳述該結論，即已參與表決；未發現問題也是一種結果，不應為了被計入而刻意捏造差異變更。略過審議的 pass 沒有傾聽任何意見，其回報的 `voices` 為 0。請分開觀察差異變更的 *ops*：若某 pass 的差異變更全部都是 `add`，不論其 `voices` 數值為何，代表它只是在累積發現而非進行審議論證。

## 應執行多少次 Pass

`ponder judge` 提供**建議**。`ponder decide` 進行**認可**。建議是根據涵蓋率、新穎度、變更率、反覆振盪率、意外度、停滯度、信心底線與發言視角計算得出 (公式與排序裁決規則詳見 `references/protocol.md`)。由於引擎無法得知您掌握的所有背景，因此建議可以被覆寫 — 但有一項例外，詳見下文。

**在做選擇之前先寫下 `--why`。** 無論您傾向哪種選擇，請先擬定您在 `ponder decide` 中要填寫的句子，並想像使用者在一個月後於 `report.md` 中閱讀該句子的感受。「兩次平靜的 pass、完整涵蓋率、每個待處理 must 的信心度均高於 0.5」屬於合理的停止理由。「沒有發現新東西」則不是 — 那是疲憊時寫下的句子。若您無法寫出經得起檢驗的 `--why`，您已得到答案：請再執行一次 pass。

**預設遵循建議。** 您可以朝任一方向進行覆寫，且兩個方向的代價相同：至少 12 個字元的 `--why`，並將永久記錄於 `report.md` 的 **Overrides** 底下。將 `stop` 覆寫為再執行一次 pass 是代價較小的錯誤 — 只是多一次 pass。將 `continue` 覆寫為 `stop` 則是代價昂貴的錯誤，其門檻必須符合下方誠實停止檢查清單的每一項要求，而非僅憑做完的感覺。下方的兩份檢查清單是實際做出決定的關鍵依據 — 引擎的規則為您提供了預設值，而您是迴圈中唯一能判斷該預設值是否正確的人。

當符合以下任一條件時，請覆寫建議朝「再執行一次 pass」進行：

- **上一次 pass 改變了您對重要事項的看法。** 若 pass N 刪除了您原本準備交付的發現、調整了嚴重性層級，或開啟了先前無人審視的維度，則 pass N+1 具有實質探索價值。後期的創新發現並非雜訊 — 它證明主題比您的清冊更加深奧。
- **某一類單元的評分過於淺顯。** 在先前的 pass 中從未審視過的畫面上僅記錄一個發現，屬於初步檢視，而非完整評分。同理，「所有六個強制回應視窗 (modal) 各自僅有一行簡述」亦然。涵蓋率計算的是單元數量，而非深度；引擎無法察覺這點，但您可以。
- **審議過程幾乎未實質發生。** `voices < 3` — 參與論辯的視角少於三個 — 或是四個視角都發言了，但差異變更依然全部屬於同一種 op。請再執行一次 pass，並特別指定 Skeptic 與 Empath 進行審議；缺失的視角通常是負責刪除發現的視角，而非新增發現。
- **您的預測出現嚴重偏差且實際變更率更高** (`surprise > 0.3` 且實際值高於預測值)。這表示您尚未建立該主題的精確模型，因此無法宣稱結果已穩定。

**當符合以下所有條件時，停止才是誠實的：**

- `coverage` 為 1.0 (引擎會強制執行此項；詳見下文)。
- 最近兩次 pass 未產生任何您會為之辯護為新發現的 `add`。
- `churn` 接近零，且發生的變動屬於排序調整，而非實質內容改變。
- 每個待處理的 `must` 發現其 `confidence >= 0.5` — 這在判定表上對應的是 `confidenceFloor 0.00`，而不僅僅是低於引擎強制要求的 0.2。您即將提出改善建議；一個您無法捍衛的 `must` 只是要求他人採取行動的臆測。若底線不為零，請前去補充佐證 (透過 `change` 提高信心度) 或降低其嚴重性。
- 您認為具實質意義的最後一次 pass 至少聽取了三個視角的意見。`ponder decide stop` 在少於三個視角時會發出警告但允許通過；若您選擇通過，請在 `--why` 中說明原因。
- 您從清冊中移除的每一個單元，其移除原因都必須是您願意對要求進行 ponder 的人當面說明的理由。請參閱下方的幽靈規則 (phantom rule)。

**非誠實的停止理由** 包括：您感到厭倦、上下文長度過長 (應使用 `ponder status` 與全新的子代理人處理)、剩餘發現撰寫起來枯燥乏味，或在數據仍在波動時達到 `maxPasses`。最後一種情況屬於**預算用盡停止 (budget stop)** — 引擎會將其回報為 `budget`，絕非收斂，您亦應如實說明。

**一個收斂中的 pass 本來就應該讓人感覺平靜，而未發出任何變更的 pass 是一個真實的成果。** 228 個畫面的最後一次 pass 中，四個視角產出的差異變更為零 — 每個視角都閱讀了集合，未發現任何需要變更之處，並明確陳述了這一點 — 這是正確且誠實的結果，絕非浪費一次 pass。這是迴圈所能產生的最強收斂佐證：四個視角都在尋找問題，卻均無所獲。請預期 pass 接近尾聲時會讓人感到缺乏戲劇性變化，切勿刻意捏造差異變更來證明自己的參與。底層機制允許此情況：`ponder delta` 接受空檔案，不套用任何變更，印出 `0 deltas applied` 與 `delta voices 0/4 - no perspective emitted a delta`，並如常推進階段。一個 `voices 4/4`、`delta voices 0/4` 且論述中具體說明*重新檢查了什麼以及為何維持原狀*的審議，即為收斂的 pass。若同樣的紀錄中四個論述僅僅表示「看起來沒問題」，則只是三個視角在敷衍應付，而只有您能分辨剛才執行的是哪一種。

**`blocked` 狀態不可被覆寫。** 當 `coverage < 1.0` 時，裁決為 `blocked`，它會指名每一個尚未評分的單元，且 `ponder decide stop` 會以非零代碼結束。其他每項裁決都屬於關於邊際效益遞減的判斷；唯獨這項裁決是關於工作未完成的事實，且這正是 ponder 存在所要防範的核心失誤 — 審查了 12 個畫面中的 11 個，卻回報得如同審查了全部 12 個一樣。唯一永遠有效的做法是：**去為遺漏的單元評分** (使用帶有 `add` 的 `ponder delta`)。對於完全不存在的單元，則有第二種狹義且經過引擎檢查的做法 — 即下方的幽靈規則。

請勿嘗試繞過限制。`ponder decide` 在您做出決定的當下，會依據 `units.json` 與 `findings.json` 重新計算涵蓋率，因此過期的 `metrics.json`、手動編輯的 `verdict.json`、調低的 `--min-passes`、`--json` 模式以及第二個工作階段，都無法動搖此防線。經測試驗證：上述每一種嘗試均會以結束代碼 `2` 結束，包含 `--json` — 它僅是將拒絕訊息以 `{"ok": false, "code": 2}` 回傳，而非印出。

**`escalate` 表示迴圈正在反覆振盪** (`thrash > 0.25` - 多次 pass 在相同目標上互相推翻變更)。執行另一次完全相同的 pass 毫無助益。請輪替主導視角、擴大閱讀佐證範圍，或將主題拆分為兩個工作階段分別進行 ponder。使用 `ponder decide escalate --why "..."` 進行認可，然後採取實質不同的行動。

預算規劃型態：`--min-passes 2` 是因為單次 pass 僅代表一種觀點，而非沉思審議；廣泛檢視建議使用 `--max-passes 6`，狹窄主題建議使用 3-4 次。

### 修正單元 - 標題說明必須與底下的發現一致

**單元的 `label` 是清冊上的標題說明，而修正底下發現的 pass 也必須同步修正標題說明。** Pass 1 將某個畫面列舉為 `"Marketing footer - both links 404"`。Pass 3 開啟了檔案，發現 `/privacy-policy` 能夠正常解析，並重寫了發現以反映事實。若標題說明無法變更，`report.md` 現在的主標題就會與直接印在其下方的發現產生矛盾。在真實的 228 個畫面執行中確實交付過此類錯誤，因為當時無法修正。現在已支援修正機制。

```
{"op":"unit-edit","target":"screen.marketing.footer","perspective":"builder","why":"Pass 1's label said both links 404; the finding under it now says the opposite, and says it correctly.","set":{"label":"Marketing footer - /privacy-policy resolves","meta":{"route":"/"}}}
```

- **它僅能設定 `label`、`path`、`kind`、`meta` — 其他一概不行。** 設定其他任何欄位都會被具名拒絕。
- **它絕不能設定 `id`。** `id` 是 `units.json` 與 `findings.json` 之間的關聯鍵；變更它會使該單元上的所有發現變成孤立項目。引擎會拒絕並說明原因。若 id 本身有誤，請使用 `unit-delete` 與 `unit-add` 重新建立修正後的單元，並承擔這對涵蓋率造成的影響。
- **`meta` 採逐鍵合併 (merge key by key)。** 修正路由會保留原本並存的 `state` 標記。其他所有欄位則直接替換。
- **涵蓋率不會變動。** 這正是其設計目的。若透過刪除單元再重新新增的方式修正標題說明，會使涵蓋率降至 1.0 以下並阻礙停止 — 錯誤的標題說明將迫使工作階段重新開啟。`unit-edit` 改為計入 `churn`，這很合乎情理：確實發生了內容變更。
- **它屬於一種修訂，因此會像修訂一樣計入振盪。** 在 pass 2 變更標籤並在 pass 3 還原，會被視為反向推翻變更。
- **它會被記錄在案。** 每個 `unit-edit` 都會出現在 `report.md` 的 **Corrected screens** 底下 (或您的鏡頭所稱的單元名稱)，並附帶其 pass、發言視角、新值與您的 `why`。若手動編輯 `units.json` 中的標籤而背後沒有總帳記錄，會被視為不一致分歧：`judge`、`decide`、`report` 及 `apply` 都會拒絕該工作階段，直到完成對帳為止。正式記錄修正標題說明只需一個 delta。非正式記錄的修正則不受支援。

僅在 pass 確實深入了解該單元時才使用此操作。切勿僅為了調整為個人偏好的字句而使用 — 這會產生您在 `decide` 階段必須提出辯護的變更率。

### 幽靈規則 (Phantom Rule) - 刪除從未檢視過的單元

`unit-delete` 是唯一能縮減未評分清單的 op，因此它是引擎監控最嚴格的操作。它對涵蓋率的影響取決於您是否曾檢視過該單元：

- **單元帶有發現** (即使是已撤回的發現 — 撤回判斷並不等於未曾審視過該事物)。刪除它屬於誠實的範圍變更。它會同時移出清冊與涵蓋率的分母。
- **單元從未被評分。** 它會移出清冊，但**仍留在涵蓋率的分母中**，依然被計入、依然未評分，防線閘門依然關閉。系統不會報錯。涵蓋率單純不會上升，若您是為了讓數值上升而刪除它，此做法無效。
- **單元從未被評分，且 delta 帶有 `"phantom": true`。** 此時分母才會下降 — 但需在引擎驗證通過之後。引擎會解析**該單元曾帶有的所有路徑** (從專案根目錄起算)：**只要其中任何一個路徑存在 → 整個批次都會被拒絕** (`Something you can open is not something pass 1 imagined`)；若所有路徑皆不存在且路徑未曾被修改過 → 接受並永久記錄為 `verified-missing`；若路徑曾被編輯過，或從未包含路徑 → 接受並永久記錄為 `unverified`。每個被接受的幽靈單元都會永久列於 `report.md` 的 **Phantom units** 底下，並在其下方引用您的 `why`。

```
{"op":"unit-delete","target":"screen.legacy.print","perspective":"skeptic","why":"Opened src/routes/legacy/print.tsx - the file is gone; the route was removed in #1841 and pass 1 enumerated it off a stale router snapshot.","phantom":true}
```

**現在談核心關鍵。** `phantom` 是指宣稱某個路由不存在 — 即 pass 1 的調查列舉了軟體中根本沒有的東西。它絕不是宣稱您用盡了上下文空間、時間或耐心。

**若您沒有檢視過某個畫面，切勿從清單中將其刪除。請前去檢視它。** 這就是任務的全部。引擎只能在單元包含路徑可供檢查時捕獲問題；沒有路徑的單元僅憑您的單方面聲明即予接受，且只要該工作階段存在，紀錄中就會在您的 `why` 旁標記 `unverified`。針對您單純未曾開啟過的路由標註 `"phantom": true`，是對保留該記錄之檔案的不誠實行為 — 這正是 ponder 當初為了杜絕半途而廢的審查而建立的防線，卻被人工刻意繞過。

在撰寫 `phantom` 之前，請回答一個問題：**我開啟了什麼，而那裡缺少了什麼？** 若答案指出具體路徑與缺失事實，請填入 `why` 並提交 delta。若答案是「沒什麼，我只是沒時間處理它」，那麼您面對的是一個需要評分的單元，而不是一個可以宣稱的幽靈。

**而且變更路徑絕不是繞過該規則的手段。** `unit-edit` 可以變更單元的 `path`。透過兩個 delta — 先將單元指向一個不存在的檔名，再宣稱它從未存在過 — 意圖讓引擎證實一個明明就存在於存放庫中的畫面不存在。這與上一段所述的不誠實本質完全相同，只是換了新的 op 包裝，而引擎已防堵了此漏洞：**幽靈宣稱會針對該單元曾帶有的每一個路徑進行檢查** — 包括其 `unit-seed` 或 `unit-add` 所賦予的路徑、之後任何 `unit-edit` 設定過的值、`units.json` 當前持有的路徑，以及在同一批次中稍早設定的任何路徑。只要有一個路徑存在，整個批次即告失敗，拒絕訊息會指名找到的路徑以及設定該路徑的 pass：

```
delta line 3: unit "screen.auth.sso" is claimed phantom, but a path it has carried exists:
/abs/src/routes/auth/sso.tsx (carried by the unit-add that created it in pass 4). Something you
can open is not something pass 1 imagined. A phantom claim is checked against every path the unit
has ever had, so editing the path first does not clear it.
```

編輯路徑也絕不會*強化*幽靈宣稱的效力。若路徑曾被變更且各版本均不存在，該宣稱雖會被接受，但會被永久記錄為 `unverified` — 絕非 `verified-missing` — 且 `report.md` 會列出檢查了哪些路徑。即使所有版本皆遺失，引擎依然不會予以證實，因為「遺失」與「從未存在」唯有在目標未曾移動的情況下才代表同一件事。因此，變更路徑不會帶來任何好處，反而會在單元消失前留下其曾被搬移的永久註記。

若清冊中的路徑確實有誤，請使用 `unit-edit` 予以修正，然後**去評估該畫面**。這才是該 op 的真正用途。它絕不是刪除畫面過程中的跳板步驟。

**還有一種拒絕與您的操作完全無關。** 每個路徑都是從工作階段的專案根目錄解析，因此該檢查的準確度取決於該根目錄的正確性。若根目錄是*推測*出來的 — 未指定 `--project`，且在您啟動的目錄之上沒有任何 `.git` / `package.json` / 其他專案標記，導致引擎採用了散落的 `.ponder` 或退回使用目前工作目錄 — 則無法解析的路徑並不能說明任何事實，該宣稱會被拒絕：

```
delta line 2: unit "screen.settings.profile" is claimed phantom and none of the 2 paths it has
carried (src/routes/settings/profile.tsx, src/routes/settings/profile-v2.tsx) resolves under
/private/tmp - but that project root was guessed, not established (no project marker anywhere
above the working directory; adopted an ancestor .ponder). A file that is missing from the wrong
directory is not a screen that never existed.
```

這是引擎拒絕為自身推測背書的表現。`ponder start` 與 `ponder status` 會印出專案根目錄以及判定依據，因此請先檢查該行：若顯示根目錄為採用 (adopted) 或退回 (fallen back)，且並非軟體實際所在之處，請使用 `--project <path>` 重新啟動工作階段，以便正確檢查宣稱。從未帶有路徑的單元不受影響 — 因為沒有需要由根目錄解析的目標，依然憑您的聲明接受為 `unverified`。

當您確實無法完成時，誠實的結束途徑是 `ponder decide continue` (在下一次 pass 處理) 以及 `ponder abort --why "..."` (說明阻礙的原因)。這兩種方式留下的記錄在事後看來都是真實的。虛假的幽靈宣告則不然。

## 跨多個單元的分散展開 (Fanning Out)

對 40 個畫面進行全盤掃描無法容納在單一上下文空間中，也不應該嘗試這麼做。請批次處理*評分*；保持*工作階段*單一執行緒運作。

**批次規則: 每個代理人 8-12 個單元。** 過少會浪費上下文；過多則會使批次後段的單元審查品質低於前段 — 這正是您隨後必須耗費一個 pass 去修正的淺顯評分失誤。

分散展開的不可妥協原則：

- **僅有父代理人執行 `ponder`。** 批次代理人負責評分並傳回文字。引擎確實對工作階段持有互斥鎖定，因此競爭不會導致毀損 — 但競爭會有**失敗者**，而失敗者的工作會被拒絕而非合併。若有兩個並行的 `ponder delta` 呼叫：一個會套用其批次並推進階段；另一個等候鎖定、重新載入工作階段後，發現當前應執行 `judge`，因而以結束代碼 `2` 結束且未套用任何內容。若子代理人未檢查其結束代碼，則會在整批工作未被採納的情況下回報成功。請從批次代理人收集 JSONL，串接後由您親自發出一次呼叫。(`references/harness-notes.md` 包含鎖定的完整行為 — 等候機制、過期回收、失敗者所見情況。)
- **提供每個代理人量表規則、其專屬單元及輸出結構** — 鏡頭套件文字、帶有路徑的單元清單、各維度、1-5 分量表。在 pass 1 中切勿提供整個發現集合；您需要的是獨立的評分，而非妥協共識。
- **在修正 pass 中，僅提供每個代理人其自身單元的當前發現**，並要求提供*差異變更 (deltas)*，而非重新評分。若要求重新評分，您會得到三十個與既有內容重複的 `add`，隨後 Skeptic 必須將其刪除，接著振盪偵測器就會發出警示。
- **要求 JSONL 格式，每行一個物件，且不包含其他內容** — 無散文、無程式碼圍欄。被截斷的行可被丟棄；被截斷的 JSON 陣列則是無效廢棄資料。後續串接只需使用 `cat`。

**在 Claude Code 中：** 使用 Agent 工具，每個批次一個代理人，全數在單一訊息中啟動以便平行執行。每個代理人將其內容行寫入 `.ponder/tmp/batch/findings-<n>.jsonl`，並僅傳回路徑與筆數。對於極大型掃描 (60+ 單元，或批次需要重試者)，Workflow 工具在批次處理與結果收集方面優於手動編排的平行代理人。

**在 Codex 中：** 沒有同處理程序內的子代理人。可為每個批次產生 `codex exec` 子處理程序 —

```sh
codex exec -C "$PWD" --sandbox workspace-write --skip-git-repo-check \
  -o .ponder/tmp/batch/batch-3.txt \
  "Grade these 10 screens against ~/code/ponder/lenses/ui.md. Units: ... .
   Write one JSON finding object per line to .ponder/tmp/batch/findings-3.jsonl. Output nothing else." \
  </dev/null &
```

- 使用 `&` 在背景執行並以 `wait` 收集；或在**單一上下文中循序執行批次**，將每個批次的 JSONL 寫入磁碟並在開始下一個批次前丟棄詳細資訊。循序執行較慢，但沒有子處理程序或沙盒的不可預期問題，且無論如何磁碟就是您的記憶體。`codex exec` 會啟動全新的工作階段且不繼承您的任何上下文，因此所需的一切都必須置於提示詞或其可讀取的檔案中。

該指令列上的兩個額外 token 都不是裝飾品。少了 `--skip-git-repo-check`，子處理程序在執行任何工作前就會以結束代碼 `1` 結束 — `Not inside a trusted directory and --skip-git-repo-check was not specified` — 因此在非 git 簽出目錄進行 ponder 會一次失去所有批次。而 `codex exec` 即使提示詞作為引數提供時也會讀取 stdin；若使用 `&` 在背景執行，它會繼承父處理程序的 stdin，因此 `</dev/null` 是防止批次在無人會關閉的管道上發生封鎖的關鍵。

隨後，在任一種測試控管環境中，串接一次並交給引擎單一檔案。`ponder grade` 接受 JSON 而非 JSONL，因此批次內容行需要進行包裝：

```sh
cat .ponder/tmp/batch/findings-*.jsonl > .ponder/tmp/all.jsonl
node -e 'let s="";process.stdin.setEncoding("utf8");process.stdin.on("data",d=>s+=d).on("end",()=>{const findings=s.split("\n").filter(Boolean).map((l)=>JSON.parse(l));process.stdout.write(JSON.stringify({version:1,findings},null,2)+"\n")})' \
  < .ponder/tmp/all.jsonl > .ponder/tmp/findings.json
ponder grade --file .ponder/tmp/findings.json
```

`setEncoding("utf8")` 並非裝飾品。若無此設定，區塊會以 Buffer 形式到達且各自被字串化，因此跨越 64 KB 讀取邊界的多位元組字元會被強制轉為替換字元。經確定性重現驗證：在沒有此設定的情況下，65,535 個 ASCII 位元組後接 `數` 會將該字元轉變為三個 `U+FFFD`，設定後則完好無損。此問題是否發生取決於引號與重音符號恰好落在何處，這是資料毀損最惡劣的特性 — 交付了亂碼標題，結束代碼卻乾淨無警示，且發現問題的執行階段並非存在 bug 的執行階段。

**將批次檔案暫存在其專屬目錄中 (`.ponder/tmp/batch/`)，且絕不要讓串接的 glob 萬用字元符合到自身輸出。** `cat .ponder/tmp/deltas-*.jsonl > .ponder/tmp/deltas-2.jsonl` 只能正常運作一次：當批次失敗被要求重新執行時，該 glob 此時會符合到 `deltas-2.jsonl`，shell 在 `cat` 開啟檔案前就將其截斷，導致 `cat` 最終讀取它正在寫入的同一個檔案。

接下來發生的情況取決於排序順序。經實際測試：當 `deltas-1.jsonl` 排序在目標*之前*時，`cat` 會先複製批次 1，接著開啟 `deltas-2.jsonl` 並讀取剛剛寫入的內容 — 形成一個填滿磁碟的無限迴圈 (測試中使用 `ulimit -f` 限制為 20 MB，達到上限時仍在攀升)。若目標排序在最前，則不會形成迴圈：它會讀取空檔案，讓您無聲無息地遺失部分批次資料。因此，失敗模式可能是磁碟全滿或默默遺失資料，完全取決於您的命名方式，「我試過一次沒問題」不能證明任何事。差異變更不需要包裝，因此：

```sh
cat .ponder/tmp/batch/deltas-2-*.jsonl > .ponder/tmp/deltas-2.jsonl   # 模式不會符合目標檔案
ponder delta --file .ponder/tmp/deltas-2.jsonl
```

審議階段不會按單元分散展開。它是按視角分散展開 — 四個代理人，每個視角一個，面對相同的發現集合，各自僅發出自身的 delta op。請參閱 `references/perspectives.md`。

## 復原與恢復 (Resumption)

**若您遺失了上下文，切勿猜測也切勿重新開始。請執行 `ponder status`。**

```sh
ponder status
```

```
ponder status - ui-2026-08-24
  session       ui-2026-08-24  open
  subject       the UI
  lens          ui - unit = screen, 12 dimensions
  grade on      information-hierarchy, empty-states, loading-states, error-states, motion,
            affordance-clarity, density, responsive-behaviour, accessibility,
            copy-tone, consistency, delight
  pass          3 of 6  (min 2)
  owes          deliberate
  coverage      0.92 - 11 of 12 screens graded
  findings      29 total · 26 open · 0 resolved · 0 deferred · 3 retracted
  prediction    churn 0.12 - "The invite route is small; one or two findings there and no…"
  signals p2    novelty 0.12  churn 0.42  thrash 0.00  surprise 0.02  stall 0  conf-floor 0.11  voices 4/4
  last verdict  pass 2: blocked → decided continue - "Dreamer found /invite/:token. Cannot stop with a screen…"
  oca           reachable - postgres://localhost/oneiro
  store         /abs/path/.ponder/ui-2026-08-24

  1 ungraded screen - stop is refused until this list is empty:
    screen.invite.accept

  History
    pass  advice    decision  reason
    1     continue  continue  Pass 1 is the inventory plus a first opinion. Nothi…
    2     blocked   continue  Dreamer found /invite/:token. Cannot stop with a sc…

NEXT: deliberate - ponder deliberate --file deliberation.json --session ui-2026-08-24   # or: ponder deliberate --skip --why "<reason>"
```

**請依據 `owes` 該列與 `NEXT:` 該行採取行動。** `NEXT:` 是字面指令，已包含 `--session`；直接貼上即可。恢復工作所需的所有其他資訊都在同一個區塊中：哪一次 pass、還有哪些單元未評分、上一次 pass 做了什麼決定及其原因，以及檔案所在位置。`signals` 列標註了其來源 pass — 在處理 pass 3 時顯示為 `signals p2`，因為當前 pass 尚未經過判定。

### 透過五個指令重新回到工作軌道

請依序執行以下指令。切勿以記憶取代其中任何一步。

```sh
ponder status                                   # 1. 檢視 pass、應執行的階段、未評分清單
ponder verify                                   # 2. 檔案內容是否仍與總帳一致？
cat .ponder/<slug>/findings.json                # 3. 當前真相 - 包含 id 的每個有效發現
cat .ponder/<slug>/ledger.jsonl                 # 4. 演變歷程: 每個 delta、每個 why，依序排列
ponder report                                   # 5. 選用，當您需要易讀格式而非原始資料時
```

然後執行 `NEXT:` 所印出的指令。

**`ponder verify` 是針對非您本人親自維持在已知狀態的工作階段所使用的指令** — 例如接手自他人、由另一個代理人驅動，或上一個指令曾遭中斷的工作階段。它會從第 1 行開始重播 `ledger.jsonl`，推導出 `units.json` 與 `findings.json` 必須包含的內容並進行比對 — 接著比對總帳與各 pass 的 `deltas.jsonl` 檔案 (這些是以第二份形式寫入的相同記錄)。結束代碼 `0` 且附帶摘要表示工作階段完好。結束代碼 `2` 則會列出不一致的每個 id 與欄位，且 `judge`、`decide`、`report` 及 `apply` 也會基於相同理由拒絕該工作階段，因此提早發現總比在裁決時受阻更好。

每個指令在寫入狀態檔案**之前**都會先寫入 `ledger.jsonl`，因此中斷的指令唯一可能留下的只有比自身檢視表更超前的總帳 — 而這是可以修復的。**`ponder verify --repair`** 會重播總帳，將狀態檔案重寫為這些記錄所應產生的狀態，將缺失的結尾附加至任何 pass 的 `deltas.jsonl`，並逐行印出重建的內容。當狀態檔案中包含**總帳記錄從未建立過**的單元或發現時，它會拒絕修復並以結束代碼 `2` 結束：該資料僅存在於該處，無從重建，不是偽造就是無法復原的遺失。切勿試圖尋找強制旗標 — 沒有這種旗標，且 `--repair` 絕不憑空捏造狀態。在不加 `--repair` 的情況下，`verify` 不會寫入任何內容，因此執行它是完全零成本的。

步驟 3 與 4 對於迴圈中途的 pass 而言並非選讀項目。您無法對未曾重新閱讀過的發現集合進行審議，且若未將總帳放在眼前，您就無法避免重複新增 Skeptic 在兩次 pass 前才刪除的項目 — 這正是 `thrash` 所衡量的現象，也是您自己造成的 `escalate` 形態。對於龐大的集合，請閱讀此 pass 涉及單元的發現，以及觸及這些單元的每行總帳記錄。

您可能需要的其他事項：

- `ponder status --json` 提供相同內容的機器可讀格式，包含未評分單元清單。
- `ponder list` 顯示從此處可見的所有工作階段 — 包括此專案的 `.ponder/` 與 `~/.ponder/` 備用存放區 — 附帶各自的狀態、pass、階段與涵蓋率。這是尋找忘記的 slug 的方法。隨後每個其他指令都可接受 `--session <slug>` 來指定目標。**切勿因為失去思路而建立新工作階段** — 這會丟棄總帳，而總帳才是核心價值所在。
- `findings.json` 或 `ledger.jsonl` 中的任何內容都絕不會被抹除。撤回 (retraction) 是一種狀態，因此 pass 2 的推理在 pass 6 中依然清晰可讀，後續的 pass 亦可推翻先前 pass 的刪除決定。
- `ponder doctor` 會對帳其可見的所有工作階段，並在 **Problems** 底下列出失敗的工作階段，附帶診斷各工作階段所需的 `ponder verify --session <slug>`。這是一台充滿工作階段的機器告訴您哪一個已損壞的方式。
- **切勿手動編輯 `units.json` 或 `findings.json` 來修復問題。** 總帳才是權威依據，每個決策點指令都會對照總帳重新計算，因此手動編輯不但無法修正工作階段，反而會破壞它，您將在 `judge` 階段遭遇拒絕。任何您想透過該方式修復的項目都有對應的 delta：`edit`、`change`、`delete`、`unit-add`、`unit-edit`、`unit-delete`。
- 重新執行已滿足的階段會以結束代碼 `2` 結束，並指名您實際應執行的階段。這不是需要設法規避的錯誤；這是狀態機在矯正您的記憶。
- 若主題在過程中確實發生實質變化，請執行 `ponder abort --why "..."` 並重新建立乾淨的工作階段。暗中重新調整開放中工作階段的範圍會污染其指標數據。

若您是分散展開代理人的父處理程序且其中一個代理人失敗，僅需重新執行該批次。狀態保存在檔案中，而非存在於任何人的上下文記憶中。

**上下文壓縮 (compaction) 不是停止的理由。** 它是整個架構設計所圍繞防範的失敗模式：檔案完整保存了沉思審議進度，`ponder status` 能將其完整交還，迴圈得以從原點精確繼續。因為上下文變長而決定 `stop`，只是以技術藉口包裝的不誠實停止 — 且若涵蓋率不足，引擎無論如何都會拒絕它。

## 操作範例 - 評估 UI

十二個畫面，四次 pass，其中一次處於受阻狀態。全程採精簡說明。

**Pass 1 - 建立種子。**

```sh
mkdir -p .ponder/tmp/batch
ponder start "the UI" --lens ui --max-passes 6 --min-passes 2
ponder predict --churn 0.9 --claim "Pass 1 is seeding. I expect the empty and error states to be the weak dimensions and the dashboard to grade well."
```

在 pass 1 中會記錄此數值但不計分 — 因為沒有前一次 pass 可用來計算變更率 — 因此 `--claim` 是在 pass 2 中值得閱讀的部分。兩者都會記入 `passes/01/predict.json` 與 `report.md`。

依鏡頭進行列舉 — 單元是指使用者可以注視的一個畫面事物，因此具有相異
空白、載入或失敗狀態的路由屬於多個單元。跨七個路由列舉出十一個單元 (請記住此數字)：

```json
{ "version": 1, "lens": "ui", "units": [
  { "id": "screen.dashboard", "label": "Dashboard - populated", "path": "src/routes/dashboard.tsx",
    "kind": "screen", "meta": { "route": "/" } },
  { "id": "screen.settings.billing.empty", "label": "Settings → Billing - no invoices",
    "path": "src/routes/settings/billing.tsx",
    "kind": "screen", "meta": { "route": "/settings/billing", "state": "empty" } }
] }
```

```sh
ponder units --file .ponder/tmp/units.json     # 11 個單元
ponder grade --file .ponder/tmp/findings.json  # 24 個發現 → f-0001..f-0024
ponder deliberate --file .ponder/tmp/deliberation-1.json
ponder delta --file .ponder/tmp/deltas-1.jsonl # 8 個 delta: 2 add, 3 edit, 2 change, 1 delete
ponder judge
ponder decide continue --why "Pass 1 is the inventory plus a first opinion. Nothing has been argued with yet."
```

在 pass 1 中，八個信號中有四個 (`novelty`、`churn`、`thrash`、`surprise`) 顯示為 `-`，因為沒有前一次 pass 可衡量變動；`coverage` (1.00)、`confidenceFloor` (0.14)、`stall` (0) 與 `voices` (4/4) 描述當前狀態。規則 2 無論如何都會建議 `continue`，因為單次 pass 僅代表一種觀點，而非沉思審議。

**Pass 2 - 修正 pass。這正是價值所在。**

```sh
ponder predict --churn 0.4 --claim "Pass 1 over-graded card polish and never opened the error paths. Expect deletes on the dashboard and new findings on 500/timeout."
ponder deliberate --file .ponder/tmp/deliberation-2.json
```

```json
{ "question": "Does the pass-1 finding set survive a second reading of the code?",
  "skeptic": { "argument": "Two findings are unsupported. f-0011 claims inconsistent card padding; both cards resolve to --space-4. f-0019 is f-0004 on a different screen - same root cause, counted twice.", "confidence": 0.85 },
  "builder": { "argument": "Half the recommendations name a problem instead of a change. 'Improve hierarchy' is not a next step.", "confidence": 0.7 },
  "dreamer": { "argument": "Nobody has asked what any screen does when the API 500s. Every finding so far assumes the happy path. Also: /invite/:token exists and is not in the inventory.", "confidence": 0.75 },
  "empath": { "argument": "The billing empty state blocks a first-run user; it outranks three polish findings currently scored above it.", "confidence": 0.7 } }
```

差異變更 — 刪除 pass 1 的兩個發現，新增三個發現，加上遺漏的路由 (請注意 `unit-add` 必須置於任何針對該新單元的 `add`、`unit-edit` 或 `unit-delete` 之前，因為差異變更是依檔案順序套用的)：

```
{"op":"delete","target":"f-0011","perspective":"skeptic","why":"Claimed inconsistent card padding; both cards resolve to --space-4. Unsupported."}
{"op":"delete","target":"f-0019","perspective":"skeptic","why":"Duplicate of f-0004 - same root cause on a different screen."}
{"op":"unit-add","perspective":"dreamer","why":"Route exists and was missed in the pass 1 survey. One unit, not four: the loader validates the token server-side and an invalid or spent token 404s at the router, so there is only ever one render state.","unit":{"id":"screen.invite.accept","label":"Accept invite","path":"src/routes/invite/accept.tsx","kind":"screen","meta":{"route":"/invite/:token"}}}
{"op":"add","perspective":"dreamer","why":"No pass had asked what any screen does when the API 500s.","finding":{"unit":"screen.projects.detail","title":"No error state - a failed load renders an empty shell","detail":"The query error branch returns null, so a 500 is indistinguishable from 'no projects'.","dimension":"error-states","score":1,"severity":"must","confidence":0.85,"effort":"m","evidence":["src/routes/projects/[id].tsx:41-60"],"recommendation":"Render a failure state with the cause and a retry that refetches."}}
{"op":"edit","target":"f-0007","perspective":"builder","why":"Recommendation named the problem, not the change.","set":{"recommendation":"Add an empty state with cause, expectation and a 'Add payment method' primary action."}}
{"op":"change","target":"f-0009","perspective":"empath","why":"Blocks first-run; outranks polish.","set":{"severity":"must","score":2}}
```

```sh
ponder delta --file .ponder/tmp/deltas-2.jsonl  # 11 個 delta: 3 add, 3 edit, 2 change, 2 delete, 1 unit-add
ponder judge
```

```
ponder judge - pass 2 of 6
  signal           value  reads as
  coverage         0.92   11 of 12 screens graded
  novelty          0.12   revising adds ÷ live findings
  churn            0.42   revising deltas ÷ live findings
  thrash           0.00   0 reversing deltas
  surprise         0.02   predicted 0.40, got 0.42
  stall            0      consecutive passes under 0.02 churn
  confidenceFloor  0.11   open must-findings still guessing
  voices           4/4    builder, dreamer, empath, skeptic
  delta voices     4/4    builder, dreamer, empath, skeptic

  advice: blocked - 1 of 12 screen has never been graded. Stopping is not permitted.

  1 ungraded screen - "ponder decide stop" will be refused:
    screen.invite.accept

NEXT: decide - ponder decide continue --why "<reason>" --session ui-2026-08-24   # blocked: 1 ungraded screen - stop is refused until coverage is 1.0
```

Dreamer 在審議階段發現了一個路由，當時評估階段已結束。涵蓋率降至 11/12 且裁決為 `blocked` — 無法覆寫。請注意，即使 Skeptic 刪除了 pass 1 的兩個發現，thrash 仍維持在 0.00：pass 1 的種子建立並非審議性的 `add`，因此刪除其中的雜訊被視為 Skeptic 的正常職責，而非迴圈自我推翻。

```sh
ponder decide continue --why "Dreamer found /invite/:token. Cannot stop with a screen nobody has graded."
```

**Pass 3 - 彌補落差，並修正 pass 2 為其所加的標題說明。**

```sh
ponder predict --churn 0.12 --claim "The invite route is small; one or two findings there and nothing new elsewhere."
ponder deliberate --file .ponder/tmp/deliberation-3.json
```

評估邀請路由時，發現了無人描述過的畫面。Pass 2 的 Dreamer 根據路由器將其命名為 `"Accept invite"`；開啟檔案後發現，接受只是*兩個*按鈕之一，而 Dreamer 的 `add` 指向其旁的拒絕按鈕。Builder 使用 `unit-edit` 更新單元標題說明，避免 `report.md` 與底下的發現相牴觸：

```
{"op":"unit-edit","target":"screen.invite.accept","perspective":"builder","why":"Pass 2 named this screen off the router and called it \"Accept invite\". The finding filed against it this pass is about the decline button beside accept, so the caption now contradicts the finding printed under it.","set":{"label":"Accept or decline invite"}}
```

```sh
ponder delta --file .ponder/tmp/deltas-3.jsonl  # 2 個 delta: 1 add, 1 unit-edit
ponder judge
ponder decide continue --why "The invite route earned one finding on a thin pass. I don't trust a one-look grade on a screen no earlier pass had seen."
```

Pass 3 上的 `ponder judge` 回報 `coverage 1.00` (12/12)、`novelty 0.04`、`churn 0.07`、`voices 4/4` 與 `delta voices 2/4` (Skeptic 與 Empath 驗證了集合且未發現需要變更之處)。由於收斂需要連續兩次平靜的 pass，而 pass 2 的變更率為 `0.42`，引擎建議 `continue`。

**Pass 4 - 確認。**

```sh
ponder predict --churn 0.05 --claim "The invite route holds up on a hard second read. At most a ranking change."
ponder deliberate --file .ponder/tmp/deliberation-4.json   # 由 builder 與 empath 進行針對性複查
ponder delta --file .ponder/tmp/deltas-4.jsonl  # 2 個 delta: 1 edit, 1 change。無新增 (adds)。
ponder judge
```

包含兩個鍵值的審議檔案是合法的，但在執行 `deliberate`、`delta` 及 `decide stop` 時會印出警告，提醒您在 `--why` 中說明為何少於三個視角發言。在此處，Empath 的 `change` 在執行該案例後將 `f-0014` 的信心度提升至 0.5 以上，將 `confidenceFloor` 推至 `0.00`：

```
ponder judge - pass 4 of 6
  signal           value  reads as
  coverage         1.00   12 of 12 screens graded
  novelty          0.00   revising adds ÷ live findings
  churn            0.07   revising deltas ÷ live findings
  thrash           0.00   0 reversing deltas
  surprise         0.02   predicted 0.05, got 0.07
  stall            0      consecutive passes under 0.02 churn
  confidenceFloor  0.00   open must-findings still guessing
  voices           2/4    builder, empath
  delta voices     2/4    builder, empath

  advice: stop - novelty 0.00 and churn 0.07, two passes running. Further passes stopped changing the answer.

NEXT: decide - ponder decide stop --why "<reason>" --session ui-2026-08-24   # 引擎建議停止
```

```sh
ponder decide stop --why "Coverage 12/12, two consecutive quiet passes, no open must-fix under 0.5 confidence. Pass 4 heard two voices because it was a targeted re-check of the invite screen and the last shaky must; passes 2 and 3 heard all four."
ponder report --out docs/ui-ponder.md
ponder apply --dry-run --severity must,should
```

唯有引擎因 `converged` 理由建議的 `stop`，才會將工作階段標記為 **converged** (收斂) 關閉；預算用盡停止、固執停止或覆寫則會將其標記為 **stopped** 關閉，`report.md` 會明確載明。`ponder apply` 會產出按單元分組的有序工作計畫，並附帶佐證路徑與改善建議。**Ponder 絕不編輯受審主題的原始碼** — 它將計畫交給您，由您執行實際修改。`--dry-run` 僅印出而不變更任何內容；省略它則會寫入 `apply-plan.md` 並將工作階段標記為 `applied` (最終狀態)。對處於開啟或中止狀態的工作階段執行 `apply` 會以結束代碼 `2` 結束。

## 反模式 (Anti-patterns)

- 僅執行一次 pass 就將其作為 ponder 成果回報。
- 某個 pass 的差異變更全部都是 `add`。這代表您只是在堆疊累積；您並未進行審議 — 且 `voices 4/4` 並不能作為藉口，因為它計算的是誰發言了，而不是改變了什麼。
- 每次 pass 都預測極低的變更率以顯得校準精確。這會摧毀 `surprise`，而它是唯一能反應您是否理解該主題的信號。
- 因為某發現優先順序低而 `delete` 它。刪除是用於缺乏佐證、重複或錯誤的發現。優先順序低應使用 `change` 調整 `severity` 或標記為 `status: deferred` — 撤回會將其從排序中隱藏，而非對其進行排序。
- 從清冊中刪除單元以清除 `blocked` 裁決。這無法清除該狀態 — 從未被評分的單元依然會留在涵蓋率分母中。
- 對從未開啟過的路由宣稱 `"phantom": true`。幽靈意味著該事物不存在。若您未曾檢視，請前去檢視。
- 使用 `unit-edit` 將路徑指向不存在的目標，隨後對其宣稱幽靈。引擎會檢查該單元曾帶有的所有路徑並拒絕該批次。這只是上一項反模式換了個步驟。
- 在平靜的 pass 中刻意捏造差異變更以顯得有所作為。四個視角各自說明重新檢查了什麼且變更為零，這代表收斂；一個憑空捏造的 `edit` 則是您必須永遠在 `report.md` 中為其辯護的變更負擔。
- 手動編輯 `units.json` 或 `findings.json`。這屬於不一致分歧而非修復 — `judge`、`decide`、`report` 及 `apply` 皆會拒絕它。請使用 delta。
- 允許分散展開代理人呼叫 `ponder`。
- 在上下文壓縮後啟動新工作階段，而非執行 `ponder status`。
- 試圖尋找繞過 `blocked` 的途徑 — 旗標、環境變數、手動編輯 `metrics.json`。沒有這種途徑；涵蓋率是在做決策的當下重新計算的。將時間花在評估該單元上會更有價值。
- 將本檔案中的終端機輸出記錄視為引擎的固定合約。它僅展示 pass 的外觀輪廓。`ponder status` 與 `NEXT:` 那一行才是真正的依據。
