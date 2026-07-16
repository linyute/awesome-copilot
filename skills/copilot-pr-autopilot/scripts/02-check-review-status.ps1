<#
.SYNOPSIS
    建立 PR 目前 Copilot 檢閱狀態的快照。單次執行，不等待。

.DESCRIPTION
    唯一工作：傳回 PR 目前 Copilot 檢閱狀態的 JSON 快照。
    代理程式 (呼叫者) 決定如何處理它 — 包括在輪詢新檢閱送達時，
    兩次快照之間要等待多久。此指令碼不會等待。

    輸出 JSON 欄位：
      - PrNumber, Owner, Repo
      - HeadOid           ：目前的 PR HEAD SHA
      - State             ：PR 狀態 (OPEN/CLOSED/MERGED)
      - LatestCopilotReview：{state, submittedAt, commitOid, bodyHead}
                            如果最近的 100 個檢閱中沒有 Copilot 檢閱，則為 null
                            (非常長的 PR 可能在該時間視窗之外有較舊的 Copilot 檢閱 —
                            此時將 null 視為「沒有最近的檢閱」，而不是「從未檢閱」)
      - ReviewAtHead       ：若且唯若最新 Copilot 檢閱的 commit.oid == HeadOid 時為 true
      - NoNewComments      ：若且唯若最新檢閱主體符合
                              「未產生新留言」 / 「產生 0 個留言」時為 true
      - OpenThreadCount    ：未解決的檢閱對話串 (thread) 數量 (來自所有檢閱者)；
                              僅供參考 — 收斂並不要求此值為零
      - OpenThreadsAwaitingReply：未解決對話串中，最後一則留言「不是」來自已驗證使用者
                              (`gh api user`) 的數量。「球在己方半場 (Ball-in-court)」模型：
                              Copilot/人類留言且我們未回覆，或者在我們之前回覆後又重新提出，
                              皆視為等待中。我們是最新留言者的對話串視為「我們這方已完成」
                              (由人類合併擁有者決定下一步)。
      - CopilotPending     ：若且唯若 Copilot 檢閱者 Bot 目前列在 PR 的
                              `requested_reviewers` 中時為 true (檢閱正在進行中；
                              呼叫者應等待而不是重新觸發)
      - Converged          ：若且唯若代理程式已完成其工作時為 true。
                              - 當 Copilot 檢閱處於 HEAD 時：
                                ReviewAtHead && NoNewComments &&
                                OpenThreadsAwaitingReply == 0。
                              - 當此 PR 未觀察到 Copilot 檢閱時
                                (LatestCopilotReview 為 null 且 CopilotPending 為 false)：
                                僅 OpenThreadsAwaitingReply == 0。請注意，這也會針對
                                零對話串的全新 PR 觸發 — 意指「尚無工作要做」；
                                如果儲存庫已啟用 Copilot，代理程式仍應透過 01-request-review.ps1
                                觸發 Copilot 檢閱。單次反覆運算模式 (跳過觸發) 是
                                代理程式在 01 失敗並出現特定 Copilot 停用錯誤後的決定，
                                而不是此指令碼的自動偵測狀態。
                              在任一情況下，未解決的對話串都可能保留 — 這些是明確移交給
                              人類合併擁有者處理的。

    標準代理程式迴圈 (請參閱 ../references/orchestration.md 和各步驟檔案)：
      1. 呼叫此指令碼 → 擷取 LatestCopilotReview.submittedAt 作為基準值 (baseline)，
         並讀取 CopilotPending。
      2. 如果 CopilotPending 為 true，跳過觸發步驟 — Copilot 已在檢閱中。
         否則，呼叫 01-request-review.ps1。
         如果 01 擲出 Copilot 停用的錯誤 (例如該 Bot 在此儲存庫不是有效的檢閱者)，
         代理程式可以遞補到單次反覆運算模式：跳過等待，跳轉至 03-list-open-threads.ps1，
         分級並回覆現有內容，完成。
      3. 等待子代理程式輪詢此指令碼，直到 submittedAt 超過基準值且 ReviewAtHead 為 true，
         或者 Converged。
      4. 收斂時結束迴圈；否則透過 03-list-open-threads.ps1 獲取對話串、分級、修正、推送、回覆，重複此過程。

    剖析 JSON：時間戳記以純 ISO-8601 UTC 字串發出 (例如 `"2026-06-08T02:02:44Z"`)。
    在原始 JSON 上透過 regex 擷取，以避免 PowerShell 自動將 ISO 字串重新繫結至
    `[datetime]` (這會在字串插值時呈現本地文化特性，並無聲地破壞字典順序的基準值比較)：

        $snap = pwsh -NoProfile -File 02-check-review-status.ps1 -PrNumber <n>
        $baseline       = if ($snap -match '"submittedAt":"([^"]+)"')  { $Matches[1] } else { '' }
        $copilotPending = ($snap -match '"CopilotPending":true')
        $converged      = ($snap -match '"Converged":true')

    適用於任何 PowerShell 版本 (5.1 + 7.x)。無 `[datetime]` 重新繫結，無版本特定參數。

