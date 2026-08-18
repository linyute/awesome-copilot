# React 19 升級外掛程式

將 React 18 程式碼庫遷移至 React 19 的企業級工具包。包含五個專屬 agent 與三項 skill，專門針對升級至 React 19 現代 API 介面時所面臨的特定挑戰。

## 安裝

```bash
copilot plugin install react19-upgrade@awesome-copilot
```

## 包含內容

### Agents

1. **react19-commander**  主協調器，透過稽核、相依性、原始程式碼遷移以及測試驗證階段來協調整個遷移管線。

2. **react19-auditor**  深度掃描專家，識別每個 React 19 重大變更與已淘汰模式：
   - 已移除的 API：`ReactDOM.render`、`ReactDOM.hydrate`、`unmountComponentAtNode`、`findDOMNode`、`createFactory`、`react-dom/test-utils` 匯出項目
   - 舊版 Context API (`contextTypes`、`childContextTypes`、`getChildContext`)
   - 字串 ref (`this.refs.x`)
   - 已淘汰模式：`forwardRef`、函式元件上的 `defaultProps`、無初始值的 `useRef()`
   - 測試專屬問題：`act` 匯入位置、`Simulate` 用法、StrictMode 變更

3. **react19-dep-surgeon**  相依性升級專家，升級至 react@19、處理 @testing-library/react@16+、解決所有 peer 衝突，並傳回 GO/NO-GO 確認。

4. **react19-migrator**  原始程式碼遷移引擎，重寫必要的 React 19 變更，並可針對已淘汰模式套用選用的現代化改造：  
   - `ReactDOM.render` → `createRoot`  
   - `ReactDOM.hydrate` → `hydrateRoot`  
   - `unmountComponentAtNode` → `root.unmount()`  
   - `findDOMNode` → 直接 ref  
   - 選用的現代化改造：`forwardRef` → ref 作為直接 prop  
   - `defaultProps` → ES6 預設值  
   - 舊版 Context → `createContext`  
   - 字串 ref → `createRef`  
   - `useRef()` → `useRef(null)`  
   - `propTypes` → 文件註解  

5. **react19-test-guardian**  測試套件修正專家，處理：
   - `act` 匯入修正 (react-dom/test-utils → react)
   - `Simulate` → `fireEvent` 遷移
   - StrictMode spy 呼叫次數差異 (React 19 中不再重複叫用)
   - `useRef` 形狀更新
   - 自訂轉譯協助程式驗證
   - 錯誤邊界 (Error boundary) 測試更新
   - 執行測試直到零失敗

### Skills

1. **react19-concurrent-patterns**  React 19 並行功能的深入模式，包含 Suspense、use() Hook、伺服器元件 (Server Components) 整合以及並行批次處理。

2. **react19-source-patterns**  原始程式碼 API 變更的遷移模式，包含 DOM/root API、ref 以及 context 更新。

3. **react19-test-patterns**  涵蓋 `act()` 語意、錯誤邊界測試以及 StrictMode 行為變更的全方位測試遷移指南。

## 快速開始

```
Ask: "Start implementing React 19 migration for my codebase"
```

react19-commander 將引導您完成：

1. 稽核 → 識別所有重大變更
2. 相依性 → 升級至 react@19 + 相容函式庫
3. 遷移 → 修正所有已淘汰的 API 與模式
4. 測試 → 遷移測試套件並執行至全部通過

## 相比 React 18 的重大變更

### 已移除的 API

- `ReactDOM.render()`  改用 `createRoot()`
- `ReactDOM.hydrate()`  改用 `hydrateRoot()`
- `ReactDOM.unmountComponentAtNode()`  改用 `root.unmount()`
- `ReactDOM.findDOMNode()`  改用直接 refs
- `React.createFactory()`  改用 JSX
- `react-dom/test-utils` 匯出項目
- 舊版 Context API
- 字串 ref

### 已淘汰模式（仍可運作但應進行遷移）

- `forwardRef`  ref 現已成為直接 prop
- 函式元件上的 `defaultProps`  改用 ES6 預設值
- 無初始值的 `useRef()`  傳入 `null`

### 行為變更

- StrictMode 不再重複叫用 effect（影響測試呼叫次數判斷提示）
- `propTypes` 執行階段驗證已移除（保留供文件說明，但無執行階段檢查）

## 主要特色

- ✅ 全方位移除 8 種以上已淘汰的 React API
- ✅ 處理複雜模式：舊版 context、forwardRef、defaultProps
- ✅ 基於記憶體的可續傳管線 — 在中斷後繼續執行
- ✅ 對不完整遷移零容忍 — 執行直到完全成功
- ✅ 具備 StrictMode 感知能力的測試修正
- ✅ Testing-library v16+ 相容性驗證
- ✅ 錯誤邊界與非同步測試模式更新

## 先決條件

此外掛程式假設您是從 **React 18** 程式碼庫進行遷移。如果您使用的是 React 16/17，請先使用 **react18-upgrade** 外掛程式升級至 React 18.3.1，接著再使用此外掛程式進行 React 19 的最終升級。

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。

## 授權

MIT
