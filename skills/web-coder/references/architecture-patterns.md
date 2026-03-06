# 架構與模式參考 (Architecture & Patterns Reference)

網頁應用程式架構、設計模式以及架構概念。

## 應用程式架構

### 單頁應用程式 (Single Page Application, SPA)

載入單一 HTML 頁面並動態更新內容的網頁應用程式。

**特性**：
- 用戶端路由 (Client-side routing)
- 大量使用 JavaScript
- 初始載入後導覽速度快
- 複雜的狀態管理

**優點**：
- 流暢的使用者體驗
- 減輕伺服器負載
- 類似行動應用程式的體驗

**缺點**：
- 初始下載檔案較大
- SEO 挑戰（可透過 SSR 緩解）
- 複雜的狀態管理

**範例**：React、Vue、Angular 應用程式

```javascript
// React Router 範例
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products/:id" element={<Product />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 多頁應用程式 (Multi-Page Application, MPA)

具備多個 HTML 頁面的傳統網頁應用程式。

**特性**：
- 伺服器轉譯每個頁面
- 導覽時會重新載入整個頁面
- 架構較簡單

**優點**：
- 內建較佳的 SEO
- 建立較簡單
- 適合內容豐富的網站

**缺點**：
- 導覽速度較慢
- 伺服器請求較多

### 漸進式網頁應用程式 (Progressive Web App, PWA)

具備原生應用程式功能的網頁應用程式。

**功能**：
- 可安裝
- 離線支援 (Service Workers)
- 推播通知
- 類似應用程式的體驗

```javascript
// Service Worker 註冊
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW 已註冊', reg))
    .catch(err => console.error('SW 錯誤', err));
}
```

**manifest.json**：
```json
{
  "name": "我的 PWA",
  "short_name": "PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### 伺服器端轉譯 (Server-Side Rendering, SSR)

在伺服器上轉譯頁面，並將 HTML 傳送到用戶端。

**優點**：
- 更好的 SEO
- 更快的首次內容繪製 (First Contentful Paint)
- 在沒有 JavaScript 的情況下也能運作

**缺點**：
- 伺服器負載較高
- 設定較複雜

**框架**：Next.js、Nuxt.js、SvelteKit

```javascript
// Next.js SSR
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

function Page({ data }) {
  return <div>{data.title}</div>;
}
```

### 靜態網站產生 (Static Site Generation, SSG)

在建構時預先轉譯頁面。

**優點**：
- 速度極快
- 伺服器成本低
- 極佳的 SEO

**最適合用於**：部落格、文件、行銷網站

**工具**：Next.js、Gatsby、Hugo、Jekyll、Eleventy

```javascript
// Next.js SSG
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data } };
}

export async function getStaticPaths() {
  const paths = await fetchPaths();
  return { paths, fallback: false };
}
```

### 增量靜態再生 (Incremental Static Regeneration, ISR)

建構後更新靜態內容。

```javascript
// Next.js ISR
export async function getStaticProps() {
  const data = await fetchData();
  return {
    props: { data },
    revalidate: 60 // 每 60 秒重新驗證一次
  };
}
```

### JAMstack

JavaScript、API、標記 (Markup) 架構。

**原則**：
- 預先轉譯的靜態檔案
- 用於動態功能的 API
- 基於 Git 的工作流程
- CDN 部署

**效益**：
- 效能快速
- 高安全性
- 延展性 (Scalability)
- 開發人員體驗

## 轉譯模式

### 用戶端轉譯 (Client-Side Rendering, CSR)

JavaScript 在瀏覽器中轉譯內容。

```html
<div id="root"></div>
<script>
  // React 在此處轉譯應用程式
  ReactDOM.render(<App />, document.getElementById('root'));
</script>
```

### 注入 (Hydration)

將 JavaScript 附加到伺服器轉譯的 HTML。

```javascript
// React 注入
ReactDOM.hydrate(<App />, document.getElementById('root'));
```

### 部分注入 (Partial Hydration)

僅注入具備互動性的元件。

**工具**：Astro、Qwik

### 島嶼架構 (Islands Architecture)

靜態 HTML 中獨立的互動式元件。

**概念**：傳送最少量的 JavaScript，僅對互動的「島嶼」進行注入

**框架**：Astro、具備島嶼功能的 Eleventy

## 設計模式

### MVC (模型-檢視-控制器)

分離資料、呈現與邏輯。

- **模型 (Model)**：資料與業務邏輯
- **檢視 (View)**：UI 呈現
- **控制器 (Controller)**：處理輸入、更新模型/檢視

### MVVM (模型-檢視-檢視模型)

類似 MVC，具備資料繫結 (Data binding) 功能。

- **模型 (Model)**：資料
- **檢視 (View)**：UI
- **檢視模型 (ViewModel)**：檢視邏輯與狀態

**使用於**：Vue.js、Angular、Knockout

### 基於元件的架構 (Component-Based Architecture)

使用可重用的元件建構 UI。

```javascript
// React 元件
function Button({ onClick, children }) {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
}

// 用法
<Button onClick={handleClick}>點擊我</Button>
```

### 微前端 (Micro Frontends)

將前端拆分為較小且獨立的應用程式。

**方法**：
- 建構時整合
- 執行時整合 (iframe、Web 元件)
- 邊緣側包含 (Edge-side includes)

## 狀態管理 (State Management)

### 區域狀態 (Local State)

元件層級的狀態。

```javascript
// React useState
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 全域狀態 (Global State)

應用程式範圍的狀態。

**解決方案**：
- **Redux**：可預測的狀態容器
- **MobX**：可觀察的狀態
- **Zustand**：極簡狀態管理
- **Recoil**：原子化狀態管理

```javascript
// Redux 範例
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value += 1; }
  }
});

