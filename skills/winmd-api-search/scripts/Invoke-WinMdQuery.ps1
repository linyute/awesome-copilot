<#
.SYNOPSIS
    從快取的 JSON 檔案查詢 WinMD API Metadata。

.DESCRIPTION
    讀取預先建構的 WinMD 類型、成員與命名空間的 JSON 快取。
    快取按套件組織 (已去重)，並具備將每個專案對應至其參考套件的專案資訊清單。

    支援列出命名空間、類型、成員、搜尋、列舉值查閱，以及列出快取的專案/套件。

.PARAMETER Action
    要執行的查詢動作：
    - projects    : 列出快取的專案
    - packages    : 列出專案的套件
    - stats       : 顯示專案的彙總統計數據
    - namespaces  : 列出所有命名空間 (選用 -Filter 前綴)
    - types       : 列出命名空間中的類型 (需要 -Namespace)
    - members     : 列出類型的成員 (需要 -TypeName)
    - search      : 按名稱搜尋類型與成員 (需要 -Query)
    - enums       : 列出列舉值 (需要 -TypeName)

.PARAMETER Project
    要查詢的專案名稱。若僅快取了一個專案，則會自動選取。
    使用 -Action projects 列出可用的專案。

.PARAMETER Namespace
    要查詢類型的命名空間 (搭配 -Action types 使用)。

.PARAMETER TypeName
    完整類型名稱，例如 "Microsoft.UI.Xaml.Controls.Button" (搭配 -Action members, enums 使用)。

.PARAMETER Query
    搜尋查詢字串 (搭配 -Action search 使用)。

.PARAMETER Filter
    命名空間的選用前綴過濾器 (搭配 -Action namespaces 使用)。

.PARAMETER CacheDir
    winmd-cache 目錄的路徑。預設為相對於工作區根目錄的 "Generated Files\winmd-cache"。

.PARAMETER MaxResults
    搜尋要回傳的最大結果數。預設為 30。

.EXAMPLE
    .\Invoke-WinMdQuery.ps1 -Action projects
    .\Invoke-WinMdQuery.ps1 -Action packages -Project BlankWinUI
    .\Invoke-WinMdQuery.ps1 -Action stats -Project BlankWinUI
    .\Invoke-WinMdQuery.ps1 -Action namespaces -Filter "Microsoft.UI"
    .\Invoke-WinMdQuery.ps1 -Action types -Namespace "Microsoft.UI.Xaml.Controls"
    .\Invoke-WinMdQuery.ps1 -Action members -TypeName "Microsoft.UI.Xaml.Controls.Button"
    .\Invoke-WinMdQuery.ps1 -Action search -Query "NavigationView"
    .\Invoke-WinMdQuery.ps1 -Action enums -TypeName "Microsoft.UI.Xaml.Visibility"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('projects', 'packages', 'stats', 'namespaces', 'types', 'members', 'search', 'enums')]
    [string]$Action,

    [string]$Project,
    [string]$Namespace,
    [string]$TypeName,
    [string]$Query,
    [string]$Filter,
    [string]$CacheDir,
    [int]$MaxResults = 30
)

# ─── 解析快取目錄 ─────────────────────────────────────────────────

if (-not $CacheDir) {
    # 慣例：技能位於 .github/skills/winmd-api-search/scripts/
    # 因此工作區根目錄位於 $PSScriptRoot 往上 4 層。
    $scriptDir = $PSScriptRoot
    $root = (Resolve-Path (Join-Path $scriptDir '..\..\..\..')).Path
    $CacheDir = Join-Path $root 'Generated Files\winmd-cache'
}

if (-not (Test-Path $CacheDir)) {
    Write-Error "在以下位置找不到快取：$CacheDir`n請執行：.\Update-WinMdCache.ps1 (從 .github\skills\winmd-api-search\scripts\)"
    exit 1
}

# ─── 專案解析輔助函式 ──────────────────────────────────────────────

