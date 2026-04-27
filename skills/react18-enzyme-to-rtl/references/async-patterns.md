# 非同步測試模式 - Enzyme → RTL 遷移

將 Enzyme 非同步測試重寫為具有 React 18 相容模式的 React Testing Library 的參考指南。

## 核心問題

Enzyme 的非同步測試通常使用以下其中一種方法：

- 在狀態變更後執行 `wrapper.update()`
- 使用 `setTimeout` / `Promise.resolve()` 排清微任務 (microtasks)
- 使用 `setImmediate` 排清非同步佇列
- 直接呼叫執行個體 (instance) 方法，然後執行 `wrapper.update()`

這些在 RTL 中都無法運作。RTL 改為提供 `waitFor`、`findBy*` 以及 `act`。

---

## 模式 1 - 狀態變更後的 wrapper.update()

Enzyme 需要 `wrapper.update()` 才能在非同步狀態變更後強制重新渲染。

```jsx
// Enzyme:
it('載入資料', async () => {
  const wrapper = mount(<UserList />);
  await Promise.resolve(); // 排清微任務
  wrapper.update();        // 強制 Enzyme 與 DOM 同步
  expect(wrapper.find('li')).toHaveLength(3);
});
```

```jsx
// RTL - waitFor 會自動處理重新渲染：
import { render, screen, waitFor } from '@testing-library/react';

it('載入資料', async () => {
  render(<UserList />);
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
```

---

## 模式 2 - 由使用者互動觸發的非同步動作

```jsx
// Enzyme:
it('在按鈕點擊時擷取使用者', async () => {
  const wrapper = mount(<UserCard />);
  wrapper.find('button').simulate('click');
  await new Promise(resolve => setTimeout(resolve, 0));
  wrapper.update();
  expect(wrapper.find('.user-name').text()).toBe('John Doe');
});
```

```jsx
// RTL:
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('在按鈕點擊時擷取使用者', async () => {
  render(<UserCard />);
  await userEvent.setup().click(screen.getByRole('button', { name: /load/i }));
  // findBy* 會自動等待最多 1000 毫秒 (可設定)
  expect(await screen.findByText('John Doe')).toBeInTheDocument();
});
```

---

## 模式 3 - 載入狀態斷言 (Loading State Assertion)

```jsx
// Enzyme - 先同步斷言載入狀態，排清後再斷言最終狀態：
it('先顯示載入中接著顯示結果', async () => {
  const wrapper = mount(<SearchResults query="react" />);
  expect(wrapper.find('.spinner').exists()).toBe(true);
  await new Promise(resolve => setTimeout(resolve, 100));
  wrapper.update();
  expect(wrapper.find('.spinner').exists()).toBe(false);
  expect(wrapper.find('.result')).toHaveLength(5);
});
```

```jsx
// RTL:
it('先顯示載入中接著顯示結果', async () => {
  render(<SearchResults query="react" />);
  // 載入狀態 - 檢查其是否出現
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  // 或者如果載入狀態是文字：
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // 等待結果出現 (載入狀態消失，結果顯示)
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
});
```

---

## 模式 4 - Apollo MockedProvider 非同步測試

```jsx
// 搭配 Apollo 的 Enzyme - 過去常使用多次 tick 來排清：
it('從查詢渲染使用者', async () => {
  const wrapper = mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserProfile id="1" />
    </MockedProvider>
  );
  await new Promise(resolve => setTimeout(resolve, 0)); // 排清 Apollo 佇列
  wrapper.update();
  expect(wrapper.find('.username').text()).toBe('Alice');
});
```

```jsx
// 搭配 Apollo 的 RTL:
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

it('從查詢渲染使用者', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserProfile id="1" />
    </MockedProvider>
  );

  // 等待 Apollo 解析查詢
  expect(await screen.findByText('Alice')).toBeInTheDocument();
  // 或者：
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

**RTL 中的 Apollo 載入狀態：**

```jsx
it('先顯示載入中接著顯示資料', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserProfile id="1" />
    </MockedProvider>
  );
  // Apollo 載入狀態 - 在渲染後立即檢查
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  // 然後等待資料
  expect(await screen.findByText('Alice')).toBeInTheDocument();
});
```

---

## 模式 5 - 非同步作業產生的錯誤狀態

```jsx
// Enzyme:
it('在擷取失敗時顯示錯誤', async () => {
  server.use(rest.get('/api/user', (req, res, ctx) => res(ctx.status(500))));
  const wrapper = mount(<UserCard />);
  wrapper.find('button').simulate('click');
  await new Promise(resolve => setTimeout(resolve, 0));
  wrapper.update();
  expect(wrapper.find('.error-message').text()).toContain('Something went wrong');
});
```

```jsx
// RTL:
it('在擷取失敗時顯示錯誤', async () => {
  // (假設使用 MSW 或 jest.mock 處理 fetch)
  render(<UserCard />);
  await userEvent.setup().click(screen.getByRole('button', { name: /load/i }));
  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
});
```

---

## 模式 6 - 用於手動非同步控制的 act()

當您需要對非同步計時進行精確控制時 (RTL 較少見，但類別元件測試偶爾需要)：

```jsx
// 搭配 act() 進行細粒度非同步控制的 RTL：
import { act } from 'react';

it('處理連續的狀態更新', async () => {
  render(<MultiStepForm />);

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await Promise.resolve(); // 排清微任務佇列
  });

  expect(screen.getByText('步驟 2')).toBeInTheDocument();
});
```

---

## RTL 非同步查詢指南

| 方法 | 行為 | 何時使用 |
|---|---|---|
| `getBy*` | 同步 - 若未找到則拋出錯誤 | 元件一律會立即存在 |
| `queryBy*` | 同步 - 若未找到則回傳 null | 檢查元件「不存在」 |
| `findBy*` | 非同步 - 等待最多 1000 毫秒，若未找到則拒絕 (reject) | 元件是非同步出現的 |
| `getAllBy*` | 同步 - 若找到 0 個則拋出錯誤 | 多個元件一律會立即存在 |
| `queryAllBy*` | 同步 - 若未找到則回傳 [] | 檢查計數或不存在 |
| `findAllBy*` | 非同步 - 等待元件出現 | 多個元件是非同步出現的 |
| `waitFor(fn)` | 重試 fn 直到無錯誤或逾時 | 需要輪詢 (polling) 的自訂斷言 |
| `waitForElementToBeRemoved(el)` | 等待直到元件消失 | 載入狀態、移除動作 |

**預設逾時：** 1000 毫秒。可在 `jest.config.js` 中進行全域設定：

```js
// 針對慢速 CI 環境增加逾時時間
// jest.config.js
module.exports = {
  testEnvironmentOptions: {
    asyncUtilTimeout: 3000,
  },
};
```

---

## 常見的遷移錯誤

```jsx
// 錯誤 - 將非同步查詢與非同步斷言混用：
const el = await screen.findByText('結果');
// el 在此處已經解析完成 - findBy 回傳的是元件，而非 promise
expect(await el).toBeInTheDocument(); // 不必要的第二次 await

// 正確：
const el = await screen.findByText('結果');
expect(el).toBeInTheDocument();
// 或者簡單寫成：
expect(await screen.findByText('結果')).toBeInTheDocument();
```

```jsx
// 錯誤 - 對非同步出現的元件使用 getBy*：
fireEvent.click(button);
expect(screen.getByText('已載入！')).toBeInTheDocument(); // 在資料載入前就拋出錯誤

// 正確：
fireEvent.click(button);
expect(await screen.findByText('已載入！')).toBeInTheDocument(); // 會等待
```
