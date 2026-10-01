[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$PackagePath,
    [string]$ReportPath = "",
    [string]$ExistingReportPath = "",
    [int]$ReportWaitSeconds = 60
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# WACK 會拒絕不以 .xml 結尾的 -reportoutputpath。它會將 XML 報告
# 寫入指定的路徑，並將對應的 HTML 版本寫入
# %LOCALAPPDATA%\Microsoft\AppCertKit\<xml 基底名稱>.htm。XML 報告
# 為官方結果。僅當不存在 XML 報告時，才會以 HTML 報告作為備援。
$kitDirectory = Join-Path $env:LOCALAPPDATA "Microsoft\AppCertKit"
$htmlExtensions = @(".htm", ".html")
# results.xsl 針對每個 OVERALL_RESULT 值顯示的英文字串。
$resultNames = @{
    PASS = "PASSED"
    FAIL = "FAILED"
    WARNING = "PASSED WITH WARNINGS"
}
$knownResults = @($resultNames.Values) + "INCOMPLETE"

function Resolve-AppCert {
    $candidates = @(
        @(
            (Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\App Certification Kit\appcert.exe"),
            (Join-Path $env:ProgramFiles "Windows Kits\10\App Certification Kit\appcert.exe")
        ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
    )
    if (-not $candidates.Count) {
        throw "找不到 appcert.exe。請安裝 Windows App Certification Kit。"
    }
    return $candidates[0]
}

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )
}

function Read-XmlDocument($Source) {
    $settings = [Xml.XmlReaderSettings]::new()
    $settings.DtdProcessing = [Xml.DtdProcessing]::Ignore
    $settings.XmlResolver = $null
    $reader = [Xml.XmlReader]::Create($Source, $settings)
    try {
        $document = [Xml.XmlDocument]::new()
        $document.Load($reader)
        return $document
    } finally {
        $reader.Dispose()
    }
}

function Get-PackageIdentity([string]$Path) {
    if ([IO.Path]::GetExtension($Path) -notin @(".msix", ".appx")) {
        return $null
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $entry = $archive.GetEntry("AppxManifest.xml")
        if ($null -eq $entry) {
            throw "套件不含 AppxManifest.xml。"
        }
        $stream = $entry.Open()
        try {
            $manifest = Read-XmlDocument $stream
        } finally {
            $stream.Dispose()
        }
    } finally {
        $archive.Dispose()
    }
    $identity = $manifest.DocumentElement.SelectSingleNode(
        "*[local-name()='Identity']"
    )
    if ($null -eq $identity) {
        throw "AppxManifest.xml 不含 Identity 元素。"
    }
    return [pscustomobject]@{
        Name = $identity.GetAttribute("Name")
        Version = $identity.GetAttribute("Version")
    }
}

function Read-WackXmlReport([string]$Path) {
    try {
        $stream = [IO.File]::OpenRead($Path)
        try {
            $document = Read-XmlDocument $stream
        } finally {
            $stream.Dispose()
        }
    } catch {
        return $null
    }
    $root = $document.DocumentElement
    if (
        $null -eq $root -or
        $root.LocalName -ne "REPORT" -or
        -not $root.HasAttribute("OVERALL_RESULT")
    ) {
        return $null
    }

    $rawResult = $root.GetAttribute("OVERALL_RESULT")
    # results.xsl 將不含 VALIDATION_TYPE 的報告視為未完成的
    # 暫時性報告。
    $overallResult = if (-not $root.HasAttribute("VALIDATION_TYPE")) {
        "INCOMPLETE"
    } elseif ($resultNames.ContainsKey($rawResult)) {
        $resultNames[$rawResult]
    } else {
        $rawResult
    }

    $nonPassingTests = @(
        foreach ($test in $root.SelectNodes("REQUIREMENTS/REQUIREMENT/TEST")) {
            $resultNode = $test.SelectSingleNode("RESULT")
            $testResult = if ($null -ne $resultNode) {
                $resultNode.InnerText.Trim()
            } else {
                ""
            }
            if ($testResult -eq "PASS") {
                continue
            }
            [ordered]@{
                requirement = $test.ParentNode.GetAttribute("TITLE")
                test = $test.GetAttribute("NAME")
                result = $testResult
                optional = $test.GetAttribute("OPTIONAL") -eq "TRUE"
                messages = @(
                    foreach ($message in $test.SelectNodes("MESSAGES/MESSAGE")) {
                        $message.GetAttribute("TEXT")
                    }
                )
            }
        }
    )

    return [pscustomobject]@{
        Path = $Path
        OverallResult = $overallResult
        AppName = $root.GetAttribute("APP_NAME")
        AppVersion = $root.GetAttribute("APP_VERSION")
        KitVersion = $root.GetAttribute("VERSION")
        KitIsLatest = $root.GetAttribute("LATEST_VERSION") -ne "FALSE"
        PartialRun = $root.GetAttribute("PARTIAL_RUN") -eq "TRUE"
        ReportTime = $root.GetAttribute("ReportGenerationTime")
        NonPassingTests = $nonPassingTests
    }
}

function Read-WackHtmlReport([string]$Path) {
    try {
        $content = [IO.File]::ReadAllText($Path)
    } catch {
        return $null
    }
    $overall = [regex]::Match(
        $content,
        '(?is)<div[^>]*\bclass="overall"[^>]*>(.*?)</div>'
    )
    if (-not $overall.Success) {
        return $null
    }
    $label = [regex]::Match(
        $overall.Groups[1].Value,
        '(?is)<span[^>]*>(.*?)</span>'
    )
    if (-not $label.Success) {
        return $null
    }
    $text = [regex]::Replace($label.Groups[1].Value, '<[^>]+>', ' ')
    $text = ([Net.WebUtility]::HtmlDecode($text) -replace '\s+', ' ').Trim()
    $overallResult = if ($text -like "Incomplete*") {
        "INCOMPLETE"
    } else {
        $text.ToUpperInvariant()
    }
    $version = [regex]::Match(
        $content,
        '(?is)<dt>\s*App version:\s*</dt>\s*<dd[^>]*>\s*([^<]*?)\s*</dd>'
    )
    return [pscustomobject]@{
        Path = $Path
        Content = $content
        OverallResult = $overallResult
        # 只會認得英文報告，不會認得已當地化的標籤。
        Recognized = $overallResult -in $knownResults
        AppVersion = if ($version.Success) { $version.Groups[1].Value } else { "" }
    }
}

# WACK 會將 ReportGenerationTime 複製到 HTML 報告，藉此將 HTML
# 報告與其來源的 XML 報告對應起來。
function Test-ReportPair($XmlReport, $HtmlReport) {
    return [bool](
        $XmlReport.ReportTime -and
        $HtmlReport.Content.Contains($XmlReport.ReportTime)
    )
}

function Test-NewFile([string]$Path, [datetime]$Since) {
    return (
        (Test-Path -LiteralPath $Path -PathType Leaf) -and
        (Get-Item -LiteralPath $Path).LastWriteTime -ge $Since
    )
}

function Get-NewKitFiles([string[]]$Extensions, [datetime]$Since) {
    if (-not (Test-Path -LiteralPath $kitDirectory -PathType Container)) {
        return
    }
    Get-ChildItem -LiteralPath $kitDirectory -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Extension -in $Extensions -and $_.LastWriteTime -ge $Since
        } |
        Sort-Object LastWriteTime -Descending |
        ForEach-Object { $_.FullName }
}

