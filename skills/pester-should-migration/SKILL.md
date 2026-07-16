---
name: pester-should-migration
description: '實驗性（預覽版）Pester 技能，用於將傳統的 Should -Be (v5) 斷言語法移轉至新的 Should-* (v6) 斷言（請注意連字號，無空格），例如 `Should -Be` -> `Should-Be`、`Should -Not -Be` -> `Should-NotBe`。追蹤 Pester 6，此版本目前仍為候選發行版（Release Candidate），因此本指引可能會變更；已針對 Pester 6.0.0-rc2 進行驗證。適用於將 Pester v5 斷言轉換為 Pester v6 Should-* 運算子、進行 Pester 測試套件現代化，或是使用者要求在 .Tests.ps1 / PowerShell 檔案中移轉、轉換或重寫 `Should -...` 呼叫時。'
argument-hint: "要移轉的檔案、資料夾或測試套件"
---

# Pester `Should -*` → `Should-*` 移轉

將傳統的 Pester v5 斷言（`Should -Be`，空格加參數）轉換為新的 Pester v6 `Should-*` 斷言（`Should-Be`，連字號，無空格）。

> **狀態：實驗性 / 預覽版。** 已針對 Pester 6.0.0-rc2 進行驗證。傳統的 `Should -Be` 樣式在 v6 中仍可運作，因此請以漸進方式進行移轉，並保持測試套件通過（綠燈）。

> **隨附技能。** 此技能涵蓋了轉向新 `Should-*` 運算子的*選用*操作。若要跨越 Pester 的主要版本升級測試套件（v3→v4→v5→v6 —— 包含執行階段、模擬和設定），請使用單獨的 **pester-migration** 技能。在 v6 中，傳統的 `Should -Be` 仍可繼續運作，因此採用 `Should-*` 是獨立於任何版本升級的。

## 何時使用

- 將 Pester 測試套件現代化，改用 v6 的 `Should-*` 斷言。
- 使用者要求移轉 / 轉換 / 重寫 `Should -...` 呼叫。
- 您希望從新的斷言中獲得更清晰、具備類型感知（Type-aware）的失敗訊息。

## 事前須知

