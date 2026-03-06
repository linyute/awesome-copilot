<#
.SYNOPSIS
    為代理程式技能產生或重新整理 WinMD 快取。

.DESCRIPTION
    建構並執行獨立的快取產生器，從專案 NuGet 套件與 Windows SDK 中找到的所有 WinMD Metadata
    匯出為快取的 JSON 檔案。

    快取是以「套件+版本」為基準的：若兩個專案參考了相同版本的同一個套件，
    則 WinMD 資料僅會解析一次並共享。

    支援單一專案或對整個儲存庫進行遞迴掃描。

.PARAMETER ProjectDir
    專案目錄 (包含 .csproj/.vcxproj) 或專案檔案本身的路徑。
    預設為掃描工作區根目錄。

.PARAMETER Scan
    遞迴搜尋 ProjectDir 下的所有 .csproj/.vcxproj 檔案。

.PARAMETER OutputDir
    快取輸出目錄的路徑。預設為 "Generated Files\winmd-cache"。

.EXAMPLE
    .\Update-WinMdCache.ps1
    .\Update-WinMdCache.ps1 -ProjectDir BlankWinUI
    .\Update-WinMdCache.ps1 -Scan -ProjectDir .
    .\Update-WinMdCache.ps1 -ProjectDir "src\MyApp\MyApp.csproj"
#>
[CmdletBinding()]
param(
    [string]$ProjectDir,
    [switch]$Scan,
    [string]$OutputDir = 'Generated Files\winmd-cache'
)

$ErrorActionPreference = 'Stop'

# 慣例：技能位於 .github/skills/winmd-api-search/scripts/
# 因此工作區根目錄位於 $PSScriptRoot 往上 4 層。
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$generatorProj = Join-Path (Join-Path $PSScriptRoot 'cache-generator') 'CacheGenerator.csproj'

# ---------------------------------------------------------------------------
# WinAppSDK 版本偵測 —— 僅查看儲存庫根目錄資料夾 (不進行遞迴)
# ---------------------------------------------------------------------------

function Get-WinAppSdkVersionFromDirectoryPackagesProps {
    <#
    .SYNOPSIS
        從儲存庫根目錄的 Directory.Packages.props (集中式套件管理) 擷取 Microsoft.WindowsAppSDK 版本。
    #>
    param([string]$RepoRoot)
    $propsFile = Join-Path $RepoRoot 'Directory.Packages.props'
    if (-not (Test-Path $propsFile)) { return $null }
    try {
        [xml]$xml = Get-Content $propsFile -Raw
        $node = $xml.SelectNodes('//PackageVersion') |
            Where-Object { $_.Include -eq 'Microsoft.WindowsAppSDK' } |
            Select-Object -First 1
        if ($node) { return $node.Version }
    } catch {
        Write-Verbose "無法解析 $propsFile ：$_"
    }
    return $null
}

function Get-WinAppSdkVersionFromPackagesConfig {
    <#
    .SYNOPSIS
        從儲存庫根目錄的 packages.config 擷取 Microsoft.WindowsAppSDK 版本。
    #>
    param([string]$RepoRoot)
    $configFile = Join-Path $RepoRoot 'packages.config'
    if (-not (Test-Path $configFile)) { return $null }
    try {
        [xml]$xml = Get-Content $configFile -Raw
        $node = $xml.SelectNodes('//package') |
            Where-Object { $_.id -eq 'Microsoft.WindowsAppSDK' } |
            Select-Object -First 1
        if ($node) { return $node.version }
    } catch {
        Write-Verbose "無法解析 $configFile ：$_"
    }
    return $null
}

# 優先嘗試 Directory.Packages.props (CPM)，其次是 packages.config
$winAppSdkVersion = Get-WinAppSdkVersionFromDirectoryPackagesProps -RepoRoot $root
if (-not $winAppSdkVersion) {
    $winAppSdkVersion = Get-WinAppSdkVersionFromPackagesConfig -RepoRoot $root
}
if ($winAppSdkVersion) {
    Write-Host "從儲存庫偵測到 WinAppSDK 版本：$winAppSdkVersion" -ForegroundColor Cyan
} else {
    Write-Host "在儲存庫根目錄找不到 WinAppSDK 版本；將使用最新版本 (Version=*)" -ForegroundColor Yellow
}

# 預設值：若未指定 ProjectDir，則掃描工作區根目錄
if (-not $ProjectDir) {
    $ProjectDir = $root
    $Scan = $true
}

Push-Location $root

