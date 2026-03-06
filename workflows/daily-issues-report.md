---
name: "每日 Issue 報告"
description: "產生每日未解決 Issue 與近期活動的摘要，並以 GitHub Issue 形式呈現"
on:
  schedule: daily on weekdays
permissions:
  contents: read
  issues: read
safe-outputs:
  create-issue:
    title-prefix: "[daily-report] "
    labels: [report]
---

## 每日 Issue 報告

為團隊建立一份每日未解決 Issue 的摘要。

## 包含內容

- 過去 24 小時內新建立的 Issue
- 已關閉或已解決的 Issue
- 需要關注的過期 Issue
