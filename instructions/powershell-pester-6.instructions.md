---
applyTo: '**/*.Tests.ps1'
description: '基於 Pester v6 慣例的 PowerShell Pester 測試最佳做法'
---

# PowerShell Pester v6 測試指引

本指南提供使用 PowerShell Pester v6 模組建立自動化測試的 PowerShell 特定指示。Pester v6 可在 Windows PowerShell 5.1 與 PowerShell 7.4+ 上執行。請遵循 [powershell.instructions.md](./powershell.instructions.md) 中的一般 PowerShell 指令碼撰寫指引。

Pester v6 大致與 v5 相容，但它使幾種先前已棄用的行為快速失敗。保持每個測試檔案獨立完整，並使用 CI 所採用的相同 PowerShell 與 Pester 版本執行測試套件。

## 檔案命名與結構

- **檔案慣例：** 使用 `*.Tests.ps1` 命名模式
- **放置位置：** 將測試檔案放置在受測程式碼旁或專用的測試目錄中
- **匯入模式：** 使用 `BeforeAll { . $PSScriptRoot/FunctionName.ps1 }` 匯入受測函式
- **禁止直接程式碼：** 將「所有」程式碼放入 Pester 區塊中 (`BeforeAll`、`Describe`、`Context`、`It` 等)

## 測試結構階層

```powershell
BeforeAll { # 匯入受測函式 }
Describe 'FunctionName' {
    Context 'When condition' {
        BeforeAll { # 情境的設定 }
        It 'Should behavior' { # 個別測試 }
        AfterAll { # 情境的清理 }
    }
}
```

## 探索與執行 (Discovery and Run)

- Pester v6 一次探索並執行一個檔案。不要依賴另一個測試檔案在探索階段產生的副作用 (例如全域變數、目前目錄或已匯入的模組)。
- 使用 `BeforeDiscovery` 處理建構測試所需的資料，並使用 `BeforeAll` 匯入模組或初始化該檔案的執行階段狀態。
- 保持每個測試檔案可獨立執行；當共用設定確實適用於所有檔案時，將其放置在 Pester 組態 (`Run.BeforeContainer`) 或儲存機制的 `Pester.BeforeContainer.ps1` 中。

```powershell
BeforeDiscovery {
    $cases = Get-Content "$PSScriptRoot/cases.json" | ConvertFrom-Json
}

BeforeAll {
    Import-Module "$PSScriptRoot/MyModule.psm1"
}

Describe 'MyModule' {
    It 'handles <Name>' -ForEach $cases { Invoke-Thing $Name | Should -Be 'ok' }
}
```

## 核心關鍵字

- **`Describe`**：最上層分組，通常以受測函式命名
- **`Context`**：Describe 內的子分組，用於特定情境
- **`It`**：個別測試案例，使用具描述性的名稱
- **`Should`**：傳統判斷提示命令 (`Should -Be`、`Should -Throw` 等)；現有的 v5 語法仍受支援
- **`Should-*`**：新的 v6 判斷提示命令 (`Should-Be`、`Should-Throw` 等)；請深思熟慮地採用，而非作為強制的重新命名
- **`BeforeAll/AfterAll`**：每個區塊設定/拆卸一次
- **`BeforeEach/AfterEach`**：每次測試前/後設定/拆卸

## 設定與拆卸 (Setup and Teardown)

- **`BeforeAll`**：在所屬區塊開始時執行一次，用於高開銷的操作
- **`BeforeEach`**：在區塊中的每個 `It` 之前執行，用於測試特定的設定
- **`AfterEach`**：在每個 `It` 之後執行，即使測試失敗也保證執行
- **`AfterAll`**：在區塊結尾執行一次，用於清理
- **變數範圍**：`BeforeAll` 變數對子區塊可用 (唯讀)；`BeforeEach`、`It` 與 `AfterEach` 共用其區塊範圍
- **每種類型一個 Hook**：一個區塊只能包含一個 `BeforeAll`、`BeforeEach`、`AfterAll` 或 `AfterEach`；必要時合併設定

## 判斷提示 (Should)

- **基本比較**：`-Be`, `-BeExactly`, `-Not -Be`
- **集合**：`-Contain`, `-BeIn`, `-HaveCount`
- **數值**：`-BeGreaterThan`, `-BeLessThan`, `-BeGreaterOrEqual`
- **字串**：`-Match`, `-Like`, `-BeNullOrEmpty`
- **型別**：`-BeOfType`, `-BeTrue`, `-BeFalse`
- **檔案**：`-Exist`, `-FileContentMatch`
- **例外狀況**：`-Throw`, `-Not -Throw`

## 模擬 (Mocking)

- **`Mock CommandName { ScriptBlock }`**：取代命令行為
- **`-ParameterFilter`**：僅在參數符合條件時進行模擬
- **`-Verifiable`**：將模擬標記為需要驗證
- **`Should -Invoke`**：驗證模擬被呼叫了特定次數
- **`Should -InvokeVerifiable`**：驗證所有可驗證的模擬皆被呼叫
- **範圍**：模擬預設為所屬區塊範圍

Pester v6 移除了 `Assert-MockCalled` 與 `Assert-VerifiableMock`；請改用 `Should -Invoke` 形式。未符合任何 `-ParameterFilter` 的呼叫不再自動後備至真實命令，因此只要未符合條件的呼叫是有效的，請新增一個預設模擬。

```powershell
Mock Get-Service { @{ Status = 'Running' } } -ParameterFilter { $Name -eq 'TestService' }
Should -Invoke Get-Service -Exactly 1 -ParameterFilter { $Name -eq 'TestService' }
```

## 測試案例 (資料驅動測試)