function Find-WackXmlReport([string]$RequestedPath, [datetime]$Since) {
    $candidates = [Collections.Generic.List[string]]::new()
    if (Test-NewFile $RequestedPath $Since) {
        $candidates.Add($RequestedPath)
    }
    # AppCertKit 中存有許多不相關的 XML 檔案，因此會逐一檢查
    # REPORT 根元素。
    foreach ($path in @(Get-NewKitFiles @(".xml") $Since)) {
        $candidates.Add($path)
    }
    foreach ($candidate in $candidates) {
        $report = Read-WackXmlReport $candidate
        if ($null -ne $report) {
            return $report
        }
    }
    return $null
}

function Find-WackHtmlReport(
    [string]$XmlPath,
    [datetime]$Since,
    $XmlReport,
    [switch]$SearchKitDirectory
) {
    $baseName = [IO.Path]::GetFileNameWithoutExtension($XmlPath)
    $candidates = [Collections.Generic.List[string]]::new()
    foreach ($extension in $htmlExtensions) {
        $paths = @(
            [IO.Path]::ChangeExtension($XmlPath, $extension),
            (Join-Path $kitDirectory ($baseName + $extension))
        )
        foreach ($path in $paths) {
            if (Test-NewFile $path $Since) {
                $candidates.Add($path)
            }
        }
    }
    if ($SearchKitDirectory) {
        foreach ($path in @(Get-NewKitFiles $htmlExtensions $Since)) {
            $candidates.Add($path)
        }
    }
    foreach ($candidate in $candidates) {
        $report = Read-WackHtmlReport $candidate
        if (
            $null -ne $report -and
            ($null -eq $XmlReport -or (Test-ReportPair $XmlReport $report))
        ) {
            return $report
        }
    }
    return $null
}

