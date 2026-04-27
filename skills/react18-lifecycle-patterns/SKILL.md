---
name: react18-lifecycle-patterns
description: '針對 React 18.3.1 提供三種不安全的類別元件生命週期方法 — componentWillMount、componentWillReceiveProps 與 componentWillUpdate — 的確切之前/之後遷移模式。每當需要遷移類別元件的生命週期方法、在 getDerivedStateFromProps 與 componentDidUpdate 之間做出抉擇、新增 getSnapshotBeforeUpdate，或是修正 React 18 的 UNSAFE_ 生命週期警告時，請使用此技能。在撰寫任何生命週期遷移程式碼之前務必使用此技能 — 不要憑記憶猜測模式，此處的決策樹可防止最常見的遷移錯誤。'
---

# React 18 生命週期模式 (Lifecycle Patterns)

將三種不安全的類別元件生命週期方法遷移至符合 React 18.3.1 規範模式的參考指南。

## 快速決策指南

在遷移任何生命週期方法之前，請先識別該方法所執行的**語義類別**。類別錯誤 = 遷移錯誤。下表將引導您至正確的參考檔案。

### componentWillMount - 它的用途為何？

| 用途 | 正確的遷移方式 | 參考資料 |
|---|---|---|
| 設定初始狀態 (`this.setState(...)`) | 移至 `constructor` | [→ componentWillMount.md](references/componentWillMount.md#case-a) |
| 執行副作用 (擷取 fetch、訂閱、DOM) | 移至 `componentDidMount` | [→ componentWillMount.md](references/componentWillMount.md#case-b) |
| 從 props 衍生初始狀態 | 搭配 props 移至 `constructor` | [→ componentWillMount.md](references/componentWillMount.md#case-c) |

### componentWillReceiveProps - 它的用途為何？

| 用途 | 正確的遷移方式 | 參考資料 |
|---|---|---|
| 由 prop 變更觸發的非同步副作用 (擷取 fetch、取消) | `componentDidUpdate` | [→ componentWillReceiveProps.md](references/componentWillReceiveProps.md#case-a) |
| 從新 props 進行純狀態衍生 (無副作用) | `getDerivedStateFromProps` | [→ componentWillReceiveProps.md](references/componentWillReceiveProps.md#case-b) |

### componentWillUpdate - 它的用途為何？

| 用途 | 正確的遷移方式 | 參考資料 |
|---|---|---|
| 在更新前讀取 DOM (捲動、尺寸、位置) | `getSnapshotBeforeUpdate` | [→ componentWillUpdate.md](references/componentWillUpdate.md#case-a) |
| 在更新前取消請求 / 執行影響 (effects) | 搭配先前值比較的 `componentDidUpdate` | [→ componentWillUpdate.md](references/componentWillUpdate.md#case-b) |

---

## UNSAFE_ 前綴規則

**切勿將 `UNSAFE_componentWillMount`、`UNSAFE_componentWillReceiveProps` 或 `UNSAFE_componentWillUpdate` 視為永久的修正方案。**

加上前綴雖然可以抑制 React 18.3.1 的警告，但「無法」：
- 修正並行模式的安全問題
- 為 React 19 做好程式碼庫準備 (在 React 19 中，無論有無前綴，這些方法都會被移除)
- 修正遷移原本要解決的底層語義問題

加上 `UNSAFE_` 前綴僅適合在排定真正的遷移衝刺時作為暫時性的應急措施。若新增了 `UNSAFE_` 前綴，請務必標註以下註解：
```jsx
// TODO: React 19 將移除此方法。請在升級 React 19 前完成遷移。
// 暫時加上 UNSAFE_ 前綴 - 請改用 componentDidMount / getDerivedStateFromProps 等方法替換。
```

---

## 參考檔案

請閱讀您要遷移的生命週期方法的完整參考檔案：

- **`references/componentWillMount.md`** - 包含 3 個案例的完整之前/之後程式碼
- **`references/componentWillReceiveProps.md`** - getDerivedStateFromProps 陷阱警告與完整範例
- **`references/componentWillUpdate.md`** - getSnapshotBeforeUpdate 與 componentDidUpdate 的配對使用

在撰寫任何遷移程式碼之前，請先閱讀相關檔案。
