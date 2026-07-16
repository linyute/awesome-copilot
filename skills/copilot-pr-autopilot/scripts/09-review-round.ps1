<#
.SYNOPSIS
    明確計算 PR 的 Copilot 檢閱回合數，並標記此回合是否應進行定期回顧 (recap) 限制閥門。單次執行，唯讀。

.DESCRIPTION
    唯一工作：從可觀察的歷史記錄中計算 PR 的回合數 N —
    由 Copilot Code Review Bot 發表的檢閱提交次數 —
    並回報是否已達到回顧斷路器閥門。

    每個頂層迴圈觸發器 (01-request-review.ps1) 都會產生恰好一個
    Copilot 檢閱提交，因此這些提交的數量「就是」回合數。
    它在每次呼叫時都從 GitHub API 讀取，因此永遠不會依賴
    代理程式的工作記憶體或任何磁碟上的狀態檔案。
    此技能最初是為了解決一個失敗模式而建構的 — 代理程式
    在長時間執行中失去對計數的追蹤，導致漂移了 156 個回合 —
    當回合數是衍生計算出來的，而不是記憶的，這種情況就不會發生。

    此指令碼「不」做任何決定。它不停止迴圈、不強制執行上限，
    也不選擇裁決。它回報兩個事實；父代理程式仍然擁有
    回顧推論以及 CONTINUE / REVERT-AND-SHIP / HAND-OFF 的裁決
    (請參閱 ../references/09-convergence.md)。
    「沒有指令碼能決定上限」仍然成立 — 此指令碼僅使
    *觸發* (第 N 回合) 變得確定，而不是依賴容易出錯的心算記帳。

    輸出 JSON 欄位：
      - PrNumber, Owner, Repo
      - Round         ：PR 上 Copilot Code Review 提交的數量。
                        完整分頁 — 每個 Copilot 提交，而不是
                        02-check-review-status.ps1 用於尋找最新檢閱的
                        最近 100 個的時間視窗。在閥門存在以捕捉的
                        長迴圈上，計數必須保持正確 (大於 100 個檢閱的視窗
                        將在第 100 回合後無聲地低估計數)。
      - RecapInterval ：回顧步調 (預設為 10；使用 -RecapInterval 覆寫)。
      - RecapDue      ：若且唯若 Round > 0 且 Round % RecapInterval == 0 時為 true —
                        即這是第 10 / 20 / 30 ... 回合，且父代理程式在
                        迴圈回到步驟 1 之前應執行回顧限制閥門。

    剖析 JSON (任何 PowerShell 版本，5.1 + 7.x)：

        $snap     = pwsh -NoProfile -File 09-review-round.ps1 -PrNumber <n>
        $round    = if ($snap -match '"Round":(\d+)')    { [int]$Matches[1] } else { 0 }
        $recapDue = ($snap -match '"RecapDue":true')

.PARAMETER PrNumber
    Pull request 編號。唯一必填參數。

.PARAMETER Owner
    儲存庫擁有者。選填 — 自動從 `gh repo view` 解析。

.PARAMETER Repo
    儲存庫名稱。選填 — 自動從 `gh repo view` 解析。

.PARAMETER RecapInterval
    以回合為單位的回顧步調。預設為 10 (在 10, 20, 30, ... 停止)。必須為正整數。
    公開為單一具名控制鈕，這樣該步調就不會是 prose 中重複的神奇數字，
    且閥門邊界可以在真實 PR 上測試，而無需虛構檢閱歷史記錄。

.EXAMPLE
    pwsh ./scripts/09-review-round.ps1 -PrNumber 1944

    # {"PrNumber":1944,"Owner":"github","Repo":"awesome-copilot","Round":154,"RecapInterval":10,"RecapDue":false}

.EXAMPLE
    pwsh ./scripts/09-review-round.ps1 -PrNumber 1944 -RecapInterval 7

    # 154 % 7 == 0 -> {"...","Round":154,"RecapInterval":7,"RecapDue":true}
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [int]$PrNumber,

    [string]$Owner,
    [string]$Repo,

    [ValidateRange(1, [int]::MaxValue)]
    [int]$RecapInterval = 10
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/_lib.ps1"

$coords = Resolve-RepoCoords -Owner $Owner -Repo $Repo
$Owner = $coords.Owner
$Repo  = $coords.Repo

# 遍歷所有檢閱 (完整分頁)。02-check-review-status.ps1 僅需要
# 最近 100 個的時間視窗來尋找最新的 Copilot 檢閱；回合
# 計數必須包含「每一個」Copilot 提交，因為該閥門恰好是為了
# 計數可能超過 100 的長迴圈而存在的。計數與順序無關，
# 因此向前分頁即足夠。
$qReviews = @'
query($o:String!,$r:String!,$n:Int!,$after:String){
  repository(owner:$o,name:$r){
    pullRequest(number:$n){
      reviews(first:100, after:$after){
        pageInfo{endCursor hasNextPage}
        nodes{author{login}}
      }
    }
  }
}
'@

$after = $null
$round = 0
do {
    $ghArgs = @('-f', "query=$qReviews", '-f', "o=$Owner", '-f', "r=$Repo", '-F', "n=$PrNumber")
    if ($after) { $ghArgs = $ghArgs + @('-f', "after=$after") }
    $resp = Invoke-GhGraphQL -GhArgs $ghArgs -Context "計算 $Owner/$Repo PR #$PrNumber 的檢閱次數"
    $pagePr = $resp.data.repository.pullRequest
    if (-not $pagePr) { throw "在 $Owner/$Repo 中找不到 PR #$PrNumber (reviews 頁面)。" }
    $round += @($pagePr.reviews.nodes | Where-Object {
        $_.author -and $_.author.login -and $_.author.login -match $CopilotReviewerLoginRegex
    }).Count
    $after = $pagePr.reviews.pageInfo.endCursor
} while ($pagePr.reviews.pageInfo.hasNextPage)

# 僅限閥門觸發 — 而非裁決。RecapDue 表示「這是第 N 回合，
# 執行回顧」；父代理程式讀取回顧並選擇
# CONTINUE / REVERT-AND-SHIP / HAND-OFF (09-convergence.md)。
$recapDue = ($round -gt 0) -and (($round % $RecapInterval) -eq 0)

$result = [ordered]@{
    PrNumber      = $PrNumber
    Owner         = $Owner
    Repo          = $Repo
    Round         = $round
    RecapInterval = $RecapInterval
    RecapDue      = $recapDue
}
$result | ConvertTo-Json -Depth 3 -Compress
