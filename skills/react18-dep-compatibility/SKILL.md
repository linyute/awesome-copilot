---
name: react18-dep-compatibility
description: 'React 18.3.1 與 React 19 依賴項目相容性矩陣。'
---

# React 依賴項目相容性矩陣 (React Dependency Compatibility Matrix)

React 18.3.1 和 React 19 相容性所需的最低版本。

每當檢查依賴項目是否支援目標 React 版本、解決同級依賴項目 (peer dependency) 衝突、決定是否升級或使用 `legacy-peer-deps`，或是評估 `react-router` 從 v5 遷移至 v6 的風險時，請使用此技能。

在 React 升級期間執行 `npm install` 之前，以及在接受 npm 依賴項目衝突解決方案 (特別是可能影響並行模式相容性的方案) 之前，請檢視此矩陣。

## 核心升級目標

| 套件 | React 17 (目前) | React 18.3.1 (最低) | React 19 (最低) | 備註 |
|---|---|---|---|---|
| `react` | 17.x | **18.3.1** | **19.0.0** | 為 R18 協作精確固定在 18.3.1 |
| `react-dom` | 17.x | **18.3.1** | **19.0.0** | 必須與 react 版本完全一致 |

## 測試函式庫

| 套件 | React 18 最低 | React 19 最低 | 備註 |
|---|---|---|---|
| `@testing-library/react` | **14.0.0** | **16.0.0** | RTL 13 內部使用 ReactDOM.render - 在 R18 中會損壞 |
| `@testing-library/jest-dom` | **6.0.0** | **6.0.0** | v5 可運作，但 v6 具有 React 18 匹配器更新 |
| `@testing-library/user-event` | **14.0.0** | **14.0.0** | v13 是同步的，v14 是非同步的 - 需要進行 API 變更 |
| `jest` | **27.x** | **27.x** | 搭配 jsdom 16+ 的 jest 27+ 適用於 React 18 |
| `jest-environment-jsdom` | **27.x** | **27.x** | 必須與 jest 版本一致 |

## Apollo Client

| 套件 | React 18 最低 | React 19 最低 | 備註 |
|---|---|---|---|
| `@apollo/client` | **3.8.0** | **3.11.0** | 3.8 新增了用於並行模式的 `useSyncExternalStore` |
| `graphql` | **15.x** | **16.x** | Apollo 3.8+ 同級需求為 graphql 15 或 16 |

閱讀 **`references/apollo-details.md`** 以了解並行模式問題與 MockedProvider 的變更。

## Emotion

| 套件 | React 18 最低 | React 19 最低 | 備註 |
|---|---|---|---|
| `@emotion/react` | **11.10.0** | **11.13.0** | 11.10 新增了 React 18 並行模式支援 |
| `@emotion/styled` | **11.10.0** | **11.13.0** | 必須與 @emotion/react 版本一致 |
| `@emotion/cache` | **11.10.0** | **11.13.0** | 若直接使用 |

## React Router

| 套件 | React 18 最低 | React 19 最低 | 備註 |
|---|---|---|---|
| `react-router-dom` | **v6.0.0** | **v6.8.0** | v5 → v6 是一次重大的遷移變更 - 請參閱下方詳細資料 |
| `react-router-dom` v5 | 5.3.4 (權宜措施) | ❌ 不支援 | 請參閱舊版同級依賴項目 (legacy peer deps) 說明 |

**react-router v5 → v6 是一個「獨立」的遷移衝刺。** 請閱讀 `references/router-migration.md`。

## Redux

| 套件 | React 18 最低 | React 19 最低 | 備註 |
|---|---|---|---|
| `react-redux` | **8.0.0** | **9.0.0** | v7 僅在 R18 舊版根節點下運作 - 在並行模式下會損壞 |
| `redux` | **4.x** | **5.x** | Redux 本身與框架無關 - 重點在於 react-redux 版本 |
| `@reduxjs/toolkit` | **1.9.0** | **2.0.0** | RTK 1.9 已針對 React 18 完成測試 |

## 其他常用套件

| 套件 | React 18 最低 | React 19 最低 | 備註 |
|---|---|---|---|
| `react-query` / `@tanstack/react-query` | **4.0.0** | **5.0.0** | v3 不支援並行模式 |
| `react-hook-form` | **7.0.0** | **7.43.0** | v6 存在並行模式問題 |
| `formik` | **2.2.9** | **2.4.0** | v2.2.9 已針對 React 18 發布修補程式 |
| `react-select` | **5.0.0** | **5.8.0** | v4 與 R18 存在同級依賴項目衝突 |
| `react-datepicker` | **4.8.0** | **6.0.0** | v4.8+ 新增了 React 18 支援 |
| `react-dnd` | **16.0.0** | **16.0.0** | v15 及以下版本存在 R18 並行模式問題 |
| `prop-types` | 任何 | 任何 | 獨立套件 - 不受 React 版本影響 |

---

## 衝突解決決策樹

```
npm ls 顯示套件 X 存在同級衝突
         │
         ▼
套件 X 是否有支援 React 18 的版本？
  是 → npm install X@[最低相容版本]
  否  ↓
         │
該套件對應用程式來說是否至關重要？
  是 → 檢查 GitHub issues 是否有 React 18 分支 (branch)/分叉 (fork)
      → 檢查維護者是否已開啟 PR
      → 最後手段：--legacy-peer-deps (記錄原因)
  否  → 考慮移除該套件
```

## --legacy-peer-deps 規則

僅在以下情況使用 `--legacy-peer-deps`：
- 該套件沒有 React 18 相容的發行版本
- 該套件仍在積極維護 (未被拋棄)
- 衝突僅為同級依賴項目宣告不匹配 (而非實際 API 不相容)

**在 package.json 頂部的註解中，或在 MIGRATION.md 檔案中，記錄每次使用 `--legacy-peer-deps` 的原因**，說明其必要性。
