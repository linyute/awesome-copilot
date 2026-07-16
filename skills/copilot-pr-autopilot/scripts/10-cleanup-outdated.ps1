<#
.SYNOPSIS
    批次清理 PR 上過期的 Copilot 檢視執行緒。

.DESCRIPTION
    在檢視迴圈收斂後，PR 仍可能顯示舊的 `isOutdated`
    Copilot 執行緒為開啟狀態。它們已被後續提交處理，
    但從未被明確標記為已解決。這個腳本會找出它們並
    批次解決。

    只會處理符合下列條件的執行緒：
      - isOutdated: true
      - isResolved: false
      - 第一則留言的作者是 copilot-pull-request-reviewer
      - 最後一則留言的作者是已驗證使用者（也就是我們
        已經回覆過該執行緒）。這個安全防護可避免腳本在
        檢視迴圈尚未收斂前隱藏仍可採取行動的發現。可用
        -Force 覆寫。
      - 執行緒中的任何留言都不是來自非 Copilot、非已驗證
        使用者作者（「執行緒內有人類參與」防護——如果人類
        或其他 bot 甚至在 Copilot 開頭之後於執行緒任何位置
        發言，該執行緒就會被略過）。這個防護不能用 -Force
        覆寫；自動解決帶有人類訊號的執行緒，會默默隱藏尚未
        處理的疑慮。

    文件中「來自人類檢視者的執行緒永遠不會被碰觸」這項
    宣告，因此對單一作者的人類執行緒，以及 Copilot 先開頭、
    人類後回覆的混合作者執行緒都成立。

.PARAMETER Owner
    儲存庫擁有者（組織或使用者）。預設為目前儲存庫的擁有者
    （透過 `gh repo view` 解析）。

.PARAMETER Repo
    儲存庫名稱。預設為目前儲存庫名稱。

.PARAMETER PrNumber
    拉取要求編號。

.EXAMPLE
    pwsh 10-cleanup-outdated.ps1 -PrNumber 122

.EXAMPLE
    pwsh 10-cleanup-outdated.ps1 -PrNumber 122 -DryRun
#>
[CmdletBinding()]
param(
    [string]$Owner,
    [string]$Repo,

    [Parameter(Mandatory = $true)]
    [int]$PrNumber,

    # 在不進行任何 GraphQL
    # mutation 的情況下列印將會被解決的內容。使用明確的開關
    # （而不是 PowerShell 的 SupportsShouldProcess / -WhatIf
    # 機制），這樣 helper 內部的 `2>` 重新導向就不會繼承
    # WhatIfPreference，也不會印出像「執行操作 Output to File」
    # 這類多餘雜訊。
    [switch]$DryRun,

    # 覆寫要求執行緒最後留言者必須是已驗證使用者的安全防護。
    # 若沒有 -Force，最後發言者是 Copilot（或任何不是我們的人）
    # 的執行緒都會被略過——解決它們會隱藏尚未回覆的可採取行動
    # 發現。只有在你刻意將過期的 Copilot 執行緒在收斂迴圈之外
    # 清掉時才使用 -Force。
    #
    # -Force 不會覆寫執行緒內有人類參與的防護：凡是任何地方
    # 出現非 Copilot、非已驗證使用者留言的執行緒，無論是否加上
    # -Force 都會一律略過。
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/_lib.ps1"

$coords = Resolve-RepoCoords -Owner $Owner -Repo $Repo
$Owner = $coords.Owner
$Repo  = $coords.Repo

# 已驗證使用者登入名稱——（除非使用 -Force）這樣我們才能只
# 解決我們確實已回覆過的執行緒。沿用 02-check-review-status.ps1
# 裡的模式。
$meR = Invoke-Gh -GhArgs @('api','user','--jq','.login')
if ($meR.ExitCode -ne 0) {
    throw "gh api user failed (exit $($meR.ExitCode)): $($meR.Stderr)"
}

$me = $meR.Stdout.Trim()

$query = @'
query($owner: String!, $repo: String!, $pr: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100, after: $after) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          isResolved
          isOutdated
          firstComment: comments(first: 1) {
            nodes { author { login } }
          }
          lastComment: comments(last: 1) {
            nodes { author { login } }
          }
          # 取前一頁的留言作者，這樣我們就能拒絕任何有非 Copilot、
          # 非 $me 參與者留言的執行緒（人類或不同 bot 在 Copilot
          # 開頭之後發言）。文件中「來自人類檢視者的執行緒永遠不會
          # 被碰觸」這項承諾，即使人類留言不是第一則也必須成立。
          # totalCount 可讓我們偵測超過 100 個節點的執行緒；對這類
          # 執行緒，我們會透過下面的 node(id:) 查詢分頁其餘留言，
          # 確保作者可見性始終完整。
          allComments: comments(first: 100) {
            totalCount
            pageInfo { endCursor hasNextPage }
            nodes { author { login } }
          }
        }
      }
    }
  }
}
'@

