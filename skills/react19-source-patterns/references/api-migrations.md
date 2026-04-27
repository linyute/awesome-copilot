---
title: React 19 API 遷移參考
---

# React 19 API 遷移參考

針對所有 React 19 重大變更與已移除 API 的完整之前/之後對比模式。

---

## ReactDOM Root API 遷移

React 19 要求所有應用程式皆須使用 `createRoot()` 或 `hydrateRoot()`。若 React 18 的遷移已經執行過，則此項應已完成。請驗證其正確性。

### 模式 1：createRoot() — 客戶端渲染 (CSR) 應用程式

```jsx
// 之前 (React 18 或更早版本)：
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// 之後 (React 19)：
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### 模式 2：hydrateRoot() — 伺服器渲染 (SSR)/靜態應用程式

```jsx
// 之前 (React 18 伺服器渲染應用程式)：
import ReactDOM from 'react-dom';
ReactDOM.hydrate(<App />, document.getElementById('root'));

// 之後 (React 19)：
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);
```

### 模式 3：unmountComponentAtNode() 已移除

```jsx
// 之前 (React 18)：
import ReactDOM from 'react-dom';
ReactDOM.unmountComponentAtNode(container);

// 之後 (React 19)：
const root = createRoot(container); // 儲存 root 參照
// 稍後：
root.unmount();
```

**注意事項：** 若 root 參照從未被儲存，您必須重構程式碼以傳遞該參照，或使用全域註冊表 (Global registry)。

---

## findDOMNode() 已移除

### 模式 1：直接使用 Ref

```jsx
// 之前 (React 18)：
import { findDOMNode } from 'react-dom';
const domNode = findDOMNode(componentRef);

// 之後 (React 19)：
const domNode = componentRef.current; // Ref 直接指向 DOM
```

### 模式 2：類別元件 Ref

```jsx
// 之前 (React 18)：
import { findDOMNode } from 'react-dom';
class MyComponent extends React.Component {
  render() {
    return <div ref={ref => this.node = ref}>內容</div>;
  }
  
  getWidth() {
    return findDOMNode(this).offsetWidth;
  }
}

// 之後 (React 19)：
// 註記：findDOMNode() 在 React 19 中已移除。請完全消除此呼叫，
// 改用直接的 Ref 來存取 DOM 節點。
class MyComponent extends React.Component {
  nodeRef = React.createRef();
  
  render() {
    return <div ref={this.nodeRef}>內容</div>;
  }
  
  getWidth() {
    return this.nodeRef.current.offsetWidth;
  }
}
```

---

## forwardRef() — 選用性的現代化改進

### 模式 1：函式元件直接使用 Ref

```jsx
// 之前 (React 18)：
import { forwardRef } from 'react';

const Input = forwardRef((props, ref) => (
  <input ref={ref} {...props} />
));

function App() {
  const inputRef = useRef(null);
  return <Input ref={inputRef} />;
}

// 之後 (React 19)：
// 直接將 ref 視為一般的 Prop 接收即可：
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

function App() {
  const inputRef = useRef(null);
  return <Input ref={inputRef} />;
}
```

### 模式 2：forwardRef + useImperativeHandle

```jsx
// 之前 (React 18)：
import { forwardRef, useImperativeHandle } from 'react';

const TextInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; }
  }));
  
  return <input ref={inputRef} {...props} />;
});

function App() {
  const textRef = useRef(null);
  return (
    <>
      <TextInput ref={textRef} />
      <button onClick={() => textRef.current.focus()}>聚焦 (Focus)</button>
    </>
  );
}

// 之後 (React 19)：
function TextInput({ ref, ...props }) {
  const inputRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; }
  }));
  
  return <input ref={inputRef} {...props} />;
}