- **在 Pester v6 中，兩種語法可以並存。** 移轉是選用的，可以一次進行一個測試（或一個檔案）。若保留部分傳統語法，也不會造成任何損壞。
- **需要 Pester v6+。** `Should-*` 命令在 v5 中並不存在。
- **否定是一個獨立的命令**，而不是 `-Not` 參數：`Should -Not -Be` → `Should-NotBe`。新的斷言上沒有 `-Not` 參數。
- **實際數值仍來自管線**（`$x | Should-Be 1`）或 `-Actual`（`Should-Be -Actual $x -Expected 1`）。`-Because` 的使用保持不變。
- **大多數重新命名都是機械式的**，但有幾個有行為變更，您必須手動檢查——請參閱 [注意事項](#步驟-3--檢查行為注意事項-請勿跳過)。

## 步驟

### 步驟 1 — 尋找傳統斷言

在目標中搜尋傳統的以空格分隔的語法（特徵是 `Should -`，或是 `Should` 後接 `-Not`）：

```
Should -          # 任何傳統運算子
Should -Not -     # 否定的傳統運算子
Assert-MockCalled # 在 v6 中也已移除 -> Should-Invoke
```

將範圍限制在 PowerShell 測試檔案（`*.Tests.ps1`，`*.ps1`）。

### 步驟 2 — 套用對應關係

最常用的轉換（完整列表位於 [references/assertion-map.md](references/assertion-map.md)）：

| 傳統 (v5) | 新 (v6) |
|---|---|
| `$x \| Should -Be 1` | `$x \| Should-Be 1` |
| `$x \| Should -Not -Be 1` | `$x \| Should-NotBe 1` |
| `$x \| Should -BeExactly 'A'` | `$x \| Should-BeString 'A' -CaseSensitive` |
| `$x \| Should -BeGreaterOrEqual 2` | `$x \| Should-BeGreaterThanOrEqual 2` |
| `$x \| Should -BeLessOrEqual 2` | `$x \| Should-BeLessThanOrEqual 2` |
| `$x \| Should -BeLike 'a*'` | `$x \| Should-BeLikeString 'a*'` |
| `$x \| Should -Match 're'` | `$x \| Should-MatchString 're'` |
| `$x \| Should -BeOfType [int]` | `$x \| Should-HaveType ([int])` |
| `$x \| Should -BeNullOrEmpty` | 視情況而定——參見注意事項（無單一等價項目） |
| `$c \| Should -HaveCount 3` | `$c \| Should-BeCollection -Count 3` |
| `$c \| Should -Contain 2` | `$c \| Should-ContainCollection 2` |
| `{ ... } \| Should -Throw 'msg'` | `{ ... } \| Should-Throw -ExceptionMessage 'msg'` |
| `Should -Invoke Get-Thing` | `Should-Invoke Get-Thing` |
| `Should -InvokeVerifiable` | `Should-Invoke -Verifiable` |

### 步驟 3 — 檢查行為注意事項（請勿跳過）

這些**不能**透過簡單的重新命名來轉換。轉換前請閱讀每一項：

1. **大小寫敏感性。** 傳統的 `Should -Be` 對字串是不區分大小寫的；`Should-Be` 也是如此。但是傳統的 `Should -BeExactly`（區分大小寫）**沒有**直接的等價項目——請使用 `Should-BeString -CaseSensitive`。（`Should-Be` 永遠不區分大小寫。）相同的模式適用於 `BeLikeExactly` → `Should-BeLikeString -CaseSensitive` 和 `MatchExactly` → `Should-MatchString -CaseSensitive`。
2. **真值（Truthy）與 true。** 傳統的 `Should -BeTrue` / `-BeFalse` 接受任何*真值* / *假值*（`1`、`'x'`、`0`、`''`、`$null`、`@()`）。新的 `Should-BeTrue` / `Should-BeFalse` 是**嚴格的**（必須確切是 `$true` / `$false`）。若要保留舊的寬鬆行為，請使用 `Should-BeTruthy` / `Should-BeFalsy`。只有在數值確實是布林值時，才使用嚴格的斷言。
3. **`BeNullOrEmpty` 沒有單一的等價項目。** 根據意圖進行選擇：`$null` → `Should-BeNull`；空字串 → `Should-BeEmptyString`；空集合 → `Should-BeCollection -Count 0`；寬泛的「假值」 → `Should-BeFalsy`。否定形式 `Should -Not -BeNullOrEmpty` 也同樣拆分為 `Should-NotBeNull` / `Should-NotBeEmptyString` / `Should-NotBeWhiteSpaceString`。
4. **集合。** 傳統的 `Should -Be` 也比較陣列；新的 `Should-Be` 是一個*數值*斷言，且如果 `-Expected` 是一個集合則會**報錯**（"You provided a collection to the -Expected parameter"）。使用 `Should-BeCollection` 來比較陣列。`Should -Contain`（單一項目成員資格）→ `Should-ContainCollection`。新命令還接受預期項目的**集合**，並檢查它們是否全部存在且順序正確（`1, 2, 3 | Should-ContainCollection @(1, 2)`）。若要進行精確的整個集合等價比較，請改用 `Should-BeCollection`。
5. **管線展開。** 管線會展開輸入：數值斷言會將 `@(1)` 視為 `1`，將 `@()` 視為 `$null`，而具體類型的集合（`[int[]]`）會被重新收集為 `[object[]]`。當確切的數值或具體的集合類型很重要時（例如 `Should-HaveType`），請透過 `-Actual` 傳遞它，而不是使用管線。
6. **無 `Should-*` 等價項目。** `Should -Exist` 和 `Should -FileContentMatch*` 家族沒有新的對應項目。請保留傳統斷言，或使用 PowerShell 重寫：`Test-Path $p | Should-BeTrue`、`(Get-Content $p -Raw) | Should-MatchString 're'`。
7. **`Should -BeIn` 方向。** 沒有 `Should-BeIn`。反轉運算元：`$value | Should -BeIn $collection` → `$collection | Should-ContainCollection $value`（請注意 actual/expected 的交換），或保留傳統形式。

### 步驟 4 — 驗證

執行測試套件並確認它仍然通過（綠燈）——新訊息有所不同，但通過的測試必須保持通過：

```powershell
Invoke-Pester -Path ./tests
```

如果轉換後的斷言新產生失敗，請重新檢查上述注意事項（最常見的是第 2 點真值/假值、第 3 點 null-或-empty，或第 4 點集合）。

### 步驟 5 — （選用）強制執行新樣式

測試套件完全移轉後，可以關閉傳統語法以防其再次混入：

```powershell
$config = New-PesterConfiguration
$config.Should.DisableV5 = $true
```

設定此項後，任何殘留的 `Should -Be` 都會擲回錯誤並指向 `Should-Be` 形式。

## 輸出

摘要變更內容：修改的檔案、轉換的斷言數量、故意保留的任何傳統斷言（例如 `Should -Exist`），以及任何需要人工決策的轉換（真值/假值、null-或-empty、集合語意）。

## 參考資料

- [references/assertion-map.md](references/assertion-map.md) — 完整的運算子對應表，包含轉換前後的範例和因應措施。
- 線上命令參考：`https://pester.dev/docs/commands/Should-Be`（換入任何 `Should-*` 名稱）以獲取確切的參數和範例。
- 概念：`https://pester.dev/docs/assertions/should-command`（數值斷言 vs 集合斷言，管線 vs `-Actual`）。
- v5→v6 升級指南：`https://pester.dev/docs/migrations/v5-to-v6`。
