---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '獲取 MSTest 3.x/4.x 單元測試的最佳實務，包含現代化斷言 API 和資料驅動測試'
---

# MSTest 最佳實務 (MSTest 3.x/4.x)

您的目標是協助我使用現代化的 MSTest 撰寫有效的單元測試，並使用目前的 API 和最佳實務。

## 專案設定

- 使用獨立的測試專案，命名慣例為 `[專案名稱].Tests`
- 參考 MSTest 3.x+ NuGet 套件 (包含分析器)
- 考慮使用 MSTest.Sdk 以簡化專案設定
- 使用 `dotnet test` 執行測試

## 測試類別結構

- 對測試類別使用 `[TestClass]` 屬性
- **預設將測試類別標記為 sealed**，以提升效能與設計清晰度
- 對測試方法使用 `[TestMethod]` (優於 `[DataTestMethod]`)
- 遵循 Arrange-Act-Assert (AAA) 模式
- 使用 `方法名稱_情境_預期行為` 模式命名測試

```csharp
[TestClass]
public sealed class CalculatorTests
{
    [TestMethod]
    public void Add_TwoPositiveNumbers_ReturnsSum()
    {
        // Arrange
        var calculator = new Calculator();

        // Act
        var result = calculator.Add(2, 3);

        // Assert
        Assert.AreEqual(5, result);
    }
}
```

## 測試生命週期

- **偏好使用建構函式而非 `[TestInitialize]`** - 支援 `readonly` 欄位並遵循標準 C# 模式
- 使用 `[TestCleanup]` 進行即使測試失敗也必須執行的清理工作
- 當需要非同步設定時，結合建構函式與非同步的 `[TestInitialize]`

```csharp
[TestClass]
public sealed class ServiceTests
{
    private readonly MyService _service;  // 由建構函式支援 readonly

    public ServiceTests()
    {
        _service = new MyService();
    }

    [TestInitialize]
    public async Task InitAsync()
    {
        // 僅用於非同步初始化
        await _service.WarmupAsync();
    }

    [TestCleanup]
    public void Cleanup() => _service.Reset();
}
```

### 執行順序

1. **組件初始化** - `[AssemblyInitialize]` (每個測試組件一次)
2. **類別初始化** - `[ClassInitialize]` (每個測試類別一次)
3. **測試初始化** (針對每個測試方法):
   1. 建構函式
   2. 設定 `TestContext` 屬性
   3. `[TestInitialize]`
4. **測試執行** - 執行測試方法
5. **測試清理** (針對每個測試方法):
   1. `[TestCleanup]`
   2. `DisposeAsync` (若有實作)
   3. `Dispose` (若有實作)
6. **類別清理** - `[ClassCleanup]` (每個測試類別一次)
7. **組件清理** - `[AssemblyCleanup]` (每個測試組件一次)

## 現代化斷言 API

MSTest 提供三個斷言類別：`Assert`、`StringAssert` 和 `CollectionAssert`。

### Assert 類別 - 核心斷言

```csharp
// 相等性
Assert.AreEqual(expected, actual);
Assert.AreNotEqual(notExpected, actual);
Assert.AreSame(expectedObject, actualObject);      // 參考相等性
Assert.AreNotSame(notExpectedObject, actualObject);

// Null 檢查
Assert.IsNull(value);
Assert.IsNotNull(value);

// 布林值
Assert.IsTrue(condition);
Assert.IsFalse(condition);

// 失敗/不確定 (Inconclusive)
Assert.Fail("測試失敗，原因為...");
Assert.Inconclusive("測試無法完成，因為...");
```

### 例外狀況測試 (優於 `[ExpectedException]`)

```csharp
// Assert.Throws - 比對 TException 或衍生類別
var ex = Assert.Throws<ArgumentException>(() => Method(null));
Assert.AreEqual("Value cannot be null.", ex.Message);

// Assert.ThrowsExactly - 僅比對精確類別
var ex = Assert.ThrowsExactly<InvalidOperationException>(() => Method());

// 非同步版本
var ex = await Assert.ThrowsAsync<HttpRequestException>(async () => await client.GetAsync(url));
var ex = await Assert.ThrowsExactlyAsync<InvalidOperationException>(async () => await Method());
```

