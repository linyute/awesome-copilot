<#
.SYNOPSIS
    列出 pull request 上未解決的檢閱對話串 (所有檢閱者)。

.DESCRIPTION
    透過 GraphQL 獲取檢閱對話串 (已分頁)，並列印所有
    仍為 `isResolved: false` 的對話串。包含來自所有檢閱者
    (Copilot、人類、其他機器人) 的對話串；分級步驟決定如何處理每個對話串。

    每個對話串的 `comments(first:1)` 是原始的檢閱留言
    — `path`、`line` 和 `body` 均來自於此。此處刻意不呈現相同對話串上的
    回覆鏈；此指令碼是分級的輸入，而不是用於讀取對話歷史記錄。

.PARAMETER Owner
    選填；自動從 `gh repo view` 解析。

.PARAMETER Repo
    選填；自動從 `gh repo view` 解析。
.PARAMETER PrNumber                  Pull request 編號。

.EXAMPLE
    pwsh 03-list-open-threads.ps1 -PrNumber 122

.PARAMETER MaxBodyLength
    將 `Body` 欄位限制在此字元數內 (預設為 500；傳遞 0 表示停用)。
    否則，過長的 Copilot 留言會佔用 stdout並降低分級速度；截斷的內容會加上 `…` 後綴。
#>
[CmdletBinding()]
param(
    [string]$Owner,
    [string]$Repo,

    [Parameter(Mandatory = $true)]
    [int]$PrNumber,

    [ValidateRange(0, 100000)]
    [int]$MaxBodyLength = 500
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/_lib.ps1"

$coords = Resolve-RepoCoords -Owner $Owner -Repo $Repo
$Owner = $coords.Owner
$Repo  = $coords.Repo

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
          comments(first: 1) {
            nodes {
              author { login }
              body
              path
              line
              createdAt
            }
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

    $data = Invoke-GhGraphQL -GhArgs $ghArgs -Context "列出 $Owner/$Repo PR #$PrNumber 的對話串"
    $page = $data.data.repository.pullRequest.reviewThreads
    foreach ($n in $page.nodes) { $all.Add($n) }
    $after = $page.pageInfo.endCursor
} while ($page.pageInfo.hasNextPage)

$threads = $all.ToArray()

$open = $threads | Where-Object { -not $_.isResolved }

$resultList = [System.Collections.Generic.List[object]]::new()
foreach ($t in $open) {
    $c = if ($t.comments -and $t.comments.nodes -and $t.comments.nodes.Count -gt 0) { $t.comments.nodes[0] } else { $null }
    if (-not $c) { continue }  # 格式錯誤的對話串 (無原始留言) — 跳過而不是崩潰
    $body = ($c.body -replace "`r?`n", ' ')
    if ($MaxBodyLength -gt 0 -and $body.Length -gt $MaxBodyLength) {
        $body = $body.Substring(0, $MaxBodyLength) + '…'
    }
    $path = if ($null -ne $c.line) { "$($c.path):$($c.line)" } else { $c.path }
    $author = if ($c.author -and $c.author.login) { $c.author.login } else { '(已刪除)' }
    # 透過共享協助程式將 createdAt 規格化，以便其格式在 01/02/03 之間保持一致
    # (Format-IsoUtcString 定義於 _lib.ps1)。
    $createdAt = Format-IsoUtcString $c.createdAt
    $resultList.Add([pscustomobject]@{
        ThreadId  = $t.id
        Author    = $author
        Path      = $path
        CreatedAt = $createdAt
        Body      = $body
    })
}
$result = $resultList.ToArray()

# 單行 JSON 輸出 (符合 01/02/08/10 使用的協定)。
# 使用 -Compress，以便呼叫者可以直接以管線傳送給 ConvertFrom-Json 或 jq 即可，
# 而無需清除 PowerShell 預設的 Format-List 呈現方式 / ANSI 逸出字元。
[pscustomobject]@{
    PrNumber        = $PrNumber
    Owner           = $Owner
    Repo            = $Repo
    OpenThreadCount = $result.Count
    Threads         = $result
} | ConvertTo-Json -Depth 6 -Compress
