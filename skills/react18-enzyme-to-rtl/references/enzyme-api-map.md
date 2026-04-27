# Enzyme API 對照表 - 完整的之前/之後對比

## 設定 / 組態 (Setup / Configure)

```jsx
// Enzyme:
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

// RTL: 完全刪除此部分 - 不需要設定
// (jest.config.js 中的 setupFilesAfterFramework 會處理 @testing-library/jest-dom 的匹配器)
```

---

## 渲染 (Rendering)

```jsx
// Enzyme - shallow (不渲染子元件)：
import { shallow } from 'enzyme';
const wrapper = shallow(<MyComponent prop="value" />);

// RTL - render (完整渲染，包含子元件)：
import { render } from '@testing-library/react';
render(<MyComponent prop="value" />);
// 不需要 wrapper 變數 - 透過 screen 進行查詢
```

```jsx
// Enzyme - mount (含 DOM 的完整渲染)：
import { mount } from 'enzyme';
const wrapper = mount(<MyComponent />);

// RTL - 同樣使用 render() 呼叫來處理
render(<MyComponent />);
```

---

## 查詢 (Querying)

```jsx
// Enzyme - 透過元件類別搜尋：
const button = wrapper.find('button');
const comp = wrapper.find(ChildComponent);
const items = wrapper.find('.list-item');

// RTL - 透過可存取的屬性搜尋：
const button = screen.getByRole('button');
const button = screen.getByRole('button', { name: /submit/i });
const heading = screen.getByRole('heading', { name: /title/i });
const input = screen.getByLabelText('Email');
const items = screen.getAllByRole('listitem');
```

```jsx
// Enzyme - 透過文字搜尋：
wrapper.find('.message').text() === 'Hello'

// RTL:
screen.getByText('Hello')
screen.getByText(/hello/i)  // 不區分大小寫的正規表示式
```

---

## 使用者互動 (User Interaction)

```jsx
// Enzyme:
wrapper.find('button').simulate('click');
wrapper.find('input').simulate('change', { target: { value: 'hello' } });
wrapper.find('form').simulate('submit');

// RTL - fireEvent (同步、低階)：
import { fireEvent } from '@testing-library/react';
fireEvent.click(screen.getByRole('button'));
fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
fireEvent.submit(screen.getByRole('form'));

// RTL - userEvent (推薦，模擬真實使用者行為)：
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
await user.type(screen.getByRole('textbox'), 'hello');
await user.selectOptions(screen.getByRole('combobox'), 'option1');
```

**對於大多數互動，請使用 `userEvent`** — 它會像真實使用者一樣觸發完整的事件序列 (pointerdown、mousedown、focus、click 等)。僅在測試特定事件屬性時才使用 `fireEvent`。

---

## 對 Props 與狀態 (State) 的斷言

```jsx
// Enzyme - prop 斷言：
expect(wrapper.find('input').prop('disabled')).toBe(true);
expect(wrapper.prop('className')).toContain('active');

// RTL - 對可見屬性進行斷言：
expect(screen.getByRole('textbox')).toBeDisabled();
expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
expect(screen.getByRole('listitem')).toHaveClass('active');
```

```jsx
// Enzyme - 狀態斷言 (RTL 無對應功能)：
expect(wrapper.state('count')).toBe(3);
expect(wrapper.state('loading')).toBe(false);

// RTL - 對狀態渲染出的結果進行斷言：
expect(screen.getByText('Count: 3')).toBeInTheDocument();
expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
```

**關鍵原則：** 不要測試狀態值 — 測試狀態在 UI 中產生的結果。如果元件渲染了 `<span>Count: {this.state.count}</span>`，請測試該 span。

---

## 執行個體方法 (Instance Methods)

```jsx
// Enzyme - 直接呼叫方法 (RTL 無對應功能)：
wrapper.instance().handleSubmit();
wrapper.instance().loadData();

// RTL - 透過 UI 觸發：
await userEvent.setup().click(screen.getByRole('button', { name: /submit/i }));
// 或者如果沒有 UI 觸發器，請重新考慮：是否應該直接測試內部方法？
// 通常答案是否定的 — 請改為測試渲染後的結果。
```

---

## 存在性檢查 (Existence Checks)

```jsx
// Enzyme:
expect(wrapper.find('.error')).toHaveLength(1);
expect(wrapper.find('.error')).toHaveLength(0);
expect(wrapper.exists('.error')).toBe(true);

// RTL:
expect(screen.getByText('Error message')).toBeInTheDocument();
expect(screen.queryByText('Error message')).not.toBeInTheDocument();
// queryBy 在找不到時會回傳 null 而非拋出錯誤
// getBy 在找不到時會拋出錯誤 - 用於正面斷言
// findBy 回傳一個 promise - 用於非同步元件
```

---

## 多個元件

```jsx
// Enzyme:
expect(wrapper.find('li')).toHaveLength(5);
wrapper.find('li').forEach((item, i) => {
  expect(item.text()).toBe(expectedItems[i]);
});

// RTL:
const items = screen.getAllByRole('listitem');
expect(items).toHaveLength(5);
items.forEach((item, i) => {
  expect(item).toHaveTextContent(expectedItems[i]);
});
```

---

## 之前/之後：完整的元件測試範例

```jsx
// Enzyme 版本：
import { shallow } from 'enzyme';

describe('LoginForm', () => {
  it('使用憑證進行提交', () => {
    const mockSubmit = jest.fn();
    const wrapper = shallow(<LoginForm onSubmit={mockSubmit} />);

    wrapper.find('input[name="email"]').simulate('change', {
      target: { value: 'user@example.com' }
    });
    wrapper.find('input[name="password"]').simulate('change', {
      target: { value: 'password123' }
    });
    wrapper.find('button[type="submit"]').simulate('click');

    expect(wrapper.state('loading')).toBe(true);
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    });
  });
});
```

```jsx
// RTL 版本：
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  it('使用憑證進行提交', async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // 對可見輸出進行斷言 - 而非對狀態
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled(); // 載入狀態
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    });
  });
});
```