$all = [System.Collections.Generic.List[object]]::new()
$after = $null
do {
    $ghArgs = @('-f', "query=$query", '-f', "owner=$Owner", '-f', "repo=$Repo", '-F', "pr=$PrNumber")
    if ($after) { $ghArgs = $ghArgs + @('-f', "after=$after") }

    $data = Invoke-GhGraphQL -GhArgs $ghArgs -Context "列出 $Owner/$Repo PR #$PrNumber 的過期執行緒"
    $page = $data.data.repository.pullRequest.reviewThreads
    foreach ($n in $page.nodes) { $all.Add($n) }
    $after = $page.pageInfo.endCursor
} while ($page.pageInfo.hasNextPage)

$threads = $all.ToArray()

# 留言分頁 helper：當執行緒的前 100 則留言沒有涵蓋完整集合
#（totalCount > nodes.Count）時，透過 node(id:) 取得剩餘頁面，
# 讓作者可見性始終完整。
# 回傳作者登入名稱的完整有序清單（可能包含 $null 項目，對應
# 消失/刪除使用者——呼叫端必須容忍 $null）。
#
# 保證：
#   * 使用有型別的 List[object]（保留 $null 作者項目，供消失/
#     刪除使用者使用），避免透過 `+=` 造成 O(n^2) 陣列成長。
#   * 以 `(MaxPages + 1) * 100` 則留言作為硬上限，避免伺服器
#     傳回無效 pageInfo 時發生無限迴圈（游標永不前進）。外層查詢
#     是第 0 頁（前 100 則留言）；MaxPages 會限制額外分頁的頁數。
#     預設 MaxPages=200 → 最多 201 頁 → 20,100 則留言，遠高於
#     任何合理的 PR 執行緒。
#   * 若分頁的 `node(id:)` 查詢回傳 $null（例如執行緒在分頁途中
#     被刪除），就丟出帶有明確脈絡的錯誤，讓失敗往上冒泡，而不會
#     默默產生不完整的作者資訊。
function Get-AllThreadAuthors {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$ThreadId,
        [Parameter(Mandatory)] $FirstPage,           # 外層查詢回傳的 allComments 物件
        [int]$MaxPages = 200
    )

    # List[object]（不是 List[string]），這樣 $null 作者項目——
    # GitHub 對已刪除 / 消失使用者會回傳它們——才能以 $null
    # 原樣往返，而不會被強制轉成 ''。呼叫端依賴 `-not $login`
    # 同時略過兩者，但保留原始形狀能讓任何未來呼叫者維持清楚
    # 的契約。
    $authors = [System.Collections.Generic.List[object]]::new()

    $firstNodes = @()
    if ($FirstPage -and $FirstPage.nodes) { $firstNodes = @($FirstPage.nodes) }
    foreach ($n in $firstNodes) {
        $login = $null
        if ($n -and $n.author) { $login = $n.author.login }
        $authors.Add($login)
    }

    $hasNext = $false
    $after   = $null
    if ($FirstPage -and $FirstPage.pageInfo) {
        $hasNext = [bool]$FirstPage.pageInfo.hasNextPage
        $after   = $FirstPage.pageInfo.endCursor
    }

    $pageQuery = @'
