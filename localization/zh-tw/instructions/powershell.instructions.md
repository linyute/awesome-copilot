---
applyTo: '**/*.ps1,**/*.psm1'
description: '依據 Microsoft 指南的 PowerShell cmdlet 與指令碼最佳實踐'
---  

# PowerShell Cmdlet 開發指南

本指南提供 PowerShell 專屬指引，協助 GitHub Copilot 產生符合慣例、安全且易維護的指令碼。內容依循 Microsoft PowerShell cmdlet 開發指南。

## 命名慣例

- **動詞-名詞格式：**
  - 使用 PowerShell 核准動詞（Get-Verb）
  - 名詞用單數
  - 動詞與名詞皆用 PascalCase
  - 避免特殊字元與空格

- **參數名稱：**
  - 用 PascalCase
  - 清楚且具描述性
  - 用單數，除非永遠多個
  - 遵循 PowerShell 標準名稱

- **變數名稱：**
  - 公開變數用 PascalCase
  - 私有變數用 camelCase
  - 避免縮寫
  - 命名具意義

- **避免別名：**
  - 用完整 cmdlet 名稱
  - 指令碼勿用別名（如 Get-ChildItem 取代 gci）
  - 自訂別名需註明
  - 用完整參數名稱

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
        # 邏輯
    }
}
```

## 參數設計

- **標準參數：**
  - 用常見參數名稱（`Path`、`Name`、`Force`）
  - 遵循內建 cmdlet 慣例
  - 專有名詞可用別名
  - 參數用途需註明

- **參數名稱：**
  - 用單數，除非永遠多個
  - 清楚且具描述性
  - 遵循 PowerShell 慣例
  - 用 PascalCase

- **型別選擇：**
  - 用常見 .NET 型別
  - 適當驗證
  - 有限選項用 ValidateSet
  - 優先支援 tab 完成

- **Switch 參數：**
  - 布林旗標用 [switch]
  - 避免 $true/$false 參數
  - 預設省略時為 $false
  - 行動名稱需清楚

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
        # 邏輯
    }
}
```

## 管線與輸出

- **管線輸入：**
  - 用 `ValueFromPipeline` 直接物件輸入
  - 用 `ValueFromPipelineByPropertyName` 屬性對應
  - 實作 Begin/Process/End 處理管線
  - 註明管線輸入需求

- **輸出物件：**
  - 回傳豐富物件，勿回傳格式化文字
  - 用 PSCustomObject 結構化資料
  - 資料輸出勿用 Write-Host
  - 支援下游 cmdlet 處理

- **管線串流：**
  - 一次輸出一個物件
  - 用 process 區塊串流
  - 避免收集大型陣列
  - 支援即時處理

- **PassThru 模式：**
  - 動作 cmdlet 預設不輸出
  - `-PassThru` 旗標回傳物件
  - 用 `-PassThru` 回傳修改/建立物件
  - 狀態更新用 verbose/warning

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
        Write-Verbose "開始資源狀態更新"
        $timestamp = Get-Date
    }

    process {
        # 個別資源處理
        Write-Verbose "處理資源: $Name"
        
        $resource = [PSCustomObject]@{
            Name = $Name
            Status = $Status
            LastUpdated = $timestamp
            UpdatedBy = $env:USERNAME
        }

        # 只在 PassThru 時輸出
        if ($PassThru) {
            Write-Output $resource
        }
    }

    end {
        Write-Verbose "資源狀態更新完成"
    }
}
 ```

## 錯誤處理與安全

- **ShouldProcess 實作：**
  - 用 `[CmdletBinding(SupportsShouldProcess = $true)]`
  - 設定適當 ConfirmImpact
  - 系統變更呼叫 `$PSCmdlet.ShouldProcess()`
  - 額外確認用 `ShouldContinue()`

- **訊息串流：**
  - `Write-Verbose` 詳細資訊（用 `-Verbose`）
  - `Write-Warning` 警告
  - `Write-Error` 非終止錯誤
  - `throw` 終止錯誤
  - 除非 UI 文字，勿用 Write-Host

- **錯誤處理模式：**
  - 用 try/catch 管理錯誤
  - 設定適當 ErrorAction
  - 回傳有意義錯誤訊息
  - 需時用 ErrorVariable
  - 區分終止與非終止錯誤

- **非互動設計：**
  - 參數輸入
  - 指令碼勿用 Read-Host
  - 支援自動化
  - 所有必填輸入需註明

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
        Write-Verbose "開始移除使用者帳號"
        $ErrorActionPreference = 'Stop'
    }

    process {
        try {
            # 驗證
            if (-not (Test-UserExists -Username $Username)) {
                Write-Error "找不到使用者帳號 '$Username'"
                return
            }

            # 確認
            $shouldProcessMessage = "移除使用者帳號 '$Username'"
            if ($Force -or $PSCmdlet.ShouldProcess($Username, $shouldProcessMessage)) {
                Write-Verbose "移除使用者帳號: $Username"
                
                # 主要操作
                Remove-ADUser -Identity $Username -ErrorAction Stop
                Write-Warning "使用者帳號 '$Username' 已移除"
            }
        }
        catch [Microsoft.ActiveDirectory.Management.ADException] {
            Write-Error "Active Directory 錯誤: $_"
            throw
        }
        catch {
            Write-Error "移除使用者帳號時發生非預期錯誤: $_"
            throw
        }
    }

    end {
        Write-Verbose "使用者帳號移除流程完成"
    }
}
```

## 文件與風格

- **註解式說明文件：** 所有公開函式或 cmdlet 需加註解式說明。函式內加 `<# ... #>` 說明，至少包含：
  - `.SYNOPSIS` 簡要說明
  - `.DESCRIPTION` 詳細說明
  - `.EXAMPLE` 實用範例
  - `.PARAMETER` 參數說明
  - `.OUTPUTS` 回傳型別
  - `.NOTES` 其他資訊

- **一致格式：**
  - 遵循一致 PowerShell 風格
  - 建議縮排 4 格
  - 開括號與語句同行，閉括號獨立一行
  - 管線運算子後換行
  - 函式與參數名稱用 PascalCase
  - 避免多餘空白

- **管線支援：**
  - 管線函式實作 Begin/Process/End
  - 適時用 ValueFromPipeline
  - 支援屬性名管線輸入
  - 回傳物件，勿回傳格式化文字

- **避免別名：** 用完整 cmdlet 與參數名稱
  - 指令碼勿用別名（如 Get-ChildItem 取代 gci），互動 shell 可用
  - 用 `Where-Object` 取代 `?` 或 `where`
  - 用 `ForEach-Object` 取代 `%`
  - 用 `Get-ChildItem` 取代 `ls` 或 `dir`

## 完整範例：端到端 Cmdlet 模式

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
        Write-Verbose "開始建立資源"
    }
    
    process {
        try {
            if ($PSCmdlet.ShouldProcess($Name, "建立新資源")) {
                # 建立資源邏輯
                Write-Output ([PSCustomObject]@{
                    Name = $Name
                    Environment = $Environment
                    Created = Get-Date
                })
            }
        }
        catch {
            Write-Error "建立資源失敗: $_"
        }
    }
    
    end {
        Write-Verbose "資源建立流程完成"
    }
}
```
