[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$PackagePath,
    [string]$ExpectedIdentityName = "",
    [string]$ExpectedPublisher = "",
    [string]$ExpectedDisplayName = "",
    [string]$ExpectedArchitecture = "",
    [switch]$RequireUnsigned
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Resolve-WindowsSdkTool([string]$Name) {
    $sdkRoot = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
    $candidates = @(
        Get-ChildItem -LiteralPath $sdkRoot -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } |
            Sort-Object { [version]$_.Name } -Descending |
            ForEach-Object { Join-Path $_.FullName "x64\$Name" } |
            Where-Object { Test-Path -LiteralPath $_ }
    )
    if (-not $candidates.Count) {
        throw "找不到 $Name。請安裝 Windows 11 SDK。"
    }
    return $candidates[0]
}

$resolvedPackage = (Resolve-Path -LiteralPath $PackagePath).Path
$makeAppx = Resolve-WindowsSdkTool "makeappx.exe"
$verificationRoot = Join-Path $env:TEMP (
    "microsoft-store-publisher\" + [Guid]::NewGuid().ToString("N")
)

New-Item -ItemType Directory -Path $verificationRoot -Force | Out-Null
try {
    & $makeAppx unpack /p $resolvedPackage /d $verificationRoot /o | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "makeappx.exe 執行失敗，結束代碼為 $LASTEXITCODE。"
    }

    $manifestPath = Join-Path $verificationRoot "AppxManifest.xml"
    if (-not (Test-Path -LiteralPath $manifestPath)) {
        throw "解開的套件不含 AppxManifest.xml。"
    }

    [xml]$manifest = Get-Content -LiteralPath $manifestPath -Raw
    $namespaces = [Xml.XmlNamespaceManager]::new($manifest.NameTable)
    $namespaces.AddNamespace(
        "f",
        "http://schemas.microsoft.com/appx/manifest/foundation/windows10"
    )
    $namespaces.AddNamespace(
        "uap",
        "http://schemas.microsoft.com/appx/manifest/uap/windows10"
    )
    $namespaces.AddNamespace(
        "uap10",
        "http://schemas.microsoft.com/appx/manifest/uap/windows10/10"
    )
    $namespaces.AddNamespace(
        "rescap",
        "http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
    )

    $identity = $manifest.SelectSingleNode("/f:Package/f:Identity", $namespaces)
    $properties = $manifest.SelectSingleNode("/f:Package/f:Properties", $namespaces)
    $application = $manifest.SelectSingleNode(
        "/f:Package/f:Applications/f:Application",
        $namespaces
    )
    $visualElements = $manifest.SelectSingleNode(
        "/f:Package/f:Applications/f:Application/uap:VisualElements",
        $namespaces
    )
    $targetFamilies = @(
        $manifest.SelectNodes(
            "/f:Package/f:Dependencies/f:TargetDeviceFamily",
            $namespaces
        )
    )
    $capabilities = @(
        $manifest.SelectNodes("/f:Package/f:Capabilities/*", $namespaces) |
            ForEach-Object { $_.Name }
    )

    if (-not $identity -or -not $properties -or -not $application) {
        throw "manifest 缺少 identity、properties 或 application 資料。"
    }

    $displayName = [string]$properties.DisplayName
    $visualDisplayName = if ($visualElements) {
        [string]$visualElements.DisplayName
    } else {
        ""
    }
    $signature = Get-AuthenticodeSignature -LiteralPath $resolvedPackage
    $errors = [Collections.Generic.List[string]]::new()

    if ($ExpectedIdentityName -and $identity.Name -ne $ExpectedIdentityName) {
        $errors.Add(
            "Identity 名稱 '$($identity.Name)' 與 '$ExpectedIdentityName' 不符。"
        )
    }
    if ($ExpectedPublisher -and $identity.Publisher -ne $ExpectedPublisher) {
        $errors.Add(
            "Publisher '$($identity.Publisher)' 與 '$ExpectedPublisher' 不符。"
        )
    }
    if ($ExpectedDisplayName -and $displayName -ne $ExpectedDisplayName) {
        $errors.Add(
            "套件顯示名稱 '$displayName' 與 '$ExpectedDisplayName' 不符。"
        )
    }
    if (
        $ExpectedDisplayName -and
        $visualDisplayName -and
        $visualDisplayName -ne $ExpectedDisplayName
    ) {
        $errors.Add(
            "視覺顯示名稱 '$visualDisplayName' 與 '$ExpectedDisplayName' 不符。"
        )
    }
    if (
        $ExpectedArchitecture -and
        $identity.ProcessorArchitecture -ne $ExpectedArchitecture
    ) {
        $errors.Add(
            "架構 '$($identity.ProcessorArchitecture)' 與 '$ExpectedArchitecture' 不符。"
        )
    }
    if ($RequireUnsigned -and $signature.Status -ne "NotSigned") {
        $errors.Add(
            "商店提交套件必須未簽章，但簽章狀態為 '$($signature.Status)'。"
        )
    }

    $version = [version]$identity.Version
    if ($version.Major -eq 0) {
        $errors.Add("MSIX 版本的第一個組件必須不為零。")
    }
    if ($version.Revision -ne 0) {
        $errors.Add("商店提交時，MSIX 版本的第四個組件必須為 0。")
    }

    $result = [ordered]@{
        package = $resolvedPackage
        packageSha256 = (
            Get-FileHash -LiteralPath $resolvedPackage -Algorithm SHA256
        ).Hash.ToLowerInvariant()
        identityName = [string]$identity.Name
        publisher = [string]$identity.Publisher
        version = [string]$identity.Version
        architecture = [string]$identity.ProcessorArchitecture
        displayName = $displayName
        visualDisplayName = $visualDisplayName
        applicationId = [string]$application.Id
        executable = [string]$application.Executable
        runtimeBehavior = [string]$application.RuntimeBehavior
        trustLevel = [string]$application.TrustLevel
        targetDeviceFamilies = @(
            $targetFamilies | ForEach-Object {
                [ordered]@{
                    name = [string]$_.Name
                    minVersion = [string]$_.MinVersion
                    maxVersionTested = [string]$_.MaxVersionTested
                }
            }
        )
        capabilities = $capabilities
        signatureStatus = [string]$signature.Status
        errors = @($errors)
        passed = $errors.Count -eq 0
    }

    $result | ConvertTo-Json -Depth 8
    if ($errors.Count) {
        throw "MSIX 檢查失敗，共 $($errors.Count) 個錯誤。"
    }
} finally {
    if (Test-Path -LiteralPath $verificationRoot) {
        Remove-Item -LiteralPath $verificationRoot -Recurse -Force
    }
}