function Get-CachedProjects {
    $projectsDir = Join-Path $CacheDir 'projects'
    if (-not (Test-Path $projectsDir)) { return @() }
    Get-ChildItem $projectsDir -Filter '*.json' | ForEach-Object { $_.BaseName }
}

function Resolve-ProjectManifest {
    param([string]$Name)

    $projectsDir = Join-Path $CacheDir 'projects'
    if (-not (Test-Path $projectsDir)) {
        Write-Error "未快取任何專案。請先執行 Update-WinMdCache.ps1。"
        exit 1
    }

    if ($Name) {
        $path = Join-Path $projectsDir "$Name.json"
        if (-not (Test-Path $path)) {
            # 掃描模式會附加雜湊後綴 —— 嘗試前綴匹配
            $matching = @(Get-ChildItem $projectsDir -Filter "${Name}_*.json" -ErrorAction SilentlyContinue)
            if ($matching.Count -eq 1) {
                return Get-Content $matching[0].FullName -Raw | ConvertFrom-Json
            }
            if ($matching.Count -gt 1) {
                $names = ($matching | ForEach-Object { $_.BaseName }) -join ', '
                Write-Error "多個專案匹配 '$Name'。請指定完整名稱：$names"
                exit 1
            }
            $available = (Get-CachedProjects) -join ', '
            Write-Error "找不到專案 '$Name'。可用專案：$available"
            exit 1
        }
        return Get-Content $path -Raw | ConvertFrom-Json
    }

    # 若僅有一個專案則自動選取
    $manifests = Get-ChildItem $projectsDir -Filter '*.json' -ErrorAction SilentlyContinue
    if ($manifests.Count -eq 0) {
        Write-Error "未快取任何專案。請先執行 Update-WinMdCache.ps1。"
        exit 1
    }
    if ($manifests.Count -eq 1) {
        return Get-Content $manifests[0].FullName -Raw | ConvertFrom-Json
    }

    $available = ($manifests | ForEach-Object { $_.BaseName }) -join ', '
    Write-Error "快取了多個專案 —— 請使用 -Project 指定。可用專案：$available"
    exit 1
}

function Get-PackageCacheDirs {
    param($Manifest)
    $dirs = @()
    foreach ($pkg in $Manifest.packages) {
        $dir = Join-Path (Join-Path (Join-Path $CacheDir 'packages') $pkg.id) $pkg.version
        if (Test-Path $dir) {
            $dirs += $dir
        }
    }
    return $dirs
}

# ─── 動作：projects ────────────────────────────────────────────────────────

function Show-Projects {
    $projects = Get-CachedProjects
    if ($projects.Count -eq 0) {
        Write-Output "未快取任何專案。"
        return
    }
    Write-Output "已快取的專案 ($($projects.Count))："
    foreach ($p in $projects) {
        $manifest = Get-Content (Join-Path (Join-Path $CacheDir 'projects') "$p.json") -Raw | ConvertFrom-Json
        $pkgCount = $manifest.packages.Count
        Write-Output "  $p ($pkgCount 個套件)"
    }
}

# ─── 動作：packages ────────────────────────────────────────────────────────

function Show-Packages {
    $manifest = Resolve-ProjectManifest -Name $Project
    Write-Output "專案 '$($manifest.projectName)' 的套件 ($($manifest.packages.Count))："
    foreach ($pkg in $manifest.packages) {
        $metaPath = Join-Path (Join-Path (Join-Path (Join-Path $CacheDir 'packages') $pkg.id) $pkg.version) 'meta.json'
        if (Test-Path $metaPath) {
            $meta = Get-Content $metaPath -Raw | ConvertFrom-Json
            Write-Output "  $($pkg.id)@$($pkg.version) -- $($meta.totalTypes) 個類型, $($meta.totalMembers) 個成員"
        } else {
            Write-Output "  $($pkg.id)@$($pkg.version) -- (遺失快取)"
        }
    }
}

# ─── 動作：stats ───────────────────────────────────────────────────────────

