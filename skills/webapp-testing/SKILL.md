---
name: webapp-testing
description: 使用 Playwright 與本地網頁應用程式互動和測試的工具包。支援驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖以及檢視瀏覽器日誌。
---

# 網頁應用程式測試

這項技能可以使用 Playwright 自動化對本地網頁應用程式進行全面的測試和偵錯。

## 何時使用此技能

當您需要時，請使用此技能：
- 在真實瀏覽器中測試前端功能
- 驗證 UI 行為和互動
- 偵錯網頁應用程式問題
- 擷取螢幕截圖用於文件或偵錯
- 檢查瀏覽器控制台日誌
- 驗證表單提交和使用者流程
- 檢查不同視窗大小的響應式設計

## 前置條件

- 系統上已安裝 Node.js
- 本地運行中的網頁應用程式（或可存取的 URL）
- 如果 Playwright 不存在，將會自動安裝

## 核心功能

### 1. 瀏覽器自動化
- 導航到 URL
- 點擊按鈕和連結
- 填寫表單欄位
- 選擇下拉式選單
- 處理對話框和警報

### 2. 驗證
- 斷言元素存在
- 驗證文字內容
- 檢查元素可見性
- 驗證 URL
- 測試響應式行為

### 3. 偵錯
- 擷取螢幕截圖
- 檢視控制台日誌
- 檢查網路請求
- 偵錯失敗的測試

## 使用範例

### 範例 1：基本導航測試
```javascript
// 導航到頁面並驗證標題
await page.goto('http://localhost:3000');
const title = await page.title();
console.log('頁面標題:', title);
```

### 範例 2：表單互動
```javascript
// 填寫並提交表單
await page.fill('#username', 'testuser');
await page.fill('#password', 'password123');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');
```

### 範例 3：螢幕截圖擷取
```javascript
// 擷取螢幕截圖用於偵錯
await page.screenshot({ path: 'debug.png', fullPage: true });
```

## 指南

1. **始終驗證應用程式是否正在運行** - 在運行測試之前，檢查本地伺服器是否可存取
2. **使用明確等待** - 在互動之前等待元素或導航完成
3. **失敗時擷取螢幕截圖** - 擷取螢幕截圖以幫助偵錯問題
4. **清理資源** - 完成後始終關閉瀏覽器
5. **優雅地處理超時** - 為慢速操作設定合理的超時時間
6. **增量測試** - 從簡單的互動開始，然後再進行複雜的流程
7. **明智地使用選擇器** - 優先選擇 data-testid 或基於角色的選擇器，而不是 CSS 類別

## 常見模式

### 模式：等待元素
```javascript
await page.waitForSelector('#element-id', { state: 'visible' });
```

### 模式：檢查元素是否存在
```javascript
const exists = await page.locator('#element-id').count() > 0;
```

### 模式：取得控制台日誌
```javascript
page.on('console', msg => console.log('瀏覽器日誌:', msg.text()));
```

### 模式：處理錯誤
```javascript
try {
  await page.click('#button');
} catch (error) {
  await page.screenshot({ path: 'error.png' });
  throw error;
}
```

## 限制

- 需要 Node.js 環境
- 無法測試原生行動應用程式（請改用 React Native Testing Library）
- 可能會遇到複雜身份驗證流程的問題
- 一些現代框架可能需要特定配置
