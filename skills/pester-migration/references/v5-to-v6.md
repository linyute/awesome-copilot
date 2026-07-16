# 移轉 Pester v5 → v6

Pester 6 建構於 v5 之上，且**在很大程度上是向後相容的**——大多數 v5 測試套件在 v6 上不需任何變更即可執行，且您現有的 `Should -Be` 斷言也將繼續運作。移轉工作主要是修正少數以前被棄用、而現在會擲回錯誤的行為。這是一個低到中等工作量的跨越。

官方指南：https://pester.dev/docs/migrations/v5-to-v6

---

## 快速升級檢核表

對大多數測試套件而言，這項升級的風險很低。請過一遍以下項目，然後閱讀細節以了解可能遇到的問題：

1. 在 **Windows PowerShell 5.1** 或 **PowerShell 7.4+** 上執行（已捨棄舊版 PS）。
2. 檢查任何可能為空的 `-ForEach`/`-TestCases`——它現在會**擲回錯誤**，除非您加入 `-AllowNullOrEmptyForEach`。
3. 移除同一個區段中重複的 `BeforeAll`/`BeforeEach`/`AfterAll`/`AfterEach`。
4. 將 `Assert-MockCalled` / `Assert-VerifiableMock` 取代為 `Should -Invoke` / `Should -InvokeVerifiable`。
5. 針對部分呼叫不符合 `-ParameterFilter` 的情況，加入預設的 `Mock`——模擬（Mock）不再會向下傳遞（Fall-through）到實際命令。
6. 如果您使用 v4 樣式的參數（`-Script`、`-OutputFile` 等）呼叫 `Invoke-Pester`，請切換至 `New-PesterConfiguration`。

---

## 重大變更（症狀 → 修正）

### 僅支援 PowerShell 5.1 和 7.4+
已捨棄 PowerShell 3、4、6 和早期/未支援的 7（皆已超出 Microsoft 的支援範圍），這使得 Pester 能將其 C# 移至 .NET 8（針對 Windows PowerShell 5.1 為 net462）。

- **症狀：** Pester 無法在較舊的 PowerShell 上匯入。
- **修正：** 將您的機器和 CI 代理程式更新至 Windows PowerShell 5.1 或 PowerShell 7.4+。

### 探索和執行現在針對每個檔案進行
在 v5 中，執行有兩個全域階段：探索**每個**檔案，然後執行每個檔案。在 v6 中，工作單元是單一檔案——Pester 在移至下一個檔案之前先探索一個檔案並執行它。這啟用了實驗性的平行執行器，且序列執行也遵循相同的模型。

- **症狀：** 依賴*另一個*檔案在探索階段所產生之副作用的檔案會失敗——例如在一個檔案頂部匯入的模組、全域變數、已變更的工作目錄，或在不同檔案中定義的 `-ForEach` 資料。
- **修正：** 讓每個測試檔案保持自足。在 `BeforeDiscovery` 中執行探索階段的設定，並在檔案本身的 `BeforeAll` 中匯入需要的模組。針對每個檔案都需要的設定，請使用 `Run.BeforeContainer`（設定）或在存放庫根目錄下使用 `Pester.BeforeContainer.ps1`。

```powershell
BeforeDiscovery {
    $cases = Get-Content "$PSScriptRoot/cases.json" | ConvertFrom-Json
}
Describe 'MyModule' {
    BeforeAll { Import-Module "$PSScriptRoot/MyModule.psm1" }
    It 'handles <Name>' -ForEach $cases { Invoke-Thing $Name | Should -Be 'ok' }
}
```

畫面輸出也會變更：一個 `Running tests from N files.` 橫幅、各檔案的結果，然後是一個總計。舊有的 `Starting discovery in N files.` / `Discovery found X tests` 結構在正常執行中已不復存在。平行執行器（`Run.Parallel`）會保留相同的結果物件，但有一些邊界情況——請參閱 https://pester.dev/docs/usage/result-object#parallel-runner-edge-cases。

### 空的或為 `$null` 的 `-ForEach` 會擲回錯誤
如果傳給 `-ForEach`（或 `-TestCases`）的內容為 `$null` 或 `@()`，現在會擲回錯誤，而不是靜默略過。這能捕捉到將 `-ForEach` 指向未在 `BeforeDiscovery` 中定義的變數，或是外部資料載入失敗等常見錯誤。

