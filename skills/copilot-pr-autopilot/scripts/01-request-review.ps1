<#
.SYNOPSIS
    在 PR 上請求 Copilot 檢閱並驗證觸發已送達。

.DESCRIPTION
    單一機制：GraphQL `requestReviewsByLogin` 搭配
    `botLogins:["copilot-pull-request-reviewer"]`。有關
    GraphQL 介面詳細資訊，請參閱 references/api-quirks.md。

    成功協定 (結束代碼 0，單行 JSON)：
      - Status="InFlight"      — Copilot 已經是已被請求的檢閱者。
      - Status="TriggerLanded" — mutation 已提交並透過新的
                                 `copilot_work_started` 事件 id 進行驗證。

    失敗 (擲出異常，結束代碼 1)：mutation 失敗，或在 -VerifySeconds 內沒有新的事件送達。
    呼叫者應推送實質性的提交並重試 (在 synchronize 上自動指派是最可靠的遞補方案)。

.PARAMETER PrNumber       PR 編號 (必填)。
.PARAMETER Owner
    選填；自動從 `gh repo view` 解析。

.PARAMETER Repo
    選填；自動從 `gh repo view` 解析。
.PARAMETER VerifySeconds  驗證輪詢時間視窗 (1..600，預設為 45)。

.EXAMPLE
    pwsh 01-request-review.ps1 -PrNumber 236
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [int]$PrNumber,

    [string]$Owner,
    [string]$Repo,

    [ValidateRange(1, 600)]
    [int]$VerifySeconds = 45
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/_lib.ps1"

function Get-LatestCopilotWorkStartedEvent {
    $eventsPath = "repos/$Owner/$Repo/issues/$PrNumber/events?per_page=100"
    $r = Invoke-Gh -GhArgs @('api','-i',$eventsPath)
    if ($r.ExitCode -ne 0) { throw "事件查詢失敗：$($r.Stderr)" }

    $m = [regex]::Match($r.Stdout, '(?s)\A(?<headers>.*?)\r?\n\r?\n(?<body>.*)\z')
    if (-not $m.Success) { throw '事件查詢傳回了非預期的標頭/主體外觀。' }
    $headers = $m.Groups['headers'].Value
    $body = $m.Groups['body'].Value

    $lastPage = 1
    # 連結標頭看起來像：`<https://api.github.com/...?per_page=100&page=4>; rel="last"`
    # 參數順序無法保證 — `page=4` 可能出現在其他查詢參數之前或之後。
    # 在 URL 內比對 `page=<n>` (允許 `?` 或 `&` 分隔符) 直到右角括號，
    # 接著是 `rel="last"` 標記。
    $lastMatch = [regex]::Match($headers, '<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"')
    if ($lastMatch.Success) { $lastPage = [int]$lastMatch.Groups[1].Value }
    if ($lastPage -gt 1) {
        $r = Invoke-Gh -GhArgs @('api',"repos/$Owner/$Repo/issues/$PrNumber/events?per_page=100&page=$lastPage")
        if ($r.ExitCode -ne 0) { throw "事件最後一頁查詢失敗：$($r.Stderr)" }
        $body = $r.Stdout
    }

    $events = @(ConvertFrom-GhJson -Stdout $body -Context "事件頁面 $lastPage")
    $latest = $events | Where-Object { $_.event -eq 'copilot_work_started' } | Sort-Object id | Select-Object -Last 1
    if (-not $latest) { return [pscustomobject]@{ Id = 0L; CreatedAt = '' } }
    $createdAt = Format-IsoUtcString $latest.created_at
    [pscustomobject]@{ Id = [long]$latest.id; CreatedAt = $createdAt }
}

# ---------- 儲存庫解析 ----------

$coords = Resolve-RepoCoords -Owner $Owner -Repo $Repo
$Owner = $coords.Owner
$Repo  = $coords.Repo

# ---------- 狀態：目前是否已請求 Copilot？ ----------
# 單一 GraphQL 查詢：被請求的檢閱者 + head SHA，隨後是
# 完整被請求檢閱者集的分頁。

