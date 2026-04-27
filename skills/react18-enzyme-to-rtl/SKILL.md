---
name: react18-enzyme-to-rtl
description: '提供將 Enzyme 遷移至 React Testing Library (RTL) 以進行 React 18 升級的確切模式。每當需要重寫 Enzyme 測試時，請使用此技能 — 包括 shallow、mount、wrapper.find()、wrapper.simulate()、wrapper.prop()、wrapper.state()、wrapper.instance()、Enzyme configure/Adapter 呼叫，或任何從 enzyme 匯入的測試檔案。此技能涵蓋完整的 API 對照以及從「實作測試」轉向「行為測試」的哲學轉變。在重寫 Enzyme 測試之前務必閱讀此技能 — 不要一對一地翻譯 Enzyme API，那樣會產生脆弱的 RTL 測試。'
---

# React 18 Enzyme → RTL 遷移

Enzyme 沒有 React 18 轉接器 (adapter)，也沒有支援 React 18 的路徑。所有 Enzyme 測試都必須使用 React Testing Library 進行重寫。

## 哲學轉變 (請先閱讀此部分)

Enzyme 測試「實作」。RTL 測試「行為」。

```jsx
// Enzyme：測試元件是否具有正確的內部狀態
expect(wrapper.state('count')).toBe(3);
expect(wrapper.instance().handleClick).toBeDefined();
expect(wrapper.find('Button').prop('disabled')).toBe(true);

// RTL：測試使用者實際看到及可操作的內容
expect(screen.getByText('Count: 3')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
```

這不是一對一的翻譯。用來驗證內部狀態或執行個體 (instance) 方法的 Enzyme 測試並沒有 RTL 的對等功能 — 因為 RTL 有意不公開內部細節。**請重寫測試，改為斷言可見的結果。**

## API 對照表

有關每個 Enzyme API 的完整之前/之後程式碼，請參閱：
- **`references/enzyme-api-map.md`** - 完整對照表：shallow、mount、find、simulate、prop、state、instance、configure
- **`references/async-patterns.md`** - waitFor、findBy、act()、Apollo MockedProvider、載入狀態、錯誤狀態

## 核心重寫範本

```jsx
// 每個 Enzyme 測試都應重寫成此形狀：
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('執行該功能', async () => {
    // 1. 渲染 (取代 shallow/mount)
    render(<MyComponent prop="value" />);

    // 2. 查詢 (取代 wrapper.find())
    const button = screen.getByRole('button', { name: /submit/i });

    // 3. 互動 (取代 simulate())
    await userEvent.setup().click(button);

    // 4. 針對可見輸出進行斷言 (取代 wrapper.state() / wrapper.prop())
    expect(screen.getByText('Submitted!')).toBeInTheDocument();
  });
});
```

## RTL 查詢優先順序 (請依此順序使用)

1. `getByRole` - 匹配可存取的角色 (按鈕 button、文字方塊 textbox、標題 heading、核取方塊 checkbox 等)
2. `getByLabelText` - 與標籤 (label) 連結的表單欄位
3. `getByPlaceholderText` - 輸入框的預設提示字
4. `getByText` - 可見的文字內容
5. `getByDisplayValue` - 輸入框/選單/文字區域的目前值
6. `getByAltText` - 圖片的替代文字 (alt text)
7. `getByTitle` - title 屬性
8. `getByTestId` - `data-testid` 屬性 (最後手段)

優先使用 `getByRole` 而非 `getByTestId`。它同時也能測試可存取性 (accessibility)。

## 使用提供者 (Providers) 包裹

```jsx
// 帶有內容 (context) 的 Enzyme：
const wrapper = mount(
  <ApolloProvider client={client}>
    <ThemeProvider theme={theme}>
      <MyComponent />
    </ThemeProvider>
  </ApolloProvider>
);

// RTL 對等寫法 (使用專案的 customRender 或直接在內嵌包裹)：
import { render } from '@testing-library/react';
render(
  <MockedProvider mocks={mocks} addTypename={false}>
    <ThemeProvider theme={theme}>
      <MyComponent />
    </ThemeProvider>
  </MockedProvider>
);
// 或者如果專案有包裹提供者的 customRender 輔助函式，請直接使用
```
