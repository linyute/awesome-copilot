---
name: pester-migration
description: 'Pester 遷移技能，用於將 PowerShell Pester 測試套件升級跨越主要版本 — v3→v4、v4→v5 及 v5→v6。涵蓋探索/執行兩階段模型、將設定移入 BeforeAll、$PSScriptRoot 與 $MyInvocation 的差異、Mock 變更（Assert-MockCalled → Should -Invoke、移除 fall-through）、Invoke-Pester 參數 → PesterConfiguration、資料驅動的 -ForEach/-TestCases，以及 v6 的重大變更。當使用者需要升級、遷移或現代化 Pester 測試、修復因 Pester 版本升級後損壞的 *.Tests.ps1 檔案，或轉換舊版 Should / Invoke-Pester 語法時使用。'
---

# Pester 遷移

Pester 是 PowerShell 的測試框架。測試檔案以 `*.Tests.ps1` 結尾，並使用
`Describe` / `Context` / `It` 區塊搭配 `Should` 斷言。本技能將現有的
測試套件從某個 Pester 主要版本升級至下一版，並使其恢復正常運行。

> **心智模型：** 每次主要版本跳躍都有其不同的特性。**v3→v4** 大多是語法
> 重新命名。**v4→v5** 是一次*根本性的執行時期變更*（探索/執行分離），也是最困難的一步。
> **v5→v6** 大致上向後相容 — 少數先前已棄用的功能現在會拋出例外。請**一次遷移一個主要版本**；絕不跳過版本。

詳細的、以症狀驅動的指南位於 `references/` — 請載入您正在進行的版本跳躍所對應的指南。

## 參考資料

| 參考文件 | 何時載入 |
|---|---|
| [v3-to-v4.md](references/v3-to-v4.md) | `Should Be` → `Should -Be`、`Contain` → `FileContentMatch`、`Assert-VerifiableMocks` → `Assert-VerifiableMock`、陣列斷言邊界情況。 |
| [v4-to-v5.md](references/v4-to-v5.md) | 最重要的版本。探索/執行階段、`BeforeAll` 設定、`$PSScriptRoot`、`BeforeDiscovery`、`-ForEach`、Mock 作用域、`Should -Throw` 萬用字元、`Invoke-Pester` → `New-PesterConfiguration`。 |
| [v5-to-v6.md](references/v5-to-v6.md) | 僅限 PowerShell 5.1/7.4+、每個檔案的探索+執行、空的 `-ForEach` 會拋出例外、重複的設定區塊會拋出例外、名稱 `<...>` 範本會被求值、`Assert-MockCalled` 已移除、Mock 不再穿透執行真實指令、程式碼覆蓋率追蹤器、舊版 `Invoke-Pester` 參數已移除。 |

官方來源：https://pester.dev/docs/migrations/ 上的官方遷移指南 — 本技能
與其同步。若有疑問，請以該網站為準。

## 步驟 0 — 偵測目前版本及目標版本

找出已安裝的版本以及**測試**是針對哪個版本撰寫的。這兩者可能不同。

```powershell
# 此機器上已安裝的 Pester 版本
Get-Module Pester -ListAvailable | Select-Object Name, Version, Path

# 目前工作階段中已匯入的版本
(Get-Module Pester).Version
```

從**測試程式碼**中透過以下啟發式方法判斷來源版本：

| 在 `*.Tests.ps1` / 建構腳本中看到 | 測試套件是針對以下版本撰寫 |
|---|---|
| `Should Be` / `Should Contain`（無短橫線） | v3 或更早 → 從 [v3-to-v4](references/v3-to-v4.md) 開始 |
| `$MyInvocation.MyCommand.Path` + 在檔案**頂部**點 source；任意程式碼直接位於 `Describe` 之下 | v4 → [v4-to-v5](references/v4-to-v5.md) |
| `Assert-MockCalled`、`Assert-VerifiableMock`、`Set-ItResult -Pending` | v4 / 早期 v5（這些在 **v6 中已移除**） |
| `Invoke-Pester -Script … -OutputFile … -CodeCoverage …`（舊版參數） | v4 呼叫方式 → 需對應至 config |
| `BeforeAll { . $PSScriptRoot/… }`、`New-PesterConfiguration`、`Should -Invoke` | 已是 v5 風格 → [v5-to-v6](references/v5-to-v6.md) |

準備好後安裝目標版本：

```powershell
# 最新穩定 v5 — 鎖定主要版本以避免安裝 Pester 6
Install-Module Pester -MaximumVersion 5.99.99 -Force

# Pester 6
Install-Module Pester -Force
```

> 在 **Windows PowerShell 5.1** 上，OS 內建了 Microsoft 簽署的 Pester 3，PowerShellGet
> 無法以不同簽署的新版 Pester 覆寫它 — 請在那裡加上 `-SkipPublisherCheck` 來
> 並排安裝。PowerShell 7+ 不需要此步驟。請參閱
> https://pester.dev/docs/introduction/installation。

## 遷移工作流程

