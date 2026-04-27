# 撰寫功能測試

這是最重要的交付成果。Markdown 檔案是文件。功能測試檔案則是自動化的安全網。請使用專案的慣例來命名：`test_functional.py` (Python/pytest)、`FunctionalSpec.scala` (Scala/ScalaTest)、`FunctionalTest.java` (Java/JUnit)、`functional.test.ts` (TypeScript/Jest)、`functional_test.go` (Go) 等。

## 結構：三個測試群組

使用測試框架提供的任何結構（類別 (Python/Java)、describe 區塊 (TypeScript/Jest)、traits (Scala) 或子測試 (Go)）將測試組織成三個邏輯群組：

```
規格需求 (Spec Requirements)
    — 每個可測試的規格章節對應一個測試
    — 每個測試的文件中皆引用其所驗證的規格需求

適合性案例 (Fitness Scenarios)
    — 每個 QUALITY.md 案例對應一個測試 (1:1 對應)
    — 命名應相符：test_scenario_N_memorable_name (或對等的慣例)

邊界與邊邊角角案例 (Boundaries and Edge Cases)
    — 每個來自步驟 5 的防禦性模式對應一個測試
    — 針對空值防護、try/catch、標準化、回退 (fallbacks) 等進行測試
```

## 測試計數啟發式 (Heuristic)

**目標 = (可測試的規格章節) + (QUALITY.md 案例) + (來自步驟 5 的防禦性模式)**

範例：12 個規格章節 + 10 個案例 + 15 個防禦性模式 = 37 個測試作為目標。

對於中型專案 (5-15 個原始碼檔案)，通常會產出 35-50 個功能測試。顯著偏少可能表示遺漏了需求或探索過於淺顯。請勿為了湊數字而填充內容 — 每個測試都應實際執行專案程式碼並驗證有意義的屬性。

## 匯入模式：與現有測試保持一致

在撰寫任何測試程式碼之前，請先閱讀 2-3 個現有的測試檔案，並辨識它們如何匯入專案模組。這至關重要 — 不同的專案處理匯入的方式各異，若處理錯誤，會導致所有測試因解析錯誤而失敗。

常見的語言匯入模式：

**Python：**
- `sys.path.insert(0, "src/")` 接著使用裸匯入 (`from module import func`)
- 套件匯入 (`from myproject.module import func`)
- 使用 conftest.py 路徑操作進行相對匯入

**Java：**
- `import com.example.project.Module;` 須與套件結構相符
- 測試原始碼根目錄必須鏡像主原始碼根目錄

**Scala：**
- `import com.example.project._` 或 `import com.example.project.{ClassA, ClassB}`
- SBT 專案配置：`src/test/scala/` 鏡像 `src/main/scala/`

**TypeScript/JavaScript：**
- 使用相對路徑進行 `import { func } from '../src/module'`
- 來自 `tsconfig.json` 的路徑別名 (例如：`@/module`)

**Go：**
- 同一套件：測試檔案位於同一目錄，並使用 `package mypackage`
- 黑箱測試：使用 `package mypackage_test` 並進行明確匯入
- 內部 (internal) 套件可能需要特定的匯入路徑

**Rust：**
- 在同一個 crate 中的單元測試使用 `use crate::module::function;`
- 在 `tests/` 中的整合測試使用 `use myproject::module::function;`

無論現有測試使用何種模式，請完全照抄。請勿自行猜測或發明不同的模式。

## 在撰寫測試前建立測試設定 (Setup)

每個測試框架都有共享設定的機制。如果您的測試使用共享的 fixture 或測試資料，您「必須」在撰寫測試之前先建立設定檔案。測試框架不會自動從其他目錄發掘 fixture。

**各語言對應如下：**

**Python (pytest)：** 建立 `quality/conftest.py` 來定義每個 fixture。`tests/conftest.py` 中的 fixture 「不」提供給 `quality/test_functional.py` 使用。偏好做法：撰寫測試時使用 `tmp_path` 以內嵌方式建立資料，以消除對 conftest 的依賴。

**Java (JUnit)：** 在測試類別中使用 `@BeforeEach`/`@BeforeAll` 方法，或在同一個套件中建立共享的 `TestFixtures` 公用程式類別。

