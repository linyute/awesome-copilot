---
agent: 'agent'
description: '針對規格文件中尚未實作的需求，使用 feature_request.yml 樣板建立 GitHub Issue。'
tools: ['search/codebase', 'search', 'github', 'create_issue', 'search_issues', 'update_issue']
---

# 為未達成規格需求建立 GitHub Issue

針對 `${file}` 規格文件中尚未實作的需求建立 GitHub Issue。

## 流程

1. 分析規格文件以萃取所有需求
2. 檢查每項需求在程式碼庫中的實作狀態
3. 使用 `search_issues` 搜尋現有 Issue，避免重複
4. 每個未實作需求分別使用 `create_issue` 建立新 Issue
5. 使用 `feature_request.yml` 樣板（若無則使用預設樣板）

## 需求

- 每個未實作的規格需求建立一個 Issue
- 明確標示需求 ID 與說明
- 包含實作指引與驗收標準
- 建立前需先檢查現有 Issue

## Issue 內容

- 標題：需求 ID 與簡要說明
- 說明：詳細需求、實作方式與背景
- 標籤：feature、enhancement（視情況加入）

## 實作檢查

- 搜尋程式碼庫相關程式碼模式
- 檢查 `/spec/` 目錄下相關規格文件
- 確認需求未被部分實作