$stateQuery = @'
query($o:String!,$r:String!,$n:Int!){
  viewer{login}
  repository(owner:$o,name:$r){
    pullRequest(number:$n){
      id
      headRefOid
      state
      author{login}
      reviews(last:50){nodes{author{login}}}
      reviewRequests(first:100){nodes{requestedReviewer{__typename ... on Bot{login} ... on User{login} ... on Mannequin{login}}} pageInfo{hasNextPage endCursor}}
    }
  }
}
'@
$stateData = Invoke-GhGraphQL -GhArgs @('-f',"query=$stateQuery",'-f',"o=$Owner",'-f',"r=$Repo",'-F',"n=$PrNumber") -Context "適用於 $Owner/$Repo PR #$PrNumber 的狀態查詢"
$pr = $stateData.data.repository.pullRequest
if (-not $pr) { throw "在 $Owner/$Repo 中找不到 PR #$PrNumber。" }
if ($pr.state -ne 'OPEN') {
    throw "PR #$PrNumber 不是開啟狀態 (狀態=$($pr.state))。"
}

$viewerLogin = [string]$stateData.data.viewer.login
$prAuthorLogin = if ($pr.author) { [string]$pr.author.login } else { '' }
$viewerIsAuthor = ($viewerLogin -and $prAuthorLogin -and ($viewerLogin -eq $prAuthorLogin))
$copilotHasReviewed = $false
if ($pr.reviews -and $pr.reviews.nodes) {
    foreach ($rev in $pr.reviews.nodes) {
        if ($rev.author -and $rev.author.login -and ($rev.author.login -match $CopilotReviewerLoginRegex)) {
            $copilotHasReviewed = $true; break
        }
    }
}

$headOid = $pr.headRefOid
$prNodeId = [string]$pr.id
if ([string]::IsNullOrWhiteSpace($prNodeId)) {
    throw "無法從狀態查詢中解析 $Owner/$Repo PR #$PrNumber 的 PR 節點 id。"
}
$reviewRequestsList = [System.Collections.Generic.List[object]]::new()
foreach ($n in @($pr.reviewRequests.nodes)) { $reviewRequestsList.Add($n) }
$hasNext = [bool]$pr.reviewRequests.pageInfo.hasNextPage
$after   = $pr.reviewRequests.pageInfo.endCursor
while ($hasNext) {
    $pageQuery = @'
query($o:String!,$r:String!,$n:Int!,$after:String!){
  repository(owner:$o,name:$r){
    pullRequest(number:$n){
      reviewRequests(first:100,after:$after){nodes{requestedReviewer{__typename ... on Bot{login} ... on User{login} ... on Mannequin{login}}} pageInfo{hasNextPage endCursor}}
    }
  }
}
'@
    $pageData = Invoke-GhGraphQL -GhArgs @('-f',"query=$pageQuery",'-f',"o=$Owner",'-f',"r=$Repo",'-F',"n=$PrNumber",'-f',"after=$after") -Context "適用於 $Owner/$Repo PR #$PrNumber 的 reviewRequests 頁面查詢"
    $page = $pageData.data.repository.pullRequest.reviewRequests
    foreach ($n in $page.nodes) { $reviewRequestsList.Add($n) }
    $hasNext = [bool]$page.pageInfo.hasNextPage
    $after   = $page.pageInfo.endCursor
}
$reviewRequests = $reviewRequestsList.ToArray()
$copilotPendingRequests = @($reviewRequests | Where-Object {
    $_.requestedReviewer -and $_.requestedReviewer.login -and $_.requestedReviewer.login -match $CopilotReviewerLoginRegex
})
$copilotPending = $copilotPendingRequests.Count -gt 0

# 如果 Copilot 目前在 requested_reviewers 中，根據定義它正在進行中。
if ($copilotPending) {
    @{
        Status   = 'InFlight'
        PrNumber = $PrNumber
        HeadOid  = $headOid
        Detail   = "Copilot 目前在 requested_reviewers 中；檢閱正在進行中。"
    } | ConvertTo-Json -Compress
    exit 0
}

# 我們不對 AlreadyReviewed 進行短路 — 使用者希望將重新請求作為第一類流程。
# 重新觸發；GraphQL mutation 對於初始新增和重新請求的處理方式完全相同。

# ---------- 在觸發前建立 copilot_work_started 快照 ----------

