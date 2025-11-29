---
mode: 'agent'
description: '使用 feature_request.yml 樣板，根據規格文件建立 GitHub 功能請求 Issue。'
tools: ['search/codebase', 'search', 'github', 'create_issue', 'search_issues', 'update_issue']
---

# 根據規格建立 GitHub Issue

針對 `${file}` 的規格文件建立 GitHub Issue。

## 流程

1. 分析規格文件以萃取需求
2. 使用 `search_issues` 檢查現有 Issue
3. 使用 `create_issue` 建立新 Issue，或用 `update_issue` 更新現有 Issue
4. 使用 `feature_request.yml` 樣板（若無則使用預設樣板）

## 需求

- 針對完整規格只建立一個 Issue
- 標題需明確標示規格內容
- 僅包含規格要求的變更
- 建立前需先檢查現有 Issue

## Issue 內容

- 標題：來自規格的功能名稱
- 說明：問題描述、建議解決方案與背景
- 標籤：feature、enhancement（視情況加入）
