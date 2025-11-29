# 集合範本

使用此範本建立相關提示、指示和聊天模式的新集合。

## 基本範本

```yaml
id: my-collection-id
name: 我的集合名稱
description: 此集合提供什麼以及誰應該使用它的簡要說明。
tags: [tag1, tag2, tag3] # 選用探索標籤
items:
  - path: prompts/my-prompt.prompt.md
    kind: prompt
  - path: instructions/my-instructions.instructions.md  
    kind: instruction
  - path: agents/my-chatmode.agent.md
    kind: agent
display:
  ordering: alpha # 或 "manual" 以保留上述順序
  show_badge: false # 設定為 true 以顯示集合徽章
```

## 欄位說明

- **id**: 僅使用小寫字母、數字和連字號的唯一識別碼
- **name**: 集合的顯示名稱
- **description**: 集合用途的簡要說明 (1-500 個字元)
- **tags**: 選用探索標籤陣列 (最多 10 個，每個 1-30 個字元)
- **items**: 集合中的項目陣列 (1-50 個項目)
  - **path**: 從儲存庫根目錄到檔案的相對路徑
  - **kind**: 必須是 `prompt`、`instruction` 或 `chat-mode`
- **display**: 選用顯示設定
  - **ordering**: `alpha` (字母順序) 或 `manual` (保留順序)
  - **show_badge**: 在項目上顯示集合徽章 (true/false)

## 建立新集合

### 使用 VS Code 任務
1. 按下 `Ctrl+Shift+P` (Mac 上為 `Cmd+Shift+P`)
2. 輸入「Tasks: Run Task」
3. 選取「create-collection」
4. 提示時輸入您的集合 ID

### 使用命令列
```bash
node create-collection.js my-collection-id
```

### 手動建立
1. 建立 `collections/my-collection-id.collection.yml`
2. 使用上述範本作為起點
3. 新增您的項目並自訂設定
4. 執行 `npm run validate:collections` 以驗證
5. 執行 `npm start` 以產生文件

## 驗證

集合會自動驗證以確保：
- 必要欄位存在且有效
- 檔案路徑存在並符合項目類型
- ID 在集合中是唯一的
- 標籤和顯示設定符合結構描述

手動執行驗證：
```bash
npm run validate:collections
```

## 檔案組織

集合不需要重新組織現有檔案。只要資訊清單中的路徑正確，項目就可以位於儲存庫中的任何位置。

## 最佳實踐

1. **有意義的集合**: 將協同運作良好的項目分組，以用於特定工作流程或使用案例
2. **清晰的命名**: 使用描述性名稱和 ID，以反映集合的用途
3. **良好的說明**: 解釋誰應該使用集合以及它提供什麼好處
4. **相關標籤**: 新增探索標籤，以協助使用者找到相關集合
5. **合理的大小**: 讓集合保持專注 - 通常 3-10 個項目運作良好
6. **測試項目**: 確保所有參考檔案都存在且功能正常，然後再新增到集合中
