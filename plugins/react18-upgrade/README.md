# React 18 升級外掛程式

將 React 16/17 類別元件程式碼庫遷移至 React 18.3.1 的企業級工具包。包含六個專屬 agent 與七項 skill，專門針對升級大量使用類別的舊版應用程式時所面臨的特定挑戰。

## 安裝

```bash
copilot plugin install react18-upgrade@awesome-copilot
```

## 包含內容

### Agents

1. **react18-commander** - 主協調器，透過稽核、相依性、類別元件改造、自動批次處理修正以及測試驗證階段來協調整個遷移管線。

2. **react18-auditor** - 深度掃描專家，識別每個 React 18 重大變更：不安全的生命週期方法、舊版 context、字串 ref、批次處理弱點以及所有淘汰模式。

3. **react18-dep-surgeon** - 相依性升級專家，精確鎖定 react@18.3.1、將 testing-library 升級至 v14+、解決所有 peer 衝突，並傳回 GO/NO-GO 確認。

4. **react18-class-surgeon** - 生命週期與 API 遷移專家，針對以下項目執行語意遷移：
   - `componentWillMount` → `componentDidMount` 或 constructor
   - `componentWillReceiveProps` → `getDerivedStateFromProps` 或 `componentDidUpdate`
   - `componentWillUpdate` → `getSnapshotBeforeUpdate` 或 `componentDidUpdate`
   - 舊版 Context → `createContext`
   - 字串 ref → `React.createRef()`
   - `findDOMNode` → 直接 ref
   - `ReactDOM.render` → `createRoot`

5. **react18-batching-fixer** - 自動批次處理迴歸專家，識別並修正 React 18 中排名第一的無訊息執行階段破壞點：非同步方法中依賴立即中繼重新轉譯的 setState 呼叫。

6. **react18-test-guardian** - 測試套件修正專家，處理 Enzyme 至 RTL 的重寫、RTL v14 API 更新、自動批次處理測試迴歸、StrictMode 重複叫用變更，並執行測試直到零失敗。

### Skills

1. **react-audit-grep-patterns** - 用於跨類別元件稽核 React 18 淘汰項目的參考 grep 模式。

2. **react18-batching-patterns** - 用於識別和修正自動批次處理迴歸的模式與策略。

3. **react18-dep-compatibility** - React 18 的相依性相容性對照表，包含 testing-library、Apollo、Emotion、react-router 的遷移路徑。

4. **react18-enzyme-to-rtl** - 將 Enzyme 測試重寫為 React Testing Library (RTL v14+) 的完整指南。

5. **react18-legacy-context** - 舊版 context API → `createContext` 的遷移模式。

6. **react18-lifecycle-patterns** - 所有三種不安全生命週期方法的詳細遷移模式。

7. **react18-string-refs** - 將字串 ref 遷移至 `React.createRef()` 的參考實作。

## 快速開始

```
Ask: "Start implementing React 18 migration for my class-component codebase"
```

react18-commander 將引導您完成：

1. 稽核 → 識別所有重大變更
2. 相依性 → 升級至 react@18.3.1 + 相容函式庫
3. 類別改造 → 遷移生命週期方法與 API
4. 批次處理修正 → 修正自動批次處理迴歸
5. 測試 → 遷移測試套件並執行至全部通過

## 為什麼選擇 React 18.3.1？

React 18.3.1 的發布是為了對 React 19 將移除的每個 API 顯示**明確警告**。零警告的乾淨 18.3.1 執行是進行 React 19 遷移的直接先決條件。

## 主要特色

- ✅ 專門針對大量使用類別元件的程式碼庫（而非僅限函式元件模式）
- ✅ 自動批次處理問題偵測與 `flushSync` 建議
- ✅ Enzyme 測試偵測並具備完整的 RTL 重寫能力
- ✅ 基於記憶體的可續傳管線 — 在中斷後繼續執行
- ✅ 對不完整遷移零容忍 — 執行直到完全成功
- ✅ 具備 StrictMode 感知能力的測試修正
- ✅ 處理 Apollo Client、Emotion、react-router 相容性

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。

## 授權

MIT
