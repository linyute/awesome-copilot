---
name: react19-concurrent-patterns
description: '在遷移期間保留 React 18 的並行模式 (Concurrent Patterns)，並採用 React 19 API (useTransition、useDeferredValue、Suspense、use()、useOptimistic、Actions)。'
---

# React 19 並行模式 (Concurrent Patterns)

React 19 導入了新的 API 來補充遷移工作。此技能涵蓋了兩個重點：

1. **保留**：在遷移過程中「不得」損壞現有的 React 18 並行模式
2. **採用**：在遷移穩定後值得導入的新 React 19 API

## 第一部分 保留：遷移後必須存續的 React 18 並行模式

這些模式存在於 React 18 程式碼庫中，在遷移過程中絕不可被誤刪或損壞：

### createRoot 已由 R18 協作完成遷移

若 R18 協作已經執行過，則 `ReactDOM.render` → `createRoot` 的遷移應已完成。請驗證其正確性：

```jsx
// 正確的 React 19 根節點 (與 React 18 相同)：
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### useTransition 無須遷移

React 18 的 `useTransition` 在 React 19 中的運作方式完全相同。遷移期間請勿更動這些模式：

```jsx
// React 18 的 useTransition 在 React 19 中維持不變：
const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() => {
    setFilteredResults(computeExpensiveFilter(input));
  });
}
```

### useDeferredValue 無須遷移

```jsx
// React 18 的 useDeferredValue 在 React 19 中維持不變：
const deferredQuery = useDeferredValue(query);
```

### 用於程式碼分割的 Suspense 無須遷移

```jsx
// React 18 搭配 lazy 使用的 Suspense 在 React 19 中維持不變：
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <LazyComponent />
    </Suspense>
  );
}
```

---

## 第二部分 React 19 新 API

這些 API 值得在遷移後的清理衝刺中採用。請勿在遷移「期間」導入這些功能 — 請先確保系統穩定。

有關每個新 API 的完整模式，請參閱：
- **`references/react19-use.md`** — 用於 Promise 與 Context 的 `use()` Hook
- **`references/react19-actions.md`** — Actions、useActionState、useFormStatus、useOptimistic
- **`references/react19-suspense.md`** — 用於資料擷取的 Suspense (新模式)

## 遷移安全規則

在 React 19 遷移本身進行期間，這些並行模式必須**完全維持原樣**：

```bash
# 驗證遷移期間是否有任何變動觸及這些項目：
grep -rn "useTransition\|useDeferredValue\|Suspense\|startTransition" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
```

若遷移工具修改了上述任何檔案，請檢視變更內容 — 遷移應僅修改 React API 表面 (例如 forwardRef、defaultProps 等)，絕不應涉及並行模式邏輯。
