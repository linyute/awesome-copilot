# 尋找防禦性模式 (第 5 步)

防禦性程式碼模式是過去失敗或已知風險的證據。每個 Null 防護、try/catch、正規化函式和哨兵檢查 (sentinel check) 的存在都是因為出了問題 — 或者因為有人預料到會出問題。您的工作是系統性地尋找這些模式，並將其轉換為「適用性情境」(fitness-to-purpose scenarios) 和邊界測試。

## 系統化搜尋

不要略讀 — 請有條理地對程式碼庫執行 grep。確切的模式取決於專案的語言。以下是按其保護對象分組的常見防禦性程式碼指標：

**Null/nil 防護：**

| 語言 | Grep 模式 |
|---|---|
| Python | `None`, `is None`, `is not None` |
| Java | `null`, `Optional`, `Objects.requireNonNull` |
| Scala | `Option`, `None`, `.getOrElse`, `.isEmpty` |
| TypeScript | `undefined`, `null`, `??`, `?.` |
| Go | `== nil`, `!= nil`, `if err != nil` |
| Rust | `Option`, `unwrap`, `.is_none()`, `?` |

**異常/錯誤處理：**

| 語言 | Grep 模式 |
|---|---|
| Python | `except`, `try:`, `raise` |
| Java | `catch`, `throws`, `try {` |
| Scala | `Try`, `catch`, `recover`, `Failure` |
| TypeScript | `catch`, `throw`, `.catch(` |
| Go | `if err != nil`, `errors.New`, `fmt.Errorf` |
| Rust | `Result`, `Err(`, `unwrap_or`, `match` |

**內部/私有協助程式 (通常具防禦性)：**

| 語言 | Grep 模式 |
|---|---|
| Python | `def _`, `__` |
| Java/Scala | `private`, `protected` |
| TypeScript | `private`, `#` (私有欄位) |
| Go | 小寫函式名稱 (未匯出) |
| Rust | `pub(crate)`, 非 `pub` 函式 |

**哨兵值、後備方案、邊界檢查：** 搜尋 `== 0`、`< 0`、`default`、`fallback`、`else`、`match`、`switch` — 這些是跨語言通用的。

## 除了 Grep 之外還要尋找什麼

- **已修復的漏洞** — Git 歷程記錄、TODO 註解、因應措施、檢查「不應該發生」之事項的防禦性程式碼。
- **設計決策** — 解釋「為什麼」而不僅僅是「什麼」的註解。原本可以硬編碼但並未如此的設定。有其存在理由的抽象化。
- **外部資料特性** — 程式碼對來自外部系統的輸入進行正規化、驗證或拒絕的任何地方。
- **解析函式** — 每個解析器（Regex、字串分割、格式偵測）都有失敗模式。遇到格式錯誤的輸入會發生什麼？輸入為空？未預期的類型？
- **邊界條件** — 零值、空字串、最大範圍、第一個/最後一個元素、類型邊界。

## 將發現轉換為情境 (Scenarios)

針對每個防禦性模式，問自己：「這能防止什麼失敗？什麼輸入會觸發這條程式碼路徑？」

答案將成為一個適用性情境：

```markdown
### 情境 N：[易記的名稱]

**需求標籤：** [Req: inferred — from function_name() behavior] *(使用來自 SKILL.md 階段 1 步驟 1 的規範 `[Req: tier — source]` 格式)*

**發生了什麼：** [此程式碼防止的失敗模式。引用實際的函式、檔案和行號。將其框架化為漏洞分析，而非虛構的事件。]

**需求：** [程式碼必須執行什麼操作以防止此失敗。]

**如何驗證：** [如果此項退步，則會失敗的具體測試。]
```

## 將發現轉換為邊界測試

每個防禦性模式也對應到一個邊界測試：

```python
# Python (pytest)
def test_defensive_pattern_name(fixture):
    """[Req: inferred — from function_name() guard] guards against X."""
    # 變動 fixture 以觸發防禦性程式碼路徑
    # 斷言系統優雅地處理它
```

```java
// Java (JUnit 5)
@Test
@DisplayName("[Req: inferred — from methodName() guard] guards against X")
void testDefensivePatternName() {
    fixture.setField(null);  // 觸發防禦性程式碼路徑
    var result = process(fixture);
    assertNotNull(result);  // 斷言優雅地處理
}
```

```scala
// Scala (ScalaTest)
// [Req: inferred — from methodName() guard]
"defensive pattern: methodName()" should "guard against X" in {
  val input = fixture.copy(field = None)  // 觸發防禦性程式碼路徑
  val result = process(input)
  result should equal (defined)  // 斷言優雅地處理
}
```

```typescript
// TypeScript (Jest)
test('[Req: inferred — from functionName() guard] guards against X', () => {
    const input = { ...fixture, field: null };  // 觸發防禦性程式碼路徑
    const result = process(input);
    expect(result).toBeDefined();  // 斷言優雅地處理
});
```

