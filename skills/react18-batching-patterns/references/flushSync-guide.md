# flushSync 指南

## 匯入

```jsx
import { flushSync } from 'react-dom';
// 注意：非來自 'react' - 它位於 react-dom 中
```

如果檔案已經從 `react-dom` 匯入：

```jsx
import ReactDOM from 'react-dom';
// 新增具名匯入：
import ReactDOM, { flushSync } from 'react-dom';
```

## 語法

```jsx
flushSync(() => {
  this.setState({ ... });
});
// 此行之後，重新渲染已同步完成
```

在同一個 `flushSync` 呼叫中的多個 `setState` 會被批次處理成「單次」同步渲染：

```jsx
flushSync(() => {
  this.setState({ step: 'loading' });
  this.setState({ progress: 0 });
  // 這些會批次處理 → 產生一次渲染
});
```

## 何時使用

✅ 當使用者必須在非同步作業開始之前看到特定的 UI 狀態時：

```jsx
flushSync(() => this.setState({ loading: true }));
await expensiveAsyncOperation();
```

✅ 在多步驟進度流程中，每一步都必須在下一步開始前於視覺上完成時：

```jsx
flushSync(() => this.setState({ status: 'validating' }));
await validate();
flushSync(() => this.setState({ status: 'processing' }));
await process();
```

✅ 在必須同步斷言中間 UI 狀態的測試中 (儘可能避免 — 優先使用 `waitFor`)。

## 何時不要使用

❌ 不要用它來「修正」在 await 之後讀取 this.state 的錯誤 — 那屬於 A 類情況 (應改為重構)：

```jsx
// 錯誤 - flushSync 無法修正此問題
flushSync(() => this.setState({ loading: true }));
const data = await fetchData();
if (this.state.loading) { ... } // 仍存在競態條件 (race condition)
```

❌ 不要為了「保險起見」而在每個 setState 中都使用它 — 這會破壞 React 18 的並行渲染 (concurrent rendering) 機制：

```jsx
// 錯誤 - 過度使用 flushSync
async handleClick() {
  flushSync(() => this.setState({ clicked: true }));   // 不必要
  flushSync(() => this.setState({ processing: true })); // 不必要
  const result = await doWork();
  flushSync(() => this.setState({ result, done: true })); // 不必要
}
```

❌ 不要在 `useEffect` 或 `componentDidMount` 中使用它來觸發立即狀態 — 這會導致巢狀渲染週期。

## 效能注意事項

`flushSync` 會強制執行同步渲染，這會阻塞瀏覽器執行緒直到渲染完成。在慢速裝置或複雜的元件樹上，在非同步方法中多次呼叫 `flushSync` 會導致明顯的延遲感 (jank)。請謹慎使用。

如果您發現自己在單個方法中新增了超過 2 個 `flushSync` 呼叫，請重新考慮該元件的狀態模型是否需要重新設計。
