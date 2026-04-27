---
name: react19-source-patterns
description: 'React 19 原始碼檔案遷移模式參考，包含 API 變更、Ref 處理以及 Context 更新。'
---

# React 19 原始碼遷移模式 (React 19 Source Migration Patterns)

針對 React 19 所需的每一項原始碼檔案遷移的參考指南。

## 快速參考表

| 模式 | 動作 | 參考資料 |
|---|---|---|
| `ReactDOM.render(...)` | → `createRoot().render()` | 參閱 references/api-migrations.md |
| `ReactDOM.hydrate(...)` | → `hydrateRoot(...)` | 參閱 references/api-migrations.md |
| `unmountComponentAtNode` | → `root.unmount()` | 內嵌 (Inline) 修正 |
| `ReactDOM.findDOMNode` | → 直接使用 Ref | 內嵌 (Inline) 修正 |
| `forwardRef(...)` 包裹器 | → 將 Ref 視為直接 Prop | 參閱 references/api-migrations.md |
| `Component.defaultProps = {}` | → ES6 預設參數 | 參閱 references/api-migrations.md |
| 未含引數的 `useRef()` | → `useRef(null)` | 內嵌 (Inline) 修正 — 新增 `null` |
| 舊版 Context | → `createContext` | [→ api-migrations.md#legacy-context](references/api-migrations.md#legacy-context) |
| 字串 Ref `this.refs.x` | → `createRef()` | [→ api-migrations.md#string-refs](references/api-migrations.md#string-refs) |
| `import React from 'react'` (未被使用) | 移除 | 僅在檔案中無 `React.` 用法時移除 |

## PropTypes 規則

**不要**移除 `.propTypes` 賦值。`prop-types` 套件仍可作為獨立的驗證器運作。React 19 僅移除了 React 套件內建的執行階段檢查 — 該套件本身仍然有效。

請在任何 `.propTypes` 區塊上方新增此註解：
```jsx
// 註記：React 19 不再於執行階段執行 propTypes 驗證。
// 保留 PropTypes 僅供文件說明及 IDE 工具使用。
```

## 閱讀參考資料

有關每項遷移的完整之前/之後程式碼對比，請閱讀 **`references/api-migrations.md`**。其中包含完整的模式，包括搭配 `useImperativeHandle` 使用 `forwardRef` 的邊緣案例、`defaultProps` 對於 null 與 undefined 的行為差異，以及舊版 Context 提供者/消費者的跨檔案遷移。
