# 批次處理類別 - 之前/之後的模式

## A 類 - 在 Await 之後讀取 this.state (潛藏的錯誤) {#category-a}

此方法在 `await` 之後讀取 `this.state` 以做出條件式決定。在 React 18 中，中間的 `setState` 尚未被排清 (flushed) — `this.state` 仍持有更新前的值。

**之前 (在 React 18 中會出錯)：**

```jsx
async handleLoadClick() {
  this.setState({ loading: true });       // 已批次處理 - 尚未排清
  const data = await fetchData();
  if (this.state.loading) {               // ← 仍為 FALSE (舊值)
    this.setState({ data, loading: false });  // ← 永不呼叫
  }
}
```

**之後 - 完全移除 this.state 讀取：**

```jsx
async handleLoadClick() {
  this.setState({ loading: true });
  try {
    const data = await fetchData();
    this.setState({ data, loading: false }); // 一律呼叫 - 不需要條件判斷
  } catch (err) {
    this.setState({ error: err, loading: false });
  }
}
```

**模式：** 如果在該點對 `this.state` 的條件判斷結果原本就應該是 true (因為您剛將其設為 true)，請移除該條件判斷。您在 `await` 之前呼叫的 `setState` 最終會被排清 — 您不需要檢查它。

---

## A 類變體 - 多步驟條件鏈

```jsx
// 之前 (出錯)：
async initialize() {
  this.setState({ step: 'auth' });
  const token = await authenticate();
  if (this.state.step === 'auth') {        // ← 錯誤：仍為初始值
    this.setState({ step: 'loading', token });
    const data = await loadData(token);
    if (this.state.step === 'loading') {   // ← 再次出錯
      this.setState({ step: 'ready', data });
    }
  }
}
```

```jsx
// 之後 - 使用區域變數而非 this.state 來追蹤流程：
async initialize() {
  this.setState({ step: 'auth' });
  try {
    const token = await authenticate();
    this.setState({ step: 'loading', token });
    const data = await loadData(token);
    this.setState({ step: 'ready', data });
  } catch (err) {
    this.setState({ step: 'error', error: err });
  }
}
```

---

## B 類 - 獨立的 setState 呼叫 (重構，不需 flushSync) {#category-b}

在 Promise 鏈中的多個 `setState` 呼叫，其順序雖然重要，但不需要讀取中間狀態。這些呼叫只需要重新結構化即可。

**之前：**

```jsx
handleSubmit() {
  this.setState({ submitting: true });
  submitForm(this.state.formData)
    .then(result => {
      this.setState({ result });
      this.setState({ submitting: false });  // .then() 中有兩個 setState
    });
}
```

**之後 - 合併 setState 呼叫：**

```jsx
async handleSubmit() {
  this.setState({ submitting: true, result: null, error: null });
  try {
    const result = await submitForm(this.state.formData);
    this.setState({ result, submitting: false });
  } catch (err) {
    this.setState({ error: err, submitting: false });
  }
}
```

規則：在同一個非同步內容中的多個 `setState` 呼叫在 React 18 中已經會自動進行批次處理。合併成較少的呼叫會更簡潔，但非強制要求。

---

## C 類 - 中間渲染必須可見 (需使用 flushSync) {#category-c}

使用者必須在非同步作業開始之前看到中間的 UI 狀態 (例如載入動畫、進度步驟)。這是 `flushSync` 唯一的正確使用案例。

**診斷問題：** 「如果載入動畫直到擷取 (fetch) 回傳後才出現，使用者體驗 (UX) 是否會出錯？」

- 是 → 使用 `flushSync`
- 否 → 重構 (A 類或 B 類)

**之前：**

```jsx
async processOrder() {
  this.setState({ status: 'validating' });   // 使用者必須看到此狀態
  await validateOrder(this.props.order);
  this.setState({ status: 'charging' });     // 使用者必須看到此狀態
  await chargeCard(this.props.card);
  this.setState({ status: 'complete' });
}
```

**之後 - 為每個所需的中間渲染使用 flushSync：**

```jsx
import { flushSync } from 'react-dom';

async processOrder() {
  flushSync(() => {
    this.setState({ status: 'validating' });  // 立即渲染
  });
  await validateOrder(this.props.order);

  flushSync(() => {
    this.setState({ status: 'charging' });    // 立即渲染
  });
  await chargeCard(this.props.card);

  this.setState({ status: 'complete' });      // 最後一個 - 不需要 flushSync
}
```

**簡單的載入動畫案例** (最常見)：

```jsx
import { flushSync } from 'react-dom';

async handleSearch() {
  // 使用者必須在擷取開始前看到載入動畫
  flushSync(() => this.setState({ loading: true }));
  const results = await searchAPI(this.state.query);
  this.setState({ results, loading: false });
}
```

---

## setTimeout 模式

```jsx
// 之前 (React 17 - setTimeout 會觸發立即重新渲染)：
handleAutoSave() {
  setTimeout(() => {
    this.setState({ saving: true });
    // React 17: 在此發生重新渲染
    saveToServer(this.state.formData).then(() => {
      this.setState({ saving: false, lastSaved: Date.now() });
    });
  }, 2000);
}
```

```jsx
// 之後 (React 18 - setTimeout 中所有的 setState 都會批次處理)：
handleAutoSave() {
  setTimeout(async () => {
    // 如果必須在擷取前顯示載入狀態 - 使用 flushSync
    flushSync(() => this.setState({ saving: true }));
    await saveToServer(this.state.formData);
    this.setState({ saving: false, lastSaved: Date.now() });
  }, 2000);
}
```

---

## 因批次處理而損壞的測試模式

```jsx
// 之前 (React 17 - 中間狀態是同步可見的)：
it('顯示儲存指示器', () => {
  render(<AutoSaveForm />);
  fireEvent.change(input, { target: { value: '新文字' } });
  expect(screen.getByText('正在儲存...')).toBeInTheDocument(); // ← 同步檢查
});

// 之後 (React 18 - 針對中間狀態使用 waitFor)：
it('顯示儲存指示器', async () => {
  render(<AutoSaveForm />);
  fireEvent.change(input, { target: { value: '新文字' } });
  await waitFor(() => expect(screen.getByText('正在儲存...')).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText('已儲存')).toBeInTheDocument());
});
```
