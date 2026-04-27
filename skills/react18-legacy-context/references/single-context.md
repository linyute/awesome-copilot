# 單一 Context 遷移 - 完整的之前/之後對比

## 完整範例：ThemeContext

這涵蓋了最常見的模式 — 一個具有單一提供者與多個消費者的 Context。

---

### 步驟 1 - 之前狀態 (舊版)

**ThemeProvider.js (提供者)：**

```jsx
import PropTypes from 'prop-types';

class ThemeProvider extends React.Component {
  static childContextTypes = {
    theme: PropTypes.string,
    toggleTheme: PropTypes.func,
  };

  state = { theme: 'light' };

  toggleTheme = () => {
    this.setState(s => ({ theme: s.theme === 'light' ? 'dark' : 'light' }));
  };

  getChildContext() {
    return {
      theme: this.state.theme,
      toggleTheme: this.toggleTheme,
    };
  }

  render() {
    return this.props.children;
  }
}
```

**ThemedButton.js (類別消費者)：**

```jsx
import PropTypes from 'prop-types';

class ThemedButton extends React.Component {
  static contextTypes = {
    theme: PropTypes.string,
    toggleTheme: PropTypes.func,
  };

  render() {
    const { theme, toggleTheme } = this.context;
    return (
      <button className={`btn btn-${theme}`} onClick={toggleTheme}>
        切換主題
      </button>
    );
  }
}
```

**ThemedHeader.js (函式消費者 - 若有)：**

```jsx
// 函式元件無法簡潔地使用舊版 Context
// 它們必須使用類別包裹器或渲染 Prop
```

---

### 步驟 2 - 建立 Context 檔案

**src/contexts/ThemeContext.js (新檔案)：**

```jsx
import React from 'react';

// 預設值與 getChildContext() 的回傳形狀匹配
export const ThemeContext = React.createContext({
  theme: 'light',
  toggleTheme: () => {},
});

// Context 的具名匯出 - 提供者與消費者皆從此處匯入
```

---

### 步驟 3 - 更新提供者

**ThemeProvider.js (之後)：**

```jsx
import React from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

class ThemeProvider extends React.Component {
  state = { theme: 'light' };

  toggleTheme = () => {
    this.setState(s => ({ theme: s.theme === 'light' ? 'dark' : 'light' }));
  };

  render() {
    // React 19 JSX 簡寫：<ThemeContext value={...}>
    // React 18：<ThemeContext.Provider value={...}>
    return (
      <ThemeContext.Provider
        value={{
          theme: this.state.theme,
          toggleTheme: this.toggleTheme,
        }}
      >
        {this.props.children}
      </ThemeContext.Provider>
    );
  }
}

export default ThemeProvider;
```

> **React 19 註記：** 在 React 19 中，您可以直接寫成 `<ThemeContext value={...}>` (不需 `.Provider`)。針對 React 18.3.1，請使用 `<ThemeContext.Provider value={...}>`。

---

### 步驟 4 - 更新類別消費者

**ThemedButton.js (之後)：**

```jsx
import React from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

class ThemedButton extends React.Component {
  // 使用單數 contextType (而非 contextTypes)
  static contextType = ThemeContext;

  render() {
    const { theme, toggleTheme } = this.context;
    return (
      <button className={`btn btn-${theme}`} onClick={toggleTheme}>
        切換主題
      </button>
    );
  }
}

export default ThemedButton;
```

**與舊版的主要差異：**

- 使用 `static contextType` (單數)，而非 `contextTypes` (複數)
- 不需要 PropTypes 宣告
- `this.context` 即為完整的數值物件 (而非部分物件 — 內容取決於您傳遞給 `value` 的內容)
- 類別元件透過 `contextType` 僅能使用「一個」 Context — 若有多個，請使用 `Context.Consumer` 渲染 Prop 形式

---

### 步驟 5 - 更新函式消費者

**ThemedHeader.js (之後 - 現在使用 Hooks 變得簡單明瞭)：**

```jsx
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

function ThemedHeader({ title }) {
  const { theme } = useContext(ThemeContext);
  return <h1 className={`header-${theme}`}>{title}</h1>;
}
```

---

### 步驟 6 - 在一個類別元件中使用多個 Context

如果類別元件使用了多個舊版 Context，情況會變得複雜。類別元件僅能擁有一個 `static contextType`。針對多個 Context，請使用渲染 Prop 形式：

```jsx
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';

class Dashboard extends React.Component {
  render() {
    return (
      <ThemeContext.Consumer>
        {({ theme }) => (
          <AuthContext.Consumer>
            {({ user }) => (
              <div className={`dashboard-${theme}`}>
                歡迎，{user.name}
              </div>
            )}
          </AuthContext.Consumer>
        )}
      </ThemeContext.Consumer>
    );
  }
}
```

或者考慮將類別元件遷移為函式元件，以便乾淨地使用 `useContext`。

---

### 驗證清單

在遷移一個 Context 之後：

```bash
# 提供者 - 確認不再留有舊版 Context 的匯出
grep -n "childContextTypes\|getChildContext" src/ThemeProvider.js

# 消費者 - 確認不再留有對舊版 Context 的使用
grep -rn "contextTypes\s*=" src/ --include="*.js" --include="*.jsx" | grep -v "ThemeContext\|\.test\."

# this.context 使用情形 - 確認其是從 contextType 讀取而非舊版 API
grep -rn "this\.context\." src/ --include="*.js" | grep -v "\.test\."
```

針對已遷移的 Context，每項操作皆應回傳零個命中結果。
