# Apollo Client - React 18 相容性詳細資料

## 為何需要 Apollo 3.8+

Apollo Client 3.7 及以下版本使用內部的訂閱模型 (subscription model)，該模型與 React 18 的並行渲染 (concurrent rendering) 不相容。在並行模式下，React 可能會中斷並重放渲染，這會導致 Apollo 的儲存區 (store) 訂閱在錯誤的時間觸發 — 進而產生過時的資料或遺漏更新。

Apollo 3.8 是第一個採用 `useSyncExternalStore` 的版本，這是 React 18 讓外部儲存區在並行渲染下正常運作所必需的。

## 版本摘要

| Apollo 版本 | React 18 支援 | React 19 支援 | 備註 |
|---|---|---|---|
| < 3.7 | ❌ | ❌ | 並行模式資料撕裂 (data tearing) |
| 3.7.x | ⚠️ | ⚠️ | 僅適用於舊版根節點 (ReactDOM.render) |
| **3.8.x** | ✅ | ✅ | 第一個完全相容的版本 |
| 3.9+ | ✅ | ✅ | 推薦使用 |
| 3.11+ | ✅ | ✅ (已確認) | 已新增明確的 React 19 測試 |

## 如果您正在舊版根節點上使用 Apollo 3.7

如果應用程式仍在使用 `ReactDOM.render` (舊版根節點) 且尚未遷移到 `createRoot`，Apollo 3.7 技術上仍可運作 — 但這表示您無法獲得任何 React 18 的並行功能 (包括自動批次處理)。這僅屬於部分升級。

一旦開始使用 `createRoot`，請立即升級到 Apollo 3.8+。

## 測試中的 MockedProvider - React 18

Apollo 的 `MockedProvider` 可在 React 18 下運作，但非同步行為已變更：

```jsx
// 舊模式 - 使用 setTimeout 排清：
await new Promise(resolve => setTimeout(resolve, 0));
wrapper.update();

// React 18 模式 - 使用 waitFor 或 findBy：
await waitFor(() => {
  expect(screen.getByText('Alice')).toBeInTheDocument();
});
// 或者：
expect(await screen.findByText('Alice')).toBeInTheDocument();
```

## 升級 Apollo

```bash
npm install @apollo/client@latest graphql@latest
```

如果 graphql 同級依賴項目與其他套件衝突：

```bash
npm ls graphql  # 檢查正在使用的版本
npm info @apollo/client peerDependencies  # 檢查 apollo 的需求
```

Apollo 3.8+ 同時支援 `graphql@15` 和 `graphql@16`。

## InMemoryCache - 無需變更

`InMemoryCache` 的組態不受 React 18 升級影響。以下項目無需遷移：

- `typePolicies`
- `fragmentMatcher`
- `possibleTypes`
- 自訂欄位策略 (Custom field policies)

## useQuery / useMutation / useSubscription - 無變更

Apollo hooks 的 API 並未改變。此次升級完全屬於 Apollo 與 React 渲染模型整合方式的內部變更。