- **症狀：**
  ```
  Value can not be null or empty array. If this is expected, use -AllowNullOrEmptyForEach
  on this Describe, or set the Run.FailOnNullOrEmptyForEach configuration option to $false ...
  ```
- **修正：** 當資料合理地可以為空時，在該特定的區段/測試上允許它：
  ```powershell
  Describe 'Optional cases' -ForEach $cases -AllowNullOrEmptyForEach {
      It 'runs only when there is data' { }
  }
  ```
  您*可以*透過 `Run.FailOnNullOrEmptyForEach = $false` 針對整個執行停用此檢查，但這會帶回它原本要捕捉的靜默略過問題——因此建議修正資料，或在確實預期為空的地方使用 `-AllowNullOrEmptyForEach`。

### 重複的設定/清除區段會擲回錯誤
一個區段只能有 `BeforeAll`/`BeforeEach`/`AfterAll`/`AfterEach` 各一個。在 v5 中，兩個相同的區段（常見的複製貼上錯誤）會被靜默允許；而在 v6 中會擲回錯誤。

- **症狀：** `BeforeAll is already defined in this block. Each block can only have one BeforeAll.`
- **修正：** 將它們合併為一個區段：
  ```powershell
  Describe 'd' {
      BeforeAll {
          $a = 1
          $b = 2   # 原本是第二個 BeforeAll
      }
  }
  ```

### 測試名稱將 `<...>` 範本評估為運算式
在 v6 中，`Describe`/`Context`/`It` 名稱中每個 `<...>` 標記的內容，都會在測試的執行範圍內被評估為 PowerShell 運算式（目前的 `-ForEach` 項目及其屬性、範圍內變數、算術運算、方法呼叫）。`<...>` 之外的所有內容都保持原樣。在 v5 中，僅替換了簡單的資料/變數/屬性參照。

- **症狀：** 以前以字面呈現的名稱（在 `<...>` 內部包含類似運算式的內容）現在會被評估。
  ```powershell
  # v5 字面呈現："adds up to <($a + $b)>"；v6 評估為："adds up to 3"
  It 'adds up to <($a + $b)>' -ForEach @(@{ a = 1; b = 2 }) { }
  ```
- **修正（以保留字面文字）：** 用反引號逸出領頭的 `<` 字元：
  ```powershell
  It 'adds up to `<($a + $b)`>' -ForEach @(@{ a = 1; b = 2 }) { }
  ```

### 已移除 `Assert-MockCalled` 和 `Assert-VerifiableMock`
這兩個在 v5 中已棄用，在 v6 中已移除。

- **症狀：** `The term 'Assert-MockCalled' is not recognized ...`
- **修正：**
  ```powershell
  # Assert-MockCalled     -> Should -Invoke
  # Assert-VerifiableMock -> Should -InvokeVerifiable
  Should -Invoke Get-Thing -Times 1 -Exactly
  Should -InvokeVerifiable
  ```

### 模擬不再向下傳遞到實際命令
在 v5 中，如果對模擬命令的呼叫不符合您的任何 `-ParameterFilter`，將會靜默執行**實際**命令。v6 移除了這種隱含的向下傳遞。

- **症狀：**
  ```
  No mock for command 'Get-Thing' matched the call: none of the parameter filters matched,
  and there is no default mock to fall back to. Add a default mock ...
  ```
- **修正：** 針對未被篩選的呼叫加入預設的模擬（不含 `-ParameterFilter`），或者放寬篩選器：
  ```powershell
  Mock Get-Thing -MockWith { 'default' }                                # 適用於其他所有情況
  Mock Get-Thing -ParameterFilter { $Name -eq 'a' } -MockWith { 'a' }   # 特殊情況
  ```

### 已移除 `Set-ItResult -Pending`
`Pending` 在 v5 中從未完全實作，且已在 v6 中移除。

- **症狀：** `Parameter set cannot be resolved using the specified named parameters.`
- **修正：** 使用 `-Inconclusive` 或 `-Skipped`，或是使用 `It … -Skip` 來標記測試：
  ```powershell
  Set-ItResult -Inconclusive -Because 'not implemented yet'
  ```

### 程式碼涵蓋率預設使用 Profiler 追蹤器
涵蓋率不再對每個命令設定中斷點；它改用 Profiler 的追蹤器，這在大型程式碼庫上速度快得多。`CodeCoverage.UseBreakpoints` 不再是實驗性的，且預設值為 `$false`。

