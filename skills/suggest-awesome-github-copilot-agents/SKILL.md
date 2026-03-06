---
name: suggest-awesome-github-copilot-agents
description: '根據目前的存放庫內容和對話歷史記錄，從 awesome-copilot 存放庫中建議相關的 GitHub Copilot 自定義 Agent 檔案，避免與此存放庫中現有的自定義 Agent 重複，並識別需要更新的過時 Agent。'
---

# 建議 Awesome GitHub Copilot 自定義 Agent

分析目前的存放庫內容，並從 [GitHub awesome-copilot 存放庫](https://github.com/github/awesome-copilot/blob/main/docs/README.agents.md)中建議此存放庫尚未提供的相關自定義 Agent 檔案。自定義 Agent 檔案位於 awesome-copilot 存放庫的 [agents](https://github.com/github/awesome-copilot/tree/main/agents) 資料夾中。

## 流程

1. **獲取可用的自定義 Agent**: 從 [awesome-copilot README.agents.md](https://github.com/github/awesome-copilot/blob/main/docs/README.agents.md) 中提取自定義 Agent 清單和說明。必須使用 `fetch` 工具。
2. **掃描本地自定義 Agent**: 探索 `.github/agents/` 資料夾中現有的自定義 Agent 檔案
3. **提取說明**: 讀取本地自定義 Agent 檔案的 Front Matter 以取得說明
4. **獲取遠端版本**: 對於每個本地 Agent，使用原始 GitHub URL（例如 `https://raw.githubusercontent.com/github/awesome-copilot/main/agents/<filename>`）從 awesome-copilot 存放庫獲取對應版本
5. **比較版本**: 將本地 Agent 內容與遠端版本進行比較，以識別：
   - 已是最新版本的 Agent（完全相符）
   - 已過時的 Agent（內容不同）
   - 過時 Agent 的主要差異（工具、說明、內容）
6. **分析情境**: 檢閱對話歷史記錄、存放庫檔案和目前的專案需求
7. **比對相關性**: 將可用的自定義 Agent 與識別出的模式和需求進行比較
8. **提供選項**: 顯示相關的自定義 Agent 及其說明、理由和可用性狀態（包括過時的 Agent）
9. **驗證**: 確保建議的 Agent 能增加現有 Agent 尚未涵蓋的價值
10. **輸出**: 提供一個結構化表格，包含建議、說明以及指向 awesome-copilot 自定義 Agent 和類似本地自定義 Agent 的連結
    **等待**使用者請求繼續執行特定自定義 Agent 的安裝或更新。除非獲得指示，否則請勿安裝或更新。
11. **下載/更新資產**: 對於請求的 Agent，自動執行：
    - 將新 Agent 下載到 `.github/agents/` 資料夾
    - 取代為來自 awesome-copilot 的最新版本以更新過時的 Agent
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

在結構化表格中顯示分析結果，比較 awesome-copilot 自定義 Agent 與現有的存放庫自定義 Agent：

| Awesome-Copilot 自定義 Agent                                                                                                                            | 說明                                                                                                                                                                | 是否已安裝        | 類似的本地自定義 Agent             | 建議理由                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------- | ------------------------------------------------------------- |
| [amplitude-experiment-implementation.agent.md](https://github.com/github/awesome-copilot/blob/main/agents/amplitude-experiment-implementation.agent.md) | 此自定義 Agent 使用 Amplitude 的 MCP 工具在 Amplitude 內部部署新的實驗，實現無縫的變體測試功能和產品功能發布 | ❌ 否             | 無                                 | 將增強產品內的實驗功能                                         |
| [launchdarkly-flag-cleanup.agent.md](https://github.com/github/awesome-copilot/blob/main/agents/launchdarkly-flag-cleanup.agent.md)                     | 用於 LaunchDarkly 的功能旗標清理 Agent                                                                                                                                | ✅ 是            | launchdarkly-flag-cleanup.agent.md | 已由現有的 LaunchDarkly 自定義 Agent 涵蓋        |
| [principal-software-engineer.agent.md](https://github.com/github/awesome-copilot/blob/main/agents/principal-software-engineer.agent.md)                 | 提供主任級軟體工程指導，專注於卓越工程、技術領導和務實實作。                            | ⚠️ 已過時       | principal-software-engineer.agent.md | 工具配置不同：遠端使用 `'web/fetch'` 而本地使用 `'fetch'` - 建議更新 |

## 本地 Agent 探索流程

1. 列出 `.github/agents/` 目錄中所有的 `*.agent.md` 檔案
2. 對於每個探索到的檔案，讀取 Front Matter 以提取 `description`
3. 建立現有 Agent 的完整清單
4. 使用此清單以避免建議重複的內容

## 版本比較流程

1. 對於每個本地 Agent 檔案，建構原始 GitHub URL 以獲取遠端版本：
   - 模式：`https://raw.githubusercontent.com/github/awesome-copilot/main/agents/<filename>`
2. 使用 `fetch` 工具獲取遠端版本
3. 比較整個檔案內容（包括 Front Matter、工具陣列和內文）
4. 識別具體差異：
   - **Front Matter 變更**（說明、工具）
   - **工具陣列修改**（新增、移除或重新命名的工具）
   - **內容更新**（指令、範例、指南）
5. 為過時的 Agent 記錄主要差異
6. 計算相似度以確定是否需要更新

## 需求

- 使用 `githubRepo` 工具從 awesome-copilot 存放庫的 agents 資料夾獲取內容
- 掃描本地檔案系統以尋找 `.github/agents/` 目錄中現有的 Agent
- 從本地 Agent 檔案讀取 YAML Front Matter 以提取說明
- 將本地 Agent 與遠端版本進行比較，以偵測過時的 Agent
- 與此存放庫中現有的 Agent 進行比較，以避免重複
- 專注於目前 Agent 函式庫涵蓋範圍中的缺口
- 驗證建議的 Agent 是否符合存放庫的用途和標準
- 為每個建議提供清晰的理由
- 包含指向 awesome-copilot Agent 和類似本地 Agent 的連結
- 清晰識別過時的 Agent 並註明具體差異
- 除了表格和分析之外，請勿提供任何額外資訊或背景

## 圖示參考

- ✅ 已安裝且為最新版本
- ⚠️ 已安裝但已過時（有可用更新）
- ❌ 存放庫中未安裝

## 更新處理

當識別出過時的 Agent 時：
1. 將其包含在輸出表格中，狀態為 ⚠️
2. 在「建議理由」欄位中記錄具體差異
3. 提供更新建議並註明主要變更
4. 當使用者請求更新時，將整個本地檔案取代為遠端版本
5. 保留在 `.github/agents/` 目錄中的檔案位置