function Save-Report([string]$Source, [string]$Destination) {
    # 當目的位置已含有相同的報告時，略過複製。這也涵蓋來源與
    # 目的位置為同一個檔案的情況。
    if (
        -not (Test-Path -LiteralPath $Destination -PathType Leaf) -or
        (Get-FileHash -LiteralPath $Source).Hash -ne
            (Get-FileHash -LiteralPath $Destination).Hash
    ) {
        [IO.File]::Copy($Source, $Destination, $true)
    }
    return $Destination
}

$resolvedPackage = (Resolve-Path -LiteralPath $PackagePath).ProviderPath
if (-not $ReportPath) {
    $ReportPath = [IO.Path]::Combine(
        [IO.Path]::GetDirectoryName($resolvedPackage),
        [IO.Path]::GetFileNameWithoutExtension($resolvedPackage) +
            "-WACK-report.xml"
    )
}
# 相對路徑會以目前的 PowerShell 位置為基準解析。
$ReportPath = [IO.Path]::GetFullPath(
    $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath(
        $ReportPath
    )
)
$reportExtension = [IO.Path]::GetExtension($ReportPath).ToLowerInvariant()
if ($reportExtension -ne ".xml" -and $reportExtension -notin $htmlExtensions) {
    throw "ReportPath 必須以 .xml、.htm 或 .html 結尾。"
}
# WACK 一律收到 .xml 路徑。HTML 副本會儲存在其旁邊。
$xmlPath = [IO.Path]::ChangeExtension($ReportPath, ".xml")
$htmlPath = if ($reportExtension -eq ".xml") {
    [IO.Path]::ChangeExtension($ReportPath, ".htm")
} else {
    $ReportPath
}
[void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($ReportPath))

$appCert = $null
$exitCode = $null
$xmlReport = $null
$htmlReport = $null
$warnings = [Collections.Generic.List[string]]::new()
$errors = [Collections.Generic.List[string]]::new()