對每次主要版本跳躍執行此迴圈。**不要一次跳兩個主要版本** — 請依序進行 v4→v5，然後 v5→v6。

1. **建立基準。** 先在**目前**版本上執行測試套件，並記錄通過/失敗情況。您需要一個
   已知的良好（或已知）起點，以便能區分遷移造成的回歸與原本就存在的失敗。
   ```powershell
   # 裸 Invoke-Pester 在每個主要版本上都能運作；確切參數有所不同
   # （v3/v4：-Script/-OutputFile；v5+/v6：-Path/-Output）。
   Invoke-Pester
   ```
2. **閱讀參考文件**，了解此次跳躍的完整範圍，然後再開始編輯。
3. **逐檔案編輯。** 套用機械性的變更（參見下方及參考文件中的各版本快速參考）。保持變更小且可審查 — 一次處理一個檔案或一個關注點。
4. **切換版本**，使用 `Install-Module`（步驟 0），然後重新匯入：`Remove-Module Pester;
   Import-Module Pester`（或啟動一個新的工作階段）。
5. **執行並修復。** 使用 `-Output Detailed` 重新執行；使用 `-Output Diagnostic`（v4→v5）或閱讀
   v6 的明確錯誤訊息來定位問題。將每個失敗對應到參考文件中的**症狀 → 修復**表格。
6. **綠燈、差異比較、提交。** 重新執行直到結果符合基準（或更好）。審查
   差異，然後提交。小批次提交使回歸問題易於使用 bisect 定位。

## 實際變更內容（每次跳躍的範圍）

| 跳躍 | 難度 | 性質 |
|---|---|---|
| v3 → v4 | 低 | 斷言語法重新命名（`Should -Be`）。大部分可用腳本自動化。 |
| v4 → v5 | **高** | 全新的兩階段執行時期。測試**結構**需要變更：設定必須移入 `BeforeAll`，探索時期的程式碼移入 `BeforeDiscovery`，檔案位置改用 `$PSScriptRoot`。不是單純的尋找替換。 |
| v5 → v6 | 低至中 | 向後相容的執行時期；已棄用的功能現在會拋出例外。大多是小型、有針對性的修復。您的 `Should -Be` 斷言保持不變。 |

## 快速參考

### v4 → v5（最常見的修復）
```powershell
# 1. 將檔案匯入移入 BeforeAll，使用 $PSScriptRoot（而非 $MyInvocation.MyCommand.Path）
# 修改前
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$here\Get-Thing.ps1"
# 修改後
BeforeAll { . $PSScriptRoot/Get-Thing.ps1 }

# 2. 任何用於「探索/產生」測試的程式碼必須放入 BeforeDiscovery
BeforeDiscovery { $cases = Get-Content $PSScriptRoot/cases.json | ConvertFrom-Json }

# 3. Should -Throw 使用 -like 萬用字元比對，而非 .Contains
{ throw 'a long message' } | Should -Throw '*long*'

# 4. Invoke-Pester 舊版參數 → New-PesterConfiguration（完整對應表見參考文件）
```
完整細節、作用域規則及參數→config 對應表：[references/v4-to-v5.md](references/v4-to-v5.md)。

### v5 → v6（最常見的修復）
```powershell
# 1. Mock 斷言：移除的指令動詞 — 重新命名（舊 -> 新）：
#    Assert-MockCalled     -> Should -Invoke
#    Assert-VerifiableMock -> Should -InvokeVerifiable
Should -Invoke Get-Thing -Times 1 -Exactly
Should -InvokeVerifiable

# 2. 新增預設 Mock — 不符合任何條件的呼叫不再執行真實指令
Mock Get-Thing { 'default' }
Mock Get-Thing -ParameterFilter { $Name -eq 'a' } -MockWith { 'a' }

# 3. 空/$null 的 -ForEach 現在會拋出例外；僅在預期為空時才允許
Describe 'Optional' -ForEach $cases -AllowNullOrEmptyForEach { }

# 4. 將同一區塊中重複的 BeforeAll/BeforeEach/AfterAll/AfterEach 合併為一個
```
完整的重大變更清單與症狀及修復方式：[references/v5-to-v6.md](references/v5-to-v6.md)。

## 安全規則

- **測試即規格。** 遷移不得改變測試所斷言的內容 — 只能改變測試套件的
  結構與呼叫方式。若有任何測試因文件化重大變更以外的原因而開始通過/失敗，
  請在接受之前進行調查。
- **自動遷移腳本會產生誤判。** 社群腳本（在參考文件中有連結）有助於處理 `Should`
  語法和點 source，但請務必審查差異並在之後重新執行測試套件。切勿批次編輯後直接提交而不加檢查。
- **在以腳本批次替換 `*.Tests.ps1` 時請注意檔案編碼** — 保留原始
  編碼（UTF-8 與 ASCII）以免損壞非 ASCII 的測試名稱。
- **在分支上工作，每個檔案/關注點提交一次。** 小批次提交在遷移後的測試
  變紅時，使 `git bisect` 仍然有用。
