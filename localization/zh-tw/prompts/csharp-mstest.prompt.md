---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '取得 MSTest 單元測試最佳實踐，包括資料驅動測試'
---

# MSTest 最佳實踐

你的目標是協助我使用 MSTest 撰寫有效的單元測試，涵蓋標準與資料驅動測試方法。

## 專案設定

- 使用獨立的測試專案，命名慣例為 `[ProjectName].Tests`
- 引用 MSTest 套件
- 建立與被測類別相對應的測試類別（例如：`CalculatorTests` 對應 `Calculator`）
- 使用 .NET SDK 測試指令：`dotnet test` 執行測試

## 測試結構

- 測試類別使用 `[TestClass]` 屬性
- 測試方法使用 `[TestMethod]` 屬性
- 遵循 Arrange-Act-Assert（AAA）模式
- 測試命名採用 `MethodName_Scenario_ExpectedBehavior` 格式
- 使用 `[TestInitialize]` 與 `[TestCleanup]` 進行每次測試的初始化與清理
- 使用 `[ClassInitialize]` 與 `[ClassCleanup]` 進行每個類別的初始化與清理
- 使用 `[AssemblyInitialize]` 與 `[AssemblyCleanup]` 進行組件層級的初始化與清理

## 標準測試

- 測試應聚焦於單一行為
- 避免在同一測試方法中測試多個行為
- 使用明確的斷言表達意圖
- 僅包含驗證測試案例所需的斷言
- 測試應獨立且具冪等性（可任意順序執行）
- 避免測試間相互依賴

## 資料驅動測試

- 結合 `[TestMethod]` 與資料來源屬性使用
- 使用 `[DataRow]` 內嵌測試資料
- 使用 `[DynamicData]` 程式化產生測試資料
- 使用 `[TestProperty]` 為測試新增 Metadata
- 資料驅動測試請使用有意義的參數名稱

## 斷言

- 使用 `Assert.AreEqual` 檢查值相等
- 使用 `Assert.AreSame` 檢查參考相等
- 使用 `Assert.IsTrue`/`Assert.IsFalse` 檢查布林條件
- 使用 `CollectionAssert` 進行集合比較
- 使用 `StringAssert` 進行字串相關斷言
- 使用 `Assert.Throws<T>` 測試例外狀況
- 斷言應簡單明確，並提供失敗時的訊息以利釐清

## 模擬與隔離

- 可考慮搭配 Moq 或 NSubstitute 使用 MSTest
- 模擬相依物件以隔離被測單元
- 使用介面以利模擬
- 複雜測試設定可考慮使用 DI 容器

## 測試組織

- 依功能或元件分組測試
- 使用 `[TestCategory("Category")]` 指定測試分類
- 使用 `[Priority(1)]` 標示重要測試
- 使用 `[Owner("DeveloperName")]` 標示負責人
