# Pester `Should -*` → `Should-*` 完整斷言對應表

從傳統 Pester v5 斷言到 Pester v6 `Should-*` 斷言的完整逐一運算子對應。此處的每個簽章都取自 Pester v6 命令參考。若要獲取具有權威性且最新的參數與範例，請開啟 `https://pester.dev/docs/commands/<Name>`（例如 `.../Should-Be`）。

以下使用的慣例：
- `$x` = 實際值（透過管線傳遞，或透過 `-Actual` 傳遞）。
- 純粹的重新命名代表：將 `Should -Operator` 變更為 `Should-Operator` 並保留管線/參數。其他任何變更都將特別指出。

---

## 等價 / 比較

| 傳統 v5 | Pester v6 | 備註 |
|---|---|---|
| `$x \| Should -Be 1` | `$x \| Should-Be 1` | 在兩者中對字串均不區分大小寫（`-eq` 語意）。 |
| `$x \| Should -Not -Be 1` | `$x \| Should-NotBe 1` | 否定是其自身的命令。 |
| `$x \| Should -BeExactly 'A'` | `$x \| Should-BeString 'A' -CaseSensitive` | `Should-Be` 是**不**區分大小寫的；請使用 `Should-BeString -CaseSensitive`。 |
| `$x \| Should -Not -BeExactly 'A'` | `$x \| Should-NotBeString 'A' -CaseSensitive` | |
| `$x \| Should -BeGreaterThan 1` | `$x \| Should-BeGreaterThan 1` | 純粹重新命名。 |
| `$x \| Should -BeGreaterOrEqual 1` | `$x \| Should-BeGreaterThanOrEqual 1` | **已重新命名** (`...ThanOrEqual`)。 |
| `$x \| Should -BeLessThan 1` | `$x \| Should-BeLessThan 1` | 純粹重新命名。 |
| `$x \| Should -BeLessOrEqual 1` | `$x \| Should-BeLessThanOrEqual 1` | **已重新命名** (`...ThanOrEqual`)。 |

沒有否定的比較命令（例如沒有 `Should-NotBeGreaterThan`）。需要時，請使用相反的運算子（`Should-BeLessThanOrEqual`）反轉邏輯。

---

## 字串（模式 / 規則運算式 / 空格）

| 傳統 v5 | Pester v6 | 備註 |
|---|---|---|
| `$x \| Should -BeLike 'a*'` | `$x \| Should-BeLikeString 'a*'` | 萬用字元比對，預設不區分大小寫。 |
| `$x \| Should -BeLikeExactly 'a*'` | `$x \| Should-BeLikeString 'a*' -CaseSensitive` | |
| `$x \| Should -Not -BeLike 'a*'` | `$x \| Should-NotBeLikeString 'a*'` | |
| `$x \| Should -Match 're'` | `$x \| Should-MatchString 're'` | 規則運算式比對，預設不區分大小寫。 |
| `$x \| Should -MatchExactly 're'` | `$x \| Should-MatchString 're' -CaseSensitive` | |
| `$x \| Should -Not -Match 're'` | `$x \| Should-NotMatchString 're'` | |

`Should-BeString` 還提供了 `-IgnoreWhitespace` 和 `-TrimWhitespace`，以及專用的 `Should-BeEmptyString`、`Should-NotBeEmptyString` 和 `Should-NotBeWhiteSpaceString` 用於空值/空格檢查（無 v5 等價項目——它們取代了字串上的 `BeNullOrEmpty` 樣式檢查）。

---

## 布林 / 真值 (Truthiness)

傳統的 `BeTrue`/`BeFalse` 是**真值/假值**檢查。新的同名命令是**嚴格的**（僅限 `$true`/`$false`）。請審慎選擇：

| 傳統 v5 | Pester v6（保留行為） | Pester v6（嚴格布林值） |
|---|---|---|
| `$x \| Should -BeTrue` | `$x \| Should-BeTruthy` | `$x \| Should-BeTrue` |
| `$x \| Should -BeFalse` | `$x \| Should-BeFalsy` | `$x \| Should-BeFalse` |

`Should-BeFalsy` 對 `$false`、`0`、`''`、`$null`、`@()` 都會通過。如果測試的值確實是布林值，請偏好嚴格的 `Should-BeTrue` / `Should-BeFalse`。

