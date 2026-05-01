---
name: pr-dashboard
description: '在瀏覽器中開啟 GitHub PR 儀表板。當使用者要求查看其提取要求 (pull requests)、開啟 PR 儀表板、顯示特定日期範圍的 PR 或檢查 PR 狀態時使用。觸發詞包含 "show my PRs"、"open PR dashboard"、"pull request dashboard"。'
---

# PR 儀表板 (PR Dashboard)

針對指定的日期範圍和角色篩選器，在瀏覽器中產生並開啟 GitHub PR 儀表板。

**前提條件：** 必須安裝 GitHub CLI (`gh`) 並通過身分驗證 (`gh auth login`)。

## 執行步驟

找到此技能隨附的 CLI 指令碼並執行：

```bash
SKILL_SCRIPT=$(find ~/.copilot -name "pr-dashboard-cli.mjs" -path "*/pr-dashboard/scripts/*" 2>/dev/null | head -1)
node "$SKILL_SCRIPT" "<查詢>" "<角色>"
```

- `<查詢>`：使用者指定的日期範圍 (預設：`最近 7 天`)
- `<角色>`：`Authored by me` (我撰寫的), `Requested reviews` (要求檢閱), `Assigned to me` (指派給我), `All` (全部) 之一 (預設：`Authored by me`)

## 解析使用者請求

從使用者的訊息中提取日期範圍和角色。範例：

| 使用者說 | 查詢 (query) | 角色 (role) |
|---|---|---|
| 顯示我的 PR | `最近 7 天` | `Authored by me` |
| 顯示我最近 2 週的 PR | `最近 2 週` | `Authored by me` |
| 這位月的 PR 檢閱儀表板 | `本月` | `Requested reviews` |
| 2026 年 3 月指派給我的 PR 儀表板 | `2026 年 3 月` | `Assigned to me` |
| 顯示最近 30 天內所有的 PR | `最近 30 天` | `All` |

**角色關鍵字映射：**
- "my PRs" (我的 PR), "authored" (我撰寫的), "I wrote" (我寫的) → `Authored by me`
- "reviews" (檢閱), "review requested" (要求檢閱), "reviewing" (正在檢閱) → `Requested reviews`
- "assigned" (已指派) → `Assigned to me`
- "all" (全部), "involves me" (與我有關) → `All`

## 支援的日期範圍格式

指令碼可理解自然語言 — 請直接傳遞：
- `最近 7 天`, `最近 2 週`, `最近 30 天`
- `本週`, `上週`, `本月`, `上個月`
- `2026 年 3 月`, `2025 年 2 月`
- `2026-01-01 - 2026-03-31`
- `2025` (整年)

## 執行之後

告知使用者儀表板正在瀏覽器中開啟。指令碼會將進度輸出到 stdout。如果執行結束時發生錯誤，請顯示錯誤輸出；如果是身分驗證問題，請建議其執行 `gh auth login`。