**Scala (ScalaTest)：** 混入一個帶有 `before`/`after` 區塊的 trait，或使用內嵌資料產生器。如果使用 SBT，請確保測試檔案位於正確的原始碼樹中。

**TypeScript (Jest)：** 在測試檔案中使用 `beforeAll`/`beforeEach`，或建立一個帶有工廠函式的 `quality/testUtils.ts`。

**Go (testing)：** 在同一個 `_test.go` 檔案中使用帶有 `t.Helper()` 的輔助函式。使用 `t.TempDir()` 建立暫存目錄。Go 的慣例強烈偏好內嵌設定 — 避免共享測試狀態。

**Rust (cargo test)：** 在 `#[cfg(test)] mod tests` 區塊或 `test_utils.rs` 模組中使用輔助函式。使用產生器 (builder) 模式來建構測試資料。對於整合測試，請將檔案放在 `tests/` 目錄下。

**規則：每個被引用的 fixture 或測試輔助工具都必須被定義。** 如果測試依賴於不存在的共享設定，測試會在設定階段報錯 (而非在斷言階段失敗) — 這會產出看起來通過但實際上已損壞的測試。

**所有語言的偏好方法：** 撰寫能以內嵌方式建立自身資料的測試。這可以消除跨檔案依賴：

```python
# Python
def test_config_validation(tmp_path):
    config = {"pipeline": {"name": "Test", "steps": [...]}}
```

```java
// Java
@Test
void testConfigValidation(@TempDir Path tempDir) {
    var config = Map.of("pipeline", Map.of("name", "Test"));
}
```

```typescript
// TypeScript
test('config validation', () => {
    const config = { pipeline: { name: 'Test', steps: [] } };
});
```

```go
// Go
func TestConfigValidation(t *testing.T) {
    tmpDir := t.TempDir()
    config := Config{Pipeline: Pipeline{Name: "Test"}}
}
```

```rust
// Rust
#[test]
fn test_config_validation() {
    let config = Config { pipeline: Pipeline { name: "Test".into() } };
}
```

**撰寫完所有測試後，執行測試套件並檢查是否有設定錯誤。** 無論框架如何分類，設定錯誤 (找不到 fixture、匯入失敗) 都算作損壞的測試。

## 不要使用佔位符 (Placeholder) 測試

每個測試都必須匯入並呼叫實際的專案程式碼。如果測試本體是 `pass`，或者其唯一的斷言是 `assert isinstance(errors, list)`，或者它檢查的是微不足道的屬性（如 `assert hasattr(cls, 'validate')`），請將其刪除並撰寫真正的測試或乾脆捨棄它。不執行專案程式碼的測試比沒有測試更糟 — 它會膨脹計數並產生虛假的信心。

如果您確實無法為某個防禦性模式撰寫有意義的測試 (例如：它需要執行中的伺服器或外部服務)，請在註釋中註明它是不可測試的，而不是撰寫佔位符測試。

## 在撰寫前閱讀：函式呼叫對映表

在撰寫單一測試之前，請先建立函式呼叫對映表。對於您計劃測試的每個函式：

1. **閱讀函式/方法特徵標記** — 不僅是名稱，還要閱讀每個參數、其型別與預設值。在 Python 中，請閱讀 `def` 行與型別提示。在 Java 中，請閱讀方法特徵標記與泛型。在 Scala 中，請閱讀方法定義與隱含 (implicit) 參數。在 TypeScript 中，請閱讀型別標註。
2. **閱讀說明文件** — docstrings, Javadoc, TSDoc, ScalaDoc。它們通常會指定回傳型別、例外以及邊界情況行為。
3. **閱讀一個呼叫它的現有測試** — 現有測試會向您展示確切的呼叫慣例、fixture 形狀以及斷言模式。
4. **閱讀實際資料檔案** — 如果函式處理組態、結構描述或資料檔案，請閱讀專案中的實際檔案。您的測試 fixture 必須與此形狀完全匹配。