```go
// Go (testing)
func TestDefensivePatternName(t *testing.T) {
    // [Req: inferred — from FunctionName() guard] guards against X
    t.Helper()
    fixture.Field = nil  // 觸發防禦性程式碼路徑
    result, err := Process(fixture)
    if err != nil {
        t.Fatalf("expected graceful handling, got error: %v", err)
    }
    // 斷言系統已處理它
}
```

```rust
// Rust (cargo test)
#[test]
fn test_defensive_pattern_name() {
    // [Req: inferred — from function_name() guard] guards against X
    let input = Fixture { field: None, ..default_fixture() };
    let result = process(&input);
    assert!(result.is_ok(), "expected graceful handling");
}
```

## 狀態機模式

狀態機是防禦性模式的一個特殊類別。當您發現狀態欄位、生命週期階段或模式旗標時，請完整追蹤狀態機 — 參見 SKILL.md 步驟 5a 以瞭解完整流程。

**如何尋找狀態機：**

| 語言 | Grep 模式 |
|---|---|
| Python | `status`, `state`, `phase`, `mode`, `== "running"`, `== "pending"` |
| Java | `enum.*Status`, `enum.*State`, `.getStatus()`, `switch.*status` |
| Scala | `sealed trait.*State`, `case object`, `status match` |
| TypeScript | `status:`, `state:`, `Status =`, `switch.*status` |
| Go | `Status`, `State`, `type.*Phase`, `switch.*status` |
| Rust | `enum.*State`, `enum.*Status`, `match.*state` |

**針對發現的每個狀態機：**

1. 列出每個可能的狀態值（讀取列舉或對賦值執行 grep）。
2. 對於每個檢查狀態的處理常式/取用者，驗證其是否處理了「所有」狀態。
3. 尋找您可以進入但永遠無法離開的狀態（無清理工作的終端狀態）。
4. 尋找在某個狀態下應該可用但被不完整的保護機制阻斷的操作。

## 列舉與白名單完整性 (Enumeration and Whitelist Completeness)

當函式使用 `switch`/`case`、`match`、if-else 鏈或任何分派結構來處理一組具名常數（特徵位元、列舉值、命令代碼、事件類型、權限旗標）時，請執行 **雙清單列舉檢查**：

1. **清單 A (已定義)：** 從相關的標頭檔、列舉或規格中擷取程式碼應處理的每個常數。使用 grep — 不要憑記憶列出。
2. **清單 B (已處理)：** 從分派程式碼中擷取每個 case 標籤、分支條件或 Map 索引鍵。使用 grep 或逐行讀取 — 不要摘要。
3. **Diff：** 比較這兩個清單。任何在 A 中但不在 B 中的常數都是潛在的缺口。任何在 B 中但不在 A 中的常數都是潛在的死代碼。

**為什麼這很重要：** AI 模型會可靠地對 switch/case 結構的完整性產生幻覺。模型看到一個具有許多 case 標籤的函式，看到在別處定義的常數，就斷定所有常數都已處理，而沒有實際檢查。在一個觀察到的案例中，模型斷言核心特徵位元白名單「保留了受支援的環狀傳輸位元，包括 VIRTIO_F_RING_RESET」，而該常數在 switch 中完全缺失 — 模型因為該常數存在於函式呼叫者使用的標頭中而產生了涵蓋範圍的幻覺。機械式的雙清單檢查是唯一可靠的對策。

**分類驗證探針必須產生可執行的證據。** 當分類步驟透過驗證探針確認或拒絕一個列舉發現時，僅靠文字推理是不夠的。探針必須為每個常數產生一個測試斷言，以機械式地證明該判斷：

**對於拒絕 (Rejections)**（發現是假陽性）：撰寫一個「通過」的斷言，證明稽核員的主張是錯誤的：
```python
# 拒絕證明：函式 X 確實在第 247 列檢查了 null
assert "if (ptr == NULL)" in source_of("X"), "X has null check at line 247"
```
如果您無法撰寫通過的斷言，**請不要拒絕該發現**。無法產生機械式證明本身就是該發現可能為真的證據。

**對於確認 (Confirmations)**（發現是真實漏洞）：撰寫一個「失敗」(預期失敗) 的斷言，證明漏洞存在：
```python
# 確認證明：RING_RESET 不是白名單中的 case 標籤
assert "case VIRTIO_F_RING_RESET:" in source_of("vring_transport_features"), \
    "RING_RESET should be in the switch but is not — cleared by default at line 3527"
```

**每個斷言必須引用一個確切的行號**，用於說明它所引用的證據。不是「第 3527-3528 列」，而是「第 3527 列：`default:`」 — 顯示該列實際包含的內容。

**為什麼這項規則很重要：** 在 v1.3.16 virtio 測試中，分類步驟收到了一個正確的少數派發現，即 switch/case 白名單中缺少 VIRTIO_F_RING_RESET。分類步驟執行了一個驗證探針，聲稱第 3527-3528 列「明確保留了 RING_RESET」 — 但那些列實際上包含的是 `default:` 分支。該探針產生了合規性的幻覺。如果它被要求撰寫 `assert "case VIRTIO_F_RING_RESET:" in source`，該斷言本會失敗，從而揭露幻覺。要求提供可執行的證據，會使產生幻覺的拒絕行為自取其滅。