try {
    # 偵測已安裝的 .NET SDK —— 需要版本 >= 8.0，優先選擇穩定版而非預覽版
    $dotnetSdks = dotnet --list-sdks 2>$null
    $bestMajor = $dotnetSdks |
        Where-Object { $_ -notmatch 'preview|rc|alpha|beta' } |
        ForEach-Object { if ($_ -match '^(\d+)\.') { [int]$Matches[1] } } |
        Where-Object { $_ -ge 8 } |
        Sort-Object -Descending |
        Select-Object -First 1

    # 若找不到穩定版 SDK，則退而求其次選擇預覽版
    if (-not $bestMajor) {
        $bestMajor = $dotnetSdks |
            ForEach-Object { if ($_ -match '^(\d+)\.') { [int]$Matches[1] } } |
            Where-Object { $_ -ge 8 } |
            Sort-Object -Descending |
            Select-Object -First 1
    }

    if (-not $bestMajor) {
        Write-Error "找不到版本 >= 8.0 的 .NET SDK。請從 https://dotnet.microsoft.com/download 安裝"
        exit 1
    }

    $targetFramework = "net$bestMajor.0"
    Write-Host "正在使用 .NET SDK：$targetFramework" -ForegroundColor Cyan

    # 建構 MSBuild 屬性 —— 偵測到 WinAppSDK 版本時將其傳入
    $sdkVersionProp = ''
    if ($winAppSdkVersion) {
        $sdkVersionProp = "-p:WinAppSdkVersion=$winAppSdkVersion"
    }

    Write-Host "正在建構快取產生器..." -ForegroundColor Cyan
    $restoreArgs = @($generatorProj, "-p:TargetFramework=$targetFramework", '--nologo', '-v', 'q')
    if ($sdkVersionProp) { $restoreArgs += $sdkVersionProp }
    dotnet restore @restoreArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "還原 (Restore) 失敗"
        exit 1
    }
    $buildArgs = @($generatorProj, '-c', 'Release', '--nologo', '-v', 'q', "-p:TargetFramework=$targetFramework", '--no-restore')
    if ($sdkVersionProp) { $buildArgs += $sdkVersionProp }
    dotnet build @buildArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "建構 (Build) 失敗"
        exit 1
    }

    # 直接執行建構出的執行檔 (避免 dotnet run 產生的目標框架不匹配問題)
    $generatorDir = Join-Path $PSScriptRoot 'cache-generator'
    $exePath = Join-Path $generatorDir "bin\Release\$targetFramework\CacheGenerator.exe"
    if (-not (Test-Path $exePath)) {
        # 退而求其次：嘗試使用 dotnet 執行 dll
        $dllPath = Join-Path $generatorDir "bin\Release\$targetFramework\CacheGenerator.dll"
        if (Test-Path $dllPath) {
            $exePath = $null
        } else {
            Write-Error "在以下位置找不到建構的執行檔：$exePath"
            exit 1
        }
    }

    $runArgs = @()
    if ($Scan) {
        $runArgs += '--scan'
    }

    # 透過 Get-AppxPackage 偵測已安裝的 WinAppSDK 執行階段 (WindowsApps
    # 資料夾受到 ACL 限制，因此 C# 無法直接列舉)。
    # WinMD 檔案是與架構無關的 Metadata，因此選擇與目前 OS 匹配的架構
    # 即可確保套件存在。
    $osArch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
    $runtimePkg = Get-AppxPackage -Name 'Microsoft.WindowsAppRuntime.*' -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch 'CBS' -and $_.Architecture -eq $osArch } |
        Sort-Object -Property Version -Descending |
        Select-Object -First 1
    if ($runtimePkg -and $runtimePkg.InstallLocation -and (Test-Path $runtimePkg.InstallLocation)) {
        Write-Host "偵測到 WinAppSDK 執行階段：$($runtimePkg.Name) v$($runtimePkg.Version)" -ForegroundColor Cyan
        $runArgs += '--winappsdk-runtime'
        $runArgs += $runtimePkg.InstallLocation
    }

    $runArgs += $ProjectDir
    $runArgs += $OutputDir

    Write-Host "正在匯出 WinMD 快取..." -ForegroundColor Cyan
    if ($exePath) {
        & $exePath @runArgs
    } else {
        dotnet $dllPath @runArgs
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Error "快取匯出失敗"
        exit 1
    }

    Write-Host "快取已更新至：$OutputDir" -ForegroundColor Green
} finally {
    Pop-Location
}