# 在觸發之前建立最新 copilot_work_started 的快照。使用事件的數值 `id` (單調遞增) —
# `created_at` 是秒級解析度，如果新的事件在同一秒內送達，則會發生衝突。
$beforeEvent = Get-LatestCopilotWorkStartedEvent
$beforeId = $beforeEvent.Id

# ---------- 透過 GraphQL requestReviewsByLogin 進行觸發 ----------

$mut = 'mutation($p:ID!){requestReviewsByLogin(input:{pullRequestId:$p,botLogins:["copilot-pull-request-reviewer"]}){pullRequest{number}}}'
# 為什麼使用此路徑而不是 REST 或 `requestReviews`？已進行端到端驗證：
#   - REST POST /pulls/{n}/requested_reviewers `reviewers:["Copilot"]`
#     (根據 `GET user/175728472` 該 Bot 的 REST 登入名稱) → 404。REST
#     `reviewers` 欄位僅接受 type=User；即使登入名稱解析為 Bot 記錄，Bot 也會被拒絕。
#   - GraphQL `requestReviews` 在結構描述 (schema) 層級拒絕 Bot 節點 ID ("Could not resolve to User node with the global id of 'BOT_…'")。
#   - `requestReviewsByLogin.botLogins` 是 Bot 檢閱者唯一的公開路徑；代價是它需要儲存庫的 Triage/Write 權限。
#   - UI 🔄 按鈕使用 github.com Rails端點，搭配 session cookie + CSRF，這是 gh 的 OAuth 權杖 (token) 無法滿足的。
# 擷取下方受權限管制的情況，並提供兩種實際的因應方案。
$r = Invoke-Gh -GhArgs @('api','graphql','-f',"query=$mut",'-f',"p=$prNodeId")

# 雙重保險的權限錯誤偵測。根據經驗，`gh api graphql` 在 requestReviewsByLogin 遇到 FORBIDDEN 時會以非零值結束，
# 並且將訊息放入 stderr 中 (已驗證：exit=1，stderr 包含 "does not have the correct permissions")。但某些 GraphQL 路徑在
# 傳回 exit=0 時，其頂層 `errors[]` 會帶有 type=FORBIDDEN，因此檢查這兩個介面，並將兩者引導至同一個可操作錯誤格式化程式。
$permErrInStderr = ($r.ExitCode -ne 0) -and ($r.Stderr -match '(?i)does not have (the )?correct permissions|forbidden|HTTP 403')
$permErrInBody = $false
$bodyErrors = $null
if ($r.Stdout) {
    try {
        # 透過共享的 ConvertFrom-GhJson 協助程式進行路由，以便預覽格式/上下文慣例保持一致。該協助程式在剖析失敗時會
        # 擲出異常；我們捕捉並寫入警告 (fall through 到權威的 stderr/exit-code 路徑) 而不是中止 —
        # 該警告使此 fall-through 在記錄中可被觀察到。
        $parsed = ConvertFrom-GhJson -Stdout $r.Stdout -Stderr $r.Stderr -Context 'requestReviewsByLogin' -PreviewChars 200
        if ($parsed.errors) {
            $bodyErrors = $parsed.errors
            $permErrInBody = [bool]($parsed.errors | Where-Object {
                ($_.type -eq 'FORBIDDEN') -or ($_.message -match '(?i)does not have (the )?correct permissions|forbidden')
            })
        }
    } catch {
        Write-Warning $_.Exception.Message
    }
}