query($id: ID!, $after: String) {
  node(id: $id) {
    ... on PullRequestReviewThread {
      comments(first: 100, after: $after) {
        pageInfo { endCursor hasNextPage }
        nodes { author { login } }
      }
    }
  }
}
'@

    # 第一個抓到的頁面標為 1：這裡先將 $pageIndex 初始化為 0，
    # 然後在迴圈進入時遞增。外層（迴圈前）查詢是第 0 頁；這個
    # 迴圈會抓額外頁面，所以 MaxPages 會限制迴圈內的迭代次數，
    # 使總上限（外層 + 分頁）= MaxPages + 1。
    $pageIndex = 0
    while ($hasNext) {
        $pageIndex++
        if ($pageIndex -gt $MaxPages) {
            throw "Get-AllThreadAuthors: exceeded MaxPages=$MaxPages for thread $ThreadId — likely a malformed server response (cursor not advancing)."
        }

        $pageArgs = @('-f', "query=$pageQuery", '-f', "id=$ThreadId")
        if ($after) { $pageArgs = $pageArgs + @('-f', "after=$after") }
        $pageData = Invoke-GhGraphQL -GhArgs $pageArgs -Context "為執行緒 $ThreadId 分頁留言（第 $pageIndex 頁）"

        $threadNode = $null
        if ($pageData -and $pageData.data) { $threadNode = $pageData.data.node }
        if (-not $threadNode) {
            throw "Get-AllThreadAuthors: node(id: '$ThreadId') 在第 $pageIndex 頁回傳 null（執行緒已刪除或無法存取）。"
        }
        $pageBody = $threadNode.comments
        if (-not $pageBody) {
            throw "Get-AllThreadAuthors: 執行緒 $ThreadId 在第 $pageIndex 頁沒有 comments 連線。"
        }

        $pageNodes = @()
        if ($pageBody.nodes) { $pageNodes = @($pageBody.nodes) }
        foreach ($n in $pageNodes) {
            $login = $null
            if ($n -and $n.author) { $login = $n.author.login }
            $authors.Add($login)
        }

        $prevCursor = $after
        $hasNext = $false
        $after   = $null
        if ($pageBody.pageInfo) {
            $hasNext = [bool]$pageBody.pageInfo.hasNextPage
            $after   = $pageBody.pageInfo.endCursor
        }
        # 雙重保險：如果伺服器宣稱還有更多頁，但游標沒有前進，
        # MaxPages 仍會擋下它——但這裡要更明確地提前失敗。
        if ($hasNext -and $after -eq $prevCursor) {
            throw "Get-AllThreadAuthors: thread $ThreadId 在第 $pageIndex 頁的分頁游標沒有前進（伺服器回傳相同的 endCursor='$after'）。"
        }
    }

    # 以陣列回傳（逗號前綴可防止 PowerShell 在呼叫邊界將單一
    # 元素清單拆開）。
    return ,$authors.ToArray()
}

$copilotLoginRegex = $CopilotReviewerLoginRegex  # 定義於 _lib.ps1 的標準 regex

# 以明確 foreach 建立 $targets，而不是 Where-Object {...}。
# 先前的 Where-Object predicate 真的在做事（警告、try/catch、
# 分頁呼叫、計數器變動）——Where-Object 的 script-block 會在
# 子作用域執行，這也是那些計數器必須是 $script: 的原因。
# 改成普通 foreach 後，predicate 語意更清楚，計數器可用一般
# 區域變數，也更容易理解錯誤處理。
[int]$skippedAwaitingReply = 0
[int]$skippedHumanInThread = 0
[int]$skippedUnknownAuthorInThread = 0
[int]$skippedPaginationError = 0
$targets = New-Object System.Collections.Generic.List[object]

