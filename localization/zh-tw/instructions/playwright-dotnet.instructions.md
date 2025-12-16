---
description: 'Playwright .NET 測試建立指示'
applyTo: '**'
---

# Playwright .NET 測試建立指示

## 測試撰寫指南

### 程式碼品質標準

- **定位器 (Locators)**：優先使用面向使用者、基於角色的定位器 (`GetByRole`、`GetByLabel`、`GetByText` 等)，以提高彈性和可訪問性。使用 `await Test.StepAsync()` 將互動分組，並改善測試可讀性和報告。
- **斷言 (Assertions)**：使用自動重試的網頁優先斷言。這些斷言使用 Playwright 斷言中的 `Expect()` (例如，`await Expect(locator).ToHaveTextAsync()`)。除非明確測試可見性變更，否則避免檢查可見性。
- **逾時 (Timeouts)**：依賴 Playwright 內建的自動等待機制。避免硬編碼的等待或增加預設逾時。
- **清晰度 (Clarity)**：使用描述性的測試和步驟標題，清楚說明意圖。僅添加註解以解釋複雜邏輯或不明顯的互動。

### 測試結構

- **Using 指令 (Usings)**：以 `using Microsoft.Playwright;` 開頭，並使用 `using Microsoft.Playwright.Xunit;` 或 `using Microsoft.Playwright.NUnit;` 或 `using Microsoft.Playwright.MSTest;` 適用於 MSTest。
- **組織 (Organization)**：建立繼承自 `PageTest` 的測試類別 (在 NUnit、xUnit 和 MSTest 套件中可用)，或針對 xUnit 使用 `IClassFixture<PlaywrightFixture>` 和自訂 fixtures。將相關功能的測試分組在同一個測試類別中。
- **設定 (Setup)**：使用 `[SetUp]` (NUnit)、`[TestInitialize]` (MSTest) 或建構函式初始化 (xUnit) 進行所有測試通用的設定動作 (例如，導航到頁面)。
- **標題 (Titles)**：使用適當的測試屬性 (`[Test]` 適用於 NUnit，`[Fact]` 適用於 xUnit，`[TestMethod]` 適用於 MSTest)，並遵循 C# 命名約定 (例如，`SearchForMovieByTitle`) 的描述性方法名稱。

### 檔案組織

- **位置 (Location)**：將所有測試檔案儲存在 `Tests/` 目錄中或按功能組織。
- **命名 (Naming)**：使用 `<FeatureOrPage>Tests.cs` 的命名約定 (例如，`LoginTests.cs`、`SearchTests.cs`)。
- **範圍 (Scope)**：每個主要的應用程式功能或頁面目標一個測試類別。

### 斷言最佳實踐

- **UI 結構 (UI Structure)**：使用 `ToMatchAriaSnapshotAsync` 來驗證元件的可訪問性樹狀結構。這提供了全面且可訪問的快照。
- **元素計數 (Element Counts)**：使用 `ToHaveCountAsync` 來斷言定位器找到的元素數量。
- **文字內容 (Text Content)**：使用 `ToHaveTextAsync` 進行精確文字匹配，並使用 `ToContainTextAsync` 進行部分匹配。
- **導航 (Navigation)**：使用 `ToHaveURLAsync` 來驗證動作後的頁面 URL。

## 測試結構範例

```csharp
using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;
using static Microsoft.Playwright.Assertions;

namespace PlaywrightTests;

public class MovieSearchTests : PageTest
{
    public override async Task InitializeAsync()
    {
        await base.InitializeAsync();
        // 在每個測試之前導航到應用程式
        await Page.GotoAsync("https://debs-obrien.github.io/playwright-movies-app");
    }

    [Fact]
    public async Task SearchForMovieByTitle()
    {
        await Test.StepAsync("啟用並執行搜尋", async () =>
        {
            await Page.GetByRole(AriaRole.Search).ClickAsync();
            var searchInput = Page.GetByRole(AriaRole.Textbox, new() { Name = "搜尋輸入" });
            await searchInput.FillAsync("Garfield");
            await searchInput.PressAsync("Enter");
        });

        await Test.StepAsync("驗證搜尋結果", async () =>
        {
            // 驗證搜尋結果的可訪問性樹狀結構
            await Expect(Page.GetByRole(AriaRole.Main)).ToMatchAriaSnapshotAsync(@"
                - main:
                  - heading ""Garfield"" [level=1]
                  - heading ""搜尋結果"" [level=2]
                  - list ""movies"":
                    - listitem ""movie"":
                      - link ""poster of The Garfield Movie The Garfield Movie rating"":
                        - /url: /playwright-movies-app/movie?id=tt5779228&page=1
                        - img ""poster of The Garfield Movie""
                        - heading ""The Garfield Movie"" [level=2]
            ");
        });
    }
}
```

## 測試執行策略

1. **初始執行 (Initial Run)**：使用 `dotnet test` 或 IDE 中的測試執行器執行測試
2. **偵錯失敗 (Debug Failures)**：分析測試失敗並找出根本原因
3. **迭代 (Iterate)**：根據需要改進定位器、斷言或測試邏輯
4. **驗證 (Validate)**：確保測試一致通過並涵蓋預期功能
5. **報告 (Report)**：提供有關測試結果和發現的任何問題的回饋

## 品質檢查清單

在完成測試之前，請確保：

- [ ] 所有定位器都可訪問且明確，並避免嚴格模式違規
- [ ] 測試分組邏輯且遵循清晰的結構
- [ ] 斷言有意義且反映使用者預期
- [ ] 測試遵循一致的命名約定
- [ ] 程式碼格式正確並附有註解
