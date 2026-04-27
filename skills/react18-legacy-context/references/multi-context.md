# 多個舊版 Context - 遷移參考

## 識別多個 Context

React 16/17 程式碼庫通常具有多個用於不同用途的舊版 Context：

```bash
# 尋找 childContextTypes 中使用的不同 Context 名稱
grep -rn "childContextTypes" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
# 每次命中結果都是一個需要遷移的獨立 Context
```

重類別 (class-heavy) 程式碼庫中的常見模式：

- **主題 (Theme) context** - 深色/淺色模式、調色盤
- **身分驗證 (Auth) context** - 目前使用者、登入/登出函式
- **路由 (Router) context** - 目前路由、導覽 (若使用較舊版本的 react-router)
- **儲存區 (Store) context** - Redux store、dispatch (若使用較舊版本的 connect 模式)
- **語系/i18n (Locale/i18n) context** - 語言、翻譯函式
- **彈出訊息 (Toast/notification) context** - 顯示/隱藏通知

---

## 遷移順序

逐一遷移 Context。每個 Context 都是獨立的遷移作業：

```
對於每個舊版 Context：
  1. 建立 src/contexts/[Name]Context.js
  2. 更新提供者 (provider)
  3. 更新所有消費者 (consumers)
  4. 執行應用程式 - 驗證該 Context 不再出現警告
  5. 繼續遷移下一個 Context
```

不要先遷移所有提供者再遷移所有消費者 — 這會讓應用程式處於破損的中間狀態。

---

## 在同一個提供者中使用多個 Context

某些應用程式會在單一提供者元件中組合多個 Context：

```jsx
// 之前 - 一個提供者匯出多個 Context 值：
class AppProvider extends React.Component {
  static childContextTypes = {
    theme: PropTypes.string,
    user: PropTypes.object,
    locale: PropTypes.string,
    notifications: PropTypes.array,
  };

  getChildContext() {
    return {
      theme: this.state.theme,
      user: this.state.user,
      locale: this.state.locale,
      notifications: this.state.notifications,
    };
  }
}
```

**遷移方法 - 拆分為獨立的 Context：**

```jsx
// src/contexts/ThemeContext.js
export const ThemeContext = React.createContext('light');

// src/contexts/AuthContext.js
export const AuthContext = React.createContext({ user: null, login: () => {}, logout: () => {} });

// src/contexts/LocaleContext.js
export const LocaleContext = React.createContext('en');

// src/contexts/NotificationContext.js
export const NotificationContext = React.createContext([]);
```

```jsx
// AppProvider.js - 現在使用多個提供者進行包裹
import { ThemeContext } from './contexts/ThemeContext';
import { AuthContext } from './contexts/AuthContext';
import { LocaleContext } from './contexts/LocaleContext';
import { NotificationContext } from './contexts/NotificationContext';

class AppProvider extends React.Component {
  render() {
    const { theme, user, locale, notifications } = this.state;
    return (
      <ThemeContext.Provider value={theme}>
        <AuthContext.Provider value={{ user, login: this.login, logout: this.logout }}>
          <LocaleContext.Provider value={locale}>
            <NotificationContext.Provider value={notifications}>
              {this.props.children}
            </NotificationContext.Provider>
          </LocaleContext.Provider>
        </AuthContext.Provider>
      </ThemeContext.Provider>
    );
  }
}
```

---

## 具有多個 Context 的消費者 (類別元件)

類別元件只能使用「一個」 `static contextType`。若有多個，請使用 `Consumer` 渲染 Prop 或轉換為函式元件。

### 選項 A - 渲染 Prop (維持類別元件)

```jsx
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';

class UserPanel extends React.Component {
  render() {
    return (
      <ThemeContext.Consumer>
        {(theme) => (
          <AuthContext.Consumer>
            {({ user, logout }) => (
              <div className={`panel panel-${theme}`}>
                <span>{user?.name}</span>
                <button onClick={logout}>登出</button>
              </div>
            )}
          </AuthContext.Consumer>
        )}
      </ThemeContext.Consumer>
    );
  }
}
```

### 選項 B - 轉換為函式元件 (推薦)

```jsx
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';

function UserPanel() {
  const theme = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  return (
    <div className={`panel panel-${theme}`}>
      <span>{user?.name}</span>
      <button onClick={logout}>登出</button>
    </div>
  );
}
```

若在此遷移衝刺中轉換類別元件不在範圍內，請使用選項 A。若類別元件很簡單 (主要只有渲染)，選項 B 值得進行小幅重寫。

---

## Context 檔案命名慣例

在整個程式碼庫中使用一致的命名：

```
src/
  contexts/
    ThemeContext.js      → 匯出：ThemeContext, ThemeProvider (選用)
    AuthContext.js       → 匯出：AuthContext, AuthProvider (選用)
    LocaleContext.js     → 匯出：LocaleContext
```

每個檔案都會匯出 Context 物件。提供者可以留在原始檔案中，只需匯入 Context 即可。

---

## 所有 Context 遷移完成後的驗證

```bash
# 舊版 Context 模式應回傳零個命中結果
echo "=== childContextTypes ==="
grep -rn "childContextTypes" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l

echo "=== contextTypes (舊版) ==="
grep -rn "^\s*static contextTypes\s*=\|contextTypes\.propTypes" src/ --include="*.js" | grep -v "\.test\." | wc -l

echo "=== getChildContext ==="
grep -rn "getChildContext" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l

echo "上述三項皆應為 0"
```

注意：`static contextType` (單數) 是「現代」API — 這是正確的。只有 `contextTypes` (複數) 是舊版的。