### 集合斷言 (Assert 類別)

```csharp
Assert.Contains(expectedItem, collection);
Assert.DoesNotContain(unexpectedItem, collection);
Assert.ContainsSingle(collection);  // 恰好一個元素
Assert.HasCount(5, collection);
Assert.IsEmpty(collection);
Assert.IsNotEmpty(collection);
```

### 字串斷言 (Assert 類別)

```csharp
Assert.Contains("expected", actualString);
Assert.StartsWith("prefix", actualString);
Assert.EndsWith("suffix", actualString);
Assert.DoesNotStartWith("prefix", actualString);
Assert.DoesNotEndWith("suffix", actualString);
Assert.MatchesRegex(@"\d{3}-\d{4}", phoneNumber);
Assert.DoesNotMatchRegex(@"\d+", textOnly);
```

### 比較斷言

```csharp
Assert.IsGreaterThan(lowerBound, actual);
Assert.IsGreaterThanOrEqualTo(lowerBound, actual);
Assert.IsLessThan(upperBound, actual);
Assert.IsLessThanOrEqualTo(upperBound, actual);
Assert.IsInRange(actual, low, high);
Assert.IsPositive(number);
Assert.IsNegative(number);
```

### 類別斷言

```csharp
// MSTest 3.x - 使用 out 參數
Assert.IsInstanceOfType<MyClass>(obj, out var typed);
typed.DoSomething();

// MSTest 4.x - 直接傳回具類別結果
var typed = Assert.IsInstanceOfType<MyClass>(obj);
typed.DoSomething();

Assert.IsNotInstanceOfType<WrongType>(obj);
```

### Assert.That (MSTest 4.0+)

```csharp
Assert.That(result.Count > 0);  // 在失敗訊息中自動擷取運算式
```

### StringAssert 類別

> **注意：** 當有對應的 `Assert` 類別可用時，偏好使用之 (例如：使用 `Assert.Contains("expected", actual)` 優於 `StringAssert.Contains(actual, "expected")`)。

```csharp
StringAssert.Contains(actualString, "expected");
StringAssert.StartsWith(actualString, "prefix");
StringAssert.EndsWith(actualString, "suffix");
StringAssert.Matches(actualString, new Regex(@"\d{3}-\d{4}"));
StringAssert.DoesNotMatch(actualString, new Regex(@"\d+"));
```

### CollectionAssert 類別

> **注意：** 當有對應的 `Assert` 類別可用時，偏好使用之 (例如：`Assert.Contains`)。

```csharp
// 包含性
CollectionAssert.Contains(collection, expectedItem);
CollectionAssert.DoesNotContain(collection, unexpectedItem);

// 相等性 (相同元素，相同順序)
CollectionAssert.AreEqual(expectedCollection, actualCollection);
CollectionAssert.AreNotEqual(unexpectedCollection, actualCollection);

// 等價性 (相同元素，任意順序)
CollectionAssert.AreEquivalent(expectedCollection, actualCollection);
CollectionAssert.AreNotEquivalent(unexpectedCollection, actualCollection);

// 子集檢查
CollectionAssert.IsSubsetOf(subset, superset);
CollectionAssert.IsNotSubsetOf(notSubset, collection);

// 元素驗證
CollectionAssert.AllItemsAreInstancesOfType(collection, typeof(MyClass));
CollectionAssert.AllItemsAreNotNull(collection);
CollectionAssert.AllItemsAreUnique(collection);
```

## 資料驅動測試

### DataRow

```csharp
[TestMethod]
[DataRow(1, 2, 3)]
[DataRow(0, 0, 0, DisplayName = "Zeros")]
[DataRow(-1, 1, 0, IgnoreMessage = "Known issue #123")]  // MSTest 3.8+
public void Add_ReturnsSum(int a, int b, int expected)
{
    Assert.AreEqual(expected, Calculator.Add(a, b));
}
```

### DynamicData

資料來源可以傳回以下任何類型：

