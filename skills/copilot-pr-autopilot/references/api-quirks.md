# GitHub API 陷阱 (經驗證)

對 Copilot 審查迴圈很重要的 API 行為。均已對照目前的 API 介面進行驗證 — 在尋求替代 API 或修改隨附指令碼之前，請先閱讀本文件。

## GraphQL 觸發 — `requestReviewsByLogin` 是受支援的路徑

```graphql
mutation($p: ID!) {
  requestReviewsByLogin(input: {
    pullRequestId: $p,
    botLogins: ["copilot-pull-request-reviewer"]
  }) {
    pullRequest { number }
  }
}
```

已在沒有 Copilot Pro 的個人存放庫以及具有 Copilot Enterprise 的組織存放庫中進行經驗證。適用於首次新增和重新要求（無特別的重新要求變異）。

三個 GraphQL 陷阱：

1. 變異為 **`requestReviewsByLogin`**，而非 `requestReviews`。
   `RequestReviewsInput`（由 `requestReviews` 使用）未公開 `botLogins` 欄位，因此它完全無法要求機器人檢視者 —
   `botLogins` 是 `requestReviewsByLogin` 上的核心欄位。
2. 欄位是 **`botLogins`**，而非 `userLogins`。後者會傳回
   `Could not resolve user with login 'Copilot'`。
3. 縮略名為 **`copilot-pull-request-reviewer`**（應用程式縮略名）。
   顯示登入名稱 `Copilot` 會傳回 `Could not resolve bot with slug 'Copilot'`。

透過問題事件摘要中的新 `copilot_work_started` 事件驗證成功 — `GET /repos/{o}/{r}/issues/{n}/events`（參見 SKILL.md 的陷阱「HTTP 200 / exit 0 並非證明」）。經驗上，此事件類型確實在 `/events` 端點上公開（已在 PR 236 上的 20 多個觸發輪次中進行驗證）；它不是僅限時間軸的。
`01-request-review.ps1` 透過比較觸發前後的事件 `id`（單調遞增）來強制執行此操作。

### 其他觸發路徑 — 請勿使用

- **帶有 `botLogins` 的 `requestReviews`** → 輸入類型拒絕該欄位。不要嘗試變體。
- **帶有 `reviewers[]=Copilot` 的 REST `POST /pulls/<n>/requested_reviewers`** → 可以傳回 HTTP 201，但會無聲地捨棄機器人。指令碼未使用此路徑。
- **`gh pr edit --add-reviewer Copilot`** → 在目前的 `gh` 上傳回 `'Copilot' not found`。指令碼未使用此路徑。

## GraphQL `latestReviews` — 偏離快取，請勿使用

```graphql
# 請勿使用 — 偏離的投影：
pullRequest(number:$pr){ latestReviews(first:50){ nodes{...} } }

# 請改用此路徑 — 一律為最新：
pullRequest(number:$pr){ reviews(last:100){ nodes{...} } }
```

`latestReviews` 是一個「每位使用者最新」的投影，具有偏離快取行為：新提交的 Copilot 審查在提交後可能會缺席幾分鐘，而 `reviews(last:100)` 會立即反映。
在進行中或收斂檢查時使用 `latestReviews` 會導致指令碼對過時的提交 OID 進行操作 — 要麼錯誤地宣告收斂，要麼為已存在的審查超時。

`02-check-review-status.ps1` 使用在用戶端篩選為 Copilot 檢視者登入名稱的 `reviews(last:100)`。當結果剛好是 100 個審查時，它還會發出 stderr 警告，以便呼叫端知道已達到界限，且最新的 Copilot 審查可能比視窗更舊 — 實務上只有在最後一次 Copilot 審查之後有 100 多個非 Copilot 審查載入時才可能發生，這在正常使用中不會發生。如果您看到該警告且迴圈發生異常，請手動擷取完整的審查清單：

```bash
gh pr view <n> --json reviews --jq '.reviews[] | select(.author.login | test("copilot-pull-request-reviewer"))'
```

### 多個 Copilot 審查的平手決策

當多個 Copilot 審查共用相同的 `submittedAt` 時（極端重新觸發下罕見的伺服器端時鐘衝突），指令碼首先偏好 `commit.oid == HEAD` 的審查，然後遞補至穩定排序。其意圖是「與目前程式碼相符的審查是代理應該回覆的審查」— 防止過時的 OID 審查贏得平手決策並錯誤地將 `ReviewAtHead` 翻轉為 false。

## 回覆 + 解決變異 — 兩者皆可行

```graphql
mutation($tid: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: $tid,
    body: $body
  }) { comment { id } }
}

mutation($tid: ID!) {
  resolveReviewThread(input: { threadId: $tid }) {
    thread { isResolved }
  }
}
```

## `isOutdated` ≠ `isResolved` — 目前未解決狀態是真實的來源

執行緒可以是 `isOutdated: true`（Copilot 的留言指向此後已變更的行號），但同時 `isResolved: false`。這些執行緒：