const store = configureStore({
  reducer: { counter: counterSlice.reducer }
});
```

### Context API

在不使用屬性鑽取 (Prop drilling) 的情況下共享狀態。

```javascript
// React Context
const ThemeContext = React.createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>...</div>;
}
```

## API 架構模式

### REST (具象狀態傳輸)

基於資源的 API 設計。

```javascript
// RESTful API
GET    /api/users      // 列出使用者
GET    /api/users/1    // 取得使用者
POST   /api/users      // 建立使用者
PUT    /api/users/1    // 更新使用者
DELETE /api/users/1    // 刪除使用者
```

### GraphQL

API 的查詢語言。

```graphql
# 查詢
query {
  user(id: "1") {
    name
    email
    posts {
      title
    }
  }
}

# 變更 (Mutation)
mutation {
  createUser(name: "John", email: "john@example.com") {
    id
    name
  }
}
```

```javascript
// Apollo 用戶端
import { useQuery, gql } from '@apollo/client';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      name
      email
    }
  }
`;

function User({ id }) {
  const { loading, error, data } = useQuery(GET_USER, {
    variables: { id }
  });
  
  if (loading) return <p>載入中...</p>;
  return <p>{data.user.name}</p>;
}
```

### tRPC

端對端型別安全 (Typesafe) API。

```typescript
// 伺服器
const appRouter = router({
  getUser: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await db.user.findUnique({ where: { id: input } });
    })
});

// 用戶端（完全具備型別！）
const user = await trpc.getUser.query('1');
```

## 微服務架構 (Microservices Architecture)

將應用程式拆分為小型且獨立的服務。

**特性**：
- 獨立部署
- 服務特定的資料庫
- API 通訊
- 去中心化治理

**效益**：
- 延展性 (Scalability)
- 技術靈活性
- 故障隔離

**挑戰**：
- 複雜度
- 網路延遲
- 資料一致性

## 單體式架構 (Monolithic Architecture)

單一且統一的應用程式。

**優點**：
- 開發較簡單
- 除錯較容易
- 單次部署

**缺點**：
- 擴充挑戰
- 技術鎖定
- 緊密耦合

## 無伺服器架構 (Serverless Architecture)

在不管理伺服器的情況下執行程式碼。