foreach ($thread in $threads) {
    if (-not $thread.isOutdated) { continue }
    if ($thread.isResolved)      { continue }

    # 圍繞 GraphQL 結構的防禦性 null 防護。檢視者登入名稱可能會
    # 依 GraphQL 介面而顯示為 `copilot-pull-request-reviewer` 或
    # `copilot-pull-request-reviewer[bot]`；用此處與其他地方相同的
    # regex 一起比對這兩種情況。
    $firstAuthor = $null
    if ($thread.firstComment -and $thread.firstComment.nodes -and $thread.firstComment.nodes.Count -gt 0 -and $thread.firstComment.nodes[0].author) {
        $firstAuthor = $thread.firstComment.nodes[0].author.login
    }
    if (-not ($firstAuthor -and ($firstAuthor -match $copilotLoginRegex))) { continue }

    # 執行緒內有人類參與的防護：如果執行緒中的任何留言來自
    # 非 Copilot、非 $me 作者（也就是人類或不同 bot 在 Copilot
    # 開頭之後發言），即使加上 -Force 也拒絕自動解決。
    # 文件中「來自人類檢視者的執行緒永遠不會被碰觸」這項宣告，
    # 必須不受人類留言 *位置* 的影響——混合作者的執行緒仍然
    # 帶有人類訊號，當清理流程呼叫時不得悄悄消失。
    #
    # 外層查詢會抓前 100 位留言作者；當連線的
    # pageInfo.hasNextPage 為 true 時，Get-AllThreadAuthors 會透過
    # node(id:) 分頁其餘資料，讓作者可見性始終完整。hasNextPage
    # 是「還有更多頁」的標準連線訊號——直接使用它比比較
    # totalCount 與 nodes.Count 更穩健（totalCount 仍保留在查詢中
    # 供診斷使用，但不作為分頁觸發條件）。
    $hasMore = $false
    if ($thread.allComments -and $thread.allComments.pageInfo) {
        $hasMore = [bool]$thread.allComments.pageInfo.hasNextPage
    }
    $allAuthors = $null
    if ($hasMore) {
        # 逐執行緒 try/catch，讓單一執行緒上的暫時性分頁失敗（游標
        # 不前進、node(id:) 在中途回傳 null、速率限制等等）不會讓
        # 其餘清理流程中止——這與下方針對解決 mutation 使用的逐
        # 執行緒隔離相同。失敗時：以安全為先，略過該執行緒（在
        # 作者身分未知時絕不解決）。
        try {
            $allAuthors = Get-AllThreadAuthors -ThreadId $thread.id -FirstPage $thread.allComments
        } catch {
            $skippedPaginationError++
            Write-Warning "執行緒 $($thread.id) 的分頁失敗——略過（安全模式）：$($_.Exception.Message)"
            continue
        }
    } else {
        $allAuthorsList = [System.Collections.Generic.List[object]]::new()
        if ($thread.allComments -and $thread.allComments.nodes) {
            foreach ($n in $thread.allComments.nodes) {
                $login = if ($n.author) { $n.author.login } else { $null }
                $allAuthorsList.Add($login)
            }
        }
        $allAuthors = $allAuthorsList.ToArray()
    }

    $humanInThread = $false
    $unknownAuthorInThread = $false
    foreach ($login in $allAuthors) {
        if (-not $login) {
            # `$null` 作者 = 消失 / 刪除的使用者。作者身分確實未知，
            # 所以要視為不安全（安全模式）：我們寧可讓一個過期的
            # bot 執行緒留著，也不要自動解決一個「可能」藏有人類
            # 訊號、但被刪除帳號遮住的執行緒。將其與
            # $humanInThread 分開顯示，這樣摘要就能區分「這裡有人類
            # 參與」與「我們無法判斷誰參與了」兩種情況。
            $unknownAuthorInThread = $true
            continue
        }
        if ($login -eq $me) { continue }
        if ($login -match $copilotLoginRegex) { continue }
        $humanInThread = $true
        break
    }
    if ($humanInThread) {
        $skippedHumanInThread++
        continue
    }
    if ($unknownAuthorInThread) {
        $skippedUnknownAuthorInThread++
        continue
    }

    # 安全防護：不要解決最後一句不是我們的人發出的執行緒——
    # 這表示我們還沒回覆，所以解決它會隱藏尚未處理的可採取行動
    # 發現。可用 -Force 覆寫。
    $lastAuthor = $null
    if ($thread.lastComment -and $thread.lastComment.nodes -and $thread.lastComment.nodes.Count -gt 0 -and $thread.lastComment.nodes[0].author) {
        $lastAuthor = $thread.lastComment.nodes[0].author.login
    }
    if (-not $Force -and $lastAuthor -ne $me) {
        $skippedAwaitingReply++
        continue
    }

    $targets.Add($thread)
}

