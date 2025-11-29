---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '取得 NUnit 單元測試最佳實踐，包括資料驅動測試'
---

# NUnit 最佳實踐

你的目標是協助我使用 NUnit 撰寫有效的單元測試，涵蓋標準與資料驅動測試方法。

## 專案設定

- 使用獨立的測試專案，命名慣例為 `[ProjectName].Tests`
- 引用 Microsoft.NET.Test.Sdk、NUnit 及 NUnit3TestAdapter 套件
- 建立與被測類別相對應的測試類別（例如：`CalculatorTests` 對應 `Calculator`）
- 使用 .NET SDK 測試指令：`dotnet test` 執行測試

## 測試結構

- 測試類別加上 `[TestFixture]` 屬性
- 測試方法加上 `[Test]` 屬性
- 遵循 Arrange-Act-Assert（AAA）模式
- 測試命名採用 `MethodName_Scenario_ExpectedBehavior` 格式
- 使用 `[SetUp]` 與 `[TearDown]` 進行每次測試的初始化與清理
- 使用 `[OneTimeSetUp]` 與 `[OneTimeTearDown]` 進行每個類別的初始化與清理
- 使用 `[SetUpFixture]` 進行組件層級的初始化與清理

## 標準測試

- 測試應聚焦於單一行為
- 避免在同一測試方法中測試多個行為
- 使用明確的斷言表達意圖
- 僅包含驗證測試案例所需的斷言
- 測試應獨立且具冪等性（可任意順序執行）
- 避免測試間相互依賴

## 資料驅動測試

- 使用 `[TestCase]` 內嵌測試資料
- 使用 `[TestCaseSource]` 程式化產生測試資料
- 使用 `[Values]` 進行簡單參數組合
- 使用 `[ValueSource]` 以屬性或方法作為資料來源
- 使用 `[Random]` 產生隨機數值測試資料
- 使用 `[Range]` 產生連續數值測試資料
- 使用 `[Combinatorial]` 或 `[Pairwise]` 組合多個參數

## 斷言

- 優先使用 `Assert.That` 搭配約束模型（NUnit 標準風格）
- 使用 `Is.EqualTo`、`Is.SameAs`、`Contains.Item` 等約束
- 簡單值相等可用 `Assert.AreEqual`（經典風格）
- 使用 `CollectionAssert` 進行集合比較
- 使用 `StringAssert` 進行字串相關斷言
- 使用 `Assert.Throws<T>` 或 `Assert.ThrowsAsync<T>` 測試例外狀況
- 斷言請提供描述性訊息以利釐清失敗原因

## 模擬與隔離

- 可考慮搭配 Moq 或 NSubstitute 使用 NUnit
- 模擬相依物件以隔離被測單元
- 使用介面以利模擬
- 複雜測試設定可考慮使用 DI 容器

## 測試組織

- 依功能或元件分組測試
- 使用 `[Category("CategoryName")]` 指定分類
- 必要時使用 `[Order]` 控制測試執行順序
- 使用 `[Author("DeveloperName")]` 標示負責人
- 使用 `[Description]` 補充測試資訊
- 不希望自動執行的測試可用 `[Explicit]`
- 暫時跳過測試請用 `[Ignore("Reason")]`