function Show-Stats {
    $manifest = Resolve-ProjectManifest -Name $Project
    $totalTypes = 0
    $totalMembers = 0
    $totalNamespaces = 0
    $totalWinMd = 0

    foreach ($pkg in $manifest.packages) {
        $metaPath = Join-Path (Join-Path (Join-Path (Join-Path $CacheDir 'packages') $pkg.id) $pkg.version) 'meta.json'
        if (Test-Path $metaPath) {
            $meta = Get-Content $metaPath -Raw | ConvertFrom-Json
            $totalTypes += $meta.totalTypes
            $totalMembers += $meta.totalMembers
            $totalNamespaces += $meta.totalNamespaces
            $totalWinMd += $meta.winMdFiles.Count
        }
    }

    Write-Output "WinMD 索引統計數據 -- $($manifest.projectName)"
    Write-Output "======================================"
    Write-Output "  套件：      $($manifest.packages.Count)"
    Write-Output "  命名空間：  $totalNamespaces (可能在套件間重疊)"
    Write-Output "  類型：      $totalTypes"
    Write-Output "  成員：      $totalMembers"
    Write-Output "  WinMD 檔案：$totalWinMd"
}

# ─── 動作：namespaces ──────────────────────────────────────────────────────

function Get-Namespaces {
    param([string]$Prefix)
    $manifest = Resolve-ProjectManifest -Name $Project
    $dirs = Get-PackageCacheDirs -Manifest $manifest
    $allNs = @()

    foreach ($dir in $dirs) {
        $nsFile = Join-Path $dir 'namespaces.json'
        if (Test-Path $nsFile) {
            $allNs += (Get-Content $nsFile -Raw | ConvertFrom-Json)
        }
    }

    $allNs = $allNs | Sort-Object -Unique
    if ($Prefix) {
        $allNs = $allNs | Where-Object { $_ -like "$Prefix*" }
    }
    $allNs | ForEach-Object { Write-Output $_ }
}

# ─── 動作：types ───────────────────────────────────────────────────────────

function Get-TypesInNamespace {
    param([string]$Ns)
    if (-not $Ns) {
        Write-Error "'types' 動作需要 -Namespace。"
        exit 1
    }

    $manifest = Resolve-ProjectManifest -Name $Project
    $dirs = Get-PackageCacheDirs -Manifest $manifest
    $safeFile = $Ns.Replace('.', '_') + '.json'
    $found = $false
    $seen = @{}

    foreach ($dir in $dirs) {
        $filePath = Join-Path $dir "types\$safeFile"
        if (-not (Test-Path $filePath)) { continue }
        $found = $true
        $types = Get-Content $filePath -Raw | ConvertFrom-Json
        foreach ($t in $types) {
            if ($seen.ContainsKey($t.fullName)) { continue }
            $seen[$t.fullName] = $true
            Write-Output "$($t.kind) $($t.fullName)$(if ($t.baseType) { " : $($t.baseType)" } else { '' })"
        }
    }

    if (-not $found) {
        Write-Error "找不到命名空間：$Ns"
        exit 1
    }
}

# ─── 動作：members ─────────────────────────────────────────────────────────

function Get-MembersOfType {
    param([string]$FullName)
    if (-not $FullName) {
        Write-Error "'members' 動作需要 -TypeName。"
        exit 1
    }

    $lastDot = $FullName.LastIndexOf('.')
    if ($lastDot -lt 0) {
        Write-Error "-TypeName 必須包含命名空間 (例如：'MyNamespace.MyType')。提供的值：$FullName"
        exit 1
    }

    $ns = $FullName.Substring(0, $lastDot)
    $safeFile = $ns.Replace('.', '_') + '.json'

    $manifest = Resolve-ProjectManifest -Name $Project
    $dirs = Get-PackageCacheDirs -Manifest $manifest

    foreach ($dir in $dirs) {
        $filePath = Join-Path $dir "types\$safeFile"
        if (-not (Test-Path $filePath)) { continue }

        $types = Get-Content $filePath -Raw | ConvertFrom-Json
        $type = $types | Where-Object { $_.fullName -eq $FullName }
        if (-not $type) { continue }

        Write-Output "$($type.kind) $($type.fullName)"
        if ($type.baseType) { Write-Output "  繼承：$($type.baseType)" }
        Write-Output ""
        foreach ($m in $type.members) {
            Write-Output "  [$($m.kind)] $($m.signature)"
        }
        return
    }

    Write-Error "找不到類型：$FullName"
    exit 1
}