.PARAMETER PrNumber
    Pull request 編號。唯一必填參數。

.PARAMETER Owner
    儲存庫擁有者。選填 — 自動從 `gh repo view` 解析。

.PARAMETER Repo
    儲存庫名稱。選填 — 自動從 `gh repo view` 解析。

.EXAMPLE
    pwsh 02-check-review-status.ps1 -PrNumber 236

    # 輸出 (已收斂)：
    # {"HeadOid":"abc...","State":"OPEN","LatestCopilotReview":{...},"ReviewAtHead":true,"NoNewComments":true,"OpenThreadCount":0}

    # 輸出 (未收斂 — 有新發現)：
    # {"HeadOid":"abc...","ReviewAtHead":true,"NoNewComments":false,"OpenThreadCount":3,...}
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [int]$PrNumber,

    [string]$Owner,
    [string]$Repo,

    # 設定時，代理程式已決定將此 PR 作為單次反覆運算執行 (通常是因為 01-request-review.ps1
    # 失敗並出現 Copilot 停用錯誤)。在此模式下，收斂會忽略過期檢閱檢查 (ReviewAtHead / NoNewComments) —
    # 當刻意跳過觸發時，這些檢查永遠不可能變為 true — 且完全取決於 OpenThreadsAwaitingReply == 0。
    [switch]$SingleIteration
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/_lib.ps1"

$coords = Resolve-RepoCoords -Owner $Owner -Repo $Repo
$Owner = $coords.Owner
$Repo  = $coords.Repo

# 目前已驗證的 gh 使用者身分。在下方用於偵測「代理程式已回覆此對話串」，
# 並因此將其視為我們的工作已完成 (該對話串可能仍因人類移交而刻意保持開啟)。
$meR = Invoke-Gh -GhArgs @('api','user','--jq','.login')
if ($meR.ExitCode -ne 0) {
    throw "gh api user 失敗 (結束代碼 $($meR.ExitCode))：$($meR.Stderr)"
}
$me = $meR.Stdout.Trim()

# 查詢 A (單次)：PR head/狀態/檢閱。此處的檢閱不進行分頁 —
# `reviews(last:100)` 是最近的 100 個檢閱，足以用於尋找最新的 Copilot 檢閱。
$qHead = @'
query($o:String!,$r:String!,$n:Int!){
  repository(owner:$o,name:$r){
    pullRequest(number:$n){
      headRefOid
      state
      reviews(last:100){nodes{author{login} state submittedAt body commit{oid}}}
    }
  }
}
'@

$d = Invoke-GhGraphQL -GhArgs @('-f',"query=$qHead",'-f',"o=$Owner",'-f',"r=$Repo",'-F',"n=$PrNumber") -Context "適用於 $Owner/$Repo PR #$PrNumber 的 head 查詢"
$pr = $d.data.repository.pullRequest
if (-not $pr) { throw "在 $Owner/$Repo 中找不到 PR #$PrNumber。" }

