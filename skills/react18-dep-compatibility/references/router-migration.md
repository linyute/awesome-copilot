# React Router v5 → v6 - 範圍評估 (Scope Assessment)

## 為何這是一個獨立的衝刺 (Sprint)

React Router v5 → v6 是一次完全的 API 重寫。與大多數影響個別模式的 React 18 升級步驟不同，router 遷移會影響：

- 每個 `<Route>` 元件
- 每個 `<Switch>` (由 `<Routes>` 取代)
- 每個 `useHistory()` (由 `useNavigate()` 取代)
- 每個 `useRouteMatch()` (由 `useMatch()` 取代)
- 每個 `<Redirect>` (由 `<Navigate>` 取代)
- 巢狀路由定義 (完全不同的模型)
- 路由參數 (Route parameters) 的存取
- 查詢字串 (Query string) 的處理

若嘗試將其作為 React 18 升級衝刺的一部分，將顯著擴大遷移的範圍。

## 推薦做法

### 選項 A - 延後 Router 遷移 (推薦)

在 React 18 升級期間，搭配 `--legacy-peer-deps` 使用 `react-router-dom@5.3.4`。這是 react-router 團隊明確記錄的支援做法，用於在舊版根節點上實現 React 18 相容性。

```bash
# 在 React 18 依賴項目調整期間：
npm install react-router-dom@5.3.4 --legacy-peer-deps
```

在 package.json 中記錄：

```json
"_legacyPeerDepsReason": {
  "react-router-dom@5.3.4": "Router v5→v6 遷移延後至獨立衝刺。僅為 React 18 同級依賴項目不匹配 — 在舊版根節點上無 API 不相容問題。"
}
```

然後在 React 18 升級穩定後，再將 v5 → v6 遷移排入其專屬的衝刺中。

### 選項 B - 將 Router 遷移作為 React 18 衝刺的一部分

僅在以下情況下選擇此選項：

- 應用程式的路由極少 (< 10 個路由，無巢狀路由，無複雜導覽邏輯)
- 團隊有足夠餘裕且衝刺時程允許

### 範圍評估掃描

在決定前，請執行此操作以了解 router 遷移的範圍：

```bash
echo "=== 路由定義 ==="
grep -rn "<Route\|<Switch\|<Redirect" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l

echo "=== useHistory 呼叫 ==="
grep -rn "useHistory()" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l

echo "=== useRouteMatch 呼叫 ==="
grep -rn "useRouteMatch()" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l

echo "=== withRouter HOC ==="
grep -rn "withRouter" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l

echo "=== history.push / history.replace ==="
grep -rn "history\.push\|history\.replace\|history\.go" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l
```

**決策指南：**

- 命中總數 < 30 → router 遷移在此衝刺中是可行的
- 命中總數 30–100 → 強烈建議延後
- 命中總數 > 100 → 必須延後 - 需要獨立衝刺

## v5 → v6 API 變更摘要

| v5 | v6 | 備註 |
|---|---|---|
| `<Switch>` | `<Routes>` | 直接取代 |
| `<Route path="/" component={C}>` | `<Route path="/" element={<C />}>` | 使用 element prop，而非 component |
| `<Route exact path="/">` | `<Route path="/">` | 在 v6 中 exact 是預設值 |
| `<Redirect to="/new">` | `<Navigate to="/new" />` | 元件更名 |
| `useHistory()` | `useNavigate()` | 回傳的是一個函式，而非物件 |
| `history.push('/path')` | `navigate('/path')` | 直接呼叫 |
| `history.replace('/path')` | `navigate('/path', { replace: true })` | 選項物件 (Options object) |
| `useRouteMatch()` | `useMatch()` | 回傳形狀不同 |
| `match.params` | `useParams()` | 改用 Hook 而非 prop |
| 內嵌巢狀路由 | 組態中的巢狀路由 | 版面配置路由 (Layout routes) 的概念 |
| `withRouter` HOC | `useNavigate` / `useParams` hooks | 已移除 HOC |