if ($permErrInStderr -or $permErrInBody) {
    $rawMsg = if ($permErrInStderr) { $r.Stderr } elseif ($bodyErrors) { ($bodyErrors | ForEach-Object { $_.message }) -join '; ' } else { '(無訊息)' }
    if ($viewerIsAuthor) {
        # 外部 PR 作者情境：GitHub 的 UI 🔄 按鈕使用內部端點，未公開於公共 GraphQL/REST 結構描述中。
        # 透過結構描述列舉進行驗證：唯一公開的 Bot 檢閱者 mutation 是 requestReviewsByLogin，它需要儲存庫上的
        # Triage/Write 權限。沒有寫入權限的 PR 作者無法透過任何公共 API 進行觸發。
        $scenario = if ($copilotHasReviewed) { '重新請求' } else { '初始新增' }
        throw @"
在此情境 ($scenario) 下無法透過公共 API 觸發 Copilot：
  - 您是 $Owner/$Repo PR #$PrNumber 的 PR 作者 ($viewerLogin)。
  - 您缺乏儲存庫的 Triage/Write 權限，因此 requestReviewsByLogin 傳回 FORBIDDEN。
  - GitHub 的公共 GraphQL 結構描述沒有其他 Bot 檢閱者 mutation
    (已驗證：requestReviews 拒絕 Bot 節點 ID；沒有 REST ``bot_reviewers`` 欄位)。
  - UI 的「🔄 重新請求檢閱」按鈕使用非公共 API 的內部端點。

請使用以下其中一種因應方案 (兩者都能可靠地促使 Copilot 重新檢閱)：
  1. UI：在瀏覽器中開啟 PR → 按一下「copilot-pull-request-reviewer」旁的 🔄。
  2. CLI：推送實質性 (非空白字元) 的提交。``synchronize`` 事件會自動觸發 Copilot，無需 API 呼叫且不需 any 權限。

透過上述任一方式觸發後，使用 02-check-review-status.ps1 恢復迴圈。

原始錯誤：$rawMsg
"@
    }
    throw @"
GraphQL requestReviewsByLogin 失敗，發生權限錯誤：$rawMsg

最可能的原因：
  * 已驗證的使用者缺乏儲存庫的 Triage / Write 權限
    (執行 ``gh api repos/$Owner/$Repo --jq .permissions`` 以確認；唯讀協作者無法請求檢閱者)。
  * 儲存庫 / 帳戶上未啟用 Copilot Code Review。
"@
}

if ($r.ExitCode -ne 0) {
    throw @"
GraphQL requestReviewsByLogin 失敗：$($r.Stderr)

最可能的原因：
  * 最近關閉 Copilot 後的靜止期 — 請等待 5-10 分鐘，或推送實質性的提交。
  * 儲存庫 / 帳戶上未啟用 Copilot Code Review。
  * PR 處於封鎖 Bot 檢閱的狀態 (草稿、衝突、分支保護)。
"@
}

if ($bodyErrors) {
    # 非 FORBIDDEN 的 errors[] 來自於成功的結束 — 直接呈現。
    $msgs = ($bodyErrors | ForEach-Object { $_.message }) -join '; '
    throw "GraphQL requestReviewsByLogin 傳回錯誤：$msgs"
}

# ---------- 驗證 copilot_work_started 事件已送達 ----------

$deadline = (Get-Date).AddSeconds($VerifySeconds)
$afterTs = ''
$afterId = 0L
$lastErr = ''
do {
    try {
        $nowEvent = Get-LatestCopilotWorkStartedEvent
        $lastErr = ''
        if ($nowEvent.Id -gt $beforeId) {
            $afterId = $nowEvent.Id
            $afterTs = $nowEvent.CreatedAt
            break
        }
    } catch {
        $lastErr = $_.Exception.Message
    }
    if ((Get-Date) -ge $deadline) { break }
    $remaining = [int]($deadline - (Get-Date)).TotalSeconds
    Start-Sleep -Seconds ([Math]::Min(5, [Math]::Max(1, $remaining)))
} while ((Get-Date) -lt $deadline)

if (-not $afterId) {
    $errTail = if ($lastErr) { "`n  最後一次事件查詢錯誤：$lastErr" } else { '' }
    throw @"
GraphQL mutation 傳回成功，但在 $VerifySeconds 秒內沒有新的 copilot_work_started 事件送達。伺服器可能已無聲地捨棄了該請求，或者事件查詢持續發生暫時性失敗。
  觸發前最新的 copilot_work_started 事件 id：$beforeId
  HEAD: $headOid$errTail

推送實質性的提交 (在 synchronize 上自動指派是最可靠的觸發因素) 並重試。
"@
}

@{
    Status        = 'TriggerLanded'
    PrNumber      = $PrNumber
    HeadOid       = $headOid
    WorkStartedAt = $afterTs
    Detail        = "已透過 GraphQL requestReviewsByLogin 觸發；copilot_work_started 於 $afterTs。"
} | ConvertTo-Json -Compress
exit 0