# 查詢 B (分頁)：reviewThreads — 獲取 isResolved 以及每個對話串的最後一則留言作者，
# 以便我們計算「此未解決對話串是否正在等待我們的回覆，或者我們是否已經將其移交？」
# 當我們沒有更多工作要做時，迴圈即收斂，而不是當未解決對話串數量降至零時
# (某些對話串因人類移交 / 升級拒絕而刻意保持開啟)。
$qThreads = @'
query($o:String!,$r:String!,$n:Int!,$after:String){
  repository(owner:$o,name:$r){
    pullRequest(number:$n){
      reviewThreads(first:100, after:$after){
        pageInfo{endCursor hasNextPage}
        nodes{
          isResolved
          comments(last:1){nodes{author{login}}}
        }
      }
    }
  }
}
'@

$after = $null
$allThreadsList = [System.Collections.Generic.List[object]]::new()
do {
    $ghArgs = @('-f', "query=$qThreads", '-f', "o=$Owner", '-f', "r=$Repo", '-F', "n=$PrNumber")
    if ($after) { $ghArgs = $ghArgs + @('-f', "after=$after") }
    $threadResp = Invoke-GhGraphQL -GhArgs $ghArgs -Context "適用於 $Owner/$Repo PR #$PrNumber 的 threads 查詢"
    $pagePr = $threadResp.data.repository.pullRequest
    if (-not $pagePr) { throw "在 $Owner/$Repo 中找不到 PR #$PrNumber (threads 頁面)。" }
    foreach ($n in $pagePr.reviewThreads.nodes) { $allThreadsList.Add($n) }
    $after = $pagePr.reviewThreads.pageInfo.endCursor
} while ($pagePr.reviewThreads.pageInfo.hasNextPage)
$allThreads = $allThreadsList.ToArray()

# 查詢 C (分頁)：reviewRequests — 一般 PR 的被請求檢閱者少於 100 名，
# 但為了正確性，分頁是必需的，這樣我們就不會在有大於 100 名被請求檢閱者的 PR 上
# 錯誤地回報 CopilotPending=false (這會導致等待子代理程式重新觸發實際上已在進行中的檢閱)。
$qReviewRequests = @'
query($o:String!,$r:String!,$n:Int!,$after:String){
  repository(owner:$o,name:$r){
    pullRequest(number:$n){
      reviewRequests(first:100, after:$after){
        pageInfo{endCursor hasNextPage}
        nodes{requestedReviewer{__typename ... on Bot{login} ... on User{login} ... on Mannequin{login}}}
      }
    }
  }
}
'@

$after = $null
$allReviewRequestsList = [System.Collections.Generic.List[object]]::new()
do {
    $ghArgs = @('-f', "query=$qReviewRequests", '-f', "o=$Owner", '-f', "r=$Repo", '-F', "n=$PrNumber")
    if ($after) { $ghArgs = $ghArgs + @('-f', "after=$after") }
    $rrResp = Invoke-GhGraphQL -GhArgs $ghArgs -Context "適用於 $Owner/$Repo PR #$PrNumber 的 reviewRequests 查詢"
    $rrPagePr = $rrResp.data.repository.pullRequest
    if (-not $rrPagePr) { throw "在 $Owner/$Repo 中找不到 PR #$PrNumber (reviewRequests 頁面)。" }
    foreach ($n in $rrPagePr.reviewRequests.nodes) { $allReviewRequestsList.Add($n) }
    $after = $rrPagePr.reviewRequests.pageInfo.endCursor
} while ($rrPagePr.reviewRequests.pageInfo.hasNextPage)
$allReviewRequests = $allReviewRequestsList.ToArray()

