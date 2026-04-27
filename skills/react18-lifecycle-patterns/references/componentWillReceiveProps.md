# componentWillReceiveProps 遷移參考

## 核心決策

```
componentWillReceiveProps 是否會觸發非同步工作或副作用？
  是 → 移至 componentDidUpdate
  否 (僅進行純狀態衍生) → 移至 getDerivedStateFromProps
```

如有疑慮：請使用 `componentDidUpdate`。它始終是安全的。
`getDerivedStateFromProps` 存在一些陷阱 (請參閱本檔末尾)，若邏輯非純粹的同步狀態衍生，則不適合選擇它。

---

## 案例 A - 當 Prop 變更時執行非同步副作用 / 擷取 (Fetch) {#case-a}

當 prop 變更時，該方法會擷取資料、取消請求、更新外部狀態或執行任何非同步作業。

**之前：**

```jsx
class UserProfile extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (nextProps.userId !== this.props.userId) {
      this.setState({ loading: true, profile: null });
      fetchProfile(nextProps.userId)
        .then(profile => this.setState({ profile, loading: false }))
        .catch(err => this.setState({ error: err, loading: false }));
    }
  }
}
```

**之後 - componentDidUpdate：**

```jsx
class UserProfile extends React.Component {
  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      // 使用 this.props (而非 nextProps - 因為更新已經發生了)
      this.setState({ loading: true, profile: null });
      fetchProfile(this.props.userId)
        .then(profile => this.setState({ profile, loading: false }))
        .catch(err => this.setState({ error: err, loading: false }));
    }
  }
}
```

**主要差異：** `componentDidUpdate` 接收 `prevProps` — 您比較的是 `prevProps.x !== this.props.x`，而非 `this.props.x !== nextProps.x`。更新已經被套用了。

**取消模式 (Cancellation pattern)** (對非同步作業很重要)：

```jsx
class UserProfile extends React.Component {
  _requestId = 0;

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      const requestId = ++this._requestId;
      this.setState({ loading: true });
      fetchProfile(this.props.userId).then(profile => {
        // 如果 userId 再次變更，則忽略過時的回應
        if (requestId === this._requestId) {
          this.setState({ profile, loading: false });
        }
      });
    }
  }
}
```

---

## 案例 B - 從 Props 進行純狀態衍生 {#case-b}

該方法僅根據新的 props 同步衍生狀態值。無非同步工作、無副作用、無外部呼叫。

**之前：**

```jsx
class SortedList extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (nextProps.items !== this.props.items) {
      this.setState({
        sortedItems: [...nextProps.items].sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }
}
```

**之後 - getDerivedStateFromProps：**

```jsx
class SortedList extends React.Component {
  // 必須追蹤先前的 prop 以偵測變更
  static getDerivedStateFromProps(props, state) {
    if (props.items !== state.prevItems) {
      return {
        sortedItems: [...props.items].sort((a, b) => a.name.localeCompare(b.name)),
        prevItems: props.items, // ← 務必儲存您正在比較的 prop
      };
    }
    return null; // null 表示不變更狀態
  }

  constructor(props) {
    super(props);
    this.state = {
      sortedItems: [...props.items].sort((a, b) => a.name.localeCompare(b.name)),
      prevItems: props.items, // ← 同樣在 constructor 中進行初始化
    };
  }
}
```

---

## getDerivedStateFromProps - 陷阱與警告

### 陷阱 1：它在「每次」渲染時都會觸發，而不僅僅是 prop 變更時

與 `componentWillReceiveProps` 不同，`getDerivedStateFromProps` 會在每次渲染前被呼叫 — 包括由 `setState` 觸發的渲染。請務必與儲存在狀態中的先前值進行比較。

```jsx
// 錯誤 - 在每次渲染時都會觸發，包括由 setState 觸發的情況
static getDerivedStateFromProps(props, state) {
  return { sortedItems: sort(props.items) }; // 每次 setState 都會重新排序！
}

// 正確 - 僅在 items 參照變更時更新
static getDerivedStateFromProps(props, state) {
  if (props.items !== state.prevItems) {
    return { sortedItems: sort(props.items), prevItems: props.items };
  }
  return null;
}
```

### 陷阱 2：它無法存取 `this`

`getDerivedStateFromProps` 是一個靜態方法。沒有 `this.props`、沒有 `this.state`、也沒有執行個體 (instance) 方法。

```jsx
// 錯誤 - 在靜態方法中沒有 this
static getDerivedStateFromProps(props, state) {
  return { value: this.computeValue(props) }; // 會產生 ReferenceError
}

// 正確 - 屬於 props + state 的純函式
static getDerivedStateFromProps(props, state) {
  return { value: computeValue(props) }; // 使用獨立函式
}
```

### 陷阱 3：不要將其用於副作用

如果您需要在 prop 變更時擷取資料 — 請使用 `componentDidUpdate`。`getDerivedStateFromProps` 必須是純粹的。

### 何時 getDerivedStateFromProps 其實是錯誤的工具

如果您發現自己在 `getDerivedStateFromProps` 中執行複雜的邏輯，請考慮消費端元件是否應該改為透過 prop 接收預處理過的資料。此模式僅適用於窄小的使用案例，而非一般的 prop-to-state 同步。