function App() {
  const textRef = useRef(null);
  return (
    <>
      <TextInput ref={textRef} />
      <button onClick={() => textRef.current.focus()}>聚焦 (Focus)</button>
    </>
  );
}
```

**註記：** `useImperativeHandle` 仍然有效；僅移除 `forwardRef` 包裹器。

---

## defaultProps 已移除

### 模式 1：帶有 defaultProps 的函式元件

```jsx
// 之前 (React 18)：
function Button({ label = '點擊', disabled = false }) {
  return <button disabled={disabled}>{label}</button>;
}

// 雖然有效，但在 React 19 中已被移除：
Button.defaultProps = {
  label: '點擊',
  disabled: false
};

// 之後 (React 19)：
// ES6 預設參數 (Default params) 現在是唯一的方法：
function Button({ label = '點擊', disabled = false }) {
  return <button disabled={disabled}>{label}</button>;
}

// 移除所有 defaultProps 賦值
```

### 模式 2：類別元件 defaultProps

```jsx
// 之前 (React 18)：
class Button extends React.Component {
  static defaultProps = {
    label: '點擊',
    disabled: false
  };
  
  render() {
    return <button disabled={this.props.disabled}>{this.props.label}</button>;
  }
}

// 之後 (React 19)：
// 在 constructor 或類別欄位中使用預設參數：
class Button extends React.Component {
  constructor(props) {
    super(props);
    this.label = props.label || '點擊';
    this.disabled = props.disabled || false;
  }
  
  render() {
    return <button disabled={this.disabled}>{this.label}</button>;
  }
}

// 或簡化為使用 ES6 預設值的函式元件：
function Button({ label = '點擊', disabled = false }) {
  return <button disabled={disabled}>{label}</button>;
}
```

### 模式 3：defaultProps 搭配 null

```jsx
// 之前 (React 18)：
function Component({ value }) {
  // defaultProps 可以設定為 null 以重設父元件傳遞的值
  return <div>{value}</div>;
}

Component.defaultProps = {
  value: null
};

// 之後 (React 19)：
// 使用明確的 null 檢查或空值合併 (Nullish coalescing) 運算子：
function Component({ value = null }) {
  return <div>{value}</div>;
}

// 或者：
function Component({ value }) {
  return <div>{value ?? null}</div>;
}
```

---

## useRef 未含初始值

### 模式 1：useRef()

```jsx
// 之前 (React 18)：
const ref = useRef(); // 最初為 undefined

// 之後 (React 19)：
// 明確地傳遞 null 作為初始值：
const ref = useRef(null);

// 接著使用 current：
ref.current = someElement; // 稍後手動設定
```

### 模式 2：搭配 DOM 元素的 useRef

```jsx
// 之前：
function Component() {
  const inputRef = useRef();
  return <input ref={inputRef} />;
}

// 之後：
function Component() {
  const inputRef = useRef(null); // 明確的 null
  return <input ref={inputRef} />;
}
```

---

## 舊版 Context API 已移除

### 模式 1：React.createContext vs contextTypes

```jsx
// 之前 (React 18 — 雖不建議但仍可運作)：
// 使用 contextTypes (舊的 PropTypes 風格 Context)：
class MyComponent extends React.Component {
  static contextTypes = {
    theme: PropTypes.string
  };
  
  render() {
    return <div style={{ color: this.context.theme }}>文字</div>;
  }
}

// 使用 getChildContext 的提供者 (舊版 API)：
class App extends React.Component {
  static childContextTypes = {
    theme: PropTypes.string
  };
  
  getChildContext() {
    return { theme: 'dark' };
  }
  
  render() {
    return <MyComponent />;
  }
}

// 之後 (React 19)：
// 使用 createContext (現代 API)：
const ThemeContext = React.createContext(null);

function MyComponent() {
  const theme = useContext(ThemeContext);
  return <div style={{ color: theme }}>文字</div>;
}

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <MyComponent />
    </ThemeContext.Provider>
  );
}
```

### 模式 2：類別元件取用 createContext

```jsx
// 之前 (類別元件取用舊有的 Context)：
class MyComponent extends React.Component {
  static contextType = ThemeContext;
  
  render() {
    return <div style={{ color: this.context }}>文字</div>;
  }
}

