---
agent: 'agent'
description: '根據當前儲存庫上下文和聊天歷史記錄，從 awesome-copilot 儲存庫中建議相關的 GitHub Copilot 指令檔案，避免與此儲存庫中現有的指令重複。'
tools: ['edit', 'search', 'runCommands', 'runTasks', 'think', 'changes', 'testFailure', 'openSimpleBrowser', 'web/fetch', 'githubRepo', 'todos', 'search']
---

# 建議出色的 GitHub Copilot 指令

分析當前儲存庫上下文，並從 [GitHub awesome-copilot 儲存庫](https://github.com/github/awesome-copilot/blob/main/docs/README.instructions.md) 中建議相關的 copilot-instruction 檔案，這些檔案尚未在此儲存庫中提供。

## 處理程序

1. **擷取可用指令**：從 [awesome-copilot README.instructions.md](https://github.com/github/awesome-copilot/blob/main/docs/README.instructions.md) 中提取指令列表和描述。必須使用 `#fetch` 工具。
2. **掃描本地指令**：在 `.github/instructions/` 資料夾中發現現有的指令檔案
3. **提取描述**：從本地指令檔案中讀取前置內容以獲取描述和 `applyTo` 模式
4. **分析上下文**：審查聊天歷史記錄、儲存庫檔案和當前專案需求
5. **比較現有**：與此儲存庫中已有的指令進行比較
6. **匹配相關性**：將可用指令與已識別的模式和要求進行比較
7. **呈現選項**：顯示相關指令，包括描述、理由和可用性狀態
8. **驗證**：確保建議的指令將增加現有指令未涵蓋的價值
9. **輸出**：提供結構化表格，其中包含建議、描述以及指向 awesome-copilot 指令和類似本地指令的連結
   **等待**使用者請求以繼續安裝特定的指令。除非另有指示，否則請勿安裝。
10. **下載資產**：對於請求的指令，自動下載並將個別指令安裝到 `.github/instructions/` 資料夾。請勿調整檔案內容。使用 `#todos` 工具追蹤進度。優先使用 `#fetch` 工具下載資產，但可以使用 `#runInTerminal` 工具中的 `curl` 來確保檢索所有內容。

## 上下文分析標準

🔍 **儲存庫模式**：
- 使用的程式語言 (.cs, .js, .py, .ts 等)
- 框架指標 (ASP.NET, React, Azure, Next.js 等)
- 專案類型 (Web 應用程式、API、函式庫、工具)
- 開發工作流程要求 (測試、CI/CD、部署)

🗨️ **聊天歷史記錄上下文**：
- 最近的討論和痛點
- 技術特定問題
- 編碼標準討論
- 開發工作流程要求

## 輸出格式

以結構化表格顯示分析結果，比較 awesome-copilot 指令與現有儲存庫指令：

| Awesome-Copilot 指令 | 描述 | 已安裝 | 類似的本地指令 | 建議理由 |
|------------------------------|-------------|-------------------|---------------------------|---------------------|
| [blazor.instructions.md](https://github.com/github/awesome-copilot/blob/main/instructions/blazor.instructions.md) | Blazor 開發指南 | ❌ 否 | blazor.instructions.md | 已由現有的 Blazor 指令涵蓋 |
| [reactjs.instructions.md](https://github.com/github/awesome-copilot/blob/main/instructions/reactjs.instructions.md) | ReactJS 開發標準 | ❌ 否 | 無 | 將透過既定模式增強 React 開發 |
| [java.instructions.md](https://github.com/github/awesome-copilot/blob/main/instructions/java.instructions.md) | Java 開發最佳實踐 | ❌ 否 | 無 | 可以提高 Java 程式碼品質和一致性 |

## 本地指令發現處理程序

1. 列出 `instructions/` 目錄中的所有 `*.instructions.md` 檔案
2. 對於每個發現的檔案，讀取前置內容以提取 `description` 和 `applyTo` 模式
3. 建立現有指令的綜合清單及其適用的檔案模式
4. 使用此清單避免建議重複項

## 檔案結構要求

根據 GitHub 文件，copilot-instructions 檔案應為：
- **儲存庫範圍指令**：`.github/copilot-instructions.md` (適用於整個儲存庫)
- **路徑特定指令**：`.github/instructions/NAME.instructions.md` (透過 `applyTo` 前置內容適用於特定檔案模式)
- **社群指令**：`instructions/NAME.instructions.md` (用於共享和分發)

## 前置內容結構

awesome-copilot 中的指令檔案使用此前置內容格式：
```markdown
---
description: '此指令提供的簡要描述'
applyTo: '**/*.js,**/*.ts' # 可選：用於檔案匹配的 glob 模式
---
```

## 要求

- 使用 `githubRepo` 工具從 awesome-copilot 儲存庫獲取內容
- 掃描本地檔案系統以查找 `instructions/` 目錄中現有的指令
- 從本地指令檔案中讀取 YAML 前置內容以提取描述和 `applyTo` 模式
- 與此儲存庫中現有的指令進行比較以避免重複
- 專注於當前指令函式庫覆蓋範圍中的空白
- 驗證建議的指令是否符合儲存庫的用途和標準
- 為每個建議提供明確的理由
- 包含指向 awesome-copilot 指令和類似本地指令的連結
- 考慮技術堆疊相容性和專案特定需求
- 除了表格和分析之外，不提供任何額外資訊或上下文

## 圖示參考

- ✅ 已安裝在儲存庫中
- ❌ 未安裝在儲存庫中
