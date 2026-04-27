# componentWillMount 遷移參考

## 案例 A - 初始化狀態 (Initializes State) {#case-a}

此方法僅使用不依賴非同步作業的靜態或計算值來呼叫 `this.setState()`。

**之前：**

```jsx
class UserList extends React.Component {
  componentWillMount() {
    this.setState({ items: [], loading: false, page: 1 });
  }
  render() { ... }
}
```

**之後 - 移至 constructor：**

```jsx
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], loading: false, page: 1 };
  }
  render() { ... }
}
```

**如果 constructor 已存在**，請合併狀態：

```jsx
class UserList extends React.Component {
  constructor(props) {
    super(props);
    // 將原有狀態與來自 componentWillMount 的狀態合併：
    this.state = {
      ...this.existingState,  // 原有的任何狀態
      items: [],
      loading: false,
      page: 1,
    };
  }
}
```

---

## 案例 B - 執行副作用 (Runs a Side Effect) {#case-b}

此方法會擷取資料、建立訂閱 (subscriptions)、與外部 API 互動或觸發 DOM。

**之前：**

```jsx
class UserDashboard extends React.Component {
  componentWillMount() {
    this.subscription = this.props.eventBus.subscribe(this.handleEvent);
    fetch(`/api/users/${this.props.userId}`)
      .then(r => r.json())
      .then(user => this.setState({ user, loading: false }));
    this.setState({ loading: true });
  }
}
```

**之後 - 移至 componentDidMount：**

```jsx
class UserDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, user: null }; // 初始狀態放在這裡
  }

  componentDidMount() {
    // 所有副作用移至此處 - 在首次渲染後執行
    this.subscription = this.props.eventBus.subscribe(this.handleEvent);
    fetch(`/api/users/${this.props.userId}`)
      .then(r => r.json())
      .then(user => this.setState({ user, loading: false }));
  }

  componentWillUnmount() {
    // 務必與清理 (cleanup) 訂閱成對
    this.subscription?.unsubscribe();
  }
}
```

**為何這樣做是安全的：** 在 React 18 並行模式下，`componentWillMount` 可能會在掛載前被多次呼叫。其中的副作用可能會多次觸發。而 `componentDidMount` 保證僅在掛載後觸發一次。

---

## 案例 C - 從 Props 衍生初始狀態 {#case-c}

此方法讀取 `this.props` 來計算初始狀態值。

**之前：**

```jsx
class PriceDisplay extends React.Component {
  componentWillMount() {
    this.setState({
      formattedPrice: `$${this.props.price.toFixed(2)}`,
      isDiscount: this.props.price < this.props.originalPrice,
    });
  }
}
```

**之後 - 搭配 props 使用 constructor：**

```jsx
class PriceDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formattedPrice: `$${props.price.toFixed(2)}`,
      isDiscount: props.price < props.originalPrice,
    };
  }
}
```

**註記：** 如果這個初始狀態稍後在 props 變更時也需要更新，那屬於 `getDerivedStateFromProps` 的案例 — 請參閱 `componentWillReceiveProps.md` 案例 B。

---

## 單一方法中有多種模式

如果單一 `componentWillMount` 同時進行了狀態初始化「及」副作用：

```jsx
// 混合模式 - 狀態初始化 + 擷取 (fetch)
componentWillMount() {
  this.setState({ loading: true, items: [] });              // 案例 A
  fetch('/api/items').then(r => r.json())                   // 案例 B
    .then(items => this.setState({ items, loading: false }));
}
```

將它們拆分：

```jsx
constructor(props) {
  super(props);
  this.state = { loading: true, items: [] }; // 案例 A → 移至 constructor
}

componentDidMount() {
  fetch('/api/items').then(r => r.json())    // 案例 B → 移至 componentDidMount
    .then(items => this.setState({ items, loading: false }));
}
```
