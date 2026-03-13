---
name: webapp-testing
description: 使用 Playwright 與本地 Web 應用程式互動並進行測試的工具組。支援驗證前端功能、除錯 UI 行為、擷取瀏覽器螢幕截圖以及查看瀏覽器紀錄。
---

# Web 應用程式測試

此技能透過 Playwright 自動化，對本地 Web 應用程式進行全面的測試與除錯。

如果可能，您應該使用 Playwright MCP 伺服器來執行工作。若無法使用 MCP 伺服器，您可以在已安裝 Playwright 的本地 Node.js 環境中執行程式碼。

## 何時使用此技能

當您需要執行以下操作時，請使用此技能：

- 在真實瀏覽器中測試前端功能
- 驗證 UI 行為與互動
- 對 Web 應用程式問題進行除錯
- 擷取螢幕截圖以用於文件或除錯
- 檢查瀏覽器主控台紀錄
- 驗證表單提交與使用者流程
- 檢查各個視埠 (viewport) 的回應式設計

## 前置條件

- 系統已安裝 Node.js
- 正在本地執行的 Web 應用程式 (或可存取的 URL)
- 若尚未安裝 Playwright，系統將自動安裝

## 核心能力

### 1. 瀏覽器自動化

- 導覽至 URL
- 點擊按鈕與連結
- 填寫表單欄位
- 選擇下拉式選單
- 處理對話方塊與警示

### 2. 驗證

- 斷言 (assert) 元件是否存在
- 驗證文字內容
- 檢查元件可見性
- 驗證 URL
- 測試回應式行為

### 3. 除錯

- 擷取螢幕截圖
- 查看主控台紀錄
- 檢查網路請求
- 對失敗的測試進行除錯

## 使用範例

### 範例 1：基礎導覽測試

```javascript
// 導覽至頁面並驗證標題
await page.goto("http://localhost:3000");
const title = await page.title();
console.log("頁面標題：", title);
```

### 範例 2：表單互動

```javascript
// 填寫並提交表單
await page.fill("#username", "testuser");
await page.fill("#password", "password123");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard");
```

### 範例 3：螢幕截圖擷取

```javascript
// 擷取螢幕截圖以供除錯
await page.screenshot({ path: "debug.png", fullPage: true });
```

## 準則

1. **務必驗證應用程式是否正在執行** - 在執行測試前，請檢查本地伺服器是否可存取。
2. **使用明確等待 (explicit waits)** - 在進行互動之前，請等待元件或導覽完成。
3. **失敗時擷取螢幕截圖** - 拍攝螢幕截圖以協助對問題進行除錯。
4. **清理資源** - 完成後務必關閉瀏覽器。
5. **優雅地處理逾時** - 為緩慢的操作設定合理的逾時時間。
6. **循序漸進地測試** - 在進行複雜流程之前，先從簡單的互動開始。
7. **明智地使用選取器 (selectors)** - 優先使用 data-testid 或以角色 (role-based) 為基礎的選取器，而非 CSS 類別。

## 常見模式

### 模式：等待元件

```javascript
await page.waitForSelector("#element-id", { state: "visible" });
```

### 模式：檢查元件是否存在

```javascript
const exists = (await page.locator("#element-id").count()) > 0;
```

### 模式：取得主控台紀錄

```javascript
page.on("console", (msg) => console.log("瀏覽器紀錄：", msg.text()));
```

### 模式：處理錯誤

```javascript
try {
  await page.click("#button");
} catch (error) {
  await page.screenshot({ path: "error.png" });
  throw error;
}
```

## 限制

- 需要 Node.js 環境
- 無法測試原生行動應用程式 (請改用 React Native Testing Library)
- 對於複雜的身分驗證流程可能會發生問題
- 某些現代框架可能需要特定配置

## 輔助函式

在 [`assets/test-helper.js`](./assets/test-helper.js) 中提供了一些輔助函式，用以簡化常見任務，例如等待元件、擷取螢幕截圖及處理錯誤。您可以在測試中匯入並使用這些函式，以提高程式碼的可讀性與可維護性。
