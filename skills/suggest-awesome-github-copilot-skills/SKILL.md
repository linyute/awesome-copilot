---
name: suggest-awesome-github-copilot-skills
description: '根據目前的存放庫內容與對話歷史，從 awesome-copilot 存放庫建議相關的 GitHub Copilot 技能，同時避免與此存放庫中現有的技能重複，並識別出需要更新的過時技能。'
---

# 建議 Awesome GitHub Copilot 技能 (Suggest Awesome GitHub Copilot Skills)

分析目前的存放庫內容，並從 [GitHub awesome-copilot 存放庫](https://github.com/github/awesome-copilot/blob/main/docs/README.skills.md) 建議本存放庫尚未提供的相關代理程式技能 (Agent Skills)。代理程式技能是位於 awesome-copilot 存放庫 [skills](https://github.com/github/awesome-copilot/tree/main/skills) 資料夾中的獨立資料夾，每個資料夾都包含一個 `SKILL.md` 檔案以及選用的隨附資產。

## 流程 (Process)

1. **獲取可用技能**：從 [awesome-copilot README.skills.md](https://github.com/github/awesome-copilot/blob/main/docs/README.skills.md) 擷取技能清單與說明。必須使用 `#fetch` 工具。
2. **掃描本機技能**：在 `.github/skills/` 資料夾中尋找現有的技能資料夾。
3. **擷取說明**：讀取本機 `SKILL.md` 檔案的 YAML 前言 (front matter)，以獲取 `name` 與 `description`。
4. **獲取遠端版本**：對於每個本機技能，使用原始 GitHub URL（例如：`https://raw.githubusercontent.com/github/awesome-copilot/main/skills/<技能名稱>/SKILL.md`）從 awesome-copilot 存放庫獲取對應的 `SKILL.md`。
5. **比較版本**：比較本機技能內容與遠端版本，以識別：
   - 已是最新版本的技能（完全匹配）
   - 已過時的技能（內容不同）
   - 過時技能的關鍵差異（說明、指示、隨附資產）
6. **分析內容**：檢閱對話歷史、存放庫檔案以及目前的專案需求。
7. **比較現有技能**：檢查此存放庫中是否已具備該技能。
8. **匹配相關性**：將可用技能與識別出的模式與需求進行比較。
9. **呈現選項**：顯示相關技能及其說明、理由以及可用性狀態（包括過時技能）。
10. **驗證**：確保建議的技能能提供現有技能尚未涵蓋的價值。
11. **輸出**：提供結構化表格，包含建議、說明以及連至 awesome-copilot 技能與類似本機技能的連結。
    **等待** 使用者要求繼續執行特定技能的安裝或更新。**除非收到指示，否則請勿自行安裝或更新。**
12. **下載/更新資產**：針對要求的技能，自動執行以下操作：
    - 將新技能下載到 `.github/skills/` 資料夾，並保留資料夾結構。
    - 透過將過時技能替換為來自 awesome-copilot 的最新版本來進行更新。
    - 同時下載 `SKILL.md` 與任何隨附資產（指令碼、範本、資料檔案）。
    - **請勿** 調整檔案內容。
    - 使用 `#fetch` 工具下載資產，但也可以使用 `#runInTerminal` 工具中的 `curl` 以確保擷取所有內容。
    - 使用 `#todos` 工具追蹤進度。

## 上下文分析準則 (Context Analysis Criteria)

🔍 **存放庫模式**：
- 使用的程式語言（.cs, .js, .py, .ts 等）
- 框架指標（ASP.NET, React, Azure, Next.js 等）
- 專案型別（網頁應用程式、API、函式庫、工具、基礎設施）
- 開發工作流需求（測試、CI/CD、部署）
- 基礎設施與雲端提供者（Azure, AWS, GCP）

🗨️ **對話歷史上下文**：
- 最近的討論與痛點
- 功能請求或實作需求
- 程式碼檢閱模式
- 開發工作流需求
- 特殊任務需求（圖表繪製、評估、部署）

## 輸出格式 (Output Format)

在結構化表格中顯示分析結果，比較 awesome-copilot 技能與現有的存放庫技能：

| Awesome-Copilot 技能 | 說明 | 隨附資產 | 是否已安裝 | 類似的本機技能 | 建議理由 |
|-----------------------|-------------|----------------|-------------------|---------------------|---------------------|
| [gh-cli](https://github.com/github/awesome-copilot/tree/main/skills/gh-cli) | 用於管理存放庫與工作流的 GitHub CLI 技能 | 無 | ❌ 否 | 無 | 將增強 GitHub 工作流自動化能力 |
| [aspire](https://github.com/github/awesome-copilot/tree/main/skills/aspire) | 用於分散式應用程式開發的 Aspire 技能 | 9 個參考檔案 | ✅ 是 | aspire | 已由現有的 Aspire 技能涵蓋 |
| [terraform-azurerm-set-diff-analyzer](https://github.com/github/awesome-copilot/tree/main/skills/terraform-azurerm-set-diff-analyzer) | 分析 Terraform AzureRM 提供者變更 | 參考檔案 | ⚠️ 已過時 | terraform-azurerm-set-diff-analyzer | 指示內容已更新為新的驗證模式 — 建議更新 |

## 本機技能探索流程 (Local Skills Discovery Process)

1. 列出 `.github/skills/` 目錄中的所有資料夾。
2. 對於每個資料夾，讀取 `SKILL.md` 前言以擷取 `name` 與 `description`。
3. 列出各個技能資料夾中的任何隨附資產。
4. 建立一份現有技能及其功能的全面清單。
5. 使用此清單來避免建議重複的技能。

## 版本比較流程 (Version Comparison Process)

1. 對於每個本機技能資料夾，建構原始 GitHub URL 以獲取遠端 `SKILL.md`：
   - 模式：`https://raw.githubusercontent.com/github/awesome-copilot/main/skills/<技能名稱>/SKILL.md`
2. 使用 `#fetch` 工具獲取遠端版本。
3. 比較整個檔案內容（包含前言與主體）。
4. 識別具體差異：
   - **前言變更**（名稱、說明）
   - **指示更新**（準則、範例、最佳實作）
   - **隨附資產變更**（新增、移除或修改的資產）
5. 為過時技能記錄關鍵差異。
6. 計算相似度以判斷是否需要更新。

## 技能結構需求 (Skill Structure Requirements)

根據代理程式技能規格，每個技能都是一個包含以下內容的資料夾：
- **`SKILL.md`**：主要的指示檔案，包含前言（`name`, `description`）與詳細指示。
- **選用的隨附資產**：指令碼、範本、參考資料，以及 `SKILL.md` 中參考的其他檔案。
- **資料夾命名**：全小寫並使用連字號（例如：`azure-deployment-preflight`）。
- **名稱匹配**：`SKILL.md` 前言中的 `name` 欄位必須與資料夾名稱相符。

## 前言結構 (Front Matter Structure)

awesome-copilot 中的技能在 `SKILL.md` 中使用此外掛程式格式：
```markdown
---
name: '技能名稱'
description: '此技能提供之內容及其使用時機的簡短說明'
---
```

## 需求 (Requirements)

- 使用 `fetch` 工具從 awesome-copilot 存放庫技能文件中獲取內容。
- 使用 `githubRepo` 工具獲取個別技能內容以供下載。
- 掃描本機檔案系統，尋找 `.github/skills/` 目錄中的現有技能。
- 從本機 `SKILL.md` 檔案讀取 YAML 前言，以擷取名稱與說明。
- 比較本機技能與遠端版本以偵測過時技能。
- 與此存放庫中現有的技能進行比較以避免重複。
- 關注目前技能庫涵蓋範圍中的缺口。
- 驗證建議的技能是否符合存放庫的目的與技術堆疊。
- 為每項建議提供清楚的理由。
- 包含連至 awesome-copilot 技能與類似本機技能的連結。
- 清楚標示過時技能並註明具體差異。
- 考慮隨附資產的需求與相容性。
- 除了表格與分析結果外，不要提供任何額外資訊或上下文。

## 圖示參考 (Icons Reference)

- ✅ 已安裝且為最新版本
- ⚠️ 已安裝但已過時（有更新可用）
- ❌ 存放庫中未安裝

## 更新處理 (Update Handling)

當識別出過時技能時：
1. 在輸出表格中將其狀態標示為 ⚠️。
2. 在「建議理由」欄位中記錄具體差異。
3. 提供更新建議並註明關鍵變更。
4. 當使用者要求更新時，將整個本機技能資料夾替換為來自遠端的版本。
5. 保留在 `.github/skills/` 目錄中的資料夾位置。
6. 確保所有隨附資產與更新後的 `SKILL.md` 一併下載。
