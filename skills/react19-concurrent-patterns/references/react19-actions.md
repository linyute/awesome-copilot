---
title: React 19 Actions 模式參考
---

# React 19 Actions 模式參考

React 19 導入了 **Actions** — 一種用於處理非同步作業 (如表單提交) 的模式，內建了載入狀態、錯誤處理以及樂觀更新 (optimistic updates)。這取代了以往使用 `useReducer + 狀態` 的模式，並提供了更簡潔的 API。

## 什麼是 Actions？

**Action** 是一個非同步函式，它：

- 可以在表單提交或按鈕點擊時自動被呼叫
- 執行時帶有自動的載入/待處理 (pending) 狀態
- 在完成時自動更新 UI
- 可與伺服器元件 (Server Components) 搭配使用以進行直接的伺服器變動

---

## useActionState()

`useActionState` 是客戶端專用的 Action Hook。它取代了用於表單處理的 `useReducer + useEffect`。

### React 18 模式

```jsx
// React 18 — 搭配 useReducer + 狀態的表單：
function Form() {
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'loading':
          return { ...state, loading: true, error: null };
        case 'success':
          return { ...state, loading: false, data: action.data };
        case 'error':
          return { ...state, loading: false, error: action.error };
      }
    },
    { loading: false, data: null, error: null }
  );
  
  async function handleSubmit(e) {
    e.preventDefault();
    dispatch({ type: 'loading' });
    try {
      const result = await submitForm(new FormData(e.target));
      dispatch({ type: 'success', data: result });
    } catch (err) {
      dispatch({ type: 'error', error: err.message });
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {state.loading && <Spinner />}
      {state.error && <Error msg={state.error} />}
      {state.data && <Success data={state.data} />}
      <button disabled={state.loading}>提交</button>
    </form>
  );
}
```

### React 19 useActionState() 模式

```jsx
// React 19 — 使用 useActionState 的相同表單：
import { useActionState } from 'react';

async function submitFormAction(prevState, formData) {
  // prevState = 此函式先前的回傳值
  // formData = 來自 <form action={submitFormAction}> 的 FormData
  
  try {
    const result = await submitForm(formData);
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

function Form() {
  const [state, formAction, isPending] = useActionState(
    submitFormAction,
    { data: null, error: null } // 初始狀態
  );
  
  return (
    <form action={formAction}>
      <input name="email" />
      {isPending && <Spinner />}
      {state.error && <Error msg={state.error} />}
      {state.data && <Success data={state.data} />}
      <button disabled={isPending}>提交</button>
    </form>
  );
}
```

**差異：**

- 使用單個 Hook 取代 `useReducer` + 邏輯
- `formAction` 取代 `onSubmit`，表單會自動收集 FormData
- `isPending` 是一個布林值，不需要額外的 dispatch 呼叫
- Action 函式接收 `(prevState, formData)`

---

## useFormStatus()

`useFormStatus` 是一個**子元件 Hook**，它會從最近的表單讀取待處理狀態。它就像一個內建的 `isPending` 信號，不需要透過 Prop 傳遞 (Prop drilling)。

```jsx
// React 18 — 必須將 isPending 作為 Prop 傳遞：
function SubmitButton({ isPending }) {
  return <button disabled={isPending}>提交</button>;
}

function Form({ isPending, formAction }) {
  return (
    <form action={formAction}>
      <input />
      <SubmitButton isPending={isPending} />
    </form>
  );
}

// React 19 — useFormStatus 會自動讀取狀態：
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>提交</button>;
}

function Form() {
  const [state, formAction] = useActionState(submitFormAction, {});
  
  return (
    <form action={formAction}>
      <input />
      <SubmitButton /> {/* 不需要傳遞 Prop */}
    </form>
  );
}
```

**關鍵點：** `useFormStatus` 僅在 `<form action={...}>` 內有效 — 一般的 `<form onSubmit>` 不會觸發它。

---

## useOptimistic()

`useOptimistic` 會在非同步作業進行期間立即更新 UI。當作業成功後，確認的資料會取代樂觀值。若作業失敗，UI 則會還原。

### React 18 模式

```jsx
// React 18 — 手動進行樂觀更新：
function TodoList({ todos, onAddTodo }) {
  const [optimistic, setOptimistic] = useState(todos);
  
  async function handleAddTodo(text) {
    const newTodo = { id: Date.now(), text, completed: false };
    
    // 立即顯示樂觀更新結果
    setOptimistic([...optimistic, newTodo]);
    
    try {
      const result = await addTodo(text);
      // 使用確認後的結果進行更新
      setOptimistic(prev => [
        ...prev.filter(t => t.id !== newTodo.id),
        result
      ]);
    } catch (err) {
      // 發生錯誤時還原
      setOptimistic(optimistic);
    }
  }
  
  return (
    <ul>
      {optimistic.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### React 19 useOptimistic() 模式

```jsx
import { useOptimistic } from 'react';

