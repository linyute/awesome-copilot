# 協調 — 父代擁有的迴圈控制

Copilot PR 審查迴圈的橫切協定：時間限制、子代理委派對照、單次反覆運算備用方案，以及全迴圈說明。每個步驟 — 包含父代擁有的步驟 1、7 和 10 — 與本檔案並列，具有其自身的 `NN-*.md` 合約檔案；本檔案僅保留跨越整個迴圈的內容。

建構、測試和 Lint 命令**並非**在此處規定。需要它們的每個步驟都遵循目標存放庫自身的規範（`CONTRIBUTING.md`、`AGENTS.md`、`README`、`package.json` / `Makefile` / 語言工具等）。探索並遵循存放庫現有的做法 — 絕不要自行發明建構命令。

## 時間限制與延長協定

| 概念 | 規則 |
|---------|------|
| 預設預算 | 每次子代理呼叫 5 分鐘 |
| 子代理必須傳回 | `status` ∈ {`complete`, `partial`, `blocked`} + `next_action` + `needs_extension_minutes`（無則為 0）。務必在預算到期前摘要進度 — 絕不無聲超時。 |
| 延長 | 僅在 `status: partial` 且 `next_action` 具體時，父代才會延長；傳送 `write_agent "continue for N min"`，其中 `N = min(needs_extension_minutes, 10)` |
| 延長上限（預設） | 每個步驟 2 次延長；步驟 6（建構/測試）對於緩慢的測試套件最多 2 倍。步驟 2（等待）是單一有界限的子代理 — 參見 [02-wait.md](02-wait.md) — 非延長驅動。 |
| 父代絕不阻礙 | 步驟 1（要求）、步驟 7（提交 + 推送）、步驟 8 回覆/解決變異，以及 `task_complete` 決定保持在父代中 |

當達到上限且工作仍為 `partial` 時，父代會縮小輸入（步驟 4 中批次處理更小 / 步驟 5 中分割修復範圍）或自行接管該步驟。

## 子代理委派對照

> **迴圈：** 一個**輪次** = 步驟 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9。在步驟 9 之後，如果 `Converged: false`，則**返回步驟 1** 進行另一輪。重複此過程，直到步驟 9 傳回 `Converged: true`；然後執行步驟 10 一次並退出。**在每第 10 輪，父代在迴圈返回之前執行 [輪次上限回顧閘道](09-convergence.md#round-cap--recap-gate-circuit-breaker)** — 這是回顧所有先前輪次並在迴圈已偏離 PR 原始範圍時停止迴圈的斷路器。收斂定義、退出/返回迴圈決定以及回顧閘道，請參閱 [09-convergence.md](09-convergence.md)。

每輪的規範順序：**要求 → 等待 → 列出 → 分流 → 修復 → 建構 → 提交 + 推送 → 回覆 + 解決（引用推送的 SHA） → 收斂檢查**。回覆/解決在推送之後執行，以便回覆可以引用已推送的提交 SHA。

| 步驟 | 擁有者 | 合約 |
|------|-------|----------|
| 1 — 要求審查 | 父代 | [01-request-review.md](01-request-review.md) |
| 2 — 等待審查 | 子代理 (`general-purpose`, 20 分鐘) | [02-wait.md](02-wait.md) |
| 3 — 列出 + 分類開啟的執行緒 | 子代理 (`explore`, 5 分鐘) | [03-list-threads.md](03-list-threads.md) |
| 4 — 分流 | 子代理 (`general-purpose`, 每個 ≤5 執行緒 5 分鐘) | [04-triage.md](04-triage.md) |
| 5 — 套用修復 | 子代理 (`general-purpose`, 平行最多 5 個，每個 5 分鐘) | [05-fix.md](05-fix.md) |
| 6 — 依存放庫規範建構 + 測試 | 子代理 (`task` + `explore`, 10 分鐘) | [06-build-test.md](06-build-test.md) |
| 7 — 提交 + 推送 | 父代 | [07-commit-push.md](07-commit-push.md) |
| 8 — 回覆（一律）+ 解決（有條件） | 子代理草擬 → 父代發佈 | [08-reply-resolve.md](08-reply-resolve.md) |
| 9 — 收斂驗證 | 子代理 (`explore`, 3 分鐘) | [09-convergence.md](09-convergence.md) |
| 10 — 清理過時的內容（收斂後，一次） | 父代 | [10-cleanup.md](10-cleanup.md) |

## 單次反覆運算備用方案

當 `01-request-review.ps1` 因未在存放庫 / 帳戶上啟用 Copilot 程式碼審查（GraphQL 變異回報該機器人非有效檢視者）而擲回錯誤時，代理會遞補至**單次反覆運算模式**：

- 略過步驟 2（沒有要等待的 Copilot 審查）。
- 針對已存在的任何審查執行緒（人類、進階安全性、其他機器人）執行步驟 3 - 8 一次。
- 在步驟 9，將 `-SingleIteration` 傳遞給 `02-check-review-status.ps1`，以便收斂檢查忽略沒有新 Copilot 審查就無法推進的偏離審查檢查。`Converged: true` 簡化為 `OpenThreadsAwaitingReply == 0`。
- 僅當人類稍後發佈新留言時才會重新進行反覆運算 — 在此時點重新執行該技能。

單次反覆運算模式是**觸發失敗後代理的決定**，而非自動偵測的狀態 — 指令碼無法單從 API 狀態可靠地分辨「已停用 Copilot」與「已啟用 Copilot 但尚未觸發」。

## 收斂證明

在 `task_complete` 訊息中列印收斂證明 — 是證明，而非聲明：

- `HeadOid`
- `LatestCopilotReview.commitOid`
- `submittedAt`
- `OpenThreadsAwaitingReply: 0`
- 若 `OpenThreadCount > 0`，列出任何開啟的 `escalate-to-user` 執行緒。

## 說明

- **重新要求是首要的。** `01-request-review.ps1` 在 Copilot 已經審查過時不會無聲略過；它會發出相同的變異並透過新的 `copilot_work_started` 事件進行驗證（指令碼強制執行此操作 — GraphQL 介面和無聲捨棄陷阱請參閱 [api-quirks.md](api-quirks.md)）。
- **過時的執行緒仍需要回覆 + 解決。** 它們在 PR UI 中顯示為未解決，直到您明確關閉它們；步驟 10 是安全網，而非主要機制。
- **重新開啟 / 重新造訪要求會將執行緒重設為步驟 4。** 如果被拒絕的發現事項被使用者（或被後續的 Copilot 審查）重新開啟，請將其拉回分流，並將先前的原由作為輸入，而非重新執行整個迴圈。
- **中斷後的恢復性。** 在重新啟動時，拍攝 HEAD 快照、最新 Copilot 審查的 `commit.oid` + `submittedAt`、開啟的執行緒清單以及任何未提交的本機變更。如果 HEAD 或開啟的執行緒集已變更，請捨棄快取的分流 / 草稿。
- **本機建構修補檔。** 對於持有在 PR 之外的未提交本機建構修補檔專案：在提交前執行 `git stash push -m "local-build" -- <paths>`，在提交後執行 `git stash pop`。請注意 `-m` 必須位於 `--` 之前（參見 [api-quirks.md](api-quirks.md)）。
