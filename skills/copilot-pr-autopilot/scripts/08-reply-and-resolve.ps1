<#
.SYNOPSIS
    在 Copilot 檢閱對話串上發表回覆並將其解決。

.DESCRIPTION
    執行處理 Copilot 發現所需的兩個 GraphQL mutation：
    1. addPullRequestReviewThreadReply — 附加回覆留言。
    2. resolveReviewThread             — 將對話串標記為已解決。

    適用於「接受並修正」的發現，以及「拒絕並說明理由」的發現。
    請參閱 ../templates/reply-fix.md、reply-decline.md、
    reply-drift.md 和 reply-partial.md 以取得留言主體範本。

.PARAMETER ThreadId
    檢閱對話串的 GraphQL 節點 ID (例如 PRRT_kw...)。

.PARAMETER Body
    回覆主體。支援 Markdown。

.PARAMETER NoResolve
    設定時，僅發表回覆並保持對話串開啟。適用於
    您想要開始來回討論而不是關閉對話串的情況。

.EXAMPLE
    pwsh 08-reply-and-resolve.ps1 -ThreadId PRRT_kw... -Body "已在 abc1234 中修正。"

.EXAMPLE
    # 拒絕並說明理由，先不解決
    pwsh 08-reply-and-resolve.ps1 -ThreadId PRRT_kw... -NoResolve `
        -Body "拒絕：這將需要跨類別結構來處理假設的競爭條件。"

.NOTES
    回覆 + 解決是兩個獨立的 GraphQL mutation，且此指令碼「不是」不可分割的 (atomic)：
    如果回覆成功但解決失敗 (暫時性 5xx、速率限制、對話串在呼叫過程中消失)，
    回覆已經發表。此指令碼在回覆時也不是等冪 (idempotent) 的 —
    使用相同的 -ThreadId 和 -Body 重新執行將會發表重複的回覆，因為 -Body 是必填的。

    呼叫失敗時建議的重試原則：
      - 如果未印出 "Replied to thread X"，代表回覆步驟失敗；
        此時可以安全地重新執行整個命令。
      - 如果已印出 "Replied to thread X" 但未印出 "Resolved thread X"，
        則僅有解決步驟失敗。請勿重新執行此指令碼 (這會發表重複的回覆)。
        而是直接手動解決：

          gh api graphql `
            -f query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{id}}}' `
            -f t=$ThreadId

        此原始呼叫繞過了 Invoke-Gh 協助程式，但在此處是安全的，
        因為該 mutation 不包含任何嵌入的雙引號字元，
        因此 references/api-quirks.md 中記載的 PowerShell-5.1 原生引數分割錯誤並不適用。
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ThreadId,

    [Parameter(Mandatory = $true)]
    [string]$Body,

    [switch]$NoResolve
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/_lib.ps1"

$replyMutation = @'
mutation($tid: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: $tid,
    body: $body
  }) {
    comment { id }
  }
}
'@

$replyArgs = @('-f', "query=$replyMutation", '-f', "tid=$ThreadId", '-f', "body=$Body")
Invoke-GhGraphQL -GhArgs $replyArgs -Context "回覆對話串 $ThreadId" | Out-Null
Write-Output "已回覆對話串 $ThreadId"

if (-not $NoResolve) {
    $resolveMutation = @'
mutation($tid: ID!) {
  resolveReviewThread(input: { threadId: $tid }) {
    thread { isResolved }
  }
}
'@
    $resolveArgs = @('-f', "query=$resolveMutation", '-f', "tid=$ThreadId")
    Invoke-GhGraphQL -GhArgs $resolveArgs -Context "解決對話串 $ThreadId" | Out-Null
    Write-Output "已解決對話串 $ThreadId"
}