**常見的失敗模式：** 代理程式探索架構，在概念上理解了函式的作用，然後根據猜測的參數撰寫測試呼叫。測試失敗的原因是真正的函式接收的是 `(config, items_data, limit)` 而非 `(items, seed, strategy)`。閱讀實際的特徵標記只需花費 5 秒鐘，卻能完全防止此類問題。

**函式庫版本感知：** 檢查專案的相依項清單 (`requirements.txt`, `build.sbt`, `package.json`, `pom.xml`, `build.gradle`, `Cargo.toml`) 以驗證可用的內容。針對選用相依項使用測試框架的跳過機制：Python `pytest.importorskip()`、JUnit `Assumptions.assumeTrue()`、ScalaTest `assume()`、Jest 條件式 `describe.skip`、Go `t.Skip()`、Rust `#[ignore]` 並附上說明前提條件的註釋。

## 撰寫源自規格的測試

逐章閱讀每份規格文件。針對每個章節，詢問：「這陳述了什麼可測試的需求？」然後撰寫測試。

每個測試都應：
1. **設定 (Set up)** — 載入 fixture、建立測試資料、配置系統
2. **執行 (Execute)** — 呼叫函式、執行管線、發送請求
3. **斷言規格要求的特定屬性**

```python
# Python (pytest)
class TestSpecRequirements:
    def test_requirement_from_spec_section_N(self, fixture):
        """[Req: 正式 — 設計文件 §N] X 應該產出 Y。"""
        result = process(fixture)
        assert result.property == expected_value
```

```java
// Java (JUnit 5)
class SpecRequirementsTest {
    @Test
    @DisplayName("[Req: 正式 — 設計文件 §N] X 應該產出 Y")
    void testRequirementFromSpecSectionN() {
        var result = process(fixture);
        assertEquals(expectedValue, result.getProperty());
    }
}
```

```scala
// Scala (ScalaTest)
class SpecRequirements extends FlatSpec with Matchers {
  // [Req: 正式 — 設計文件 §N] X 應該產出 Y
  "Section N requirement" should "produce Y from X" in {
    val result = process(fixture)
    result.property should equal (expectedValue)
  }
}
```

```typescript
// TypeScript (Jest)
describe('Spec Requirements', () => {
  test('[Req: 正式 — 設計文件 §N] X 應該產出 Y', () => {
    const result = process(fixture);
    expect(result.property).toBe(expectedValue);
  });
});
```

```go
// Go (testing)
func TestSpecRequirement_SectionN_XProducesY(t *testing.T) {
    // [Req: 正式 — 設計文件 §N] X 應該產出 Y
    result := Process(fixture)
    if result.Property != expectedValue {
        t.Errorf("預期 %v，得到 %v", expectedValue, result.Property)
    }
}
```

```rust
// Rust (cargo test)
#[test]
fn test_spec_requirement_section_n_x_produces_y() {
    // [Req: 正式 — 設計文件 §N] X 應該產出 Y
    let result = process(&fixture);
    assert_eq!(result.property, expected_value);
}
```

## 什麼是良好的功能測試

- **可追溯 (Traceable)** — 測試名稱、顯示名稱或文件註釋說明了它驗證的是哪項規格需求
- **具體 (Specific)** — 檢查特定的屬性，而不僅僅是「發生了某些事」
- **穩健 (Robust)** — 使用真實資料 (來自實際系統的 fixture)，而非合成資料
- **跨變體 (Cross-variant)** — 如果專案處理多種輸入類型，請測試所有類型
- **在正確的層級進行測試** — 測試您關心的「行為」。如果需求是「無效資料不應產生錯誤產出」，請測試管線產出 — 不要僅測試結構描述驗證器拒絕了輸入。

## 跨變體測試策略

如果專案處理多種輸入類型，跨變體涵蓋率是隱藏細微錯誤的地方。目標應為約 30% 的測試能練習所有變體 — 確切的百分比並不重要，重要的是確保每個橫切屬性都在所有變體中得到測試。

使用您框架的參數化機制：

```python
# Python (pytest)
@pytest.mark.parametrize("variant", [variant_a, variant_b, variant_c])
def test_feature_works(variant):
    output = process(variant.input)
    assert output.has_expected_property
```

