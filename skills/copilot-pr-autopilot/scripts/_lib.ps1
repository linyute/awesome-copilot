# copilot-pr-autopilot 指令稿的共用輔助函式。
# 透過點號來源載入：`. "$PSScriptRoot/_lib.ps1"`
#
# 透過點號來源載入時會執行下方的前置條件檢查；若 `gh` 缺少或未驗證，
# 指令稿會在任何工作開始前停止，並提供單一個可供呼叫端代理程式比對的
# 可操作錯誤訊息。
#
# 相容性：Windows PowerShell 5.1+ 與 PowerShell 7+。僅使用
# `& gh @args 2>$tempFile` 來分離標準輸出與標準錯誤，避免使用
# .NET Core / .NET 5+ 才有的 `System.Diagnostics.ProcessStartInfo.ArgumentList`，
# 因為在 .NET Framework 上會傳回 `$null`。

# Canonical Copilot Code Review reviewer login 正規表達式。
# GraphQL 會將 login 揭露為 `copilot-pull-request-reviewer`（當透過
# `requestedReviewer.login` 參考時）或 `copilot-pull-request-reviewer[bot]`
#（當透過 review 的 `author.login` 參考時），因此呼叫端必須同時接受
# 這兩種形式。
#
# 在此集中管理，讓所有步驟腳本（01 / 02 / 10）保持同步 — 若規範的
# login 有所變動，只需在此修改一次。
#
# 使用命名空間（`CopilotPrAutopilot_` 前綴）並設為唯讀，因為 `_lib.ps1`
# 會以點號來源（dot-source）載入到呼叫端的範圍；像 `$CopilotLoginRegex`
# 這類裸名會有與呼叫端變數衝突的風險。`Set-Variable -Force` 允許在同一
# 會話中重新點選來源而不會因唯讀標誌而發生錯誤。
#
# 為了向後相容，我們保留別名 `$CopilotReviewerLoginRegex`，讓呼叫端不需
# 在每處讀取時輸入前綴（也讓舊版的 01/02/10 腳本繼續可用）。
Set-Variable -Name 'CopilotPrAutopilot_CopilotReviewerLoginRegex' `
    -Value '(?i)^copilot-pull-request-reviewer(\[bot\])?$' `
    -Option ReadOnly -Force -Scope Script
Set-Variable -Name 'CopilotReviewerLoginRegex' `
    -Value $CopilotPrAutopilot_CopilotReviewerLoginRegex `
    -Option ReadOnly -Force -Scope Script

# 前置條件檢查：gh CLI 已安裝且已驗證。
# 會在執行前快速失敗，並提供安裝／登入說明。此檢查具有冪等性
#（每個 PowerShell 工作階段僅執行一次）。
function Assert-GhReady {
    if ($script:_GhReady) { return }

    # 1. 已安裝？
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw @'
copilot-pr-autopilot: 前置條件缺少 — `gh` CLI 不在 PATH 上。

安裝方式（其中一種）：
  - winget install --id GitHub.cli           (Windows)
  - brew install gh                          (macOS)
  - sudo apt install gh                      (Debian/Ubuntu — 請參閱 https://cli.github.com 取得其他發行版)
  - https://cli.github.com/                  (通用安裝程式與下載)

接著執行 `gh auth login`，再重新執行此指令。
'@
    }

    # 2. 已驗證？`gh auth status` 在未登入帳號時會以非零結束碼退出。
    # 透過 `2>` 重定向將標準錯誤擷取到暫存檔案。
    $errFile = [IO.Path]::GetTempFileName()
    try {
        $null = & gh auth status 2>$errFile
        $ec = $LASTEXITCODE
        if ($ec -ne 0) {
            $err = ''
            if (Test-Path -LiteralPath $errFile) {
                $err = (Get-Content -Raw -LiteralPath $errFile -ErrorAction SilentlyContinue)
                if ($null -eq $err) { $err = '' }
            }
            throw @"
copilot-pr-autopilot: 前置條件缺少 — ``gh`` CLI 尚未驗證。

執行：
  gh auth login

然後重新執行此指令。

``gh auth status`` 回報：
  $($err.Trim())
"@
        }
    } finally {
        if (Test-Path -LiteralPath $errFile) {
            Remove-Item -LiteralPath $errFile -ErrorAction SilentlyContinue
        }
    }

    $script:_GhReady = $true
}

