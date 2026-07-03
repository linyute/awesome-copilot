#!/usr/bin/env pwsh
# fix-broken-links - link-fix.ps1  (link-fix.sh 的 PowerShell 7+ 版本)
#
# 代理程式編輯檔案後 (postToolUse)：取得它剛剛變更的檔案，
# 擷取每個 http(s) URL，並檢查每一個。
#   • 傳遞檔案路徑時（已編輯的檔案，從 hook 承載資料（payload）注入，或
#     在命令列上提供），任何非 200 的 URL 都會取得拼字變形
#     （http/https、www、結尾斜線），然後交給 Copilot CLI 代理程式以取得更多
#     替代方案，接著是互動式選單以進行 替換/移除/跳過。
#   • 在沒有檔案參數時，它僅列出損壞的連結 - 沒有替代
#     尋找，也沒有提示。
# 無論哪種方式，通用錨點文字都會被標記為 SEO 說明。
#
# 純 PowerShell + .NET (Invoke-WebRequest/正規表示式)，加上選用的 Copilot CLI
# 代理程式交接以取得建議。
# 涵蓋：HTML · Markdown · JS/TS · JSON · CSS · SQL · 範本（皆透過 URL 掃描）
# 觸發條件：postToolUse

Set-StrictMode -Off
$ProgressPreference = 'SilentlyContinue'   # 沒有進度條時，Invoke-WebRequest 的速度快得多

# 下方的代理程式交接會呼叫 `copilot`，這本身可能會重新觸發此 hook。
# 子執行會標記此環境變數；如果存在此變數則立即退出，
# 以免發生遞迴呼叫。
if ($env:FIX_BROKEN_LINKS_AGENT) { exit 0 }

$LIMIT         = 50
$TIMEOUT       = 10
$UA            = 'Mozilla/5.0 (compatible; fix-broken-links/1.0)'
$AGENT_MODEL   = 'gpt-5-mini'   # 用於建議交接的輕量、低 token 模型
$AGENT_TIMEOUT = 60             # 放棄代理程式前的秒數
$WEB_RE  = '\.(html?|xhtml|md|markdown|mdx|js|jsx|ts|tsx|vue|svelte|json|jsonl|css|sql|erb|jinja|j2|twig|ejs|pug|hbs)$'

# 位置參數會成為檔案清單；hook 承載資料也可以提供它們。
$ScriptArgs = [System.Collections.Generic.List[string]]::new()
foreach ($a in $args) { [void]$ScriptArgs.Add([string]$a) }

# ── Hook 標準輸入 ─────────────────────────────────────────────────────────────
# 當作為 postToolUse hook 呼叫時，從 JSON 承載資料（payload）中擷取已編輯的檔案，
# 並將其作為位置參數注入，以便 Get-InputFiles 能夠取得它們。
$IsHook = $false
if ($ScriptArgs.Count -eq 0 -and [Console]::IsInputRedirected) {
  $IsHook = $true               # 作為 hook 呼叫：標準輸入攜帶工具承載資料
  $raw = [Console]::In.ReadToEnd()
  if ($raw.Trim()) {
    try {
      $json = $raw | ConvertFrom-Json
      $tool = $json.toolName; if (-not $tool) { $tool = $json.tool_name }
      if ($tool) {
        if ($tool -in 'editFiles','edit','write','str_replace_editor','create_file','multiEdit','applyPatch') {
          # 僅限此編輯工具剛剛變更的檔案 - 絕不進行更廣泛的存放庫掃描。
          $hookFiles = $json.tool_input.files; if (-not $hookFiles) { $hookFiles = $json.toolInput.files }
          if (-not $hookFiles) { $hookFiles = $json.tool_input.path; if (-not $hookFiles) { $hookFiles = $json.toolInput.path } }
          if ($hookFiles) { foreach ($hf in $hookFiles) { [void]$ScriptArgs.Add([string]$hf) } }
        }
        else {
          # 不同的工具（bash、read 等）- 無需檢查
          exit 0
        }
      }
      # 無工具內容 - 透過管道輸入手動呼叫，直接進入下一階段
    } catch { }
  }
}

