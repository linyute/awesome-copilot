# 移轉 Pester v4 → v5

這是較難的跨越。v5 引入了新的執行階段，將測試執行分為兩個階段——**探索（Discovery）**與**執行（Run）**——這改變了您必須*建構*測試的方式。它不是純粹的尋找與取代。在編輯測試套件之前，請閱讀整篇檔案。

官方指南：https://pester.dev/docs/migrations/v4-to-v5
重大變更：https://pester.dev/docs/migrations/breaking-changes-in-v5

---

## 解釋一切的核心概念：探索與執行

v5+ 的執行分為兩個階段：

- **探索（Discovery）**——Pester 從上到下執行每個 `*.Tests.ps1` 檔案，但僅用於*尋找*測試。它呼叫 `Describe`/`Context` 指令碼區段以收集 `It` 的樹狀結構、評估 `It` 的 `-Name` 字串和 `-TestCases`/`-ForEach` 資料，並記錄 `BeforeAll`/`It` 等指令碼區段**而不執行它們**。
- **執行（Run）**——Pester 接著以正確的範圍（Scoping）執行記錄的設定、測試和清除工作。

**使測試套件在 v5 中正確運作的兩個規則：**

1. 將**所有**測試程式碼置於 `It`、`BeforeAll`、`BeforeEach`、`AfterAll` 或 `AfterEach` 內。
2. 絕不要將測試程式碼直接置於 `Describe`/`Context` 主體中或檔案頂層——除非它旨在建構測試，在這種情況下它應置於 `BeforeDiscovery` 中。

散落在 `Describe` 主體中或檔案頂層的程式碼會在**探索**階段執行，其結果通常在**執行**階段**無法**使用。這是大多數「它在 v4 中可以運作，但在 v5 中為 `$null`」錯誤的根本原因。

---

## 修正 1 — 將檔案設定移至 `BeforeAll` 並使用 `$PSScriptRoot`

傳統的 v4 標頭使用 `$MyInvocation.MyCommand.Path` 在檔案範圍點源（Dot-source）受測系統（System-Under-Test, SUT）。該變數的位置和求值在 v5 中都會失效。

```powershell
# 之前 (v4)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut  = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace('.Tests.', '.')
. "$here\$sut"

Describe 'Get-Cactus' {
    It 'Returns 🌵' { Get-Cactus | Should -Be '🌵' }
}
```

```powershell
# 之後 (v5+)
BeforeAll {
    # 絕不要在此處使用 $MyInvocation.MyCommand.Path。
    . $PSScriptRoot/Get-Cactus.ps1
    # 或依照測試檔案名稱的慣例：
    # . $PSCommandPath.Replace('.Tests.ps1', '.ps1')
}

Describe 'Get-Cactus' {
    It 'Returns 🌵' { Get-Cactus | Should -Be '🌵' }
}
```

為什麼 `$MyInvocation.MyCommand.Path` 會失敗：它僅在指令碼主體中直接求值時才傳回路徑。在*任何*函式或指令碼區段（而 `BeforeAll` 是一個指令碼區段）內部，`Path` 為空。請改用 `$PSScriptRoot`（測試檔案的目錄）或 `$PSCommandPath`（測試檔案的完整路徑）。`string.Replace('.Tests.ps1','.ps1')` 是區分大小寫的——請保持 `.Tests.ps1` 大小寫完全一致。

> 在您自己的*模組/產品程式碼內*使用 `$MyInvocation.MyCommand.Path` 是可以的——此變更僅影響測試檔案的標頭模式。請參閱
> https://pester.dev/docs/usage/importing-tested-functions#migrating-from-pester-v4。

社群提供了一個自動執行 BeforeAll 包裝的移轉腳本（請審閱其輸出）：
https://gist.github.com/nohwnd/d488bd14ab4572f92ae77e208f476ada

---

## 修正 2 — 使用 `BeforeDiscovery` + `-ForEach` 產生測試，而非散落的 `foreach`

非常常見的 v4 模式是使用頂層 `foreach` 從資料建構測試。在 v5 中，資料在探索（Discovery）階段通常尚未定義，因此不會產生任何測試，或者 `It` 內部的每項變數會遺失。

```powershell
# 在 v5 中會失效：$files 在 BeforeAll（執行階段）中設定，但 foreach 在探索階段執行
BeforeAll { $files = Get-ChildItem *.ps1 }
foreach ($file in $files) {
    Describe "$file is correct" {
        It 'has empty line at end' { }
    }
}
```

必須變更兩件事：在 `BeforeDiscovery` 中建構資料（以便它在探索期間存在），並使用 `-ForEach`/`-TestCases` 將每項資料傳遞到測試中（以便 `It` 在執行期間可以看到它）：

