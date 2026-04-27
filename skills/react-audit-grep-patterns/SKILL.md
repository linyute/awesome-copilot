---
name: react-audit-grep-patterns
description: '提供完整、經過驗證的 grep 掃描指令函式庫，用於在 React 18.3.1 或 React 19 升級前對 React 程式碼庫進行稽核。每當執行遷移稽核時（包括 react18-auditor 和 react19-auditor 代理程式），請使用此技能。包含尋找棄用的 API、已移除的 API、不安全的生命週期方法、批次處理弱點、測試檔案問題、依賴項目衝突以及 React 19 特定移除項目所需的所有 grep 模式。在撰寫稽核掃描指令時務必使用此技能 — 不要依賴記憶來撰寫 grep 語法，特別是需要上下文旗標（context flags）的多行非同步 setState 模式。'
---

# React 稽核 Grep 模式 (React Audit Grep Patterns)

適用於 React 18.3.1 和 React 19 遷移稽核的完整掃描指令函式庫。

## 使用方式

閱讀與您的目標相關的章節：
- **`references/react18-scans.md`** - 所有適用於 React 16/17 → 18.3.1 稽核的掃描
- **`references/react19-scans.md`** - 所有適用於 React 18 → 19 稽核的掃描
- **`references/test-scans.md`** - 測試檔案專用的掃描 (由兩者稽核器使用)
- **`references/dep-scans.md`** - 依賴項目與同級衝突 (peer conflict) 掃描

## 所有掃描中使用的基礎模式

```bash
# 貫穿始終使用的標準旗標：
# -r = 遞迴 (recursive)
# -n = 顯示行號
# -l = 僅顯示檔名 (用於計算受影響的檔案數量)
# --include="*.js" --include="*.jsx" = 僅限 JS/JSX 檔案
# | grep -v "\.test\.\|\.spec\.\|__tests__" = 排除測試檔案
# | grep -v "node_modules" = 安全防範 (通常透過不掃描 node_modules 來處理)
# 2>/dev/null = 隱藏「找不到檔案」錯誤

# 僅限原始碼檔案 (排除測試)：
SRC_FLAGS='--include="*.js" --include="*.jsx"'
EXCLUDE_TESTS='grep -v "\.test\.\|\.spec\.\|__tests__"'

# 僅限測試檔案：
TEST_FLAGS='--include="*.test.js" --include="*.test.jsx" --include="*.spec.js" --include="*.spec.jsx"'
```
