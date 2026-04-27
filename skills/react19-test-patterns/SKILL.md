---
name: react19-test-patterns
description: '提供將測試檔案遷移至與 React 19 相容的之前/之後模式，包含 act() 匯入、Simulate 移除，以及 StrictMode 呼叫計數變更。'
---

# React 19 測試遷移模式 (React 19 Test Migration Patterns)

針對 React 19 所需的所有測試檔案遷移的參考指南。

## 優先順序

請按此順序修正測試檔案；每一層皆依賴於前一層：

1. **`act` 匯入** — 最先修正，它會解除其他所有項目的阻塞
2. **`Simulate` → `fireEvent`** — 在修正 act 後立即修正
3. **完全清理 react-dom/test-utils** — 移除剩餘的匯入項目
4. **StrictMode 呼叫計數** — 以實際測量為準，不要憑空猜測
5. **非同步 act 包裹** — 用於處理剩餘的「未包裹在 act 中」警告
6. **自訂渲染輔助函式 (Custom render helper)** — 針對每個程式碼庫驗證一次即可，而非針對每個測試

---

## 1. act() 匯入修正

```jsx
// 之前 — 在 React 19 中已移除：
import { act } from 'react-dom/test-utils';

// 之後：
import { act } from 'react';
```

若與其他 test-utils 匯入混合使用：
```jsx
// 之前：
import { act, Simulate, renderIntoDocument } from 'react-dom/test-utils';

// 之後 — 拆分匯入項目：
import { act } from 'react';
import { fireEvent, render } from '@testing-library/react'; // 取代 Simulate + renderIntoDocument
```

---

## 2. Simulate → fireEvent

```jsx
// 之前 — Simulate 在 React 19 中已移除：
import { Simulate } from 'react-dom/test-utils';
Simulate.click(element);
Simulate.change(input, { target: { value: 'hello' } });
Simulate.submit(form);
Simulate.keyDown(element, { key: 'Enter', keyCode: 13 });

// 之後：
import { fireEvent } from '@testing-library/react';
fireEvent.click(element);
fireEvent.change(input, { target: { value: 'hello' } });
fireEvent.submit(form);
fireEvent.keyDown(element, { key: 'Enter', keyCode: 13 });
```

---

## 3. react-dom/test-utils 完整 API 對照表

| 舊版 (react-dom/test-utils) | 新位置 |
|---|---|
| `act` | `import { act } from 'react'` |
| `Simulate` | 來自 `@testing-library/react` 的 `fireEvent` |
| `renderIntoDocument` | 來自 `@testing-library/react` 的 `render` |
| `findRenderedDOMComponentWithTag` | 來自 RTL 的 `getByRole`、`getByTestId` |
| `findRenderedDOMComponentWithClass` | `getByRole` 或 `container.querySelector` |
| `scryRenderedDOMComponentsWithTag` | 來自 RTL 的 `getAllByRole` |
| `isElement`、`isCompositeComponent` | 移除 — 搭配 RTL 時不再需要 |
| `isDOMComponent` | 移除 |

---

## 4. StrictMode 呼叫計數修正

React 19 StrictMode 不再於開發環境中雙重呼叫 (double-invoke) `useEffect`。必須更新計算影響 (effect) 呼叫次數的 Spy 斷言。

**策略 — 始終進行實際測量，絕不憑空猜測：**
```bash
# 執行失敗的測試，從錯誤訊息中讀取實際計數：
npm test -- --watchAll=false --testPathPattern="[檔名]" --forceExit 2>&1 | grep -E "Expected|Received"
```

```jsx
// 之前 (React 18 StrictMode — 影響執行兩次)：
expect(mockFn).toHaveBeenCalledTimes(2);  // 1 次呼叫 × 2 (嚴格雙重呼叫)

// 之後 (React 19 StrictMode — 影響執行一次)：
expect(mockFn).toHaveBeenCalledTimes(1);
```

```jsx
// 渲染階段的呼叫 (元件主體) — 在 React 19 StrictMode 中仍會雙重呼叫：
expect(renderSpy).toHaveBeenCalledTimes(2);  // 針對渲染主體呼叫仍維持 2 次
```
