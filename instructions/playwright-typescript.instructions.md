---
description: 'Playwright 測試產生指引'
applyTo: '**/tests/**/*.ts, **/e2e/**/*.ts, **/playwright/**/*.ts, **/playwright.config.ts'
---

## 測試撰寫指引

針對以其設定之 `testDir` 與 `testMatch` 識別的 Playwright 測試套件（包含其 fixtures 與頁面物件），請使用以下指引。請將無關的應用程式碼與其他測試架構保持在此範圍之外；若測試套件使用自訂位置，請調整指引 glob。請參閱 [Playwright 測試設定](https://playwright.dev/docs/test-configuration)。

### 程式碼品質標準
- **定位器（Locators）**：優先使用面向使用者、基於角色的定位器（`getByRole`、`getByLabel`、`getByText` 等），以確保彈性與無障礙性。使用 `test.step()` 將互動分組，以提升測試可讀性與報告品質。
- **斷言（Assertions）**：使用自動重試的網頁優先斷言。這類斷言以 `await` 關鍵字開頭（例如：`await expect(locator).toHaveText()`）。除非專門測試可見性變更，否則請避免使用 `expect(locator).toBeVisible()`。
- **逾時（Timeouts）**：依賴 Playwright 內建的自動等待機制。避免硬編碼等待時間或增加預設逾時時間。
- **清晰度**：使用能清楚說明意圖的描述性測試與步驟標題。僅在解釋複雜邏輯或非顯而易見的互動時才加入註解。


### 測試結構
- **匯入**：以 `import { test, expect } from '@playwright/test';` 開頭。
- **組織**：將同一功能的相關測試分組至 `test.describe()` 區塊中。
- **Hooks**：針對 `describe` 區塊中所有測試共通的設定動作（例如：導覽至頁面），請使用 `beforeEach`。
- **標題**：遵循清晰的命名慣例，例如 `Feature - Specific action or scenario`（功能 - 特定動作或情境）。


### 檔案組織
- **位置**：將 specs、fixtures 與頁面物件儲存在現有的 Playwright 測試套件中。將 specs 放在設定的 `testDir` 下，並確保它們符合 `testMatch`，包含使用 `e2e/` 或其他目錄的專案。
- **命名**：遵循測試套件設定的比對器與現有命名慣例；當該比對器接受時，請使用 `<feature-or-page>.spec.ts`。
- **範圍**：目標為每個主要應用程式功能或頁面對應一個測試檔案。

### 斷言最佳實務
- **UI 結構**：使用 `toMatchAriaSnapshot` 驗證元件的無障礙樹結構。這能提供全面且具無障礙性的快照。
- **元素數量**：使用 `toHaveCount` 斷言定位器找到的元素數量。
- **文字內容**：使用 `toHaveText` 進行精確文字比對，並使用 `toContainText` 進行部分比對。
- **導覽**：使用 `toHaveURL` 驗證動作後的頁面 URL。


## 範例測試結構

```typescript
import { test, expect } from '@playwright/test';

test.describe('Movie Search Feature', () => {
  test.beforeEach(async ({ page }) => {
    // 在每個測試前導覽至應用程式
    await page.goto('https://debs-obrien.github.io/playwright-movies-app');
  });

  test('Search for a movie by title', async ({ page }) => {
    await test.step('Activate and perform search', async () => {
      await page.getByRole('search').click();
      const searchInput = page.getByRole('textbox', { name: 'Search Input' });
      await searchInput.fill('Garfield');
      await searchInput.press('Enter');
    });

    await test.step('Verify search results', async () => {
      // 驗證搜尋結果的無障礙樹
      await expect(page.getByRole('main')).toMatchAriaSnapshot(`
        - main:
          - heading "Garfield" [level=1]
          - heading "search results" [level=2]
          - list "movies":
            - listitem "movie":
              - link "poster of The Garfield Movie The Garfield Movie rating":
                - /url: /playwright-movies-app/movie?id=tt5779228&page=1
                - img "poster of The Garfield Movie"
                - heading "The Garfield Movie" [level=2]
      `);
    });
  });
});
```

## 測試執行策略

1. **初始執行**：使用專案的 Playwright 測試指令與設定的專案；當設定中定義了該專案時，適用 `npx playwright test --project=chromium`。
2. **偵錯失敗**：分析測試失敗並找出根本原因
3. **迭代**：視需要調整定位器、斷言或測試邏輯
4. **驗證**：確保測試持續通過並涵蓋預期功能
5. **報告**：針對測試結果與發現的任何問題提供意見回饋

## 品質檢查清單

在定案測試前，請確保：
- [ ] 所有定位器皆具無障礙性、特定性，並避免嚴格模式違規
- [ ] 測試已依邏輯分組並遵循清晰的結構
- [ ] 斷言具意義並反映使用者預期
- [ ] 測試遵循一致的命名慣例
- [ ] 程式碼已正確格式化並加上註解