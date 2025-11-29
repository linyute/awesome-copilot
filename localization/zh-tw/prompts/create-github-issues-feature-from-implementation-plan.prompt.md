---
mode: 'agent'
description: '根據實作計畫的各階段，使用 feature_request.yml 或 chore_request.yml 樣板建立 GitHub Issue。'
tools: ['search/codebase', 'search', 'github', 'create_issue', 'search_issues', 'update_issue']
---

# 根據實作計畫建立 GitHub Issue

針對 `${file}` 的實作計畫建立 GitHub Issue。

## 流程

1. 分析計畫文件以識別各階段
2. 使用 `search_issues` 檢查現有 Issue
3. 每個階段分別使用 `create_issue` 建立新 Issue，或用 `update_issue` 更新現有 Issue
4. 使用 `feature_request.yml` 或 `chore_request.yml` 樣板（若無則使用預設樣板）

## 需求

- 每個實作階段建立一個 Issue
- 標題與說明需清楚且有結構
- 僅包含計畫要求的變更
- 建立前需先檢查現有 Issue

## Issue 內容

- 標題：來自實作計畫的階段名稱
- 說明：階段細節、需求與背景
- 標籤：依 Issue 類型（feature/chore）適當加入
