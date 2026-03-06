---
applyTo: '**/*.ps1,**/*.psm1'
description: '基於 Microsoft 指南的 PowerShell Cmdlet 和指令碼最佳實務'
---

# PowerShell Cmdlet 開發指南

本指南提供 PowerShell 特定的指示，以協助 GitHub Copilot 產生慣用、安全且可維護的指令碼。它符合 Microsoft 的 PowerShell Cmdlet 開發指南。

## 命名慣例

- **動詞-名詞格式：**
  - 使用經核准的 PowerShell 動詞 (Get-Verb)
  - 使用單數名詞
  - 動詞和名詞都使用 PascalCase
  - 避免特殊字元和空格

- **參數名稱：**
  - 使用 PascalCase
  - 選擇清晰、描述性的名稱
  - 除非總是多個，否則使用單數形式
  - 遵循 PowerShell 標準名稱

- **變數名稱：**
  - 公用變數使用 PascalCase
  - 私有變數使用 camelCase
  - 避免縮寫
  - 使用有意義的名稱

- **避免別名：**
  - 使用完整的 Cmdlet 名稱
  - 避免在指令碼中使用別名 (例如，使用 Get-ChildItem 而不是 gci)
  - 記錄任何自訂別名
  - 使用完整的參數名稱

### 範例

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
        # Logic here
    }
}
```

## 參數設計

- **標準參數：**
  - 使用常見的參數名稱 (`Path`、`Name`、`Force`)
  - 遵循內建 Cmdlet 慣例
  - 為專門術語使用別名
  - 記錄參數用途

- **參數名稱：**
  - 除非總是多個，否則使用單數形式
  - 選擇清晰、描述性的名稱
  - 遵循 PowerShell 慣例
  - 使用 PascalCase 格式

- **類型選擇：**
  - 使用常見的 .NET 類型
  - 實作適當的驗證
  - 對於有限選項，請考慮使用 ValidateSet
  - 盡可能啟用 Tab 鍵自動完成

- **Switch 參數：**
  - 布林旗標使用 [switch]
  - 避免 $true/$false 參數
  - 忽略時預設為 $false
  - 使用清晰的動作名稱

### 範例

```powershell
function Set-ResourceConfiguration {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter()]
        [ValidateSet('Dev', 'Test', 'Prod')]
        [string]$Environment = 'Dev',

        [Parameter()]
        [switch]$Force,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [string[]]$Tags
    )

    process {
        # Logic here
    }
}
```

## 管道和輸出

- **管道輸入：**
  - 對於直接物件輸入，請使用 `ValueFromPipeline`
  - 對於屬性映射，請使用 `ValueFromPipelineByPropertyName`
  - 實作 Begin/Process/End 區塊以處理管道
  - 記錄管道輸入要求

- **輸出物件：**
  - 傳回豐富的物件，而不是格式化的文字
  - 使用 PSCustomObject 處理結構化資料
  - 避免使用 Write-Host 輸出資料
  - 啟用下游 Cmdlet 處理

- **管道串流：**
  - 一次輸出一個物件
  - 使用 process 區塊進行串流
  - 避免收集大型陣列
  - 啟用即時處理

- **PassThru 模式：**
  - 動作 Cmdlet 預設為無輸出
  - 實作 `-PassThru` switch 以傳回物件
  - 使用 `-PassThru` 傳回修改/建立的物件
  - 使用 verbose/warning 進行狀態更新

### 範例

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
        Write-Verbose 'Starting resource status update process'
        $timestamp = Get-Date
    }

    process {
        # Process each resource individually
        Write-Verbose "Processing resource: $Name"

        $resource = [PSCustomObject]@{
            Name        = $Name
            Status      = $Status
            LastUpdated = $timestamp
            UpdatedBy   = $env:USERNAME
        }

        # Only output if PassThru is specified
        if ($PassThru.IsPresent) {
            Write-Output $resource
        }
    }

    end {
        Write-Verbose 'Resource status update process completed'
    }
}
```

## 錯誤處理和安全性

- **ShouldProcess 實作：**
  - 使用 `[CmdletBinding(SupportsShouldProcess = $true)]`
  - 設定適當的 `ConfirmImpact` 等級
  - 呼叫 `$PSCmdlet.ShouldProcess()` 進行系統變更
  - 使用 `ShouldContinue()` 進行額外確認

- **訊息串流：**
  - `Write-Verbose` 搭配 `-Verbose` 顯示操作詳細資訊
  - `Write-Warning` 顯示警告條件
  - `Write-Error` 顯示非終止錯誤
  - `throw` 顯示終止錯誤
  - 除了使用者介面文字外，避免使用 `Write-Host`

