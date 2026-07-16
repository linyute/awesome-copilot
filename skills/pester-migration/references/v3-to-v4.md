# 移轉 Pester v3 → v4

這是最小的跨越——主要是斷言語法的重新命名。許多測試套件只需要微小的修改，有些甚至完全不需要。這在很大程度上是可以透過腳本自動化的，但請務必審閱差異並重新執行測試套件。

官方指南：https://pester.dev/docs/migrations/v3-to-v4

> 注意：如果您的目標是現代的 Pester (5 或 6)，v3→v4 只是第一步。完成此步驟、讓測試通過，然後繼續閱讀 [v4-to-v5.md](v4-to-v5.md) 和 [v5-to-v6.md](v5-to-v6.md)。

---

## 變更 1 — 帶有連字號的 `Should` 斷言語法

v4 引入了參數樣式的 `Should` 語法。無連字號的形式在 v4 中仍可執行，但在 **v5 中已被移除**，因此現在進行轉換可以省去以後的移轉工作。

```powershell
# v3 (無連字號)
It 'checks something' { 10 | Should Be 10 }

# v4+ (帶有連字號)
It 'checks something' { 10 | Should -Be 10 }
```

重新命名適用於每個運算子：`Be`、`BeExactly`、`Match`、`Throw`、`BeNullOrEmpty`、`Contain` 等。 → `-Be`、`-BeExactly`、`-Match`、`-Throw`、`-BeNullOrEmpty`、…

有一個著名的基於 AST 的轉換器 `Update-PesterTest`（Chris Dent / Wojciech Sciesinski），它透過解析檔案而不是使用規則運算式來安全地插入連字號：
https://gist.github.com/indented-automation/aeb14825e39dd8849beee44f681fbab3 ——官方 v3→v4 指南中也有轉載。審閱其輸出，特別是非 UTF-8/ASCII 檔案，因為它可能會變更編碼。

---

## 變更 2 — `Contain` → `FileContentMatch`

`Contain` 斷言已被重新命名為 `FileContentMatch`（它測試檔案**內容**，舊名稱使其與集合包含產生混淆）。

```powershell
# Should Contain      -> Should -FileContentMatch
# Should Not Contain  -> Should -Not -FileContentMatch
'app.config' | Should -FileContentMatch 'setting'
'app.config' | Should -Not -FileContentMatch 'secret'
```

官方指南中提供了一個簡單的基於規則運算式的移轉腳本（請驗證結果——它可能會產生誤判）：

```powershell
$content = Get-Content -Path $file -Encoding $encoding
$content = $content -replace 'Should\s+\-?Contain',        'Should -FileContentMatch'
$content = $content -replace 'Should\s+\-?Not\s*-?Contain', 'Should -Not -FileContentMatch'
$content = $content -replace 'Assert-VerifiableMocks',      'Assert-VerifiableMock'
$content | Set-Content -Path $file -Encoding $encoding
```

---

## 變更 3 — `Assert-VerifiableMocks` → `Assert-VerifiableMock`

重新命名了 Cmdlet（移除了結尾的 `s`）。重新命名所有出現之處。

> 在 Pester 5 中，這已被*棄用*，而在 Pester 6 中，它已被*移除*——當您繼續移轉至 v4 之後的版本時，請切換至 `Should -InvokeVerifiable`。請參閱 [v5-to-v6.md](v5-to-v6.md)。

---

## 變更 4 — 陣列斷言（注意邊界情況）

`Should` 在 v4 中獲得了陣列斷言。這對大多數測試都是透明的，但在某些邊界情況下，在 v3 下通過的陣列測試在 v4 下會失敗。如果在重新命名後有與陣列相關的測試結果發生變化，請手動檢查它，而不是強行讓它通過。背景資訊：
https://github.com/pester/Pester/issues/873

當 Pester 從函式移至別名時，模擬（Mocking）也發生了微調；不需要進行變更，但如果模擬命令的行為看起來不對，請參閱
https://github.com/pester/Pester/issues/810 和 https://github.com/pester/Pester/issues/812。

---

## v3 → v4 檢核表

- [ ] 測試套件先在 v3 上執行（基準）。
- [ ] 所有 `Should <Operator>` 轉換為 `Should -<Operator>`（建議使用 AST 轉換器）。
- [ ] `Should Contain` → `Should -FileContentMatch`（以及 `-Not` 形式）。
- [ ] `Assert-VerifiableMocks` → `Assert-VerifiableMock`。
- [ ] 手動審閱陣列斷言行為的變更。
- [ ] 任何腳本化取代都保留了檔案編碼。
- [ ] 測試套件在 v4 上通過（綠燈）；審閱差異；已提交。