if ($ExistingReportPath) {
    $existingReport = (Resolve-Path -LiteralPath $ExistingReportPath).ProviderPath
    $existingExtension = [IO.Path]::GetExtension($existingReport).ToLowerInvariant()
    if ($existingExtension -eq ".xml") {
        $xmlReport = Read-WackXmlReport $existingReport
        if ($null -eq $xmlReport) {
            throw "'$existingReport' 不是 WACK XML 報告。"
        }
        $htmlReport = Find-WackHtmlReport $existingReport ([datetime]::MinValue) $xmlReport
    } elseif ($existingExtension -in $htmlExtensions) {
        $htmlReport = Read-WackHtmlReport $existingReport
        if ($null -eq $htmlReport) {
            throw "'$existingReport' 不是 WACK HTML 報告。"
        }
        $siblingXml = [IO.Path]::ChangeExtension($existingReport, ".xml")
        if (Test-Path -LiteralPath $siblingXml -PathType Leaf) {
            $candidate = Read-WackXmlReport $siblingXml
            if ($null -ne $candidate -and (Test-ReportPair $candidate $htmlReport)) {
                $xmlReport = $candidate
            } else {
                $warnings.Add(
                    "已忽略 '$siblingXml'，因為它不是此 HTML 報告對應的 XML 報告。"
                )
            }
        }
    } else {
        throw "ExistingReportPath 必須是 WACK 的 .xml、.htm 或 .html 報告。"
    }
} else {
    if (-not (Test-IsAdministrator)) {
        throw (
            "WACK 命令列執行程式需要已提升權限的 PowerShell 處理序。 " +
            "請要求使用者開啟已提升權限的終端機，再於其中執行此腳本。 " +
            "請勿嘗試核准作業系統的驗證提示。"
        )
    }

    $appCert = Resolve-AppCert
    & $appCert reset | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "appcert.exe reset 執行失敗，結束代碼為 $LASTEXITCODE。"
    }

    # 比此次執行更舊的報告會被忽略。緩衝時間用來容納檔案系統
    # 時間戳記的精度。
    $startedAt = (Get-Date).AddSeconds(-5)
    & $appCert test `
        -appxpackagepath $resolvedPackage `
        -reportoutputpath $xmlPath |
        Out-Host
    $exitCode = $LASTEXITCODE

    # 執行失敗後，只尋找一次報告，而不是等待報告產生。
    $waitSeconds = if ($exitCode -eq 0) { $ReportWaitSeconds } else { 0 }
    $deadline = (Get-Date).AddSeconds($waitSeconds)
    $htmlGraceStarted = $false
    while ($true) {
        # 暫時性報告仍可能被最終報告取代。
        if ($null -eq $xmlReport -or $xmlReport.OverallResult -eq "INCOMPLETE") {
            $latestXmlReport = Find-WackXmlReport $xmlPath $startedAt
            if ($null -ne $latestXmlReport) {
                $xmlReport = $latestXmlReport
            }
        }
        $htmlSearchPath = if ($null -ne $xmlReport) { $xmlReport.Path } else { $xmlPath }
        $htmlReport = Find-WackHtmlReport $htmlSearchPath $startedAt $xmlReport -SearchKitDirectory
        $xmlFinished = $null -ne $xmlReport -and $xmlReport.OverallResult -ne "INCOMPLETE"
        if ($xmlFinished -and $null -ne $htmlReport) {
            break
        }
        if ($xmlFinished -and -not $htmlGraceStarted) {
            # XML 報告決定結果，因此 HTML 報告只有短暫的
            # 寬限期。
            $htmlGraceStarted = $true
            $graceDeadline = (Get-Date).AddSeconds(10)
            if ($graceDeadline -lt $deadline) {
                $deadline = $graceDeadline
            }
        }
        if ((Get-Date) -ge $deadline) {
            break
        }
        Start-Sleep -Seconds 2
    }

    if ($null -eq $xmlReport -and $null -eq $htmlReport) {
        if ($exitCode -ne 0) {
            throw "appcert.exe test 執行失敗，結束代碼為 $exitCode，且未產生任何報告。"
        }
        throw (
            "WACK 回傳成功，但在 '$xmlPath' 或 " +
            "'$kitDirectory' 之下找不到報告。"
        )
    }
    if ($exitCode -ne 0) {
        $errors.Add("appcert.exe test 的結束代碼為 $exitCode。")
    }
}

if ($null -ne $xmlReport) {
    $overallResult = $xmlReport.OverallResult
    $resultSource = "xml"
    $reportAppName = $xmlReport.AppName
    $reportAppVersion = $xmlReport.AppVersion
    $nonPassingTests = @($xmlReport.NonPassingTests)
    if ($xmlReport.PartialRun) {
        $errors.Add("並非所有 WACK 測試都已執行（PARTIAL_RUN 為 TRUE）。")
    }
    if (-not $xmlReport.KitIsLatest) {
        $warnings.Add(
            "WACK $($xmlReport.KitVersion) 不是最新版本，且 WACK 警告 " +
            "商店提交可能會失敗。請更新工具套件並重新執行。"
        )
    }
    if ($null -eq $htmlReport) {
        $warnings.Add(
            "找不到同一次 WACK 執行所產生的 HTML 報告。結果以 XML 報告為準。"
        )
    } elseif ($htmlReport.Recognized -and $htmlReport.OverallResult -ne $overallResult) {
        $errors.Add(
            "XML 報告顯示 $overallResult，但 HTML 報告顯示 " +
            "$($htmlReport.OverallResult)。"
        )
    }
} else {
    $overallResult = $htmlReport.OverallResult
    $resultSource = "html"
    $reportAppName = $null
    $reportAppVersion = $htmlReport.AppVersion
    $nonPassingTests = @()
    $warnings.Add(
        "找不到 XML 報告。結果取自 HTML 報告，且 " +
        "未列出個別測試結果。"
    )
}