- **錯誤處理模式：**
  - 使用 try/catch 區塊進行錯誤管理
  - 設定適當的 ErrorAction 偏好設定
  - 傳回有意義的錯誤訊息
  - 需要時使用 ErrorVariable
  - 包含適當的終止與非終止錯誤處理
  - 在具有 `[CmdletBinding()]` 的進階函式中，優先使用 `$PSCmdlet.WriteError()` 而非 `Write-Error`
  - 在具有 `[CmdletBinding()]` 的進階函式中，優先使用 `$PSCmdlet.ThrowTerminatingError()` 而非 `throw`
  - 建構具有類別、目標和例外狀況詳細資訊的適當 ErrorRecord 物件

- **非互動式設計：**
  - 透過參數接受輸入
  - 在指令碼中避免 `Read-Host`
  - 支援自動化情境
  - 記錄所有必要的輸入

### 範例

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
        Write-Verbose 'Starting user account removal process'
        $ErrorActionPreference = 'Stop'
    }

    process {
        try {
            # Validation
            if (-not (Test-UserExists -Username $Username)) {
                $errorRecord = [System.Management.Automation.ErrorRecord]::new(
                    [System.Exception]::new("User account '$Username' not found"),
                    'UserNotFound',
                    [System.Management.Automation.ErrorCategory]::ObjectNotFound,
                    $Username
                )
                $PSCmdlet.WriteError($errorRecord)
                return
            }

            # Confirmation
            $shouldProcessMessage = "Remove user account '$Username'"
            if ($Force -or $PSCmdlet.ShouldProcess($Username, $shouldProcessMessage)) {
                Write-Verbose "Removing user account: $Username"

                # Main operation
                Remove-ADUser -Identity $Username -ErrorAction Stop
                Write-Warning "User account '$Username' has been removed"
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
        Write-Verbose 'User account removal process completed'
    }
}
```

## 文件和樣式

- **基於註解的說明：** 為任何公開函式或 Cmdlet 包含基於註解的說明。在函式內部，新增一個 `<# ... #>` 說明註解，至少包含：
  - `.SYNOPSIS` 簡要說明
  - `.DESCRIPTION` 詳細解釋
  - `.EXAMPLE` 實際使用範例
  - `.PARAMETER` 參數說明
  - `.OUTPUTS` 傳回的輸出類型
  - `.NOTES` 附加資訊

- **一致的格式：**
  - 遵循一致的 PowerShell 樣式
  - 使用適當的縮排 (建議 4 個空格)
  - 開頭大括號與陳述式在同一行
  - 結尾大括號在新行
  - 管道運算子後使用換行符
  - 函式和參數名稱使用 PascalCase
  - 避免不必要的空白

- **管道支援：**
  - 為管道函式實作 Begin/Process/End 區塊
  - 適當時使用 ValueFromPipeline
  - 支援按屬性名稱的管道輸入
  - 傳回適當的物件，而不是格式化的文字

- **避免別名：** 使用完整的 Cmdlet 名稱和參數
  - 避免在指令碼中使用別名 (例如，使用 Get-ChildItem 而不是 gci)；別名適用於互動式 shell 使用。
  - 使用 `Where-Object` 而不是 `?` 或 `where`
  - 使用 `ForEach-Object` 而不是 `%`
  - 使用 `Get-ChildItem` 而不是 `ls` 或 `dir`

## 完整範例：端對端 Cmdlet 模式

```powershell
function New-Resource {
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    param(
        [Parameter(Mandatory = $true,
            ValueFromPipeline = $true,
            ValueFromPipelineByPropertyName = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$Name,

        [Parameter()]
        [ValidateSet('Development', 'Production')]
        [string]$Environment = 'Development'
    )

    begin {
        Write-Verbose 'Starting resource creation process'
    }

    process {
        try {
            if ($PSCmdlet.ShouldProcess($Name, 'Create new resource')) {
                # Resource creation logic here
                Write-Output ([PSCustomObject]@{
                        Name        = $Name
                        Environment = $Environment
                        Created     = Get-Date
                    })
            }
        } catch {
            $errorRecord = [System.Management.Automation.ErrorRecord]::new(
                $_.Exception,
                'ResourceCreationFailed',
                [System.Management.Automation.ErrorCategory]::NotSpecified,
                $Name
            )
            $PSCmdlet.ThrowTerminatingError($errorRecord)
        }
    }

    end {
        Write-Verbose 'Completed resource creation process'
    }
}
```
