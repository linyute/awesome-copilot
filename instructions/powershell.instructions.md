---
applyTo: '**/*.ps1,**/*.psm1'
description: '基於 Microsoft 指南的 PowerShell Cmdlet 與指令碼撰寫最佳實務'
---

# PowerShell Cmdlet 開發準則

本指南提供 PowerShell 專屬指令，協助 GitHub Copilot 生成慣用、安全且可維護的指令碼。內容與 Microsoft 的 PowerShell Cmdlet 開發準則一致。

## 命名慣例

- **動詞-名詞格式：**
  - 使用已核准的 PowerShell 動詞 (Get-Verb)
  - 使用單數名詞
  - 動詞與名詞皆使用 PascalCase
  - 避免特殊字元與空格

- **參數名稱：**
  - 使用 PascalCase
  - 選擇清晰、描述性的名稱
  - 除非總是以多數形式存在，否則請使用單數形式
  - 遵循 PowerShell 標準名稱

- **變數名稱：**
  - 公開變數使用 PascalCase
  - 私有變數使用 camelCase
  - 避免縮寫
  - 使用具意義的名稱

- **避免使用別名：**
  - 使用完整的 Cmdlet 名稱
  - 在指令碼中避免使用別名 (例如使用 `Get-ChildItem` 代替 `gci`)
  - 紀錄任何自訂別名
  - 使用完整參數名稱

### 範例 - 命名慣例

```powershell
function Get-UserProfile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Username,

        [Parameter()]
        [ValidateSet('Basic', 'Detailed')]
        [string]$ProfileType = 'Basic'
    )

    process {
        $outputString = "正在搜尋: '$($Username)'"
        Write-Verbose -Message $outputString
        Write-Verbose -Message "設定檔型別: $ProfileType"
        # 此處為邏輯
    }
}
```

## 參數設計

- **標準參數：**
  - 使用通用參數名稱 (`Path`, `Name`, `Force`)
  - 遵循內建 Cmdlet 慣例
  - 針對專業術語使用別名
  - 紀錄參數用途

- **參數名稱：**
  - 除非總是以多數形式存在，否則請使用單數形式
  - 選擇清晰、描述性的名稱
  - 遵循 PowerShell 慣例
  - 使用 PascalCase 格式化

- **型別選擇：**
  - 使用通用的 .NET 型別
  - 實作適當的驗證
  - 針對有限選項考慮使用 ValidateSet
  - 儘可能啟用 Tab 鍵完成

- **切換參數 (Switch Parameters)：**
  - **永遠** 對布林旗標使用 `[switch]`，絕對不要使用 `[bool]`
  - **絕對不要** 使用 `[bool]$Parameter` 或指派預設值
  - 切換參數在省略時預設為 `$false`
  - 使用清晰、以動作為導向的名稱
  - 使用 `.IsPresent` 測試是否存在
  - 在參數屬性中使用 `$true`/`$false` (例如 `Mandatory = $true`) 是可以接受的

### 範例 - 參數設計

```powershell
function Set-ResourceConfiguration {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter()]
        [ValidateSet('Dev', 'Test', 'Prod')]
        [string]$Environment = 'Dev',

        # ✔️ 正確：使用 `[switch]` 且無預設值
        [Parameter()]
        [switch]$Force,

        # ❌ 錯誤：顯示錯誤的預設指派，儘管語法正確 (需要 `[switch]` 轉型)
        [Parameter()]
        [switch]$Quiet = [switch]$true,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [string[]]$Tags
    )

    process {
        # 使用 .IsPresent 檢查切換狀態
        if ($Quiet.IsPresent) {
            Write-Verbose "已啟用安靜模式"
        }
    }
}
```

## 管線與輸出

- **管線輸入：**
  - 使用 `ValueFromPipeline` 進行直接物件輸入
  - 使用 `ValueFromPipelineByPropertyName` 進行屬性映射
  - 實作 Begin/Process/End 區塊以處理管線
  - 紀錄管線輸入需求