# M1 領先平手判定：當多個 Copilot 檢閱共享相同的 submittedAt 時
# (伺服器端時鐘衝突在高載重新觸發下很少見但有可能發生)，挑選 commit.oid 與
# HEAD 相符的檢閱 (如果有的話)；否則原始排序順序足夠確定
# (PowerShell Sort-Object 自 5.1 起是穩定的)。
# M3 分頁：reviews(last:100) 傳回最近的 100 個檢閱。
# 如果 PR 擁有比最後一個 Copilot 檢閱更新的 100+ 個檢閱
# (在正常使用中幾乎不可能，但在大量機器人檢閱的 PR 上理論上是可能的)，最新的
# Copilot 檢閱將會被切斷。當我們達到邊界時，向 stderr 發出軟性警告，
# 以便呼叫者知道需要手動檢查。
if ($pr.reviews.nodes.Count -ge 100) {
    [Console]::Error.WriteLine("WARNING: PR #$PrNumber 達到 reviews(last:100) 的邊界 — 如果有 100+ 個非 Copilot 檢閱比最新 Copilot 檢閱更新，LatestCopilotReview 可能會過期。如果收斂行為不符預期，請透過 'gh pr view $PrNumber --comments' 進行手動檢查。")
}
$copilotReviews = @($pr.reviews.nodes | Where-Object {
    $_.author -and $_.author.login -and $_.author.login -match $CopilotReviewerLoginRegex
})
$latest = if ($copilotReviews.Count -gt 0) {
    $atHead = $copilotReviews | Where-Object { $_.commit -and $_.commit.oid -eq $pr.headRefOid } | Sort-Object submittedAt -Descending | Select-Object -First 1
    if ($atHead) { $atHead } else { $copilotReviews | Sort-Object submittedAt -Descending | Select-Object -First 1 }
} else { $null }

$reviewAtHead = $false
$noNewComments = $false
$bodyHead = $null
$latestCommitOid = $null
if ($latest) {
    if ($latest.commit -and $latest.commit.oid) {
        $latestCommitOid = $latest.commit.oid
        $reviewAtHead = ($latestCommitOid -eq $pr.headRefOid)
    }
    $bodyText = if ($latest.body) { $latest.body } else { '' }
    # NoNewComments 涵蓋了成功的零發現檢閱，以及 Copilot 對於空 diff / 純空白字元 /
    # 僅限行尾字元的 diff 所傳回的「Copilot 無法檢閱此 pull request 中的任何檔案」主體。
    # 兩者對於迴圈來說都是終止狀態：代理程式沒有任何內容需要處理，重新觸發也將產生相同的主體。
    # 比對 Copilot 的「無發現」終止片語。定錨在 \b (字詞邊界，阻擋 "regenerated")
    # 以及隨後的句子結尾 (./!/EOL/EOS)，這樣 regex 就不會對類似 "generated no comments yet but..." 或
    # "with 0 comments outstanding" 的子字串產生誤判。已針對 4 個已知的負面輸入和
    # 6 個已知的正面 Copilot 主體範本進行測試。
    $noNewComments = ($bodyText -match '(?im)\b(?:generated|had|with)\s+(?:no|0|zero)\s+(?:new\s+)?comments\s*(?:[\.\!]|$)|was''t\s+able\s+to\s+review\s+any\s+files\s+in\s+this\s+pull\s+request|was\s+not\s+able\s+to\s+review\s+any\s+files\s+in\s+this\s+pull\s+request')
    $bodyHead = if ($bodyText.Length -gt 300) { $bodyText.Substring(0, 300) } else { $bodyText }
}

$openThreads = @($allThreads | Where-Object { -not $_.isResolved })
$openCount = $openThreads.Count

# OpenThreadsAwaitingReply：最後一則留言「不是」來自已驗證使用者的未解決對話串。
# 「球在己方半場」模型：
#   - Copilot/人類發布發現 → 最後留言=對方 → 等待我們回覆。
#   - 我們回覆 → 最後留言=我們 → 球傳回對方 → 非等待中。
#   - Copilot 在我們回覆後重新提出 → 最後留言=又是對方 → 等待中。
# 使用「最後一則留言」(而不是「視窗中由我們發表的任何留言」) 才能正確處理
# 重新提出的對話串。我們已回覆但檢閱者尚未採取行動的對話串視為
# 「我們這方已完成」 — 由人類合併擁有者決定接下來要做什麼。
$awaitingReply = @($openThreads | Where-Object {
    $thread = $_
    $lastAuthor = $null
    if ($thread.comments -and $thread.comments.nodes -and $thread.comments.nodes.Count -gt 0) {
        $lastComment = $thread.comments.nodes[$thread.comments.nodes.Count - 1]
        if ($lastComment -and $lastComment.author -and $lastComment.author.login) {
            $lastAuthor = $lastComment.author.login
        }
    }
    $lastAuthor -ne $me
})
$awaitingCount = $awaitingReply.Count

