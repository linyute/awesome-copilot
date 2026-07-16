---
name: copilot-pr-autopilot
description: 'Copilot 在您的 PR 上留下了 14 個審查留言 — 一半是瑣碎的修正。花費數小時進行修復 → 回覆 → 解決 → 重新要求，且每輪都會留下更多留言。此技能執行迴圈工程：透過 GraphQL 自動觸發 Copilot 程式碼審查（無需提及 @copilot），使用修復 / 拒絕 / 呈報規則分流每個開啟的執行緒（Copilot、人類、進階安全性），分派遵守存放庫建構/測試/Lint 規範的平行修復子代理，每次反覆運算進行提交，引用推送的 SHA 進行回覆+解決，然後重新觸發，直到 HEAD 被審查且沒有執行緒等待代理的回覆（剩餘開啟的執行緒是向人類進行的明確交接 — 呈報的拒絕、設計權衡）。您合併一個乾淨的 PR；機器人執行它。觸發片語：「處理 copilot 留言」、「執行 copilot 審查迴圈」、「修復此 PR」、「反覆運算 copilot 回饋」。與存放庫無關，gh CLI + PowerShell。完全自動駕駛需要存放庫 Triage/Write 權限；外部 PR 作者取得單次反覆運算模式加上手動重新觸發（UI 🔄 或實質性提交推送）。'
---

# Copilot PR 自動駕駛

引導任何 GitHub 拉取要求 (pull request) 通過重複的 Copilot 程式碼
審查，直到代理完成其工作 — 每個 Copilot 的發現都有
代理的回覆（修復確認、帶有原由的拒絕，
或明確交接給使用者的呈報）。剩餘開啟的執行緒（若
有）是特意交接給人類合併擁有者 — 它們
不是迴圈失敗。與存放庫無關 — 適用於任何啟用了
Copilot 程式碼審查的存放庫，且從安裝並已驗證 `gh` CLI
的機器執行（請參閱前提條件）。

## 何時使用此技能

- 使用者要求在 PR 上「要求 Copilot 審查」或
  「執行 Copilot 審查迴圈」。
- PR 在功能上已完成，且使用者想要透過重複的
  自動化審查進行最終的正確性確認。
- 先前在 PR 上的 Copilot 審查留下了需要
  分流、修復、回覆和解決的開啟執行緒。

## 何時不要使用此技能

- PR 仍在積極設計中 — 請等待結構穩定；
  否則發現事項會在每輪之間變動。
- 使用者想要人類檢視者的回饋，而非 Copilot 的。

## 前提條件

- 已安裝 `gh` CLI 且已對目標存放庫進行驗證。
- PATH 上有 PowerShell — Windows PowerShell 5.1+ (`powershell.exe`) 或
  PowerShell 7+ (`pwsh`)。兩者均已測試。
- Copilot 程式碼審查是主要使用案例（`01-request-review.ps1`
  使用 GraphQL `requestReviewsByLogin` 觸發 Copilot）。這
  **並非強制要求** — 如果 `01-request-review.ps1` 因
  未在存放庫 / 帳戶上啟用 Copilot 而失敗，代理仍可以
  透過執行步驟 3-8 一次作為單次反覆運算，引導現有的審查執行緒
  （人類、進階安全性等）完成；只需
  略過觸發 + 等待。沒有針對「Copilot
  不可用」的自動偵測 — 代理在觸發
  失敗後做出該決定（指令碼無法單從 API 狀態可靠地分辨
  「已停用 Copilot」與「已啟用 Copilot 但尚未觸發」）。

### 權限：誰可以執行完整迴圈

完整的多輪自動駕駛（步驟 1 → 9 → 1）需要目標存放庫的 **Triage 或 Write** 權限，因為 GitHub 新增 Copilot 機器人作為檢視者的唯一公用 API (`requestReviewsByLogin`) 受到該權限限制。已對照此 PR 提交歷程記錄中的公用 REST + GraphQL 介面進行驗證 — 對於沒有寫入權限的機器人檢視者，不存在公用 API 路徑。

