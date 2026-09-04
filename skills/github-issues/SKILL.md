---
name: github-issues
description: '使用 MCP 工具建立、更新與管理 GitHub Issue。當使用者想要建立錯誤報告、功能請求或工作 Issue、更新既有 Issue、新增標籤/指派對象/里程碑、管理儲存庫標籤、設定 Issue 欄位（日期、優先順序、自訂欄位）、設定 Issue 類型、管理 Issue 工作流程、連結 Issue、新增相依性或追蹤阻礙中 (blocked-by)/阻礙其他項目 (blocking) 關聯時使用此技能。可由 "create an issue"、"file a bug"、"request a feature"、"update issue X"、"set the priority"、"set the start date"、"create a label"、"rename a label"、"list repo labels"、"link issues"、"add dependency"、"blocked by"、"blocking" 或任何 GitHub Issue 管理任務等請求觸發。'
---

# GitHub Issues

使用 `@modelcontextprotocol/server-github` MCP 伺服器管理 GitHub Issue。

## 可用工具

### MCP 工具（讀取操作）

| 工具 | 用途 |
|------|---------|
| `mcp__github__issue_read` | 讀取 Issue 詳細資料、子 Issue、留言、標籤（方法：get、get_comments、get_sub_issues、get_labels） |
| `mcp__github__list_issues` | 依狀態、標籤、日期列出並篩選儲存庫 Issue |
| `mcp__github__search_issues` | 使用 GitHub 搜尋語法跨儲存庫搜尋 Issue |
| `mcp__github__projects_list` | 列出專案、專案欄位、專案項目、狀態更新 |
| `mcp__github__projects_get` | 取得專案、欄位、項目或狀態更新的詳細資料 |
| `mcp__github__projects_write` | 新增/更新/刪除專案項目、建立狀態更新 |

### MCP 工具（寫入操作）

| 工具 | 用途 |
|------|---------|
| `mcp__github__issue_write` | 建立或更新 Issue（方法：create、update）。支援標題、內文、類型、標籤、指派對象、里程碑與 Issue 欄位 |
| `mcp__github__add_issue_comment` | 對 Issue 新增留言或反應 (reaction) |
| `mcp__github__sub_issue_write` | 新增、移除或重新排定子 Issue 優先順序 |

### CLI / REST API（寫入操作）

`gh api` 執行相同的寫入操作，也是以下範例所使用的形式。當 MCP 伺服器未連線，或需要 MCP 工具未公開的 REST 欄位時，請使用此方式。

| 操作 | 命令 |
|-----------|---------|
| 建立 Issue | `gh api repos/{owner}/{repo}/issues -X POST -f title=... -f body=...` |
| 更新 Issue | `gh api repos/{owner}/{repo}/issues/{number} -X PATCH -f title=... -f state=...` |
| 新增留言 | `gh api repos/{owner}/{repo}/issues/{number}/comments -X POST -f body=...` |
| 關閉 Issue | `gh api repos/{owner}/{repo}/issues/{number} -X PATCH -f state=closed` |
| 設定 Issue 類型 | 在建立呼叫中加入 `-f type=Bug`（僅限 REST API，`gh issue create` CLI 不支援） |

**注意：** `gh issue create` 適用於基本的 Issue 建立，但**不**支援 `--type` 旗標。當你需要設定 Issue 類型時，請使用 `gh api`。

## 工作流程

1. **確定操作**：建立、更新還是查詢？
2. **收集上下文**：取得儲存庫資訊、現有標籤、里程碑（若需要）
3. **結構化內容**：使用來自 [references/templates.md](references/templates.md) 的適當範本
4. **執行**：讀取使用 MCP 工具，寫入使用 `gh api`
5. **確認**：回報 Issue URL 給使用者

## 建立 Issue

使用 `gh api` 建立 Issue。此方式支援包括 Issue 類型在內的所有參數。

```bash
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f title="Issue title" \
  -f body="Issue body in markdown" \
  -f type="Bug" \
  --jq '{number, html_url}'
```

### 選用參數

將以下任何旗標加入 `gh api` 呼叫中：

```
-f type="Bug"                    # Issue 類型 (Bug, Feature, Task, Epic 等)
-f 'labels[]=bug'                # 標籤 (多個標籤請重複指定)
-f 'assignees[]=username'        # 指派對象 (多個對象請重複指定)
-f milestone=1                   # 里程碑編號
```

**請將整個 `name[]=value` 鍵值對用引號括起來。** `[]` 是 macOS 預設 shell (zsh) 中的 glob 模式，
因此未加引號的 `-f labels[]=bug` 永遠無法傳遞至 `gh`：

```
zsh: no matches found: labels[]=bug
```

**Issue 類型** 屬於組織層級的 Metadata。若要探索可用的類型，請使用：
```bash
gh api graphql -f query='{ organization(login: "ORG") { issueTypes(first: 10) { nodes { name } } } }' --jq '.data.organization.issueTypes.nodes[].name'
```

**優先使用 Issue 類型而非標籤進行分類。** 當 Issue 類型可用時（例如：Bug、Feature、Task），請使用 `type` 參數，而非套用如 `bug` 或 `enhancement` 等同等標籤。Issue 類型是 GitHub 上對 Issue 進行分類的標準正式方式。僅在組織未設定 Issue 類型時，才退回使用標籤。

