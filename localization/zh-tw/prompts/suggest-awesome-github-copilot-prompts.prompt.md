---
agent: 'agent'
description: '根據目前的存放庫內容和對話歷史記錄，從 awesome-copilot 存放庫中建議相關的 GitHub Copilot Prompt 檔案，避免與此存放庫中現有的 Prompt 重複，並識別需要更新的過時 Prompt。'
tools: ['edit', 'search', 'runCommands', 'runTasks', 'think', 'changes', 'testFailure', 'openSimpleBrowser', 'web/fetch', 'githubRepo', 'todos', 'search']
---
# 建議 Awesome GitHub Copilot Prompt

分析目前的存放庫內容，並從 [GitHub awesome-copilot 存放庫](https://github.com/github/awesome-copilot/blob/main/docs/README.prompts.md)中建議此存放庫尚未提供的相關 Prompt 檔案。

## 流程

1. **獲取可用的 Prompt**: 從 [awesome-copilot README.prompts.md](https://github.com/github/awesome-copilot/blob/main/docs/README.prompts.md) 中提取 Prompt 清單和說明。必須使用 `#fetch` 工具。
2. **掃描本地 Prompt**: 探索 `.github/prompts/` 資料夾中現有的 Prompt 檔案
3. **提取說明**: 讀取本地 Prompt 檔案的 Front Matter 以取得說明
4. **獲取遠端版本**: 對於每個本地 Prompt，使用原始 GitHub URL（例如 `https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/<filename>`）從 awesome-copilot 存放庫獲取對應版本
5. **比較版本**: 將本地 Prompt 內容與遠端版本進行比較，以識別：
   - 已是最新版本的 Prompt（完全相符）
   - 已過時的 Prompt（內容不同）
   - 過時 Prompt 的主要差異（工具、說明、內容）
6. **分析情境**: 檢閱對話歷史記錄、存放庫檔案和目前的專案需求
7. **比較現有內容**: 檢查此存放庫中已有的 Prompt
8. **比對相關性**: 將可用的 Prompt 與識別出的模式和需求進行比較
9. **呈現選項**: 顯示相關 Prompt 及其說明、理由和可用性狀態（包括過時的 Prompt）
10. **驗證**: 確保建議的 Prompt 能增加現有 Prompt 尚未涵蓋的價值
11. **輸出**: 提供一個結構化表格，包含建議、說明以及指向 awesome-copilot Prompt 和類似本地 Prompt 的連結
    **等待**使用者請求繼續執行特定 Prompt 的安裝或更新。除非獲得指示，否則請勿安裝或更新。
12. **下載/更新資產**: 對於請求的 Prompt，自動執行：
    - 將新 Prompt 下載到 `.github/prompts/` 資料夾
    - 取代為來自 awesome-copilot 的最新版本以更新過時的 Prompt
    - 請勿調整檔案內容
    - 使用 `#fetch` 工具下載資產，但可以使用 `#runInTerminal` 工具透過 `curl` 確保擷取所有內容
    - 使用 `#todos` 工具追蹤進度

## 情境分析標準

🔍 **存放庫模式**:
- 使用的程式語言（.cs, .js, .py 等）
- 框架指標（ASP.NET, React, Azure 等）
- 專案類型（Web 應用程式、API、函式庫、工具）
- 文件需求（README, 規格書, ADR）

🗨️ **對話歷史記錄情境**:
- 最近的討論和痛點
- 功能請求或實作需求
- 程式碼審核模式
- 開發工作流需求

## 輸出格式

在結構化表格中顯示分析結果，比較 awesome-copilot Prompt 與現有的存放庫 Prompt：

| Awesome-Copilot Prompt | 說明 | 是否已安裝 | 類似的本地 Prompt | 建議理由 |
|-------------------------|-------------|-------------------|---------------------|---------------------|
| [code-review.prompt.md](https://github.com/github/awesome-copilot/blob/main/prompts/code-review.prompt.md) | 自動化程式碼審核 Prompt | ❌ 否 | 無 | 將透過標準化的程式碼審核流程增強開發工作流 |
| [documentation.prompt.md](https://github.com/github/awesome-copilot/blob/main/prompts/documentation.prompt.md) | 產生專案文件 | ✅ 是 | create_oo_component_documentation.prompt.md | 已由現有的文件 Prompt 涵蓋 |
| [debugging.prompt.md](https://github.com/github/awesome-copilot/blob/main/prompts/debugging.prompt.md) | 偵錯輔助 Prompt | ⚠️ 已過時 | debugging.prompt.md | 工具配置不同：遠端使用 `'codebase'` 而本地缺失 - 建議更新 |

## 本地 Prompt 探索流程

1. 列出 `.github/prompts/` 目錄中所有的 `*.prompt.md` 檔案
2. 對於每個探索到的檔案，讀取 Front Matter 以提取 `description`
3. 建立現有 Prompt 的完整清單
4. 使用此清單以避免建議重複的內容

## 版本比較流程

1. 對於每個本地 Prompt 檔案，建構原始 GitHub URL 以獲取遠端版本：
   - 模式：`https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/<filename>`
2. 使用 `#fetch` 工具獲取遠端版本
3. 比較整個檔案內容（包括 Front Matter 和內文）
4. 識別具體差異：
   - **Front Matter 變更**（說明、工具、模式）
   - **工具陣列修改**（新增、移除或重新命名的工具）
   - **內容更新**（指令、範例、指南）
5. 為過時的 Prompt 記錄主要差異
6. 計算相似度以確定是否需要更新

## 需求

- 使用 `githubRepo` 工具從 awesome-copilot 存放庫 Prompt 資料夾獲取內容
- 掃描本地檔案系統以尋找 `.github/prompts/` 目錄中現有的 Prompt
- 從本地 Prompt 檔案讀取 YAML Front Matter 以提取說明
- 將本地 Prompt 與遠端版本進行比較，以偵測過時的 Prompt
- 與此存放庫中現有的 Prompt 進行比較，以避免重複
- 專注於目前 Prompt 函式庫涵蓋範圍中的缺口
- 驗證建議的 Prompt 是否符合存放庫的用途和標準
- 為每個建議提供清晰的理由
- 包含指向 awesome-copilot Prompt 和類似本地 Prompt 的連結
- 清晰識別過時的 Prompt 並註明具體差異
- 除了表格和分析之外，請勿提供任何額外資訊或背景

## 圖示參考

- ✅ 已安裝且為最新版本
- ⚠️ 已安裝但已過時（有可用更新）
- ❌ 存放庫中未安裝

## 更新處理

當識別出過時的 Prompt 時：
1. 將其包含在輸出表格中，狀態為 ⚠️
2. 在「建議理由」欄位中記錄具體差異
3. 提供更新建議並註明主要變更
4. 當使用者請求更新時，將整個本地檔案取代為遠端版本
5. 保留在 `.github/prompts/` 目錄中的檔案位置