# ─── 動作：search ──────────────────────────────────────────────────────────
# 按類型名稱與成員名稱的最佳匹配分數對命名空間進行排名。
# 輸出：已排名的命名空間及其首選匹配類型與 JSON 檔案路徑。
# 代理程式隨後可以讀取 JSON 檔案以智慧化地檢查所有成員。

function Search-WinMd {
    param([string]$SearchQuery, [int]$Max)
    if (-not $SearchQuery) {
        Write-Error "'search' 動作需要 -Query。"
        exit 1
    }

    $manifest = Resolve-ProjectManifest -Name $Project
    $dirs = Get-PackageCacheDirs -Manifest $manifest

    # 收集：namespace -> { bestScore, matchingTypes[], filePath }
    $nsResults = @{}

    foreach ($dir in $dirs) {
        $nsFile = Join-Path $dir 'namespaces.json'
        if (-not (Test-Path $nsFile)) { continue }
        $nsList = Get-Content $nsFile -Raw | ConvertFrom-Json

        foreach ($n in $nsList) {
            $safeFile = $n.Replace('.', '_') + '.json'
            $filePath = Join-Path $dir "types\$safeFile"
            if (-not (Test-Path $filePath)) { continue }

            $types = Get-Content $filePath -Raw | ConvertFrom-Json
            foreach ($t in $types) {
                $typeScore = Get-MatchScore -Name $t.name -FullName $t.fullName -Query $SearchQuery

                # 同時搜尋成員名稱是否有匹配項
                $bestMemberScore = 0
                $matchingMember = $null
                if ($t.members) {
                    foreach ($m in $t.members) {
                        $memberName = $m.name
                        $mScore = Get-MatchScore -Name $memberName -FullName "$($t.fullName).$memberName" -Query $SearchQuery
                        if ($mScore -gt $bestMemberScore) {
                            $bestMemberScore = $mScore
                            $matchingMember = $m.signature
                        }
                    }
                }

                $score = [Math]::Max($typeScore, $bestMemberScore)
                if ($score -le 0) { continue }

                if (-not $nsResults.ContainsKey($n)) {
                    $nsResults[$n] = @{ BestScore = 0; Types = @(); FilePaths = @() }
                }
                $entry = $nsResults[$n]
                if ($score -gt $entry.BestScore) { $entry.BestScore = $score }
                if ($entry.FilePaths -notcontains $filePath) {
                    $entry.FilePaths += $filePath
                }

                if ($typeScore -ge $bestMemberScore) {
                    $entry.Types += @{ Text = "$($t.kind) $($t.fullName) [$typeScore]"; Score = $typeScore }
                } else {
                    $entry.Types += @{ Text = "$($t.kind) $($t.fullName) -> $matchingMember [$bestMemberScore]"; Score = $bestMemberScore }
                }
            }
        }
    }

    if ($nsResults.Count -eq 0) {
        Write-Output "找不到關於此項目的結果：$SearchQuery"
        return
    }

    $ranked = $nsResults.GetEnumerator() |
        Sort-Object { $_.Value.BestScore } -Descending |
        Select-Object -First $Max

    foreach ($r in $ranked) {
        $ns = $r.Key
        $info = $r.Value
        Write-Output "[$($info.BestScore)] $ns"
        foreach ($fp in $info.FilePaths) {
            Write-Output "    檔案：$fp"
        }
        # 顯示此命名空間中得分前 5 高的匹配類型
        $info.Types | Sort-Object { $_.Score } -Descending |
            Select-Object -First 5 |
            ForEach-Object { Write-Output "    $($_.Text)" }
        Write-Output ""
    }
}

