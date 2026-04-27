---
title: React 19 用於資料擷取的 Suspense 模式參考
---

# React 19 用於資料擷取的 Suspense 模式參考

React 19 針對**資料擷取 (data fetching)** 的新 Suspense 整合是一項預覽功能，它允許元件暫停 (suspend) 渲染直到資料就緒，而不需要使用 `useEffect + 狀態`。

**重要事項：** 此功能目前處於**預覽**階段 — 它需要特定的設定，且在正式環境中尚未穩定，但您應了解此模式，以便進行 React 19 的遷移規劃。

---

## React 19 有哪些變更？

React 18 的 Suspense 僅支援**程式碼分割 (code splitting)** (例如延遲載入元件)。React 19 將其擴展到**資料擷取**，但需滿足特定條件：

- **函式庫使用** — 資料擷取函式庫必須實作 Suspense (例如 React Query 5+、SWR、Remix 加載器)
- **或自行追蹤 Promise** — 以 React 可追蹤其暫停狀態的方式包裹 Promise
- **不再有「Suspense 之後不能使用 Hook」的限制** — 您可以在元件中透過 `use()` 直接使用 Suspense

---

## React 18 Suspense (僅限程式碼分割)

```jsx
// React 18 — 僅用於延遲匯入的 Suspense：
const LazyComponent = React.lazy(() => import('./Component'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <LazyComponent />
    </Suspense>
  );
}
```

在 React 18 中嘗試為資料擷取使用 Suspense 需要一些技巧或函式庫：

```jsx
// React 18 技巧 — 不建議使用：
const dataPromise = fetchData();
const resource = {
  read: () => {
    throw dataPromise; // 拋出錯誤以暫停渲染
  }
};

function Component() {
  const data = resource.read(); // 拋出 Promise → Suspense 會捕捉它
  return <div>{data}</div>;
}
```

---

## React 19 用於資料擷取的 Suspense (預覽)

React 19 透過 `use()` Hook 為搭配 Promise 的 Suspense 提供了**一等公民支援 (first-class support)**：

```jsx
// React 19 — 用於資料擷取的 Suspense：
function UserProfile({ userId }) {
  const user = use(fetchUser(userId)); // 若 Promise 待處理中，則自動暫停渲染
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile userId={123} />
    </Suspense>
  );
}
```

**與 React 18 的主要差異：**

- `use()` 會直接在元件主體中展開 (unwrap) Promise，次元件會自動暫停渲染
- 不需要 `useEffect + 狀態` 的技巧
- 程式碼更簡潔，樣板程式碼更少

---

## 模式 1：簡單的 Promise Suspense

```jsx
// 原始 Promise (不建議用於正式環境)：
function DataComponent() {
  const data = use(fetch('/api/data').then(r => r.json()));
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <DataComponent />
    </Suspense>
  );
}
```

**問題：** 每次渲染都會重新建立 Promise。解決方案：使用 `useMemo` 包裹。

---

## 模式 2：Memoized Promise (較佳做法)

```jsx
function DataComponent({ id }) {
  // 每個 id 僅建立一次 Promise：
  const dataPromise = useMemo(() => 
    fetch(`/api/data/${id}`).then(r => r.json()),
    [id]
  );
  
  const data = use(dataPromise);
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function App() {
  const [id, setId] = useState(1);
  
  return (
    <Suspense fallback={<Spinner />}>
      <DataComponent id={id} />
      <button onClick={() => setId(id + 1)}>下一個</button>
    </Suspense>
  );
}
```

---

## 模式 3：函式庫整合 (React Query)

現代資料處理函式庫已直接支援 Suspense。以 React Query 5+ 為例：

```jsx
// 搭配 Suspense 的 React Query 5+：
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  // 若暫停渲染，useSuspenseQuery 會拋出 Promise
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile userId={123} />
    </Suspense>
  );
}
```

**優勢：** 函式庫會處理快取 (caching)、重試 (retries) 以及快取失效 (cache invalidation)。

---

## 模式 4：與 Error Boundary 整合

