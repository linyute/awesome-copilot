---
name: react18-legacy-context
description: '提供將 React 舊版 Context API (contextTypes, childContextTypes, getChildContext) 遷移至現代 createContext API 的完整遷移模式。在類別元件中遷移舊版 Context 時，請使用此技能 — 這始終是一次跨檔案的遷移，需要同時更新提供者 (provider) 與所有消費者 (consumers)。在修改任何 contextTypes 或 childContextTypes 程式碼之前請先閱讀此技能，因為僅遷移提供者而未遷移消費者 (或反之亦然) 會導致執行階段失敗。在撰寫任何 Context 遷移作業之前務必閱讀此技能 — 此處的跨檔案協調步驟可防止最常見的 Context 遷移錯誤。'
---

# React 18 舊版 Context 遷移

舊版 Context (`contextTypes`、`childContextTypes`、`getChildContext`) 已於 React 16.3 棄用，並在 React 18.3.1 中發出警告。它已於 **React 19 中移除**。

## 這始終是一次跨檔案的遷移

與大多數每次僅修改一個檔案的遷移不同，Context 遷移需要協調：
1. 建立 Context 物件 (通常是一個新檔案)
2. 更新**提供者 (provider)** 元件
3. 更新**每一個消費者 (consumer)** 元件

遺漏任何消費者都會導致應用程式損壞 — 它將從錯誤的 Context 讀取或取得 `undefined`。

## 遷移步驟 (務必按此順序執行)

```
步驟 1：尋找提供者 (childContextTypes + getChildContext)
步驟 2：尋找「所有」消費者 (contextTypes)
步驟 3：建立 Context 檔案
步驟 4：更新提供者
步驟 5：更新每個消費者 (類別元件 → contextType，函式元件 → useContext)
步驟 6：驗證 - 執行應用程式，確認不再出現舊版 Context 警告
```

## 掃描指令

```bash
# 尋找所有提供者
grep -rn "childContextTypes\|getChildContext" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 尋找所有消費者
grep -rn "contextTypes\s*=" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 尋找 this.context 的使用 (可能是舊版或新版 - 請確認是哪一種)
grep -rn "this\.context\." src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
```

## 參考檔案

- **`references/single-context.md`** - 單一 Context (主題、身分驗證等) 的完整遷移，包含提供者 + 類別消費者 + 函式消費者
- **`references/multi-context.md`** - 具有多個舊版 Context 的應用程式 (巢狀提供者、不同 Context 的多個消費者)
- **`references/context-file-template.md`** - 新 Context 模組的標準檔案結構