# ─── 搜尋評分 ──────────────────────────────────────────────────────────
# 針對類型名稱的簡單排名評分。分數越高代表越匹配。
#   100 = 完全匹配    80 = 開頭匹配    60 = 子字串匹配
#    50 = PascalCase     40 = 多關鍵字匹配   20 = 模糊子序列匹配

function Get-MatchScore {
    param([string]$Name, [string]$FullName, [string]$Query)

    $q = $Query.Trim()
    if (-not $q) { return 0 }

    if ($Name -eq $q) { return 100 }
    if ($Name -like "$q*") { return 80 }
    if ($Name -like "*$q*" -or $FullName -like "*$q*") { return 60 }

    $initials = ($Name.ToCharArray() | Where-Object { [char]::IsUpper($_) }) -join ''
    if ($initials.Length -ge 2 -and $initials -like "*$q*") { return 50 }

    $words = $q -split '\s+' | Where-Object { $_.Length -gt 0 }
    if ($words.Count -gt 1) {
        $allFound = $true
        foreach ($w in $words) {
            if ($Name -notlike "*$w*" -and $FullName -notlike "*$w*") {
                $allFound = $false
                break
            }
        }
        if ($allFound) { return 40 }
    }

    if (Test-FuzzySubsequence -Text $Name -Pattern $q) { return 20 }

    return 0
}

function Test-FuzzySubsequence {
    param([string]$Text, [string]$Pattern)
    $ti = 0
    $tLower = $Text.ToLowerInvariant()
    $pLower = $Pattern.ToLowerInvariant()
    foreach ($ch in $pLower.ToCharArray()) {
        $idx = $tLower.IndexOf($ch, $ti)
        if ($idx -lt 0) { return $false }
        $ti = $idx + 1
    }
    return $true
}

# ─── 動作：enums ───────────────────────────────────────────────────────────

function Get-EnumValues {
    param([string]$FullName)
    if (-not $FullName) {
        Write-Error "'enums' 動作需要 -TypeName。"
        exit 1
    }

    $lastDot = $FullName.LastIndexOf('.')
    if ($lastDot -lt 1) {
        Write-Error "-TypeName 必須是包含命名空間的完整限定類型名稱，例如 'Namespace.TypeName'。提供的值：$FullName"
        exit 1
    }

    $ns = $FullName.Substring(0, $lastDot)
    $safeFile = $ns.Replace('.', '_') + '.json'

    $manifest = Resolve-ProjectManifest -Name $Project
    $dirs = Get-PackageCacheDirs -Manifest $manifest

    foreach ($dir in $dirs) {
        $filePath = Join-Path $dir "types\$safeFile"
        if (-not (Test-Path $filePath)) { continue }

        $types = Get-Content $filePath -Raw | ConvertFrom-Json
        $type = $types | Where-Object { $_.fullName -eq $FullName }
        if (-not $type) { continue }

        if ($type.kind -ne 'Enum') {
            Write-Error "$FullName 不是一個列舉 (Enum) (種類：$($type.kind))"
            exit 1
        }
        Write-Output "列舉 (Enum) $($type.fullName)"
        if ($type.enumValues) {
            $type.enumValues | ForEach-Object { Write-Output "  $_" }
        } else {
            Write-Output "  (無數值)"
        }
        return
    }

    Write-Error "找不到類型：$FullName"
    exit 1
}

# ─── 分送 (Dispatch) ─────────────────────────────────────────────────────────────────

switch ($Action) {
    'projects'   { Show-Projects }
    'packages'   { Show-Packages }
    'stats'      { Show-Stats }
    'namespaces' { Get-Namespaces -Prefix $Filter }
    'types'      { Get-TypesInNamespace -Ns $Namespace }
    'members'    { Get-MembersOfType -FullName $TypeName }
    'search'     { Search-WinMd -SearchQuery $Query -Max $MaxResults }
    'enums'      { Get-EnumValues -FullName $TypeName }
}
