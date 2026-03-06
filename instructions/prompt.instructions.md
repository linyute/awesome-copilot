---
description: '建立高品質 GitHub Copilot Prompt 檔案的指南'
applyTo: '**/*.prompt.md'
---

# Copilot Prompt 檔案指南

建立有效且易於維護的 Prompt 檔案之指示，引導 GitHub Copilot 在任何儲存庫中提供一致且高品質的產出。

## 範圍與原則
- 目標受眾：撰寫可用於 Copilot Chat 之可重複使用 Prompt 的維護者與貢獻者。
- 目標：可預測的行為、清晰的預期、最小權限以及跨儲存庫的可移植性。
- 主要參考資料：關於 Prompt 檔案的 VS Code 文件以及組織特定的慣例。

## Frontmatter 要求

每個 Prompt 檔案都應包含具有以下欄位的 YAML Frontmatter：

### 必要/推薦欄位

| 欄位 | 必要性 | 描述 |
|-------|----------|-------------|
| `description` | 推薦 | Prompt 的簡短描述（單句，可操作的產出） |
| `name` | 選用 | 在聊天中輸入 `/` 後顯示的名稱。如果未指定，預設為檔案名稱 |
| `agent` | 推薦 | 要使用的 Agent：`ask`, `edit`, `agent` 或自訂 Agent 名稱。預設為當前 Agent |
| `model` | 選用 | 要使用的語言模型。預設為當前選定的模型 |
| `tools` | 選用 | 此 Prompt 可用的工具/工具集名稱列表 |
| `argument-hint` | 選用 | 在聊天輸入框中顯示的提示文字，用於引導使用者互動 |

### 指南

- 使用一致的引號（建議使用單引號），並保持每行一個欄位，以提高可讀性和版本控制的清晰度
- 如果指定了 `tools` 且當前 Agent 為 `ask` 或 `edit`，則預設 Agent 將變更為 `agent`
- 保留組織所需的任何額外 Metadata（`language`, `tags`, `visibility` 等）

## 檔案命名與放置
- 使用以 `.prompt.md` 結尾的 kebab-case 檔案名稱，並將其儲存在 `.github/prompts/` 下，除非您的工作區標準指定了另一個目錄。
- 提供一個簡短且能傳達動作的檔案名稱（例如：`generate-readme.prompt.md` 而非 `prompt1.prompt.md`）。

## 正文結構
- 以與 Prompt 意圖相匹配的 `#` 層級標題開始，以便在快速挑選 (Quick Pick) 搜尋中獲得良好的呈現。
- 使用可預測的章節組織內容。建議的基準結構：`使命 (Mission)` 或 `主要指令 (Primary Directive)`、`範圍與前提條件 (Scope & Preconditions)`、`輸入 (Inputs)`、`工作流 (Workflow)`（逐步說明）、`輸出預期 (Output Expectations)` 以及 `品質保證 (Quality Assurance)`。
- 根據領域調整章節名稱，但保留邏輯流：為什麼 → 上下文 → 輸入 → 動作 → 輸出 → 驗證。
- 使用相對連結引用相關的 Prompt 或指示檔案，以協助探索。

## 輸入與上下文處理
- 對於必要數值使用 `${input:variableName[:placeholder]}`，並說明使用者何時必須提供這些數值。儘可能提供預設值或替代方案。
- 僅在必要時呼叫上下文變數，例如 `${selection}`, `${file}`, `${workspaceFolder}`，並描述 Copilot 應如何解釋它們。
- 記錄在缺少強制性上下文時應如何處理（例如：「請求檔案路徑，如果仍未定義則停止執行」）。

## 工具與權限指南
- 將 `tools` 限制在能完成任務的最小集合內。當執行順序很重要時，按偏好的執行順序條列它們。
- 如果 Prompt 從聊天模式繼承了工具，請提及該關係並說明任何關鍵的工具行為或副作用。
- 對於破壞性操作（建立檔案、編輯、終端機指令）發出警告，並在工作流中包含保護措施或確認步驟。

## 指示語氣與風格
- 使用直接、命令式的句子針對 Copilot 進行撰寫（例如：「分析」、「生成」、「總結」）。
- 保持句子簡短且無歧義，遵循 Google 開發者文件翻譯最佳實踐以支援在地化。
- 避免使用成語、幽默或特定文化參考；偏好中性、具包容性的語言。

## 輸出定義
- 指定預期結果的格式、結構和位置（例如：「使用下方模板建立 `docs/adr/adr-XXXX.md`」）。
- 包含成功條件和失敗觸發因素，以便 Copilot 知道何時停止或重試。
- 提供驗證步驟 —— 手動檢查、自動化指令或驗收標準列表 —— 供檢閱者在執行 Prompt 後執行。

## 範例與可重用資產
- 嵌入 Prompt 應產生或遵循的「好/壞」範例或架構（Markdown 模板、JSON 存根）。
- 在內文維持參考對照表（能力、狀態碼、角色描述），以保持 Prompt 的自包含性。當上游資源變動時更新這些對照表。
- 連結至具權威性的文件，而非重複冗長的指南。

## 品質保證檢查清單
- [ ] Frontmatter 欄位完整、準確且符合最小權限原則。
- [ ] 輸入包含佔位符、預設行為和回退方案。
- [ ] 工作流涵蓋準備、執行和後處理，且無遺漏。
- [ ] 輸出預期包含格式和儲存詳細資訊。
- [ ] 驗證步驟具備可操作性（指令、diff 檢查、檢閱提示）。
- [ ] Prompt 引用之安全性、合規性和隱私政策均為最新。
- [ ] Prompt 在 VS Code 中使用代表性場景成功執行（`Chat: Run Prompt`）。

## 維護指南
- 將 Prompt 與其影響的程式碼一起進行版本控制；當相依項目、工具或檢閱流程變更時更新它們。
- 定期檢閱 Prompt 以確保工具列表、模型要求和連結的文件仍然有效。
- 與其他儲存庫協調：當某個 Prompt 被證明具有廣泛用途時，將通用的指南提取到指示檔案或共享的 Prompt 包中。

## 額外資源
- [Prompt 檔案文件](https://code.visualstudio.com/docs/copilot/customization/prompt-files#_prompt-file-format)
- [Awesome Copilot Prompt Files](https://github.com/github/awesome-copilot/tree/main/prompts)
- [工具配置](https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode#_agent-mode-tools)
