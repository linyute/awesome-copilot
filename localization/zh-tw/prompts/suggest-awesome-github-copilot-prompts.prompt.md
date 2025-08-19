---
mode: 'agent'
description: '根據目前倉庫內容與聊天紀錄，從 awesome-copilot 倉庫推薦相關的 GitHub Copilot prompt 檔案，並避免與本倉庫現有 prompts 重複。'
tools: ['changes', 'codebase', 'editFiles', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'runCommands', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI', 'github']
---
# 推薦 Awesome GitHub Copilot Prompts

請分析目前倉庫內容，並從 [GitHub awesome-copilot 倉庫](https://github.com/github/awesome-copilot/tree/main/prompts) 推薦相關 prompt 檔案，且不得與本倉庫現有 prompts 重複。

## 流程

1. **取得可用 prompts**：從 [awesome-copilot README](https://github.com/github/awesome-copilot/blob/main/README.md) 擷取 prompt 清單與描述
2. **掃描本地 prompts**：發現 `.github/prompts/` 資料夾下現有 prompt 檔案
3. **擷取描述**：讀取本地 prompt 檔案前置資料，取得描述
4. **分析情境**：檢查聊天紀錄、倉庫檔案與目前專案需求
5. **比對現有**：檢查本倉庫已存在的 prompts
6. **比對相關性**：將可用 prompts 與已識別模式及需求比對
7. **呈現選項**：以表格顯示推薦 prompts、描述、理由與可用性
8. **驗證**：確保推薦 prompts 具備本倉庫尚未涵蓋的價值
9. **輸出**：以結構化表格提供推薦、描述與連結
10. **後續步驟**：如有推薦，提供 Copilot 可自動下載 prompt 至 prompts 資料夾的指令，並詢問用戶是否自動執行。

## 情境分析標準

🔍 **倉庫模式**：
- 使用程式語言（.cs、.js、.py 等）
- 框架指標（ASP.NET、React、Azure 等）
- 專案類型（Web 應用、API、函式庫、工具）
- 文件需求（README、規格、ADR）

🗨️ **聊天紀錄情境**：
- 近期討論與痛點
- 功能請求或實作需求
- 程式碼審查模式
- 開發流程需求

## 輸出格式

請以表格呈現 awesome-copilot prompts 與本地 prompts 比較：

| Awesome-Copilot Prompt | 描述 | 已安裝 | 類似本地 prompt | 推薦理由 |
|-------------------------|------|--------|----------------|----------|
| [code-review.md](https://github.com/github/awesome-copilot/blob/main/prompts/code-review.md) | 自動化程式碼審查 prompt | ❌ 否 | 無 | 可強化開發流程，提供標準化程式碼審查 |
| [documentation.md](https://github.com/github/awesome-copilot/blob/main/prompts/documentation.md) | 產生專案文件 | ✅ 是 | create_oo_component_documentation.prompt.md | 已由現有文件 prompt 覆蓋 |
| [debugging.md](https://github.com/github/awesome-copilot/blob/main/prompts/debugging.md) | 除錯協助 prompt | ❌ 否 | 無 | 可提升開發團隊除錯效率 |

## 本地 prompts 探索流程

1. 列出 `.github/prompts/` 目錄下所有 `*.prompt.md` 檔案
2. 讀取每個檔案前置資料，擷取 `description`
3. 建立完整本地 prompts 清單
4. 以此清單避免重複推薦

## 需求

- 使用 `githubRepo` 工具取得 awesome-copilot prompts 內容
- 掃描本地 `.github/prompts/` 目錄
- 讀取本地 prompt 檔案前置資料取得描述
- 與本倉庫現有 prompts 比對，避免重複
- 聚焦本地 prompt 覆蓋不足之處
- 驗證推薦 prompt 符合倉庫目的與標準
- 清楚說明每項推薦理由
- 同時提供 awesome-copilot 與本地 prompt 連結
- 僅提供表格與分析，不加其他說明

## 圖示參考

- ✅ 已安裝於倉庫
- ❌ 未安裝於倉庫
