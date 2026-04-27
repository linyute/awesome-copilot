# React 19 升級外掛程式

將 React 18 程式碼庫遷移至 React 19 的企業級工具組。包含五個專屬代理和三個技能，旨在解決升級至 React 19 現代 API 介面所面臨的特定挑戰。

## 安裝

```bash
copilot plugin install react19-upgrade@awesome-copilot
```

## 包含內容

### 代理

1. **react19-commander** - 主協調者，透過稽核、相依性、原始碼遷移和測試驗證階段來協調整個遷移管線。

2. **react19-auditor** - 深度掃描專家，識別每一個 React 19 的重大變更與棄用模式：
   - 已移除的 API：`ReactDOM.render`, `ReactDOM.hydrate`, `unmountComponentAtNode`, `findDOMNode`, `createFactory`, `react-dom/test-utils` 匯出
   - 遺留 Context API (`contextTypes`, `childContextTypes`, `getChildContext`)
   - 字串 refs (`this.refs.x`)
   - 棄用模式：`forwardRef`, 函式元件上的 `defaultProps`, 無初始值的 `useRef()`
   - 測試相關問題：`act` 匯入位置, `Simulate` 使用, StrictMode 變更

3. **react19-dep-surgeon** - 相依性升級專家，升級至 react@19，處理 @testing-library/react@16+，解決所有對等套件衝突，並回傳 GO/NO-GO 確認。

4. **react19-migrator** - 原始碼遷移引擎，重寫必要的 React 19 變更，並可針對棄用模式應用選用的現代化改進：  
   - `ReactDOM.render` → `createRoot`  
   - `ReactDOM.hydrate` → `hydrateRoot`  
   - `unmountComponentAtNode` → `root.unmount()`  
   - `findDOMNode` → 直接 refs  
   - 選用現代化：`forwardRef` → ref 作為直接 prop  
   - `defaultProps` → ES6 預設值
   - 遺留 Context → `createContext`
   - 字串 refs → `createRef`
   - `useRef()` → `useRef(null)`
   - `propTypes` → 文件註解

5. **react19-test-guardian** - 測試套件修復員，處理：
   - `act` 匯入修復 (react-dom/test-utils → react)
   - `Simulate` → `fireEvent` 遷移
   - StrictMode 監聽呼叫次數差異 (React 19 不再有雙重呼叫)
   - `useRef` 形狀更新
   - 自訂 render 輔助工具驗證
   - 錯誤邊界測試更新
   - 執行測試直到零失敗

### 技能

1. **react19-concurrent-patterns** - 用於 React 19 並行功能的深度模式，包括 Suspense、use() Hook、伺服器元件整合與並行批次處理。

2. **react19-source-patterns** - 原始 API 變更的遷移模式，包括 DOM/root API、refs 與 context 更新。

3. **react19-test-patterns** - 全面的測試遷移指南，涵蓋 `act()` 語意、錯誤邊界測試與 StrictMode 行為變更。

## 快速入門

```
輸入： "Start implementing React 19 migration for my codebase"
```

react19-commander 將引導您完成：

1. 稽核 → 識別所有重大變更
2. 相依性 → 升級至 react@19 + 相容的函式庫
3. 遷移 → 修復所有棄用的 API 與模式
4. 測試 → 遷移測試套件並執行至成功

## React 18 的重大變更

### 已移除的 API

- `ReactDOM.render()` → 使用 `createRoot()`
- `ReactDOM.hydrate()` → 使用 `hydrateRoot()`
- `ReactDOM.unmountComponentAtNode()` → 使用 `root.unmount()`
- `ReactDOM.findDOMNode()` → 使用直接 refs
- `React.createFactory()` → 使用 JSX
- `react-dom/test-utils` 匯出
- 遺留 Context API
- 字串 refs

### 棄用模式 (仍可運作但應遷移)

- `forwardRef` → ref 現在是直接 prop
- 函式元件上的 `defaultProps` → 使用 ES6 預設值
- 無初始值的 `useRef()` → 傳遞 `null`

### 行為變更

- StrictMode 不再雙重呼叫 effects (影響測試呼叫次數斷言)
- 移除 `propTypes` 執行時期驗證 (保留做為文件，但無執行時期檢查)

## 關鍵功能

- ✅ 全面移除 8 種以上棄用的 React API
- ✅ 處理複雜模式：遺留 context, forwardRef, defaultProps
- ✅ 基於記憶體的可恢復管線 — 支援中斷後繼續
- ✅ 對不完整遷移零容忍 — 執行直到完全成功
- ✅ 具備 StrictMode 意識的測試修復
- ✅ Testing-library v16+ 相容性驗證
- ✅ 錯誤邊界與非同步測試模式更新

## 先決條件

此插件假設您正從 **React 18** 程式碼庫遷移。如果您使用的是 React 16/17，請先使用 **react18-upgrade** 插件達到 React 18.3.1，然後使用此插件進行 React 19 的最終升級。

## 來源

此插件屬於 [Awesome Copilot](https://github.com/github/awesome-copilot)。

## 授權

MIT