---

## Null / 空值

`Should -BeNullOrEmpty` 將多種檢查合併為一個；v6 將它們拆分。請依據值的實際情況進行選擇：

| 意圖 | 傳統 v5 | Pester v6 |
|---|---|---|
| 值為 `$null` | `$x \| Should -BeNullOrEmpty` | `$x \| Should-BeNull` |
| 空字串 | `'' \| Should -BeNullOrEmpty` | `'' \| Should-BeEmptyString` |
| 空集合 | `@() \| Should -BeNullOrEmpty` | `@() \| Should-BeCollection -Count 0` |
| 任何假值 (falsy) | `$x \| Should -BeNullOrEmpty` | `$x \| Should-BeFalsy` |
| 非 null | `$x \| Should -Not -BeNullOrEmpty` | `$x \| Should-NotBeNull` |
| 非空字串 | `$x \| Should -Not -BeNullOrEmpty` | `$x \| Should-NotBeEmptyString` |
| 非 null/空值/空格 | `$x \| Should -Not -BeNullOrEmpty` | `$x \| Should-NotBeWhiteSpaceString` |

若有疑問且類型混合時，`Should-BeFalsy` / `Should-NotBeNull` 是最接近的寬泛等價項目——但特定類型的斷言能提供更好的訊息。

---

## 類型

| 傳統 v5 | Pester v6 | 備註 |
|---|---|---|
| `$x \| Should -BeOfType [int]` | `$x \| Should-HaveType ([int])` | |
| `$x \| Should -BeOfType 'System.Int32'` | `$x \| Should-HaveType ([System.Int32])` | 新形式需要**類型字面值（Type literal）**，而不是字串類型名稱。 |
| `$x \| Should -Not -BeOfType [int]` | `$x \| Should-NotHaveType ([int])` | |

對於具體類型的集合，管線展開會將 `[int[]]` 轉變為 `[object[]]`。請使用 `-Actual` 以保留真實類型：`Should-HaveType -Actual ([int[]](1,2)) -Expected ([int[]])`。

---

## 集合

| 傳統 v5 | Pester v6 | 備註 |
|---|---|---|
| `$c \| Should -Be @(1,2,3)` | `$c \| Should-BeCollection @(1,2,3)` | `Should-Be` 對於 `-Expected` 為集合時會報錯；請針對陣列使用 `Should-BeCollection`。 |
| `$c \| Should -HaveCount 3` | `$c \| Should-BeCollection -Count 3` | |
| `$c \| Should -Contain 2` | `$c \| Should-ContainCollection 2` | 成員資格。傳遞單一項目，或傳遞一個集合 (`@(1, 2)`) 以要求多個項目依序存在。 |
| `$c \| Should -Not -Contain 2` | `$c \| Should-NotContainCollection 2` | |
| `$v \| Should -BeIn $c` | `$c \| Should-ContainCollection $v` | 無 `Should-BeIn`；運算元對調（實際值變成集合）。 |

`Should-ContainCollection` 檢查預期的項目是否存在於實際集合中且順序正確。傳遞單一項目（`$c | Should-ContainCollection 2`）或傳遞集合以同時要求多個項目（`1, 2, 3 | Should-ContainCollection @(1, 2)`）。若要進行精確的整個集合等價比較，請使用 `Should-BeCollection`。

新的組合斷言沒有 v5 等價項目，但在移轉中非常方便：
`$c | Should-All { $_ | Should-BeGreaterThan 0 }` 和 `$c | Should-Any { ... }`。

---

## 例外狀況 (Exceptions)

| 傳統 v5 | Pester v6 | 備註 |
|---|---|---|
| `{ ... } \| Should -Throw` | `{ ... } \| Should-Throw` | 純粹重新命名。 |
| `{ ... } \| Should -Throw 'msg'` | `{ ... } \| Should-Throw -ExceptionMessage 'msg'` | 參數名稱從 `-ExpectedMessage` **重新命名**為 `-ExceptionMessage`。支援 `-like` 萬用字元。 |
| `{ ... } \| Should -Throw -ErrorId 'X'` | `{ ... } \| Should-Throw -FullyQualifiedErrorId 'X'` | 參數**重新命名**。 |
| `{ ... } \| Should -Throw -ExceptionType ([T])` | `{ ... } \| Should-Throw -ExceptionType ([T])` | 相同。 |
| `{ ... } \| Should -Not -Throw` | `& { ... }; <不需要擲回斷言>` | 沒有 `Should-NotThrow`；不應擲回例外狀況的指令碼區段直接執行即可。改為斷言其結果，或保留傳統的 `Should -Not -Throw`。 |