async function addTodoAction(prevTodos, formData) {
  const text = formData.get('text');
  const result = await addTodo(text);
  return [...prevTodos, result];
}

function TodoList({ todos }) {
  const [optimistic, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo) => [...state, newTodo]
  );
  
  const [, formAction] = useActionState(addTodoAction, todos);
  
  async function handleAddTodo(formData) {
    const text = formData.get('text');
    // 樂觀更新：
    addOptimistic({ id: Date.now(), text, completed: false });
    // 然後呼叫表單 action：
    formAction(formData);
  }
  
  return (
    <>
      <ul>
        {optimistic.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
      <form action={handleAddTodo}>
        <input name="text" />
        <button>新增</button>
      </form>
    </>
  );
}
```

**關鍵點：**

- `useOptimistic(currentState, updateFunction)`
- `updateFunction` 接收 `(state, optimisticInput)` 並回傳新狀態
- 呼叫 `addOptimistic(input)` 以觸發樂觀更新
- 當伺服器 action 完成時，其回傳值會取代樂觀狀態

---

## 完整範例：結合所有 Hook 的待辦事項清單 (Todo List)

```jsx
import { useActionState, useFormStatus, useOptimistic } from 'react';

// 伺服器 action：
async function addTodoAction(prevTodos, formData) {
  const text = formData.get('text');
  if (!text) throw new Error('必須輸入文字');
  const newTodo = await api.post('/todos', { text });
  return [...prevTodos, newTodo];
}

// 搭配 useFormStatus 的提交按鈕：
function AddButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? '正在新增...' : '新增事項'}</button>;
}

// 主要元件：
function TodoApp({ initialTodos }) {
  const [optimistic, addOptimistic] = useOptimistic(
    initialTodos,
    (state, newTodo) => [...state, newTodo]
  );
  
  const [todos, formAction] = useActionState(
    addTodoAction,
    initialTodos
  );
  
  async function handleAddTodo(formData) {
    const text = formData.get('text');
    // 樂觀更新：立即顯示
    addOptimistic({ id: Date.now(), text });
    // 然後提交表單 (會在伺服器確認後更新)
    await formAction(formData);
  }
  
  return (
    <>
      <ul>
        {optimistic.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
      <form action={handleAddTodo}>
        <input name="text" placeholder="新增待辦事項..." required />
        <AddButton />
      </form>
    </>
  );
}
```

---

## 遷移策略

### 階段 1 — 無須任何變更

Actions 是可選用的。所有現有的 `useReducer + onSubmit` 模式皆可繼續運作。並非強制遷移。

### 階段 2 — 識別適合重構的目標

在 React 19 遷移穩定後，可以針對 `useReducer + async` 模式進行分析：

```bash
grep -rn "useReducer.*case.*'loading\|useReducer.*case.*'success" src/ --include="*.js" --include="*.jsx"
```

值得重構的模式：

- 具有載入/錯誤狀態的表單提交
- 由使用者事件觸發的非同步作業
- 目前程式碼使用 `dispatch({ type: '...' })`
- 簡單的狀態形狀 (包含 `loading`、`error`、`data` 的物件)

### 階段 3 — 重構為 useActionState

```jsx
// 之前：
function LoginForm() {
  const [state, dispatch] = useReducer(loginReducer, { loading: false, error: null, user: null });
  
  async function handleSubmit(e) {
    e.preventDefault();
    dispatch({ type: 'loading' });
    try {
      const user = await login(e.target);
      dispatch({ type: 'success', data: user });
    } catch (err) {
      dispatch({ type: 'error', error: err.message });
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>;
}

// 之後：
async function loginAction(prevState, formData) {
  try {
    const user = await login(formData);
    return { user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
}

function LoginForm() {
  const [state, formAction] = useActionState(loginAction, { user: null, error: null });
  
  return <form action={formAction}>...</form>;
}
```

---

## 比較表

| 功能 | React 18 | React 19 |
|---|---|---|
| 表單處理 | `onSubmit` + useReducer | `action` + useActionState |
| 載入狀態 | 手動 dispatch | 自動 `isPending` |
| 子元件待處理狀態 | Prop 傳遞 (Prop drilling) | `useFormStatus` Hook |
| 樂觀更新 | 手動狀態處理 | `useOptimistic` Hook |
| 錯誤處理 | 在 dispatch 中手動處理 | 從 action 回傳 |
| 複雜度 | 較多樣板程式碼 (Boilerplate) | 較少樣板程式碼 |
