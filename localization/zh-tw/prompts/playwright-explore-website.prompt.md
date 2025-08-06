---
mode: agent
description: '使用 Playwright MCP 進行網站探索測試'
tools: ['changes', 'codebase', 'editFiles', 'fetch', 'findTestFiles', 'problems', 'runCommands', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'playwright']
model: 'Claude Sonnet 4'
---

# 網站探索測試

你的目標是探索網站並找出主要功能。

## 具體指示

1. 使用 Playwright MCP Server 前往指定的網址。若未提供網址，請要求使用者提供。
2. 識別並互動 3-5 個核心功能或使用者流程。
3. 記錄使用者互動、相關 UI 元素（及其定位器）與預期結果。
4. 完成後關閉瀏覽器 context。
5. 提供簡明的探索結果摘要。
6. 根據探索內容提出並產生測試案例。

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 翻譯為繁體中文，可能包含錯誤。如發現不適當或錯誤之翻譯，請至 [issue](../../issues) 回報。
