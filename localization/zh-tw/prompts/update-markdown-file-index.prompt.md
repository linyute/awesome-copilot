---
agent: 'agent'
description: '將指定資料夾的檔案索引／表格更新至指定的 markdown 文件區段。'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'extensions', 'web/fetch', 'findTestFiles', 'githubRepo', 'openSimpleBrowser', 'problems', 'runCommands', 'runTasks', 'runTests', 'search', 'search/searchResults', 'runCommands/terminalLastCommand', 'runCommands/terminalSelection', 'testFailure', 'usages', 'vscodeAPI']
---

# 更新 Markdown 檔案索引

請將 markdown 文件 `${file}` 依據 `${input:folder}` 資料夾內容，更新檔案索引／表格。

## 流程

1. **掃描**：讀取目標 markdown 文件 `${file}`，了解現有結構
2. **發現**：列出指定資料夾 `${input:folder}` 內符合 `${input:pattern}` 的所有檔案
3. **分析**：判斷是否已有索引／表格區段可更新，或需新增結構
4. **結構化**：根據檔案類型及現有內容，產生合適的表格／清單格式
5. **更新**：取代現有區段或新增索引區段
6. **驗證**：確保 markdown 語法正確且格式一致

## 檔案分析

每個發現的檔案需擷取：

- **名稱**：檔名（依情境可含副檔名）
- **類型**：副檔名及分類（如 .md、.js、.py）
- **描述**：首行註解、標題或推斷用途
- **大小**：檔案大小（選填）
- **修改日期**：最後修改日期（選填）

## 表格結構選項

依檔案類型及現有內容選擇格式：

### 選項 1：簡易清單

```markdown
## ${folder} 內檔案

- [filename.ext](path/to/filename.ext) - 描述
- [filename2.ext](path/to/filename2.ext) - 描述
```

### 選項 2：詳細表格

| 檔案                                   | 類型   | 描述 |
| -------------------------------------- | ------ | ---- |
| [filename.ext](path/to/filename.ext)   | 副檔名 | 描述 |
| [filename2.ext](path/to/filename2.ext) | 副檔名 | 描述 |

### 選項 3：分類區段

依類型／分類分組，分區段或子表格呈現。

## 更新策略

- 🔄 **更新現有**：如已有表格／索引區段，請取代內容並保留結構
- ➕ **新增**：如無現有區段，請新增最佳格式區段
- 📋 **保留**：維持現有 markdown 格式、標題層級及文件流程
- 🔗 **連結**：檔案連結請用倉庫內相對路徑

## 區段識別

請尋找下列模式的現有區段：

- 標題含「index」、「files」、「contents」、「directory」、「list」
- 含檔案相關欄位的表格
- 含檔案連結的清單
- 以 HTML 註解標記的檔案索引區段

## 需求

- 保留現有 markdown 結構與格式
- 檔案連結請用相對路徑
- 有描述時請納入
- 檔案預設依字母排序
- 處理檔名特殊字元
- 驗證所有 markdown 語法