- **症狀：** 涵蓋率數值與 v5 不同，且您想要舊有的行為。
- **修正：** 將 `$config.CodeCoverage.UseBreakpoints = $true`。

### 已移除 `CodeCoverage.OutputFormat = 'CoverageGutters'`
所有的涵蓋率輸出現在都相對於存放庫根目錄（`Run.RepoRoot`，從 `.git` 目錄中找到），因此一般的 `JaCoCo` 已經可以與 VS Code 的 Coverage Gutters 延伸模組搭配運作。

- **症狀：** 將 `OutputFormat` 設定為 `'CoverageGutters'` 會擲回無效數值錯誤。
- **修正：** 使用 `JaCoCo`（預設值）或 `Cobertura`。

### 已移除 `Invoke-Pester` 舊版 (v4) 參數
僅保留 **Simple** 參數集（`-Path`、`-Output`、`-Container`、`-Tag` 等）和 **Advanced** 參數集（`-Configuration`）。v4 樣式的參數集已移除。

- **症狀：** 像 `Invoke-Pester -Script … -OutputFile … -OutputFormat … -EnableExit -CodeCoverage …` 的呼叫會因為參數繫結錯誤而失敗。
- **修正：** 使用設定物件（完整的參數→設定對應表位於 [v4-to-v5.md](v4-to-v5.md) 的「`Invoke-Pester` 參數 → `New-PesterConfiguration`」區段中）：
  ```powershell
  $config = New-PesterConfiguration
  $config.Run.Path = './tests'
  $config.Run.Exit = $true
  $config.TestResult.Enabled  = $true
  $config.TestResult.OutputPath = 'result.xml'
  $config.TestResult.OutputFormat = 'NUnitXml'
  $config.CodeCoverage.Enabled = $true
  $config.CodeCoverage.Path = './src'
  Invoke-Pester -Configuration $config
  ```

> v6 中的設定便利性：在 `TestResult` 或 `CodeCoverage` 區段中設定**任何**非預設的選項，將會自動啟用該區段，因此您不再需要另外設定 `.Enabled = $true` 來寫入報告。

---

## 新的 `Should-*` 斷言 — 這是選用的，而非升級的必要部分

v6 新增了一系列新的斷言——`Should-Be`、`Should-Throw`、`Should-Invoke` 以及另外約 40 個斷言（請注意連字號位置：`Should-Be` 是一個獨立的命令，而傳統的是 `Should -Be`），並提供更清晰的失敗訊息。**您不需要修改現有的 `Should -Be` 斷言即可進行升級**；它們會繼續運作。將任何 `Should -Be` → `Should-Be` 的重寫視為以後的工作，而不是這次移轉的一部分。參考資料：https://pester.dev/docs/commands/Should-Be。

如果您嘗試使用它們：新的斷言會從管線（Pipeline）或 `-Actual` 取得實際數值。管線會展開輸入（因此 `@(1)` 會變成 `1`，`@()` 會變成 `$null`，且一個集合會被重新收集為 `[object[]]`，從而失去像 `[int[]]` 的類型）。當您需要確切的數值或具體的集合類型時，請使用 `-Actual`。

---

## v5 → v6 檢核表

- [ ] 測試套件先在 v5 上執行且通過（基準）。
- [ ] 執行於 Windows PowerShell 5.1 或 PowerShell 7.4+。
- [ ] 可能為空的 `-ForEach`/`-TestCases` 被標記為 `-AllowNullOrEmptyForEach`（或已修正資料）。
- [ ] 合併了重複的 `Before*`/`After*` 區段。
- [ ] `Assert-MockCalled` → `Should -Invoke`；`Assert-VerifiableMock` → `Should -InvokeVerifiable`。
- [ ] 在呼叫可能漏掉所有 `-ParameterFilter` 的地方加入了預設的 `Mock`。
- [ ] `Set-ItResult -Pending` → `-Inconclusive`/`-Skipped`。
- [ ] 應保持字面呈現的 `<...>` 測試名稱範本均已使用反引號逸出。
- [ ] 每個測試檔案都是自足的（不相依於另一個檔案在探索階段的狀態）。
- [ ] `Invoke-Pester` 舊版參數 → `New-PesterConfiguration`。
- [ ] 涵蓋率的 `OutputFormat` 為 `JaCoCo`/`Cobertura`；僅在需要舊涵蓋率數值時才設定 `UseBreakpoints`。
- [ ] 測試套件在 v6 上執行且通過（綠燈）；審閱差異；已提交。
