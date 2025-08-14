---
mode: 'agent'
description: '根據情境使用 Playwright MCP 產生 Playwright 測試'
tools: ['changes', 'codebase', 'editFiles', 'fetch', 'findTestFiles', 'problems', 'runCommands', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'playwright']
model: 'Claude Sonnet 4'
---

# 使用 Playwright MCP 產生測試

你的目標是在完成所有指定步驟後，根據提供的情境產生 Playwright 測試。

## 具體指示

- 你會獲得一個情境，需根據此情境產生 Playwright 測試。如果使用者未提供情境，請主動要求提供。
- 請勿在未完成所有指定步驟前，過早產生測試程式碼或僅根據情境產生測試。
- 請使用 Playwright MCP 所提供的工具，逐步執行每個步驟。
- 僅在所有步驟完成後，根據訊息歷史產生使用 `@playwright/test` 的 Playwright TypeScript 測試。
- 將產生的測試檔案儲存於 tests 目錄。
- 執行測試檔案並持續修正，直到測試通過為止。

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 翻譯為繁體中文，可能包含錯誤。如發現不適當或錯誤之翻譯，請至 [issue](../../issues) 回報。
