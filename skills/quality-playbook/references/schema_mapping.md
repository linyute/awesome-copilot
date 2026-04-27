# 結構描述型別對映 (步驟 5b)

如果專案具有結構描述驗證層，在撰寫邊界測試之前，您需要了解每個欄位接受什麼。不同語言常見的驗證層包括：Python 的 Pydantic 模型、JSON 結構描述 (JSON Schema)、TypeScript 的介面或 Zod 結構描述、Java 的 Bean Validation 註釋、Scala 的 case class 編解碼器或 Circe 解碼器、Rust 的 serde 屬性。如果沒有這項對映，您編寫的變動值可能會在到達您想測試的程式碼之前就被結構描述拒絕，從而產出驗證錯誤而非有意義的邊界測試。

## 為什麼這很重要

請看這個常見的錯誤範例：

```typescript
// TypeScript — 錯誤：測試的是驗證機制，而非需求
test('不良數值被拒絕', () => {
    fixture.field = 'invalid';  // Zod 結構描述在處理前即拒絕此項！
    expect(() => process(fixture)).toThrow(ZodError);
    // 這無法告訴您任何關於產出的資訊
});

// TypeScript — 正確：使用符合結構描述的變動值來測試需求
test('不良數值不應出現在產出中', () => {
    fixture.field = undefined;  // 結構描述接受選用欄位為 undefined
    const output = process(fixture);
    expect(output).not.toContain(badProperty);  // 不良資料不存在
    expect(output).toContain(expectedType);      // 其餘部分仍運作
});
```

```python
# Python — 錯誤：測試的是驗證機制，而非需求
def test_bad_value_rejected(fixture):
    fixture.field = "invalid"  # Pydantic 在處理前即拒絕此項！
    with pytest.raises(ValidationError):
        process(fixture)
    # 這無法告訴您任何關於產出的資訊

# Python — 正確：使用符合結構描述的變動值來測試需求
def test_bad_value_not_in_output(fixture):
    fixture.field = None  # 結構描述接受選用欄位為 None
    output = process(fixture)
    assert field_property not in output  # 不良資料不存在
    assert expected_type in output  # 其餘部分仍運作
```

```java
// Java — 錯誤：測試的是 Bean Validation，而非需求
@Test
void testBadValueRejected() {
    fixture.setField("invalid");  // @NotNull/@Pattern 拒絕此項！
    assertThrows(ConstraintViolationException.class, () -> process(fixture));
}

// Java — 正確：使用符合結構描述的變動值來測試需求
@Test
void testBadValueNotInOutput() {
    fixture.setField(null);  // 可為空的字串欄位接受 null
    var output = process(fixture);
    assertFalse(output.contains(badProperty));
    assertTrue(output.contains(expectedType));
}
```

```scala
// Scala — 錯誤：測試的是解碼器，而非需求
"bad value" should "be rejected" in {
    val input = fixture.copy(field = "invalid")  // Circe 解碼器失敗！
    a [DecodingFailure] should be thrownBy process(input)
}

// Scala — 正確：使用符合結構描述的變動值來測試需求
"missing optional field" should "not produce bad output" in {
    val input = fixture.copy(field = None)  // Option[String] 接受 None
    val output = process(input)
    output should not contain badProperty
}
```

```go
// Go — 錯誤：測試的是驗證，而非需求
func TestBadValueRejected(t *testing.T) {
    fixture.Field = "invalid"  // 結構體標記驗證器拒絕此項！
    _, err := Process(fixture)
    if err == nil { t.Fatal("預期會有驗證錯誤") }
    // 這無法告訴您任何關於產出的資訊
}

// Go — 正確：使用有效的零值來測試需求
func TestBadValueNotInOutput(t *testing.T) {
    fixture.Field = ""  // 零值對於選用字串欄位是有效的
    output, err := Process(fixture)
    if err != nil { t.Fatalf("非預期的錯誤：%v", err) }
    // 斷言不良資料不存在，其餘部分仍運作
}
```

```rust
// Rust — 錯誤：測試的是 serde 反序列化，而非需求
#[test]
fn test_bad_value_rejected() {
    let input = Fixture { field: "invalid".into(), ..default() };
    // serde 在處理前即拒絕此項！
    assert!(process(&input).is_err());
}

// Rust — 正確：使用符合結構描述的變動值來測試需求
#[test]
fn test_bad_value_not_in_output() {
    let input = Fixture { field: None, ..default() };  // Option<String> 接受 None
    let output = process(&input).expect("應成功");
    assert!(!output.contains(bad_property));
    assert!(output.contains(expected_type));
}
```

「錯誤」的測試會因為驗證/解碼錯誤而失敗，因為變動值不符合結構描述。「正確」的測試則使用結構描述接受的數值（null、None、nil、零值、空的 Option），以便變動後的資料能到達實際的處理邏輯。

## 如何建立對映表

針對您在步驟 5 中發現防禦性模式的每個欄位，記錄以下資訊：

| 欄位 | 結構描述型別 | 接受 | 拒絕 |
|-------|-----------|---------|---------|
| `metadata` | 選用物件 (`Optional[MetadataObject]` / `MetadataObject?` / `MetadataObject \| null`) | 有效物件, `null`/`undefined` | `string`, `number`, `array` |
| `count_field` | 選用整數 (`Optional[int]` / `number?` / `Integer`) | 整數, `null` | `string`, `object` |
| `child_list` | 物件陣列 (`List[Child]` / `Child[]` / `Seq[Child]`) | 物件陣列, `[]` | `[null, "invalid"]`, `null` |
| `optional_object` | 選用物件 | `{"key": value}`, `null` | `"bad"`, `[1,2]` |

## 選擇變動值的規則

撰寫邊界測試時，請務必使用「接受」欄位中的數值。慣用的「缺失/空」數值因語言而異：

- **選用/可為空的欄位：** Python `None`、Java `null`、Scala `None` (適用於 `Option`)、TypeScript `undefined`/`null`、Go 零值 (`""`、`0`、指標則為 `nil`)、Rust `None` (適用於 `Option<T>`)
- **數值欄位：** `0`、負值或邊界值 — 與語言無關
- **陣列/清單：** Python `[]`、Java `List.of()`、Scala `Seq.empty`、TypeScript `[]`、Go `nil` 或空切片、Rust `Vec::new()`
- **字串：** `""` (空字串) — 與語言無關
- **物件/結構體：** Python `{}`、Java `new Obj()` 但缺失欄位、Scala 搭配 `None` 的 `copy()`、TypeScript `{}`、Go 零值結構體、Rust `Default::default()` 或缺失欄位的產生器 (builder)

切勿使用「拒絕」欄位中的數值 — 它們測試的是結構描述驗證器，而非業務邏輯。

## 何時跳過此步驟

如果專案沒有結構描述驗證層（資料直接進入處理流程而不進行型別檢查），您可以跳過對映並使用任何變動值。但大多數現代專案都有某種形式的驗證，因此請先進行檢查。