- `IEnumerable<(T1, T2, ...)>` (ValueTuple) - **偏好使用**，提供型別安全性 (MSTest 3.7+)
- `IEnumerable<Tuple<T1, T2, ...>>` - 提供型別安全性
- `IEnumerable<TestDataRow>` - 提供型別安全性，並可控制測試 Metadata (顯示名稱、分類)
- `IEnumerable<object[]>` - **最不偏好**，無型別安全性

> **注意：** 建立新的測試資料方法時，偏好使用 `ValueTuple` 或 `TestDataRow` 而非 `IEnumerable<object[]>`。`object[]` 方法不提供編譯時期的型別檢查，且可能因型別不符導致執行階段錯誤。

```csharp
[TestMethod]
[DynamicData(nameof(TestData))]
public void DynamicTest(int a, int b, int expected)
{
    Assert.AreEqual(expected, Calculator.Add(a, b));
}

// ValueTuple - 偏好使用 (MSTest 3.7+)
public static IEnumerable<(int a, int b, int expected)> TestData =>
[
    (1, 2, 3),
    (0, 0, 0),
];

// TestDataRow - 當您需要自訂顯示名稱或 Metadata 時
public static IEnumerable<TestDataRow<(int a, int b, int expected)>> TestDataWithMetadata =>
[
    new((1, 2, 3)) { DisplayName = "Positive numbers" },
    new((0, 0, 0)) { DisplayName = "Zeros" },
    new((-1, 1, 0)) { DisplayName = "Mixed signs", IgnoreMessage = "Known issue #123" },
];

// IEnumerable<object[]> - 新程式碼應避免使用 (無型別安全性)
public static IEnumerable<object[]> LegacyTestData =>
[
    [1, 2, 3],
    [0, 0, 0],
];
```

## TestContext

