# React 18 升級外掛程式

將 React 16/17 類別元件 (class-component) 程式碼庫遷移至 React 18.3.1 的企業級工具組。包含六個專屬代理和七個技能，旨在解決升級遺留、類別元件繁重的應用程式所面臨的特定挑戰。

## 安裝

```bash
copilot plugin install react18-upgrade@awesome-copilot
```

## 包含內容

### 代理

1. **react18-commander** - 主協調者，透過稽核、相依性、類別元件手術、自動批次修復和測試驗證階段來協調整個遷移管線。

2. **react18-auditor** - 深度掃描專家，識別每一個 React 18 的重大變更：不安全的生命週期方法、遺留 context、字串 refs、批次處理漏洞以及所有棄用模式。

3. **react18-dep-surgeon** - 相依性升級專家，精確鎖定 react@18.3.1，將測試函式庫升級至 v14+，解決所有對等套件衝突，並回傳 GO/NO-GO 確認。

4. **react18-class-surgeon** - 生命週期與 API 遷移專家，執行以下語意遷移：
   - `componentWillMount` → `componentDidMount` 或建構函式 (constructor)
   - `componentWillReceiveProps` → `getDerivedStateFromProps` 或 `componentDidUpdate`
   - `componentWillUpdate` → `getSnapshotBeforeUpdate` 或 `componentDidUpdate`
   - 遺留 Context → `createContext`
   - 字串 refs → `React.createRef()`
   - `findDOMNode` → 直接 refs
   - `ReactDOM.render` → `createRoot`

5. **react18-batching-fixer** - 自動批次迴歸專家，識別並修復 React 18 中排名第一的靜默執行時期中斷點：在非同步方法中依賴立即中間重新渲染的 setState 呼叫。

6. **react18-test-guardian** - 測試套件修復員，處理 Enzyme 轉 RTL 的重寫、RTL v14 API 更新、自動批次測試迴歸、StrictMode 雙重呼叫變更，並執行測試直到零失敗。

### 技能

1. **react-audit-grep-patterns** - 用於稽核類別元件中 React 18 棄用項目的參考 grep 模式。

2. **react18-batching-patterns** - 用於識別與修復自動批次迴歸的模式與策略。

3. **react18-dep-compatibility** - React 18 的相依性相容性矩陣，包含測試函式庫、Apollo、Emotion、react-router 的遷移路徑。

4. **react18-enzyme-to-rtl** - 將 Enzyme 測試重寫為 React Testing Library (RTL v14+) 的完整指南。

5. **react18-legacy-context** - 將遺留 context API 遷移至 `createContext` 的遷移模式。

6. **react18-lifecycle-patterns** - 所有三個不安全生命週期方法的詳細遷移模式。

7. **react18-string-refs** - 將字串 refs 遷移至 `React.createRef()` 的參考實作。

## 快速入門

```
輸入： "Start implementing React 18 migration for my class-component codebase"
```

react18-commander 將引導您完成：

1. 稽核 → 識別所有重大變更
2. 相依性 → 升級至 react@18.3.1 + 相容的函式庫
3. 類別手術 → 遷移生命週期方法與 API
4. 批次處理修復 → 修復自動批次處理迴歸
5. 測試 → 遷移測試套件並執行至成功

## 為什麼選擇 React 18.3.1？

React 18.3.1 的發布是為了針對 React 19 將移除的每個 API 顯示**明確警告**。乾淨執行 18.3.1 且零警告，是遷移至 React 19 的直接先決條件。

## 關鍵功能

- ✅ 鎖定類別元件繁重的程式碼庫 (不僅僅是函式元件模式)
- ✅ 自動批次處理問題偵測與 `flushSync` 建議
- ✅ 具備完全 RTL 重寫能力的 Enzyme 測試偵測
- ✅ 基於記憶體的可恢復管線 — 支援中斷後繼續
- ✅ 對不完整遷移零容忍 — 執行直到完全成功
- ✅ 具備 StrictMode 意識的測試修復
- ✅ 處理 Apollo Client, Emotion, react-router 的相容性

## 來源

此插件屬於 [Awesome Copilot](https://github.com/github/awesome-copilot)。

## 授權

MIT