```powershell
BeforeDiscovery {
    $files = Get-ChildItem *.ps1            # 在探索階段執行
}

Describe 'script <_> is correct' -ForEach $files {
    It 'has an empty line at the end' {
        # 在此處 $_ 代表目前的檔案
    }
}
```

建議在區段/`It` 上使用 `-ForEach`，而非手寫的 `foreach`；它既能建立複本，又能使目前的項目可用。在名稱中使用 `<_>`（或針對雜湊表項目使用 `<Name>`）來樣板化每項測試的標題。參考資料：https://pester.dev/docs/usage/data-driven-tests。

---

## 修正 3 — `-Skip` 和 `-TestCases` 在探索階段求值

因為篩選器和資料是在探索階段解析的，所以在 `BeforeAll` 中計算的條件尚未可用。

```powershell
# 無法跳過：$isSkipped 在 BeforeAll（執行）中設定，但 -Skip 在探索中讀取
Describe 'd' {
    BeforeAll { $isSkipped = Get-IsSkipped }
    It 'i' -Skip:$isSkipped { }
}
```

將廉價的跳過邏輯移至檔案範圍（它在每次探索時執行），或者最好將其基於靜態全域變數，例如 `$IsWindows`：

```powershell
$isSkipped = -not $IsWindows
Describe 'd' {
    It 'i' -Skip:$isSkipped { }
}
```

保持探索階段的程式碼廉價——它在每次探索檔案時都會執行，這可能會非常頻繁。

---

## 修正 4 — 變數不會從探索階段洩漏到測試中

在探索期間定義的變數在 `BeforeAll/-Each`、`AfterAll/-Each` 或 `It` 中是**不可見**的。如果您在產生測試時計算了某些內容且需要在執行時使用它，請透過 `-ForEach`/`-TestCases` 將其附加到測試中。（`TestDrive` 僅在執行階段可用，因此同樣無法在 `-ForEach` 中使用。）

---

## 修正 5 — `Should -Throw` 使用 `-like` 萬用字元進行比對

在 v5 中，`Should -Throw <message>` 使用 `-like` 而不是 `.Contains()` 來比對例外狀況訊息。以前用於比對的子字串現在需要萬用字元。

```powershell
# v4：比對子字串
{ throw 'connection failed: timeout' } | Should -Throw 'timeout'
# v5+：使用萬用字元比對部分訊息
{ throw 'connection failed: timeout' } | Should -Throw '*timeout*'
```

---

## 修正 6 — 模擬（Mocks）：範圍、偵錯和 `InModuleScope`

- **範圍遵循放置位置。** 在 v5 中，模擬（及其呼叫次數）的範圍限定於您放置它們的地方——目前的區段/測試——而不是整個 `Describe`/`Context`。在它適用的相同 `BeforeAll`/`It` 範圍中定義 `Mock`，並在該範圍中斷言呼叫次數。
- **已移除 `Assert-VerifiableMocks`。** 請改用 `Should -InvokeVerifiable`。（`Assert-MockCalled` 和 `Assert-VerifiableMock` 仍然存在，但在 v5 中已*棄用*，並在 **v6 中被移除**——現在就切換到 `Should -Invoke` / `Should -InvokeVerifiable` 以節省第二次移轉的工作。請參閱 [v5-to-v6.md](v5-to-v6.md)。）
- **模擬是可偵錯的。** v5 不再重寫您的模擬指令碼區段，因此您可以在 `-MockWith` 和 `-ParameterFilter` 內部設定中斷點。
- **避免在 `Describe`/`It` 周圍使用 `InModuleScope`。** 它會在探索期間載入模組（降低速度），並讓您測試內部實作而不是發行介面。建議在 `Mock` 和 `Should -Invoke` 上使用 `-ModuleName`；如果您必須使用 `InModuleScope`，請將其保持在 `It` 內部。請參閱 https://pester.dev/docs/usage/mocking。

```powershell
# 建議使用此方法，而不是在 InModuleScope 中包裝整個 Describe
Mock Get-Internal -ModuleName MyModule { 'mocked' }
Should -Invoke Get-Internal -ModuleName MyModule -Times 1 -Exactly
```

---

## 修正 7 — `Invoke-Pester` 參數 → `New-PesterConfiguration`

`Invoke-Pester` 的介面已進行重構。v5 保留了**已棄用**的相容性設定，因此 v4 呼叫大多仍可執行（帶有警告），但您應該轉向使用 **Simple** 參數或進階的 `-Configuration` 物件。（v6 完全移除了舊版設定——請現在進行移轉。）

**Simple 介面**（參數 → 設定屬性）：

