---
description: '智慧型 README.md 產生提示，分析專案文件結構並建立完整的儲存庫說明文件。會掃描 .github/copilot 目錄下的檔案及 copilot-instructions.md，萃取專案資訊、技術堆疊、架構、開發流程、程式標準與測試方法，並產生結構良好、格式正確、具交叉參照且以開發者為主的 Markdown 文件。'
agent: 'agent'
---

# README 產生器提示

請依下列步驟，分析 .github/copilot 目錄下的文件及 copilot-instructions.md 檔案，為本儲存庫產生完整的 README.md：

1. 掃描 .github/copilot 資料夾內所有檔案，例如：
   - Architecture
   - Code_Exemplars
   - Coding_Standards
   - Project_Folder_Structure
   - Technology_Stack
   - Unit_Tests
   - Workflow_Analysis

2. 同時檢閱 .github 資料夾內的 copilot-instructions.md 檔案

3. 建立 README.md，包含以下章節：

## 專案名稱與描述
- 從文件中萃取專案名稱與主要目的
- 包含簡明描述專案功能

## 技術堆疊
- 列出主要技術、語言與框架
- 有版本資訊時一併列出
- 主要來源為 Technology_Stack 檔案

## 專案架構
- 提供高層次架構概述
- 若文件有描述可附上簡易圖示
- 主要來源為 Architecture 檔案

## 快速開始
- 根據技術堆疊提供安裝說明
- 加入設定與配置步驟
- 包含任何前置需求

## 專案結構
- 簡要說明資料夾組織
- 主要來源為 Project_Folder_Structure 檔案

## 主要功能
- 列出專案主要功能與特色
- 從各文件萃取

## 開發流程
- 摘要開發流程
- 若有分支策略一併說明
- 主要來源為 Workflow_Analysis 檔案

## 程式標準
- 摘要主要程式標準與慣例
- 主要來源為 Coding_Standards 檔案

## 測試
- 說明測試方法與工具
- 主要來源為 Unit_Tests 檔案

## 貢獻指南
- 專案貢獻規範
- 參考 Code_Exemplars 與 copilot-instructions

## 授權
- 若有授權資訊請一併列出

README 格式請遵循 Markdown 標準，包含：
- 清楚的標題與子標題
- 適當的程式碼區塊
- 以清單提升可讀性
- 連結至其他文件
- 若有建置狀態、版本等資訊可加上徽章

請保持 README 簡明且具資訊性，聚焦於新開發者或使用者需要了解的專案重點。