# CopilotPending：Copilot 檢閱者 Bot 目前是否在 `requested_reviewers` 中？
# 代表「檢閱正在進行中」的標準訊號；等待子代理程式 (工作流程步驟 2) 會諮詢此欄位，
# 以便在已經掛起 (pending) 時跳過觸發步驟 (01-request-review.ps1)。
$copilotPending = @($allReviewRequests | Where-Object {
    $_.requestedReviewer -and $_.requestedReviewer.login -and $_.requestedReviewer.login -match $CopilotReviewerLoginRegex
}).Count -gt 0

# 強制將 submittedAt 轉換為穩定的 ISO-8601 UTC 字串。ConvertFrom-Json
# 會自動將 gh 回應的 ISO 字串轉換為 [datetime]，否則 ConvertTo-Json 會使用
# .NET 的 "o" 格式 (`2026-06-07T18:06:59.0000000Z`) 發出它 — 但更重要的是，
# 將我們的 JSON 透過 `ConvertFrom-Json` 再次傳遞的下游呼叫者會取得另一個
# [datetime]，這會在字串插值時呈現本地文化特性，無聲地破壞字典順序的基準值比較。
# 發出純字串，以便使來回轉換的結果完全相同。
$submittedAtIso = if ($latest -and $latest.submittedAt) { Format-IsoUtcString $latest.submittedAt } else { $null }

$result = [ordered]@{
    PrNumber            = $PrNumber
    Owner               = $Owner
    Repo                = $Repo
    HeadOid             = $pr.headRefOid
    State               = $pr.state
    LatestCopilotReview = if ($latest) {
        [ordered]@{
            state       = $latest.state
            submittedAt = $submittedAtIso
            commitOid   = $latestCommitOid
            bodyHead    = $bodyHead
        }
    } else { $null }
    ReviewAtHead              = $reviewAtHead
    NoNewComments             = $noNewComments
    OpenThreadCount           = $openCount
    OpenThreadsAwaitingReply  = $awaitingCount
    CopilotPending            = $copilotPending
    # Converged =「代理程式沒有更多工作要做」。
    # PR 狀態保護：CLOSED / MERGED 的 PR 永遠不可能成為生產性檢閱迴圈的目標 —
    # 代理程式無法推送，迴圈也無法反覆執行。強制使 Converged = false，以便父代理程式將
    # PR 狀態變更呈現給使用者，而不是在非 OPEN 的 PR 上無聲地呼叫 task_complete。
    # - SingleIteration (代理程式決定；Copilot 無法使用或故意跳過觸發)：
    #   僅 OpenThreadsAwaitingReply == 0。忽略 ReviewAtHead / NoNewComments，
    #   因為如果沒有新的 Copilot 檢閱，這些值永遠不會更新。
    # - Copilot 檢閱存在或掛起 (pending)：ReviewAtHead &&
    #   NoNewComments && OpenThreadsAwaitingReply == 0。
    # - 從未觀察到 Copilot 檢閱：僅 OpenThreadsAwaitingReply == 0
    #   (也會針對零發現的全新 PR 觸發；如果已啟用 Copilot，
    #   代理程式仍應透過 01-request-review.ps1 觸發)。
    Converged = if ($pr.state -ne 'OPEN') {
        $false
    } elseif ($SingleIteration) {
        $awaitingCount -eq 0
    } elseif ($latest -or $copilotPending) {
        $reviewAtHead -and $noNewComments -and $awaitingCount -eq 0
    } else {
        $awaitingCount -eq 0
    }
}
$result | ConvertTo-Json -Depth 5 -Compress