// 之後 (在 React 19 中仍有效)：
// static contextType 不需要變更
// 繼續使用 this.context
```

**重要事項：** 若您仍在使用舊版的 `contextTypes` + `getChildContext` 模式 (而非現代的 `createContext`)，您**必須**遷移至 `createContext` — 該舊版模式已完全移除。

---

## 字串 Ref 已移除

### 模式 1：this.refs 字串 Ref

```jsx
// 之前 (React 18)：
class Component extends React.Component {
  render() {
    return (
      <>
        <input ref="inputRef" />
        <button onClick={() => this.refs.inputRef.focus()}>聚焦 (Focus)</button>
      </>
    );
  }
}

// 之後 (React 19)：
class Component extends React.Component {
  inputRef = React.createRef();
  
  render() {
    return (
      <>
        <input ref={this.inputRef} />
        <button onClick={() => this.inputRef.current.focus()}>聚焦 (Focus)</button>
      </>
    );
  }
}
```

### 模式 2：回呼 Ref (推薦做法)

```jsx
// 之前 (React 18)：
class Component extends React.Component {
  render() {
    return (
      <>
        <input ref="inputRef" />
        <button onClick={() => this.refs.inputRef.focus()}>聚焦 (Focus)</button>
      </>
    );
  }
}

// 之後 (React 19 — 回呼方式更具彈性)：
class Component extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = null;
  }
  
  render() {
    return (
      <>
        <input ref={(el) => { this.inputRef = el; }} />
        <button onClick={() => this.inputRef?.focus()}>聚焦 (Focus)</button>
      </>
    );
  }
}
```

---

## 移除不必要的 React 匯入

### 模式 1：JSX 轉換後的 React 匯入

```jsx
// 之前 (React 18)：
import React from 'react'; // JSX 轉換所需

function Component() {
  return <div>文字</div>;
}

// 之後 (搭配新 JSX 轉換的 React 19)：
// 若未被使用，則移除 React 匯入：
function Component() {
  return <div>文字</div>;
}

// 但若有使用 React.* API，則須保留：
import React from 'react';

function Component() {
  return <div>{React.useState ? '是' : '否'}</div>;
}
```

### 掃描不必要的 React 匯入

```bash
# 尋找可以移除的匯入項目：
grep -rn "^import React from 'react';" src/ --include="*.js" --include="*.jsx"
# 接著檢查檔案中是否有使用 React.*、useContext 等
```

---

## 完整的遷移檢查清單

```bash
# 1. 尋找所有的 ReactDOM.render 呼叫：
grep -rn "ReactDOM.render" src/ --include="*.js" --include="*.jsx"
# 應轉換為 createRoot

# 2. 尋找所有的 ReactDOM.hydrate 呼叫：
grep -rn "ReactDOM.hydrate" src/ --include="*.js" --include="*.jsx"
# 應轉換為 hydrateRoot

# 3. 尋找所有的 forwardRef 用法：
grep -rn "forwardRef" src/ --include="*.js" --include="*.jsx"
# 檢查每一處，確認是否可以移除 (大部分皆可)

# 4. 尋找所有的 .defaultProps 賦值：
grep -rn "\.defaultProps\s*=" src/ --include="*.js" --include="*.jsx"
# 取代為 ES6 預設參數 (Default params)

# 5. 尋找所有未含初始值的 useRef()：
grep -rn "useRef()" src/ --include="*.js" --include="*.jsx"
# 新增 null：useRef(null)

# 6. 尋找舊版 Context (contextTypes)：
grep -rn "contextTypes\|childContextTypes\|getChildContext" src/ --include="*.js" --include="*.jsx"
# 遷移至 createContext

# 7. 尋找字串 Ref (ref="name")：
grep -rn 'ref="' src/ --include="*.js" --include="*.jsx"
# 遷移至 createRef 或回呼 Ref

# 8. 尋找不必要的 React 匯入：
grep -rn "^import React from 'react';" src/ --include="*.js" --include="*.jsx"
# 檢查檔案中是否有使用 React
```