- **輸出物件：**
  - 回傳豐富物件，而非格式化文字
  - 使用 PSCustomObject 處理結構化資料
  - 避免將 `Write-Host` 用於資料輸出
  - 啟用下游 Cmdlet 處理

- **管線串流：**
  - 一次輸出一個物件
  - 使用 Process 區塊進行串流
  - 避免收集大型陣列
  - 啟用立即處理

- **PassThru 模式：**
  - 動作型 Cmdlet 預設不輸出
  - 實作 `-PassThru` 切換以回傳物件
  - 以 `-PassThru` 回傳修改/建立的物件
  - 使用 verbose/warning 進行狀態更新

### 範例 - 管線與輸出

```powershell
function Update-ResourceStatus {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline, ValueFromPipelineByPropertyName)]
        [string]$Name,

        [Parameter(Mandatory)]
        [ValidateSet('Active', 'Inactive', 'Maintenance')]
        [string]$Status,

        [Parameter()]
        [switch]$PassThru
    )

    begin {
        Write-Verbose '開始資源狀態更新程序'
        $timestamp = Get-Date
    }

    process {
        # 逐一處理每個資源
        Write-Verbose "正在處理資源: $Name"

        $resource = [PSCustomObject]@{
            Name        = $Name
            Status      = $Status
            LastUpdated = $timestamp
            UpdatedBy   = "$($env:USERNAME)"
        }

        # 僅在指定 PassThru 時輸出
        if ($PassThru.IsPresent) {
            Write-Output $resource
        }
    }

    end {
        Write-Verbose '資源狀態更新程序完成'
    }
}
```

## 錯誤處理與安全性

- **ShouldProcess 實作：**
  - 使用 `[CmdletBinding(SupportsShouldProcess = $true)]`
  - 設定適當的 `ConfirmImpact` 層級
  - 在變更動作附近呼叫 `$PSCmdlet.ShouldProcess()`
  - 針對額外確認使用 `$PSCmdlet.ShouldContinue()`

- **訊息串流：**
  - `Write-Verbose` 用於帶有 `-Verbose` 的操作細節
  - `Write-Warning` 用於警告狀況
  - `Write-Error` 用於非終止錯誤
  - `throw` 用於終止錯誤
  - 除使用者介面文字外，避免使用 `Write-Host`

- **錯誤處理模式：**
  - 使用 try/catch 區塊管理錯誤
  - 設定適當的 ErrorAction 偏好
  - 回傳具意義的錯誤訊息
  - 在需要時使用 ErrorVariable
  - 包含適當的終止與非終止錯誤處理
  - 在具有 `[CmdletBinding()]` 的進階函式中，優先使用 `$PSCmdlet.WriteError()` 取代 `Write-Error`
  - 在具有 `[CmdletBinding()]` 的進階函式中，優先使用 `$PSCmdlet.ThrowTerminatingError()` 取代 `throw`
  - 使用類別、目標與異常詳細資料建構適當的 ErrorRecord 物件

- **非互動式設計：**
  - 透過參數接受輸入
  - 在指令碼中避免 `Read-Host`
  - 支援自動化情境
  - 紀錄所有必要輸入

### 範例 - 錯誤處理與安全性

```powershell
function Remove-CacheFiles {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    try {
        $files = Get-ChildItem -Path $Path -Filter "*.cache" -ErrorAction Stop
        
        # 示範 WhatIf 支援
        if ($PSCmdlet.ShouldProcess($Path, '移除快取檔案')) {
            $files | Remove-Item -Force -ErrorAction Stop
            Write-Verbose "已從 $Path 移除 $($files.Count) 個快取檔案"
        }
    } catch {
        $errorRecord = [System.Management.Automation.ErrorRecord]::new(
            $_.Exception,
            'RemovalFailed',
            [System.Management.Automation.ErrorCategory]::NotSpecified,
            $Path
        )
        $PSCmdlet.WriteError($errorRecord)
    }
}
```

