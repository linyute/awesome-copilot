---
name: react18-batching-patterns
description: '提供用於診斷與修正 React 18 類別元件中自動批次處理效能下降的確切模式。每當類別元件在非同步方法中、setTimeout 中、Promise .then() 或 .catch() 中、或者在原生事件處理常式中有多個 setState 呼叫時，請使用此技能。在撰寫任何 flushSync 呼叫之前，請使用此技能 — 此處的決策樹可防止過度使用不必要的 flushSync。在修正因 React 18 升級後損壞的中間狀態斷言 (intermediate state assertions) 而導致的測試失敗時，也請使用此技能。'
---

# React 18 自動批次處理模式 (Automatic Batching Patterns)

用於診斷與修正 React 18 中針對類別元件程式碼庫最危險的潛在重大變更。

## 核心變更

| setState 的位置 | React 17 | React 18 |
|---|---|---|
| React 事件處理常式 | 已批次處理 | 已批次處理 (相同) |
| setTimeout | **立即重新渲染** | **已批次處理** |
| Promise .then() / .catch() | **立即重新渲染** | **已批次處理** |
| async/await | **立即重新渲染** | **已批次處理** |
| 原生 addEventListener 回呼 | **立即重新渲染** | **已批次處理** |

**已批次處理 (Batched)** 表示：該執行內容中的所有 `setState` 呼叫都會在最後一次重新渲染中一起排清 (flush)。不會發生中間渲染。

## 快速診斷

閱讀每個非同步類別方法。請問：`await` 之後是否有任何程式碼讀取 `this.state` 以做出決定？

```
程式碼在 await 之後讀取 this.state 嗎？
  是 → A 類 (潛藏的狀態讀取錯誤)
  否，但中間渲染必須讓使用者看見嗎？
    是 → C 類 (需要 flushSync)
    否 → B 類 (重構，不需要 flushSync)
```

有關各類別的完整模式，請參閱：
- **`references/batching-categories.md`** - A、B、C 類及其完整的前後程式碼對比
- **`references/flushSync-guide.md`** - 何時使用 flushSync，何時不使用，以及匯入語法

## flushSync 規則

**請謹慎使用 `flushSync`。** 它會強制執行同步重新渲染，跳過 React 18 的並行排程器。過度使用會抵消 React 18 的效能優勢。

僅在以下情況使用 `flushSync`：
- 使用者必須在非同步作業開始之前看到中間的 UI 狀態
- 在擷取開始前必須渲染載入動畫/載入狀態
- 連續的 UI 步驟具有不同的可見狀態 (例如進度精靈、多步驟流程)

在大多數情況下，修正方式是**重構** — 重新結構化程式碼，使其不在 `await` 之後讀取 `this.state`。請閱讀 `references/batching-categories.md` 以了解各類別的正確做法。