| 您是… | 什麼可行 |
|---|---|
| **具有 Triage / Write 權限的存放庫協作者** | 完整迴圈：`01` 觸發 Copilot，`02` 等待，`04`–`08` 分流 / 修復 / 回覆，迴圈返回至 `01`。免動手。 |
| **外部 PR 作者（無寫入權限）** | `01` 將擲回明確且可操作的錯誤。使用 `-SingleIteration` 模式：在一次執行中處理所有目前的發現事項，然後按一下 Copilot 旁邊的 UI 🔄，**或**推送實質的提交（在大多數存放庫中，`synchronize` 事件會自動觸發 Copilot）。然後重新執行 `02` 進行驗證。 |

在單次反覆運算模式中，當且僅當 `OpenThreadsAwaitingReply == 0`（代理端已完成）時，迴圈的收斂布林值為 `Converged: true`。接著維護者端的重新觸發會引導任何額外的輪次。

每個指令碼都會載入 [scripts/_lib.ps1](scripts/_lib.ps1)，
其在載入時執行 `Assert-GhReady`：如果缺少 `gh` 或 `gh auth status`
失敗，指令碼會在**執行任何工作之前**停止，並顯示單一可操作的
錯誤訊息，指出安裝命令和 `gh auth login`。
代理應原樣向使用者呈現該訊息並停止
迴圈 — 不要重試或規避它。

## 逐步工作流程

