# 貢獻 Awesome GitHub Copilot

感謝您有興趣貢獻 Awesome GitHub Copilot 儲存庫！我們歡迎社群的貢獻，以協助擴展我們的自訂指令和提示集合。

## 如何貢獻

### 新增指令

指令有助於為特定技術、程式碼實踐或領域客製化 GitHub Copilot 的行為。

1. **建立您的指令檔案**：在 `instructions/` 目錄中新增一個 `.md` 檔案
2. **遵循命名慣例**：使用描述性、小寫檔名並以連字號分隔 (例如：`python-django.instructions.md`)
3. **組織您的內容**：以清晰的標題開頭，並有邏輯地組織您的指令
4. **測試您的指令**：確保您的指令與 GitHub Copilot 運作良好

#### 指令格式範例

```markdown
---
description: '用於為特定技術和實踐客製化 GitHub Copilot 行為的指令'
---

# 您的技術/框架名稱

## 指令

- 為 GitHub Copilot 提供清晰、具體的指導
- 包含最佳實踐和慣例
- 使用項目符號以便於閱讀

## 其他準則

- 任何額外的上下文或範例
```

### 新增提示

提示是針對特定開發情境和任務的即用型範本。

1. **建立您的提示檔案**：在 `prompts/` 目錄中新增一個 `.prompt.md` 檔案
2. **遵循命名慣例**：使用描述性、小寫檔名並以連字號分隔，並加上 `.prompt.md` 副檔名 (例如：`react-component-generator.prompt.md`)
3. **包含前置內容**：在檔案頂部新增中繼資料 (可選但建議)
4. **組織您的提示**：提供清晰的上下文和具體指令

#### 提示格式範例

```markdown
---
agent: 'agent'
tools: ['search/codebase', 'terminalCommand']
description: '此提示功能的簡要描述'
---

# 提示標題

您的目標是...

## 具體指令

- 清晰、可執行的指令
- 在有幫助的地方包含範例
```

### 新增聊天模式

聊天模式是專門的配置，可將 GitHub Copilot Chat 轉換為特定開發情境的領域特定助理或角色。

1. **建立您的聊天模式檔案**：在 `agents/` 目錄中新增一個 `.agent.md` 檔案
2. **遵循命名慣例**：使用描述性、小寫檔名並以連字號分隔，並加上 `.agent.md` 副檔名 (例如：`react-performance-expert.agent.md`)
3. **包含前置內容**：在檔案頂部新增包含必要欄位的中繼資料
4. **定義角色**：為聊天模式建立清晰的身份和專業領域
5. **測試您的聊天模式**：確保聊天模式在其領域中提供有用的、準確的回應

#### 聊天模式格式範例

```markdown
---
description: '聊天模式及其目的的簡要描述'
model: 'gpt-5'
tools: ['search/codebase', 'terminalCommand']
---

# 聊天模式標題

您是具有 [特定領域] 深入知識的專家 [領域/角色]。

## 您的專業知識

- [特定技能 1]
- [特定技能 2]
- [特定技能 3]

## 您的方法

- [您如何協助使用者]
- [您的溝通風格]
- [您優先考慮的事項]

## 準則

- [回應的具體指令]
- [限制或局限]
- [要遵循的最佳實踐]
```

### 新增集合

集合將相關的提示、指令和聊天模式圍繞特定主題或工作流程分組，讓使用者更容易發現和採用全面的工具包。

1. **建立您的集合清單**：在 `collections/` 目錄中新增一個 `.collection.yml` 檔案
2. **遵循命名慣例**：使用描述性、小寫檔名並以連字號分隔 (例如：`python-web-development.collection.yml`)
3. **參考現有項目**：集合應僅參考儲存庫中已存在的檔案
4. **測試您的集合**：驗證所有參考的檔案都存在並能良好協同運作

#### 建立集合

```bash
# 使用建立指令碼
node create-collection.js my-collection-id

# 或使用 VS Code 任務：Ctrl+Shift+P > "Tasks: Run Task" > "create-collection"
```

#### 集合格式範例

