---
agent: 'agent'
description: '根據當前儲存庫上下文和聊天歷史記錄，從 awesome-copilot 儲存庫中建議相關的 GitHub Copilot 提示檔案，避免與此儲存庫中現有的提示重複。'
tools: ['edit', 'search', 'runCommands', 'runTasks', 'think', 'changes', 'testFailure', 'openSimpleBrowser', 'web/fetch', 'githubRepo', 'todos', 'search']
---

# 建議出色的 GitHub Copilot 提示

分析當前儲存庫上下文，並從 [GitHub awesome-copilot 儲存庫](https://github.com/github/awesome-copilot/blob/main/docs/README.prompts.md) 中建議相關的提示檔案，這些檔案尚未在此儲存庫中提供。

## 處理程序

1. **擷取可用提示**：從 [awesome-copilot README.prompts.md](https://github.com/github/awesome-copilot/blob/main/docs/README.prompts.md) 中提取提示列表和描述。必須使用 `#fetch` 工具。
2. **掃描本地提示**：在 `.github/prompts/` 資料夾中發現現有的提示檔案
3. **提取描述**：從本地提示檔案中讀取前置內容以獲取描述
4. **分析上下文**：審查聊天歷史記錄、儲存庫檔案和當前專案需求
5. **比較現有**：與此儲存庫中已有的提示進行比較
6. **匹配相關性**：將可用提示與已識別的模式和要求進行比較
7. **呈現選項**：顯示相關提示，包括描述、理由和可用性狀態
8. **驗證**：確保建議的提示將增加現有提示未涵蓋的價值
9. **輸出**：提供結構化表格，其中包含建議、描述以及指向 awesome-copilot 提示和類似本地提示的連結
   **等待**使用者請求以繼續安裝特定的指令。除非另有指示，否則請勿安裝。
10. **下載資產**：對於請求的指令，自動下載並將個別指令安裝到 `.github/prompts/` 資料夾。請勿調整檔案內容。使用 `#todos` 工具追蹤進度。優先使用 `#fetch` 工具下載資產，但可以使用 `#runInTerminal` 工具中的 `curl` 來確保檢索所有內容。

## 上下文分析標準

🔍 **儲存庫模式**：
- 使用的程式語言 (.cs, .js, .py 等)
- 框架指標 (ASP.NET, React, Azure 等)
- 專案類型 (Web 應用程式、API、函式庫、工具)
- 文件需求 (README、規格、ADR)

🗨️ **聊天歷史記錄上下文**：
- 最近的討論和痛點
- 功能請求或實作需求
- 程式碼審查模式
- 開發工作流程要求

## 輸出格式

以結構化表格顯示分析結果，比較 awesome-copilot 提示與現有儲存庫提示：

| Awesome-Copilot 提示 | 描述 | 已安裝 | 類似的本地提示 | 建議理由 |
|-------------------------|-------------|-------------------|---------------------|---------------------|
| [code-review.md](https://github.com/github/awesome-copilot/blob/main/prompts/code-review.md) | 自動化程式碼審查提示 | ❌ 否 | 無 | 將透過標準化程式碼審查流程增強開發工作流程 |
| [documentation.md](https://github.com/github/awesome-copilot/blob/main/prompts/documentation.md) | 產生專案文件 | ✅ 是 | create_oo_component_documentation.prompt.md | 已由現有的文件提示涵蓋 |
| [debugging.md](https://github.com/github/awesome-copilot/blob/main/prompts/debugging.md) | 偵錯協助提示 | ❌ 否 | 無 | 可以提高開發團隊的故障排除效率 |

## 本地提示發現處理程序

1. 列出 `.github/prompts/` 目錄中的所有 `*.prompt.md` 檔案。
2. 對於每個發現的檔案，讀取前置內容以提取 `description`
3. 建立現有提示的綜合清單
4. 使用此清單避免建議重複項

## 要求

- 使用 `githubRepo` 工具從 awesome-copilot 儲存庫獲取內容
- 掃描本地檔案系統以查找 `.github/prompts/` 目錄中現有的提示
- 從本地提示檔案中讀取 YAML 前置內容以提取描述
- 與此儲存庫中現有的提示進行比較以避免重複
- 專注於當前提示函式庫覆蓋範圍中的空白
- 驗證建議的提示是否符合儲存庫的用途和標準
- 為每個建議提供明確的理由
- 包含指向 awesome-copilot 提示和類似本地提示的連結
- 除了表格和分析之外，不提供任何額外資訊或上下文


## 圖示參考

- ✅ 已安裝在儲存庫中
- ❌ 未安裝在儲存庫中
