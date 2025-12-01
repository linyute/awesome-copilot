---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '取得 TUnit 單元測試最佳實踐，包括資料驅動測試'
---

# TUnit 最佳實踐

你的目標是協助我使用 TUnit 撰寫有效的單元測試，涵蓋標準與資料驅動測試方法。

## 專案設定

- 使用獨立的測試專案，命名慣例為 `[ProjectName].Tests`
- 引用 TUnit 套件及 TUnit.Assertions 以支援 fluent 斷言
- 建立與被測類別相對應的測試類別（例如：`CalculatorTests` 對應 `Calculator`）
- 使用 .NET SDK 測試指令：`dotnet test` 執行測試
- TUnit 需 .NET 8.0 或以上版本

## 測試結構

- 不需測試類別屬性（如 xUnit/NUnit）
- 測試方法使用 `[Test]` 屬性（非 xUnit 的 `[Fact]`）
- 遵循 Arrange-Act-Assert（AAA）模式
- 測試命名採用 `MethodName_Scenario_ExpectedBehavior` 格式
- 生命週期掛鉤：使用 `[Before(Test)]` 初始化、`[After(Test)]` 清理
- 使用 `[Before(Class)]` 與 `[After(Class)]` 於類別間共用上下文
- 使用 `[Before(Assembly)]` 與 `[After(Assembly)]` 於所有測試類別共用上下文
- TUnit 支援進階生命週期掛鉤如 `[Before(TestSession)]` 與 `[After(TestSession)]`

## 標準測試

- 測試應聚焦於單一行為
- 避免在同一測試方法中測試多個行為
- 使用 TUnit 的 fluent 斷言語法 `await Assert.That()`
- 僅包含驗證測試案例所需的斷言
- 測試應獨立且具冪等性（可任意順序執行）
- 避免測試間相互依賴（如需可用 `[DependsOn]` 屬性）

## 資料驅動測試

- 使用 `[Arguments]` 屬性內嵌測試資料（等同 xUnit 的 `[InlineData]`）
- 使用 `[MethodData]` 方法型測試資料（等同 xUnit 的 `[MemberData]`）
- 使用 `[ClassData]` 類別型測試資料
- 實作 `ITestDataSource` 建立自訂資料來源
- 資料驅動測試請使用有意義的參數名稱
- 同一測試方法可套用多個 `[Arguments]` 屬性

## 斷言

- 使用 `await Assert.That(value).IsEqualTo(expected)` 檢查值相等
- 使用 `await Assert.That(value).IsSameReferenceAs(expected)` 檢查參考相等
- 使用 `await Assert.That(value).IsTrue()` 或 `await Assert.That(value).IsFalse()` 檢查布林條件
- 使用 `await Assert.That(collection).Contains(item)` 或 `await Assert.That(collection).DoesNotContain(item)` 檢查集合
- 使用 `await Assert.That(value).Matches(pattern)` 進行正則表達式比對
- 使用 `await Assert.That(action).Throws<TException>()` 或 `await Assert.That(asyncAction).ThrowsAsync<TException>()` 測試例外
- 斷言可用 `.And` 鏈結：`await Assert.That(value).IsNotNull().And.IsEqualTo(expected)`
- 可用 `.Or` 表示替代條件：`await Assert.That(value).IsEqualTo(1).Or.IsEqualTo(2)`
- 使用 `.Within(tolerance)` 於 DateTime 與數值比對容差
- 所有斷言皆為非同步，必須 await

## 進階功能

- 使用 `[Repeat(n)]` 重複執行測試
- 使用 `[Retry(n)]` 失敗自動重試
- 使用 `[ParallelLimit<T>]` 控制平行執行上限
- 使用 `[Skip("reason")]` 條件性跳過測試
- 使用 `[DependsOn(nameof(OtherTest))]` 建立測試依賴
- 使用 `[Timeout(milliseconds)]` 設定測試逾時
- 擴充 TUnit 基底屬性建立自訂屬性

## 測試組織

- 依功能或元件分組測試
- 使用 `[Category("CategoryName")]` 分類測試
- 使用 `[DisplayName("Custom Test Name")]` 自訂測試名稱
- 可考慮使用 `TestContext` 取得診斷與資訊
- 使用自訂條件屬性如 `[WindowsOnly]` 進行平台專屬測試

## 效能與平行執行

- TUnit 預設平行執行測試（xUnit 需明確設定）
- 使用 `[NotInParallel]` 禁用特定測試平行執行
- 使用 `[ParallelLimit<T>]` 搭配自訂上限類別控制平行度
- 同一類別內測試預設序列執行
- 搭配 `[Repeat(n)]` 與 `[ParallelLimit<T>]` 可進行負載測試

## xUnit 移植

- 將 `[Fact]` 換成 `[Test]`
- 將 `[Theory]` 換成 `[Test]` 並用 `[Arguments]` 傳遞資料
- 將 `[InlineData]` 換成 `[Arguments]`
- 將 `[MemberData]` 換成 `[MethodData]`
- 將 `Assert.Equal` 換成 `await Assert.That(actual).IsEqualTo(expected)`
- 將 `Assert.True` 換成 `await Assert.That(condition).IsTrue()`
- 將 `Assert.Throws<T>` 換成 `await Assert.That(action).Throws<T>()`
- 將建構子/IDisposable 換成 `[Before(Test)]`/`[After(Test)]`
- 將 `IClassFixture<T>` 換成 `[Before(Class)]`/`[After(Class)]`

**為什麼選擇 TUnit 而非 xUnit？**

TUnit 提供現代化、快速且彈性的測試體驗，具備 xUnit 所沒有的進階功能，如非同步斷言、更細緻的生命週期掛鉤，以及更強大的資料驅動測試能力。TUnit 的 fluent 斷言讓測試驗證更清晰易懂，特別適合複雜的 .NET 專案。
