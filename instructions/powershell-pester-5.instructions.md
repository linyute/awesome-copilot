---
applyTo: '**/*.Tests.ps1'
description: '依據 Pester v5 慣例的 PowerShell Pester 測試最佳實踐'
---

# PowerShell Pester v5 測試指南

本指南提供 PowerShell Pester v5 模組自動化測試的專屬指引。一般 PowerShell 指令碼最佳實踐請參考 [powershell.instructions.md](./powershell.instructions.md)。

## 檔案命名與結構

- **命名慣例：** 使用 `*.Tests.ps1` 命名
- **放置位置：** 測試檔案可與被測程式碼同目錄或獨立測試目錄
- **匯入模式：** 用 `BeforeAll { . $PSScriptRoot/FunctionName.ps1 }` 匯入被測函式
- **禁止直接程式碼：** 所有程式碼皆需置於 Pester 區塊（`BeforeAll`、`Describe`、`Context`、`It` 等）

## 測試結構階層

```powershell
BeforeAll { # 匯入被測函式 }
Describe 'FunctionName' {
    Context '特定條件' {
        BeforeAll { # Context 前置作業 }
        It '應有行為' { # 個別測試 }
        AfterAll { # Context 清理 }
    }
}
```

## 核心關鍵字

- **`Describe`**：頂層分組，通常以被測函式命名
- **`Context`**：Describe 內子分組，針對特定情境
- **`It`**：個別測試案例，名稱具描述性
- **`Should`**：斷言關鍵字，驗證測試結果
- **`BeforeAll/AfterAll`**：區塊一次性前置/清理
- **`BeforeEach/AfterEach`**：每次測試前/後執行

## 前置與清理

- **`BeforeAll`**：區塊開始時執行一次，適合高成本作業
- **`BeforeEach`**：每個 `It` 前執行，適合測試專屬前置
- **`AfterEach`**：每個 `It` 後執行，測試失敗也保證執行
- **`AfterAll`**：區塊結束時執行一次，適合清理
- **變數範圍：** `BeforeAll` 變數可供子區塊唯讀，`BeforeEach/It/AfterEach` 共用同範圍

## 斷言（Should）

- **基本比較：** `-Be`、`-BeExactly`、`-Not -Be`
- **集合：** `-Contain`、`-BeIn`、`-HaveCount`
- **數值：** `-BeGreaterThan`、`-BeLessThan`、`-BeGreaterOrEqual`
- **字串：** `-Match`、`-Like`、`-BeNullOrEmpty`
- **型別：** `-BeOfType`、`-BeTrue`、`-BeFalse`
- **檔案：** `-Exist`、`-FileContentMatch`
- **例外：** `-Throw`、`-Not -Throw`

## 模擬（Mock）

- **`Mock CommandName { ScriptBlock }`**：取代指令行為
- **`-ParameterFilter`**：僅參數符合條件時才模擬
- **`-Verifiable`**：標記需驗證的 mock
- **`Should -Invoke`**：驗證 mock 被呼叫次數
- **`Should -InvokeVerifiable`**：驗證所有 verifiable mock 均被呼叫
- **範圍：** mock 預設僅限所屬區塊

```powershell
Mock Get-Service { @{ Status = 'Running' } } -ParameterFilter { $Name -eq 'TestService' }
Should -Invoke Get-Service -Exactly 1 -ParameterFilter { $Name -eq 'TestService' }
```

## 測試案例（資料驅動測試）

用 `-TestCases` 或 `-ForEach` 實作參數化測試：

```powershell
It '應回傳 <Expected> 給 <Input>' -TestCases @(
    @{ Input = 'value1'; Expected = 'result1' }
    @{ Input = 'value2'; Expected = 'result2' }
) {
    Get-Function $Input | Should -Be $Expected
}
```

## 資料驅動測試

- **`-ForEach`**：可用於 `Describe`、`Context`、`It`，依資料產生多個測試
- **`-TestCases`**：`It` 區塊的別名（相容舊版）
- **Hashtable 資料：** 每項定義測試可用變數（如 `@{ Name = 'value'; Expected = 'result' }`）
- **Array 資料：** 用 `$_` 代表目前項目
- **模板：** 測試名稱可用 `<variablename>` 動態展開

