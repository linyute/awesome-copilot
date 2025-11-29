---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'search']
description: '取得 XUnit 單元測試最佳實踐，包括資料驅動測試'
---

# XUnit 最佳實踐

你的目標是協助我使用 XUnit 撰寫有效的單元測試，涵蓋標準與資料驅動測試方法。

## 專案設定

- 使用獨立的測試專案，命名規則為 `[ProjectName].Tests`
- 引用 Microsoft.NET.Test.Sdk、xunit 及 xunit.runner.visualstudio 套件
- 建立與被測試類別相對應的測試類別（例如 `CalculatorTests` 對應 `Calculator`）
- 使用 .NET SDK 測試指令：`dotnet test` 執行測試

## 測試結構

- 不需額外的測試類別屬性（不同於 MSTest/NUnit）
- 使用 `[Fact]` 屬性進行簡單測試
- 遵循 Arrange-Act-Assert（AAA）模式
- 測試命名規則：`MethodName_Scenario_ExpectedBehavior`
- 使用建構子進行初始化，`IDisposable.Dispose()` 進行清理
- 透過 `IClassFixture<T>` 於同一類別內共用測試情境
- 透過 `ICollectionFixture<T>` 於多個測試類別間共用測試情境

## 標準測試

- 測試聚焦於單一行為
- 避免在同一測試方法中測試多個行為
- 使用明確的斷言表達意圖
- 僅包含驗證該測試案例所需的斷言
- 測試需獨立且具冪等性（可任意順序執行）
- 避免測試間相互依賴

## 資料驅動測試

- 使用 `[Theory]` 搭配資料來源屬性
- 使用 `[InlineData]` 直接提供測試資料
- 使用 `[MemberData]` 由方法提供測試資料
- 使用 `[ClassData]` 由類別提供測試資料
- 實作 `DataAttribute` 建立自訂資料屬性
- 資料驅動測試中參數命名需具意義

## 斷言

- 使用 `Assert.Equal` 驗證值相等
- 使用 `Assert.Same` 驗證參考相等
- 使用 `Assert.True`/`Assert.False` 驗證布林條件
- 使用 `Assert.Contains`/`Assert.DoesNotContain` 驗證集合
- 使用 `Assert.Matches`/`Assert.DoesNotMatch` 驗證正則表達式
- 使用 `Assert.Throws<T>` 或 `await Assert.ThrowsAsync<T>` 測試例外
- 可使用 fluent assertions 函式庫提升斷言可讀性

## 模擬與隔離

- 可搭配 Moq 或 NSubstitute 使用 XUnit
- 模擬相依元件以隔離被測試單元
- 透過介面設計方便模擬
- 複雜測試情境可考慮使用 DI 容器

## 測試組織

- 依功能或元件分組測試
- 使用 `[Trait("Category", "CategoryName")]` 進行分類
- 使用 collection fixture 管理共用相依性
- 可使用 `ITestOutputHelper` 輸出測試診斷資訊
- 透過 `Skip = "reason"` 屬性條件性略過測試