- 在每輪迴圈中仍需要回覆 + 解決。當您自身的修復偏移了引用的行號時，執行緒可能會在輪次中期變得過時。篩選 `!isOutdated` 會無聲地捨棄這些執行緒，使 PR 的開啟對話清單在基礎程式碼修復後仍非空。
- `03-list-open-threads.ps1` 因此會列出每個未解決的執行緒，且不使用 `isOutdated` 篩選。
- `10-cleanup-outdated.ps1` 僅作為安全網 — 針對罕見的執行緒在您最後一次每輪擷取*之後*變為過時的情況。

## 審查延遲 — 不要以快於 ~3 分鐘的速度進行輪詢

Copilot 審查通常在要求後 3-6 分鐘發佈，偶爾最長達 ~10 分鐘。沒有進度訊號；以快於每 ~3 分鐘一次的速度進行輪詢會浪費 API 預算，且不會使審查更快到達。

## `gh api graphql -F` 強制轉型字串 — 對 `String!` 使用 `-f`

`gh` CLI 區分其兩種旗標格式：

- `-F key=value` — 型別推論。解析為整數、布林值或 null 的值會以該 JSON 常值傳送。
- `-f key=value` — 一律以原始字串傳送。

對於任何宣告為 `String!` 的 GraphQL 變數（例如 `owner`、`repo`、`body`、`tid`、`after`），請在呼叫處使用 **`-f`**。剛好是 `"true"`、`"null"` 或全數字的回覆主體否則會被強制轉型，且呼叫會因型別錯誤而失敗。僅為真正的數值或布林值變數（例如 `pr: Int!`）保留 `-F`。

> 注意：當主體包含內嵌的 `"` 時，共用的 `Invoke-Gh` 包裝器可能會在本機將 `-f field=<body>` 重寫為 `-F field=@<tempfile>`（Windows PowerShell 5.1 原生引數引用錯誤 — 參見下文）。即使透過 `@file`，`-F` 仍會對檔案內容套用型別推論（gh 的官方行為）— 此重寫之所以安全，是因為重寫觸發條件（「主體包含 `"`」）保證了內容是字串，任何 JSON 常值（`123`、`true`、`null` 等）都不會與之相符。將此 `-F ...=@file` 使用視為包裝器的內部傳輸細節，而非允許在呼叫處對任意字串使用 `-F ...=@file`。

```powershell
# 錯誤 — 主體可能會被強制轉型，且在 Windows PowerShell 5.1 下，
# $Body 中任何內嵌的 `"` 都會被原生引數傳遞器錯誤分割（gh 會看到被截斷的主體或「收到 N 個引數」錯誤）。
gh api graphql -f query=$q -F body=$Body

# 正確 — 透過 Invoke-Gh / Invoke-GhGraphQL。共用的协助工具
# 會自動將主體包含 `"` 的 `-f field=<body>` 和 `-F field=<body>` 配對重寫為 `-F field=@<tempfile>`，以便從磁碟讀取值，絕不會出現在命令列中。這在 Windows PowerShell 5.1 和 PowerShell 7+ 上的運作方式完全相同。
Invoke-GhGraphQL -GhArgs @('-f',"query=$q",'-f',"body=$Body") -Context 'reply body'
```

直接呼叫 `gh`（例如透過 `& gh ...` 或原始 `gh api graphql`）會繞過跨版本暫存檔重寫 — 如果您的值包含 `"`，您將重新引入僅限 PowerShell 5.1 的分割錯誤。請務必透過 `Invoke-Gh` / `Invoke-GhGraphQL` 漏斗化 `gh` 呼叫。

## 原生 `gh` 結束代碼會繞過 `$ErrorActionPreference`

`gh` 是一個原生可執行檔，而非 PowerShell Cmdlet，因此即使 `$ErrorActionPreference = 'Stop'`，非零結束也**不會**擲回錯誤。如果沒有明確的檢查，指令碼將在失敗的 API 呼叫後列印誤導的成功訊息，且迴圈將在驗證問題、速率限制或暫時性 5xx 上錯誤地宣告收斂。

額外陷阱：對於 JSON 主體攜帶頂層 `errors` 陣列的 HTTP 200，`gh api graphql` 可以結束為 0。將該情況也視為失敗的呼叫。

[scripts/_lib.ps1](../scripts/_lib.ps1) 中共用的协助工具（`Invoke-Gh` 和 `Invoke-GhGraphQL`）會透過將 stderr 重新導向至暫存檔 (`2>$errFile`) 的方式以 `& gh @args` 執行 `gh`，然後讀取 `$LASTEXITCODE` 並傳回 `{ExitCode, Stdout, Stderr}`。
`Invoke-GhGraphQL` 還會解析回應主體上的 GraphQL `errors` 陣列，並在任一失敗模式上擲回錯誤。所有搭售的指令碼都會載入 `_lib.ps1` 並使用這些包裝器 — 在任何新指令碼中也請照做。

## `git stash push` 引數順序

```bash
git stash push -m "local-build" -- src/path/a src/path/b   # 正確
git stash push -- src/path/a src/path/b -m "local-build"   # 無聲地捨棄 -m
```

`-m` 必須位於 `--` 路徑分隔符號之前。