# 非空的位置列表表示呼叫者傳遞了檔案：來自
# 上述 hook 承載資料的已編輯檔案，或在命令列上給出的路徑。只有在這種情況下，我們才會執行
# 完整的修復流程（尋找替代方案，然後提示修復）。如果不含
# 參數，我們只列出損壞的連結 - 不尋找替代方案，也沒有提示。
$HaveParams = $ScriptArgs.Count -gt 0

# 只有當輸入為真實主控台時，才能進行互動式提示；一旦從
# 重新導向的標準輸入中讀取了 hook JSON，我們只會報告而不會提示。
$Interactive = [Environment]::UserInteractive -and -not [Console]::IsInputRedirected

function Read-Answer {
  param([string]$Prompt)
  if (-not $Interactive) { return '' }
  [Console]::Out.Write($Prompt)
  $ans = [Console]::In.ReadLine()
  if ($null -eq $ans) { return '' }
  return $ans
}

# ── 輔助函式 ───────────────────────────────────────────────────────────────────

function Get-HttpStatus {
  param([string]$Url)
  try {
    $resp = Invoke-WebRequest -Uri $Url -MaximumRedirection 5 -TimeoutSec $TIMEOUT `
              -UserAgent $UA -ErrorAction Stop
    return [string][int]$resp.StatusCode
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode) { return [string][int]$resp.StatusCode }
    return 'ERR'
  }
}

# 以與 bash 版本相同的方式將 URL 分割為 scheme/host/path（使用字串操作，
# 而非 [uri]，以便萬用字元和奇特的路徑能完整保留）。
function Split-Url {
  param([string]$Url)
  $scheme = ($Url -split '://',2)[0]
  $rest   = $Url -replace '^[a-zA-Z][a-zA-Z0-9+.-]*://',''
  $hostName = ($rest -split '/',2)[0]
  if ($rest -eq $hostName) { $path = '' } else { $path = '/' + ($rest -split '/',2)[1] }
  [pscustomobject]@{ Scheme = $scheme; Host = $hostName; Path = $path }
}

# 檔案中的每個 http(s) URL，修剪結尾標點符號並去重。
function Get-Urls {
  param([string]$File)
  $text = [System.IO.File]::ReadAllText($File)
  [regex]::Matches($text, 'https?://[^"''<> )]+', 'IgnoreCase') |
    ForEach-Object { $_.Value -replace '[.,;:]+$','' } |
    Sort-Object -Unique
}

# 會降低 SEO 的通用錨點文字。
function Get-SeoIssues {
  param([string]$File)
  $text = [System.IO.File]::ReadAllText($File)
  $reA = '<a[^>]*>\s*(click here|click|here|read more|more|this page|this|learn more|see more|view|visit|details|info)\s*</a>'
  $reB = '\[(click here|click|here|read more|more|this page|learn more|see more|details|info)\]\('
  @([regex]::Matches($text, $reA, 'IgnoreCase')) +
  @([regex]::Matches($text, $reB, 'IgnoreCase')) | ForEach-Object { $_.Value }
}

# 嘗試常見的 URL 變形；傳回第一個傳回 200 的 URL，否則傳回 ''。
function Find-Variation {
  param([string]$Url)
  $p = Split-Url $Url
  $scheme = $p.Scheme; $hostName = $p.Host; $path = $p.Path
  $cands = [System.Collections.Generic.List[string]]::new()
  if ($scheme -eq 'http')  { [void]$cands.Add("https://$hostName$path") }
  if ($scheme -eq 'https') { [void]$cands.Add("http://$hostName$path") }
  if ($hostName -like 'www.*') { [void]$cands.Add("$scheme`://$($hostName.Substring(4))$path") }
  else                         { [void]$cands.Add("$scheme`://www.$hostName$path") }
  if ($path -and $path -notmatch '/$' -and (($path -split '/')[-1]) -notmatch '\.') {
    [void]$cands.Add(($Url -replace '/$','') + '/')
  }
  foreach ($c in $cands) {
    if ($c -eq $Url) { continue }
    if ((Get-HttpStatus $c) -eq '200') { return $c }
  }
  return ''
}

# 將損壞的連結提交給 Copilot CLI 代理程式，並讓其提議替代方案。
# 這是一個特意設計的輕量、低 token 交接：向小型模型傳送單個非互動式
# 提示詞，且不啟用任何工具（因此它根據自身的知識進行回答 - 沒有網頁
# 擷取、沒有權限提示，也沒有封存尋找）。模型可能會
# 加上散文字首，因此我們從輸出中的任何位置提取 http(s) token，修剪
# 結尾標點符號，捨棄損壞的 URL 本身，並去重。該呼叫以
# 工作（job）形式執行，以便將時間限制在 $AGENT_TIMEOUT 秒內。
function Get-AgentAlts {
  param([string]$Url,[int]$Max)
  if (-not (Get-Command copilot -ErrorAction SilentlyContinue)) { return @() }
  $snappy = $AGENT_TIMEOUT - 5
  $promptUrl = Get-PromptSafeUrl $Url
  $prompt = "在 $snappy 秒內，為損壞的連結 $promptUrl 尋找最多 $Max 個可用的替代 URL。請依序考慮：1. 路徑和/或網頁拼字；2. web.archive.org/wayback；3. 使用重新導向目標的重新導向；4. 連結文字的內容，以解決此問題。僅輸出 URL，每行一個，請勿包含：說明文字、編號、Markdown、反引號、特殊字元或後置格式化。"
  $out = ''
  try {
    # FIX_BROKEN_LINKS_AGENT 會標記子執行，以便重入的 hook 提早退出。
    $job = Start-Job -ScriptBlock {
      param($Prompt, $Model)
      $env:FIX_BROKEN_LINKS_AGENT = '1'
      copilot -p $Prompt -s --no-color --model $Model --available-tools 2>$null
    } -ArgumentList $prompt, $AGENT_MODEL
    # 僅從乾淨完成的工作中讀取輸出；失敗或出錯的 copilot
    # 執行不會產生任何替代方案。
    if ((Wait-Job $job -Timeout $AGENT_TIMEOUT) -and $job.State -eq 'Completed') {
      $out = (Receive-Job $job -ErrorAction SilentlyContinue | Out-String)
    }
    Remove-Job $job -Force -ErrorAction SilentlyContinue
  } catch { $out = '' }
  if (-not $out) { return @() }

  $seen = @{}
  $result = [System.Collections.Generic.List[string]]::new()
  foreach ($m in [regex]::Matches($out, 'https?://[^\s"''<>)\]]+', 'IgnoreCase')) {
    if ($result.Count -ge $Max) { break }
    $u = $m.Value -replace '[.,;:]+$',''
    $key = $u.ToLower()
    if ($key -eq $Url.ToLower()) { continue }
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    [void]$result.Add($u)
  }
  return ,$result.ToArray()
}

# 準備要在提示字串中安全嵌入的 URL。
# 這是對源自文件內容的值進行的縱深防禦。
function Get-PromptSafeUrl {
  param([string]$Url)
  if ($null -eq $Url) { return '' }
  $safe = $Url -replace '[\r\n]+', ' '
  $safe = $safe -replace '[`$()]', ''
  return $safe
}

# 輸出最多 MAX 個可行的損壞連結替代 URL，最佳的排在最前面：
#   1. 有效的配置/www/斜線變形（經即時驗證為 200）
#   2. 由 Copilot CLI 代理程式提議的替代方案（參見 Get-AgentAlts）
# 去重（不區分大小寫）。第一個項目是 `r` 所使用的內容；其餘
# 則成為有編號的替代方案。
function Get-SuggestedAlts {
  param([string]$Url,[int]$Max = 6)
  $seen = @{}
  $out  = [System.Collections.Generic.List[string]]::new()

  $v = Find-Variation $Url
  if ($v) { [void]$out.Add($v); $seen[$v.ToLower()] = $true }

  foreach ($a in (Get-AgentAlts $Url $Max)) {
    if ($out.Count -ge $Max) { break }
    if (-not $a) { continue }
    $key = $a.ToLower()
    if ($seen.ContainsKey($key)) { continue }
    [void]$out.Add($a); $seen[$key] = $true
  }
  return ,$out.ToArray()
}

# 在檔案中隨處替換字面 URL（單純字串替換，無正規表示式）。
function Set-UrlReplacement {
  param([string]$File,[string]$Old,[string]$New)
  $content = [System.IO.File]::ReadAllText($File)
  [System.IO.File]::WriteAllText($File, $content.Replace($Old, $New))
}

# 移除連結包裝但保留可見文字：
#   <a href="URL">文字</a>  ->  文字
#   [文字](URL)             ->  文字
function Remove-LinkWrapper {
  param([string]$File,[string]$Url)
  $content = [System.IO.File]::ReadAllText($File)
  $esc = [regex]::Escape($Url)
  # 每個元素都用括號括起來：逗號運算子的繫結比 '+' 更緊密，因此
  # 如果沒有括號，這三個串接會摺疊成單個字串，
  # 且陣列將只包含一個假的模式，而不是三個。
  $patterns = @(
    ('<a[^>]*href="' + $esc + '"[^>]*>([^<]*)</a>'),
    ("<a[^>]*href='" + $esc + "'[^>]*>([^<]*)</a>"),
    ('\[([^\]]*)\]\(' + $esc + '[^)]*\)')
  )
  foreach ($pat in $patterns) {
    $content = [regex]::Replace($content, $pat, '$1', 'IgnoreCase')
  }
  [System.IO.File]::WriteAllText($File, $content)
}

# ── 檔案探索 ──────────────────────────────────────────────────────────────────

function Get-InputFiles {
  if ($ScriptArgs.Count -gt 0) { return $ScriptArgs.ToArray() }
  # 作為 hook 觸發，但承載資料（payload）未攜帶（網頁）檔案：不執行任何動作，而不是
  # 回復為掃描無關檔案 - 此 hook 僅檢查已編輯的檔案。
  if ($IsHook) { return @() }
  $out = @()
  if (Get-Command git -ErrorAction SilentlyContinue) {
    git rev-parse --git-dir *> $null
    if ($LASTEXITCODE -eq 0) {
      $out = @(git diff --name-only HEAD 2>$null) + @(git diff --name-only --cached 2>$null)
    }
  }
  if ($out.Count -gt 0) { return $out }
  Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '[\\/](\.git|node_modules|dist|build|\.next|\.venv|__pycache__)[\\/]' } |
    ForEach-Object { Resolve-Path -Relative -LiteralPath $_.FullName }
}