使用 `-TestCases` 或 `-ForEach` 進行參數化測試。在 Pester v6 中，`$null` 或空陣列會擲回例外狀況而非靜默略過；請修正資料來源，或在特定區塊上使用 `-AllowNullOrEmptyForEach` 明確選擇加入空案例。

```powershell
It 'Should return <Expected> for <Input>' -TestCases @(
    @{ Input = 'value1'; Expected = 'result1' }
    @{ Input = 'value2'; Expected = 'result2' }
) {
    Get-Function $Input | Should -Be $Expected
}
```

## 資料驅動測試

- **`-ForEach`**：適用於 `Describe`、`Context` 與 `It`，用於從資料產生多個測試
- **`-TestCases`**：`It` 區塊上 `-ForEach` 的別名 (回溯相容性)
- **雜湊表資料**：每個項目定義測試中可用的變數 (例如 `@{ Name = 'value'; Expected = 'result' }`)
- **陣列資料**：使用 `$_` 變數表示目前項目
- **範本**：在測試名稱中使用 `<variablename>` 進行動態展開

```powershell
# 雜湊表做法
It 'Returns <Expected> for <Name>' -ForEach @(
    @{ Name = 'test1'; Expected = 'result1' }
    @{ Name = 'test2'; Expected = 'result2' }
) { Get-Function $Name | Should -Be $Expected }

# 陣列做法
It 'Contains <_>' -ForEach 'item1', 'item2' { Get-Collection | Should -Contain $_ }
```

當測試名稱包含 `<...>` 時，Pester v6 會將該權杖評估為 PowerShell 運算式。當文字應保持為字面常值時，請在開頭的 `<` 前加上反引號 (backtick) 進行逸出。

## 標籤 (Tags)

- **適用於**：`Describe`、`Context` 與 `It` 區塊
- **篩選**：搭配 `Invoke-Pester` 使用 `-Tag` 與 `-ExcludeTag`，或在 `New-PesterConfiguration` 中設定 `Filter.Tag` 與 `Filter.ExcludeTag`
- **萬用字元**：標籤支援 `-like` 萬用字元以進行彈性篩選

```powershell
Describe 'Function' -Tag 'Unit' {
    It 'Should work' -Tag 'Fast', 'Stable' { }
    It 'Should be slow' -Tag 'Slow', 'Integration' { }
}

# 僅執行快速單元測試
Invoke-Pester -Tag 'Unit' -ExcludeTag 'Slow'
```

## 略過 (Skip)

- **`-Skip`**：適用於 `Describe`、`Context` 與 `It` 以略過測試
- **條件式**：使用 `-Skip:$condition` 進行動態略過
- **執行階段略過**：在測試執行期間使用 `Set-ItResult -Skipped` 或 `Set-ItResult -Inconclusive` (設定/拆卸仍會執行)
- **結束測試主體**：`Set-ItResult -Skipped`/`-Inconclusive` 在內部擲回例外狀況以結束 `It` 區塊，因此其後的程式碼不會執行；尾隨的 `return` 是無法執行的程式碼，不應新增

```powershell
It 'Should work on Windows' -Skip:(-not $IsWindows) { }
Context 'Integration tests' -Skip { }
```

## 錯誤處理

- **失敗時繼續**：使用 `Should.ErrorAction = 'Continue'` 收集多個失敗
- **關鍵錯誤時停止**：對前置條件使用 `-ErrorAction Stop`
- **測試例外狀況**：使用 `{ Code } | Should -Throw` 進行例外狀況測試
- **待定測試**：`Set-ItResult -Pending` 已被移除；請使用 `-Inconclusive`、`-Skipped` 或 `It -Skip`

## 最佳做法

- **具描述性的名稱**：使用清楚解釋行為的測試描述
- **AAA 模式**：Arrange (安排設定)、Act (執行操作)、Assert (驗證斷言)
- **隔離測試**：每個測試應保持獨立
- **避免使用別名**：使用完整的 Cmdlet 名稱 (`Where-Object` 而非 `?`)
- **單一職責**：在可行時每個測試一個判斷提示
- **測試檔案組織**：將相關測試分組在 Context 區塊中。Context 區塊可以巢狀化。

## 範例測試模式

```powershell
BeforeAll {
    . $PSScriptRoot/Get-UserInfo.ps1
}

Describe 'Get-UserInfo' {
    Context 'When user exists' {
        BeforeAll {
            Mock Get-ADUser { @{ Name = 'TestUser'; Enabled = $true } }
        }

        It 'Should return user object' {
            $result = Get-UserInfo -Username 'TestUser'
            $result | Should -Not -BeNullOrEmpty
            $result.Name | Should -Be 'TestUser'
        }

        It 'Should call Get-ADUser once' {
            Get-UserInfo -Username 'TestUser'
            Should -Invoke Get-ADUser -Exactly 1
        }
    }

    Context 'When user does not exist' {
        BeforeAll {
            Mock Get-ADUser { throw "User not found" }
        }

        It 'Should throw exception' {
            { Get-UserInfo -Username 'NonExistent' } | Should -Throw "*not found*"
        }
    }
}
```

## 組態設定

組態是在呼叫 `Invoke-Pester` 時於測試檔案**外部**定義，用以控制執行行為。

```powershell
# 建立組態 (Pester v6)
$config = New-PesterConfiguration
$config.Run.Path = './Tests'
$config.Output.Verbosity = 'Detailed'
$config.TestResult.Enabled = $true
$config.TestResult.OutputFormat = 'NUnitXml'
$config.Should.ErrorAction = 'Continue'
Invoke-Pester -Configuration $config
```

**關鍵區段**：Run (Path, Exit), Filter (Tag, ExcludeTag), Output (Verbosity), TestResult (Enabled, OutputFormat), CodeCoverage (Enabled, Path), Should (ErrorAction), Debug
