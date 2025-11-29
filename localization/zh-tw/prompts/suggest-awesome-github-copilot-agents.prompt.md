---
agent: "agent"
description: "根據當前儲存庫上下文和聊天歷史記錄，從 awesome-copilot 儲存庫中建議相關的 GitHub Copilot 自訂代理程式檔案，避免與此儲存庫中現有的自訂代理程式重複。"
tools: ["edit", "search", "runCommands", "runTasks", "changes", "testFailure", "openSimpleBrowser", "fetch", "githubRepo", "todos"]
---

# 建議出色的 GitHub Copilot 自訂代理程式

分析當前儲存庫上下文，並從 [GitHub awesome-copilot 儲存庫](https://github.com/github/awesome-copilot/blob/main/docs/README.agents.md) 中建議相關的自訂代理程式檔案，這些檔案尚未在此儲存庫中提供。自訂代理程式檔案位於 awesome-copilot 儲存庫的 [agents](https://github.com/github/awesome-copilot/tree/main/agents) 資料夾中。

## 處理程序

1. **擷取可用的自訂代理程式**：從 [awesome-copilot README.agents.md](https://github.com/github/awesome-copilot/blob/main/docs/README.agents.md) 中提取自訂代理程式列表和描述。必須使用 `fetch` 工具。
2. **掃描本地自訂代理程式**：在 `.github/agents/` 資料夾中發現現有的自訂代理程式檔案
3. **提取描述**：從本地自訂代理程式檔案中讀取前置內容以獲取描述
4. **分析上下文**：審查聊天歷史記錄、儲存庫檔案和當前專案需求
5. **比較現有**：與此儲存庫中已有的自訂代理程式進行比較
6. **匹配相關性**：將可用的自訂代理程式與已識別的模式和要求進行比較
7. **呈現選項**：顯示相關的自訂代理程式，包括描述、理由和可用性狀態
8. **驗證**：確保建議的代理程式將增加現有代理程式未涵蓋的價值
9. **輸出**：提供結構化表格，其中包含建議、描述以及指向 awesome-copilot 自訂代理程式和類似本地自訂代理程式的連結
   **等待**使用者請求以繼續安裝特定的自訂代理程式。除非另有指示，否則請勿安裝。
10. **下載資產**：對於請求的代理程式，自動下載並將個別代理程式安裝到 `.github/agents/` 資料夾。請勿調整檔案內容。使用 `#todos` 工具追蹤進度。優先使用 `#fetch` 工具下載資產，但可以使用 `#runInTerminal` 工具中的 `curl` 來確保檢索所有內容。

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

以結構化表格顯示分析結果，比較 awesome-copilot 自訂代理程式與現有儲存庫自訂代理程式：

| Awesome-Copilot 自訂代理程式                                                                                                                            | 描述                                                                                                                                                                | 已安裝 | 類似的本地自訂代理程式         | 建議理由                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------- | ------------------------------------------------------------- |
| [amplitude-experiment-implementation.agent.md](https://github.com/github/awesome-copilot/blob/main/agents/amplitude-experiment-implementation.agent.md) | 此自訂代理程式使用 Amplitude 的 MCP 工具在 Amplitude 內部部署新的實驗，從而實現無縫的變體測試功能和產品功能的推出 | ❌ 否             | 無                                 | 將增強產品內的實驗功能 |
| [launchdarkly-flag-cleanup.agent.md](https://github.com/github/awesome-copilot/blob/main/agents/launchdarkly-flag-cleanup.agent.md)                     | LaunchDarkly 的功能標誌清理代理程式                                                                                                                                | ✅ 是            | launchdarkly-flag-cleanup.agent.md | 已由現有的 LaunchDarkly 自訂代理程式涵蓋        |

## 本地代理程式發現處理程序

1. 列出 `.github/agents/` 目錄中的所有 `*.agent.md` 檔案
2. 對於每個發現的檔案，讀取前置內容以提取 `description`
3. 建立現有代理程式的綜合清單
4. 使用此清單避免建議重複項

## 要求

- 使用 `githubRepo` 工具從 awesome-copilot 儲存庫代理程式資料夾獲取內容
- 掃描本地檔案系統以查找 `.github/agents/` 目錄中現有的代理程式
- 從本地代理程式檔案中讀取 YAML 前置內容以提取描述
- 與此儲存庫中現有的代理程式進行比較以避免重複
- 專注於當前代理程式函式庫覆蓋範圍中的空白
- 驗證建議的代理程式是否符合儲存庫的用途和標準
- 為每個建議提供明確的理由
- 包含指向 awesome-copilot 代理程式和類似本地代理程式的連結
- 除了表格和分析之外，不提供任何額外資訊或上下文

## 圖示參考

- ✅ 已安裝在儲存庫中
- ❌ 未安裝在儲存庫中
