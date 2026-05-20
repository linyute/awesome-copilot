param (
    [Parameter(Mandatory=$true)]
    [string]$InputPath,

    [string]$Output,

    [string]$Include,

    [string]$Exclude
)

# 可用欄位
$ValidFields = @("timestamp", "app", "level", "endpoint", "contextPath", "event", "user", "class", "function", "rowId", "body")

# 檢查欄位是否有效的函式
function Test-ValidField {
    param([string]$Field)
    return $ValidFields -contains $Field
}

# 驗證 -Include 和 -Exclude 不同時使用
if ($Include -and $Exclude) {
    Write-Error "錯誤：-Include 和 -Exclude 不能同時使用。"
    exit 1
}

# 初始化欄位變數
$IncludeFields = $null
$ExcludeFields = $null

# 驗證 Include/Exclude 中提供的欄位
if ($Include) {
    $IncludeFields = $Include -split "," | ForEach-Object { $_.Trim() }
    foreach ($field in $IncludeFields) {
        if (-not (Test-ValidField $field)) {
            Write-Error "錯誤：無效的欄位 '$field'。可用欄位：$($ValidFields -join ', ')"
            exit 1
        }
    }
}

if ($Exclude) {
    $ExcludeFields = $Exclude -split "," | ForEach-Object { $_.Trim() }
    foreach ($field in $ExcludeFields) {
        if (-not (Test-ValidField $field)) {
            Write-Error "錯誤：無效的欄位 '$field'。可用欄位：$($ValidFields -join ', ')"
            exit 1
        }
    }
}

# 檢查輸入檔案是否存在
if (-not (Test-Path $InputPath)) {
    Write-Error "錯誤：檔案 $InputPath 不存在。"
    exit 1
}

# 讀取檔案並正規化換行符號
# 將原始行組成紀錄項目，每個新項目皆以時間戳記開始。
$raw = Get-Content -Path $InputPath -Raw
$raw = $raw -replace "`r`n","`n" -replace "`r","`n"
$lines = $raw -split "`n"

$entryTexts = @()
$buffer = ""
$skippedLines = 0

foreach ($line in $lines) {
    if ($line -eq $null) { continue }
    if ($line.Trim().Length -eq 0) { continue }

    if ($line -match '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}') {
        if ($buffer -ne "") { $entryTexts += $buffer }
        $buffer = $line
    } else {
        # 連續行：如果有當前緩衝區則附加，否則跳過
        if ($buffer -eq "") {
            $skippedLines++
            continue
        } else {
            $buffer += "`n" + $line
        }
    }
}

if ($buffer -ne "") { $entryTexts += $buffer }

$entries = @()
$processed = 0
$skippedMalformed = 0

foreach ($entryText in $entryTexts) {
    $parts = $entryText -split '\|'
    if ($parts.Count -ge 12) {
        # 僅修剪前 11 個欄位；保留 body (可能包含管線符號或換行符號)
        for ($i=0; $i -le 10; $i++) { $parts[$i] = $parts[$i].Trim() }

        $body = ($parts[11..($parts.Count - 1)] -join '|')

        $entry = @{
            timestamp   = $parts[0]
            app         = $parts[1]
            level       = $parts[2]
            endpoint    = $parts[4]
            contextPath = $parts[5]
            event       = $parts[6]
            user        = $parts[7]
            class       = $parts[8]
            function    = $parts[9]
            rowId       = $parts[10]
            body        = $body
        }

        # 套用包含/排除過濾器
        if ($IncludeFields -and $IncludeFields.Count -gt 0) {
            $filteredEntry = @{}
            foreach ($field in $IncludeFields) {
                if ($entry.ContainsKey($field)) {
                    $filteredEntry[$field] = $entry[$field]
                } else {
                    $filteredEntry[$field] = $null
                }
            }
            $entry = $filteredEntry
        }
        elseif ($ExcludeFields -and $ExcludeFields.Count -gt 0) {
            foreach ($field in $ExcludeFields) {
                if ($entry.ContainsKey($field)) {
                    $entry.PSObject.Properties.Remove($field)
                }
            }
        }

        $entries += $entry
        $processed++
    } else {
        $skippedMalformed++
    }
}

$skipped = $skippedLines + $skippedMalformed

# 轉換為 JSON (壓縮格式)
$json = $entries | ConvertTo-Json -Depth 10 -Compress

# 輸出結果
if ($Output) {
    Set-Content -Path $Output -Value $json -Encoding UTF8
    Write-Host "輸出已寫入至 $Output"
} else {
    $json
}

Write-Host "已處理：$processed 條項目，已跳過：$skipped 條項目"
