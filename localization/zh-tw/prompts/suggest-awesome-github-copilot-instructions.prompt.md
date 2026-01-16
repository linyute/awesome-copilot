---
agent: 'agent'
description: '根據目前的儲存庫內容和對話歷史記錄，從 awesome-copilot 儲存庫建議相關的 GitHub Copilot instruction 檔案，避免與此儲存庫中現有的 instruction 重複，並識別需要更新的過時 instruction。'
tools: ['edit', 'search', 'runCommands', 'runTasks', 'think', 'changes', 'testFailure', 'openSimpleBrowser', 'web/fetch', 'githubRepo', 'todos', 'search']
---
# 建議 Awesome GitHub Copilot Instructions

分析目前的儲存庫內容，並從 [GitHub awesome-copilot 儲存庫](https://github.com/github/awesome-copilot/blob/main/docs/README.instructions.md) 建議此儲存庫中尚未提供的相關 copilot-instruction 檔案。

## 流程

1. **擷取可用的 Instructions**：從 [awesome-copilot README.instructions.md](https://github.com/github/awesome-copilot/blob/main/docs/README.instructions.md) 擷取 instruction 清單和說明。必須使用 `#fetch` 工具。
2. **掃描本地 Instructions**：在 `.github/instructions/` 資料夾中尋找現有的 instruction 檔案
3. **擷取說明**：讀取本地 instruction 檔案的 front matter 以取得說明和 `applyTo` 模式
4. **擷取遠端版本**：對於每個本地 instruction，使用原始 GitHub URL（例如：`https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/<filename>`）從 awesome-copilot 儲存庫擷取對應版本
5. **比較版本**：將本地 instruction 內容與遠端版本進行比較，以識別：
   - 最新的 instruction（完全相符）
   - 過時的 instruction（內容不同）
   - 過時 instruction 中的主要差異（說明、applyTo 模式、內容）
6. **分析內容**：檢閱對話歷史記錄、儲存庫檔案和目前專案需求
7. **比較現有項**：對照此儲存庫中已有的 instruction 進行檢查
8. **比對相關性**：根據識別出的模式和需求比較可用的 instruction
9. **呈現選項**：顯示相關的 instruction 及其說明、原理和可用狀態（包括過時的 instruction）
10. **驗證**：確保建議的 instruction 能增加現有 instruction 尚未涵蓋的價值
11. **輸出**：提供結構化表格，包含建議、說明以及 awesome-copilot instruction 和類似本地 instruction 的連結
   **等待**使用者要求繼續安裝或更新特定 instruction。除非收到指示，否則請勿安裝或更新。
12. **下載/更新資產**：對於要求的 instruction，自動執行以下操作：
    - 將新的 instruction 下載到 `.github/instructions/` 資料夾
    - 以 awesome-copilot 的最新版本取代，以更新過時的 instruction
    - 請勿調整檔案內容
    - 使用 `#fetch` 工具下載資產，但可以使用 `#runInTerminal` 工具透過 `curl` 確保擷取所有內容
    - 使用 `#todos` 工具追蹤進度

## 內容分析標準

🔍 **儲存庫模式**：
- 使用的程式語言（.cs、.js、.py、.ts 等）
- 框架指標（ASP.NET、React、Azure、Next.js 等）
- 專案類型（web 應用程式、API、函式庫、工具）
- 開發工作流程需求（測試、CI/CD、部署）

🗨️ **對話歷史內容**：
- 最近的討論和痛點
- 特定技術問題
- 程式碼標準討論
- 開發工作流程需求

## 輸出格式

在結構化表格中顯示分析結果，比較 awesome-copilot instructions 與現有的儲存庫 instructions：

| Awesome-Copilot Instruction | 說明 | 已安裝 | 類似的本地 Instruction | 建議原理 |
|------------------------------|-------------|-------------------|---------------------------|---------------------|
| [blazor.instructions.md](https://github.com/github/awesome-copilot/blob/main/instructions/blazor.instructions.md) | Blazor 開發指南 | ✅ 是 | blazor.instructions.md | 已由現有的 Blazor instruction 涵蓋 |
| [reactjs.instructions.md](https://github.com/github/awesome-copilot/blob/main/instructions/reactjs.instructions.md) | ReactJS 開發標準 | ❌ 否 | 無 | 將透過既定模式增強 React 開發 |
| [java.instructions.md](https://github.com/github/awesome-copilot/blob/main/instructions/java.instructions.md) | Java 開發最佳實作 | ⚠️ 過時 | java.instructions.md | applyTo 模式不同：遠端使用 `'**/*.java'` 而本地使用 `'*.java'` - 建議更新 |

## 本地 Instructions 探索流程

1. 列出 `instructions/` 目錄中的所有 `*.instructions.md` 檔案
2. 對於每個探索到的檔案，讀取 front matter 以擷取 `description` 和 `applyTo` 模式
3. 建立現有 instruction 及其適用檔案模式的完整清單
4. 使用此清單來避免建議重複項

## 版本比較流程

1. 對於每個本地 instruction 檔案，建構原始 GitHub URL 以擷取遠端版本：
   - 模式：`https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/<filename>`
2. 使用 `#fetch` 工具擷取遠端版本
3. 比較整個檔案內容（包括 front matter 和主體）
4. 識別特定差異：
   - **Front matter 變更**（說明、applyTo 模式）
   - **內容更新**（指南、範例、最佳實作）
5. 記錄過時 instruction 的主要差異
6. 計算相似度以確定是否需要更新

## 檔案結構需求

根據 GitHub 文件，copilot-instructions 檔案應為：
- **儲存庫全域 instructions**：`.github/copilot-instructions.md`（適用於整個儲存庫）
- **特定路徑 instructions**：`.github/instructions/NAME.instructions.md`（透過 `applyTo` frontmatter 適用於特定的檔案模式）
- **社群 instructions**：`instructions/NAME.instructions.md`（用於分享和分發）

## Front Matter 結構

awesome-copilot 中的 Instructions 檔案使用此 front matter 格式：
```markdown
---
description: '此 instruction 提供內容的簡短說明'
applyTo: '**/*.js,**/*.ts' # 選用：檔案比對的 glob 模式
---
```

## 需求

- 使用 `githubRepo` 工具從 awesome-copilot 儲存庫 instructions 資料夾取得內容
- 在 `.github/instructions/` 目錄中掃描本地檔案系統以尋找現有的 instruction
- 從本地 instruction 檔案讀取 YAML front matter 以擷取說明和 `applyTo` 模式
- 將本地 instruction 與遠端版本進行比較以偵測過時的 instruction
- 與此儲存庫中現有的 instruction 進行比較以避免重複
- 專注於目前 instruction 函式庫涵蓋範圍中的缺漏
- 驗證建議的 instruction 是否符合儲存庫的目的和標準
- 為每個建議提供清晰的原理
- 包含指向 awesome-copilot instructions 和類似本地 instructions 的連結
- 清楚地識別過時的 instruction 並註明特定的差異
- 考慮技術堆疊相容性和專案特定需求
- 除了表格和分析之外，請勿提供任何額外的資訊或背景內容

## 圖示參考

- ✅ 已安裝且為最新
- ⚠️ 已安裝但已過時（有可用更新）
- ❌ 未在儲存庫中安裝

## 更新處理

識別出過時的 instruction 時：
1. 將其包含在輸出表格中，並標示 ⚠️ 狀態
2. 在「建議原理」欄位中記錄特定差異
3. 提供更新建議並註明主要變更
4. 當使用者要求更新時，以遠端版本取代整個本地檔案
5. 保留在 `.github/instructions/` 目錄中的檔案位置
