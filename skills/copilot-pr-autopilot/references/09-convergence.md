# 第 9 步：收斂驗證

子代理類型：`explore`；預算：3 分鐘。

## 輸入

- `PrNumber`。
- 來自第 7 步的已推送 `HeadOid`（用於獨立健全性檢查）。
- 迴圈是在正常模式還是[單次迭代模式](orchestration.md#single-iteration-fallback)（於第 1 步決定）。

## 回傳契約

```
{ converged, head_oid, latest_review_commit_oid, submitted_at,
  open_thread_count, open_threads_awaiting_reply, escalated_threads }
```

`converged` 是單一事實來源的布林值 — 由 `02-check-review-status.ps1` 回傳的 `Converged: true`。

## 程序

執行狀態檢查，只有當迴圈在第 1 步走了 fallback（單次迭代）時，才傳 `-SingleIteration`：

```pwsh
pwsh ./scripts/02-check-review-status.ps1 -PrNumber <n>
# single-iteration variant:
pwsh ./scripts/02-check-review-status.ps1 -PrNumber <n> -SingleIteration
```

然後執行**獨立的 HEAD 與 `LatestCopilotReview.commitOid` 的健全性比對** — 父紀錄在第 7 步保存的 `HeadOid` 應與 `HEAD` 相符，並且（在正常模式下）應與最新審查的 `commitOid` 相符。

## 決策：迴圈回頭或結束

執行狀態檢查後，父代理**必須**以 `converged` 分支：

```
if converged == true:
    run step 10 once (cleanup outdated)
    call task_complete with proof (HeadOid, LatestCopilotReview.commitOid, submittedAt)
    DONE — exit the loop
else:
    # non-converged = a fresh Copilot finding OR an unresolved human thread.
    # round = count of Copilot review submissions in the PR's history,
    #         read deterministically from the API (NOT a mental tally):
    #             pwsh ./scripts/09-review-round.ps1 -PrNumber <n>   -> {Round, RecapDue}
    if RecapDue == true:                        # Round is 10, 20, 30, ...
        RUN THE RECAP GATE (see "Round cap & recap gate" below) BEFORE looping:
            recap ALL prior rounds, then pick CONTINUE / REVERT-AND-SHIP / HAND-OFF.
            CONTINUE        -> fall through and start another round
            REVERT-AND-SHIP -> drop drifted commits, ship the in-scope result, exit
            HAND-OFF        -> escalate to the user with the recap, exit
    GO BACK TO STEP 1 — start another round
    (re-trigger via 01-request-review.ps1, wait via 02-wait,
     list via 03-list-threads, triage, fix, push, reply+resolve,
     re-check via this step)
```

非收斂（non-converged）結果**自行並非**終止條件 — 每一輪都要處理先前輪次在 PR HEAD 上的開放審查回饋，無論是 **Copilot 的發現** 或 **人工的 review 註解**（此 skill 同時處理兩者）。只有當**沒有來自任一來源的新審查註解**且**所有開放討論串 — Copilot 或人工 — 都已由代理回覆**（代理升級給使用者也算回覆；它仍會保留在 `OpenThreadCount` 中，作為明確的交接，而非迴圈工作）時，迴圈才會終止。但「非終止」並不代表「無限」：機器人審查迴圈沒有保證的固定點，因此父代理在[round-cap recap gate](#round-cap--recap-gate-circuit-breaker) 使用推理式的上限決定何時停手。被腳本化的是**輪次計數**本身（見 [`09-review-round.ps1`](../scripts/09-review-round.ps1)），因此 gate 的觸發是可確定的而非靠記憶。

`-SingleIteration` 模式是**唯一**例外：依定義它只跑一輪（觸發路徑不可用），無論 `converged` 為何，該結果都視為終局。

### 收斂語義

`02-check-review-status.ps1` 實作了 PR 狀態守衛以及三個收斂分支（參見該腳本末段 `Converged = if (...)` 區塊以取得規範來源）：

- **PR 狀態守衛（覆蓋一切）** — 若 `State != 'OPEN'`（CLOSED / MERGED），則不論其他旗標，`Converged: false`。代理不能對非 OPEN 的 PR 推送；應將狀態變更回報給使用者並中止迴圈，而不是呼叫 `task_complete`。
- **正常（Copilot 驅動）模式** — 如果存在 Copilot 審查或 `CopilotPending: true`：
  當且僅當 `ReviewAtHead && NoNewComments && OpenThreadsAwaitingReply == 0` 時，`Converged: true`。
- **單次迭代模式**（因第 1 步採用 fallback 而傳入 `-SingleIteration`）：
  當且僅當 `OpenThreadsAwaitingReply == 0` 時，`Converged: true`。因為沒有新的 Copilot 審查，舊審查檢查無法推進，故省略這些檢查。
- **從未觀察到 Copilot 審查 且 也未 pending**（全新 PR 無發現，或觸發悄然失敗且未以 `-SingleIteration` 呼叫腳本）：
  當且僅當 `OpenThreadsAwaitingReply == 0` 時，`Converged: true`。**在第 1 步尚未執行前，不要把這視為「迴圈完成」** — 它只表示沒有人工討論串的待辦工作。父代理**必須**先執行 `01-request-review.ps1`（依照[第 1 步](01-request-review.md)），然後再重新檢查；把 brand-new-PR 視為終局會跳過整個迴圈流程。

當代理把討論串升級給使用者而保留開放討論時，`OpenThreadCount` 可能仍 > 0 — 這是明確的人工作交接，而非迴圈失敗。請回傳被升級的 `thread_id` 列表，讓父代理能在收斂證明中包含它們。

## 輪次上限與回顧閘門（電路保護器）

沒有腳本會強制最大輪次或停止迴圈 — 一個硬性的數字無法分辨「有成效」與「偏離目標」的輪次。相對地，父代理會在推理上執行**回顧閘門**：預設每 10 輪（10、20、30…）在回到第 1 步前**停止並回顧所有先前輪次**，判斷迴圈是否仍然在服務 PR 的原始範圍。

腳本會把**輪次數**腳本化，所以觸發是可確定的。**輪次**指的是一次執行 [第 1 步](01-request-review.md) —— 即一次 Copilot 審查觸發，會產生一個 Copilot 審查提交。[`09-review-round.ps1`](../scripts/09-review-round.ps1) 從 PR 的 API 歷史直接計數這些提交並回報是否達到回顧節奏：

```pwsh
pwsh ./scripts/09-review-round.ps1 -PrNumber <n>
# {"PrNumber":<n>,...,"Round":20,"RecapInterval":10,"RecapDue":true}
```

在非收斂的分支頂端執行它並以 `RecapDue` 作為閘門。因為計數是**來源於歷史而非記憶**，即使跨越 100+ 輪仍不會漂移 — 這正是此閘門存在的原因。此上限計數的是**審查輪次**（Copilot 審查提交），不是子代理呼叫、工具呼叫或單次修正編輯 — 因此即使一輪處理五個討論串，也只算作一輪。節奏由 `-RecapInterval` 控制（預設 10）。腳本只會回報觸發，不會自行做出判斷。

這存在的理由是：無限制的機器人審查迴圈是本 skill 要設計以容忍的失敗模式之一：實際執行中曾發生 156 輪的漂移 —— 後面的輪次修補了先前並非 PR 原始目的的東西，最後又把自己早期的修正還原。閘門能在每 10 輪就抓到這類漂移，而不是等到最後再檢查。

### 回顧要檢視的內容（檢視所有先前輪次，而非僅最後 10 輪）

1. **原始 PR 範圍** — issue/PR 標題與 PR 基底的 diff。這是衡量的一把尺。
2. **每輪帳本** — 對每一輪：Copilot 的發現、處置（已修正 / 拒絕 / 升級）、以及產生的變更（檔案 + 一行說明）。
3. **整體漂移訊號**：
   - **超出範圍（Out-of-scope）** — 無法追溯回原始 issue/PR 目標的變更（新功能、相鄰重構、PR 未承諾的美化）。
   - **過度設計（Over-engineering）** — 為了滿足機器人 nit 而加入的防禦層、抽象或設定，非 PR 真正需求。
   - **錯誤方向（Wrong-direction）** — 後續輪次需還原、繞過或再次修正的修正（自我還原 / 輪次間振盪）。
   - **應另開 PR** — 合理但與本 PR 無關的改進。
   - **範圍/複雜度膨脹** — 當原始目標早已達成但 diff 大小或檔案數持續增加。

### 裁決

| 裁決 | 何時 | 動作 |
| --- | --- | --- |
| **CONTINUE** | 到目前為止每輪皆可追溯回原始 PR 範圍；無漂移訊號；Copilot 仍提出符合範圍的發現。 | 回到第 1 步，進行下一個 10 輪區段的迴圈。 |
| **REVERT-AND-SHIP** | 有一或多輪出現漂移（過度設計 / 錯誤方向 / 振盪），但符合範圍的修正是正確的。 | 對漂移的提交執行 `git revert`（或丟棄），保留符合範圍的提交，執行第 6 步建構/測試，然後發佈乾淨結果。在收斂證明中記錄被還原的輪次。 |
| **HAND-OFF** | 漂移與符合範圍工作糾纏不清，正確的修正需要重新設計，或此變更應屬另一次 PR。 | 停止迴圈，在相關討論串回覆並升級給使用者，附上回顧與建議（另開 PR / 重新設計）。**不要**繼續迴圈。 |

**觸發**是被腳本化的，但**裁決**是代理的推理 —— 故意如此。[`09-review-round.ps1`](../scripts/09-review-round.ps1) 讓計數可確定（以免漏掉閘門），但選哪一個裁決仍由智能代理判斷：沒有數字能替代對有成效輪次與偏離輪次的判斷。回顧成本低（讀取每輪提交 + PR 基底 diff）；跳過回顧的代價可能是又一個失控的迴圈。


- **信任 `02-check-review-status.ps1` 的 `Converged` 欄位，不要自行重推導。** 該腳本執行所有三項條件（正常模式）或簡化條件（單次迭代），且為規範來源。
- **在 `converged == true` 前不要呼叫 `task_complete`。** 在完成訊息中列印證據（`HeadOid`、`LatestCopilotReview.commitOid`、`submittedAt`、`OpenThreadsAwaitingReply: 0`、若 `OpenThreadCount > 0` 則列出被升級的討論串）。
- **`-SingleIteration` 與 fallback 決策是綁定的。** 若第 1 步採用了 fallback，之後每一個第 9 步都必須使用 `-SingleIteration`；不可中途變更。
- **PR 狀態非 OPEN 時中止迴圈。** 若 `State` 為 `CLOSED` 或 `MERGED`，腳本的狀態守衛會強制 `Converged: false`。父代理不能對非 OPEN 的 PR 推送 —— 將狀態變更回報給使用者並停止迴圈，而不是重試或呼叫 `task_complete`。