# 單次呼叫的 gh 包裝函式。透過 `2>` 重定向將標準輸出與標準錯誤
# 分別擷取到暫存檔案。傳回 `ExitCode/Stdout/Stderr`，因此呼叫端
# 不必再重新呼叫 `gh` 就能取得標準錯誤，且也不會在成功時把標準錯誤
# 送進 `ConvertFrom-Json`。
#
# 關於 `-WhatIf` 的注意事項：PowerShell 的 `2>` 重定向會經由 Out-File
# 處理，會尊重呼叫端範圍的 `$WhatIfPreference`。因此隨附的
# `10-cleanup-outdated.ps1` 使用明確的 `-DryRun` 參數，而不是
# `[CmdletBinding(SupportsShouldProcess)]`，這樣這個輔助函式就不會看到
# 洩漏的 WhatIfPreference，也不會印出「Performing the operation Output to File」
# 的雜訊。
function Invoke-Gh {
    param([Parameter(Mandatory)][string[]]$GhArgs)

    # 跨版本相容性：Windows PowerShell 5.1 的原生命令引數傳遞機制
    # 會破壞包含內嵌雙引號字元的引數（這是一個長期存在的 Bug，在 PS 7.3+
    # 透過 `$PSNativeCommandArgumentPassing` 才能完全修正）。GraphQL 查詢與變更
    # 例行會嵌入引號（註解、預設值、枚舉式字面值，例如
    # `['copilot-pull-request-reviewer']`），因而在 `-f field=<body>` 或
    # `-F field=<body>` 這類形式下，PowerShell 5.1 會在命令列值傳遞時悄悄拆斷
    # 引數（例如 gh CLI 回報「accepts 1 arg(s), received 7」或
    # 「Expected type \"number\", but it was malformed: \"-pull\"」）。
    # 為了在兩種執行環境中都能相同運作，任何包含 `"` 的
    # `-f field=<body>` 或 `-F field=<body>` 將會改寫為
    # `-F field=@<tempfile>`（先把本文寫入暫存檔，再由 `gh` 從檔案讀取，
    # 因此值不會出現在命令列上）。
    #
    # 重要的型別說明（已用 gh api graphql 實際驗證）：
    #   * `gh -F field=@<file>` 會讀取檔案內容並做型別推斷
    #    （數字→Number、true/false→Boolean、null→null，其他則為 String）。
    #   * `gh -f field=@<file>` 不會展開 `@<file>`——它會把字面值
    #     `@<file>` 當作值傳送（gh 的 `-f` 會直接忽略 `@` 前綴）。
    #     因此 `-f` 並不是可行的暫存檔載體；改寫必須使用 `-F`。
    #
    # 無條件改寫為 `-F` 的安全性：
    #   * 查詢本文（大型 GraphQL 字串）在推斷後幾乎不可能看起來像
    #     Number / Boolean / null，因此會以 String 方式正確還原。
    #   * 回覆本文（由人類輸入的 08-reply-and-resolve）幾乎不會剛好只是
    #     `"true"`、`"false"`、`"null"` 或單純的數字字串；如果它們確實
    #     也包含 `"`，則會導致明確的 GraphQL `String!` 型別錯誤，而不是沉默資料遺失。
    # 暫存檔會在 `finally` 區塊中清理。
    $rewritten = [System.Collections.Generic.List[string]]::new()
    $tempFiles = [System.Collections.Generic.List[string]]::new()
    for ($i = 0; $i -lt $GhArgs.Count; $i++) {
        $a = $GhArgs[$i]
        # 同時重寫包含 `"` 的 `-f field=<body>` 與 `-F field=<body>`；
        # PowerShell 5.1 的原生引數拆分問題對兩者都適用。重寫後總是輸出
        # `-F`，因為 `gh -f field=@file` 不會展開 `@file`（只有 `-F` 會——已實際驗證）。
        # 然後把本文內容以 String GraphQL 變數的形式送出。
        if (($a -eq '-f' -or $a -eq '-F') -and ($i + 1) -lt $GhArgs.Count) {
            $next = $GhArgs[$i + 1]
            $eqIdx = $next.IndexOf('=')
            if ($eqIdx -gt 0 -and $next.Substring($eqIdx + 1).Contains('"')) {
                $field = $next.Substring(0, $eqIdx)
                $body  = $next.Substring($eqIdx + 1)
                $tf = [IO.Path]::GetTempFileName()
                [void]$tempFiles.Add($tf)
                # UTF-8 without BOM so `gh` reads the body verbatim
                # 以不含 BOM 的 UTF-8 編碼寫入，讓 `gh` 逐字讀取本文內容。
                [IO.File]::WriteAllText($tf, $body, [System.Text.UTF8Encoding]::new($false))
                [void]$rewritten.Add('-F')
                [void]$rewritten.Add("$field=@$tf")
                $i++
                continue
            }
        }
        [void]$rewritten.Add($a)
    }

    $errFile = [IO.Path]::GetTempFileName()
    try {
        $finalArgs = $rewritten.ToArray()
        # 將 `$ErrorActionPreference` 暫時設為 'Continue'，包住原生 `gh` 呼叫。
        # 原因是：呼叫端常會在指令稿範圍設定 `$ErrorActionPreference = 'Stop'`，
        # 而在 PowerShell 5.1 下，這會把任何寫到標準錯誤的 `gh` 輸出轉成
        # `NativeCommandError`，導致腳本在我們檢查 `$LASTEXITCODE` 之前就被中止。
        # PS 7+ 的原生標準錯誤處理行為不同，不受此影響。透過把原生呼叫保留在
        # 'Continue'，我們在兩種執行環境下都能總是回傳
        # `@{ExitCode;Stdout;Stderr}` 物件，因此呼叫端能看到相同的結構化錯誤，
        # 並輸出相同的可操作訊息（例如 01-request-review 中的「click UI 🔄」引導）。
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $out = & gh @finalArgs 2>$errFile
            $ec = $LASTEXITCODE
        } finally {
            $ErrorActionPreference = $prevEAP
        }
        $err = ''
        if (Test-Path -LiteralPath $errFile) {
            $err = (Get-Content -Raw -LiteralPath $errFile -ErrorAction SilentlyContinue)
            if ($null -eq $err) { $err = '' }
        }
        # 保留 gh 的標準輸出內容，不要讓 PowerShell 做額外格式化。
        # `Out-String` 會附加尾端換行，並套用主控台寬度格式，這會讓呼叫端
        # 做正則式／JSON 解析時出現細微破壞。`& gh` 會對每一行輸出一個陣列項目
        #（行尾終止符已被移除）；我們用 "`n" 重新接起來，且不附加尾端換行，
        # 這樣結果保留內容，但已正規化為 LF（不是 byte-for-byte 的原始串流）。
        # 如果呼叫端需要尾端換行，會自行補上。
        $stdout = if ($null -eq $out) { '' }
                  elseif ($out -is [string]) { $out }
                  else { ($out | ForEach-Object { [string]$_ }) -join "`n" }
        [pscustomobject]@{ ExitCode = $ec; Stdout = $stdout; Stderr = $err }
    } finally {
        if (Test-Path -LiteralPath $errFile) {
            Remove-Item -LiteralPath $errFile -ErrorAction SilentlyContinue
        }
        foreach ($tf in $tempFiles) {
            if ($tf -and (Test-Path -LiteralPath $tf)) {
                Remove-Item -LiteralPath $tf -ErrorAction SilentlyContinue
            }
        }
    }
}

