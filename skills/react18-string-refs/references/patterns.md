# 字串 Ref (String Refs) - 所有遷移模式

## 單一 DOM 元素上的 Ref {#single-ref}

最常見的案例 — 一個 ref 對應到一個 DOM 節點。

```jsx
// 之前：
class SearchBox extends React.Component {
  handleSearch() {
    const value = this.refs.searchInput.value;
    this.props.onSearch(value);
  }

  focusInput() {
    this.refs.searchInput.focus();
  }

  render() {
    return (
      <div>
        <input ref="searchInput" type="text" placeholder="搜尋..." />
        <button onClick={() => this.handleSearch()}>搜尋</button>
      </div>
    );
  }
}
```

```jsx
// 之後：
class SearchBox extends React.Component {
  searchInputRef = React.createRef();

  handleSearch() {
    const value = this.searchInputRef.current.value;
    this.props.onSearch(value);
  }

  focusInput() {
    this.searchInputRef.current.focus();
  }

  render() {
    return (
      <div>
        <input ref={this.searchInputRef} type="text" placeholder="搜尋..." />
        <button onClick={() => this.handleSearch()}>搜尋</button>
      </div>
    );
  }
}
```

---

## 單一元件中有多個 Ref {#multiple-refs}

每個字串 ref 都會轉換成一個具名的 `createRef()` 欄位。

```jsx
// 之前：
class LoginForm extends React.Component {
  handleSubmit(e) {
    e.preventDefault();
    const email = this.refs.emailField.value;
    const password = this.refs.passwordField.value;
    this.props.onSubmit({ email, password });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input ref="emailField" type="email" />
        <input ref="passwordField" type="password" />
        <button type="submit">登入</button>
      </form>
    );
  }
}
```

```jsx
// 之後：
class LoginForm extends React.Component {
  emailFieldRef = React.createRef();
  passwordFieldRef = React.createRef();

  handleSubmit(e) {
    e.preventDefault();
    const email = this.emailFieldRef.current.value;
    const password = this.passwordFieldRef.current.value;
    this.props.onSubmit({ email, password });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input ref={this.emailFieldRef} type="email" />
        <input ref={this.passwordFieldRef} type="password" />
        <button type="submit">登入</button>
      </form>
    );
  }
}
```

---

## 清單中的 Ref / 動態 Ref {#list-refs}

在 map/loop 迴圈中的字串 ref — 這是最棘手的案例。每個項目都需要其專屬的 ref。

```jsx
// 之前：
class TabPanel extends React.Component {
  focusTab(index) {
    this.refs[`tab_${index}`].focus();
  }

  render() {
    return (
      <div>
        {this.props.tabs.map((tab, i) => (
          <button key={tab.id} ref={`tab_${i}`}>
            {tab.label}
          </button>
        ))}
      </div>
    );
  }
}
```

```jsx
// 之後 - 使用 Map 來動態儲存 ref：
class TabPanel extends React.Component {
  tabRefs = new Map();

  getOrCreateRef(id) {
    if (!this.tabRefs.has(id)) {
      this.tabRefs.set(id, React.createRef());
    }
    return this.tabRefs.get(id);
  }

  focusTab(index) {
    const tab = this.props.tabs[index];
    this.tabRefs.get(tab.id)?.current?.focus();
  }

  render() {
    return (
      <div>
        {this.props.tabs.map((tab) => (
          <button key={tab.id} ref={this.getOrCreateRef(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
    );
  }
}
```

**另一種方式 - 針對清單使用回呼 (callback) ref (較簡單)：**

```jsx
class TabPanel extends React.Component {
  tabRefs = {};

  focusTab(index) {
    this.tabRefs[index]?.focus();
  }

  render() {
    return (
      <div>
        {this.props.tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={el => { this.tabRefs[i] = el; }}  // 回呼 ref 直接儲存 DOM 節點
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }
}
// 註記：回呼 ref 會直接儲存 DOM 節點 (不需包裹在 .current 中)
// this.tabRefs[i] 即為該元素，而非 this.tabRefs[i].current
```

---

## 回呼 Ref (createRef 以外的另一種選擇) {#callback-refs}

回呼 ref 是 `createRef()` 之外的另一種選擇。它們在清單中 (如上所述) 以及當您需要在 ref 掛載/卸載時執行程式碼時非常有用。

```jsx
// 回呼 ref 語法：
class MyComponent extends React.Component {
  // 回呼 ref - 在掛載時以元件作為引數被呼叫，卸載時則為 null
  setInputRef = (el) => {
    this.inputEl = el; // 直接儲存 DOM 節點 (不需 .current)
  };

  focusInput() {
    this.inputEl?.focus(); // 直接存取 DOM 節點
  }

  render() {
    return <input ref={this.setInputRef} />;
  }
}
```

**何時使用回呼 ref 與 createRef：**

- `createRef()` - 用於在元件定義時已知固定數量的 ref (大多數情況)
- 回呼 ref - 用於動態清單、需要對掛載/卸載做出反應、或是 ref 可能會變動時

**重要事項：** 在渲染中定義的內嵌 (inline) 回呼 ref 在每次渲染時都會重新建立一個新函式，這會導致 ref 在每個渲染週期中先後以 `null` 及該元件被呼叫。請改用綁定的方法或類別欄位的箭頭函式：

```jsx
// 避免做法 - 每次渲染都會產生新函式，導致 ref 閃爍：
render() {
  return <input ref={(el) => { this.inputEl = el; }} />;  // 內嵌 - 不良做法
}

// 優先做法 - 使用穩定的參照：
setInputRef = (el) => { this.inputEl = el; };  // 類別欄位 - 良好的做法
render() {
  return <input ref={this.setInputRef} />;
}
```

---

## 傳遞給子元件的 Ref {#forwarded-refs}

如果字串 ref 是傳遞給自訂元件 (而非 DOM 元素)，遷移時也需要更新該子元件。

```jsx
// 之前：
class Parent extends React.Component {
  handleClick() {
    this.refs.myInput.focus(); // 父元件存取子元件的 DOM 節點
  }
  render() {
    return (
      <div>
        <MyInput ref="myInput" />
        <button onClick={() => this.handleClick()}>聚焦 (Focus)</button>
      </div>
    );
  }
}

// MyInput.js (子元件 - 類別元件)：
class MyInput extends React.Component {
  render() {
    return <input className="my-input" />;
  }
}
```

```jsx
// 之後：
class Parent extends React.Component {
  myInputRef = React.createRef();

  handleClick() {
    this.myInputRef.current.focus();
  }

  render() {
    return (
      <div>
        {/* React 18：需要 forwardRef。React 19：ref 是直接 prop */}
        <MyInput ref={this.myInputRef} />
        <button onClick={() => this.handleClick()}>聚焦 (Focus)</button>
      </div>
    );
  }
}

// MyInput.js (React 18 - 使用 forwardRef)：
import { forwardRef } from 'react';
const MyInput = forwardRef(function MyInput(props, ref) {
  return <input ref={ref} className="my-input" />;
});

// MyInput.js (React 19 - ref 作為直接 prop，不需 forwardRef)：
function MyInput({ ref, ...props }) {
  return <input ref={ref} className="my-input" />;
}
```
