---
name: react18-string-refs
description: '提供將 React 字串 ref (ref="name" + this.refs.name) 遷移至類別元件中的 React.createRef() 的精確遷移模式。每當需要遷移字串 ref 的用法時，請使用此技能 — 包括單一元素 ref、元件中的多個 ref、清單中的 ref、回呼 (callback) ref 以及傳遞給子元件的 ref。在撰寫任何 ref 遷移程式碼之前，請務必使用此技能 — 「清單中有多個 ref」的模式特別棘手，而此技能可防止最常見的錯誤。此技能適用於 React 18.3.1 遷移 (字串 ref 會發出警告) 及 React 19 遷移 (字串 ref 已移除)。'
---

# React 18 字串 Ref 遷移 (React 18 String Refs Migration)

字串 ref (`ref="myInput"` + `this.refs.myInput`) 已在 React 16.3 中棄用，在 React 18.3.1 中會發出警告，並已在 **React 19 中移除**。

## 快速模式對照表

| 模式 | 參考資料 |
|---|---|
| DOM 元素上的單一 ref | [→ patterns.md#single-ref](references/patterns.md#single-ref) |
| 單一元件中有多個 ref | [→ patterns.md#multiple-refs](references/patterns.md#multiple-refs) |
| 清單中的 ref / 動態 ref | [→ patterns.md#list-refs](references/patterns.md#list-refs) |
| 回呼 (callback) ref (另一種做法) | [→ patterns.md#callback-refs](references/patterns.md#callback-refs) |
| 傳遞給子元件的 ref | [→ patterns.md#forwarded-refs](references/patterns.md#forwarded-refs) |

## 掃描指令

```bash
# 尋找 JSX 中所有的字串 ref 賦值
grep -rn 'ref="' src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 尋找所有的 this.refs 存取器
grep -rn "this\.refs\." src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
```

這兩者應成對進行遷移 — 針對每個元件，找出其 `ref="name"` 與對應的 `this.refs.name` 存取。

## 遷移規則

每個字串 ref 皆應遷移至 `React.createRef()`：

1. 新增 `refName = React.createRef();` 作為類別欄位 (或在 constructor 中新增)
2. 在 JSX 中將 `ref="refName"` 取代為 `ref={this.refName}`
3. 在所有地方將 `this.refs.refName` 取代為 `this.refName.current`

請閱讀 `references/patterns.md` 以取得各案例的完整之前/之後對比。
