# componentWillUpdate 遷移參考

## 核心決策

```
componentWillUpdate 是否會讀取 DOM (捲動位置、尺寸、位置、選取範圍)？
  是 → 移至 getSnapshotBeforeUpdate (須與 componentDidUpdate 搭配使用)
  否 (副作用、請求取消等) → 移至 componentDidUpdate
```

---

## 案例 A - 在重新渲染前讀取 DOM {#case-a}

該方法在 React 套用下一次更新之前捕捉 DOM 測量值 (捲動位置、元件尺寸、游標位置)，以便在更新後可以復原或調整。

**之前：**

```jsx
class MessageList extends React.Component {
  componentWillUpdate(nextProps) {
    if (nextProps.messages.length > this.props.messages.length) {
      this.savedScrollHeight = this.listRef.current.scrollHeight;
      this.savedScrollTop = this.listRef.current.scrollTop;
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.messages.length < this.props.messages.length) {
      const scrollDelta = this.listRef.current.scrollHeight - this.savedScrollHeight;
      this.listRef.current.scrollTop = this.savedScrollTop + scrollDelta;
    }
  }
}
```

**之後 - getSnapshotBeforeUpdate + componentDidUpdate：**

```jsx
class MessageList extends React.Component {
  // 在 DOM 更新即將套用前呼叫 - 讀取 DOM 的最佳時機
  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (prevProps.messages.length < this.props.messages.length) {
      return {
        scrollHeight: this.listRef.current.scrollHeight,
        scrollTop: this.listRef.current.scrollTop,
      };
    }
    return null; // 當不需要快照時回傳 null
  }

  // 接收快照 (snapshot) 作為第三個引數
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (snapshot !== null) {
      const scrollDelta = this.listRef.current.scrollHeight - snapshot.scrollHeight;
      this.listRef.current.scrollTop = snapshot.scrollTop + scrollDelta;
    }
  }
}
```

**為何這比 componentWillUpdate 更好：** 在 React 18 並行模式下，`componentWillUpdate` 執行到 DOM 實際更新之間可能存在時間差。在 `componentWillUpdate` 中讀取的 DOM 可能已過時。而 `getSnapshotBeforeUpdate` 會在 DOM 提交 (committed) 前同步執行 — 讀取的值始終精確。

**合約規則：**

- 從 `getSnapshotBeforeUpdate` 回傳一個值 → 該值會成為 `componentDidUpdate` 中的 `snapshot`
- 回傳 `null` → `componentDidUpdate` 中的 `snapshot` 為 `null`
- 在 `componentDidUpdate` 中務必檢查 `if (snapshot !== null)`
- `getSnapshotBeforeUpdate` 「必須」與 `componentDidUpdate` 成對使用

---

## 案例 B - 在更新前執行副作用 {#case-b}

該方法在 props 或狀態即將變更時，取消正在進行中的請求、清除計時器或執行某些準備性的副作用。

**之前：**

```jsx
class SearchResults extends React.Component {
  componentWillUpdate(nextProps) {
    if (nextProps.query !== this.props.query) {
      this.currentRequest?.cancel();
      this.setState({ loading: true, results: [] });
    }
  }
}
```

**之後 - 移至 componentDidUpdate (在更新「之後」執行)：**

```jsx
class SearchResults extends React.Component {
  componentDidUpdate(prevProps) {
    if (prevProps.query !== this.props.query) {
      // 取消過時的請求
      this.currentRequest?.cancel();
      // 為更新後的查詢啟動新請求
      this.setState({ loading: true, results: [] });
      this.currentRequest = searchAPI(this.props.query)
        .then(results => this.setState({ results, loading: false }));
    }
  }
}
```

**註記：** 副作用現在是在渲染「之後」執行，而非之前。在大多數情況下這是正確的 — 您希望根據實際顯示的狀態做出反應，而非之前顯示的狀態。如果您確實需要在渲染前同步執行某些操作，請重新考慮設計 — 這通常表示狀態應該以不同的方式管理。

---

## 單一元件中同時包含兩種案例

如果元件在 `componentWillUpdate` 中同時具有讀取 DOM 「及」執行副作用的操作：

```jsx
// 之前：兩者皆做
componentWillUpdate(nextProps) {
  // 讀取 DOM
  if (isExpanding(nextProps)) {
    this.savedHeight = this.ref.current.offsetHeight;
  }
  // 副作用
  if (nextProps.query !== this.props.query) {
    this.request?.cancel();
  }
}
```

之後：拆分為兩種模式：

```jsx
// 讀取 DOM → 移至 getSnapshotBeforeUpdate
getSnapshotBeforeUpdate(prevProps, prevState) {
  if (isExpanding(this.props)) {
    return { height: this.ref.current.offsetHeight };
  }
  return null;
}

// 副作用 → 移至 componentDidUpdate
componentDidUpdate(prevProps, prevState, snapshot) {
  // 若快照存在，則處理快照
  if (snapshot !== null) { /* ... */ }

  // 處理副作用
  if (prevProps.query !== this.props.query) {
    this.request?.cancel();
    this.startNewRequest();
  }
}
```
