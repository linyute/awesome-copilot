---
agent: 'agent'
tools: ['githubRepo', 'github', 'get_me', 'get_pull_request', 'get_pull_request_comments', 'get_pull_request_diff', 'get_pull_request_files', 'get_pull_request_reviews', 'get_pull_request_status', 'list_pull_requests', 'request_copilot_review']
description: '列出目前儲存庫中屬於我的 pull request'
---

搜尋目前的儲存庫（使用 #githubRepo 取得儲存庫資訊），並列出所有指派給我的 pull request（使用 #list_pull_requests）。

描述每個 pull request 的目的與細節。

若有 PR 正在等待他人審查，請在回應中特別標示。

若 PR 有任何檢查失敗，請說明失敗原因並提出可能的修正建議。

若尚未由 Copilot 審查，請主動提供使用 #request_copilot_review 申請審查的選項。