**平台**：AWS Lambda、Vercel Functions、Netlify Functions、Cloudflare Workers

```javascript
// Vercel 無伺服器函式
export default function handler(req, res) {
  res.status(200).json({ message: '來自無伺服器的問候！' });
}
```

**效益**：
- 自動調整規模 (Auto-scaling)
- 按量計費
- 無須伺服器管理

**使用案例**：
- API
- 背景作業
- Webhooks
- 圖片處理

## 架構最佳實踐

### 關注點分離 (Separation of Concerns)

保持不同面向的分離：
- 呈現層
- 業務邏輯層
- 資料存取層

### DRY (Don't Repeat Yourself)

避免程式碼重複。

### SOLID 原則

- **S**ingle Responsibility (單一職責)
- **O**pen/Closed (開放/封閉)
- **L**iskov Substitution (里氏替換)
- **I**nterface Segregation (介面隔離)
- **D**ependency Inversion (相依反向)

### 組合優於繼承 (Composition over Inheritance)

優先考慮組合物件，而非類別階層。

```javascript
// 組合
function withLogging(Component) {
  return function LoggedComponent(props) {
    console.log('正在轉譯', Component.name);
    return <Component {...props} />;
  };
}

const LoggedButton = withLogging(Button);
```

## 模組系統

### ES 模組 (ESM)

現代 JavaScript 模組。

```javascript
// 匯出 (export)
export const name = 'John';
export function greet() {}
export default App;

// 匯入 (import)
import App from './App.js';
import { name, greet } from './utils.js';
import * as utils from './utils.js';
```

### CommonJS

Node.js 模組系統。

```javascript
// 匯出
module.exports = { name: 'John' };
exports.greet = function() {};

// 匯入
const { name } = require('./utils');
```

## 建構最佳化

### 程式碼拆分 (Code Splitting)

將程式碼拆分為較小的區塊。

```javascript
// React 延遲載入
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function App() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <OtherComponent />
    </Suspense>
  );
}
```

### Tree Shaking

移除未使用的程式碼。

```javascript
// 僅匯入 'map'，而非整個 lodash
import { map } from 'lodash-es';
```

### 組合包拆分 (Bundle Splitting)

- **供應商組合包 (Vendor bundle)**：第三方相依套件
- **應用程式組合包 (App bundle)**：應用程式程式碼
- **路由組合包 (Route bundles)**：每個路由專用的程式碼

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- 抽象 (Abstraction)
- API
- 應用程式 (Application)
- 架構 (Architecture)
- 非同步 (Asynchronous)
- 繫結 (Binding)
- 區塊（CSS, JS）(Block (CSS, JS))
- 呼叫堆疊 (Call stack)
- 類別 (Class)
- 用戶端 (Client-side)
- 控制流 (Control flow)
- Delta
- 設計模式 (Design pattern)
- 事件 (Event)
- Fetch
- 一等函式 (First-class Function)
- 函式 (Function)
- 垃圾回收 (Garbage collection)
- 網格 (Grid)
- 提升 (Hoisting)
- 注入 (Hydration)
- 冪等 (Idempotent)
- 實例 (Instance)
- 延遲載入 (Lazy load)
- 主執行緒 (Main thread)
- MVC

- Polyfill
- 漸進式增強 (Progressive Enhancement)
- 漸進式網頁應用程式 (Progressive web apps)
- 屬性 (Property)
- 原型 (Prototype)
- 基於原型的程式設計 (Prototype-based programming)
- REST
- 重排 (Reflow)
- 來回通訊時間 (RTT)
- SPA
- 語義 (Semantics)
- 伺服器 (Server)
- 綜合監控 (Synthetic monitoring)
- 執行緒 (Thread)
- 型別 (Type)

## 額外資源

- [Patterns.dev](https://www.patterns.dev/)
- [React 模式 (React Patterns)](https://reactpatterns.com/)
- [JAMstack](https://jamstack.org/)
- [微前端 (Micro Frontends)](https://micro-frontends.org/)