結合使用 Suspense 與 Error Boundary 來同時處理載入中與錯誤狀態：

```jsx
function UserProfile({ userId }) {
  const user = use(fetchUser(userId)); // 載入時暫停渲染
  return <div>{user.name}</div>;
}

function App() {
  return (
    <ErrorBoundary fallback={<ErrorScreen />}>
      <Suspense fallback={<Spinner />}>
        <UserProfile userId={123} />
      </Suspense>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component {
  state = { error: null };
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}
```

---

## 巢狀 Suspense 邊界 (Nested Suspense Boundaries)

使用多個 Suspense 邊界，在等待不同資料時顯示部分 UI：

```jsx
function App({ userId }) {
  return (
    <div>
      <Suspense fallback={<UserSpinner />}>
        <UserProfile userId={userId} />
      </Suspense>
      
      <Suspense fallback={<PostsSpinner />}>
        <UserPosts userId={userId} />
      </Suspense>
    </div>
  );
}

function UserProfile({ userId }) {
  const user = use(fetchUser(userId));
  return <h1>{user.name}</h1>;
}

function UserPosts({ userId }) {
  const posts = use(fetchUserPosts(userId));
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

現在：

- 使用者設定檔在載入時會顯示載入動畫
- 貼文列表會獨立顯示載入動畫
- 兩者皆可在完成後立即渲染

---

## 循序與並行 Suspense

### 循序 (Sequential) (在擷取第二份資料前先等待第一份)

```jsx
function App({ userId }) {
  const user = use(fetchUser(userId)); // 必須先完成此項
  
  return (
    <Suspense fallback={<PostsSpinner />}>
      <UserPosts userId={user.id} /> {/* 依賴於 user 資料 */}
    </Suspense>
  );
}

function UserPosts({ userId }) {
  const posts = use(fetchUserPosts(userId));
  return <ul>{posts.map(p => <li>{p.title}</li>)}</ul>;
}
```

### 並行 (Parallel) (同時擷取兩份資料)

```jsx
function App({ userId }) {
  return (
    <div>
      <Suspense fallback={<UserSpinner />}>
        <UserProfile userId={userId} />
      </Suspense>
      
      <Suspense fallback={<PostsSpinner />}>
        <UserPosts userId={userId} /> {/* 並行擷取資料 */}
      </Suspense>
    </div>
  );
}
```

---

## React 18 → React 19 的遷移策略

### 階段 1 — 無須任何變更

對於資料擷取，Suspense 仍是選用且實驗性的。所有現有的 `useEffect + 狀態` 模式皆可繼續運作。

### 階段 2 — 等待穩定性

在正式環境採用 Suspense 資料擷取之前：

- 等待 React 19 正式發布 (而非預覽版)
- 確認您的資料處理函式庫支援 Suspense
- 在應用程式核心於 React 19 穩定運作後再規劃遷移

### 階段 3 — 重構為 Suspense (選用，在預覽期過後)

穩定後，分析適合的目標：

```bash
grep -rn "useEffect.*fetch\|useEffect.*axios\|useEffect.*graphql" src/ --include="*.js" --include="*.jsx"
```

```jsx
// 之前 (React 18)：
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  if (!user) return <Spinner />;
  return <div>{user.name}</div>;
}

// 之後 (搭配 Suspense 的 React 19)：
function UserProfile({ userId }) {
  const user = use(fetchUser(userId));
  return <div>{user.name}</div>;
}

// 必須包裹在 Suspense 中：
<Suspense fallback={<Spinner />}>
  <UserProfile userId={123} />
</Suspense>
```

---

## 重要警告

1. **仍處於預覽階段** — 用於資料的 Suspense 被標記為實驗性，行為可能會變更
2. **效能問題** — 若無進行 Memoization，每次渲染都會重新建立 Promise；請使用 `useMemo`
3. **快取** — `use()` 本身不具備快取功能；在正式應用程式中請使用 React Query 或類似工具
4. **SSR** — Suspense 的 SSR 支援有限；請檢查 Next.js 版本需求
