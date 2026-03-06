---
name: 'OSPO 貢獻者報告'
description: '組織儲存庫中的每月貢獻者活動指標。'
labels: ['ospo', 'reporting', 'contributors']
on:
  schedule:
    - cron: "3 2 1 * *"
  workflow_dispatch:
    inputs:
      organization:
        description: "要分析的 GitHub 組織 (例如 github)"
        required: false
        type: string
      repositories:
        description: "以逗號分隔的儲存庫列表 (例如 owner/repo1,owner/repo2)"
        required: false
        type: string
      start_date:
        description: "報告期間的開始日期 (YYYY-MM-DD)"
        required: false
        type: string
      end_date:
        description: "報告期間的結束日期 (YYYY-MM-DD)"
        required: false
        type: string
      sponsor_info:
        description: "包含貢獻者的 GitHub 贊助資訊"
        required: false
        type: boolean
        default: false

permissions:
  contents: read
  issues: read
  pull-requests: read

engine: copilot

tools:
  github:
    toolsets:
      - repos
      - issues
      - pull_requests
      - orgs
      - users
  bash: true

safe-outputs:
  create-issue:
    max: 1
    title-prefix: "[Contributors Report] "

timeout-minutes: 60
---

# 貢獻者報告

為指定的組織或儲存庫產生貢獻者報告。

## 步驟 1：驗證設定

檢查工作流輸入。必須提供 `organization` 或 `repositories` 其中之一。

- 如果**兩者皆為空**且這是**排程執行**，則預設分析目前儲存庫所屬組織中的所有公開儲存庫。從 `GITHUB_REPOSITORY` 環境變數（`/` 之前的部分）確定組織。
- 如果**兩者皆為空**且這是**手動觸發**，則失敗並顯示明確的錯誤訊息：「您必須提供組織或以逗號分隔的儲存庫列表。」
- 如果**兩者皆提供**，則優先使用 `repositories` 並忽略 `organization`。

## 步驟 2：確定日期範圍

- 如果提供了 `start_date` 和 `end_date`，請使用它們。
- 否則，預設為**上個日曆月**。例如，如果今天是 2025-03-15，範圍就是 2025-02-01 到 2025-02-28。
- 如果需要，請使用 bash 計算日期。將其儲存為 `START_DATE` 和 `END_DATE`。

## 步驟 3：列舉儲存庫

- 如果提供了 `repositories` 輸入，請將以逗號分隔的字串拆分為列表。每個項目應為 `owner/repo` 格式。
- 如果提供了 `organization` 輸入（或步驟 1 中的預設值），請使用 GitHub API 列出該組織中所有**公開、非封存、非分叉**的儲存庫。收集它們的 `owner/repo` 識別碼。

## 步驟 4：從 Commit 歷史記錄收集貢獻者

針對範圍內的每個儲存庫：

1. 使用 GitHub API 列出 `START_DATE` 和 `END_DATE` 之間的 Commit（在 commits 端點上使用 `since` 和 `until` 參數）。
2. 對於每個 Commit，擷取**作者登入名稱**（從 Commit 物件上的 `author.login` 擷取）。
3. **排除機器人帳戶**：跳過任何使用者名稱包含 `[bot]` 或其 `type` 欄位為 `"Bot"` 的貢獻者。
4. 追蹤每位貢獻者：
   - 所有儲存庫中的 Commit 總數。
   - 他們貢獻的儲存庫集合。

使用 bash 聚合並去重所有儲存庫中的貢獻者資料。

## 步驟 5：區分新貢獻者與回歸貢獻者

針對步驟 4 中找到的每位貢獻者，檢查他們在任何範圍內的儲存庫中，在 `START_DATE` 之前是否**有任何 Commit**。

- 如果貢獻者在 `START_DATE` 之前**沒有任何 Commit**，則將其標記為**新貢獻者**。
- 否則，將其標記為**回歸貢獻者**。

## 步驟 6：收集贊助資訊（選填）

如果 `sponsor_info` 輸入為 `true`：

1. 對於每位貢獻者，透過 GitHub API 查詢使用者個人檔案，檢查他們是否擁有 GitHub 贊助設定檔。
2. 如果使用者啟用了贊助，則記錄其贊助 URL 為 `https://github.com/sponsors/<username>`。
3. 如果沒有，則將贊助欄位留空。

## 步驟 7：產生 Markdown 報告

建構包含以下結構的 Markdown 報告：

### 摘要表

| 指標 | 數值 |
|---|---|
| 總貢獻者人數 | count |
| 總貢獻次數 (Commit) | count |
| 新貢獻者人數 | count |
| 回歸貢獻者人數 | count |
| % 新貢獻者百分比 | percentage |

### 貢獻者詳細資訊表

依 Commit 次數降序排序貢獻者。

| # | 使用者名稱 | 貢獻次數 | 新貢獻者 | 贊助 URL | Commit |
|---|---|---|---|---|---|
| 1 | @username | 42 | 是 | [贊助](url) | [檢視](commits-url) |

- **使用者名稱**欄位應連結到貢獻者的 GitHub 個人檔案。
- 如果 `sponsor_info` 為 false 或使用者沒有贊助頁面，則**贊助 URL** 欄位應顯示 "N/A"。
- **Commit** 欄位應連結到已篩選的 Commit 檢視畫面。

## 步驟 8：建立包含報告的 Issue

在**目前的儲存庫**中建立一個 Issue，內容如下：

- **標題：** `[Contributors Report] <ORG_OR_REPO_SCOPE> — START_DATE 到 END_DATE`
- **內容：** 步驟 7 中的完整 Markdown 報告。
- **標籤：** 如果存在 `contributors-report` 標籤，則加入該標籤；如果不存在則不失敗。
