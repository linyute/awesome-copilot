---
mode: 'agent'
description: '使用 pull_request_template.md 範本從規範檔案為功能請求建立 GitHub Pull Request。'
tools: ['search/codebase', 'search', 'github', 'create_pull_request', 'update_pull_request', 'get_pull_request_diff']
---

# 從規範建立 GitHub Pull Request

為 `${workspaceFolder}/.github/pull_request_template.md` 的規範建立 GitHub Pull Request。

## 流程

1. 從 '${workspaceFolder}/.github/pull_request_template.md' 分析規範檔案範本，使用 'search' 工具提取需求。
2. 使用 'create_pull_request' 工具在 `${input:targetBranch}` 上建立拉取請求草稿範本。並確保當前分支沒有任何現有的拉取請求 `get_pull_request`。如果存在，則繼續步驟 4，並跳過步驟 3。
3. 使用 'get_pull_request_diff' 工具獲取拉取請求中的更改，以分析拉取請求中更改的資訊。
4. 使用 'update_pull_request' 工具更新上一步中建立的拉取請求主體和標題。整合從第一步獲得的範本資訊，根據需要更新主體和標題。
5. 使用 'update_pull_request' 工具將草稿切換為準備好審查。以更新拉取請求的狀態。
6. 使用 'get_me' 獲取建立拉取請求的人的使用者名，並分配給 `update_issue` 工具。以分配拉取請求。
7. 回應 URL 拉取請求已建立給使用者。

## 要求
- 針對完整規範的單一拉取請求
- 清晰的標題/pull_request_template.md 識別規範
- 在 pull_request_template.md 中填寫足夠的資訊
- 在建立前驗證現有的拉取請求
