---
description: '建立和管理 awesome-copilot 集合的準則'
applyTo: 'collections/*.collection.yml'
---

# 集合開發

## 集合說明

在 awesome-copilot 儲存庫中使用集合時：

- 在提交之前，務必使用 `node validate-collections.js` 驗證集合
- 遵循已建立的 YAML 集合清單架構
- 僅參考儲存庫中現有的檔案
- 使用小寫字母、數字和連字號的描述性集合 ID
- 讓集合專注於特定的工作流程或主題
- 測試所有參考的項目是否能良好協同運作

## 集合結構

- **必填欄位**：id、name、description、items
- **選填欄位**：tags、display
- **項目要求**：path 必須存在，kind 必須符合檔案副檔名
- **顯示選項**：ordering (alpha/manual)、show_badge (true/false)

## 驗證規則

- 集合 ID 在所有集合中必須是唯一的
- 檔案路徑必須存在並符合項目類型
- 標籤只能使用小寫字母、數字和連字號
- 集合必須包含 1-50 個項目
- 描述必須是 1-500 個字元

## 最佳實踐

- 將 3-10 個相關項目分組以獲得最佳可用性
- 使用清晰、描述性的名稱和描述
- 添加相關標籤以提高可發現性
- 測試集合啟用的完整工作流程
- 確保項目有效互補

## 檔案組織

- 集合不需要檔案重組
- 項目可以位於儲存庫中的任何位置
- 使用從儲存庫根目錄開始的相對路徑
- 維護現有的目錄結構 (prompts/, instructions/, agents/)

## 生成過程

- 集合會透過 `npm start` 自動生成 README 檔案
- 個別集合頁面會在 collections/ 目錄中建立
- 主要集合概觀會生成為 README.collections.md
- 每個項目都會自動建立 VS Code 安裝徽章