# 包裝 `ConvertFrom-Json`，讓非 JSON / 空白標準輸出的失敗能夠帶上
# 呼叫端的 `$Context`，以及裁剪後的標準輸出／標準錯誤內容——否則呼叫端只會
# 看到裸露的「Unexpected character encountered」例外，無法得知是哪個 gh
# 指令產生了異常輸出。這些邏輯集中處理後，預覽長度與格式設定也能在
# `Invoke-GhGraphQL`、`Resolve-RepoCoords` 以及未來的呼叫端之間保持一致。
function ConvertFrom-GhJson {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][AllowNull()][string]$Stdout,
        [AllowEmptyString()][AllowNull()][string]$Stderr,
        [Parameter(Mandatory)][string]$Context,
        [int]$PreviewChars = 500
    )
    try {
        # 使用 `-InputObject`（而不是管線形式 `$Stdout | ConvertFrom-Json`）：
        # 在 Windows PowerShell 5.1 中，從函式內回傳管線形式時，會保留剖析後的
        # 陣列為單一物件，而不是展開。呼叫端因此會看到 `.Count == 1`，
        # 且 `$result[0]` 會得到內層陣列。`-InputObject` 形式則會回傳相同的剖析結構，
        # 但 PowerShell 5.1 會在函式返回時正確展開。
        return (ConvertFrom-Json -InputObject $Stdout -ErrorAction Stop)
    } catch {
        $stdoutPreview = if ($Stdout) { $Stdout.Substring(0, [Math]::Min($PreviewChars, $Stdout.Length)) } else { '(empty)' }
        $stderrPreview = if ($Stderr) { $Stderr.Substring(0, [Math]::Min($PreviewChars, $Stderr.Length)) } else { '(empty)' }
        throw "$Context returned non-JSON: $($_.Exception.Message)`nstdout (<=${PreviewChars} chars): $stdoutPreview`nstderr (<=${PreviewChars} chars): $stderrPreview"
    }
}