`Should-Throw` 新增了 `-AllowNonTerminatingError` 並傳回錯誤記錄以供進一步斷言：`$err = { throw 'boom' } | Should-Throw; $err.Exception.Message | Should-BeString '*boom*'`。

---

## 模擬 (Mocks)

| 傳統 v5 | Pester v6 | 備註 |
|---|---|---|
| `Should -Invoke Get-Thing` | `Should-Invoke Get-Thing` | 純粹重新命名。 |
| `Should -Invoke Get-Thing -Times 2 -Exactly` | `Should-Invoke Get-Thing -Times 2 -Exactly` | 相同的參數。 |
| `Should -Invoke Get-Thing -ParameterFilter { ... }` | `Should-Invoke Get-Thing -ParameterFilter { ... }` | 相同。 |
| `Should -Not -Invoke Get-Thing` | `Should-NotInvoke Get-Thing` | 獨立的命令。 |
| `Should -InvokeVerifiable` | `Should-Invoke -Verifiable` | 合併到 `-Verifiable` 參數集中。 |

`Assert-MockCalled` / `Assert-VerifiableMock` 已在 v6 中完全移除——請將它們同樣對應到 `Should-Invoke` / `Should-Invoke -Verifiable`。

---

## 命令中繼資料

| 傳統 v5 | Pester v6 | 備註 |
|---|---|---|
| `Get-Command f \| Should -HaveParameter X -Mandatory` | `Get-Command f \| Should-HaveParameter X -Mandatory` | 純粹重新命名。 |
| `... \| Should -HaveParameter X -Type String` | `... \| Should-HaveParameter X -Type ([String])` | 建議使用類型字面值。 |
| `... \| Should -HaveParameter X -DefaultValue 8` | `... \| Should-HaveParameter X -DefaultValue 8` | 相同。 |
| `... \| Should -Not -HaveParameter X` | `... \| Should-NotHaveParameter X` | 獨立的命令。 |

---

## 無 `Should-*` 等價項目（保留傳統或重寫）

這些 v5 運算子**沒有**新的斷言。將它們保留為傳統的 `Should -...`（兩種語法可以並存），或者使用 PowerShell 搭配新的斷言進行重寫：

| 傳統 v5 | v6 中的因應措施 |
|---|---|
| `$p \| Should -Exist` | `Test-Path $p \| Should-BeTrue` |
| `$p \| Should -FileContentMatch 're'` | `(Get-Content $p -Raw) \| Should-MatchString 're'` |
| `$p \| Should -FileContentMatchExactly 're'` | `(Get-Content $p -Raw) \| Should-MatchString 're' -CaseSensitive` |
| `$p \| Should -FileContentMatchMultiline 're'` | `(Get-Content $p -Raw) \| Should-MatchString 're'` |
| `$p \| Should -FileContentMatchMultilineExactly 're'` | `(Get-Content $p -Raw) \| Should-MatchString 're' -CaseSensitive` |

（搭配 `Get-Content -Raw`，規則運算式中的 `^` 和 `$` 會比對整個檔案的開頭/結尾，符合多行比對運算子的行為。）

---

## 無 v5 對應項目的新 v6 斷言

移轉時值得使用；它們通常能取代複雜的傳統組合：

- `Should-BeSame` / `Should-NotBeSame` — 參考等價性（同一個執行個體）。
- `Should-BeEquivalent` — 遞迴、逐屬性的物件比較。
- `Should-BeHashtable` — 斷言雜湊表/有序字典的圖形、鍵和計數。
- `Should-BeBefore` / `Should-BeAfter` — `[datetime]` 排序。
- `Should-BeFasterThan` / `Should-BeSlowerThan` — `[timespan]` / `[scriptblock]` 計時。
- `Should-All` / `Should-Any` — 對每個項目執行篩選器或巢狀的 `Should-*`。