`TestContext` 類別提供測試執行資訊、取消支援及輸出方法。
完整的參考請參閱 [TestContext 說明文件](https://learn.microsoft.com/dotnet/core/testing/unit-testing-mstest-writing-tests-testcontext)。

### 存取 TestContext

```csharp
// 屬性 (MSTest 會隱藏 CS8618 - 請勿使用可為 null 或 = null!)
public TestContext TestContext { get; set; }

// 建構函式插入 (MSTest 3.6+) - 為不可變性之偏好做法
[TestClass]
public sealed class MyTests
{
    private readonly TestContext _testContext;

    public MyTests(TestContext testContext)
    {
        _testContext = testContext;
    }
}

// 靜態方法將其作為參數接收
[ClassInitialize]
public static void ClassInit(TestContext context) { }

// 清理方法可選用 (MSTest 3.6+)
[ClassCleanup]
public static void ClassCleanup(TestContext context) { }

[AssemblyCleanup]
public static void AssemblyCleanup(TestContext context) { }
```

### 取消權杖 (Cancellation Token)

務必將 `TestContext.CancellationToken` 用於與 `[Timeout]` 配合的協作式取消：

```csharp
[TestMethod]
[Timeout(5000)]
public async Task LongRunningTest()
{
    await _httpClient.GetAsync(url, TestContext.CancellationToken);
}
```

### 測試執行屬性

```csharp
TestContext.TestName              // 目前測試方法名稱
TestContext.TestDisplayName       // 顯示名稱 (3.7+)
TestContext.CurrentTestOutcome    // 通過/失敗/進行中
TestContext.TestData              // 參數化測試資料 (3.7+，於 TestInitialize/Cleanup)
TestContext.TestException         // 測試失敗時的例外狀況 (3.7+，於 TestCleanup)
TestContext.DeploymentDirectory   // 包含部署項目的目錄
```

### 輸出與結果檔案

```csharp
// 寫入測試輸出 (用於偵錯)
TestContext.WriteLine("Processing item {0}", itemId);

// 將檔案附加至測試結果 (記錄、螢幕擷取畫面)
TestContext.AddResultFile(screenshotPath);

// 在測試方法間儲存/擷取資料
TestContext.Properties["SharedKey"] = computedValue;
```

## 進階功能

### 針對不穩定測試 (Flaky Tests) 的重試 (MSTest 3.9+)

```csharp
[TestMethod]
[Retry(3)]
public void FlakyTest() { }
```

### 條件式執行 (MSTest 3.10+)

根據作業系統或 CI 環境略過或執行測試：

```csharp
// 作業系統專屬測試
[TestMethod]
[OSCondition(OperatingSystems.Windows)]
public void WindowsOnlyTest() { }

[TestMethod]
[OSCondition(OperatingSystems.Linux | OperatingSystems.MacOS)]
public void UnixOnlyTest() { }

[TestMethod]
[OSCondition(ConditionMode.Exclude, OperatingSystems.Windows)]
public void SkipOnWindowsTest() { }

// CI 環境測試
[TestMethod]
[CICondition]  // 僅在 CI 中執行 (預設：ConditionMode.Include)
public void CIOnlyTest() { }

[TestMethod]
[CICondition(ConditionMode.Exclude)]  // 在 CI 中略過，於本地執行
public void LocalOnlyTest() { }
```

### 並行化

```csharp
// 組件層級
[assembly: Parallelize(Workers = 4, Scope = ExecutionScope.MethodLevel)]

// 針對特定類別停用
[TestClass]
[DoNotParallelize]
public sealed class SequentialTests { }
```

### 工作項目可追溯性 (MSTest 3.8+)

將測試連結至工作項目，以便在測試報表中進行追溯：

```csharp
// Azure DevOps 工作項目
[TestMethod]
[WorkItem(12345)]  // 連結至工作項目 #12345
public void Feature_Scenario_ExpectedBehavior() { }

// 多個工作項目
[TestMethod]
[WorkItem(12345)]
[WorkItem(67890)]
public void Feature_CoversMultipleRequirements() { }

// GitHub Issues (MSTest 3.8+)
[TestMethod]
[GitHubWorkItem("https://github.com/owner/repo/issues/42")]
public void BugFix_Issue42_IsResolved() { }
```

工作項目關聯會出現在測試結果中，並可用於：
- 追蹤需求涵蓋範圍
- 將錯誤修正連結至迴歸測試
- 在 CI/CD 管線中產生可追溯性報表

## 應避免的常見錯誤

```csharp
// ❌ 錯誤的參數順序
Assert.AreEqual(actual, expected);
// ✅ 正確
Assert.AreEqual(expected, actual);

// ❌ 使用 ExpectedException (已過時)
[ExpectedException(typeof(ArgumentException))]
// ✅ 使用 Assert.Throws
Assert.Throws<ArgumentException>(() => Method());

// ❌ 使用 LINQ Single() - 例外狀況不明確
var item = items.Single();
// ✅ 使用 ContainsSingle - 失敗訊息較佳
var item = Assert.ContainsSingle(items);

// ❌ 強制轉型 - 例外狀況不明確
var handler = (MyHandler)result;
// ✅ 類別斷言 - 失敗時顯示實際類別
var handler = Assert.IsInstanceOfType<MyHandler>(result);

// ❌ 忽略取消權杖
await client.GetAsync(url, CancellationToken.None);
// ✅ 傳遞測試取消權杖
await client.GetAsync(url, TestContext.CancellationToken);

// ❌ 將 TestContext 設為可為 null - 導致不必要的 null 檢查
public TestContext? TestContext { get; set; }
// ❌ 使用 null! - MSTest 已針對此屬性隱藏 CS8618
public TestContext TestContext { get; set; } = null!;
// ✅ 宣告時不使用可為 null 或初始化設定 - MSTest 會處理該警告
public TestContext TestContext { get; set; }
```

## 測試組織

- 依功能或元件將測試分組
- 使用 `[TestCategory("分類名稱")]` 進行篩選
- 使用 `[TestProperty("名稱", "值")]` 設定自訂 Metadata (例如：`[TestProperty("Bug", "12345")]`)
- 對關鍵測試使用 `[Priority(1)]`
- 啟用相關的 MSTest 分析器 (MSTEST0020 以偏好建構函式)

## 模擬 (Mocking) 與隔離

- 使用 Moq 或 NSubstitute 模擬相依性
- 使用介面以利於模擬
- 模擬相依性以隔離受測單位