```java
// Java (JUnit 5)
@ParameterizedTest
@MethodSource("variantProvider")
void testFeatureWorks(Variant variant) {
    var output = process(variant.getInput());
    assertTrue(output.hasExpectedProperty());
}
```

```scala
// Scala (ScalaTest)
Seq(variantA, variantB, variantC).foreach { variant =>
  it should s"work for ${variant.name}" in {
    val output = process(variant.input)
    output should have ('expectedProperty (true))
  }
}
```

```typescript
// TypeScript (Jest)
test.each([variantA, variantB, variantC])(
  'feature works for %s', (variant) => {
    const output = process(variant.input);
    expect(output).toHaveProperty('expectedProperty');
});
```

```go
// Go (testing) — 表格驅動測試
func TestFeatureWorksAcrossVariants(t *testing.T) {
    variants := []Variant{variantA, variantB, variantC}
    for _, v := range variants {
        t.Run(v.Name, func(t *testing.T) {
            output := Process(v.Input)
            if !output.HasExpectedProperty() {
                t.Errorf("變體 %s：缺少預期屬性", v.Name)
            }
        })
    }
}
```

```rust
// Rust (cargo test) — 反覆運算案例
#[test]
fn test_feature_works_across_variants() {
    let variants = [variant_a(), variant_b(), variant_c()];
    for v in &variants {
        let output = process(&v.input);
        assert!(output.has_expected_property(),
            "變體 {}：缺少預期屬性", v.name);
    }
}
```

如果參數化不適用，請在單個測試中明確使用迴圈。

**哪些測試應該是跨變體的？** 任何驗證無論輸入類型為何皆應「維持不變」之屬性的測試：實體身分、結構完整性、必要的連結、時間欄位、領域特定語義。

**撰寫完所有測試後，進行跨變體稽核。** 計算跨變體測試除以總測試數的比例。如果低於 30%，請轉換更多測試。

## 應避免的反模式

這些模式看起來像測試，但無法捕捉真正的錯誤：

- **僅檢查存在性 (Existence-only checks)** — 找到一個正確的結果並不代表所有結果都是正確的。也應檢查計數或進行全面驗證。
- **僅進行存在斷言 (Presence-only assertions)** — 斷言一個值存在僅證明其存在，而非正確性。請斷言其實際數值。
- **單一變體測試 (Single-variant testing)** — 僅測試一種輸入類型並期望其他類型也能運作。請使用參數化測試。
- **僅進行正面測試 (Positive-only testing)** — 您必須測試無效輸入「不會」產生不良產出。
- **不完整的負面斷言** — 在測試拒絕行為時，請斷言「所有」後果皆不存在，而不僅僅是一個。
- **捕捉例外而非檢查產出** — 測試程式碼以特定方式崩潰，並非測試它正確地處理了輸入。請測試產出結果。

### 例外捕捉反模式詳解

```java
// Java — 錯誤：測試的是驗證機制
@Test
void testBadValueRejected() {
    fixture.setField("invalid");  // 結構描述拒絕此項！
    assertThrows(ValidationException.class, () -> process(fixture));
    // 這無法告訴您任何關於產出的資訊
}

// Java — 正確：測試需求
@Test
void testBadValueNotInOutput() {
    fixture.setField(null);  // 結構描述接受 Optional 為 null
    var output = process(fixture);
    assertFalse(output.contains(badProperty));  // 不良資料不存在
    assertTrue(output.contains(expectedType));   // 其餘部分仍運作
}
```

```scala
// Scala — 錯誤：測試的是解碼器，而非需求
"bad value" should "be rejected" in {
  val input = fixture.copy(field = "invalid")  // Circe 解碼器失敗！
  a [DecodingFailure] should be thrownBy process(input)
  // 這無法告訴您任何關於產出的資訊
}

// Scala — 正確：測試需求
"missing optional field" should "not produce bad output" in {
  val input = fixture.copy(field = None)  // Option[String] 接受 None
  val output = process(input)
  output should not contain badProperty  // 不良資料不存在
  output should contain (expectedType)   // 其餘部分仍運作
}
```

