---
title: React 19 use() Hook 模式參考
---

# React 19 use() Hook 模式參考

`use()` Hook 是 React 19 針對在 React 元件內展開 (unwrap) Promise 和 Context 的解決方案。它可以在元件主體中直接使用更簡潔的非同步模式，避免了以往需要獨立的延遲加載 (lazy) 元件或複雜狀態管理的架構複雜性。

## 什麼是 use()？

`use()` 是一個 Hook，它：

- **接收**一個 Promise 或 Context 物件
- **回傳**解析後的數值或 Context 數值
- 針對 Promise **自動處理** Suspense
- **可以有條件地**在元件內被呼叫 (對於 Promise 而言，不可在最上層呼叫)
- **會拋出錯誤**，可由 Suspense + Error Boundary 捕捉

## 搭配 Promise 使用 use()

### React 18 模式

```jsx
// React 18 方法 1 — 延遲載入元件模組：
const UserComponent = React.lazy(() => import('./User'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserComponent />
    </Suspense>
  );
}

// React 18 方法 2 — 搭配狀態 + useEffect 擷取資料：
function App({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  if (!user) return <Spinner />;
  return <User user={user} />;
}
```

### React 19 use() 模式

```jsx
// React 19 — 直接在元件中使用 use()：
function App({ userId }) {
  const user = use(fetchUser(userId)); // 自動暫停渲染
  return <User user={user} />;
}

// 用法：
function Root() {
  return (
    <Suspense fallback={<Spinner />}>
      <App userId={123} />
    </Suspense>
  );
}
```

**與 React 18 的主要差異：**

- `use()` 直接在元件主體中展開 Promise
- 仍需要 Suspense 邊界，但可以放置在應用程式根部 (不一定要每個元件一個)
- 簡單的非同步資料不再需要狀態或 useEffect
- 允許在元件內進行條件式包裹 (Conditional wrapping)

## 搭配 Promise 使用 use() — 條件式擷取 (Conditional Fetching)

```jsx
// React 18 — 搭配狀態的條件式擷取
function SearchResults() {
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    if (query) {
      search(query).then(setResults);
    } else {
      setResults(null);
    }
  }, [query]);
  
  if (!results) return null;
  return <Results items={results} />;
}

// React 19 — 搭配條件式呼叫的 use()
function SearchResults() {
  const [query, setQuery] = useState('');
  
  if (!query) return null;
  
  const results = use(search(query)); // 僅在 query 為真值時擷取資料
  return <Results items={results} />;
}
```

## 搭配 Context 使用 use()

`use()` 可以在不位於元件最上層的情況下展開 Context。雖然比 Promise 用法少見，但在條件式讀取 Context 時非常有用：

```jsx
// React 18 — 一律在元件主體的最上層使用，僅能在最上層運作
const theme = useContext(ThemeContext);

// React 19 — 可以有條件地呼叫
function Button({ useSystemTheme }) {
  const theme = useSystemTheme ? use(ThemeContext) : defaultTheme;
  return <button style={theme}>點擊</button>;
}
```

---

## 遷移策略

### 階段 1 — 無須任何變更

React 19 的 `use()` 是選用的。所有現有的 Suspense + 元件分割模式皆可繼續運作：

```jsx
// 若目前運作正常，請維持現狀：
const Lazy = React.lazy(() => import('./Component'));
<Suspense fallback={<Spinner />}><Lazy /></Suspense>
```

### 階段 2 — 遷移後的清理 (選用)

在 React 19 遷移穩定後，可以針對 `useEffect + 狀態` 的非同步模式進行程式碼庫分析。這些是重構為 `use()` 的理想目標：

識別模式：

```bash
grep -rn "useEffect.*\(.*fetch\|async\|promise" src/ --include="*.js" --include="*.jsx"
```

目標：

- 簡單的掛載時擷取 (fetch-on-mount) 模式
- 無複雜的相依性陣列 (dependency arrays)
- 每個元件僅有一個 Promise
- 應用程式中其他地方已在使用 Suspense

重構範例：

```jsx
// 之前：
function Post({ postId }) {
  const [post, setPost] = useState(null);
  
  useEffect(() => {
    fetchPost(postId).then(setPost);
  }, [postId]);
  
  if (!post) return <Spinner />;
  return <PostContent post={post} />;
}

​// 之後：
function Post({ postId }) {
  const post = use(fetchPost(postId));
  return <PostContent post={post} />;
}

// 並確保在應用程式層級具有 Suspense：
<Suspense fallback={<AppSpinner />}>
  <Post postId={123} />
</Suspense>
```

---

## 錯誤處理

`use()` 會拋出錯誤，可由 Suspense Error Boundary 捕捉：

```jsx
function Root() {
  return (
    <ErrorBoundary fallback={<ErrorScreen />}>
      <Suspense fallback={<Spinner />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function DataComponent() {
  const data = use(fetchData()); // 若擷取被拒絕 (reject)，Error Boundary 會捕捉它
  return <Data data={data} />;
}
```

---

## 何時「不要」使用 use()

- **遷移期間請避免使用** — 請先讓 React 19 核心穩定運作
- **複雜相依性** — 若有多個 Promise 或複雜的排序邏輯，請繼續使用 `useEffect`
- **重試邏輯** — `use()` 不處理重試；搭配狀態的 `useEffect` 會更清晰
- **防震 (Debounced) 更新** — `use()` 會在每次 Prop 變更時重新擷取資料；搭配清理函式的 `useEffect` 會較好
