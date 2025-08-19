---
mode: 'agent'
tools: ['githubRepo', 'github', 'get_issue', 'get_issue_comments', 'get_me', 'list_issues']
description: '列出目前儲存庫中屬於我的 issue'
---

搜尋目前的儲存庫（使用 #githubRepo 取得儲存庫資訊），並列出所有指派給我的 issue（使用 #list_issues）。

根據 issue 的建立時間、留言數量及狀態（開啟/關閉），建議我可以優先處理的 issue。