```powershell
# Hashtable 寫法
It '回傳 <Expected> 給 <Name>' -ForEach @(
    @{ Name = 'test1'; Expected = 'result1' }
    @{ Name = 'test2'; Expected = 'result2' }
) { Get-Function $Name | Should -Be $Expected }

# Array 寫法
It '包含 <_>' -ForEach 'item1', 'item2' { Get-Collection | Should -Contain $_ }
```

## 標籤（Tags）

- **可用於：** `Describe`、`Context`、`It` 區塊
- **篩選：** 用 `-TagFilter`、`-ExcludeTagFilter` 搭配 `Invoke-Pester` 篩選
- **萬用字元：** 標籤支援 `-like` 萬用字元彈性篩選

```powershell
Describe 'Function' -Tag 'Unit' {
    It '應正常' -Tag 'Fast', 'Stable' { }
    It '應較慢' -Tag 'Slow', 'Integration' { }
}

# 僅執行快速單元測試
Invoke-Pester -TagFilter 'Unit' -ExcludeTagFilter 'Slow'
```

## 跳過（Skip）

- **`-Skip`**：可用於 `Describe`、`Context`、`It` 跳過測試
- **條件式：** 用 `-Skip:$condition` 動態跳過
- **執行時跳過：** 測試執行中用 `Set-ItResult -Skipped`（setup/teardown 仍執行）

```powershell
It '僅在 Windows 執行' -Skip:(-not $IsWindows) { }
Context '整合測試' -Skip { }
```

## 錯誤處理

- **失敗繼續：** 用 `Should.ErrorAction = 'Continue'` 收集多個失敗
- **關鍵失敗即停：** 前置條件用 `-ErrorAction Stop`
- **例外測試：** 用 `{ Code } | Should -Throw` 測試例外

## 最佳實踐

- **描述性名稱：** 測試描述需清楚說明行為
- **AAA 模式：** Arrange（準備）、Act（執行）、Assert（驗證）
- **測試獨立：** 每個測試應互不影響
- **避免別名：** 用完整 cmdlet 名稱（如 `Where-Object`，勿用 `?`）
- **單一責任：** 測試盡量只驗證一項
- **測試檔案組織：** 相關測試用 Context 分組，可巢狀

## 範例測試模式

```powershell
BeforeAll {
    . $PSScriptRoot/Get-UserInfo.ps1
}

Describe 'Get-UserInfo' {
    Context '使用者存在時' {
        BeforeAll {
            Mock Get-ADUser { @{ Name = 'TestUser'; Enabled = $true } }
        }

        It '應回傳使用者物件' {
            $result = Get-UserInfo -Username 'TestUser'
            $result | Should -Not -BeNullOrEmpty
            $result.Name | Should -Be 'TestUser'
        }

        It '應呼叫 Get-ADUser 一次' {
            Get-UserInfo -Username 'TestUser'
            Should -Invoke Get-ADUser -Exactly 1
        }
    }

    Context '使用者不存在時' {
        BeforeAll {
            Mock Get-ADUser { throw "User not found" }
        }

        It '應丟出例外' {
            { Get-UserInfo -Username 'NonExistent' } | Should -Throw "*not found*"
        }
    }
}
```

## 設定

設定需在測試檔外部，呼叫 `Invoke-Pester` 控制執行行為。

```powershell
# 建立設定（Pester 5.2+）
$config = New-PesterConfiguration
$config.Run.Path = './Tests'
$config.Output.Verbosity = 'Detailed'
$config.TestResult.Enabled = $true
$config.TestResult.OutputFormat = 'NUnitXml'
$config.Should.ErrorAction = 'Continue'
Invoke-Pester -Configuration $config
```

**重點區塊**：Run（Path, Exit）、Filter（Tag, ExcludeTag）、Output（Verbosity）、TestResult（Enabled, OutputFormat）、CodeCoverage（Enabled, Path）、Should（ErrorAction）、Debug