$seenFiles = @{}
$FILES = [System.Collections.Generic.List[string]]::new()
foreach ($f in (Get-InputFiles)) {
  if (-not $f) { continue }
  $f = ([string]$f).Trim()
  if (-not (Test-Path -LiteralPath $f -PathType Leaf)) { continue }
  if ($f -match '[\\/](node_modules|\.git|dist|build)[\\/]') { continue }
  if ($f -notmatch $WEB_RE) { continue }
  if ($seenFiles.ContainsKey($f)) { continue }
  $seenFiles[$f] = $true
  [void]$FILES.Add($f)
}

if ($FILES.Count -eq 0) { exit 0 }

# ── 掃描 ──────────────────────────────────────────────────────────────────────

$B_FILE   = [System.Collections.Generic.List[string]]::new()
$B_URL    = [System.Collections.Generic.List[string]]::new()
$B_STATUS = [System.Collections.Generic.List[string]]::new()
$B_ALT    = [System.Collections.Generic.List[object]]::new()
$SEO_LINES = [System.Collections.Generic.List[string]]::new()

foreach ($file in $FILES) {
  foreach ($line in (Get-SeoIssues $file)) {
    if ($line) { [void]$SEO_LINES.Add("${file}: $line") }
  }

  $urls = @(Get-Urls $file)
  if ($urls.Count -eq 0) { continue }

  if ($HaveParams -and $urls.Count -gt $LIMIT) {
    $ans = Read-Answer "  $file 有 $($urls.Count) 個連結（限制為 $LIMIT）。是否繼續？ [Y/n] "
    if ($ans -in 'n','N','no','NO') { continue }
  }

  Write-Host ""
  Write-Host "  正在檢查 $file 中的 $($urls.Count) 個連結 ..."
  foreach ($url in $urls) {
    $status = Get-HttpStatus $url
    if ($status -eq '200') { continue }
    Write-Host "    損壞 ($status) $url"
    # 僅在傳遞檔案時尋找替代方案；否則僅列出。
    $alts = @()
    if ($HaveParams) { $alts = Get-SuggestedAlts $url 6 }
    [void]$B_FILE.Add($file)
    [void]$B_URL.Add($url)
    [void]$B_STATUS.Add($status)
    [void]$B_ALT.Add($alts)
  }
}

