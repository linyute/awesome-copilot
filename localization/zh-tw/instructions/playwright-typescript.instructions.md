---
description: 'Playwright 測試產生指引'
applyTo: '**'
---

## 測試撰寫指引

### 程式碼品質標準
- **定位器（Locators）：** 優先使用面向使用者、基於角色的定位器（如 `getByRole`、`getByLabel`、`getByText` 等），提升韌性與可及性。用 `test.step()` 分組互動，提升測試可讀性與報告品質。
- **斷言（Assertions）：** 使用自動重試的 web-first 斷言。這些斷言以 `await` 關鍵字開頭（如 `await expect(locator).toHaveText()`）。除非專門測試可見性變化，否則避免用 `expect(locator).toBeVisible()`。
- **逾時（Timeouts）：** 依賴 Playwright 內建自動等待機制。避免硬編碼等待或調高預設逾時。
- **清晰度：** 測試與步驟標題需具描述性，明確說明意圖。僅針對複雜邏輯或非顯而易見互動加註解。

### 測試結構
- **匯入：** 以 `import { test, expect } from '@playwright/test';` 開頭。
- **組織：** 相關功能測試以 `test.describe()` 分組。
- **掛鉤（Hooks）：** 共用前置動作用 `beforeEach`（如導頁）。
- **標題：** 命名遵循「功能 - 特定動作或情境」格式。

### 檔案組織
- **位置：** 所有測試檔案存放於 `tests/` 目錄。
- **命名：** 採用 `<feature-or-page>.spec.ts`（如 `login.spec.ts`、`search.spec.ts`）。
- **範疇：** 每個主要功能或頁面建議一個測試檔案。

### 斷言最佳實踐
- **UI 結構：** 用 `toMatchAriaSnapshot` 驗證元件可及性樹結構，全面且可及。
- **元素數量：** 用 `toHaveCount` 斷言定位器找到的元素數量。
- **文字內容：** 精確比對用 `toHaveText`，部分比對用 `toContainText`。
- **導頁：** 用 `toHaveURL` 驗證動作後頁面 URL。

## 範例測試結構

```typescript
import { test, expect } from '@playwright/test';

test.describe('電影搜尋功能', () => {
  test.beforeEach(async ({ page }) => {
    // 每次測試前導頁
    await page.goto('https://debs-obrien.github.io/playwright-movies-app');
  });

  test('以片名搜尋電影', async ({ page }) => {
    await test.step('啟動並執行搜尋', async () => {
      await page.getByRole('search').click();
      const searchInput = page.getByRole('textbox', { name: 'Search Input' });
      await searchInput.fill('Garfield');
      await searchInput.press('Enter');
    });

    await test.step('驗證搜尋結果', async () => {
      // 驗證搜尋結果的可及性樹
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

1. **初次執行：** 用 `npx playwright test --project=chromium` 執行測試
2. **除錯失敗：** 分析測試失敗並找出根本原因
3. **反覆修正：** 依需求調整定位器、斷言或測試邏輯
4. **驗證：** 確保測試穩定通過且涵蓋預期功能
5. **回報：** 回饋測試結果與發現問題

## 品質檢查清單

最終確認測試前，請確保：
- [ ] 所有定位器皆具可及性、具體且無嚴格模式違規
- [ ] 測試分組邏輯清楚且結構一致
- [ ] 斷言具意義且反映使用者預期
- [ ] 測試命名一致
- [ ] 程式碼格式正確且有必要註解