if ($skippedHumanInThread -gt 0) {
    Write-Output "略過 $skippedHumanInThread 個過期的 Copilot 執行緒，其中有非 Copilot、非 '$me' 的留言者參與（-Force 不會覆寫這個限制——人類訊號不能默默消失）。"
}
if ($skippedUnknownAuthorInThread -gt 0) {
    Write-Output "略過 $skippedUnknownAuthorInThread 個過期的 Copilot 執行緒，因其中至少有一則來自消失 / 已刪除使用者（null 作者）的留言（-Force 不會覆寫這個限制——作者身分未知，以略過為安全做法）。"
}
if ($skippedAwaitingReply -gt 0) {
    Write-Output "略過 $skippedAwaitingReply 個過期的 Copilot 執行緒，因其最後一則留言不是來自 '$me'（可用 -Force 覆寫）。"
}
if ($skippedPaginationError -gt 0) {
    Write-Output "略過 $skippedPaginationError 個過期的 Copilot 執行緒，因作者分頁發生錯誤（安全模式：作者身分未知時絕不解決）。請參閱上方每個執行緒的警告細節。"
}

if ($targets.Count -eq 0) {
    Write-Output '沒有需要清理的過期 Copilot 執行緒。'
    return
}

Write-Output "找到 $($targets.Count) 個需要解決的過期 Copilot 執行緒。"

$resolveMutation = @'
mutation($tid: ID!) {
  resolveReviewThread(input: { threadId: $tid }) {
    thread { isResolved }
  }
}
'@

# 逐執行緒 try/catch，讓單一 mutation 失敗（速率限制、暫時性
# GraphQL 錯誤、執行緒在迴圈中途消失）時，不會讓整個清理流程
# 中止，也不會讓剩餘的過期執行緒維持未解決。追蹤成功與失敗，
# 然後在最後做總結；如果有任何執行緒失敗，就以非零退出碼結束。
$resolved = 0
$failed = New-Object System.Collections.Generic.List[object]
foreach ($t in $targets) {
    if ($DryRun) {
        Write-Output "將會解決 $($t.id)（DryRun）"
        continue
    }
    try {
        $resolveArgs = @('-f', "query=$resolveMutation", '-f', "tid=$($t.id)")
        Invoke-GhGraphQL -GhArgs $resolveArgs -Context "解決過期執行緒 $($t.id)" | Out-Null
        Write-Output "已解決 $($t.id)"
        $resolved++
    } catch {
        $msg = $_.Exception.Message
        Write-Warning "解決 $($t.id) 失敗：$msg"
        $failed.Add([pscustomobject]@{ ThreadId = $t.id; Error = $msg })
    }
}

if (-not $DryRun) {
    Write-Output "清理摘要：resolved=$resolved failed=$($failed.Count) skippedAwaitingReply=$skippedAwaitingReply skippedHumanInThread=$skippedHumanInThread skippedUnknownAuthorInThread=$skippedUnknownAuthorInThread skippedPaginationError=$skippedPaginationError"
    if ($failed.Count -gt 0) {
        Write-Output ("失敗的執行緒：" + (($failed | ForEach-Object { "$($_.ThreadId) ($($_.Error))" }) -join '; '))
        exit 1
    }
}
