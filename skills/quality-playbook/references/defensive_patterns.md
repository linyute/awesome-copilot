# 尋找防禦性模式 (步驟 5)

防禦性程式碼模式是過去失敗或已知風險的證據。每個空值 (null) 防護、try/catch、標準化函式以及哨兵值 (sentinel) 檢查之所以存在，都是因為曾出過問題 — 或因為有人預見到會出問題。您的任務是系統地尋找這些模式，並將其轉換為「適合使用」案例與邊界測試。

## 系統性搜尋

不要只是略讀 — 應有方法地對程式碼庫執行 grep 搜尋。確切的模式取決於專案所使用的語言。以下是常見的防禦性程式碼指標，按其保護對象分組：

**空值 (Null/nil) 防護：**

| 語言 | Grep 模式 |
|---|---|
| Python | `None`, `is None`, `is not None` |
| Java | `null`, `Optional`, `Objects.requireNonNull` |
| Scala | `Option`, `None`, `.getOrElse`, `.isEmpty` |
| TypeScript | `undefined`, `null`, `??`, `?.` |
| Go | `== nil`, `!= nil`, `if err != nil` |
| Rust | `Option`, `unwrap`, `.is_none()`, `?` |

**例外/錯誤處理：**

| 語言 | Grep 模式 |
|---|---|
| Python | `except`, `try:`, `raise` |
| Java | `catch`, `throws`, `try {` |
| Scala | `Try`, `catch`, `recover`, `Failure` |
| TypeScript | `catch`, `throw`, `.catch(` |
| Go | `if err != nil`, `errors.New`, `fmt.Errorf` |
| Rust | `Result`, `Err(`, `unwrap_or`, `match` |

**內部/私有輔助工具 (通常具有防禦性)：**

| 語言 | Grep 模式 |
|---|---|
| Python | `def _`, `__` |
| Java/Scala | `private`, `protected` |
| TypeScript | `private`, `#` (私有欄位) |
| Go | 小寫函式名稱 (未匯出) |
| Rust | `pub(crate)`, 非 `pub` 函式 |

**哨兵值、回退 (fallbacks)、邊界檢查：** 搜尋 `== 0`, `< 0`, `default`, `fallback`, `else`, `match`, `switch` — 這些與語言無關。

## 除 grep 以外應尋找的內容

- **已修正的錯誤** — Git 歷史記錄、TODO 註釋、因應措施、檢查「不應該發生」的事情之防禦性程式碼
- **設計決策** — 解釋「為什麼」而不僅是「是什麼」的註釋。本可以寫死但卻未寫死的組態。有特定存在理由的抽象。
- **外部資料特性** — 程式碼中任何對外部系統輸入進行標準化、驗證或拒絕的地方
- **解析函式** — 每個解析器 (正規表示式、字串分割、格式偵測) 都有失敗模式。遇到格式錯誤的輸入會發生什麼事？空輸入呢？非預期的型別呢？
- **邊界條件** — 零值、空字串、最大範圍、第一個/最後一個元素、型別邊界

## 將發現轉換為案例

針對每個防禦性模式，詢問：「此舉防止了什麼失敗？什麼樣的輸入會觸發此程式碼路徑？」

答案將成為一個「適合使用」案例：

```markdown
### 案例 N：[好記的名稱]

**需求標記：** [Req: 推論 — 源自 function_name() 行為] *(使用來自 SKILL.md 第一階段步驟 1 的規範 `[Req: 等級 — 來源]` 格式)*

**發生了什麼：** [此程式碼防止的失敗模式。參考實際函式、檔案與行號。將其架構成漏洞分析，而非編造事件。]

**需求：** [程式碼必須執行什麼操作以防止此失敗。]

**如何驗證：** [若此項退化則會失敗的具體測試。]
```

## 將發現轉換為邊界測試

每個防禦性模式也對應到一個邊界測試：

```python
# Python (pytest)
def test_defensive_pattern_name(fixture):
    """[Req: 推論 — 源自 function_name() 防護] 防範 X。"""
    # 變動 fixture 以觸發防禦性程式碼路徑
    # 斷言系統能夠優雅處理
```

```java
// Java (JUnit 5)
@Test
@DisplayName("[Req: 推論 — 源自 methodName() 防護] 防範 X")
void testDefensivePatternName() {
    fixture.setField(null);  // 觸發防禦性程式碼路徑
    var result = process(fixture);
    assertNotNull(result);  // 斷言優雅處理
}
```

```scala
// Scala (ScalaTest)
// [Req: 推論 — 源自 methodName() 防護]
"defensive pattern: methodName()" should "guard against X" in {
  val input = fixture.copy(field = None)  // 觸發防禦性程式碼路徑
  val result = process(input)
  result should equal (defined)  // 斷言優雅處理
}
```

```typescript
// TypeScript (Jest)
test('[Req: 推論 — 源自 functionName() 防護] 防範 X', () => {
    const input = { ...fixture, field: null };  // 觸發防禦性程式碼路徑
    const result = process(input);
    expect(result).toBeDefined();  // 斷言優雅處理
});
```

