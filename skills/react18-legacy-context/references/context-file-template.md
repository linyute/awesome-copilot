# Context 檔案範本

新 Context 模組的標準範本。複製並填入名稱。

## 範本

```jsx
// src/contexts/[Name]Context.js
import React from 'react';

// ─── 1. 預設值 (Default Value) ──────────────────────────────────────────────────
// 形狀必須與提供者 (provider) 傳遞給 `value` 的內容匹配
// 用於消費者 (consumer) 在任何提供者之外進行渲染時 (邊緣案例保護)
const defaultValue = {
  // 在此填入形狀
};

// ─── 2. 建立 Context ────────────────────────────────────────────────────────
export const [Name]Context = React.createContext(defaultValue);

// ─── 3. 顯示名稱 (Display Name) (用於 React DevTools) ──────────────────────────
[Name]Context.displayName = '[Name]Context';

// ─── 4. 選用：自訂 Hook (強烈建議使用) ──────────────────────────────────────────
// 提供簡潔的匯入路徑，且若在提供者之外使用，會提供有助益的錯誤訊息
export function use[Name]() {
  const context = React.useContext([Name]Context);
  if (context === defaultValue) {
    // 僅在 defaultValue 是哨兵值 (sentinel) 時才拋出錯誤 - 若實際預設值合理則跳過
    // throw new Error('use[Name] 必須在 [Name]Provider 內使用');
  }
  return context;
}
```

## 已填寫範例 - AuthContext

```jsx
// src/contexts/AuthContext.js
import React from 'react';

const defaultValue = {
  user: null,
  isAuthenticated: false,
  login: () => Promise.resolve(),
  logout: () => {},
};

export const AuthContext = React.createContext(defaultValue);
AuthContext.displayName = 'AuthContext';

export function useAuth() {
  return React.useContext(AuthContext);
}
```

## 已填寫範例 - ThemeContext

```jsx
// src/contexts/ThemeContext.js
import React from 'react';

const defaultValue = {
  theme: 'light',
  toggleTheme: () => {},
};

export const ThemeContext = React.createContext(defaultValue);
ThemeContext.displayName = 'ThemeContext';

export function useTheme() {
  return React.useContext(ThemeContext);
}
```

## Context 檔案存放位置

```
src/
  contexts/           ← 偏好做法：專用資料夾
    AuthContext.js
    ThemeContext.js
```

其他可接受的位置：

```
src/context/          ← 單數名稱也可以
src/store/contexts/   ← 若與狀態管理共同存放
```

不要將 Context 檔案放在元件資料夾內 — Context 是橫切 (cross-cutting) 的，不應由任何單一元件所擁有。

## 提供者在應用程式中的放置位置

Context 提供者會包裹需要存取的元件。儘可能放在樹狀結構中較低的位置，不一定要放在根部 (root)：

```jsx
// App.js
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';

function App() {
  return (
    // Auth 包裹所有內容 - 登入狀態隨處都需要
    <AuthProvider>
      {/* Theme 僅包裹 UI 外殼 - 純資料提供者不需要 */}
      <ThemeProvider>
        <Router>
          <AppShell />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
```
