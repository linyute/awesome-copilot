---
description: '使用 Jest 撰寫 JavaScript/TypeScript 測試的最佳實踐，包括模擬策略、測試結構與常見模式。'
mode: 'agent'
---

### 測試結構
- 測試檔案請以 `.test.ts` 或 `.test.js` 為副檔名
- 測試檔案可放在被測程式碼旁邊，或獨立於 `__tests__` 目錄中
- 測試名稱需具描述性，能清楚說明預期行為
- 使用巢狀 describe 區塊來組織相關測試
- 建議模式：`describe('元件/函式/類別', () => { it('應該執行某事', () => {}) })`

### 有效的模擬
- 模擬外部相依（API、資料庫等），以隔離測試
- 使用 `jest.mock()` 進行模組層級模擬
- 使用 `jest.spyOn()` 針對特定函式進行模擬
- 使用 `mockImplementation()` 或 `mockReturnValue()` 定義模擬行為
- 在每次測試後以 `jest.resetAllMocks()` 重設所有模擬

### 非同步程式碼測試
- 測試時務必回傳 Promise 或使用 async/await 語法
- Promise 請用 `resolves`/`rejects` matcher
- 對於較慢的測試可用 `jest.setTimeout()` 設定適當的逾時

### 快照測試
- 適用於 UI 元件或變化不頻繁的複雜物件
- 快照內容應精簡且聚焦
- 提交前請仔細檢查快照變更

### React 元件測試
- 測試元件時建議使用 React Testing Library，取代 Enzyme
- 測試使用者行為與元件無障礙性
- 以無障礙角色、標籤或文字內容查詢元素
- 使用 `userEvent` 取代 `fireEvent`，模擬更真實的使用者互動

## 常用 Jest matcher
- 基本：`expect(value).toBe(expected)`、`expect(value).toEqual(expected)`
- 真值判斷：`expect(value).toBeTruthy()`、`expect(value).toBeFalsy()`
- 數字：`expect(value).toBeGreaterThan(3)`、`expect(value).toBeLessThanOrEqual(3)`
- 字串：`expect(value).toMatch(/pattern/)`、`expect(value).toContain('substring')`
- 陣列：`expect(array).toContain(item)`、`expect(array).toHaveLength(3)`
- 物件：`expect(object).toHaveProperty('key', value)`
- 例外：`expect(fn).toThrow()`、`expect(fn).toThrow(Error)`
- 模擬函式：`expect(mockFn).toHaveBeenCalled()`、`expect(mockFn).toHaveBeenCalledWith(arg1, arg2)`