if ($overallResult -ne "PASSED") {
    $errors.Add("WACK 總體結果為 '$overallResult'。")
}

$optionalFailures = @($nonPassingTests | Where-Object { $_.optional }).Count
if ($optionalFailures) {
    $warnings.Add(
        "$optionalFailures 個選用測試未通過。選用測試不會 " +
        "阻擋商店上架，但請調查其原因。"
    )
}
$requiredFailures = $nonPassingTests.Count - $optionalFailures
if ($requiredFailures) {
    $warnings.Add(
        "$requiredFailures 個必要測試未通過。請檢視 nonPassingTests。"
    )
}

$packageIdentity = $null
try {
    $packageIdentity = Get-PackageIdentity $resolvedPackage
    if ($null -eq $packageIdentity) {
        $warnings.Add(
            "只有 .msix 和 .appx 套件會與報告比對。請手動 " +
            "核對報告中的應用程式名稱與版本。"
        )
    }
} catch {
    $warnings.Add(
        "無法讀取套件身份，因此報告未與 " +
        "套件比對：$($_.Exception.Message)"
    )
}
if ($null -ne $packageIdentity) {
    if ($reportAppName -and $reportAppName -ne $packageIdentity.Name) {
        $errors.Add(
            "報告對應的是 '$reportAppName'，但套件身份為 " +
            "'$($packageIdentity.Name)'。"
        )
    }
    if (-not $reportAppVersion) {
        $warnings.Add(
            "無法讀取報告中的應用程式版本，因此未與 " +
            "套件版本進行比對。"
        )
    } elseif ($reportAppVersion -ne $packageIdentity.Version) {
        $errors.Add(
            "報告對應的是版本 $reportAppVersion，但套件的 " +
            "版本為 $($packageIdentity.Version)。"
        )
    }
}

$savedXmlReport = if ($null -ne $xmlReport) {
    Save-Report $xmlReport.Path $xmlPath
} else {
    $null
}
$savedHtmlReport = if ($null -ne $htmlReport) {
    Save-Report $htmlReport.Path $htmlPath
} else {
    $null
}
$unsavedPaths = @()
if ($null -eq $savedXmlReport) {
    $unsavedPaths += $xmlPath
}
if ($null -eq $savedHtmlReport) {
    $unsavedPaths += $htmlPath
}
foreach ($unsavedPath in $unsavedPaths) {
    if (Test-Path -LiteralPath $unsavedPath -PathType Leaf) {
        $warnings.Add(
            "'$unsavedPath' 已存在且未被取代，它不屬於 " +
            "此次結果的一部分。"
        )
    }
}

$result = [ordered]@{
    package = $resolvedPackage
    packageSha256 = (
        Get-FileHash -LiteralPath $resolvedPackage -Algorithm SHA256
    ).Hash.ToLowerInvariant()
    packageIdentityName = if ($null -ne $packageIdentity) { $packageIdentity.Name } else { $null }
    packageVersion = if ($null -ne $packageIdentity) { $packageIdentity.Version } else { $null }
    appCert = $appCert
    exitCode = $exitCode
    overallResult = $overallResult
    resultSource = $resultSource
    reportAppName = $reportAppName
    reportAppVersion = $reportAppVersion
    kitVersion = if ($null -ne $xmlReport) { $xmlReport.KitVersion } else { $null }
    reportTime = if ($null -ne $xmlReport) { $xmlReport.ReportTime } else { $null }
    xmlReport = $savedXmlReport
    htmlReport = $savedHtmlReport
    sourceXmlReport = if ($null -ne $xmlReport) { $xmlReport.Path } else { $null }
    sourceHtmlReport = if ($null -ne $htmlReport) { $htmlReport.Path } else { $null }
    nonPassingTests = $nonPassingTests
    warnings = @($warnings)
    errors = @($errors)
    passed = $errors.Count -eq 0
}
$result | ConvertTo-Json -Depth 6

if ($errors.Count) {
    $reviewPath = if ($savedXmlReport) { $savedXmlReport } else { $savedHtmlReport }
    throw "WACK 驗證失敗。$($errors -join ' ') 請檢視 '$reviewPath'。"
}