> **迴圈：** 步驟 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9，如果 `Converged: false` 則**返回步驟 1**。重複 1→9 輪，直到步驟 9 傳回 `Converged: true`；只有在此時才執行步驟 10 一次並呼叫 `task_complete`。**在每第 10 輪，父代在迴圈返回之前執行 [輪次上限回顧閘道](references/09-convergence.md#round-cap--recap-gate-circuit-breaker)** — 回顧所有先前的輪次，如果迴圈已偏離 PR 的原始範圍則停止。

每輪執行步驟 1-9；步驟 10 是收斂後的一次性清理。父代代理進行協調；每個子代理步驟在具有界限預算的新關聯中執行。橫切協定（時間限制、延長、單次反覆運算備用方案）：[orchestration.md](references/orchestration.md)。

1. **要求審查** _(父代)_ — 參見 [01-request-review.md](references/01-request-review.md)
2. **等待審查** _(子代理，20 分鐘上限)_ — 參見 [02-wait.md](references/02-wait.md)
3. **列出 + 分類開啟的執行緒** _(子代理，5 分鐘)_ — 參見 [03-list-threads.md](references/03-list-threads.md)
4. **分流** _(子代理，每個 ≤5 執行緒 5 分鐘)_ — 參見 [04-triage.md](references/04-triage.md)
5. **修復** _(子代理，平行最多 5 個，每個 5 分鐘)_ — 參見 [05-fix.md](references/05-fix.md)
6. **依存放庫規範建構 + 測試** _(子代理，10 分鐘)_ — 參見 [06-build-test.md](references/06-build-test.md)
7. **提交 + 推送** _(父代)_ — 參見 [07-commit-push.md](references/07-commit-push.md)
8. **回覆（一律）+ 解決（有條件）** _(子代理草稿，父代發佈)_ — 參見 [08-reply-resolve.md](references/08-reply-resolve.md)
9. **收斂驗證** _(子代理，3 分鐘)_ — 參見 [09-convergence.md](references/09-convergence.md)
   - **`Converged: false` → 迴圈返回步驟 1** 進行另一輪（重新觸發、等待、列出、分流、修復、推送、回覆、重新檢查）。每輪處理 Copilot 對前一輪 HEAD 的發現事項；一旦 Copilot 沒有新發現且代理已回覆每個開啟的執行緒，迴圈即終止。
   - **`Converged: true` → 退出迴圈**，執行步驟 10 一次，呼叫 `task_complete` 並附帶證明。
   - **每第 10 輪 (10, 20, 30…) → 在迴圈返回之前執行 [輪次上限回顧閘道](references/09-convergence.md#round-cap--recap-gate-circuit-breaker)。** 對照 PR 的原始範圍回顧所有先前的輪次並選擇裁決：**CONTINUE**（繼續）、**REVERT-AND-SHIP**（還原並出貨，捨棄偏離的提交，出貨範圍內的提交）或 **HAND-OFF**（手動交接，呈報給使用者）。這是停止失控的機器人審查迴圈的斷路器。
10. **清理過時的內容** _(父代，收斂後，一次)_ — 參見 [10-cleanup.md](references/10-cleanup.md)

收斂值由 [scripts/02-check-review-status.ps1](scripts/02-check-review-status.ps1) 計算為單一 `Converged: true` 布林值。在它傳回 true 之前，**請勿**呼叫 `task_complete`；在完成訊息中列印證明（`HeadOid`, `LatestCopilotReview.commitOid`, `submittedAt`）。

## 陷阱

隨附的指令碼強制執行硬性正確性不變量（透過 `copilot_work_started` 事件 ID 觸發載入、要求 HEAD 匹配 + 零等待 + HEAD 審查的 `Converged`、單次反覆運算備用方案語意、PR 狀態防護）。請信任它們 — 不要重新推導。下方的說明涵蓋了指令碼無法為您做出的決策：

- **回覆每個開啟的執行緒；僅在迴圈擁有該處置方式時解決。** 對於 `fix`（修復）和 `decline`（拒絕）執行緒，進行回覆 + 解決。對於 `escalate-to-user`（呈報給使用者）執行緒，回覆分析但保持執行緒開啟 (`08-reply-and-resolve.ps1 -NoResolve`)，以便人類合併擁有者可以採取行動。參見 [08-reply-resolve.md](references/08-reply-resolve.md)。
- **Copilot 執行緒為迴圈所擁有；人類 / 進階安全性 / 其他機器人執行緒預設為 `escalate-to-user`。** 自動解決人類審查執行緒可能會隱藏未處理的問題。分流規則請參閱 [04-triage.md](references/04-triage.md)。
- **每輪一個專注的提交，而非每個 PR 一個。** 綑綁輪次會破壞調查哪一個發現推動了哪一個變更的稽核追蹤，並破壞 `git bisect`。參見 [07-commit-push.md](references/07-commit-push.md)。
- **在推送修復之前，使用存放庫自身的命令建構/測試/Lint**（依據其 `CONTRIBUTING` / `AGENTS` / `README` / `package.json` / `Makefile`）。探索程序：[06-build-test.md](references/06-build-test.md)。
- **當 Copilot 的發現會針對假設性的邊緣情況過度設計時，請以寫下的原由進行反駁。** 自動接受每個建議會侵蝕設計 — 參見 [04-triage.md](references/04-triage.md) 中的 `decline` 路徑。
- **編寫指令碼的陷阱**（`gh api graphql -F` 型別強制、`git stash push -m` 位置剖析、檢視者突變的三個 GraphQL 陷阱）記錄在 [references/api-quirks.md](references/api-quirks.md) 中。在修改任何指令碼之前，請先閱讀。

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 指令碼擲回 `prerequisite missing — gh CLI is not on PATH` | 安裝 `gh`（Windows 上為 `winget install GitHub.cli`；macOS 上為 `brew install gh`；Linux 上使用套件管理員；或從 https://cli.github.com 下載）。然後執行 `gh auth login`。向使用者呈現該訊息並停止迴圈 — 不要重試。 |
| 指令碼擲回 `prerequisite missing — gh CLI is not authenticated` | 執行 `gh auth login`。停止迴圈直到使用者完成驗證。 |
| 觸發失敗或沒有 `copilot_work_started` 事件載入 | 推送實質的（非空白字元）提交 — 在 `synchronize` 上自動指派是最可靠的觸發方式。持續失敗表示可能未在存放庫 / 帳戶上啟用 Copilot 程式碼審查（檢查存放庫 Settings → Code & automation → Copilot，或帳戶層級的 Copilot Pro/Pro+）。 |
| 等待約 10 分鐘後沒有新的審查 | 在最近的關閉或微小差異抑制之後的安靜期。推送一個實質的提交並重試。不要盲目地重新執行 `01-request-review.ps1` — 它在 Copilot 仍是要求的檢視者時報告 `InFlight`。 |
| 開啟清單中存在過時但未解決的執行緒 | 預期情況：未解決狀態是真實的來源。像任何其他開啟的執行緒一樣回覆 + 解決它們。`10-cleanup-outdated.ps1` 僅作為最終的安全網。 |
| 不確定要修復還是拒絕某個發現 | 參見 [references/04-triage.md](references/04-triage.md)。 |
| 需要「已修復」、「已拒絕」或「偏離」的回覆措辭 | 參見 [templates/](templates/) 下的範本 — [reply-fix.md](templates/reply-fix.md)、[reply-decline.md](templates/reply-decline.md)、[reply-drift.md](templates/reply-drift.md)、[reply-partial.md](templates/reply-partial.md)。 |

## 參考資料

- [references/orchestration.md](references/orchestration.md) — 橫切迴圈控制：時間限制與延長協定、子代理委派對照、單次反覆運算備用方案，以及全迴圈說明。
- 每個步驟的合約（每個步驟一個 `NN-*.md`）：
  [references/01-request-review.md](references/01-request-review.md) _(父代)_,
  [references/02-wait.md](references/02-wait.md),
  [references/03-list-threads.md](references/03-list-threads.md),
  [references/04-triage.md](references/04-triage.md) (包含修復對照拒絕的規則),
  [references/05-fix.md](references/05-fix.md),
  [references/06-build-test.md](references/06-build-test.md),
  [references/07-commit-push.md](references/07-commit-push.md) _(父代)_,
  [references/08-reply-resolve.md](references/08-reply-resolve.md),
  [references/09-convergence.md](references/09-convergence.md) (包含輪次上限回顧閘道),
  [references/10-cleanup.md](references/10-cleanup.md) _(父代)_。
- [references/api-quirks.md](references/api-quirks.md) — 經驗證的 GitHub API 行為、死胡同以及檢視者突變的 GraphQL 陷阱。
- 範本（每種回覆類型一個）：
  [templates/reply-fix.md](templates/reply-fix.md) — 已接受修復模式；[templates/reply-decline.md](templates/reply-decline.md) — 帶有原由的拒絕模式；
  [templates/reply-drift.md](templates/reply-drift.md) — PR 描述 / 留言 / 測試計劃偏離確認；
  [templates/reply-partial.md](templates/reply-partial.md) — 帶有延後後續追蹤的部分修復。橫切回覆指引和反模式存在於
  [references/08-reply-resolve.md](references/08-reply-resolve.md#reply-guidance) 中。
- [scripts/_lib.ps1](scripts/_lib.ps1) — 共用協助工具 (`Invoke-Gh`、`Invoke-GhGraphQL`、`Resolve-RepoCoords`)；由每個指令碼載入。
- [scripts/01-request-review.ps1](scripts/01-request-review.ps1) — 觸發 Copilot 審查並透過 `copilot_work_started` 事件驗證是否已開始。
- [scripts/02-check-review-status.ps1](scripts/02-check-review-status.ps1) — PR 的 Copilot 審查狀態的單次快照；僅在滿足所有三個條件時才發出 `Converged: true`。
- [scripts/03-list-open-threads.ps1](scripts/03-list-open-threads.ps1) — 來自**所有檢視者**（Copilot、人類、github-advanced-security 等）的每個未解決 PR 審查執行緒。
- [scripts/08-reply-and-resolve.ps1](scripts/08-reply-and-resolve.ps1) — 在一次呼叫中發佈回覆並解決。
- [scripts/10-cleanup-outdated.ps1](scripts/10-cleanup-outdated.ps1) — 過時 Copilot 執行緒的安全網。