# 對 `gh api graphql` 的包裝函式；只要退出碼非零，或回應主體中出現
# GraphQL `errors` 陣列，就會丟出例外。
# 透過 `Invoke-Gh` 的自動 `-f field=<body-with-quotes>` → 暫存檔改寫，
# 提供跨版本的內嵌引號相容性。
function Invoke-GhGraphQL {
    param(
        [Parameter(Mandatory)][string[]]$GhArgs,
        [Parameter(Mandatory)][string]$Context
    )
    $r = Invoke-Gh -GhArgs (@('api','graphql') + $GhArgs)
    if ($r.ExitCode -ne 0) {
        throw "gh api graphql 失敗（結束代碼 $($r.ExitCode)）[$Context]: $($r.Stderr)"
    }
    $data = ConvertFrom-GhJson -Stdout $r.Stdout -Stderr $r.Stderr -Context "gh api graphql [$Context]"
    if ($data.errors) {
        # 彙總型別、路徑與 `extensions.code`，以及 `.message`，讓呼叫端能夠
        # 在不需要重新執行額外記錄的情況下，看到可操作的失敗訊息。GitHub 常見
        # 會回傳 `type=NOT_FOUND / FORBIDDEN / RATE_LIMITED` 與
        # `extensions.code=undefinedField` 等值；若直接丟棄這些資訊，原本清楚的
        # 失敗訊息（例如「FORBIDDEN at /repository/pullRequest」）會變成只有
        # 文字訊息的抽象內容。
        $msgs = ($data.errors | ForEach-Object {
            $parts = New-Object System.Collections.Generic.List[string]
            if ($_.type) { $parts.Add("type=$($_.type)") }
            if ($_.path) { $parts.Add("path=$(($_.path) -join '/')") }
            if ($_.extensions -and $_.extensions.code) { $parts.Add("code=$($_.extensions.code)") }
            $parts.Add("message=$($_.message)")
            ($parts -join ' ')
        }) -join '; '
        throw "GraphQL errors [$Context]: $msgs"
    }
    $data
}

# 在呼叫端未傳入 owner/repo 時，自動從 gh 的本機內容解析。
# 兩者皆有或皆無的契約：只傳入其中一個 `-Owner/-Repo` 會被拒絕，
# 因為混用呼叫端提供的 owner 與本機偵測的 repo（或反之）會悄悄構造出
# 不存在或非預期的 `<Owner>/<Repo>` 組合。
function Resolve-RepoCoords {
    param([string]$Owner, [string]$Repo)
    if ([bool]$Owner -ne [bool]$Repo) {
        throw "Resolve-RepoCoords: 請同時傳入 -Owner 與 -Repo，或兩者都不傳入（收到 Owner='$Owner' Repo='$Repo'）。若只提供其中一個，會悄悄混用呼叫端與本機儲存庫座標。"
    }
    if ($Owner -and $Repo) { return @{ Owner = $Owner; Repo = $Repo } }
    $r = Invoke-Gh -GhArgs @('repo','view','--json','owner,name')
    if ($r.ExitCode -ne 0) {
        throw "gh repo view 失敗（結束代碼 $($r.ExitCode)）：$($r.Stderr)。請明確傳入 -Owner 與 -Repo，或在 gh 可偵測的儲存庫內執行。"
    }
    $info = ConvertFrom-GhJson -Stdout $r.Stdout -Stderr $r.Stderr -Context 'gh repo view'
    if (-not ($info -and $info.owner -and $info.owner.login -and $info.name)) {
        throw "gh repo view 回傳了非預期的結構（缺少 owner.login 或 name）；無法自動解析儲存庫座標。請明確傳入 -Owner 與 -Repo。"
    }
    @{ Owner = $info.owner.login; Repo = $info.name }
}

# Format-IsoUtcString — 集中處理 ISO-8601 UTC 標準化，
# 這是 01-request-review.ps1（events.created_at）、02-check-review-status.ps1
#（reviews.submittedAt）以及 03-list-open-threads.ps1（comments.createdAt）
# 都需要使用的邏輯。`ConvertFrom-Json` 會自動把 ISO 時間戳記反序列化成
# `[datetime]`，其預設 `.ToString()` 取決於文化特性，且不是可回傳為 ISO-8601 的格式。
# 呼叫 `.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')` 可維持與 GitHub
# 原始傳送值相同的 JSON 契約。如果值本來就是字串（例如 gh 回傳原始 JSON 字串），
# 則直接原樣傳回；若是 null 或空白，則回傳 ''。
function Format-IsoUtcString {
    param($Value)
    if ($null -eq $Value) { return '' }
    if ($Value -is [datetime]) { return $Value.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') }
    return [string]$Value
}

# 在點號來源載入時，執行前置條件檢查作為副作用。
Assert-GhReady