### 標題指引

- 具體且可據以採取行動
- 保持在 72 個字元以內
- 當已設定 Issue 類型時，不要加入重複的前綴（如 `[Bug]`）
- 範例：
  - `Login fails with SSO enabled`（搭配 type=Bug）
  - `Add dark mode support`（搭配 type=Feature）
  - `Add unit tests for auth module`（搭配 type=Task）

### 內文結構

一律使用 [references/templates.md](references/templates.md) 中的範本。根據 Issue 類型進行選擇：

| 使用者請求 | 範本 |
|--------------|----------|
| Bug、錯誤、損壞、無法運作 | Bug Report |
| 功能、強化、新增、新項目 | Feature Request |
| 任務、雜務、重構、更新 | Task |

## 更新 Issue

使用 `gh api` 搭配 PATCH：

```bash
gh api repos/{owner}/{repo}/issues/{number} \
  -X PATCH \
  -f state=closed \
  -f title="Updated title" \
  --jq '{number, html_url}'
```

僅包含你想要變更的欄位。可用欄位：`title`、`body`、`state`（open/closed）、`labels`、`assignees`、`milestone`。

## 範例

### 範例 1：錯誤報告 (Bug Report)

**使用者**："Create a bug issue - the login page crashes when using SSO"

**操作**：
```bash
gh api repos/github/awesome-copilot/issues \
  -X POST \
  -f title="Login page crashes when using SSO" \
  -f type="Bug" \
  -f body="## Description
The login page crashes when users attempt to authenticate using SSO.

## Steps to Reproduce
1. Navigate to login page
2. Click 'Sign in with SSO'
3. Page crashes

## Expected Behavior
SSO authentication should complete and redirect to dashboard.

## Actual Behavior
Page becomes unresponsive and displays error." \
  --jq '{number, html_url}'
```

### 範例 2：功能請求 (Feature Request)

**使用者**："Create a feature request for dark mode with high priority"

**操作**：
```bash
gh api repos/github/awesome-copilot/issues \
  -X POST \
  -f title="Add dark mode support" \
  -f type="Feature" \
  -f 'labels[]=high-priority' \
  -f body="## Summary
Add dark mode theme option for improved user experience and accessibility.

## Motivation
- Reduces eye strain in low-light environments
- Increasingly expected by users

## Proposed Solution
Implement theme toggle with system preference detection.

## Acceptance Criteria
- [ ] Toggle switch in settings
- [ ] Persists user preference
- [ ] Respects system preference by default" \
  --jq '{number, html_url}'
```

## 常見標籤

在適用時使用這些標準標籤：

| 標籤 | 用於 |
|-------|---------|
| `bug` | 某些功能無法正常運作 |
| `enhancement` | 新功能或改進 |
| `documentation` | 文件更新 |
| `good first issue` | 適合新手 |
| `help wanted` | 需要額外關注或協助 |
| `question` | 需要進一步資訊 |
| `wontfix` | 將不予處理 |
| `duplicate` | 已存在重複項目 |
| `high-priority` | 緊急 Issue |

## 秘訣

- 在建立 Issue 之前一律確認儲存庫上下文
- 詢問缺失的關鍵資訊，而不是盲目猜測
- 若已知相關 Issue，請予以連結：`Related to #123`
- 更新時，先擷取目前的 Issue 以保留未變更的欄位

## 擴充功能

以下功能需要超出基本 MCP 工具的 REST 或 GraphQL API。各項功能皆記錄在其專屬參考檔案中，以便代理人僅載入所需的知識。

| 功能 | 何時使用 | 參考資料 |
|------------|-------------|-----------|
| 進階搜尋 | 具有布林邏輯、日期範圍、跨儲存庫搜尋、Issue 欄位篩選條件 (`field.name:value`) 的複雜查詢 | [references/search.md](references/search.md) |
| 子 Issue 與父 Issue | 將工作拆解為階層式任務 | [references/sub-issues.md](references/sub-issues.md) |
| 里程碑 | 建立、讀取、更新、關閉、重新開啟、刪除里程碑，以及管理里程碑 Issue | [references/milestones.md](references/milestones.md) |
| 標籤 | 探索、建立、重新命名、變更色彩與刪除儲存庫標籤；在 Issue 上新增或取代標籤 | [references/labels.md](references/labels.md) |
| Issue 相依性 | 追蹤阻礙中 (blocked-by) / 阻礙其他項目 (blocking) 關聯 | [references/dependencies.md](references/dependencies.md) |
| Issue 類型（進階） | 超出 MCP `list_issue_types` / `type` 參數的 GraphQL 操作 | [references/issue-types.md](references/issue-types.md) |
| Projects V2 | 專案看板、進度報告、欄位管理 | [references/projects.md](references/projects.md) |
| Issue 欄位 | 自訂 Metadata：日期、優先順序、文字、數字（私人預覽） | [references/issue-fields.md](references/issue-fields.md) |
| Issue 中的圖片 | 透過 CLI 在 Issue 內文與留言中嵌入圖片 | [references/images.md](references/images.md) |