```typescript
// TypeScript — 錯誤：測試的是驗證機制
test('bad value rejected', () => {
    fixture.field = 'invalid';  // Zod 結構描述在處理前即拒絕此項！
    expect(() => process(fixture)).toThrow(ZodError);
    // 這無法告訴您任何關於產出的資訊
});

// TypeScript — 正確：測試需求，使用符合結構描述的變動
test('bad value not in output', () => {
    fixture.field = undefined;  // 結構描述接受選用欄位為 undefined
    const output = process(fixture);
    expect(output).not.toContain(badProperty);  // 不良資料不存在
    expect(output).toContain(expectedType);      // 其餘部分仍運作
});
```

```python
# Python — 錯誤：測試的是驗證機制
def test_bad_value_rejected(fixture):
    fixture.field = "invalid"  # Pydantic 在處理前即拒絕此項！
    with pytest.raises(ValidationError):
        process(fixture)
    # 這無法告訴您任何關於產出的資訊

# Python — 正確：測試需求，使用符合結構描述的變動
def test_bad_value_not_in_output(fixture):
    fixture.field = None  # 結構描述接受 Optional 欄位為 None
    output = process(fixture)
    assert field_property not in output  # 不良資料不存在
    assert expected_type in output  # 其餘部分仍運作
```

```go
// Go — 錯誤：測試的是錯誤，而非結果
func TestBadValueRejected(t *testing.T) {
    fixture.Field = "invalid"  // 驗證器拒絕此項！
    _, err := Process(fixture)
    if err == nil { t.Fatal("預期會有錯誤") }
    // 這無法告訴您任何關於產出的資訊
}

// Go — 正確：測試需求
func TestBadValueNotInOutput(t *testing.T) {
    fixture.Field = ""  // 零值是有效的
    output, err := Process(fixture)
    if err != nil { t.Fatalf("非預期的錯誤：%v", err) }
    if containsBadProperty(output) { t.Error("不良資料應不存在") }
    if !containsExpectedType(output) { t.Error("預期資料應存在") }
}
```

```rust
// Rust — 錯誤：測試的是錯誤，而非結果
#[test]
fn test_bad_value_rejected() {
    let input = Fixture { field: "invalid".into(), ..default() };
    assert!(process(&input).is_err());  // 這無法告訴您任何關於產出的資訊
}

// Rust — 正確：測試需求
#[test]
fn test_bad_value_not_in_output() {
    let input = Fixture { field: None, ..default() };  // Option 接受 None
    let output = process(&input).expect("應成功");
    assert!(!output.contains(bad_property));  // 不良資料不存在
    assert!(output.contains(expected_type));   // 其餘部分仍運作
}
```

在選擇變動值時，請務必檢查您在步驟 5b 建立的結構描述對映表。每個變動都必須使用結構描述接受的數值。

## 在正確的層級進行測試

詢問：「*規格*說應該發生什麼事？」規格說「無效資料不應出現在產出中」 — 而非「結構描述驗證層應拒絕它」。請測試規格，而非測試實作。

**例外情況：** 當規格明確要求特定機制時 (例如：「必須在結構描述層級快速失敗」)，測試該機制才是合適的。但這種情況很少見。

## 適合使用案例測試

為 QUALITY.md 中的每個案例撰寫一個測試。這是一對一的對映：

```scala
// Scala (ScalaTest)
class FitnessScenarios extends FlatSpec with Matchers {
  // [Req: 正式 — QUALITY.md 案例 1]
  "Scenario 1: [名稱]" should "prevent [失敗模式]" in {
    val result = process(fixture)
    result.property should equal (expectedValue)
  }
}
```

```python
# Python (pytest)
class TestFitnessScenarios:
    """來自 QUALITY.md 的適合使用案例測試。"""

    def test_scenario_1_memorable_name(self, fixture):
        """[Req: 正式 — QUALITY.md 案例 1] [名稱]。
        需求：[程式碼必須執行的操作]。
        """
        result = process(fixture)
        assert condition_that_prevents_the_failure
```

```java
// Java (JUnit 5)
class FitnessScenariosTest {
    @Test
    @DisplayName("[Req: 正式 — QUALITY.md 案例 1] [名稱]")
    void testScenario1MemorableName() {
        var result = process(fixture);
        assertTrue(conditionThatPreventsFailure(result));
    }
}
```