| Simple 參數 | 設定屬性 |
|---|---|
| `-Path` | `Run.Path` |
| `-ExcludePath` | `Run.ExcludePath` |
| `-Tag` | `Filter.Tag` |
| `-ExcludeTag` | `Filter.ExcludeTag` |
| `-FullNameFilter` | `Filter.FullName` |
| `-Output` | `Output.Verbosity` |
| `-CI` | `TestResult.Enabled` + `Run.Exit` (皆為 `$true`) |
| `-PassThru` | `Run.PassThru` |

**舊版 (v4) 參數 → 設定：**

| v4 參數 | 設定屬性 |
|---|---|
| `-Script` | `Run.Path`（僅限路徑——無雜湊表） |
| `-EnableExit` | `Run.Exit` |
| `-TestName` | 由 `-FullNameFilter` / `Filter.FullName` 取代 |
| `-CodeCoverage` | `CodeCoverage.Path` (+ `CodeCoverage.Enabled = $true`) |
| `-CodeCoverageOutputFile` | `CodeCoverage.OutputPath` |
| `-CodeCoverageOutputFileEncoding` | `CodeCoverage.OutputEncoding` |
| `-CodeCoverageOutputFileFormat` | `CodeCoverage.OutputFormat` |
| `-OutputFile` | `TestResult.OutputPath` (+ `TestResult.Enabled = $true`) |
| `-OutputFormat` | `TestResult.OutputFormat` |
| `-Show` / `-Output` | `Output.Verbosity`（參見下方的對應關係） |
| `-PesterOption`, `-Strict` | 已忽略 / 不可用 |

`-Show` 數值 → `Output.Verbosity`：`All`/`Default`/`Detailed` → `Detailed`；`Fails`/`Normal` → `Normal`；`Diagnostic` → `Diagnostic`；`Minimal` → `Minimal`；`None` → `None`。

```powershell
# 之前 (v4 舊版)
Invoke-Pester -Script ./tests -CodeCoverage ./src/*.ps1 `
    -OutputFile result.xml -OutputFormat NUnitXml -EnableExit

# 之後 (v5 進階)
$config = New-PesterConfiguration
$config.Run.Path = './tests'
$config.Run.Exit = $true
$config.CodeCoverage.Enabled = $true
$config.CodeCoverage.Path = './src'
$config.TestResult.Enabled = $true
$config.TestResult.OutputPath = 'result.xml'
$config.TestResult.OutputFormat = 'NUnitXml'
Invoke-Pester -Configuration $config
```

`-Output Diagnostic` 是您移轉期間最好的朋友——它會顯示探索/跳過/模擬的決策。

---

## 新的結果物件

v5 結果物件內容更豐富，也是 Pester 內部使用的物件。若要讓 v4 時代的 CI 管道保持運作，請使用 `ConvertTo-Pester4Result` 進行轉換。對於 NUnit 輸出，請使用 `ConvertTo-NUnitReport`，或傳遞 `-CI` 以在一個參數中啟用 NUnit 輸出、程式碼涵蓋率和失敗時的結束代碼。每個測試的 `-TestCases`/`-ForEach` 項目都可以在測試物件的 `Data` 屬性上取得。

---

## v5 中其他已移除 / 已變更的事項

- 不再支援 **PowerShell 2**。
- 已移除**舊版 `Should Be`**（無連字號）——轉換為 `Should -Be`（[v3-to-v4.md](v3-to-v4.md)）。
- 已移除 **Gherkin**——如果需要它，請保持在 Pester v4 上。
- `-Output`/`-Show` 縮減為 `None`、`Normal`、`Detailed`、`Diagnostic`。
- `-TestName` → `-FullNameFilter`；`-Script` → `-Path`（僅限路徑）；已移除 `-PesterOption`。

---

## v4 → v5 檢核表

- [ ] 測試套件先在 v4 上執行且通過（基準）。
- [ ] 檔案匯入移至 `BeforeAll`；`$MyInvocation.MyCommand.Path` 取代為 `$PSScriptRoot`/`$PSCommandPath`。
- [ ] 在 `Describe`/`Context` 主體中或檔案頂層無散落的程式碼；測試產生程式碼移至 `BeforeDiscovery`。
- [ ] 將 `foreach` 產生的測試轉換為 `-ForEach`；透過 `-ForEach`/`-TestCases` 傳遞每項資料。
- [ ] `-Skip:` 條件不相依於 `BeforeAll` 變數。
- [ ] `Should -Throw` 訊息使用 `-like` 萬用字元 (`*...*`)。
- [ ] 模擬定義在正確的範圍內；`Assert-VerifiableMocks` → `Should -InvokeVerifiable`；在 `Describe`/`It` 周圍移除 `InModuleScope` 並改用 `-ModuleName`。
- [ ] `Invoke-Pester` 呼叫轉換為 Simple 參數或 `New-PesterConfiguration`。
- [ ] 測試套件在 v5 上以 `-Output Detailed` 執行且通過（綠燈）；審閱差異；已提交。