**程式碼端清單必須從程式碼中擷取，而不是從需求中複製。** 在程式碼審查或規格稽核中執行雙清單檢查時，「已處理」清單必須直接從函式主體中擷取，並附帶各項目的行號。不要從 REQUIREMENTS.md、CONTRACTS.md、稽核提示或任何其他產出的成品中複製。如果這兩個清單（從程式碼擷取 vs. 需求聲稱）逐字相同，這就是清單被複製而非擷取的危險訊號 — 請重新執行擷取。在 v1.3.17 中，程式碼審查的「存在的 case 標籤」清單與需求清單一模一樣，證明它是被複製而非擷取的。三位規格稽核員隨後繼承了這個錯誤的清單，且無人獨立驗證。逐項行號引用可以防止這種情況：當第 3527 列實際包含 `default:` 時，您無法引用「第 3527 列：`case VIRTIO_F_RING_RESET:`」。

**機械式驗證成品優於文字清單。** 如果針對某個分派函式存在 `quality/mechanical/<函式>_cases.txt` 成品，請將其作為該函式處理內容的權威來源。不要用手寫清單替換它。如果不存在機械式成品，請在撰寫關於該函式涵蓋範圍的合約或需求之前，使用非互動式 Shell 管線（例如 `awk` + `grep`）產生一個。

**成品完整性風險：** 在 v1.3.19 測試中，模型執行了正確的 awk/grep 命令，但將其自身虛構的輸出寫入檔案，而不是讓 Shell 重新導向來擷取輸出。虛構的檔案包含一個幻覺的 `case VIRTIO_F_RING_RESET:` 行，而實際的命令並未產生該行。為了緩解此風險：`quality/mechanical/verify.sh` 會重新執行每個擷取命令並與儲存的檔案進行 diff 比較。如果任何 diff 非空，則成品被竄改過，必須重新產生。

**應用位置：** 特徵位元協商函式、協定訊息分派器、權限檢查切換器、設定選項處理常式、編解碼器/格式註冊表，以及 `default:` 或 `else` 子句會默默捨棄未識別數值的任何函式。

**將狀態機缺口轉換為情境：**

```markdown
### 情境 N：[狀態] 阻斷了 [操作]

**需求標籤：** [Req: inferred — from handler() status guard]

**發生了什麼：** [處理常式] 僅在狀態為「[允許的狀態]」時允許執行 [操作]，但系統可以進入「[缺失的狀態]」狀態 (例如，由於 [條件])。當這種情況發生時，使用者無法執行 [操作]，且透過介面沒有因應措施。

**需求：** 在使用者有合理需求的每個狀態下，[操作] 必須可用，包括 [缺失的狀態]。

**如何驗證：** 將 [實體] 設定為「[缺失的狀態]」狀態。嘗試執行 [操作]。斷言其成功，或提供具有因應措施的清晰錯誤訊息。
```

## 缺失保護機制模式

搜尋會讓使用者陷入昂貴、不可逆或長效性工作的操作，而沒有提供充足的預覽或確認：

| 模式 | 尋找目標 |
|---|---|
| 提交前資訊缺口 | 啟動批次作業、扇出擴展 (fan-out expansions) 或 API 呼叫，但未顯示預估成本、範圍或持續時間的操作 |
| 沉默擴展 | 最終工作數量直到執行階段才知曉的扇出或倍增步驟，且未顯示警告 |
| 無終止條件 | 會檢查新工作但從不檢查所有工作是否已完成的輪詢迴圈、監看程式 (watchers) 或精靈程序 (daemon processes) |
| 重試不帶退避 (backoff) | 在錯誤處理中立即重試或按固定間隔重試，而沒有使用指數退避，這會面臨頻率限制洪水 (rate limit floods) 的風險 |

**將缺失的保護機制轉換為情境：**

```markdown
### 情境 N：在執行 [操作] 之前缺少 [保護機制]

**需求標籤：** [Req: inferred — from init_run()/start_watch() behavior]

**發生了什麼：** [操作] 使使用者投入 [後果]，但未顯示 [缺失的資訊]。在實務上，一個 [範例] 在沒有任何警告的情況下從 [小數量] 扇出到 [大數量] 單位，導致了 [成本/時間後果]。

**需求：** 在投入執行 [操作] 之前，顯示 [保護機制]，說明 [使用者需要看到的內容]。

**如何驗證：** 啟動 [操作] 並斷言在到達不可逆點之前已顯示 [保護機制資訊]。
```

## 最低門檻

您應該在核心邏輯模組的每個來源檔案中找到至少 2-3 個防禦性模式。如果您發現得較少，請更仔細地閱讀函式主體 — 而不僅僅是簽章和註解。

對於中型專案（5-15 個來源檔案），預期總共能找到 15-30 個防禦性模式。每個模式都應產生至少一個邊界測試。此外，如果專案具有狀態/階段欄位，請至少追蹤一個狀態機，並檢查至少一項長效性操作是否存在缺失保護機制的情況。