## 文件編寫與風格

- **註解式說明 (Comment-Based Help)：** 為任何公開函式或 Cmdlet 包含註解式說明。在函式內，新增一個 `<# ... #>` 說明註解，至少包含：
  - `.SYNOPSIS` 簡介
  - `.DESCRIPTION` 詳細解釋
  - `.EXAMPLE` 實際使用範例
  - `.PARAMETER` 參數說明
  - `.OUTPUTS` 回傳的輸出型別
  - `.NOTES` 額外資訊

- **一致的格式化：**
  - 遵循一致的 PowerShell 風格
  - 使用正確的縮排 (建議 4 個空格)
  - 大括號與陳述式同行
  - 大括號閉合於新行
  - 管線運算子後換行
  - 函式與參數名稱使用 PascalCase
  - 避免不必要的空白字元

- **管線支援：**
  - 為管線函式實作 Begin/Process/End 區塊
  - 在適當時使用 ValueFromPipeline
  - 支援透過屬性名稱輸入管線
  - 回傳正確的物件，而非格式化文字

- **避免使用別名：** 使用完整的 Cmdlet 名稱與參數
  - 在指令碼中避免使用別名 (例如使用 `Get-ChildItem` 代替 `gci`)；互動式 Shell 則可接受。
  - 使用 `Where-Object` 代替 `?` 或 `where`
  - 使用 `ForEach-Object` 代替 `%`
  - 使用 `Get-ChildItem` 代替 `ls` 或 `dir`

---

## 完整範例：端對端 Cmdlet 模式

```powershell
function Remove-UserAccount {
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [ValidateNotNullOrEmpty()]
        [string]$Username,

        [Parameter()]
        [switch]$Force
    )

    begin {
        Write-Verbose '開始使用者帳戶移除程序'
        $currentErrorActionValue = $ErrorActionPreference
        $ErrorActionPreference = 'Stop'
    }

    process {
        try {
            # 驗證
            if (-not (Test-UserExists -Username $Username)) {
                $errorRecord = [System.Management.Automation.ErrorRecord]::new(
                    [System.Exception]::new("找不到使用者帳戶 '$Username'"),
                    'UserNotFound',
                    [System.Management.Automation.ErrorCategory]::ObjectNotFound,
                    $Username
                )
                $PSCmdlet.WriteError($errorRecord)
                return
            }

            # ShouldProcess 啟用 -WhatIf 與 -Confirm 支援
            if ($PSCmdlet.ShouldProcess($Username, "移除使用者帳戶")) {
                # ShouldContinue 為高影響操作提供額外的確認提示
                # 若指定 -Force，此提示會被略過
                if ($Force -or $PSCmdlet.ShouldContinue("你確定要移除 '$Username' 嗎?", "確認移除")) {
                    Write-Verbose "正在移除使用者帳戶: $Username"
                    
                    # 主要操作
                    Remove-ADUser -Identity $Username -ErrorAction Stop
                    Write-Warning "使用者帳戶 '$Username' 已被移除"
                }
            }
        } catch [Microsoft.ActiveDirectory.Management.ADException] {
            $errorRecord = [System.Management.Automation.ErrorRecord]::new(
                $_.Exception,
                'ActiveDirectoryError',
                [System.Management.Automation.ErrorCategory]::NotSpecified,
                $Username
            )
            $PSCmdlet.ThrowTerminatingError($errorRecord)
        } catch {
            $errorRecord = [System.Management.Automation.ErrorRecord]::new(
                $_.Exception,
                'UnexpectedError',
                [System.Management.Automation.ErrorCategory]::NotSpecified,
                $Username
            )
            $PSCmdlet.ThrowTerminatingError($errorRecord)
        }
    }

    end {
        Write-Verbose '使用者帳戶移除程序完成'
        # 將 ErrorActionPreference 設定回原本的值
        $ErrorActionPreference = $currentErrorActionValue
    }
}
```