```typescript
// TypeScript (Jest)
describe('Fitness Scenarios', () => {
  test('[Req: 正式 — QUALITY.md 案例 1] [名稱]', () => {
    const result = process(fixture);
    expect(conditionThatPreventsFailure(result)).toBe(true);
  });
});
```

```go
// Go (testing)
func TestScenario1_MemorableName(t *testing.T) {
    // [Req: 正式 — QUALITY.md 案例 1] [名稱]
    // 需求：[程式碼必須執行的操作]
    result := Process(fixture)
    if !conditionThatPreventsFailure(result) {
        t.Error("案例 1 失敗：[描述預期行為]")
    }
}
```

```rust
// Rust (cargo test)
#[test]
fn test_scenario_1_memorable_name() {
    // [Req: 正式 — QUALITY.md 案例 1] [名稱]
    // 需求：[程式碼必須執行的操作]
    let result = process(&fixture);
    assert!(condition_that_prevents_the_failure(&result));
}
```

## 邊界與負面測試

針對步驟 5 中的每個防禦性模式撰寫一個測試：

```typescript
// TypeScript (Jest)
describe('Boundaries and Edge Cases', () => {
  test('[Req: 推論 — 源自 functionName() 防護] 防範 X', () => {
    const input = { ...validFixture, field: null };
    const result = process(input);
    expect(result).not.toContainBadOutput();
  });
});
```

```python
# Python (pytest)
class TestBoundariesAndEdgeCases:
    """針對邊界條件、格式錯誤的輸入、錯誤處理的測試。"""

    def test_defensive_pattern_name(self, fixture):
        """[Req: 推論 — 源自 function_name() 防護] 防範 X。"""
        # 變動以觸發防禦性程式碼路徑
        # 斷言優雅處理
```

```java
// Java (JUnit 5)
class BoundariesAndEdgeCasesTest {
    @Test
    @DisplayName("[Req: 推論 — 源自 methodName() 防護] 防範 X")
    void testDefensivePatternName() {
        fixture.setField(null);  // 觸發防禦性程式碼路徑
        var result = process(fixture);
        assertNotNull(result);  // 斷言優雅處理
        assertFalse(result.containsBadData());
    }
}
```

```scala
// Scala (ScalaTest)
class BoundariesAndEdgeCases extends FlatSpec with Matchers {
  // [Req: 推論 — 源自 methodName() 防護]
  "defensive pattern: methodName()" should "guard against X" in {
    val input = fixture.copy(field = None)  // 觸發防禦性程式碼路徑
    val result = process(input)
    result should equal (defined)
    result.get should not contain badData
  }
}
```

```go
// Go (testing)
func TestDefensivePattern_FunctionName_GuardsAgainstX(t *testing.T) {
    // [Req: 推論 — 源自 FunctionName() 防護] 防範 X
    input := defaultFixture()
    input.Field = nil  // 觸發防禦性程式碼路徑
    result, err := Process(input)
    if err != nil {
        t.Fatalf("預期能優雅處理，但得到：%v", err)
    }
    // 斷言即使是邊緣案例輸入，結果仍有效
}
```

```rust
// Rust (cargo test)
#[test]
fn test_defensive_pattern_function_name_guards_against_x() {
    // [Req: 推論 — 源自 function_name() 防護] 防範 X
    let input = Fixture { field: None, ..default_fixture() };
    let result = process(&input).expect("預期能優雅處理");
    // 斷言即使是邊緣案例輸入，結果仍有效
}
```

在選擇變動值時，請使用您的步驟 5b 結構描述對映表。每個變動都必須使用結構描述接受的數值。

系統性方法：
- **缺失欄位** — 選用欄位缺失？設為 null。
- **錯誤型別** — 欄位得到不同的型別？使用結構描述接受的替代型別。
- **空值** — 空清單？空字串？空字典？
- **邊界值** — 零、負值、最大值、第一個、最後一個。
- **跨模組邊界** — 模組 A 產出異常但有效的產出 — 模組 B 是否能處理？

如果您發現了 10 個以上的防禦性模式，但僅撰寫了 4 個邊界測試，請回去撰寫更多測試。目標比例為 1:1。