```go
// Go (testing)
func TestDefensivePatternName(t *testing.T) {
    // [Req: 推論 — 源自 FunctionName() 防護] 防範 X
    t.Helper()
    fixture.Field = nil  // 觸發防禦性程式碼路徑
    result, err := Process(fixture)
    if err != nil {
        t.Fatalf("預期能優雅處理，但得到錯誤：%v", err)
    }
    // 斷言系統已處理
}
```

```rust
// Rust (cargo test)
#[test]
fn test_defensive_pattern_name() {
    // [Req: 推論 — 源自 function_name() 防護] 防範 X
    let input = Fixture { field: None, ..default_fixture() };
    let result = process(&input);
    assert!(result.is_ok(), "預期能優雅處理");
}
```

## 狀態機模式

狀態機是防禦性模式的一個特殊類別。當您發現狀態欄位、生命週期階段或模式旗標時，請完整追蹤狀態機 — 詳情請參閱 SKILL.md 步驟 5a。

**如何尋找狀態機：**

| 語言 | Grep 模式 |
|---|---|
| Python | `status`, `state`, `phase`, `mode`, `== "running"`, `== "pending"` |
| Java | `enum.*Status`, `enum.*State`, `.getStatus()`, `switch.*status` |
| Scala | `sealed trait.*State`, `case object`, `status match` |
| TypeScript | `status:`, `state:`, `Status =`, `switch.*status` |
| Go | `Status`, `State`, `type.*Phase`, `switch.*status` |
| Rust | `enum.*State`, `enum.*Status`, `match.*state` |

**對於發現的每個狀態機：**

1. 列出每個可能的狀態值 (讀取列舉 enum 或 grep 搜尋賦值處)
2. 對於每個檢查狀態的處理器/取用端，驗證它是否處理了「所有」狀態
3. 尋找您可以進入但永遠無法離開的狀態 (無清理程序的終端狀態)
4. 尋找在特定狀態下本應可用但被不完整的防護所阻擋的操作

**將狀態機缺漏轉換為案例：**

```markdown
### 案例 N：[狀態] 阻礙了 [操作]

**需求標記：** [Req: 推論 — 源自 handler() 狀態防護]

**發生了什麼：** [處理器] 僅在狀態為「[允許的狀態]」時允許 [操作]，但系統可能會進入「[缺失的狀態]」狀態 (例如：由於 [條件])。當這種情況發生時，使用者無法執行 [操作]，且無法透過介面找到替代方案。

**需求：** 在使用者合理需要該操作的所有狀態下 (包括 [缺失的狀態])，[操作] 必須可用。

**如何驗證：** 將 [實體] 設定為「[缺失的狀態]」狀態。嘗試執行 [操作]。斷言其成功或提供帶有替代方案的清晰錯誤訊息。
```

## 缺失安全防護模式

搜尋那些會在沒有充分預覽或確認的情況下，執行昂貴、不可逆或耗時工作的操作：

| 模式 | 尋找內容 |
|---|---|
| 提交前資訊缺口 | 啟動批次作業、分散式擴張 (fan-out) 或 API 呼叫，卻未顯示預估成本、範圍或持續時間的操作 |
| 隱性擴張 | 分散式分發或乘法步驟，最終工作數量直到執行時才知曉，且未顯示任何警告 |
| 無終止條件 | 輪詢迴圈、監視程式或背景程序，它們會檢查新工作但從不檢查所有工作是否已完成 |
| 無退避的重試 | 在發生錯誤時立即重試或固定間隔重試，而未使用指數退避 (exponential backoff)，存在導致速率限制洪泛的風險 |

**將缺失的安全防護轉換為案例：**

```markdown
### 案例 N：在 [操作] 之前缺少 [安全防護]

**需求標記：** [Req: 推論 — 源自 init_run()/start_watch() 行為]

**發生了什麼：** [操作] 會讓使用者承擔 [後果]，卻未顯示 [缺失的資訊]。在實務上，一個 [範例] 從 [小數量] 分散式擴張到 [大數量] 個單位，卻沒有任何警告，導致了 [成本/時間後果]。

**需求：** 在提交 [操作] 之前，顯示包含 [使用者需要看到的內容] 的 [安全防護]。

**如何驗證：** 發啟 [操作] 並斷言在到達不可逆轉點之前顯示了 [安全防護資訊]。
```

## 最低標準

您應該在核心邏輯模組的每個原始碼檔案中發現至少 2-3 個防禦性模式。如果您發現得較少，請更仔細地閱讀函式本體 — 而不僅僅是特徵標記與註釋。

對於中型專案 (5-15 個原始碼檔案)，預期總共會發現 15-30 個防禦性模式。每個模式都應產生至少一個邊界測試。此外，如果專案具有狀態/狀態欄位，請追蹤至少一個狀態機，並檢查至少一個長效操作是否缺少安全防護。