# ── SEO 報告 ──────────────────────────────────────────────────────────────────

if ($SEO_LINES.Count -gt 0) {
  Write-Host ""
  Write-Host "------------------------------------------------------------"
  Write-Host "  SEO 錨點問題（請考慮使用具描述性的連結文字）"
  foreach ($s in $SEO_LINES) { Write-Host "    $s" }
}

if ($B_URL.Count -eq 0) {
  Write-Host ""
  Write-Host "  未發現損壞的連結。"
  Write-Host ""
  exit 0
}

# ── 互動式修復 ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "============================================================"
Write-Host "  fix-broken-links 報告"
Write-Host "============================================================"

$CHANGED = @{}
$n = $B_URL.Count
for ($i = 0; $i -lt $n; $i++) {
  $file   = $B_FILE[$i]
  $url    = $B_URL[$i]
  $status = $B_STATUS[$i]
  $alts   = @($B_ALT[$i])

  Write-Host ""
  Write-Host "  [$($i + 1)] $file"
  Write-Host "    URL : $url"
  $note = ''
  if ($status -in 'ERR','000','TIMEOUT') { $note = '  (無法連線)' }
  Write-Host "    HTTP: $status$note"

  # 無檔案參數 → 僅限報告：列出損壞的連結並繼續。
  if (-not $HaveParams) { continue }

  Write-Host ""
  if ($alts.Count -gt 0) {
    Write-Host "    r  替換 -> $($alts[0])"
    for ($k = 1; $k -lt $alts.Count; $k++) {
      Write-Host "    $k  替換 -> $($alts[$k])"
    }
  }
  Write-Host "    d  移除連結，保留文字"
  Write-Host "    c  自訂替換 URL"
  Write-Host "    s  跳過"

  if (-not $Interactive) {
    Write-Host "    （無終端機 - 僅進行報告）"
    continue
  }

  while ($true) {
    $ch = Read-Answer '  > '
    if ($ch -eq 's' -or $ch -eq '') { break }
    elseif ($ch -eq 'd') {
      Remove-LinkWrapper $file $url; $CHANGED[$file] = $true; Write-Host "    已移除"; break
    }
    elseif ($ch -eq 'r') {
      if ($alts.Count -gt 0) {
        Set-UrlReplacement $file $url $alts[0]; $CHANGED[$file] = $true
        Write-Host "    已替換 -> $($alts[0])"; break
      }
      Write-Host "    無可用建議"
    }
    elseif ($ch -match '^[1-9]$') {
      $idx = [int]$ch
      if ($idx -lt $alts.Count) {
        Set-UrlReplacement $file $url $alts[$idx]; $CHANGED[$file] = $true
        Write-Host "    已替換 -> $($alts[$idx])"; break
      }
      Write-Host "    無效的選擇"
    }
    elseif ($ch -eq 'c') {
      $u = Read-Answer '  URL: '
      if ($u) { Set-UrlReplacement $file $url $u; $CHANGED[$file] = $true; Write-Host "    已替換"; break }
    }
    else {
      Write-Host "    無效的選擇"
    }
  }
}

if ($CHANGED.Count -gt 0) {
  Write-Host ""
  Write-Host "  $($CHANGED.Count) 個檔案已更新："
  foreach ($f in $CHANGED.Keys) { Write-Host "    $f" }
  Write-Host ""
}
exit 0
