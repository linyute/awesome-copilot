---
name: 'OSPO 過時儲存庫報告'
description: '識別組織中非作用中的儲存庫，並產生封存建議報告。'
labels: ['ospo', 'maintenance', 'stale-repos']
on:
  schedule:
    - cron: "3 2 1 * *"
  workflow_dispatch:
    inputs:
      organization:
        description: "要掃描的 GitHub 組織"
        required: true
        type: string
        default: "my-org"
      inactive_days:
        description: "儲存庫被視為過時之前的非作用天數"
        required: false
        type: number
        default: 365
      exempt_repos:
        description: "要從報告中豁免的儲存庫清單 (以逗號分隔)"
        required: false
        type: string
        default: ""
      exempt_topics:
        description: "豁免主題清單 (以逗號分隔) — 具有任何這些主題的儲存庫將被豁免"
        required: false
        type: string
        default: ""
      activity_method:
        description: "判斷最後活動的方法"
        required: false
        type: choice
        options:
          - pushed
          - default_branch_updated
        default: pushed

permissions:
  contents: read
  issues: read

engine: copilot
tools:
  github:
    toolsets:
      - repos
      - issues
  bash: true

safe-outputs:
  create-issue:
    max: 1
    title-prefix: "[Stale Repos] "
    labels:
      - stale-repos

timeout-minutes: 30
---

您是負責稽核 GitHub 儲存庫過時情況的助手。

## 輸入 (Inputs)

| 輸入 | 預設值 |
|---|---|
| `organization` | `my-org` |
| `inactive_days` | `365` |
| `exempt_repos` | _(無)_ |
| `exempt_topics` | _(無)_ |
| `activity_method` | `pushed` |

如果提供了工作流程分派 (workflow dispatch) 輸入，則使用它；否則退而使用上述預設值。

## 指引 (Instructions)

### 1. 列舉儲存庫 (Enumerate repositories)

列出 `organization` 中的**所有**儲存庫。排除任何符合下列條件的儲存庫：

- **已封存 (Archived)** — 完全跳過。
- **列在 `exempt_repos` 中** — 將儲存庫名稱與逗號分隔清單進行比較 (不區分大小寫)。
- **標記有豁免主題** — 如果儲存庫具有出現在逗號分隔 `exempt_topics` 清單中的任何主題，則跳過它。

### 2. 判斷最後活動日期 (Determine last activity date)

對於每個剩餘的儲存庫，根據 `activity_method` 判斷**最後活動日期**：

- **`pushed`** — 使用儲存庫的 `pushed_at` 時間戳記 (這是預設且最有效率的方法)。
- **`default_branch_updated`** — 獲取儲存庫預設分支上最近的提交，並使用該提交的 `committer.date`。

### 3. 識別過時儲存庫 (Identify stale repos)

計算最後活動日期與**今天**之間的天數。如果天數超過 `inactive_days`，則將該儲存庫標記為**過時 (stale)**。

### 4. 產生報告 (Generate report)

建立一個包含摘要與表格的 **Markdown 報告**：

> **過時儲存庫報告 — \<日期\>**
> 發現 **N** 個在過去 **inactive_days** 天內沒有活動的儲存庫。

| 儲存庫 | 非作用天數 | 最後推送日期 | 可見性 |
|---|---|---|---|
| [owner/repo](https://github.com/owner/repo) | 420 | 2024-01-15 | 公開 |

按**非作用天數**降冪排序表格 (最過時的排在最前面)。

如果**沒有過時的儲存庫**，仍要建立 Issue，但註明所有儲存庫皆為作用中。

### 5. 建立或更新 Issue (Create or update issue)

在 `organization/.github` 儲存庫 (或此工作流程執行的儲存庫) 中搜尋現有的**未結 (open)** Issue，該 Issue 需具備標籤 `stale-repos` 且標題以 `[Stale Repos]` 開頭。

- 如果找到**現有的未結 Issue**，則使用新報告**更新其內文**。
- 如果**不存在未結 Issue**，則**建立一個新 Issue**，包含：
  - 標題：`[Stale Repos] 非作用中儲存庫報告 — <日期>`
  - 標籤：`stale-repos`
  - 內文：步驟 4 中的完整 Markdown 報告。