```yaml
id: my-collection-id
name: 我的集合名稱
description: 此集合提供什麼以及誰應該使用的簡要描述。
tags: [tag1, tag2, tag3] # 可選的發現標籤
items:
  - path: prompts/my-prompt.prompt.md
    kind: prompt
  - path: instructions/my-instructions.instructions.md
    kind: instruction
  - path: agents/my-chatmode.agent.md
    kind: agent
    usage: |
     recommended # 或 "optional" 如果不是工作流程的必要部分

     此聊天模式需要以下指令/提示/MCP：
      - 指令 1
      - 提示 1
      - MCP 1

     此聊天模式非常適合...
      - 使用案例 1
      - 使用案例 2
    
      以下是如何使用它的範例：
      ```markdown, task-plan.prompt.md
      ---
      mode: task-planner
      title: Plan microsoft fabric realtime intelligence terraform support
      ---
      #file: <file including in chat context>
      Do an action to achieve goal.
      ```

      為了獲得最佳結果，請考慮...
      - 提示 1
      - 提示 2
    
display:
  ordering: alpha # 或 "manual" 以保留上述順序
  show_badge: false # 設定為 true 以顯示集合徽章
```

有關完整的使用範例，請查看 edge-ai 任務集合：
- [edge-ai-tasks.collection.yml](./collections/edge-ai-tasks.collection.yml)
- [edge-ai-tasks.md](./collections/edge-ai-tasks.md)

#### 集合準則

- **專注於工作流程**：將協同運作的項目分組以用於特定使用案例
- **合理的大小**：通常 3-10 個項目效果良好
- **測試組合**：確保項目有效互補
- **明確的目的**：集合應解決特定問題或工作流程
- **提交前驗證**：執行 `node validate-collections.js` 以確保您的清單有效

## 提交您的貢獻

1. **分叉此儲存庫**
2. **為您的貢獻建立一個新分支**
3. **依照上述準則新增您的指令、提示檔案、聊天模式或集合**
4. **執行更新指令碼**：`npm start` 以使用您的新檔案更新 README (如果您尚未執行 `npm install`，請務必先執行)
   - GitHub Actions 工作流程將驗證此步驟是否正確執行
   - 如果執行指令碼會修改 README.md，則 PR 檢查將失敗並顯示所需變更的註解
5. **提交拉取請求**，其中包含：
   - 描述您貢獻的清晰標題
   - 您的指令/提示功能的簡要描述
   - 任何相關的上下文或使用說明

**注意**：一旦您的貢獻合併，您將自動新增到我們的 [貢獻者](./README.md#contributors-) 部分！我們使用 [all-contributors](https://github.com/all-contributors/all-contributors) 來表彰對專案的所有類型貢獻。

## 我們接受什麼

我們歡迎涵蓋任何技術、框架或開發實踐的貢獻，這些貢獻有助於開發人員更有效地使用 GitHub Copilot。這包括：

- 程式語言和框架
- 開發方法和最佳實踐
- 架構模式和設計原則
- 測試策略和品質保證
- DevOps 和部署實踐
- 無障礙和包容性設計
- 效能最佳化技術

## 我們不接受什麼

為了維護一個安全、負責任和建設性的社群，我們將**不接受**以下貢獻：

- **違反負責任 AI 原則**：試圖規避 Microsoft/GitHub 的負責任 AI 準則或宣傳有害 AI 使用的內容
- **危害安全**：旨在繞過安全政策、利用漏洞或削弱系統安全的指令
- **啟用惡意活動**：旨在損害其他系統、使用者或組織的內容
- **利用弱點**：利用其他平台或服務中漏洞的指令
- **宣傳有害內容**：可能導致產生有害、歧視性或不當內容的指導
- **規避平台政策**：試圖規避 GitHub、Microsoft 或其他平台服務條款的行為

## 品質準則

- **具體**：通用指令不如具體、可執行的指導有用
- **測試您的內容**：確保您的指令或提示與 GitHub Copilot 運作良好
- **遵循慣例**：使用一致的格式和命名
- **保持專注**：每個檔案應解決特定技術、框架或使用案例
- **清晰書寫**：使用簡單、直接的語言
- **推廣最佳實踐**：鼓勵安全、可維護和道德的開發實踐

## 貢獻者認可

此專案使用 [all-contributors](https://github.com/all-contributors/all-contributors) 來認可貢獻者。當您做出貢獻時，您將自動在我們的貢獻者清單中獲得認可！

我們歡迎所有類型的貢獻，包括：

- 📝 文件改進
- 💻 程式碼貢獻
- 🐛 錯誤報告和修復
- 🎨 設計改進
- 💡 想法和建議
- 🤔 回答問題
- 📢 推廣專案

您的貢獻有助於使這個資源對整個 GitHub Copilot 社群更好！

## 行為準則

請注意，此專案發布時附有 [貢獻者行為準則](CODE_OF_CONDUCT.md)。參與此專案即表示您同意遵守其條款。

## 授權

透過貢獻此儲存庫，您同意您的貢獻將根據 MIT 授權條款授權。
